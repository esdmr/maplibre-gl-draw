import type MaplibreDrawApi from './src/api.ts';
import * as Constants from './src/constants.ts';
import { MaplibreDrawContext } from './src/context.ts';
import * as lib from './src/lib/index.ts';
import * as modes from './src/modes/index.ts';
import type { ModeOptEntry } from './src/modes/mode_interface.ts';
import type { DefaultModeOpts, defaultOptions, PartialOptions } from './src/options.ts';
import setupOptions from './src/options.ts';

export default function MaplibreDraw(options?: PartialOptions<DefaultModeOpts>): MaplibreDrawApi<DefaultModeOpts>;

export default function MaplibreDraw<T extends Pick<typeof defaultOptions.modes, typeof defaultOptions.defaultMode[0]> & Record<string, {}>>(options: PartialOptions<T>): MaplibreDrawApi<T>;

export default function MaplibreDraw<T extends Record<string, {}>>(options: Omit<PartialOptions<T>, 'defaultMode'> & {
  defaultMode: ModeOptEntry<T>,
}): MaplibreDrawApi<T>;

export default function MaplibreDraw(options: PartialOptions<any> = {}) {
  const context = new MaplibreDrawContext(setupOptions(options));
  return context.api as MaplibreDrawApi<any>;
}

MaplibreDraw.modes = modes;
MaplibreDraw.constants = Constants;
MaplibreDraw.lib = lib;
