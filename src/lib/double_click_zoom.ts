import type ModeInterface from '../modes/mode_interface.js';

export function enableDoubleClickZoom({map, _ctx}: ModeInterface) {
  setTimeout(() => {
    // First check we've got a map and some context.
    if (!map || !map.doubleClickZoom || !_ctx || !_ctx.setup || !_ctx.storeOrThrow.getInitialConfigValue) return;
    // Now check initial state wasn't false (we leave it disabled if so)
    if (!_ctx.storeOrThrow.getInitialConfigValue('doubleClickZoom')) return;
    map.doubleClickZoom.enable();
  }, 0);
}

export function disableDoubleClickZoom({map}: ModeInterface) {
    setTimeout(() => {
      if (!map || !map.doubleClickZoom) return;
      // Always disable here, as it's necessary in some cases.
      map.doubleClickZoom.disable();
    }, 0);
  }
