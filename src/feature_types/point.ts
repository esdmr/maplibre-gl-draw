import type * as G from 'geojson';
import Feature from './feature.ts';

class Point extends Feature<G.Point> {
  isValid() {
    return typeof this.coordinates[0] === 'number' &&
      typeof this.coordinates[1] === 'number';
  }

  addCoordinate (_path: string | null | undefined, _lng: number, _lat: number): void {
    throw new Error('maplibre-gl-draw Feature.addCoordinate called on a Point');
  }

  getCoordinate(path?: string | null) {
    return this.getCoordinates();
  }

  updateCoordinate(_path: string | null | undefined, lng: number, lat: number): void;
  updateCoordinate(lng: number, lat: number): void;

  updateCoordinate(pathOrLng: string | null | undefined | number, lngOrLat: number, lat?: number) {
    if (arguments.length >= 3) {
      this.coordinates = [lngOrLat, lat!];
    } else {
      if (typeof pathOrLng !== 'number') {
        throw new Error(`Invalid longitude ${pathOrLng} passed to maplibre-gl-draw Point.updateCoordinate`);
      }

      this.coordinates = [pathOrLng as number, lngOrLat];
    }

    this.changed();
  }

  removeCoordinate (_path?: string | null): void {
    throw new Error('maplibre-gl-draw Feature.removeCoordinate called on a Point');
  }
}

export default Point;
