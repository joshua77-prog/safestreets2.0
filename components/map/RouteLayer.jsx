import React from "react";
import { Polyline } from "react-leaflet";

export default function RouteLayer({ fastestRoute = [], safestRoute = [] }) {
  return (
    <>
      {fastestRoute?.length > 0 && (
        <Polyline positions={fastestRoute} pathOptions={{ color: "red", weight: 5 }} />
      )}
      {safestRoute?.length > 0 && (
        <Polyline positions={safestRoute} pathOptions={{ color: "green", weight: 5 }} />
      )}
    </>
  );
}
