import React, { useState } from "react";
import { Button } from "../../../components/ui/button.jsx";
import { Input } from "../../../components/ui/input.jsx";
import { Label } from "../../../components/ui/label.jsx";
import { Textarea } from "../../../components/ui/textarea.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select.jsx";
import { 
  MapPin, 
  Star,
  AlertTriangle,
  Shield,
  X,
  Send,
  Sparkles,
  Zap,
  Target,
  Navigation,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";

const REPORT_TYPES = [
  { value: "incident", label: "Critical Incident", color: "rose", icon: AlertTriangle },
  { value: "safe_zone", label: "Guarded Zone", color: "emerald", icon: Shield },
  { value: "poor_lighting", label: "Luminosity Alert", color: "amber", icon: Activity },
  { value: "suspicious_activity", label: "Anomalous Activity", color: "rose", icon: AlertTriangle },
  { value: "police_presence", label: "Force Presence", color: "indigo", icon: Shield },
  { value: "well_lit", label: "Photon Optimized", color: "emerald", icon: Sparkles },
  { value: "busy_area", label: "High Volume", color: "blue", icon: Activity },
];

const TIME_OPTIONS = [
  { value: "morning", label: "Morning Operations" },
  { value: "afternoon", label: "Midday Interval" },
  { value: "evening", label: "Evening Shift" },
  { value: "night", label: "Night Cycle" },
  { value: "late_night", label: "Critical Hours (2AM - 6AM)" },
];

export default function ReportForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    location: "",
    latitude: null,
    longitude: null,
    safety_rating: 3,
    report_type: "",
    description: "",
    time_of_day: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            location: "G-POS Locked: " + position.coords.latitude.toFixed(4) + ", " + position.coords.longitude.toFixed(4)
          });
        },
        (error) => {
           console.error("Location lock failed:", error);
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location || !formData.report_type || !formData.time_of_day) return;
    
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedReportType = REPORT_TYPES.find(type => type.value === formData.report_type);

  return (
    <div className="premium-card glass overflow-hidden border-white shadow-2xl bg-white/60">
      <div className="p-8 border-b border-slate-200/50 flex items-center justify-between bg-slate-900 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
             <h3 className="text-xl font-black tracking-tight">Intelligence Log</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol Entry v4.0</p>
          </div>
        </div>
        <button onClick={onCancel} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Positional Core *</Label>
                <div className="relative group">
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Enter sector address..."
                    className="pl-12 py-6 glass border-white/80 focus:border-emerald-500/50 rounded-2xl transition-all font-bold"
                    required
                  />
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <Target className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Safety Index Rating *</Label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData({...formData, safety_rating: rating})}
                      className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${
                        formData.safety_rating >= rating
                          ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20 scale-110'
                          : 'bg-white/20 border-white/80 text-slate-300 hover:border-amber-200'
                      }`}
                    >
                      <Star className={`w-6 h-6 ${formData.safety_rating >= rating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Protocol Type *</Label>
                    <Select value={formData.report_type} onValueChange={(value) => setFormData({...formData, report_type: value})} required>
                      <SelectTrigger className="glass py-6 border-white/80 rounded-2xl font-bold">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="glass">
                        {REPORT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="font-bold">
                            <div className="flex items-center gap-2">
                              <type.icon className={`w-4 h-4 text-${type.color}-500`} />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
                 
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Observation Phase *</Label>
                    <Select value={formData.time_of_day} onValueChange={(value) => setFormData({...formData, time_of_day: value})} required>
                      <SelectTrigger className="glass py-6 border-white/80 rounded-2xl font-bold">
                        <SelectValue placeholder="Select cycle" />
                      </SelectTrigger>
                      <SelectContent className="glass">
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time.value} value={time.value} className="font-bold">
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Intelligence Briefing</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Log granular details for community synthesis..."
                className="glass border-white/80 rounded-2xl min-h-[220px] p-6 focus:border-emerald-500/50 transition-all font-medium leading-relaxed"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200/50">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-4 px-6 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-colors"
            >
              Abort Entry
            </button>
            <Button
              type="submit"
              disabled={submitting || !formData.location || !formData.report_type || !formData.time_of_day}
              className="flex-[2] btn-premium btn-primary py-4 h-auto shadow-2xl shadow-emerald-500/20"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Synchronizing...
                </>
              ) : (
                <>
                  Transmit Observation
                  <Send className="w-5 h-5 fill-white" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
      
      <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-3">
         <Shield className="w-4 h-4 text-emerald-500" />
         <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">End-to-End Cryptographic Security Active</span>
      </div>
    </div>
  );
}