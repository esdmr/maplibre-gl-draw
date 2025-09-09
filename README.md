# @esdmr/maplibre-gl-draw

Adds support for drawing and editing features on [maplibre-gl.js](https://maplibre.org/maplibre-gl-js/docs/) maps.

**Requires [maplibre-gl-js](https://maplibre.org/maplibre-gl-js/docs/).**

**If you are developing with `maplibre-gl-draw`, see [API.md](https://github.com/esdmr/maplibre-gl-draw/blob/main/docs/API.md) for documentation.**

### Installing

```
npm install @esdmr/maplibre-gl-draw
```

Draw ships with CSS, make sure you include it in your build.

### Usage in your application

#### JavaScript

```js
import maplibregl from 'maplibre-gl';
import MaplibreDraw from "@esdmr/maplibre-gl-draw";
```

#### CSS

 ```js
import '@esdmr/maplibre-gl-draw/dist/maplibre-gl-draw.css'
 ```

### Example usage

```js
var map = new Map({
  container: 'map',
  style: '...',
  center: [40, -74.50],
  zoom: 9
});

var Draw = new MaplibreDraw();

// Map#addControl takes an optional second argument to set the position of the control.
// If no position is specified the control defaults to `top-right`.

map.addControl(Draw, 'top-left');

map.on('load', function() {
  // ALL YOUR APPLICATION CODE
});
```

### See [API.md](https://github.com/esdmr/maplibre-gl-draw/blob/main/docs/API.md) for complete reference.

### Enhancements and New Interactions

For additional functionality [check out our list of custom modes](https://github.com/esdmr/maplibre-gl-draw/blob/main/docs/MODES.md#available-custom-modes).

Maplibre Draw accepts functionality changes after the functionality has been proven out via a [custom mode](https://github.com/esdmr/maplibre-gl-draw/blob/main/docs/MODES.md#creating-modes-for-maplibre-draw). This lets users experiment and validate their mode before entering a review process, hopefully promoting innovation. When you write a custom mode, please open a PR adding it to our [list of custom modes](https://github.com/esdmr/maplibre-gl-draw/blob/main/docs/MODES.md#available-custom-modes).

### Developing and testing

```
git clone git@github.com:esdmr/maplibre-gl-draw.git
npm ci
```

### Testing

```
npm run test
```

### Publishing

To GitHub and NPM:

```
npm version (major|minor|patch)
git push --tags
git push
npm publish
```

### Naming actions

We're trying to follow standards when naming things. Here is a collection of links where we look for inspiration.

- https://turfjs.org
- https://shapely.readthedocs.io/en/latest/manual.html
