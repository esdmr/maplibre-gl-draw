declare module '@mapbox/geojson-normalize' {
	import type {Feature, FeatureCollection, Geometry} from 'geojson';

	export default function normalize(geojson: Feature | FeatureCollection | Geometry): FeatureCollection;
}
