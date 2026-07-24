import React, { useEffect } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";

// Fix default marker assets for Leaflet in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapCamera({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 0.75 });
    }
  }, [center, zoom, map]);
  return null;
}

function MapBounds({ from, to }) {
  const map = useMap();
  useEffect(() => {
    if (from && to) {
      const bounds = L.latLngBounds([from, to]);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [from, to, map]);
  return null;
}

function getSafetyColor(score) {
  if (score >= 8) return "#16a34a";
  if (score >= 5) return "#eab308";
  return "#dc2626";
}

export default function MapView({ center = [12.9716, 77.5946], zoom = 13, from, to, children, safetyData = [], communityReports = [] }) {
  const markers = Array.isArray(safetyData) ? safetyData : [];
  const reports = Array.isArray(communityReports) ? communityReports : [];

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapCamera center={center} zoom={zoom} />
      <MapBounds from={from} to={to} />
      {from && (
        <Marker position={from}>
          <Popup>Start Location</Popup>
        </Marker>
      )}
      {to && (
        <Marker position={to}>
          <Popup>Destination</Popup>
        </Marker>
      )}
      {markers.map((record, index) => {
        const latitude = Number(record.latitude);
        const longitude = Number(record.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

        return (
          <CircleMarker
            key={`safety-${index}`}
            center={[latitude, longitude]}
            radius={8}
            pathOptions={{
              color: getSafetyColor(Number(record.safety_score ?? 0)),
              fillColor: getSafetyColor(Number(record.safety_score ?? 0)),
              fillOpacity: 0.8,
            }}
          >
            <Popup>
              <div className="text-sm space-y-1">
                <div className="font-semibold">{record.area}</div>
                <div>Crime Type: {record.crime_type}</div>
                <div>Safety Score: {record.safety_score}</div>
                <div>Risk Level: {record.risk_level}</div>
                <div>Lighting Score: {record.lighting_score}</div>
                <div>Police Distance: {record.police_station_distance_km} km</div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
      {reports.map((report, index) => {
        const latitude = Number(report.latitude);
        const longitude = Number(report.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

        return (
          <CircleMarker
            key={`report-${index}`}
            center={[latitude, longitude]}
            radius={6}
            pathOptions={{
              color: "#2563eb",
              fillColor: "#60a5fa",
              fillOpacity: 0.85,
            }}
          >
            <Popup>
              <div className="text-sm space-y-1">
                <div className="font-semibold">{report.issue_type}</div>
                <div>{report.description}</div>
                <div className="text-xs text-slate-500">Reported by {report.reported_by}</div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
      {children}
    </MapContainer>
  );
}
