import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Navigation, 
  MapPin, 
  Route,
  Clock,
  AlertTriangle,
  Shield,
  ChevronRight,
  Zap,
  Heart
} from "lucide-react";
import { motion } from "framer-motion";

import RouteComparison from "../components/navigation/RouteComparison";
import LocationInput from "../components/navigation/LocationInput";

export default function SafeNavigation() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [routes, setRoutes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState("safe");

  const handleRouteCalculation = async () => {
    if (!origin || !destination) return;
    
    setLoading(true);
    // Simulate route calculation
    setTimeout(() => {
      setRoutes({
        fastest: {
          duration: "12 mins",
          distance: "2.1 km",
          safetyScore: 65,
          warnings: ["Poorly lit area", "High crime zone"],
          path: "Main St → Oak Ave → Commerce Dr"
        },
        safest: {
          duration: "16 mins", 
          distance: "2.8 km",
          safetyScore: 92,
          warnings: [],
          path: "Green Park Way → University Ave → Safe Harbor St"
        }
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Safe Navigation</h1>
        <p className="text-slate-600">Choose the safest route to your destination</p>
      </motion.div>

      {/* Location Inputs */}
      <LocationInput 
        origin={origin}
        destination={destination}
        onOriginChange={setOrigin}
        onDestinationChange={setDestination}
        onCalculateRoute={handleRouteCalculation}
        loading={loading}
      />

      {/* Route Comparison */}
      {routes && (
        <RouteComparison 
          routes={routes}
          selectedRoute={selectedRoute}
          onRouteSelect={setSelectedRoute}
        />
      )}
    </div>
  );
}