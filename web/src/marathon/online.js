// The gang's online Hall of Fame, on Supabase (setup: tools/online/supabase.sql).
//
// Each phone gets a random player id and the name its player types once; after
// that, every new personal best of each game (PandAventures, Eul' Flipper,
// 103 SPX) is sent on its own, and waits for the network when there is none.
// The board shows each player's best per game.
//
// Pure helpers first (tested in web/test/online.test.js), then the network.

import { ONLINE_URL, ONLINE_KEY } from './online-config.js';
import { CAST_IDS } from './art.js';
import { maxScore } from './hof.js';

export const GAMES = ['marathon', 'flipper', 'spx'];
export const NAME_MAX = 20;
const MAX = { marathon: 100000, flipper: 50000000, spx: 200000 };
const FIRST_DAY = Date.UTC(2026, 10, 1);

/** A random id for this phone (never shown, never readable on the board). */
export function newPlayerId(random = Math.random) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  const hex = () => Math.floor(random() * 16).toString(16);
  const part = (n) => Array.from({ length: n }, hex).join('');
  return `${part(8)}-${part(4)}-4${part(3)}-${'89ab'[Math.floor(random() * 4)]}${part(3)}-${part(12)}`;
}

/** A name as typed, made safe: no control characters, single spaces, 20 characters at most. */
export function cleanName(text) {
  return String(text || '')
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX)
    .trim();
}

/** The best run of a game in this save, or null. */
export function bestRun(meta, game) {
  const list = game === 'marathon' ? meta.scores : game === 'flipper' ? meta.pinball?.scores : meta.spx?.scores;
  return (list && list[0]) || null;
}

/** The row sent for a game's best run. */
export function rowFor(meta, game) {
  const run = bestRun(meta, game);
  const p = meta.online || {};
  if (!run) return null;
  const row = {
    player_id: p.id,
    name: cleanName(p.name),
    game,
    score: Math.round(run.score),
    // The face the player picked for the board (else the hero of the run)
    hero: CAST_IDS.includes(p.avatar) ? p.avatar : CAST_IDS.includes(run.hero) ? run.hero : null,
    played_at: new Date(run.at || Date.now()).toISOString(),
  };
  if (game === 'marathon') {
    row.level = Math.round(run.level || 1);
    row.streak = Math.round(run.streak ?? 0);
  }
  if (game === 'spx') {
    row.ride_time = Math.round(run.time || 0);
    row.home = !!run.finished;
  }
  return row;
}

/** Could this row be a real score? The same rules as the database (supabase.sql). */
export function plausible(row, now = Date.now()) {
  if (!row || !GAMES.includes(row.game)) return false;
  if (!row.player_id || !row.name) return false;
  const { score } = row;
  if (!Number.isInteger(score) || score <= 0 || score > MAX[row.game]) return false;
  const at = Date.parse(row.played_at);
  if (!(at >= FIRST_DAY && at <= now + 10 * 60 * 1000)) return false;
  if (row.game === 'marathon') {
    const { level, streak } = row;
    if (!Number.isInteger(level) || level < 1 || level > 2000) return false;
    if (!Number.isInteger(streak) || streak < 0 || streak > level) return false;
    if (score % 10 !== 0 || score < streak * 10 || score > maxScore(level)) return false;
  }
  if (row.game === 'spx' && row.home && !(row.ride_time >= 80)) return false;
  return true;
}

/** The games whose best is not on the board yet (better than what was last sent). */
export function toSend(meta, now = Date.now()) {
  const sent = meta.online?.sent || {};
  if (!meta.online?.id || !cleanName(meta.online?.name)) return [];
  return GAMES.filter((game) => {
    const row = rowFor(meta, game);
    return row && row.score > (sent[game] || 0) && plausible(row, now);
  });
}

/* ---------------- The network ---------------- */

/** Talks to Supabase's REST API. `configured` is false until the project URL and key are set. */
export function createOnline({ url = ONLINE_URL, key = ONLINE_KEY, fetch = globalThis.fetch?.bind(globalThis), timeout = 7000 } = {}) {
  const base = String(url || '').replace(/\/+$/, '');
  const configured = !!(base && key && fetch);
  const headers = (extra = {}) => {
    const h = { apikey: key, ...extra };
    // Older projects use a JWT "anon" key, sent as a bearer too; new publishable keys are not
    if (String(key).startsWith('eyJ')) h.Authorization = `Bearer ${key}`;
    return h;
  };
  async function call(path, init) {
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), timeout) : 0;
    try {
      return await fetch(`${base}/rest/v1/${path}`, { ...init, signal: ctrl?.signal, cache: 'no-store' });
    } finally {
      clearTimeout(timer);
    }
  }
  return {
    configured,
    /** Sends a score. Resolves 'sent', 'refused' (the board said no: do not retry) or 'later' (no network, server busy). */
    async send(row) {
      if (!configured) return 'later';
      try {
        const res = await call('panda_scores', { method: 'POST', headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }), body: JSON.stringify(row) });
        if (res.ok) return 'sent';
        // "too soon" (one send per game every 10 seconds) is worth another try a bit later
        const why = await res.json().catch(() => null);
        if (why && /too soon/.test(String(why.message))) return 'later';
        return res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429 ? 'refused' : 'later';
      } catch {
        return 'later';
      }
    },
    /** When this player's records were reset on the board (ms), 0 if never. Throws when offline. */
    async since(playerId) {
      if (!configured) throw new Error('offline');
      const res = await call('rpc/panda_since', { method: 'POST', headers: headers({ 'Content-Type': 'application/json' }), body: JSON.stringify({ pid: playerId }) });
      if (!res.ok) throw new Error(String(res.status));
      const at = Date.parse(await res.json());
      return Number.isFinite(at) ? at : 0;
    },
    /** The gang's board for a game, best first. */
    async board(game, limit = 50) {
      if (!configured) throw new Error('offline');
      const q = `panda_board?select=name,score,level,streak,hero,ride_time,home,played_at&game=eq.${encodeURIComponent(game)}&order=score.desc,played_at.asc&limit=${limit}`;
      const res = await call(q, { headers: headers() });
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    },
  };
}

/**
 * A pretend Supabase in memory, for the tests and the ?fakeonline test link:
 * the same refusals (impossible scores, a second send within 10 seconds, a run
 * from before the player's records reset) and the same board (each player's
 * best per game since their reset, with their latest name).
 */
export function memoryBackend(seed = [], now = () => Date.now()) {
  const rows = seed.map((r, i) => ({ ...r, created_at: now() - (seed.length - i) * 60000 }));
  /** player id → records reset time (ms) */
  const resets = new Map();
  const counts = (r) => Date.parse(r.played_at) >= (resets.get(r.player_id) || 0);
  const reply = (status, body) => ({ ok: status < 300, status, json: async () => body });
  function board(game) {
    const names = new Map();
    const faces = new Map();
    for (const r of [...rows].sort((a, b) => a.created_at - b.created_at)) {
      names.set(r.player_id, r.name);
      faces.set(r.player_id, r.hero);
    }
    const best = new Map();
    for (const r of rows) {
      if (r.game !== game || !counts(r)) continue;
      const b = best.get(r.player_id);
      if (!b || r.score > b.score || (r.score === b.score && r.played_at < b.played_at)) best.set(r.player_id, r);
    }
    return [...best.values()]
      .map(({ player_id, created_at, ...r }) => ({ ...r, name: names.get(player_id), hero: faces.get(player_id) }))
      .sort((a, b) => b.score - a.score || Date.parse(a.played_at) - Date.parse(b.played_at));
  }
  async function fetch(url, init = {}) {
    const u = new URL(url);
    if ((init.method || 'GET') === 'POST' && u.pathname.endsWith('/panda_scores')) {
      const row = JSON.parse(init.body);
      if (!plausible(row, now())) return reply(400, { message: 'check constraint' });
      if (rows.some((r) => r.player_id === row.player_id && r.game === row.game && now() - r.created_at < 10000)) return reply(400, { message: 'too soon' });
      if (!counts(row)) return reply(400, { message: 'before reset' });
      rows.push({ ...row, created_at: now() });
      return reply(201, null);
    }
    if (u.pathname.endsWith('/rpc/panda_since')) {
      const at = resets.get(JSON.parse(init.body).pid);
      return reply(200, at ? new Date(at).toISOString() : null);
    }
    if (u.pathname.endsWith('/panda_board')) {
      const game = (u.searchParams.get('game') || '').replace(/^eq\./, '');
      const limit = Number(u.searchParams.get('limit')) || 50;
      return reply(200, board(game).slice(0, limit));
    }
    return reply(404, null);
  }
  return { fetch, rows, resets };
}
