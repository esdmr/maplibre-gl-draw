import type * as G from 'geojson';
import * as CommonSelectors from '../lib/common_selectors.js';
import isEventAtCoordinates from '../lib/is_event_at_coordinates.js';
import {enableDoubleClickZoom, disableDoubleClickZoom} from '../lib/double_click_zoom.js';
import * as Constants from '../constants.js';
import createVertex from '../lib/create_vertex.js';
import ModeInterface from './mode_interface.js';
import LineString from '../feature_types/line_string.js';
import type Feature from '../feature_types/feature.js';
import type { MapMouseEvent, MapTouchEvent } from 'maplibre-gl';

type State = {
  line: LineString,
  currentVertexPosition: number,
  direction: 'forward' | 'backwards',
};

type Opts = {
  featureId?: string;
  from?: G.Feature<G.Point> | G.Point | G.Position;
};

export default class DrawLineString extends ModeInterface<Opts, State> {
  onSetup({featureId, from}: Opts): State {
    let line: Feature<any> | undefined;
    let currentVertexPosition;
    let direction: 'forward' | 'backwards' = 'forward';

    if (featureId) {
      line = this.getFeature(featureId);

      if (!line || !(line instanceof LineString)) {
        throw new Error('Could not find a feature with the provided featureId');
      }

      let position;

      if (Array.isArray(from)) {
        position = from;
      } else if (from && from.type === 'Feature' && from.geometry && from.geometry.type === 'Point') {
        position = from.geometry.coordinates;
      } else if (from && from.type === 'Point' && from.coordinates && from.coordinates.length === 2) {
        position = from.coordinates;
      }

      if (!position) {
        throw new Error('Please use the `from` property to indicate which point to continue the line from');
      }

      const lastCoord = line.coordinates.length - 1;

      if (line.coordinates[lastCoord][0] === position[0] && line.coordinates[lastCoord][1] === position[1]) {
        currentVertexPosition = lastCoord + 1;
        // add one new coordinate to continue from
        line.addCoordinate(`${currentVertexPosition}`, line.coordinates[lastCoord][0], line.coordinates[lastCoord][1]);
      } else if (line.coordinates[0][0] === position[0] && line.coordinates[0][1] === position[1]) {
        direction = 'backwards';
        currentVertexPosition = 0;
        // add one new coordinate to continue from
        line.addCoordinate(`${currentVertexPosition}`, line.coordinates[lastCoord][0], line.coordinates[lastCoord][1]);
      } else {
        throw new Error('`from` should match the point at either the start or the end of the provided LineString');
      }
    } else {
      line = this.newFeature({
        type: Constants.geojsonTypes.FEATURE,
        properties: {},
        geometry: {
          type: Constants.geojsonTypes.LINE_STRING,
          coordinates: []
        }
      });

      currentVertexPosition = 0;
      this.addFeature(line);
    }

    this.clearSelectedFeatures();
    disableDoubleClickZoom(this);
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    this.activateUIButton(Constants.types.LINE);
    this.setActionableState({
      trash: true
    });

    return {
      line: line as LineString,
      currentVertexPosition,
      direction
    };
  }

  private clickAnywhere(state: State, e: MapMouseEvent | MapTouchEvent) {
    if (state.currentVertexPosition > 0 && isEventAtCoordinates(e, state.line.coordinates[state.currentVertexPosition - 1]) ||
        state.direction === 'backwards' && isEventAtCoordinates(e, state.line.coordinates[state.currentVertexPosition + 1])) {
      return this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [state.line.id] });
    }
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    state.line.updateCoordinate(`${state.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
    if (state.direction === 'forward') {
      state.currentVertexPosition++;
      state.line.updateCoordinate(`${state.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
    } else {
      state.line.addCoordinate('0', e.lngLat.lng, e.lngLat.lat);
    }
  }

  private clickOnVertex({line}: State) {
    return this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [line.id] });
  }

  protected override onMouseMove({line, currentVertexPosition}: State, e: MapMouseEvent) {
    line.updateCoordinate(`${currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
    if (CommonSelectors.isVertex(e)) {
      this.updateUIClasses({ mouse: Constants.cursors.POINTER });
    }
  }

  protected override onClick(state: State, e: MapMouseEvent) {
    if (CommonSelectors.isVertex(e)) return this.clickOnVertex(state);
    this.clickAnywhere(state, e);
  }

  protected override onTap(state: State, e: MapTouchEvent) {
    if (CommonSelectors.isVertex(e)) return this.clickOnVertex(state);
    this.clickAnywhere(state, e);
  }

  protected override onKeyUp({line}: State, e: KeyboardEvent) {
    if (CommonSelectors.isEnterKey(e)) {
      this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [line.id] });
    } else if (CommonSelectors.isEscapeKey(e)) {
      this.deleteFeature([line.id], { silent: true });
      this.changeMode(Constants.modes.SIMPLE_SELECT);
    }
  }

  protected override onStop({line, currentVertexPosition}: State) {
    enableDoubleClickZoom(this);
    this.activateUIButton();

    // check to see if we've deleted this feature
    if (this.getFeature(line.id) === undefined) return;

    //remove last added coordinate
    line.removeCoordinate(`${currentVertexPosition}`);
    if (line.isValid()) {
      this.fire(Constants.events.CREATE, {
        features: [line.toGeoJSON()]
      });
    } else {
      this.deleteFeature([line.id], { silent: true });
      this.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
    }
  }

  protected override onTrash({line}: State) {
    this.deleteFeature([line.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  }

  protected toDisplayFeatures({line, direction}: State, geojson: G.Feature, display: (geojson: G.Feature) => void) {
    if (geojson.geometry.type !== 'LineString') return;

    geojson.properties ??= {};
    const isActiveLine = geojson.properties.id === line.id;
    geojson.properties.active = (isActiveLine) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
    if (!isActiveLine) return display(geojson);
    // Only render the line if it has at least one real coordinate
    if (geojson.geometry.coordinates.length < 2) return;
    geojson.properties.meta = Constants.meta.FEATURE;
    display(createVertex(
      line.id,
      geojson.geometry.coordinates[direction === 'forward' ? geojson.geometry.coordinates.length - 2 : 1],
      `${direction === 'forward' ? geojson.geometry.coordinates.length - 2 : 1}`,
      false
    ));

    display(geojson);
  }
}
