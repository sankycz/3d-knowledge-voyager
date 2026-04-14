"use client";

import { motion } from "framer-motion";
import { Activity, Zap, Sparkles, ChevronRight } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  date?: string;
  isAnalyzed?: boolean;
}

interface NewsListProps {
  items: NewsItem[];
  onSelect: (id: string) => void;
  selectedId: string | null;
  isLoading: boolean;
}

export default function NewsList({ items, onSelect, selectedId, isLoading }: NewsListProps) {
  if (isLoading && items.length === 0) {
    return (
      <div className="p-8 space-y-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-8 py-8 flex items-center justify-between shrink-0">
        <div className="flex flex-col">
          <span className="subheadline mb-1">Intelligence</span>
          <h2 className="editorial-headline text-lg">Discovery</h2>
        </div>
        <Activity size={14} className="text-primary opacity-60 animate-pulse" />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-20 space-y-4">
        {items.map((item, idx) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, ease: [0.23, 1, 0.32, 1], duration: 0.6 }}
            onClick={() => onSelect(item.id)}
            className={`w-full text-left p-8 rounded-[40px] transition-all relative group overflow-hidden ${
              selectedId === item.id 
                ? "bg-white/[0.08] shadow-[var(--ambient-shadow)]" 
                : "hover:bg-white/[0.04]"
            }`}
          >
            {/* Selection HUD Accent */}
            <div className={`absolute top-0 left-0 bottom-0 w-1 bg-primary transition-transform duration-500 origin-left ${selectedId === item.id ? "scale-x-100" : "scale-x-0 group-hover:scale-x-50"}`} />
            
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-colors ${selectedId === item.id ? "text-primary" : "text-text-low group-hover:text-text-mid"}`}>
                  {item.source}
                </span>
                <div className="flex gap-2">
                  {item.isAnalyzed && <Sparkles size={10} className="text-primary animate-pulse" />}
                </div>
              </div>
              
              <h3 className={`text-md font-medium leading-[1.4] transition-all duration-300 ${selectedId === item.id ? "text-[var(--color-text-high)]" : "text-[var(--color-text-mid)] group-hover:text-[var(--color-text-high)]"}`}>
                {item.title}
              </h3>
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-[9px] font-mono text-text-low group-hover:text-text-mid transition-colors uppercase tracking-[0.1em]">
                  {item.date || "REAL_TIME_NODE"}
                </span>
                <div className={`p-1.5 rounded-full bg-white/5 transition-all duration-500 transform ${selectedId === item.id ? "translate-x-0 opacity-100 rotate-0" : "translate-x-4 opacity-0 -rotate-45 group-hover:translate-x-0 group-hover:opacity-100 group-hover:rotate-0"}`}>
                  <ChevronRight size={12} className="text-primary" />
                </div>
              </div>
            </div>
          </motion.button>
        ))}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 opacity-20 text-center px-6">
            <Zap size={24} className="mb-4 text-[var(--accent)]" />
            <p className="text-[9px] font-black uppercase tracking-[0.3em]">No incoming transmissions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
