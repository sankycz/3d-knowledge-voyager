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

function Sparkline({ data, color }: { data: number[], color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - ((d - min) / range) * 80 - 10
  }));

  const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(" L ")}`;

  return (
    <div className="w-full h-12 relative overflow-hidden">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full drop-shadow-[0_0_8px_var(--color-primary)]">
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={`${pathData} L 100,100 L 0,100 Z`}
          fill={`url(#gradient-${color.replace('#', '')})`}
          className="opacity-10"
        />
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

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
        <div className="absolute inset-0 bg-gradient-to-b from-void via-transparent to-void z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--glow-primary)_0%,transparent_70%)] z-10 pointer-events-none opacity-30" />
      </div>

      {/* MODULAR ISLAND ARCHITECTURE (Desktop) */}
      <div className="hidden md:flex h-full w-full relative z-10 p-10 gap-10 overflow-hidden">
        
        {/* ISLAND 1: Intelligence Discovery */}
        <motion.aside 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-[420px] h-full glass-panel flex flex-col p-10 pt-28 overflow-hidden"
        >
          <header className="mb-10">
            <span className="subheadline">Intelligence Feed</span>
            <h1 className="editorial-headline text-4xl">Discovery</h1>
          </header>
          
          <div className="flex-1 overflow-hidden -mx-4">
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

        {/* CENTER GAP: 3D Visualization Visible Here */}
        <div className="flex-1 flex flex-col items-center justify-start pt-32 pointer-events-none">
           <motion.div 
             initial={{ y: -20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             className="flex items-center gap-3 pointer-events-auto px-5 py-2 glass-panel"
           >
             {["#a4e6ff", "#dfb7ff", "#00fca1", "#ffab7b"].map((c) => (
               <button 
                 key={c}
                 onClick={() => setGraphColor(c)}
                 className={`w-3.5 h-3.5 rounded-full transition-all hover:scale-150 ${graphColor === c ? "ring-2 ring-white scale-125" : "opacity-40 hover:opacity-100"}`}
                 style={{ backgroundColor: c }}
               />
             ))}
           </motion.div>
        </div>

        {/* ISLAND 2: System Telemetry HUD */}
        <motion.aside 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-[420px] h-full flex flex-col gap-10 pt-28 overflow-hidden"
        >
          {/* Module: System Integrity */}
          <div className="glass-panel p-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-text-low tracking-widest uppercase">System Integrity</span>
                <span className="text-2xl font-display font-black text-primary">STABLE</span>
              </div>
              <Activity className="text-primary animate-pulse" size={24} />
            </div>
            
            <div className="space-y-8">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-[9px] uppercase tracking-widest text-text-low">Neural Activity</span>
                  <span className="text-[10px] font-mono font-bold text-primary">84.2 TPS</span>
                </div>
                <Sparkline data={[20, 45, 30, 60, 40, 80, 50, 90, 70]} color="var(--color-primary)" />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-[9px] uppercase tracking-widest text-text-low">Logic Throughput</span>
                  <span className="text-[10px] font-mono font-bold text-secondary">2.4 GB/s</span>
                </div>
                <Sparkline data={[70, 40, 90, 50, 80, 40, 60, 30, 45]} color="var(--color-secondary)" />
              </div>
            </div>
          </div>

          {/* Module: Session Logs */}
          <div className="glass-panel p-10 flex-1 flex flex-col overflow-hidden">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   <Terminal size={14} className="text-tertiary" />
                   <span className="module-label text-tertiary">SESSION_LOGS</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
             </div>
             
             <div className="flex-1 font-mono text-[10px] space-y-3 overflow-y-auto no-scrollbar">
               {logs.map((log, i) => (
                 <div key={i} className={`flex gap-3 leading-relaxed ${i === 0 ? "text-primary" : "text-text-low/60"}`}>
                   <span className="opacity-30">{i === 0 ? ">>" : " >"}</span>
                   <span className={i === 0 ? "font-bold" : ""}>{log}</span>
                 </div>
               ))}
             </div>
          </div>
        </motion.aside>
      </div>

      {/* MOBILE LAYOUT (Editorial Split) */}
      <div className="md:hidden relative z-10 w-full h-full flex flex-col overflow-hidden px-4 pt-12 pb-10 gap-4">
        <div className="h-[40vh] glass-panel overflow-hidden relative">
          <ThreeCanvas 
            items={news} 
            onSelect={(id) => { setSelectedArticleId(id); setIsPanelOpen(true); }}
            selectedId={selectedArticleId}
            isScanning={isRefreshing}
            theme={theme}
            graphColorOverride={graphColor}
          />
        </div>

        <div className="flex-1 glass-panel flex flex-col overflow-hidden p-6">
          <header className="mb-6 flex justify-between items-end">
             <h1 className="editorial-headline text-3xl">Voyager</h1>
             <span className="text-[8px] font-mono text-text-low mb-1">UNIT_01</span>
          </header>
          <div className="flex-1 overflow-hidden -mx-2">
            <NewsList 
              items={filteredNews} 
              onSelect={(id) => { setSelectedArticleId(id); setIsPanelOpen(true); }}
              selectedId={selectedArticleId}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* FLOATING PILL NAV */}
      <div className="fixed bottom-10 md:bottom-auto md:top-10 left-0 right-0 z-[60] flex justify-center px-4 pointer-events-none">
        <motion.nav 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pointer-events-auto nav-island px-8 py-3"
        >
          <div className="flex items-center gap-4 pr-6 border-r border-white/5">
            <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_var(--color-secondary)] animate-pulse" />
            <span className="editorial-headline text-xs tracking-[0.2em] opacity-80">Archivist</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => user && setShowArchivesOnly(!showArchivesOnly)}
              className={`nav-pill ${showArchivesOnly ? "nav-pill-active" : ""}`}
            >
              <Bookmark size={16} fill={showArchivesOnly ? "currentColor" : "none"} />
            </button>
            
            <button
              onClick={() => fetchNews(false)}
              className={`nav-pill ${isRefreshing ? "text-primary scale-110" : ""}`}
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            </button>
 
            <button onClick={toggleTheme} className="nav-pill">
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <div className="ml-1 scale-90">
              <AccountButton />
            </div>
          </div>
        </motion.nav>
      </div>

      {/* Intelligence Report Modal */}
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
