import { supabase } from "../src/lib/supabase";

const SAFETY_TABLE = '"Safety Analysis"';
const COMMUNITY_REPORTS_TABLE = "community_reports";

function normalizeSafetyRecord(record) {
  if (!record) return null;

  return {
    ...record,
    latitude: Number(record.latitude),
    longitude: Number(record.longitude),
    safety_score: Number(record.safety_score ?? record.safetyScore ?? 0),
    crime_count: Number(record.crime_count ?? record.crimeCount ?? 0),
    lighting_score: Number(record.lighting_score ?? record.lightingScore ?? 0),
    police_station_distance_km: Number(record.police_station_distance_km ?? record.policeStationDistanceKm ?? 0),
    crowd_density: Number(record.crowd_density ?? record.crowdDensity ?? 0),
  };
}

function normalizeCommunityReport(record) {
  if (!record) return null;

  return {
    ...record,
    latitude: Number(record.latitude),
    longitude: Number(record.longitude),
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

export async function getSafetyData() {
  const { data, error } = await supabase
    .from(SAFETY_TABLE)
    .select("*")
    .order("safety_score", { ascending: false });

  if (error) {
    console.error("Supabase safety data error:", error);
    return [];
  }

  return (data ?? []).map(normalizeSafetyRecord).filter(Boolean);
}

export async function getSafetyDataByCity(city) {
  const { data, error } = await supabase
    .from(SAFETY_TABLE)
    .select("*")
    .eq("city", city)
    .order("safety_score", { ascending: false });

  if (error) {
    console.error("Supabase city safety error:", error);
    return [];
  }

  return (data ?? []).map(normalizeSafetyRecord).filter(Boolean);
}

export async function getNearbyLocations(latitude, longitude, radius = 5) {
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
}

export async function getCommunityReports() {
  const { data, error } = await supabase
    .from(COMMUNITY_REPORTS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase community reports error:", error);
    return [];
  }

  return (data ?? []).map(normalizeCommunityReport).filter(Boolean);
}

export async function addCommunityReport(report) {
  const payload = {
    latitude: Number(report.latitude),
    longitude: Number(report.longitude),
    issue_type: report.issue_type,
    description: report.description,
    image_url: report.image_url ?? null,
    reported_by: report.reported_by ?? "Guest",
    created_at: report.created_at ?? new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(COMMUNITY_REPORTS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Supabase report insert error:", error);
    throw error;
  }

  return normalizeCommunityReport(data);
}

export async function updateSafetyScore(updates = {}, filters = {}) {
  let query = supabase.from(SAFETY_TABLE).update(updates);

  if (filters.city) {
    query = query.eq("city", filters.city);
  }

  if (filters.area) {
    query = query.eq("area", filters.area);
  }

  const { data, error } = await query.select();

  if (error) {
    console.error("Supabase safety score update error:", error);
    return [];
  }

  return (data ?? []).map(normalizeSafetyRecord).filter(Boolean);
}