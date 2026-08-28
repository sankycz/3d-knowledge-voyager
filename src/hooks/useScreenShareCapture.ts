"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTrackLanes } from "@/hooks/useTrackLanes";
import { useScreenCapture } from "@/hooks/useScreenCapture";
import { useTrainDetector } from "@/hooks/useTrainDetector";
import { clusterLaneLines } from "@/lib/laneClustering";
import { TransientDot } from "@/lib/drawOverlay";
import { CrossingKind, TrackLane } from "@/lib/types";

const CALIBRATION_MS = 20000;

/** Bundles the local, no-server capture path: getDisplayMedia + client-side TF.js detection. */
export function useScreenShareCapture(videoRef: React.RefObject<HTMLVideoElement | null>, active: boolean) {
  const { lanes, addLane, removeLane, renameLane, updateLane, replaceLanes, recordCrossing, resetLane, resetAll } =
    useTrackLanes();

  const lanesRef = useRef<TrackLane[]>(lanes);
  const liveBoxesRef = useRef<ReturnType<typeof useTrainDetector>["liveBoxes"]>([]);
  const transientDotsRef = useRef<TransientDot[]>([]);
  const calibrationSamplesRef = useRef<{ x: number; y: number }[] | null>(null);

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
    active: active && capture.status === "live",
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
        const fitted = clusterLaneLines(samples);
        if (fitted.length === 0) {
          setNotice("Během kalibrace nebyl rozpoznán žádný vlak. Zkuste to znovu, nebo koleje přidejte ručně.");
          return;
        }
        const existing = lanesRef.current;
        const next: TrackLane[] = fitted.map((line, i) => {
          const prior = existing[i];
          return {
            id: prior?.id ?? `lane-${i + 1}-${Date.now().toString(36)}`,
            name: prior?.name ?? `Kolej ${i + 1}`,
            x1: line.x1,
            y1: line.y1,
            x2: line.x2,
            y2: line.y2,
            invertDirection: prior?.invertDirection ?? false,
            departures: prior?.departures ?? 0,
            arrivals: prior?.arrivals ?? 0,
            dots: prior?.dots ?? [],
          };
        });
        replaceLanes(next);
        setNotice(`Rozpoznáno ${next.length} kolejí podle pohybu vlaků. Přetažením konců je lze doladit.`);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [calibrating, replaceLanes]);

  return {
    lanes,
    actions: { addLane, removeLane, renameLane, updateLane, resetLane, resetAll },
    lanesRef,
    liveBoxesRef,
    transientDotsRef,
    capture,
    modelStatus: detector.status,
    scriptsReady: { tfReady, cocoReady, scriptError, setTfReady, setCocoReady, setScriptError },
    calibrating,
    calibrationLeftMs,
    startCalibration,
    notice,
    clearNotice: () => setNotice(null),
  };
}
