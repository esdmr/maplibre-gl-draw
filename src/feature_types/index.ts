import Polygon from './polygon.ts';
import LineString from './line_string.ts';
import Point from './point.ts';
import MultiFeature from './multi_feature.ts';

export const featureTypes = {
  Polygon,
  LineString,
  Point,
  MultiPolygon: MultiFeature,
  MultiLineString: MultiFeature,
  MultiPoint: MultiFeature
};
