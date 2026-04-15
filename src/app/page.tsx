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
import { Space_Grotesk, Manrope } from "next/font/google";
import TopNav from "@/components/TopNav";
import SideNav from "@/components/SideNav";
import SystemHUD from "@/components/SystemHUD";
import ConsoleLog from "@/components/ConsoleLog";
import FloatingPrompt from "@/components/FloatingPrompt";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

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
    <main className={`relative w-full h-screen overflow-hidden text-on-surface ${manrope.variable} ${spaceGrotesk.variable} font-sans selection:bg-primary/30 selection:text-on-surface transition-colors duration-700 bg-background ${isRefreshing ? "saturate-[200%]" : ""}`}>
      
      {/* 3D BACKGROUND LAYER (Full Screen) */}
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
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10 pointer-events-none" />
      </div>

      <TopNav />
      <SideNav />

      {/* 12-COLUMN GRID LAYOUT (Cyber-Glass 2.0) */}
      <div className="ml-0 md:ml-64 pt-24 px-4 md:px-8 pb-32 md:pb-12 grid grid-cols-1 md:grid-cols-12 gap-8 min-h-screen relative z-10">
        
        {/* LEFT COLUMN: NEURAL FEED (3 Cols) */}
        <section className="col-span-1 md:col-span-3 flex flex-col gap-8 h-auto md:h-[calc(100vh-180px)]">
          <div className="space-y-2 px-6">
            <h2 className="editorial-headline text-2xl md:text-3xl font-bold tracking-tight text-on-surface">Neural Feed</h2>
            <p className="text-[10px] font-mono text-text-low tracking-widest uppercase">Real-time AI knowledge synthesis</p>
          </div>
          
          <div className="flex-1 overflow-hidden voyager-section bg-surface-low/20 backdrop-blur-sm shadow-none min-h-[400px]">
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
        </section>

        {/* CENTER COLUMN: VISUALIZATION NUCLEUS (6 Cols) */}
        <section className="col-span-1 md:col-span-6 relative flex flex-col items-center justify-center min-h-[300px] md:min-h-[716px]">
          {/* Central Focus Element (Optional overlay or logic can go here) */}
          <div className="text-center max-w-md mt-auto mb-10 md:mb-20 pointer-events-none">
            <p className="text-[10px] uppercase tracking-[0.4em] text-text-low mb-4">Neural Visualization Active</p>
            <div className="flex flex-wrap gap-4 items-center justify-center pointer-events-auto">
              <button 
                onClick={() => fetchNews(false)}
                className="px-6 md:px-8 py-3 glass-panel bg-primary/5 hover:bg-primary/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300"
              >
                Refresh Nexus
              </button>
              <button 
                onClick={toggleTheme}
                className="px-6 md:px-8 py-3 glass-panel bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300"
              >
                {theme === 'dark' ? 'Solar Mode' : 'Lunar Mode'}
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: SYSTEM HUD (3 Cols) */}
        <section className="col-span-1 md:col-span-3 flex flex-col gap-6 h-auto md:h-[calc(100vh-180px)]">
          <SystemHUD />
          <ConsoleLog />
        </section>
      </div>

      <FloatingPrompt />

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
