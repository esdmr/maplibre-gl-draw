import Feature from './feature.ts';
import type * as G from 'geojson';

class LineString extends Feature<G.LineString> {
  isValid() {
    return this.coordinates.length > 1;
  }

  addCoordinate(path: string | null, lng: number, lat: number) {
    const id = parseInt(path ?? '', 10);

    if (!Number.isSafeInteger(id)) {
      throw new Error(`Invalid path ${path} passed to maplibre-gl-draw LineString`);
    }

    this.changed();
    this.coordinates.splice(id, 0, [lng, lat]);
  }

  getCoordinate(path: string | null) {
    const id = parseInt(path ?? '', 10);

    if (!Number.isSafeInteger(id)) {
      throw new Error(`Invalid path ${path} passed to maplibre-gl-draw LineString`);
    }

    return JSON.parse(JSON.stringify(this.coordinates[id]));
  }

  removeCoordinate(path: string | null) {
    this.changed();
    const id = parseInt(path ?? '', 10);

    if (!Number.isSafeInteger(id)) {
      throw new Error(`Invalid path ${path} passed to maplibre-gl-draw LineString`);
    }

    this.coordinates.splice(id, 1);
  }

  updateCoordinate(path: string | null, lng: number, lat: number) {
    const id = parseInt(path ?? '', 10);

    if (!Number.isSafeInteger(id)) {
      throw new Error(`Invalid path ${path} passed to maplibre-gl-draw LineString`);
    }

    this.coordinates[id] = [lng, lat];
    this.changed();
  }
}

export default LineString;
