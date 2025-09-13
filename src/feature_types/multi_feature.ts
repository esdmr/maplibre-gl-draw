import type * as G from 'geojson';
import * as Constants from '../constants.ts';
import { generateID } from '../lib/id.ts';
import Feature from './feature.ts';

import type { MaplibreDrawContext } from '../context.ts';
import LineString from './line_string.ts';
import Point from './point.ts';
import Polygon from './polygon.ts';

const models = {
  MultiPoint: Point,
  MultiLineString: LineString,
  MultiPolygon: Polygon
};

type Models = {[K in keyof typeof models]: InstanceType<typeof models[K]>};

const takeAction = <K extends
  | 'getCoordinate'
  | 'updateCoordinate'
  | 'addCoordinate'
  | 'removeCoordinate'
>(features: Feature[], action: K, ...args: Parameters<Feature[K]>) => {
  const parts = (args[0] ?? '').split('.');
  const idx = parseInt(parts[0], 10);

  if (!Number.isSafeInteger(idx)) {
    throw new Error(`Invalid path ${args[0]} passed to maplibre-gl-draw MultiFeature.${action}`);
  }

  args[0] = parts[1] ? parts.slice(1).join('.') : null;
  return (features[idx][action] as any)(...args);
};

class MultiFeature<T extends G.MultiPoint | G.MultiLineString | G.MultiPolygon = G.MultiPoint | G.MultiLineString | G.MultiPolygon> extends Feature<T> {
  model: typeof models[T['type']];
  features;
  override coordinates: never;

  constructor(ctx: MaplibreDrawContext<any>, geojson: G.Feature<T>) {
    super(ctx, geojson);

    this.model = models[geojson.geometry.type] as any;

    if (this.model === undefined) throw new TypeError(`${geojson.geometry.type} is not a valid type`);

    this.features = this._coordinatesToFeatures(geojson.geometry.coordinates);
    this.coordinates = undefined as never;
  }

  private _coordinatesToFeatures(coordinates: G.Position[] | G.Position[][] | G.Position[][][]) {
    return coordinates.map(coords => new this.model(this.ctx, {
      id: generateID(),
      type: Constants.geojsonTypes.FEATURE,
      properties: {},
      geometry: {
        coordinates: coords,
        type: this.type.replace('Multi', '')
      } as never
    }) as Models[T['type']]);
  }

  isValid() {
    return this.features.every(f => f.isValid());
  }

  override setCoordinates(coords: G.Position[] | G.Position[][] | G.Position[][][]) {
    this.features = this._coordinatesToFeatures(coords);
    this.changed();
  }

  getCoordinate(path: string | null) {
    return takeAction(this.features, 'getCoordinate', path);
  }

  override getCoordinates() {
    return JSON.parse(JSON.stringify(this.features.map((f) => {
      if (f.type === Constants.geojsonTypes.POLYGON) return f.getCoordinates();
      return f.coordinates;
    })));
  }

  updateCoordinate(path: string | null, lng: number, lat: number) {
    takeAction(this.features, 'updateCoordinate', path, lng, lat);
    this.changed();
  }

  addCoordinate(path: string | null, lng: number, lat: number) {
    takeAction(this.features, 'addCoordinate', path, lng, lat);
    this.changed();
  }

  removeCoordinate(path: string | null) {
    takeAction(this.features, 'removeCoordinate', path);
    this.changed();
  }

  getFeatures() {
    return this.features;
  }
}

export default MultiFeature;
