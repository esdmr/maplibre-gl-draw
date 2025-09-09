/**
 * Returns a bounding box representing the event's location.
 *
 * @param {import('maplibre-gl').MapMouseEvent | import('maplibre-gl').MapTouchEvent} mapEvent - Maplibre GL JS map event, with a point properties.
 * @return {Array<Array<number>>} Bounding box.
 */
function mapEventToBoundingBox({point}, buffer = 0) {
  return [
    [point.x - buffer, point.y - buffer],
    [point.x + buffer, point.y + buffer]
  ];
}

export default mapEventToBoundingBox;
