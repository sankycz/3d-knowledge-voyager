"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, RotateCcw, ScanLine, Trash2, Video, VideoOff } from "lucide-react";
import { useTrackLanes } from "@/hooks/useTrackLanes";
import { useScreenCapture } from "@/hooks/useScreenCapture";
import { useTrainDetector } from "@/hooks/useTrainDetector";
import { clusterLaneBands } from "@/lib/laneClustering";
import { CrossingKind, TrackLane } from "@/lib/types";

const YOUTUBE_VIDEO_ID = "tmlE1ct0cYk";
const CALIBRATION_MS = 20000;

interface TransientDot {
  x: number;
  y: number;
  kind: CrossingKind;
  createdAt: number;
}

export default function TrainCounterApp() {
  const { lanes, addLane, removeLane, renameLane, updateLane, replaceLanes, recordCrossing, resetLane, resetAll } =
    useTrackLanes();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lanesRef = useRef<TrackLane[]>(lanes);
  const liveBoxesRef = useRef<{ x: number; y: number; width: number; height: number }[]>([]);
  const transientDotsRef = useRef<TransientDot[]>([]);
  const calibrationSamplesRef = useRef<number[] | null>(null);

  useEffect(() => {
    lanesRef.current = lanes;
  }, [lanes]);

  const [tfReady, setTfReady] = useState(false);
  const [cocoReady, setCocoReady] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationLeftMs, setCalibrationLeftMs] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const capture = useScreenCapture(videoRef);

  const handleCrossing = useCallback(
    (laneId: string, kind: CrossingKind, point: { x: number; y: number }) => {
      recordCrossing(laneId, kind);
      transientDotsRef.current.push({ x: point.x, y: point.y, kind, createdAt: Date.now() });
    },
    [recordCrossing]
  );

  const detector = useTrainDetector({
    videoRef,
    lanesRef,
    active: capture.status === "live",
    scriptsReady: cocoReady,
    onCrossing: handleCrossing,
    calibrationSink: calibrating ? calibrationSamplesRef.current : null,
  });

  useEffect(() => {
    liveBoxesRef.current = detector.liveBoxes;
  }, [detector.liveBoxes]);

  const startCalibration = useCallback(() => {
    calibrationSamplesRef.current = [];
    setCalibrating(true);
    setCalibrationLeftMs(CALIBRATION_MS);
  }, []);

  useEffect(() => {
    if (!calibrating) return;
    const start = Date.now();
    const interval = setInterval(() => {
      const left = CALIBRATION_MS - (Date.now() - start);
      setCalibrationLeftMs(Math.max(0, left));
      if (left <= 0) {
        clearInterval(interval);
        const samples = calibrationSamplesRef.current ?? [];
        calibrationSamplesRef.current = null;
        setCalibrating(false);
        const bands = clusterLaneBands(samples);
        if (bands.length === 0) {
          setNotice("Během kalibrace nebyl rozpoznán žádný vlak. Zkuste to znovu, nebo koleje přidejte ručně.");
          return;
        }
        const existing = lanesRef.current;
        const next: TrackLane[] = bands.map((band, i) => {
          const prior = existing[i];
          return {
            id: prior?.id ?? `lane-${i + 1}-${Date.now().toString(36)}`,
            name: prior?.name ?? `Kolej ${i + 1}`,
            bandTop: band.bandTop,
            bandBottom: band.bandBottom,
            gateX: prior?.gateX ?? 0.5,
            leftToRightIsArrival: prior?.leftToRightIsArrival ?? true,
            departures: prior?.departures ?? 0,
            arrivals: prior?.arrivals ?? 0,
            dots: prior?.dots ?? [],
          };
        });
        replaceLanes(next);
        setNotice(`Rozpoznáno ${next.length} kolejí podle pohybu vlaků. Hranice a bránu lze doladit ručně.`);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [calibrating, replaceLanes]);

  // Resize canvas to match the displayed video area and continuously redraw
  // lane guides, live detections, and fading crossing dots.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    const draw = () => {
      rafId = requestAnimationFrame(draw);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (const lane of lanesRef.current) {
        const top = lane.bandTop * h;
        const bottom = lane.bandBottom * h;
        ctx.strokeStyle = "rgba(164, 230, 255, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, top);
        ctx.lineTo(w, top);
        ctx.stroke();

        ctx.fillStyle = "rgba(164, 230, 255, 0.85)";
        ctx.font = "12px var(--font-sans, sans-serif)";
        ctx.fillText(lane.name, 8, top + 16);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(lane.gateX * w, top);
        ctx.lineTo(lane.gateX * w, bottom);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.strokeStyle = "rgba(74, 222, 128, 0.8)";
      ctx.lineWidth = 2;
      for (const box of liveBoxesRef.current) {
        ctx.strokeRect(box.x * w, box.y * h, box.width * w, box.height * h);
      }

      const now = Date.now();
      const life = 1800;
      transientDotsRef.current = transientDotsRef.current.filter((dot) => now - dot.createdAt < life);
      for (const dot of transientDotsRef.current) {
        const age = now - dot.createdAt;
        const t = age / life;
        const radius = (6 + t * 10) * dpr;
        const alpha = 1 - t;
        ctx.beginPath();
        ctx.fillStyle = dot.kind === "departure" ? `rgba(59,130,246,${alpha})` : `rgba(239,68,68,${alpha})`;
        ctx.arc(dot.x * w, dot.y * h, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  const modelLabel =
    detector.status === "loading"
      ? "Model se načítá…"
      : detector.status === "error"
        ? "Model se nepodařilo načíst"
        : detector.status === "ready"
          ? "Model připraven"
          : "Model nenačten";

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-mid)] px-4 py-6 md:px-8 md:py-10">
      <Script
        src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js"
        strategy="afterInteractive"
        onLoad={() => setTfReady(true)}
        onError={() => setScriptError(true)}
      />
      {tfReady && (
        <Script
          src="https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js"
          strategy="afterInteractive"
          onLoad={() => setCocoReady(true)}
          onError={() => setScriptError(true)}
        />
      )}

      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="module-label mb-2">Živá kamera · rozpoznávání vlaků</p>
          <h1 className="editorial-headline text-3xl md:text-4xl">Počítadlo vlakových souprav</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-low)]">
            Modré tečky značí odjezd, červené příjezd. Každá kolej má vlastní počítadlo a historii teček.
            Data se ukládají jen v tomto prohlížeči.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-white/[0.04] px-3 py-1.5">{modelLabel}</span>
          {scriptError && <span className="rounded-full bg-red-500/10 px-3 py-1.5 text-red-300">Chyba načtení knihoven</span>}
        </div>
      </header>

      {notice && (
        <div className="voyager-section mb-6 flex items-center justify-between gap-4 px-5 py-3 text-sm">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-[var(--color-text-low)] hover:text-[var(--color-text-high)]">
            Zavřít
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="voyager-section p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {capture.status !== "live" ? (
              <button
                onClick={capture.start}
                className="flex items-center gap-2 rounded-full bg-[var(--color-secondary)] px-4 py-2 text-sm font-semibold text-black"
              >
                <Video size={16} /> Spustit sdílení obrazovky
              </button>
            ) : (
              <button
                onClick={capture.stop}
                className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold"
              >
                <VideoOff size={16} /> Zastavit sdílení
              </button>
            )}

            <button
              onClick={startCalibration}
              disabled={capture.status !== "live" || detector.status !== "ready" || calibrating}
              className="flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              <ScanLine size={16} />
              {calibrating ? `Kalibrace… ${Math.ceil(calibrationLeftMs / 1000)}s` : "Rozpoznat koleje z kamery"}
            </button>

            <span className="ml-auto text-xs text-[var(--color-text-low)]">
              {capture.status === "idle" && "Zatím nesdílíte žádnou obrazovku."}
              {capture.status === "requesting" && "Čeká se na výběr karty/okna…"}
              {capture.status === "live" && "Sdílení aktivní — vyberte při výzvě tuto kartu."}
              {capture.status === "denied" && "Sdílení zamítnuto nebo se nezdařilo."}
              {capture.status === "ended" && "Sdílení bylo ukončeno."}
              {capture.status === "unsupported" && "Prohlížeč nepodporuje sdílení obrazovky."}
            </span>
          </div>

          <div ref={containerRef} className="relative aspect-video w-full overflow-hidden rounded-3xl bg-black">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1`}
              title="Živý přenos vlakové kamery"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
            <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full object-contain opacity-0" />
            <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
          </div>
          <p className="mt-3 text-xs text-[var(--color-text-low)]">
            Tip: po kliknutí na „Spustit sdílení obrazovky“ vyberte v dialogu prohlížeče <strong>tuto kartu</strong>, aby šlo
            analyzovat přímo vestavěné video výše. Pokud se ve videu objeví reklama, rozpoznávání se na tu dobu jednoduše
            zastaví a samo pokračuje, jakmile se vrátí živý záběr.
          </p>
        </div>

        <div className="voyager-section p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-[var(--color-text-high)]">Koleje</h2>
            <div className="flex gap-2">
              <button
                onClick={() => addLane()}
                className="flex items-center gap-1 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-semibold"
              >
                <Plus size={14} /> Přidat kolej
              </button>
              <button
                onClick={resetAll}
                className="flex items-center gap-1 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-semibold"
              >
                <RotateCcw size={14} /> Vynulovat vše
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {lanes.length === 0 && (
              <p className="text-sm text-[var(--color-text-low)]">Zatím žádné koleje — přidejte je ručně nebo spusťte rozpoznání.</p>
            )}
            {lanes.map((lane) => (
              <LaneCard
                key={lane.id}
                lane={lane}
                onRename={(name) => renameLane(lane.id, name)}
                onFlipDirection={() => updateLane(lane.id, { leftToRightIsArrival: !lane.leftToRightIsArrival })}
                onRemove={() => removeLane(lane.id)}
                onReset={() => resetLane(lane.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LaneCard({
  lane,
  onRename,
  onFlipDirection,
  onRemove,
  onReset,
}: {
  lane: TrackLane;
  onRename: (name: string) => void;
  onFlipDirection: () => void;
  onRemove: () => void;
  onReset: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <input
          value={lane.name}
          onChange={(e) => onRename(e.target.value)}
          className="w-full rounded-lg bg-transparent px-1 py-0.5 text-sm font-semibold text-[var(--color-text-high)] outline-none focus:bg-white/[0.06]"
        />
        <button onClick={onReset} title="Vynulovat kolej" className="text-[var(--color-text-low)] hover:text-[var(--color-text-high)]">
          <RotateCcw size={14} />
        </button>
        <button onClick={onRemove} title="Odebrat kolej" className="text-[var(--color-text-low)] hover:text-red-400">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mb-2 flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Odjezdy: <strong className="text-[var(--color-text-high)]">{lane.departures}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Příjezdy: <strong className="text-[var(--color-text-high)]">{lane.arrivals}</strong>
        </span>
        <button onClick={onFlipDirection} className="ml-auto text-xs text-[var(--color-text-low)] hover:text-[var(--color-text-high)]">
          Otočit směr →
        </button>
      </div>

      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-lg bg-black/30 px-2 py-2">
        {lane.dots.length === 0 && <span className="text-xs text-[var(--color-text-lowest)]">Zatím žádné projetí</span>}
        {lane.dots.map((dot) => (
          <span
            key={dot.id}
            title={new Date(dot.timestamp).toLocaleTimeString("cs-CZ")}
            className={`h-2.5 w-2.5 flex-none rounded-full ${dot.kind === "departure" ? "bg-blue-500" : "bg-red-500"}`}
          />
        ))}
      </div>
    </div>
  );
}
