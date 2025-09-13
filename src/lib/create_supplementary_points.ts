import createVertex from './create_vertex.ts';
import createMidpoint from './create_midpoint.ts';
import * as Constants from '../constants.ts';
import type * as G from 'geojson';

function createSupplementaryPoints(geojson: G.Feature, options: { midpoints?: boolean; selectedPaths?: (string | null)[] } = {}, basePath: string | null = null) {
  const featureId = geojson.properties && geojson.properties.id;

  let supplementaryPoints: G.Feature<G.Point>[] = [];

  if (geojson.geometry.type === Constants.geojsonTypes.POINT) {
    // For points, just create a vertex
    supplementaryPoints.push(createVertex(featureId, geojson.geometry.coordinates, basePath, isSelectedPath(basePath)));
  } else if (geojson.geometry.type === Constants.geojsonTypes.POLYGON) {
    // Cycle through a Polygon's rings and
    // process each line
    geojson.geometry.coordinates.forEach((line, lineIndex) => {
      processLine(line, (basePath !== null) ? `${basePath}.${lineIndex}` : String(lineIndex));
    });
  } else if (geojson.geometry.type === Constants.geojsonTypes.LINE_STRING) {
    processLine(geojson.geometry.coordinates, basePath);
  } else if (geojson.geometry.type.indexOf(Constants.geojsonTypes.MULTI_PREFIX) === 0) {
    processMultiGeometry();
  }

  function processLine(line: G.Position[], lineBasePath: string | null) {
    let firstPointString = '';
    let lastVertex: G.Feature<G.Point> | null = null;
    line.forEach((point, pointIndex) => {
      const pointPath = (lineBasePath !== undefined && lineBasePath !== null) ? `${lineBasePath}.${pointIndex}` : String(pointIndex);
      const vertex = createVertex(featureId, point, pointPath, isSelectedPath(pointPath));

      // If we're creating midpoints, check if there was a
      // vertex before this one. If so, add a midpoint
      // between that vertex and this one.
      if (options.midpoints && lastVertex) {
        const midpoint = createMidpoint(featureId, lastVertex, vertex);
        if (midpoint) {
          supplementaryPoints.push(midpoint);
        }
      }
      lastVertex = vertex;

      // A Polygon line's last point is the same as the first point. If we're on the last
      // point, we want to draw a midpoint before it but not another vertex on it
      // (since we already a vertex there, from the first point).
      const stringifiedPoint = JSON.stringify(point);
      if (firstPointString !== stringifiedPoint) {
        supplementaryPoints.push(vertex);
      }
      if (pointIndex === 0) {
        firstPointString = stringifiedPoint;
      }
    });
  }

  function isSelectedPath(path: string | null) {
    if (!Array.isArray(options.selectedPaths)) return false;
    return options.selectedPaths.includes(path);
  }

  // Split a multi-geometry into constituent
  // geometries, and accumulate the supplementary points
  // for each of those constituents
  function processMultiGeometry() {
    const subType = (
      geojson.geometry.type.replace(Constants.geojsonTypes.MULTI_PREFIX, '')
    ) as "Point" | "LineString" | "Polygon";

    (
      geojson.geometry as G.MultiPoint | G.MultiLineString | G.MultiPolygon
    ).coordinates.forEach((subCoordinates, index) => {
      const subFeature: G.Feature = {
        type: Constants.geojsonTypes.FEATURE,
        properties: geojson.properties,
        geometry: {
          type: subType,
          coordinates: subCoordinates
        } as G.Geometry
      };

      supplementaryPoints = supplementaryPoints.concat(createSupplementaryPoints(subFeature, options, `${index}`));
    });
  }

  return supplementaryPoints;
}

export default createSupplementaryPoints;
