import type { GeoJSONSource } from 'maplibre-gl';
import * as Constants from './constants.ts';
import type Store from './store.ts';

export default function render<T extends Record<string, {}>>(store: Store<T>) {
  const mapExists = store.ctx.setup && store.ctx.map.getSource(Constants.sources.HOT) !== undefined;
  if (!mapExists) return cleanup();

  const mode = store.ctx.events.currentModeName;

  store.ctx.ui.queueMapClasses({ mode: String(mode) });

  let newHotIds: (string | number)[] = [];
  let newColdIds: (string | number)[] = [];

  if (store.isDirty) {
    newColdIds = store.getAllIds();
  } else {
    newHotIds = store.getChangedIds().filter(id => store.get(id) !== undefined);
    newColdIds = store.sources.hot.filter(({properties}) => properties?.id && !newHotIds.includes(properties.id) && store.get(properties.id) !== undefined).map(({properties}) => properties!.id);
  }

  store.sources.hot = [];
  const lastColdCount = store.sources.cold.length;
  store.sources.cold = store.isDirty ? [] : store.sources.cold.filter(({properties}) => !newHotIds.includes((properties?.id || properties?.parent)));

  const coldChanged = lastColdCount !== store.sources.cold.length || newColdIds.length > 0;
  newHotIds.forEach(id => renderFeature(id, 'hot'));
  newColdIds.forEach(id => renderFeature(id, 'cold'));

  function renderFeature(id: string | number, source: 'hot' | 'cold') {
    const feature = store.get(id);

    if (!feature) {
      console.warn('maplibre-gl-draw/render/renderFeature called on a unknown feature id. ignoring.');
      return;
    }

    const featureInternal = feature.internal(mode);
    store.ctx.events.currentModeRender(featureInternal, (geojson) => {
      geojson.properties ??= {};
      geojson.properties.mode = mode;
      store.sources[source].push(geojson);
    });
  }

  if (coldChanged) {
    store.ctx.map.getSource<GeoJSONSource>(Constants.sources.COLD)!.setData({
      type: Constants.geojsonTypes.FEATURE_COLLECTION,
      features: store.sources.cold
    });
  }

  store.ctx.map.getSource<GeoJSONSource>(Constants.sources.HOT)!.setData({
    type: Constants.geojsonTypes.FEATURE_COLLECTION,
    features: store.sources.hot
  });

  cleanup();

  function cleanup() {
    store.isDirty = false;
    store.clearChangedIds();
  }
}
