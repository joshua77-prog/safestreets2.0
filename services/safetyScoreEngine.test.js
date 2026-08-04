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

function runTests() {
  console.log("=== Running Risk-Based Safety Score Engine Unit Tests ===\n");
  const currentTimeCycle = getCurrentTimeCycle();

  // TEST 1: Individual Historical Risk Component Tables
  console.assert(getCrimeCountRisk(3) === 0, "Crime Count 3 should be 0 pts risk");
  console.assert(getCrimeCountRisk(8) === 5, "Crime Count 8 should be 5 pts risk");
  console.assert(getCrimeCountRisk(15) === 10, "Crime Count 15 should be 10 pts risk");
  console.assert(getCrimeCountRisk(25) === 18, "Crime Count 25 should be 18 pts risk");
  console.assert(getCrimeCountRisk(35) === 25, "Crime Count 35 should be 25 pts risk");
  console.assert(getCrimeCountRisk(45) === 35, "Crime Count 45 should be 35 pts risk");

  console.assert(getCrimeTypeRisk("Assault") === 20, "Assault should be 20 pts risk");
  console.assert(getCrimeTypeRisk("Harassment") === 18, "Harassment should be 18 pts risk");
  console.assert(getCrimeTypeRisk("Robbery") === 15, "Robbery should be 15 pts risk");
  console.assert(getCrimeTypeRisk("Theft") === 12, "Theft should be 12 pts risk");
  console.assert(getCrimeTypeRisk("Suspicious Activity") === 10, "Suspicious Activity should be 10 pts risk");
  console.assert(getCrimeTypeRisk("Road Hazard") === 6, "Road Hazard should be 6 pts risk");

  console.assert(getLightingRisk(9.5) === 0, "Lighting 9.5 should be 0 pts risk");
  console.assert(getLightingRisk(8) === 3, "Lighting 8 should be 3 pts risk");
  console.assert(getLightingRisk(6) === 8, "Lighting 6 should be 8 pts risk");
  console.assert(getLightingRisk(4) === 15, "Lighting 4 should be 15 pts risk");
  console.assert(getLightingRisk(2) === 20, "Lighting 2 should be 20 pts risk");

  console.assert(getPoliceDistanceRisk(400) === 0, "Police dist 400m should be 0 pts risk");
  console.assert(getPoliceDistanceRisk(800) === 2, "Police dist 800m should be 2 pts risk");
  console.assert(getPoliceDistanceRisk(1500) === 5, "Police dist 1500m should be 5 pts risk");
  console.assert(getPoliceDistanceRisk(2500) === 10, "Police dist 2500m should be 10 pts risk");
  console.assert(getPoliceDistanceRisk(4000) === 15, "Police dist 4000m should be 15 pts risk");

  console.assert(getCrowdDensityRisk("Very High") === 0, "Crowd Very High should be 0 pts risk");
  console.assert(getCrowdDensityRisk("High") === 2, "Crowd High should be 2 pts risk");
  console.assert(getCrowdDensityRisk("Medium") === 5, "Crowd Medium should be 5 pts risk");
  console.assert(getCrowdDensityRisk("Low") === 10, "Crowd Low should be 10 pts risk");
  console.assert(getCrowdDensityRisk("Very Low") === 15, "Crowd Very Low should be 15 pts risk");

  console.assert(getHistoricalDensityMultiplier(3) === 1.0, "3 records density mult should be x1.0");
  console.assert(getHistoricalDensityMultiplier(8) === 1.2, "8 records density mult should be x1.2");
  console.assert(getHistoricalDensityMultiplier(15) === 1.5, "15 records density mult should be x1.5");
  console.assert(getHistoricalDensityMultiplier(25) === 1.8, "25 records density mult should be x1.8");
  console.assert(getHistoricalDensityMultiplier(40) === 2.0, "40 records density mult should be x2.0");
  console.assert(getHistoricalDensityMultiplier(55) === 2.5, "55 records density mult should be x2.5");

  console.log("✅ Component Risk Tables Passed!\n");

  // TEST 2: High Historical Incidents Scenario (Multiple crimes)
  const highRiskInput = {
    positiveReports: [],
    negativeReports: [],
    historicalReports: Array.from({ length: 15 }, (_, i) => ({
      crime_count: 35,
      crime_type: "Assault",
      lighting_score: 3.5,
      police_station_distance: 3500,
      crowd_density: "Very Low",
      time_of_day: currentTimeCycle
    }))
  };

  const resHigh = calculateSafetyScoreEngine(highRiskInput);
  console.log("High Risk Scenario Outcome:", resHigh.summary);
  console.assert(resHigh.finalScore < 50, "High Risk Scenario should produce Safety Score < 50");
  console.assert(resHigh.densityMultiplier === 1.5, "15 records should have Density Multiplier x1.5");
  console.log("✅ High Risk Scenario Passed!\n");

  // TEST 3: Safe Scenario
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

  const resSafe = calculateSafetyScoreEngine(safeInput);
  console.log("Safe Scenario Outcome:", resSafe.summary);
  console.assert(resSafe.finalScore >= 90, "Safe Scenario should produce Safety Score >= 90");
  console.assert(resSafe.safetyLevel === "Very Safe", "Safe Scenario should be 'Very Safe'");
  console.log("✅ Safe Scenario Passed!\n");

  console.log("🎉 ALL RISK-BASED ENGINE TESTS PASSED SUCCESSFULLY!");
}

runTests();
