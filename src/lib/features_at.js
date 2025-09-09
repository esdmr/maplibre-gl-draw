import sortFeatures from './sort_features.js';
import mapEventToBoundingBox from './map_event_to_bounding_box.js';
import * as Constants from '../constants.js';
import StringSet from './string_set.js';

const META_TYPES = [
  Constants.meta.FEATURE,
  Constants.meta.MIDPOINT,
  Constants.meta.VERTEX
];

// Requires either event or bbox
export default {
  click: featuresAtClick,
  touch: featuresAtTouch
};

function featuresAtClick(event, bbox, ctx) {
  return featuresAt(event, bbox, ctx, ctx.options.clickBuffer);
}

function featuresAtTouch(event, bbox, ctx) {
  return featuresAt(event, bbox, ctx, ctx.options.touchBuffer);
}

function featuresAt(event, bbox, {map, options}, buffer) {
  if (map === null) return [];

  const box = (event) ? mapEventToBoundingBox(event, buffer) : bbox;

  const queryParams = {};

  if (options.styles) queryParams.layers = options.styles.map(({id}) => id).filter(id => map.getLayer(id) != null);

  const features = map.queryRenderedFeatures(box, queryParams)
    .filter(({properties}) => META_TYPES.includes(properties.meta));

  const featureIds = new StringSet();
  const uniqueFeatures = [];
  features.forEach((feature) => {
    const featureId = feature.properties.id;
    if (featureIds.has(featureId)) return;
    featureIds.add(featureId);
    uniqueFeatures.push(feature);
  });

  return sortFeatures(uniqueFeatures);
}
