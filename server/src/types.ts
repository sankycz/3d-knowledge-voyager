// Mirrors src/lib/types.ts on the frontend. The two are kept in sync by hand —
// there's no shared package between the Next.js app and this standalone
// server, and the type is small and stable enough that duplicating it beats
// the build-tooling cost of a monorepo workspace for one interface.

export type CrossingKind = "departure" | "arrival";

export interface DotEvent {
  id: string;
  kind: CrossingKind;
  timestamp: number;
}

export interface TrackLane {
  id: string;
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  invertDirection: boolean;
  departures: number;
  arrivals: number;
  dots: DotEvent[];
}

export interface DetectedBox {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
}

export interface TrackedObject {
  id: string;
  box: DetectedBox;
  centroids: { x: number; y: number }[];
  lastSeenAt: number;
  countedForLane: string | null;
}
