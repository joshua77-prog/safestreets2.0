import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input.jsx";
import { searchAddress } from "../../services/geocoding";
import { Locate } from "lucide-react";

export default function SearchBox({
  label,
  value,
  onChange,
  onSelect,
  placeholder = "Search address",
  headerRight,
  onSelectLive,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchSuggestions = async () => {
      if (!value || value.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      const results = await searchAddress(value.trim());
      if (active) {
        setSuggestions(results || []);
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchSuggestions, 250);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [value]);

  const showDropdown = suggestions.length > 0 || (isFocused && onSelectLive && !value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
        {headerRight}
      </div>
      <div className="relative">
        <Input
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {loading && <div className="absolute right-3 top-2.5 text-xs text-slate-400 animate-pulse">Searching...</div>}
      </div>
      {showDropdown && (
        <div className="border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100 max-h-56 overflow-auto bg-white/95 backdrop-blur-md z-50 relative">
          {onSelectLive && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelectLive();
                setSuggestions([]);
              }}
              className="w-full text-left px-3.5 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition-colors border-b border-slate-100"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
              </span>
              Use Current Live Location
            </button>
          )}
          {suggestions.map((item) => (
            <button
              key={`${item.place_id}`}
              type="button"
              onClick={() => {
                onSelect({
                  label: item.display_name,
                  coords: [parseFloat(item.lat), parseFloat(item.lon)],
                });
                setSuggestions([]);
              }}
              className="w-full text-left px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {item.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
