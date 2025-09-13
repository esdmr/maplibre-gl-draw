import type * as G from 'geojson';
import type { MapMouseEvent, MapTouchEvent, PointLike, QueryRenderedFeaturesOptions } from 'maplibre-gl';
import * as Constants from '../constants.ts';
import type { MaplibreDrawContext } from '../context.ts';
import mapEventToBoundingBox from './map_event_to_bounding_box.ts';
import sortFeatures from './sort_features.ts';
import StringSet from './string_set.ts';

const META_TYPES = [
  Constants.meta.FEATURE,
  Constants.meta.MIDPOINT,
  Constants.meta.VERTEX
];

export function featuresAtClick<T extends Record<string, {}>>(event: MapMouseEvent, bbox: undefined, ctx: MaplibreDrawContext<T>): G.Feature[];

export function featuresAtClick<T extends Record<string, {}>>(event: undefined, bbox: [PointLike, PointLike], ctx: MaplibreDrawContext<T>): G.Feature[];

export function featuresAtClick<T extends Record<string, {}>>(event: MapMouseEvent | undefined, bbox: [PointLike, PointLike] | undefined, ctx: MaplibreDrawContext<T>) {
  return featuresAt(event, bbox, ctx, ctx.options.clickBuffer);
}

export function featuresAtTouch<T extends Record<string, {}>>(event: MapTouchEvent, bbox: undefined, ctx: MaplibreDrawContext<T>): G.Feature[];

export function featuresAtTouch<T extends Record<string, {}>>(event: undefined, bbox: [PointLike, PointLike], ctx: MaplibreDrawContext<T>): G.Feature[];

export function featuresAtTouch<T extends Record<string, {}>>(event: MapTouchEvent | undefined, bbox: [PointLike, PointLike] | undefined, ctx: MaplibreDrawContext<T>) {
  return featuresAt(event, bbox, ctx, ctx.options.touchBuffer);
}

function featuresAt<T extends Record<string, {}>>(event: MapMouseEvent | MapTouchEvent | undefined, bbox: [PointLike, PointLike] | undefined, ctx: MaplibreDrawContext<T>, buffer: number): G.Feature[] {
  if (ctx.setup === null) return [];

  const box = (event) ? mapEventToBoundingBox(event, buffer) : bbox!;

  const queryParams: QueryRenderedFeaturesOptions = {};

  if (ctx.options.styles) queryParams.layers = ctx.options.styles.map(({id}) => id).filter(id => ctx.map.getLayer(id) != null);

  const features = ctx.map.queryRenderedFeatures(box, queryParams)
    .filter(({properties}) => META_TYPES.includes(properties.meta));

  const featureIds = new StringSet();
  const uniqueFeatures: G.Feature[] = [];

  features.forEach((feature) => {
    const featureId = feature.properties.id;
    if (featureIds.has(featureId)) return;
    featureIds.add(featureId);
    uniqueFeatures.push(feature);
  });

  return sortFeatures(uniqueFeatures);
}
