import React from "react";
import { Badge } from "@/components/ui/badge.js";
import { 
  Clock, 
  MapPin, 
  Zap, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  ArrowRight,
  Activity,
  Award,
  ThumbsUp,
  Database,
  Info,
  Layers
} from "lucide-react";
import { motion } from "framer-motion";

export default function RouteComparison({ routes, selectedRoute, onRouteSelect }) {
  if (!routes) return null;

  const { fastest, safest, recommendation, isIdentical } = routes;

  const scoreIncrease = recommendation?.scoreIncrease ?? Math.max(0, (safest?.safetyScore ?? 0) - (fastest?.safetyScore ?? 0));
  const timeAddedMinutes = recommendation?.timeAddedMinutes ?? Math.max(0, Math.round(((safest?.durationSeconds ?? 0) - (fastest?.durationSeconds ?? 0)) / 60));

  const RouteCard = ({ type, route, isSelected }) => {
    if (!route) return null;
    const isSafest = type === 'safest';

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <div 
          onClick={() => onRouteSelect(type)}
          className={`premium-card glass p-6 h-full cursor-pointer transition-all duration-300 relative flex flex-col ${
            isSelected 
              ? isSafest 
                ? 'border-emerald-500/80 bg-emerald-50/50 shadow-emerald-500/20 ring-2 ring-emerald-500/40'
                : 'border-blue-500/80 bg-blue-50/50 shadow-blue-500/20 ring-2 ring-blue-500/40'
              : 'border-white/60 hover:border-slate-300 hover:shadow-lg'
          }`}
        >
          {isSelected && (
            <motion.div 
              layoutId="route-selector"
              className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg z-20 ${
                isSafest ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-blue-600 shadow-blue-600/30'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
            </motion.div>
          )}

          {/* Card Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                isSafest ? 'bg-emerald-500' : 'bg-blue-600'
              }`}>
                {isSafest ? <Shield className="w-6 h-6 text-white" /> : <Zap className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h3 className={`text-lg font-black tracking-tight ${isSafest ? 'text-emerald-800' : 'text-blue-900'}`}>
                  {isSafest ? 'Safe Route' : 'Fast Route'}
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {isSafest ? 'Highest Safety Score' : 'Minimum Travel Duration'}
                </p>
              </div>
            </div>
            
            <div className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border shadow-sm ${
              route.safetyScore >= 80 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                : route.safetyScore >= 60
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-rose-100 text-rose-800 border-rose-300'
            }`}>
              {route.safetyScore} / 100 Safety
            </div>
          </div>

          {/* Primary Route Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 mb-5 p-3 rounded-2xl bg-white/80 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Est. Duration</div>
                <div className="text-sm font-black text-slate-900">{route.duration}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Distance</div>
                <div className="text-sm font-black text-slate-900">{route.distance}</div>
              </div>
            </div>
          </div>

          {/* Route Risk & Report Metrics */}
          <div className="space-y-3 flex-grow">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[9px] font-bold uppercase text-slate-400 block">Historical Risk</span>
                <span className="font-black text-slate-800">{route.historicalRisk ?? 0} / 100</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[9px] font-bold uppercase text-slate-400 block">Community Risk</span>
                <span className="font-black text-slate-800">{route.communityRisk ?? 0} / 100</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <div>
                  <span className="text-[9px] font-bold uppercase text-indigo-600 block">Historical Reports</span>
                  <span className="font-black">{route.historicalReportCount ?? 0} Nearby</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 flex items-center gap-2">
                <ThumbsUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <div>
                  <span className="text-[9px] font-bold uppercase text-blue-600 block">Community Reports</span>
                  <span className="font-black">{route.communityReportCount ?? 0} Nearby</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              {route.warnings && route.warnings.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-700 text-[10px] font-black uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Corridor Alerts
                  </div>
                  {route.warnings.slice(0, 2).map((w, idx) => (
                    <div key={idx} className="text-xs font-medium text-slate-700 bg-slate-100/70 px-3 py-1.5 rounded-xl">
                      {w}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Optimal Safety Corridor
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
             <div className="text-xs font-bold text-slate-500">
               Safety Level: <span className="text-slate-900 font-black">{route.safetyLevel || route.riskLevel}</span>
             </div>
             <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${isSelected ? (isSafest ? 'translate-x-1 text-emerald-600' : 'translate-x-1 text-blue-600') : 'text-slate-300'}`} />
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Map View Selector Mode Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Evaluated Routes</h2>
        
        {/* Requirement 4: Map View Mode Selectors (Fastest, Safest, Compare) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl glass border border-slate-200/80 bg-white/70 shadow-sm">
          <button
            type="button"
            onClick={() => onRouteSelect("fastest")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedRoute === "fastest"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Fast Route
          </button>

          <button
            type="button"
            onClick={() => onRouteSelect("safest")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedRoute === "safest"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Safe Route
          </button>

          {!isIdentical && (
            <button
              type="button"
              onClick={() => onRouteSelect("compare")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedRoute === "compare"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Compare Both
            </button>
          )}
        </div>
      </div>

      {/* Recommendation Banner & Requirement 3 / 5 text display */}
      <div className="premium-card glass p-5 rounded-3xl border-emerald-200 bg-emerald-50/50 shadow-md space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 block">Recommended Route</span>
              <h4 className="text-base font-black text-emerald-950">Safe Route (Highest Safety Score)</h4>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
            Reason: Highest Safety Score
          </span>
        </div>

        {/* Requirement 7: Explicit notice when no completely safe alternative exists */}
        {routes.noSafeAlternativeNotice || recommendation?.noSafeAlternativeNotice ? (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400 text-xs font-bold text-amber-900 flex items-center gap-2.5 shadow-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{routes.noSafeAlternativeNotice || recommendation?.noSafeAlternativeNotice}</span>
          </div>
        ) : isIdentical ? (
          <div className="p-3.5 rounded-2xl bg-white/90 border border-emerald-300 text-xs font-bold text-emerald-900 flex items-center gap-2.5 shadow-sm">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>This route is both the fastest and the safest.</span>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-white/90 border border-emerald-200 text-xs font-semibold text-slate-800 flex items-center gap-2.5 shadow-sm">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Compared with the Fast Route, choosing the Safe Route increases the Safety Score by <strong className="text-emerald-700 font-black">{scoreIncrease} points</strong> while adding only <strong className="text-slate-900 font-black">{timeAddedMinutes} minutes</strong> to the journey.
            </span>
          </div>
        )}

        {(routes.avoidedDangerZones?.length > 0 || recommendation?.avoidedDangerZones?.length > 0) && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 space-y-1.5 shadow-sm">
            <div className="font-black uppercase tracking-wider text-[10px] text-amber-800 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              Danger Zone Avoidance Active
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="font-bold text-slate-700">Avoided:</span>
              {(routes.avoidedDangerZones || recommendation?.avoidedDangerZones || []).map((zone, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-amber-200 text-amber-900 font-bold text-[11px] shadow-2xs">
                  ✓ {zone.category || zone.description}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Route Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RouteCard 
          type="fastest" 
          route={fastest} 
          isSelected={selectedRoute === 'fastest' || selectedRoute === 'compare'} 
        />
        <RouteCard 
          type="safest" 
          route={safest} 
          isSelected={selectedRoute === 'safest' || selectedRoute === 'compare'} 
        />
      </div>
    </div>
  );
}
