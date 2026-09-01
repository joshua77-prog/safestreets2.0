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

export async function reverseGeocode(lat, lon) {
  if (!lat || !lon) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SafeStreets Demo'
      }
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data?.display_name || null;
  } catch (err) {
    console.error("Reverse geocoding error:", err);
    return null;
  }
}
