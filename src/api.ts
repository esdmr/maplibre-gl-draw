import normalize from '@mapbox/geojson-normalize';
import isEqual from 'fast-deep-equal';
import * as Constants from './constants.js';
import { featuresAtClick } from './lib/features_at.js';
import { generateID } from './lib/id.js';
import StringSet from './lib/string_set.js';
import stringSetsAreEqual from './lib/string_sets_are_equal.js';

import type * as G from 'geojson';
import type { IControl, Map } from 'maplibre-gl';
import { MaplibreDrawContext } from './context.js';
import type Feature from './feature_types/feature.js';
import { featureTypes } from './feature_types/index.js';
import Setup from './setup.js';
import mapEventToBoundingBox from './lib/map_event_to_bounding_box.js';

export default class MaplibreDrawApi<T extends Record<string, {}>> implements IControl {
  ctx;

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
    return this.ctx.controlContainerOrThrow;
  }

  onRemove() {
    this.ctx.setup?.dispose();
  }

  getFeatureIdsAt(point: {x: number, y: number}) {
    const features = featuresAtClick(undefined, mapEventToBoundingBox({ point }), this.ctx);
    return features.map(({properties}) => properties?.id).filter(i => i !== undefined) as string[];
  }

  getSelectedIds() {
    return this.ctx.storeOrThrow.getSelectedIds();
  }

  getSelected() {
    return {
      type: Constants.geojsonTypes.FEATURE_COLLECTION,
      features: this.ctx.storeOrThrow.getSelectedIds().map(id => this.ctx.storeOrThrow.get(id)).filter(i => i !== undefined).map(feature => feature.toGeoJSON())
    };
  }

  getSelectedPoints() {
    return {
      type: Constants.geojsonTypes.FEATURE_COLLECTION,

      features: this.ctx.storeOrThrow.getSelectedCoordinates().map((coordinates) => ({
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
    const renderBatch = this.ctx.storeOrThrow.createRenderBatch();
    let toDelete = this.ctx.storeOrThrow.getAllIds().slice();
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

      if (this.ctx.storeOrThrow.get(feature.id) === undefined || this.ctx.storeOrThrow.get(feature.id)?.type !== feature.geometry.type) {
        // If the feature has not yet been created ...
        const Model = featureTypes[feature.geometry.type as keyof typeof featureTypes];
        if (Model === undefined) {
          throw new Error(`Invalid geometry type: ${feature.geometry.type}.`);
        }
        const internalFeature: Feature = new (Model as any)(this.ctx, feature);
        this.ctx.storeOrThrow.add(internalFeature, { silent: this.silent });
      } else {
        // If a feature of that id has already been created, and we are swapping it out ...
        const internalFeature = this.ctx.storeOrThrow.get(feature.id)!;
        const originalProperties = internalFeature.properties;
        internalFeature.properties = feature.properties ?? {};
        if (!isEqual(originalProperties, feature.properties)) {
          this.ctx.storeOrThrow.featureChanged(internalFeature.id, { silent: this.silent });
        }
        if (!isEqual(internalFeature.getCoordinates(), 'coordinates' in feature.geometry ? feature.geometry.coordinates : undefined)) {
          internalFeature.incomingCoords('coordinates' in feature.geometry ? feature.geometry.coordinates : undefined);
        }
      }
      return feature.id;
    });

    this.ctx.storeOrThrow.render();
    return ids;
  }


  get(id: string): G.Feature | undefined {
    const feature = this.ctx.storeOrThrow.get(id);
    if (feature) {
      return feature.toGeoJSON();
    }
  }

  getAll(): G.FeatureCollection {
    return {
      type: Constants.geojsonTypes.FEATURE_COLLECTION,
      features: this.ctx.storeOrThrow.getAll().map(feature => feature.toGeoJSON())
    };
  }

  delete(featureIds: string | number | (string | number)[]) {
    this.ctx.storeOrThrow.delete(featureIds, { silent: this.silent });
    // If we were in direct select mode and our selected feature no longer exists
    // (because it was deleted), we need to get out of that mode.
    // FIXME: Remove hard coded behavior.
    if (this.getMode() === Constants.modes.DIRECT_SELECT && !this.ctx.storeOrThrow.getSelectedIds().length) {
      this.ctx.eventsOrThrow.changeMode(Constants.modes.SIMPLE_SELECT, {} as T[keyof T], { silent: this.silent });
    } else {
      this.ctx.storeOrThrow.render();
    }

    return this;
  }

  deleteAll() {
    this.ctx.storeOrThrow.delete(this.ctx.storeOrThrow.getAllIds(), { silent: this.silent });
    // If we were in direct select mode, now our selected feature no longer exists,
    // so escape that mode.
    // FIXME: Remove hard coded behavior.
    if (this.getMode() === Constants.modes.DIRECT_SELECT) {
      this.ctx.eventsOrThrow.changeMode(Constants.modes.SIMPLE_SELECT, {} as T[keyof T], { silent: this.silent });
    } else {
      this.ctx.storeOrThrow.render();
    }

    return this;
  }

  changeMode<K extends keyof T>(mode: K, modeOptions: T[K]) {
    // FIXME: they're hard coding behavior for mode strings, despite them being customizable....

    // Avoid changing modes just to re-select what's already selected
    // FIXME: Remove hard coded behavior.
    if (mode === Constants.modes.SIMPLE_SELECT && this.getMode() === Constants.modes.SIMPLE_SELECT) {
      if (stringSetsAreEqual(((modeOptions as any).featureIds || []), this.ctx.storeOrThrow.getSelectedIds())) return this;
      // And if we are changing the selection within simple_select mode, just change the selection,
      // instead of stopping and re-starting the mode

      this.ctx.storeOrThrow.setSelected((modeOptions as any).featureIds, { silent: this.silent });
      this.ctx.storeOrThrow.render();
      return this;
    }

    // FIXME: Remove hard coded behavior.
    if (mode === Constants.modes.DIRECT_SELECT && this.getMode() === Constants.modes.DIRECT_SELECT &&
      (modeOptions as any).featureId === this.ctx.storeOrThrow.getSelectedIds()[0]) {
      return this;
    }

    this.ctx.eventsOrThrow.changeMode(mode, modeOptions, { silent: this.silent });
    return this;
  }

  getMode() {
    return this.ctx.eventsOrThrow.getMode();
  }

  trash() {
    this.ctx.eventsOrThrow.trash();
    return this;
  }

  combineFeatures() {
    this.ctx.eventsOrThrow.combineFeatures();
    return this;
  }

  uncombineFeatures() {
    this.ctx.eventsOrThrow.uncombineFeatures();
    return this;
  }

  setFeatureProperty(featureId: string | string, property: string, value: any) {
    this.ctx.storeOrThrow.setFeatureProperty(featureId, property, value, { silent: this.silent });
    return this;
  }
}
