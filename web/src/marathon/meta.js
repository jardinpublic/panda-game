// Meta progression kept between runs: coins, best score, playable friends,
// hats, missions. Pure functions on a plain object; storage is in save().

export const HEROES = [
  { id: 'panda', price: 0 },
  { id: 'cous', price: 60 },
  { id: 'mamar', price: 120 },
  { id: 'babar', price: 180 },
  { id: 'victor', price: 250 },
  { id: 'romain', price: 320 },
  { id: 'eugenie', price: 400 },
  { id: 'violaine', price: 480 },
  { id: 'aline', price: 560 },
  { id: 'greg', price: 650 },
];

export const HATS = [
  { id: 'none', price: 0 },
  { id: 'shades', price: 30 },
  { id: 'flower', price: 50 },
  { id: 'bakoua', price: 90 },
  { id: 'madras', price: 140 },
  { id: 'party', price: 200 },
  { id: 'crown', price: 400 },
];

/** Mission templates. kind: what is counted; goal scales with the mission tier. */
const MISSION_TYPES = [
  { kind: 'level', goal: (t) => 10 + t * 5 }, // reach micro-game #goal in one run
  { kind: 'streak', goal: (t) => 5 + t * 3 }, // win goal in a row
  { kind: 'coins_run', goal: (t) => 15 + t * 10 }, // earn goal coins in one run
  { kind: 'runs', goal: (t) => 3 + t * 2 }, // play goal runs
  { kind: 'game', goal: (t) => 3 + t * 2 }, // win a given micro-game goal times (counts across runs)
];

export const SAVE_VERSION = 1;
export const TOP_SIZE = 10;

export function emptyMeta() {
  return { v: SAVE_VERSION, coins: 0, best: 0, hero: 'panda', hat: 'none', owned: ['panda', 'none'], missions: [], tier: 0, runs: 0, seen: [], scores: [], updated: 0 };
}

const num = (x, fallback = 0) => (Number.isFinite(x) && x >= 0 ? x : fallback);

/**
 * Repairs a save read from storage: missing fields get defaults, bad values are
 * reset, unknown fields are kept (a newer version of the game may have written
 * them). Never throws.
 */
export function normalizeMeta(raw) {
  const base = emptyMeta();
  if (!raw || typeof raw !== 'object') return base;
  const m = { ...base, ...raw };
  m.v = Math.max(SAVE_VERSION, num(raw.v, SAVE_VERSION));
  for (const k of ['coins', 'best', 'tier', 'runs', 'updated']) m[k] = num(raw[k]);
  m.owned = Array.isArray(raw.owned) ? [...new Set(['panda', 'none', ...raw.owned.filter((x) => typeof x === 'string')])] : base.owned;
  if (!m.owned.includes(m.hero)) m.hero = 'panda';
  if (!m.owned.includes(m.hat)) m.hat = 'none';
  m.missions = Array.isArray(raw.missions) ? raw.missions.filter((x) => x && typeof x.kind === 'string' && num(x.goal) > 0) : [];
  m.scores = topScores(Array.isArray(raw.scores) ? raw.scores : []);
  m.best = Math.max(m.best, m.scores[0]?.score || 0);
  return m;
}

/** The best runs, best first, without duplicates, at most TOP_SIZE. */
export function topScores(list) {
  const seen = new Set();
  return list
    .filter((x) => x && num(x.score, -1) >= 0)
    .filter((x) => {
      const key = `${x.score}|${x.at}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.score - a.score || (a.at || 0) - (b.at || 0))
    .slice(0, TOP_SIZE);
}

/**
 * Merges two saves of the same player (two tabs, or the stored one and this
 * one). The newer save decides coins, hero, hat and missions (coins go down
 * when you buy, so "the most" is not right); unlocks, best score, runs and the
 * best runs list keep the best of both, so nothing earned is ever lost.
 */
export function mergeMeta(a, b) {
  const [older, newer] = (a.updated || 0) > (b.updated || 0) ? [b, a] : [a, b];
  const m = normalizeMeta({ ...older, ...newer });
  m.owned = [...new Set([...older.owned, ...newer.owned])];
  m.best = Math.max(older.best, newer.best);
  m.runs = Math.max(older.runs, newer.runs);
  m.tier = Math.max(older.tier, newer.tier);
  m.scores = topScores([...older.scores, ...newer.scores]);
  m.updated = Math.max(older.updated || 0, newer.updated || 0);
  return m;
}

/** Fills the mission list up to three, deterministic from the tier and a picker. */
export function refillMissions(meta, pickGame, random = Math.random) {
  const next = structuredClone(meta);
  while (next.missions.length < 3) {
    const type = MISSION_TYPES[Math.floor(random() * MISSION_TYPES.length)];
    if (next.missions.some((m) => m.kind === type.kind)) continue;
    const mission = { kind: type.kind, goal: type.goal(next.tier), progress: 0, reward: 20 + next.tier * 10 };
    if (type.kind === 'game') mission.game = pickGame();
    next.missions.push(mission);
  }
  return next;
}

/**
 * Applies a finished run. run: {level, bestStreak, coins, stats}. Returns
 * {meta, completed: [missions done this run], newBest}.
 */
export function applyRun(meta, run) {
  const next = structuredClone(meta);
  next.runs++;
  next.coins += run.coins;
  const newBest = run.score > next.best;
  next.best = Math.max(next.best, run.score);
  const entry = { score: run.score, level: run.level, hero: run.hero || next.hero, at: run.at || Date.now() };
  next.scores = topScores([...(next.scores || []), entry]);
  const rank = next.scores.indexOf(next.scores.find((x) => x.score === entry.score && x.at === entry.at)) + 1;
  const completed = [];
  for (const m of next.missions) {
    if (m.kind === 'level') m.progress = Math.max(m.progress, run.level);
    if (m.kind === 'streak') m.progress = Math.max(m.progress, run.bestStreak);
    if (m.kind === 'coins_run') m.progress = Math.max(m.progress, run.coins);
    if (m.kind === 'runs') m.progress += 1;
    if (m.kind === 'game') m.progress += run.stats?.[m.game]?.won ?? 0;
    if (m.progress >= m.goal) completed.push(m);
  }
  for (const m of completed) {
    next.coins += m.reward;
    next.tier++;
  }
  next.missions = next.missions.filter((m) => !completed.includes(m));
  return { meta: next, completed, newBest, rank };
}

/** Buys a hero or hat. Returns the new meta, or null if not affordable or unknown. */
export function buy(meta, id) {
  const item = [...HEROES, ...HATS].find((x) => x.id === id);
  if (!item || meta.owned.includes(id) || meta.coins < item.price) return null;
  const next = structuredClone(meta);
  next.coins -= item.price;
  next.owned.push(id);
  return next;
}

// The save lives in this browser. The key never changes between versions of the
// game (fields are added, never renamed), so an update never loses progress.
// GitHub Pages shares one storage per user site, hence the "pandadventures." prefix.
const KEY = 'pandadventures.marathon.v1';

function readStored() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? normalizeMeta(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function loadMeta() {
  return readStored() || emptyMeta();
}

/**
 * Stores the save, merged with whatever another tab stored meanwhile. Returns
 * the merged save (use it from then on). Private mode: progress lasts for the visit.
 */
export function saveMeta(meta) {
  const mine = { ...meta, updated: Math.max(Date.now(), (meta.updated || 0) + 1) };
  const stored = readStored();
  const merged = stored ? mergeMeta(stored, mine) : normalizeMeta(mine);
  try {
    localStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    // Storage blocked or full: keep playing.
  }
  return merged;
}

/** Calls fn(save) when another tab changes the save. */
export function onMetaChanged(fn) {
  try {
    window.addEventListener('storage', (e) => {
      if (e.key === KEY && e.newValue) {
        const stored = readStored();
        if (stored) fn(stored);
      }
    });
  } catch {
    // No storage events: the next save merges anyway.
  }
}

let persistAsked = false;
/** Asks the browser to keep the save when it cleans up storage (once per visit). */
export function askPersist() {
  if (persistAsked) return;
  persistAsked = true;
  try {
    navigator.storage?.persist?.().catch(() => {});
  } catch {
    // Not supported.
  }
}
