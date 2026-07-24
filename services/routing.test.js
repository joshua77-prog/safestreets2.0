import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRouteSummary, toLeafletPath } from './routing.js';

test('converts OSRM coordinates to Leaflet path format', () => {
  const path = toLeafletPath({
    type: 'LineString',
    coordinates: [
      [77.5946, 12.9716],
      [77.602, 12.975],
    ],
  });

  assert.deepEqual(path, [
    [12.9716, 77.5946],
    [12.975, 77.602],
  ]);
});

test('formats route metadata from an OSRM response', () => {
  const summary = buildRouteSummary({
    routes: [
      {
        distance: 2100,
        duration: 420,
        geometry: {
          type: 'LineString',
          coordinates: [[77.5946, 12.9716], [77.602, 12.975]],
        },
      },
    ],
  });

  assert.equal(summary.distance, '2.1 km');
  assert.equal(summary.duration, '7 mins');
  assert.deepEqual(summary.path, [
    [12.9716, 77.5946],
    [12.975, 77.602],
  ]);
});

test('scores routes using nearby safety context', () => {
  const summary = buildRouteSummary(
    {
      routes: [
        {
          distance: 2100,
          duration: 420,
          geometry: {
            type: 'LineString',
            coordinates: [[77.5946, 12.9716], [77.602, 12.975]],
          },
        },
      ],
    },
    0,
    'safe',
    {
      safetyData: [
        {
          safety_score: 9,
          crime_count: 2,
          lighting_score: 8,
          police_station_distance_km: 1,
          crowd_density: 4,
        },
      ],
      communityReports: [{ latitude: 12.972, longitude: 77.598 }],
    }
  );

  assert.equal(summary.safetyScore, 87);
  assert.equal(summary.riskLevel, 'Low');
});
