/**
 * Merge a new [start, end] interval into a list of existing intervals.
 * Returns { ranges, totalSeconds }.
 * Overlapping and adjacent intervals are merged.
 */
export function mergeRange(ranges, start, end) {
  if (end <= start) {
    return { ranges: [...ranges], totalSeconds: sumRanges(ranges) };
  }

  const all = [...ranges, { start, end }].sort((a, b) => a.start - b.start);
  const merged = [];

  for (const r of all) {
    if (merged.length === 0) {
      merged.push({ ...r });
      continue;
    }
    const last = merged[merged.length - 1];
    if (r.start <= last.end) {
      last.end = Math.max(last.end, r.end);
    } else {
      merged.push({ ...r });
    }
  }

  return { ranges: merged, totalSeconds: sumRanges(merged) };
}

export function sumRanges(ranges) {
  return ranges.reduce((sum, r) => sum + (r.end - r.start), 0);
}