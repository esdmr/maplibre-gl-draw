import type { Feature } from 'geojson';
import ModeInterface from './mode_interface.ts';

export default class Static extends ModeInterface<{}, {}> {
  protected override onSetup () {
    this.setActionableState();
    return {};
  }

  protected override toDisplayFeatures (_state: {}, geojson: Feature, display: (geojson: Feature) => void) {
    display(geojson);
  }
}
