import React, { useState, useEffect, useCallback } from "react";
import { User, EmergencyContact } from "@/entities/all";
import { supabase } from "../src/lib/supabase.js";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { 
  User as UserIcon, 
  Shield, 
  Settings,
  Bell,
  Phone,
  MapPin,
  Save,
  Fingerprint,
  Heart,
  Hospital,
  AlertCircle,
  Zap,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [profileData, setProfileData] = useState({
    emergency_contact_phone: "",
    medical_conditions: "",
    preferred_hospital: "",
    safety_preferences: {
      auto_share_location: true,
      voice_activation: true,
      emergency_timeout: 30
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      // Requirement 1 & 4: Clear state before loading new data and replace completely
      setContacts([]);
      setUser(null);

      const currentUser = await User.me();
      if (!currentUser) {
        setContacts([]);
        return;
      }

      const emergencyContacts = await EmergencyContact.list();
      
      setUser(currentUser);
      setContacts(emergencyContacts || []);
      
      const initialSafetyPreferences = { 
        auto_share_location: true, 
        voice_activation: true, 
        emergency_timeout: 30 
      };

      setProfileData(prevProfileData => ({
        ...prevProfileData,
        emergency_contact_phone: currentUser.emergency_contact_phone || "",
        medical_conditions: currentUser.medical_conditions || "",
        preferred_hospital: currentUser.preferred_hospital || "",
        safety_preferences: {
          ...initialSafetyPreferences,
          ...(currentUser.safety_preferences || {})
        }
      }));
      
    } catch (error) {
      console.error("Error loading user data:", error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();

    // Requirement 3: Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // Requirement 2 & 3: Reset contacts state & clear cache
      setContacts([]);
      setUser(null);
      EmergencyContact.clearCache();

      if (session?.user) {
        loadUserData();
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [loadUserData]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await User.updateMyUserData(profileData); 
      await loadUserData();
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 flex items-center justify-center min-h-[60vh]">
         <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing Security Core...</p>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/50">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase tracking-[0.2em] text-xs mb-3">
            <Fingerprint className="w-4 h-4" />
            Identity Verification
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Safety <span className="gradient-text">Profile</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3 glass px-5 py-2.5 rounded-2xl text-slate-500 font-bold uppercase tracking-widest text-[10px] border-white/60">
           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
           System Online
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* User Identity Card */}
        <div className="lg:col-span-12">
          <Card className="premium-card glass overflow-hidden border-white/60 shadow-2xl">
             <div className="p-8 flex flex-col md:flex-row items-center gap-10">
                <div className="relative">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl relative z-10">
                     <span className="text-4xl font-black">{user?.full_name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="absolute inset-0 bg-emerald-500 rounded-[2.5rem] blur-2xl opacity-20 transform scale-110"></div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white border-4 border-white z-20 shadow-lg">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
                
                <div className="flex-grow text-center md:text-left space-y-2">
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight">{user?.full_name}</h2>
                   <p className="text-slate-500 font-medium">{user?.email}</p>
                   <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                      <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                         {user?.role || 'authorized user'}
                      </div>
                      <div className="px-3 py-1 glass border-white text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                         <Shield className="w-3 h-3" />
                         ID: #{user?.id?.slice(0, 8) || 'V-MASKED'}
                      </div>
                   </div>
                </div>
                
                <div className="flex flex-col items-center gap-1 glass p-6 rounded-3xl border-white shadow-inner">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trust Score</p>
                   <div className="text-4xl font-black text-emerald-600">98.4</div>
                   <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                      <div className="w-[98%] h-full bg-emerald-500"></div>
                   </div>
                </div>
             </div>
          </Card>
        </div>

        {/* Emergency Info Form */}
        <div className="lg:col-span-7">
          <Card className="premium-card glass border-white/60 p-10 bg-white/40 space-y-10">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                   <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">Emergency Protocols</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Critical Response Data</p>
                </div>
             </div>

             <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pl-1">Response Target *</Label>
                      <div className="relative">
                        <Input
                          value={profileData.emergency_contact_phone}
                          onChange={(e) => setProfileData({...profileData, emergency_contact_phone: e.target.value})}
                          placeholder="Primary contact..."
                          className="pl-12 py-6 glass border-white/80 focus:border-rose-500/50 rounded-2xl transition-all font-bold"
                        />
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      </div>
                   </div>
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pl-1">Medical Base *</Label>
                      <div className="relative">
                        <Input
                          value={profileData.preferred_hospital}
                          onChange={(e) => setProfileData({...profileData, preferred_hospital: e.target.value})}
                          placeholder="Hospital ID..."
                          className="pl-12 py-6 glass border-white/80 focus:border-blue-500/50 rounded-2xl transition-all font-bold"
                        />
                        <Hospital className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      </div>
                   </div>
                </div>

                <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pl-1">Health Conditions Briefing</Label>
                   <div className="relative">
                      <Input
                        value={profileData.medical_conditions}
                        onChange={(e) => setProfileData({...profileData, medical_conditions: e.target.value})}
                        placeholder="Allergies, conditions, vital info..."
                        className="pl-12 py-6 glass border-white/80 focus:border-amber-500/50 rounded-2xl transition-all font-bold"
                      />
                      <Heart className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                   </div>
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full btn-premium btn-primary py-7 text-lg h-auto shadow-2xl shadow-emerald-500/20"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Committing Changes...
                    </>
                  ) : (
                    <>
                      Update Security Profile
                      <Zap className="w-5 h-5 fill-white" />
                    </>
                  )}
                </Button>
             </div>
          </Card>
        </div>

        {/* Guardian Network */}
        <div className="lg:col-span-5">
          <Card className="premium-card glass border-white/60 p-10 bg-white/40 h-full flex flex-col">
             <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                     <Shield className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-slate-900 tracking-tight">Guardian Network</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secondary Verification</p>
                  </div>
                </div>
                <button className="w-10 h-10 glass border-white rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:scale-110 transition-all">
                   <Settings className="w-5 h-5" />
                </button>
             </div>

             <div className="flex-grow space-y-4">
                {contacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                    <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-6">
                       <AlertCircle className="w-10 h-10 text-slate-200" />
                    </div>
                    <h4 className="text-slate-900 font-bold mb-1 italic">Nodes Missing</h4>
                    <p className="text-xs text-slate-400 max-w-[200px]">Strategic guardian list is currently empty. Deployment recommended.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contacts.slice(0, 4).map((contact, index) => (
                      <motion.div 
                        key={contact.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group flex items-center justify-between p-5 rounded-2xl hover:bg-white/80 transition-all cursor-pointer border border-transparent hover:border-white hover:shadow-xl hover:shadow-slate-200/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-sm tracking-tight">{contact.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{contact.relationship} • {contact.phone}</p>
                          </div>
                        </div>
                        {contact.is_primary ? (
                          <div className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                            Primary
                          </div>
                        ) : (
                          <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                        )}
                      </motion.div>
                    ))}
                    {contacts.length > 4 && (
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center pt-4 italic">
                        +{contacts.length - 4} Additional Protocol nodes
                      </p>
                    )}
                  </div>
                )}
             </div>
             
             <div className="mt-10 p-6 glass-dark rounded-3xl flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                   <Bell className="w-5 h-5 text-emerald-400 animate-bounce" />
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Notifications</p>
                      <p className="text-xs font-medium text-slate-300">Active Vigilance mode</p>
                   </div>
                </div>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative p-1 cursor-pointer">
                   <div className="w-4 h-4 bg-white rounded-full absolute right-1"></div>
                </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

 


