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
      <div className="sticky top-0 z-30 px-8 py-8 flex items-center justify-between bg-surface-mid/80 backdrop-blur-xl border-b border-white/5 shrink-0">
        <div className="flex flex-col">
          <span className="subheadline mb-1">Intelligence</span>
          <h2 className="editorial-headline text-lg">Discovery</h2>
        </div>
        <Activity size={14} className="text-primary opacity-60 animate-pulse" />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
        <div className="px-6 pb-20 space-y-2 pt-4">
        {items.map((item, idx) => (
          <div key={item.id} className="group/container">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, ease: [0.23, 1, 0.32, 1], duration: 0.6 }}
            onClick={() => onSelect(item.id)}
            className={`article-island p-6 mb-4 group cursor-pointer ${
              selectedId === item.id ? "ring-2 ring-primary/40 bg-surface-high" : ""
            }`}
          >
                  {item.date || "REAL_TIME_NODE"}
                </span>
                <div className={`p-1.5 rounded-full bg-white/5 transition-all duration-500 transform ${selectedId === item.id ? "translate-x-0 opacity-100 rotate-0" : "translate-x-4 opacity-0 -rotate-45 group-hover:translate-x-0 group-hover:opacity-100 group-hover:rotate-0"}`}>
                  <ChevronRight size={12} className="text-primary" />
                </div>
              </div>
            </div>
          </motion.button>
          {idx < items.length - 1 && <div className="glass-separator mx-8 my-2" />}
        </div>
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
