import React from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toLeafletPath } from '../../services/routing.js';

// Fix for default markers in react-leaflet
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const startIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MapIntegration({ routes = {}, selectedRoute = "safest", onRouteSelect }) {
  const getCoordinates = (route) => {
    if (!route) return [];
    if (Array.isArray(route.path) && route.path.length > 0) {
      return route.path;
    }
    if (route.geometry) {
      return toLeafletPath(route.geometry);
    }
    if (route.rawRoute?.geometry) {
      return toLeafletPath(route.rawRoute.geometry);
    }
    return [];
  };

  const safestCoords = getCoordinates(routes?.safest);
  const fastestCoords = getCoordinates(routes?.fastest);

  const center = safestCoords?.[0] || fastestCoords?.[0] || [12.9716, 77.5946];
  const zoom = 13;

  const showFastest = selectedRoute === "fastest" || selectedRoute === "compare";
  const showSafest = selectedRoute === "safest" || selectedRoute === "compare";

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border border-slate-200">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {showFastest && fastestCoords.length > 0 && (
          <>
            <Polyline
              positions={fastestCoords}
              pathOptions={{
                color: '#3B82F6', // Blue
                weight: selectedRoute === 'fastest' ? 6 : 4,
                opacity: 0.9,
              }}
              eventHandlers={{
                click: () => onRouteSelect?.('fastest')
              }}
            />
            <Marker position={fastestCoords[0]} icon={startIcon}>
              <Popup>Fast Route Start</Popup>
            </Marker>
            <Marker position={fastestCoords[fastestCoords.length - 1]} icon={endIcon}>
              <Popup>Fast Route End</Popup>
            </Marker>
          </>
        )}

        {showSafest && safestCoords.length > 0 && (
          <>
            <Polyline
              positions={safestCoords}
              pathOptions={{
                color: '#10B981', // Green
                weight: selectedRoute === 'safest' ? 6 : 4,
                opacity: 0.9,
              }}
              eventHandlers={{
                click: () => onRouteSelect?.('safest')
              }}
            />
            <Marker position={safestCoords[0]} icon={startIcon}>
              <Popup>Safe Route Start</Popup>
            </Marker>
            <Marker position={safestCoords[safestCoords.length - 1]} icon={endIcon}>
              <Popup>Safe Route End</Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {/* Route Legend */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10">
        <h4 className="text-sm font-semibold text-slate-900 mb-2 font-black">Routes</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-blue-500 rounded"></div>
            <span className="text-slate-700 font-bold">Fastest Route (Blue)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-emerald-500 rounded"></div>
            <span className="text-slate-700 font-bold">Safest Route (Green)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
