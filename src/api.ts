import normalize from '@mapbox/geojson-normalize';
import isEqual from 'fast-deep-equal';
import * as Constants from './constants.ts';
import { featuresAtClick } from './lib/features_at.ts';
import { generateID } from './lib/id.ts';
import StringSet from './lib/string_set.ts';
import stringSetsAreEqual from './lib/string_sets_are_equal.ts';

import type * as G from 'geojson';
import type { IControl, Map } from 'maplibre-gl';
import { MaplibreDrawContext } from './context.ts';
import type Feature from './feature_types/feature.ts';
import { featureTypes } from './feature_types/index.ts';
import Setup from './setup.ts';
import mapEventToBoundingBox from './lib/map_event_to_bounding_box.ts';

export default class MaplibreDrawApi<T extends Record<string, {}>> implements IControl {
  ctx;

  get options() {
    return this.ctx.options;
  }

  get silent() {
    return this.ctx.options.suppressAPIEvents;
  }

  constructor(ctx: MaplibreDrawContext<T>) {
    this.ctx = ctx;
  }

  onAdd(map: Map): HTMLElement {
    if (this.ctx.setup) {
      throw new Error('MaplibreDrawApi.onAdd was called, but this instance is already set up');
    }

    this.ctx.setup = new Setup(this.ctx, map);
    return this.ctx.controlContainer;
  }

  onRemove() {
    this.ctx.setup?.dispose();
  }

  getFeatureIdsAt(point: {x: number, y: number}) {
    const features = featuresAtClick(undefined, mapEventToBoundingBox({ point }), this.ctx);
    return features.map(({properties}) => properties?.id).filter(i => i !== undefined) as string[];
  }

  getSelectedIds() {
    return this.ctx.store.getSelectedIds();
  }

  getSelected() {
    return {
      type: Constants.geojsonTypes.FEATURE_COLLECTION,
      features: this.ctx.store.getSelectedIds().map(id => this.ctx.store.get(id)).filter(i => i !== undefined).map(feature => feature.toGeoJSON())
    };
  }

  getSelectedPoints() {
    return {
      type: Constants.geojsonTypes.FEATURE_COLLECTION,

      features: this.ctx.store.getSelectedCoordinates().map((coordinates) => ({
        type: Constants.geojsonTypes.FEATURE,
        properties: {},

        geometry: {
          type: Constants.geojsonTypes.POINT,
          coordinates
        }
      }))
    };
  }

  set(featureCollection: G.FeatureCollection) {
    if (featureCollection.type === undefined || featureCollection.type !== Constants.geojsonTypes.FEATURE_COLLECTION || !Array.isArray(featureCollection.features)) {
      throw new Error('Invalid FeatureCollection');
    }
    const renderBatch = this.ctx.store.createRenderBatch();
    let toDelete = this.ctx.store.getAllIds().slice();
    const newIds = this.add(featureCollection);
    const newIdsLookup = new StringSet(newIds);

    toDelete = toDelete.filter(id => !newIdsLookup.has(id));
    if (toDelete.length) {
      this.delete(toDelete);
    }

    renderBatch();
    return newIds;
  }

  add(geojson: G.Feature | G.FeatureCollection | G.Geometry) {
    const featureCollection = structuredClone(normalize(geojson));

    const ids = featureCollection.features.map((feature) => {
      feature.id = feature.id || generateID();

      if (feature.geometry === null) {
        throw new Error('Invalid geometry: null');
      }

      if (this.ctx.store.get(feature.id) === undefined || this.ctx.store.get(feature.id)?.type !== feature.geometry.type) {
        // If the feature has not yet been created ...
        const Model = featureTypes[feature.geometry.type as keyof typeof featureTypes];
        if (Model === undefined) {
          throw new Error(`Invalid geometry type: ${feature.geometry.type}.`);
        }
        const internalFeature: Feature = new (Model as any)(this.ctx, feature);
        this.ctx.store.add(internalFeature, { silent: this.silent });
      } else {
        // If a feature of that id has already been created, and we are swapping it out ...
        const internalFeature = this.ctx.store.get(feature.id)!;
        const originalProperties = internalFeature.properties;
        internalFeature.properties = feature.properties ?? {};
        if (!isEqual(originalProperties, feature.properties)) {
          this.ctx.store.featureChanged(internalFeature.id, { silent: this.silent });
        }
        if (!isEqual(internalFeature.getCoordinates(), 'coordinates' in feature.geometry ? feature.geometry.coordinates : undefined)) {
          internalFeature.incomingCoords('coordinates' in feature.geometry ? feature.geometry.coordinates : undefined);
        }
      }
      return feature.id;
    });

    this.ctx.store.render();
    return ids;
  }


  get(id: string): G.Feature | undefined {
    const feature = this.ctx.store.get(id);
    if (feature) {
      return feature.toGeoJSON();
    }
  }

  getAll(): G.FeatureCollection {
    return {
      type: Constants.geojsonTypes.FEATURE_COLLECTION,
      features: this.ctx.store.getAll().map(feature => feature.toGeoJSON())
    };
  }

  delete(featureIds: string | number | (string | number)[]) {
    this.ctx.store.delete(featureIds, { silent: this.silent });
    // If we were in direct select mode and our selected feature no longer exists
    // (because it was deleted), we need to get out of that mode.
    // FIXME: Remove hard coded behavior.
    if (this.getMode() === Constants.modes.DIRECT_SELECT && !this.ctx.store.getSelectedIds().length) {
      this.ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, {} as T[keyof T], { silent: this.silent });
    } else {
      this.ctx.store.render();
    }

    return this;
  }

  deleteAll() {
    this.ctx.store.delete(this.ctx.store.getAllIds(), { silent: this.silent });
    // If we were in direct select mode, now our selected feature no longer exists,
    // so escape that mode.
    // FIXME: Remove hard coded behavior.
    if (this.getMode() === Constants.modes.DIRECT_SELECT) {
      this.ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, {} as T[keyof T], { silent: this.silent });
    } else {
      this.ctx.store.render();
    }

    return this;
  }

  changeMode<K extends keyof T>(mode: K, modeOptions: T[K]) {
    // FIXME: they're hard coding behavior for mode strings, despite them being customizable....
    // @ts-expect-error
    modeOptions ??= {};

    // Avoid changing modes just to re-select what's already selected
    // FIXME: Remove hard coded behavior.
    if (mode === Constants.modes.SIMPLE_SELECT && this.getMode() === Constants.modes.SIMPLE_SELECT) {
      if (stringSetsAreEqual(((modeOptions as any).featureIds || []), this.ctx.store.getSelectedIds())) return this;
      // And if we are changing the selection within simple_select mode, just change the selection,
      // instead of stopping and re-starting the mode

      this.ctx.store.setSelected((modeOptions as any).featureIds, { silent: this.silent });
      this.ctx.store.render();
      return this;
    }

    // FIXME: Remove hard coded behavior.
    if (mode === Constants.modes.DIRECT_SELECT && this.getMode() === Constants.modes.DIRECT_SELECT &&
      (modeOptions as any).featureId === this.ctx.store.getSelectedIds()[0]) {
      return this;
    }

    this.ctx.events.changeMode(mode, modeOptions, { silent: this.silent });
    return this;
  }

  getMode() {
    return this.ctx.events.getMode();
  }

  trash() {
    this.ctx.events.trash();
    return this;
  }

  combineFeatures() {
    this.ctx.events.combineFeatures();
    return this;
  }

  uncombineFeatures() {
    this.ctx.events.uncombineFeatures();
    return this;
  }

  setFeatureProperty(featureId: string | string, property: string, value: any) {
    this.ctx.store.setFeatureProperty(featureId, property, value, { silent: this.silent });
    return this;
  }
}
