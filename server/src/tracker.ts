import { CrossingKind, DetectedBox, TrackedObject, TrackLane } from "./types.js";
import { laneSide, nearestLane } from "./geometry.js";

const STALE_MS = 2500;
const MATCH_DIST = 0.18;

export type CrossingHandler = (laneId: string, kind: CrossingKind, point: { x: number; y: number }) => void;

/**
 * Matches each frame's detected boxes against trains tracked across previous
 * frames (by nearest centroid), and fires `onCrossing` once per train the
 * first time it crosses a lane's line. Mirrors the client-side tracker in
 * src/hooks/useTrainDetector.ts, minus the React plumbing.
 */
export class TrainTracker {
  private tracked = new Map<string, TrackedObject>();
  private nextId = 1;

  process(boxes: DetectedBox[], getLanes: () => TrackLane[], onCrossing: CrossingHandler) {
    const now = Date.now();
    for (const [id, obj] of this.tracked) {
      if (now - obj.lastSeenAt > STALE_MS) this.tracked.delete(id);
    }

    const unmatched = new Set(this.tracked.keys());
    for (const box of boxes) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;

      let bestId: string | null = null;
      let bestDist = Infinity;
      for (const id of unmatched) {
        const obj = this.tracked.get(id)!;
        const last = obj.centroids[obj.centroids.length - 1];
        const d = Math.hypot(last.x - cx, last.y - cy);
        if (d < bestDist) {
          bestDist = d;
          bestId = id;
        }
      }

      if (bestId && bestDist <= MATCH_DIST) {
        unmatched.delete(bestId);
        const obj = this.tracked.get(bestId)!;
        obj.box = box;
        obj.lastSeenAt = now;
        obj.centroids = [...obj.centroids.slice(-9), { x: cx, y: cy }];
        this.evaluateCrossing(obj, getLanes(), onCrossing);
      } else {
        const id = `train-${this.nextId++}`;
        this.tracked.set(id, {
          id,
          box,
          centroids: [{ x: cx, y: cy }],
          lastSeenAt: now,
          countedForLane: null,
        });
      }
    }
  }

  private evaluateCrossing(obj: TrackedObject, lanes: TrackLane[], onCrossing: CrossingHandler) {
    if (obj.countedForLane) return;
    if (obj.centroids.length < 2) return;
    const prev = obj.centroids[obj.centroids.length - 2];
    const curr = obj.centroids[obj.centroids.length - 1];
    const lane = nearestLane(lanes, curr.x, curr.y);
    if (!lane) return;

    const prevSide = laneSide(lane, prev.x, prev.y);
    const currSide = laneSide(lane, curr.x, curr.y);
    if (Math.sign(prevSide) === Math.sign(currSide)) return;

    const first = obj.centroids[0];
    const movingDown = curr.y >= first.y;
    let kind: CrossingKind = movingDown ? "departure" : "arrival";
    if (lane.invertDirection) kind = kind === "departure" ? "arrival" : "departure";

    obj.countedForLane = lane.id;
    onCrossing(lane.id, kind, curr);
  }
}
