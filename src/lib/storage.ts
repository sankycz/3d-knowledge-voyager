import { TrackLane } from "./types";

const STORAGE_KEY = "train-counter:lanes:v1";
export const MAX_DOTS_PER_LANE = 300;

export function loadLanes(): TrackLane[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
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

export function defaultLanes(count: number): TrackLane[] {
  const bandHeight = 1 / count;
  return Array.from({ length: count }, (_, i) => ({
    id: `lane-${i + 1}-${Date.now().toString(36)}`,
    name: `Kolej ${i + 1}`,
    bandTop: i * bandHeight,
    bandBottom: (i + 1) * bandHeight,
    gateX: 0.5,
    leftToRightIsArrival: true,
    departures: 0,
    arrivals: 0,
    dots: [],
  }));
}
