let lastPosition = null;
let warningShown = false;

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function minDistanceToPolylineMeters(posLat, posLon, path) {
  if (!Array.isArray(path) || path.length === 0) return 0;
  if (path.length === 1) {
    const node = path[0];
    const nLat = Number(Array.isArray(node) ? node[0] : node?.lat ?? node?.latitude);
    const nLon = Number(Array.isArray(node) ? node[1] : node?.lon ?? node?.longitude);
    const cosLat = Math.cos(toRadians(posLat));
    return Math.hypot((posLat - nLat) * 111_320, (posLon - nLon) * 111_320 * cosLat);
  }

  const cosLat = Math.cos(toRadians(posLat));
  const px = posLon * 111_320 * cosLat;
  const py = posLat * 111_320;

  let minDistance = Infinity;

  for (let i = 0; i < path.length - 1; i++) {
    const nodeA = path[i];
    const nodeB = path[i + 1];

    const aLat = Number(Array.isArray(nodeA) ? nodeA[0] : nodeA?.lat ?? nodeA?.latitude);
    const aLon = Number(Array.isArray(nodeA) ? nodeA[1] : nodeA?.lon ?? nodeA?.longitude);
    const bLat = Number(Array.isArray(nodeB) ? nodeB[0] : nodeB?.lat ?? nodeB?.latitude);
    const bLon = Number(Array.isArray(nodeB) ? nodeB[1] : nodeB?.lon ?? nodeB?.longitude);

    if (isNaN(aLat) || isNaN(aLon) || isNaN(bLat) || isNaN(bLon)) continue;

    const ax = aLon * 111_320 * cosLat;
    const ay = aLat * 111_320;
    const bx = bLon * 111_320 * cosLat;
    const by = bLat * 111_320;

    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;

    let dist = 0;
    if (lenSq === 0) {
      dist = Math.hypot(px - ax, py - ay);
    } else {
      let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const projX = ax + t * dx;
      const projY = ay + t * dy;
      dist = Math.hypot(px - projX, py - projY);
    }

    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  return minDistance === Infinity ? 0 : minDistance;
}

export function monitorRouteDeviation(currentPosition, selectedRoute, thresholdMeters = 80) {
  if (!currentPosition || !selectedRoute?.path?.length) return null;

  const position = {
    latitude: Number(currentPosition[0] ?? currentPosition.lat ?? currentPosition.latitude),
    longitude: Number(currentPosition[1] ?? currentPosition.lon ?? currentPosition.longitude),
  };

  if (!Number.isFinite(position.latitude) || !Number.isFinite(position.longitude)) return null;

  const distanceMeters = minDistanceToPolylineMeters(position.latitude, position.longitude, selectedRoute.path);

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
