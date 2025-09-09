export const classes = /** @type {const} */ ({
  CANVAS: 'maplibre-canvas',
  CONTROL_BASE: 'maplibre-ctrl',
  CONTROL_PREFIX: 'maplibre-ctrl-',
  CONTROL_BUTTON: 'maplibre-gl-draw_ctrl-draw-btn',
  CONTROL_BUTTON_LINE: 'maplibre-gl-draw_line',
  CONTROL_BUTTON_POLYGON: 'maplibre-gl-draw_polygon',
  CONTROL_BUTTON_POINT: 'maplibre-gl-draw_point',
  CONTROL_BUTTON_TRASH: 'maplibre-gl-draw_trash',
  CONTROL_BUTTON_COMBINE_FEATURES: 'maplibre-gl-draw_combine',
  CONTROL_BUTTON_UNCOMBINE_FEATURES: 'maplibre-gl-draw_uncombine',
  CONTROL_GROUP: 'maplibre-ctrl-group',
  ATTRIBUTION: 'maplibre-ctrl-attrib',
  ACTIVE_BUTTON: 'active',
  BOX_SELECT: 'maplibre-gl-draw_boxselect'
});

export const sources = /** @type {const} */ ({
  HOT: 'maplibre-gl-draw-hot',
  COLD: 'maplibre-gl-draw-cold'
});

export const cursors = /** @type {const} */ ({
  ADD: 'add',
  MOVE: 'move',
  DRAG: 'drag',
  POINTER: 'pointer',
  NONE: 'none'
});

export const types = /** @type {const} */ ({
  POLYGON: 'polygon',
  LINE: 'line_string',
  POINT: 'point'
});

export const geojsonTypes = /** @type {const} */ ({
  FEATURE: 'Feature',
  POLYGON: 'Polygon',
  LINE_STRING: 'LineString',
  POINT: 'Point',
  FEATURE_COLLECTION: 'FeatureCollection',
  MULTI_PREFIX: 'Multi',
  MULTI_POINT: 'MultiPoint',
  MULTI_LINE_STRING: 'MultiLineString',
  MULTI_POLYGON: 'MultiPolygon'
});

export const modes = /** @type {const} */ ({
  DRAW_LINE_STRING: 'draw_line_string',
  DRAW_POLYGON: 'draw_polygon',
  DRAW_POINT: 'draw_point',
  SIMPLE_SELECT: 'simple_select',
  DIRECT_SELECT: 'direct_select'
});

export const events = /** @type {const} */ ({
  CREATE: 'draw.create',
  DELETE: 'draw.delete',
  UPDATE: 'draw.update',
  SELECTION_CHANGE: 'draw.selectionchange',
  MODE_CHANGE: 'draw.modechange',
  ACTIONABLE: 'draw.actionable',
  RENDER: 'draw.render',
  COMBINE_FEATURES: 'draw.combine',
  UNCOMBINE_FEATURES: 'draw.uncombine'
});

export const updateActions = /** @type {const} */ ({
  MOVE: 'move',
  CHANGE_PROPERTIES: 'change_properties',
  CHANGE_COORDINATES: 'change_coordinates'
});

export const meta = /** @type {const} */ ({
  FEATURE: 'feature',
  MIDPOINT: 'midpoint',
  VERTEX: 'vertex'
});

export const activeStates = /** @type {const} */ ({
  ACTIVE: 'true',
  INACTIVE: 'false'
});

export const interactions = /** @type {const} */ ([
  'scrollZoom',
  'boxZoom',
  'dragRotate',
  'dragPan',
  'keyboard',
  'doubleClickZoom',
  'touchZoomRotate'
]);

export const LAT_MIN = -90;
export const LAT_RENDERED_MIN = -85;
export const LAT_MAX = 90;
export const LAT_RENDERED_MAX = 85;
export const LNG_MIN = -270;
export const LNG_MAX = 270;
