import type * as G from 'geojson';
import type { MapDataEvent, MapMouseEvent, MapTouchEvent } from 'maplibre-gl';
import * as Constants from './constants.ts';
import type { MaplibreDrawContext } from './context.ts';
import * as CommonSelectors from './lib/common_selectors.ts';
import { featuresAtTouch } from './lib/features_at.ts';
import getFeaturesAndSetCursor from './lib/get_features_and_set_cursor.ts';
import isClick, { type ClickState } from './lib/is_click.ts';
import isTap, { type TapState } from './lib/is_tap.ts';
import type { ModeInterfaces } from './modes/mode_interface.ts';

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
        this.ctx.ui.queueMapClasses({ mouse: Constants.cursors.DRAG });
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
      const isMapElement = event.target === event.currentTarget;
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
        const { setupOrThrow, map, options, store } = this.ctx;
        const hasLayers = options.styles.some(({id}) => map.getLayer(id));
        if (!hasLayers) {
          setupOrThrow.addLayers();
          store.setDirty();
          store.render();
        }
      }
    },
  } as const;

  constructor(ctx: MaplibreDrawContext<T>) {
    this.ctx = ctx;
    ctx.events = this; // FIXME: Circular dependency nonsense...

    // FIXME: add base type to modes
    this.modes = Object.fromEntries(
      Object.entries(ctx.options.modes)
        .map(([k, v]) => [k, new v(ctx)]),
    ) as any;

    this.currentModeName = this.ctx.options.defaultMode[0];
    this.currentMode = this.modes[this.ctx.options.defaultMode[0]];
  }

  currentModeRender(geojson: G.GeoJSON, push: (item: G.Feature) => void) {
    return this.currentMode.render(geojson, push);
  }

  fire(eventName: string, eventData: unknown) {
    if (!this.ctx.setup) return;
    this.ctx.map.fire(eventName, eventData);
  }

  addEventListeners() {
    this.ctx.map.on('mousemove', this.events.mousemove);
    this.ctx.map.on('mousedown', this.events.mousedown);
    this.ctx.map.on('mouseup', this.events.mouseup);
    this.ctx.map.on('data', this.events.data);

    this.ctx.map.on('touchmove', this.events.touchmove);
    this.ctx.map.on('touchstart', this.events.touchstart);
    this.ctx.map.on('touchend', this.events.touchend);

    this.ctx.container.addEventListener('mouseout', this.events.mouseout);

    if (this.ctx.options.keybindings) {
      this.ctx.container.addEventListener('keydown', this.events.keydown);
      this.ctx.container.addEventListener('keyup', this.events.keyup);
    }
  }

  removeEventListeners() {
    this.ctx.map.off('mousemove', this.events.mousemove);
    this.ctx.map.off('mousedown', this.events.mousedown);
    this.ctx.map.off('mouseup', this.events.mouseup);
    this.ctx.map.off('data', this.events.data);

    this.ctx.map.off('touchmove', this.events.touchmove);
    this.ctx.map.off('touchstart', this.events.touchstart);
    this.ctx.map.off('touchend', this.events.touchend);

    this.ctx.container.removeEventListener('mouseout', this.events.mouseout);

    if (this.ctx.options.keybindings) {
      this.ctx.container.removeEventListener('keydown', this.events.keydown);
      this.ctx.container.removeEventListener('keyup', this.events.keyup);
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

  changeMode<K extends keyof T>(modeName: K, nextModeOptions: T[K], {silent}: {silent?: boolean} = {}) {
    this.currentMode.stop();

    const mode = this.modes[modeName];
    if (mode === undefined) {
      throw new Error(`${String(modeName)} is not valid`);
    }
    this.currentModeName = modeName;
    this.currentMode = mode.start(nextModeOptions);

    if (!silent) {
      this.ctx.map.fire(Constants.events.MODE_CHANGE, { mode: modeName });
    }

    this.ctx.store.setDirty();
    this.ctx.store.render();
  }

  actionable(actions: Partial<Record<keyof Events<T>['actionState'], boolean>>) {
    let changed = false;

    (Object.entries(actions) as [keyof Events<T>['actionState'], boolean][]).forEach(([k, v]) => {
      if (this.actionState[k] === undefined) throw new Error('Invalid action type');
      if (this.actionState[k] !== v) changed = true;
      this.actionState[k] = v;
    });

    if (changed) this.ctx.map.fire(Constants.events.ACTIONABLE, { actions: this.actionState });
  }

  private _isKeyModeValid (event: KeyboardEvent) {
    const isBackspaceKey = CommonSelectors.isBackspaceKey(event);
    const isDeleteKey = CommonSelectors.isDeleteKey(event);
    const isDigitKey = CommonSelectors.isDigitKey(event);
    return !(isBackspaceKey || isDeleteKey || isDigitKey);
  }
}
