import * as CommonSelectors from '../lib/common_selectors.js';
import * as Constants from '../constants.js';

const DrawPoint = {};

DrawPoint.onSetup = function() {
  const point = this.newFeature({
    type: Constants.geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      type: Constants.geojsonTypes.POINT,
      coordinates: []
    }
  });

  this.addFeature(point);

  this.clearSelectedFeatures();
  this.updateUIClasses({ mouse: Constants.cursors.ADD });
  this.activateUIButton(Constants.types.POINT);

  this.setActionableState({
    trash: true
  });

  return { point };
};

DrawPoint.stopDrawingAndRemove = function({point}) {
  this.deleteFeature([point.id], { silent: true });
  this.changeMode(Constants.modes.SIMPLE_SELECT);
};

DrawPoint.onTap = DrawPoint.onClick = function({point}, {lngLat}) {
  this.updateUIClasses({ mouse: Constants.cursors.MOVE });
  point.updateCoordinate('', lngLat.lng, lngLat.lat);
  this.fire(Constants.events.CREATE, {
    features: [point.toGeoJSON()]
  });
  this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [point.id] });
};

DrawPoint.onStop = function({point}) {
  this.activateUIButton();
  if (!point.getCoordinate().length) {
    this.deleteFeature([point.id], { silent: true });
  }
};

DrawPoint.toDisplayFeatures = ({point}, geojson, display) => {
  // Never render the point we're drawing
  const isActivePoint = geojson.properties.id === point.id;
  geojson.properties.active = (isActivePoint) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
  if (!isActivePoint) return display(geojson);
};

DrawPoint.onTrash = DrawPoint.stopDrawingAndRemove;

DrawPoint.onKeyUp = function(state, e) {
  if (CommonSelectors.isEscapeKey(e) || CommonSelectors.isEnterKey(e)) {
    return this.stopDrawingAndRemove(state);
  }
};

export default DrawPoint;
