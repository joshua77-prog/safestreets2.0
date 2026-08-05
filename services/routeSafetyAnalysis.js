/**
 * Route Safety Analysis Service
 * Analyzes route geometry and collects all safety-related records located within 1 km (1000 meters) of any route coordinate.
 * Calculates shortest distance_from_route (in meters) and dynamic danger zones.
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
 * Builds dynamic danger zones from community reports and historical safety analysis records.
 */
export function buildDangerZones(safetyData = [], communityReports = []) {
  const dangerZonesMap = new Map();

  // 1. Process Community Reports (Negative observations create danger zones)
  (communityReports || []).forEach((rep) => {
    const lat = Number(rep.latitude);
    const lon = Number(rep.longitude);
    if (isNaN(lat) || isNaN(lon)) return;

    const typeStr = (rep.report_type || "").toLowerCase();
    const isPositive = typeStr.includes("positive") || typeStr === "safe_zone";
    if (isPositive) return;

    const category = rep.category || rep.issue_type || rep.report_type || "Security Incident";
    const catLower = category.toLowerCase();
    
    let radius = 100;
    if (catLower.includes("assault") || catLower.includes("violence")) radius = 300;
    else if (catLower.includes("theft") || catLower.includes("robbery") || catLower.includes("pickpocket")) radius = 150;
    else if (catLower.includes("harassment") || catLower.includes("stalking")) radius = 100;
    else if (catLower.includes("suspicious")) radius = 150;
    else if (catLower.includes("lighting") || catLower.includes("isolated")) radius = 75;
    else if (catLower.includes("hazard") || catLower.includes("accident")) radius = 100;

    const safetyRating = Number(rep.safety_rating ?? 3);
    const baseSeverity = Math.max(10, Math.min(90, (5 - safetyRating) * 20));

    const key = rep.id ?? `danger_comm_${lat.toFixed(4)}_${lon.toFixed(4)}`;
    dangerZonesMap.set(key, {
      id: key,
      latitude: lat,
      longitude: lon,
      radius,
      severity: baseSeverity,
      category: `${category} Hotspot`,
      description: rep.intelligence_briefing || rep.description || `${category} reported nearby`,
      type: "community"
    });
  });

  // 2. Process Safety Analysis (Historical Records)
  (safetyData || []).forEach((item) => {
    const lat = Number(item.latitude);
    const lon = Number(item.longitude);
    if (isNaN(lat) || isNaN(lon)) return;

    const rawObj = item.raw || item;
    const crimeCount = Number(item.crime_count ?? rawObj.crime_count ?? 0);
    const crimeType = item.crime_type ?? rawObj.crime_type ?? item.category ?? "Other";
    const lightingScore = Number(item.lighting_score ?? rawObj.lighting_score ?? 5);

    const typeLower = String(crimeType).toLowerCase();
    let radius = 100;
    if (typeLower.includes("assault") || typeLower.includes("violence")) radius = 300;
    else if (typeLower.includes("theft") || typeLower.includes("robbery") || typeLower.includes("pickpocket")) radius = 150;
    else if (typeLower.includes("harassment") || typeLower.includes("stalking")) radius = 100;
    else if (typeLower.includes("suspicious")) radius = 150;
    else if (typeLower.includes("lighting") || lightingScore < 6) radius = 75;
    else if (typeLower.includes("hazard")) radius = 100;

    let baseSeverity = 20;
    if (typeLower.includes("assault") || typeLower.includes("violence")) baseSeverity = 80;
    else if (typeLower.includes("harassment")) baseSeverity = 60;
    else if (typeLower.includes("robbery") || typeLower.includes("theft")) baseSeverity = 50;
    else if (typeLower.includes("suspicious")) baseSeverity = 40;
    else if (lightingScore < 6) baseSeverity = 45;

    if (crimeCount > 5) baseSeverity += 20;
    baseSeverity = Math.min(100, baseSeverity);

    const key = item.id ?? `danger_hist_${lat.toFixed(4)}_${lon.toFixed(4)}`;
    dangerZonesMap.set(key, {
      id: key,
      latitude: lat,
      longitude: lon,
      radius,
      severity: baseSeverity,
      category: `Historical ${crimeType} Danger Zone`,
      description: `Historical risk: ${crimeType} (${crimeCount} incident/s), Lighting: ${lightingScore}/10`,
      type: "historical"
    });
  });

  return Array.from(dangerZonesMap.values());
}

/**
 * Requirement 5: Calculates danger penalties for a route passing through dynamic danger zones.
 * Inside danger radius: +100 penalty
 * Within 50 m: +75
 * Within 100 m: +50
 * Within 250 m: +25
 * Within 500 m: +10
 * Outside: 0
 */
export function calculateDangerPenalties(path = [], dangerZones = []) {
  if (!Array.isArray(path) || path.length === 0 || !Array.isArray(dangerZones) || dangerZones.length === 0) {
    return {
      totalDangerPenalty: 0,
      penetratedDangerZones: []
    };
  }

  const penetratedMap = new Map();
  let totalDangerPenalty = 0;

  dangerZones.forEach((zone) => {
    let minDistance = Infinity;

    path.forEach((coord) => {
      const lat = Array.isArray(coord) ? coord[0] : coord?.lat ?? coord?.latitude;
      const lon = Array.isArray(coord) ? coord[1] : coord?.lon ?? coord?.longitude;
      if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) return;

      const dist = haversineDistanceMeters(lat, lon, zone.latitude, zone.longitude);
      if (dist < minDistance) {
        minDistance = dist;
      }
    });

    const distOutside = Math.max(0, minDistance - zone.radius);

    if (minDistance <= zone.radius || distOutside <= 500) {
      let basePenalty = 0;
      if (minDistance <= zone.radius) {
        basePenalty = 100;
      } else if (distOutside <= 50) {
        basePenalty = 75;
      } else if (distOutside <= 100) {
        basePenalty = 50;
      } else if (distOutside <= 250) {
        basePenalty = 25;
      } else if (distOutside <= 500) {
        basePenalty = 10;
      }

      const severityMult = Math.max(0.5, zone.severity / 50);
      const penalty = basePenalty * severityMult;
      totalDangerPenalty += penalty;

      penetratedMap.set(zone.id, {
        ...zone,
        distanceToRoute: Math.round(minDistance),
        distOutside: Math.round(distOutside),
        penalty: Math.round(penalty)
      });
    }
  });

  const penetratedDangerZones = Array.from(penetratedMap.values()).sort((a, b) => b.penalty - a.penalty);

  return {
    totalDangerPenalty: Math.round(totalDangerPenalty * 10) / 10,
    penetratedDangerZones
  };
}

/**
 * Analyzes route coordinates and collects nearby safety records from BOTH community_reports and safety_analysis.
 * Calculates distance_from_route (shortest distance in meters) and dynamic danger zone penalties.
 */
export function analyzeRouteSafetyData(route, communityReports = [], safetyData = []) {
  const path = route?.path ?? [];
  const routeDistance = route?.distance ?? "0 km";
  const routeDuration = route?.duration ?? "0 mins";

  const dangerZones = buildDangerZones(safetyData, communityReports);

  if (!Array.isArray(path) || path.length === 0) {
    return {
      routeDistance,
      routeDuration,
      positiveReports: [],
      negativeReports: [],
      historicalReports: [],
      allNearbySafetyData: [],
      dangerZones,
      totalDangerPenalty: 0,
      penetratedDangerZones: []
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
          const distance_weight = distMeters <= 50 ? 1.00
            : distMeters <= 100 ? 0.90
            : distMeters <= 250 ? 0.75
            : distMeters <= 500 ? 0.50
            : distMeters <= 750 ? 0.30
            : 0.10;

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
            distance_weight,
            raw: report
          });
        }
      }
    });

    // Search safety_analysis concurrently
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

          const rawObj = item.raw || item;
          const crime_count = Number(item.crime_count ?? rawObj.crime_count ?? item.crimeCount ?? rawObj.crimeCount ?? 0);
          const crime_type = item.crime_type ?? rawObj.crime_type ?? item.category ?? rawObj.category ?? item.report_type ?? "Other";
          const time_of_day = item.time_of_day ?? rawObj.time_of_day ?? item.time_cycle ?? rawObj.time_cycle ?? "Anytime";
          const lighting_score = Number(item.lighting_score ?? rawObj.lighting_score ?? item.lightingScore ?? rawObj.lightingScore ?? 5);
          const crowd_density = item.crowd_density ?? rawObj.crowd_density ?? "Medium";
          const incident_timestamp = item.incident_timestamp ?? rawObj.incident_timestamp;

          const policeDistRaw = item.police_station_distance ?? rawObj.police_station_distance ?? item.police_station_distance_km ?? rawObj.police_station_distance_km;
          const police_station_distance = policeDistRaw != null && policeDistRaw !== "" ? Number(policeDistRaw) : null;
          const police_station_distance_km = police_station_distance !== null ? (police_station_distance <= 50 ? police_station_distance : police_station_distance / 1000) : null;

          const distance_weight = distMeters <= 50 ? 1.00
            : distMeters <= 100 ? 0.90
            : distMeters <= 250 ? 0.75
            : distMeters <= 500 ? 0.50
            : distMeters <= 750 ? 0.30
            : 0.10;

          matchedSafetyAnalysisMap.set(itemKey, {
            id: item.id || itemKey,
            city: item.city || rawObj.city || item.location_name || item.area || "Area Sentinel",
            area: item.area || rawObj.area || item.city || "Sector",
            category: item.area ? `Sector: ${item.area}` : item.city ? `City: ${item.city}` : "Historical Safety Zone",
            latitude: itemLat,
            longitude: itemLon,
            crime_count,
            crime_type,
            time_of_day,
            lighting_score,
            police_station_distance,
            police_station_distance_km,
            crowd_density,
            incident_timestamp,
            time_cycle: time_of_day || "Historical Record",
            intelligence_briefing: `Historical Crime: ${crime_type} (${crime_count} incident/s), Lighting: ${lighting_score}/10, Police Station: ${police_station_distance_km !== null ? police_station_distance_km.toFixed(1) + ' km' : 'N/A'}, Density: ${crowd_density}`,
            distance_from_route: distMeters,
            distance_weight,
            raw: rawObj
          });
        }
      }
    });
  });

  const matchedCommunityReports = Array.from(matchedCommunityReportsMap.values());
  const matchedSafetyAnalysis = Array.from(matchedSafetyAnalysisMap.values());

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

  const dangerPenalties = calculateDangerPenalties(path, dangerZones);

  return {
    routeDistance,
    routeDuration,
    positiveReports,
    negativeReports,
    historicalReports,
    allNearbySafetyData,
    dangerZones,
    totalDangerPenalty: dangerPenalties.totalDangerPenalty,
    penetratedDangerZones: dangerPenalties.penetratedDangerZones
  };
}
