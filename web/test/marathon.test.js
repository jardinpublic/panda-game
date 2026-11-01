import { describe, it, expect } from 'vitest';
import { createMarathon, BOSS_EVERY } from '../src/marathon/rules.js';
import { emptyMeta, applyRun, buy, refillMissions } from '../src/marathon/meta.js';

const seq = (values) => { let i = 0; return () => values[i++ % values.length]; };

describe('marathon rules', () => {
  it('never repeats one of the last three micro-games', () => {
    const run = createMarathon({ pool: ['a', 'b', 'c', 'd', 'e'], random: Math.random });
    const played = [];
    for (let i = 0; i < 200; i++) played.push(run.next());
    for (let i = 3; i < played.length; i++) {
      expect(played.slice(i - 3, i)).not.toContain(played[i]);
    }
  });

  it('speeds up and shortens games, with floors and caps', () => {
    const run = createMarathon({ pool: ['a', 'b'] });
    expect(run.speed()).toBe(1);
    expect(run.duration(5)).toBe(5);
    for (let i = 0; i < 100; i++) { run.next(); run.report(true); }
    expect(run.speed()).toBe(2.4);
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
