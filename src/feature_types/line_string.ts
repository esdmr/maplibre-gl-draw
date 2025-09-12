import Feature from './feature.js';
import type * as G from 'geojson';

class LineString extends Feature<G.LineString> {
  isValid() {
    return this.coordinates.length > 1;
  }

  addCoordinate(path: string, lng: number, lat: number) {
    this.changed();
    const id = parseInt(path, 10);
    this.coordinates.splice(id, 0, [lng, lat]);
  }

  getCoordinate(path: string) {
    const id = parseInt(path, 10);
    return JSON.parse(JSON.stringify(this.coordinates[id]));
  }

  removeCoordinate(path: string) {
    this.changed();
    this.coordinates.splice(parseInt(path, 10), 1);
  }

  updateCoordinate(path: string, lng: number, lat: number) {
    const id = parseInt(path, 10);
    this.coordinates[id] = [lng, lat];
    this.changed();
  }
}

export default LineString;
