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
  const lastFinalTextRef = useRef("");

  useEffect(() => {
    const timer = setTimeout(() => setIsStarted(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isStarted) return;
    
    if (isStreaming) {
      // During streaming, just show the text but maybe scramble the last few characters for effect
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
      if (text.length > lastFinalTextRef.current.length) {
        setDisplayedText(text.slice(0, -1) + chars[Math.floor(Math.random() * chars.length)]);
      } else {
        setDisplayedText(text);
      }
      lastFinalTextRef.current = text;
      return;
    }

    // Once streaming is done, do a single reveal animation if the text changed
    if (lastFinalTextRef.current !== text) {
      lastFinalTextRef.current = text;
      let iterations = 0;
      const maxIterations = 10;
      const interval = setInterval(() => {
        setDisplayedText(() => {
          if (iterations >= maxIterations) {
            clearInterval(interval);
            return text;
          }
          const chars = "X01_";
          const progress = iterations / maxIterations;
          const revealedCount = Math.floor(text.length * progress);
          iterations++;
          return text.slice(0, revealedCount) + 
                 text.slice(revealedCount).split('').map(() => chars[Math.floor(Math.random() * chars.length)]).join('').slice(0, text.length - revealedCount);
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isStarted, text, isStreaming]);

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
          const markerMap: Record<string, string> = {
            "CORE": "[[VOYAGER_CORE]]",
            "EXPLORATION": "[[VOYAGER_EXPLORATION]]",
            "OUTLOOK": "[[VOYAGER_OUTLOOK]]",
            "TIPS": "[[VOYAGER_TIPS]]"
          };
          
          const currentMarker = markerMap[tag];
          if (!currentMarker) return "";

          const startIndex = fullText.indexOf(currentMarker);
          if (startIndex === -1) return "";

          const contentStart = startIndex + currentMarker.length;
          let contentEnd = fullText.length;

          // Find the earliest occurrence of any other section marker or END markers
          const allMarkers = Object.values(markerMap);
          const endMarkers = ["[[VOYAGER_END]]", "VOYAGER_END", "---", "###"];
          
          const boundaries = [...allMarkers, ...endMarkers];

          for (const boundary of boundaries) {
            const bIndex = fullText.indexOf(boundary, contentStart);
            if (bIndex !== -1 && bIndex < contentEnd) {
              contentEnd = bIndex;
            }
          }

          let content = fullText.substring(contentStart, contentEnd).trim();
          
          // Cleanup markdown artifacts
          content = content.replace(/^[:\s\-\*#\uff1a>]+/ , '');
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
              tips: newTipsRaw ? newTipsRaw.split("\n").map(t => t.replace(/^(?:[-*•>]|###_)\s?/, "").trim()).filter(t => t.length > 3) : (next[index].isLoading ? next[index].tips : []),
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
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
        >
          <div 
            className="absolute inset-0 bg-[var(--bg-void)]/90 backdrop-blur-3xl" 
            onClick={onClose} 
          />
          
          <motion.div
            initial={{ scale: 0.98, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full h-full md:h-[95vh] md:w-[95vw] max-w-[1700px] glass-panel flex flex-col shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            {/* Intel Ribbon */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50" />
            
            {/* Header: Editorial Navigation */}
            <header className="flex items-center justify-between px-10 py-6 bg-void/20 backdrop-blur-xl z-20">
              <div className="flex items-center gap-10">
                <div className="flex flex-col">
                  <span className="subheadline mb-1">Intelligence Report</span>
                  <span className="editorial-headline text-lg tracking-[0.2em]">ID_VOYAGER_{activeArticle.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="hidden sm:flex flex-col opacity-40">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">{activeArticle.source}</span>
                  <span className="text-[9px] font-mono text-white/50 mt-1 uppercase">Clearance_Alpha</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => speak(`${activeArticle.title}. ${activeArticle.summary}`)}
                  className={`nav-pill ${isSpeaking ? "nav-pill-active" : ""}`}
                >
                  {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <button 
                  onClick={() => handleSave(activeArticle)} 
                  className={`nav-pill ${savedIds.includes(activeArticle.id) ? "nav-pill-active" : ""}`}
                >
                  <Bookmark size={16} fill={savedIds.includes(activeArticle.id) ? "currentColor" : "none"} />
                </button>
                <button 
                  onClick={onClose} 
                  className="nav-pill"
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            {/* Main Content Layout: Editorial Grid */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* Left Column: Visual & Core Analysis */}
              <div className="flex-1 overflow-y-auto no-scrollbar border-r border-white/5 bg-[var(--bg-void)]/30">
                <div className="max-w-4xl mx-auto p-8 md:p-16 lg:p-24 space-y-16">
                  {/* Article Hero Section */}
                  <div className="space-y-8">
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 rounded bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-[8px] font-black tracking-widest uppercase">Verified</span>
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[var(--text-low)] text-[8px] font-black tracking-widest uppercase">{activeArticle.date || "Real-time"}</span>
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-display font-medium tracking-tight leading-[1.1] text-[var(--text-high)]">
                      {activeArticle.title}
                    </h1>

                    {activeArticle.image && (
                      <div className="aspect-[21/9] w-full rounded-2xl overflow-hidden border border-white/5 relative group">
                        <img 
                          src={activeArticle.image} 
                          className="w-full h-full object-cover brightness-75 group-hover:brightness-100 transition-all duration-700 hover:scale-105" 
                          alt={activeArticle.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-void)]/60 to-transparent pointer-events-none" />
                      </div>
                    )}
                  </div>

                  {/* Core Analysis (Editorial Text) */}
                  <div className="space-y-20">
                    <section className="space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_var(--color-primary)]" />
                        <span className="module-label">Executive Intelligence</span>
                      </div>
                      <div className="text-lg md:text-2xl text-white/70 leading-relaxed font-light space-y-10">
                        {activeArticle.isLoading && !activeArticle.core ? (
                          <div className="flex flex-col items-center py-12 gap-4">
                            <Loader2 className="animate-spin text-[var(--accent)] opacity-50" size={32} />
                            <span className="text-[10px] font-mono tracking-widest text-[var(--text-low)] uppercase">Decrypting stream...</span>
                          </div>
                        ) : (
                          (activeArticle.core || activeArticle.summary)?.split('\n\n').map((p, i) => (
                            <p key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                              <DecryptionText text={p} delay={i * 0.1} isStreaming={activeArticle.isLoading} />
                            </p>
                          ))
                        )}
                      </div>
                    </section>

                    {(activeArticle.exploration || activeArticle.isLoading) && (
                      <section className="space-y-8 pt-16">
                        <div className="flex items-center gap-4">
                          <Cpu size={14} className="text-primary opacity-50" />
                          <span className="module-label">Deep Context Analysis</span>
                        </div>
                        <div className="text-md text-white/50 leading-relaxed font-light space-y-10">
                          {activeArticle.isLoading && !activeArticle.exploration ? (
                            <div className="h-48 flex items-center justify-center bg-white/[0.02] rounded-[40px]">
                              <span className="module-label opacity-40 animate-pulse">Running heuristic scan...</span>
                            </div>
                          ) : (
                            activeArticle.exploration?.split('\n\n').map((p, i) => (
                              <p key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.15}s` }}>
                                <DecryptionText text={p} delay={i * 0.2} isStreaming={activeArticle.isLoading} />
                              </p>
                            ))
                          )}
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Technical Sidebar */}
              <aside className="w-full lg:w-[450px] overflow-y-auto no-scrollbar bg-void/30 backdrop-blur-3xl px-10 py-12 space-y-12">
                {/* Outlook Module */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Zap size={14} className="text-primary" />
                    <span className="module-label">Forecasting</span>
                  </div>
                  <div className="p-8 rounded-[32px] bg-white/[0.03] space-y-6">
                    <p className="text-md font-medium text-white/80 leading-relaxed italic">
                      "{activeArticle.outlook || (activeArticle.isLoading ? "Synthesizing future delta..." : "Predicting impact...")}"
                    </p>
                    <div className="flex gap-1.5 h-4 items-end">
                      {[0.4, 0.7, 0.3, 0.9, 0.5, 0.8].map((h, i) => (
                        <div key={i} className="flex-1 bg-primary/10 rounded-full relative overflow-hidden">
                          <motion.div 
                            className="absolute bottom-0 left-0 w-full bg-primary/40" 
                            animate={{ height: `${h * 100}%` }}
                            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: i * 0.2 }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tactical Points */}
                {activeArticle.tips && activeArticle.tips.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Target size={14} className="text-primary" />
                      <span className="module-label">Action Metrics</span>
                    </div>
                    <div className="space-y-5">
                      {activeArticle.tips.map((tip, i) => (
                        <div key={i} className="flex gap-5 p-6 rounded-[24px] bg-white/[0.04] group hover:bg-white/[0.06] transition-all">
                          <span className="text-primary font-mono text-[10px] font-black opacity-30 mt-1">0{i+1}</span>
                          <p className="text-[12px] text-white/50 group-hover:text-white/80 leading-relaxed transition-colors">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* System Status / Confidence */}
                <div className="p-8 rounded-[32px] bg-gradient-to-br from-white/[0.05] to-transparent flex flex-col gap-5">
                  <div className="flex justify-between items-center">
                    <span className="module-label">Reliability Index</span>
                    <span className="editorial-headline text-lg text-primary">98.4%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary shadow-[0_0_10px_var(--color-primary)]" 
                      initial={{ width: 0 }} 
                      animate={{ width: "98.4%" }} 
                      transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }} 
                    />
                  </div>
                </div>

                {/* External Link */}
                <div className="pt-6">
                  <a 
                    href={activeArticle.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full h-16 flex items-center justify-center gap-4 rounded-[32px] bg-primary text-void text-[12px] font-black tracking-[0.2em] uppercase hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_15px_40px_rgba(164,230,255,0.2)]"
                  >
                    Explore Matrix
                    <ExternalLink size={16} />
                  </a>
                </div>
              </aside>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
