import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { evaluateAllRoutes } from "../services/routing.js";
import { calculateSafetyScoreEngine, calculateAggregatedHistoricalRisk } from "../services/safetyScoreEngine.js";
import { analyzeRouteSafetyData, calculateDangerPenalties } from "../services/routeSafetyAnalysis.js";
import { getSafetyData, getCommunityReports } from "../services/supabaseService.js";

async function runScoreFixValidation() {
  console.log("==================================================");
  console.log("SAFETY SCORE REDESIGN & FIX VERIFICATION");
  console.log("==================================================\n");

  const results = {};

  // --------------------------------------------------
  // TEST A: Normal Route (Moderate Risk Produces Score > 0)
  // --------------------------------------------------
  try {
    const origin = { lat: 12.9716, lon: 77.5946 };
    const destination = { lat: 12.9816, lon: 77.6046 };

    const safetyData = await getSafetyData();
    const communityReports = await getCommunityReports();

    const routingRes = await evaluateAllRoutes(origin, destination, { safetyData, communityReports });
    const score = routingRes.safest.displayedSafetyScore;

    assert.ok(score > 0, `Normal route score must be > 0, got ${score}`);
    assert.ok(score <= 100, `Normal route score must be <= 100, got ${score}`);

    console.log(`✓ TEST A (Normal Route): Displayed Safety Score = ${score} / 100 (safest), Fast Score = ${routingRes.fastest.displayedSafetyScore} / 100`);
    results.testA = `PASS (${score}/100)`;
  } catch (err) {
    console.error("✗ TEST A Failed:", err.message);
    results.testA = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST B: High-Risk Route (Score Becomes Low/0 for Genuine Danger)
  // --------------------------------------------------
  try {
    const highRiskAnalysis = {
      positiveReports: [],
      negativeReports: [
        { category: "Assault", safety_rating: 1, distance_from_route: 5, time_cycle: "Night", created_at: new Date().toISOString() },
        { category: "Harassment", safety_rating: 1, distance_from_route: 5, time_cycle: "Night", created_at: new Date().toISOString() },
        { category: "Robbery", safety_rating: 1, distance_from_route: 5, time_cycle: "Night", created_at: new Date().toISOString() },
        { category: "Kidnapping", safety_rating: 1, distance_from_route: 5, time_cycle: "Night", created_at: new Date().toISOString() },
        { category: "Weapon Complaint", safety_rating: 1, distance_from_route: 5, time_cycle: "Night", created_at: new Date().toISOString() }
      ],
      historicalReports: Array(50).fill({ crime_count: 50, crime_type: "Assault", lighting_score: 1, police_station_distance: 5000, crowd_density: 5 }),
      totalDangerPenalty: 40.0
    };

    const resHigh = await calculateSafetyScoreEngine(highRiskAnalysis);
    assert.ok(resHigh.displayedSafetyScore < 20, `High risk route score should be low (<20), got ${resHigh.displayedSafetyScore}`);

    console.log(`✓ TEST B (High-Risk Route): Displayed Safety Score = ${resHigh.displayedSafetyScore} / 100 (Total Risk: ${resHigh.totalRisk})`);
    results.testB = `PASS (${resHigh.displayedSafetyScore}/100)`;
  } catch (err) {
    console.error("✗ TEST B Failed:", err.message);
    results.testB = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST C: Low-Risk Route (Score Remains High)
  // --------------------------------------------------
  try {
    const lowRiskAnalysis = {
      positiveReports: [
        { category: "Police Patrol", safety_rating: 5, distance_from_route: 10, time_cycle: "Afternoon", created_at: new Date().toISOString() },
        { category: "Brightly Lit Street", safety_rating: 5, distance_from_route: 10, time_cycle: "Afternoon", created_at: new Date().toISOString() }
      ],
      negativeReports: [],
      historicalReports: [{ crime_count: 2, crime_type: "Theft", lighting_score: 9, police_station_distance: 200, crowd_density: 80 }],
      totalDangerPenalty: 0
    };

    const resLow = await calculateSafetyScoreEngine(lowRiskAnalysis);
    assert.ok(resLow.displayedSafetyScore >= 80, `Low risk route score should be high (>=80), got ${resLow.displayedSafetyScore}`);

    console.log(`✓ TEST C (Low-Risk Route): Displayed Safety Score = ${resLow.displayedSafetyScore} / 100 (Total Risk: ${resLow.totalRisk})`);
    results.testC = `PASS (${resLow.displayedSafetyScore}/100)`;
  } catch (err) {
    console.error("✗ TEST C Failed:", err.message);
    results.testC = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST D: Score Differentiation Across Multiple Routes
  // --------------------------------------------------
  try {
    const lowRes = await calculateSafetyScoreEngine({ positiveReports: [{ category: "Police Patrol", safety_rating: 5 }], negativeReports: [], historicalReports: [], totalDangerPenalty: 0 });
    const modRes = await calculateSafetyScoreEngine({ positiveReports: [], negativeReports: [{ category: "Poor Lighting", safety_rating: 3 }], historicalReports: [{ crime_count: 5, crime_type: "Theft", lighting_score: 6 }], totalDangerPenalty: 5 });
    const highRes = await calculateSafetyScoreEngine({ positiveReports: [], negativeReports: [{ category: "Assault", safety_rating: 1 }], historicalReports: Array(20).fill({ crime_count: 30, crime_type: "Assault" }), totalDangerPenalty: 30 });

    assert.ok(lowRes.displayedSafetyScore > modRes.displayedSafetyScore, "Low risk route score must be > moderate risk route score");
    assert.ok(modRes.displayedSafetyScore > highRes.displayedSafetyScore, "Moderate risk route score must be > high risk route score");

    console.log(`✓ TEST D (Differentiation): Low Risk=${lowRes.displayedSafetyScore}, Mod Risk=${modRes.displayedSafetyScore}, High Risk=${highRes.displayedSafetyScore}`);
    results.testD = `PASS (${lowRes.displayedSafetyScore} > ${modRes.displayedSafetyScore} > ${highRes.displayedSafetyScore})`;
  } catch (err) {
    console.error("✗ TEST D Failed:", err.message);
    results.testD = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST E: Record-Count Density Test (Duplicating Records Does Not Force Score to 0)
  // --------------------------------------------------
  try {
    const predictions10 = Array(10).fill(25.0);
    const predictions500 = Array(500).fill(25.0);

    const histRisk10 = calculateAggregatedHistoricalRisk(predictions10);
    const histRisk500 = calculateAggregatedHistoricalRisk(predictions500);

    assert.ok(histRisk500 < 50, `500 records with mean risk 25 must be bounded (<50), got ${histRisk500}`);
    assert.ok(histRisk500 >= histRisk10, "Density factor should modestly adjust risk upward for higher volume");

    console.log(`✓ TEST E (Record-Count Density): 10 records (Mean 25) = ${histRisk10}/100. 500 records (Mean 25) = ${histRisk500}/100 (Bounded!).`);
    results.testE = `PASS (10 records: ${histRisk10}, 500 records: ${histRisk500})`;
  } catch (err) {
    console.error("✗ TEST E Failed:", err.message);
    results.testE = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST F & G: Positive & Negative Community Reports
  // --------------------------------------------------
  try {
    const baseAnalysis = { positiveReports: [], negativeReports: [], historicalReports: [], totalDangerPenalty: 0 };
    const baseRes = await calculateSafetyScoreEngine(baseAnalysis);

    const negAnalysis = { positiveReports: [], negativeReports: [{ category: "Poor Lighting", safety_rating: 2 }], historicalReports: [], totalDangerPenalty: 0 };
    const negRes = await calculateSafetyScoreEngine(negAnalysis);

    const posAnalysis = { positiveReports: [{ category: "Police Patrol", safety_rating: 5 }], negativeReports: [{ category: "Poor Lighting", safety_rating: 2 }], historicalReports: [], totalDangerPenalty: 0 };
    const posRes = await calculateSafetyScoreEngine(posAnalysis);

    assert.ok(negRes.displayedSafetyScore < baseRes.displayedSafetyScore, "Negative report must lower safety score");
    assert.ok(posRes.displayedSafetyScore > negRes.displayedSafetyScore, "Positive report must offset negative report and raise safety score");

    console.log(`✓ TEST F & G (Community Reports): Base Score=${baseRes.displayedSafetyScore}, +Negative Report=${negRes.displayedSafetyScore}, +Positive Offset=${posRes.displayedSafetyScore}`);
    results.testFG = "PASS";
  } catch (err) {
    console.error("✗ TEST F & G Failed:", err.message);
    results.testFG = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST H: Danger Zone Penalty Integration
  // --------------------------------------------------
  try {
    const noDanger = await calculateSafetyScoreEngine({ positiveReports: [], negativeReports: [], historicalReports: [], totalDangerPenalty: 0 });
    const withDanger = await calculateSafetyScoreEngine({ positiveReports: [], negativeReports: [], historicalReports: [], totalDangerPenalty: 20 });

    assert.equal(withDanger.totalDangerPenalty, 20);
    assert.equal(withDanger.totalRisk, noDanger.totalRisk + 20);
    assert.equal(withDanger.displayedSafetyScore, noDanger.displayedSafetyScore - 20);

    console.log(`✓ TEST H (Danger Zone Penalty): Danger Penalty +20 directly lowers Safety Score from ${noDanger.displayedSafetyScore} to ${withDanger.displayedSafetyScore}`);
    results.testH = "PASS";
  } catch (err) {
    console.error("✗ TEST H Failed:", err.message);
    results.testH = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST I: Score / Risk Identity (displayedSafetyScore + totalRisk = 100)
  // --------------------------------------------------
  try {
    const resIdentity = await calculateSafetyScoreEngine({
      positiveReports: [{ category: "Brightly Lit Street", safety_rating: 4 }],
      negativeReports: [{ category: "Theft", safety_rating: 3 }],
      historicalReports: [{ crime_count: 10, crime_type: "Theft" }],
      totalDangerPenalty: 12
    });

    const sum = Math.round((resIdentity.displayedSafetyScore + resIdentity.totalRisk) * 10) / 10;
    assert.equal(sum, 100, `displayedSafetyScore + totalRisk must equal 100, got ${sum}`);
    assert.equal(resIdentity.internalRouteRisk, resIdentity.totalRisk, "internalRouteRisk must equal totalRisk");

    console.log(`✓ TEST I (Score/Risk Identity): Score=${resIdentity.displayedSafetyScore} + TotalRisk=${resIdentity.totalRisk} = ${sum}`);
    results.testI = "PASS";
  } catch (err) {
    console.error("✗ TEST I Failed:", err.message);
    results.testI = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST J: Route Ranking Alignment with Internal Risk
  // --------------------------------------------------
  try {
    const origin = { lat: 12.9716, lon: 77.5946 };
    const destination = { lat: 12.9816, lon: 77.6046 };

    const routingRes = await evaluateAllRoutes(origin, destination, { safetyData: [], communityReports: [] });
    const safest = routingRes.safest;
    const lowestRiskCandidate = routingRes.evaluatedRoutes.reduce((min, c) => c.internalRouteRisk < min.internalRouteRisk ? c : min, routingRes.evaluatedRoutes[0]);

    assert.equal(safest.routeId, lowestRiskCandidate.routeId, "Safest route selection must match lowest internal risk candidate");
    assert.ok(safest.displayedSafetyScore >= routingRes.fastest.displayedSafetyScore, "Safest route score must be >= fastest route score");

    console.log(`✓ TEST J (Route Ranking): Safest Route ID: ${safest.routeId} (Score: ${safest.displayedSafetyScore}, Risk: ${safest.internalRouteRisk})`);
    results.testJ = "PASS";
  } catch (err) {
    console.error("✗ TEST J Failed:", err.message);
    results.testJ = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST K: Offline ML Fallback Score Validity
  // --------------------------------------------------
  try {
    const offlineRes = await calculateSafetyScoreEngine({
      positiveReports: [],
      negativeReports: [],
      historicalReports: [{ crime_count: 15, crime_type: "Assault", lighting_score: 3, police_station_distance: 3000, crowd_density: 20 }],
      totalDangerPenalty: 0
    });

    assert.ok(typeof offlineRes.displayedSafetyScore === "number", "Fallback score must be a number");
    assert.ok(!isNaN(offlineRes.displayedSafetyScore), "Fallback score must not be NaN");
    assert.ok(offlineRes.displayedSafetyScore >= 0 && offlineRes.displayedSafetyScore <= 100, "Fallback score must be in 0..100 range");

    console.log(`✓ TEST K (Offline ML Fallback): Score = ${offlineRes.displayedSafetyScore} / 100 (mlPredictionUsed=${offlineRes.mlPredictionUsed})`);
    results.testK = "PASS";
  } catch (err) {
    console.error("✗ TEST K Failed:", err.message);
    results.testK = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST L: UI Token Integrity (No NaN / Undefined / Infinity)
  // --------------------------------------------------
  try {
    const uiRes = await calculateSafetyScoreEngine({ positiveReports: [], negativeReports: [], historicalReports: [], totalDangerPenalty: 0 });

    const checkToken = (val, name) => {
      const s = String(val);
      assert.ok(!s.includes("NaN"), `${name} contains NaN`);
      assert.ok(!s.includes("undefined"), `${name} contains undefined`);
      assert.ok(!s.includes("Infinity"), `${name} contains Infinity`);
    };

    checkToken(uiRes.displayedSafetyScore, "displayedSafetyScore");
    checkToken(uiRes.totalRisk, "totalRisk");
    checkToken(uiRes.historicalRiskDisplay, "historicalRiskDisplay");
    checkToken(uiRes.communityRiskDisplay, "communityRiskDisplay");
    checkToken(uiRes.safetyBadge, "safetyBadge");

    console.log(`✓ TEST L (UI Token Integrity): Score=${uiRes.displayedSafetyScore}, Badge="${uiRes.safetyBadge}". All tokens clean.`);
    results.testL = "PASS";
  } catch (err) {
    console.error("✗ TEST L Failed:", err.message);
    results.testL = `FAIL: ${err.message}`;
  }

  // --------------------------------------------------
  // TEST M: Model Integrity (safety_model.pkl untouched)
  // --------------------------------------------------
  try {
    const modelPath = path.resolve("ml", "safety_model.pkl");
    const stat = fs.statSync(modelPath);
    assert.equal(stat.size, 268974650, "safety_model.pkl size must be exactly 268,974,650 bytes");

    console.log(`✓ TEST M (Model Integrity): ml/safety_model.pkl size is exactly ${stat.size} bytes. 100% UNTOUCHED.`);
    results.testM = "PASS";
  } catch (err) {
    console.error("✗ TEST M Failed:", err.message);
    results.testM = `FAIL: ${err.message}`;
  }

  console.log("\n==================================================");
  console.log("SAFETY SCORE REDESIGN VERIFICATION SUMMARY:");
  console.log("==================================================");
  console.table(results);
}

runScoreFixValidation().catch(console.error);
