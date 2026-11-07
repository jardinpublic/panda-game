// The online Hall of Fame: names, what gets sent and when, and the board.
import { describe, it, expect } from 'vitest';
import { cleanName, newPlayerId, rowFor, plausible, toSend, createOnline, memoryBackend, bestRun } from '../src/marathon/online.js';
import { emptyMeta, normalizeMeta, mergeMeta, applyRun, applyPinball, applySpx, dropOldRecords } from '../src/marathon/meta.js';
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

  it('sends flipper records past 50 million (they were held on the phone before)', async () => {
    let meta = player();
    meta = applyPinball(meta, { score: 21209270, hero: 'panda', at: NOW - 5000 }).meta;
    meta.online.sent.flipper = 21209270;
    meta = applyPinball(meta, { score: 65623970, hero: 'panda', at: NOW - 1000 }).meta;
    expect(toSend(meta, NOW)).toEqual(['flipper']);
    const { fetch } = memoryBackend([], () => NOW);
    const net = createOnline({ url: 'https://x.supabase.co', key: 'sb_publishable_x', fetch });
    expect(await net.send(rowFor(meta, 'flipper'))).toBe('sent');
    expect((await net.board('flipper'))[0].score).toBe(65623970);
    // Still refused: more than the database's integer column can hold
    expect(plausible({ ...rowFor(meta, 'flipper'), score: 2500000000 }, NOW)).toBe(false);
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

  it('shows a friend once per game when they play on several phones, with their best', async () => {
    const at = new Date(NOW - 60000).toISOString();
    const seed = [
      { player_id: 'phone', name: 'Violon', game: 'marathon', score: 230, level: 12, streak: 6, hero: 'violaine', played_at: at },
      { player_id: 'app', name: 'Violon', game: 'marathon', score: 370, level: 20, streak: 8, hero: 'violaine', played_at: at },
      { player_id: 'tablet', name: 'violon', game: 'marathon', score: 170, level: 10, streak: 4, hero: 'violaine', played_at: at },
      { player_id: 'other', name: 'Babar', game: 'marathon', score: 300, level: 18, streak: 2, hero: 'babar', played_at: at },
    ];
    const backend = memoryBackend(seed, () => NOW);
    const net = createOnline({ url: 'https://x.supabase.co', key: 'k', fetch: backend.fetch });
    const board = await net.board('marathon');
    expect(board.map((r) => [r.name, r.score])).toEqual([
      ['Violon', 370],
      ['Babar', 300],
    ]);
    // Still recorded per phone
    expect(new Set(backend.rows.map((r) => r.player_id)).size).toBe(4);
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

  it('after a records reset, hides the old scores, refuses them again, and sends only new records', async () => {
    let t = NOW;
    const backend = memoryBackend([], () => t);
    const net = createOnline({ url: 'https://x.supabase.co', key: 'k', fetch: backend.fetch });
    let meta = player('Cous');
    meta = applyPinball(meta, { score: 47000000, hero: 'panda', at: NOW - 5000 }).meta;
    meta = applySpx(meta, { score: 40000, hero: 'panda', time: 140, finished: true, at: NOW - 4000 }).meta;
    expect(await net.send(rowFor(meta, 'flipper'))).toBe('sent');
    meta.online.sent.flipper = 47000000;
    expect(await net.since(meta.online.id)).toBe(0);

    // The reset, on the board
    t += 20000;
    backend.resets.set(meta.online.id, t);
    expect(await net.board('flipper')).toEqual([]);
    expect(await net.since(meta.online.id)).toBe(t);
    expect(await net.send(rowFor(meta, 'spx'))).toBe('refused');

    // The phone hears of it: old runs gone, nothing to send until a new record
    meta.online.since = t;
    meta.online.sent = { marathon: 0, flipper: 0, spx: 0 };
    dropOldRecords(meta);
    expect(meta.pinball.scores).toEqual([]);
    expect(meta.pinball.best).toBe(0);
    expect(meta.spx.best).toBe(0);
    expect(toSend(meta, t)).toEqual([]);

    // An old copy of the save merged back in does not bring them back
    const old = player('Cous');
    old.pinball = { best: 47000000, games: 3, scores: [{ score: 47000000, hero: 'panda', at: NOW - 5000 }] };
    old.updated = 1;
    meta.updated = 2;
    meta = mergeMeta(old, meta);
    expect(meta.pinball.best).toBe(0);
    expect(normalizeMeta(JSON.parse(JSON.stringify(meta))).pinball.scores).toEqual([]);

    // A new, lower record goes on the board
    t += 60000;
    meta = applyPinball(meta, { score: 900000, hero: 'panda', at: t - 1000 }).meta;
    expect(meta.pinball.best).toBe(900000);
    expect(toSend(meta, t)).toEqual(['flipper']);
    expect(await net.send(rowFor(meta, 'flipper'))).toBe('sent');
    expect((await net.board('flipper')).map((r) => [r.name, r.score])).toEqual([['Cous', 900000]]);
  });

  it('after a reset, an old "sent" mark from the stored save does not hold back the new record', () => {
    // The stored save, from before the reset: old record, marked as sent
    const stored = player('Cous');
    stored.pinball = { best: 47000000, games: 3, scores: [{ score: 47000000, hero: 'panda', at: NOW - 5000 }] };
    stored.online.sent.flipper = 47000000;
    stored.updated = 1;
    // This launch: the reset arrived, sent marks cleared, then a new record
    let mine = JSON.parse(JSON.stringify(stored));
    mine.online.since = NOW;
    mine.online.sent = { marathon: 0, flipper: 0, spx: 0 };
    dropOldRecords(mine);
    mine = applyPinball(mine, { score: 4000000, hero: 'panda', at: NOW + 1000 }).meta;
    mine.updated = 2;
    // Saving merges with the stored copy (the most sent of both)
    const merged = mergeMeta(stored, mine);
    expect(merged.pinball.best).toBe(4000000);
    expect(toSend(merged, NOW + 2000)).toEqual(['flipper']);
    // The phone that already saved the stale mark is repaired on load
    const stale = JSON.parse(JSON.stringify(merged));
    stale.online.sent.flipper = 47000000;
    expect(toSend(normalizeMeta(stale), NOW + 2000)).toEqual(['flipper']);
    // Once sent, it stays sent
    merged.online.sent.flipper = 4000000;
    expect(toSend(normalizeMeta(merged), NOW + 2000)).toEqual([]);
  });
});

it('sends Golden Merguez records to the board (the database accepts them since 2026-11-07)', async () => {
  const { toSend, NOT_ON_BOARD_YET } = await import('../src/marathon/online.js');
  const { emptyMeta, applyMerguez } = await import('../src/marathon/meta.js');
  let meta = emptyMeta();
  meta.online = { ...meta.online, id: 'p1', name: 'Cous' };
  meta = applyMerguez(meta, { score: 12000, hero: 'cous', level: 1, finished: true, time: 90 }).meta;
  expect(NOT_ON_BOARD_YET).not.toContain('merguez');
  expect(toSend(meta)).toContain('merguez');
  expect(meta.merguez.best).toBe(12000);
});

it('a single-game reset forgets only that game, and the old record is not sent again', async () => {
  const { createOnline, memoryBackend, toSend, rowFor } = await import('../src/marathon/online.js');
  const { emptyMeta, applyMerguez, applySpx, dropOldRecords } = await import('../src/marathon/meta.js');
  let now = Date.parse('2026-11-06T21:00:00Z');
  const backend = memoryBackend([], () => now);
  const net = createOnline({ url: 'https://x.supabase.co', key: 'k', fetch: backend.fetch });
  let meta = emptyMeta();
  meta.online = { ...meta.online, id: 'p-cous', name: 'Cous l’infâme' };
  meta = applyMerguez(meta, { score: 174350, hero: 'cous', level: 5, finished: true, time: 600, at: now }).meta;
  meta = applySpx(meta, { score: 40000, hero: 'cous', time: 120, finished: true, at: now }).meta;
  for (const g of toSend(meta)) {
    expect(await net.send(rowFor(meta, g))).toBe('sent');
    meta.online.sent[g] = rowFor(meta, g).score;
    now += 11000;
  }
  // The Golden Merguez record is erased on the board, for that game only
  now = Date.parse('2026-11-07T06:00:00Z');
  backend.gameResets.set('p-cous|merguez', now);
  expect((await net.board('merguez')).length).toBe(0);
  expect((await net.board('spx')).length).toBe(1);
  // The phone learns it: forgets its Golden Merguez runs before, keeps the 103 RCX
  const per = await net.gameSince('p-cous');
  expect(per.merguez).toBe(now);
  meta.online.gameSince = per;
  meta.online.sent.merguez = 0;
  dropOldRecords(meta);
  expect(meta.merguez.best).toBe(0);
  expect(meta.spx.best).toBe(40000);
  expect(toSend(meta)).not.toContain('merguez');
  // And if an old copy tried to send it again, the board refuses it
  const old = { player_id: 'p-cous', name: 'Cous l’infâme', game: 'merguez', score: 174350, level: 5, ride_time: 600, home: true, hero: 'cous', played_at: '2026-11-06T21:00:00.000Z' };
  now += 20000;
  expect(await net.send(old)).toBe('refused');
});
