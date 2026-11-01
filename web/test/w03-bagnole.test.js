import { describe, it, expect } from 'vitest';
import {
  createDefence, modeConfig, waveSize, shoutPoints, starsForDamage, outsideCar,
  CAR, SPAWN_R, SHOUT_COOLDOWN, SPIT_WARN, PISTOL_TIME,
} from '../src/worlds/w03-bagnole/rules.js';

function seeded(seed = 12345) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const DT = 1 / 60;

/** Steps until a predicate holds (or a time limit). Returns all events seen. */
function runUntil(s, pred, limit = 300, move = null) {
  const all = [];
  let t = 0;
  while (!s.over && !pred(s) && t < limit) {
    for (const e of s.step(DT, move)) all.push(e);
    t += DT;
  }
  return all;
}

/** A decent player: chase the kid closest to the car and shout when close. */
function bot(s) {
  let target = null;
  let best = Infinity;
  for (const k of s.kids) {
    if (k.state !== 'approach' && k.state !== 'mischief') continue;
    const d = Math.hypot(k.x, k.z) + Math.hypot(k.x - s.panda.x, k.z - s.panda.z) * 0.5;
    if (d < best && Math.hypot(k.x, k.z) < 9) { best = d; target = k; }
  }
  for (const p of s.pickups) if (Math.hypot(p.x - s.panda.x, p.z - s.panda.z) < 3) s.setTarget(p.x, p.z);
  if (target) s.setTarget(target.x, target.z, target.id);
}

function playWithBot(mode, seed = 21) {
  const s = createDefence({ mode, rand: seeded(seed) });
  let t = 0;
  while (!s.over && t < 400) {
    bot(s);
    s.step(DT);
    t += DT;
  }
  return { s, t };
}

describe('w03 config', () => {
  it('gets harder with the mode', () => {
    const e = modeConfig('easy');
    const h = modeConfig('hard');
    expect(h.waves).toBeGreaterThan(e.waves);
    expect(h.kidSpeed).toBeGreaterThan(e.kidSpeed);
    expect(h.rate).toBeGreaterThan(e.rate);
    expect(h.spawnEvery).toBeLessThan(e.spawnEvery);
    expect(waveSize(h, 3)).toBeGreaterThan(waveSize(e, 3));
    expect(waveSize(e, 2)).toBe(waveSize(e, 1) + e.growth);
  });

  it('pays more for multi-kid shouts and stars on car damage', () => {
    expect(shoutPoints(0)).toBe(0);
    expect(shoutPoints(1)).toBe(10);
    expect(shoutPoints(3)).toBe(90);
    expect(starsForDamage(10)).toBe(3);
    expect(starsForDamage(40)).toBe(2);
    expect(starsForDamage(80)).toBe(1);
    expect(starsForDamage(100)).toBe(0);
  });

  it('keeps Panda out of the car', () => {
    const [x, z] = outsideCar(0.2, 0.1);
    expect((x / (CAR.rx + 0.35)) ** 2 + (z / (CAR.rz + 0.35)) ** 2).toBeCloseTo(1);
    expect(outsideCar(8, 0)).toEqual([8, 0]);
  });
});

describe('w03 kids and the car', () => {
  it('starts a wave, spawns kids at the edge, and they damage the car', () => {
    const s = createDefence({ mode: 'normal', rand: seeded(1) });
    const events = runUntil(s, (x) => x.atCar() > 0, 30);
    expect(events.some((e) => e.type === 'wave' && e.wave === 1)).toBe(true);
    const spawn = events.find((e) => e.type === 'spawn');
    expect(Math.hypot(spawn.kid.x, spawn.kid.z)).toBeLessThanOrEqual(SPAWN_R);
    expect(s.atCar()).toBeGreaterThan(0);
    const before = s.damage;
    runUntil(s, () => false, 1);
    expect(s.damage).toBeGreaterThan(before);
  });

  it('shoos kids within reach only, with a cooldown', () => {
    const s = createDefence({ mode: 'normal', rand: seeded(1) });
    runUntil(s, (x) => x.atCar() > 0, 30);
    const kid = s.kids.find((k) => k.state === 'mischief');
    s.panda.x = kid.x + 0.5;
    s.panda.z = kid.z;
    const r = s.shout();
    expect(r.count).toBeGreaterThanOrEqual(1);
    expect(kid.state).toBe('flee');
    expect(s.shooed).toBe(r.count);
    expect(s.score).toBe(shoutPoints(r.count));
    expect(s.shout()).toBeNull();
    runUntil(s, () => false, SHOUT_COOLDOWN + 0.05);
    expect(s.shout()).not.toBeNull();
  });

  it('does not shoo kids out of reach', () => {
    const s = createDefence({ mode: 'easy', rand: seeded(2) });
    runUntil(s, (x) => x.kids.length > 0, 30);
    s.panda.x = 0;
    s.panda.z = 0;
    const far = s.kids.filter((k) => Math.hypot(k.x, k.z) > 6);
    s.shout();
    for (const k of far) expect(k.state).not.toBe('flee');
  });

  it('auto-shouts when Panda reaches a tapped kid', () => {
    const s = createDefence({ mode: 'easy', rand: seeded(3) });
    runUntil(s, (x) => x.kids.length > 0, 30);
    const kid = s.kids[0];
    s.setTarget(kid.x, kid.z, kid.id);
    const events = runUntil(s, () => kid.state === 'flee', 10);
    expect(events.some((e) => e.type === 'shout' && e.count >= 1)).toBe(true);
  });

  it('lets kids distracted by ice cream leave without damage', () => {
    const s = createDefence({ mode: 'normal', rand: seeded(4) });
    runUntil(s, (x) => x.atCar() > 0, 30);
    s.usePower('icecream', 6, 6);
    expect(s.kids.every((k) => k.state !== 'mischief')).toBe(true);
    const before = s.damage;
    runUntil(s, () => false, 3);
    // Only freshly spawned kids could be at the car; distracted ones never are.
    expect(s.kids.filter((k) => k.state === 'mischief').length).toBe(0);
    expect(s.damage).toBe(before);
    const events = runUntil(s, (x) => !x.distraction, 10);
    expect(events.some((e) => e.type === 'distraction_end')).toBe(true);
  });

  it('scary face shoos every kid nearby; water pistol squirts on its own', () => {
    const s = createDefence({ mode: 'hard', rand: seeded(5) });
    runUntil(s, (x) => x.atCar() >= 2, 40);
    s.panda.x = 0; s.panda.z = 2.5;
    s.usePower('scary');
    expect(s.atCar()).toBe(0);
    s.usePower('pistol');
    expect(s.pistol).toBe(PISTOL_TIME);
    const events = runUntil(s, (x) => x.pistol <= 0, 10);
    expect(events.some((e) => e.type === 'squirt')).toBe(true);
  });

  it('Babar spit lands after a warning and slows Panda', () => {
    const s = createDefence({ mode: 'normal', rand: seeded(6) });
    const events = runUntil(s, (x) => x.spit && x.spit.warn <= 0, 60);
    expect(events.some((e) => e.type === 'spit_warn')).toBe(true);
    expect(events.some((e) => e.type === 'spit_land')).toBe(true);
    s.panda.x = s.spit.x; s.panda.z = s.spit.z;
    const x0 = s.panda.x;
    s.step(0.1, { x: 1, z: 0 });
    expect(s.panda.slowed).toBe(true);
    expect(s.panda.x - x0).toBeLessThan(0.75 * 0.5);
    expect(SPIT_WARN).toBeGreaterThan(0);
  });

  it('sends Cous and his guinea pigs at wave 3', () => {
    const s = createDefence({ mode: 'easy', rand: seeded(7) });
    s.wave = 2; s.phase = 'break'; s.phaseTimer = 0.01;
    const events = runUntil(s, (x) => x.wave === 3, 5);
    expect(events.some((e) => e.type === 'cous')).toBe(true);
    expect(s.distraction.kind).toBe('pets');
  });
});

describe('w03 end of run', () => {
  it('loses when the car is wrecked', () => {
    const s = createDefence({ mode: 'hard', rand: seeded(8) });
    s.panda.x = 0; s.panda.z = -11; // far away behind the car, never shouting
    const events = runUntil(s, () => false, 400);
    expect(s.over).toBe(true);
    expect(s.damage).toBe(100);
    expect(events.some((e) => e.type === 'lose')).toBe(true);
    expect(s.stars()).toBe(0);
    expect(s.won()).toBe(false);
  });

  it('a decent player survives every wave in 45-120 s, easier on easy', () => {
    const results = {};
    for (const mode of ['easy', 'normal', 'hard']) {
      const { s, t } = playWithBot(mode);
      results[mode] = { won: s.won(), damage: s.damage, t, stars: s.stars(), score: s.finalScore() };
      expect(t).toBeGreaterThan(45);
      expect(t).toBeLessThan(120);
    }
    expect(results.easy.won).toBe(true);
    expect(results.normal.won).toBe(true);
    expect(results.easy.stars).toBeGreaterThanOrEqual(2);
    expect(results.easy.damage).toBeLessThan(results.hard.damage);
    expect(results.easy.score).toBeGreaterThan(0);
  });

  it('awards the bonus and stars only on a win', () => {
    const s = createDefence({ rand: seeded(9) });
    s.score = 100; s.damage = 20;
    expect(s.finalScore()).toBe(100);
    s.phase = 'won';
    expect(s.finalScore()).toBe(500);
    expect(s.stars()).toBe(3);
  });
});
