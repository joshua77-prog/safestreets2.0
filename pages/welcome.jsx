import React, { useState, useEffect } from "react";
import { User } from "@/entities/all";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Shield, 
  Users, 
  Navigation,
  AlertTriangle,
  ArrowRight,
  Zap,
  MapPin,
  Fingerprint,
  Activity,
  Verified,
  Cpu,
  Radio
} from "lucide-react";
import { motion } from "framer-motion";

export default function Welcome() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      const isNew = !currentUser.emergency_contact_phone && !currentUser.safety_preferences;
      setIsNewUser(isNew);
    } catch (error) {
      console.error("Error loading user:", error);
      await User.loginWithRedirect(window.location.origin + createPageUrl("Welcome"));
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
          <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-emerald-500 animate-pulse" />
        </div>
        <p className="mt-8 text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Initializing Tactical Link...</p>
      </div>
    );
  }

  return (
    <div className="relative pt-10 pb-32">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-6"
      >
        {/* Hero Section */}
        <div className="text-center mb-24 relative">
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-3 px-6 py-2.5 rounded-2xl glass border-white/60 text-slate-900 text-[10px] font-black uppercase tracking-[0.25em] mb-12 shadow-2xl"
          >
            <Verified className="w-4 h-4 text-emerald-500" />
            Strategic Urban Intelligence v4.0
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="text-6xl md:text-8xl font-black text-slate-900 mb-8 leading-[0.9] tracking-tighter"
          >
            Tactical <br />
            <span className="gradient-text uppercase italic">Security Guardian</span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-2xl text-slate-500 max-w-3xl mx-auto leading-relaxed mb-12 font-medium"
          >
            {isNewUser ? (
              <>Authentication successful, <span className="text-slate-900 font-black italic">{user?.full_name?.split(' ')[0] || 'OP-01'}</span>. Begin tactical synchronization to authorize personal protection protocols.</>
            ) : (
              <>Welcome back, <span className="text-slate-900 font-black italic">{user?.full_name?.split(' ')[0] || 'COMMANDER'}</span>. Your strategic security grid is active and processing real-time sector data.</>
            )}
          </motion.p>

          {!isNewUser && (
            <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-6">
              <Link to={createPageUrl("Dashboard")}>
                <Button className="btn-premium btn-primary py-7 px-10 text-lg shadow-[0_20px_50px_rgba(16,185,129,0.3)] h-auto">
                   Enter Command Center
                  <ArrowRight className="w-6 h-6" />
                </Button>
              </Link>
              <Link to={createPageUrl("SafeNavigation")}>
                <Button className="btn-premium glass-dark text-white border-0 py-7 px-10 text-lg h-auto hover:bg-slate-800">
                  Sector Navigation
                  <Navigation className="w-5 h-5 ml-3" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>

        {isNewUser ? (
          <div className="grid lg:grid-cols-3 gap-10 mb-24">
            {[
              {
                step: 1,
                title: "Guardian Nodes",
                desc: "Authorize your strategic contact list for immediate cross-protocol emergency notifications.",
                icon: Users,
                color: "emerald",
                href: createPageUrl("Emergency"),
                btn: "Configure Network"
              },
              {
                step: 2,
                title: "Identity Core",
                desc: "Encrypt your medical signatures and safety heuristics to refine the AI response matrix.",
                icon: Fingerprint,
                color: "blue",
                href: createPageUrl("Profile"),
                btn: "Authorize Profile"
              },
              {
                step: 3,
                title: "Neural Routing",
                desc: "Access proprietary pathfinding algorithms optimized for maximum sector security.",
                icon: MapPin,
                color: "indigo",
                href: createPageUrl("SafeNavigation"),
                btn: "Deploy Navigation"
              }
            ].map((step, i) => (
              <motion.div key={step.step} variants={itemVariants}>
                <Card className="premium-card h-full glass overflow-hidden border-white/80 group">
                  <div className={`absolute top-0 right-0 w-48 h-48 bg-${step.color}-500 blur-[100px] rounded-full -mr-24 -mt-24 opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                  <CardContent className="p-12 flex flex-col h-full relative z-10">
                    <div className="flex items-center justify-between mb-10">
                      <div className={`w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center shadow-2xl`}>
                        <step.icon className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-5xl font-black text-slate-100 italic transition-colors group-hover:text-slate-200">0{step.step}</span>
                    </div>
                    <h3 className="text-2xl font-black mb-4 tracking-tight text-slate-900 uppercase">{step.title}</h3>
                    <p className="text-slate-500 mb-10 leading-relaxed flex-grow font-medium">{step.desc}</p>
                    <Link to={step.href}>
                      <Button className={`w-full btn-premium btn-primary py-5 h-auto shadow-xl`}>
                        {step.btn}
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
             {[
               { title: "Command", desc: "Security overview", icon: Shield, path: "Dashboard" },
               { title: "Tactical", desc: "Safe route mapping", icon: Navigation, path: "SafeNavigation" },
               { title: "Distress", desc: "Emergency protocols", icon: AlertTriangle, path: "Emergency" },
               { title: "Intelligence", desc: "Crowdsourced logs", icon: Activity, path: "SafetyReports" }
             ].map((feature, i) => (
               <motion.div key={feature.title} variants={itemVariants}>
                 <Link to={createPageUrl(feature.path)}>
                   <div className="premium-card glass p-8 h-full group hover:border-emerald-500/50 transition-all duration-500 shadow-xl">
                     <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500 transition-all duration-500">
                        <feature.icon className="w-7 h-7 text-white" />
                     </div>
                     <h3 className="text-xl font-black text-slate-900 mb-1 uppercase tracking-tight">{feature.title}</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{feature.desc}</p>
                     
                     <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                        Link Established <ArrowRight className="w-3 h-3" />
                     </div>
                   </div>
                 </Link>
               </motion.div>
             ))}
          </div>
        )}

        {/* Dynamic Metric Grid */}
        <motion.div variants={itemVariants} className="mb-24">
           <div className="glass rounded-[4rem] p-16 border-white/60 shadow-[0_50px_100px_rgba(0,0,0,0.05)] relative overflow-hidden bg-white/40">
             <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full -mr-48 -mt-48"></div>
             <div className="grid md:grid-cols-3 gap-20 text-center relative z-10">
               <div className="space-y-2">
                  <div className="text-6xl font-black text-slate-900">99<span className="text-emerald-500">.</span>9</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Grid Reliability Index</div>
               </div>
               <div className="space-y-2 border-slate-100 md:border-x px-10">
                  <div className="text-6xl font-black text-slate-900">1<span className="text-emerald-500">.</span>2s</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Neural Alert Latency</div>
               </div>
               <div className="space-y-2">
                  <div className="text-6xl font-black text-slate-900">84k</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Secure Transits Logged</div>
               </div>
             </div>
           </div>
        </motion.div>

        {/* Tactical Strategy Section */}
        <motion.div variants={itemVariants} className="max-w-5xl mx-auto">
           <div className="glass-dark rounded-[3rem] p-12 flex flex-col md:flex-row items-center gap-12 border-0 shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 opacity-10">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle,rgba(16,185,129,0.3)_0%,transparent_70%)]"></div>
             </div>
             
             <div className="w-28 h-28 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_40px_rgba(16,185,129,0.4)] flex-shrink-0 animate-pulse relative z-10">
                <Radio className="w-14 h-14 text-white" />
             </div>
             <div className="text-center md:text-left relative z-10">
                <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">
                   <Zap className="w-3 h-3 fill-emerald-400" />
                   Active Directive
                </div>
                <p className="text-2xl md:text-3xl text-white font-medium leading-tight italic tracking-tight">
                  "True security is the synthesis of <span className="text-emerald-400">predictive intelligence</span> and absolute vigilance. Deploying Safest route now."
                </p>
             </div>
           </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

 


