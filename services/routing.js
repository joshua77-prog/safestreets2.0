// TODO: Replace mocked routes with real OSRM or backend integration
export async function getFastestRoute(from, to) {
  // Shape: array of [lat, lng]
  return [
    [12.9716, 77.5946],
    [12.975, 77.602],
    [12.98, 77.61],
  ];
}

export async function getSafestRoute(from, to) {
  // Shape: array of [lat, lng]
  return [
    [12.9716, 77.5946],
    [12.968, 77.6],
    [12.965, 77.608],
    [12.972, 77.615],
  ];
}
