function isEventAtCoordinates({lngLat}, coordinates) {
  if (!lngLat) return false;
  return lngLat.lng === coordinates[0] && lngLat.lat === coordinates[1];
}

export default isEventAtCoordinates;
