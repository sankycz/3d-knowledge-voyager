export type CrossingKind = "departure" | "arrival";

export interface DotEvent {
  id: string;
  kind: CrossingKind;
  timestamp: number;
}

export interface TrackLane {
  id: string;
  name: string;
  /** Endpoints of the line drawn along the track, normalized 0-1, also used as the counting gate. */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /**
   * This camera looks down at the station from above: trains moving toward
   * the bottom of the frame are pulling away (departure), trains moving
   * toward the top are pulling in (arrival). Set true to flip that rule for
   * one lane whose track runs the other way.
   */
  invertDirection: boolean;
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
