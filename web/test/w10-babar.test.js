import { describe, it, expect } from 'vitest';
import {
  createPartyState, inCone, sightBlocked, isBehind, gradeTiming, comboMultiplier, gagPoints,
  starsFor, angleDiff, DIFFICULTY, WAYPOINTS, GRILL_WAYPOINT, OBSTACLES,
} from '../src/worlds/w10-babar/rules.js';

const DT = 1 / 60;
const fixed = (v = 0.5) => () => v;
const run = (s, secs, move = {}) => {
  const all = [];
  for (let i = 0; i < Math.round(secs / DT); i++) all.push(...s.step(DT, move));
  return all;
};
/** Puts Panda somewhere open (no cover around), facing angle, idle. */
function placePanda(s, x, z, angle) {
  Object.assign(s.panda, { x, z, angle, phase: 'chat', timer: 999, look: 'none', lookTimer: 999 });
  s.panda.wp = 1; // not the grill
}

describe('w10 geometry helpers', () => {
  it('wraps angle differences into -PI..PI', () => {
    expect(angleDiff(Math.PI * 2 + 0.1, 0)).toBeCloseTo(0.1);
    expect(angleDiff(-0.1, Math.PI * 2)).toBeCloseTo(-0.1);
  });

  it('detects points inside a view cone only within range and angle', () => {
    expect(inCone(0, 0, 0, 0, 5, 8, 0.7)).toBe(true); // straight ahead (+z)
    expect(inCone(0, 0, 0, 0, 9, 8, 0.7)).toBe(false); // too far
    expect(inCone(0, 0, 0, 5, 0, 8, 0.7)).toBe(false); // 90° to the side
    expect(inCone(0, 0, 0, 0, -3, 8, 0.7)).toBe(false); // behind
  });

  it('blocks line of sight through an obstacle circle', () => {
    const obs = [{ x: 0, z: 2, r: 0.5 }];
    expect(sightBlocked(0, 0, 0, 4, obs)).toBe(true);
    expect(sightBlocked(0, 0, 2, 4, obs)).toBe(false);
  });

  it('knows when Babar is right behind Panda', () => {
    expect(isBehind(0, 0, 0, 0, -1)).toBe(true);
    expect(isBehind(0, 0, 0, 0, 1)).toBe(false); // in front
    expect(isBehind(0, 0, 0, 0, -3)).toBe(false); // too far
  });
});

describe('w10 timing bar and scoring', () => {
  it('grades perfect, good and miss', () => {
    expect(gradeTiming(0.5, 0.5, 0.24, 0.07)).toBe('perfect');
    expect(gradeTiming(0.6, 0.5, 0.24, 0.07)).toBe('good');
    expect(gradeTiming(0.7, 0.5, 0.24, 0.07)).toBe('miss');
  });

  it('grows the combo multiplier up to x3', () => {
    expect(comboMultiplier(1)).toBe(1);
    expect(comboMultiplier(2)).toBe(1.5);
    expect(comboMultiplier(10)).toBe(3);
    expect(gagPoints('perfect', 1)).toBe(250);
    expect(gagPoints('good', 3)).toBe(200);
    expect(gagPoints('miss', 3)).toBe(0);
  });

  it('awards stars on gags landed, harder modes ask for more', () => {
    expect(starsFor(0, 'easy')).toBe(0);
    expect(starsFor(1, 'easy')).toBe(1);
    expect(starsFor(5, 'easy')).toBe(3);
    expect(starsFor(1, 'hard')).toBe(0);
    expect(starsFor(5, 'hard')).toBe(2);
    expect(starsFor(6, 'normal')).toBe(3);
  });

  it('makes hard mode stricter than easy', () => {
    const e = DIFFICULTY.easy;
    const h = DIFFICULTY.hard;
    expect(h.telegraph).toBeLessThan(e.telegraph);
    expect(h.spotDelay).toBeLessThan(e.spotDelay);
    expect(h.zone).toBeLessThan(e.zone);
    expect(h.range).toBeGreaterThan(e.range);
    expect(e.duration).toBeGreaterThanOrEqual(45);
    expect(e.duration).toBeLessThanOrEqual(120);
  });
});

describe('w10 party state', () => {
  it('starts the timing bar when Babar is right behind Panda, and lands a gag in the zone', () => {
    const s = createPartyState({ mode: 'normal', random: fixed(0.5) });
    placePanda(s, 0, 0, 0); // facing +z
    Object.assign(s.babar, { x: 0, z: -1 });
    const ev = s.step(DT, {});
    expect(ev).toContain('miniStart');
    expect(s.mini).not.toBeNull();
    s.mini.pos = s.mini.center; // perfect timing
    const ev2 = s.step(DT, { press: true });
    expect(ev2).toContain('gag');
    expect(s.gags).toBe(1);
    expect(s.perfects).toBe(1);
    expect(s.score).toBe(250);
    expect(s.panda.phase).toBe('startled');
  });

  it('counts a missed press as no gag and makes Panda turn round', () => {
    const s = createPartyState({ mode: 'normal', random: fixed(0.5) });
    placePanda(s, 0, 0, 0);
    Object.assign(s.babar, { x: 0, z: -1 });
    s.step(DT, {});
    s.mini.pos = s.mini.center > 0.5 ? 0 : 1;
    const ev = s.step(DT, { press: true });
    expect(ev).toContain('miss');
    expect(ev).toContain('turning');
    expect(s.gags).toBe(0);
    expect(s.strikes).toBe(0); // forgiving outside hard mode
  });

  it('a miss is a strike in hard mode', () => {
    const s = createPartyState({ mode: 'hard', random: fixed(0.5) });
    placePanda(s, 0, 0, 0);
    Object.assign(s.babar, { x: 0, z: -1 });
    s.step(DT, {});
    s.mini.pos = s.mini.center > 0.5 ? 0 : 1;
    s.step(DT, { press: true });
    expect(s.strikes).toBe(1);
  });

  it('lets the timing bar time out as a miss', () => {
    const s = createPartyState({ mode: 'easy', random: fixed(0.5) });
    placePanda(s, 0, 0, 0);
    Object.assign(s.babar, { x: 0, z: -1 });
    const ev = run(s, 3.5);
    expect(ev).toContain('miss');
  });

  it('builds combos across consecutive gags and resets on a spot', () => {
    const s = createPartyState({ mode: 'normal', random: fixed(0.5) });
    for (let i = 0; i < 3; i++) {
      placePanda(s, 0, 0, 0);
      s.gagCooldown = 0;
      Object.assign(s.babar, { x: 0, z: -1 });
      s.step(DT, {});
      s.mini.pos = s.mini.center;
      s.step(DT, { press: true });
    }
    expect(s.combo).toBe(3);
    expect(s.score).toBe(250 + 375 + 500);
    // Now get spotted: moving in front of a looking Panda.
    placePanda(s, 0, 0, 0);
    s.panda.look = 'looking';
    s.panda.lookT = 99;
    s.panda.lookAngle = 0;
    s.invuln = 0;
    Object.assign(s.babar, { x: 0, z: 4 });
    const ev = run(s, 1, { mx: 1, mz: 0 });
    expect(ev).toContain('spotted');
    expect(s.combo).toBe(0);
    expect(s.bestCombo).toBe(3);
  });

  it('never spots a frozen Babar at a distance, even in the cone', () => {
    const s = createPartyState({ mode: 'hard', random: fixed(0.5) });
    placePanda(s, 0, 0, 0);
    s.panda.look = 'looking';
    s.panda.lookT = 99;
    s.panda.lookAngle = 0;
    Object.assign(s.babar, { x: 0, z: 5 });
    const ev = run(s, 2, {});
    expect(ev).not.toContain('spotted');
    expect(s.babar.visible).toBe(true);
  });

  it('hides Babar behind cover even when he moves', () => {
    const s = createPartyState({ mode: 'hard', random: fixed(0.5) });
    // Panda looks from the middle of the terrace towards the planter.
    const planter = OBSTACLES.find((o) => o.id === 'planter');
    placePanda(s, planter.x, planter.z + 4, Math.PI);
    s.panda.look = 'looking';
    s.panda.lookT = 99;
    s.panda.lookAngle = Math.PI;
    Object.assign(s.babar, { x: planter.x, z: planter.z - 1.3 });
    // Sweep is centred; check sight at the centre angle.
    s.step(DT, {});
    s.panda.angle = Math.PI;
    expect(s.sees()).toBe(false);
  });

  it('three strikes end the run', () => {
    const s = createPartyState({ mode: 'easy', random: fixed(0.5) });
    let ev = [];
    for (let i = 0; i < 3; i++) {
      placePanda(s, 0, 0, 0);
      s.panda.look = 'looking';
      s.panda.lookT = 99;
      s.panda.lookAngle = 0;
      s.invuln = 0;
      Object.assign(s.babar, { x: 0, z: 5 });
      ev = run(s, 2, { mx: 0, mz: -0.3 }); // creeping in plain sight
    }
    expect(s.strikes).toBe(3);
    expect(s.over).toBe(true);
    expect(s.won).toBe(false);
    expect(ev).toContain('lost');
    expect(s.stars()).toBe(0);
  });

  it('telegraphs the look: a turning phase before the cone goes live', () => {
    const s = createPartyState({ mode: 'normal', random: fixed(0.5) });
    placePanda(s, 0, 0, 0);
    s.panda.lookTimer = 0.01;
    const ev = run(s, 0.1);
    expect(ev).toContain('turning');
    expect(s.panda.look).toBe('turning');
    expect(s.cone().active).toBe(false);
    const ev2 = run(s, DIFFICULTY.normal.telegraph + 0.1);
    expect(ev2).toContain('looking');
    expect(s.cone().active).toBe(true);
  });

  it('Panda looks around less while he eats merguez at the grill', () => {
    const grill = WAYPOINTS[GRILL_WAYPOINT];
    const a = createPartyState({ mode: 'normal', random: fixed(0.5) });
    const b = createPartyState({ mode: 'normal', random: fixed(0.5) });
    for (const s of [a, b]) {
      Object.assign(s.panda, { x: grill.x, z: grill.z, phase: 'chat', timer: 999, look: 'none', lookTimer: 3 });
    }
    a.panda.wp = GRILL_WAYPOINT;
    b.panda.wp = 1;
    run(a, 2);
    run(b, 2);
    expect(a.panda.eating).toBe(true);
    expect(a.panda.lookTimer).toBeGreaterThan(b.panda.lookTimer);
  });

  it('announces the merguez when Panda reaches the grill', () => {
    const s = createPartyState({ mode: 'easy', random: fixed(0.5) });
    const grill = WAYPOINTS[GRILL_WAYPOINT];
    Object.assign(s.panda, { x: grill.x + 1, z: grill.z, phase: 'walk', wp: GRILL_WAYPOINT, look: 'none', lookTimer: 999 });
    const ev = run(s, 2);
    expect(ev).toContain('merguez');
  });

  it('a snitch makes Panda turn when Babar bumps into her', () => {
    const s = createPartyState({ mode: 'normal', random: fixed(0.5) });
    placePanda(s, 0, 0, 0);
    const aline = OBSTACLES.find((o) => o.id === 'aline');
    Object.assign(s.babar, { x: aline.x - 1, z: aline.z });
    const ev = run(s, 0.5, { mx: 1, mz: 0 });
    expect(ev).toContain('snitch');
    expect(s.snitchId).toBe('aline');
    expect(s.panda.look).not.toBe('none');
  });

  it('wins at the bell with enough gags, fails with too few', () => {
    const win = createPartyState({ mode: 'normal', random: fixed(0.5) });
    win.gags = 4;
    win.time = DIFFICULTY.normal.duration - 0.01;
    Object.assign(win.babar, { x: 10, z: 7 });
    const ev = run(win, 0.1);
    expect(ev).toContain('won');
    expect(win.stars()).toBe(2);

    const lose = createPartyState({ mode: 'normal', random: fixed(0.5) });
    lose.time = DIFFICULTY.normal.duration - 0.01;
    Object.assign(lose.babar, { x: 10, z: 7 });
    expect(run(lose, 0.1)).toContain('timeout');
    expect(lose.won).toBe(false);
  });

  it('keeps Babar inside the terrace and out of props', () => {
    const s = createPartyState({ mode: 'normal', random: fixed(0.5) });
    run(s, 5, { mx: 0, mz: 1 });
    expect(s.babar.z).toBeLessThanOrEqual(8);
    const bbq = OBSTACLES.find((o) => o.id === 'bbq');
    Object.assign(s.babar, { x: bbq.x + 0.1, z: bbq.z });
    s.step(DT, { mx: -1, mz: 0 });
    expect(Math.hypot(s.babar.x - bbq.x, s.babar.z - bbq.z)).toBeGreaterThanOrEqual(bbq.r);
  });
});
