import type * as G from 'geojson';
import Feature from './feature.js';

class Point extends Feature<G.Point> {
  isValid() {
    return typeof this.coordinates[0] === 'number' &&
      typeof this.coordinates[1] === 'number';
  }

  addCoordinate (_path: string, _lng: number, _lat: number): void {
    throw new Error('maplibre-gl-draw Feature.addCoordinate called on a Point');
  }

  getCoordinate(_path: string) {
    return this.getCoordinates();
  }

  updateCoordinate(_path: string, lng: number, lat: number): void;
  updateCoordinate(lng: number, lat: number): void;

  updateCoordinate(pathOrLng: string | number, lngOrLat: number, lat?: number) {
    if (arguments.length === 3) {
      this.coordinates = [lngOrLat, lat!];
    } else {
      this.coordinates = [pathOrLng as number, lngOrLat];
    }

    this.changed();
  }

  removeCoordinate (_path: string): void {
    throw new Error('maplibre-gl-draw Feature.removeCoordinate called on a Point');
  }
}

export default Point;
