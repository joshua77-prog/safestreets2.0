import React from "react";
import { CircleMarker, Polyline } from "react-leaflet";

function getSafetyColor(score) {
  if (score >= 8) return "#16a34a";
  if (score >= 5) return "#eab308";
  return "#dc2626";
}

export default function RouteLayer({ fastestRoute = [], safestRoute = [], safetyData = [] }) {
  const renderHotspots = (route, color) => {
    if (!Array.isArray(route) || route.length === 0) return null;

    return route.map((point, index) => {
      const nearestRecord = (safetyData ?? []).reduce((closest, record) => {
        const currentDistance = Math.abs(Number(record.latitude) - point[0]) + Math.abs(Number(record.longitude) - point[1]);
        const closestDistance = closest ? Math.abs(Number(closest.latitude) - point[0]) + Math.abs(Number(closest.longitude) - point[1]) : Number.POSITIVE_INFINITY;

        return currentDistance < closestDistance ? record : closest;
      }, null);

      const score = Number(nearestRecord?.safety_score ?? 0);

      return (
        <CircleMarker
          key={`${color}-${index}`}
          center={point}
          radius={3}
          pathOptions={{
            color: nearestRecord ? getSafetyColor(score) : color,
            fillColor: nearestRecord ? getSafetyColor(score) : color,
            fillOpacity: 0.85,
          }}
        />
      );
    });
  };

  return (
    <>
      {fastestRoute?.length > 0 && (
        <>
          <Polyline positions={fastestRoute} pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.9 }} />
          {renderHotspots(fastestRoute, "#2563eb")}
        </>
      )}
      {safestRoute?.length > 0 && (
        <>
          <Polyline positions={safestRoute} pathOptions={{ color: "#16a34a", weight: 4, opacity: 0.9 }} />
          {renderHotspots(safestRoute, "#16a34a")}
        </>
      )}
    </>
  );
}
