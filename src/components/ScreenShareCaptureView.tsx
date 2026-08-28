"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { ScanLine, Video, VideoOff } from "lucide-react";
import { useScreenShareCapture } from "@/hooks/useScreenShareCapture";
import { useLaneDrag } from "@/hooks/useLaneDrag";
import { drawOverlay } from "@/lib/drawOverlay";

const YOUTUBE_VIDEO_ID = "tmlE1ct0cYk";

export function ScreenShareCaptureView({
  active,
  videoRef,
  capture: bundle,
}: {
  active: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  capture: ReturnType<typeof useScreenShareCapture>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { tfReady, cocoReady, scriptError, setTfReady, setCocoReady, setScriptError } = bundle.scriptsReady;

  const { handlePointerDown, handlePointerMove, handlePointerUp } = useLaneDrag(bundle.lanesRef, bundle.actions.updateLane);

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
      drawOverlay(ctx, canvas.width, canvas.height, dpr, bundle.lanesRef.current, bundle.liveBoxesRef.current, bundle.transientDotsRef.current);
    };
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [bundle.lanesRef, bundle.liveBoxesRef, bundle.transientDotsRef]);

  const modelLabel =
    bundle.modelStatus === "loading"
      ? "Model se načítá…"
      : bundle.modelStatus === "error"
        ? "Model se nepodařilo načíst"
        : bundle.modelStatus === "ready"
          ? "Model připraven"
          : "Model nenačten";

  return (
    <div className="voyager-section p-4">
      {active && (
        <>
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
        </>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {bundle.capture.status !== "live" ? (
          <button
            onClick={bundle.capture.start}
            className="flex items-center gap-2 rounded-full bg-[var(--color-secondary)] px-4 py-2 text-sm font-semibold text-black"
          >
            <Video size={16} /> Spustit sdílení obrazovky
          </button>
        ) : (
          <button
            onClick={bundle.capture.stop}
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold"
          >
            <VideoOff size={16} /> Zastavit sdílení
          </button>
        )}

        <button
          onClick={bundle.startCalibration}
          disabled={bundle.capture.status !== "live" || bundle.modelStatus !== "ready" || bundle.calibrating}
          className="flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-sm font-semibold disabled:opacity-40"
        >
          <ScanLine size={16} />
          {bundle.calibrating ? `Kalibrace… ${Math.ceil(bundle.calibrationLeftMs / 1000)}s` : "Rozpoznat koleje z kamery"}
        </button>

        <span className="ml-auto text-xs text-[var(--color-text-low)]">{modelLabel}</span>
        {scriptError && <span className="text-xs text-red-300">Chyba načtení knihoven</span>}
      </div>

      <p className="mb-3 text-xs text-[var(--color-text-low)]">
        {bundle.capture.status === "idle" && "Zatím nesdílíte žádnou obrazovku."}
        {bundle.capture.status === "requesting" && "Čeká se na výběr karty/okna…"}
        {bundle.capture.status === "live" && "Sdílení aktivní — vyberte při výzvě tuto kartu."}
        {bundle.capture.status === "denied" && "Sdílení zamítnuto nebo se nezdařilo."}
        {bundle.capture.status === "ended" && "Sdílení bylo ukončeno."}
        {bundle.capture.status === "unsupported" && "Prohlížeč nepodporuje sdílení obrazovky."}
      </p>

      <div ref={containerRef} className="relative aspect-video w-full overflow-hidden rounded-3xl bg-black">
        <iframe
          className="absolute inset-0 z-0 h-full w-full"
          src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1`}
          title="Živý přenos vlakové kamery"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
        <video ref={videoRef} muted playsInline className="absolute inset-0 z-0 h-full w-full object-contain opacity-0" />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 h-full w-full cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>
      <p className="mt-3 text-xs text-[var(--color-text-low)]">
        Tip: po kliknutí na „Spustit sdílení obrazovky“ vyberte v dialogu prohlížeče <strong>tuto kartu</strong>. Žluté
        koncové body u každé tečkované koleje jde tažením myší přesunout přesně na skutečnou kolej. Detekce běží jen
        dokud máte tuto kartu otevřenou a sdílenou.
      </p>
    </div>
  );
}
