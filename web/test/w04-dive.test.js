import { describe, it, expect } from 'vitest';
import {
  LAGOON, LEGAL_CM, MODES, POINTS, createDive, langoustineSize, gaugeReading, steerToward, clampToLagoon, touches, rampInterval,
} from '../src/worlds/w04-dive/rules.js';

/** Same seeded generator as the shell's ctx.random(). */
function seeded(seed = 12345) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}
const DEEP = LAGOON.floorY + 3;
const SURFACE = LAGOON.surfaceY;

describe('w04 dive: difficulty', () => {
  it('is more forgiving on easy and harder on hard', () => {
    const [e, n, h] = [MODES.easy, MODES.normal, MODES.hard];
    expect(e.hearts).toBeGreaterThan(n.hearts);
    expect(n.hearts).toBeGreaterThan(h.hearts);
    expect(e.drain).toBeLessThan(h.drain);
    expect(e.decide).toBeGreaterThan(h.decide);
    expect(e.sharkEvery).toBeGreaterThan(h.sharkEvery);
    expect(e.chargeSpeed).toBeLessThan(h.chargeSpeed);
    expect(e.nearMiss).toBeGreaterThan(h.nearMiss);
    for (const m of [e, n, h]) {
      expect(m.duration).toBeGreaterThanOrEqual(45);
      expect(m.duration).toBeLessThanOrEqual(120);
    }
  });

  it('falls back to normal for an unknown mode', () => {
    expect(createDive('weird').cfg).toBe(MODES.normal);
  });
});

describe('w04 dive: oxygen and hearts', () => {
  it('drains oxygen underwater and refills it at the surface', () => {
    const s = createDive('normal');
    for (let i = 0; i < 100; i++) s.step(0.1, DEEP);
    expect(s.oxygen).toBeCloseTo(1 - 10 * MODES.normal.drain, 5);
    for (let i = 0; i < 30; i++) s.step(0.1, SURFACE);
    expect(s.oxygen).toBe(1);
  });

  it('costs a heart when the air runs out, then gives a breath back', () => {
    const s = createDive('hard');
    let empty = false;
    for (let i = 0; i < 400 && !empty; i++) empty = s.step(0.1, DEEP).o2Empty;
    expect(empty).toBe(true);
    expect(s.hearts).toBe(MODES.hard.hearts - 1);
    expect(s.oxygen).toBeCloseTo(0.45, 5);
  });

  it('ignores bites while invulnerable, and ends the dive at zero hearts', () => {
    const s = createDive('hard');
    expect(s.hurt()).toBe(true);
    expect(s.hurt()).toBe(false);
    s.step(MODES.hard.invuln + 0.01, SURFACE);
    expect(s.hurt()).toBe(true);
    s.invuln = 0;
    s.hurt();
    expect(s.hearts).toBe(0);
    expect(s.over).toBe(true);
    expect(s.won).toBe(false);
    expect(s.stars()).toBe(0);
  });
});

describe('w04 dive: scoring', () => {
  it('multiplies points with the combo and resets it on a miss', () => {
    const s = createDive('normal');
    expect(s.hit('fish')).toBe(Math.round(POINTS.fish * 1.25));
    expect(s.hit('fish')).toBe(POINTS.fish * 1.5);
    s.miss();
    expect(s.combo).toBe(0);
    expect(s.hit('shark')).toBe(Math.round(POINTS.shark * 1.25));
    expect(s.bestCombo).toBe(2);
  });

  it('caps the multiplier at x3', () => {
    const s = createDive('normal');
    for (let i = 0; i < 20; i++) s.hit('fish');
    expect(s.multiplier()).toBe(3);
  });

  it('judges langoustine decisions, with the coastguard fine for undersized ones', () => {
    const s = createDive('normal');
    s.score = 200;
    expect(s.decide(LEGAL_CM + 2, true)).toEqual({ verdict: 'legal', points: POINTS.keepLegal });
    expect(s.decide(LEGAL_CM - 1, true)).toEqual({ verdict: 'fine', points: POINTS.fine });
    expect(s.decide(LEGAL_CM - 1, false)).toEqual({ verdict: 'released', points: POINTS.releaseSmall });
    expect(s.decide(LEGAL_CM + 1, false).verdict).toBe('wasted');
    expect(s.decide(LEGAL_CM - 1, null).verdict).toBe('escaped');
    expect(s.fines).toBe(1);
    expect(s.score).toBe(200 + POINTS.keepLegal + POINTS.fine + POINTS.releaseSmall);
  });

  it('never lets fines push the score below zero', () => {
    const s = createDive('normal');
    s.decide(LEGAL_CM - 3, true);
    expect(s.score).toBe(0);
  });

  it('rewards the GoPro rescue', () => {
    const s = createDive('easy');
    expect(s.saveGopro()).toBe(POINTS.gopro);
    s.loseGopro();
    expect(s.goprosSaved).toBe(1);
    expect(s.goprosLost).toBe(1);
  });
});

describe('w04 dive: end and stars', () => {
  it('wins at the end of the timer with a bonus per heart left', () => {
    const s = createDive('easy');
    let finished = false;
    for (let i = 0; i < 2000 && !finished; i++) finished = s.step(0.05, SURFACE).finished;
    expect(finished).toBe(true);
    expect(s.won).toBe(true);
    expect(s.score).toBe(MODES.easy.hearts * POINTS.heartLeft);
    expect(s.step(1, SURFACE).finished).toBe(false);
  });

  it('awards 1 to 3 stars on the mode targets', () => {
    const s = createDive('normal');
    s.won = true;
    s.score = MODES.normal.stars[0] - 1;
    expect(s.stars()).toBe(1);
    s.score = MODES.normal.stars[0];
    expect(s.stars()).toBe(2);
    s.score = MODES.normal.stars[1];
    expect(s.stars()).toBe(3);
  });
});

describe('w04 dive: langoustines', () => {
  it('mostly rolls undersized ones, close to the line on hard', () => {
    for (const mode of ['easy', 'normal', 'hard']) {
      const cfg = MODES[mode];
      const random = seeded(99);
      let small = 0;
      for (let i = 0; i < 400; i++) {
        const size = langoustineSize(random, cfg);
        if (size < LEGAL_CM) {
          small++;
          expect(size).toBeGreaterThanOrEqual(LEGAL_CM - cfg.nearMiss - 0.05);
        } else expect(size).toBeLessThanOrEqual(LEGAL_CM + 6.5);
      }
      expect(small / 400).toBeGreaterThan(0.55);
    }
  });

  it('shows a wobbling needle that settles on the true size', () => {
    expect(gaugeReading(18, 0.1, 2)).not.toBeCloseTo(18, 1);
    expect(gaugeReading(18, 5, 2)).toBeCloseTo(18, 2);
    expect(gaugeReading(18, 0.3, 0)).toBe(18);
  });
});

describe('w04 dive: movement helpers', () => {
  it('steers toward a target without overshooting', () => {
    const [x, y] = steerToward(0, 0, 10, 0, 5, 0.5);
    expect(x).toBeCloseTo(2.5);
    expect(y).toBe(0);
    expect(steerToward(0, 0, 0.1, 0, 5, 1)).toEqual([0.1, 0]);
  });

  it('keeps the swimmer inside the lagoon', () => {
    const [x, y] = clampToLagoon(100, -100, 1);
    expect(x).toBe(LAGOON.maxX);
    expect(y).toBe(LAGOON.floorY + 1);
    expect(clampToLagoon(0, 5)[1]).toBeCloseTo(LAGOON.surfaceY + 0.2);
  });

  it('detects touching circles', () => {
    expect(touches(0, 0, 1, 1.5, 0, 1)).toBe(true);
    expect(touches(0, 0, 1, 2.5, 0, 1)).toBe(false);
  });

  it('spawns faster as the dive goes on', () => {
    expect(rampInterval(10, 0)).toBe(10);
    expect(rampInterval(10, 1)).toBeCloseTo(6.5);
    expect(rampInterval(10, 3)).toBeCloseTo(6.5);
  });
});
