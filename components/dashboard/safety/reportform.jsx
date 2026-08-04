import React, { useState } from "react";
import { Button } from "../../../components/ui/button.jsx";
import { Input } from "../../../components/ui/input.jsx";
import { Label } from "../../../components/ui/label.jsx";
import { Textarea } from "../../../components/ui/textarea.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select.jsx";
import { 
  MapPin, 
  Star,
  Shield,
  X,
  Send,
  Zap,
  Target,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../src/lib/supabase";

const POSITIVE_REPORTS = [
  "Brightly Lit Street",
  "Busy Area",
  "High Foot Traffic",
  "Guarded Premises",
  "Active Commercial Area",
  "Police Patrol",
  "CCTV Coverage",
  "Residential Area",
  "Active Nightlife",
  "Other"
];

const NEGATIVE_REPORTS = [
  "Harassment",
  "Theft / Pickpocketing",
  "Poor Lighting",
  "Reckless Driving",
  "Stray Animal Threat",
  "Road Hazard",
  "Suspicious Activity",
  "Assault / Violence",
  "Drunk People",
  "Isolated Area",
  "Other"
];

const TIME_OPTIONS = [
  { value: "morning", label: "Morning (6AM - 12PM)" },
  { value: "afternoon", label: "Afternoon (12PM - 5PM)" },
  { value: "evening", label: "Evening (5PM - 9PM)" },
  { value: "night", label: "Night (9PM - 2AM)" },
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

  const [positiveSelection, setPositiveSelection] = useState("");
  const [negativeSelection, setNegativeSelection] = useState("");
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [customReportText, setCustomReportText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [supabaseError, setSupabaseError] = useState("");

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            location: "G-POS Locked: " + position.coords.latitude.toFixed(4) + ", " + position.coords.longitude.toFixed(4)
          }));
        },
        (error) => {
           console.error("Location lock failed:", error);
        }
      );
    }
  };

  const handlePositiveSelect = (val) => {
    setPositiveSelection(val);
    setNegativeSelection("");
    if (val === "Other") {
      setIsOtherSelected(true);
      setFormData(prev => ({ ...prev, report_type: customReportText.trim() || "Other" }));
    } else {
      setIsOtherSelected(false);
      setFormData(prev => ({ ...prev, report_type: val }));
    }
  };

  const handleNegativeSelect = (val) => {
    setNegativeSelection(val);
    setPositiveSelection("");
    if (val === "Other") {
      setIsOtherSelected(true);
      setFormData(prev => ({ ...prev, report_type: customReportText.trim() || "Other" }));
    } else {
      setIsOtherSelected(false);
      setFormData(prev => ({ ...prev, report_type: val }));
    }
  };

  const handleCustomTextChange = (e) => {
    const text = e.target.value;
    setCustomReportText(text);
    setFormData(prev => ({ ...prev, report_type: text.trim() || "Other" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");
    setSupabaseError("");
    setSuccessMessage("");

    const reportType = positiveSelection ? "Positive Report" : negativeSelection ? "Negative Report" : "";
    const category = positiveSelection
      ? (positiveSelection === "Other" ? customReportText.trim() : positiveSelection)
      : negativeSelection
      ? (negativeSelection === "Other" ? customReportText.trim() : negativeSelection)
      : "";

    if (!reportType) {
      setValidationError("Report type is required. Please select a Positive Report or Negative Report category.");
      return;
    }

    if (!category) {
      setValidationError("Category is required. Please select a valid report category.");
      return;
    }

    if (formData.latitude === null || formData.latitude === undefined || isNaN(Number(formData.latitude))) {
      setValidationError("Latitude coordinate is missing. Please click the target icon to lock your position.");
      return;
    }

    if (formData.longitude === null || formData.longitude === undefined || isNaN(Number(formData.longitude))) {
      setValidationError("Longitude coordinate is missing. Please click the target icon to lock your position.");
      return;
    }

    if (!formData.time_of_day) {
      setValidationError("Time cycle is required. Please select a time cycle.");
      return;
    }

    if (!formData.safety_rating) {
      setValidationError("Safety rating is required. Please select a rating (1-5).");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("Supabase authentication error:", authError);
        setSupabaseError("User authentication failed. Please make sure you are logged in.");
        setSubmitting(false);
        return;
      }

      const timeCycleMap = {
        morning: "Morning",
        afternoon: "Afternoon",
        evening: "Evening",
        night: "Night",
        late_night: "Critical Hours",
        Morning: "Morning",
        Afternoon: "Afternoon",
        Evening: "Evening",
        Night: "Night",
        "Critical Hours": "Critical Hours"
      };

      const payload = {
        user_id: user.id,
        report_type: reportType,
        category: category,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        time_cycle: timeCycleMap[formData.time_of_day] || formData.time_of_day,
        safety_rating: Number(formData.safety_rating),
        intelligence_briefing: formData.description || "",
      };

      const { data: insertedData, error: insertError } = await supabase
        .from("community_reports")
        .insert(payload)
        .select()
        .single();

      if (insertError) {
        console.error("Supabase error inserting into community_reports table:", insertError);
        setSupabaseError("Unable to save report to database: " + (insertError.message || "Unknown Supabase error"));
        setSubmitting(false);
        return;
      }

      console.log("Report stored in community_reports table successfully:", insertedData);

      setSuccessMessage("Observation report saved successfully!");

      setFormData({
        location: "",
        latitude: null,
        longitude: null,
        safety_rating: 3,
        report_type: "",
        description: "",
        time_of_day: ""
      });
      setPositiveSelection("");
      setNegativeSelection("");
      setIsOtherSelected(false);
      setCustomReportText("");

      if (onSubmit) {
        await onSubmit(insertedData || payload);
      }
    } catch (err) {
      console.error("Unexpected error submitting report:", err);
      setSupabaseError("An unexpected error occurred: " + (err.message || "Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="premium-card glass border-white shadow-2xl bg-white/95 backdrop-blur-2xl w-full rounded-3xl overflow-hidden flex flex-col max-h-[85vh] md:max-h-[88vh]">
      {/* Header */}
      <div className="p-5 md:p-6 border-b border-slate-200/50 flex items-center justify-between bg-slate-900 text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
             <h3 className="text-lg font-black tracking-tight">Intelligence Log</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol Entry v4.0</p>
          </div>
        </div>
        <button type="button" onClick={onCancel} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        {/* Scrollable Middle Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          {validationError && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
              <span>{validationError}</span>
            </div>
          )}

          {supabaseError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{supabaseError}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Positional Core */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Positional Core *</Label>
                <div className="relative group">
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Enter sector address..."
                    className="pl-12 py-5 glass border-slate-200 focus:border-emerald-500/50 rounded-2xl transition-all font-bold text-sm"
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

              {/* Safety Index Rating */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Safety Index Rating *</Label>
                <div className="flex items-center gap-2.5">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData({...formData, safety_rating: rating})}
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all ${
                        formData.safety_rating >= rating
                          ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20 scale-105'
                          : 'bg-white/40 border-slate-200 text-slate-300 hover:border-amber-200'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${formData.safety_rating >= rating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* REPORT TYPE * */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Report Type *</Label>
                  {formData.report_type && (
                    <span className="text-[10px] font-bold text-emerald-600 truncate max-w-[180px]">
                      Selected: {formData.report_type}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Positive Reports Dropdown */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" /> Positive Report
                    </span>
                    <Select value={positiveSelection} onValueChange={handlePositiveSelect}>
                      <SelectTrigger className="glass py-4 border-emerald-200 hover:border-emerald-400 rounded-2xl font-bold text-xs">
                        <SelectValue placeholder="Select Positive..." />
                      </SelectTrigger>
                      <SelectContent className="glass">
                        {POSITIVE_REPORTS.map((item) => (
                          <SelectItem key={item} value={item} className="font-bold text-xs text-emerald-800">
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Negative Reports Dropdown */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
                      <ThumbsDown className="w-3 h-3" /> Negative Report
                    </span>
                    <Select value={negativeSelection} onValueChange={handleNegativeSelect}>
                      <SelectTrigger className="glass py-4 border-rose-200 hover:border-rose-400 rounded-2xl font-bold text-xs">
                        <SelectValue placeholder="Select Negative..." />
                      </SelectTrigger>
                      <SelectContent className="glass">
                        {NEGATIVE_REPORTS.map((item) => (
                          <SelectItem key={item} value={item} className="font-bold text-xs text-rose-800">
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Custom Input when "Other" is selected */}
                <AnimatePresence>
                  {isOtherSelected && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-2 space-y-1.5"
                    >
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Edit3 className="w-3 h-3 text-emerald-500" /> Specify Custom Details
                      </Label>
                      <Input
                        type="text"
                        value={customReportText}
                        onChange={handleCustomTextChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                          }
                        }}
                        placeholder="Type custom report detail and press Enter..."
                        className="glass border-emerald-400/60 focus:border-emerald-500 rounded-xl py-3 px-4 font-bold text-xs text-slate-900"
                        autoFocus
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* TIME * */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Time *</Label>
                <Select value={formData.time_of_day} onValueChange={(value) => setFormData({...formData, time_of_day: value})} required>
                  <SelectTrigger className="glass py-4 border-slate-200 rounded-2xl font-bold text-xs">
                    <SelectValue placeholder="Select time cycle..." />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={time.value} value={time.value} className="font-bold text-xs">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {time.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-2 flex flex-col">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Intelligence Briefing</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Log granular details for community synthesis..."
                className="glass border-slate-200 rounded-2xl min-h-[220px] flex-1 p-4 focus:border-emerald-500/50 transition-all font-medium leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Fixed Action Footer */}
        <div className="p-4 md:p-5 bg-slate-50/90 border-t border-slate-200/60 shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-5 rounded-xl border border-slate-200 text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-colors"
            >
              Abort Entry
            </button>
            <Button
              type="submit"
              disabled={submitting || !formData.location || !formData.report_type || !formData.time_of_day}
              className="flex-[2] btn-premium btn-primary py-3.5 h-auto shadow-xl shadow-emerald-500/20"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Synchronizing...
                </>
              ) : (
                <>
                  Transmit Observation
                  <Send className="w-4 h-4 fill-white" />
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
             <Shield className="w-3.5 h-3.5 text-emerald-500" />
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">End-to-End Cryptographic Security Active</span>
          </div>
        </div>
      </form>
    </div>
  );
}