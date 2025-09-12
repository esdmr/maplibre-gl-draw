import type { MapMouseEvent } from 'maplibre-gl';
import * as Constants from '../constants.js';
import type { MaplibreDrawContext } from '../context.js';
import { featuresAtClick } from './features_at.js';

export default function getFeatureAtAndSetCursors<T extends Record<string, {}>>(event: MapMouseEvent, ctx: MaplibreDrawContext<T>) {
  const features = featuresAtClick(event, undefined, ctx);

  const classes: Record<string, string> = { mouse: Constants.cursors.NONE };

  if (features[0]) {
    classes.mouse = (features[0].properties?.active === Constants.activeStates.ACTIVE) ?
      Constants.cursors.MOVE : Constants.cursors.POINTER;
    classes.feature = features[0].properties?.meta;
  }

  // FIXME: Yet another hard coded behavior folks!
  if (typeof ctx.eventsOrThrow.currentModeName === 'string' && ctx.eventsOrThrow.currentModeName.includes('draw')) {
    classes.mouse = Constants.cursors.ADD;
  }

  ctx.uiOrThrow.queueMapClasses(classes);
  ctx.uiOrThrow.updateMapClasses();

  return features[0];
}
