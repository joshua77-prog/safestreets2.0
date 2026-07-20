import React from "react";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { 
  Activity, 
  Shield, 
  Users,
  TrendingUp,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

const MetricCard = ({ title, value, icon: Icon, color, badge, loading, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="h-full"
  >
    <div className="premium-card glass p-7 h-full flex flex-col justify-between overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 blur-3xl rounded-full -mr-8 -mt-8 group-hover:bg-${color}-500/10 transition-colors`}></div>
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className={`w-12 h-12 rounded-xl bg-${color}-50 flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        {!loading && (
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border border-${color}-100 bg-${color}-50 text-${color}-600 shadow-sm`}>
            {badge}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 line-clamp-1">{title}</h3>
        {loading ? (
          <Skeleton className="h-10 w-24 bg-slate-200/50" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900 tracking-tighter">{value}</span>
            {title === "Safety Score" && <TrendingUp className="w-5 h-5 text-emerald-500 animate-bounce" />}
          </div>
        )}
      </div>
      
      <div className="mt-6 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
         <Zap className="w-3 h-3 text-emerald-500 fill-emerald-500" />
         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Verified</span>
      </div>
    </div>
  </motion.div>
);

export default function SafetyMetrics({ stats, loading }) {
  const metrics = [
    {
      title: "Active SOS Alerts",
      value: stats.activeAlerts,
      icon: Activity,
      color: "rose",
      badge: stats.activeAlerts > 0 ? "Alert High" : "Secure",
    },
    {
      title: "Guardian Network",
      value: stats.emergencyContacts,
      icon: Users,
      color: "indigo",
      badge: stats.emergencyContacts > 3 ? "Protected" : "Strengthen",
    },
    {
      title: "Safety Intel",
      value: stats.safetyReports,
      icon: Shield,
      color: "emerald",
      badge: "Validated",
    },
    {
      title: "Stability Index",
      value: "98.4",
      icon: TrendingUp,
      color: "amber",
      badge: "Optimal",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <MetricCard
          key={metric.title}
          {...metric}
          loading={loading}
          delay={index * 0.1}
        />
      ))}
    </div>
  );
}