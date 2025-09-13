import type * as G from 'geojson';
import { noTarget, isOfMetaType, isActiveFeature, isInactiveFeature, isShiftDown } from '../lib/common_selectors.ts';
import createSupplementaryPoints from '../lib/create_supplementary_points.ts';
import constrainFeatureMovement from '../lib/constrain_feature_movement.ts';
import {disableDoubleClickZoom, enableDoubleClickZoom} from '../lib/double_click_zoom.ts';
import * as Constants from '../constants.ts';
import moveFeatures from '../lib/move_features.ts';
import ModeInterface from './mode_interface.ts';
import type Feature from '../feature_types/feature.ts';
import type { MapMouseEvent, MapTouchEvent } from 'maplibre-gl';
import { getFeatureTarget } from '../lib/feature_target.ts';

const isVertex = isOfMetaType(Constants.meta.VERTEX);
const isMidpoint = isOfMetaType(Constants.meta.MIDPOINT);

type State = {
  featureId: string;
  feature: Feature<any>;
  dragMoveLocation: {
    lng: number;
    lat: number;
  } | null;
  dragMoving: boolean;
  canDragMove: boolean;
  initialDragPanState: boolean | null;
  selectedCoordPaths: string[];
};

type Opts = {
  featureId: string;
  startPos?: {
    lng: number;
    lat: number;
  };
  coordPath?: string;
};

export default class DirectSelect extends ModeInterface<Opts, State> {
  protected onSetup(opts: Opts) {
    const featureId = opts.featureId;
    const feature = this.getFeature(featureId);

    if (!feature) {
      throw new Error('You must provide a featureId to enter direct_select mode');
    }

    if (feature.type === Constants.geojsonTypes.POINT) {
      throw new TypeError('direct_select mode doesn\'t handle point features');
    }

    const state: State = {
      featureId,
      feature,
      dragMoveLocation: opts.startPos || null,
      dragMoving: false,
      canDragMove: false,
      initialDragPanState: null,
      selectedCoordPaths: opts.coordPath ? [opts.coordPath] : [],
    }

    this.setSelectedCoordinates(this.pathsToCoordinates(featureId, state.selectedCoordPaths));
    this.setSelected([featureId]);
    disableDoubleClickZoom(this);

    this.setActionableState({
      trash: true
    });

    return state;
  }

  protected override onStop() {
    enableDoubleClickZoom(this);
    this.clearSelectedCoordinates();
  }

  protected toDisplayFeatures(state: State, geojson: G.Feature, push: (geojson: G.Feature) => void) {
    if (state.featureId === geojson.properties?.id) {
      geojson.properties.active = Constants.activeStates.ACTIVE;
      push(geojson);
      createSupplementaryPoints(geojson, {
        midpoints: true,
        selectedPaths: state.selectedCoordPaths
      }).forEach(push);
    } else {
      geojson.properties ??= {};
      geojson.properties.active = Constants.activeStates.INACTIVE;
      push(geojson);
    }
    this.fireActionable(state);
  }

  protected override onTrash(state: State) {
    // Uses number-aware sorting to make sure '9' < '10'. Comparison is reversed because we want them
    // in reverse order so that we can remove by index safely.
    state.selectedCoordPaths
      .sort((a, b) => b.localeCompare(a, 'en', { numeric: true }))
      .forEach(id => state.feature.removeCoordinate(id));
    this.fireUpdate();
    state.selectedCoordPaths = [];
    this.clearSelectedCoordinates();
    this.fireActionable(state);
    if (state.feature.isValid() === false) {
      this.deleteFeature(state.featureId);
      this.changeMode(Constants.modes.SIMPLE_SELECT, {});
    }
  }

  protected override onMouseMove(state: State, e: MapMouseEvent) {
    // On mousemove that is not a drag, stop vertex movement.
    const isFeature = isActiveFeature(e);
    const onVertex = isVertex(e);
    const isMidPoint = isMidpoint(e);
    const noCoords = state.selectedCoordPaths.length === 0;
    if (isFeature && noCoords) this.updateUIClasses({ mouse: Constants.cursors.MOVE });
    else if (onVertex && !noCoords) this.updateUIClasses({ mouse: Constants.cursors.MOVE });
    else this.updateUIClasses({ mouse: Constants.cursors.NONE });

    const isDraggableItem = onVertex || isFeature || isMidPoint;
    if (isDraggableItem && state.dragMoving) this.fireUpdate();

    this.stopDragging(state);

    // Skip render
    return true;
  }

  protected override onMouseOut({dragMoving}: State) {
    // As soon as you mouse leaves the canvas, update the feature
    if (dragMoving) this.fireUpdate();

    // Skip render
    return true;
  }

  protected override onMouseDown(state: State, e: MapMouseEvent) {
    if (isVertex(e)) return this.onVertex(state, e);
    if (isActiveFeature(e)) return this.onFeature(state, e);
    if (isMidpoint(e)) return this.onMidpoint(state, e);
  }

  protected override onTouchStart(state: State, e: MapTouchEvent) {
    if (isVertex(e)) return this.onVertex(state, e);
    if (isActiveFeature(e)) return this.onFeature(state, e);
    if (isMidpoint(e)) return this.onMidpoint(state, e);
  }

  protected override onDrag(state: State, e: MapMouseEvent) {
    if (state.canDragMove !== true) return;
    state.dragMoving = true;
    e.originalEvent.stopPropagation();

    const delta = {
      lng: e.lngLat.lng - state.dragMoveLocation!.lng,
      lat: e.lngLat.lat - state.dragMoveLocation!.lat
    };
    if (state.selectedCoordPaths.length > 0) this.dragVertex(state, e, delta);
    else this.dragFeature(state, e, delta);

    state.dragMoveLocation = e.lngLat;
  }

  protected override onClick(state: State, e: MapMouseEvent) {
    if (noTarget(e)) return this.clickNoTarget();
    if (isActiveFeature(e)) return this.clickActiveFeature(state);
    if (isInactiveFeature(e)) return this.clickInactive();
    this.stopDragging(state);
  }

  protected override onTap(state: State, e: MapTouchEvent) {
    if (noTarget(e)) return this.clickNoTarget();
    if (isActiveFeature(e)) return this.clickActiveFeature(state);
    if (isInactiveFeature(e)) return this.clickInactive();
  }

  protected override onMouseUp(state: State) {
    if (state.dragMoving) {
      this.fireUpdate();
    }
    this.stopDragging(state);
  }

  protected override onTouchEnd(state: State) {
    if (state.dragMoving) {
      this.fireUpdate();
    }
    this.stopDragging(state);
  }

  private fireUpdate() {
    this.fire(Constants.events.UPDATE, {
      action: Constants.updateActions.CHANGE_COORDINATES,
      features: this.getSelected().map(f => f.toGeoJSON())
    });
  }

  private fireActionable({selectedCoordPaths}: State) {
    this.setActionableState({
      combineFeatures: false,
      uncombineFeatures: false,
      trash: selectedCoordPaths.length > 0
    });
  }

  private startDragging(state: State, {lngLat}: MapMouseEvent | MapTouchEvent) {
    if (state.initialDragPanState == null) {
      state.initialDragPanState = this._ctx.map.dragPan.isEnabled();
    }

    this._ctx.map.dragPan.disable();
    state.canDragMove = true;
    state.dragMoveLocation = lngLat;
  }

  private stopDragging(state: State) {
    if (state.canDragMove && state.initialDragPanState === true) {
      this._ctx.map.dragPan.enable();
    }

    state.initialDragPanState = null;
    state.dragMoving = false;
    state.canDragMove = false;
    state.dragMoveLocation = null;
  }

  private onVertex(state: State, e: MapTouchEvent | MapMouseEvent) {
    this.startDragging(state, e);
    const about = getFeatureTarget(e).properties!;
    const selectedIndex = state.selectedCoordPaths.indexOf(about.coord_path);
    if (!isShiftDown(e) && selectedIndex === -1) {
      state.selectedCoordPaths = [about.coord_path];
    } else if (isShiftDown(e) && selectedIndex === -1) {
      state.selectedCoordPaths.push(about.coord_path);
    }

    const selectedCoordinates = this.pathsToCoordinates(state.featureId, state.selectedCoordPaths);
    this.setSelectedCoordinates(selectedCoordinates);
  }

  private onMidpoint(state: State, e: MapTouchEvent | MapMouseEvent) {
    this.startDragging(state, e);
    const about = getFeatureTarget(e).properties!;
    state.feature.addCoordinate(about.coord_path, about.lng, about.lat);
    this.fireUpdate();
    state.selectedCoordPaths = [about.coord_path];
  }

  private pathsToCoordinates(featureId: string, paths: string[]) {
    return paths.map(coord_path => ({ feature_id: featureId, coord_path }));
  }

  private onFeature(state: State, e: MapTouchEvent | MapMouseEvent) {
    if (state.selectedCoordPaths.length === 0) this.startDragging(state, e);
    else this.stopDragging(state);
  }

  private dragFeature(state: State, {lngLat}: MapTouchEvent | MapMouseEvent, delta: {lng: number, lat: number}) {
    moveFeatures(this.getSelected(), delta);
    state.dragMoveLocation = lngLat;
  }

  private dragVertex({selectedCoordPaths, feature}: State, _e: MapTouchEvent | MapMouseEvent, delta: {lng: number, lat: number}) {
    const selectedCoords = selectedCoordPaths.map(coord_path => feature.getCoordinate(coord_path));
    const selectedCoordPoints = selectedCoords.map<G.Feature<G.Point>>(coords => ({
      type: Constants.geojsonTypes.FEATURE,
      properties: {},
      geometry: {
        type: Constants.geojsonTypes.POINT,
        coordinates: coords
      }
    }));

    const constrainedDelta = constrainFeatureMovement(selectedCoordPoints, delta);

    for (const [i, coord] of selectedCoords.entries()) {
      feature.updateCoordinate(selectedCoordPaths[i], coord[0] + constrainedDelta.lng, coord[1] + constrainedDelta.lat);
    }
  }

  private clickNoTarget() {
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  }

  private clickInactive() {
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  }

  private clickActiveFeature(state: State) {
    state.selectedCoordPaths = [];
    this.clearSelectedCoordinates();
    state.feature.changed();
  }
}
