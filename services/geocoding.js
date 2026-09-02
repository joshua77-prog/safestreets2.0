import React, { useState, useEffect } from "react";

export async function searchAddress(query) {
  if (!query || query.trim().length < 2) return [];

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'SafeStreets Demo'
    }
  });

  if (!res.ok) {
    console.error('Nominatim error', res.statusText);
    return [];
  }

  return res.json();
}

export async function geocodeAddress(query) {
  if (!query || query.trim().length < 2) return null;
  try {
    const results = await searchAddress(query.trim());
    if (!results || !Array.isArray(results) || results.length === 0) return null;
    const top = results[0];
    return {
      address: top.display_name,
      latitude: parseFloat(top.lat),
      longitude: parseFloat(top.lon)
    };
  } catch (err) {
    console.error("Geocoding failed for query:", query, err);
    return null;
  }
}

const reverseCache = new Map();

export async function reverseGeocodeAddress(latitude, longitude) {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return null;
  }
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (isNaN(lat) || isNaN(lon)) return null;

  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  if (reverseCache.has(cacheKey)) {
    return reverseCache.get(cacheKey);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SafeStreets-App/1.0 (contact@safestreets.app)'
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && data.address) {
      const a = data.address;
      const road = a.road || a.pedestrian || a.suburb || a.neighbourhood || "";
      const locality = a.village || a.suburb || a.neighbourhood || a.town || a.city_district || "";
      const city = a.city || a.town || a.county || a.state_district || "";
      const state = a.state || "";

      const parts = [];
      [road, locality, city, state].forEach(p => {
        if (p && !parts.includes(p)) parts.push(p);
      });

      const formatted = parts.length > 0 ? parts.join(", ") : (data.display_name || null);

      if (formatted) {
        reverseCache.set(cacheKey, formatted);
        return formatted;
      }
    }
  } catch (err) {
    console.warn("Reverse geocoding failed for coordinates:", lat, lon, err);
  }

  return null;
}

export function useResolvedLocation(item) {
  const rawLoc = item?.location || item?.address || "";
  const lat = item?.latitude ?? item?.lat;
  const lon = item?.longitude ?? item?.lon;

  const isRawCoords =
    !rawLoc ||
    rawLoc.toLowerCase().includes("current gps") ||
    rawLoc.toLowerCase().includes("gps:") ||
    rawLoc.toLowerCase().startsWith("lat:") ||
    /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(rawLoc);

  const [locationText, setLocationText] = useState(() => {
    if (isRawCoords) return "Resolving location...";
    return rawLoc || "Location Recorded";
  });
  const [isLoading, setIsLoading] = useState(isRawCoords);

  useEffect(() => {
    let isMounted = true;

    if (!isRawCoords && rawLoc) {
      setLocationText(rawLoc);
      setIsLoading(false);
      return;
    }

    if (lat !== null && lat !== undefined && lon !== null && lon !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lon))) {
      setIsLoading(true);
      setLocationText("Resolving location...");

      reverseGeocodeAddress(Number(lat), Number(lon))
        .then((resolvedAddr) => {
          if (isMounted) {
            if (resolvedAddr) {
              setLocationText(resolvedAddr);
            } else {
              setLocationText("Location unavailable");
            }
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setLocationText("Location unavailable");
            setIsLoading(false);
          }
        });
    } else {
      setLocationText(rawLoc && !isRawCoords ? rawLoc : "Location unavailable");
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [rawLoc, lat, lon, isRawCoords]);

  return { locationText, isLoading, isRawCoords };
}

export function ReportLocationDisplay({ item, className = "", fallbackText = "Location Recorded" }) {
  const { locationText, isLoading } = useResolvedLocation(item);
  return React.createElement(
    "span",
    { className },
    isLoading ? "Resolving location..." : (locationText || fallbackText)
  );
}

