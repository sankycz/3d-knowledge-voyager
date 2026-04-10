"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Sparkles, Zap, Loader2, Share2, Bookmark, Volume2, VolumeX, Terminal, Shield, Cpu, Database, Target, Activity } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { addFavorite, removeFavorite, getFavorites } from "@/lib/favorites";

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

interface NewsFeedProps {
  isOpen: boolean;
  onClose: () => void;
  items: NewsItem[];
  searchQuery: string;
  selectedArticleId?: string | null;
}

function DecryptionText({ text, delay = 0 }: { text: string, delay?: number }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsStarted(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay, text]);

  useEffect(() => {
    if (!isStarted) return;
    
    let iterations = 0;
    const interval = setInterval(() => {
      setDisplayedText(prev => {
        if (iterations >= text.length) {
          clearInterval(interval);
          return text;
        }
        
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
        const randomChar = chars[Math.floor(Math.random() * chars.length)];
        const currentText = text.slice(0, iterations) + randomChar;
        iterations += 1;
        return currentText;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [isStarted, text]);

  return <span>{displayedText}</span>;
}

export default function NewsFeed({ 
  isOpen, 
  onClose, 
  items: initialItems, 
  searchQuery, 
  selectedArticleId
}: NewsFeedProps) {
  const [localItems, setLocalItems] = useState<NewsItem[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [activeArticle, setActiveArticle] = useState<NewsItem | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { user } = useAuth();

  const speak = (text: string) => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const hasCzechChars = /[áčďéěíňóřšťúůýž]/i.test(text);
    utterance.lang = hasCzechChars ? "cs-CZ" : "en-US";
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!activeArticle) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [activeArticle]);

  useEffect(() => {
    if (user) {
      getFavorites(user).then(favs => setSavedIds(favs.map(f => f.id)));
    }
  }, [user]);

  useEffect(() => {
    if (initialItems.length > 0) setLocalItems(initialItems);
  }, [initialItems]);

  const analyzeItem = useCallback(async (index: number) => {
    const item = localItems[index];
    if (!item || item.isAnalyzed || item.isLoading) return;

    setLocalItems(prev => prev.map((it, idx) => idx === index ? { ...it, isLoading: true } : it));

    try {
      const res = await fetch("/api/news/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.link, title: item.title, stream: true })
      });

      if (res.body) {
        setLocalItems(prev => prev.map((it, idx) => 
          idx === index ? { ...it, isLoading: false, isAnalyzed: true, deep_analysis: "" } : it
        ));

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let cumulativeText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          cumulativeText += decoder.decode(value, { stream: true });

          const [deepPart, rest] = cumulativeText.split("[STRATEGIC_INSIGHT]");
          const [insightPart, tipsPart] = rest ? rest.split("[TIPS]") : ["", ""];

          setLocalItems(prev => {
            const next = [...prev];
            next[index] = { 
              ...next[index], 
              deep_analysis: deepPart.trim(),
              strategic_insight: insightPart.trim() || next[index].strategic_insight,
              practical_tips: tipsPart ? tipsPart.split("\n").filter(t => t.length > 5) : next[index].practical_tips,
              isAnalyzed: true
            };
            if (activeArticle?.id === next[index].id) setActiveArticle(next[index]);
            return next;
          });
        }
      }
    } catch (err) {
      console.error("Analysis Failed:", err);
    }
  }, [localItems, activeArticle]);

  useEffect(() => {
    if (isOpen && selectedArticleId) {
      const index = localItems.findIndex(it => it.id === selectedArticleId);
      if (index !== -1) {
        const item = localItems[index];
        setActiveArticle(item);
        if (!item.isAnalyzed && !item.isLoading) analyzeItem(index);
      }
    }
  }, [isOpen, selectedArticleId, localItems]);

  const handleSave = async (article: NewsItem) => {
    if (!user) return;
    const isSaved = savedIds.includes(article.id);
    if (isSaved) await removeFavorite(user, article.id);
    else await addFavorite(user, article);
    setSavedIds(prev => isSaved ? prev.filter(id => id !== article.id) : [...prev, article.id]);
  };

  return (
    <AnimatePresence>
      {isOpen && activeArticle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
        >
          <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" onClick={onClose} />
          
          <motion.div
            initial={{ scale: 0.95, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 30, opacity: 1 }}
            className="relative w-full max-w-6xl h-[90vh] cyber-glass rounded-3xl overflow-hidden flex flex-col border border-[#00ffff]/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] tech-corners"
          >
            <div className="scanline" />
            
            {/* HUD HEADER: CLASSIFIED INTEL */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-8">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#00ffff] animate-pulse" />
                    <span className="text-[10px] font-black text-[#00ffff] tracking-[0.5em] uppercase text-glow-cyan">DATOVÝ PAKET INTEL</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 mt-1">REF_ID: {activeArticle.id.slice(0, 16).toUpperCase()}</span>
                </div>
                <div className="h-10 w-px bg-white/10 hidden lg:block" />
                <div className="hidden lg:flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest text-[8px]">Zdroj Dat</span>
                    <span className="text-[11px] font-mono font-bold text-white uppercase">{activeArticle.source}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest text-[8px]">Klasifikace</span>
                    <span className="text-[11px] font-mono font-bold text-[#8a2be2]">TAJNÉ // AI_INTEL</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => speak(`${activeArticle.title}. ${activeArticle.summary}`)}
                  className={`p-3 rounded-xl border transition-all ${isSpeaking ? "bg-[#00ffff]/20 border-[#00ffff] text-[#00ffff] shadow-[0_0_15px_rgba(0,255,255,0.3)]" : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"}`}
                  title="Předčítat text"
                >
                  {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <button 
                  onClick={() => handleSave(activeArticle)} 
                  className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#00ffff]/50 transition-all text-neutral-400 hover:text-[#00ffff]"
                  title="Uložit do archivu"
                >
                  <Bookmark size={20} fill={savedIds.includes(activeArticle.id) ? "#00ffff" : "none"} className={savedIds.includes(activeArticle.id) ? "text-[#00ffff]" : ""} />
                </button>
                <button onClick={onClose} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-20 no-scrollbar relative">
              <div className="absolute top-10 right-10 pointer-events-none select-none opacity-20 rotate-12 flex flex-col items-center">
                <div className="border-[6px] border-red-500 text-red-500 px-8 py-2 font-black text-5xl tracking-[0.2em] rounded-xl transform scale-125 mb-2">
                  CLASSIFIED
                </div>
                <div className="text-red-500 font-mono text-[10px] tracking-widest font-black">
                  VOYAGER_CLEARANCE_LEVEL_5
                </div>
              </div>

              <div className="max-w-4xl mx-auto pb-20 relative z-10">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="px-3 py-1 bg-[#00ffff]/10 border border-[#00ffff]/30 text-[#00ffff] text-[10px] font-black tracking-[0.3em] rounded uppercase">Priority High</div>
                    <div className="px-3 py-1 bg-[#8a2be2]/10 border border-[#8a2be2]/30 text-[#8a2be2] text-[10px] font-black tracking-[0.3em] rounded uppercase">Sector: AI_DEEP_INTEL</div>
                  </div>
                  
                  <h1 className="text-5xl md:text-8xl font-display font-black tracking-tighter leading-[0.85] mb-16 text-white uppercase text-glow-cyan drop-shadow-[0_0_30px_rgba(0,255,255,0.3)]">
                    {activeArticle.title}
                  </h1>
                  
                  {activeArticle.image && (
                    <div className="w-full h-80 md:h-[500px] rounded-[40px] overflow-hidden mb-20 border border-white/10 shadow-3xl relative group">
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                      <img src={activeArticle.image} className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-[2000ms] scale-110 group-hover:scale-100" />
                      <div className="absolute bottom-10 left-10 flex items-center gap-4">
                        <Activity size={20} className="text-[#00ffff] animate-pulse" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black tracking-[0.4em] text-white">VISUÁLNÍ KONTEXT</span>
                          <span className="text-[8px] font-mono text-white/40 uppercase">Aktivní rekognice // Identifikace_Objektu</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    <div className="lg:col-span-3 space-y-12">
                       <section className="p-10 rounded-3xl bg-white/[0.03] border border-white/10 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity"><Database size={24} className="text-[#8a2be2]" /></div>
                         <h4 className="text-[10px] font-black text-[#8a2be2] tracking-[0.4em] uppercase mb-6 flex items-center gap-2">
                           <div className="w-1.5 h-1.5 bg-[#8a2be2]" /> JÁDRO ANALÝZY
                         </h4>
                         <p className="text-xl md:text-2xl text-white font-medium leading-[1.4] selection:bg-[#8a2be2]/50">
                           <DecryptionText text={activeArticle.summary} />
                         </p>
                       </section>

                       <section className="space-y-10">
                         <h4 className="text-[10px] font-black text-neutral-500 tracking-[0.4em] uppercase flex items-center gap-2">
                           <div className="w-1.5 h-1.5 bg-neutral-700" /> DETAILNÍ PRŮZKUM
                         </h4>
                         <div className="space-y-8 text-neutral-300 text-lg leading-[1.6] font-medium selection:bg-[#00ffff]/30 selection:text-white">
                           {activeArticle.isLoading ? (
                             <div className="flex flex-col items-center py-24 bg-white/[0.01] rounded-3xl border border-white/5 border-dashed">
                               <Loader2 size={40} className="animate-spin text-[#00ffff] mb-6" />
                               <span className="text-[11px] font-black tracking-[0.4em] uppercase text-neutral-600">Dekóduji hloubkovou analýzu...</span>
                             </div>
                           ) : (
                             activeArticle.deep_analysis?.split('\n\n').map((p, i) => (
                               <motion.p 
                                 initial={{ opacity: 0 }} 
                                 animate={{ opacity: 1 }} 
                                 transition={{ delay: 0.1 * i }} 
                                 key={i}
                               >
                                 <DecryptionText text={p} delay={i * 0.2} />
                               </motion.p>
                             ))
                           )}
                         </div>
                       </section>
                    </div>

                    <aside className="space-y-8">
                      <div className="p-8 rounded-3xl bg-[#00ffff]/5 border border-[#00ffff]/20 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00ffff] to-transparent animate-pulse" />
                        <div className="flex items-center gap-3 mb-6 text-[#00ffff]">
                          <Zap size={16} fill="#00ffff" />
                          <span className="text-[10px] font-black tracking-[0.3em] uppercase">STRATEGICKÝ VÝHLED</span>
                        </div>
                        <p className="text-base font-bold text-white italic leading-snug">
                          "{activeArticle.strategic_insight || "Probíhá predikce vlivu na trh a technologie..."}"
                        </p>
                      </div>

                      {activeArticle.practical_tips && activeArticle.practical_tips.length > 0 && (
                        <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10">
                          <h4 className="text-[10px] font-black text-neutral-500 tracking-[0.3em] uppercase mb-8 flex items-center gap-2">
                            <Target size={14} className="text-[#00ffa3]" /> EXEKUTIVNÍ BODY
                          </h4>
                          <div className="space-y-6">
                            {activeArticle.practical_tips.map((tip, i) => (
                               <div key={i} className="flex gap-4 group">
                                 <span className="text-[#00ffa3] font-mono text-[11px] font-black opacity-40 group-hover:opacity-100 transition-opacity mt-0.5">0{i+1}</span>
                                 <p className="text-xs text-white/70 leading-relaxed font-medium group-hover:text-white transition-colors">{tip}</p>
                               </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="p-6 border border-white/5 rounded-2xl flex flex-col gap-2">
                         <span className="text-[8px] font-black text-neutral-600 tracking-widest uppercase">Míra Spolehlivosti</span>
                         <div className="flex justify-between items-end">
                            <span className="text-xl font-mono text-[#00ffa3] font-black tracking-tight">98.4%</span>
                            <div className="flex gap-1 h-4 items-end">
                               {[0.4, 0.7, 0.9, 0.5, 0.8, 1].map((h, i) => (
                                 <div key={i} className="w-1 bg-[#00ffa3]" style={{ height: `${h * 100}%` }} />
                               ))}
                            </div>
                         </div>
                      </div>
                    </aside>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* HUD FOOTER: SYSTEM TELEMETRY */}
            <div className="p-6 bg-black/60 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center px-10 gap-4">
              <div className="flex flex-wrap items-center justify-center gap-10 text-[9px] font-black text-neutral-500 tracking-[0.5em] uppercase">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#00ffff] rounded-full" />
                  <span>COORD: X=124.2 Y=905.1</span>
                </div>
                <div className="flex items-center gap-3 hidden md:flex">
                  <div className="w-1.5 h-1.5 bg-[#8a2be2] rounded-full" />
                  <span>STAV: NEURÁLNĚ_MAPOVÁNO</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#00ffa3] rounded-full" />
                  <span>ŠIFRA: VOYAGER_X1</span>
                </div>
              </div>
              <a 
                href={activeArticle.link} 
                target="_blank" 
                className="flex items-center gap-3 text-[#00ffff] hover:text-white transition-all bg-[#00ffff]/10 px-6 py-3 rounded-xl border border-[#00ffff]/20 hover:border-[#00ffff] group"
              >
                <span className="text-[10px] font-black tracking-[0.3em]">EXTERNÍ PŘÍSTUP</span>
                <ExternalLink size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
