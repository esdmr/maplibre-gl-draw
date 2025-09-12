import area from '@mapbox/geojson-area';
import * as Constants from '../constants.js';
import type * as G from 'geojson';

const FEATURE_SORT_RANKS = {
  Point: 0,
  MultiPoint: 0,
  LineString: 1,
  MultiLineString: 1,
  Polygon: 2,
  MultiPolygon: 2,
  GeometryCollection: 3,
} as const;

function comparator(a: G.Feature & {area?: number}, b: G.Feature & {area?: number}) {
  const score = FEATURE_SORT_RANKS[a.geometry.type] - FEATURE_SORT_RANKS[b.geometry.type];

  if (score === 0 && a.area !== undefined && b.area !== undefined) {
    return a.area - b.area;
  }

  return score;
}

// Sort in the order above, then sort polygons by area ascending.
function sortFeatures(features: G.Feature[]) {
  return features.map((feature) => ({
    ...feature,
    area: feature.geometry.type === Constants.geojsonTypes.POLYGON
      ? area.geometry(feature.geometry)
      : undefined,
  })).sort(comparator).map<G.Feature>((feature) => {
    delete feature.area;
    return feature;
  });
}

export default sortFeatures;
