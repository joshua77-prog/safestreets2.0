import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const SelectContext = createContext(null);

export function Select({ value, onValueChange, children, required }) {
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, selectedLabel, setSelectedLabel }}>
      <div ref={containerRef} className="relative inline-block w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className = "" }) {
  const context = useContext(SelectContext);
  if (!context) return null;
  const { open, setOpen } = context;

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`w-full flex items-center justify-between px-4 py-3 bg-white/80 border border-slate-200 rounded-xl font-semibold text-slate-800 hover:border-emerald-500/50 transition-colors outline-none focus:ring-2 focus:ring-emerald-500/20 ${className}`}
    >
      <div className="flex items-center gap-2 overflow-hidden text-left truncate flex-1">
        {children}
      </div>
      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-emerald-500' : ''}`} />
    </button>
  );
}

export function SelectValue({ placeholder = "Select...", className = "" }) {
  const context = useContext(SelectContext);
  const selectedLabel = context?.selectedLabel;
  const value = context?.value;

  if (selectedLabel && value) {
    return <span className={`truncate text-slate-900 ${className}`}>{selectedLabel}</span>;
  }

  return <span className={`text-slate-400 truncate ${className}`}>{placeholder}</span>;
}

export function SelectContent({ children, className = "" }) {
  const context = useContext(SelectContext);
  if (!context || !context.open) return null;

  return (
    <div
      className={`absolute left-0 right-0 top-full mt-2 z-50 max-h-60 overflow-y-auto rounded-2xl bg-white/95 backdrop-blur-xl p-2 shadow-2xl border border-slate-200/80 animate-in fade-in-50 zoom-in-95 ${className}`}
      style={{ pointerEvents: 'auto' }}
    >
      {children}
    </div>
  );
}

export function SelectItem({ value, children, className = "" }) {
  const context = useContext(SelectContext);
  if (!context) return null;
  const { value: selectedValue, onValueChange, setOpen, setSelectedLabel } = context;
  const isSelected = selectedValue === value;

  useEffect(() => {
    if (isSelected) {
      setSelectedLabel(children);
    }
  }, [isSelected, children]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (onValueChange) {
      onValueChange(value);
    }
    setSelectedLabel(children);
    setOpen(false);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center justify-between px-3 py-2.5 my-0.5 rounded-xl cursor-pointer text-sm font-semibold transition-colors ${
        isSelected
          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
          : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
      } ${className}`}
    >
      {children}
    </div>
  );
}


