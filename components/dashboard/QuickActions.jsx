import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Navigation, 
  AlertTriangle, 
  Shield, 
  Users,
  ArrowUpRight,
  Target,
  BellRing,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";

const actions = [
  {
    title: "Safe Navigation",
    description: "AI-optimized routes for your security",
    icon: Navigation,
    color: "emerald",
    link: createPageUrl("SafeNavigation"),
    badge: "Active"
  },
  {
    title: "SOS Protocol",
    description: "Instant emergency beacon deployment",
    icon: BellRing,
    color: "rose",
    link: createPageUrl("Emergency"),
    badge: "Critical"
  },
  {
    title: "Intel Report",
    description: "Contribute to community safety logs",
    icon: Shield,
    color: "indigo",
    link: createPageUrl("SafetyReports"),
    badge: "Public"
  },
  {
    title: "Profile Vault",
    description: "Manage secure identity and contacts",
    icon: Users,
    color: "amber",
    link: createPageUrl("Profile"),
    badge: "Private"
  },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {actions.map((action, index) => (
        <motion.div
          key={action.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -8 }}
        >
          <Link to={action.link} className="block h-full">
            <div className="premium-card glass p-8 h-full bg-white/40 border-white/50 shadow-lg hover:shadow-2xl hover:border-emerald-500/20 group">
              <div className="flex items-start justify-between mb-8">
                <div className={`w-14 h-14 bg-gradient-to-tr from-${action.color}-500 to-${action.color}-400 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  <action.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex flex-col items-end gap-2">
                   <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                     <ArrowUpRight className="w-4 h-4" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{action.badge}</span>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight group-hover:text-emerald-700 transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                {action.description}
              </p>
              
              <div className="mt-6 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: "100%" }}
                   transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                   className={`h-full bg-${action.color}-500 opacity-20`}
                 />
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}


