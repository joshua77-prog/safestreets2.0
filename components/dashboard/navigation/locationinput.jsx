import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Navigation, 
  MapPin, 
  Crosshair,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";

export default function LocationInput({ 
  origin, 
  destination, 
  onOriginChange, 
  onDestinationChange, 
  onCalculateRoute, 
  loading 
}) {
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onOriginChange("Current Location");
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-500" />
            Plan Your Route
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin" className="text-sm font-medium">From</Label>
              <div className="flex gap-2">
                <Input
                  id="origin"
                  placeholder="Enter starting point"
                  value={origin}
                  onChange={(e) => onOriginChange(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={getCurrentLocation}
                  className="shrink-0"
                >
                  <Crosshair className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="destination" className="text-sm font-medium">To</Label>
              <Input
                id="destination"
                placeholder="Enter destination"
                value={destination}
                onChange={(e) => onDestinationChange(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={onCalculateRoute}
            disabled={!origin || !destination || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 font-medium"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Calculating Routes...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Find Safe Routes
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}