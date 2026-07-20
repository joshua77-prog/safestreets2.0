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
