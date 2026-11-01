import { describe, it, expect } from 'vitest';
import { maxScore, buildPayload, issueFor, issueUrl, parseIssueBody, validate, applyEntry, emptyBoard, ranking, SEND_PAUSE_MS, ISSUE_PREFIX } from '../src/marathon/hof.js';
import { createMarathon } from '../src/marathon/rules.js';

const NOW = Date.UTC(2026, 10, 3, 12);
const run = (over = {}) => ({ score: 120, level: 12, bestStreak: 6, hero: 'panda', at: NOW - 1000, ...over });

describe('hall of fame rules', () => {
  it('the max score matches what the marathon can really give', () => {
    const m = createMarathon({ pool: ['a', 'b'] });
    for (let i = 0; i < 40; i++) { m.next(); m.report(true); }
    expect(maxScore(40)).toBe(m.score);
  });

  it('round-trips a payload through the issue text', () => {
    const payload = buildPayload(run());
    const { title, body } = issueFor(payload, 'fr');
    expect(title.startsWith(ISSUE_PREFIX)).toBe(true);
    expect(parseIssueBody(body)).toEqual(payload);
    expect(issueUrl(payload)).toContain('issues/new?title=');
  });

  it('accepts a real run and refuses impossible ones', () => {
    expect(validate(buildPayload(run()), NOW).ok).toBe(true);
    expect(validate(buildPayload(run({ score: maxScore(12) + 10 })), NOW).reason).toBe('impossible');
    expect(validate(buildPayload(run({ score: 125 })), NOW).reason).toBe('impossible');
    expect(validate(buildPayload(run({ bestStreak: 13 })), NOW).reason).toBe('impossible');
    expect(validate(buildPayload(run({ hero: 'nobody' })), NOW).reason).toBe('format');
    expect(validate(buildPayload(run({ at: NOW + 3600e3 })), NOW).reason).toBe('date');
    expect(validate(null, NOW).reason).toBe('format');
    expect(parseIssueBody('no block here')).toBe(null);
    expect(parseIssueBody('```json\n{oops\n```')).toBe(null);
  });

  it('keeps each player best run, counts sends and slows down spam', () => {
    const e = (score) => validate(buildPayload(run({ score })), NOW).entry;
    let { board, reason } = applyEntry(emptyBoard(), 'Cous', e(100), NOW);
    expect(reason).toBe('best');
    ({ board, reason } = applyEntry(board, 'cous', e(120), NOW + 1000));
    expect(reason).toBe('too_soon');
    ({ board, reason } = applyEntry(board, 'cous', e(80), NOW + SEND_PAUSE_MS));
    expect(reason).toBe('kept');
    ({ board, reason } = applyEntry(board, 'cous', e(120), NOW + 2 * SEND_PAUSE_MS));
    expect(reason).toBe('best');
    expect(board.players.cous.sends).toBe(3);
    expect(board.players.cous.best.score).toBe(120);
  });

  it('ranks players by score, then game reached, then who was first', () => {
    let board = emptyBoard();
    board = applyEntry(board, 'a', { score: 100, level: 10, streak: 1, hero: 'panda', at: 2 }, NOW).board;
    board = applyEntry(board, 'b', { score: 100, level: 12, streak: 1, hero: 'cous', at: 3 }, NOW).board;
    board = applyEntry(board, 'c', { score: 200, level: 20, streak: 1, hero: 'mamar', at: 4 }, NOW).board;
    expect(ranking(board).map((p) => p.login)).toEqual(['c', 'b', 'a']);
  });
});
