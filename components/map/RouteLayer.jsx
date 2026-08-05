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
      {/* Requirement 5: Semi-transparent Red Circles around Dynamic Danger Zones */}
      {Array.isArray(dangerZones) && dangerZones.map((zone) => (
        <Circle
          key={zone.id}
          center={[zone.latitude, zone.longitude]}
          radius={zone.radius}
          pathOptions={{
            color: "#ef4444",
            fillColor: "#f87171",
            fillOpacity: 0.25,
            weight: 1.5,
            dashArray: "4, 6"
          }}
        >
          <Popup>
            <div className="text-xs font-sans space-y-1">
              <div className="font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                ⚠ {zone.category}
              </div>
              <div className="text-slate-700">{zone.description}</div>
              <div className="text-[10px] text-slate-500 font-semibold">
                Danger Zone Radius: {zone.radius}m | Severity: {zone.severity}/100
              </div>
            </div>
          </Popup>
        </Circle>
      ))}

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
