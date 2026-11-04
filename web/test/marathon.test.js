import { describe, it, expect } from 'vitest';
import { createMarathon, BOSS_EVERY, MAX_SPEED } from '../src/marathon/rules.js';
import { emptyMeta, applyRun, buy, refillMissions, normalizeMeta, mergeMeta, topScores, TOP_SIZE } from '../src/marathon/meta.js';

const seq = (values) => { let i = 0; return () => values[i++ % values.length]; };

describe('marathon rules', () => {
  it('plays every game once before any comes again, never twice in a row', () => {
    const pool = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    for (let seed = 1; seed <= 20; seed++) {
      const run = createMarathon({ pool, random: seq([0.13, 0.71, 0.42, 0.9, 0.05, 0.66, 0.3].map((x) => (x * seed) % 1)) });
      const played = [];
      for (let i = 0; i < pool.length * 4; i++) played.push(run.next());
      for (let d = 0; d < 4; d++) expect(new Set(played.slice(d * pool.length, (d + 1) * pool.length)).size).toBe(pool.length);
      for (let i = 1; i < played.length; i++) expect(played[i]).not.toBe(played[i - 1]);
    }
  });

  it('speeds up and shortens games, with floors and caps', () => {
    const run = createMarathon({ pool: ['a', 'b'] });
    expect(run.speed()).toBe(1);
    expect(run.duration(5)).toBe(5);
    for (let i = 0; i < 100; i++) { run.next(); run.report(true); }
    expect(run.speed()).toBe(MAX_SPEED);
    expect(run.duration(3)).toBe(1.6);
  });

  it('pays streaks: coins and multiplier grow, a loss resets them', () => {
    const run = createMarathon({ pool: ['a', 'b'] });
    for (let i = 0; i < 5; i++) { run.next(); run.report(true); }
    expect(run.multiplier()).toBe(2);
    expect(run.coins).toBe(6); // 1+1+1+1+2
    run.next();
    expect(run.report(false).lostLife).toBe(true);
    expect(run.streak).toBe(0);
    expect(run.multiplier()).toBe(1);
    expect(run.bestStreak).toBe(5);
  });

  it('ends after three lost lives and heals up to the start', () => {
    const run = createMarathon({ pool: ['a', 'b'] });
    run.next(); run.report(false);
    run.heal(); run.heal();
    expect(run.lives).toBe(3);
    for (let i = 0; i < 3; i++) { run.next(); run.report(false); }
    expect(run.isOver()).toBe(true);
  });

  it('meets every boss once before any boss comes back', () => {
    const bosses = ['babar', 'croco', 'romain'];
    for (let seed = 1; seed <= 20; seed++) {
      const run = createMarathon({ pool: ['a', 'b'], bosses, random: seq([0.13, 0.71, 0.42, 0.9, 0.05].map((x) => (x * seed) % 1)) });
      const met = [];
      for (let i = 0; i < bosses.length * 5; i++) met.push(run.nextBoss());
      for (let d = 0; d < 5; d++) expect(new Set(met.slice(d * bosses.length, (d + 1) * bosses.length)).size).toBe(bosses.length);
      for (let i = 1; i < met.length; i++) expect(met[i]).not.toBe(met[i - 1]);
    }
  });

  it('flags a boss every BOSS_EVERY games', () => {
    const run = createMarathon({ pool: ['a', 'b'] });
    const bosses = [];
    for (let i = 0; i < 30; i++) { if (run.isBoss()) bosses.push(run.level + 1); run.next(); run.report(true); }
    expect(bosses).toEqual([BOSS_EVERY, BOSS_EVERY * 2, BOSS_EVERY * 3]);
  });

  it('counts wins and losses per micro-game', () => {
    const run = createMarathon({ pool: ['a'] });
    run.next(); run.report(true);
    run.next(); run.report(false);
    expect(run.stats.a).toEqual({ won: 1, lost: 1 });
  });
});

describe('meta progression', () => {
  it('fills three different missions', () => {
    const meta = refillMissions(emptyMeta(), () => 'spit', seq([0, 0.3, 0.5, 0.7, 0.9]));
    expect(meta.missions.length).toBe(3);
    expect(new Set(meta.missions.map((m) => m.kind)).size).toBe(3);
  });

  it('applies a run: coins, best score, mission completion and reward', () => {
    let meta = emptyMeta();
    meta.missions = [{ kind: 'level', goal: 10, progress: 0, reward: 20 }, { kind: 'runs', goal: 2, progress: 0, reward: 20 }];
    const out = applyRun(meta, { level: 12, bestStreak: 4, coins: 7, score: 300, stats: {} });
    expect(out.newBest).toBe(true);
    expect(out.completed.map((m) => m.kind)).toEqual(['level']);
    expect(out.meta.coins).toBe(27);
    expect(out.meta.missions.length).toBe(1);
    expect(out.meta.missions[0].progress).toBe(1);
    expect(out.meta.tier).toBe(1);
  });

  it('counts a specific micro-game across runs', () => {
    let meta = emptyMeta();
    meta.missions = [{ kind: 'game', game: 'spit', goal: 3, progress: 0, reward: 20 }];
    meta = applyRun(meta, { level: 3, bestStreak: 2, coins: 2, score: 20, stats: { spit: { won: 2, lost: 0 } } }).meta;
    expect(meta.missions[0].progress).toBe(2);
    const out = applyRun(meta, { level: 3, bestStreak: 2, coins: 2, score: 20, stats: { spit: { won: 1, lost: 1 } } });
    expect(out.completed.length).toBe(1);
  });

  it('buys a hero only once and only when affordable', () => {
    const poor = emptyMeta();
    expect(buy(poor, 'cous')).toBe(null);
    const rich = { ...emptyMeta(), coins: 100 };
    const after = buy(rich, 'cous');
    expect(after.coins).toBe(40);
    expect(after.owned).toContain('cous');
    expect(buy(after, 'cous')).toBe(null);
    expect(buy(rich, 'nobody')).toBe(null);
  });
});

describe('save durability', () => {
  it('repairs a broken or old save and keeps unknown fields', () => {
    const m = normalizeMeta({ coins: -5, best: 'x', hero: 'greg', owned: ['panda'], future: 42 });
    expect(m.coins).toBe(0);
    expect(m.best).toBe(0);
    expect(m.hero).toBe('panda'); // not owned
    expect(m.owned).toContain('none');
    expect(m.future).toBe(42);
    expect(m.scores).toEqual([]);
    expect(normalizeMeta(null)).toEqual(emptyMeta());
  });

  it('keeps the top runs, best first, without duplicates', () => {
    const list = Array.from({ length: 15 }, (_, i) => ({ score: i * 10, at: i }));
    const top = topScores([...list, list[14]]);
    expect(top.length).toBe(TOP_SIZE);
    expect(top[0].score).toBe(140);
    expect(new Set(top.map((x) => x.at)).size).toBe(TOP_SIZE);
  });

  it('records each run and its rank', () => {
    let meta = emptyMeta();
    const a = applyRun(meta, { level: 5, bestStreak: 2, coins: 3, score: 50, stats: {}, hero: 'panda', at: 1 });
    const b = applyRun(a.meta, { level: 9, bestStreak: 4, coins: 3, score: 90, stats: {}, hero: 'cous', at: 2 });
    expect(a.rank).toBe(1);
    expect(b.rank).toBe(1);
    expect(b.meta.scores.map((x) => x.score)).toEqual([90, 50]);
    expect(b.meta.scores[0].hero).toBe('cous');
  });

  it('merges two tabs without losing anything earned', () => {
    const tabA = { ...emptyMeta(), coins: 10, best: 300, owned: ['panda', 'none', 'cous'], scores: [{ score: 300, at: 1 }], runs: 4, updated: 100 };
    const tabB = { ...emptyMeta(), coins: 2, best: 120, owned: ['panda', 'none', 'bakoua'], scores: [{ score: 120, at: 2 }], runs: 6, hat: 'bakoua', updated: 200 };
    const m = mergeMeta(normalizeMeta(tabA), normalizeMeta(tabB));
    expect(m.coins).toBe(2); // the newer tab spent coins
    expect(m.hat).toBe('bakoua');
    expect(m.owned).toEqual(expect.arrayContaining(['cous', 'bakoua']));
    expect(m.best).toBe(300);
    expect(m.runs).toBe(6);
    expect(m.scores.map((x) => x.score)).toEqual([300, 120]);
    expect(mergeMeta(normalizeMeta(tabB), normalizeMeta(tabA))).toEqual(m);
  });
});
