import React, { useEffect } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
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

export default function MapView({ center = [12.9716, 77.5946], zoom = 13, from, to, children }) {
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
      {children}
    </MapContainer>
  );
}
