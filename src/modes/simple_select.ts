import type * as G from 'geojson';
import * as CommonSelectors from '../lib/common_selectors.ts';
import mouseEventPoint from '../lib/mouse_event_point.ts';
import createSupplementaryPoints from '../lib/create_supplementary_points.ts';
import StringSet from '../lib/string_set.ts';
import {enableDoubleClickZoom, disableDoubleClickZoom} from '../lib/double_click_zoom.ts';
import moveFeatures from '../lib/move_features.ts';
import * as Constants from '../constants.ts';
import ModeInterface from './mode_interface.ts';
import type { MapMouseEvent, MapTouchEvent, Point } from 'maplibre-gl';
import { getFeatureTarget } from '../lib/feature_target.ts';

type State = {
  dragMoveLocation: {lng: number, lat: number} | null,
  boxSelectStartLocation: Point | null,
  boxSelectElement: HTMLElement | undefined,
  boxSelecting: boolean,
  canBoxSelect: boolean,
  dragMoving: boolean,
  canDragMove: boolean,
  initialDragPanState: boolean,
  initiallySelectedFeatureIds: string[],
};

type Opts = {
  featureIds?: string[],
};

export default class SimpleSelect extends ModeInterface<Opts, State> {
  protected onSetup({featureIds}: Opts) {
    // turn the opts into state.
    const state: State = {
      dragMoveLocation: null,
      boxSelectStartLocation: null,
      boxSelectElement: undefined,
      boxSelecting: false,
      canBoxSelect: false,
      dragMoving: false,
      canDragMove: false,
      initialDragPanState: this._ctx.map.dragPan.isEnabled(),
      initiallySelectedFeatureIds: featureIds || []
    }

    this.setSelected(state.initiallySelectedFeatureIds.filter(id => this.getFeature(id) !== undefined));
    this.fireActionable();

    this.setActionableState({
      combineFeatures: true,
      uncombineFeatures: true,
      trash: true
    });

    return state;
  }

  private fireUpdate() {
    this.fire(Constants.events.UPDATE, {
      action: Constants.updateActions.MOVE,
      features: this.getSelected().map(f => f.toGeoJSON())
    });
  }

  private fireActionable() {
    const selectedFeatures = this.getSelected();

    const multiFeatures = selectedFeatures.filter(
      feature => this.isInstanceOf('MultiFeature', feature)
    );

    let combineFeatures = false;

    if (selectedFeatures.length > 1) {
      combineFeatures = true;
      const featureType = selectedFeatures[0].type.replace('Multi', '');
      selectedFeatures.forEach(({type}) => {
        if (type.replace('Multi', '') !== featureType) {
          combineFeatures = false;
        }
      });
    }

    const uncombineFeatures = multiFeatures.length > 0;
    const trash = selectedFeatures.length > 0;

    this.setActionableState({
      combineFeatures, uncombineFeatures, trash
    });
  }

  private getUniqueIds(allFeatures: G.Feature[]) {
    if (!allFeatures.length) return [];
    const ids = allFeatures.map(({properties}) => properties?.id)
      .filter((id): id is string => typeof id === 'string')
      .reduce((memo, id) => {
        memo.add(id);
        return memo;
      }, new StringSet());

    return ids.values();
  }

  private stopExtendedInteractions(state: State) {
    if (state.boxSelectElement) {
      if (state.boxSelectElement.parentNode) state.boxSelectElement.parentNode.removeChild(state.boxSelectElement);
      state.boxSelectElement = undefined;
    }

    if ((state.canDragMove || state.canBoxSelect) && state.initialDragPanState === true) {
      this._ctx.map.dragPan.enable();
    }

    state.boxSelecting = false;
    state.canBoxSelect = false;
    state.dragMoving = false;
    state.canDragMove = false;
  }

  protected override onStop() {
    enableDoubleClickZoom(this);
  }

  protected override onMouseMove(state: State, e: MapMouseEvent) {
    const isFeature = CommonSelectors.isFeature(e);
    if (isFeature && state.dragMoving) this.fireUpdate();

    // On mousemove that is not a drag, stop extended interactions.
    // This is useful if you drag off the canvas, release the button,
    // then move the mouse back over the canvas --- we don't allow the
    // interaction to continue then, but we do let it continue if you held
    // the mouse button that whole time
    this.stopExtendedInteractions(state);

    // Skip render
    return true;
  }

  protected override onMouseOut({dragMoving}: State) {
    // As soon as you mouse leaves the canvas, update the feature
    if (dragMoving) return this.fireUpdate();

    // Skip render
    return true;
  }

  protected override onClick(state: State, e: MapMouseEvent) {
    // Click (with or without shift) on no feature
    if (CommonSelectors.noTarget(e)) return this.clickAnywhere(state); // also tap
    if (CommonSelectors.isOfMetaType(Constants.meta.VERTEX)(e)) return this.clickOnVertex(state, e); //tap
    if (CommonSelectors.isFeature(e)) return this.clickOnFeature(state, e);
  }

  protected override onTap(state: State, e: MapTouchEvent) {
    // Click (with or without shift) on no feature
    if (CommonSelectors.noTarget(e)) return this.clickAnywhere(state); // also tap
    if (CommonSelectors.isOfMetaType(Constants.meta.VERTEX)(e)) return this.clickOnVertex(state, e); //tap
    if (CommonSelectors.isFeature(e)) return this.clickOnFeature(state, e);
  }

  private clickAnywhere (state: State) {
    // Clear the re-render selection
    const wasSelected = this.getSelectedIds();
    if (wasSelected.length) {
      this.clearSelectedFeatures();
      wasSelected.forEach(id => this.doRender(id));
    }
    enableDoubleClickZoom(this);
    this.stopExtendedInteractions(state);
  }

  private clickOnVertex(_: State, e: MapMouseEvent | MapTouchEvent) {
    // Enter direct select mode
    this.changeMode(Constants.modes.DIRECT_SELECT, {
      featureId: getFeatureTarget(e).properties!.parent,
      coordPath: getFeatureTarget(e).properties!.coord_path,
      startPos: e.lngLat
    });
    this.updateUIClasses({ mouse: Constants.cursors.MOVE });
  }

  private startOnActiveFeature(state: State, e: MapMouseEvent | MapTouchEvent) {
    // Stop any already-underway extended interactions
    this.stopExtendedInteractions(state);

    // Disable map.dragPan immediately so it can't start
    this._ctx.map.dragPan.disable();

    // Re-render it and enable drag move
    this.doRender(getFeatureTarget(e).properties!.id);

    // Set up the state for drag moving
    state.canDragMove = true;
    state.dragMoveLocation = e.lngLat;
  }

  private clickOnFeature(state: State, e: MapMouseEvent | MapTouchEvent) {
    // Stop everything
    disableDoubleClickZoom(this);
    this.stopExtendedInteractions(state);

    const isShiftClick = CommonSelectors.isShiftDown(e);
    const selectedFeatureIds = this.getSelectedIds();
    const featureId = getFeatureTarget(e).properties!.id;
    const isFeatureSelected = this.isSelected(featureId);

    // Click (without shift) on any selected feature but a point
    if (!isShiftClick && isFeatureSelected && this.getFeature(featureId)?.type !== Constants.geojsonTypes.POINT) {
      // Enter direct select mode
      return this.changeMode(Constants.modes.DIRECT_SELECT, {
        featureId
      });
    }

    // Shift-click on a selected feature
    if (isFeatureSelected && isShiftClick) {
      // Deselect it
      this.deselect(featureId);
      this.updateUIClasses({ mouse: Constants.cursors.POINTER });
      if (selectedFeatureIds.length === 1) {
        enableDoubleClickZoom(this);
      }
    // Shift-click on an unselected feature
    } else if (!isFeatureSelected && isShiftClick) {
      // Add it to the selection
      this.select(featureId);
      this.updateUIClasses({ mouse: Constants.cursors.MOVE });
    // Click (without shift) on an unselected feature
    } else if (!isFeatureSelected && !isShiftClick) {
      // Make it the only selected feature
      selectedFeatureIds.forEach(id => this.doRender(id));
      this.setSelected(featureId);
      this.updateUIClasses({ mouse: Constants.cursors.MOVE });
    }

    // No matter what, re-render the clicked feature
    this.doRender(featureId);
  }

  protected override onMouseDown(state: State, e: MapMouseEvent) {
    state.initialDragPanState = this._ctx.map.dragPan.isEnabled();
    if (CommonSelectors.isActiveFeature(e)) return this.startOnActiveFeature(state, e);
    if (this._ctx.options.boxSelect && CommonSelectors.isShiftMousedown(e)) return this.startBoxSelect(state, e);
  }

  private startBoxSelect(state: State, {originalEvent}: MapMouseEvent) {
    this.stopExtendedInteractions(state);
    this._ctx.map.dragPan.disable();
    // Enable box select
    state.boxSelectStartLocation = mouseEventPoint(originalEvent, this._ctx.map.getContainer());
    state.canBoxSelect = true;
  }

  protected override onTouchStart(state: State, e: MapTouchEvent) {
    if (CommonSelectors.isActiveFeature(e)) return this.startOnActiveFeature(state, e);
  }

  protected override onDrag(state: State, e: MapMouseEvent) {
    if (state.canDragMove) return this.dragMove(state, e);
    if (this._ctx.options.boxSelect && state.canBoxSelect) return this.whileBoxSelect(state, e);
  }

  private whileBoxSelect(state: State, {originalEvent}: MapMouseEvent) {
    state.boxSelecting = true;
    this.updateUIClasses({ mouse: Constants.cursors.ADD });

    // Create the box node if it doesn't exist
    if (!state.boxSelectElement) {
      state.boxSelectElement = document.createElement('div');
      state.boxSelectElement.classList.add(Constants.classes.BOX_SELECT);
      this._ctx.map.getContainer().appendChild(state.boxSelectElement);
    }

    // Adjust the box node's width and xy position
    const current = mouseEventPoint(originalEvent, this._ctx.map.getContainer());
    const minX = Math.min(state.boxSelectStartLocation!.x, current.x);
    const maxX = Math.max(state.boxSelectStartLocation!.x, current.x);
    const minY = Math.min(state.boxSelectStartLocation!.y, current.y);
    const maxY = Math.max(state.boxSelectStartLocation!.y, current.y);
    const translateValue = `translate(${minX}px, ${minY}px)`;
    state.boxSelectElement.style.transform = translateValue;
    state.boxSelectElement.style.width = `${maxX - minX}px`;
    state.boxSelectElement.style.height = `${maxY - minY}px`;
  }

  private dragMove(state: State, {originalEvent, lngLat}: MapMouseEvent) {
    // Dragging when drag move is enabled
    state.dragMoving = true;
    originalEvent.stopPropagation();

    const delta = {
      lng: lngLat.lng - state.dragMoveLocation!.lng,
      lat: lngLat.lat - state.dragMoveLocation!.lat
    }

    moveFeatures(this.getSelected(), delta);

    state.dragMoveLocation = lngLat;
  }

  protected override onMouseUp(state: State, {originalEvent}: MapMouseEvent) {
    // End any extended interactions
    if (state.dragMoving) {
      this.fireUpdate();
    } else if (state.boxSelecting) {
      const featuresInBox = this.featuresAt(undefined, [
          state.boxSelectStartLocation!,
          mouseEventPoint(originalEvent, this._ctx.map.getContainer())
        ], 'click');
      const idsToSelect = this.getUniqueIds(featuresInBox)
        .filter(id => !this.isSelected(id));

      if (idsToSelect.length) {
        this.select(idsToSelect);
        idsToSelect.forEach(id => this.doRender(id));
        this.updateUIClasses({ mouse: Constants.cursors.MOVE });
      }
    }
    this.stopExtendedInteractions(state);
  }

  protected override onTouchEnd(state: State) {
    // End any extended interactions
    if (state.dragMoving) {
      this.fireUpdate();
    }

    this.stopExtendedInteractions(state);
  }

  protected toDisplayFeatures(_state: State, geojson: G.Feature, display: (geojson: G.Feature) => void) {
    geojson.properties ??= {};
    geojson.properties.active = (this.isSelected(geojson.properties.id)) ?
      Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
    display(geojson);
    this.fireActionable();
    if (geojson.properties.active !== Constants.activeStates.ACTIVE ||
      geojson.geometry.type === Constants.geojsonTypes.POINT) return;
    createSupplementaryPoints(geojson).forEach(display);
  }

  protected override onTrash() {
    this.deleteFeature(this.getSelectedIds());
    this.fireActionable();
  }

  protected override onCombineFeature() {
    const selectedFeatures = this.getSelected();

    if (selectedFeatures.length === 0 || selectedFeatures.length < 2) return;

    const coordinates = [];
    const featuresCombined = [];
    const featureType = selectedFeatures[0].type.replace('Multi', '');

    for (const feature of selectedFeatures) {
      if (feature.type.replace('Multi', '') !== featureType) {
        return;
      }
      if (feature.type.includes('Multi')) {
        feature.getCoordinates()?.forEach((subcoords) => {
          coordinates.push(subcoords);
        });
      } else {
        coordinates.push(feature.getCoordinates());
      }

      featuresCombined.push(feature.toGeoJSON());
    }

    if (featuresCombined.length > 1) {
      const multiFeature = this.newFeature({
        type: Constants.geojsonTypes.FEATURE,
        properties: featuresCombined[0].properties,
        geometry: {
          type: `Multi${featureType}`,
          coordinates
        } as G.Geometry
      });

      this.addFeature(multiFeature);
      this.deleteFeature(this.getSelectedIds(), { silent: true });
      this.setSelected([multiFeature.id]);

      this.fire(Constants.events.COMBINE_FEATURES, {
        createdFeatures: [multiFeature.toGeoJSON()],
        deletedFeatures: featuresCombined
      });
    }
    this.fireActionable();
  }

  protected override onUncombineFeature() {
    const selectedFeatures = this.getSelected();
    if (selectedFeatures.length === 0) return;

    const createdFeatures: G.Feature[] = [];
    const featuresUncombined: G.Feature[] = [];

    for (const feature of selectedFeatures) {
      if (this.isInstanceOf('MultiFeature', feature)) {
        feature.getFeatures().forEach((subFeature) => {
          this.addFeature(subFeature);
          subFeature.properties = feature.properties;
          createdFeatures.push(subFeature.toGeoJSON());
          this.select(subFeature.id);
        });
        this.deleteFeature(feature.id, { silent: true });
        featuresUncombined.push(feature.toGeoJSON());
      }
    }

    if (createdFeatures.length > 1) {
      this.fire(Constants.events.UNCOMBINE_FEATURES, {
        createdFeatures,
        deletedFeatures: featuresUncombined
      });
    }
    this.fireActionable();
  }
}
