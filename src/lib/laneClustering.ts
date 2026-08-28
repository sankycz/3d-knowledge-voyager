export interface LaneBand {
  bandTop: number;
  bandBottom: number;
}

/**
 * Groups normalized y-center samples (0-1) of observed trains into horizontal
 * bands, splitting wherever there's a gap larger than `gapThreshold` between
 * consecutive sorted samples. Used to propose track lanes from what the
 * camera has actually seen, rather than trying to detect rail lines directly.
 */
export function clusterLaneBands(samples: number[], gapThreshold = 0.05): LaneBand[] {
  if (samples.length === 0) return [];
  const sorted = [...samples].sort((a, b) => a - b);
  const groups: number[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const value = sorted[i];
    const currentGroup = groups[groups.length - 1];
    if (value - currentGroup[currentGroup.length - 1] > gapThreshold) {
      groups.push([value]);
    } else {
      currentGroup.push(value);
    }
  }

  const centers = groups.map((g) => g.reduce((a, b) => a + b, 0) / g.length);
  const boundaries: number[] = [0];
  for (let i = 0; i < centers.length - 1; i++) {
    boundaries.push((centers[i] + centers[i + 1]) / 2);
  }
  boundaries.push(1);

  return centers.map((_, i) => ({ bandTop: boundaries[i], bandBottom: boundaries[i + 1] }));
}
