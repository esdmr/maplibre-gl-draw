import type * as G from 'geojson';
import type { MapDataEvent, MapMouseEvent, MapTouchEvent } from 'maplibre-gl';
import * as Constants from './constants.js';
import type { MaplibreDrawContext } from './context.js';
import * as CommonSelectors from './lib/common_selectors.js';
import { featuresAtTouch } from './lib/features_at.js';
import getFeaturesAndSetCursor from './lib/get_features_and_set_cursor.js';
import isClick, { type ClickState } from './lib/is_click.js';
import isTap, { type TapState } from './lib/is_tap.js';
import type { ModeInterfaces } from './modes/mode_interface.js';

export default class Events<T extends Record<string, {}>> {
  ctx;
  mouseDownInfo: Partial<ClickState> = {};
  touchStartInfo: Partial<TapState> = {};
  currentModeName: keyof T;
  currentMode: any;
  modes: ModeInterfaces<T>;

  readonly actionState = {
    trash: false,
    combineFeatures: false,
    uncombineFeatures: false
  };

  readonly events = {
    drag: (event: MapMouseEvent | MapTouchEvent, isDrag: (end: ClickState) => boolean) => {
      if (isDrag({
        point: event.point,
        time: new Date().getTime()
      })) {
        this.ctx.uiOrThrow.queueMapClasses({ mouse: Constants.cursors.DRAG });
        this.currentMode.drag(event);
      } else {
        event.originalEvent.stopPropagation();
      }
    },

    mousedrag: (event: MapMouseEvent) => {
      this.events.drag(event, endInfo => !isClick(this.mouseDownInfo, endInfo));
    },

    touchdrag: (event: MapTouchEvent) => {
      this.events.drag(event, endInfo => !isTap(this.touchStartInfo, endInfo));
    },

    mousemove: (event: MapMouseEvent) => {
      if (event.originalEvent.buttons === 1) {
        return this.events.mousedrag(event);
      }

      const target = getFeaturesAndSetCursor(event, this.ctx);
      event.featureTarget = target;
      this.currentMode.mousemove(event);
    },

    mousedown: (event: MapMouseEvent) => {
      this.mouseDownInfo = {
        time: new Date().getTime(),
        point: event.point
      };
      const target = getFeaturesAndSetCursor(event, this.ctx);
      event.featureTarget = target;
      this.currentMode.mousedown(event);
    },

    mouseup: (event: MapMouseEvent) => {
      const target = getFeaturesAndSetCursor(event, this.ctx);
      event.featureTarget = target;

      if (isClick(this.mouseDownInfo, {
        point: event.point,
        time: new Date().getTime()
      })) {
        this.currentMode.click(event);
      } else {
        this.currentMode.mouseup(event);
      }
    },

    mouseout: (event: MouseEvent) => {
      this.currentMode.mouseout(event);
    },

    touchstart: (event: MapTouchEvent) => {
      if (!this.ctx.options.touchEnabled) {
        return;
      }

      this.touchStartInfo = {
        time: new Date().getTime(),
        point: event.point
      };
      const target = featuresAtTouch(event, undefined, this.ctx)[0];
      event.featureTarget = target;
      this.currentMode.touchstart(event);
    },

    touchmove: (event: MapTouchEvent) => {
      if (!this.ctx.options.touchEnabled) {
        return;
      }

      this.currentMode.touchmove(event);
      return this.events.touchdrag(event);
    },

    touchend: (event: MapTouchEvent) => {
      // Prevent emulated mouse events because we will fully handle the touch here.
      // This does not stop the touch events from propogating to maplibre though.
      event.originalEvent.preventDefault();
      if (!this.ctx.options.touchEnabled) {
        return;
      }

      const target = featuresAtTouch(event, undefined, this.ctx)[0];
      event.featureTarget = target;
      if (isTap(this.touchStartInfo, {
        time: new Date().getTime(),
        point: event.point
      })) {
        this.currentMode.tap(event);
      } else {
        this.currentMode.touchend(event);
      }
    },

    keydown: (event: KeyboardEvent) => {
      const isMapElement = (event.target as HTMLElement).classList.contains(Constants.classes.CANVAS);
      if (!isMapElement) return; // we only handle events on the map

      if ((CommonSelectors.isBackspaceKey(event) || CommonSelectors.isDeleteKey(event)) && this.ctx.options.controls.trash) {
        event.preventDefault();
        this.currentMode.trash();
      } else if (this._isKeyModeValid(event)) {
        this.currentMode.keydown(event);
      } else if (CommonSelectors.isDigit1Key(event) && this.ctx.options.controls.point) {
        // FIXME: Remove hardcoded behavior
        this.changeMode(Constants.modes.DRAW_POINT as keyof T, {} as T[keyof T]);
      } else if (CommonSelectors.isDigit2Key(event) && this.ctx.options.controls.line_string) {
        // FIXME: Remove hardcoded behavior
        this.changeMode(Constants.modes.DRAW_LINE_STRING as keyof T, {} as T[keyof T]);
      } else if (CommonSelectors.isDigit3Key(event) && this.ctx.options.controls.polygon) {
        // FIXME: Remove hardcoded behavior
        this.changeMode(Constants.modes.DRAW_POLYGON as keyof T, {} as T[keyof T]);
      }
    },

    keyup: (event: KeyboardEvent) => {
      if (this._isKeyModeValid(event)) {
        this.currentMode.keyup(event);
      }
    },

    data: ({dataType}: MapDataEvent) => {
      if (dataType === 'style') {
        const { setupOrThrow, mapOrThrow, options, storeOrThrow } = this.ctx;
        const hasLayers = options.styles.some(({id}) => mapOrThrow.getLayer(id));
        if (!hasLayers) {
          setupOrThrow.addLayers();
          storeOrThrow.setDirty();
          storeOrThrow.render();
        }
      }
    },
  } as const;

  constructor(ctx: MaplibreDrawContext<T>) {
    this.ctx = ctx;
    ctx.setup!.events = this; // FIXME: Circular dependency nonsense...

    // FIXME: add base type to modes
    this.modes = Object.fromEntries(
      Object.entries(ctx.options.modes)
        .map(([k, v]) => [k, new v(ctx)]),
    ) as any;

    this.currentModeName = this.ctx.options.defaultMode[0];
    this.currentMode = this.modes[this.ctx.options.defaultMode[0]].start(this.ctx.options.defaultMode[1]);
  }

  currentModeRender(geojson: G.GeoJSON, push: (item: G.Feature) => void) {
    return this.currentMode.render(geojson, push);
  }

  fire(eventName: string, eventData: unknown) {
    if (!this.ctx.setup) return;
    this.ctx.mapOrThrow.fire(eventName, eventData);
  }

  addEventListeners() {
    this.ctx.mapOrThrow.on('mousemove', this.events.mousemove);
    this.ctx.mapOrThrow.on('mousedown', this.events.mousedown);
    this.ctx.mapOrThrow.on('mouseup', this.events.mouseup);
    this.ctx.mapOrThrow.on('data', this.events.data);

    this.ctx.mapOrThrow.on('touchmove', this.events.touchmove);
    this.ctx.mapOrThrow.on('touchstart', this.events.touchstart);
    this.ctx.mapOrThrow.on('touchend', this.events.touchend);

    this.ctx.containerOrThrow.addEventListener('mouseout', this.events.mouseout);

    if (this.ctx.options.keybindings) {
      this.ctx.containerOrThrow.addEventListener('keydown', this.events.keydown);
      this.ctx.containerOrThrow.addEventListener('keyup', this.events.keyup);
    }
  }

  removeEventListeners() {
    this.ctx.mapOrThrow.off('mousemove', this.events.mousemove);
    this.ctx.mapOrThrow.off('mousedown', this.events.mousedown);
    this.ctx.mapOrThrow.off('mouseup', this.events.mouseup);
    this.ctx.mapOrThrow.off('data', this.events.data);

    this.ctx.mapOrThrow.off('touchmove', this.events.touchmove);
    this.ctx.mapOrThrow.off('touchstart', this.events.touchstart);
    this.ctx.mapOrThrow.off('touchend', this.events.touchend);

    this.ctx.containerOrThrow.removeEventListener('mouseout', this.events.mouseout);

    if (this.ctx.options.keybindings) {
      this.ctx.containerOrThrow.removeEventListener('keydown', this.events.keydown);
      this.ctx.containerOrThrow.removeEventListener('keyup', this.events.keyup);
    }
  }

  trash() {
    this.currentMode.trash();
  }

  combineFeatures() {
    this.currentMode.combineFeatures();
  }

  uncombineFeatures() {
    this.currentMode.uncombineFeatures();
  }

  getMode() {
    return this.currentModeName;
  }

  changeMode<K extends keyof T>(modeName: K, nextModeOptions: T[K], {silent = this.ctx.options.suppressAPIEvents}: {silent?: boolean} = {}) {
    this.currentMode.stop();

    const mode = this.modes[modeName];
    if (mode === undefined) {
      throw new Error(`${String(modeName)} is not valid`);
    }
    this.currentModeName = modeName;
    this.currentMode = mode.start(nextModeOptions);

    if (!silent) {
      this.ctx.mapOrThrow.fire(Constants.events.MODE_CHANGE, { mode: modeName});
    }

    this.ctx.storeOrThrow.setDirty();
    this.ctx.storeOrThrow.render();
  }

  actionable(actions: Partial<Record<keyof Events<T>['actionState'], boolean>>) {
    let changed = false;

    (Object.entries(actions) as [keyof Events<T>['actionState'], boolean][]).forEach(([k, v]) => {
      if (this.actionState[k] === undefined) throw new Error('Invalid action type');
      if (this.actionState[k] !== v) changed = true;
      this.actionState[k] = v;
    });

    if (changed) this.ctx.mapOrThrow.fire(Constants.events.ACTIONABLE, { actions: this.actionState });
  }

  private _isKeyModeValid (event: KeyboardEvent) {
    const isBackspaceKey = CommonSelectors.isBackspaceKey(event);
    const isDeleteKey = CommonSelectors.isDeleteKey(event);
    const isDigitKey = CommonSelectors.isDigitKey(event);
    return !(isBackspaceKey || isDeleteKey || isDigitKey);
  }
}
