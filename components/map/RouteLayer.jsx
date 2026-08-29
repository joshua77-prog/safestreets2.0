import React from "react";
import { Polyline, Circle, Popup } from "react-leaflet";

export default function RouteLayer({ 
  fastestRoute = [], 
  safestRoute = [], 
  selectedRoute = "safest",
  isIdentical = false,
  dangerZones = []
}) {
  const hasFastest = Array.isArray(fastestRoute) && fastestRoute.length > 0;
  const hasSafest = Array.isArray(safestRoute) && safestRoute.length > 0;

  const routesAreIdentical = isIdentical || (!hasFastest && hasSafest) || (hasFastest && !hasSafest);

  const showFastest = selectedRoute === "fastest" || selectedRoute === "compare";
  const showSafest = selectedRoute === "safest" || selectedRoute === "compare";

  return (
    <>


      {routesAreIdentical ? (
        (() => {
          const singlePath = hasSafest ? safestRoute : fastestRoute;
          if (!singlePath || singlePath.length === 0) return null;
          return (
            <Polyline
              positions={singlePath}
              pathOptions={{
                color: "#10B981", // Green route
                weight: 7,
                opacity: 0.95,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          );
        })()
      ) : (
        <>
          {/* Fast Route - Blue */}
          {showFastest && hasFastest && (
            <Polyline
              positions={fastestRoute}
              pathOptions={{
                color: "#3B82F6", // Blue route
                weight: selectedRoute === "fastest" ? 8 : 6,
                opacity: 0.9,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          )}

          {/* Safe Route - Green */}
          {showSafest && hasSafest && (
            <Polyline
              positions={safestRoute}
              pathOptions={{
                color: "#10B981", // Green route
                weight: selectedRoute === "safest" ? 8 : 6,
                opacity: 0.9,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          )}
        </>
      )}
    </>
  );
}
