import * as G from 'geojson';
import * as CommonSelectors from '../lib/common_selectors.js';
import {enableDoubleClickZoom, disableDoubleClickZoom} from '../lib/double_click_zoom.js';
import * as Constants from '../constants.js';
import isEventAtCoordinates from '../lib/is_event_at_coordinates.js';
import createVertex from '../lib/create_vertex.js';
import ModeInterface from './mode_interface.js';
import type { MapMouseEvent, MapTouchEvent } from 'maplibre-gl';
import type Polygon from '../feature_types/polygon.js';

type State = {
  polygon: Polygon,
  currentVertexPosition: number,
};

export default class DrawPolygon extends ModeInterface<{}, State> {
  onSetup(): State {
    const polygon = this.newFeature({
      type: Constants.geojsonTypes.FEATURE,
      properties: {},
      geometry: {
        type: Constants.geojsonTypes.POLYGON,
        coordinates: [[]]
      }
    }) as Polygon;

    this.addFeature(polygon);

    this.clearSelectedFeatures();
    disableDoubleClickZoom(this);
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    this.activateUIButton(Constants.types.POLYGON);
    this.setActionableState({
      trash: true
    });

    return {
      polygon,
      currentVertexPosition: 0
    };
  }

  clickAnywhere(state: State, e: MapMouseEvent | MapTouchEvent) {
    if (state.currentVertexPosition > 0 && isEventAtCoordinates(e, state.polygon.coordinates[0][state.currentVertexPosition - 1])) {
      return this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [state.polygon.id] });
    }
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    state.polygon.updateCoordinate(`0.${state.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
    state.currentVertexPosition++;
    state.polygon.updateCoordinate(`0.${state.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
  }

  clickOnVertex({polygon}: State) {
    return this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [polygon.id] });
  }

  override onMouseMove({polygon, currentVertexPosition}: State, e: MapMouseEvent) {
    polygon.updateCoordinate(`0.${currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
    if (CommonSelectors.isVertex(e)) {
      this.updateUIClasses({ mouse: Constants.cursors.POINTER });
    }
  }

  override onClick(state: State, e: MapMouseEvent) {
    if (CommonSelectors.isVertex(e)) return this.clickOnVertex(state);
    return this.clickAnywhere(state, e);
  }

  override onTap(state: State, e: MapTouchEvent) {
    if (CommonSelectors.isVertex(e)) return this.clickOnVertex(state);
    return this.clickAnywhere(state, e);
  }

  override onKeyUp({polygon}: State, e: KeyboardEvent) {
    if (CommonSelectors.isEscapeKey(e)) {
      this.deleteFeature([polygon.id], { silent: true });
      this.changeMode(Constants.modes.SIMPLE_SELECT);
    } else if (CommonSelectors.isEnterKey(e)) {
      this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [polygon.id] });
    }
  }

  override onStop({polygon, currentVertexPosition}: State) {
    this.updateUIClasses({ mouse: Constants.cursors.NONE });
    enableDoubleClickZoom(this);
    this.activateUIButton();

    // check to see if we've deleted this feature
    if (this.getFeature(polygon.id) === undefined) return;

    //remove last added coordinate
    polygon.removeCoordinate(`0.${currentVertexPosition}`);
    if (polygon.isValid()) {
      this.fire(Constants.events.CREATE, {
        features: [polygon.toGeoJSON()]
      });
    } else {
      this.deleteFeature([polygon.id], { silent: true });
      this.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
    }
  }

  toDisplayFeatures({polygon}: State, geojson: G.Feature, display: (geojson: G.Feature) => void) {
    if (geojson.geometry.type !== 'Polygon') return;
    geojson.properties ??= {};

    const isActivePolygon = geojson.properties.id === polygon.id;
    geojson.properties.active = (isActivePolygon) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
    if (!isActivePolygon) return display(geojson);

    // Don't render a polygon until it has two positions
    // (and a 3rd which is just the first repeated)
    if (geojson.geometry.coordinates.length === 0) return;

    const coordinateCount = geojson.geometry.coordinates[0].length;
    // 2 coordinates after selecting a draw type
    // 3 after creating the first point
    if (coordinateCount < 3) {
      return;
    }
    geojson.properties.meta = Constants.meta.FEATURE;
    display(createVertex(polygon.id, geojson.geometry.coordinates[0][0], '0.0', false));
    if (coordinateCount > 3) {
      // Add a start position marker to the map, clicking on this will finish the feature
      // This should only be shown when we're in a valid spot
      const endPos = geojson.geometry.coordinates[0].length - 3;
      display(createVertex(polygon.id, geojson.geometry.coordinates[0][endPos], `0.${endPos}`, false));
    }
    if (coordinateCount <= 4) {
      // If we've only drawn two positions (plus the closer),
      // make a LineString instead of a Polygon
      const lineCoordinates = [
        [geojson.geometry.coordinates[0][0][0], geojson.geometry.coordinates[0][0][1]], [geojson.geometry.coordinates[0][1][0], geojson.geometry.coordinates[0][1][1]]
      ];
      // create an initial vertex so that we can track the first point on mobile devices
      display({
        type: Constants.geojsonTypes.FEATURE,
        properties: geojson.properties,
        geometry: {
          coordinates: lineCoordinates,
          type: Constants.geojsonTypes.LINE_STRING
        }
      });
      if (coordinateCount === 3) {
        return;
      }
    }
    // render the Polygon
    return display(geojson);
  }

  override onTrash({polygon}: State) {
    this.deleteFeature([polygon.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  }
}
