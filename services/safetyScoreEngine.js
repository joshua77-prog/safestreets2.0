/**
 * Risk-Based Safety Score Engine
 * Redesigned to calculate Safety Score based on raw historical incident risks,
 * historical density multipliers, live community report risks, and 40/60 weighted risk combination.
 *
 * Sequence:
 * 1. Historical Risk = Average(Historical Record Risks) * Density Multiplier (40% Weight)
 * 2. Community Risk = Sum(Community Report Risks) (60% Weight)
 * 3. Total Risk = (Historical Risk * 0.4) + (Community Risk * 0.6)
 * 4. Final Safety Score = 100 - Total Risk (Clamped 0 to 100)
 */

// ----------------------------------------------------
// COMMUNITY REPORT BASE RISKS
// ----------------------------------------------------
const NEGATIVE_REPORT_RISK_WEIGHTS = {
  "Assault / Violence": 40,
  "Assault": 40,
  "Violence": 40,
  "Harassment": 35,
  "Theft / Pickpocketing": 30,
  "Theft": 30,
  "Pickpocketing": 30,
  "Robbery": 35,
  "Suspicious Activity": 25,
  "Isolated Area": 25,
  "Drunk People": 20,
  "Poor Lighting": 20,
  "Reckless Driving": 15,
  "Road Hazard": 12,
  "Stray Animal Threat": 10,
  "Other": 5
};

const POSITIVE_REPORT_RISK_WEIGHTS = {
  "Police Presence": -25,
  "Police Patrol": -25,
  "Guarded Premises": -20,
  "Brightly Lit Street": -18,
  "Busy Area": -15,
  "High Foot Traffic": -12,
  "Felt Safe": -10
};

// ----------------------------------------------------
// MULTIPLIERS
// ----------------------------------------------------
const RATING_MULTIPLIERS = {
  1: 0.6,
  2: 0.8,
  3: 1.0,
  4: 1.2,
  5: 1.5
};

export function getDistanceMultiplier(distMeters) {
  const dist = Number(distMeters) || 0;
  if (dist <= 100) return 1.0;
  if (dist <= 300) return 0.9;
  if (dist <= 500) return 0.7;
  if (dist <= 750) return 0.5;
  if (dist <= 1000) return 0.3;
  return 0.0;
}

const TIME_CYCLES = ["Morning", "Afternoon", "Evening", "Night", "Critical Hours"];

export function getCurrentTimeCycle(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  if (hour >= 21 || hour < 2) return "Night";
  return "Critical Hours";
}

export function getTimeMultiplier(reportTimeCycle, currentTimeCycle = getCurrentTimeCycle()) {
  if (!reportTimeCycle || reportTimeCycle === "Anytime" || reportTimeCycle === "Historical Record") {
    return 1.0;
  }

  const normalizeCycle = (c) => {
    if (!c) return "Morning";
    const str = String(c).toLowerCase();
    if (str.includes("morning")) return "Morning";
    if (str.includes("afternoon")) return "Afternoon";
    if (str.includes("evening")) return "Evening";
    if (str.includes("late") || str.includes("critical")) return "Critical Hours";
    if (str.includes("night")) return "Night";
    return "Morning";
  };

  const curr = normalizeCycle(currentTimeCycle);
  const rep = normalizeCycle(reportTimeCycle);

  if (curr === rep) return 1.2;

  const idxCurr = TIME_CYCLES.indexOf(curr);
  const idxRep = TIME_CYCLES.indexOf(rep);

  if (idxCurr !== -1 && idxRep !== -1) {
    const diff = Math.abs(idxCurr - idxRep);
    if (diff === 1 || diff === TIME_CYCLES.length - 1) {
      return 1.0;
    }
  }

  return 0.8;
}

export function getReportAgeMultiplier(createdAt) {
  if (!createdAt) return 1.0;
  try {
    const reportDate = new Date(createdAt);
    if (isNaN(reportDate.getTime())) return 1.0;

    const diffMs = Date.now() - reportDate.getTime();
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    if (diffDays <= 7) return 1.0;
    if (diffDays <= 30) return 0.8;
    if (diffDays <= 180) return 0.6;
    if (diffDays <= 365) return 0.4;
    return 0.2;
  } catch {
    return 1.0;
  }
}

// ----------------------------------------------------
// HISTORICAL RISK TABLES
// ----------------------------------------------------

/**
 * Crime Count Risk
 * 0–5: 0 pts
 * 6–10: 5 pts
 * 11–20: 10 pts
 * 21–30: 18 pts
 * 31–40: 25 pts
 * Above 40: 35 pts
 */
export function getCrimeCountRisk(crimeCount) {
  const count = Number(crimeCount) || 0;
  if (count <= 5) return 0;
  if (count <= 10) return 5;
  if (count <= 20) return 10;
  if (count <= 30) return 18;
  if (count <= 40) return 25;
  return 35;
}

/**
 * Crime Type Risk
 * Assault: 20
 * Harassment: 18
 * Violence: 18
 * Robbery: 15
 * Theft: 12
 * Suspicious Activity: 10
 * Road Hazard: 6
 * Other: 5
 */
export function getCrimeTypeRisk(crimeType) {
  if (!crimeType) return 5;
  const str = String(crimeType).toLowerCase();
  if (str.includes("assault")) return 20;
  if (str.includes("harassment") || str.includes("stalking")) return 18;
  if (str.includes("violence")) return 18;
  if (str.includes("robbery") || str.includes("burglary")) return 15;
  if (str.includes("theft") || str.includes("pickpocketing") || str.includes("stealing")) return 12;
  if (str.includes("suspicious")) return 10;
  if (str.includes("hazard") || str.includes("accident")) return 6;
  return 5;
}

/**
 * Lighting Risk
 * 9–10: 0
 * 7–9: 3
 * 5–7: 8
 * 3–5: 15
 * 0–3: 20
 */
export function getLightingRisk(lightingScore) {
  const score = Number(lightingScore) || 0;
  if (score >= 9) return 0;
  if (score >= 7) return 3;
  if (score >= 5) return 8;
  if (score >= 3) return 15;
  return 20;
}

/**
 * Police Distance Risk
 * 0–500 metres: 0
 * 500m–1km: 2
 * 1–2km: 5
 * 2–3km: 10
 * Above 3km (or unspecified): 15
 */
export function getPoliceDistanceRisk(distanceInput) {
  if (distanceInput == null || distanceInput === "" || isNaN(Number(distanceInput))) {
    return 15;
  }
  const val = Number(distanceInput);
  const distMeters = val <= 50 ? val * 1000 : val;

  if (distMeters <= 500) return 0;
  if (distMeters <= 1000) return 2;
  if (distMeters <= 2000) return 5;
  if (distMeters <= 3000) return 10;
  return 15;
}

/**
 * Crowd Density Risk
 * Very High: 0
 * High: 2
 * Medium: 5
 * Low: 10
 * Very Low: 15
 */
export function getCrowdDensityRisk(densityInput) {
  if (densityInput == null || densityInput === "") return 5; // Default Medium

  if (typeof densityInput === "number" || !isNaN(Number(densityInput))) {
    const val = Number(densityInput);
    if (val >= 80) return 0;
    if (val >= 60) return 2;
    if (val >= 40) return 5;
    if (val >= 20) return 10;
    return 15;
  }

  const str = String(densityInput).toLowerCase();
  if (str.includes("very high")) return 0;
  if (str.includes("high")) return 2;
  if (str.includes("medium") || str.includes("moderate")) return 5;
  if (str.includes("very low")) return 15;
  if (str.includes("low")) return 10;
  return 5;
}

/**
 * Time Match Risk
 * If navigation time matches historical record's time_of_day: +5 risk points
 * Otherwise: 0 risk points
 */
export function getTimeMatchRisk(reportTimeOfDay, currentTimeCycle = getCurrentTimeCycle()) {
  if (!reportTimeOfDay || reportTimeOfDay === "Anytime" || reportTimeOfDay === "Historical Record") {
    return 0;
  }

  const normalizeCycle = (c) => {
    if (!c) return "Morning";
    const str = String(c).toLowerCase();
    if (str.includes("morning")) return "Morning";
    if (str.includes("afternoon")) return "Afternoon";
    if (str.includes("evening")) return "Evening";
    if (str.includes("late") || str.includes("critical")) return "Critical Hours";
    if (str.includes("night")) return "Night";
    return "Morning";
  };

  return normalizeCycle(currentTimeCycle) === normalizeCycle(reportTimeOfDay) ? 5 : 0;
}

/**
 * Historical Risk Density Multiplier
 * 1–5 records: ×1.0
 * 6–10: ×1.2
 * 11–20: ×1.5
 * 21–30: ×1.8
 * 31–50: ×2.0
 * Above 50: ×2.5
 */
export function getHistoricalDensityMultiplier(recordCount) {
  const count = Number(recordCount) || 0;
  if (count <= 0) return 1.0;
  if (count <= 5) return 1.0;
  if (count <= 10) return 1.2;
  if (count <= 20) return 1.5;
  if (count <= 30) return 1.8;
  if (count <= 50) return 2.0;
  return 2.5;
}

// ----------------------------------------------------
// SAFETY LEVELS
// ----------------------------------------------------
export function getSafetyLevel(score) {
  const rounded = Math.round(Number(score) || 0);
  if (rounded >= 90) return { level: "Very Safe", badge: "🟢 Very Safe", color: "emerald", bgClass: "bg-emerald-500", textClass: "text-emerald-700" };
  if (rounded >= 75) return { level: "Safe", badge: "🟢 Safe", color: "emerald", bgClass: "bg-emerald-600", textClass: "text-emerald-600" };
  if (rounded >= 60) return { level: "Moderately Safe", badge: "🟡 Moderately Safe", color: "amber", bgClass: "bg-amber-500", textClass: "text-amber-700" };
  if (rounded >= 40) return { level: "Caution", badge: "🟠 Caution", color: "orange", bgClass: "bg-orange-500", textClass: "text-orange-700" };
  if (rounded >= 20) return { level: "Unsafe", badge: "🔴 Unsafe", color: "rose", bgClass: "bg-rose-600", textClass: "text-rose-700" };
  return { level: "High Risk", badge: "🚨 High Risk", color: "red", bgClass: "bg-red-700", textClass: "text-red-700" };
}

// ----------------------------------------------------
// MAIN SCORE ENGINE
// ----------------------------------------------------

export function calculateSafetyScoreEngine(analysisResult) {
  const baseScore = 100;
  const currentTimeCycle = getCurrentTimeCycle();

  if (!analysisResult) {
    const levelInfo = getSafetyLevel(100);
    return {
      finalScore: 100,
      safetyLevel: levelInfo.level,
      safetyBadge: levelInfo.badge,
      color: levelInfo.color,
      baseScore: 100,
      historicalRisk: 0,
      communityRisk: 0,
      totalRisk: 0,
      densityMultiplier: 1.0,
      historicalRecordsCount: 0,
      communityReportsCount: 0,
      topPositiveFactors: [],
      topNegativeFactors: [],
      summary: {
        baseScore: 100,
        historicalRiskFormatted: "0.0",
        communityRiskFormatted: "0.0",
        totalRiskFormatted: "0.0",
        densityMultiplierFormatted: "×1.0",
        currentTimeCycle,
        finalScoreFormatted: "100 / 100"
      }
    };
  }

  const {
    positiveReports = [],
    negativeReports = [],
    historicalReports = []
  } = analysisResult;

  // 1. STEP 1 & 2: CALCULATE HISTORICAL RISK PER RECORD
  const numHistRecords = Array.isArray(historicalReports) ? historicalReports.length : 0;
  let sumHistoricalRecordRisk = 0;

  // Track historical factor aggregates for fallback insights
  const histNegativeMap = new Map();
  const histPositiveMap = new Map();
  let totalCrimeCount = 0;
  let totalLightingScore = 0;
  let totalPoliceDist = 0;
  let countWithPoliceDist = 0;
  let lowCrowdCount = 0;
  let highCrowdCount = 0;
  let nightMatchCount = 0;
  const crimeTypesMap = new Map();

  console.log(`\n====================================================`);
  console.log(`[Historical Risk Engine] Processing ${numHistRecords} nearby record(s)...`);
  console.log(`====================================================`);

  if (numHistRecords > 0) {
    historicalReports.forEach((item, index) => {
      const rawObj = item.raw || item;

      const crimeCount = Number(
        item.crime_count ?? rawObj.crime_count ?? item.crimeCount ?? rawObj.crimeCount ?? 0
      );
      const crimeType = item.crime_type ?? rawObj.crime_type ?? item.category ?? rawObj.category ?? item.report_type ?? "Other";
      const lightingScore = Number(
        item.lighting_score ?? rawObj.lighting_score ?? item.lightingScore ?? rawObj.lightingScore ?? 5
      );
      const policeDistRaw = item.police_station_distance ?? rawObj.police_station_distance ?? item.police_station_distance_km ?? rawObj.police_station_distance_km ?? item.police_distance ?? rawObj.police_distance;
      const policeStationDistance = policeDistRaw != null && policeDistRaw !== "" ? Number(policeDistRaw) : null;
      const crowdDensity = item.crowd_density ?? rawObj.crowd_density ?? "Medium";
      const timeOfDay = item.time_of_day ?? rawObj.time_of_day ?? item.time_cycle ?? rawObj.time_cycle;

      const crimeCountRisk = getCrimeCountRisk(crimeCount);
      const crimeTypeRisk = getCrimeTypeRisk(crimeType);
      const lightingRisk = getLightingRisk(lightingScore);
      const policeDistanceRisk = getPoliceDistanceRisk(policeStationDistance);
      const crowdDensityRisk = getCrowdDensityRisk(crowdDensity);
      const timeMatchRisk = getTimeMatchRisk(timeOfDay, currentTimeCycle);

      const recordRisk = crimeCountRisk + crimeTypeRisk + lightingRisk + policeDistanceRisk + crowdDensityRisk + timeMatchRisk;
      sumHistoricalRecordRisk += recordRisk;

      // Aggregates for fallback positive/negative insights
      totalCrimeCount += crimeCount;
      totalLightingScore += lightingScore;
      if (policeStationDistance !== null) {
        const pMeters = policeStationDistance <= 50 ? policeStationDistance * 1000 : policeStationDistance;
        totalPoliceDist += pMeters;
        countWithPoliceDist++;
      }

      const strCrowd = String(crowdDensity).toLowerCase();
      if (strCrowd.includes("low")) lowCrowdCount++;
      if (strCrowd.includes("high")) highCrowdCount++;

      const cTypeRisk = getCrimeTypeRisk(crimeType);
      if (cTypeRisk > 5) {
        const key = `${crimeType} Incidents`;
        crimeTypesMap.set(key, (crimeTypesMap.get(key) || 0) + cTypeRisk);
      }

      if (timeMatchRisk > 0) nightMatchCount++;

      console.log(
        `[Historical Record #${index + 1}] CrimeCount: ${crimeCount} (+${crimeCountRisk}), CrimeType: "${crimeType}" (+${crimeTypeRisk}), Lighting: ${lightingScore} (+${lightingRisk}), PoliceDist: ${policeStationDistance !== null ? policeStationDistance : 'N/A'} (+${policeDistanceRisk}), Crowd: "${crowdDensity}" (+${crowdDensityRisk}), TimeMatch: (+${timeMatchRisk}) => Record Risk: ${recordRisk}`
      );
    });

    const avgCrime = totalCrimeCount / numHistRecords;
    const avgLighting = totalLightingScore / numHistRecords;
    const avgPolice = countWithPoliceDist > 0 ? totalPoliceDist / countWithPoliceDist : 4000;

    // Derived Negative Historical Factors
    if (avgCrime > 10) {
      histNegativeMap.set("High Crime Density", 25);
    }
    crimeTypesMap.forEach((pts, name) => {
      histNegativeMap.set(name, pts);
    });
    if (avgLighting < 6) {
      histNegativeMap.set("Poor Street Lighting", 20);
    }
    if (lowCrowdCount > 0) {
      histNegativeMap.set("Low Crowd Density (Isolated)", 15);
    }
    if (avgPolice > 2000) {
      histNegativeMap.set("Distant Police Stations", 15);
    }
    if (nightMatchCount > 0) {
      histNegativeMap.set("Increased Time Match Risk", 10);
    }

    // Derived Positive Historical Factors
    if (avgCrime <= 5) {
      histPositiveMap.set("Low Historical Crime Count", 20);
    }
    if (avgLighting >= 7) {
      histPositiveMap.set("Good Street Lighting", 18);
    }
    if (avgPolice <= 1000) {
      histPositiveMap.set("Nearby Police Station", 15);
    }
    if (highCrowdCount > 0) {
      histPositiveMap.set("High Crowd Density (Active Area)", 12);
    }
  }

  // STEP 3: DENSITY MULTIPLIER
  const averageHistoricalRisk = numHistRecords > 0 ? sumHistoricalRecordRisk / numHistRecords : 0;
  const densityMultiplier = getHistoricalDensityMultiplier(numHistRecords);
  const finalHistoricalRisk = averageHistoricalRisk * densityMultiplier;

  console.log(`----------------------------------------------------`);
  console.log(`Average Historical Risk: ${averageHistoricalRisk.toFixed(2)} | Density Multiplier (${numHistRecords} recs): ×${densityMultiplier.toFixed(1)} | Final Historical Risk: ${finalHistoricalRisk.toFixed(2)}`);
  console.log(`----------------------------------------------------`);

  // STEP 4: COMMUNITY REPORT RISK
  let communityRiskTotal = 0;
  const communityReportContributions = [];
  const positiveFactorDetails = [];
  const negativeFactorDetails = [];

  // Evaluate Positive Reports (Negative Risk = reduces overall risk)
  (positiveReports || []).forEach((rep) => {
    const baseWeight = POSITIVE_REPORT_RISK_WEIGHTS[rep.category] ?? -10;
    const ratingMult = RATING_MULTIPLIERS[Number(rep.safety_rating)] ?? 1.0;
    const distMult = getDistanceMultiplier(Number(rep.distance_from_route) || 0);
    const timeMult = getTimeMultiplier(rep.time_cycle, currentTimeCycle);
    const ageMult = getReportAgeMultiplier(rep.created_at);

    const reportRisk = baseWeight * ratingMult * distMult * timeMult * ageMult;
    communityRiskTotal += reportRisk;

    communityReportContributions.push({
      category: rep.category || rep.report_type || "Positive Marker",
      type: "positive",
      baseWeight,
      ratingMult,
      distMult,
      timeMult,
      ageMult,
      impact: Math.round(reportRisk * 10) / 10
    });

    positiveFactorDetails.push({
      category: rep.category || rep.report_type || "Positive Marker",
      impact: Math.abs(reportRisk)
    });
  });

  // Evaluate Negative Reports (Positive Risk = increases overall risk)
  (negativeReports || []).forEach((rep) => {
    const baseWeight = NEGATIVE_REPORT_RISK_WEIGHTS[rep.category] ?? 10;
    const ratingMult = RATING_MULTIPLIERS[Number(rep.safety_rating)] ?? 1.0;
    const distMult = getDistanceMultiplier(Number(rep.distance_from_route) || 0);
    const timeMult = getTimeMultiplier(rep.time_cycle, currentTimeCycle);
    const ageMult = getReportAgeMultiplier(rep.created_at);

    const reportRisk = baseWeight * ratingMult * distMult * timeMult * ageMult;
    communityRiskTotal += reportRisk;

    communityReportContributions.push({
      category: rep.category || rep.report_type || "Security Incident",
      type: "negative",
      baseWeight,
      ratingMult,
      distMult,
      timeMult,
      ageMult,
      impact: Math.round(reportRisk * 10) / 10
    });

    negativeFactorDetails.push({
      category: rep.category || rep.report_type || "Security Incident",
      impact: Math.abs(reportRisk)
    });
  });

  const finalCommunityRisk = Math.max(0, communityRiskTotal);

  // STEP 5: TOTAL RISK COMBINATION (40% Historical + 60% Community)
  const totalRisk = (finalHistoricalRisk * 0.4) + (finalCommunityRisk * 0.6);

  // STEP 6: FINAL SAFETY SCORE = 100 - TOTAL RISK (Clamped 0 to 100)
  const unclampedFinalScore = baseScore - totalRisk;
  const finalScore = Math.max(0, Math.min(100, Math.round(unclampedFinalScore)));

  // NORMALIZED DISPLAY VALUES
  const MAX_EXPECTED_HISTORICAL_RISK = 250;
  const historicalRiskDisplay = Math.min(100, Math.round((finalHistoricalRisk / MAX_EXPECTED_HISTORICAL_RISK) * 100));
  const communityRiskDisplay = Math.min(100, Math.round(finalCommunityRisk));

  console.log(`--------------------------------`);
  console.log(`Base Score: ${baseScore}`);
  console.log(`Historical Risk (40%): ${finalHistoricalRisk.toFixed(1)} (Display: ${historicalRiskDisplay}/100)`);
  console.log(`Community Risk (60%): ${finalCommunityRisk.toFixed(1)} (Display: ${communityRiskDisplay}/100)`);
  console.log(`Total Risk: ${totalRisk.toFixed(1)}`);
  console.log(`Final Safety Score: ${finalScore}`);
  console.log(`--------------------------------\n`);

  // Safety Level Categorization
  const levelInfo = getSafetyLevel(finalScore);

  // Top Factors
  const topPositiveFactorsMap = new Map();
  positiveFactorDetails.forEach((f) => {
    if (!topPositiveFactorsMap.has(f.category) || f.impact > topPositiveFactorsMap.get(f.category).impact) {
      topPositiveFactorsMap.set(f.category, f);
    }
  });

  const topNegativeFactorsMap = new Map();
  negativeFactorDetails.forEach((f) => {
    if (!topNegativeFactorsMap.has(f.category) || f.impact > topNegativeFactorsMap.get(f.category).impact) {
      topNegativeFactorsMap.set(f.category, f);
    }
  });

  let topPositiveFactors = Array.from(topPositiveFactorsMap.values())
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)
    .map((f) => `✓ ${f.category}`);

  let topNegativeFactors = Array.from(topNegativeFactorsMap.values())
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)
    .map((f) => `⚠ ${f.category}`);

  // Fallback to historical insights if community report factors are empty
  if (topNegativeFactors.length === 0 && histNegativeMap.size > 0) {
    topNegativeFactors = Array.from(histNegativeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => `⚠ ${name}`);
  }

  if (topPositiveFactors.length === 0 && histPositiveMap.size > 0) {
    topPositiveFactors = Array.from(histPositiveMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => `✓ ${name}`);
  }

  return {
    finalScore,
    safetyLevel: levelInfo.level,
    safetyBadge: levelInfo.badge,
    color: levelInfo.color,
    baseScore: 100,
    historicalRisk: Math.round(finalHistoricalRisk * 10) / 10,
    historicalRiskDisplay,
    communityRisk: Math.round(finalCommunityRisk * 10) / 10,
    communityRiskDisplay,
    totalRisk: Math.round(totalRisk * 10) / 10,
    densityMultiplier,
    historicalRecordsCount: numHistRecords,
    communityReportsCount: (positiveReports.length + negativeReports.length),
    communityReportContributions,
    topPositiveFactors,
    topNegativeFactors,
    summary: {
      baseScore: 100,
      historicalRiskFormatted: `${(finalHistoricalRisk).toFixed(1)}`,
      historicalRiskDisplayFormatted: `${historicalRiskDisplay} / 100`,
      communityRiskFormatted: `${(finalCommunityRisk).toFixed(1)}`,
      communityRiskDisplayFormatted: `${communityRiskDisplay} / 100`,
      totalRiskFormatted: `${(totalRisk).toFixed(1)}`,
      densityMultiplierFormatted: `×${densityMultiplier.toFixed(1)}`,
      currentTimeCycle,
      finalScoreFormatted: `${finalScore} / 100`
    }
  };
}



