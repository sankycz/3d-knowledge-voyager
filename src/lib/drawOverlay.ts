import { CrossingKind, DetectedBox, TrackLane } from "./types";

export interface TransientDot {
  x: number;
  y: number;
  kind: CrossingKind;
  createdAt: number;
}

const DOT_LIFE_MS = 1800;

/** Draws track lines, endpoint handles, live detection boxes, and fading crossing dots onto a canvas. */
export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  dpr: number,
  lanes: TrackLane[],
  liveBoxes: DetectedBox[],
  transientDots: TransientDot[]
) {
  ctx.clearRect(0, 0, w, h);

  for (const lane of lanes) {
    const x1 = lane.x1 * w;
    const y1 = lane.y1 * h;
    const x2 = lane.x2 * w;
    const y2 = lane.y2 * h;

    ctx.save();
    ctx.strokeStyle = "#a4e6ff";
    ctx.lineWidth = 4 * dpr;
    ctx.lineCap = "round";
    ctx.setLineDash([1, 14 * dpr]);
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 4 * dpr;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "#0e0e0e";
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2 * dpr;
    for (const [hx, hy] of [
      [x1, y1],
      [x2, y2],
    ]) {
      ctx.beginPath();
      ctx.arc(hx, hy, 6 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.font = `${Math.round(13 * dpr)}px system-ui, sans-serif`;
    const label = lane.name;
    const paddingX = 6 * dpr;
    const textWidth = ctx.measureText(label).width;
    const chipHeight = 20 * dpr;
    const labelX = Math.min(x1, x2);
    const labelY = (y1 + y2) / 2;
    ctx.fillStyle = "rgba(14, 14, 14, 0.75)";
    ctx.fillRect(labelX, labelY - chipHeight / 2, textWidth + paddingX * 2, chipHeight);
    ctx.fillStyle = "#a4e6ff";
    ctx.textBaseline = "middle";
    ctx.fillText(label, labelX + paddingX, labelY);
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 3 * dpr;
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 3 * dpr;
  for (const box of liveBoxes) {
    const bx = box.x * w;
    const by = box.y * h;
    const bw = box.width * w;
    const bh = box.height * h;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.font = `${Math.round(12 * dpr)}px system-ui, sans-serif`;
    ctx.fillStyle = "#facc15";
    ctx.fillText(`vlak ${Math.round(box.score * 100)}%`, bx, Math.max(by - 4 * dpr, 10 * dpr));
  }
  ctx.restore();

  const now = Date.now();
  const stillAlive = transientDots.filter((dot) => now - dot.createdAt < DOT_LIFE_MS);
  transientDots.length = 0;
  transientDots.push(...stillAlive);
  for (const dot of transientDots) {
    const age = now - dot.createdAt;
    const t = age / DOT_LIFE_MS;
    const radius = (6 + t * 10) * dpr;
    const alpha = 1 - t;
    ctx.beginPath();
    ctx.fillStyle = dot.kind === "departure" ? `rgba(59,130,246,${alpha})` : `rgba(239,68,68,${alpha})`;
    ctx.arc(dot.x * w, dot.y * h, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
