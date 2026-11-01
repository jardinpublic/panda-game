import { describe, it, expect } from 'vitest';
import {
  createBallGame, MODES, ARENA_R, GRASS, attackPool, attackInterval, starsFor, scoreFor,
} from '../src/worlds/w06-ball/rules.js';

/** Deterministic generator, same algorithm as ctx.random. */
function seeded(seed = 12345) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}
const DT = 1 / 60;
const make = (mode = 'normal') => createBallGame({ mode, random: seeded() });
function run(g, seconds, inp = {}) {
  let last;
  for (let t = 0; t < seconds; t += DT) last = g.step(DT, inp);
  return last;
}
/** Puts a still ball right on Panda. */
function ballOnPanda(g) {
  const b = g.addBall('aimed', 0, 0);
  b.x = g.x; b.z = g.z; b.vx = 0; b.vz = 0;
  return b;
}
/** A quiet arena: no throws, spits, decoys or breaks for the test. */
function quiet(g) {
  g.attackTimer = 1e9; g.spitTimer = 1e9; g.decoyTimer = 1e9; g.nextBreak = 1e9; g.invuln = 0;
  return g;
}

describe('w06 difficulty', () => {
  it('lasts 45-120 s, longer and denser on hard', () => {
    for (const m of Object.values(MODES)) {
      expect(m.duration).toBeGreaterThanOrEqual(45);
      expect(m.duration).toBeLessThanOrEqual(120);
    }
    expect(MODES.easy.duration).toBeLessThan(MODES.normal.duration);
    expect(MODES.normal.duration).toBeLessThan(MODES.hard.duration);
    expect(MODES.hard.interval).toBeLessThan(MODES.easy.interval);
    expect(MODES.hard.ballSpeed).toBeGreaterThan(MODES.easy.ballSpeed);
    expect(MODES.hard.spreadN).toBeGreaterThan(MODES.easy.spreadN);
  });

  it('unlocks attack patterns as the run progresses and throws faster', () => {
    expect(attackPool(0)).toEqual(['aimed']);
    expect(attackPool(0.6)).toEqual(['aimed', 'spread', 'rapid', 'bounce', 'giant']);
    expect(attackInterval(MODES.normal, 1)).toBeLessThan(attackInterval(MODES.normal, 0));
  });
});

describe('w06 movement and dash', () => {
  it('moves with the input and stays inside the arena', () => {
    const g = quiet(make());
    run(g, 0.5, { mx: 1, mz: 0 });
    expect(g.x).toBeGreaterThan(1.5);
    run(g, 5, { mx: 1, mz: 0 });
    expect(Math.hypot(g.x, g.z)).toBeLessThanOrEqual(ARENA_R);
  });

  it('dashes with invulnerability, then waits for the cooldown', () => {
    const g = quiet(make());
    const ev = g.step(DT, { mx: 0, mz: -1, dash: true });
    expect(ev.dashed).toBe(true);
    expect(g.invuln).toBeGreaterThan(0);
    expect(g.vz).toBeLessThan(-10);
    expect(g.step(DT, { dash: true }).dashed).toBe(false);
    run(g, MODES.normal.dashCd + 0.1);
    expect(g.step(DT, { dash: true }).dashed).toBe(true);
  });

  it('ignores a ball while dashing', () => {
    const g = quiet(make());
    g.step(DT, { mx: 1, dash: true });
    ballOnPanda(g);
    expect(g.step(DT, {}).hit).toBe(false);
    expect(g.struggle).toBe(null);
  });

  it('slides on Babar\'s puddles (slower to change direction)', () => {
    const dry = quiet(make());
    const wet = quiet(make());
    wet.puddles.push({ id: 99, x: wet.x, z: wet.z, r: 3, landIn: 0, life: 9, dead: false });
    expect(wet.onPuddle()).toBe(true);
    run(dry, 0.2, { mx: 1 });
    run(wet, 0.2, { mx: 1 });
    expect(Math.abs(wet.vx)).toBeLessThan(Math.abs(dry.vx));
  });
});

describe('w06 capture struggle', () => {
  it('a hit starts a struggle; mashing breaks free', () => {
    const g = quiet(make());
    ballOnPanda(g);
    expect(g.step(DT, {}).hit).toBe(true);
    expect(g.struggle).not.toBe(null);
    let freed = false;
    for (let i = 0; i < 300 && !freed; i++) freed = g.step(DT, { mash: i % 6 === 0 ? 1 : 0 }).freed; // 10 taps/s
    expect(freed).toBe(true);
    expect(g.escapes).toBe(1);
    expect(g.captures).toBe(0);
    expect(g.invuln).toBeGreaterThan(0);
  });

  it('no mashing = captured; three captures = lose', () => {
    const g = quiet(make());
    for (let n = 1; n <= 3; n++) {
      g.invuln = 0;
      ballOnPanda(g);
      g.step(DT, {});
      let ev;
      for (let i = 0; i < 400 && g.struggle; i++) ev = g.step(DT, {});
      expect(ev.captured).toBe(true);
      expect(g.captures).toBe(n);
    }
    expect(g.over).toBe(true);
    expect(g.won).toBe(false);
  });

  it('slow mashing frees Panda on easy but not on hard', () => {
    const tryAt = (mode, perSecond) => {
      const g = quiet(make(mode));
      ballOnPanda(g);
      g.step(DT, {});
      const every = Math.round(60 / perSecond);
      for (let i = 0; i < 600 && g.struggle; i++) g.step(DT, { mash: i % every === 0 ? 1 : 0 });
      return g.escapes === 1;
    };
    expect(tryAt('easy', 4)).toBe(true);
    expect(tryAt('hard', 4)).toBe(false);
    expect(tryAt('hard', 10)).toBe(true);
  });

  it('each new hit grips harder', () => {
    const g = quiet(make());
    ballOnPanda(g);
    g.step(DT, {});
    const first = g.struggle.decay;
    g.struggle = null;
    g.escapes = 3;
    g.invuln = 0;
    ballOnPanda(g);
    g.step(DT, {});
    expect(g.struggle.decay).toBeGreaterThan(first);
  });

  it('a shield (Eugénie\'s kiss) absorbs one hit', () => {
    const g = quiet(make());
    g.shield = 5;
    ballOnPanda(g);
    const ev = g.step(DT, {});
    expect(ev.shieldPop).toBe(true);
    expect(g.struggle).toBe(null);
    expect(g.shield).toBe(0);
  });
});

describe('w06 bonuses, breaks and decoys', () => {
  it('picks up Hoho stars, hearts and merguez', () => {
    const g = quiet(make());
    g.captures = 2;
    g.spawnItem('hoho', g.x, g.z);
    g.spawnItem('heart', g.x, g.z);
    g.spawnItem('merguez', g.x, g.z);
    g.step(DT, {});
    expect(g.hohos).toBe(1);
    expect(g.captures).toBe(1);
    expect(g.merguez).toBe(1);
    expect(g.items.length).toBe(0);
  });

  it('Mamar stops throwing during his sandwich break and drops bonuses', () => {
    const g = make();
    g.spitTimer = 1e9; g.decoyTimer = 1e9;
    g.time = MODES.normal.breakEvery - DT / 2;
    g.windup = null; g.rapidLeft = 0;
    const ev = g.step(DT, {});
    expect(ev.breakStart).toBe(true);
    expect(g.items.some((i) => i.kind === 'merguez')).toBe(true);
    expect(g.items.filter((i) => i.kind === 'hoho').length).toBeGreaterThanOrEqual(5);
    g.x = 100; // out of reach, so nothing is picked up and nothing hits
    let fired = 0;
    for (let t = 0; t < MODES.normal.breakLength - 0.1; t += DT) fired += g.step(DT, {}).fired;
    expect(fired).toBe(0);
  });

  it('Mamar aims at a guinea-pig decoy rather than Panda, and tall grass spoils his aim', () => {
    const g = quiet(make());
    g.decoys.push({ id: 7, x: 3, z: -2, vx: 0, vz: 0, life: 5, turn: 9, dead: false });
    expect(g.aimTarget()).toEqual({ x: 3, z: -2 });
    g.decoys.length = 0;
    g.x = GRASS[0].x; g.z = GRASS[0].z;
    expect(g.inGrass()).toBe(true);
    const aims = [g.aimTarget(), g.aimTarget(), g.aimTarget()];
    expect(aims.some((a) => a.x !== g.x || a.z !== g.z)).toBe(true);
  });

  it('a ball that meets a decoy catches it instead', () => {
    const g = quiet(make());
    g.x = 6; g.z = 6;
    g.decoys.push({ id: 7, x: 0, z: 0, vx: 0, vz: 0, life: 5, turn: 9, dead: false });
    const b = g.addBall('aimed', 0, 0);
    b.x = 0; b.z = 0;
    expect(g.step(DT, {}).decoyCaught).toBe(1);
    expect(g.decoys.length).toBe(0);
  });
});

describe('w06 end of run, score and stars', () => {
  it('wins when the clock runs out', () => {
    const g = quiet(make('easy'));
    g.x = 0; g.z = 0;
    g.time = MODES.easy.duration - DT / 2;
    const ev = g.step(DT, {});
    expect(ev.won).toBe(true);
    expect(g.over).toBe(true);
    expect(g.stars()).toBeGreaterThanOrEqual(1);
  });

  it('scores stars, survival, near misses, escapes and merguez', () => {
    expect(scoreFor({ hohos: 3, survived: 10.9, nearMisses: 2, escapes: 1, merguez: 1 })).toBe(30 + 20 + 10 + 10 + 25);
  });

  it('awards stars on captures and the share of Hoho stars', () => {
    expect(starsFor({ captures: 0, hohos: 10, hohoSpawned: 20 })).toBe(3);
    expect(starsFor({ captures: 1, hohos: 10, hohoSpawned: 20 })).toBe(2);
    expect(starsFor({ captures: 0, hohos: 4, hohoSpawned: 20 })).toBe(1);
    expect(starsFor({ captures: 2, hohos: 20, hohoSpawned: 20 })).toBe(1);
    expect(starsFor({ captures: 0, hohos: 0, hohoSpawned: 0 })).toBe(1);
  });

  it('a full idle run on hard ends with Panda captured or barely alive, never stuck', () => {
    const g = make('hard');
    let t = 0;
    while (!g.over && t < 200) { g.step(DT, {}); t += DT; }
    expect(g.over).toBe(true);
    expect(g.won).toBe(false); // standing still while never mashing loses on hard
  });
});
