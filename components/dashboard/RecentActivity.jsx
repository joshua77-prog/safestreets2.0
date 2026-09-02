import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import { Skeleton } from "../../components/ui/skeleton.jsx";
import { format } from "date-fns";
import { 
  AlertTriangle, 
  Shield, 
  MapPin,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  Zap,
  Navigation
} from "lucide-react";
import { motion } from "framer-motion";
import { ReportLocationDisplay } from "../../services/geocoding.js";

const formatDate = (dateVal) => {
  if (!dateVal) return "Recently";
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return "Recently";
  try {
    return format(date, "h:mm a, MMM d");
  } catch {
    return "Recently";
  }
};

const getStatusStyles = (status, type) => {
  if (type === 'alerts') {
    switch (status) {
      case 'active':
        return 'bg-rose-500/10 text-rose-600 border-rose-200/50';
      case 'resolved':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-200/50';
    }
  } else {
    if (status >= 4) return 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50';
    if (status >= 3) return 'bg-amber-500/10 text-amber-600 border-amber-200/50';
    return 'bg-rose-500/10 text-rose-600 border-rose-200/50';
  }
};

export default function RecentActivity({ title, items, type, loading }) {
  return (
    <div className="premium-card glass overflow-hidden flex flex-col h-full bg-white/40">
      <div className="p-8 border-b border-slate-200/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 flex items-center justify-center rounded-2xl ${type === 'alerts' ? 'bg-rose-50' : 'bg-indigo-50'}`}>
            {type === 'alerts' ? <Activity className="w-6 h-6 text-rose-500" /> : <Shield className="w-6 h-6 text-indigo-500" />}
          </div>
          <div>
             <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Feed</p>
          </div>
        </div>
        {!loading && items.length > 0 && <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-slate-900 text-white rounded-lg">{items.length} Tracked</span>}
      </div>

      <div className="p-6 flex-grow">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-1.5 h-16 rounded-full bg-slate-200/50" />
                <div className="flex-grow space-y-3">
                  <Skeleton className="h-6 w-3/4 bg-slate-200/50" />
                  <Skeleton className="h-4 w-1/2 bg-slate-200/50" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-6">
               <Shield className="w-10 h-10 text-slate-300" />
            </div>
            <h4 className="text-slate-900 font-bold mb-1">
              {type === 'alerts' ? 'No emergency alerts' : 'No intelligence reports'}
            </h4>
            <p className="text-sm text-slate-400">
              {type === 'alerts' ? 'No emergency alerts recorded.' : 'No community safety reports recorded.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <motion.div 
                key={item.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative flex items-start gap-5 p-5 rounded-2xl hover:bg-white/60 transition-all duration-300 border border-transparent hover:border-white hover:shadow-xl hover:shadow-slate-200/50"
              >
                <div className={`w-1 h-full absolute left-2 top-0 py-5 opacity-40 group-hover:opacity-100 transition-opacity`}>
                   <div className={`w-1 h-full rounded-full ${type === 'alerts' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
                </div>

                <div className="flex-grow pl-2">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                        <p className="text-sm font-black text-slate-900 truncate max-w-[150px] sm:max-w-[200px]">
                          <ReportLocationDisplay item={item} fallbackText="Encrypted Position" />
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         <Clock className="w-3 h-3" />
                         {formatDate(item.created_date || item.created_at || item.timestamp)}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(type === 'alerts' ? item.status : item.safety_rating, type)}`}>
                        {type === 'alerts' ? item.status : `Rating: ${item.safety_rating}/5`}
                      </span>
                      {type === 'reports' && (
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-100 px-1.5 py-0.5 rounded">
                           {item.report_type?.replace(/_/g, ' ')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2 italic">
                    {type === 'alerts' ? (item.message || 'No situational report provided.') : (item.description || 'Verified safety observation log.')}
                  </p>
                </div>
                
                <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 transition-transform">
                   <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center">
                     <ArrowRight className="w-4 h-4" />
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-6 bg-slate-50/50 border-t border-slate-200/50 text-center">
         <button className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors">
            View Expanded Intelligence Grid
         </button>
      </div>
    </div>
  );
}
