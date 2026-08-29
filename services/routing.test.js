import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRouteSummary, toLeafletPath, evaluateCandidateRoute } from './routing.js';

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

test('formats route metadata from an OSRM response', async () => {
  const summary = await buildRouteSummary({
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

test('scores candidate route using nearby safety context and community reports', async () => {
  const candidate = await evaluateCandidateRoute(
    {
      distance: 2100,
      duration: 420,
      geometry: {
        type: 'LineString',
        coordinates: [[77.5946, 12.9716], [77.602, 12.975]],
      },
    },
    0,
    {
      safetyData: [
        {
          id: 's1',
          latitude: 12.9716,
          longitude: 77.5946,
          crime_count: 2,
          lighting_score: 9,
          police_station_distance_km: 0.5,
          crowd_density: 'High',
        },
      ],
      communityReports: [
        {
          id: 'c1',
          report_type: 'Positive Observation',
          category: 'Police Presence',
          latitude: 12.972,
          longitude: 77.595,
          safety_rating: 5,
        },
      ],
    }
  );

  assert.equal(candidate.distance, '2.1 km');
  assert.equal(candidate.duration, '7 mins');
  assert.equal(typeof candidate.safetyScore, 'number');
  assert.equal(candidate.historicalReportCount, 1);
  assert.equal(candidate.communityReportCount, 1);
  assert.equal(candidate.routeId, 'route-1');
});
