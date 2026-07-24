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
  TrendingUp,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";

export default function RouteComparison({ routes, selectedRoute, onRouteSelect }) {
  const RouteCard = ({ type, route, isSelected }) => {
    const isSafest = type === 'safest';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <div 
          onClick={() => onRouteSelect(type)}
          className={`premium-card glass p-6 h-full cursor-pointer transition-all duration-500 relative flex flex-col ${
            isSelected 
              ? 'border-emerald-500/50 bg-emerald-50/30 shadow-emerald-500/10' 
              : 'border-white/40 hover:border-slate-300'
          }`}
        >
          {isSelected && (
            <motion.div 
              layoutId="route-selector"
              className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 z-20"
            >
              <CheckCircle className="w-5 h-5" />
            </motion.div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                isSafest ? 'bg-emerald-500' : 'bg-slate-900'
              }`}>
                {isSafest ? <Shield className="w-6 h-6 text-white" /> : <Zap className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h3 className={`text-lg font-black tracking-tight ${isSafest ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {isSafest ? 'Safe Route' : 'Fast Route'}
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {isSafest ? 'Safest Path' : 'Fastest Path'}
                </p>
              </div>
            </div>
            
            <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
              route.safetyScore >= 90 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                : 'bg-rose-50 text-rose-600 border-rose-100'
            }`}>
              {route.safetyScore}% Safety Rating
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2">
               <Clock className="w-4 h-4 text-slate-400" />
               <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none">Duration</div>
                  <div className="text-sm font-black text-slate-900">{route.duration}</div>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <MapPin className="w-4 h-4 text-slate-400" />
               <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none">Distance</div>
                  <div className="text-sm font-black text-slate-900">{route.distance}</div>
               </div>
            </div>
          </div>

          <div className="space-y-3 flex-grow">
            <div className="h-[1px] bg-slate-100 w-full mb-4"></div>
            {route.warnings.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-rose-600 text-[10px] font-black uppercase tracking-widest">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Vulnerability Detected
                </div>
                {route.warnings.map((warning, index) => (
                  <div key={index} className="text-xs font-medium text-slate-600 bg-slate-100/50 px-3 py-1.5 rounded-xl">
                    {warning}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                <CheckCircle className="w-4 h-4" />
                Optimal Safety Conditions Verified
              </div>
            )}
          </div>
          
          <div className="mt-8 flex items-center justify-between">
             <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 overflow-hidden text-[8px] flex items-center justify-center font-bold text-slate-400">
                    {i}k+
                  </div>
                ))}
                <span className="pl-3 text-[10px] font-black text-slate-400 uppercase self-center">Users Active</span>
             </div>
             <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${isSelected ? 'translate-x-1 text-emerald-500' : 'text-slate-300'}`} />
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">System Routing</h2>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full glass border-emerald-100 text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
           <Activity className="w-3 h-3 animate-pulse" />
           Live Analysis
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RouteCard 
          type="fastest" 
          route={routes.fastest} 
          isSelected={selectedRoute === 'fastest'} 
        />
        <RouteCard 
          type="safest" 
          route={routes.safest} 
          isSelected={selectedRoute === 'safest'} 
        />
      </div>
    </div>
  );
}
