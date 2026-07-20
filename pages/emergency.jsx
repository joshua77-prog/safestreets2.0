import React, { useState, useEffect } from "react";
import { EmergencyContact, SOSAlert } from "../entities/all.js";
import { Button } from "../components/ui/button.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { 
  AlertTriangle, 
  Phone, 
  Users,
  MapPin,
  Mic,
  Shield,
  Clock,
  Zap,
  Activity,
  Verified,
  LifeBuoy,
  Wifi,
  Radio
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import SOSButton from "../components/emergency/sosbutton.jsx";
import EmergencyContacts from "../components/emergency/emergencycontacts.jsx";
import { VoiceActivation } from "../components/emergency/VoiceActivation.jsx";

export default function Emergency() {
  const [contacts, setContacts] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmergencyData();
  }, []);

  const loadEmergencyData = async () => {
    try {
      const [contactList, activeAlerts] = await Promise.all([
        EmergencyContact.list(),
        SOSAlert.filter({ status: 'active' }, '-created_date', 1)
      ]);
      
      setContacts(contactList);
      if (activeAlerts.length > 0) {
        setActiveAlert(activeAlerts[0]);
      }
    } catch (error) {
      console.error("Error loading emergency data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSOSAlert = async (alertType = 'manual_sos', message = '') => {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const alertData = {
        alert_type: alertType,
        location: "Current Location",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        message: message,
        contacts_notified: contacts.map(c => c.id)
      };

      const alert = await SOSAlert.create(alertData);
      setActiveAlert(alert);
      
    } catch (error) {
      console.error("Error sending SOS alert:", error);
      const alert = await SOSAlert.create({
        alert_type: alertType,
        location: "Location unavailable",
        message: message,
        contacts_notified: contacts.map(c => c.id)
      });
      setActiveAlert(alert);
    }
  };

  const resolveAlert = async () => {
    if (activeAlert) {
      await SOSAlert.update(activeAlert.id, { 
        status: 'resolved',
        resolved_at: new Date().toISOString()
      });
      setActiveAlert(null);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/50">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-bold uppercase tracking-[0.2em] text-xs mb-3">
            <Radio className="w-4 h-4" />
            Priority Signal Base
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Emergency <span className="gradient-text-rose">Center</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 glass px-4 py-2 rounded-2xl text-emerald-600 font-bold uppercase tracking-widest text-[10px] border-emerald-100">
              <Wifi className="w-3 h-3" />
              Secure Uplink
           </div>
           <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-2xl text-white font-bold uppercase tracking-widest text-[10px]">
              <Activity className="w-3 h-3 text-emerald-400" />
              Live Monitoring
           </div>
        </div>
      </div>

      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="premium-card bg-rose-500 p-8 text-white shadow-2xl shadow-rose-500/30 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-[100px] rounded-full -mr-32 -mt-32 animate-pulse"></div>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/30 shadow-inner">
                   <AlertTriangle className="w-10 h-10 text-white animate-bounce" />
                </div>
                <div>
                   <h3 className="text-3xl font-black tracking-tight mb-1">CRITICAL SOS ACTIVE</h3>
                   <p className="text-rose-100 font-bold uppercase tracking-[0.2em] text-xs pl-0.5">
                     Dispatch initiated at {new Date(activeAlert.created_date).toLocaleTimeString()}
                   </p>
                </div>
              </div>
              
              <Button 
                onClick={resolveAlert} 
                className="btn-premium bg-white text-rose-600 hover:bg-rose-50 border-0 px-8 py-6 h-auto text-lg"
              >
                Mark Status: Guarded
                <Verified className="w-6 h-6 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* SOS Action Center */}
        <div className="lg:col-span-12">
            <SOSButton onSOSAlert={handleSOSAlert} disabled={!!activeAlert} />
        </div>

        {/* Tactical Controls */}
        <div className="lg:col-span-5 space-y-8">
           <Card className="premium-card glass border-white/60 p-8 bg-white/40 shadow-xl">
             <div className="space-y-10">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                      <Mic className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Voice Engagement</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acoustic Signal Recognition</p>
                   </div>
                </div>

                <VoiceActivation 
                  isListening={isListening}
                  onToggleListening={setIsListening}
                  onVoiceAlert={handleSOSAlert}
                  disabled={!!activeAlert}
                />
                
                <div className="pt-6 border-t border-slate-100/50 flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`}></div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     {isListening ? 'Listening for strategic keywords...' : 'Voice protocol standby'}
                   </span>
                </div>
             </div>
           </Card>

           <Card className="premium-card glass-dark p-8 border-0 shadow-2xl">
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                       <LifeBuoy className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-white tracking-tight">Rapid Response</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Immediate Sector Support</p>
                    </div>
                 </div>
                 
                 <p className="text-slate-400 text-sm font-medium leading-relaxed">
                   Direct connection to regional dispatch centers is synchronized. 
                   <span className="text-emerald-400 italic"> Tactical Guardian units</span> are briefed on your real-time vector.
                 </p>
                 
                 <Button className="w-full btn-premium bg-white/10 text-white hover:bg-white/20 border-white/20">
                    Access Local Dispatch
                    <Phone className="w-4 h-4 ml-2" />
                 </Button>
              </div>
           </Card>
        </div>

        {/* Guardian Management */}
        <div className="lg:col-span-7">
           <Card className="premium-card glass border-white/60 p-1 bg-white/20 h-full">
              <EmergencyContacts 
                contacts={contacts}
                loading={loading}
                onContactsChange={loadEmergencyData}
              />
           </Card>
        </div>
      </div>
    </div>
  );
}

 


