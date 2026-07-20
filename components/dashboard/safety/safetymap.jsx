import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card.jsx";
import { Badge } from "../../../components/ui/badge.jsx";
import { 
  MapPin, 
  Navigation,
  AlertTriangle,
  Shield,
  Star
} from "lucide-react";
import { motion } from "framer-motion";

const getMarkerColor = (safetyRating, reportType) => {
  // Incident types get red regardless of rating
  if (reportType === 'incident' || reportType === 'suspicious_activity') {
    return 'bg-red-500';
  }
  // Poor lighting gets yellow
  if (reportType === 'poor_lighting') {
    return 'bg-yellow-500';
  }
  // Safe zones and positive reports get green
  if (reportType === 'safe_zone' || reportType === 'police_presence' || reportType === 'well_lit' || reportType === 'busy_area') {
    return 'bg-green-500';
  }
  // Fallback to rating-based coloring
  if (safetyRating >= 4) return 'bg-green-500';
  if (safetyRating >= 3) return 'bg-yellow-500';
  return 'bg-red-500';
};

export default function SafetyMap({ reports }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Map Placeholder */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-500">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            Safety Map
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-b-lg overflow-hidden">
            {/* Map Background */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200" />
              {/* Grid lines to simulate map */}
              <div className="absolute inset-0">
                {Array(10).fill(0).map((_, i) => (
                  <div key={`v-${i}`} className="absolute top-0 bottom-0 border-l border-slate-300" style={{left: `${i * 10}%`}} />
                ))}
                {Array(8).fill(0).map((_, i) => (
                  <div key={`h-${i}`} className="absolute left-0 right-0 border-t border-slate-300" style={{top: `${i * 12.5}%`}} />
                ))}
              </div>
            </div>
            
            {/* Map Markers */}
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer group"
                style={{
                  left: `${20 + (index % 5) * 15 + Math.random() * 10}%`,
                  top: `${30 + Math.floor(index / 5) * 20 + Math.random() * 10}%`
                }}
              >
                <div className={`w-4 h-4 rounded-full ${getMarkerColor(report.safety_rating, report.report_type)} shadow-lg border-2 border-white`}>
                  <div className="absolute inset-0 rounded-full animate-ping bg-current opacity-25" />
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-white rounded-lg shadow-xl border p-3 whitespace-nowrap">
                    <div className="text-sm font-semibold text-slate-900 mb-1">
                      {report.location}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge className="text-xs">
                        {report.report_type.replace(/_/g, ' ')}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span>{report.safety_rating}/5</span>
                      </div>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Safety Legend</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-slate-700">Safe Zone (4-5★)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-slate-700">Caution (2-3★)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-slate-700">Unsafe (1★)</span>
                </div>
              </div>
            </div>
            
            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
                <span className="text-lg font-bold text-slate-700">+</span>
              </button>
              <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
                <span className="text-lg font-bold text-slate-700">-</span>
              </button>
            </div>
            
            {/* Center Message */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg">
                <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Interactive Safety Map</h3>
                <p className="text-sm text-slate-600 max-w-sm">
                  In the full version, this would be an interactive map showing real-time safety data
                  with clustering, route overlays, and detailed location information.
                </p>
                <div className="mt-4 text-xs text-slate-500">
                  {reports.length} safety reports plotted
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Map Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-slate-900">
              {reports.filter(r => r.safety_rating >= 4).length}
            </div>
            <div className="text-xs text-slate-500">Safe Zones</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-slate-900">
              {reports.filter(r => r.safety_rating === 3).length}
            </div>
            <div className="text-xs text-slate-500">Neutral Areas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-slate-900">
              {reports.filter(r => r.safety_rating <= 2).length}
            </div>
            <div className="text-xs text-slate-500">Risk Areas</div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}