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

export function emptyMeta() {
  return { coins: 0, best: 0, hero: 'panda', hat: 'none', owned: ['panda', 'none'], missions: [], tier: 0, runs: 0, seen: [] };
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
  return { meta: next, completed, newBest };
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

const KEY = 'pandadventures.marathon.v1';

export function loadMeta() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...emptyMeta(), ...JSON.parse(raw) } : emptyMeta();
  } catch {
    return emptyMeta();
  }
}

export function saveMeta(meta) {
  try {
    localStorage.setItem(KEY, JSON.stringify(meta));
  } catch {
    // Private mode: progress lasts for this visit.
  }
}
