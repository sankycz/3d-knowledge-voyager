export type CrossingKind = "departure" | "arrival";

export interface DotEvent {
  id: string;
  kind: CrossingKind;
  timestamp: number;
}

export interface TrackLane {
  id: string;
  name: string;
  /** Normalized vertical band of the frame this lane occupies, 0 = top, 1 = bottom. */
  bandTop: number;
  bandBottom: number;
  /** Normalized x position (0-1) of the counting gate line inside the band. */
  gateX: number;
  /** When true, crossing the gate left-to-right counts as an arrival; otherwise a departure. */
  leftToRightIsArrival: boolean;
  departures: number;
  arrivals: number;
  /** Capped, most-recent-last history of crossings for this lane. */
  dots: DotEvent[];
}

export interface DetectedBox {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
}

/** A train tracked across consecutive detection frames. */
export interface TrackedObject {
  id: string;
  box: DetectedBox;
  /** Normalized centroid history, oldest first, used to infer direction. */
  centroids: { x: number; y: number }[];
  lastSeenAt: number;
  /** Lane id whose gate this object has already triggered, to avoid double counting. */
  countedForLane: string | null;
}
