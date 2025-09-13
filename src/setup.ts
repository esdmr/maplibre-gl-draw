import Store from './store.ts';
import * as Constants from './constants.ts';
import type { MaplibreDrawContext } from './context.ts';
import type { Map } from 'maplibre-gl';

export default class Setup<T extends Record<string, {}>> {
  ctx;
  mapLoadedInterval: ReturnType<typeof setInterval> | undefined;
  controlContainer;
  map;
  store;
  container;
  boxZoomInitial;

  constructor(ctx: MaplibreDrawContext<T>, map: Map) {
    this.ctx = ctx;
    ctx.setup = this; // FIXME: Circular dependency nonsense...

    this.map = map;
    this.container = map.getContainer();
    this.store = new Store(this.ctx);

    this.controlContainer = this.ctx.ui.addButtons();

    if (this.ctx.options.boxSelect) {
      this.boxZoomInitial = map.boxZoom.isEnabled();
      map.boxZoom.disable();
      const dragPanIsEnabled = map.dragPan.isEnabled();
      // Need to toggle dragPan on and off or else first
      // dragPan disable attempt in simple_select doesn't work
      map.dragPan.disable();
      map.dragPan.enable();
      if (!dragPanIsEnabled) {
        map.dragPan.disable();
      }
    } else {
      this.boxZoomInitial = false;
    }

    this.ctx.events.changeMode(this.ctx.options.defaultMode[0], this.ctx.options.defaultMode[1]);

    if (map.loaded()) {
      this.connect();
    } else {
      map.on('load', this.connect);
      this.mapLoadedInterval = setInterval(() => { if (map.loaded()) this.connect(); }, 16);
    }
  }

  dispose() {
    // Stop connect attempt in the event that control is removed before map is loaded
    this.map.off('load', this.connect);
    clearInterval(this.mapLoadedInterval);

    this.removeLayers();
    this.store.restoreMapConfig();
    this.ctx.ui.removeButtons();
    this.ctx.events.removeEventListeners();
    this.ctx.ui.clearMapClasses();
    if (this.ctx.boxZoomInitial) this.map.boxZoom.enable();

    if (this.controlContainer && this.controlContainer.parentNode) this.controlContainer.parentNode.removeChild(this.controlContainer);

    return this;
  }

  connect() {
    this.map.off('load', this.connect);
    clearInterval(this.mapLoadedInterval);
    this.addLayers();
    this.store.storeMapConfig();
    this.ctx.events.addEventListeners();
  }

  addLayers() {
    // drawn features style
    this.map.addSource(Constants.sources.COLD, {
      data: {
        type: Constants.geojsonTypes.FEATURE_COLLECTION,
        features: []
      },
      type: 'geojson'
    });

    // hot features style
    this.map.addSource(Constants.sources.HOT, {
      data: {
        type: Constants.geojsonTypes.FEATURE_COLLECTION,
        features: []
      },
      type: 'geojson'
    });

    this.ctx.options.styles.forEach((style) => {
      this.map.addLayer(style);
    });

    this.store.setDirty();
    this.store.render();
  }

  // Check for layers and sources before attempting to remove
  // If user adds draw control and removes it before the map is loaded, layers and sources will be missing
  removeLayers() {
    this.ctx.options.styles.forEach(({id}) => {
      if (this.map.getLayer(id)) {
        this.map.removeLayer(id);
      }
    });

    if (this.map.getSource(Constants.sources.COLD)) {
      this.map.removeSource(Constants.sources.COLD);
    }

    if (this.map.getSource(Constants.sources.HOT)) {
      this.map.removeSource(Constants.sources.HOT);
    }
  }
}
