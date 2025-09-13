import type { LayerSpecification } from 'maplibre-gl';
import * as Constants from './constants.ts';

import styles from './lib/theme.ts';
import * as modes from './modes/index.ts';
import type { ModeConstructors, ModeOptEntry, ModeOpts } from './modes/mode_interface.ts';

type OmitSource<T> = T extends infer S ? Omit<S, 'source'> : never;

export type DrawLayerSpecification = OmitSource<LayerSpecification>;

export type ControlOptions = {
  point: boolean;
  line_string: boolean;
  polygon: boolean;
  trash: boolean;
  combine_features: boolean;
  uncombine_features: boolean
};

export type Options<T extends Record<string, {}>> = {
  defaultMode: ModeOptEntry<T>;
  keybindings: boolean;
  touchEnabled: boolean;
  clickBuffer: number;
  touchBuffer: number;
  boxSelect: boolean;
  displayControlsDefault: boolean;
  styles: LayerSpecification[];
  modes: ModeConstructors<T>;
  controls: ControlOptions;
  userProperties: boolean;
  suppressAPIEvents: boolean;
};

export type PartialOptions<T extends Record<string, {}>> = Omit<Partial<Options<T>>, 'controls' | 'styles'> & {
  controls?: Partial<ControlOptions>;
  styles?: DrawLayerSpecification[];
};

const showControls: ControlOptions = {
  point: true,
  line_string: true,
  polygon: true,
  trash: true,
  combine_features: true,
  uncombine_features: true
};

const hideControls: ControlOptions = {
  point: false,
  line_string: false,
  polygon: false,
  trash: false,
  combine_features: false,
  uncombine_features: false
};

export type DefaultModeOpts = ModeOpts<typeof modes>;

export const defaultOptions = {
  defaultMode: [Constants.modes.SIMPLE_SELECT, {}],
  keybindings: true,
  touchEnabled: true,
  clickBuffer: 2,
  touchBuffer: 25,
  boxSelect: true,
  displayControlsDefault: true,
  styles: styles as LayerSpecification[],
  modes,
  controls: showControls,
  userProperties: false,
  suppressAPIEvents: true
} as const satisfies Options<DefaultModeOpts>;

function addSources(styles: DrawLayerSpecification[], sourceBucket: 'cold' | 'hot') {
  return styles.map<LayerSpecification>((style) => ({
    ...style,
    id: `${style.id}.${sourceBucket}`,
    source: (sourceBucket === 'hot') ? Constants.sources.HOT : Constants.sources.COLD,
  }));
}

export default function setupOptions(options?: PartialOptions<DefaultModeOpts>): Options<DefaultModeOpts>;

export default function setupOptions<T extends Pick<typeof defaultOptions.modes, typeof defaultOptions.defaultMode[0]> & Record<string, {}>>(options: PartialOptions<T>): Options<T>;

export default function setupOptions<T extends Record<string, {}>>(options: Omit<PartialOptions<T>, 'defaultMode'> & {
  defaultMode: ModeOptEntry<T>,
}): Options<T>;

export default function setupOptions(options: PartialOptions<any> = {}): Options<any> {
  if (!(
    (options.defaultMode ?? defaultOptions.defaultMode)[0] in
    (options.modes as Record<string, any> ?? defaultOptions.modes)
  )) {
    throw new Error(`Default Maplibre GL Draw mode '${String((options.defaultMode ?? defaultOptions.defaultMode))}' is not defined`);
  }

  const styles = options.styles ?? defaultOptions.styles;

  return {
    ...defaultOptions,
    ...options,
    controls: {
      ...options.displayControlsDefault === false ? hideControls : showControls,
      ...options.controls,
    },
    // Layers with a shared source should be adjacent for performance reasons
    styles: [
      ...addSources(styles, 'cold'),
      ...addSources(styles, 'hot'),
    ],
  };
}
