function normalizeCoords(value) {
  if (!value) return null;

  if (Array.isArray(value)) {
    return { lat: Number(value[0]), lon: Number(value[1]) };
  }

  if (value.coords) {
    return { lat: Number(value.coords[0]), lon: Number(value.coords[1]) };
  }

  if (value.lat != null && value.lon != null) {
    return { lat: Number(value.lat), lon: Number(value.lon) };
  }

  return null;
}

function haversineDistanceKm(from, to) {
  if (!from || !to) return Number.POSITIVE_INFINITY;

  const earthRadiusKm = 6371;
  const latDelta = ((to.lat - from.lat) * Math.PI) / 180;
  const lonDelta = ((to.lon - from.lon) * Math.PI) / 180;
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) * Math.cos((to.lat * Math.PI) / 180) * Math.sin(lonDelta / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

function getNearestSafetyRecord(point, safetyData = []) {
  if (!point || safetyData.length === 0) return null;

  return safetyData.reduce((closest, record) => {
    const distance = haversineDistanceKm(point, {
      lat: Number(record.latitude),
      lon: Number(record.longitude),
    });

    if (!closest) return record;

    return distance < haversineDistanceKm(point, {
      lat: Number(closest.latitude),
      lon: Number(closest.longitude),
    })
      ? record
      : closest;
  }, null);
}

function calculateRouteSafetyScore(path, safetyData = [], communityReports = []) {
  if (!path?.length) return 72;

  const scores = path.map((point) => {
    const record = getNearestSafetyRecord({ lat: point[0], lon: point[1] }, safetyData);
    if (!record) return 72;

    const historical = Number(record.safety_score ?? 0) * 2;
    const lighting = Number(record.lighting_score ?? 0) * 1.2;
    const policePenalty = Number(record.police_station_distance_km ?? 0) * 0.8;
    const crowdPenalty = Number(record.crowd_density ?? 0) * 0.8;
    const crimePenalty = Number(record.crime_count ?? 0) * 2.5;
    const reportPenalty = communityReports.length * 2;
    const score = 70 + historical + lighting - crimePenalty - policePenalty - crowdPenalty - reportPenalty;

    return Math.max(0, Math.min(100, Math.round(score)));
  });

  return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}

export function toLeafletPath(geometry) {
  if (!geometry) return [];

  const coordinates = geometry.coordinates ?? geometry?.features?.[0]?.geometry?.coordinates ?? [];
  return coordinates.map(([lon, lat]) => [lat, lon]);
}

export function buildRouteSummary(routeData, routeIndex = 0, label = "fast", safetyContext = {}) {
  const route = routeData?.routes?.[routeIndex] ?? routeData?.routes?.[0] ?? routeData ?? {};
  const geometry = route.geometry ?? routeData?.geometry ?? routeData?.features?.[0]?.geometry ?? null;
  const distanceMeters = Number(route.distance ?? routeData?.distance ?? 0);
  const durationSeconds = Number(route.duration ?? routeData?.duration ?? 0);

  const path = toLeafletPath(geometry);
  const distanceKm = distanceMeters / 1000;
  const distanceLabel = distanceMeters >= 1000
    ? `${distanceKm.toFixed(1)} km`
    : `${Math.round(distanceMeters)} m`;

  const safetyScore = calculateRouteSafetyScore(path, safetyContext.safetyData ?? [], safetyContext.communityReports ?? []);
  const riskLevel = safetyScore >= 80 ? "Low" : safetyScore >= 60 ? "Medium" : "High";
  const warnings = [];

  if (label !== "safe") {
    warnings.push("Higher speed route may be less secure");
  }

  if (safetyScore < 70) {
    warnings.push("Unsafe segments detected near the corridor");
  }

  if ((safetyContext.communityReports ?? []).length > 0) {
    warnings.push("Community reports affect this corridor");
  }

  return {
    path,
    distance: distanceLabel,
    duration: `${Math.max(1, Math.round(durationSeconds / 60))} mins`,
    safetyScore,
    riskLevel,
    warnings,
  };
}

async function getRoute(from, to, preferredIndex = 0, label = "fast", safetyContext = {}) {
  const origin = normalizeCoords(from);
  const destination = normalizeCoords(to);

  if (!origin || !destination) {
    throw new Error("Both origin and destination coordinates are required.");
  }

  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson&alternatives=true`;
  const res = await fetch(osrmUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Route request failed with ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  const routes = data?.routes ?? [];
  const route = routes[preferredIndex] ?? routes[0];

  if (!route) {
    throw new Error("No route returned from OSRM.");
  }

  return buildRouteSummary(
    { routes },
    preferredIndex,
    label,
    safetyContext
  );
}

export async function getFastestRoute(from, to, safetyContext = {}) {
  return getRoute(from, to, 0, "fast", safetyContext);
}

export async function getSafestRoute(from, to, safetyContext = {}) {
  return getRoute(from, to, 1, "safe", safetyContext);
}
