import { describe, it, expect } from 'vitest';
import {
  createClimb, makeStep, landingFriend, windowFor, chaserSpeed, scoreFor, starsFor,
  MODES, LANDING_EVERY, LANDING_FRIENDS, LANDING_EFFECTS, MAX_GAP, STUN,
} from '../src/worlds/w09-silo/rules.js';
import { TEXTS } from '../src/worlds/w09-silo/index.js';

function seeded(seed = 12345) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
const make = (mode = 'normal', seed = 12345) => createClimb({ mode, random: seeded(seed) });
/** The side that climbs the next step without trouble (and grabs a pickup). */
const goodSide = (c) => c.next().side;
const badSide = (c) => (c.next().side === 'L' ? 'R' : 'L');
/** Presses the right side, then waits out nothing (no time passes). */
const climbOk = (c) => c.press(goodSide(c));

describe('w09 staircase', () => {
  it('generates the same stairs for the same seed', () => {
    const a = make('normal', 9);
    const b = make('normal', 9);
    for (let i = 0; i < 200; i++) expect(a.stepAt(i)).toEqual(b.stepAt(i));
  });

  it('starts with an easy alternating warm-up', () => {
    const c = make();
    expect([1, 2, 3, 4].map((i) => c.stepAt(i).side)).toEqual(['L', 'R', 'L', 'R']);
    expect([1, 2, 3, 4].every((i) => c.stepAt(i).type === 'single')).toBe(true);
  });

  it('puts a landing with a friend every 20 steps, cycling through the six friends', () => {
    expect(landingFriend(0)).toBe(null);
    expect(landingFriend(LANDING_EVERY)).toBe(LANDING_FRIENDS[0]);
    expect(landingFriend(LANDING_EVERY * 6)).toBe(LANDING_FRIENDS[5]);
    expect(landingFriend(LANDING_EVERY * 7)).toBe(LANDING_FRIENDS[0]);
    expect(landingFriend(21)).toBe(null);
    const c = make();
    expect(c.stepAt(40).type).toBe('landing');
    expect(new Set(LANDING_FRIENDS)).toEqual(new Set(['greg', 'cous', 'mamar', 'eugenie', 'violaine', 'aline']));
    for (const id of LANDING_FRIENDS) expect(LANDING_EFFECTS[id]).toBeDefined();
  });

  it('mixes singles, hazards (crates and spit) and bonuses (episodes and carrots)', () => {
    const c = make('hard');
    const kinds = new Set();
    const items = new Set();
    for (let i = 0; i < 400; i++) { kinds.add(c.stepAt(i).type); if (c.stepAt(i).item) items.add(c.stepAt(i).item); }
    expect([...kinds].sort()).toEqual(['bonus', 'hazard', 'landing', 'single']);
    expect([...items].sort()).toEqual(['carrot', 'crate', 'spit', 'tv']);
  });

  it('makes hazards more frequent on hard than on easy', () => {
    const count = (mode) => { const c = make(mode, 4); let n = 0; for (let i = 0; i < 1000; i++) if (c.stepAt(i).type === 'hazard') n++; return n; };
    expect(count('hard')).toBeGreaterThan(count('easy'));
  });

  it('builds a single step on the given previous side', () => {
    const st = makeStep(10, () => 0.99, 'normal', 'L');
    expect(st.type).toBe('single');
    expect(st.side).toBe('L');
  });
});

describe('w09 climbing', () => {
  it('climbs one step on the right side', () => {
    const c = make();
    const ev = climbOk(c);
    expect(ev.climbed).toBe(true);
    expect(c.pos).toBe(1);
    expect(c.best).toBe(1);
  });

  it('slips down on the wrong side and ignores presses while stunned', () => {
    const c = make();
    while (c.pos < 3 || c.next().type !== 'single') climbOk(c);
    const top = c.pos;
    const ev = c.press(badSide(c));
    expect(ev.slipped).toBe(MODES.normal.slip);
    expect(ev.hit).toBe(null);
    expect(c.pos).toBe(top - MODES.normal.slip);
    expect(c.best).toBe(top);
    expect(c.press('L').ignored).toBe(true);
    c.step(STUN + 0.01);
    expect(c.press(goodSide(c)).ignored).toBe(false);
  });

  it('never slips below the ground floor', () => {
    const c = make('hard');
    c.press(badSide(c));
    expect(c.pos).toBe(0);
  });

  it('hits a hazard on its bad side for a bigger slip', () => {
    const c = make('normal', 3);
    let guard = 0;
    while (c.next().type !== 'hazard' && guard++ < 500) climbOk(c);
    expect(c.next().type).toBe('hazard');
    const before = c.pos;
    const ev = c.press(badSide(c));
    expect(ev.hit).toBe(c.stepAt(before + 1).item);
    expect(c.pos).toBe(Math.max(0, before - MODES.normal.slip - 1));
    expect(c.hits).toBe(1);
  });

  it('collects episodes and carrots on the pickup side, only once', () => {
    const c = make('normal', 5);
    let guard = 0;
    while (c.next().type !== 'bonus' && guard++ < 500) climbOk(c);
    const item = c.next().item;
    const ev = climbOk(c);
    expect(ev.pickup).toBe(item);
    expect(c.episodes + c.carrots).toBe(1);
    // Back down one step (as after a slip) and climb it again: nothing new.
    c.pos -= 1;
    expect(climbOk(c).pickup).toBe(null);
    expect(c.episodes + c.carrots).toBe(1);
  });

  it('accepts either side on bonus steps and landings', () => {
    const c = make('normal', 5);
    let guard = 0;
    while (c.next().type !== 'bonus' && guard++ < 500) climbOk(c);
    const ev = c.press(badSide(c));
    expect(ev.climbed).toBe(true);
    expect(ev.pickup).toBe(null);
  });

  it('lets a friend on a landing push Croco back or give points, once', () => {
    const c = make();
    while (c.pos < LANDING_EVERY - 1) climbOk(c);
    const chaser = c.chaser;
    const ev = c.press('L');
    expect(ev.landing).toBe(LANDING_FRIENDS[0]);
    const fx = LANDING_EFFECTS[LANDING_FRIENDS[0]];
    expect(c.chaser).toBe(chaser - fx.push);
    expect(c.bonus).toBe(fx.points);
  });
});

describe('w09 timing, chaser and end', () => {
  it('slips when too slow', () => {
    const c = make();
    for (let i = 0; i < 4; i++) climbOk(c);
    let ev = {};
    let t = 0;
    while (!ev.tooSlow && t < 5) { ev = c.step(0.05); t += 0.05; }
    expect(ev.tooSlow).toBe(true);
    expect(c.pos).toBe(3);
  });

  it('gives easy a longer step window than hard, shrinking with height', () => {
    expect(windowFor(0, 'easy')).toBeGreaterThan(windowFor(0, 'hard'));
    expect(windowFor(100, 'normal')).toBeLessThan(windowFor(0, 'normal'));
    expect(windowFor(10000, 'normal')).toBe(MODES.normal.minWindow);
  });

  it('speeds Croco up over the run, faster on hard', () => {
    expect(chaserSpeed(60, 'normal')).toBeGreaterThan(chaserSpeed(0, 'normal'));
    expect(chaserSpeed(10, 'hard')).toBeGreaterThan(chaserSpeed(10, 'easy'));
  });

  it('is caught by Croco when standing still', () => {
    const c = make();
    let ev = {};
    for (let i = 0; i < 2000 && !c.over; i++) ev = c.step(0.05);
    expect(ev.caught).toBe(true);
    expect(c.over).toBe(true);
    expect(c.won).toBe(false);
    expect(c.press('L').ignored).toBe(true);
  });

  it('keeps Croco at most MAX_GAP steps behind', () => {
    const c = make('easy');
    for (let i = 0; i < 60; i++) climbOk(c);
    c.step(0.01);
    expect(c.gap()).toBeLessThanOrEqual(MAX_GAP);
  });

  it('wins when the clock runs out with a steady climber, in 45-120 s', () => {
    for (const mode of ['easy', 'normal', 'hard']) {
      const c = make(mode);
      let ev = {};
      // A good player: 4 clean steps per second.
      for (let i = 0; i < 100000 && !c.over; i++) {
        ev = c.step(0.25);
        if (!c.over) climbOk(c);
      }
      expect(ev.timeUp).toBe(true);
      expect(c.won).toBe(true);
      expect(c.duration).toBeGreaterThanOrEqual(45);
      expect(c.duration).toBeLessThanOrEqual(120);
      expect(c.stars()).toBe(3);
    }
  });

  it('loses on hard at a pace that survives easy', () => {
    const run = (mode) => {
      const c = make(mode);
      for (let i = 0; i < 100000 && !c.over; i++) { c.step(0.625); if (!c.over) climbOk(c); }
      return c;
    };
    expect(run('easy').won).toBe(true);
    expect(run('hard').won).toBe(false);
  });
});

describe('w09 score and stars', () => {
  it('scores height plus episodes, carrots and bonuses', () => {
    expect(scoreFor({ height: 10, episodes: 2, carrots: 1, bonus: 200 })).toBe(100 + 200 + 50 + 200);
    const c = make();
    climbOk(c);
    expect(c.score()).toBe(10);
  });

  it('awards stars on height, with higher bars on hard', () => {
    expect(starsFor(0, 'normal')).toBe(1);
    expect(starsFor(MODES.normal.stars[0], 'normal')).toBe(2);
    expect(starsFor(MODES.normal.stars[1], 'normal')).toBe(3);
    expect(starsFor(MODES.easy.stars[1], 'hard')).toBe(1);
    expect(MODES.hard.stars[0]).toBeGreaterThan(MODES.easy.stars[0]);
  });

  it('has the same text keys in EN and FR', () => {
    expect(Object.keys(TEXTS.fr).sort()).toEqual(Object.keys(TEXTS.en).sort());
    expect(TEXTS.fr.howto.length).toBe(TEXTS.en.howto.length);
  });
});
