import React, { useState, useEffect } from "react";
import { SOSAlert, SafetyReport, EmergencyContact } from "@/entities/all";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Shield, 
  AlertTriangle, 
  Navigation, 
  Users, 
  MapPin,
  Clock,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Activity,
  Zap,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

import QuickActions from "../components/dashboard/QuickActions.jsx";
import SafetyMetrics from "../components/dashboard/safemetrics.jsx";
import RecentActivity from "../components/dashboard/RecentActivity.jsx";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalAlerts: 0,
    activeAlerts: 0,
    safetyReports: 0,
    emergencyContacts: 0
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [alerts, reports, contacts] = await Promise.all([
        SOSAlert.list('-created_date', 5),
        SafetyReport.list('-created_date', 5),
        EmergencyContact.list()
      ]);

      const activeAlerts = alerts.filter(alert => alert.status === 'active').length;

      setStats({
        totalAlerts: alerts.length,
        activeAlerts,
        safetyReports: reports.length,
        emergencyContacts: contacts.length
      });

      setRecentAlerts(alerts);
      setRecentReports(reports);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Dynamic Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-slate-200/50">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-emerald-600 font-bold uppercase tracking-[0.2em] text-xs mb-3"
          >
            <Sparkles className="w-4 h-4 fill-emerald-500" />
            Security Intelligence
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight"
          >
            Safety <span className="gradient-text">Control Center</span>
          </motion.h1>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass px-6 py-3 rounded-2xl flex items-center gap-4 border-emerald-100 shadow-sm"
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status</span>
            <span className="text-sm font-black text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              All Systems Active
            </span>
          </div>
          <div className="w-[1px] h-8 bg-slate-200"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Guardian AI</span>
            <span className="text-sm font-black text-slate-900">V2.4 Powered</span>
          </div>
        </motion.div>
      </div>

      {/* Primary Dashboard Modules */}
      <div className="grid grid-cols-1 gap-10">
        <section>
          <QuickActions />
        </section>

        <section>
          <SafetyMetrics stats={stats} loading={loading} />
        </section>

        <div className="grid lg:grid-cols-2 gap-10">
          <RecentActivity 
            title="Emergency Alerts"
            items={recentAlerts}
            type="alerts"
            loading={loading}
          />
          <RecentActivity 
            title="Intelligence Reports"
            items={recentReports}
            type="reports"
            loading={loading}
          />
        </div>

        {/* Global Insight Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="premium-card glass-dark overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none"></div>
            <CardContent className="p-10 flex flex-col md:flex-row items-center gap-10 relative z-10">
              <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center shadow-2xl backdrop-blur-md group-hover:scale-110 transition-transform duration-500 shrink-0">
                <Shield className="w-12 h-12 text-emerald-400" />
              </div>
              <div className="flex-grow text-center md:text-left">
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Active Intelligence Tip</h3>
                <p className="text-slate-400 leading-relaxed text-lg max-w-2xl">
                  Always share your planned route with trusted contacts before traveling, especially during evening hours. 
                  Our proprietary <span className="text-white font-bold italic">Guardian-AI</span> can automatically notify your emergency contacts when you reach your destination.
                </p>
              </div>
              <Button className="btn-premium bg-white text-slate-900 hover:bg-emerald-50 shrink-0">
                Read Protocols
              </Button>
            </CardContent>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

 


