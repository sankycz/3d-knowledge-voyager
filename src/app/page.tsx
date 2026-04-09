"use client";

import ThreeCanvas from "@/components/ThreeCanvas";
import NewsFeed from "@/components/NewsFeed";
import AccountButton from "@/components/AccountButton";
import SourceManager from "@/components/SourceManager";
import SkeletonCard from "@/components/SkeletonCard";
import { Globe, Search, Sparkles, Zap, Settings, RefreshCw } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minut

function useInterval(callback: () => void, delay: number) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);
  useEffect(() => {
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  link: string;
  date?: string;
  source: string;
  isAnalyzed?: boolean;
  isLoading?: boolean;
  strategic_insight?: string;
  deep_analysis?: string;
  practical_tips?: string[];
  fullContent?: string;
  image?: string;
  insight?: string;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSourceManagerOpen, setIsSourceManagerOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customSources, setCustomSources] = useState<{ url: string; name: string }[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const fingerprintRef = useRef<string>("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Centrální načítání dat
  const fetchNews = useCallback(async (silent = false, isLoadMore = false) => {
    if (!silent && !isLoadMore) setIsLoading(true);
    else if (silent) setIsRefreshing(true);
    
    if (isLoadMore) setIsMoreLoading(true);
    
    try {
      const extraFeeds = customSources.map(s => s.url).join(",");
      const currentOffset = isLoadMore ? offset + 30 : 0;
      
      let url = `/api/news?limit=30&offset=${currentOffset}`;
      if (extraFeeds) url += `&extraFeeds=${encodeURIComponent(extraFeeds)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      const articles = data.articles || [];
      const moreAvailable = data.hasMore ?? (articles.length >= 30);

      setHasMore(moreAvailable);

      if (isLoadMore) {
        setNews(prev => [...prev, ...articles]);
        setOffset(currentOffset);
      } else {
        // Fingerprint = hash prvních 8 titulků
        const newFingerprint = (articles as NewsItem[]).slice(0, 8).map((i: NewsItem) => i.title).join("|");
        if (newFingerprint !== fingerprintRef.current || !silent) {
          fingerprintRef.current = newFingerprint;
          setNews(articles);
          setLastUpdated(new Date());
          setOffset(0);
        }
      }
    } catch (err) {
      console.error("Chyba při načítání novinek:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsMoreLoading(false);
    }
  }, [customSources, offset]);

  useEffect(() => { fetchNews(false); }, [customSources]);

  // Auto-refresh každých 30 minut – tiché, pouze pokud jsou nové články
  useInterval(() => { fetchNews(true); }, REFRESH_INTERVAL_MS);

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden overflow-y-auto bg-[#050505] text-white">
      {/* 3D Canvas v pozadí - FIXED pro plynulý scroll */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ThreeCanvas searchQuery={searchQuery} />
        {/* Ambient Glows */}
        <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00d1ff]/10 blur-[120px] rounded-full animate-glow"></div>
        <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#9d00ff]/10 blur-[120px] rounded-full animate-glow" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Top HUD Controls - RESPONSIVE */}
      <div className="sticky top-0 left-0 right-0 z-[30] flex justify-between items-center px-6 sm:px-16 py-6 sm:py-10 pointer-events-none">
        <div className="flex items-center gap-2 sm:gap-3 bg-white/[0.04] backdrop-blur-xl border border-white/10 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[#00d1ff] shadow-[0_0_20px_rgba(0,209,255,0.1)] pointer-events-auto transition-all hover:bg-white/10 cursor-default group max-w-[140px] sm:max-w-none">
          <Sparkles size={14} className="animate-pulse group-hover:scale-110 transition-transform flex-shrink-0" />
          <span className="text-[7px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.4em] uppercase truncate">VOYAGER INTELIGENCE</span>
        </div>
        
        <div className="flex items-center gap-6 pointer-events-auto">
          {isMounted && (
            <>
              <button 
                id="explore-btn"
                onClick={() => {
                  setSelectedArticleId(null);
                  setIsPanelOpen(true);
                }}
                className="flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-2.5 sm:py-3 rounded-full bg-[#00d1ff]/10 hover:bg-[#00d1ff]/20 border border-[#00d1ff]/30 text-white font-black text-[9px] sm:text-[11px] uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all hover:scale-105 active:scale-95 group shadow-[0_0_30px_rgba(0,209,255,0.2)] hover:shadow-[0_0_40px_rgba(0,209,255,0.4)]"
              >
                <span className="hidden sm:inline">CENTRUM ZNALOSTÍ</span>
                <span className="sm:hidden">HUB</span>
                <Globe size={14} className="group-hover:rotate-[30deg] transition-transform duration-500 text-[#00d1ff] sm:w-[16px] sm:h-[16px]" />
              </button>
              
              {/* Compact Stat Cards in top bar */}
              <div className="hidden lg:flex items-center gap-4">
                <StatCardMini 
                  label="Zdroje" 
                  value={String(32 + customSources.length) + "+"} 
                  color="#00d1ff" 
                  onClick={() => setIsSourceManagerOpen(true)}
                />
                <StatCardMini label="Stav" value="Online" color="#00ffa3" />
              </div>

              <div className="flex items-center gap-2 sm:gap-3 min-w-[40px] pointer-events-auto z-[9999]">
                <AccountButton />
              </div>
            </>
          )}
        </div>
      </div>

      <SourceManager 
        isOpen={isSourceManagerOpen} 
        onClose={() => setIsSourceManagerOpen(false)} 
        onSourcesChange={(sources) => setCustomSources(sources)} 
      />

      <div className="relative z-10 flex flex-col justify-center px-6 sm:px-16 pt-10 pb-40 pointer-events-none">
        {/* Main Title Section */}
        <div className="mb-20">
          <h1 className="text-[10vw] font-display font-black leading-[0.8] tracking-tighter drop-shadow-2xl opacity-10 blur-sm absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 select-none">
            VOYAGER
          </h1>
          <h2 className="text-4xl sm:text-6xl font-display font-bold leading-[0.9] tracking-tighter mb-4 text-white">
            NEJNOVĚJŠÍ <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d1ff] to-[#9d00ff]">INTELIGENCE</span>
          </h2>
          <p className="text-sm text-neutral-500 font-medium tracking-widest uppercase opacity-60">
            AI analýza & průzkum znalostí v reálném čase
          </p>
        </div>

        {/* 6-Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl pointer-events-auto">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <SkeletonCard key={`skeleton-${idx}`} index={idx} />
            ))
          ) : (
            news.slice(0, 6).map((item, idx) => (
              <div 
                key={item.id}
                onClick={() => {
                  setSelectedArticleId(item.id);
                  setIsPanelOpen(true);
                }}
                className="group/card relative cyber-glass rounded-[24px] sm:rounded-[32px] p-5 sm:p-6 border border-white/5 transition-all duration-500 hover:border-[#00d1ff]/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] cursor-pointer animate-float"
                style={{ animationDelay: `${idx * 0.2}s` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-[#00d1ff]/10 text-[#00d1ff] px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-[#00d1ff]/20">
                    {idx === 0 ? "HLAVNÍ" : "NEJNOVĚJŠÍ"}
                  </div>
                  <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">AI NOVINKY</span>
                </div>
                <h3 className="text-lg font-display font-bold text-white mb-3 line-clamp-2 leading-tight group-hover/card:text-[#00d1ff] transition-colors">
                  {item.title}
                </h3>
                <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed opacity-60 group-hover/card:opacity-100 transition-opacity mb-4">
                  {item.summary}
                </p>
                
                <div className="flex items-center justify-between text-[8px] font-black text-neutral-500 uppercase tracking-[0.2em]">
                  <span>{item.summary ? "Lokalizováno" : "Čeká na zpracování"}</span>
                  <Zap size={10} className="text-[#00d1ff] opacity-40 group-hover/card:opacity-100 transition-opacity" />
                </div>

                {/* Hover Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[#00d1ff]/0 to-[#9d00ff]/0 group-hover/card:from-[#00d1ff]/5 group-hover/card:to-[#9d00ff]/5 blur-xl -z-10 transition-all duration-700"></div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button for Hero Grid */}
        {!isLoading && news.length > 0 && hasMore && (
          <div className="flex justify-center mt-24 mb-20 pointer-events-auto">
            <button 
              onClick={() => fetchNews(false, true)}
              disabled={isLoading || isMoreLoading}
              className="flex items-center gap-3 px-10 py-4 rounded-full bg-white/[0.03] hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white font-black text-[10px] uppercase tracking-[0.3em] transition-all group hover:scale-105 active:scale-95 disabled:opacity-50 shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
            >
              {isMoreLoading ? "Načítám inteligenční data..." : "Načíst starší zprávy"}
              <RefreshCw size={14} className={`group-hover:rotate-180 transition-transform duration-700 ${isMoreLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Postranní lišta (NewsFeed & Reader) */}
      <NewsFeed 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
        items={news} 
        searchQuery={searchQuery}
        selectedArticleId={selectedArticleId}
        onLoadMore={() => fetchNews(false, true)}
        hasMore={hasMore}
        isMoreLoading={isMoreLoading}
        activeSources={customSources}
        onRemoveSource={(url: string) => {
          const updated = customSources.filter(s => s.url !== url);
          setCustomSources(updated);
          localStorage.setItem('voyager_custom_sources', JSON.stringify(updated));
        }}
      />

      {/* Ambient Glass Border */}
      <div className="absolute inset-0 pointer-events-none border-[1px] border-white/[0.03] rounded-[24px] sm:rounded-[48px] m-2 sm:m-6"></div>
    </main>

  );
}

function StatCardMini({ label, value, color, onClick }: { label: string, value: string, color: string, onClick?: () => void }) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2 mb-0.5">
         <span className="text-[8px] font-black uppercase tracking-[0.1em] text-neutral-500 group-hover:text-neutral-400 transition-colors">{label}</span>
         <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}></div>
      </div>
      <div className="text-[12px] font-bold text-white tracking-widest uppercase">{value}</div>
    </>
  );

  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className="flex flex-col items-start bg-white/[0.03] backdrop-blur-md border border-white/5 py-1.5 px-4 rounded-2xl min-w-[100px] transition-all hover:bg-white/5 hover:border-white/10 group cursor-pointer hover:scale-105 active:scale-95 outline-none focus:ring-1 focus:ring-[#00d1ff]/50"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex flex-col bg-white/[0.03] backdrop-blur-md border border-white/5 py-1.5 px-4 rounded-2xl min-w-[100px] transition-all group">
      {content}
    </div>
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
