import * as G from 'geojson';
import type { Map, MapMouseEvent, MapTouchEvent, PointLike } from 'maplibre-gl';
import * as Constants from '../constants.js';
import type { MaplibreDrawContext } from '../context.js';
import type Events from '../events.js';
import Feature from '../feature_types/feature.js';
import LineString from '../feature_types/line_string.js';
import MultiFeature from '../feature_types/multi_feature.js';
import Point from '../feature_types/point.js';
import Polygon from '../feature_types/polygon.js';
import { featuresAtClick, featuresAtTouch } from '../lib/features_at.js';
import type { MapClasses } from '../ui.js';

export type ModeConstructors<T extends Record<string, {}>> = {[K in keyof T]: ModeConstructor<T[K]>};
export type ModeInterfaces<T extends Record<string, {}>> = {[K in keyof T]: ModeInterface<T[K]>};
export type ModeOpts<T extends Record<string, ModeConstructor<{}>>> = {[K in keyof T]: T[K] extends ModeConstructor<infer O> ? O : never};
export type ModeOptEntry<T extends Record<string, {}>> = {[K in keyof T]: [K, T[K]]}[keyof T];

export type ModeConstructor<Opts = {}> = new (ctx: MaplibreDrawContext<any>) => ModeInterface<Opts, any>;

export default abstract class ModeInterface<Opts = {}, State = {}> {
  map: Map;
  _ctx: MaplibreDrawContext<any>
  private _state: State | undefined;

  private get _stateOrThrow() {
    if (this._state === undefined) {
      throw new Error('maplibre-gl-draw ModeInterface._state is undefined. ModeInterface.start is not called yet');
    }

    return this._state;
  }

  constructor(ctx: MaplibreDrawContext<any>) {
    this.map = ctx.mapOrThrow;
    this._ctx = ctx;
  }

  start(opts: Opts) {
    this._state = this.onSetup(opts); // this should set ui buttons
    return this;
  }

  stop() {
    this.onStop?.(this._stateOrThrow);
    this._state = undefined;
  }

  trash() {
    if (this.onTrash) {
      this.onTrash(this._stateOrThrow);
      this._ctx.storeOrThrow.render();
    }
  }

  combineFeatures() {
    this.onCombineFeature?.(this._stateOrThrow);
  }

  uncombineFeatures() {
    this.onUncombineFeature?.(this._stateOrThrow);
  }

  render(geojson: G.Feature, push: (geojson: G.Feature) => void) {
    this.toDisplayFeatures(this._stateOrThrow, geojson, push);
  }

  drag(e: MapMouseEvent) {
    if (this.onDrag) {
      if (!this.onDrag(this._stateOrThrow, e)) {
        this._ctx.storeOrThrow.render();
      }

      this._ctx.uiOrThrow.updateMapClasses();
    }
  }

  click(e: MapMouseEvent) {
    if (this.onClick) {
      if (!this.onClick(this._stateOrThrow, e)) {
        this._ctx.storeOrThrow.render();
      }

      this._ctx.uiOrThrow.updateMapClasses();
    }
  }

  mousemove(e: MapMouseEvent) {
    if (this.onMouseMove) {
      if (!this.onMouseMove(this._stateOrThrow, e)) {
        this._ctx.storeOrThrow.render();
      }

      this._ctx.uiOrThrow.updateMapClasses();
    }
  }

  mousedown(e: MapMouseEvent) {
    if (this.onMouseDown) {
      if (!this.onMouseDown(this._stateOrThrow, e)) {
        this._ctx.storeOrThrow.render();
      }

      this._ctx.uiOrThrow.updateMapClasses();
    }
  }

  mouseup(e: MapMouseEvent) {
    if (this.onMouseUp) {
      if (!this.onMouseUp(this._stateOrThrow, e)) {
        this._ctx.storeOrThrow.render();
      }

      this._ctx.uiOrThrow.updateMapClasses();
    }
  }

  mouseout(e: MapMouseEvent) {
    if (this.onMouseOut) {
      if (!this.onMouseOut(this._stateOrThrow, e)) {
        this._ctx.storeOrThrow.render();
      }

      this._ctx.uiOrThrow.updateMapClasses();
    }
  }

  keyup(e: KeyboardEvent) {
    if (this.onKeyUp) {
      if (!this.onKeyUp(this._stateOrThrow, e)) {
        this._ctx.storeOrThrow.render();
      }

      this._ctx.uiOrThrow.updateMapClasses();
    }
  }

  keydown(e: KeyboardEvent) {
    if (this.onKeyDown) {
      if (!this.onKeyDown(this._stateOrThrow, e)) {
        this._ctx.storeOrThrow.render();
      }

      this._ctx.uiOrThrow.updateMapClasses();
    }
  }

  touchstart(e: MapTouchEvent) {
    if (this.onTouchStart) {
      if (!this.onTouchStart(this._stateOrThrow, e)) {
        this._ctx.storeOrThrow.render();
      }

      this._ctx.uiOrThrow.updateMapClasses();
    }
  }

  touchmove(e: MapTouchEvent) {
    if (this.onTouchMove) {
      if (!this.onTouchMove(this._stateOrThrow, e)) {
        this._ctx.storeOrThrow.render();
      }

      this._ctx.uiOrThrow.updateMapClasses();
    }
  }

  touchend(e: MapTouchEvent) {
    if (this.onTouchEnd) {
      if (!this.onTouchEnd(this._stateOrThrow, e)) {
        this._ctx.storeOrThrow.render();
      }

      this._ctx.uiOrThrow.updateMapClasses();
    }
  }

  tap(e: MapTouchEvent) {
    if (this.onTap) {
      if (!this.onTap(this._stateOrThrow, e)) {
        this._ctx.storeOrThrow.render();
      }

      this._ctx.uiOrThrow.updateMapClasses();
    }
  }

  /**
   * Sets Draw's interal selected state
   */
  protected setSelected(featureIds: (string | number)[]) {
    return this._ctx.storeOrThrow.setSelected(featureIds);
  }

  /**
   * Sets Draw's internal selected coordinate state
   */
  protected setSelectedCoordinates(coords: {coord_path: string, feature_id: string}[]) {
    this._ctx.storeOrThrow.setSelectedCoordinates(coords);

    for (const id of new Set(coords.map(i => i.feature_id))) {
      this._ctx.storeOrThrow.get(id)?.changed();
    }
  }

  /**
   * Get all selected features as a {@link Feature}
   */
  protected getSelected() {
    return this._ctx.storeOrThrow.getSelected();
  }

  /**
   * Get the ids of all currently selected features
   */
  protected getSelectedIds() {
    return this._ctx.storeOrThrow.getSelectedIds();
  }

  /**
   * Check if a feature is selected
   */
  protected isSelected(id: string | number) {
    return this._ctx.storeOrThrow.isSelected(id);
  }

  /**
   * Get a {@link Feature} by its id
   */
  protected getFeature(id: string | number) {
    return this._ctx.storeOrThrow.get(id);
  }

  /**
   * Add a feature to draw's internal selected state
   */
  protected select(id: string | number | (string | number)[]) {
    return this._ctx.storeOrThrow.select(id);
  }

  /**
   * Remove a feature from draw's internal selected state
   */
  protected deselect(id: string | number) {
    return this._ctx.storeOrThrow.deselect(id);
  }

  /**
   * Delete a feature from draw
   */
  protected deleteFeature(id: string | number | (string | number)[], opts: {silent?: boolean} = {}) {
    return this._ctx.storeOrThrow.delete(id, opts);
  }

  /**
   * Add a {@link Feature} to draw.
   * See {@link ModeInterface.newFeature} for converting geojson into a DrawFeature
   */
  protected addFeature(feature: Feature<any>, opts: {silent?: boolean} = {}) {
    return this._ctx.storeOrThrow.add(feature, opts);
  }

  /**
   * Clear all selected features
   */
  protected clearSelectedFeatures() {
    return this._ctx.storeOrThrow.clearSelected();
  }

  /**
   * Clear all selected coordinates
   */
  protected clearSelectedCoordinates() {
    return this._ctx.storeOrThrow.clearSelectedCoordinates();
  }

  /**
   * Indicate if the different action are currently possible with your mode See
   * [draw.actionable](https://github.com/esdmr/maplibre-gl-draw/blob/main/API.md#drawactionable)
   * for a list of possible actions. All undefined actions are set to `false`
   * by default
   */
  protected setActionableState(actions: Partial<Record<keyof Events<any>['actionState'], boolean>> = {}) {
    const newSet: Record<keyof Events<any>['actionState'], boolean> = {
      trash: actions.trash || false,
      combineFeatures: actions.combineFeatures || false,
      uncombineFeatures: actions.uncombineFeatures || false
    };

    return this._ctx.eventsOrThrow.actionable(newSet);
  }

  /**
   * Trigger a mode change
   * @param mode - the mode to transition into
   * @param opts - the options object to pass to the new mode
   * @param eventOpts - used to control what kind of events are emitted.
   */
  protected changeMode(mode: string, opts: unknown = {}, eventOpts: {silent?: boolean} = {}) {
    // FIXME: Remove all hard coded behaviors.
    return this._ctx.eventsOrThrow.changeMode(mode, opts as any, eventOpts);
  }

  /**
   * Fire a map event
   */
  protected fire(eventName: string, eventData: unknown) {
    return this._ctx.eventsOrThrow.fire(eventName, eventData);
  }

  /**
   * Update the state of draw map classes
   */
  protected updateUIClasses(opts: Partial<MapClasses>) {
    return this._ctx.uiOrThrow.queueMapClasses(opts);
  }

  /**
   * If a name is provided it makes that button active, else if makes all buttons inactive
   * @param name - name of the button to make active, leave as undefined to set buttons to be inactive
   */
  protected activateUIButton(name?: string) {
    return this._ctx.uiOrThrow.setActiveButton(name);
  }

  /**
   * Get the features at the location of an event object or in a bbox
   * @param event - a maplibre-gl event object
   * @param bbox - the area to get features from
   * @param bufferType - is this `click` or `tap` event, defaults to click
   */
  protected featuresAt(event: MapMouseEvent | MapTouchEvent, bbox: undefined, bufferType?: 'click' | 'touch'): G.Feature[];

  protected featuresAt(event: undefined, bbox: [PointLike, PointLike], bufferType?: 'click' | 'touch'): G.Feature[];

  protected featuresAt(event: MapMouseEvent | MapTouchEvent | undefined, bbox: [PointLike, PointLike] | undefined, bufferType: 'click' | 'touch' = 'click') {
    switch (bufferType) {
      case 'click':
        return featuresAtClick(event as MapMouseEvent, bbox as undefined, this._ctx);

      case 'touch':
        return featuresAtTouch(event as MapTouchEvent, bbox as undefined, this._ctx);

      default:
        throw new Error('invalid buffer type');
    }
  }

  /**
   * Create a new {@link Feature} from geojson
   */
  protected newFeature(geojson: G.Feature): Feature<any> {
    switch (geojson.geometry.type) {
      case 'Point': return new Point(this._ctx, geojson as G.Feature<G.Point>);
      case 'LineString': return new LineString(this._ctx, geojson as G.Feature<G.LineString>);
      case 'Polygon': return new Polygon(this._ctx, geojson as G.Feature<G.Polygon>);

      case 'MultiPoint':
      case 'MultiLineString':
      case 'MultiPolygon':
        return new MultiFeature(this._ctx, geojson as G.Feature<G.MultiPoint | G.MultiLineString | G.MultiPolygon>);

      case 'GeometryCollection':
        throw new TypeError('GeometryCollection is not supported in maplibre-gl-draw')
    }
  }

  /**
   * Check is an object is an instance of a {@link Feature}
   */
  protected isInstanceOf(type: typeof Constants.geojsonTypes.POINT, feature: unknown): feature is Point;
  protected isInstanceOf(type: typeof Constants.geojsonTypes.LINE_STRING, feature: unknown): feature is LineString;
  protected isInstanceOf(type: typeof Constants.geojsonTypes.POLYGON, feature: unknown): feature is Polygon;
  protected isInstanceOf(type: 'MultiFeature', feature: unknown): feature is MultiFeature;
  protected isInstanceOf(type: 'Feature', feature: unknown): feature is Feature;

  protected isInstanceOf(type: string, feature: unknown): feature is Feature {
    switch (type) {
      case Constants.geojsonTypes.POINT: return feature instanceof Point;
      case Constants.geojsonTypes.LINE_STRING: return feature instanceof LineString;
      case Constants.geojsonTypes.POLYGON: return feature instanceof Polygon;
      case 'MultiFeature': return feature instanceof MultiFeature;
      case 'Feature': return feature instanceof Feature;
      default: throw new Error(`Unknown feature class: ${type}`);
    }
  }

  /**
   * Force draw to rerender the feature of the provided id
   */
  protected doRender(id: string | number) {
    return this._ctx.storeOrThrow.featureChanged(id);
  }

  /**
   * Triggered while a mode is being transitioned into.
   * @param opts - this is the object passed via `draw.changeMode('mode', opts)`;
   * @returns - this object will be passed to all other life cycle functions
   */
  protected abstract onSetup(opts: Opts): State;

  /**
   * Triggered when a drag event is detected on the map
   * @param _state - a mutable state object created by onSetup
   * @param _e - the captured event that is triggering this life cycle event
   */
  protected onDrag?(_state: State, _e: MapMouseEvent): boolean | void;

  /**
   * Triggered when the mouse is clicked
   * @param _state - a mutable state object created by onSetup
   * @param _e - the captured event that is triggering this life cycle event
   */
  protected onClick?(_state: State, _e: MapMouseEvent): boolean | void;

  /**
   * Triggered with the mouse is moved
   * @param _state - a mutable state object created by onSetup
   * @param _e - the captured event that is triggering this life cycle event
   */
  protected onMouseMove?(_state: State, _e: MapMouseEvent): boolean | void;

  /**
   * Triggered when the mouse button is pressed down
   * @param _state - a mutable state object created by onSetup
   * @param _e - the captured event that is triggering this life cycle event
   */
  protected onMouseDown?(_state: State, _e: MapMouseEvent): boolean | void;

  /**
   * Triggered when the mouse button is released
   * @param _state - a mutable state object created by onSetup
   * @param _e - the captured event that is triggering this life cycle event
   */
  protected onMouseUp?(_state: State, _e: MapMouseEvent): boolean | void;

  /**
   * Triggered when the mouse leaves the map's container
   * @param _state - a mutable state object created by onSetup
   * @param _e - the captured event that is triggering this life cycle event
   */
  protected onMouseOut?(_state: State, _e: MapMouseEvent): boolean | void;

  /**
   * Triggered when a key up event is detected
   * @param _state - a mutable state object created by onSetup
   * @param _e - the captured event that is triggering this life cycle event
   */
  protected onKeyUp?(_state: State, _e: KeyboardEvent): boolean | void;

  /**
   * Triggered when a key down event is detected
   * @param _state - a mutable state object created by onSetup
   * @param _e - the captured event that is triggering this life cycle event
   */
  protected onKeyDown?(_state: State, _e: KeyboardEvent): boolean | void;

  /**
   * Triggered when a touch event is started
   * @param _state - a mutable state object created by onSetup
   * @param _e - the captured event that is triggering this life cycle event
   */
  protected onTouchStart?(_state: State, _e: MapTouchEvent): boolean | void;

  /**
   * Triggered when one drags thier finger on a mobile device
   * @param _state - a mutable state object created by onSetup
   * @param _e - the captured event that is triggering this life cycle event
   */
  protected onTouchMove?(_state: State, _e: MapTouchEvent): boolean | void;

  /**
   * Triggered when one removes their finger from the map
   * @param _state - a mutable state object created by onSetup
   * @param _e - the captured event that is triggering this life cycle event
   */
  protected onTouchEnd?(_state: State, _e: MapTouchEvent): boolean | void;

  /**
   * Triggered when one quicly taps the map
   * @param _state - a mutable state object created by onSetup
   * @param _e - the captured event that is triggering this life cycle event
   */
  protected onTap?(_state: State, _e: MapTouchEvent): boolean | void;

  /**
   * Triggered when the mode is being exited, to be used for cleaning up artifacts such as invalid features
   * @param _state - a mutable state object created by onSetup
   */
  protected onStop?(_state: State): void;

  /**
   * Triggered when [draw.trash()](https://github.com/esdmr/maplibre-gl-draw/blob/main/API.md#trash-draw) is called.
   * @param _state - a mutable state object created by onSetup
   */
  protected onTrash?(_state: State): void;

  /**
   * Triggered when [draw.combineFeatures()](https://github.com/esdmr/maplibre-gl-draw/blob/main/API.md#combinefeatures-draw) is called.
   * @param _state - a mutable state object created by onSetup
   */
  protected onCombineFeature?(_state: State): void;

  /**
   * Triggered when [draw.uncombineFeatures()](https://github.com/esdmr/maplibre-gl-draw/blob/main/API.md#uncombinefeatures-draw) is called.
   * @param _state - a mutable state object created by onSetup
   */
  protected onUncombineFeature?(_state: State): void;

  /**
   * Triggered per feature on render to convert raw features into set of features for display on the map
   * See [styling draw](https://github.com/esdmr/maplibre-gl-draw/blob/main/API.md#styling-draw) for information about what geojson properties Draw uses as part of rendering.
   * @param state - a mutable state object created by onSetup
   * @param geojson - a geojson being evaulated. To render, pass to `display`.
   * @param display - all geojson objects passed to this be rendered onto the map0
   */
  protected abstract toDisplayFeatures(state: State, geojson: G.Feature, display: (geojson: G.Feature) => void): void;
}
