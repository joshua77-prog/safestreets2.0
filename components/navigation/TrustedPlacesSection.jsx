import React, { useState } from "react";
import { 
  Plus, 
  MapPin, 
  Edit2, 
  Trash2, 
  Home, 
  GraduationCap, 
  Building2, 
  Briefcase, 
  Users, 
  Heart,
  Shield,
  AlertTriangle,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Card } from "../ui/card.jsx";
import { Button } from "../ui/button.jsx";

const CATEGORY_ICONS = {
  Home: Home,
  College: GraduationCap,
  School: Building2,
  Work: Briefcase,
  "Friend's House": Users,
  "Relative's House": Heart,
  Other: MapPin,
};

export default function TrustedPlacesSection({
  trustedPlaces = [],
  loading = false,
  selectedPlaceId = null,
  onSelectPlace,
  onAddClick,
  onEditClick,
  onDeleteClick
}) {
  const [deleteConfirmPlace, setDeleteConfirmPlace] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteConfirmPlace) return;
    setDeleting(true);
    try {
      await onDeleteClick(deleteConfirmPlace.id);
      setDeleteConfirmPlace(null);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="premium-card glass border-white/60 shadow-2xl p-6 sm:p-8 bg-white/40 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase tracking-[0.2em] text-xs mb-1.5">
            <Shield className="w-4 h-4" />
            Safety Anchors
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Trusted Places</h2>
          <p className="text-xs text-slate-600 font-semibold mt-1">
            Save places you visit frequently for quicker navigation and better emergency location context.
          </p>
        </div>

        <Button
          onClick={onAddClick}
          className="btn-premium btn-primary rounded-2xl font-bold px-5 py-3 text-sm flex items-center gap-2 shrink-0 h-auto shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add Trusted Place</span>
        </Button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Loading trusted places...</p>
        </div>
      ) : trustedPlaces.length === 0 ? (
        /* Empty State */
        <div className="py-12 px-6 rounded-3xl bg-slate-50/80 border-2 border-dashed border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <MapPin className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-black text-slate-900">No trusted places added yet.</h3>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
              Save places you frequently visit for quicker access during navigation and instant location context during emergencies.
            </p>
          </div>
          <Button
            onClick={onAddClick}
            variant="outline"
            className="rounded-2xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-extrabold px-6 py-2.5 text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Trusted Place
          </Button>
        </div>
      ) : (
        /* Places List Cards */
        <div className="grid sm:grid-cols-2 gap-4">
          {trustedPlaces.map((place) => {
            const CatIcon = CATEGORY_ICONS[place.category] || MapPin;
            const isSelected = selectedPlaceId === place.id;

            return (
              <div
                key={place.id}
                onClick={() => onSelectPlace?.(place)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between gap-4 group relative ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-xl scale-[1.01]"
                    : "bg-white/80 border-slate-200/80 hover:border-emerald-300 hover:shadow-md hover:bg-white"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                        isSelected ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-800 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                      }`}>
                        <CatIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`font-black text-base leading-tight ${isSelected ? "text-white" : "text-slate-900"}`}>
                          {place.place_name}
                        </h4>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-emerald-400" : "text-slate-500"}`}>
                          {place.category}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-lg flex items-center gap-1 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </div>

                  <p className={`text-xs font-medium line-clamp-2 ${isSelected ? "text-slate-300" : "text-slate-600"}`}>
                    {place.formatted_address}
                  </p>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100/20" onClick={(e) => e.stopPropagation()}>
                  <span className={`text-[10px] font-mono ${isSelected ? "text-slate-400" : "text-slate-400"}`}>
                    {Number(place.latitude).toFixed(4)}, {Number(place.longitude).toFixed(4)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditClick(place)}
                      className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                        isSelected
                          ? "bg-white/10 hover:bg-white/20 text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                      title="Edit place"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmPlace(place)}
                      className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                        isSelected
                          ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300"
                          : "bg-rose-50 hover:bg-rose-100 text-rose-600"
                      }`}
                      title="Delete place"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Delete this trusted place?</h3>
                <p className="text-xs text-slate-600 font-semibold mt-1">
                  "{deleteConfirmPlace.place_name}" will be permanently removed from your saved places.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteConfirmPlace(null)}
                className="rounded-2xl border-slate-300 text-slate-700 font-bold px-5 py-2.5"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-2xl px-5 py-2.5 font-bold flex items-center gap-2 shadow-md shadow-rose-200"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
