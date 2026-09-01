import React, { useState } from "react";
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Calculator, 
  Info,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SafetyScoreCard({ scoreResult }) {
  const [showCalculationSummary, setShowCalculationSummary] = useState(false);

  if (!scoreResult) return null;

  const {
    finalScore = 100,
    safetyLevel = "Safe",
    safetyBadge = "🟢 Safe",
    baseScore = 100,
    historicalRisk = 0,
    historicalRiskDisplay = 0,
    communityRisk = 0,
    communityRiskDisplay = 0,
    totalRisk = 0,
    densityMultiplier = 1.0,
    historicalRecordsCount = 0,
    communityReportsCount = 0,
    topPositiveFactors = [],
    topNegativeFactors = [],
    totalDangerPenalty = scoreResult.totalDangerPenalty ?? scoreResult.dangerPenalty ?? 0,
    summary = {}
  } = scoreResult;

  const getScoreColorClasses = () => {
    if (finalScore >= 90) return { bg: "bg-emerald-500", text: "text-emerald-600", border: "border-emerald-200", lightBg: "bg-emerald-50" };
    if (finalScore >= 75) return { bg: "bg-emerald-600", text: "text-emerald-600", border: "border-emerald-200", lightBg: "bg-emerald-50" };
    if (finalScore >= 60) return { bg: "bg-amber-500", text: "text-amber-600", border: "border-amber-200", lightBg: "bg-amber-50" };
    if (finalScore >= 40) return { bg: "bg-orange-500", text: "text-orange-600", border: "border-orange-200", lightBg: "bg-orange-50" };
    if (finalScore >= 20) return { bg: "bg-rose-600", text: "text-rose-600", border: "border-rose-200", lightBg: "bg-rose-50" };
    return { bg: "bg-red-700", text: "text-red-700", border: "border-red-200", lightBg: "bg-red-50" };
  };

  // Color Coding helper for Risk Cards (0-20 Green, 21-40 Yellow, 41-60 Orange, 61-80 Red, 81-100 Dark Red)
  const getRiskCardStyle = (riskScoreNormalized) => {
    const s = Math.round(Number(riskScoreNormalized) || 0);
    if (s <= 20) return { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", badgeBg: "bg-emerald-600", label: "Low Risk" };
    if (s <= 40) return { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", badgeBg: "bg-amber-600", label: "Moderate Risk" };
    if (s <= 60) return { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", badgeBg: "bg-orange-600", label: "Elevated Risk" };
    if (s <= 80) return { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", badgeBg: "bg-rose-600", label: "High Risk" };
    return { bg: "bg-red-100 border-red-300", text: "text-red-900", badgeBg: "bg-red-800", label: "Critical Risk" };
  };

  const styleClasses = getScoreColorClasses();
  const histRiskStyle = getRiskCardStyle(historicalRiskDisplay);
  const commRiskStyle = getRiskCardStyle(communityRiskDisplay);

  return (
    <div className="space-y-6 mt-10">
      <div className="premium-card glass p-6 md:p-8 border-white/60 bg-white/70 shadow-2xl rounded-3xl">
        {/* Header & Main Score Badge */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-200/60">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${styleClasses.bg} text-white flex items-center justify-center shadow-lg shadow-emerald-500/10`}>
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase tracking-[0.2em] text-[10px]">
                <Sparkles className="w-3.5 h-3.5" />
                Route Safety Engine
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                Route Safety Assessment
              </h2>
            </div>
          </div>

          {/* Score & Level Display */}
          <div className="flex items-center gap-4 bg-slate-900 text-white p-4 rounded-2xl shadow-xl shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Safety Score</span>
              <div className="text-3xl font-black tracking-tight flex items-baseline gap-1">
                <span className="text-emerald-400">{Math.round(finalScore)}</span>
                <span className="text-xs text-slate-400 font-bold">/ 100</span>
              </div>
            </div>

            <div className="h-8 w-[1px] bg-white/20 mx-1"></div>

            <div className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-black uppercase tracking-wider text-white border border-white/20">
              {safetyBadge}
            </div>
          </div>
        </div>

        {/* Risk Metrics Display Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-6">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Base Score</span>
            <span className="text-xl font-black text-slate-900">100</span>
          </div>

          {/* Historical Risk Card with Color Coding */}
          <div className={`p-3.5 rounded-2xl border ${histRiskStyle.bg}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${histRiskStyle.text}`}>Historical Risk</span>
            <span className={`text-xl font-black ${histRiskStyle.text}`}>{historicalRiskDisplay} / 100</span>
          </div>

          {/* Community Risk Card with Color Coding */}
          <div className={`p-3.5 rounded-2xl border ${commRiskStyle.bg}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${commRiskStyle.text}`}>Community Risk</span>
            <span className={`text-xl font-black ${commRiskStyle.text}`}>{communityRiskDisplay} / 100</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Risk</span>
            <span className="text-xl font-black text-rose-600">{totalRisk}</span>
          </div>

          <div className="bg-slate-900 p-3.5 rounded-2xl col-span-2 sm:col-span-1 border border-slate-800 text-white">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Final Score</span>
            <span className="text-xl font-black text-white">{Math.round(finalScore)} / 100</span>
          </div>
        </div>

        {/* Factors Grid */}
        <div className="grid md:grid-cols-2 gap-6 pt-2">
          {/* Top Positive Factors */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Top Positive Factors</span>
            </div>

            {topPositiveFactors.length === 0 ? (
              <p className="text-xs text-slate-500 font-medium italic">No positive markers recorded along this corridor.</p>
            ) : (
              <div className="space-y-2">
                {topPositiveFactors.map((factor, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-bold text-emerald-900 bg-white/80 px-3 py-2 rounded-xl border border-emerald-100 shadow-sm">
                    <span className="text-emerald-600 font-black">{factor}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Negative Factors */}
          <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200/60 space-y-3">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Top Negative Factors</span>
            </div>

            {topNegativeFactors.length === 0 ? (
              <p className="text-xs text-slate-500 font-medium italic">No negative security alerts flagged along this corridor.</p>
            ) : (
              <div className="space-y-2">
                {topNegativeFactors.map((factor, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-bold text-rose-900 bg-white/80 px-3 py-2 rounded-xl border border-rose-100 shadow-sm">
                    <span className="text-rose-600 font-black">{factor}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Calculation Summary Toggle Button */}
        <div className="mt-6 pt-6 border-t border-slate-200/60 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowCalculationSummary(!showCalculationSummary)}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-all border border-slate-200 cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span>{showCalculationSummary ? "Hide Calculation Details" : "Calculation Details"}</span>
            {showCalculationSummary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Info className="w-3.5 h-3.5" />
            <span>Search Radius: 1 km (1000m)</span>
          </div>
        </div>

        {/* Collapsible Calculation Details Drawer */}
        <AnimatePresence>
          {showCalculationSummary && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-slate-200/60 space-y-4"
            >
              <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h4 className="text-base font-bold tracking-tight text-emerald-400 flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      Calculation Details
                    </h4>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Transparent risk breakdown showing raw values and normalized 0–100 display metrics.
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 px-3 py-1 rounded-lg text-slate-300">
                    Risk Engine 2.0
                  </span>
                </div>

                {/* Calculation Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Base Score</span>
                    <span className="text-lg font-black text-white">100</span>
                  </div>

                  <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">Historical Risk</span>
                    <span className="text-lg font-black text-indigo-300">{historicalRisk}</span>
                  </div>

                  <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">Historical Display</span>
                    <span className="text-lg font-black text-indigo-300">{historicalRiskDisplay} / 100</span>
                  </div>

                  <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">Density Multiplier</span>
                    <span className="text-lg font-black text-amber-300">×{densityMultiplier.toFixed(1)}</span>
                  </div>

                  <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">Community Risk</span>
                    <span className="text-lg font-black text-blue-300">{communityRisk}</span>
                  </div>

                  <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">Community Display</span>
                    <span className="text-lg font-black text-blue-300">{communityRiskDisplay} / 100</span>
                  </div>

                  <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">Total Risk</span>
                    <span className="text-lg font-black text-rose-300">{totalRisk}</span>
                  </div>

                  <div className="bg-emerald-500/20 p-3.5 rounded-xl border border-emerald-500/30">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">Final Score</span>
                    <span className="text-lg font-black text-white">{Math.round(finalScore)} / 100</span>
                  </div>
                </div>

                {/* Final Formula Summary */}
                <div className="text-xs text-slate-300 leading-relaxed font-medium bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                  <p>
                    <strong className="text-white">Total Risk Formula:</strong> (Historical Risk {historicalRisk} × 0.4) + (Community Risk {communityRisk} × 0.6){totalDangerPenalty > 0 ? ` + Danger Penalty (${totalDangerPenalty})` : ""} = <span className="text-rose-400 font-bold">{totalRisk}</span>
                  </p>
                  <p>
                    <strong className="text-white">Final Safety Score Formula:</strong> Base Score (100) - Total Risk ({totalRisk}) = <span className="text-emerald-400 font-bold">{Math.round(finalScore)} / 100</span>
                  </p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Historical Records Processed: <span className="text-indigo-400 font-bold">{historicalRecordsCount}</span> (Density Multiplier: <span className="text-amber-400 font-bold">×{densityMultiplier.toFixed(1)}</span>). Community Reports Processed: <span className="text-blue-400 font-bold">{communityReportsCount}</span>.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

