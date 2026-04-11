"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  core?: string;
  exploration?: string;
  outlook?: string;
  tips?: string[];
  fullContent?: string;
  image?: string;
}

interface NewsFeedProps {
  isOpen: boolean;
  onClose: () => void;
  items: NewsItem[];
  selectedArticleId?: string | null;
}

function DecryptionText({ text, delay = 0, isStreaming = false }: { text: string, delay?: number, isStreaming?: boolean }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const lastTextLength = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsStarted(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isStarted) return;
    
    // If first time or not streaming, do the full decryption
    if (lastTextLength.current === 0) {
      let iterations = 0;
      const interval = setInterval(() => {
        setDisplayedText(prev => {
          if (iterations >= text.length) {
            clearInterval(interval);
            lastTextLength.current = text.length;
            return text;
          }
          const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
          const randomChar = chars[Math.floor(Math.random() * chars.length)];
          const currentText = text.slice(0, Math.max(0, iterations)) + randomChar;
          iterations += 1;
          return currentText;
        });
      }, 10);
      return () => clearInterval(interval);
    } else if (isStreaming && text.length > lastTextLength.current) {
      // For streaming updates: just update text to avoid flicker
      setDisplayedText(text);
      lastTextLength.current = text.length;
    } else if (!isStreaming && text !== displayedText) {
      // Final sync
      setDisplayedText(text);
      lastTextLength.current = text.length;
    }
  }, [isStarted, text, isStreaming, displayedText]);

  return <span>{displayedText}</span>;
}

export default function NewsFeed({ 
  isOpen, 
  onClose, 
  items: initialItems, 
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
          idx === index ? { ...it, isLoading: false, isAnalyzed: true, core: "" } : it
        ));

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let cumulativeText = "";

        let core = "", exploration = "", outlook = "", tipsRaw = "";
        
        const extractSection = (fullText: string, tag: string, nextTags: string[]) => {
          const upperFull = fullText.toUpperCase();
          const upperTag = tag.toUpperCase();
          
          // Primary: Look for @@@TAG@@@
          const tagRegex = new RegExp(`@@@\\s*${upperTag}\\s*@@@`, 'i');
          let match = fullText.match(tagRegex);
          let startIndex = -1;
          let contentStart = -1;

          if (match) {
            startIndex = match.index!;
            contentStart = startIndex + match[0].length;
          } else {
            // Fallback: Look for localized headers if tag is missing
            const fallbacks: Record<string, string[]> = {
              "CORE": ["JÁDRO ANALÝZY", "CORE ANALYSIS", "HLAVNÍ BODY"],
              "EXPLORATION": ["DETAILNÍ PRŮZKUM", "DETAILED EXPLORATION", "HLOUBKOVÁ ANALÝZA"],
              "OUTLOOK": ["STRATEGICKÝ VÝHLED", "STRATEGIC OUTLOOK", "PREDIKCE"],
              "TIPS": ["EXEKUTIVNÍ PROTOKOLY", "EXEKUTIVNÍ BODY", "PRAKTICKÉ TIPY", "PRACTICAL TIPS"]
            };
            
            const possibleHeaders = fallbacks[upperTag] || [];
            for (const header of possibleHeaders) {
              const hIndex = upperFull.indexOf(header);
              if (hIndex !== -1) {
                startIndex = hIndex;
                contentStart = hIndex + header.length;
                break;
              }
            }
          }

          if (startIndex === -1) return "";
          
          let contentEnd = fullText.length;
          
          // Find next boundary (Tag or Fallback Header)
          const nextBoundaryCandidates = [...nextTags, "KONEC PROTOKOLU", "KONEC", "---"];
          for (const boundary of nextBoundaryCandidates) {
            // Check for @@@ boundaries
            const bRegex = new RegExp(`@@@\\s*${boundary.toUpperCase()}\\s*@@@`, 'i');
            const bMatch = fullText.match(bRegex);
            if (bMatch && bMatch.index! > startIndex && bMatch.index! < contentEnd) {
              contentEnd = bMatch.index!;
            }
            
            // Check for localized boundaries as fallbacks
            const fallbacks: Record<string, string[]> = {
              "EXPLORATION": ["DETAILNÍ PRŮZKUM", "HLOUBKOVÁ ANALÝZA", "DETAILED EXPLORATION"],
              "OUTLOOK": ["STRATEGICKÝ VÝHLED", "PREDIKCE", "STRATEGIC OUTLOOK"],
              "TIPS": ["EXEKUTIVNÍ PROTOKOLY", "EXEKUTIVNÍ BODY", "PRAKTICKÉ TIPY", "PRACTICAL TIPS"],
              "KONEC PROTOKOLU": ["KONEC PROTOKOLU", "END OF REPORT"]
            };
            const nextPossibleHeaders = fallbacks[boundary] || [];
            for (const nextH of nextPossibleHeaders) {
              const nIndex = upperFull.indexOf(nextH, contentStart);
              if (nIndex !== -1 && nIndex < contentEnd) {
                contentEnd = nIndex;
              }
            }
          }
          
          let content = fullText.substring(contentStart, contentEnd).trim();
          
          // Cleanup leading symbols/headers
          content = content.replace(/^[:\s\-\*#\uff1a]+/ , '');
          const headerCleanupRegex = new RegExp(`^(JÁDRO ANALÝZY|DETAILNÍ PRŮZKUM|STRATEGICKÝ VÝHLED|EXEKUTIVNÍ PROTOKOLY|EXEKUTIVNÍ BODY|CORE ANALYSIS|DETAILED EXPLORATION|STRATEGIC OUTLOOK|EXECUTIVE PROTOCOLS|HLAVNÍ BODY|HLOUBKOVÁ ANALÝZA|PREDIKCE|PRAKTICKÉ TIPY)[:\s\*#\-]*`, 'i');
          content = content.replace(headerCleanupRegex, '');
          
          return content.trim();
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          cumulativeText += decoder.decode(value, { stream: true });

          const newCore = extractSection(cumulativeText, "CORE", ["EXPLORATION", "OUTLOOK", "TIPS"]);
          const newExploration = extractSection(cumulativeText, "EXPLORATION", ["OUTLOOK", "TIPS"]);
          const newOutlook = extractSection(cumulativeText, "OUTLOOK", ["TIPS"]);
          const newTipsRaw = extractSection(cumulativeText, "TIPS", []);

          setLocalItems(prev => {
            const next = [...prev];
            const updatedItem = { 
              ...next[index], 
              core: newCore || (next[index].isLoading ? next[index].core : ""),
              exploration: newExploration || (next[index].isLoading ? next[index].exploration : ""),
              outlook: newOutlook || (next[index].isLoading ? next[index].outlook : ""),
              tips: newTipsRaw ? newTipsRaw.split("\n").map(t => t.replace(/^[-*•]\s?/, "").trim()).filter(t => t.length > 3) : (next[index].isLoading ? next[index].tips : []),
              isAnalyzed: true
            };
            next[index] = updatedItem;
            // Update active article if it's the one being analyzed
            if (activeArticle && activeArticle.id === next[index].id) {
              setActiveArticle(updatedItem);
            }
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
          <div className="absolute inset-0 bg-[var(--bg-main)]/95 backdrop-blur-2xl" onClick={onClose} />
          
          <motion.div
            initial={{ scale: 0.95, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 30, opacity: 1 }}
            className="relative w-full max-w-6xl h-[90vh] bg-[var(--surface)] border border-[var(--primary)]/20 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] tech-corners"
          >
            <div className="scanline" />
            
            {/* HUD HEADER: CLASSIFIED INTEL */}
            <div className="flex items-center justify-between p-6 border-b border-surface-border bg-surface-shine">
              <div className="flex items-center gap-8">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent animate-pulse" />
                    <span className="text-[10px] font-black text-accent tracking-[0.5em] uppercase text-glow-cyan">DATOVÝ PAKET INTEL</span>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted mt-1">REF_ID: {activeArticle.id.slice(0, 16).toUpperCase()}</span>
                </div>
                <div className="h-10 w-px bg-surface-border hidden lg:block" />
                <div className="hidden lg:flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-accent uppercase tracking-widest text-[8px]">Zdroj Dat</span>
                    <span className="text-[11px] font-mono font-bold text-text-primary uppercase">{activeArticle.source}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest text-[8px]">Klasifikace</span>
                    <span className="text-[11px] font-mono font-bold text-accent opacity-80">TAJNÉ // AI_INTEL</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => speak(`${activeArticle.title}. ${activeArticle.summary}`)}
                  className={`p-3 rounded-xl border transition-all ${isSpeaking ? "bg-accent/20 border-accent text-accent shadow-[0_0_15px_var(--accent-glow)]" : "bg-surface-shine border-surface-border text-text-muted hover:text-text-primary"}`}
                  title="Předčítat text"
                >
                  {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <button 
                  onClick={() => handleSave(activeArticle)} 
                  className="p-3 rounded-xl bg-surface-shine border border-surface-border hover:border-accent/50 transition-all text-text-muted hover:text-accent"
                  title="Uložit do archivu"
                >
                  <Bookmark size={20} fill={savedIds.includes(activeArticle.id) ? "var(--accent)" : "none"} className={savedIds.includes(activeArticle.id) ? "text-accent" : ""} />
                </button>
                <button onClick={onClose} className="p-3 rounded-xl bg-surface-shine border border-surface-border hover:bg-surface-shine/20 transition-all text-text-primary">
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
                    <div className="px-3 py-1 bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] text-[10px] font-black tracking-[0.3em] rounded uppercase">Priority High</div>
                    <div className="px-3 py-1 bg-[var(--neon-violet)]/10 border border-[var(--neon-violet)]/30 text-[var(--neon-violet)] text-[10px] font-black tracking-[0.3em] rounded uppercase">Sector: AI_DEEP_INTEL</div>
                  </div>
                  
                  <h1 className="text-5xl md:text-8xl font-display font-black tracking-tighter leading-[0.85] mb-16 text-text-primary uppercase text-glow-cyan drop-shadow-[0_0_30px_var(--accent-glow)]">
                    {activeArticle.title}
                  </h1>
                  
                  {activeArticle.image && (
                    <div className="w-full h-80 md:h-[500px] rounded-[40px] overflow-hidden mb-20 border border-surface-border shadow-3xl relative group">
                      <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-transparent to-transparent opacity-80" />
                      <img src={activeArticle.image} className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-[2000ms] scale-110 group-hover:scale-100" />
                      <div className="absolute bottom-10 left-10 flex items-center gap-4">
                        <Activity size={20} className="text-accent animate-pulse" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black tracking-[0.4em] text-white">VISUÁLNÍ KONTEXT</span>
                          <span className="text-[8px] font-mono text-white/40 uppercase">Aktivní rekognice // Identifikace_Objektu</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    <div className="lg:col-span-3 space-y-12">
                        <section className="p-10 rounded-3xl bg-surface-shine border border-surface-border relative overflow-hidden group tech-corners">
                          <div className="absolute top-0 right-0 p-4 opacity-30 group-hover:opacity-100 transition-opacity"><Database size={24} className="text-accent" /></div>
                          <h4 className="text-[10px] font-black text-accent tracking-[0.4em] uppercase mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-accent" /> JÁDRO ANALÝZY
                          </h4>
                          <div className="space-y-6 text-xl md:text-2xl text-text-primary font-medium leading-[1.6] selection:bg-accent/50">
                            {activeArticle.isLoading && !activeArticle.core ? (
                               <div className="flex flex-col items-center py-12">
                                 <Loader2 size={30} className="animate-spin text-accent mb-4 opacity-40" />
                                 <span className="text-[9px] font-mono uppercase tracking-[0.3em] opacity-40">Extrahuji neurální data...</span>
                               </div>
                            ) : (
                                (activeArticle.core || activeArticle.summary)?.split('\n\n').map((p, i) => (
                                 <p key={i} className="mb-4 last:mb-0">
                                   <DecryptionText text={p} delay={i * 0.1} isStreaming={activeArticle.isLoading} />
                                 </p>
                                ))
                            )}
                         </div>
                       </section>

                       {(activeArticle.exploration || activeArticle.isLoading) && (
                         <section className="space-y-10">
                             <h4 className="text-[10px] font-black text-[var(--text-muted)] tracking-[0.4em] uppercase flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-[var(--text-muted)]" /> DETAILNÍ PRŮZKUM
                            </h4>
                            <div className="space-y-8 text-text-muted text-lg leading-[1.6] font-medium selection:bg-accent/30 selection:text-text-primary">
                             {activeArticle.isLoading && !activeArticle.exploration ? (
                               <div className="flex flex-col items-center py-24 bg-surface-shine rounded-3xl border border-surface-border border-dashed">
                                 <Loader2 size={40} className="animate-spin text-accent mb-6" />
                                 <span className="text-[11px] font-black tracking-[0.4em] uppercase text-text-muted">Dekóduji hloubkovou analýzu...</span>
                               </div>
                             ) : (
                               activeArticle.exploration?.split('\n\n').map((p, i) => (
                                  <motion.p 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    transition={{ delay: 0.1 * i }} 
                                    key={i}
                                  >
                                    <DecryptionText text={p} delay={i * 0.2} isStreaming={activeArticle.isLoading} />
                                  </motion.p>
                               ))
                             )}
                           </div>
                         </section>
                       )}
                    </div>

                    <aside className="space-y-8">
                      <div className="p-8 rounded-3xl bg-[var(--accent)]/5 border border-[var(--accent)]/20 relative overflow-hidden group tech-corners">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent animate-pulse" />
                        <div className="flex items-center gap-3 mb-6 text-[var(--accent)]">
                          <Zap size={16} fill="var(--accent)" />
                          <span className="text-[10px] font-black tracking-[0.3em] uppercase">STRATEGICKÝ VÝHLED</span>
                        </div>
                        <p className="text-base font-bold text-text-primary italic leading-snug">
                          "{activeArticle.outlook || (activeArticle.isLoading ? "Skenuji horizont událostí..." : "Probíhá predikce vlivu...")}"
                        </p>
                        {/* Decorative progress bars */}
                        <div className="mt-6 flex gap-1 h-3 items-end">
                            {[0.2, 0.5, 0.8, 0.4, 0.6].map((h, i) => (
                                <div key={i} className="flex-1 bg-accent/20 rounded-sm relative overflow-hidden">
                                    <motion.div 
                                        className="absolute bottom-0 left-0 w-full bg-accent" 
                                        animate={{ height: `${h * 100}%` }}
                                        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: i * 0.2 }}
                                    />
                                </div>
                            ))}
                        </div>
                      </div>

                      {activeArticle.tips && activeArticle.tips.length > 0 && (
                        <div className="p-8 rounded-3xl bg-surface-shine border border-surface-border tech-corners">
                          <h4 className="text-[10px] font-black text-[var(--text-muted)] tracking-[0.3em] uppercase mb-8 flex items-center gap-2">
                            <Target size={14} className="text-[var(--accent)]" /> EXEKUTIVNÍ BODY
                          </h4>
                           <div className="space-y-6">
                            {activeArticle.tips.map((tip, i) => (
                               <div key={i} className="flex gap-4 group">
                                 <span className="text-[var(--accent)] font-mono text-[11px] font-black opacity-40 group-hover:opacity-100 transition-opacity mt-0.5">0{i+1}</span>
                                 <p className="text-xs text-text-muted leading-relaxed font-medium group-hover:text-text-primary transition-colors">{tip}</p>
                               </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="p-6 border border-surface-border rounded-2xl flex flex-col gap-2">
                         <span className="text-[8px] font-black text-[var(--text-muted)] tracking-widest uppercase">Míra Spolehlivosti</span>
                         <div className="flex justify-between items-end">
                            <span className="text-xl font-mono text-[var(--accent)] font-black tracking-tight">98.4%</span>
                            <div className="flex gap-1 h-4 items-end">
                               {[0.4, 0.7, 0.9, 0.5, 0.8, 1].map((h, i) => (
                                 <div key={i} className="w-1 bg-[var(--accent)]" style={{ height: `${h * 100}%` }} />
                               ))}
                            </div>
                         </div>
                      </div>
                    </aside>
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="p-6 bg-surface border-t border-surface-border flex flex-col sm:flex-row justify-between items-center px-10 gap-4">
              <div className="flex flex-wrap items-center justify-center gap-10 text-[9px] font-black text-text-muted tracking-[0.5em] uppercase">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                  <span>COORD: X=124.2 Y=905.1</span>
                </div>
                <div className="flex items-center gap-3 hidden md:flex">
                  <div className="w-1.5 h-1.5 bg-[#8a2be2] rounded-full shadow-[0_0_10px_#8a2be2]" />
                  <span>STAV: NEURÁLNĚ_MAPOVÁNO</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-matrix-emerald rounded-full shadow-[0_0_10px_#00ffa3]" />
                  <span>ŠIFRA: VOYAGER_X1</span>
                </div>
              </div>
              <a 
                href={activeArticle.link} 
                target="_blank" 
                className="flex items-center gap-3 text-accent hover:text-white transition-all bg-accent/10 px-6 py-3 rounded-xl border border-accent/20 hover:border-accent group"
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
