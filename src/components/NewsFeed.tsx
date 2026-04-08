"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Sparkles, MessageSquare, Search, Clock, Zap, Loader2, Share2, Bookmark, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { addFavorite, removeFavorite, getFavorites } from "@/lib/favorites";

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content?: string;
  link?: string;
  image?: string | null;
  fullContent?: string | null;
  insight?: string | null;
  source?: string;
  date?: string;
  isAnalyzed?: boolean;
  isLoading?: boolean;
  translated_content?: string;
}

interface NewsFeedProps {
  isOpen: boolean;
  onClose: () => void;
  items: NewsItem[];
  searchQuery: string;
  selectedArticleId?: number | null;
  onLoadMore?: () => void;
  hasMore?: boolean;
  activeSources?: { url: string; name: string }[];
  onRemoveSource?: (url: string) => void;
}

export default function NewsFeed({ 
  isOpen, 
  onClose, 
  items: initialItems, 
  searchQuery, 
  selectedArticleId,
  onLoadMore,
  hasMore = false,
  activeSources = [],
  onRemoveSource
}: NewsFeedProps) {
  const [localItems, setLocalItems] = useState<NewsItem[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);
  const [activeArticle, setActiveArticle] = useState<NewsItem | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { user } = useAuth();

  // Funkce pro hlasovou narraci
  const speak = (text: string) => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    // Detekce jazyka (pokud obsahuje české znaky, použijeme češtinu)
    const hasCzechChars = /[áčďéěíňóřšťúůýž]/i.test(text);
    utterance.lang = hasCzechChars ? "cs-CZ" : "en-US";
    utterance.rate = 0.95; // Mírně pomalejší pro lepší srozumitelnost
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Zastavit mluvení při zavření readeru
  useEffect(() => {
    if (!activeArticle) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [activeArticle]);

  // Načíst uložené články z LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("voyager_saved_ids");
    if (saved) setSavedIds(JSON.parse(saved));
  }, []);

  // Load favorites when auth state changes
  useEffect(() => {
    if (user) {
      getFavorites(user).then(favs => {
        const ids = favs.map(f => f.id);
        setSavedIds(ids);
      });
    }
  }, [user]);

  // Synchronizace s úvodním seznamem
  useEffect(() => {
    if (initialItems.length > 0) {
      setLocalItems(initialItems);
    }
  }, [initialItems]);

  // Handle auto-opening from hero section
  useEffect(() => {
    if (isOpen && selectedArticleId !== undefined && selectedArticleId !== null && localItems.length > selectedArticleId) {
      const item = localItems[selectedArticleId];
      if (activeArticle?.id !== item.id) {
        setActiveArticle(item);
        if (!item.isAnalyzed && !item.isLoading) {
          analyzeItem(selectedArticleId);
        }
      }
    }
  }, [isOpen, selectedArticleId, localItems.length]);

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Funkce pro analýzu konkrétního článku (On-Demand)
  const analyzeItem = useCallback(async (index: number) => {
    const item = localItems[index];
    if (!item || item.isAnalyzed || item.isLoading) return;

    // Nastavit stav načítání pro konkrétní kartu
    setLocalItems(prev => prev.map((it, idx) => 
      idx === index ? { ...it, isLoading: true } : it
    ));

    try {
      const res = await fetch("/api/news/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.link, title: item.title })
      });
      const data = await res.json();
      
      setLocalItems(prev => {
        const next = [...prev];
        next[index] = { ...next[index], ...data, isLoading: false, isAnalyzed: true };
        setActiveArticle(currentActive => {
          if (currentActive && currentActive.id === next[index].id) return next[index];
          return currentActive;
        });
        return next;
      });
    } catch (err) {
      console.error("AI Analysis Failed:", err);
      setLocalItems(prev => {
        const next = [...prev];
        next[index] = { ...next[index], isLoading: false, summary: "Analýza selhala. Zkuste to znovu." };
        setActiveArticle(currentActive => {
          if (currentActive && currentActive.id === next[index].id) return next[index];
          return currentActive;
        });
        return next;
      });
    }
  }, [localItems]);

  // AUTOMATICKÝ PRE-LOAD (Omezený pro stabilitu API)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isOpen && localItems.length > 0) {
      // Pre-loadujeme pouze první 2 položky místo 3, aby se šetřil Rate-Limit
      const unanalyzedIndices = localItems
        .slice(0, 2)
        .map((it, idx) => ({ it, idx }))
        .filter(pair => !pair.it.isAnalyzed && !pair.it.isLoading)
        .map(pair => pair.idx);

      // Postupné spouštění analýzy s mírným rozestupem
      unanalyzedIndices.forEach((idx, i) => {
        timeoutId = setTimeout(() => {
          analyzeItem(idx);
        }, i * 300); // 300ms rozestup
      });
    }

    return () => clearTimeout(timeoutId);
  }, [isOpen, localItems.length]);

  // Akce: Uložit (Firebase + fallback)
  const handleSave = async (e: React.MouseEvent, article: NewsItem) => {
    e.stopPropagation();
    const isSaved = savedIds.includes(article.id);
    if (user) {
      // Persist in Firestore
      if (isSaved) {
        await removeFavorite(user, article.id);
      } else {
        await addFavorite(user, article);
      }
    }
    // Update local state / fallback storage
    const newSaved = isSaved ? savedIds.filter(id => id !== article.id) : [...savedIds, article.id];
    setSavedIds(newSaved);
    localStorage.setItem("voyager_saved_ids", JSON.stringify(newSaved));
    setToast({
      message: isSaved ? "Záložka odstraněna" : "Článek uložen do Voyageru",
      type: "success",
    });
  };

  // Akce: Sdílet
  const handleShare = async (e: React.MouseEvent, item: NewsItem) => {
    e.stopPropagation();
    const shareData = {
      title: item.title,
      text: item.summary,
      url: item.link
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(item.link || "");
        setToast({ message: "Odkaz zkopírován do schránky", type: "info" });
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const filteredItems = localItems.filter(item =>
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[90] cursor-pointer"
          />

          {/* Sidebar Hub */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 150 }}
            className="fixed top-0 right-0 h-screen w-[600px] z-[100] cyber-glass flex flex-col shadow-[-40px_0_100px_rgba(0,0,0,0.9)] border-l border-white/10"
          >
          {/* Header */}
          <div className="p-12 border-b border-white/5 flex justify-between items-center relative overflow-hidden bg-white/[0.02]">
             <div className="absolute top-0 right-0 w-96 h-96 bg-[#00d1ff]/5 blur-[120px] -z-10 animate-glow"></div>
            <div>
              <h2 className="text-4xl font-display font-black tracking-tighter text-white flex items-center gap-4">
                VOYAGER HUB
                <Zap size={28} className="text-[#00d1ff] fill-[#00d1ff]/20 animate-pulse" />
              </h2>
              <div className="flex items-center gap-3 mt-3">
                <div className="w-2 h-2 rounded-full bg-[#00ffa3] animate-pulse shadow-[0_0_10px_#00ffa3]"></div>
                <span className="text-[12px] font-black text-neutral-500 uppercase tracking-[0.4em]">
                  PROUD INFORMACÍ v2.0
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-neutral-400 hover:text-white hover:scale-110 active:scale-95"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-12 space-y-16 no-scrollbar">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <motion.div
                  key={`${item.id}-${index}`}
                  layout
                  onClick={() => {
                    setActiveArticle(item);
                    if (!item.isAnalyzed && !item.isLoading) {
                      analyzeItem(index);
                    }
                  }}
                  className={`group relative neon-border rounded-[40px] transition-all cursor-pointer ${
                    item.isAnalyzed 
                      ? "bg-white/[0.04] shadow-2xl border-white/10" 
                      : "bg-white/[0.01] grayscale hover:grayscale-0 opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative h-64 bg-neutral-900 rounded-t-[40px] overflow-hidden border-b border-white/5">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-950">
                        {item.isLoading ? (
                          <Loader2 size={48} className="animate-spin text-[#00d1ff]" />
                        ) : (
                          <Sparkles size={48} className="text-neutral-800" />
                        )}
                      </div>
                    )}
                    
                    {/* Floating Badge */}
                    <div className="absolute top-8 left-8 flex items-center gap-3 bg-black/70 backdrop-blur-2xl border border-white/10 px-5 py-2 rounded-full z-10">
                      <Clock size={14} className="text-[#00d1ff]" />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90">{item.source || "Zdroj"}</span>
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80"></div>
                  </div>

                  <div className="p-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className={`px-4 py-1.5 rounded-full text-[11px] font-black tracking-[0.2em] uppercase ${
                        item.isAnalyzed 
                          ? "bg-[#00d1ff]/20 text-[#00d1ff] border border-[#00d1ff]/40 shadow-[0_0_20px_rgba(0,209,255,0.2)]" 
                          : "bg-white/5 text-neutral-500 border border-white/10"
                      }`}>
                        {item.isLoading ? "Analyzuji architekturu..." : item.isAnalyzed ? "Lokalizovaný obsah" : "Nefiltrovaný proud"}
                      </div>
                    </div>

                    <h3 className={`text-2xl font-display font-bold leading-[1.3] mb-8 tracking-tighter transition-all ${
                      item.isAnalyzed ? "text-white" : "text-neutral-400 group-hover:text-neutral-200"
                    }`}>
                      {item.title}
                    </h3>
                    
                    {item.isAnalyzed && item.insight && (
                      <div className="mb-8 p-6 rounded-[24px] bg-[#00d1ff]/5 border border-[#00d1ff]/20 text-[#00d1ff] text-sm font-bold italic leading-relaxed shadow-[inset_0_0_20px_rgba(0,209,255,0.05)]">
                        "{item.insight}"
                      </div>
                    )}

                    <div className="text-neutral-400 text-lg leading-relaxed mb-10 font-medium">
                      {item.isLoading ? (
                        <div className="space-y-5 animate-pulse">
                          <div className="h-4 bg-white/5 rounded-full w-full"></div>
                          <div className="h-4 bg-white/5 rounded-full w-[95%]"></div>
                          <div className="h-4 bg-white/5 rounded-full w-[98%]"></div>
                        </div>
                      ) : (
                        item.summary.split("\n").map((line, idx) => <p key={idx} className="mb-4 last:mb-0 opacity-80">{line}</p>)
                      )}
                    </div>
                    
                    <AnimatePresence>
                      {item.isAnalyzed && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between mt-auto pt-8 border-t border-white/5"
                        >
                          <div className="flex gap-4">
                             <button 
                               onClick={(e) => handleSave(e, item)}
                               className={`p-2.5 rounded-full transition-all border border-white/5 hover:scale-110 active:scale-95 pointer-events-auto ${
                                 savedIds.includes(item.id) 
                                   ? "bg-[#00d1ff]/20 text-[#00d1ff] border-[#00d1ff]/30" 
                                   : "bg-white/5 text-neutral-400 hover:text-[#00d1ff]"
                               }`}
                             >
                               <Bookmark size={16} fill={savedIds.includes(item.id) ? "currentColor" : "none"} />
                             </button>
                             <button 
                               onClick={(e) => handleShare(e, item)}
                               className="p-2.5 rounded-full bg-white/5 hover:bg-[#9d00ff]/10 hover:text-[#9d00ff] transition-all border border-white/5 hover:scale-110 active:scale-95 pointer-events-auto"
                             >
                               <Share2 size={16} />
                             </button>
                          </div>
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-xs font-bold text-white group/link px-6 py-2.5 rounded-full bg-[#00d1ff]/10 hover:bg-[#00d1ff]/20 border border-[#00d1ff]/20 hover:border-[#00d1ff]/40 transition-all">
                             PŮVODNÍ ZDROJ <ExternalLink size={14} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                          </a>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-neutral-600 text-center">
                <Search size={48} className="mb-4 opacity-10" />
                <p className="font-bold uppercase tracking-widest text-[10px] opacity-40">Nebyla nalezena žádná data</p>
              </div>
            )}

            {/* Load More Button in Sidebar */}
            {filteredItems.length > 0 && hasMore && onLoadMore && (
              <div className="pt-8 pb-4 flex justify-center">
                <button 
                  onClick={onLoadMore}
                  className="flex items-center gap-3 px-8 py-3 rounded-full bg-white/[0.03] hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all group"
                >
                  Načíst starší zprávy
                  <Clock size={14} className="group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            )}

            {/* Active Sources Section */}
            {activeSources.length > 0 && (
              <div className="pt-20 pb-12 border-t border-white/5">
                <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00d1ff] animate-pulse"></span>
                  Moje aktivní zdroje
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {activeSources.map((source, idx) => (
                    <motion.div 
                      key={`${source.url}-${idx}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-6 rounded-[24px] bg-white/[0.02] border border-white/5 group/source hover:border-[#00d1ff]/30 transition-all shadow-xl"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-white font-bold text-sm tracking-tight">{source.name}</span>
                        <span className="text-[9px] text-neutral-600 truncate max-w-[280px] font-medium tracking-wider">{source.url}</span>
                      </div>
                      <button 
                        onClick={() => onRemoveSource?.(source.url)}
                        className="p-3 rounded-full bg-red-500/0 hover:bg-red-500/10 text-neutral-600 hover:text-red-500 border border-transparent hover:border-red-500/20 transition-all opacity-0 group/source:hover:opacity-100"
                        title="Odstranit zdroj"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-8 bg-black/40 border-t border-white/5 text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em] text-center">
            MODERNÍ ZPRAVODAJSTVÍ POHÁNĚNÉ VIZÍ
          </div>
        </motion.div>

        {/* READER OVERLAY (Full-screen for focused reading) */}
        <AnimatePresence>
          {activeArticle && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="fixed inset-0 z-[110] bg-[#050505] flex flex-col overflow-hidden"
            >
              {/* Reader Header */}
              <div className="sticky top-0 z-20 p-8 backdrop-blur-3xl bg-black/40 border-b border-white/5 flex justify-between items-center">
                <button 
                  onClick={() => setActiveArticle(null)}
                  className="flex items-center gap-2 text-xs font-black text-[#00d1ff] uppercase tracking-[0.2em] hover:text-white transition-colors"
                >
                  <X size={18} /> Zavřít čtečku
                </button>
                
                <div className="flex items-center gap-6">
                   {/* AI Voice Toggle */}
                   {activeArticle.isAnalyzed && (
                     <button 
                       onClick={() => speak(`${activeArticle.title}. ${activeArticle.summary}`)}
                       className={`flex items-center gap-3 px-6 py-2 rounded-full border transition-all duration-500 ${
                         isSpeaking 
                           ? "bg-[#00d1ff]/20 border-[#00d1ff] text-[#00d1ff] shadow-[0_0_20px_rgba(0,209,255,0.4)]" 
                           : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30"
                       }`}
                     >
                       {isSpeaking ? (
                         <>
                           <VolumeX size={16} className="animate-pulse" />
                           <div className="flex gap-1 items-center h-4">
                             {[1,2,3,4,5,6].map(i => (
                               <motion.div 
                                 key={i}
                                 animate={{ height: [4, 14, 4, 10, 4] }}
                                 transition={{ 
                                   repeat: Infinity, 
                                   duration: 0.8 + (i * 0.1), 
                                   delay: i * 0.1,
                                   ease: "easeInOut"
                                 }}
                                 className="w-1 bg-[#00d1ff] rounded-full opacity-80"
                               />
                             ))}
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest">Ztlumit AI</span>
                         </>
                       ) : (
                         <>
                           <Volume2 size={16} />
                           <span className="text-[10px] font-black uppercase tracking-widest">Přečíst analýzu</span>
                         </>
                       )}
                     </button>
                   )}
                   
                   <div className="h-6 w-px bg-white/10 hidden md:block"></div>
                   
                   <div className="flex items-center gap-4">
                      <button onClick={(e) => handleSave(e, activeArticle)} className="p-2 rounded-full border border-white/10 hover:bg-white/5 transition-all">
                        <Bookmark size={16} fill={savedIds.includes(activeArticle.id) ? "#00d1ff" : "none"} className={savedIds.includes(activeArticle.id) ? "text-[#00d1ff]" : "text-white"} />
                      </button>
                      <a href={activeArticle.link} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-white/10 hover:bg-white/5 transition-all text-white">
                        <ExternalLink size={16} />
                      </a>
                   </div>
                </div>
              </div>

              {/* Reader Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="w-full px-6 md:px-16 lg:px-32 py-20">
                  {/* Cover Image */}
                  {activeArticle.image && (
                    <div className="relative w-full h-[50vh] mb-12 rounded-[40px] overflow-hidden shadow-2xl border border-white/5">
                      <img src={activeArticle.image} alt={activeArticle.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-8">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00d1ff] bg-[#00d1ff]/10 px-4 py-1.5 rounded-full border border-[#00d1ff]/20">
                      {activeArticle.source || "DATOVÝ LIST"}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">
                      {activeArticle.date ? new Date(activeArticle.date).toLocaleDateString() : "Aktuální"}
                    </span>
                  </div>

                  <h1 className="text-5xl font-display font-black tracking-tighter leading-[1.05] text-white mb-10">
                    {activeArticle.title}
                  </h1>

                  {/* AI Highlight Block */}
                  <div className="mb-16 p-8 rounded-[32px] bg-white/[0.03] border border-white/10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#9d00ff]/10 blur-[60px] group-hover:bg-[#9d00ff]/20 transition-all"></div>
                    <h4 className="flex items-center gap-2 text-[10px] font-black text-[#9d00ff] uppercase tracking-[0.4em] mb-6">
                      <Sparkles size={14} className="fill-[#9d00ff]/20" /> 
                      VOYAGER ANALÝZA
                    </h4>
                    <div className="space-y-4 mb-8">
                      {activeArticle.summary.split("\n").map((p, i) => (
                         <p key={i} className="text-lg text-white/90 font-medium leading-relaxed">{p}</p>
                      ))}
                    </div>
                    {activeArticle.insight && (
                      <div className="pt-6 border-t border-white/5">
                        <p className="text-sm font-bold text-[#00d1ff] italic">" {activeArticle.insight} "</p>
                      </div>
                    )}
                  </div>

                  {/* Full Content Stream */}
                  <div className="text-xl text-neutral-300 leading-[1.8] font-medium space-y-8 pb-32">
                    {activeArticle.translated_content ? (
                      activeArticle.translated_content.split("\n\n").map((para, idx) => (
                        <p key={idx}>{para}</p>
                      ))
                    ) : activeArticle.fullContent ? (
                      <div>
                        {activeArticle.fullContent.split("\n\n").map((para, idx) => (
                           <p key={idx} className="opacity-70">{para}</p>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[32px]">
                         <Loader2 size={32} className="animate-spin text-[#00d1ff] mx-auto mb-4" />
                         <p className="text-sm font-black uppercase tracking-widest text-neutral-600">Rekonstruuji původní data...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reader Footer Utility */}
              <div className="p-8 bg-black/80 border-t border-white/5 text-center">
                 <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.5em]">KONEC STREAMU &copy; 2026</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )}
  </AnimatePresence>
  );
}
