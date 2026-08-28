"use client";

import { useEffect, useRef, useState } from "react";
import { useScreenShareCapture } from "@/hooks/useScreenShareCapture";
import { useTrainStream } from "@/hooks/useTrainStream";
import { ScreenShareCaptureView } from "@/components/ScreenShareCaptureView";
import { ServerCaptureView } from "@/components/ServerCaptureView";
import { LaneSidebar } from "@/components/LaneSidebar";
import { TransientDot } from "@/lib/drawOverlay";
import { TrackLane } from "@/lib/types";

type Mode = "server" | "screenshare";

const MODE_KEY = "train-counter:mode";
const SERVER_URL_KEY = "train-counter:server-url";

export default function TrainCounterApp() {
  const [mode, setMode] = useState<Mode>("server");
  const [serverUrl, setServerUrl] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedMode = window.localStorage.getItem(MODE_KEY);
    if (storedMode === "server" || storedMode === "screenshare") setMode(storedMode);
    setServerUrl(window.localStorage.getItem(SERVER_URL_KEY) ?? "");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(MODE_KEY, mode);
  }, [mode, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(SERVER_URL_KEY, serverUrl);
  }, [serverUrl, hydrated]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const screenShare = useScreenShareCapture(videoRef, mode === "screenshare");

  const serverLanesRef = useRef<TrackLane[]>([]);
  const serverTransientDotsRef = useRef<TransientDot[]>([]);
  const stream = useTrainStream({
    url: hydrated && mode === "server" && serverUrl ? serverUrl : null,
    onCrossing: (laneId, kind, point) => {
      serverTransientDotsRef.current.push({ x: point.x, y: point.y, kind, createdAt: Date.now() });
    },
  });
  useEffect(() => {
    serverLanesRef.current = stream.lanes;
  }, [stream.lanes]);

  const activeLanes = mode === "server" ? stream.lanes : screenShare.lanes;
  const activeActions = mode === "server" ? stream.actions : screenShare.actions;
  const notice = mode === "server" ? stream.notice : screenShare.notice;
  const clearNotice = mode === "server" ? stream.clearNotice : screenShare.clearNotice;

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-mid)] px-4 py-6 md:px-8 md:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="module-label mb-2">Živá kamera · rozpoznávání vlaků</p>
          <h1 className="editorial-headline text-3xl md:text-4xl">Počítadlo vlakových souprav</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-low)]">
            Modré tečky značí odjezd, červené příjezd. Každá kolej má vlastní počítadlo a historii teček.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white/[0.04] p-1 text-xs">
          <button
            onClick={() => setMode("server")}
            className={`rounded-full px-3 py-1.5 font-semibold transition-colors ${mode === "server" ? "bg-[var(--color-secondary)] text-black" : "text-[var(--color-text-low)]"}`}
          >
            Server (automaticky)
          </button>
          <button
            onClick={() => setMode("screenshare")}
            className={`rounded-full px-3 py-1.5 font-semibold transition-colors ${mode === "screenshare" ? "bg-[var(--color-secondary)] text-black" : "text-[var(--color-text-low)]"}`}
          >
            Sdílení obrazovky
          </button>
        </div>
      </header>

      {notice && (
        <div className="voyager-section mb-6 flex items-center justify-between gap-4 px-5 py-3 text-sm">
          <span>{notice}</span>
          <button onClick={clearNotice} className="text-[var(--color-text-low)] hover:text-[var(--color-text-high)]">
            Zavřít
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        {mode === "server" ? (
          <ServerCaptureView
            stream={stream}
            lanesRef={serverLanesRef}
            transientDotsRef={serverTransientDotsRef}
            serverUrl={serverUrl}
            onChangeServerUrl={setServerUrl}
          />
        ) : (
          <ScreenShareCaptureView active={mode === "screenshare"} videoRef={videoRef} capture={screenShare} />
        )}

        <LaneSidebar lanes={activeLanes} actions={activeActions} />
      </div>
    </div>
  );
}
