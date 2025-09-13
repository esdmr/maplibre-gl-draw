import MaplibreDrawApi from './api.ts';
import Events from './events.ts';
import type { Options } from './options.ts';
import Setup from './setup.ts';
import ui from './ui.ts';

export class MaplibreDrawContext<T extends Record<string, {}>> {
  options: Options<T>;
  api;
  ui;
  events;
  setup: Setup<T> | undefined;

  get setupOrThrow() {
    if (!this.setup) {
      throw new Error('tried to access MaplibreDrawContext.setup, but it was undefined. Maplibre GL Draw is not added to the map yet');
    }

    return this.setup;
  }

  get controlContainer () {
    return this.setupOrThrow.controlContainer;
  }

  get map () {
    return this.setupOrThrow.map;
  }

  get store () {
    return this.setupOrThrow.store;
  }

  get container () {
    return this.setupOrThrow.container;
  }

  get boxZoomInitial () {
    return this.setupOrThrow.boxZoomInitial;
  }

  constructor(options: Options<T>) {
    this.options = options;
    this.api = new MaplibreDrawApi(this);
    this.ui = ui(this);
    this.events = new Events(this);
  }
}
