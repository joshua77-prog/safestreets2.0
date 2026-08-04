/**
 * Route Safety Analysis Service - Phase 2 (Final)
 * Analyzes route geometry and collects all safety-related records located within 1 km (1000 meters) of any route coordinate.
 * Calculates shortest distance_from_route (in meters) and sorts nearest-first.
 */

const SEARCH_RADIUS_METERS = 1000;

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Analyzes route coordinates and collects nearby safety records from BOTH community_reports and safety_analysis.
 * Calculates distance_from_route (shortest distance in meters) and sorts results nearest-first.
 *
 * @param {Object} route - Route object containing path (array of [lat, lon]), distance, and duration
 * @param {Array} communityReports - Collection of records from community_reports table
 * @param {Array} safetyData - Collection of records from safety_analysis table
 * @returns {Object} Grouped & sorted safety information within 1000m of the route
 */
export function analyzeRouteSafetyData(route, communityReports = [], safetyData = []) {
  const path = route?.path ?? [];
  const routeDistance = route?.distance ?? "0 km";
  const routeDuration = route?.duration ?? "0 mins";

  if (!Array.isArray(path) || path.length === 0) {
    return {
      routeDistance,
      routeDuration,
      positiveReports: [],
      negativeReports: [],
      historicalReports: [],
      allNearbySafetyData: []
    };
  }

  const matchedCommunityReportsMap = new Map();
  const matchedSafetyAnalysisMap = new Map();

  // Iterate through every coordinate along the route
  path.forEach((coord) => {
    const lat = Array.isArray(coord) ? coord[0] : coord?.lat ?? coord?.latitude;
    const lon = Array.isArray(coord) ? coord[1] : coord?.lon ?? coord?.longitude;

    if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) return;

    // Search community_reports
    (communityReports || []).forEach((report) => {
      const repLat = Number(report.latitude);
      const repLon = Number(report.longitude);
      if (isNaN(repLat) || isNaN(repLon)) return;

      const distMeters = Math.round(haversineDistanceMeters(lat, lon, repLat, repLon));
      if (distMeters <= SEARCH_RADIUS_METERS) {
        const reportKey = report.id ?? `${repLat}_${repLon}_${report.category || report.report_type}`;
        const existing = matchedCommunityReportsMap.get(reportKey);
        
        if (!existing || distMeters < existing.distance_from_route) {
          matchedCommunityReportsMap.set(reportKey, {
            id: report.id || reportKey,
            report_type: report.report_type || "Observation",
            category: report.category || report.issue_type || "General Observation",
            latitude: repLat,
            longitude: repLon,
            safety_rating: Number(report.safety_rating ?? 3),
            intelligence_briefing: report.intelligence_briefing || report.description || "No briefing details provided.",
            time_cycle: report.time_cycle || "Anytime",
            created_at: report.created_at || report.created_date || new Date().toISOString(),
            distance_from_route: distMeters,
            raw: report
          });
        }
      }
    });

    // Search safety_analysis concurrently (do not treat as fallback)
    (safetyData || []).forEach((item) => {
      const itemLat = Number(item.latitude);
      const itemLon = Number(item.longitude);
      if (isNaN(itemLat) || isNaN(itemLon)) return;

      const distMeters = Math.round(haversineDistanceMeters(lat, lon, itemLat, itemLon));
      if (distMeters <= SEARCH_RADIUS_METERS) {
        const itemKey = item.id ?? `${itemLat}_${itemLon}_${item.city || item.area || 'historical'}`;
        const existing = matchedSafetyAnalysisMap.get(itemKey);

        if (!existing || distMeters < existing.distance_from_route) {
          const score = Number(item.safety_score ?? item.safetyScore ?? 70);
          const computedRating = Math.max(1, Math.min(5, Math.round(score / 20)));

          matchedSafetyAnalysisMap.set(itemKey, {
            id: item.id || itemKey,
            city: item.city || item.location_name || item.area || "Area Sentinel",
            area: item.area || item.city || "Sector",
            category: item.area ? `Sector: ${item.area}` : item.city ? `City: ${item.city}` : "Historical Safety Zone",
            latitude: itemLat,
            longitude: itemLon,
            safety_rating: computedRating,
            safety_score: score,
            crime_count: Number(item.crime_count ?? item.crimeCount ?? 0),
            lighting_score: Number(item.lighting_score ?? item.lightingScore ?? 5),
            police_station_distance_km: Number(item.police_station_distance_km ?? item.policeStationDistanceKm ?? 0),
            crowd_density: Number(item.crowd_density ?? item.crowdDensity ?? 0),
            time_cycle: "Historical Record",
            intelligence_briefing: `Historical Crime Count: ${item.crime_count ?? 0}, Lighting Score: ${item.lighting_score ?? 0}/10, Police Station Distance: ${item.police_station_distance_km ?? 0} km`,
            distance_from_route: distMeters,
            raw: item
          });
        }
      }
    });
  });

  const matchedCommunityReports = Array.from(matchedCommunityReportsMap.values());
  const matchedSafetyAnalysis = Array.from(matchedSafetyAnalysisMap.values());

  // Group community reports into Positive and Negative reports, sorted by distance_from_route ascending
  const positiveReports = matchedCommunityReports
    .filter((rep) => {
      const typeStr = (rep.report_type || "").toLowerCase();
      return typeStr.includes("positive") || typeStr === "safe_zone";
    })
    .sort((a, b) => a.distance_from_route - b.distance_from_route);

  const negativeReports = matchedCommunityReports
    .filter((rep) => {
      const typeStr = (rep.report_type || "").toLowerCase();
      return !typeStr.includes("positive") && typeStr !== "safe_zone";
    })
    .sort((a, b) => a.distance_from_route - b.distance_from_route);

  const historicalReports = matchedSafetyAnalysis
    .sort((a, b) => a.distance_from_route - b.distance_from_route);

  const allNearbySafetyData = [...matchedCommunityReports, ...matchedSafetyAnalysis]
    .sort((a, b) => a.distance_from_route - b.distance_from_route);

  return {
    routeDistance,
    routeDuration,
    positiveReports,
    negativeReports,
    historicalReports,
    allNearbySafetyData
  };
}
