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
          idx === index ? { ...it, isAnalyzed: true } : it
        ));

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let cumulativeText = "";

        let core = "", exploration = "", outlook = "", tipsRaw = "";
        
        const extractSection = (fullText: string, tag: string, nextTags: string[]) => {
          const markerMap: Record<string, string> = {
            "CORE": "###_VOYAGER_CORE_###",
            "EXPLORATION": "###_VOYAGER_EXPLORATION_###",
            "OUTLOOK": "###_VOYAGER_OUTLOOK_###",
            "TIPS": "###_VOYAGER_TIPS_###"
          };
          
          const currentMarker = markerMap[tag];
          if (!currentMarker) return "";

          const startIndex = fullText.indexOf(currentMarker);
          if (startIndex === -1) return "";

          const contentStart = startIndex + currentMarker.length;
          let contentEnd = fullText.length;

          // Find the earliest occurrence of any other section marker or specific END markers
          const allMarkers = Object.values(markerMap);
          const endMarkers = ["###_VOYAGER_END_###", "[[VOYAGER_END]]", "VOYAGER_END", "---"];
          
          const boundaries = [...allMarkers, ...endMarkers];

          for (const boundary of boundaries) {
            if (boundary === currentMarker) continue;
            
            // Search for the boundary, but also check for markdown-prefixed versions
            const bIndex = fullText.indexOf(boundary, contentStart);
            const altBoundary = boundary.replace("###", "##"); // Catch if model uses different header levels
            const altIndex = fullText.indexOf(altBoundary, contentStart);
            
            const bestIndex = (bIndex !== -1 && altIndex !== -1) ? Math.min(bIndex, altIndex) : (bIndex !== -1 ? bIndex : altIndex);

            if (bestIndex !== -1 && bestIndex < contentEnd) {
              contentEnd = bestIndex;
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
        setLocalItems(prev => {
          const next = prev.map((it, idx) => idx === index ? { ...it, isLoading: false } : it);
          const finalItem = next[index];
          if (activeArticle && activeArticle.id === finalItem.id) {
            setActiveArticle(finalItem);
          }
          return next;
        });
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
          
            className="relative w-full h-full md:h-[95vh] md:w-[95vw] max-w-[1780px] voyager-section flex flex-col shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden bg-background"
          >
            {/* Intel Ribbon */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50" />
            
            {/* Header: Editorial Navigation */}
            <header className="flex items-center justify-between px-14 py-10 bg-surface-low/40 backdrop-blur-2xl z-20">
              <div className="flex items-center gap-14">
                <div className="flex flex-col">
                  <span className="subheadline mb-2 text-primary/60">Intelligence Report</span>
                  <span className="editorial-headline text-2xl tracking-[0.2em]">ID_VOYAGER_{activeArticle.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="hidden sm:flex flex-col opacity-30 ml-14">
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] leading-none mb-2">{activeArticle.source}</span>
                  <span className="text-[9px] font-mono text-white/50 uppercase">Clearance_Alpha</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <button 
                  onClick={() => speak(`${activeArticle.title}. ${activeArticle.summary}`)}
                  className={`nav-pill w-14 h-14 border-none bg-white/5 hover:bg-white/10 ${isSpeaking ? "bg-primary text-background" : ""}`}
                >
                  {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <button 
                  onClick={() => handleSave(activeArticle)} 
                  className={`nav-pill w-14 h-14 border-none bg-white/5 hover:bg-white/10 ${savedIds.includes(activeArticle.id) ? "bg-primary text-background" : ""}`}
                >
                  <Bookmark size={18} fill={savedIds.includes(activeArticle.id) ? "currentColor" : "none"} />
                </button>
                <button 
                  onClick={onClose} 
                  className="nav-pill w-14 h-14 border-none bg-white/5 hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>
            </header>

            {/* Main Content Layout: Editorial Grid */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">
              {/* Left Column: Visual & Core Analysis */}
              <div className="flex-1 overflow-y-auto no-scrollbar bg-surface-low/30 backdrop-blur-xl scroll-smooth">
                <div className="max-w-5xl mx-auto p-12 md:p-20 lg:p-32 space-y-32">

                  {/* Article Hero Section */}
                  <div className="space-y-12">
                    <div className="flex gap-4">
                      <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-black tracking-[0.2em] uppercase">Verified Dispatch</span>
                      <span className="px-3 py-1 rounded-full bg-white/5 text-text-lowest text-[10px] font-black tracking-[0.2em] uppercase">{activeArticle.date || "Real-time Node"}</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-medium tracking-tight leading-[1] text-on-surface">
                      {activeArticle.title}
                    </h1>

                    {activeArticle.image && (
                      <div className="aspect-[21/9] w-full rounded-[40px] overflow-hidden relative group">
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
                      <div className="text-xl md:text-3xl text-text-mid leading-relaxed font-regular space-y-12">
                        {activeArticle.isLoading && !activeArticle.core ? (
                          <div className="flex flex-col items-center py-20 gap-6">
                            <Loader2 className="animate-spin text-primary opacity-40" size={48} />
                            <span className="text-[12px] font-mono tracking-[0.4em] text-text-lowest uppercase">Decrypting transmission signal...</span>
                          </div>
                        ) : (
                          (activeArticle.core || activeArticle.summary)?.split('\n\n').map((p, i) => (
                            <p key={i} className="animate-fade-in opacity-90 hover:opacity-100 transition-opacity" style={{ animationDelay: `${i * 0.1}s` }}>
                              <DecryptionText text={p} delay={i * 0.1} isStreaming={activeArticle.isLoading} />
                            </p>
                          ))
                        )}
                      </div>
                    </section>
                    
                    <div className="glass-separator opacity-20" />

                    {(activeArticle.exploration || activeArticle.isLoading) && (

                      <section className="space-y-8 pt-16">
                        <div className="flex items-center gap-4">
                          <Cpu size={14} className="text-primary opacity-50" />
                          <span className="module-label">Deep Context Analysis</span>
                        </div>
                        <div className="text-lg text-text-low leading-relaxed font-regular space-y-10">
                          {activeArticle.isLoading && !activeArticle.exploration ? (
                            <div className="h-64 flex items-center justify-center bg-white/[0.02] rounded-[48px]">
                              <span className="module-label opacity-40 animate-pulse tracking-[0.5em]">Running heuristic deeper scan...</span>
                            </div>
                          ) : (
                            activeArticle.exploration?.split('\n\n').map((p, i) => (
                              <p key={i} className="animate-fade-in opacity-70 hover:opacity-90 transition-opacity" style={{ animationDelay: `${i * 0.15}s` }}>
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

              {/* Right Sidebar: Forecasting & Data Widgets */}
              <aside className="w-full lg:w-[560px] h-full overflow-y-auto bg-surface-mid/80 backdrop-blur-3xl p-12 lg:p-16 space-y-16">
                
                {/* Visual Analysis Marker */}
                <div className="voyager-module p-10 flex flex-col gap-6 group mb-12">
                  <div className="flex items-center gap-3">
                    <Zap size={14} className="text-primary" />
                    <span className="module-label">Forecasting</span>
                  </div>
                  <div className="p-8 rounded-[40px] bg-white/[0.04] shadow-inner space-y-6">

                    <p className="text-md font-medium text-white/80 leading-relaxed italic">
                      {activeArticle.outlook || (activeArticle.isLoading ? "Synthesizing future delta..." : "Predicting impact...")}
                    </p>
                  </div>
                </div>

                {/* Tactical Points */}
                {activeArticle.tips && activeArticle.tips.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Target size={14} className="text-primary" />
                    <span className="module-label">Action Metrics</span>
                  </div>
                  <div className="space-y-4">
                      {activeArticle.tips.map((tip, i) => (
                        <div key={i} className="flex gap-5 p-6 rounded-[32px] bg-white/[0.04] group hover:bg-white/[0.06] transition-all">

                          <span className="text-primary font-mono text-[10px] font-black opacity-30 mt-1">0{i+1}</span>
                          <p className="text-[12px] text-white/50 group-hover:text-white/80 leading-relaxed transition-colors">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}



                {/* External Link */}
                <div className="pt-10">
                  <a 
                    href={activeArticle.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full h-20 flex items-center justify-center gap-6 rounded-[48px] bg-primary text-background text-[14px] font-black tracking-[0.3em] uppercase hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_25px_60px_rgba(164,230,255,0.25)]"
                  >
                    Bridge to Source
                    <ExternalLink size={20} />
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
