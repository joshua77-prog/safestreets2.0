let lastPosition = null;
let warningShown = false;

export function monitorRouteDeviation(currentPosition, selectedRoute, thresholdMeters = 80) {
  if (!currentPosition || !selectedRoute?.path?.length) return null;

  const position = {
    latitude: Number(currentPosition[0] ?? currentPosition.lat ?? currentPosition.latitude),
    longitude: Number(currentPosition[1] ?? currentPosition.lon ?? currentPosition.longitude),
  };

  if (!Number.isFinite(position.latitude) || !Number.isFinite(position.longitude)) return null;

  const latestReference = selectedRoute.path[selectedRoute.path.length - 1] ?? selectedRoute.path[0];
  const reference = {
    latitude: Number(latestReference[0] ?? latestReference.lat ?? latestReference.latitude),
    longitude: Number(latestReference[1] ?? latestReference.lon ?? latestReference.longitude),
  };

  const distanceMeters = Math.hypot(
    (position.latitude - reference.latitude) * 111_320,
    (position.longitude - reference.longitude) * 111_320
  );

  const deviation = {
    distanceMeters,
    thresholdMeters,
    warning: distanceMeters > thresholdMeters,
  };

  if (deviation.warning && !warningShown) {
    warningShown = true;
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([200, 100, 200]);
    return {
      ...deviation,
      message: 'Route deviation detected. Recalculation is recommended.',
    };
  }

  if (!deviation.warning) {
    warningShown = false;
  }

  lastPosition = position;
  return deviation;
}
