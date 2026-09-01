import assert from "node:assert/strict";
import { evaluateAllRoutes } from "../services/routing.js";
import { monitorRouteDeviation } from "../services/routeDeviationService.js";
import { calculateSafetyScoreEngine } from "../services/safetyScoreEngine.js";
import { analyzeRouteSafetyData } from "../services/routeSafetyAnalysis.js";

async function runFrontendValidation() {
  console.log("==================================================");
  console.log("STARTING FRONTEND & APPLICATION INTEGRATION VALIDATION");
  console.log("==================================================\n");

  const results = {};

  // --------------------------------------------------
  // TEST 1: ROUTE SELECTION & SCORE PRESERVATION IN FRONTEND PIPELINE
  // --------------------------------------------------
  console.log("TEST 1: Route Selection & Score Preservation in Frontend Pipeline");
  try {
    const origin = { lat: 12.9716, lon: 77.5946 };
    const destination = { lat: 12.9816, lon: 77.6046 };
    const safetyContext = {
      safetyData: [
        { id: "s1", latitude: 12.9730, longitude: 77.5975, crime_count: 12, crime_type: "Theft", lighting_score: 4 }
      ],
      communityReports: [
        { id: "c1", report_type: "Observation", category: "Poor Lighting", latitude: 12.9740, longitude: 77.5985, safety_rating: 2, created_at: new Date().toISOString() }
      ]
    };

    const routeResults = await evaluateAllRoutes(origin, destination, safetyContext);

    assert.ok(routeResults.safest, "routeResults.safest must exist");
    assert.ok(routeResults.fastest, "routeResults.fastest must exist");
    assert.ok(routeResults.recommendation, "routeResults.recommendation must exist");

    const safestScore = routeResults.safest.displayedSafetyScore;
    const fastestScore = routeResults.fastest.displayedSafetyScore;

    assert.equal(typeof safestScore, "number", "safestScore must be a number");
    assert.equal(typeof fastestScore, "number", "fastestScore must be a number");
    assert.ok(safestScore >= fastestScore, "Safest route score must be >= fastest route score");

    console.log(`✓ Safest Route Score: ${safestScore} / 100`);
    console.log(`✓ Fast Route Score: ${fastestScore} / 100`);
    console.log(`✓ Recommendation Text: "${routeResults.recommendation.comparisonText}"`);
    results.test1 = "PASS";
  } catch (err) {
    console.error("✗ Test 1 Failed:", err.message);
    results.test1 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST 2: ACTIVE ROUTE SELECTION TOGGLE ("safest" vs "fastest")
  // --------------------------------------------------
  console.log("\nTEST 2: Active Route Selection Toggle ('safest' vs 'fastest')");
  try {
    const origin = { lat: 12.9716, lon: 77.5946 };
    const destination = { lat: 12.9816, lon: 77.6046 };
    const safetyContext = { safetyData: [], communityReports: [] };

    const routeResults = await evaluateAllRoutes(origin, destination, safetyContext);

    // Simulate SafeNavigation activeRoute selection
    let selectedRouteMode = "safest";
    let activeRoute = selectedRouteMode === "fastest" ? routeResults.fastest : routeResults.safest;
    assert.equal(activeRoute.routeId, routeResults.safest.routeId, "Default active route must be safest route");

    // Toggle to fastest
    selectedRouteMode = "fastest";
    activeRoute = selectedRouteMode === "fastest" ? routeResults.fastest : routeResults.safest;
    assert.equal(activeRoute.routeId, routeResults.fastest.routeId, "Toggled active route must be fastest route");

    console.log(`✓ Mode 'safest' selects Route ID: ${routeResults.safest.routeId}`);
    console.log(`✓ Mode 'fastest' selects Route ID: ${routeResults.fastest.routeId}`);
    results.test2 = "PASS";
  } catch (err) {
    console.error("✗ Test 2 Failed:", err.message);
    results.test2 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST 3: SAFETY SCORE CARD PROP & CALCULATION DRAWER DATA INTEGRITY
  // --------------------------------------------------
  console.log("\nTEST 3: Safety Score Card Prop & Calculation Drawer Data Integrity");
  try {
    const analysis = {
      positiveReports: [
        { category: "Police Patrol", safety_rating: 5, distance_from_route: 30, time_cycle: "Afternoon", created_at: new Date().toISOString() }
      ],
      negativeReports: [],
      historicalReports: [],
      totalDangerPenalty: 0
    };

    const scoreResult = await calculateSafetyScoreEngine(analysis);

    // Verify all props expected by SafetyScoreCard.jsx
    assert.ok(scoreResult.finalScore !== undefined, "finalScore must be defined");
    assert.ok(scoreResult.displayedSafetyScore !== undefined, "displayedSafetyScore must be defined");
    assert.ok(scoreResult.totalRisk !== undefined, "totalRisk must be defined");
    assert.ok(scoreResult.historicalRiskDisplay !== undefined, "historicalRiskDisplay must be defined");
    assert.ok(scoreResult.communityRiskDisplay !== undefined, "communityRiskDisplay must be defined");
    assert.ok(scoreResult.topPositiveFactors.length > 0, "topPositiveFactors should contain positive markers");

    console.log(`✓ SafetyScoreCard Props: finalScore=${scoreResult.finalScore}, totalRisk=${scoreResult.totalRisk}, topPositive=${scoreResult.topPositiveFactors[0]}`);
    results.test3 = "PASS";
  } catch (err) {
    console.error("✗ Test 3 Failed:", err.message);
    results.test3 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST 4: DANGER ZONE PENALTY VISIBILITY IN UI SCORE
  // --------------------------------------------------
  console.log("\nTEST 4: Danger Zone Penalty Visibility in UI Score");
  try {
    const safeRouteWithPenalty = {
      positiveReports: [],
      negativeReports: [],
      historicalReports: [],
      totalDangerPenalty: 40.0,
      penetratedDangerZones: [
        { id: "dz1", category: "High Risk Safety Cluster", radius: 1000, severity: 80 }
      ]
    };

    const resWithPenalty = await calculateSafetyScoreEngine(safeRouteWithPenalty);

    assert.equal(resWithPenalty.totalDangerPenalty, 40.0, "totalDangerPenalty must equal 40.0");
    assert.equal(resWithPenalty.totalRisk, 40.0, "totalRisk must include danger penalty (+40.0)");
    assert.equal(resWithPenalty.displayedSafetyScore, 60.0, "displayedSafetyScore must equal 100 - 40.0 = 60.0");

    console.log(`✓ Danger Penalty (+40.0) directly lowers UI Displayed Safety Score to ${resWithPenalty.displayedSafetyScore}/100`);
    results.test4 = "PASS";
  } catch (err) {
    console.error("✗ Test 4 Failed:", err.message);
    results.test4 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST 5: ML API OFFLINE FALLBACK UI RESILIENCE
  // --------------------------------------------------
  console.log("\nTEST 5: ML API Offline Fallback UI Resilience");
  try {
    // Pass empty ML predictions (simulating offline ML API)
    const analysisWithHist = {
      positiveReports: [],
      negativeReports: [],
      historicalReports: [
        { crime_count: 15, crime_type: "Assault", lighting_score: 3, police_station_distance: 3000, crowd_density: 20 }
      ],
      totalDangerPenalty: 0
    };

    const resFallback = await calculateSafetyScoreEngine(analysisWithHist);
    assert.ok(typeof resFallback.displayedSafetyScore === "number", "Fallback displayedSafetyScore must be a number");
    assert.ok(!isNaN(resFallback.displayedSafetyScore), "Fallback score must not be NaN");
    assert.ok(resFallback.displayedSafetyScore >= 0 && resFallback.displayedSafetyScore <= 100, "Fallback score must be in 0..100 range");

    console.log(`✓ Rule-based fallback score calculated smoothly: ${resFallback.displayedSafetyScore} / 100 (mlPredictionUsed=${resFallback.mlPredictionUsed})`);
    results.test5 = "PASS";
  } catch (err) {
    console.error("✗ Test 5 Failed:", err.message);
    results.test5 = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST 6: NAVIGATION ROUTE DEVIATION MONITORING & RECALCULATION RESET
  // --------------------------------------------------
  console.log("\nTEST 6: Navigation Route Deviation Monitoring & Recalculation Reset");
  try {
    let currentSelectedRoute = {
      path: [
        [12.9716, 77.5946],
        [12.9750, 77.6000],
        [12.9800, 77.6050]
      ]
    };

    // User position on route
    const posNormal = [12.9716, 77.5946];
    let devAlert = monitorRouteDeviation(posNormal, currentSelectedRoute, 80);
    assert.equal(devAlert.warning, false, "On-route position must not trigger deviation alert");

    // User position 120m off route
    const posDeviated = [12.9727, 77.5946];
    devAlert = monitorRouteDeviation(posDeviated, currentSelectedRoute, 80);
    assert.equal(devAlert.warning, true, "120m off-route position MUST trigger deviation alert");
    assert.equal(devAlert.message, "Route deviation detected. Recalculation is recommended.");

    // User recalculates route (new route path centered around current position)
    currentSelectedRoute = {
      path: [
        [12.9727, 77.5946],
        [12.9760, 77.6000],
        [12.9800, 77.6050]
      ]
    };

    // Deviation check against newly recalculated route
    devAlert = monitorRouteDeviation(posDeviated, currentSelectedRoute, 80);
    assert.equal(devAlert.warning, false, "Recalculated route must clear deviation alert for current position");

    console.log("✓ Route deviation alert triggers at >80m and correctly resets upon route recalculation.");
    results.test6 = "PASS";
  } catch (err) {
    console.error("✗ Test 6 Failed:", err.message);
    results.test6 = `FAIL: ${err.message}`;
  }

  console.log("\n==================================================");
  console.log("FRONTEND VALIDATION SUMMARY RESULTS:");
  console.log("==================================================");
  console.table(results);
}

runFrontendValidation().catch(console.error);
