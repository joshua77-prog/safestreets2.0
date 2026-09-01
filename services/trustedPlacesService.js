import { supabase } from "../src/lib/supabase";

export const TRUSTED_PLACE_PROXIMITY_THRESHOLD_METERS = 500;

function readUserStore(userId) {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = localStorage.getItem(`trusted_places_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeUserStore(userId, places) {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(`trusted_places_${userId}`, JSON.stringify(places));
  } catch (err) {
    console.warn("Failed to write local trusted places cache:", err);
  }
}

async function getAuthUserId() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return user.id;
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user?.id) return sessionData.session.user.id;
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch all Trusted Places for the authenticated user from Supabase with RLS.
 */
export async function getTrustedPlaces() {
  const userId = await getAuthUserId();
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from("trusted_places")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      writeUserStore(userId, data);
      return data;
    }

    if (error) {
      console.warn("Supabase trusted_places fetch notice (using user cache fallback):", error.message);
    }
  } catch (err) {
    console.warn("Exception fetching trusted_places from Supabase:", err);
  }

  return readUserStore(userId);
}

/**
 * Add a new Trusted Place to Supabase for the authenticated user.
 */
export async function addTrustedPlace(placeData) {
  const userId = await getAuthUserId();
  if (!userId) {
    throw new Error("User authentication required to save a trusted place.");
  }

  const payload = {
    user_id: userId,
    place_name: placeData.place_name.trim(),
    category: placeData.category || "Other",
    formatted_address: placeData.formatted_address.trim(),
    latitude: Number(placeData.latitude),
    longitude: Number(placeData.longitude),
    updated_at: new Date().toISOString()
  };

  let createdPlace = null;

  try {
    const { data, error } = await supabase
      .from("trusted_places")
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      createdPlace = data;
    } else if (error) {
      console.warn("Supabase insert trusted_places error (falling back to local cache):", error.message);
    }
  } catch (err) {
    console.warn("Exception inserting trusted_places in Supabase:", err);
  }

  if (!createdPlace) {
    createdPlace = {
      id: `tp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...payload,
      created_at: new Date().toISOString()
    };
  }

  const currentLocal = readUserStore(userId);
  const updatedLocal = [createdPlace, ...currentLocal];
  writeUserStore(userId, updatedLocal);

  return createdPlace;
}

/**
 * Update an existing Trusted Place for the authenticated user.
 */
export async function updateTrustedPlace(id, updates) {
  const userId = await getAuthUserId();
  if (!userId || !id) {
    throw new Error("Authentication and valid place ID required to update.");
  }

  const payload = {
    place_name: updates.place_name?.trim(),
    category: updates.category,
    formatted_address: updates.formatted_address?.trim(),
    latitude: Number(updates.latitude),
    longitude: Number(updates.longitude),
    updated_at: new Date().toISOString()
  };

  let updatedPlace = null;

  try {
    const { data, error } = await supabase
      .from("trusted_places")
      .update(payload)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (!error && data) {
      updatedPlace = data;
    } else if (error) {
      console.warn("Supabase update trusted_places notice:", error.message);
    }
  } catch (err) {
    console.warn("Exception updating trusted_places:", err);
  }

  const currentLocal = readUserStore(userId);
  const idx = currentLocal.findIndex((p) => p.id === id);
  if (idx >= 0) {
    currentLocal[idx] = { ...currentLocal[idx], ...payload };
    writeUserStore(userId, currentLocal);
    if (!updatedPlace) updatedPlace = currentLocal[idx];
  }

  return updatedPlace;
}

/**
 * Delete a Trusted Place for the authenticated user.
 */
export async function deleteTrustedPlace(id) {
  const userId = await getAuthUserId();
  if (!userId || !id) return false;

  try {
    const { error } = await supabase
      .from("trusted_places")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.warn("Supabase delete trusted_places notice:", error.message);
    }
  } catch (err) {
    console.warn("Exception deleting trusted_places:", err);
  }

  const currentLocal = readUserStore(userId);
  const updatedLocal = currentLocal.filter((p) => p.id !== id);
  writeUserStore(userId, updatedLocal);

  return true;
}

/**
 * Calculate distance between two lat/lon points using Haversine Formula (in meters).
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Determine if current coordinates are near any of the user's Trusted Places.
 */
export function findNearbyTrustedPlace(currentLat, currentLon, trustedPlaces = [], thresholdMeters = TRUSTED_PLACE_PROXIMITY_THRESHOLD_METERS) {
  if (!currentLat || !currentLon || !Array.isArray(trustedPlaces) || trustedPlaces.length === 0) {
    return { isNear: false, nearestPlace: null, distanceMeters: null };
  }

  let nearestPlace = null;
  let minDistanceMeters = Infinity;

  for (const place of trustedPlaces) {
    const pLat = Number(place.latitude);
    const pLon = Number(place.longitude);
    if (!Number.isFinite(pLat) || !Number.isFinite(pLon)) continue;

    const dist = calculateDistanceMeters(currentLat, currentLon, pLat, pLon);
    if (dist < minDistanceMeters) {
      minDistanceMeters = dist;
      nearestPlace = place;
    }
  }

  if (nearestPlace && minDistanceMeters <= thresholdMeters) {
    return {
      isNear: true,
      nearestPlace,
      distanceMeters: Math.round(minDistanceMeters),
      formattedDistance: minDistanceMeters < 1000 ? `${Math.round(minDistanceMeters)}m` : `${(minDistanceMeters / 1000).toFixed(1)}km`
    };
  }

  return {
    isNear: false,
    nearestPlace,
    distanceMeters: minDistanceMeters === Infinity ? null : Math.round(minDistanceMeters),
    formattedDistance: minDistanceMeters === Infinity ? null : (minDistanceMeters < 1000 ? `${Math.round(minDistanceMeters)}m` : `${(minDistanceMeters / 1000).toFixed(1)}km`)
  };
}
