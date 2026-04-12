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

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-10 space-y-3">
        {items.map((item, idx) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05, ease: [0.23, 1, 0.32, 1], duration: 0.8 }}
            onClick={() => onSelect(item.id)}
            className={`w-full text-left p-6 rounded-2xl transition-all relative group overflow-hidden ${
              selectedId === item.id 
                ? "bg-white/5 shadow-[0_0_30px_rgba(0,0,0,0.3)]" 
                : "hover:bg-white/[0.02]"
            }`}
          >
            {/* Minimal selection indicator */}
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full transition-all duration-500 scale-x-0 ${selectedId === item.id ? "scale-x-100" : "group-hover:scale-x-50 opacity-0 group-hover:opacity-30"}`} />
            
            <div className="relative z-10 flex flex-col gap-3 ml-2">
              <div className="flex items-center justify-between">
                <span className="module-label group-hover:text-primary transition-colors">{item.source}</span>
                {item.isAnalyzed && <Sparkles size={10} className="text-primary animate-pulse" />}
              </div>
              
              <h3 className={`text-md font-medium leading-[1.3] transition-all duration-500 ${selectedId === item.id ? "text-white scale-[1.02]" : "text-white/60 group-hover:text-white"}`}>
                {item.title}
              </h3>
              
              <div className="flex items-center justify-between mt-2">
                <span className="text-[9px] font-mono text-white/20 group-hover:text-white/40 transition-colors uppercase tracking-widest">{item.date || "REAL_TIME"}</span>
                <ChevronRight size={14} className={`text-primary transition-all duration-500 transform ${selectedId === item.id ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-40"}`} />
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
