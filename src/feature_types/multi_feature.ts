import type * as G from 'geojson';
import * as Constants from '../constants.js';
import { generateID } from '../lib/id.js';
import Feature from './feature.js';

import type { MaplibreDrawContext } from '../context.js';
import LineString from './line_string.js';
import Point from './point.js';
import Polygon from './polygon.js';

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
  const parts = args[0].split('.');
  const idx = parseInt(parts[0], 10);
  args[0] = parts.slice(1).join('.');
  return (features[idx][action] as any)(...args);
};

class MultiFeature<T extends G.MultiPoint | G.MultiLineString | G.MultiPolygon = G.MultiPoint | G.MultiLineString | G.MultiPolygon> extends Feature<T> {
  model: typeof models[T['type']];
  features;

  constructor(ctx: MaplibreDrawContext<any>, geojson: G.Feature<T>) {
    super(ctx, geojson);

    this.model = models[geojson.geometry.type] as any;

    if (this.model === undefined) throw new TypeError(`${geojson.geometry.type} is not a valid type`);

    this.features = this._coordinatesToFeatures(this.coordinates);
  }

  private _coordinatesToFeatures(coordinates: this['coordinates']) {
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

  override setCoordinates(coords: this['coordinates']) {
    this.coordinates = coords;
    this.features = this._coordinatesToFeatures(coords);
    this.changed();
  }

  getCoordinate(path: string) {
    return takeAction(this.features, 'getCoordinate', path);
  }

  override getCoordinates() {
    return JSON.parse(JSON.stringify(this.features.map((f) => {
      if (f.type === Constants.geojsonTypes.POLYGON) return f.getCoordinates();
      return f.coordinates;
    })));
  }

  updateCoordinate(path: string, lng: number, lat: number) {
    takeAction(this.features, 'updateCoordinate', path, lng, lat);
    this.changed();
  }

  addCoordinate(path: string, lng: number, lat: number) {
    takeAction(this.features, 'addCoordinate', path, lng, lat);
    this.changed();
  }

  removeCoordinate(path: string) {
    takeAction(this.features, 'removeCoordinate', path);
    this.changed();
  }

  getFeatures() {
    return this.features;
  }
}

export default MultiFeature;
