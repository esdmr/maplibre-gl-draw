import type * as G from 'geojson';
import toDenseArray from './lib/to_dense_array.js';
import StringSet from './lib/string_set.js';
import render from './render.js';
import * as Constants from './constants.js';
import type { MaplibreDrawContext } from './context.js';
import type Feature from './feature_types/feature.js';

export default class Store<T extends Record<string, {}>> {
  ctx;
  _features: Record<string, Feature> = {};
  _featureIds = new StringSet();
  _selectedFeatureIds = new StringSet();
  _selectedCoordinates: ({coord_path: string, feature_id: string})[] = [];
  _changedFeatureIds = new StringSet();
  _emitSelectionChange = false;
  _mapInitialConfig: Partial<Record<typeof Constants.interactions[number], boolean>> = {};
  isDirty = false;

  sources: Record<'hot' | 'cold', G.Feature[]> = {
    hot: [],
    cold: []
  };

  // Deduplicate requests to render and tie them to animation frames.
  _renderRequest: ReturnType<typeof requestAnimationFrame> | undefined;

  constructor(ctx: MaplibreDrawContext<T>) {
    this.ctx = ctx;
  }

  render () {
    if (!this._renderRequest) {
      this._renderRequest = requestAnimationFrame(() => {
        this._renderRequest = undefined;
        render(this);

        // Fire deduplicated selection change event
        if (this._emitSelectionChange) {
          this.ctx.eventsOrThrow.fire(Constants.events.SELECTION_CHANGE, {
            features: this.getSelected().map(feature => feature.toGeoJSON()),
            points: this.getSelectedCoordinates().map((coordinates) => ({
              type: Constants.geojsonTypes.FEATURE,
              properties: {},

              geometry: {
                type: Constants.geojsonTypes.POINT,
                coordinates
              }
            }))
          });

          this._emitSelectionChange = false;
        }

        // Fire render event
        this.ctx.eventsOrThrow.fire(Constants.events.RENDER, {});
      });
    }
  }

  /**
   * Delays all rendering until the returned function is invoked
   */
  createRenderBatch(): () => void {
    let numRenders = 0;
    // FIXME: no.
    this.render = () => {
      numRenders++;
    };

    return () => {
      this.render = Store.prototype.render;
      if (numRenders > 0) {
        this.render();
      }
    };
  }

  /**
   * Sets the store's state to dirty.
   */
  setDirty() {
    this.isDirty = true;
    return this;
  }

  /**
   * Sets a feature's state to changed.
   */
  featureCreated(featureId: string | number, {silent = this.ctx.options.suppressAPIEvents}: {silent?: boolean} = {}) {
    this._changedFeatureIds.add(featureId);

    const feature = this.get(featureId);

    if (silent !== true && feature) {
      this.ctx.eventsOrThrow.fire(Constants.events.CREATE, {
        features: [feature.toGeoJSON()]
      });
    }

    return this;
  }

  /**
   * Sets a feature's state to changed.
   */
  featureChanged(featureId: string | number, {
    silent = this.ctx.options.suppressAPIEvents,
    action = Constants.updateActions.CHANGE_COORDINATES
  }: {
    silent?: boolean,
    action?: typeof Constants.updateActions[keyof typeof Constants.updateActions]
  } = {}) {
    this._changedFeatureIds.add(featureId);

    const feature = this.get(featureId);

    if (silent !== true && feature) {
      this.ctx.eventsOrThrow.fire(Constants.events.UPDATE, {
        action,
        features: [feature.toGeoJSON()]
      });
    }

    return this;
  }

  /**
   * Gets the ids of all features currently in changed state.
   */
  getChangedIds() {
    return this._changedFeatureIds.values();
  }

  /**
   * Sets all features to unchanged state.
   */
  clearChangedIds() {
    this._changedFeatureIds.clear();
    return this;
  }

  /**
   * Gets the ids of all features in the store.
   */
  getAllIds() {
    return this._featureIds.values();
  }

  /**
   * Adds a feature to the store.
   */
  add(feature: Feature, {silent}: {silent?: boolean} = {}) {
    this._features[feature.id] = feature;
    this._featureIds.add(feature.id);
    this.featureCreated(feature.id, {silent});
    return this;
  }

  /**
   * Deletes a feature or array of features from the store.
   * Cleans up after the deletion by deselecting the features.
   * If changes were made, sets the state to the dirty
   * and fires an event.
   */
  delete(featureIds: string | number | Array<string | number>, {silent}: {silent?: boolean} = {}) {
    const deletedFeaturesToEmit: G.Feature[] = [];

    toDenseArray(featureIds).forEach((id) => {
      if (!this._featureIds.has(id)) return;

      this._featureIds.delete(id);
      this._selectedFeatureIds.delete(id);

      if (!silent && !deletedFeaturesToEmit.find(i => i.id === id)) {
        deletedFeaturesToEmit.push(this._features[id].toGeoJSON());
      }

      delete this._features[id];
      this.isDirty = true;
    });

    if (deletedFeaturesToEmit.length) {
      this.ctx.eventsOrThrow.fire(Constants.events.DELETE, {features: deletedFeaturesToEmit});
    }

    this._refreshSelectedCoordinates({ silent });
    return this;
  }

  /**
   * Returns a feature in the store matching the specified value.
   */
  get(id: string | number): Feature | undefined {
    return this._features[id];
  }

  /**
   * Returns all features in the store.
   */
  getAll(): Array<Feature> {
    return Object.values(this._features);
  }

  /**
   * Adds features to the current selection.
   */
  select(featureIds: string | number | Array<string | number>, {silent}: {silent?: boolean} = {}) {
    toDenseArray(featureIds).forEach((id) => {
      if (this._selectedFeatureIds.has(id)) return;
      this._selectedFeatureIds.add(id);
      this._changedFeatureIds.add(id);
      if (!silent) {
        this._emitSelectionChange = true;
      }
    });
    return this;
  }

  /**
   * Deletes features from the current selection.
   */
  deselect(featureIds: string | number | Array<string | number>, {silent}: {silent?: boolean} = {}) {
    toDenseArray(featureIds).forEach((id) => {
      if (!this._selectedFeatureIds.has(id)) return;
      this._selectedFeatureIds.delete(id);
      this._changedFeatureIds.add(id);
      if (!silent) {
        this._emitSelectionChange = true;
      }
    });
    this._refreshSelectedCoordinates({ silent });
    return this;
  }

  /**
   * Clears the current selection.
   */
  clearSelected({silent}: {silent?: boolean} = {}) {
    this.deselect(this._selectedFeatureIds.values(), { silent });
    return this;
  }

  /**
   * Sets the store's selection, clearing any prior values.
   * If no feature ids are passed, the store is just cleared.
   */
  setSelected(featureIds?: string | number | (string | number)[], {silent}: {silent?: boolean} = {}) {
    featureIds = toDenseArray(featureIds);

    // Deselect any features not in the new selection
    this.deselect(this._selectedFeatureIds.values().filter(id => !featureIds.includes(id)), { silent });

    // Select any features in the new selection that were not already selected
    this.select(featureIds.filter(id => !this._selectedFeatureIds.has(id)), { silent });

    return this;
  }

  /**
   * Sets the store's coordinates selection, clearing any prior values.
   */
  setSelectedCoordinates(coordinates: Array<{coord_path: string, feature_id: string}>) {
    this._selectedCoordinates = coordinates;
    this._emitSelectionChange = true;
    return this;
  }

  /**
   * Clears the current coordinates selection.
   */
  clearSelectedCoordinates() {
    this._selectedCoordinates = [];
    this._emitSelectionChange = true;
    return this;
  }

  /**
   * Returns the ids of features in the current selection.
   */
  getSelectedIds(): Array<string | number> {
    return this._selectedFeatureIds.values();
  }

  /**
   * Returns features in the current selection.
   */
  getSelected(): Array<Feature> {
    return this.getSelectedIds()
      .map(id => this.get(id))
      .filter(i => i !== undefined);
  }

  /**
   * Returns selected coordinates in the currently selected feature.
   */
  getSelectedCoordinates(): Array<G.Position> {
    return this._selectedCoordinates.map(({feature_id, coord_path}) => {
      const feature = this.get(feature_id);
      return feature?.getCoordinate(coord_path);
    }).filter(i => i !== undefined);
  }

  /**
   * Indicates whether a feature is selected.
   */
  isSelected(featureId: string | number): boolean {
    return this._selectedFeatureIds.has(featureId);
  }

  /**
   * Sets a property on the given feature
  */
  setFeatureProperty(featureId: string | number, property: string, value: unknown, {silent}: {silent?: boolean} = {}) {
    const feature = this.get(featureId);

    if (!feature) {
      console.warn('maplibre-gl-draw setFeatureProperty called on unknown featureId. Ignoring.');
      return;
    }

    feature.setProperty(property, value);

    this.featureChanged(featureId, {
      silent,
      action: Constants.updateActions.CHANGE_PROPERTIES
    });
  }

  /**
   * Stores the initial config for a map, so that we can set it again after we're done.
   */
  storeMapConfig() {
    Constants.interactions.forEach((interaction) => {
      const interactionSet = this.ctx.mapOrThrow[interaction];
      if (interactionSet) {
        this._mapInitialConfig[interaction] = this.ctx.mapOrThrow[interaction].isEnabled();
      }
    });
  }

  /**
   * Restores the initial config for a map, ensuring all is well.
  */
  restoreMapConfig() {
    (Object.keys(this._mapInitialConfig) as Array<typeof Constants.interactions[number]>).forEach((key) => {
      const value = this._mapInitialConfig[key];
      if (value) {
        this.ctx.mapOrThrow[key].enable();
      } else {
        this.ctx.mapOrThrow[key].disable();
      }
    });
  }

  /**
   * Returns the initial state of an interaction setting.
  */
  getInitialConfigValue(interaction: typeof Constants.interactions[number]): boolean {
    if (this._mapInitialConfig[interaction] !== undefined) {
      return this._mapInitialConfig[interaction];
    } else {
      // This needs to be set to whatever the default is for that interaction
      // It seems to be true for all cases currently, so let's send back `true`.
      return true;
    }
  }

  private _refreshSelectedCoordinates({silent}: {silent?: boolean} = {}) {
    const newSelectedCoordinates = this._selectedCoordinates.filter(({feature_id}) => this._selectedFeatureIds.has(feature_id));
    if (this._selectedCoordinates.length !== newSelectedCoordinates.length && !silent) {
      this._emitSelectionChange = true;
    }
    this._selectedCoordinates = newSelectedCoordinates;
  }
}
