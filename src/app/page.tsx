"use client";

import ThreeCanvas from "@/components/ThreeCanvas";
import NewsFeed from "@/components/NewsFeed";
import AccountButton from "@/components/AccountButton";
import SourceManager from "@/components/SourceManager";
import { 
  Globe, Search, Sparkles, Zap, Settings, RefreshCw, 
  Terminal, Activity, Shield, Cpu, Layers, Disc, 
  BarChart3, Wifi, Database, Target
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

function useInterval(callback: () => void, delay: number) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);
  useEffect(() => {
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubsystem, setActiveSubsystem] = useState("VŠE");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSourceManagerOpen, setIsSourceManagerOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customSources, setCustomSources] = useState<{ url: string; name: string }[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logs, setLogs] = useState<string[]>(["SYSTÉM PŘIPRAVEN.", "TEPLOTA JÁDRA: 38°C", "ODEZVA: 12ms", "ŠIFROVÁNÍ: AKTIVNÍ"]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('cs-CZ', { hour12: false });
    const prefix = Math.random() > 0.5 ? ">>" : ">";
    setLogs(prev => [`[${time}] ${prefix} ${msg}`, ...prev].slice(0, 30));
  };

  const fetchNews = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setIsRefreshing(true);
    addLog(`INICIALIZUJI SKENOVÁNÍ DAT [${32 + customSources.length} ZDROJŮ]...`);
    
    try {
      const extraFeeds = customSources.map(s => s.url).join(",");
      let url = `/api/news?limit=40`;
      if (extraFeeds) url += `&extraFeeds=${encodeURIComponent(extraFeeds)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      const articles = data.articles || [];
      
      setNews(articles);
      addLog(`ANALÝZA DOKONČENA: ${articles.length} OBJEKTŮ IDENTIFIKOVÁNO.`);
    } catch (err) {
      addLog("KRITICKÁ CHYBA: SIGNÁL PŘERUŠEN.");
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [customSources]);

  useEffect(() => { fetchNews(false); }, [customSources]);
  useInterval(() => { fetchNews(true); }, REFRESH_INTERVAL_MS);

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const sysMap: Record<string, string> = { "VŠE": "ALL", "UI": "AI", "VĚDA": "VĚDA", "TECH": "TECH", "VÝZKUM": "VÝZKUM" };
    const targetCat = sysMap[activeSubsystem] || "ALL";
    const matchesSubsystem = targetCat === "ALL" || item.category?.toUpperCase() === targetCat;
    return matchesSearch && matchesSubsystem;
  });

  if (!isMounted) return null;

  return (
    <main className={`relative w-full h-screen overflow-hidden bg-[#020205] text-white font-sans selection:bg-[#00ffff]/30 selection:text-black ${isRefreshing ? "hologram-flicker-intense saturate-[200%]" : "hologram-flicker"}`}>
      <div className="scanline" />
      
      {/* Background Visualization */}
      <div className="absolute inset-0 z-0">
        <ThreeCanvas 
          items={news} 
          onSelect={(id) => {
            setSelectedArticleId(id);
            setIsPanelOpen(true);
            addLog(`ZAMĚŘENO: PAKET_${id.slice(0,6).toUpperCase()}`);
          }}
          selectedId={selectedArticleId}
          isScanning={isRefreshing}
        />
      </div>

      {/* TOP BAR: STRATEGIC OVERVIEW */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start p-8 pointer-events-none">
        <div className="flex flex-col gap-4 pointer-events-auto">
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-6 bg-black/40 backdrop-blur-3xl border border-white/5 px-8 py-4 rounded-2xl shadow-2xl relative group"
          >
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00ffff] rounded-tl-lg group-hover:w-full group-hover:h-full transition-all duration-700" />
            <div className={`w-3 h-3 rounded-full ${isRefreshing ? "bg-[#00ffff] animate-ping" : "bg-[#00ffff] shadow-[0_0_15px_#00ffff]"}`} />
            <div className="flex flex-col">
              <h1 className="font-display font-black text-lg tracking-[0.6em] uppercase text-glow-cyan">Vojager | Centrum</h1>
              <span className="text-[9px] font-mono text-[#00ffff]/60 tracking-[0.4em]">KOMANDNÍ MODUL v6.2.1 // STAV: NOMINÁLNÍ</span>
            </div>
          </motion.div>
          
          <div className="flex gap-4">
            <HudMiniStat icon={<Cpu size={14} />} label="LOGICKÉ JÁDRO" value="GROQ L3" color="#00ffff" />
            <HudMiniStat icon={<Wifi size={14} />} label="KONEKTIVITA" value="AKTIVNÍ" color="#00ffa3" />
            <HudMiniStat icon={<Target size={14} />} label="ZAMĚŘENÍ" value="OPTIMÁLNÍ" color="#8a2be2" />
          </div>
        </div>

        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Souřadnice</span>
            <span className="text-[11px] font-mono text-[#00ffff]">50.0755° N, 14.4378° E</span>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0,255,255,0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSourceManagerOpen(true)}
            className="p-5 rounded-2xl bg-black/60 backdrop-blur-3xl border border-white/10 hover:border-[#00ffff]/50 transition-all group shadow-2xl"
          >
            <Settings size={22} className="group-hover:rotate-180 transition-transform duration-1000 text-[#00ffff]" />
          </motion.button>
          <AccountButton />
        </div>
      </nav>

      {/* LEFT SIDEBAR: ANALYTICAL TOOLS */}
      <aside className="absolute top-1/2 left-8 -translate-y-1/2 z-20 flex flex-col gap-6 pointer-events-none">
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="hud-panel p-8 pointer-events-auto w-80 bg-black/60 backdrop-blur-3xl tech-corners"
        >
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[11px] font-black tracking-[0.4em] text-[#00ffff] uppercase">Vyhledávání</h4>
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-[#00ffff]" />
                  <div className="w-1 h-3 bg-[#00ffff]/30" />
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00ffff]/40" size={18} />
                <input 
                  type="text"
                  placeholder="HLEDAT V DATOVÉM TOKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-[12px] font-mono focus:outline-none focus:border-[#00ffff]/50 transition-all placeholder:text-neutral-700"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] font-black tracking-[0.4em] text-[#00ffff] uppercase">Subsystémy</h4>
                <Disc size={14} className={isRefreshing ? "animate-spin text-[#00ffff]" : "text-neutral-800"} />
              </div>
              {["VŠE", "UI", "VĚDA", "TECH", "VÝZKUM"].map((sub) => (
                <SubsystemButton 
                  key={sub}
                  icon={<Layers size={16} />} 
                  label={sub} 
                  active={activeSubsystem === sub}
                  onClick={() => {
                    setActiveSubsystem(sub);
                    addLog(`PROTOKOL: ${sub} AKTIVOVÁN.`);
                  }}
                />
              ))}
            </div>

            <div className="pt-4 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-neutral-500 uppercase">
                <span>Vytížení sítě</span>
                <span className="text-[#00ffff]">64 GB/s</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "64%" }}
                  className="h-full bg-[#00ffff]"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </aside>

      {/* BOTTOM AREA: LOGS & STATUS */}
      <footer className="absolute bottom-8 left-8 right-[460px] z-20 pointer-events-none flex items-end gap-8">
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="hud-panel p-8 flex-1 pointer-events-auto h-48 flex flex-col bg-black/60 backdrop-blur-3xl tech-corners"
        >
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <div className="flex items-center gap-4">
              <Terminal size={18} className="text-[#00ffa3]" />
              <span className="text-[12px] font-black tracking-[0.5em] text-[#00ffa3]">DATOVÝ LOG TERMINÁLU</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-mono text-neutral-600">STAV KVANT</span>
                <span className="text-[10px] font-mono text-[#00ffa3]">STABILNÍ</span>
              </div>
              <Activity size={16} className="text-[#00ffa3] animate-pulse" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar font-mono text-[11px] space-y-3">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4 items-center group">
                <span className={i === 0 ? "text-[#00ffff] font-bold" : "text-neutral-400 group-hover:text-white transition-colors"}>
                  {log}
                </span>
                {i === 0 && <motion.div animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2 h-4 bg-[#00ffff]" />}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex flex-col gap-6 pointer-events-auto w-64">
          <div className="hud-panel p-6 flex flex-col gap-4 bg-black/60 backdrop-blur-3xl">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-neutral-500 tracking-[0.3em] uppercase">Vytížení jádra</span>
              <span className="text-[11px] font-mono text-[#8a2be2] font-bold">{isRefreshing ? "94.2%" : "18.5%"}</span>
            </div>
            <div className="h-3 bg-white/5 rounded-lg overflow-hidden p-[2px]">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#00ffff] via-[#8a2be2] to-[#ffaa00] rounded shadow-[0_0_15px_rgba(0,255,255,0.4)]" 
                animate={{ width: isRefreshing ? "94.2%" : "18.5%" }}
                transition={{ duration: 2, ease: "circOut" }}
              />
            </div>
          </div>
          <button 
            onClick={() => fetchNews(false)}
            disabled={isRefreshing}
            className="hud-panel p-5 flex items-center justify-between hover:bg-[#00ffff]/10 transition-all group overflow-hidden relative border-[#00ffff]/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00ffff]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <div className="flex flex-col items-start relative z-10">
              <span className="text-[12px] font-black tracking-[0.5em] text-[#00ffff]">OBNOVIT SYSTÉM</span>
              <span className="text-[8px] font-mono text-[#00ffff]/50">REAKTIVACE ANALÝZY</span>
            </div>
            <RefreshCw size={24} className={`relative z-10 ${isRefreshing ? "animate-spin text-[#00ffff]" : "group-hover:rotate-180 transition-transform duration-700 text-[#00ffff]"}`} />
          </button>
        </div>
      </footer>

      {/* RIGHT PANEL: INTELLIGENCE HUB */}
      <aside className="absolute top-8 bottom-8 right-8 w-[420px] z-20 flex flex-col pointer-events-none">
        <motion.div 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="hud-panel p-8 flex-1 pointer-events-auto flex flex-col bg-black/60 backdrop-blur-3xl relative border-l-0 rounded-l-none tech-corners"
        >
          <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-[#8a2be2]/20 to-transparent" />
          
          <div className="flex items-center justify-between mb-10 border-b border-white/10 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#8a2be2]/20 rounded-xl">
                <Activity size={24} className="text-[#8a2be2]" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-[14px] font-black tracking-[0.5em] uppercase text-glow-violet">Přehled Intel</h3>
                <span className="text-[9px] font-mono text-[#8a2be2]/60 uppercase tracking-widest">Aktivní tok zpráv</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[20px] font-mono font-black text-[#8a2be2]">{filteredNews.length}</span>
              <span className="text-[8px] font-mono text-neutral-600 uppercase">Paketů</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-4 space-y-6 no-scrollbar">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="h-36 bg-white/[0.02] rounded-2xl animate-pulse border border-white/5 relative">
                  <div className="absolute top-4 left-4 w-20 h-2 bg-white/5 rounded" />
                </div>
              ))
            ) : (
              filteredNews.map((item, idx) => (
                <motion.div 
                  key={item.id}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.05 * idx }}
                  onClick={() => {
                    setSelectedArticleId(item.id);
                    setIsPanelOpen(true);
                  }}
                  className={`group relative p-6 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                    selectedArticleId === item.id 
                      ? "bg-[#00ffff]/5 border-[#00ffff]/40 shadow-[0_0_30px_rgba(0,255,255,0.05)]" 
                      : "bg-white/[0.02] border-white/5 hover:border-[#00ffff]/20 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                       <span className="w-1 h-3 bg-[#00ffff]/40" />
                       <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">{item.source}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#8a2be2] font-black opacity-30 group-hover:opacity-100 transition-opacity">
                      {idx < 9 ? `0${idx + 1}` : idx + 1}
                    </span>
                  </div>
                  <h4 className="text-[15px] font-display font-medium leading-tight group-hover:text-[#00ffff] transition-colors uppercase tracking-tight mb-2">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-4 text-[9px] font-mono text-neutral-600">
                    <span className="flex items-center gap-1"><Database size={10} /> {item.category || "GENERAL"}</span>
                    <span className="flex items-center gap-1"><Target size={10} /> RELIABILITY: 98%</span>
                  </div>
                  <div className={`mt-4 h-[1px] bg-gradient-to-r from-[#00ffff] to-transparent transition-all duration-700 ${selectedArticleId === item.id ? "w-full" : "w-0 group-hover:w-1/2"}`} />
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </aside>

      {/* Managers */}
      <SourceManager 
        isOpen={isSourceManagerOpen} 
        onClose={() => setIsSourceManagerOpen(false)} 
        onSourcesChange={(sources) => setCustomSources(sources)} 
      />

      <NewsFeed 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
        items={news} 
        searchQuery={searchQuery}
        selectedArticleId={selectedArticleId}
      />
    </main>
  );
}

function HudMiniStat({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className="bg-black/40 backdrop-blur-3xl border border-white/5 px-6 py-3 rounded-2xl flex items-center gap-5 group hover:border-[#00ffff]/20 transition-all shadow-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div style={{ color }} className="group-hover:scale-125 transition-transform duration-500 drop-shadow-[0_0_8px_currentColor] shrink-0">{icon}</div>
      <div className="flex flex-col relative z-10 shrink-0">
        <span className="text-[8px] font-black text-neutral-500 uppercase tracking-[0.4em]">{label}</span>
        <span className="text-[12px] font-mono font-bold leading-tight tracking-tight">{value}</span>
      </div>
      
      {/* Mini Sparkline Chart */}
      <div className="flex-1 min-w-[60px] h-8 opacity-40 group-hover:opacity-100 transition-all duration-700">
        <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
          <motion.path
            d={`M 0 30 Q 15 ${10 + Math.random() * 20}, 30 ${20 + Math.random() * 10} T 60 ${10 + Math.random() * 20} T 100 25`}
            fill="none"
            stroke={color}
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          />
        </svg>
      </div>
    </div>
  );
}

function SubsystemButton({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border group relative overflow-hidden ${
        active 
          ? "bg-[#00ffff]/10 border-[#00ffff]/30 text-white" 
          : "border-transparent text-neutral-500 hover:text-neutral-300 hover:bg-white/5 shadow-inner"
      }`}
    >
      <div className="flex items-center gap-4 relative z-10">
        <div className={`${active ? "text-[#00ffff]" : "text-neutral-600 group-hover:text-neutral-400"} transition-colors`}>
          {icon}
        </div>
        <span className="text-[12px] font-black uppercase tracking-[0.4em]">{label}</span>
      </div>
      {active && (
        <motion.div 
          layoutId="sub-active" 
          className="w-2 h-2 rounded-full bg-[#00ffff] shadow-[0_0_10px_#00ffff]" 
        />
      )}
    </button>
  );
}
