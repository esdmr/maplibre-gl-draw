import Point from '@mapbox/point-geometry';

/**
 * Returns a Point representing a mouse event's position
 * relative to a containing element.
 */
function mouseEventPoint({clientX, clientY}: MouseEvent, container: HTMLElement) {
  const rect = container.getBoundingClientRect();
  return new Point(
    clientX - rect.left - (container.clientLeft || 0),
    clientY - rect.top - (container.clientTop || 0)
  );
}

export default mouseEventPoint;
