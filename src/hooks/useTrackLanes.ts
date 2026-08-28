"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CrossingKind, TrackLane } from "@/lib/types";
import { defaultLanes, loadLanes, saveLanes, MAX_DOTS_PER_LANE } from "@/lib/storage";

export function useTrackLanes() {
  const [lanes, setLanes] = useState<TrackLane[]>([]);
  const hydrated = useRef(false);

  useEffect(() => {
    const stored = loadLanes();
    setLanes(stored && stored.length > 0 ? stored : defaultLanes(3));
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    saveLanes(lanes);
  }, [lanes]);

  const addLane = useCallback((name?: string) => {
    setLanes((prev) => {
      const index = prev.length;
      const lane: TrackLane = {
        id: `lane-${index + 1}-${Date.now().toString(36)}`,
        name: name ?? `Kolej ${index + 1}`,
        bandTop: 0,
        bandBottom: 1,
        gateX: 0.5,
        leftToRightIsArrival: true,
        departures: 0,
        arrivals: 0,
        dots: [],
      };
      return [...prev, lane];
    });
  }, []);

  const removeLane = useCallback((id: string) => {
    setLanes((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const renameLane = useCallback((id: string, name: string) => {
    setLanes((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l)));
  }, []);

  const updateLane = useCallback((id: string, patch: Partial<TrackLane>) => {
    setLanes((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const replaceLanes = useCallback((next: TrackLane[]) => {
    setLanes(next);
  }, []);

  const recordCrossing = useCallback((id: string, kind: CrossingKind) => {
    setLanes((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const dots = [...l.dots, { id: `dot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, kind, timestamp: Date.now() }];
        if (dots.length > MAX_DOTS_PER_LANE) dots.splice(0, dots.length - MAX_DOTS_PER_LANE);
        return {
          ...l,
          departures: l.departures + (kind === "departure" ? 1 : 0),
          arrivals: l.arrivals + (kind === "arrival" ? 1 : 0),
          dots,
        };
      })
    );
  }, []);

  const resetLane = useCallback((id: string) => {
    setLanes((prev) =>
      prev.map((l) => (l.id === id ? { ...l, departures: 0, arrivals: 0, dots: [] } : l))
    );
  }, []);

  const resetAll = useCallback(() => {
    setLanes((prev) => prev.map((l) => ({ ...l, departures: 0, arrivals: 0, dots: [] })));
  }, []);

  return {
    lanes,
    addLane,
    removeLane,
    renameLane,
    updateLane,
    replaceLanes,
    recordCrossing,
    resetLane,
    resetAll,
  };
}
