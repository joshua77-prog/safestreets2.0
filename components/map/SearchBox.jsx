import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input.jsx";
import { searchAddress } from "../../services/geocoding";

export default function SearchBox({
  label,
  value,
  onChange,
  onSelect,
  placeholder = "Search address",
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {loading && <div className="absolute right-3 top-2 text-xs text-slate-500">...</div>}
      </div>
      {suggestions.length > 0 && (
        <div className="border border-slate-200 rounded-lg shadow-sm divide-y divide-slate-100 max-h-56 overflow-auto bg-white">
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
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
            >
              {item.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
