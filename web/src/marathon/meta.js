// Meta progression kept between runs: coins, best score, playable friends,
// hats, missions. Pure functions on a plain object; storage is in save().

// Saves are plain JSON; structuredClone needs iOS 15.4+ / Chrome 98+.
const clone = (value) => JSON.parse(JSON.stringify(value));

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
  { id: 'citroen', price: 70 },
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
  return { v: SAVE_VERSION, coins: 0, best: 0, hero: 'panda', hat: 'none', owned: ['panda', 'none'], missions: [], tier: 0, runs: 0, seen: [], scores: [], pinball: { best: 0, games: 0, scores: [] }, spx: { best: 0, games: 0, homes: 0, scores: [] }, merguez: { best: 0, games: 0, wins: 0, scores: [] }, online: emptyOnline(), updated: 0 };
}

/** The online Hall of Fame profile: a random id for this phone, the name typed once, what was sent. */
export function emptyOnline() {
  return { id: '', name: '', avatar: '', asked: false, since: 0, sent: { marathon: 0, flipper: 0, spx: 0, merguez: 0 } };
}

function normalizeOnline(raw) {
  const o = raw && typeof raw === 'object' ? raw : {};
  const sent = o.sent && typeof o.sent === 'object' ? o.sent : {};
  return {
    id: typeof o.id === 'string' ? o.id.slice(0, 64) : '',
    name: typeof o.name === 'string' ? o.name.slice(0, 40) : '',
    avatar: typeof o.avatar === 'string' ? o.avatar.slice(0, 20) : '',
    asked: !!o.asked,
    // Records reset on the board at this time (ms): older runs no longer count
    since: num(o.since),
    sent: { marathon: num(sent.marathon), flipper: num(sent.flipper), spx: num(sent.spx), merguez: num(sent.merguez) },
  };
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
  const pb = raw.pinball && typeof raw.pinball === 'object' ? raw.pinball : {};
  m.pinball = { ...pb, best: num(pb.best), games: num(pb.games), scores: topScores(Array.isArray(pb.scores) ? pb.scores : []) };
  m.pinball.best = Math.max(m.pinball.best, m.pinball.scores[0]?.score || 0);
  const sx = raw.spx && typeof raw.spx === 'object' ? raw.spx : {};
  m.spx = { ...sx, best: num(sx.best), games: num(sx.games), homes: num(sx.homes), scores: topScores(Array.isArray(sx.scores) ? sx.scores : []) };
  m.spx.best = Math.max(m.spx.best, m.spx.scores[0]?.score || 0);
  const gm = raw.merguez && typeof raw.merguez === 'object' ? raw.merguez : {};
  m.merguez = { ...gm, best: num(gm.best), games: num(gm.games), wins: num(gm.wins), scores: topScores(Array.isArray(gm.scores) ? gm.scores : []) };
  m.merguez.best = Math.max(m.merguez.best, m.merguez.scores[0]?.score || 0);
  m.online = normalizeOnline(raw.online);
  return dropOldRecords(m);
}

/**
 * After a records reset (online.since, set on the board for this player), the
 * runs played before it are forgotten and the bests come from what is left.
 */
export function dropOldRecords(m) {
  const since = m.online?.since || 0;
  if (!since) return m;
  const keep = (list) => list.filter((x) => (x.at || 0) >= since);
  m.scores = keep(m.scores);
  m.best = m.scores[0]?.score || 0;
  m.pinball.scores = keep(m.pinball.scores);
  m.pinball.best = m.pinball.scores[0]?.score || 0;
  m.spx.scores = keep(m.spx.scores);
  m.spx.best = m.spx.scores[0]?.score || 0;
  m.merguez.scores = keep(m.merguez.scores);
  m.merguez.best = m.merguez.scores[0]?.score || 0;
  // A "sent" mark above what is left is an old record's: the new best must go out
  // (merging with an older copy of the save brings those marks back, hence here)
  const bests = { marathon: m.best, flipper: m.pinball.best, spx: m.spx.best, merguez: m.merguez.best };
  for (const game of Object.keys(bests)) if (m.online.sent[game] > bests[game]) m.online.sent[game] = 0;
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
  m.pinball = {
    best: Math.max(older.pinball.best, newer.pinball.best),
    games: Math.max(older.pinball.games, newer.pinball.games),
    scores: topScores([...older.pinball.scores, ...newer.pinball.scores]),
  };
  const os = older.spx || emptyMeta().spx;
  const ns = newer.spx || emptyMeta().spx;
  m.spx = {
    best: Math.max(os.best, ns.best),
    games: Math.max(os.games, ns.games),
    homes: Math.max(os.homes, ns.homes),
    scores: topScores([...os.scores, ...ns.scores]),
  };
  const og = older.merguez || emptyMeta().merguez;
  const ng = newer.merguez || emptyMeta().merguez;
  m.merguez = {
    best: Math.max(og.best, ng.best),
    games: Math.max(og.games, ng.games),
    wins: Math.max(og.wins, ng.wins),
    scores: topScores([...og.scores, ...ng.scores]),
  };
  // Online profile: the newer one's name, the id the save already had, the most sent
  const oo = normalizeOnline(older.online);
  const no = normalizeOnline(newer.online);
  m.online = {
    id: no.id || oo.id,
    name: no.name || oo.name,
    avatar: no.avatar || oo.avatar,
    asked: oo.asked || no.asked,
    since: Math.max(oo.since, no.since),
    sent: { marathon: Math.max(oo.sent.marathon, no.sent.marathon), flipper: Math.max(oo.sent.flipper, no.sent.flipper), spx: Math.max(oo.sent.spx, no.sent.spx), merguez: Math.max(oo.sent.merguez, no.sent.merguez) },
  };
  m.updated = Math.max(older.updated || 0, newer.updated || 0);
  return dropOldRecords(m);
}

/** Fills the mission list up to three, deterministic from the tier and a picker. */
export function refillMissions(meta, pickGame, random = Math.random) {
  const next = clone(meta);
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
  const next = clone(meta);
  next.runs++;
  next.coins += run.coins;
  const newBest = run.score > next.best;
  next.best = Math.max(next.best, run.score);
  const entry = { score: run.score, level: run.level, streak: Math.max(0, Math.round(run.bestStreak || 0)), hero: run.hero || next.hero, at: run.at || Date.now() };
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

/** Records a finished Eul' Flipper game. Returns {meta, rank, newBest}. */
export function applyPinball(meta, { score, hero, at = Date.now() }) {
  const next = normalizeMeta(clone(meta));
  const newBest = score > next.pinball.best;
  next.pinball.best = Math.max(next.pinball.best, score);
  next.pinball.games++;
  const entry = { score, hero, at };
  next.pinball.scores = topScores([...next.pinball.scores, entry]);
  const rank = next.pinball.scores.findIndex((x) => x.score === score && x.at === at) + 1;
  return { meta: next, rank, newBest };
}

/** Records a 103 RCX ride. Returns {meta, rank, newBest}. */
export function applySpx(meta, { score, hero, time = 0, finished = false, at = Date.now() }) {
  const next = normalizeMeta(clone(meta));
  const newBest = score > next.spx.best;
  next.spx.best = Math.max(next.spx.best, score);
  next.spx.games++;
  if (finished) next.spx.homes++;
  const entry = { score, hero, at, time: Math.round(time), finished: !!finished };
  next.spx.scores = topScores([...next.spx.scores, entry]);
  const rank = next.spx.scores.findIndex((x) => x.score === score && x.at === at) + 1;
  return { meta: next, rank, newBest };
}

/** Records a Golden Merguez run. Returns {meta, rank, newBest}. */
export function applyMerguez(meta, { score, hero, level = 0, finished = false, time = 0, at = Date.now() }) {
  const next = normalizeMeta(clone(meta));
  const newBest = score > next.merguez.best;
  next.merguez.best = Math.max(next.merguez.best, score);
  next.merguez.games++;
  if (finished) next.merguez.wins++;
  const entry = { score, hero, at, level, finished: !!finished, time: Math.round(time) };
  next.merguez.scores = topScores([...next.merguez.scores, entry]);
  const rank = next.merguez.scores.findIndex((x) => x.score === score && x.at === at) + 1;
  return { meta: next, rank, newBest };
}

/** Buys a hero or hat. Returns the new meta, or null if not affordable or unknown. */
export function buy(meta, id) {
  const item = [...HEROES, ...HATS].find((x) => x.id === id);
  if (!item || meta.owned.includes(id) || meta.coins < item.price) return null;
  const next = clone(meta);
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
