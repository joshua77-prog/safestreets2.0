import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card.jsx";
import { Badge } from "../../../components/ui/badge.jsx";
import { 
  MapPin, 
  Navigation,
  AlertTriangle,
  Shield,
  Star,
  Layers
} from "lucide-react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker assets for Leaflet in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const getMarkerColorHex = (safetyRating, reportType) => {
  if (reportType === 'incident' || reportType === 'suspicious_activity') return '#ef4444'; // Red
  if (reportType === 'poor_lighting') return '#eab308'; // Yellow
  if (reportType === 'safe_zone' || reportType === 'police_presence' || reportType === 'well_lit' || reportType === 'busy_area') return '#22c55e'; // Green
  if (safetyRating >= 4) return '#22c55e';
  if (safetyRating >= 3) return '#eab308';
  return '#ef4444';
};

const createReportIcon = (colorHex) => L.divIcon({
  className: "custom-report-marker",
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
      <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background-color: ${colorHex}; opacity: 0.35; animation: liveDotPulse 1.8s infinite ease-in-out;"></div>
      <div style="position: relative; width: 16px; height: 16px; border-radius: 50%; background-color: ${colorHex}; border: 2.5px solid #ffffff; box-shadow: 0 3px 8px rgba(0,0,0,0.4);"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const getReportCoords = (report, index) => {
  const lat = Number(report.latitude);
  const lon = Number(report.longitude);
  if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
    return [lat, lon];
  }
  // Default coordinates centered around Bengaluru with slight scatter for seed reports missing GPS
  const baseLat = 12.9716;
  const baseLon = 77.5946;
  const latOffset = (((index * 37) % 100) - 50) * 0.003;
  const lonOffset = (((index * 53) % 100) - 50) * 0.003;
  return [baseLat + latOffset, baseLon + lonOffset];
};

export default function SafetyMap({ reports = [] }) {
  const reportList = Array.isArray(reports) ? reports : [];

  // Calculate default map center based on first report or default city center
  const defaultCenter = reportList.length > 0 && reportList[0].latitude && reportList[0].longitude
    ? [Number(reportList[0].latitude), Number(reportList[0].longitude)]
    : [12.9716, 77.5946];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Interactive Safety Map Card */}
      <Card className="shadow-lg border-0 overflow-hidden">
        <CardHeader className="py-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-500 shadow-md shadow-emerald-500/20">
                <Navigation className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900">Geospatial Safety Intelligence</span>
                <p className="text-xs text-slate-500 font-medium">Real-time OpenStreetMap rendering & incident telemetry</p>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 text-xs px-3 py-1">
              Live Map Connected
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="relative h-[480px] w-full overflow-hidden">
            {/* Real Leaflet Map */}
            <MapContainer 
              center={defaultCenter} 
              zoom={13} 
              style={{ height: "100%", width: "100%", zIndex: 1 }}
              scrollWheelZoom={true}
            >
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              {/* Render interactive markers for each report */}
              {reportList.map((report, index) => {
                const coords = getReportCoords(report, index);
                const colorHex = getMarkerColorHex(report.safety_rating, report.report_type);
                const icon = createReportIcon(colorHex);

                return (
                  <Marker key={report.id || `report-${index}`} position={coords} icon={icon}>
                    <Popup className="custom-report-popup">
                      <div className="p-1 min-w-[200px]">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {report.location || "Reported Location"}
                          </span>
                          <Badge className="text-[10px] uppercase font-bold px-2 py-0.5" style={{ backgroundColor: colorHex, color: "#ffffff" }}>
                            {(report.report_type || "Incident").replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        
                        {report.description && (
                          <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                            {report.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <div className="flex items-center gap-1 font-semibold text-slate-700">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>{report.safety_rating ?? "3"}/5 Safety Score</span>
                          </div>
                          {report.created_date && (
                            <span className="text-[10px] text-slate-400">
                              {new Date(report.created_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
            
            {/* Overlay Status Badge */}
            <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 text-white backdrop-blur-md rounded-xl px-4 py-2.5 shadow-xl text-xs font-semibold flex items-center gap-2.5 border border-slate-700">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>{reportList.length} Active Safety Reports Plotted</span>
            </div>

            {/* Safety Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-slate-200/80 min-w-[180px]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                Safety Legend
              </h4>
              <div className="space-y-2 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
                  <span className="text-slate-700">Safe Zone (4-5★)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></div>
                  <span className="text-slate-700">Caution (2-3★)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                  <span className="text-slate-700">Unsafe / Incident (1★)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Map Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-emerald-100 bg-emerald-50/40">
          <CardContent className="p-4 text-center">
            <Shield className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <div className="text-xl font-black text-slate-900">
              {reportList.filter(r => r.safety_rating >= 4 || r.report_type === 'safe_zone').length}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Safe Zones</div>
          </CardContent>
        </Card>
        <Card className="border-amber-100 bg-amber-50/40">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <div className="text-xl font-black text-slate-900">
              {reportList.filter(r => r.safety_rating === 3 || r.report_type === 'poor_lighting').length}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Neutral Areas</div>
          </CardContent>
        </Card>
        <Card className="border-red-100 bg-red-50/40">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <div className="text-xl font-black text-slate-900">
              {reportList.filter(r => r.safety_rating <= 2 || r.report_type === 'incident' || r.report_type === 'suspicious_activity').length}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Risk Areas</div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}