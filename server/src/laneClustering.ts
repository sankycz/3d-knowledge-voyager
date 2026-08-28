// Mirrors src/lib/laneClustering.ts on the frontend — see the note in types.ts.

export interface LaneLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface Point {
  x: number;
  y: number;
}

export function clusterLaneLines(samples: Point[], gapThreshold = 0.07): LaneLine[] {
  if (samples.length === 0) return [];

  const clusters: Point[][] = [];
  for (const p of samples) {
    let placed = false;
    for (const cluster of clusters) {
      if (cluster.some((q) => Math.hypot(q.x - p.x, q.y - p.y) <= gapThreshold)) {
        cluster.push(p);
        placed = true;
        break;
      }
    }
    if (!placed) clusters.push([p]);
  }

  return clusters.filter((cluster) => cluster.length >= 2).map((cluster) => fitLine(cluster));
}

function fitLine(points: Point[]): LaneLine {
  const n = points.length;
  const meanX = points.reduce((a, p) => a + p.x, 0) / n;
  const meanY = points.reduce((a, p) => a + p.y, 0) / n;

  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const p of points) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }

  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);

  let minT = Infinity;
  let maxT = -Infinity;
  for (const p of points) {
    const t = (p.x - meanX) * dirX + (p.y - meanY) * dirY;
    minT = Math.min(minT, t);
    maxT = Math.max(maxT, t);
  }

  return {
    x1: meanX + dirX * minT,
    y1: meanY + dirY * minT,
    x2: meanX + dirX * maxT,
    y2: meanY + dirY * maxT,
  };
}
