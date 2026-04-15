"use client";

import { motion } from "framer-motion";
import { Activity, Zap, ChevronRight } from "lucide-react";

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
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
        <div className="px-6 pb-20 space-y-4 pt-4">
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, ease: [0.23, 1, 0.32, 1], duration: 0.6 }}
              onClick={() => onSelect(item.id)}
              className={`article-island p-8 group relative ${
                selectedId === item.id ? "bg-surface-high shadow-[0_20px_50px_rgba(0,0,0,0.3)]" : ""
              }`}
            >
              {selectedId === item.id && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-r-full" />
              )}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 mb-2 block font-mono">
                      {item.source}
                    </span>
                    <h3 className="text-xl font-display font-medium leading-tight group-hover:text-primary transition-colors pr-8">
                      {item.title}
                    </h3>
                  </div>
                  <div className={`p-2 rounded-full bg-white/5 transition-all duration-500 transform ${
                    selectedId === item.id 
                      ? "rotate-0 opacity-100" 
                      : "-rotate-45 opacity-0 group-hover:rotate-0 group-hover:opacity-100"
                  }`}>
                    <ChevronRight size={14} className="text-primary" />
                  </div>
                </div>

                <p className="text-[13px] text-text-mid line-clamp-2 font-regular leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                  {item.summary}
                </p>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-mono text-text-lowest uppercase tracking-[0.15em]">
                    {item.date || "REAL_TIME_NODE"}
                  </span>
                  {item.isAnalyzed && (
                    <div className="flex items-center gap-1.5 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                      <Zap size={10} className="text-secondary" />
                      <span className="text-[8px] font-black text-secondary uppercase tracking-widest">Analyzed</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 opacity-20 text-center px-6">
              <Zap size={24} className="mb-4 text-primary" />
              <p className="text-[9px] font-black uppercase tracking-[0.3em]">No incoming transmissions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
