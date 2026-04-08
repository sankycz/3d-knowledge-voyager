// src/components/SourceManager.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Link as LinkIcon, Globe, Rss, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { firestore } from "@/lib/firebase";

interface Source {
  url: string;
  name: string;
  type: "rss" | "webpage";
}

interface SourceManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSourcesChange: (sources: Source[]) => void;
}

type Tab = "rss" | "web";
type DetectionStatus = "idle" | "detecting" | "success" | "error";

export default function SourceManager({ isOpen, onClose, onSourcesChange }: SourceManagerProps) {
  const { user } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("rss");

  // RSS tab state
  const [rssUrl, setRssUrl] = useState("");
  const [rssName, setRssName] = useState("");

  // Web tab state
  const [webUrl, setWebUrl] = useState("");
  const [detectionStatus, setDetectionStatus] = useState<DetectionStatus>("idle");
  const [detectionResult, setDetectionResult] = useState<{ type: string; feedUrl?: string; name: string; error?: string } | null>(null);

  useEffect(() => {
    const loadSources = async () => {
      // 1. Načíst z localStorage (pro anonymní uživatele nebo jako offline fallback)
      const localSaved = localStorage.getItem("voyager_custom_sources");
      let currentSources: Source[] = [];
      if (localSaved) {
        try { currentSources = JSON.parse(localSaved); } catch {}
      }

      if (user) {
        // 2. Načíst z Firestore pro přihlášeného uživatele
        try {
          const docRef = firestore.doc(firestore.db, "userSources", user.uid);
          const docSnap = await firestore.getDoc(docRef);
          
          if (docSnap.exists()) {
            const fbSources = (docSnap.data() as any).sources || [];
            setSources(fbSources);
            onSourcesChange(fbSources);
          } else {
            // Migrace: pokud má localStorage data, ale Firestore ne, synchronizujeme
            if (currentSources.length > 0) {
              await firestore.setDoc(docRef, { sources: currentSources });
            }
            setSources(currentSources);
            onSourcesChange(currentSources);
          }
        } catch (err) {
          console.error("Chyba při načítání z Firestore:", err);
          setSources(currentSources);
          onSourcesChange(currentSources);
        }
      } else {
        // Nepřihlášený uživatel - používáme localStorage
        setSources(currentSources);
        onSourcesChange(currentSources);
      }
    };

    loadSources();
  }, [user]);

  const persist = async (updated: Source[]) => {
    setSources(updated);
    onSourcesChange(updated);
    
    // Vždy ukládáme do localStorage (pro anonymní režim)
    localStorage.setItem("voyager_custom_sources", JSON.stringify(updated));

    if (user) {
      try {
        const docRef = firestore.doc(firestore.db, "userSources", user.uid);
        await firestore.setDoc(docRef, { sources: updated });
      } catch (err) {
        console.error("Chyba při ukládání do Firestore:", err);
      }
    }
  };

  // ─── RSS Tab ───────────────────────────────────────────
  const addRssSource = () => {
    if (!rssUrl.trim()) return;
    let name = rssName.trim();
    try {
      if (!name) name = new URL(rssUrl).hostname;
    } catch { name = rssUrl; }

    const source: Source = { url: rssUrl.trim(), name, type: "rss" };
    if (sources.some((s) => s.url === source.url)) return; // deduplicate
    persist([...sources, source]);
    setRssUrl("");
    setRssName("");
  };

  // ─── Web Tab ───────────────────────────────────────────
  const detectSource = async () => {
    if (!webUrl.trim()) return;
    setDetectionStatus("detecting");
    setDetectionResult(null);
    try {
      const res = await fetch(`/api/scrape-source?url=${encodeURIComponent(webUrl.trim())}`);
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Detekce selhala");
      setDetectionResult(data);
      setDetectionStatus("success");
    } catch (err: any) {
      setDetectionResult({ type: "error", name: "", error: err.message });
      setDetectionStatus("error");
    }
  };

  const addDetectedSource = () => {
    if (!detectionResult || detectionStatus !== "success") return;
    const feedUrl = detectionResult.feedUrl || webUrl.trim();
    const source: Source = {
      url: feedUrl,
      name: detectionResult.name || new URL(feedUrl).hostname,
      type: detectionResult.type === "rss" ? "rss" : "webpage",
    };
    if (sources.some((s) => s.url === source.url)) return;
    persist([...sources, source]);
    setWebUrl("");
    setDetectionResult(null);
    setDetectionStatus("idle");
  };

  const removeSource = (url: string) => {
    persist(sources.filter((s) => s.url !== url));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120]"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[130] cyber-glass p-8 rounded-[32px] border border-white/10 shadow-2xl"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                <Globe size={22} className="text-[#00d1ff]" />
                SPRÁVA ZDROJŮ
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-neutral-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Tab Toggle */}
            <div className="flex bg-white/[0.03] rounded-2xl p-1 mb-6 border border-white/5">
              {([
                { key: "rss", label: "RSS kanál", icon: <Rss size={12} /> },
                { key: "web", label: "Webová stránka", icon: <Globe size={12} /> },
              ] as const).map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${
                    activeTab === key
                      ? "bg-[#00d1ff]/20 text-[#00d1ff] border border-[#00d1ff]/30"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Login Prompt for Guest Users */}
            {!user && (
              <div className="mb-6 p-4 rounded-2xl bg-[#00d1ff]/5 border border-[#00d1ff]/20 flex items-start gap-3">
                <AlertCircle size={18} className="text-[#00d1ff] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white mb-1">Režim prohlížení</p>
                  <p className="text-[10px] text-neutral-400 leading-relaxed">
                    Přihlaste se, abyste si mohli přidávat vlastní RSS feedy a webové stránky, které AI Voyager prozkoumá.
                  </p>
                </div>
              </div>
            )}

            {/* RSS Tab Content - ONLY IF LOGGED IN */}
            {activeTab === "rss" && user && (
              <div className="space-y-4 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-2">RSS adresa</label>
                  <input
                    type="url"
                    value={rssUrl}
                    onChange={(e) => setRssUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addRssSource()}
                    placeholder="https://example.com/feed.xml"
                    className="bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-[#00d1ff]/50 transition-all text-white text-sm placeholder:text-neutral-600 w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rssName}
                    onChange={(e) => setRssName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addRssSource()}
                    placeholder="Název (volitelně)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-[#00d1ff]/50 transition-all text-white text-sm placeholder:text-neutral-600"
                  />
                  <button
                    onClick={addRssSource}
                    className="bg-[#00d1ff]/20 hover:bg-[#00d1ff]/30 border border-[#00d1ff]/30 text-[#00d1ff] p-3 rounded-2xl transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* Web Tab Content - ONLY IF LOGGED IN */}
            {activeTab === "web" && user && (
              <div className="space-y-4 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-2">URL WEBU</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={webUrl}
                      onChange={(e) => { setWebUrl(e.target.value); setDetectionStatus("idle"); setDetectionResult(null); }}
                      onKeyDown={(e) => e.key === "Enter" && detectSource()}
                      placeholder="https://techcrunch.com"
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-[#00d1ff]/50 transition-all text-white text-sm placeholder:text-neutral-600"
                    />
                    <button
                      onClick={detectSource}
                      disabled={detectionStatus === "detecting" || !webUrl.trim()}
                      className="bg-[#9d00ff]/20 hover:bg-[#9d00ff]/30 border border-[#9d00ff]/30 text-[#9d00ff] px-4 rounded-2xl transition-all text-[9px] font-black uppercase tracking-widest disabled:opacity-50 flex items-center gap-2"
                    >
                      {detectionStatus === "detecting" ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        "Detekovat"
                      )}
                    </button>
                  </div>
                </div>

                {/* Detection Result */}
                {detectionStatus === "success" && detectionResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/[0.03] border border-white/10 rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle size={12} className="text-emerald-400" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                            {detectionResult.type === "rss" ? "RSS Feed nalezen" : "Webová stránka"}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-white">{detectionResult.name}</p>
                        {detectionResult.feedUrl && detectionResult.feedUrl !== webUrl && (
                          <p className="text-[10px] text-neutral-500 mt-1 truncate max-w-[280px]">{detectionResult.feedUrl}</p>
                        )}
                      </div>
                      <button
                        onClick={addDetectedSource}
                        className="bg-[#00d1ff]/20 hover:bg-[#00d1ff]/30 border border-[#00d1ff]/30 text-[#00d1ff] p-2 rounded-xl transition-all flex-shrink-0"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {detectionStatus === "error" && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-red-400 text-xs"
                  >
                    <AlertCircle size={14} />
                    {detectionResult?.error || "Detekce selhala"}
                  </motion.div>
                )}
              </div>
            )}

            {/* Sources List */}
            <div className="space-y-2 max-h-52 overflow-y-auto no-scrollbar">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-600 ml-2 mb-3">
                Sledované zdroje ({sources.length})
              </h3>
              {sources.length === 0 ? (
                <p className="text-xs text-neutral-700 italic ml-2">Zatím žádné vlastní zdroje.</p>
              ) : (
                sources.map((s) => (
                  <div
                    key={s.url}
                    className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-2xl group hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 rounded-lg ${s.type === "rss" ? "bg-orange-500/10 text-orange-400" : "bg-purple-500/10 text-purple-400"}`}>
                        {s.type === "rss" ? <Rss size={12} /> : <Globe size={12} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{s.name}</p>
                        <p className="text-[10px] text-neutral-600 truncate flex items-center gap-1 max-w-[260px]">
                          <LinkIcon size={8} /> {s.url}
                        </p>
                      </div>
                    </div>
                    {user && (
                      <button
                        onClick={() => removeSource(s.url)}
                        className="p-2 text-neutral-700 hover:text-red-400 transition-colors flex-shrink-0 ml-2"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-5 border-t border-white/5 text-center">
              <p className="text-[9px] font-black text-neutral-700 uppercase tracking-[0.3em]">NASTAVENÍ VOYAGER INTELIGENCE</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
