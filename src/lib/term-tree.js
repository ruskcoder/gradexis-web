/**
 * Client helpers for the API's cascading term hierarchy.
 *
 * The API returns `termTree`: a nested forest [{ label, children: [...] }] whose
 * roots are the coarsest columns (semester/year) and whose leaves are the finest
 * (progress periods). Depth is arbitrary and district-driven, so the UI renders
 * one subtab bar per level of the currently-selected path — as many as exist.
 *
 * A class's `averages` map is keyed by every column label, so whichever node is
 * selected (root, an intermediate, or a leaf) resolves to a grade directly.
 */

/** Wrap a flat label list as a depth-1 forest (portals with no subterms). */
export function flatForest(labels) {
  return (labels || []).map((label) => ({ label, children: [] }));
}

/** Root→node label path for `label`, or [] if absent. */
export function pathToLabel(forest, label) {
  const find = (n, trail) => {
    const next = [...trail, n.label];
    if (n.label === label) return next;
    for (const c of n.children || []) {
      const r = find(c, next);
      if (r) return r;
    }
    return null;
  };
  for (const r of forest || []) {
    const p = find(r, []);
    if (p) return p;
  }
  return [];
}

/**
 * The stack of subtab bars to render for a selected path. One bar per level of
 * the path whose node has children; each bar offers the parent itself (its own
 * roll-up grade) plus its child columns, with the currently-selected child (or
 * the parent, if none deeper) marked.
 *   [{ parent, options: [childLabel, …], selected }]
 */
export function barsForPath(forest, path) {
  const bars = [];
  let level = forest || [];
  for (let i = 0; i < path.length; i++) {
    const node = level.find((n) => n.label === path[i]);
    if (!node) break;
    if (node.children && node.children.length) {
      bars.push({
        parent: path[i],
        options: node.children.map((c) => c.label),
        selected: path[i + 1] ?? path[i],
      });
    }
    level = node.children || [];
  }
  return bars;
}
