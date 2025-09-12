import type * as G from 'geojson';
import type { MapMouseEvent, MapTouchEvent } from 'maplibre-gl';

declare module 'maplibre-gl' {
  interface MapTouchEvent {
    featureTarget?: G.Feature;
  }

  interface MapMouseEvent {
    featureTarget?: G.Feature;
  }
}

export function getFeatureTarget(e: MapTouchEvent | MapMouseEvent) {
  if (e.featureTarget === undefined) {
    throw new Error(`maplibre-gl-draw expected a featureTarget property in the ${e.type} event, but it was missing`);
  }

  return e.featureTarget;
}
