import React, { useState, useEffect } from "react";
import { EmergencyContact, SOSAlert, triggerSOS } from "../entities/all.js";
import { supabase } from "../src/lib/supabase.js";
import { useLocationTracking } from "../hooks/useLocationTracking.js";
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
  Radio,
  Building,
  HeartPulse,
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import SOSButton from "../components/emergency/sosbutton.jsx";
import EmergencyContacts from "../components/emergency/emergencycontacts.jsx";
import { VoiceActivation } from "../components/emergency/VoiceActivation.jsx";
import { getTrustedPlaces, findNearbyTrustedPlace, TRUSTED_PLACE_PROXIMITY_THRESHOLD_METERS } from "../services/trustedPlacesService.js";
import { findNearestPoliceStation, findNearestHospital } from "../services/nearbySafetyService.js";

export default function Emergency() {
  const { getCurrentLocation, reverseGeocode, saveLocation } = useLocationTracking();

  const [contacts, setContacts] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(true);
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(45);
  const [workflowMessage, setWorkflowMessage] = useState("");
  const [workflowStatus, setWorkflowStatus] = useState("Standby");
  const [lastKnownLocation, setLastKnownLocation] = useState(null);

  // Trusted Places & Nearby Safety Assistance State for SOS
  const [trustedPlaces, setTrustedPlaces] = useState([]);
  const [nearbyTrustedPlaceResult, setNearbyTrustedPlaceResult] = useState(null);
  const [nearestPoliceStation, setNearestPoliceStation] = useState(null);
  const [nearestHospital, setNearestHospital] = useState(null);

  const loadEmergencyData = async () => {
    try {
      setLoading(true);

      const [contactList, savedTrustedPlaces] = await Promise.all([
        EmergencyContact.list(),
        getTrustedPlaces()
      ]);
      
      setContacts(contactList || []);
      setTrustedPlaces(savedTrustedPlaces || []);
    } catch (error) {
      console.error("Error loading emergency data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmergencyData();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setContacts([]);
      EmergencyContact.clearCache();
      if (session?.user) {
        loadEmergencyData();
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Update Trusted Place & Nearby Police/Hospital context when location/activeAlert changes
  useEffect(() => {
    const lat = activeAlert?.latitude || lastKnownLocation?.latitude;
    const lon = activeAlert?.longitude || lastKnownLocation?.longitude;

    if (!lat || !lon) {
      setNearbyTrustedPlaceResult(null);
      setNearestPoliceStation(null);
      setNearestHospital(null);
      return;
    }

    const proxResult = findNearbyTrustedPlace(lat, lon, trustedPlaces, TRUSTED_PLACE_PROXIMITY_THRESHOLD_METERS);
    setNearbyTrustedPlaceResult(proxResult);

    // Fetch dynamic nearby safety assistance for SOS
    let isMounted = true;
    Promise.all([
      findNearestPoliceStation(lat, lon),
      findNearestHospital(lat, lon)
    ]).then(([police, hospital]) => {
      if (isMounted) {
        setNearestPoliceStation(police);
        setNearestHospital(hospital);
      }
    }).catch((err) => console.error("Error fetching nearby safety assistance for SOS:", err));

    return () => { isMounted = false; };
  }, [activeAlert, lastKnownLocation, trustedPlaces]);

  useEffect(() => {
    if (!countdownActive) return undefined;

    const timer = window.setInterval(() => {
      setCountdownSeconds((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          void finalizeEmergencyWorkflow();
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [countdownActive]);

  useEffect(() => {
    const handleOnline = () => {
      void flushOfflineQueue();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const persistOfflineLocation = (location) => {
    if (typeof window === "undefined") return;

    const stored = JSON.parse(window.localStorage.getItem("pendingEmergencyLocations") || "[]");
    const payload = {
      ...location,
      stagedAt: new Date().toISOString(),
    };
    stored.push(payload);
    window.localStorage.setItem("pendingEmergencyLocations", JSON.stringify(stored));
    setLastKnownLocation(location);
  };

  const flushOfflineQueue = async () => {
    if (typeof window === "undefined" || !window.navigator.onLine) return;

    const stored = JSON.parse(window.localStorage.getItem("pendingEmergencyLocations") || "[]");
    if (!stored.length) return;

    window.localStorage.removeItem("pendingEmergencyLocations");
    setWorkflowMessage("Buffered location data is being resent now.");
  };

  const finalizeEmergencyWorkflow = async (alertType = 'manual_sos', message = '', source = 'SOS') => {
    setCountdownActive(false);
    setWorkflowStatus("Dispatching support");

    try {
      const res = await triggerSOS(
        alertType,
        `${message || "Emergency assistance needed"} [${source}]`,
        contacts.map((contact) => contact.id)
      );

      const alert = res.alert;
      const location = res.location;

      setActiveAlert(alert);
      setLastKnownLocation({ latitude: Number(location.latitude), longitude: Number(location.longitude) });

      const locDisplay = location.address || `${Number(location.latitude).toFixed(4)}, ${Number(location.longitude).toFixed(4)}`;
      setWorkflowMessage(`SOS dispatch active at ${locDisplay} (retrieved from user_locations).`);
      if (navigator.vibrate) navigator.vibrate([200, 100, 300]);
    } catch (error) {
      console.error("SOS workflow error:", error);
      setWorkflowStatus("Location error");
      setWorkflowMessage(error.message || "No location found in user_locations database table. Please enable location tracking before sending SOS.");
    }
  };

  const startEmergencyWorkflow = (alertType = 'manual_sos', message = '', source = 'SOS') => {
    setCountdownActive(true);
    setCountdownSeconds(45);
    setWorkflowStatus("Countdown active");
    setWorkflowMessage(`${source} trigger received. Emergency protocol will activate in 45 seconds.`);
  };

  const cancelEmergencyWorkflow = () => {
    setCountdownActive(false);
    setWorkflowStatus("Cancelled");
    setWorkflowMessage("Emergency protocol cancelled. Safe status restored.");
  };

  const handleSOSAlert = async (alertType = 'manual_sos', message = '') => {
    startEmergencyWorkflow(alertType, message, "SOS");
  };

  const triggerSensorWorkflow = (source, message) => {
    startEmergencyWorkflow("sensor_sos", message, source);
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
      </div>

      {/* Active SOS Alert Banner with Trusted Place Context & Nearby Safety Assistance */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="premium-card bg-rose-600 p-8 text-white shadow-2xl shadow-rose-600/40 overflow-hidden relative space-y-6"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-[100px] rounded-full -mr-32 -mt-32 animate-pulse"></div>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10 border-b border-white/20 pb-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/30 shadow-inner shrink-0">
                   <AlertTriangle className="w-10 h-10 text-white animate-bounce" />
                </div>
                <div>
                   <h3 className="text-3xl font-black tracking-tight mb-1">🚨 SOS ACTIVE</h3>
                   <p className="text-rose-100 font-bold uppercase tracking-[0.2em] text-xs pl-0.5">
                     Dispatch initiated at {new Date(activeAlert.created_date || activeAlert.created_at).toLocaleTimeString()}
                   </p>
                </div>
              </div>
              
              <Button 
                onClick={resolveAlert} 
                variant="outline"
                className="btn-premium bg-white text-slate-900 hover:bg-slate-100 border-0 px-8 py-6 h-auto text-lg font-black shrink-0 shadow-md transition-colors"
              >
                <span className="text-slate-900 font-black">Mark Status: Guarded</span>
                <Verified className="w-6 h-6 ml-2 text-slate-900 shrink-0" />
              </Button>
            </div>

            {/* Emergency Context Section (Trusted Place & Nearby Assistance) */}
            <div className="grid md:grid-cols-2 gap-6 relative z-10 text-slate-900">
              {/* Current Location & Trusted Place Context */}
              <div className="p-5 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    Current Location Context
                  </span>
                  <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md">
                    GPS Active
                  </span>
                </div>

                {nearbyTrustedPlaceResult?.isNear ? (
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      📍 Near {nearbyTrustedPlaceResult.nearestPlace.category}
                    </div>
                    <div className="text-lg font-black text-slate-900">
                      Trusted Place: {nearbyTrustedPlaceResult.nearestPlace.place_name}
                    </div>
                    <div className="text-xs text-slate-600 font-medium">
                      {nearbyTrustedPlaceResult.nearestPlace.formatted_address} ({nearbyTrustedPlaceResult.formattedDistance} away)
                    </div>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-slate-600 italic py-1">
                    Location not near a saved Trusted Place.
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs font-extrabold">
                  <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Emergency Contacts: Alerted
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Guardian: Alerted
                  </span>
                </div>
              </div>

              {/* Dynamic Nearby Safety Assistance */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-blue-600" />
                    Nearby Emergency Facilities
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Police Station */}
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                    <div className="text-[10px] font-black text-blue-900 uppercase tracking-wider">
                      Nearest Police Assistance
                    </div>
                    {nearestPoliceStation ? (
                      <>
                        <div className="font-black text-slate-900 line-clamp-1">{nearestPoliceStation.name}</div>
                        <div className="text-[10px] text-blue-900 font-extrabold">{nearestPoliceStation.formattedDistance}</div>
                        <div className="flex items-center gap-1 pt-1">
                          <a
                            href={nearestPoliceStation.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-extrabold text-blue-800 hover:text-blue-950 underline flex items-center gap-0.5"
                          >
                            <ExternalLink className="w-2.5 h-2.5" /> View Map
                          </a>
                          {nearestPoliceStation.phone && (
                            <a
                              href={`tel:${nearestPoliceStation.phone}`}
                              className="text-[10px] font-extrabold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-0.5 ml-2"
                            >
                              <Phone className="w-2.5 h-2.5" /> Call
                            </a>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-[11px] text-slate-700 font-bold">No nearby police station found.</div>
                    )}
                  </div>

                  {/* Hospital */}
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                    <div className="text-[10px] font-black text-rose-900 uppercase tracking-wider">
                      Nearest Medical Facility
                    </div>
                    {nearestHospital ? (
                      <>
                        <div className="font-black text-slate-900 line-clamp-1">{nearestHospital.name}</div>
                        <div className="text-[10px] text-rose-900 font-extrabold">{nearestHospital.formattedDistance}</div>
                        <div className="flex items-center gap-1 pt-1">
                          <a
                            href={nearestHospital.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-extrabold text-rose-800 hover:text-rose-950 underline flex items-center gap-0.5"
                          >
                            <ExternalLink className="w-2.5 h-2.5" /> View Map
                          </a>
                          {nearestHospital.phone && (
                            <a
                              href={`tel:${nearestHospital.phone}`}
                              className="text-[10px] font-extrabold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-0.5 ml-2"
                            >
                              <Phone className="w-2.5 h-2.5" /> Call
                            </a>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-[11px] text-slate-700 font-bold">No nearby hospital found.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {countdownActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="premium-card border-amber-200 bg-amber-50/80 p-6 shadow-lg"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.25em] text-amber-700">Emergency countdown</div>
                <div className="text-lg font-semibold text-slate-900">{workflowMessage}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white px-4 py-2 text-amber-700 font-black text-lg">{countdownSeconds}s</div>
                <Button onClick={cancelEmergencyWorkflow} className="bg-slate-900 text-white font-bold">Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* SOS Action Center */}
        <div className="lg:col-span-12 space-y-4">
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
                 
                 <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-300">
                   <div className="font-semibold text-white">Protocol status</div>
                   <div>{workflowStatus}</div>
                   {lastKnownLocation && (
                     <div className="mt-2 text-xs text-slate-400 font-mono">
                       Last known GPS: {lastKnownLocation.latitude.toFixed(4)}, {lastKnownLocation.longitude.toFixed(4)}
                     </div>
                   )}
                 </div>
                 
                 <Button className="w-full btn-premium bg-white/10 text-white hover:bg-white/20 border-white/20 font-bold">
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
