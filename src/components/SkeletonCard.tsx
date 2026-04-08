"use client";

import { Zap } from "lucide-react";

export default function SkeletonCard({ index }: { index: number }) {
  return (
    <div 
      className="relative cyber-glass rounded-[32px] p-6 border border-white/5 animate-shimmer"
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-white/5 w-16 h-4 rounded-full border border-white/5"></div>
        <div className="bg-white/5 w-20 h-3 rounded-full border border-white/5"></div>
      </div>
      
      {/* Title Skeletons */}
      <div className="space-y-2 mb-4">
        <div className="h-6 bg-white/5 rounded-lg w-full"></div>
        <div className="h-6 bg-white/5 rounded-lg w-2/3"></div>
      </div>
      
      {/* Summary Skeletons */}
      <div className="space-y-2 mb-6">
        <div className="h-3 bg-white/5 rounded-full w-full opacity-60"></div>
        <div className="h-3 bg-white/5 rounded-full w-[95%] opacity-60"></div>
      </div>
      
      <div className="flex items-center justify-between text-[8px] font-black text-neutral-700 uppercase tracking-[0.2em]">
        <span className="flex items-center gap-2">
          PROHLEDÁVÁM DATOVÝ TOK...
        </span>
        <Zap size={10} className="text-neutral-700 animate-pulse" />
      </div>

      {/* Decorative Blur for futurism */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#00d1ff]/5 to-[#9d00ff]/5 blur-xl -z-10 opacity-30"></div>
    </div>
  );
}
