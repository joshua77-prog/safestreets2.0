import { calculateDistanceMeters } from "./trustedPlacesService.js";

const cache = new Map();

function formatDistance(distanceMeters) {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m away`;
  }
  return `${(distanceMeters / 1000).toFixed(1)} km away`;
}

function getCacheKey(type, lat, lon) {
  return `${type}_${Number(lat).toFixed(3)}_${Number(lon).toFixed(3)}`;
}

/**
 * Dynamically search OpenStreetMap / Nominatim for nearest police station
 */
export async function findNearestPoliceStation(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const cacheKey = getCacheKey("police", lat, lon);
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    const viewbox = `${lon - 0.08},${lat + 0.08},${lon + 0.08},${lat - 0.08}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=police+station&lat=${lat}&lon=${lon}&bounded=1&viewbox=${viewbox}&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "SafeStreets Demo App/2.0"
      }
    });

    if (!res.ok) {
      console.warn("Nominatim police search non-OK status:", res.statusText);
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    let nearest = null;
    let minDistance = Infinity;

    for (const item of data) {
      const itemLat = Number(item.lat);
      const itemLon = Number(item.lon);
      if (!Number.isFinite(itemLat) || !Number.isFinite(itemLon)) continue;

      const distMeters = calculateDistanceMeters(lat, lon, itemLat, itemLon);
      if (distMeters < minDistance) {
        minDistance = distMeters;

        // Clean display name
        const rawName = item.display_name || "";
        const parts = rawName.split(",").map((p) => p.trim());
        const placeName = parts[0] || "Police Station";
        const shortAddress = parts.slice(1, 4).join(", ") || rawName;

        nearest = {
          name: placeName,
          address: shortAddress,
          full_address: rawName,
          latitude: itemLat,
          longitude: itemLon,
          distanceMeters: Math.round(distMeters),
          formattedDistance: formatDistance(distMeters),
          phone: item.address?.phone || item.extratags?.phone || null,
          mapUrl: `https://www.google.com/maps?q=${itemLat},${itemLon}`
        };
      }
    }

    if (nearest) {
      cache.set(cacheKey, nearest);
    }
    return nearest;
  } catch (error) {
    console.error("Failed to fetch nearby police station:", error);
    return null;
  }
}

/**
 * Dynamically search OpenStreetMap / Nominatim for nearest hospital
 */
export async function findNearestHospital(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const cacheKey = getCacheKey("hospital", lat, lon);
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    const viewbox = `${lon - 0.08},${lat + 0.08},${lon + 0.08},${lat - 0.08}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=hospital&lat=${lat}&lon=${lon}&bounded=1&viewbox=${viewbox}&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "SafeStreets Demo App/2.0"
      }
    });

    if (!res.ok) {
      console.warn("Nominatim hospital search non-OK status:", res.statusText);
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    let nearest = null;
    let minDistance = Infinity;

    for (const item of data) {
      const itemLat = Number(item.lat);
      const itemLon = Number(item.lon);
      if (!Number.isFinite(itemLat) || !Number.isFinite(itemLon)) continue;

      const distMeters = calculateDistanceMeters(lat, lon, itemLat, itemLon);
      if (distMeters < minDistance) {
        minDistance = distMeters;

        const rawName = item.display_name || "";
        const parts = rawName.split(",").map((p) => p.trim());
        const placeName = parts[0] || "Hospital";
        const shortAddress = parts.slice(1, 4).join(", ") || rawName;

        nearest = {
          name: placeName,
          address: shortAddress,
          full_address: rawName,
          latitude: itemLat,
          longitude: itemLon,
          distanceMeters: Math.round(distMeters),
          formattedDistance: formatDistance(distMeters),
          phone: item.address?.phone || item.extratags?.phone || null,
          mapUrl: `https://www.google.com/maps?q=${itemLat},${itemLon}`
        };
      }
    }

    if (nearest) {
      cache.set(cacheKey, nearest);
    }
    return nearest;
  } catch (error) {
    console.error("Failed to fetch nearby hospital:", error);
    return null;
  }
}
