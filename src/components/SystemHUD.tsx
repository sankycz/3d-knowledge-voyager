"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export default function SystemHUD() {
  return (
    <div className="glass-panel p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[0.3em] text-text-low font-black">Core Telemetry</span>
          <h4 className="text-xs font-display font-bold text-primary uppercase tracking-widest">System HUD</h4>
        </div>
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)] animate-pulse"></div>
      </div>

      <div className="space-y-6">
        <TelemetryBar label="Stability" value={98.4} color="var(--color-primary)" />
        <TelemetryBar label="Core Synthesis" value={65} displayValue="4.2M" color="var(--color-secondary)" />
        <TelemetryBar label="Neural Uptime" value={100} displayValue="144:12:09" color="var(--color-tertiary)" />
      </div>

      <div className="pt-4 flex items-center gap-3">
        <div className="flex -space-x-2">
           {[...Array(3)].map((_, i) => (
             <div key={i} className="w-6 h-6 rounded-full bg-surface-highest flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform cursor-pointer">
               <div className="w-4 h-4 rounded-full bg-primary/10" />
             </div>
           ))}
        </div>
        <span className="text-[9px] font-bold text-text-low uppercase tracking-widest">3 Nodes Assigned</span>
      </div>
    </div>
  );
}

function TelemetryBar({ label, value, color, displayValue }: { label: string, value: number, color: string, displayValue?: string }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-low">{label}</span>
        <span className="text-[11px] font-mono font-bold" style={{ color }}>{displayValue || `${value}%`}</span>
      </div>
      <div className="h-1 bg-surface-highest/50 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="h-full shadow-[0_0_10px_rgba(164,230,255,0.2)]" 
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}
