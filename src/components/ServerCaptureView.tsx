"use client";

import { useEffect, useRef } from "react";
import { ScanLine, Server } from "lucide-react";
import { useTrainStream } from "@/hooks/useTrainStream";
import { useLaneDrag } from "@/hooks/useLaneDrag";
import { drawOverlay, TransientDot } from "@/lib/drawOverlay";
import { TrackLane } from "@/lib/types";

export function ServerCaptureView({
  stream,
  lanesRef,
  transientDotsRef,
  serverUrl,
  onChangeServerUrl,
}: {
  stream: ReturnType<typeof useTrainStream>;
  lanesRef: React.RefObject<TrackLane[]>;
  transientDotsRef: React.RefObject<TransientDot[]>;
  serverUrl: string;
  onChangeServerUrl: (url: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const liveBoxesRef = useRef(stream.liveBoxes);

  useEffect(() => {
    liveBoxesRef.current = stream.liveBoxes;
  }, [stream.liveBoxes]);

  const { handlePointerDown, handlePointerMove, handlePointerUp } = useLaneDrag(lanesRef, stream.actions.updateLane);

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
      const img = stream.frameImgRef.current;
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, w, h);
      } else {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);
      }
      drawOverlay(ctx, w, h, dpr, lanesRef.current, liveBoxesRef.current, transientDotsRef.current);
    };
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [lanesRef, stream.frameImgRef, transientDotsRef]);

  const socketLabel =
    stream.socketState === "idle"
      ? "Adresa serveru není nastavená"
      : stream.socketState === "connecting"
        ? "Připojování k serveru…"
        : stream.socketState === "open"
          ? "Připojeno"
          : stream.socketState === "closed"
            ? "Spojení přerušeno, zkouší se znovu…"
            : "Chyba spojení";

  const captureLabel =
    stream.status.capture === "live" ? "Stream čte data" : stream.status.capture === "connecting" ? "Připojování ke streamu…" : "Chyba streamu";
  const modelLabel =
    stream.status.model === "ready" ? "Model připraven" : stream.status.model === "loading" ? "Model se načítá…" : stream.status.model === "error" ? "Model selhal" : "Model nenačten";

  return (
    <div className="voyager-section p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Server size={16} className="text-[var(--color-text-low)]" />
        <input
          value={serverUrl}
          onChange={(e) => onChangeServerUrl(e.target.value)}
          placeholder="ws://vas-server:8787"
          className="min-w-[220px] flex-1 rounded-full bg-white/[0.06] px-4 py-2 text-sm outline-none focus:bg-white/[0.1]"
        />
        <button
          onClick={stream.startCalibration}
          disabled={stream.socketState !== "open" || stream.status.model !== "ready" || stream.status.calibrating}
          className="flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-sm font-semibold disabled:opacity-40"
        >
          <ScanLine size={16} />
          {stream.status.calibrating ? "Kalibrace…" : "Rozpoznat koleje z kamery"}
        </button>
      </div>

      <p className="mb-3 text-xs text-[var(--color-text-low)]">
        {socketLabel}
        {stream.socketState === "open" && ` · ${captureLabel} · ${modelLabel}`}
      </p>

      <div ref={containerRef} className="relative aspect-video w-full overflow-hidden rounded-3xl bg-black">
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
        Tento režim nevyžaduje žádné sdílení obrazovky — obraz, detekce i počítání běží nepřetržitě na vašem vlastním
        serveru (viz <code>server/README.md</code>), i když tuto stránku zrovna nemáte otevřenou. Zadejte adresu, na
        které server běží (např. <code>ws://vas-server:8787</code>). Žluté koncové body kolejí jde přetáhnout myší.
      </p>
    </div>
  );
}
