import Polygon from './polygon.js';
import LineString from './line_string.js';
import Point from './point.js';
import MultiFeature from './multi_feature.js';

export const featureTypes = {
  Polygon,
  LineString,
  Point,
  MultiPolygon: MultiFeature,
  MultiLineString: MultiFeature,
  MultiPoint: MultiFeature
};
