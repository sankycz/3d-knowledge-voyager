"use client";

import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { TrackLane } from "@/lib/types";

export interface LaneActions {
  addLane: (name?: string) => void;
  removeLane: (id: string) => void;
  renameLane: (id: string, name: string) => void;
  updateLane: (id: string, patch: Partial<TrackLane>) => void;
  resetLane: (id: string) => void;
  resetAll: () => void;
}

export function LaneSidebar({ lanes, actions }: { lanes: TrackLane[]; actions: LaneActions }) {
  return (
    <div className="voyager-section p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg text-[var(--color-text-high)]">Koleje</h2>
        <div className="flex gap-2">
          <button
            onClick={() => actions.addLane()}
            className="flex items-center gap-1 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-semibold"
          >
            <Plus size={14} /> Přidat kolej
          </button>
          <button
            onClick={actions.resetAll}
            className="flex items-center gap-1 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-semibold"
          >
            <RotateCcw size={14} /> Vynulovat vše
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {lanes.length === 0 && (
          <p className="text-sm text-[var(--color-text-low)]">Zatím žádné koleje — přidejte je ručně nebo spusťte rozpoznání.</p>
        )}
        {lanes.map((lane) => (
          <LaneCard
            key={lane.id}
            lane={lane}
            onRename={(name) => actions.renameLane(lane.id, name)}
            onFlipDirection={() => actions.updateLane(lane.id, { invertDirection: !lane.invertDirection })}
            onRemove={() => actions.removeLane(lane.id)}
            onReset={() => actions.resetLane(lane.id)}
          />
        ))}
      </div>
    </div>
  );
}

function LaneCard({
  lane,
  onRename,
  onFlipDirection,
  onRemove,
  onReset,
}: {
  lane: TrackLane;
  onRename: (name: string) => void;
  onFlipDirection: () => void;
  onRemove: () => void;
  onReset: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <input
          value={lane.name}
          onChange={(e) => onRename(e.target.value)}
          className="w-full rounded-lg bg-transparent px-1 py-0.5 text-sm font-semibold text-[var(--color-text-high)] outline-none focus:bg-white/[0.06]"
        />
        <button onClick={onReset} title="Vynulovat kolej" className="text-[var(--color-text-low)] hover:text-[var(--color-text-high)]">
          <RotateCcw size={14} />
        </button>
        <button onClick={onRemove} title="Odebrat kolej" className="text-[var(--color-text-low)] hover:text-red-400">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mb-2 flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Odjezdy: <strong className="text-[var(--color-text-high)]">{lane.departures}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Příjezdy: <strong className="text-[var(--color-text-high)]">{lane.arrivals}</strong>
        </span>
        <button onClick={onFlipDirection} className="ml-auto text-xs text-[var(--color-text-low)] hover:text-[var(--color-text-high)]">
          Otočit směr →
        </button>
      </div>

      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-lg bg-black/30 px-2 py-2">
        {lane.dots.length === 0 && <span className="text-xs text-[var(--color-text-lowest)]">Zatím žádné projetí</span>}
        {lane.dots.map((dot) => (
          <span
            key={dot.id}
            title={new Date(dot.timestamp).toLocaleTimeString("cs-CZ")}
            className={`h-2.5 w-2.5 flex-none rounded-full ${dot.kind === "departure" ? "bg-blue-500" : "bg-red-500"}`}
          />
        ))}
      </div>
    </div>
  );
}
