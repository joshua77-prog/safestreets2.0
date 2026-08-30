import { supabase } from "../src/lib/supabase.js";
import { getDatasetSafetyData, getDatasetSafetyDataByCity } from "./datasetLoader.js";

// Memory cache of tables confirmed missing in the database to prevent repeated 404 network requests
const missingTables = new Set();

const PRIMARY_SAFETY_TABLE = "safety_analysis";
const PRIMARY_COMMUNITY_REPORTS_TABLE = "community_reports";

function normalizeSafetyRecord(record) {
  if (!record) return null;

  return {
    ...record,
    latitude: Number(record.latitude),
    longitude: Number(record.longitude),
    crime_count: Number(record.crime_count ?? record.crimeCount ?? 0),
    lighting_score: Number(record.lighting_score ?? record.lightingScore ?? 0),
    police_station_distance_km: Number(record.police_station_distance_km ?? record.policeStationDistanceKm ?? 0),
    crowd_density: Number(record.crowd_density ?? record.crowdDensity ?? 0),
  };
}

function normalizeCommunityReport(record) {
  if (!record) return null;

  const lat = Number(record.latitude);
  const lon = Number(record.longitude);

  return {
    ...record,
    id: record.id,
    latitude: lat,
    longitude: lon,
    location: record.location || record.address || (Number.isFinite(lat) && Number.isFinite(lon) ? `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}` : "Unknown Location"),
    description: record.intelligence_briefing || record.description || "",
    intelligence_briefing: record.intelligence_briefing || record.description || "",
    report_type: record.report_type || record.issue_type || "Incident",
    category: record.category || record.report_type || record.issue_type || "Incident",
    safety_rating: Number(record.safety_rating ?? 3),
    time_cycle: record.time_cycle || "Day",
    created_date: record.created_at || record.created_date || new Date().toISOString()
  };
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(from, to) {
  if (!from || !to) return Number.POSITIVE_INFINITY;

  const earthRadiusKm = 6371;
  const latDelta = toRadians(to.latitude - from.latitude);
  const lonDelta = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(lonDelta / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

// Quiet query executor that avoids spamming network 404s if table is missing
async function safeQuery(tableName, queryFn) {
  // If table was already checked and returned 404, return early without making network request
  if (missingTables.has(tableName)) {
    return { data: [], error: null };
  }

  try {
    const query = supabase.from(tableName);
    const { data, error } = await queryFn(query);

    if (error) {
      const isNotFound = error.status === 404 || error.code === 'PGRST301' || error.code === '42P01' || (error.message && error.message.includes("Could not find the table"));
      if (isNotFound) {
        missingTables.add(tableName);
      }
      return { data: [], error };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    missingTables.add(tableName);
    return { data: [], error: err };
  }
}

export async function getSafetyData() {
  console.log("\n[SUPABASE]");
  console.log("Querying safety_analysis...");

  try {
    const pages = [0, 1000, 2000, 3000, 4000, 5000];
    const promises = pages.map((offset) =>
      supabase
        .from(PRIMARY_SAFETY_TABLE)
        .select("*")
        .range(offset, offset + 999)
        .order("crime_count", { ascending: false })
    );

    const results = await Promise.all(promises);
    let allRecords = [];

    results.forEach((res) => {
      if (res.data && Array.isArray(res.data)) {
        allRecords.push(...res.data);
      }
    });

    console.log(`Supabase returned: ${allRecords.length} records`);

    if (allRecords.length > 0) {
      const normalized = allRecords.map(normalizeSafetyRecord).filter(Boolean);
      console.log(`\n[SAFETY DATA]`);
      console.log(`Normalized safety reports: ${normalized.length}`);
      return normalized;
    }
  } catch (err) {
    console.error("[SUPABASE] Error querying safety_analysis:", err.message);
  }

  // Fallback to local 20,000 safety dataset ONLY if Supabase returns 0 records
  console.log("[SUPABASE] Falling back to local dataset parser...");
  return getDatasetSafetyData();
}

export async function getSafetyDataByCity(city) {
  if (!city) return getSafetyData();

  try {
    const { data, error } = await supabase
      .from(PRIMARY_SAFETY_TABLE)
      .select("*")
      .eq("city", city)
      .limit(5000)
      .order("crime_count", { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map(normalizeSafetyRecord).filter(Boolean);
    }
  } catch {}

  return getDatasetSafetyDataByCity(city);
}

export async function getNearbyLocations(latitude, longitude, radius = 5) {
  try {
    const records = await getSafetyData();
    const center = { latitude: Number(latitude), longitude: Number(longitude) };
    const radiusKm = Number(radius) || 5;

    return records.filter((record) => {
      const distance = haversineDistanceKm(center, {
        latitude: Number(record.latitude),
        longitude: Number(record.longitude),
      });

      return Number.isFinite(distance) && distance <= radiusKm;
    });
  } catch {
    return [];
  }
}

export async function getCommunityReports() {
  console.log("\n[SUPABASE]");
  console.log("Querying community_reports...");

  try {
    const { data, error } = await supabase
      .from(PRIMARY_COMMUNITY_REPORTS_TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (!error && data && data.length > 0) {
      console.log(`Supabase community_reports returned: ${data.length} records`);
      return data.map(normalizeCommunityReport).filter(Boolean);
    }
  } catch (err) {
    console.error("[SUPABASE] Error querying community_reports:", err.message);
  }

  return [];
}

export async function addCommunityReport(report) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const err = new Error(authError?.message || "User authentication required to submit a report.");
      console.error("Authentication error in addCommunityReport:", err);
      throw err;
    }

    const lat = Number(report.latitude);
    const lon = Number(report.longitude);
    const briefingText = report.intelligence_briefing || report.description || "";
    const reportTypeStr = report.report_type || "Incident";
    const categoryStr = report.category || report.report_type || "Incident";
    const userIdentifier = user.email || user.id || "Anonymous";

    // Tier 1: Full extended schema (user_id, report_type, category, time_cycle, safety_rating, intelligence_briefing)
    const payload1 = {
      user_id: user.id,
      report_type: reportTypeStr,
      category: categoryStr,
      latitude: lat,
      longitude: lon,
      location: report.location || `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`,
      time_cycle: report.time_cycle || "Day",
      safety_rating: Number(report.safety_rating || 3),
      intelligence_briefing: briefingText
    };

    const { data: d1, error: e1 } = await supabase
      .from(PRIMARY_COMMUNITY_REPORTS_TABLE)
      .insert(payload1)
      .select()
      .single();

    if (!e1 && d1) return normalizeCommunityReport(d1);

    console.warn("Supabase tier 1 insert notice:", e1?.message);

    // Tier 2: Try intelligence_briefing + reported_by + issue_type schema
    const payload2 = {
      latitude: lat,
      longitude: lon,
      issue_type: categoryStr,
      intelligence_briefing: briefingText,
      reported_by: userIdentifier
    };

    const { data: d2, error: e2 } = await supabase
      .from(PRIMARY_COMMUNITY_REPORTS_TABLE)
      .insert(payload2)
      .select()
      .single();

    if (!e2 && d2) return normalizeCommunityReport(d2);

    console.warn("Supabase tier 2 insert notice:", e2?.message);

    // Tier 3: Try description + reported_by + issue_type schema
    const payload3 = {
      latitude: lat,
      longitude: lon,
      issue_type: categoryStr,
      description: briefingText,
      reported_by: userIdentifier
    };

    const { data: d3, error: e3 } = await supabase
      .from(PRIMARY_COMMUNITY_REPORTS_TABLE)
      .insert(payload3)
      .select()
      .single();

    if (!e3 && d3) return normalizeCommunityReport(d3);

    console.warn("Supabase tier 3 insert notice:", e3?.message);

    // Tier 4: Minimalist schema (latitude, longitude, issue_type)
    const payload4 = {
      latitude: lat,
      longitude: lon,
      issue_type: categoryStr
    };

    const { data: d4, error: e4 } = await supabase
      .from(PRIMARY_COMMUNITY_REPORTS_TABLE)
      .insert(payload4)
      .select()
      .single();

    if (!e4 && d4) return normalizeCommunityReport(d4);

    console.error("All Supabase community_reports insert tiers failed:", e1 || e2 || e3 || e4);
    throw e1 || e2 || e3 || e4;
  } catch (err) {
    console.error("Failed to add community report:", err);
    throw err;
  }
}

export async function updateSafetyScore(updates = {}, filters = {}) {
  try {
    const { data } = await safeQuery(PRIMARY_SAFETY_TABLE, (builder) => {
      let query = builder.update(updates);
      if (filters.city) query = query.eq("city", filters.city);
      if (filters.area) query = query.eq("area", filters.area);
      return query.select();
    });

    return data.map(normalizeSafetyRecord).filter(Boolean);
  } catch {
    return [];
  }
}