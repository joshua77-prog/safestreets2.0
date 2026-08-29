import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import { 
  Shield, 
  ThumbsUp, 
  ThumbsDown, 
  Database, 
  MapPin, 
  Clock, 
  Star, 
  Layers,
  Activity,
  Navigation
} from "lucide-react";
import { motion } from "framer-motion";

export default function NearbySafetyDisplay({ analysisResult }) {
  const [activeTab, setActiveTab] = useState("all");

  if (!analysisResult) return null;

  const {
    routeDistance = "0 km",
    routeDuration = "0 mins",
    positiveReports = [],
    negativeReports = [],
    historicalReports = [],
    allNearbySafetyData = []
  } = analysisResult;

  const formatDate = (dateVal) => {
    if (!dateVal) return "Recent";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "Recent";
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Recent";
    }
  };

  const getItemType = (item) => {
    const typeStr = (item.report_type || "").toLowerCase();
    if (typeStr.includes("positive") || typeStr === "safe_zone") return "positive";
    if (item.crime_count !== undefined || item.lighting_score !== undefined || item.city || item.area) return "historical";
    return "negative";
  };

  return (
    <div className="space-y-6 mt-10">
      {/* Overview Banner */}
      <div className="premium-card glass p-6 md:p-8 border-white/60 bg-white/60 shadow-xl rounded-3xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-200/60">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20">
              <Layers className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase tracking-[0.2em] text-[10px]">
                <Activity className="w-3.5 h-3.5" />
                Route Corridor Safety Scan
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Route Safety Intelligence
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="glass px-4 py-2 rounded-xl text-xs font-bold text-slate-700 border-white/60">
              Distance: <span className="text-slate-900 font-black">{routeDistance}</span>
            </div>
            <div className="glass px-4 py-2 rounded-xl text-xs font-bold text-slate-700 border-white/60">
              Est. Duration: <span className="text-slate-900 font-black">{routeDuration}</span>
            </div>
            <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-md">
              {allNearbySafetyData.length} Records Found
            </div>
          </div>
        </div>

        {/* Quick Stats Grid (Static Counters) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/60 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Positive Reports</p>
              <p className="text-2xl font-black text-emerald-900">{positiveReports.length}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/60 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
              <ThumbsDown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Negative Reports</p>
              <p className="text-2xl font-black text-rose-900">{negativeReports.length}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/60 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Historical Data</p>
              <p className="text-2xl font-black text-indigo-900">{historicalReports.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs View */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="glass p-1.5 rounded-2xl border-white/60 flex flex-wrap gap-2">
          <TabsTrigger value="all" className="px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">
            <Shield className="w-3.5 h-3.5" />
            All ({allNearbySafetyData.length})
          </TabsTrigger>
          <TabsTrigger value="positive" className="px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all">
            <ThumbsUp className="w-3.5 h-3.5" />
            Positive Reports ({positiveReports.length})
          </TabsTrigger>
          <TabsTrigger value="negative" className="px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 data-[state=active]:bg-rose-600 data-[state=active]:text-white transition-all">
            <ThumbsDown className="w-3.5 h-3.5" />
            Negative Reports ({negativeReports.length})
          </TabsTrigger>
          <TabsTrigger value="historical" className="px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
            <Database className="w-3.5 h-3.5" />
            Historical Data ({historicalReports.length})
          </TabsTrigger>
        </TabsList>

        {/* Filter 1: All */}
        <TabsContent value="all" className="space-y-6 mt-0">
          {allNearbySafetyData.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allNearbySafetyData.map((item) => (
                <SafetyCard key={item.id} item={item} type={getItemType(item)} formatDate={formatDate} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Filter 2: Positive Reports */}
        <TabsContent value="positive" className="space-y-4 mt-0">
          {positiveReports.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {positiveReports.map((item) => (
                <SafetyCard key={item.id} item={item} type="positive" formatDate={formatDate} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Filter 3: Negative Reports */}
        <TabsContent value="negative" className="space-y-4 mt-0">
          {negativeReports.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {negativeReports.map((item) => (
                <SafetyCard key={item.id} item={item} type="negative" formatDate={formatDate} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Filter 4: Historical Data */}
        <TabsContent value="historical" className="space-y-4 mt-0">
          {historicalReports.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {historicalReports.map((item) => (
                <SafetyCard key={item.id} item={item} type="historical" formatDate={formatDate} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-12 text-center glass rounded-3xl border border-slate-200/60 bg-white/40">
      <p className="text-base font-bold text-slate-600">No nearby reports found.</p>
    </div>
  );
}

function SafetyCard({ item, type, formatDate }) {
  const isPositive = type === "positive";
  const isHistorical = type === "historical";

  const cardBorderClass = isPositive
    ? "border-emerald-200 hover:border-emerald-400 bg-emerald-50/20"
    : isHistorical
    ? "border-indigo-200 hover:border-indigo-400 bg-indigo-50/20"
    : "border-rose-200 hover:border-rose-400 bg-rose-50/20";

  const badgeClass = isPositive
    ? "bg-emerald-500/10 text-emerald-700 border-emerald-300"
    : isHistorical
    ? "bg-indigo-500/10 text-indigo-700 border-indigo-300"
    : "bg-rose-500/10 text-rose-700 border-rose-300";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className={`p-5 rounded-2xl glass border ${cardBorderClass} transition-all h-full flex flex-col justify-between shadow-sm hover:shadow-md`}>
        <div className="space-y-3">
          {/* Top Header: Type Tag + Safety Rating */}
          <div className="flex items-start justify-between gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${badgeClass}`}>
              {isHistorical ? "Historical Safety Data" : item.report_type}
            </span>
            <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{item.safety_rating}/5</span>
            </div>
          </div>

          {/* Category */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Category</span>
            <h4 className="text-base font-black text-slate-900 leading-snug">{item.category}</h4>
          </div>

          {/* Distance from Route */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white w-fit text-xs font-bold shadow-sm">
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span>Distance from Route: <span className="text-emerald-400 font-black">{item.distance_from_route} meters</span></span>
          </div>

          {/* Intelligence Briefing */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Intelligence Briefing</span>
            <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white/70 p-3 rounded-xl border border-slate-200/60 mt-1 italic">
              "{item.intelligence_briefing}"
            </p>
          </div>
        </div>

        {/* Footer: Time Cycle & Coordinates */}
        <div className="pt-3 border-t border-slate-200/50 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-4">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Time Cycle: <strong className="text-slate-800">{item.time_cycle || "Anytime"}</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>Lat: {item.latitude.toFixed(3)}, Lon: {item.longitude.toFixed(3)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
