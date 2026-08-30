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

