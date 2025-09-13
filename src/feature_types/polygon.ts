import type * as G from 'geojson';
import Feature from './feature.ts';
import type { MaplibreDrawContext } from '../context.ts';

class Polygon extends Feature<G.Polygon> {
  constructor(ctx: MaplibreDrawContext<any>, geojson: G.Feature<G.Polygon>) {
    super(ctx, geojson);
    this.coordinates = this.coordinates.map(ring => ring.slice(0, -1));
  }

  isValid() {
    if (this.coordinates.length === 0) return false;
    return this.coordinates.every(({length}) => length > 2);
  }

  // Expects valid geoJSON polygon geometry: first and last positions must be equivalent.
  override incomingCoords(coords: this['coordinates']) {
    this.coordinates = coords.map(ring => ring.slice(0, -1));
    this.changed();
  }

  // Does NOT expect valid geoJSON polygon geometry: first and last positions should not be equivalent.
  override setCoordinates(coords: this['coordinates']) {
    this.coordinates = coords;
    this.changed();
  }

  addCoordinate(path: string, lng: number, lat: number) {
    const ids = path.split('.').map(x => parseInt(x, 10));

    if (!Number.isSafeInteger(ids[0]) || !Number.isSafeInteger(ids[1])) {
      throw new Error(`Invalid path ${path} passed to maplibre-gl-draw Polygon.addCoordinate`);
    }

    const ring = this.coordinates[ids[0]];
    ring.splice(ids[1], 0, [lng, lat]);
    this.changed();
  }

  removeCoordinate(path: string) {
    const ids = path.split('.').map(x => parseInt(x, 10));

    if (!Number.isSafeInteger(ids[0]) || !Number.isSafeInteger(ids[1])) {
      throw new Error(`Invalid path ${path} passed to maplibre-gl-draw Polygon.removeCoordinate`);
    }

    const ring = this.coordinates[ids[0]];

    if (ring) {
      ring.splice(ids[1], 1);

      if (ring.length < 3) {
        this.coordinates.splice(ids[0], 1);
      }
    }

    this.changed();
  }

  getCoordinate(path: string) {
    const ids = path.split('.').map(x => parseInt(x, 10));

    if (!Number.isSafeInteger(ids[0]) || !Number.isSafeInteger(ids[1])) {
      throw new Error(`Invalid path ${path} passed to maplibre-gl-draw Polygon.getCoordinate`);
    }

    const ring = this.coordinates[ids[0]];
    return JSON.parse(JSON.stringify(ring[ids[1]]));
  }

  override getCoordinates() {
    return this.coordinates.map(coords => coords.concat([coords[0]]));
  }

  updateCoordinate(path: string, lng: number, lat: number) {
    const ids = path.split('.').map(i => parseInt(i, 10));

    if (!Number.isSafeInteger(ids[0]) || !Number.isSafeInteger(ids[1])) {
      throw new Error(`Invalid path ${path} passed to maplibre-gl-draw Polygon.updateCoordinate`);
    }

    this.coordinates[ids[0]] ??= [];
    this.coordinates[ids[0]][ids[1]] = [lng, lat];
    this.changed();
  }
}

export default Polygon;
