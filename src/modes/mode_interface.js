import * as Constants from '../constants.js';
import featuresAt from '../lib/features_at.js';
import Point from '../feature_types/point.js';
import LineString from '../feature_types/line_string.js';
import Polygon from '../feature_types/polygon.js';
import MultiFeature from '../feature_types/multi_feature.js';

export default class ModeInterface {
 constructor(ctx) {
   this.map = ctx.map;
   this.drawConfig = JSON.parse(JSON.stringify(ctx.options || {}));
   this._ctx = ctx;
 }

 /**
  * Sets Draw's interal selected state
  * @name this.setSelected
  * @param {import('../feature_types/feature.js').default[]} features - whats selected as a [DrawFeature](https://github.com/esdmr/maplibre-gl-draw/blob/main/src/feature_types/feature.js)
  */
 setSelected(features) {
   return this._ctx.store.setSelected(features);
 }

 /**
  * Sets Draw's internal selected coordinate state
  * @name this.setSelectedCoordinates
  * @param {Object[]} coords - a array of {coord_path: 'string', feature_id: 'string'}
  */
 setSelectedCoordinates(coords) {
   this._ctx.store.setSelectedCoordinates(coords);
   coords.reduce((m, {feature_id}) => {
     if (m[feature_id] === undefined) {
       m[feature_id] = true;
       this._ctx.store.get(feature_id).changed();
     }
     return m;
   }, {});
 }

 /**
  * Get all selected features as a [DrawFeature](https://github.com/esdmr/maplibre-gl-draw/blob/main/src/feature_types/feature.js)
  * @name this.getSelected
  * @returns {import('../feature_types/feature.js').default[]}
  */
 getSelected() {
   return this._ctx.store.getSelected();
 }

 /**
  * Get the ids of all currently selected features
  * @name this.getSelectedIds
  * @returns {String[]}
  */
 getSelectedIds() {
   return this._ctx.store.getSelectedIds();
 }

 /**
  * Check if a feature is selected
  * @name this.isSelected
  * @param {String} id - a feature id
  * @returns {Boolean}
  */
 isSelected(id) {
   return this._ctx.store.isSelected(id);
 }

 /**
  * Get a [DrawFeature](https://github.com/esdmr/maplibre-gl-draw/blob/main/src/feature_types/feature.js) by its id
  * @name this.getFeature
  * @param {String} id - a feature id
  * @returns {import('../feature_types/feature.js').default}
  */
 getFeature(id) {
   return this._ctx.store.get(id);
 }

 /**
  * Add a feature to draw's internal selected state
  * @name this.select
  * @param {String} id
  */
 select(id) {
   return this._ctx.store.select(id);
 }

 /**
  * Remove a feature from draw's internal selected state
  * @name this.delete
  * @param {String} id
  */
 deselect(id) {
   return this._ctx.store.deselect(id);
 }

 /**
  * Delete a feature from draw
  * @name this.deleteFeature
  * @param {String} id - a feature id
  */
 deleteFeature(id, opts = {}) {
   return this._ctx.store.delete(id, opts);
 }

 /**
  * Add a [DrawFeature](https://github.com/esdmr/maplibre-gl-draw/blob/main/src/feature_types/feature.js) to draw.
  * See `this.newFeature` for converting geojson into a DrawFeature
  * @name this.addFeature
  * @param {import('../feature_types/feature.js').default} feature - the feature to add
  */
 addFeature(feature, opts = {}) {
   return this._ctx.store.add(feature, opts);
 }

 /**
  * Clear all selected features
  */
 clearSelectedFeatures() {
   return this._ctx.store.clearSelected();
 }

 /**
  * Clear all selected coordinates
  */
 clearSelectedCoordinates() {
   return this._ctx.store.clearSelectedCoordinates();
 }

 /**
  * Indicate if the different action are currently possible with your mode
  * See [draw.actionalbe](https://github.com/esdmr/maplibre-gl-draw/blob/main/API.md#drawactionable) for a list of possible actions. All undefined actions are set to **false** by default
  * @name this.setActionableState
  * @param {Object} actions
  */
 setActionableState(actions = {}) {
   const newSet = {
     trash: actions.trash || false,
     combineFeatures: actions.combineFeatures || false,
     uncombineFeatures: actions.uncombineFeatures || false
   };
   return this._ctx.events.actionable(newSet);
 }

 /**
  * Trigger a mode change
  * @name this.changeMode
  * @param {String} mode - the mode to transition into
  * @param {Object} opts - the options object to pass to the new mode
  * @param {Object} eventOpts - used to control what kind of events are emitted.
  */
 changeMode(mode, opts = {}, eventOpts = {}) {
   return this._ctx.events.changeMode(mode, opts, eventOpts);
 }

 /**
  * Fire a map event
  * @name this.fire
  * @param {String} eventName - the event name.
  * @param {Object} eventData - the event data object.
  */
 fire(eventName, eventData) {
   return this._ctx.events.fire(eventName, eventData);
 }

 /**
  * Update the state of draw map classes
  * @name this.updateUIClasses
  * @param {Object} opts
  */
 updateUIClasses(opts) {
   return this._ctx.ui.queueMapClasses(opts);
 }

 /**
  * If a name is provided it makes that button active, else if makes all buttons inactive
  * @name this.activateUIButton
  * @param {String?} name - name of the button to make active, leave as undefined to set buttons to be inactive
  */
 activateUIButton(name) {
   return this._ctx.ui.setActiveButton(name);
 }

 /**
  * Get the features at the location of an event object or in a bbox
  * @name this.featuresAt
  * @param {Event | null} event - a maplibre-gl event object
  * @param {import('maplibre-gl').LngLatBoundsLike | null} bbox - the area to get features from
  * @param {String} bufferType - is this `click` or `tap` event, defaults to click
  */
 featuresAt(event, bbox, bufferType = 'click') {
   if (bufferType !== 'click' && bufferType !== 'touch') throw new Error('invalid buffer type');
   return featuresAt[bufferType](event, bbox, this._ctx);
 }

 /**
  * Create a new [DrawFeature](https://github.com/esdmr/maplibre-gl-draw/blob/main/src/feature_types/feature.js) from geojson
  * @name this.newFeature
  * @param {import('geojson').Feature} geojson
  * @returns {import('../feature_types/feature.js').default}
  */
 newFeature(geojson) {
   const type = geojson.geometry.type;
   if (type === Constants.geojsonTypes.POINT) return new Point(this._ctx, geojson);
   if (type === Constants.geojsonTypes.LINE_STRING) return new LineString(this._ctx, geojson);
   if (type === Constants.geojsonTypes.POLYGON) return new Polygon(this._ctx, geojson);
   return new MultiFeature(this._ctx, geojson);
 }

 /**
  * Check is an object is an instance of a [DrawFeature](https://github.com/esdmr/maplibre-gl-draw/blob/main/src/feature_types/feature.js)
  * @name this.isInstanceOf
  * @param {String} type - `Point`, `LineString`, `Polygon`, `MultiFeature`
  * @param {Object} feature - the object that needs to be checked
  * @returns {Boolean}
  */
 isInstanceOf(type, feature) {
   if (type === Constants.geojsonTypes.POINT) return feature instanceof Point;
   if (type === Constants.geojsonTypes.LINE_STRING) return feature instanceof LineString;
   if (type === Constants.geojsonTypes.POLYGON) return feature instanceof Polygon;
   if (type === 'MultiFeature') return feature instanceof MultiFeature;
   throw new Error(`Unknown feature class: ${type}`);
 }

 /**
  * Force draw to rerender the feature of the provided id
  * @name this.doRender
  * @param {String} id - a feature id
  */
 doRender(id) {
   return this._ctx.store.featureChanged(id);
 }

 /**
  * Triggered while a mode is being transitioned into.
  * @param {Object} opts - this is the object passed via `draw.changeMode('mode', opts)`;
  * @name MODE.onSetup
  * @returns {Object} - this object will be passed to all other life cycle functions
  */
 onSetup(opts) {}

 /**
  * Triggered when a drag event is detected on the map
  * @name MODE.onDrag
  * @param {Object} state - a mutible state object created by onSetup
  * @param {Object} e - the captured event that is triggering this life cycle event
  */
 onDrag(state, e) {}

 /**
  * Triggered when the mouse is clicked
  * @name MODE.onClick
  * @param {Object} state - a mutible state object created by onSetup
  * @param {Object} e - the captured event that is triggering this life cycle event
  */
 onClick(state, e) {}

 /**
  * Triggered with the mouse is moved
  * @name MODE.onMouseMove
  * @param {Object} state - a mutible state object created by onSetup
  * @param {Object} e - the captured event that is triggering this life cycle event
  */
 onMouseMove(state, e) {}

 /**
  * Triggered when the mouse button is pressed down
  * @name MODE.onMouseDown
  * @param {Object} state - a mutible state object created by onSetup
  * @param {Object} e - the captured event that is triggering this life cycle event
  */
 onMouseDown(state, e) {}

 /**
  * Triggered when the mouse button is released
  * @name MODE.onMouseUp
  * @param {Object} state - a mutible state object created by onSetup
  * @param {Object} e - the captured event that is triggering this life cycle event
  */
 onMouseUp(state, e) {}

 /**
  * Triggered when the mouse leaves the map's container
  * @name MODE.onMouseOut
  * @param {Object} state - a mutible state object created by onSetup
  * @param {Object} e - the captured event that is triggering this life cycle event
  */
 onMouseOut(state, e) {}

 /**
  * Triggered when a key up event is detected
  * @name MODE.onKeyUp
  * @param {Object} state - a mutible state object created by onSetup
  * @param {Object} e - the captured event that is triggering this life cycle event
  */
 onKeyUp(state, e) {}

 /**
  * Triggered when a key down event is detected
  * @name MODE.onKeyDown
  * @param {Object} state - a mutible state object created by onSetup
  * @param {Object} e - the captured event that is triggering this life cycle event
  */
 onKeyDown(state, e) {}

 /**
  * Triggered when a touch event is started
  * @name MODE.onTouchStart
  * @param {Object} state - a mutible state object created by onSetup
  * @param {Object} e - the captured event that is triggering this life cycle event
  */
 onTouchStart(state, e) {}

 /**
  * Triggered when one drags thier finger on a mobile device
  * @name MODE.onTouchMove
  * @param {Object} state - a mutible state object created by onSetup
  * @param {Object} e - the captured event that is triggering this life cycle event
  */
 onTouchMove(state, e) {}

 /**
  * Triggered when one removes their finger from the map
  * @name MODE.onTouchEnd
  * @param {Object} state - a mutible state object created by onSetup
  * @param {Object} e - the captured event that is triggering this life cycle event
  */
 onTouchEnd(state, e) {}

 /**
  * Triggered when one quicly taps the map
  * @name MODE.onTap
  * @param {Object} state - a mutible state object created by onSetup
  * @param {Object} e - the captured event that is triggering this life cycle event
  */
 onTap(state, e) {}

 /**
  * Triggered when the mode is being exited, to be used for cleaning up artifacts such as invalid features
  * @name MODE.onStop
  * @param {Object} state - a mutible state object created by onSetup
  */
 onStop(state) {}

 /**
  * Triggered when [draw.trash()](https://github.com/esdmr/maplibre-gl-draw/blob/main/API.md#trash-draw) is called.
  * @name MODE.onTrash
  * @param {Object} state - a mutible state object created by onSetup
  */
 onTrash(state) {}

 /**
  * Triggered when [draw.combineFeatures()](https://github.com/esdmr/maplibre-gl-draw/blob/main/API.md#combinefeatures-draw) is called.
  * @name MODE.onCombineFeature
  * @param {Object} state - a mutible state object created by onSetup
  */
 onCombineFeature(state) {}

 /**
  * Triggered when [draw.uncombineFeatures()](https://github.com/esdmr/maplibre-gl-draw/blob/main/API.md#uncombinefeatures-draw) is called.
  * @name MODE.onUncombineFeature
  * @param {Object} state - a mutible state object created by onSetup
  */
 onUncombineFeature(state) {}

 /**
  * Triggered per feature on render to convert raw features into set of features for display on the map
  * See [styling draw](https://github.com/esdmr/maplibre-gl-draw/blob/main/API.md#styling-draw) for information about what geojson properties Draw uses as part of rendering.
  * @name MODE.toDisplayFeatures
  * @param {Object} state - a mutible state object created by onSetup
  * @param {Object} geojson - a geojson being evaulated. To render, pass to `display`.
  * @param {Function} display - all geojson objects passed to this be rendered onto the map
  */
 toDisplayFeatures(state, geojson, display) {
   throw new Error('You must overwrite toDisplayFeatures');
 }
}
