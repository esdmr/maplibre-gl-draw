import constrainFeatureMovement from './constrain_feature_movement.ts';
import * as Constants from '../constants.ts';
import type Feature from '../feature_types/feature.ts';
import type * as G from 'geojson';

export default function moveFeatures(features: Feature<any>[], delta: { lng: number; lat: number; }) {
  const constrainedDelta = constrainFeatureMovement(features.map(feature => feature.toGeoJSON()), delta);

  features.forEach((feature) => {
    const moveCoordinate = (coord: G.Position) => [coord[0] + constrainedDelta.lng, coord[1] + constrainedDelta.lat];

    const moveRing = (ring: G.Position[]) => ring.map(coord => moveCoordinate(coord));
    const moveMultiPolygon = (multi: G.Position[][]) => multi.map(ring => moveRing(ring));

    let nextCoordinates;

    if (feature.type === Constants.geojsonTypes.POINT) {
      nextCoordinates = moveCoordinate(feature.getCoordinates() as G.Position);
    } else if (feature.type === Constants.geojsonTypes.LINE_STRING || feature.type === Constants.geojsonTypes.MULTI_POINT) {
      nextCoordinates = (feature.getCoordinates() as G.Position[]).map(moveCoordinate);
    } else if (feature.type === Constants.geojsonTypes.POLYGON || feature.type === Constants.geojsonTypes.MULTI_LINE_STRING) {
      nextCoordinates = (feature.getCoordinates() as G.Position[][]).map(moveRing);
    } else if (feature.type === Constants.geojsonTypes.MULTI_POLYGON) {
      nextCoordinates = (feature.getCoordinates() as G.Position[][][]).map(moveMultiPolygon);
    }

    feature.incomingCoords(nextCoordinates);
  });
}
