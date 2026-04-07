"use client";

import ThreeCanvas from "@/components/ThreeCanvas";
import NewsFeed from "@/components/NewsFeed";
import { Code, Globe, Search, Sparkles, Zap, Activity, Database } from "lucide-react";
import { useState, useEffect } from "react";

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  link?: string;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);

  // Centrální načítání dat
  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch("/api/news");
        const data = await res.json();
        setNews(data);
      } catch (err) {
        console.error("Chyba při načítání novinek:", err);
      }
    }
    fetchNews();
  }, []);

  return (
    <main className="relative w-full min-h-screen overflow-y-auto bg-[#050505] text-white">
      {/* 3D Canvas v pozadí - FIXED pro plynulý scroll */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ThreeCanvas searchQuery={searchQuery} />
        {/* Ambient Glows */}
        <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00d1ff]/10 blur-[120px] rounded-full animate-glow"></div>
        <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#9d00ff]/10 blur-[120px] rounded-full animate-glow" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Top HUD Controls */}
      <div className="sticky top-0 left-0 right-0 z-[30] flex justify-between items-center px-16 py-10 pointer-events-none">
        <div className="flex items-center gap-3 bg-white/[0.03] backdrop-blur-md border border-white/10 px-6 py-2 rounded-full text-[#00d1ff] shadow-xl pointer-events-auto transition-all hover:bg-white/5 cursor-default">
          <Sparkles size={14} className="animate-pulse" />
          <span className="text-[10px] font-black tracking-[0.3em] uppercase">VOYAGER INTELLIGENCE v2.0</span>
        </div>
        
        <button 
          id="explore-btn"
          onClick={() => setIsPanelOpen(true)}
          className="pointer-events-auto flex items-center gap-3 px-8 py-3 rounded-full bg-[#00d1ff]/10 hover:bg-[#00d1ff]/20 border border-[#00d1ff]/30 text-white font-black text-[11px] uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 group shadow-[0_0_30px_rgba(0,209,255,0.2)] hover:shadow-[0_0_40px_rgba(0,209,255,0.4)]"
        >
          EXPLORE HUB
          <Globe size={16} className="group-hover:rotate-[30deg] transition-transform duration-500 text-[#00d1ff]" />
        </button>
      </div>

      <div className="relative z-10 flex flex-col justify-center px-16 pt-10 pb-40 pointer-events-none">
        {/* Main Title Section */}
        <div className="mb-20">
          <h1 className="text-[10vw] font-display font-black leading-[0.8] tracking-tighter drop-shadow-2xl opacity-10 blur-sm absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 select-none">
            VOYAGER
          </h1>
          <h2 className="text-6xl font-display font-bold leading-[0.9] tracking-tighter mb-4 text-white">
            LATEST <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d1ff] to-[#9d00ff]">INTELLIGENCE</span>
          </h2>
          <p className="text-sm text-neutral-500 font-medium tracking-widest uppercase opacity-60">
            Real-time AI analysis & knowledge exploration
          </p>
        </div>

        {/* 6-Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl pointer-events-auto">
          {news.slice(0, 6).map((item, idx) => (
            <div 
              key={item.id}
              onClick={() => setIsPanelOpen(true)}
              className={`group/card relative cyber-glass rounded-[32px] p-6 border border-white/5 transition-all duration-500 hover:border-[#00d1ff]/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] cursor-pointer animate-float ${idx % 2 === 0 ? '' : 'sm:translate-y-6'}`}
              style={{ animationDelay: `${idx * 0.2}s` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#00d1ff]/10 text-[#00d1ff] px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-[#00d1ff]/20">
                  {idx === 0 ? "FEATURED" : "LATEST"}
                </div>
                <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">AI NEWS</span>
              </div>
              <h3 className="text-lg font-display font-bold text-white mb-3 line-clamp-2 leading-tight group-hover/card:text-[#00d1ff] transition-colors">
                {item.title}
              </h3>
              <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed opacity-60 group-hover/card:opacity-100 transition-opacity mb-4">
                {item.summary}
              </p>
              
              <div className="flex items-center justify-between text-[8px] font-black text-neutral-500 uppercase tracking-[0.2em]">
                <span>Analysis Pending</span>
                <Zap size={10} className="text-[#00d1ff] opacity-40 group-hover/card:opacity-100 transition-opacity" />
              </div>

              {/* Hover Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#00d1ff]/0 to-[#9d00ff]/0 group-hover/card:from-[#00d1ff]/5 group-hover/card:to-[#9d00ff]/5 blur-xl -z-10 transition-all duration-700"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Modern Search Control - FIXED at bottom of viewport */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[40] w-full max-w-3xl px-8 pointer-events-auto">
        <div className="relative group cyber-glass rounded-[32px] p-2 transition-all hover:scale-[1.02] duration-500 shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/5 hover:border-[#00d1ff]/20">
          <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-[#00d1ff] transition-colors">
            <Search size={24} />
          </div>
          <input
            id="ai-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.length > 1) setIsPanelOpen(true);
            }}
            placeholder="Search AI trends..."
            className="w-full bg-transparent border-none py-5 px-16 text-xl focus:ring-0 outline-none placeholder:text-neutral-600 font-medium"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
            <Zap size={12} className="text-[#00d1ff]" />
            REAL-TIME AI
          </div>
        </div>
      </div>

      {/* News Feed Panel */}
      <NewsFeed 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
        items={news} 
        searchQuery={searchQuery}
      />

      {/* Side HUD Stats - FIXED at top right */}
      <div className="fixed top-32 right-16 z-20 flex flex-col gap-6 pointer-events-none">
        <div className="pointer-events-auto">
          <StatCard label="Zdroje" value="20+" icon={<Database size={14} />} color="#00d1ff" />
        </div>
        <div className="pointer-events-auto">
          <StatCard label="Analýza" value="Aktivní" icon={<Activity size={14} />} color="#9d00ff" />
        </div>
        <div className="pointer-events-auto">
          <StatCard label="Stav" value="Online" icon={<Globe size={14} />} color="#00ffa3" />
        </div>
      </div>

      {/* Ambient Glass Border */}
      <div className="absolute inset-0 pointer-events-none border-[1px] border-white/[0.03] rounded-[48px] m-6"></div>
    </main>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 p-6 rounded-[28px] min-w-[200px] shadow-2xl hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-default group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
           <div className="p-1.5 rounded-lg bg-white/5 text-neutral-400 group-hover:text-white transition-colors">
             {icon}
           </div>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">{label}</span>
        </div>
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}></div>
      </div>
      <div className="text-3xl font-display font-bold tracking-tight text-white group-hover:translate-x-1 transition-transform duration-300">{value}</div>
    </div>
  );
}
