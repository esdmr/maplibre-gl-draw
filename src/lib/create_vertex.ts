import type * as G from 'geojson';
import * as Constants from '../constants.ts';

/**
 * Returns GeoJSON for a Point representing the
 * vertex of another feature.
 *
 * @param parentId
 * @param coordinates
 * @param path - Dot-separated numbers indicating exactly
 *   where the point exists within its parent feature's coordinates.
 * @param selected
 * @return Point
 */

export default function(parentId: string | number, coordinates: G.Position, path: string | null, selected: boolean): G.Feature<G.Point> {
  return {
    type: Constants.geojsonTypes.FEATURE,
    properties: {
      meta: Constants.meta.VERTEX,
      parent: parentId,
      coord_path: path,
      active: (selected) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE
    },
    geometry: {
      type: Constants.geojsonTypes.POINT,
      coordinates
    }
  };
}
