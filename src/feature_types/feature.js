import {generateID} from '../lib/id.js';
import * as Constants from '../constants.js';

class Feature {
  /**
   * @param {any} ctx
   * @param {import('geojson').Feature} geojson
   */
  constructor(ctx, {properties, geometry, id}) {
    this.ctx = ctx;
    this.properties = properties || {};
    this.coordinates = geometry.coordinates;
    this.id = id || generateID();
    this.type = geometry.type;
  }

  changed() {
    this.ctx.store.featureChanged(this.id);
  }

  incomingCoords(coords) {
    this.setCoordinates(coords);
  }

  setCoordinates(coords) {
    this.coordinates = coords;
    this.changed();
  }

  getCoordinates() {
    return JSON.parse(JSON.stringify(this.coordinates));
  }

  setProperty(property, value) {
    this.properties[property] = value;
  }

  toGeoJSON() {
    return JSON.parse(JSON.stringify({
      id: this.id,
      type: Constants.geojsonTypes.FEATURE,
      properties: this.properties,
      geometry: {
        coordinates: this.getCoordinates(),
        type: this.type
      }
    }));
  }

  internal(mode) {
    const properties = {
      id: this.id,
      meta: Constants.meta.FEATURE,
      'meta:type': this.type,
      active: Constants.activeStates.INACTIVE,
      mode
    };

    if (this.ctx.options.userProperties) {
      for (const name in this.properties) {
        properties[`user_${name}`] = this.properties[name];
      }
    }

    return {
      type: Constants.geojsonTypes.FEATURE,
      properties,
      geometry: {
        coordinates: this.getCoordinates(),
        type: this.type
      }
    };
  }
}

export default Feature;
