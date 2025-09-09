import euclideanDistance from './euclidean_distance.js';

export const TAP_TOLERANCE = 25;
export const TAP_INTERVAL = 250;

export default function isTap(start, {point, time}, options = {}) {
  const tolerance = (options.tolerance != null) ? options.tolerance : TAP_TOLERANCE;
  const interval = (options.interval != null) ? options.interval : TAP_INTERVAL;

  start.point = start.point || point;
  start.time = start.time || time;
  const moveDistance = euclideanDistance(start.point, point);

  return moveDistance < tolerance && (time - start.time) < interval;
}
