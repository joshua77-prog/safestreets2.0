import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select.jsx";
import { Skeleton } from "../../../components/ui/skeleton.jsx";
import { format } from "date-fns";
import { 
  MapPin, 
  Clock,
  Star,
  Filter,
  AlertTriangle,
  Shield,
  User,
  Eye,
  ArrowRight,
  Zap,
  Activity,
  Verified
} from "lucide-react";
import { motion } from "framer-motion";

const formatDate = (dateVal) => {
  if (!dateVal) return "Recently";
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return "Recently";
  try {
    return format(date, 'MMM d, yyyy • h:mm a');
  } catch {
    return "Recently";
  }
};

const getReportTypeStyles = (reportType) => {
  switch (reportType) {
    case 'incident':
    case 'suspicious_activity':
      return 'bg-rose-500/10 text-rose-600 border-rose-200/50';
    case 'poor_lighting':
      return 'bg-amber-500/10 text-amber-600 border-amber-200/50';
    case 'safe_zone':
    case 'well_lit':
    case 'police_presence':
    case 'busy_area':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50';
    default:
      return 'bg-blue-500/10 text-blue-600 border-blue-200/50';
  }
};

const getReportIcon = (reportType) => {
  switch (reportType) {
    case 'incident':
    case 'suspicious_activity':
    case 'poor_lighting':
      return AlertTriangle;
    case 'safe_zone':
    case 'well_lit':
    case 'police_presence':
    case 'busy_area':
      return Shield;
    default:
      return MapPin;
  }
};

export default function ReportsList({ reports, loading, filterType, onFilterChange }) {
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="premium-card glass p-8 border-white/60">
             <div className="flex gap-6">
                <Skeleton className="w-12 h-12 rounded-xl bg-slate-200/50" />
                <div className="flex-grow space-y-4">
                   <div className="flex justify-between">
                      <Skeleton className="h-6 w-1/3 bg-slate-200/50" />
                      <Skeleton className="h-6 w-24 bg-slate-200/50" />
                   </div>
                   <Skeleton className="h-4 w-full bg-slate-200/50" />
                   <Skeleton className="h-4 w-2/3 bg-slate-200/50" />
                </div>
             </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filter Header */}
      <div className="flex items-center justify-between glass px-6 py-4 rounded-2xl border-white/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <Filter className="w-4 h-4" />
          </div>
          <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Protocol Filter</span>
        </div>
        <Select value={filterType} onValueChange={onFilterChange}>
          <SelectTrigger className="w-64 glass border-white/80 focus:ring-slate-900 rounded-xl font-bold text-slate-900">
            <SelectValue placeholder="All intelligence" />
          </SelectTrigger>
          <SelectContent className="glass border-white/80 rounded-xl overflow-hidden">
            <SelectItem value="all">Comprehensive Feed</SelectItem>
            <SelectItem value="incident">Critical Incidents</SelectItem>
            <SelectItem value="safe_zone">Guarded Zones</SelectItem>
            <SelectItem value="poor_lighting">Luminosity Alerts</SelectItem>
            <SelectItem value="suspicious_activity">Anomalous Activity</SelectItem>
            <SelectItem value="police_presence">Force Presence</SelectItem>
            <SelectItem value="well_lit">Photon Optimized</SelectItem>
            <SelectItem value="busy_area">High Traffic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports Feed */}
      {reports.length === 0 ? (
        <div className="py-20 text-center glass rounded-[2.5rem] border-white/60 border-dashed border-2">
          <Activity className="w-16 h-16 text-slate-200 mx-auto mb-6" />
          <h3 className="text-xl font-black text-slate-900 mb-2 italic">Zero Field reports</h3>
          <p className="text-slate-500 font-medium">
            {filterType === "all" 
              ? "All sectors currently reporting stable conditions." 
              : `No activity detected in the ${filterType.replace(/_/g, ' ')} grid.`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reports.map((report, index) => {
            const ReportIcon = getReportIcon(report.report_type);
            const isCritical = report.report_type === 'incident' || report.report_type === 'suspicious_activity';
            
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="premium-card glass p-8 border-white/60 hover:border-emerald-500/30 transition-all duration-500 group relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 blur-[100px] rounded-full -mr-16 -mt-16 opacity-10 ${isCritical ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                  
                  <div className="flex flex-col md:flex-row gap-8 relative z-10">
                    <div className={`w-14 h-14 shrink-0 rounded-[1.25rem] flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 ${
                      isCritical ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                    }`}>
                      <ReportIcon className="w-7 h-7" />
                    </div>

                    <div className="flex-grow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                           <div className="flex items-center gap-2 mb-1.5">
                              <MapPin className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                              <h3 className="text-xl font-black text-slate-900 tracking-tight">{report.location}</h3>
                           </div>
                           <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                              <div className="flex items-center gap-1.5">
                                 <Clock className="w-3.5 h-3.5" />
                                 {formatDate(report.created_date || report.created_at || report.timestamp)}
                              </div>
                              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                                 <Eye className="w-3.5 h-3.5" />
                                 {report.time_of_day}
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-3">
                           <div className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                             <Star className={`w-4 h-4 fill-amber-400 text-amber-400`} />
                             <span className="text-sm font-black text-slate-900">
                               {report.safety_rating}.0
                             </span>
                           </div>
                        </div>
                      </div>

                      {report.description && (
                        <p className="text-slate-600 text-sm mb-6 leading-relaxed font-medium italic border-l-2 border-slate-100 pl-4">
                          "{report.description}"
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100/50">
                        <div className="flex items-center gap-2">
                           <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border ${getReportTypeStyles(report.report_type)}`}>
                             {report.report_type.replace(/_/g, ' ')}
                           </span>
                           {report.verified && (
                             <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                               <Verified className="w-3 h-3" />
                               Authenticated
                             </div>
                           )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-4">
                           <User className="w-3.5 h-3.5" />
                           Sector Sentinel
                           <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}