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
        />
        <div className="absolute inset-0 bg-gradient-to-b from-void via-transparent to-void z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--glow-primary)_0%,transparent_70%)] z-10 pointer-events-none opacity-20" />
      </div>


      {/* MODULAR ISLAND ARCHITECTURE (Desktop Centered) */}
      <div className="hidden md:block absolute inset-0 z-10 transition-all duration-1000">
        
        {/* CENTERED INTELLIGENCE HUB */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-5xl bottom-24 z-20 px-8"
        >
          <div className="voyager-section h-full flex flex-col glass-depth-stack">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-surface-lowest/40 backdrop-blur-md">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl border border-primary/20 flex items-center justify-center text-primary bg-primary/5 shadow-[0_0_20px_rgba(162,228,253,0.1)]">
                  <Activity size={24} />
                </div>
                <div>
                  <h1 className="editorial-headline text-4xl mb-1 text-primary">Intelligence Hub</h1>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-text-low tracking-widest uppercase">Node: Voyager_Alpha</span>
                    <div className="w-1 h-1 rounded-full bg-text-lowest" />
                    <span className="text-[10px] font-mono text-text-low tracking-widest uppercase">Verified Connection</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="px-4 py-2 rounded-full border border-white/5 bg-white/5 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-mid">Live Feed</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <NewsList 
                items={filteredNews} 
                onSelect={(id) => {
                  setSelectedArticleId(id);
                  setIsPanelOpen(true);
                }}
                selectedId={selectedArticleId}
                isLoading={isLoading}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* MOBILE LAYOUT (Editorial Split) */}
      <div className="md:hidden relative z-10 w-full h-full flex flex-col overflow-hidden px-4 pt-12 pb-10 gap-4">
        <div className="h-[35vh] voyager-section overflow-hidden relative">
          <ThreeCanvas 
            items={news} 
            onSelect={(id) => { setSelectedArticleId(id); setIsPanelOpen(true); }}
            selectedId={selectedArticleId}
            isScanning={isRefreshing}
            theme={theme}
          />
        </div>

        <div className="flex-1 voyager-section flex flex-col overflow-hidden glass-depth-stack">
          <header className="p-6 border-b border-white/5 flex justify-between items-end">
             <h1 className="editorial-headline text-2xl text-primary">Feed</h1>
             <span className="text-[8px] font-mono text-text-low mb-1 tracking-widest">LIVE_INTEL</span>
          </header>
          <div className="flex-1 overflow-hidden">
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
      <div className="fixed bottom-10 top-auto md:bottom-auto md:top-10 left-0 right-0 z-[60] flex justify-center px-4 pointer-events-none">
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
