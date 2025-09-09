import runSetup from './src/setup.js';
import setupOptions from './src/options.js';
import setupAPI from './src/api.js';
import modes from './src/modes/index.js';
import * as Constants from './src/constants.js';
import * as lib from './src/lib/index.js';


class MaplibreDraw {
  static modes = modes;
  static constants = Constants;
  static lib = lib;

  constructor(options) {
    options = setupOptions(options);

    const ctx = {
      options,
      api: this,
    };

    setupAPI(ctx, this);

    const setup = runSetup(ctx);

    this.onAdd = setup.onAdd;
    this.onRemove = setup.onRemove;
    this.types = Constants.types;
    this.options = options;
  }
}

export default MaplibreDraw;
