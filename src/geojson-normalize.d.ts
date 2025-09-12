declare module '@mapbox/geojson-normalize' {
	import type * as G from 'geojson';

	export default function normalize(geojson: G.Feature | G.FeatureCollection | G.Geometry): G.FeatureCollection;
}
