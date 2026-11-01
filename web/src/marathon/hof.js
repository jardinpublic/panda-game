// The gang's Hall of Fame, shared online.
//
// A player sends a run through a GitHub issue that the game pre-fills. The
// hall-of-fame workflow (tools/hof/accept.mjs) checks it with the rules below
// and writes hall-of-fame/hall-of-fame.json on main; the game reads that file
// from GitHub. Both sides import this module, so they always agree.
// Pure functions only: no DOM, no network.

import { CAST_IDS } from './art.js';

export const REPOSITORY = 'jardinpublic/panda-game';
export const BOARD_URL = `https://raw.githubusercontent.com/${REPOSITORY}/main/hall-of-fame/hall-of-fame.json`;
export const ISSUE_PREFIX = '[Pandadventures]';
export const PAYLOAD_VERSION = 1;
/** Minimum time between two accepted sends of the same player. */
export const SEND_PAUSE_MS = 2 * 60 * 1000;
const MAX_LEVEL = 2000;
const FENCE = '```';

/** Score multiplier for a streak (must match rules.js). */
export function multiplierFor(streak) {
  if (streak >= 20) return 4;
  if (streak >= 10) return 3;
  if (streak >= 5) return 2;
  return 1;
}

/** The highest score a run reaching `level` games can have (every game won). */
export function maxScore(level) {
  let total = 0;
  for (let s = 1; s <= level; s++) total += 10 * multiplierFor(s);
  return total;
}

/** The run a player sends: only what the board needs. */
export function buildPayload(run) {
  return {
    v: PAYLOAD_VERSION,
    score: Math.round(run.score),
    level: Math.round(run.level),
    streak: Math.round(run.bestStreak ?? run.streak ?? 0),
    hero: run.hero,
    at: Math.round(run.at || Date.now()),
  };
}

/** Title and body of the GitHub issue for a payload. */
export function issueFor(payload, lang = 'en') {
  const intro = lang === 'fr'
    ? 'Clique sur **Submit new issue** pour envoyer ce score au Panthéon de la bande. Ne modifie pas le bloc ci-dessous.'
    : 'Click **Submit new issue** to send this score to the gang\'s Hall of Fame. Do not edit the block below.';
  return {
    title: `${ISSUE_PREFIX} ${payload.score} pts`,
    body: `${intro}\n\n${FENCE}json\n${JSON.stringify(payload)}\n${FENCE}\n`,
  };
}

/** The link that opens the pre-filled issue. */
export function issueUrl(payload, lang = 'en') {
  const { title, body } = issueFor(payload, lang);
  return `https://github.com/${REPOSITORY}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

/** Reads the payload out of an issue body. Returns null if there is none. */
export function parseIssueBody(body) {
  const match = String(body || '').match(/```json\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    const value = JSON.parse(match[1]);
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
}

const int = (x) => Number.isInteger(x) && x >= 0;

/**
 * Checks a payload can be a real run. Returns {ok: true, entry} or
 * {ok: false, reason} (reason is a short code, see REASONS).
 */
export function validate(payload, now = Date.now()) {
  if (!payload || payload.v !== PAYLOAD_VERSION) return { ok: false, reason: 'format' };
  const { score, level, streak, hero, at } = payload;
  if (![score, level, streak, at].every(int)) return { ok: false, reason: 'format' };
  if (!CAST_IDS.includes(hero)) return { ok: false, reason: 'format' };
  if (score < 10 || score % 10 !== 0 || level < 1 || level > MAX_LEVEL) return { ok: false, reason: 'impossible' };
  if (streak > level || score > maxScore(level)) return { ok: false, reason: 'impossible' };
  if (score < streak * 10) return { ok: false, reason: 'impossible' };
  if (at > now + 10 * 60 * 1000 || at < Date.UTC(2026, 10, 1)) return { ok: false, reason: 'date' };
  return { ok: true, entry: { score, level, streak, hero, at } };
}

export function emptyBoard() {
  return { v: 1, updated: null, players: {} };
}

/**
 * Adds an accepted entry for a GitHub login. Keeps each player's best run and
 * counts their sends. Returns {board, reason} where reason is 'best' (new
 * personal best), 'kept' (not better than their best) or 'too_soon'.
 */
export function applyEntry(board, login, entry, now = Date.now()) {
  const next = structuredClone(board || emptyBoard());
  next.players ||= {};
  const key = String(login).toLowerCase();
  const prev = next.players[key];
  if (prev?.lastSent && now - prev.lastSent < SEND_PAUSE_MS) return { board: board, reason: 'too_soon' };
  const player = prev ? { ...prev } : { login, best: null, sends: 0 };
  player.login = login;
  player.sends = (player.sends || 0) + 1;
  player.lastSent = now;
  let reason = 'kept';
  if (!player.best || entry.score > player.best.score) {
    player.best = entry;
    reason = 'best';
  }
  next.players[key] = player;
  next.updated = new Date(now).toISOString();
  return { board: next, reason };
}

/** Players best first: score, then game reached, then who got there first. */
export function ranking(board) {
  return Object.values(board?.players || {})
    .filter((p) => p && p.best)
    .sort((a, b) => b.best.score - a.best.score || b.best.level - a.best.level || a.best.at - b.best.at);
}

/** The reply posted on the issue, in both languages. */
export const REASONS = {
  best: ['New personal best on the board! Hoho!', 'Nouveau record perso au Panthéon ! Hoho !'],
  kept: ['Score received, but your best on the board is higher.', 'Score reçu, mais ton record au Panthéon est plus haut.'],
  too_soon: ['Slow down! Wait two minutes between sends.', 'Doucement ! Attends deux minutes entre deux envois.'],
  format: ['This issue does not contain a score from the game. Send it from the game\'s game-over screen.', 'Ce ticket ne contient pas de score du jeu. Envoie-le depuis l\'écran de fin de partie.'],
  impossible: ['This score is not possible in the game, so it was not added.', 'Ce score est impossible dans le jeu, il n\'a pas été ajouté.'],
  date: ['The date of this run is not valid.', 'La date de cette partie n\'est pas valide.'],
};
