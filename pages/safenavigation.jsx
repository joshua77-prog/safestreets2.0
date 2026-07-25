import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { 
  Navigation, 
  Search, 
  Map as MapIcon, 
  Zap, 
  ShieldCheck, 
  AlertCircle,
  ArrowRight,
  Compass,
  Locate
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import RouteComparison from "../components/navigation/RouteComparison";
import SafetyInsights from "../components/navigation/SafetyInsights";
import MapView from "../components/map/MapView.jsx";
import RouteLayer from "../components/map/RouteLayer.jsx";
import SearchBox from "../components/map/SearchBox.jsx";
import { getFastestRoute, getSafestRoute } from "../services/routing";
import { getCommunityReports, getSafetyData } from "../services/supabaseService";
import { monitorRouteDeviation } from "../services/routeDeviationService";

export default function SafeNavigation() {
  const [origin, setOrigin] = useState({ label: "", coords: null });
  const [destination, setDestination] = useState({ label: "", coords: null });
  const [routes, setRoutes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState("safest");
  const [safetyData, setSafetyData] = useState([]);
  const [communityReports, setCommunityReports] = useState([]);
  const [safetyLoading, setSafetyLoading] = useState(true);
  const [safetyError, setSafetyError] = useState("");
  const [deviationAlert, setDeviationAlert] = useState("");

  useEffect(() => {
    void loadSafetyContext();
  }, []);

  useEffect(() => {
    if (!origin.coords || !destination.coords || !routes?.selectedRoute) return;

    const watchId = navigator.geolocation?.watchPosition(
      (position) => {
        const alert = monitorRouteDeviation([position.coords.latitude, position.coords.longitude], routes?.safest ?? routes?.fastest);
        if (alert?.warning) {
          setDeviationAlert(alert.message);
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );

    return () => navigator.geolocation?.clearWatch(watchId);
  }, [origin.coords, destination.coords, routes]);

  const loadSafetyContext = async () => {
    setSafetyLoading(true);
    setSafetyError("");

    try {
      const [records, reports] = await Promise.all([getSafetyData(), getCommunityReports()]);
      setSafetyData(records);
      setCommunityReports(reports);
    } catch (error) {
      console.error("Failed to load safety context:", error);
      setSafetyError("Unable to load safety data from the live analysis feed.");
    } finally {
      setSafetyLoading(false);
    }
  };

  const handleRouteCalculation = async () => {
    if (!origin.coords || !destination.coords) return;
    setLoading(true);

    try {
      const safetyContext = {
        safetyData,
        communityReports,
      };

      const [fastestRoute, safestRoute] = await Promise.all([
        getFastestRoute(origin, destination, safetyContext),
        getSafestRoute(origin, destination, safetyContext),
      ]);

      setRoutes({
        fastest: fastestRoute,
        safest: safestRoute,
      });
    } catch (error) {
      console.error("Routing error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFastestRoute = () => {
    const proceed = window.confirm(
      "⚠️ PREDICTIVE WARNING\n\nThis route traverses areas with significantly higher incident rates.\n\nOur recommendation: Use the Safest Route.\n\nProceed anyway?"
    );
    if (proceed) setSelectedRoute("fastest");
  };

  const startNavigation = () => {
    const routeName = selectedRoute === "safest" ? "Safest" : "Fastest";
    alert(`Initiating ${routeName} Protocol. Navigation active.`);
  };

  const emptyStateLabel = useMemo(() => {
    if (safetyLoading) return "Loading live safety data...";
    if (safetyError) return safetyError;
    if (safetyData.length === 0) return "No safety history is available yet for this route.";
    return "";
  }, [safetyData.length, safetyError, safetyLoading]);

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/50">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase tracking-[0.2em] text-xs mb-3">
            <Compass className="w-4 h-4" />
            Strategic Routing
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Safe <span className="gradient-text">Navigation</span>
          </h1>
        </div>
        {!routes && (
          <div className="hidden md:flex items-center gap-3 glass px-5 py-2.5 rounded-2xl text-slate-500 font-medium border-white/60">
            <Locate className="w-4 h-4 text-emerald-500" />
            Real-time positioning active
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Left Side: Controls & Insights */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="premium-card glass border-white/60 shadow-2xl p-8 bg-white/40">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Destination Setup</h3>
              </div>
              
              <div className="space-y-4">
                <div className="relative group">
                   <SearchBox
                    label="Current Origin"
                    value={origin.label}
                    onChange={(val) => setOrigin({ label: val, coords: origin.coords })}
                    onSelect={(sel) => setOrigin(sel)}
                    placeholder="Auto-detected location"
                  />
                </div>
                
                <div className="flex justify-center -my-2 relative z-10">
                   <div className="w-8 h-8 rounded-full glass border-emerald-100 flex items-center justify-center text-emerald-600">
                      <ArrowRight className="w-4 h-4 transform rotate-90" />
                   </div>
                </div>

                <div className="relative group">
                  <SearchBox
                    label="Final Destination"
                    value={destination.label}
                    onChange={(val) => setDestination({ label: val, coords: destination.coords })}
                    onSelect={(sel) => setDestination(sel)}
                    placeholder="Where are you heading?"
                  />
                </div>
              </div>

              <Button 
                onClick={handleRouteCalculation} 
                className="w-full btn-premium btn-primary py-4 text-lg mt-4 h-auto"
                disabled={loading || !origin.coords || !destination.coords}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Synthesizing Routes...
                  </>
                ) : (
                  <>
                    Calculate Guarded Path
                    <Zap className="w-5 h-5 fill-white" />
                  </>
                )}
              </Button>

              {emptyStateLabel && (
                <div className="rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-3 text-sm text-slate-600">
                  {emptyStateLabel}
                </div>
              )}

              {deviationAlert && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  {deviationAlert}
                </div>
              )}
            </div>
          </Card>

          <AnimatePresence>
            {routes && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <RouteComparison 
                  routes={routes}
                  selectedRoute={selectedRoute}
                  onRouteSelect={setSelectedRoute}
                />
                <SafetyInsights routes={routes} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Map Feature */}
        <div className="lg:col-span-7">
          <Card className="premium-card overflow-hidden shadow-2xl border-0 h-full flex flex-col min-h-[500px]">
            <div className="p-8 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <MapIcon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">Intelligence Map</h3>
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest pl-11">
                  Red: Vulnerable Path | Green: Guarded Path
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={startNavigation} 
                  className="btn-premium bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-lg shadow-emerald-500/20"
                  disabled={!routes}
                >
                  Start Mission
                  <Navigation className="w-4 h-4 fill-white" />
                </Button>
              </div>
            </div>

            <CardContent className="p-0 flex-grow relative">
              <div className="absolute inset-0 grayscale-[0.2] contrast-[1.1]">
                <MapView
                  center={origin.coords || [12.9716, 77.5946]}
                  zoom={14}
                  from={origin.coords}
                  to={destination.coords}
                  safetyData={safetyData}
                  communityReports={communityReports}
                >
                  <RouteLayer
                    fastestRoute={routes?.fastest?.path}
                    safestRoute={routes?.safest?.path}
                    safetyData={safetyData}
                    selectedRoute={selectedRoute}
                  />
                </MapView>
              </div>
              
              {/* Floating Controls Overlay */}
              <div className="absolute bottom-6 right-6 flex flex-col gap-3">
                 <button className="w-12 h-12 glass-dark rounded-xl flex items-center justify-center text-white hover:scale-110 transition-transform shadow-2xl">
                    <Locate className="w-5 h-5" />
                 </button>
                 <div className="flex flex-col gap-1 glass-dark rounded-xl p-1 text-white shadow-2xl">
                    <button className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg font-bold">+</button>
                    <div className="h-[1px] bg-white/10 mx-2"></div>
                    <button className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg font-bold">-</button>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

 


