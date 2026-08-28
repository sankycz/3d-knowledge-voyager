import { TrackLane } from "./types";

const STORAGE_KEY = "train-counter:lanes:v2";
export const MAX_DOTS_PER_LANE = 300;

function isTrackLane(value: unknown): value is TrackLane {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.x1 === "number" &&
    typeof v.y1 === "number" &&
    typeof v.x2 === "number" &&
    typeof v.y2 === "number"
  );
}

export function loadLanes(): TrackLane[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isTrackLane)) return null;
    return parsed as TrackLane[];
  } catch {
    return null;
  }
}

export function saveLanes(lanes: TrackLane[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lanes));
  } catch {
    // storage full or unavailable — ignore, counts stay in memory for this session
  }
}

/**
 * Starting placement roughly matching the platform/through tracks visible in
 * the Praha hlavní nádraží camera this app is built around — eyeballed, not
 * pixel-measured, so it's meant to be dragged into precise alignment by hand
 * or replaced by "Rozpoznat koleje z kamery".
 */
export function defaultLanes(): TrackLane[] {
  const seeds: Omit<TrackLane, "id" | "departures" | "arrivals" | "dots">[] = [
    { name: "Kolej 1", x1: 0.18, y1: 0.47, x2: 0.62, y2: 0.44, invertDirection: false },
    { name: "Kolej 2", x1: 0.63, y1: 0.34, x2: 0.97, y2: 0.29, invertDirection: false },
    { name: "Kolej 3", x1: 0.63, y1: 0.47, x2: 0.97, y2: 0.4, invertDirection: false },
    { name: "Kolej 4", x1: 0.63, y1: 0.59, x2: 0.97, y2: 0.5, invertDirection: false },
  ];
  return seeds.map((seed, i) => ({
    ...seed,
    id: `lane-${i + 1}-${Date.now().toString(36)}`,
    departures: 0,
    arrivals: 0,
    dots: [],
  }));
}
