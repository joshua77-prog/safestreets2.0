import React from "react";
import { Polyline } from "react-leaflet";

export default function RouteLayer({ fastestRoute = [], safestRoute = [], selectedRoute = "safest" }) {
  const showFastest = selectedRoute === "fastest";
  const showSafest = selectedRoute === "safest";

  return (
    <>
      {showFastest && fastestRoute?.length > 0 && (
        <Polyline
          positions={fastestRoute}
          pathOptions={{
            color: "#3B82F6",
            weight: 6,
            opacity: 0.9,
            dashArray: null,
          }}
        />
      )}
      {showSafest && safestRoute?.length > 0 && (
        <Polyline
          positions={safestRoute}
          pathOptions={{
            color: "#10B981",
            weight: 6,
            opacity: 0.9,
            dashArray: null,
          }}
        />
      )}
    </>
  );
}
