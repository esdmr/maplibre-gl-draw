import euclideanDistance from './euclidean_distance.js';

const FINE_TOLERANCE = 4;
const GROSS_TOLERANCE = 12;
const INTERVAL = 500;

export default function isClick(start, {point, time}, options = {}) {
  const fineTolerance = (options.fineTolerance != null) ? options.fineTolerance : FINE_TOLERANCE;
  const grossTolerance = (options.grossTolerance != null) ? options.grossTolerance : GROSS_TOLERANCE;
  const interval = (options.interval != null) ? options.interval : INTERVAL;

  start.point = start.point || point;
  start.time = start.time || time;
  const moveDistance = euclideanDistance(start.point, point);

  return moveDistance < fineTolerance ||
    (moveDistance < grossTolerance && (time - start.time) < interval);
}
