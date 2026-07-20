import React from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

export default function MapIntegration({ routes, selectedRoute, onRouteSelect }) {
  // Default center (can be made dynamic based on routes)
  const center = [40.7128, -74.0060]; // New York City as default
  const zoom = 13;

  // Colors for different routes
  const routeColors = {
    fastest: '#f97316', // orange
    safest: '#10b981'   // emerald
  };

  // Function to parse route path into coordinates (assuming format like "Start -> Point A -> Point B -> End")
  const parseRouteCoordinates = (path) => {
    // This is a simplified parser - in real implementation, you'd have actual coordinates
    // For demo purposes, we'll create mock coordinates
    const points = path.split(' -> ');
    const coordinates = points.map((point, index) => {
      // Mock coordinates - replace with real geocoding
      return [
        center[0] + (Math.random() - 0.5) * 0.1 + index * 0.01,
        center[1] + (Math.random() - 0.5) * 0.1 + index * 0.01
      ];
    });
    return coordinates;
  };

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

        {/* Render routes */}
        {Object.entries(routes).map(([routeType, route]) => {
          const coordinates = parseRouteCoordinates(route.path);
          const isSelected = selectedRoute === routeType;

          return (
            <React.Fragment key={routeType}>
              <Polyline
                positions={coordinates}
                pathOptions={{
                  color: routeColors[routeType],
                  weight: isSelected ? 6 : 4,
                  opacity: isSelected ? 1 : 0.7,
                  dashArray: isSelected ? null : '5, 10'
                }}
                eventHandlers={{
                  click: () => onRouteSelect(routeType)
                }}
              />
              {/* Start marker */}
              <Marker position={coordinates[0]} icon={startIcon}>
                <Popup>
                  <div className="text-sm">
                    <strong>Start:</strong> {route.path.split(' -> ')[0]}
                  </div>
                </Popup>
              </Marker>
              {/* End marker */}
              <Marker position={coordinates[coordinates.length - 1]} icon={endIcon}>
                <Popup>
                  <div className="text-sm">
                    <strong>End:</strong> {route.path.split(' -> ').pop()}
                    <br />
                    <strong>Duration:</strong> {route.duration}
                    <br />
                    <strong>Distance:</strong> {route.distance}
                    <br />
                    <strong>Safety Score:</strong> {route.safetyScore}%
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Route Legend */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10">
        <h4 className="text-sm font-semibold text-slate-900 mb-2">Routes</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-orange-500 rounded"></div>
            <span className="text-slate-700">Fastest Route</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-emerald-500 rounded"></div>
            <span className="text-slate-700">Safest Route</span>
          </div>
        </div>
      </div>
    </div>
  );
}
