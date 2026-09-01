import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  calculateSafetyScoreEngine,
  normalizeReportCategory,
  normalizeTimeCycle,
  getReportAgeMultiplier,
  calculateAggregatedHistoricalRisk,
  getMLHistoricalRiskBatch
} from "../services/safetyScoreEngine.js";
import {
  evaluateCandidateRoute,
  compareRoutesForSafe
} from "../services/routing.js";
import {
  analyzeRouteSafetyData,
  pointToPathDistanceMeters
} from "../services/routeSafetyAnalysis.js";
import { getSafetyData } from "../services/supabaseService.js";
import { monitorRouteDeviation } from "../services/routeDeviationService.js";

async function runAudit() {
  console.log("==================================================");
  console.log("STARTING RUNTIME INTEGRATION AUDIT");
  console.log("==================================================\n");

  const results = {};

  // --------------------------------------------------
  // 1. STARTUP / SERVICE VERIFICATION
  // --------------------------------------------------
  console.log("SECTION 1: STARTUP / SERVICE VERIFICATION");
  try {
    const res = await fetch("http://127.0.0.1:5000/");
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.status, "ML API is running");
    console.log("✓ Flask ML API is running & accessible at http://127.0.0.1:5000/");
    console.log(`  Response: status="${data.status}", model="${data.model}"`);

    // Test /predict_batch via HTTP
    const batchRes = await fetch("http://127.0.0.1:5000/predict_batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        records: [
          { crime_count: 10, crime_type: "Theft", time_of_day: "Night", current_time: "Night", lighting_score: 4, police_station_distance_km: 2.5, crowd_density: 20, weather_condition: "Clear", distance_from_route: 50 }
        ]
      })
    });
    const batchData = await batchRes.json();
    assert.equal(batchRes.status, 200);
    assert.equal(batchData.success, true);
    assert.equal(batchData.predictions.length, 1);
    console.log(`✓ /predict_batch is reachable from Node. Prediction returned: ${batchData.predictions[0]}`);
    results.section1 = "PASS";
  } catch (err) {
    console.error("✗ Section 1 Failed:", err.message);
    results.section1 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // 2. END-TO-END ROUTE CALCULATION
  // --------------------------------------------------
  console.log("\nSECTION 2: END-TO-END ROUTE CALCULATION");
  try {
    const mockRouteA = {
      distance: 3500,
      duration: 600,
      geometry: {
        type: "LineString",
        coordinates: [[77.5946, 12.9716], [77.6000, 12.9750], [77.6050, 12.9800]]
      }
    };
    const mockRouteB = {
      distance: 4200,
      duration: 720,
      geometry: {
        type: "LineString",
        coordinates: [[77.5946, 12.9716], [77.5900, 12.9740], [77.6050, 12.9800]]
      }
    };

    const safetyContext = {
      safetyData: [
        { id: "s1", latitude: 12.9730, longitude: 77.5975, crime_count: 15, crime_type: "Assault", lighting_score: 3 }
      ],
      communityReports: [
        { id: "c1", report_type: "Observation", category: "Harassment", latitude: 12.9740, longitude: 77.5985, safety_rating: 1, created_at: new Date().toISOString() }
      ]
    };

    const evalA = await evaluateCandidateRoute(mockRouteA, 0, safetyContext);
    const evalB = await evaluateCandidateRoute(mockRouteB, 1, safetyContext);

    console.log(`✓ Route A (${evalA.routeId}): Score=${evalA.displayedSafetyScore}, Risk=${evalA.internalRouteRisk}, DangerPenalty=${evalA.dangerPenalty}, Matched Hist=${evalA.historicalReportCount}, Matched Comm=${evalA.communityReportCount}`);
    console.log(`✓ Route B (${evalB.routeId}): Score=${evalB.displayedSafetyScore}, Risk=${evalB.internalRouteRisk}, DangerPenalty=${evalB.dangerPenalty}, Matched Hist=${evalB.historicalReportCount}, Matched Comm=${evalB.communityReportCount}`);
    results.section2 = "PASS";
  } catch (err) {
    console.error("✗ Section 2 Failed:", err.message);
    results.section2 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // 3. VERIFY DISPLAY/RANKING MATHEMATICS
  // --------------------------------------------------
  console.log("\nSECTION 3: VERIFY DISPLAY/RANKING MATHEMATICS");
  try {
    const analysis = {
      positiveReports: [],
      negativeReports: [
        { category: "Theft", safety_rating: 2, distance_from_route: 50, time_cycle: "Afternoon", created_at: new Date().toISOString() }
      ],
      historicalReports: [
        { crime_count: 20, crime_type: "Theft", lighting_score: 4, police_station_distance: 2500, crowd_density: 30, time_of_day: "Afternoon" }
      ],
      totalDangerPenalty: 25.0
    };

    const resEngine = await calculateSafetyScoreEngine(analysis);

    const histRisk = resEngine.historicalRisk;
    const commRisk = resEngine.communityRisk;
    const dangerPenalty = resEngine.totalDangerPenalty;

    const weightedHist = Math.round(histRisk * 0.4 * 10) / 10;
    const weightedComm = Math.round(commRisk * 0.6 * 10) / 10;

    const expectedTotalRisk = Math.min(100, Math.round((weightedHist + weightedComm + dangerPenalty) * 10) / 10);
    const expectedSafetyScore = Math.max(0, Math.min(100, Math.round((100 - expectedTotalRisk) * 10) / 10));

    assert.equal(resEngine.totalRisk, expectedTotalRisk, "totalRisk must match expectedTotalRisk");
    assert.equal(resEngine.displayedSafetyScore, expectedSafetyScore, "displayedSafetyScore must match expectedSafetyScore");
    assert.equal(resEngine.internalRouteRisk, resEngine.totalRisk, "internalRouteRisk must equal totalRisk");
    assert.equal(resEngine.finalScore, resEngine.displayedSafetyScore, "finalScore must equal displayedSafetyScore");

    console.log(`✓ Engine Total Risk: ${resEngine.totalRisk} === Expected: ${expectedTotalRisk}`);
    console.log(`✓ Displayed Safety Score: ${resEngine.displayedSafetyScore} === Expected: ${expectedSafetyScore}`);
    console.log(`✓ Internal Route Risk: ${resEngine.internalRouteRisk} === Total Risk: ${resEngine.totalRisk}`);
    results.section3 = "PASS";
  } catch (err) {
    console.error("✗ Section 3 Failed:", err.message);
    results.section3 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // 4. VERIFY ROUTE RANKING
  // --------------------------------------------------
  console.log("\nSECTION 4: VERIFY ROUTE RANKING");
  try {
    // Route A: Lower hist/comm risk (10), but heavy danger penalty (+50) -> Total Risk = 60, Score = 40
    const routeA = {
      routeId: "route-A",
      internalRouteRisk: 60,
      displayedSafetyScore: 40,
      distanceMeters: 2000,
      durationSeconds: 300
    };
    // Route B: Slightly higher hist/comm risk (25), zero danger penalty -> Total Risk = 25, Score = 75
    const routeB = {
      routeId: "route-B",
      internalRouteRisk: 25,
      displayedSafetyScore: 75,
      distanceMeters: 2200,
      durationSeconds: 330
    };

    const comparison = compareRoutesForSafe(routeA, routeB);
    assert.equal(comparison.winner.routeId, "route-B", "Route B must win safe route selection due to lower total risk");
    console.log(`✓ Route A (Risk: 60, Penalty: +50, Score: 40) vs Route B (Risk: 25, Penalty: +0, Score: 75)`);
    console.log(`✓ Safe Route Selected: ${comparison.winner.routeId} (${comparison.reason})`);
    results.section4 = "PASS";
  } catch (err) {
    console.error("✗ Section 4 Failed:", err.message);
    results.section4 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // 5. VERIFY /predict_batch INTEGRATION (>30 RECORDS)
  // --------------------------------------------------
  console.log("\nSECTION 5: VERIFY /predict_batch INTEGRATION (>30 RECORDS)");
  try {
    const records40 = Array.from({ length: 40 }, (_, i) => ({
      id: `hist_${i}`,
      crime_count: 10 + (i % 5),
      crime_type: "Theft",
      lighting_score: 5,
      police_station_distance: 2000,
      crowd_density: 40,
      time_of_day: "Night"
    }));

    const predictions = await getMLHistoricalRiskBatch(records40);
    assert.ok(Array.isArray(predictions), "Predictions must be an array");
    assert.equal(predictions.length, 40, "Must return exactly 40 predictions without 30-record slicing");

    const aggRisk = calculateAggregatedHistoricalRisk(predictions);
    console.log(`✓ Sent 40 records to /predict_batch -> Received ${predictions.length} predictions.`);
    console.log(`✓ Aggregated Historical Risk for 40 records: ${aggRisk}`);
    results.section5 = "PASS";
  } catch (err) {
    console.error("✗ Section 5 Failed:", err.message);
    results.section5 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // 6. VERIFY HISTORICAL DATASET SIZE & MERGING
  // --------------------------------------------------
  console.log("\nSECTION 6: VERIFY HISTORICAL DATASET SIZE & MERGING");
  try {
    const dataset = await getSafetyData();
    assert.ok(Array.isArray(dataset), "Dataset must be an array");
    assert.ok(dataset.length >= 20000, "Dataset must contain at least 20,000 merged records");
    console.log(`✓ Total merged dataset size returned by getSafetyData(): ${dataset.length} records`);
    results.section6 = "PASS";
  } catch (err) {
    console.error("✗ Section 6 Failed:", err.message);
    results.section6 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // 7. VERIFY ROUTE CORRIDOR MATCHING & DUPLICATE PRESERVATION
  // --------------------------------------------------
  console.log("\nSECTION 7: VERIFY ROUTE CORRIDOR MATCHING & DUPLICATE PRESERVATION");
  try {
    // Sparse route nodes (1.5 km apart)
    const sparseRoute = {
      path: [
        [12.9716, 77.5946],
        [12.9816, 77.6046]
      ]
    };

    // Report situated midpoint between nodes (~20m from line segment)
    const midpointReportLat = 12.9766;
    const midpointReportLon = 77.5996;

    const distToPath = pointToPathDistanceMeters(midpointReportLat, midpointReportLon, sparseRoute.path);
    assert.ok(distToPath <= 100, `Distance to polyline segment should be <= 100m (Actual: ${distToPath.toFixed(1)}m)`);
    console.log(`✓ Report midpoint distance to sparse route segment: ${distToPath.toFixed(1)}m (Detected between nodes)`);

    // Test duplicate incidents at identical lat/lon
    const dupSafetyData = [
      { id: "inc1", latitude: 12.9716, longitude: 77.5946, crime_count: 5, crime_type: "Theft" },
      { id: "inc2", latitude: 12.9716, longitude: 77.5946, crime_count: 10, crime_type: "Assault" }
    ];

    const analysisRes = analyzeRouteSafetyData(sparseRoute, [], dupSafetyData);
    assert.equal(analysisRes.historicalReports.length, 2, "Both incidents at identical coordinates must be preserved");
    console.log(`✓ Duplicate incidents at identical coordinates preserved: ${analysisRes.historicalReports.length} separate records`);
    results.section7 = "PASS";
  } catch (err) {
    console.error("✗ Section 7 Failed:", err.message);
    results.section7 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // 8. VERIFY ROUTE DEVIATION
  // --------------------------------------------------
  console.log("\nSECTION 8: VERIFY ROUTE DEVIATION");
  try {
    const selectedRoute = {
      path: [
        [12.9716, 77.5946],
        [12.9750, 77.6000],
        [12.9800, 77.6050]
      ]
    };

    // A: Directly on route
    const posA = [12.9716, 77.5946];
    const devA = monitorRouteDeviation(posA, selectedRoute, 80);
    assert.equal(devA.warning, false, "Position on route must not trigger deviation");

    // B: ~50m away
    const posB = [12.9720, 77.5946]; // ~44m lat shift
    const devB = monitorRouteDeviation(posB, selectedRoute, 80);
    assert.equal(devB.warning, false, "Position ~50m away must not trigger deviation");

    // C: ~100m away
    const posC = [12.9726, 77.5946]; // ~111m lat shift
    const devC = monitorRouteDeviation(posC, selectedRoute, 80);
    assert.equal(devC.warning, true, "Position ~100m away MUST trigger deviation");

    // D: Near route start, 5km from destination endpoint
    const posD = [12.9717, 77.5947];
    const devD = monitorRouteDeviation(posD, selectedRoute, 80);
    assert.equal(devD.warning, false, "Position near route start must NOT trigger deviation merely because far from destination endpoint");

    console.log(`✓ Position A (0m): Warning=${devA.warning} (Distance=${devA.distanceMeters.toFixed(1)}m)`);
    console.log(`✓ Position B (~50m): Warning=${devB.warning} (Distance=${devB.distanceMeters.toFixed(1)}m)`);
    console.log(`✓ Position C (~100m): Warning=${devC.warning} (Distance=${devC.distanceMeters.toFixed(1)}m)`);
    console.log(`✓ Position D (Near start, far from end): Warning=${devD.warning} (Distance=${devD.distanceMeters.toFixed(1)}m)`);
    results.section8 = "PASS";
  } catch (err) {
    console.error("✗ Section 8 Failed:", err.message);
    results.section8 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // 9. VERIFY COMMUNITY NORMALIZATION
  // --------------------------------------------------
  console.log("\nSECTION 9: VERIFY COMMUNITY NORMALIZATION");
  try {
    assert.equal(normalizeReportCategory("theft"), "Theft");
    assert.equal(normalizeReportCategory("attack"), "Assault");
    assert.equal(normalizeReportCategory("cop patrol"), "Police Patrol");
    assert.equal(normalizeReportCategory("poor lighting"), "Poor Lighting");
    assert.equal(normalizeReportCategory("dark"), "Poor Lighting");
    assert.equal(normalizeReportCategory("eve teasing"), "Harassment");
    assert.equal(normalizeReportCategory("robbery"), "Robbery");
    assert.equal(normalizeReportCategory("dog"), "Stray Animal Threat");
    assert.equal(normalizeReportCategory("incident"), "Other");

    assert.equal(normalizeTimeCycle("Day"), "Afternoon");
    assert.equal(normalizeTimeCycle("daytime"), "Afternoon");
    assert.equal(normalizeTimeCycle("Morning"), "Morning");
    assert.equal(normalizeTimeCycle("Evening"), "Evening");
    assert.equal(normalizeTimeCycle("Night"), "Night");

    console.log("✓ Category normalization mappings verified across all requested variants.");
    console.log("✓ Time cycle normalization verified ('Day' -> 'Afternoon').");
    results.section9 = "PASS";
  } catch (err) {
    console.error("✗ Section 9 Failed:", err.message);
    results.section9 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // 10. VERIFY DATE DECAY
  // --------------------------------------------------
  console.log("\nSECTION 10: VERIFY DATE DECAY");
  try {
    const now = new Date();
    const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

    // created_at checks
    assert.equal(getReportAgeMultiplier({ created_at: daysAgo(3) }), 1.0);
    assert.equal(getReportAgeMultiplier({ created_at: daysAgo(15) }), 0.8);
    assert.equal(getReportAgeMultiplier({ created_at: daysAgo(60) }), 0.6);
    assert.equal(getReportAgeMultiplier({ created_at: daysAgo(200) }), 0.4);
    assert.equal(getReportAgeMultiplier({ created_at: daysAgo(400) }), 0.2);

    // created_date checks
    assert.equal(getReportAgeMultiplier({ created_date: daysAgo(15) }), 0.8);
    assert.equal(getReportAgeMultiplier({ created_date: daysAgo(60) }), 0.6);

    console.log("✓ Date decay multipliers verified for created_at and created_date (1.0, 0.8, 0.6, 0.4, 0.2).");
    results.section10 = "PASS";
  } catch (err) {
    console.error("✗ Section 10 Failed:", err.message);
    results.section10 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // 11. VERIFY ML MODEL INTEGRITY
  // --------------------------------------------------
  console.log("\nSECTION 11: VERIFY ML MODEL INTEGRITY");
  try {
    const modelPath = path.resolve("ml", "safety_model.pkl");
    const stat = fs.statSync(modelPath);
    assert.ok(stat.size > 0, "Model file size must be > 0 bytes");
    console.log(`✓ ml/safety_model.pkl verified intact.`);
    console.log(`  File size: ${stat.size} bytes, Last modified: ${stat.mtime.toISOString()}`);
    results.section11 = "PASS";
  } catch (err) {
    console.error("✗ Section 11 Failed:", err.message);
    results.section11 = `FAIL: ${err.message}`;
  }

  console.log("\n==================================================");
  console.log("AUDIT SUMMARY RESULTS:");
  console.log("==================================================");
  console.table(results);
}

runAudit().catch(console.error);
