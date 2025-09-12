import {generateID} from '../lib/id.js';
import * as Constants from '../constants.js';
import type * as G from 'geojson';
import type { MaplibreDrawContext } from '../context.js';

abstract class Feature<T extends G.Geometry = G.Geometry> {
  ctx;
  properties: { [name: string]: any; };
  coordinates: T extends { coordinates: infer S } ? S : undefined;
  id: string;
  type: string;

  constructor(ctx: MaplibreDrawContext<any>, {properties, geometry, id}: G.Feature<T>) {
    this.ctx = ctx;
    this.properties = properties || {};
    this.coordinates = 'coordinates' in geometry ? geometry.coordinates as any : undefined;
    this.id = String(id || generateID());
    this.type = geometry.type;
  }

  changed() {
    this.ctx.storeOrThrow.featureChanged(this.id);
  }

  incomingCoords(coords: this['coordinates']) {
    this.setCoordinates(coords);
  }

  setCoordinates(coords: this['coordinates']) {
    this.coordinates = coords;
    this.changed();
  }

  getCoordinates() {
    return structuredClone(this.coordinates);
  }

  setProperty(property: string, value: unknown) {
    this.properties[property] = value;
  }

  toGeoJSON(): G.Feature<T> {
    return structuredClone({
      id: this.id,
      type: Constants.geojsonTypes.FEATURE,
      properties: this.properties,
      geometry: {
        coordinates: this.getCoordinates(),
        type: this.type
      } as G.Geometry as T
    });
  }

  internal(mode: PropertyKey): G.Feature<T> {
    const properties: G.GeoJsonProperties = {
      id: this.id,
      meta: Constants.meta.FEATURE,
      'meta:type': this.type,
      active: Constants.activeStates.INACTIVE,
      mode
    };

    if (this.ctx.options.userProperties) {
      for (const name in this.properties) {
        properties[`user_${name}`] = this.properties[name];
      }
    }

    return {
      type: Constants.geojsonTypes.FEATURE,
      properties,
      geometry: {
        coordinates: this.getCoordinates(),
        type: this.type
      } as G.Geometry as T,
    };
  }

  abstract isValid(): boolean;
  abstract addCoordinate(path: string, lng: number, lat: number): void;
  abstract getCoordinate(path: string): G.Position;
  abstract updateCoordinate(path: string, lng: number, lat: number): void;
  abstract removeCoordinate(path: string): void;
}

export default Feature;
