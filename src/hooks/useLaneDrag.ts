"use client";

import { useCallback, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { TrackLane } from "@/lib/types";

const HANDLE_HIT_RADIUS = 0.025;

/** Lets the user drag a lane's endpoint handles directly on the overlay canvas. */
export function useLaneDrag(lanesRef: RefObject<TrackLane[]>, updateLane: (id: string, patch: Partial<TrackLane>) => void) {
  const dragRef = useRef<{ laneId: string; end: 1 | 2 } | null>(null);

  const pointToNormalized = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      const { x, y } = pointToNormalized(e);
      for (const lane of lanesRef.current ?? []) {
        for (const end of [1, 2] as const) {
          const hx = end === 1 ? lane.x1 : lane.x2;
          const hy = end === 1 ? lane.y1 : lane.y2;
          if (Math.hypot(hx - x, hy - y) <= HANDLE_HIT_RADIUS) {
            dragRef.current = { laneId: lane.id, end };
            e.currentTarget.setPointerCapture(e.pointerId);
            return;
          }
        }
      }
    },
    [lanesRef, pointToNormalized]
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const { x, y } = pointToNormalized(e);
      const cx = Math.min(1, Math.max(0, x));
      const cy = Math.min(1, Math.max(0, y));
      updateLane(drag.laneId, drag.end === 1 ? { x1: cx, y1: cy } : { x2: cx, y2: cy });
    },
    [pointToNormalized, updateLane]
  );

  const handlePointerUp = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current) e.currentTarget.releasePointerCapture(e.pointerId);
    dragRef.current = null;
  }, []);

  return { handlePointerDown, handlePointerMove, handlePointerUp };
}
