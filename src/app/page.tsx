"use client";

import ThreeCanvas from "@/components/ThreeCanvas";
import NewsFeed from "@/components/NewsFeed";
import AccountButton from "@/components/AccountButton";
import { useAuth } from "@/components/AuthProvider";
import { 
  Globe, Sparkles, Zap, RefreshCw, 
  Terminal, Activity, Shield, Cpu, Disc, 
  BarChart3, Wifi, Database, Target, Bookmark,
  ChevronRight, Box, Sun, Moon
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeContext";

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
  const [showArchivesOnly, setShowArchivesOnly] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logs, setLogs] = useState<string[]>(["SYSTÉM PŘIPRAVEN.", "TEPLOTA JÁDRA: 38°C", "ODEZVA: 12ms", "ŠIFROVÁNÍ: AKTIVNÍ"]);
  const [isMounted, setIsMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => setIsMounted(true), []);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('cs-CZ', { hour12: false });
    const prefix = Math.random() > 0.5 ? ">>" : ">";
    setLogs(prev => [`[${time}] ${prefix} ${msg}`, ...prev].slice(0, 30));
  };

  const fetchNews = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setIsRefreshing(true);
    addLog(`INICIALIZUJI SKENOVÁNÍ DATOVÉHO TOKU...`);
    
    try {
      const url = `/api/news?limit=40`;
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
  }, []);

  useEffect(() => { fetchNews(false); }, []);
  useInterval(() => { fetchNews(true); }, REFRESH_INTERVAL_MS);

  const [savedIds, setSavedIds] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      import("@/lib/favorites").then(({ getFavorites }) => {
        getFavorites(user).then(favs => setSavedIds(favs.map(f => f.id)));
      });
    } else {
      setSavedIds([]);
      setShowArchivesOnly(false);
    }
  }, [user]);

  const filteredNews = news.filter(item => {
    if (showArchivesOnly) return savedIds.includes(item.id);
    return true; // No longer filtering by subsystem
  });

  if (!isMounted) return null;

  return (
    <main className={`relative w-full h-screen overflow-hidden text-primary font-sans selection:bg-accent/30 selection:text-primary transition-colors duration-700 ${isRefreshing ? "saturate-[200%]" : ""}`}>
      {/* Background Layer: Dynamic Gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-bg-main via-bg-secondary to-bg-main" />
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      
      <div className="scanline" />
      
      {/* 3D Knowledge Graph Visualization */}
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
          theme={theme}
        />
      </div>

      <nav className="absolute top-0 left-0 right-0 z-50 flex justify-between items-start p-8 pointer-events-none">
        <div className="flex flex-col gap-5 pointer-events-auto">
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-6 bg-surface backdrop-blur-3xl border border-surface-border px-10 py-5 rounded-2xl shadow-main relative overflow-hidden group"
          >
            <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-accent rounded-tl-sm transition-all group-hover:w-full group-hover:h-full opacity-50`} />
            <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-accent rounded-br-sm transition-all group-hover:w-full group-hover:h-full opacity-50`} />
            
            <div className={`w-4 h-4 rounded-full ${isRefreshing ? "bg-accent animate-ping" : "bg-accent shadow-[0_0_20px_var(--accent-glow)]"}`} />
            
            <div className="flex flex-col">
              <h1 className="font-display font-black text-xl tracking-[0.6em] uppercase text-primary drop-shadow-[0_0_8px_var(--accent-glow)]">Knowledge Voyager</h1>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-accent/60 tracking-[0.4em]">KOMANDNÍ MODUL v7.0.0</span>
                <span className="text-[10px] font-mono text-text-muted">|</span>
                <span className="text-[10px] font-mono text-matrix-emerald animate-pulse">STAV: NOMINÁLNÍ</span>
              </div>
            </div>
          </motion.div>
          
          <div className="flex gap-4">
            <HudMiniStat icon={<Cpu size={14} />} label="LOGICKÉ JÁDRO" value="GROQ L3-70B" color="var(--electric-cyan)" />
            <HudMiniStat icon={<Wifi size={14} />} label="DATOVÝ TOK" value="AKTIVNÍ" color="var(--matrix-emerald)" />
            <HudMiniStat icon={<Shield size={14} />} label="PROTOKOL" value="AES-256" color="var(--alert-amber)" />
          </div>
        </div>

        <div className="flex items-center gap-6 pointer-events-auto bg-surface backdrop-blur-2xl border border-surface-border p-4 rounded-3xl shadow-main">
          <button
            onClick={toggleTheme}
            className="p-3 rounded-xl bg-surface-shine border border-surface-border hover:border-accent transition-all text-accent"
            title={theme === "light" ? "Aktivovat Tmavý Režim" : "Aktivovat Světlý Režim"}
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <div className="flex flex-col items-end pr-4 border-r border-surface-border">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em]">Globální Souřadnice</span>
            <span className="text-[12px] font-mono text-accent font-bold">50.0755° N, 14.4378° E</span>
          </div>
          <AccountButton />
        </div>
      </nav>

      <aside className="absolute top-1/2 left-8 -translate-y-1/2 z-40 flex flex-col gap-8 pointer-events-none">
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="p-10 pointer-events-auto w-96 bg-surface backdrop-blur-3xl border border-surface-border rounded-3xl relative shadow-main tech-corners overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 blur-3xl rounded-full" />
          
          <div className="space-y-10 relative z-10">
            {/* Archive Toggle Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[12px] font-black tracking-[0.5em] text-accent uppercase">Osobní Archiv</h4>
                <div className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-[8px] font-mono text-accent">SECURE_STORAGE</div>
              </div>
              
              <button 
                onClick={() => {
                  if (!user) {
                    addLog("KRITICKÉ: PŘÍSTUP ODEPŘEN // VYŽADOVÁNA AUTENTIZACE");
                    return;
                  }
                  setShowArchivesOnly(!showArchivesOnly);
                  addLog(showArchivesOnly ? "PROTOKOL: NÁVRAT K VEŘEJNÉMU TOKU." : "PROTOKOL: SOUKROMÝ ARCHIV AKTIVOVÁN.");
                }}
                className={`w-full group relative overflow-hidden flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-500 shadow-xl ${
                  showArchivesOnly 
                    ? "bg-accent/20 border-accent text-accent" 
                    : "bg-surface-shine border-surface-border text-text-muted hover:border-accent/40 hover:text-primary"
                }`}
              >
                <div className="flex items-center gap-5 relative z-10">
                  <div className={`p-3 rounded-xl transition-all ${showArchivesOnly ? "bg-accent text-bg-main" : "bg-surface-shine text-accent/60 group-hover:text-accent"}`}>
                    <Bookmark size={20} fill={showArchivesOnly ? "currentColor" : "none"} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[13px] font-black uppercase tracking-[0.4em]">{showArchivesOnly ? "Archiv Aktivní" : "Zobrazit Archiv"}</span>
                    <span className="text-[9px] font-mono opacity-50">{showArchivesOnly ? "FILTROVÁNÍ AKTIVNÍ" : "PŘEPNOUT REŽIM"}</span>
                  </div>
                </div>
                {showArchivesOnly && <div className="w-3 h-3 rounded-full bg-accent animate-pulse shadow-[0_0_15px_var(--accent-glow)]" />}
                {!user && <Shield size={14} className="text-neutral-600" />}
              </button>
            </div>
            
            {/* System Status Indicators (Consolidated) */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[12px] font-black tracking-[0.5em] text-neon-violet uppercase">Systémová Aktivita</h4>
                <div className={`w-2 h-2 rounded-full ${isRefreshing ? "bg-accent animate-pulse" : "bg-neutral-800"}`} />
              </div>
              
              <div className="p-6 rounded-2xl bg-surface-shine border border-surface-border space-y-4">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-text-muted uppercase">Synchronizace</span>
                  <span className={isRefreshing ? "text-accent" : "text-text-muted"}>{isRefreshing ? "PROBÍHÁ" : "DOKONČENA"}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-text-muted uppercase opacity-50">Latency</span>
                  <span className="text-matrix-emerald">12ms</span>
                </div>
              </div>
            </div>

            {/* System Resources Footer */}
              <div className="pt-8 border-t border-surface-border space-y-6">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black tracking-widest text-text-muted uppercase">Vytížení Sítě</span>
                    <span className="text-[14px] font-mono text-accent font-bold">12.4 TB / s</span>
                  </div>
                <div className="flex gap-1 items-end h-8">
                  {[0.4, 0.7, 0.9, 0.5, 0.8, 1, 0.6, 0.9].map((h, i) => (
                    <motion.div 
                      key={i} 
                      className="w-1.5 bg-accent/60" 
                      animate={{ height: `${h * 100}%` }}
                      transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", delay: i * 0.1 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </aside>

      {/* INTELLIGENCE FEED (RIGHT) */}
      <aside className={`absolute top-8 bottom-8 right-8 w-full max-w-[420px] xl:max-w-[480px] z-40 flex flex-col pointer-events-none transition-all duration-500 ${isPanelOpen ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"}`}>
        <motion.div 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-surface backdrop-blur-3xl border border-surface-border rounded-3xl p-6 xl:p-10 flex-1 pointer-events-auto flex flex-col relative shadow-main overflow-hidden tech-corners"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-violet to-transparent" />
          
          <div className="flex items-center justify-between mb-10 border-b border-surface-border pb-8">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-neon-violet/10 rounded-2xl border border-neon-violet/30 shadow-[0_0_20px_rgba(138,43,226,0.2)]">
                <Target size={28} className="text-neon-violet" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-[18px] font-black tracking-[0.5em] uppercase text-primary leading-tight">{showArchivesOnly ? "ARCHIV INTEL" : "DATOVÝ TOK"}</h3>
                <span className="text-[10px] font-mono text-neon-violet uppercase tracking-[0.2em]">{showArchivesOnly ? "Vlastní Databáze" : "Analýza v Reálném Čase"}</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[32px] font-mono font-black text-neon-violet leading-none">{filteredNews.length}</span>
              <span className="text-[8px] font-mono text-text-muted uppercase tracking-widest mt-1">Dostupné Pakety</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 no-scrollbar">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-40 bg-white/[0.02] rounded-3xl animate-pulse border border-white/5 mx-2" />
              ))
            ) : filteredNews.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-10 space-y-4 opacity-30">
                <Box size={40} />
                <span className="text-[12px] font-black tracking-[0.4em] uppercase">Databáze je Prázdná</span>
              </div>
            ) : (
              filteredNews.map((item, idx) => (
                <motion.div 
                  key={item.id}
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.05 * idx }}
                  onClick={() => {
                    setSelectedArticleId(item.id);
                    setIsPanelOpen(true);
                  }}
                  className={`group relative p-8 rounded-3xl border transition-all duration-500 cursor-pointer overflow-hidden ${
                    selectedArticleId === item.id 
                      ? "bg-accent/5 border-accent/50 shadow-[0_0_40px_rgba(0,255,255,0.05)]" 
                      : "bg-surface-shine border-surface-border hover:border-accent/30 hover:bg-surface-shine/20 hover:shadow-xl"
                  }`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={20} className="text-accent" />
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-1 h-4 bg-accent/50 rounded-full" />
                       <span className="text-[11px] font-mono text-text-muted uppercase tracking-widest font-bold">{item.source}</span>
                    </div>
                    <span className="text-[12px] font-mono text-[#8a2be2] font-black opacity-30 group-hover:opacity-100 transition-all group-hover:scale-125">
                      {idx < 9 ? `0${idx + 1}` : idx + 1}
                    </span>
                  </div>
                  
                  <h4 className="text-[16px] font-display font-bold leading-[1.3] group-hover:text-accent transition-colors uppercase tracking-tight mb-4 text-primary">
                    {item.title}
                  </h4>
                  
                  <div className="flex items-center gap-6 text-[10px] font-mono text-text-muted">
                    <span className="flex items-center gap-2"><Database size={12} className="text-neon-violet" /> {item.category || "GENERAL"}</span>
                    <span className="flex items-center gap-2"><Activity size={12} className="text-matrix-emerald" /> VAL: 0.98</span>
                  </div>
                  
                  <div className={`mt-6 h-[2px] bg-gradient-to-r from-accent via-neon-violet to-transparent transition-all duration-1000 ${selectedArticleId === item.id ? "w-full" : "w-0 group-hover:w-2/3"}`} />
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </aside>

      {/* DYNAMIC LOG TERMINAL & STATUS MODALS (BOTTOM) */}
      <footer className={`absolute bottom-8 left-8 right-8 transition-all duration-500 z-40 pointer-events-none flex items-end gap-6 xl:gap-10 ${isPanelOpen ? "" : "lg:right-[480px] xl:right-[540px]"}`}>
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-surface backdrop-blur-3xl border border-surface-border rounded-3xl p-8 flex-1 pointer-events-auto h-56 flex flex-col relative tech-corners shadow-main"
        >
          <div className="flex items-center justify-between mb-5 border-b border-surface-border pb-4">
            <div className="flex items-center gap-4">
              <Terminal size={20} className="text-matrix-emerald" />
              <div className="flex flex-col">
                <span className="text-[13px] font-black tracking-[0.5em] text-matrix-emerald">VOYAGER_OS TERMINÁL</span>
                <span className="text-[8px] font-mono text-text-muted opacity-50">KERNEL_TIME: {new Date().getTime()}</span>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-mono text-text-muted opacity-50">MODUL_ŠIFRY</span>
                <span className="text-[11px] font-mono text-matrix-emerald font-bold">X-RAY_V4</span>
              </div>
              <Activity size={20} className="text-matrix-emerald animate-pulse" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar font-mono text-[12px] space-y-3">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4 items-center group">
                <span className={`transition-all duration-300 ${i === 0 ? "text-accent font-black" : "text-text-muted group-hover:text-text-primary"}`}>
                  {log}
                </span>
                {i === 0 && <motion.div animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2 h-4 bg-accent shadow-[0_0_10px_var(--accent-glow)]" />}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex flex-col gap-6 pointer-events-auto w-72">
          {/* System Load Stat */}
          <div className="bg-surface backdrop-blur-3xl border border-surface-border rounded-3xl p-6 flex flex-col gap-5 shadow-main">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-text-muted tracking-[0.4em] uppercase">Vytížení Jádra</span>
              <span className="text-[12px] font-mono text-neon-violet font-black">{isRefreshing ? "94.8%" : "12.2%"}</span>
            </div>
            <div className="h-4 bg-surface-shine rounded-full overflow-hidden p-[2px] border border-surface-border">
              <motion.div 
                className="h-full bg-gradient-to-r from-accent via-neon-violet to-alert-amber rounded-full shadow-[0_0_20px_var(--accent-glow)]" 
                animate={{ width: isRefreshing ? "94.8%" : "12.2%" }}
                transition={{ duration: 1.5, ease: "circOut" }}
              />
            </div>
          </div>
          
          {/* Refresh Action */}
          <button 
            onClick={() => fetchNews(false)}
            disabled={isRefreshing}
            className="group relative bg-accent/10 border border-accent/30 p-6 rounded-3xl flex items-center justify-between hover:bg-accent/20 transition-all duration-500 shadow-[0_0_30px_var(--accent-glow)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <div className="flex flex-col items-start relative z-10">
              <span className="text-[14px] font-black tracking-[0.5em] text-accent">SYNCHRONIZOVAT</span>
              <span className="text-[9px] font-mono text-accent/50 uppercase tracking-widest mt-1">Skenovat horizont událostí</span>
            </div>
            <RefreshCw size={28} className={`relative z-10 ${isRefreshing ? "animate-spin text-accent" : "group-hover:rotate-180 transition-transform duration-700 text-accent"}`} />
          </button>
        </div>
      </footer>

      {/* Article Detail Panel Overlay */}
      <NewsFeed 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
        items={news} 
        selectedArticleId={selectedArticleId}
      />
    </main>
  );
}

function HudMiniStat({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className="bg-surface backdrop-blur-3xl border border-surface-border px-8 py-4 rounded-2xl flex items-center gap-6 group hover:border-accent/30 transition-all duration-500 shadow-main relative overflow-hidden pointer-events-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-text-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div style={{ color }} className="group-hover:scale-125 transition-transform duration-500 drop-shadow-[0_0_12px_currentColor] shrink-0">{icon}</div>
      <div className="flex flex-col relative z-10 shrink-0">
        <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.4em] mb-1">{label}</span>
        <span className="text-[14px] font-mono font-black leading-none tracking-tight text-primary">{value}</span>
      </div>
      
      {/* Dynamic Mini Chart */}
      <div className="flex-1 min-w-[80px] h-10 opacity-30 group-hover:opacity-100 transition-all duration-1000">
        <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
          <motion.path
            d={`M 0 30 Q 15 ${10 + Math.random() * 25}, 30 ${15 + Math.random() * 15} T 60 ${5 + Math.random() * 25} T 100 20`}
            fill="none"
            stroke={color}
            strokeWidth="3"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          />
        </svg>
      </div>
    </div>
  );
}

