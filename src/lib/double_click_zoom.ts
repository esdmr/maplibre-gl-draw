import type ModeInterface from '../modes/mode_interface.js';

export function enableDoubleClickZoom({_ctx}: ModeInterface) {
  setTimeout(() => {
    // First check we've got a map and some context.
    if (!_ctx.mapOrThrow || !_ctx.mapOrThrow.doubleClickZoom || !_ctx || !_ctx.setup || !_ctx.storeOrThrow.getInitialConfigValue) return;
    // Now check initial state wasn't false (we leave it disabled if so)
    if (!_ctx.storeOrThrow.getInitialConfigValue('doubleClickZoom')) return;
    _ctx.mapOrThrow.doubleClickZoom.enable();
  }, 0);
}

export function disableDoubleClickZoom({_ctx}: ModeInterface) {
    setTimeout(() => {
      if (!_ctx.mapOrThrow || !_ctx.mapOrThrow.doubleClickZoom) return;
      // Always disable here, as it's necessary in some cases.
      _ctx.mapOrThrow.doubleClickZoom.disable();
    }, 0);
  }
