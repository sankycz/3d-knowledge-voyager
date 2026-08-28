"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { CrossingKind, DetectedBox, TrackLane, TrackedObject } from "@/lib/types";

export type ModelStatus = "idle" | "loading" | "ready" | "error";

interface CocoPrediction {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

interface CocoModel {
  detect: (input: HTMLVideoElement) => Promise<CocoPrediction[]>;
}

declare global {
  interface Window {
    tf?: unknown;
    cocoSsd?: { load: (opts?: { base?: string }) => Promise<CocoModel> };
  }
}

interface UseTrainDetectorOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  lanesRef: RefObject<TrackLane[]>;
  active: boolean;
  scriptsReady: boolean;
  scoreThreshold?: number;
  onCrossing: (laneId: string, kind: CrossingKind, point: { x: number; y: number }) => void;
  /** When true, every observed train's y-center is appended here for lane auto-detection. */
  calibrationSink?: number[] | null;
}

const STALE_MS = 2500;
const MATCH_DIST = 0.18;
const DETECT_INTERVAL_MS = 220;
const MODEL_WAIT_TIMEOUT_MS = 15000;

export function useTrainDetector({
  videoRef,
  lanesRef,
  active,
  scriptsReady,
  scoreThreshold = 0.4,
  onCrossing,
  calibrationSink,
}: UseTrainDetectorOptions) {
  const [status, setStatus] = useState<ModelStatus>("idle");
  const [liveBoxes, setLiveBoxes] = useState<DetectedBox[]>([]);
  const modelRef = useRef<CocoModel | null>(null);
  const trackedRef = useRef<Map<string, TrackedObject>>(new Map());
  const nextIdRef = useRef(1);
  const onCrossingRef = useRef(onCrossing);
  const calibrationSinkRef = useRef(calibrationSink);

  useEffect(() => {
    onCrossingRef.current = onCrossing;
  }, [onCrossing]);
  useEffect(() => {
    calibrationSinkRef.current = calibrationSink;
  }, [calibrationSink]);

  useEffect(() => {
    if (!scriptsReady) return;
    let cancelled = false;

    async function load() {
      if (modelRef.current) return;
      setStatus("loading");
      const start = Date.now();
      while (!window.cocoSsd) {
        if (Date.now() - start > MODEL_WAIT_TIMEOUT_MS) {
          if (!cancelled) setStatus("error");
          return;
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      if (cancelled) return;
      try {
        const model = await window.cocoSsd!.load({ base: "lite_mobilenet_v2" });
        if (cancelled) return;
        modelRef.current = model;
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [scriptsReady]);

  useEffect(() => {
    if (!active || status !== "ready") return;
    let rafId: number;
    let lastRun = 0;
    let cancelled = false;

    function evaluateCrossing(obj: TrackedObject) {
      if (obj.countedForLane) return;
      if (obj.centroids.length < 2) return;
      const lanes = lanesRef.current ?? [];
      const prev = obj.centroids[obj.centroids.length - 2];
      const curr = obj.centroids[obj.centroids.length - 1];
      const lane = lanes.find((l) => curr.y >= l.bandTop && curr.y <= l.bandBottom);
      if (!lane) return;
      const gate = lane.gateX;
      let kind: CrossingKind | null = null;
      if (prev.x < gate && curr.x >= gate) {
        kind = lane.leftToRightIsArrival ? "arrival" : "departure";
      } else if (prev.x > gate && curr.x <= gate) {
        kind = lane.leftToRightIsArrival ? "departure" : "arrival";
      }
      if (kind) {
        obj.countedForLane = lane.id;
        onCrossingRef.current(lane.id, kind, curr);
      }
    }

    const loop = async (t: number) => {
      if (cancelled) return;
      rafId = requestAnimationFrame(loop);
      if (t - lastRun < DETECT_INTERVAL_MS) return;
      lastRun = t;

      const video = videoRef.current;
      const model = modelRef.current;
      if (!video || !model || video.readyState < 2 || video.videoWidth === 0) return;

      let predictions: CocoPrediction[] = [];
      try {
        predictions = await model.detect(video);
      } catch {
        return;
      }
      if (cancelled) return;

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const trains = predictions.filter((p) => p.class === "train" && p.score >= scoreThreshold);
      const boxes: DetectedBox[] = trains.map((p) => ({
        x: p.bbox[0] / vw,
        y: p.bbox[1] / vh,
        width: p.bbox[2] / vw,
        height: p.bbox[3] / vh,
        score: p.score,
      }));
      setLiveBoxes(boxes);

      const now = Date.now();
      const tracked = trackedRef.current;
      for (const [id, obj] of tracked) {
        if (now - obj.lastSeenAt > STALE_MS) tracked.delete(id);
      }

      const unmatched = new Set(tracked.keys());
      for (const box of boxes) {
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        if (calibrationSinkRef.current) calibrationSinkRef.current.push(cy);

        let bestId: string | null = null;
        let bestDist = Infinity;
        for (const id of unmatched) {
          const obj = tracked.get(id)!;
          const last = obj.centroids[obj.centroids.length - 1];
          const d = Math.hypot(last.x - cx, last.y - cy);
          if (d < bestDist) {
            bestDist = d;
            bestId = id;
          }
        }

        if (bestId && bestDist <= MATCH_DIST) {
          unmatched.delete(bestId);
          const obj = tracked.get(bestId)!;
          obj.box = box;
          obj.lastSeenAt = now;
          obj.centroids = [...obj.centroids.slice(-9), { x: cx, y: cy }];
          evaluateCrossing(obj);
        } else {
          const id = `train-${nextIdRef.current++}`;
          tracked.set(id, {
            id,
            box,
            centroids: [{ x: cx, y: cy }],
            lastSeenAt: now,
            countedForLane: null,
          });
        }
      }
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [active, status, videoRef, lanesRef, scoreThreshold]);

  const reset = useCallback(() => {
    trackedRef.current.clear();
    setLiveBoxes([]);
  }, []);

  return { status, liveBoxes, reset };
}
