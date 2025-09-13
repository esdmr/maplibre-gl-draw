import type ModeInterface from '../modes/mode_interface.ts';

export function enableDoubleClickZoom({_ctx}: ModeInterface) {
  setTimeout(() => {
    // First check we've got a map and some context.
    if (!_ctx.map || !_ctx.map.doubleClickZoom || !_ctx || !_ctx.setup || !_ctx.store.getInitialConfigValue) return;
    // Now check initial state wasn't false (we leave it disabled if so)
    if (!_ctx.store.getInitialConfigValue('doubleClickZoom')) return;
    _ctx.map.doubleClickZoom.enable();
  }, 0);
}

export function disableDoubleClickZoom({_ctx}: ModeInterface) {
    setTimeout(() => {
      if (!_ctx.map || !_ctx.map.doubleClickZoom) return;
      // Always disable here, as it's necessary in some cases.
      _ctx.map.doubleClickZoom.disable();
    }, 0);
  }
