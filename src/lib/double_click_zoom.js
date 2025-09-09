export default {
  enable({map, _ctx}) {
    setTimeout(() => {
      // First check we've got a map and some context.
      if (!map || !map.doubleClickZoom || !_ctx || !_ctx.store || !_ctx.store.getInitialConfigValue) return;
      // Now check initial state wasn't false (we leave it disabled if so)
      if (!_ctx.store.getInitialConfigValue('doubleClickZoom')) return;
      map.doubleClickZoom.enable();
    }, 0);
  },
  disable({map}) {
    setTimeout(() => {
      if (!map || !map.doubleClickZoom) return;
      // Always disable here, as it's necessary in some cases.
      map.doubleClickZoom.disable();
    }, 0);
  }
};
