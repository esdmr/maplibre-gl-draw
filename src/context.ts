import MaplibreDrawApi from './api.js';
import type { Options } from './options.js';
import Setup from './setup.js';

export class MaplibreDrawContext<T extends Record<string, {}>> {
  options: Options<T>;
  api = new MaplibreDrawApi(this);
  setup: Setup<T> | undefined;

  get setupOrThrow() {
    if (!this.setup) {
      throw new Error('tried to access MaplibreDrawContext.setup, but it was undefined. Maplibre GL Draw is not added to the map yet');
    }

    return this.setup;
  }

  get controlContainerOrThrow () {
    return this.setupOrThrow.controlContainer;
  }

  get mapOrThrow () {
    return this.setupOrThrow.map;
  }

  get storeOrThrow () {
    return this.setupOrThrow.store;
  }

  get uiOrThrow () {
    return this.setupOrThrow.ui;
  }

  get eventsOrThrow () {
    return this.setupOrThrow.events;
  }

  get containerOrThrow () {
    return this.setupOrThrow.container;
  }

  get boxZoomInitialOrThrow () {
    return this.setupOrThrow.boxZoomInitial;
  }

  constructor(options: Options<T>) {
    this.options = options;
  }
}
