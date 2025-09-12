import type { PointLike } from 'maplibre-gl';

/**
 * Returns a bounding box representing the event's location.
 *
 * @param mapEvent - Maplibre GL JS map event, with a point properties.
 * @return Bounding box.
 */
function mapEventToBoundingBox({point: {x, y}}: {point: {x: number, y: number}}, buffer = 0): [PointLike, PointLike] {
  return [
    [x - buffer, y - buffer],
    [x + buffer, y + buffer]
  ];
}

export default mapEventToBoundingBox;
