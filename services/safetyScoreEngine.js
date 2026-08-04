/**
 * Safety Score Engine
 * Calculates numerical Safety Score (0–100) and Safety Level using nearby safety data.
 */

// Category Weight Tables
const NEGATIVE_CATEGORY_WEIGHTS = {
  "Assault / Violence": -40,
  "Assault": -40,
  "Violence": -40,
  "Harassment": -35,
  "Theft / Pickpocketing": -30,
  "Theft": -30,
  "Pickpocketing": -30,
  "Suspicious Activity": -25,
  "Isolated Area": -25,
  "Drunk People": -20,
  "Poor Lighting": -20,
  "Reckless Driving": -15,
  "Road Hazard": -12,
  "Stray Animal Threat": -10,
  "Other": -5
};

const POSITIVE_CATEGORY_WEIGHTS = {
  "Police Presence": +25,
  "Police Patrol": +25,
  "Guarded Premises": +20,
  "Brightly Lit Street": +18,
  "Busy Area": +15,
  "High Foot Traffic": +12,
  "Felt Safe": +10,
  "CCTV Coverage": +10,
  "Active Commercial Area": +10,
  "Active Nightlife": +10,
  "Residential Area": +10,
  "Other": +5
};

// Rating Multipliers (1-5)
const RATING_MULTIPLIERS = {
  1: 0.6,
  2: 0.8,
  3: 1.0,
  4: 1.2,
  5: 1.5
};

// Time Cycle Order
const TIME_CYCLES = ["Morning", "Afternoon", "Evening", "Night", "Critical Hours"];

/**
 * Determine current time cycle from current date/hour
 */
export function getCurrentTimeCycle(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  if (hour >= 21 || hour < 2) return "Night";
  return "Critical Hours";
}

/**
 * Get Distance Multiplier based on distance_from_route in meters
 */
export function getDistanceMultiplier(distMeters) {
  const dist = Number(distMeters) || 0;
  if (dist <= 100) return 1.0;
  if (dist <= 300) return 0.9;
  if (dist <= 500) return 0.7;
  if (dist <= 750) return 0.5;
  if (dist <= 1000) return 0.3;
  return 0.1;
}

/**
 * Get Time Multiplier comparing current time cycle to report's time cycle
 */
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

/**
 * Get Report Age Multiplier based on created_at date
 */
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

/**
 * Get Category Weight
 */
export function getCategoryWeight(category, isPositive) {
  if (!category) return isPositive ? 10 : -10;

  const table = isPositive ? POSITIVE_CATEGORY_WEIGHTS : NEGATIVE_CATEGORY_WEIGHTS;

  if (table[category] !== undefined) {
    return table[category];
  }

  const catLower = String(category).toLowerCase();
  for (const [key, weight] of Object.entries(table)) {
    if (catLower.includes(key.toLowerCase()) || key.toLowerCase().includes(catLower)) {
      return weight;
    }
  }

  return isPositive ? 10 : -15;
}

/**
 * Determine Safety Level & styling from numerical score (0-100)
 */
export function getSafetyLevel(score) {
  const rounded = Math.round(Number(score) || 0);
  if (rounded >= 90) return { level: "Very Safe", badge: "🟢 Very Safe", color: "emerald", bgClass: "bg-emerald-500", textClass: "text-emerald-700" };
  if (rounded >= 75) return { level: "Safe", badge: "🟢 Safe", color: "emerald", bgClass: "bg-emerald-600", textClass: "text-emerald-600" };
  if (rounded >= 60) return { level: "Moderately Safe", badge: "🟡 Moderately Safe", color: "amber", bgClass: "bg-amber-500", textClass: "text-amber-700" };
  if (rounded >= 40) return { level: "Caution", badge: "🟠 Caution", color: "orange", bgClass: "bg-orange-500", textClass: "text-orange-700" };
  if (rounded >= 20) return { level: "Unsafe", badge: "🔴 Unsafe", color: "rose", bgClass: "bg-rose-600", textClass: "text-rose-700" };
  return { level: "High Risk", badge: "🚨 High Risk", color: "red", bgClass: "bg-red-700", textClass: "text-red-700" };
}

/**
 * Calculate Safety Score (0-100) using nearby safety data
 *
 * Sequence:
 * Base Score = 100 (ALWAYS 100)
 * + Positive Impact
 * - Negative Impact
 * + Historical Adjustment (+5 / 0 / -5)
 * Clamp 0 - 100
 */
export function calculateSafetyScoreEngine(analysisResult) {
  if (!analysisResult) {
    return {
      finalScore: 100,
      safetyLevel: "Very Safe",
      safetyBadge: "🟢 Very Safe",
      color: "emerald",
      baseScore: 100,
      positiveImpact: 0,
      negativeImpact: 0,
      historicalAdjustment: 0,
      topPositiveFactors: [],
      topNegativeFactors: [],
      summary: {
        baseScore: 100,
        positiveImpactFormatted: "+0.0",
        negativeImpactFormatted: "-0.0",
        historicalAdjustmentFormatted: "0",
        currentTimeCycle: getCurrentTimeCycle(),
        finalScoreFormatted: "100 / 100"
      }
    };
  }

  const {
    positiveReports = [],
    negativeReports = [],
    historicalReports = []
  } = analysisResult;

  const currentTimeCycle = getCurrentTimeCycle();

  // 1. Base Score ALWAYS starts at 100
  const baseScore = 100;

  // 2. Positive Reports Impact calculation
  let totalPositiveImpact = 0;
  const positiveFactorDetails = [];

  (positiveReports || []).forEach((rep) => {
    const categoryWeight = getCategoryWeight(rep.category, true);
    const ratingMult = RATING_MULTIPLIERS[Number(rep.safety_rating)] ?? 1.0;
    const distMult = getDistanceMultiplier(Number(rep.distance_from_route) || 0);
    const timeMult = getTimeMultiplier(rep.time_cycle, currentTimeCycle);
    const ageMult = getReportAgeMultiplier(rep.created_at);

    const impact = categoryWeight * ratingMult * distMult * timeMult * ageMult;
    totalPositiveImpact += impact;

    positiveFactorDetails.push({
      category: rep.category || rep.report_type || "Positive Report",
      impact: Math.round(impact * 10) / 10,
      distance: Number(rep.distance_from_route) || 0
    });
  });

  // 3. Negative Reports Impact calculation
  let totalNegativeImpact = 0;
  const negativeFactorDetails = [];

  (negativeReports || []).forEach((rep) => {
    const categoryWeight = Math.abs(getCategoryWeight(rep.category, false));
    const ratingMult = RATING_MULTIPLIERS[Number(rep.safety_rating)] ?? 1.0;
    const distMult = getDistanceMultiplier(Number(rep.distance_from_route) || 0);
    const timeMult = getTimeMultiplier(rep.time_cycle, currentTimeCycle);
    const ageMult = getReportAgeMultiplier(rep.created_at);

    const impact = categoryWeight * ratingMult * distMult * timeMult * ageMult;
    totalNegativeImpact += impact;

    negativeFactorDetails.push({
      category: rep.category || rep.report_type || "Security Incident",
      impact: Math.round(impact * 10) / 10,
      distance: Number(rep.distance_from_route) || 0
    });
  });

  // 4. Historical Adjustment calculation (+5 for safe historical, 0 for neutral, -5 for unsafe)
  let historicalAdjustment = 0;
  if (Array.isArray(historicalReports) && historicalReports.length > 0) {
    const sumHistScores = historicalReports.reduce((sum, item) => {
      return sum + (Number(item.safety_score ?? item.safetyScore ?? 70) || 70);
    }, 0);
    const avgHistScore = sumHistScores / historicalReports.length;

    if (avgHistScore >= 80) {
      historicalAdjustment = 5;
    } else if (avgHistScore >= 60) {
      historicalAdjustment = 0;
    } else {
      historicalAdjustment = -5;
    }
  }

  // 5. Final Score Formula & Rounding:
  // Final Score = 100 + Positive Impact - Negative Impact + Historical Adjustment
  const roundedPosImpact = Math.round(totalPositiveImpact * 10) / 10;
  const roundedNegImpact = Math.round(totalNegativeImpact * 10) / 10;
  const unclampedFinalScore = baseScore + roundedPosImpact - roundedNegImpact + historicalAdjustment;

  // Round to nearest integer (e.g. 79.6 -> 80, 80.2 -> 80) and clamp [0, 100]
  const finalScore = Math.max(0, Math.min(100, Math.round(unclampedFinalScore)));

  // 6. Safety Level categorization
  const levelInfo = getSafetyLevel(finalScore);

  // 7. Top Positive and Negative Factors (deduplicated by category)
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

  const topPositiveFactors = Array.from(topPositiveFactorsMap.values())
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)
    .map((f) => `✓ ${f.category}`);

  const topNegativeFactors = Array.from(topNegativeFactorsMap.values())
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)
    .map((f) => `⚠ ${f.category}`);

  return {
    finalScore,
    safetyLevel: levelInfo.level,
    safetyBadge: levelInfo.badge,
    color: levelInfo.color,
    baseScore: 100,
    positiveImpact: roundedPosImpact,
    negativeImpact: roundedNegImpact,
    historicalAdjustment,
    topPositiveFactors,
    topNegativeFactors,
    summary: {
      baseScore: 100,
      positiveImpactFormatted: `+${roundedPosImpact.toFixed(1)}`,
      negativeImpactFormatted: `-${roundedNegImpact.toFixed(1)}`,
      historicalAdjustmentFormatted: historicalAdjustment >= 0 ? `+${historicalAdjustment}` : `${historicalAdjustment}`,
      currentTimeCycle,
      finalScoreFormatted: `${finalScore} / 100`
    }
  };
}
