import { analyzeRouteSafetyData, buildDangerZones, calculateDangerPenalties } from "./routeSafetyAnalysis.js";
import { calculateSafetyScoreEngine } from "./safetyScoreEngine.js";

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

export function toLeafletPath(geometry) {
  if (!geometry) return [];

  const coordinates = geometry.coordinates ?? geometry?.features?.[0]?.geometry?.coordinates ?? [];
  return coordinates.map(([lon, lat]) => [lat, lon]);
}

/**
 * Evaluates a single candidate route against nearby safety records, community reports, and dynamic danger zones
 */
export function evaluateCandidateRoute(route, index, safetyContext = {}) {
  const geometry = route.geometry ?? route?.features?.[0]?.geometry ?? null;
  const distanceMeters = Number(route.distance ?? 0);
  const durationSeconds = Number(route.duration ?? 0);

  const path = toLeafletPath(geometry);
  const distanceKm = distanceMeters / 1000;
  const distanceLabel = distanceMeters >= 1000
    ? `${distanceKm.toFixed(1)} km`
    : `${Math.round(distanceMeters)} m`;
  const durationLabel = `${Math.max(1, Math.round(durationSeconds / 60))} mins`;

  const communityReports = safetyContext.communityReports ?? [];
  const safetyData = safetyContext.safetyData ?? [];

  const routeObj = {
    path,
    distance: distanceLabel,
    duration: durationLabel,
    distanceMeters,
    durationSeconds
  };

  // Run Route Safety Analysis & Safety Score Engine independently for this candidate
  const routeAnalysis = analyzeRouteSafetyData(routeObj, communityReports, safetyData);
  const scoreResult = calculateSafetyScoreEngine(routeAnalysis);

  const warnings = [...(scoreResult.topNegativeFactors || [])];
  if (routeAnalysis.penetratedDangerZones && routeAnalysis.penetratedDangerZones.length > 0) {
    routeAnalysis.penetratedDangerZones.forEach((dz) => {
      warnings.push(`⚠ Caution: Route passes through ${dz.category} (${dz.radius}m radius)`);
    });
  }

  if (scoreResult.finalScore < 70 && !warnings.some((w) => w.includes("Vulnerability") || w.includes("Risk"))) {
    warnings.push("⚠ Elevated security risk along route corridor");
  }

  const evaluation = {
    routeId: `route-${index + 1}`,
    rawRoute: route,
    path,
    distance: distanceLabel,
    duration: durationLabel,
    distanceMeters,
    durationSeconds,
    safetyScore: scoreResult.finalScore,
    historicalRisk: scoreResult.historicalRiskDisplay,
    communityRisk: scoreResult.communityRiskDisplay,
    weightedHistoricalRisk: scoreResult.historicalRisk ?? 0,
    weightedCommunityRisk: scoreResult.communityRisk ?? 0,
    dangerPenalty: routeAnalysis.totalDangerPenalty ?? 0,
    penetratedDangerZones: routeAnalysis.penetratedDangerZones ?? [],
    historicalReportCount: routeAnalysis.historicalReports.length,
    communityReportCount: routeAnalysis.positiveReports.length + routeAnalysis.negativeReports.length,
    positiveReportCount: routeAnalysis.positiveReports.length,
    negativeReportCount: routeAnalysis.negativeReports.length,
    positiveReports: routeAnalysis.positiveReports,
    negativeReports: routeAnalysis.negativeReports,
    historicalReports: routeAnalysis.historicalReports,
    safetyLevel: scoreResult.safetyLevel,
    safetyBadge: scoreResult.safetyBadge,
    riskLevel: scoreResult.finalScore >= 80 ? "Low" : scoreResult.finalScore >= 60 ? "Medium" : "High",
    warnings,
    routeAnalysis,
    scoreResult,
  };

  console.log(`----------------------------------`);
  console.log(`Route ID: ${evaluation.routeId}`);
  console.log(`Distance: ${evaluation.distance}`);
  console.log(`Duration: ${evaluation.duration}`);
  console.log(`Historical Reports: ${evaluation.historicalReportCount}`);
  console.log(`Community Reports: ${evaluation.communityReportCount}`);
  console.log(`Danger Zone Penalty: ${evaluation.dangerPenalty} (Penetrated: ${evaluation.penetratedDangerZones.length})`);
  console.log(`Weighted Historical Risk: ${evaluation.weightedHistoricalRisk}`);
  console.log(`Weighted Community Risk: ${evaluation.weightedCommunityRisk}`);
  console.log(`Final Safety Score: ${evaluation.safetyScore}`);
  console.log(`----------------------------------`);

  return evaluation;
}

/**
 * Requests candidate alternative routes from OpenRouteService (with OSRM fallback)
 */
async function fetchCandidateRoutes(origin, destination, safetyContext = {}) {
  const coordsStr = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
  const apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENROUTESERVICE_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.OPENROUTESERVICE_API_KEY) ||
    "5b3ce3597851110001cf6248a514d872782b49c0a6b1897d1952f4a4";

  let rawRoutes = [];

  // 1. Try OpenRouteService API
  try {
    const orsUrl = `https://api.openrouteservice.org/v2/directions/driving-car/geojson`;
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json, application/geo+json",
    };
    if (apiKey) {
      headers["Authorization"] = apiKey;
    }

    const orsRes = await fetch(orsUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        coordinates: [
          [origin.lon, origin.lat],
          [destination.lon, destination.lat]
        ],
        alternative_routes: {
          target_count: 4,
          weight_factor: 1.4,
          share_factor: 0.6
        }
      })
    });

    if (orsRes.ok) {
      const orsData = await orsRes.json();
      const features = orsData?.features ?? [];
      if (features.length > 0) {
        rawRoutes = features.map((feat) => ({
          distance: feat.properties?.summary?.distance ?? 0,
          duration: feat.properties?.summary?.duration ?? 0,
          geometry: feat.geometry
        }));
      }
    }
  } catch (err) {
    console.warn("OpenRouteService API request failed, falling back to OSRM:", err);
  }

  // 2. Fall back to OSRM API Request with alternatives=true if ORS returned fewer than 2 routes
  if (rawRoutes.length < 2) {
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&alternatives=true`;
      const res = await fetch(osrmUrl, {
        headers: { Accept: "application/json" }
      });

      if (res.ok) {
        const data = await res.json();
        const osrmRoutes = data?.routes ?? [];
        if (osrmRoutes.length > rawRoutes.length) {
          rawRoutes = osrmRoutes;
        }
      }
    } catch (err) {
      console.warn("OSRM fallback request failed:", err);
    }
  }

  // 3. If still only 1 route, generate geometric detour alternatives
  const distKm = haversineDistanceKm(origin, destination);
  if (rawRoutes.length === 1 && distKm > 0.5 && rawRoutes[0].geometry?.coordinates?.length > 4) {
    const baseCoords = rawRoutes[0].geometry.coordinates;
    const midIdx = Math.floor(baseCoords.length / 2);
    const midPoint = baseCoords[midIdx];

    const detour1 = [midPoint[0] + 0.012, midPoint[1] + 0.010];
    const detour2 = [midPoint[0] - 0.010, midPoint[1] - 0.012];

    const detourPromises = [detour1, detour2].map(async (detourPt) => {
      try {
        const dUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${detourPt[0]},${detourPt[1]};${destination.lon},${destination.lat}?overview=full&geometries=geojson`;
        const dRes = await fetch(dUrl, { headers: { Accept: "application/json" } });
        if (dRes.ok) {
          const dData = await dRes.json();
          return dData?.routes?.[0] || null;
        }
      } catch {
        return null;
      }
    });

    const fallbackDetours = (await Promise.all(detourPromises)).filter(Boolean);
    rawRoutes = [...rawRoutes, ...fallbackDetours];
  }

  console.log(`==================================`);
  console.log(`Candidate routes returned (${rawRoutes.length}):`);
  rawRoutes.forEach((rt, idx) => {
    const dKm = (Number(rt.distance || 0) / 1000).toFixed(1);
    const dMin = Math.max(1, Math.round(Number(rt.duration || 0) / 60));
    console.log(`Route ${idx + 1}: ${dKm} km, ${dMin} mins`);
  });
  console.log(`==================================`);

  return rawRoutes;
}

/**
 * Danger-Aware comparison logic for Safe Route selection:
 * 1. Prioritize routes with FEWER penetrated danger zones
 * 2. Higher Safety Score
 * 3. Fewer negative community reports
 * 4. Fewer historical reports
 * 5. Lower weighted historical risk
 * 6. Shorter distance
 * 7. Shorter duration
 */
function compareRoutesForSafe(a, b) {
  if (!a) return { winner: b, reason: "Initial route selection" };
  if (!b) return { winner: a, reason: "Initial route selection" };

  // 1. Prioritize routes avoiding danger zones
  const penA = a.penetratedDangerZones?.length || 0;
  const penB = b.penetratedDangerZones?.length || 0;

  if (penA !== penB) {
    const winner = penA < penB ? a : b;
    const loser = winner.routeId === a.routeId ? b : a;
    return {
      winner,
      reason: `Avoided Danger Zones: ${winner.routeId} penetrates ${winner.penetratedDangerZones.length} zone(s) vs ${loser.routeId} penetrating ${loser.penetratedDangerZones.length} zone(s).`
    };
  }

  // 2. Higher Safety Score
  if (b.safetyScore !== a.safetyScore) {
    const winner = b.safetyScore > a.safetyScore ? b : a;
    const loser = winner.routeId === a.routeId ? b : a;
    return {
      winner,
      reason: `Higher Safety Score (${winner.safetyScore} vs ${loser.safetyScore})`
    };
  }

  // 3. Fewer negative community reports
  const negA = a.negativeReportCount ?? (a.negativeReports?.length || 0);
  const negB = b.negativeReportCount ?? (b.negativeReports?.length || 0);
  if (negA !== negB) {
    const winner = negA < negB ? a : b;
    return {
      winner,
      reason: `Safety Score tied (${a.safetyScore}). Negative Community Reports: ${negA} vs ${negB}. Therefore ${winner.routeId} wins.`
    };
  }

  // 4. Fewer historical reports
  const histA = a.historicalReportCount ?? (a.historicalReports?.length || 0);
  const histB = b.historicalReportCount ?? (b.historicalReports?.length || 0);
  if (histA !== histB) {
    const winner = histA < histB ? a : b;
    return {
      winner,
      reason: `Safety Score tied (${a.safetyScore}). Historical Reports: ${histA} vs ${histB}. Therefore ${winner.routeId} wins.`
    };
  }

  // 5. Lower weighted historical risk
  const histRiskA = a.weightedHistoricalRisk ?? a.historicalRisk ?? 0;
  const histRiskB = b.weightedHistoricalRisk ?? b.historicalRisk ?? 0;
  if (histRiskA !== histRiskB) {
    const winner = histRiskA < histRiskB ? a : b;
    return {
      winner,
      reason: `Safety Score tied (${a.safetyScore}). Weighted Historical Risk: ${histRiskA} vs ${histRiskB}. Therefore ${winner.routeId} wins.`
    };
  }

  // 6. Shorter distance
  if (a.distanceMeters !== b.distanceMeters) {
    const winner = a.distanceMeters < b.distanceMeters ? a : b;
    const loser = winner.routeId === a.routeId ? b : a;
    return {
      winner,
      reason: `Safety Score tied (${a.safetyScore}). Distance: ${winner.distance} vs ${loser.distance}. Therefore ${winner.routeId} wins.`
    };
  }

  // 7. Shorter duration
  if (a.durationSeconds !== b.durationSeconds) {
    const winner = a.durationSeconds < b.durationSeconds ? a : b;
    const loser = winner.routeId === a.routeId ? b : a;
    return {
      winner,
      reason: `Safety Score tied (${a.safetyScore}). Duration: ${winner.duration} vs ${loser.duration}. Therefore ${winner.routeId} wins.`
    };
  }

  return {
    winner: a,
    reason: `Safety Score tied (${a.safetyScore}). All metrics identical.`
  };
}

/**
 * Requirement 4 & 6 & 7: Evaluate candidate routes, perform multi-attempt waypoint rerouting (up to 5 attempts) around high-risk zones, and select Safe Route.
 */
export async function evaluateAllRoutes(from, to, safetyContext = {}) {
  const origin = normalizeCoords(from);
  const destination = normalizeCoords(to);

  if (!origin || !destination) {
    throw new Error("Both origin and destination coordinates are required.");
  }

  const MAX_REROUTE_ATTEMPTS = 5;
  let rerouteAttempt = 0;
  const evaluatedMap = new Map();

  const addEvaluatedCandidate = (candRoute) => {
    const key = JSON.stringify(candRoute.geometry?.coordinates || candRoute.path || []);
    if (!evaluatedMap.has(key)) {
      const evaluation = evaluateCandidateRoute(candRoute, evaluatedMap.size, safetyContext);
      evaluatedMap.set(key, evaluation);
    }
  };

  // 1. Initial candidate fetch
  const initialCandidates = await fetchCandidateRoutes(origin, destination, safetyContext);
  initialCandidates.forEach(addEvaluatedCandidate);

  let currentEvaluated = Array.from(evaluatedMap.values());
  let currentSafest = currentEvaluated.reduce((prev, curr) => compareRoutesForSafe(prev, curr).winner, currentEvaluated[0]);

  // 2. Requirement 4: Multi-Attempt Waypoint Rerouting Loop (up to 5 attempts)
  while (rerouteAttempt < MAX_REROUTE_ATTEMPTS && currentSafest.penetratedDangerZones && currentSafest.penetratedDangerZones.length > 0) {
    rerouteAttempt++;
    console.log(`==================================`);
    console.log(`[Rerouting Attempt ${rerouteAttempt}/${MAX_REROUTE_ATTEMPTS}] Current safest route (${currentSafest.routeId}) penetrates ${currentSafest.penetratedDangerZones.length} danger zone(s). Requesting detour alternative routes via waypoints...`);

    const targetZone = currentSafest.penetratedDangerZones[0];
    const offset = (rerouteAttempt * 0.008) + 0.008;

    const detourWaypoints = [
      [targetZone.longitude + offset, targetZone.latitude + offset],
      [targetZone.longitude - offset, targetZone.latitude - offset],
      [targetZone.longitude - offset, targetZone.latitude + offset],
      [targetZone.longitude + offset, targetZone.latitude - offset],
    ];

    const detourPromises = detourWaypoints.map(async (waypoint) => {
      try {
        const dUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${waypoint[0]},${waypoint[1]};${destination.lon},${destination.lat}?overview=full&geometries=geojson`;
        const dRes = await fetch(dUrl, { headers: { Accept: "application/json" } });
        if (dRes.ok) {
          const dData = await dRes.json();
          return dData?.routes?.[0] || null;
        }
      } catch {
        return null;
      }
    });

    const detourRoutes = (await Promise.all(detourPromises)).filter(Boolean);
    if (detourRoutes.length > 0) {
      detourRoutes.forEach(addEvaluatedCandidate);
      currentEvaluated = Array.from(evaluatedMap.values());
      currentSafest = currentEvaluated.reduce((prev, curr) => compareRoutesForSafe(prev, curr).winner, currentEvaluated[0]);
    } else {
      break;
    }
  }

  const evaluatedRoutes = Array.from(evaluatedMap.values());

  // 3. Find Fast Route (minimum duration)
  let fastRoute = evaluatedRoutes[0];
  for (let i = 1; i < evaluatedRoutes.length; i++) {
    if (evaluatedRoutes[i].durationSeconds < fastRoute.durationSeconds) {
      fastRoute = evaluatedRoutes[i];
    }
  }

  // 4. Find Safe Route
  let safeRoute = evaluatedRoutes[0];
  let selectionReason = "Highest Safety Score & Danger Zone Avoidance";

  for (let i = 1; i < evaluatedRoutes.length; i++) {
    const comparison = compareRoutesForSafe(safeRoute, evaluatedRoutes[i]);
    safeRoute = comparison.winner;
    selectionReason = comparison.reason;
  }

  // 5. Avoided Danger Zones
  const fastPenetratedMap = new Map((fastRoute.penetratedDangerZones || []).map((z) => [z.id, z]));
  const safePenetratedMap = new Map((safeRoute.penetratedDangerZones || []).map((z) => [z.id, z]));

  const avoidedDangerZones = [];
  fastPenetratedMap.forEach((zone, id) => {
    if (!safePenetratedMap.has(id)) {
      avoidedDangerZones.push(zone);
    }
  });

  const safeRoutePenetratesDanger = safeRoute.penetratedDangerZones && safeRoute.penetratedDangerZones.length > 0;
  
  // Requirement 7: Explicitly state if no completely safe alternative exists
  const noSafeAlternativeNotice = safeRoutePenetratesDanger
    ? "No completely safe alternative exists. Showing the least risky available route."
    : null;

  const isIdentical = evaluatedRoutes.length === 1 || fastRoute.routeId === safeRoute.routeId;
  const scoreIncrease = Math.max(0, Math.round((safeRoute.safetyScore - fastRoute.safetyScore) * 10) / 10);
  const timeAddedMinutes = Math.max(
    0,
    Math.round((safeRoute.durationSeconds - fastRoute.durationSeconds) / 60)
  );

  let comparisonText = isIdentical
    ? "This route is both the fastest and the safest."
    : `Compared with the Fast Route, choosing the Safe Route increases the Safety Score by ${scoreIncrease} points while adding only ${timeAddedMinutes} minutes to the journey.`;

  if (noSafeAlternativeNotice) {
    comparisonText = noSafeAlternativeNotice;
  }

  console.log(`==================================`);
  console.log(`Fast Route Selected: ${fastRoute.routeId} (${fastRoute.distance}, ${fastRoute.duration}, Score: ${fastRoute.safetyScore})`);
  console.log(`Safe Route Selected: ${safeRoute.routeId} (${safeRoute.distance}, ${safeRoute.duration}, Score: ${safeRoute.safetyScore})`);
  console.log(`Selection Reason for Safe Route: ${selectionReason}`);
  console.log(`Reroute Attempts Performed: ${rerouteAttempt}/${MAX_REROUTE_ATTEMPTS}`);
  console.log(`Notice: ${noSafeAlternativeNotice || 'Safe alternative found'}`);
  console.log(`isIdentical: ${isIdentical}`);
  console.log(`==================================`);

  const dangerZones = buildDangerZones(safetyContext.safetyData, safetyContext.communityReports);

  return {
    fastest: fastRoute,
    safest: safeRoute,
    evaluatedRoutes,
    allEvaluations: evaluatedRoutes,
    dangerZones,
    avoidedDangerZones,
    noSafeAlternativeNotice,
    isIdentical,
    recommendation: {
      recommendedRouteType: "safest",
      reason: selectionReason,
      scoreIncrease,
      timeAddedMinutes,
      avoidedDangerZones,
      noSafeAlternativeNotice,
      comparisonText
    }
  };
}

export function buildRouteSummary(routeData, routeIndex = 0, label = "fast", safetyContext = {}) {
  const routes = routeData?.routes ?? (Array.isArray(routeData) ? routeData : [routeData]);
  const candidate = routes[routeIndex] ?? routes[0];
  return evaluateCandidateRoute(candidate, routeIndex, safetyContext);
}

export async function getFastestRoute(from, to, safetyContext = {}) {
  const result = await evaluateAllRoutes(from, to, safetyContext);
  return result.fastest;
}

export async function getSafestRoute(from, to, safetyContext = {}) {
  const result = await evaluateAllRoutes(from, to, safetyContext);
  return result.safest;
}
