import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateSafetyScoreEngine, 
  getCurrentTimeCycle, 
  getCrimeCountRisk, 
  getCrimeTypeRisk, 
  getLightingRisk, 
  getPoliceDistanceRisk, 
  getCrowdDensityRisk, 
  getHistoricalDensityMultiplier 
} from "./safetyScoreEngine.js";

test("individual historical risk component tables", () => {
  assert.equal(getCrimeCountRisk(3), 0);
  assert.equal(getCrimeCountRisk(8), 5);
  assert.equal(getCrimeCountRisk(15), 10);
  assert.equal(getCrimeCountRisk(25), 18);
  assert.equal(getCrimeCountRisk(35), 25);
  assert.equal(getCrimeCountRisk(45), 35);

  assert.equal(getCrimeTypeRisk("Assault"), 20);
  assert.equal(getCrimeTypeRisk("Harassment"), 18);
  assert.equal(getCrimeTypeRisk("Robbery"), 15);
  assert.equal(getCrimeTypeRisk("Theft"), 12);
  assert.equal(getCrimeTypeRisk("Suspicious Activity"), 10);
  assert.equal(getCrimeTypeRisk("Road Hazard"), 6);

  assert.equal(getLightingRisk(9.5), 0);
  assert.equal(getLightingRisk(8), 3);
  assert.equal(getLightingRisk(6), 8);
  assert.equal(getLightingRisk(4), 15);
  assert.equal(getLightingRisk(2), 20);

  assert.equal(getPoliceDistanceRisk(400), 0);
  assert.equal(getPoliceDistanceRisk(800), 2);
  assert.equal(getPoliceDistanceRisk(1500), 5);
  assert.equal(getPoliceDistanceRisk(2500), 10);
  assert.equal(getPoliceDistanceRisk(4000), 15);

  assert.equal(getCrowdDensityRisk("Very High"), 0);
  assert.equal(getCrowdDensityRisk("High"), 2);
  assert.equal(getCrowdDensityRisk("Medium"), 5);
  assert.equal(getCrowdDensityRisk("Low"), 10);
  assert.equal(getCrowdDensityRisk("Very Low"), 15);

  assert.equal(getHistoricalDensityMultiplier(3), 1.0);
  assert.equal(getHistoricalDensityMultiplier(8), 1.2);
  assert.equal(getHistoricalDensityMultiplier(15), 1.5);
  assert.equal(getHistoricalDensityMultiplier(25), 1.8);
  assert.equal(getHistoricalDensityMultiplier(40), 2.0);
  assert.equal(getHistoricalDensityMultiplier(55), 2.5);
});

test("high historical incidents scenario", async () => {
  const currentTimeCycle = getCurrentTimeCycle();
  const highRiskInput = {
    positiveReports: [],
    negativeReports: [],
    historicalReports: Array.from({ length: 15 }, () => ({
      crime_count: 35,
      crime_type: "Assault",
      lighting_score: 3.5,
      police_station_distance: 3500,
      crowd_density: "Very Low",
      time_of_day: currentTimeCycle
    }))
  };

  const resHigh = await calculateSafetyScoreEngine(highRiskInput);
  assert.ok(resHigh.finalScore <= 70, "High risk scenario should produce displayed safety score <= 70");
});

test("safe scenario with positive community report", async () => {
  const currentTimeCycle = getCurrentTimeCycle();
  const safeInput = {
    positiveReports: [
      {
        category: "Police Presence",
        safety_rating: 5,
        distance_from_route: 50,
        time_cycle: currentTimeCycle,
        created_at: new Date().toISOString()
      }
    ],
    negativeReports: [],
    historicalReports: [
      {
        crime_count: 2,
        crime_type: "Other",
        lighting_score: 9.5,
        police_station_distance: 300,
        crowd_density: "High",
        time_of_day: "Morning"
      }
    ]
  };

  const resSafe = await calculateSafetyScoreEngine(safeInput);
  assert.ok(resSafe.finalScore >= 90, "Safe scenario should produce safety score >= 90");
  assert.equal(resSafe.safetyLevel, "Very Safe");
});
