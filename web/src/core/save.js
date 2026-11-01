// Progress saved in this browser: stars per world and mode, best scores, and
// a small local hall of fame. Storage can be unavailable (private mode), so
// every access is guarded and the game works without it.

const KEY = 'pandadventures.save.v1';
export const MODES = ['easy', 'normal', 'hard'];

export function emptySave() {
  return { worlds: {}, hall: [], player: '' };
}

/** Pure merge of a run result into a save. Returns a new save object. */
export function recordRun(save, worldId, mode, score, stars) {
  const next = structuredClone(save);
  const world = next.worlds[worldId] ?? { stars: { easy: 0, normal: 0, hard: 0 }, best: { easy: 0, normal: 0, hard: 0 } };
  world.stars[mode] = Math.max(world.stars[mode] ?? 0, stars);
  world.best[mode] = Math.max(world.best[mode] ?? 0, score);
  next.worlds[worldId] = world;
  if (score > 0) {
    next.hall.push({ worldId, mode, score, name: next.player || 'Panda', date: new Date().toISOString().slice(0, 10) });
    next.hall.sort((a, b) => b.score - a.score);
    next.hall = next.hall.slice(0, 50);
  }
  return next;
}

/** Best stars earned in a world over all modes (0-3). */
export function bestStars(save, worldId) {
  const world = save.worlds[worldId];
  return world ? Math.max(...MODES.map((m) => world.stars[m] ?? 0)) : 0;
}

/** A world is open when it is the first one or the previous one has at least one star. */
export function isUnlocked(save, order, worldId) {
  const index = order.indexOf(worldId);
  return index <= 0 || bestStars(save, order[index - 1]) > 0;
}

export function totalStars(save) {
  return Object.values(save.worlds).reduce((sum, w) => sum + MODES.reduce((s, m) => s + (w.stars[m] ?? 0), 0), 0);
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...emptySave(), ...JSON.parse(raw) } : emptySave();
  } catch {
    return emptySave();
  }
}

export function store(save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Storage unavailable: progress lasts for this visit only.
  }
}
