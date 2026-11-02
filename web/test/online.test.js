// The online Hall of Fame: names, what gets sent and when, and the board.
import { describe, it, expect } from 'vitest';
import { cleanName, newPlayerId, rowFor, plausible, toSend, createOnline, memoryBackend, bestRun } from '../src/marathon/online.js';
import { emptyMeta, normalizeMeta, mergeMeta, applyRun, applyPinball, applySpx } from '../src/marathon/meta.js';
import { maxScore } from '../src/marathon/hof.js';

const NOW = Date.UTC(2026, 10, 3, 12);

function player(name = 'Cous') {
  const meta = emptyMeta();
  meta.online.id = '11111111-2222-4333-8444-555555555555';
  meta.online.name = name;
  return meta;
}

describe('online Hall of Fame', () => {
  it('cleans the names people type', () => {
    expect(cleanName('  Eul’   Tatou  ')).toBe('Eul’ Tatou');
    expect(cleanName('<b>Cous</b>')).toBe('bCous/b');
    expect(cleanName('a'.repeat(40)).length).toBe(20);
    expect(cleanName('\n\t ')).toBe('');
    expect(newPlayerId()).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('keeps the online profile in the save, through repairs and merges', () => {
    const a = player('Cous');
    a.online.sent.spx = 30000;
    a.updated = 1;
    const b = normalizeMeta({ ...emptyMeta(), updated: 2 });
    const m = mergeMeta(a, b);
    expect(m.online.id).toBe(a.online.id);
    expect(m.online.name).toBe('Cous');
    expect(m.online.sent.spx).toBe(30000);
    expect(normalizeMeta({}).online).toEqual(emptyMeta().online);
  });

  it('sends nothing before the player has a name', () => {
    const meta = emptyMeta();
    applyPinball(meta, { score: 1200, hero: 'panda', at: NOW });
    expect(toSend(meta, NOW)).toEqual([]);
  });

  it('sends each game best once, and again only when it is beaten', () => {
    let meta = player();
    meta = applyRun(meta, { score: 120, level: 12, streak: 6, hero: 'panda', at: NOW - 1000 }).meta;
    meta = applyPinball(meta, { score: 45000, hero: 'panda', at: NOW - 900 }).meta;
    meta = applySpx(meta, { score: 38000, hero: 'panda', time: 140, finished: true, at: NOW - 800 }).meta;
    expect(toSend(meta, NOW)).toEqual(['marathon', 'flipper', 'spx']);
    for (const g of ['marathon', 'flipper', 'spx']) meta.online.sent[g] = rowFor(meta, g).score;
    expect(toSend(meta, NOW)).toEqual([]);
    meta = applySpx(meta, { score: 39000, hero: 'panda', time: 135, finished: true, at: NOW - 100 }).meta;
    expect(toSend(meta, NOW)).toEqual(['spx']);
    expect(bestRun(meta, 'spx').score).toBe(39000);
  });

  it('refuses impossible scores before sending them', () => {
    const meta = player();
    const base = { player_id: meta.online.id, name: 'Cous', hero: 'panda', played_at: new Date(NOW - 1000).toISOString() };
    expect(plausible({ ...base, game: 'marathon', score: 120, level: 12, streak: 6 }, NOW)).toBe(true);
    expect(plausible({ ...base, game: 'marathon', score: maxScore(12) + 10, level: 12, streak: 6 }, NOW)).toBe(false);
    expect(plausible({ ...base, game: 'marathon', score: 125, level: 12, streak: 6 }, NOW)).toBe(false);
    expect(plausible({ ...base, game: 'spx', score: 40000, ride_time: 30, home: true }, NOW)).toBe(false);
    expect(plausible({ ...base, game: 'spx', score: 40000, ride_time: 140, home: true }, NOW)).toBe(true);
    expect(plausible({ ...base, game: 'flipper', score: 0 }, NOW)).toBe(false);
    expect(plausible({ ...base, game: 'tetris', score: 10 }, NOW)).toBe(false);
    expect(plausible({ ...base, game: 'flipper', score: 10, played_at: new Date(NOW + 3600e3).toISOString() }, NOW)).toBe(false);
  });

  it('shows each player once per game, with their best and their latest name', async () => {
    let t = NOW;
    const backend = memoryBackend([], () => t);
    const net = createOnline({ url: 'https://x.supabase.co', key: 'sb_publishable_test', fetch: backend.fetch });
    const send = async (id, name, score, at) => {
      t += 20000;
      return net.send({ player_id: id, name, game: 'flipper', score, hero: 'panda', played_at: new Date(at).toISOString() });
    };
    expect(await send('a', 'Cous', 5000, NOW - 5000)).toBe('sent');
    expect(await send('a', 'Cous', 9000, NOW - 4000)).toBe('sent');
    expect(await send('b', 'Babar', 7000, NOW - 3000)).toBe('sent');
    expect(await send('a', 'Le Cous', 6000, NOW - 2000)).toBe('sent');
    const board = await net.board('flipper');
    expect(board.map((r) => [r.name, r.score])).toEqual([
      ['Le Cous', 9000],
      ['Babar', 7000],
    ]);
    expect(board[0].player_id).toBeUndefined();
  });

  it('shows the face each player picked, and their latest one', async () => {
    let t = NOW;
    const backend = memoryBackend([], () => t);
    const net = createOnline({ url: 'https://x.supabase.co', key: 'k', fetch: backend.fetch });
    let meta = player('Cous');
    meta.online.avatar = 'violaine';
    meta = applyPinball(meta, { score: 5000, hero: 'panda', at: NOW - 5000 }).meta;
    expect(rowFor(meta, 'flipper').hero).toBe('violaine');
    await net.send(rowFor(meta, 'flipper'));
    t += 20000;
    meta.online.avatar = 'babar';
    meta = applySpx(meta, { score: 30000, hero: 'panda', time: 140, finished: true, at: NOW - 1000 }).meta;
    await net.send(rowFor(meta, 'spx'));
    expect((await net.board('flipper'))[0].hero).toBe('babar');
    meta.online.avatar = 'nobody';
    expect(rowFor(meta, 'flipper').hero).toBe('panda');
  });

  it('tells a refused score from a network problem, and slows down spam', async () => {
    let t = NOW;
    const backend = memoryBackend([], () => t);
    const net = createOnline({ url: 'https://x.supabase.co', key: 'k', fetch: backend.fetch });
    const row = { player_id: 'a', name: 'Cous', game: 'flipper', score: 100, hero: 'panda', played_at: new Date(NOW - 1000).toISOString() };
    expect(await net.send(row)).toBe('sent');
    // A second send within 10 seconds: try again later (not lost)
    expect(await net.send({ ...row, score: 200 })).toBe('later');
    expect(await net.send({ ...row, game: 'spx', score: 999999 })).toBe('refused');
    const down = createOnline({ url: 'https://x.supabase.co', key: 'k', fetch: async () => { throw new Error('offline'); } });
    expect(await down.send(row)).toBe('later');
    const busy = createOnline({ url: 'https://x.supabase.co', key: 'k', fetch: async () => ({ ok: false, status: 503 }) });
    expect(await busy.send(row)).toBe('later');
    expect(createOnline({ url: '', key: '' }).configured).toBe(false);
  });

  it('sends the public key the way Supabase wants it', async () => {
    const seen = [];
    const spy = async (url, init) => {
      seen.push({ url, headers: init.headers });
      return { ok: true, status: 201, json: async () => [] };
    };
    await createOnline({ url: 'https://x.supabase.co/', key: 'sb_publishable_abc', fetch: spy }).send({ game: 'flipper' });
    await createOnline({ url: 'https://x.supabase.co', key: 'eyJhbGciOi.jwt', fetch: spy }).board('spx');
    expect(seen[0].url).toBe('https://x.supabase.co/rest/v1/panda_scores');
    expect(seen[0].headers.apikey).toBe('sb_publishable_abc');
    expect(seen[0].headers.Authorization).toBeUndefined();
    expect(seen[1].url).toContain('/rest/v1/panda_board?');
    expect(seen[1].url).toContain('game=eq.spx');
    expect(seen[1].headers.Authorization).toBe('Bearer eyJhbGciOi.jwt');
  });
});
