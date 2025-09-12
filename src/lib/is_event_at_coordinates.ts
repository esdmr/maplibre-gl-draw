import type { Position } from 'geojson';
import type { MapMouseEvent, MapTouchEvent } from 'maplibre-gl';

function isEventAtCoordinates({lngLat}: MapMouseEvent | MapTouchEvent, coordinates: Position) {
  if (!lngLat) return false;
  return lngLat.lng === coordinates[0] && lngLat.lat === coordinates[1];
}

export default isEventAtCoordinates;
