"use client";

import ThreeCanvas from "@/components/ThreeCanvas";
import NewsFeed from "@/components/NewsFeed";
import NewsList from "@/components/NewsList";
import AccountButton from "@/components/AccountButton";
import { useAuth } from "@/components/AuthProvider";
import { 
  Globe, Sparkles, Zap, RefreshCw, 
  Terminal, Activity, Shield, Cpu, Disc, 
  BarChart3, Wifi, Database, Target, Bookmark,
  ChevronRight, Box, Sun, Moon, LayoutGrid, Info
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
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [graphColor, setGraphColor] = useState<string>("#a4e6ff"); // Data Blue default
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
    return true;
  });

  if (!isMounted) return null;

  return (
    <main className={`relative w-full h-screen overflow-hidden text-on-surface font-sans selection:bg-primary/30 selection:text-on-surface transition-colors duration-700 bg-void ${isRefreshing ? "saturate-[200%]" : ""}`}>
      
      {/* 3D BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute inset-0 bg-gradient-to-b from-void via-transparent to-void z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--glow-primary)_0%,transparent_70%)] z-10 pointer-events-none opacity-30" />
      </div>

      {/* DESKTOP LAYOUT (Structured 3-Column Grid) */}
      <div className="hidden md:grid grid-cols-[minmax(350px,400px)_1fr_minmax(350px,400px)] h-full w-full relative z-10 grid-transition overflow-hidden">
        
        {/* COLUMN 1: Discovery Feed Sidebar */}
        <motion.aside 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="h-full feed-column flex flex-col pt-32 overflow-hidden"
        >
          <div className="px-8 mb-10">
            <span className="subheadline">Intelligence Feed</span>
            <h1 className="editorial-headline text-4xl">Synchronized Discovery</h1>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <NewsList 
              items={filteredNews} 
              onSelect={(id) => {
                setSelectedArticleId(id);
                setIsPanelOpen(true);
                addLog(`ZAMĚŘENO: PAKET_${id.slice(0,6).toUpperCase()}`);
              }}
              selectedId={selectedArticleId}
              isLoading={isLoading}
            />
          </div>
        </motion.aside>

        {/* COLUMN 2: Knowledge Sphere Viewport */}
        <section className="relative h-full flex flex-col pt-32 items-center overflow-hidden">
          <div className="absolute top-32 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-none">
            <span className="subheadline">Visualization Nucleus</span>
            <div className="flex items-center gap-3 pointer-events-auto mt-4 px-5 py-2 glass-panel">
              {["#a4e6ff", "#dfb7ff", "#00fca1", "#ffab7b"].map((c) => (
                <button 
                  key={c}
                  onClick={() => setGraphColor(c)}
                  className={`w-3.5 h-3.5 rounded-full transition-all hover:scale-150 ${graphColor === c ? "ring-2 ring-white scale-125 shadow-[0_0_15px_rgba(255,255,255,0.5)]" : "opacity-40 hover:opacity-100"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="w-full h-full relative z-0">
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
              graphColorOverride={graphColor}
            />
          </div>
        </section>

        {/* COLUMN 3: HUD & System Control */}
        <motion.aside 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="h-full pt-32 px-10 flex flex-col gap-10 bg-void/40 backdrop-blur-xl overflow-hidden"
        >
          {/* System Pulse Module */}
          <div className="voyager-module p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-text-low tracking-widest uppercase">System Integrity</span>
                <span className="text-xl font-display font-black text-primary">STABLE</span>
              </div>
              <Cpu className="text-primary animate-pulse" size={20} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-tighter text-text-low">Core Temp</span>
                <span className="text-sm font-mono font-bold">38°C</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-tighter text-text-low">Uptime</span>
                <span className="text-sm font-mono font-bold">142:12</span>
              </div>
            </div>
          </div>

          {/* Terminal Module (Collapsible) */}
          <div className={`transition-all duration-700 flex-1 flex flex-col overflow-hidden ${isTerminalOpen ? "opacity-100" : "opacity-40"}`}>
             <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                   <Terminal size={14} className="text-tertiary" />
                   <span className="module-label text-tertiary">SESSION_LOGS</span>
                </div>
                <button 
                  onClick={() => setIsTerminalOpen(!isTerminalOpen)}
                  className="text-[9px] font-bold uppercase tracking-widest text-text-low hover:text-white transition-colors"
                >
                  {isTerminalOpen ? "[ MINIMIZE ]" : "[ EXPAND ]"}
                </button>
             </div>
             
             <AnimatePresence>
               {isTerminalOpen && (
                 <motion.div 
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: "auto", opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   className="flex-1 voyager-module p-4 font-mono text-[10px] space-y-2 overflow-y-auto no-scrollbar"
                 >
                   {logs.map((log, i) => (
                     <div key={i} className={`flex gap-3 ${i === 0 ? "text-primary" : "text-text-low/60"}`}>
                       <span className="opacity-30">{i === 0 ? ">>" : " >"}</span>
                       <span className={i === 0 ? "font-bold" : ""}>{log}</span>
                     </div>
                   ))}
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </motion.aside>
      </div>

      {/* MOBILE LAYOUT (Editorial 50/50 Vertical Split) */}
      <div className="md:hidden relative z-10 w-full h-full grid grid-rows-[1.5fr_1fr] md:grid-rows-[1fr_1fr] overflow-hidden pt-20">
        {/* Top: Knowledge Sphere */}
        <div className="relative w-full h-full border-b border-white/5 overflow-hidden">
          <ThreeCanvas 
            items={news} 
            onSelect={(id) => { setSelectedArticleId(id); setIsPanelOpen(true); }}
            selectedId={selectedArticleId}
            isScanning={isRefreshing}
            theme={theme}
            graphColorOverride={graphColor}
          />
          <div className="absolute top-4 left-4 pointer-events-none">
            <span className="subheadline">Nucleus</span>
          </div>
        </div>

        {/* Bottom: Intelligence Feed */}
        <div className="flex flex-col overflow-hidden bg-void/50 backdrop-blur-md">
          <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
             <h1 className="editorial-headline text-2xl">Voyager</h1>
             <div className="flex gap-2">
                <Activity size={12} className="text-primary animate-pulse" />
                <span className="text-[8px] font-mono text-text-low">LIVE_SYNC</span>
             </div>
          </div>
          <div className="flex-1 overflow-hidden px-4 py-4">
            <NewsList 
              items={filteredNews} 
              onSelect={(id) => { setSelectedArticleId(id); setIsPanelOpen(true); }}
              selectedId={selectedArticleId}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* TOP PILL-NAV (Floating Navigation Island) */}
      <div className="fixed top-10 left-0 right-0 z-[60] flex justify-center px-4 pointer-events-none">
        <motion.nav 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pointer-events-auto nav-island px-10 py-4"
        >
          <div className="flex items-center gap-5 pr-8 border-r border-white/5">
            <div className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_10px_var(--color-secondary)] animate-pulse" />
            <span className="editorial-headline text-sm tracking-[0.3em]">Vault_Archivist</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (!user) return;
                setShowArchivesOnly(!showArchivesOnly);
              }}
              className={`nav-pill ${showArchivesOnly ? "nav-pill-active" : ""}`}
            >
              <Bookmark size={18} fill={showArchivesOnly ? "currentColor" : "none"} />
            </button>
            
            <button
              onClick={() => fetchNews(false)}
              className={`nav-pill ${isRefreshing ? "text-primary scale-110" : ""}`}
            >
              <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
            </button>
 
            <button onClick={toggleTheme} className="nav-pill">
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <div className="ml-2">
              <AccountButton />
            </div>
          </div>
        </motion.nav>
      </div>

      {/* Article Detail (Intelligence Report Overlay) */}
      <AnimatePresence>
        {isPanelOpen && (
          <NewsFeed 
            isOpen={isPanelOpen} 
            onClose={() => setIsPanelOpen(false)} 
            items={news} 
            selectedArticleId={selectedArticleId}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function HudMiniStat({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  // Keeping this for compatibility if referenced, but unused in main layout now
  return null;
}
