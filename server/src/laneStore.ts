import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { CrossingKind, TrackLane } from "./types.js";

const DATA_FILE = process.env.LANES_FILE ?? new URL("../data/lanes.json", import.meta.url).pathname;
export const MAX_DOTS_PER_LANE = 300;

function defaultLanes(): TrackLane[] {
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

export class LaneStore {
  private lanes: TrackLane[];
  private onChangeCb: ((lanes: TrackLane[]) => void) | null = null;

  constructor() {
    this.lanes = this.load();
  }

  private load(): TrackLane[] {
    try {
      if (existsSync(DATA_FILE)) {
        const parsed = JSON.parse(readFileSync(DATA_FILE, "utf-8"));
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fall through to defaults
    }
    return defaultLanes();
  }

  private persist() {
    try {
      writeFileSync(DATA_FILE, JSON.stringify(this.lanes, null, 2));
    } catch (err) {
      console.error("Failed to persist lanes:", err);
    }
    this.onChangeCb?.(this.lanes);
  }

  onChange(cb: (lanes: TrackLane[]) => void) {
    this.onChangeCb = cb;
  }

  getAll(): TrackLane[] {
    return this.lanes;
  }

  addLane(name?: string) {
    const lane: TrackLane = {
      id: `lane-${this.lanes.length + 1}-${Date.now().toString(36)}`,
      name: name ?? `Kolej ${this.lanes.length + 1}`,
      x1: 0.3,
      y1: 0.55,
      x2: 0.7,
      y2: 0.45,
      invertDirection: false,
      departures: 0,
      arrivals: 0,
      dots: [],
    };
    this.lanes = [...this.lanes, lane];
    this.persist();
  }

  removeLane(id: string) {
    this.lanes = this.lanes.filter((l) => l.id !== id);
    this.persist();
  }

  updateLane(id: string, patch: Partial<TrackLane>) {
    this.lanes = this.lanes.map((l) => (l.id === id ? { ...l, ...patch } : l));
    this.persist();
  }

  replaceLanes(next: TrackLane[]) {
    this.lanes = next;
    this.persist();
  }

  recordCrossing(id: string, kind: CrossingKind) {
    this.lanes = this.lanes.map((l) => {
      if (l.id !== id) return l;
      const dots = [
        ...l.dots,
        { id: `dot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, kind, timestamp: Date.now() },
      ];
      if (dots.length > MAX_DOTS_PER_LANE) dots.splice(0, dots.length - MAX_DOTS_PER_LANE);
      return {
        ...l,
        departures: l.departures + (kind === "departure" ? 1 : 0),
        arrivals: l.arrivals + (kind === "arrival" ? 1 : 0),
        dots,
      };
    });
    this.persist();
  }

  resetLane(id: string) {
    this.lanes = this.lanes.map((l) => (l.id === id ? { ...l, departures: 0, arrivals: 0, dots: [] } : l));
    this.persist();
  }

  resetAll() {
    this.lanes = this.lanes.map((l) => ({ ...l, departures: 0, arrivals: 0, dots: [] }));
    this.persist();
  }
}
