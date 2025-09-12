export const classes = ({
  CANVAS: 'maplibre-canvas',
  CONTROL_BASE: 'maplibregl-ctrl',
  CONTROL_PREFIX: 'maplibregl-ctrl-',
  CONTROL_BUTTON: 'maplibregl-draw_ctrl-draw-btn',
  CONTROL_BUTTON_LINE: 'maplibregl-draw_line',
  CONTROL_BUTTON_POLYGON: 'maplibregl-draw_polygon',
  CONTROL_BUTTON_POINT: 'maplibregl-draw_point',
  CONTROL_BUTTON_TRASH: 'maplibregl-draw_trash',
  CONTROL_BUTTON_COMBINE_FEATURES: 'maplibregl-draw_combine',
  CONTROL_BUTTON_UNCOMBINE_FEATURES: 'maplibregl-draw_uncombine',
  CONTROL_GROUP: 'maplibregl-ctrl-group',
  ATTRIBUTION: 'maplibregl-ctrl-attrib',
  ACTIVE_BUTTON: 'active',
  BOX_SELECT: 'maplibregl-draw_boxselect'
}) as const;

export const sources = ({
  HOT: 'maplibregl-draw-hot',
  COLD: 'maplibregl-draw-cold'
}) as const;

export const cursors = ({
  ADD: 'add',
  MOVE: 'move',
  DRAG: 'drag',
  POINTER: 'pointer',
  NONE: 'none'
}) as const;

export const types = ({
  POLYGON: 'polygon',
  LINE: 'line_string',
  POINT: 'point'
}) as const;

export const geojsonTypes = ({
  FEATURE: 'Feature',
  POLYGON: 'Polygon',
  LINE_STRING: 'LineString',
  POINT: 'Point',
  FEATURE_COLLECTION: 'FeatureCollection',
  MULTI_PREFIX: 'Multi',
  MULTI_POINT: 'MultiPoint',
  MULTI_LINE_STRING: 'MultiLineString',
  MULTI_POLYGON: 'MultiPolygon'
}) as const;

export const modes = ({
  DRAW_LINE_STRING: 'draw_line_string',
  DRAW_POLYGON: 'draw_polygon',
  DRAW_POINT: 'draw_point',
  SIMPLE_SELECT: 'simple_select',
  DIRECT_SELECT: 'direct_select'
}) as const;

export const events = ({
  CREATE: 'draw.create',
  DELETE: 'draw.delete',
  UPDATE: 'draw.update',
  SELECTION_CHANGE: 'draw.selectionchange',
  MODE_CHANGE: 'draw.modechange',
  ACTIONABLE: 'draw.actionable',
  RENDER: 'draw.render',
  COMBINE_FEATURES: 'draw.combine',
  UNCOMBINE_FEATURES: 'draw.uncombine'
}) as const;

export const updateActions = ({
  MOVE: 'move',
  CHANGE_PROPERTIES: 'change_properties',
  CHANGE_COORDINATES: 'change_coordinates'
}) as const;

export const meta = ({
  FEATURE: 'feature',
  MIDPOINT: 'midpoint',
  VERTEX: 'vertex'
}) as const;

export const activeStates = ({
  ACTIVE: 'true',
  INACTIVE: 'false'
}) as const;

export const interactions = ([
  'scrollZoom',
  'boxZoom',
  'dragRotate',
  'dragPan',
  'keyboard',
  'doubleClickZoom',
  'touchZoomRotate'
]) as const;

export const LAT_MIN = -90;
export const LAT_RENDERED_MIN = -85;
export const LAT_MAX = 90;
export const LAT_RENDERED_MAX = 85;
export const LNG_MIN = -270;
export const LNG_MAX = 270;
