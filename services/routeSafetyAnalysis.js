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
  const rawItems = [];

  // 1. Process Community Reports (Negative observations create danger zones)
  (communityReports || []).forEach((rep) => {
    const lat = Number(rep.latitude);
    const lon = Number(rep.longitude);
    if (isNaN(lat) || isNaN(lon)) return;

    const typeStr = (rep.report_type || "").toLowerCase();
    const isPositive = typeStr.includes("positive") || typeStr === "safe_zone";
    if (isPositive) return;

    const category = rep.category || rep.issue_type || rep.report_type || "Security Incident";
    const safetyRating = Number(rep.safety_rating ?? 3);
    const baseSeverity = Math.max(10, Math.min(90, (5 - safetyRating) * 20));

    rawItems.push({
      id: rep.id ?? `danger_comm_${lat.toFixed(4)}_${lon.toFixed(4)}`,
      latitude: lat,
      longitude: lon,
      severity: baseSeverity,
      category: `${category} Hotspot`,
      description: rep.intelligence_briefing || rep.description || `${category} reported nearby`,
      type: "community",
      crimeCount: 1
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
    let baseSeverity = 20;
    if (typeLower.includes("assault") || typeLower.includes("violence")) baseSeverity = 80;
    else if (typeLower.includes("harassment") || typeLower.includes("stalking")) baseSeverity = 60;
    else if (typeLower.includes("robbery") || typeLower.includes("theft")) baseSeverity = 50;
    else if (typeLower.includes("suspicious")) baseSeverity = 40;
    else if (lightingScore < 6) baseSeverity = 45;

    if (crimeCount > 5) baseSeverity += 20;
    baseSeverity = Math.min(100, baseSeverity);

    rawItems.push({
      id: item.id ?? `danger_hist_${lat.toFixed(4)}_${lon.toFixed(4)}`,
      latitude: lat,
      longitude: lon,
      severity: baseSeverity,
      category: `Historical ${crimeType} Danger Zone`,
      description: `Historical risk: ${crimeType} (${crimeCount} incident/s), Lighting: ${lightingScore}/10`,
      type: "historical",
      crimeCount: Math.max(1, crimeCount)
    });
  });

  if (rawItems.length === 0) return [];

  // 3. Cluster nearby items into Combined Danger Regions & 1 KM Avoidance Zones
  const clusters = [];
  const visited = new Set();

  for (let i = 0; i < rawItems.length; i++) {
    if (visited.has(i)) continue;

    const item = rawItems[i];
    visited.add(i);

    const currentCluster = [item];

    for (let j = i + 1; j < rawItems.length; j++) {
      if (visited.has(j)) continue;
      const other = rawItems[j];

      const dist = haversineDistanceMeters(item.latitude, item.longitude, other.latitude, other.longitude);
      if (dist <= 1500) {
        visited.add(j);
        currentCluster.push(other);
      }
    }

    const totalLat = currentCluster.reduce((sum, it) => sum + it.latitude, 0);
    const totalLon = currentCluster.reduce((sum, it) => sum + it.longitude, 0);
    const avgLat = totalLat / currentCluster.length;
    const avgLon = totalLon / currentCluster.length;

    const maxSeverity = Math.max(...currentCluster.map((it) => it.severity));
    const totalReports = currentCluster.reduce((sum, it) => sum + it.crimeCount, 0);
    const mainCategory = currentCluster[0].category;

    // Avoidance Radius: 1000m (1 KM) for high risk clusters or severe incident types
    let radius = 300;
    if (maxSeverity >= 50 || totalReports >= 5 || currentCluster.length >= 2) {
      radius = 1000; // 1 KM Avoidance Zone
    } else if (maxSeverity >= 35) {
      radius = 600;
    }

    const clusterId = `cluster_${item.id}`;
    clusters.push({
      id: clusterId,
      latitude: avgLat,
      longitude: avgLon,
      radius,
      severity: Math.min(100, maxSeverity + (currentCluster.length > 1 ? 15 : 0)),
      category: currentCluster.length > 1 ? `High Risk Safety Cluster (${currentCluster.length} reports)` : mainCategory,
      description: currentCluster.length > 1 ? `Combined danger region with ${currentCluster.length} reported safety concerns (${totalReports} incidents total)` : item.description,
      type: item.type,
      reportCount: currentCluster.length
    });
  }

  return clusters;
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
        basePenalty = 15;
      } else if (distOutside <= 100) {
        basePenalty = 10;
      } else if (distOutside <= 250) {
        basePenalty = 6;
      } else if (distOutside <= 500) {
        basePenalty = 3;
      } else {
        basePenalty = 1;
      }

      const severityMult = Math.max(0.5, zone.severity / 50);
      const penalty = basePenalty * severityMult;
      totalDangerPenalty += penalty;

      penetratedMap.set(zone.id, {
        ...zone,
        distanceToRoute: Math.round(minDistance),
        distOutside: Math.round(distOutside),
        penalty: Math.round(penalty * 10) / 10
      });
    }
  });

  const penetratedDangerZones = Array.from(penetratedMap.values()).sort((a, b) => b.penalty - a.penalty);

  return {
    totalDangerPenalty: Math.min(40, Math.round(totalDangerPenalty * 10) / 10),
    penetratedDangerZones
  };
}

export function pointToSegmentDistanceMeters(pLat, pLon, aLat, aLon, bLat, bLon) {
  if (aLat === bLat && aLon === bLon) {
    return haversineDistanceMeters(pLat, pLon, aLat, aLon);
  }

  const cosLat = Math.cos(toRadians(pLat));
  const px = pLon * 111320 * cosLat;
  const py = pLat * 111320;
  const ax = aLon * 111320 * cosLat;
  const ay = aLat * 111320;
  const bx = bLon * 111320 * cosLat;
  const by = bLat * 111320;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return haversineDistanceMeters(pLat, pLon, aLat, aLon);

  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projLat = aLat + t * (bLat - aLat);
  const projLon = aLon + t * (bLon - aLon);

  return haversineDistanceMeters(pLat, pLon, projLat, projLon);
}

export function pointToPathDistanceMeters(pLat, pLon, path) {
  if (!Array.isArray(path) || path.length === 0) return Infinity;
  if (path.length === 1) {
    const node = path[0];
    const nLat = Array.isArray(node) ? node[0] : node?.lat ?? node?.latitude;
    const nLon = Array.isArray(node) ? node[1] : node?.lon ?? node?.longitude;
    return haversineDistanceMeters(pLat, pLon, nLat, nLon);
  }

  let minDistance = Infinity;

  for (let i = 0; i < path.length - 1; i++) {
    const nodeA = path[i];
    const nodeB = path[i + 1];

    const aLat = Array.isArray(nodeA) ? nodeA[0] : nodeA?.lat ?? nodeA?.latitude;
    const aLon = Array.isArray(nodeA) ? nodeA[1] : nodeA?.lon ?? nodeA?.longitude;
    const bLat = Array.isArray(nodeB) ? nodeB[0] : nodeB?.lat ?? nodeB?.latitude;
    const bLon = Array.isArray(nodeB) ? nodeB[1] : nodeB?.lon ?? nodeB?.longitude;

    if (aLat == null || aLon == null || bLat == null || bLon == null || isNaN(aLat) || isNaN(aLon) || isNaN(bLat) || isNaN(bLon)) continue;

    const dist = pointToSegmentDistanceMeters(pLat, pLon, aLat, aLon, bLat, bLon);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  return minDistance;
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

  // Search community_reports against route geometry line segments
  (communityReports || []).forEach((report, index) => {
    const repLat = Number(report.latitude);
    const repLon = Number(report.longitude);
    if (isNaN(repLat) || isNaN(repLon)) return;

    const distMeters = Math.round(pointToPathDistanceMeters(repLat, repLon, path));
    if (distMeters <= SEARCH_RADIUS_METERS) {
      const rawCategory = report.category || report.issue_type || report.report_type || "Incident";
      const reportKey = report.id ? String(report.id) : `${repLat.toFixed(5)}_${repLon.toFixed(5)}_${rawCategory}_${index}`;
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
          category: rawCategory,
          latitude: repLat,
          longitude: repLon,
          safety_rating: Number(report.safety_rating ?? 3),
          intelligence_briefing: report.intelligence_briefing || report.description || "No briefing details provided.",
          time_cycle: report.time_cycle || "Day",
          created_at: report.created_at || report.created_date || new Date().toISOString(),
          created_date: report.created_at || report.created_date || new Date().toISOString(),
          distance_from_route: distMeters,
          distance_weight,
          raw: report
        });
      }
    }
  });

  // Search safety_analysis historical records against route geometry line segments
  (safetyData || []).forEach((item, index) => {
    const itemLat = Number(item.latitude);
    const itemLon = Number(item.longitude);
    if (isNaN(itemLat) || isNaN(itemLon)) return;

    const distMeters = Math.round(pointToPathDistanceMeters(itemLat, itemLon, path));
    if (distMeters <= SEARCH_RADIUS_METERS) {
      const rawObj = item.raw || item;
      const crime_count = Number(item.crime_count ?? rawObj.crime_count ?? item.crimeCount ?? rawObj.crimeCount ?? 0);
      const crime_type = item.crime_type ?? rawObj.crime_type ?? item.category ?? rawObj.category ?? item.report_type ?? "Other";

      const itemKey = item.id ? String(item.id) : `${itemLat.toFixed(5)}_${itemLon.toFixed(5)}_${crime_type}_${crime_count}_${index}`;
      const existing = matchedSafetyAnalysisMap.get(itemKey);

      if (!existing || distMeters < existing.distance_from_route) {
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

  // DEBUG LOGGING (REQUIREMENT 2)
  console.log("\n[ROUTE SAFETY]");
  console.log(`Reports checked against route: ${(communityReports || []).length + (safetyData || []).length}`);
  console.log(`Reports within route search area: ${allNearbySafetyData.length}`);
  console.log(`Reports actually affecting route: ${historicalReports.length + negativeReports.length}`);

  if (allNearbySafetyData.length > 0) {
    allNearbySafetyData.slice(0, 5).forEach((item) => {
      console.log(`Report:`);
      console.log(`- id: ${item.id}`);
      console.log(`- latitude: ${item.latitude}`);
      console.log(`- longitude: ${item.longitude}`);
      console.log(`- category: ${item.crime_type || item.category}`);
      console.log(`- severity/rating: ${item.safety_rating || item.lighting_score || "N/A"}`);
      console.log(`- distance from route: ${item.distance_from_route} meters`);
    });
  }

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
