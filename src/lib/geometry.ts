import { TrackLane } from "./types";

/** Signed perpendicular distance-ish value: sign tells which side of the lane's line a point falls on. */
export function laneSide(lane: TrackLane, x: number, y: number): number {
  const dx = lane.x2 - lane.x1;
  const dy = lane.y2 - lane.y1;
  return dx * (y - lane.y1) - dy * (x - lane.x1);
}

/** Shortest distance from a point to the lane's line segment (not the infinite line). */
export function distanceToLane(lane: TrackLane, x: number, y: number): number {
  const dx = lane.x2 - lane.x1;
  const dy = lane.y2 - lane.y1;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(x - lane.x1, y - lane.y1);
  let t = ((x - lane.x1) * dx + (y - lane.y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  const px = lane.x1 + t * dx;
  const py = lane.y1 + t * dy;
  return Math.hypot(x - px, y - py);
}

export function nearestLane(lanes: TrackLane[], x: number, y: number, maxDistance = 0.12): TrackLane | null {
  let best: TrackLane | null = null;
  let bestDist = Infinity;
  for (const lane of lanes) {
    const d = distanceToLane(lane, x, y);
    if (d < bestDist) {
      bestDist = d;
      best = lane;
    }
  }
  return best && bestDist <= maxDistance ? best : null;
}
