import React, { useState, useEffect } from "react";
import { 
  X, 
  MapPin, 
  Search, 
  Locate, 
  Loader2, 
  Home, 
  GraduationCap, 
  Building2, 
  Briefcase, 
  Users, 
  Heart, 
  AlertCircle 
} from "lucide-react";
import { searchAddress, reverseGeocode } from "../../services/geocoding.js";
import { Button } from "../ui/button.jsx";
import { Input } from "../ui/input.jsx";

const CATEGORIES = [
  { value: "Home", label: "Home", icon: Home },
  { value: "College", label: "College", icon: GraduationCap },
  { value: "School", label: "School", icon: Building2 },
  { value: "Work", label: "Work", icon: Briefcase },
  { value: "Friend's House", label: "Friend's House", icon: Users },
  { value: "Relative's House", label: "Relative's House", icon: Heart },
  { value: "Other", label: "Other", icon: MapPin },
];

export default function AddEditTrustedPlaceModal({
  isOpen,
  onClose,
  onSave,
  editingPlace = null,
  userLocation = null
}) {
  const [placeName, setPlaceName] = useState("");
  const [category, setCategory] = useState("Home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [formattedAddress, setFormattedAddress] = useState("");
  
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locatingCurrent, setLocatingCurrent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (editingPlace) {
      setPlaceName(editingPlace.place_name || "");
      setCategory(editingPlace.category || "Home");
      setFormattedAddress(editingPlace.formatted_address || "");
      setSearchQuery(editingPlace.formatted_address || "");
      setSelectedCoords([Number(editingPlace.latitude), Number(editingPlace.longitude)]);
    } else {
      setPlaceName("");
      setCategory("Home");
      setFormattedAddress("");
      setSearchQuery("");
      setSelectedCoords(null);
    }
    setSuggestions([]);
    setErrorMessage("");
  }, [editingPlace, isOpen]);

  if (!isOpen) return null;

  // Handle location search debounced
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setFormattedAddress(val);
    setErrorMessage("");

    if (val.trim().length >= 3) {
      setSearching(true);
      try {
        const results = await searchAddress(val);
        setSuggestions(results.slice(0, 5));
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (sug) => {
    const lat = Number(sug.lat);
    const lon = Number(sug.lon);
    setSelectedCoords([lat, lon]);
    setFormattedAddress(sug.display_name);
    setSearchQuery(sug.display_name);
    setSuggestions([]);
  };

  // Handle "Use Current Location"
  const handleUseCurrentLocation = () => {
    setErrorMessage("");
    setLocatingCurrent(true);

    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser.");
      setLocatingCurrent(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setSelectedCoords([lat, lon]);

        const addr = await reverseGeocode(lat, lon);
        const resolvedAddress = addr || `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
        setFormattedAddress(resolvedAddress);
        setSearchQuery(resolvedAddress);
        setLocatingCurrent(false);
      },
      (err) => {
        console.warn("Location permission error:", err);
        setErrorMessage("Location permission was not granted. You can search for your location manually.");
        setLocatingCurrent(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!placeName.trim()) {
      setErrorMessage("Please enter a name for this place.");
      return;
    }
    if (!selectedCoords || !formattedAddress.trim()) {
      setErrorMessage("Please select a valid location from suggestions or use current location.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      await onSave({
        id: editingPlace?.id,
        place_name: placeName.trim(),
        category,
        formatted_address: formattedAddress.trim(),
        latitude: selectedCoords[0],
        longitude: selectedCoords[1]
      });
      onClose();
    } catch (err) {
      console.error("Save error:", err);
      setErrorMessage(err.message || "Failed to save trusted place. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight">
              {editingPlace ? "Edit Trusted Place" : "Add Trusted Place"}
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Save frequently visited locations for navigation & emergency context
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-grow">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Place Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Place Name
            </label>
            <Input
              type="text"
              placeholder="e.g. My Apartment, Campus, Office"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              className="rounded-2xl border-slate-200 focus:border-slate-900 text-base"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const CatIcon = cat.icon;
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all text-left ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <CatIcon className={`w-4 h-4 ${isSelected ? "text-emerald-400" : "text-slate-500"}`} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Search & Current Location */}
          <div className="space-y-2 relative">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Location
              </label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locatingCurrent}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors cursor-pointer"
              >
                {locatingCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Locate className="w-3.5 h-3.5" />
                )}
                <span>Use Current Location</span>
              </button>
            </div>

            <div className="relative">
              <Input
                type="text"
                placeholder="Search for address, landmark or college..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="rounded-2xl border-slate-200 pl-10 pr-4 text-base"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searching && (
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(sug)}
                    className="w-full text-left p-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 flex items-start gap-2.5"
                  >
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{sug.display_name.split(",")[0]}</div>
                      <div className="text-[11px] text-slate-500 font-medium line-clamp-1">{sug.display_name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedCoords && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{formattedAddress}</span>
                </div>
                <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-mono px-2 py-0.5 rounded-lg shrink-0 ml-2">
                  {selectedCoords[0].toFixed(4)}, {selectedCoords[1].toFixed(4)}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-2xl border-slate-300 text-slate-700 font-bold px-6 py-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !selectedCoords || !placeName.trim()}
              className="btn-premium btn-primary rounded-2xl px-6 py-3 font-bold flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Place...</span>
                </>
              ) : (
                <span>Save Place</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
