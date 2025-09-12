import type * as G from 'geojson';
import * as CommonSelectors from '../lib/common_selectors.js';
import * as Constants from '../constants.js';
import ModeInterface from './mode_interface.js';
import type Point from '../feature_types/point.js';
import type { MapMouseEvent, MapTouchEvent } from 'maplibre-gl';

type State = {
  point: Point,
};

export default class DrawPoint extends ModeInterface<{}, State> {
  protected onSetup() {
    const point = this.newFeature({
      type: Constants.geojsonTypes.FEATURE,
      properties: {},
      geometry: {
        type: Constants.geojsonTypes.POINT,
        coordinates: []
      }
    }) as Point;

    this.addFeature(point);

    this.clearSelectedFeatures();
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    this.activateUIButton(Constants.types.POINT);

    this.setActionableState({
      trash: true
    });

    return { point };
  }

  private stopDrawingAndRemove({point}: State) {
    this.deleteFeature([point.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  }

  protected override onClick({point}: State, {lngLat}: MapMouseEvent) {
    this.updateUIClasses({ mouse: Constants.cursors.MOVE });
    point.updateCoordinate('', lngLat.lng, lngLat.lat);
    this.fire(Constants.events.CREATE, {
      features: [point.toGeoJSON()]
    });
    this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [point.id] });
  }

  protected override onTap({point}: State, {lngLat}: MapTouchEvent) {
    this.updateUIClasses({ mouse: Constants.cursors.MOVE });
    point.updateCoordinate('', lngLat.lng, lngLat.lat);
    this.fire(Constants.events.CREATE, {
      features: [point.toGeoJSON()]
    });
    this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [point.id] });
  }

  protected override onStop({point}: State) {
    this.activateUIButton();
    if (!point.getCoordinate('').length) {
      this.deleteFeature([point.id], { silent: true });
    }
  }

  protected toDisplayFeatures({point}: State, geojson: G.Feature, display: (geojson: G.Feature) => void) {
    if (geojson.geometry.type !== 'Point') return;

    // Never render the point we're drawing
    geojson.properties ??= {};
    const isActivePoint = geojson.properties.id === point.id;
    geojson.properties.active = (isActivePoint) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
    if (!isActivePoint) return display(geojson);
  }

  protected override onTrash(state: State): void {
    this.stopDrawingAndRemove(state);
  }

  override onKeyUp(state: State, e: KeyboardEvent) {
    if (CommonSelectors.isEscapeKey(e) || CommonSelectors.isEnterKey(e)) {
      return this.stopDrawingAndRemove(state);
    }
  }
}
