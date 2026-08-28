"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CrossingKind, DetectedBox, TrackLane } from "@/lib/types";

export type SocketState = "idle" | "connecting" | "open" | "closed" | "error";

export interface StreamStatus {
  capture: "connecting" | "live" | "error";
  model: "idle" | "loading" | "ready" | "error";
  calibrating: boolean;
}

interface UseTrainStreamOptions {
  url: string | null;
  onCrossing?: (laneId: string, kind: CrossingKind, point: { x: number; y: number }) => void;
}

const RECONNECT_BASE_MS = 1500;
const RECONNECT_MAX_MS = 15000;

export function useTrainStream({ url, onCrossing }: UseTrainStreamOptions) {
  const [socketState, setSocketState] = useState<SocketState>("idle");
  const [lanes, setLanes] = useState<TrackLane[]>([]);
  const [liveBoxes, setLiveBoxes] = useState<DetectedBox[]>([]);
  const [status, setStatus] = useState<StreamStatus>({ capture: "connecting", model: "idle", calibrating: false });
  const [notice, setNotice] = useState<string | null>(null);

  const frameImgRef = useRef<HTMLImageElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelayRef = useRef(RECONNECT_BASE_MS);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCrossingRef = useRef(onCrossing);
  useEffect(() => {
    onCrossingRef.current = onCrossing;
  }, [onCrossing]);

  if (typeof window !== "undefined" && !frameImgRef.current) {
    frameImgRef.current = new window.Image();
  }

  useEffect(() => {
    if (!url) {
      setSocketState("idle");
      return;
    }

    let cancelled = false;

    function connect() {
      if (cancelled || !url) return;
      setSocketState("connecting");
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        reconnectDelayRef.current = RECONNECT_BASE_MS;
        setSocketState("open");
      };

      ws.onmessage = (event) => {
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        switch (msg.type) {
          case "lanes":
            setLanes(msg.lanes as TrackLane[]);
            break;
          case "status":
            setStatus({
              capture: msg.capture as StreamStatus["capture"],
              model: msg.model as StreamStatus["model"],
              calibrating: Boolean(msg.calibrating),
            });
            break;
          case "detections":
            setLiveBoxes(msg.boxes as DetectedBox[]);
            break;
          case "crossing":
            onCrossingRef.current?.(
              msg.laneId as string,
              msg.kind as CrossingKind,
              msg.point as { x: number; y: number }
            );
            break;
          case "notice":
            setNotice(msg.message as string);
            break;
          case "frame":
            if (frameImgRef.current) {
              frameImgRef.current.src = `data:image/jpeg;base64,${msg.jpegBase64}`;
            }
            break;
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        setSocketState("closed");
        reconnectTimerRef.current = setTimeout(connect, reconnectDelayRef.current);
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 1.5, RECONNECT_MAX_MS);
      };

      ws.onerror = () => {
        if (cancelled) return;
        setSocketState("error");
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [url]);

  const send = useCallback((message: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
  }, []);

  const addLane = useCallback((name?: string) => send({ type: "addLane", name }), [send]);
  const removeLane = useCallback((id: string) => send({ type: "removeLane", id }), [send]);
  const renameLane = useCallback((id: string, name: string) => send({ type: "renameLane", id, name }), [send]);
  const updateLane = useCallback((id: string, patch: Partial<TrackLane>) => send({ type: "updateLane", id, patch }), [send]);
  const resetLane = useCallback((id: string) => send({ type: "resetLane", id }), [send]);
  const resetAll = useCallback(() => send({ type: "resetAll" }), [send]);
  const startCalibration = useCallback(() => send({ type: "startCalibration" }), [send]);
  const clearNotice = useCallback(() => setNotice(null), []);

  return {
    socketState,
    lanes,
    liveBoxes,
    status,
    notice,
    frameImgRef,
    actions: { addLane, removeLane, renameLane, updateLane, resetLane, resetAll },
    startCalibration,
    clearNotice,
  };
}
