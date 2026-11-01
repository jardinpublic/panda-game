import { describe, it, expect } from 'vitest';
import { DIRS, MODES, POINTS, buildChart, judge, findNote, bouncerWatching, createClub } from '../src/worlds/w05-moliere/rules.js';

/** Same seeded generator as the shell's ctx.random(). */
function seeded(seed = 12345) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

describe('w05 Molière: the chart', () => {
  it('is sorted, deterministic and fits in the night', () => {
    for (const mode of ['easy', 'normal', 'hard']) {
      const cfg = MODES[mode];
      const a = buildChart(seeded(7), cfg);
      const b = buildChart(seeded(7), cfg);
      expect(a).toEqual(b);
      expect(a[0].t).toBeGreaterThanOrEqual((60 / cfg.bpm) * 4);
      expect(a[a.length - 1].t).toBeLessThan(cfg.duration);
      for (let i = 1; i < a.length; i++) expect(a[i].t).toBeGreaterThan(a[i - 1].t);
    }
  });

  it('ramps up the density over the night', () => {
    const cfg = MODES.normal;
    const chart = buildChart(seeded(3), cfg);
    const early = chart.filter((n) => n.t < cfg.duration * 0.2).length / (cfg.duration * 0.2);
    const late = chart.filter((n) => n.t > cfg.duration * 0.6).length / (cfg.duration * 0.4 - 1.5);
    expect(late).toBeGreaterThan(early * 1.5);
  });

  it('has more notes on hard than on easy', () => {
    expect(buildChart(seeded(1), MODES.hard).length).toBeGreaterThan(buildChart(seeded(1), MODES.easy).length);
  });

  it('mixes the four arrows with flirt and rum rings, never three same arrows in a row', () => {
    const chart = buildChart(seeded(11), MODES.normal);
    const arrows = chart.filter((n) => n.kind === 'arrow');
    for (const d of DIRS) expect(arrows.some((n) => n.dir === d)).toBe(true);
    expect(chart.some((n) => n.kind === 'flirt' && n.dir === 'action')).toBe(true);
    expect(chart.some((n) => n.kind === 'rum' && n.dir === 'action')).toBe(true);
    for (let i = 2; i < arrows.length; i++) {
      expect(arrows[i].dir === arrows[i - 1].dir && arrows[i].dir === arrows[i - 2].dir).toBe(false);
    }
  });
});

describe('w05 Molière: timing', () => {
  it('judges perfect, good or nothing, wider on easy', () => {
    expect(judge(0.02, MODES.normal)).toBe('perfect');
    expect(judge(-0.12, MODES.normal)).toBe('good');
    expect(judge(0.3, MODES.normal)).toBe(null);
    expect(judge(0.09, MODES.easy)).toBe('perfect');
    expect(judge(0.09, MODES.hard)).toBe('good');
    expect(MODES.easy.good).toBeGreaterThan(MODES.hard.good);
  });

  it('finds the earliest matching note in the window', () => {
    const cfg = MODES.normal;
    const notes = [
      { t: 1, dir: 'left', kind: 'arrow' },
      { t: 1.05, dir: 'up', kind: 'arrow' },
      { t: 1.1, dir: 'left', kind: 'arrow' },
      { t: 3, dir: 'action', kind: 'rum' },
    ];
    expect(findNote(notes, 'left', 1.02, cfg)).toBe(0);
    notes[0].done = true;
    expect(findNote(notes, 'left', 1.02, cfg)).toBe(2);
    expect(findNote(notes, 'down', 1.02, cfg)).toBe(-1);
    expect(findNote(notes, 'action', 1.02, cfg)).toBe(-1);
    expect(findNote(notes, 'action', 2.95, cfg)).toBe(3);
  });

  it('has the bouncer watching for his share of each patrol', () => {
    for (const mode of ['easy', 'normal', 'hard']) {
      const cfg = MODES[mode];
      let watching = 0;
      const steps = 10000;
      for (let i = 0; i < steps; i++) if (bouncerWatching((i / steps) * cfg.patrol * 3, cfg)) watching++;
      expect(watching / steps).toBeCloseTo(cfg.watchShare, 1);
    }
    expect(MODES.easy.watchShare).toBeLessThan(MODES.hard.watchShare);
  });
});

describe('w05 Molière: the night', () => {
  it('builds combo, multiplier and vibe on hits; a miss breaks them', () => {
    const s = createClub('normal');
    expect(s.hit('perfect')).toBe(POINTS.perfect);
    for (let i = 0; i < 9; i++) s.hit('good');
    expect(s.multiplier()).toBe(2);
    for (let i = 0; i < 40; i++) s.hit('good');
    expect(s.multiplier()).toBe(4);
    expect(s.vibeFull()).toBe(true);
    s.miss();
    expect(s.combo).toBe(0);
    expect(s.vibe).toBeLessThan(1);
    expect(s.bestCombo).toBe(50);
  });

  it('breaks the combo on stray presses except on easy', () => {
    const easy = createClub('easy');
    easy.hit('good'); easy.stray(false);
    expect(easy.combo).toBe(1);
    const hard = createClub('hard');
    hard.hit('good'); hard.stray(false);
    expect(hard.combo).toBe(0);
  });

  it('makes Panda wilder when the bouncer is watching', () => {
    const a = createClub('normal');
    const b = createClub('normal');
    a.stray(false);
    b.stray(true);
    expect(b.wild).toBeCloseTo(a.wild * MODES.normal.watchFactor, 5);
  });

  it('only serves the €200 bottle with a full vibe', () => {
    const s = createClub('normal');
    expect(s.bottle(false)).toBe(0);
    s.vibe = 1;
    expect(s.bottle(false)).toBe(POINTS.bottle);
    expect(s.bottles).toBe(1);
    expect(s.vibe).toBeLessThan(1);
    expect(s.wild).toBeCloseTo(0.3, 5);
  });

  it('gets Panda thrown out when he is too wild', () => {
    const s = createClub('normal');
    s.vibe = 1; s.bottle(true);
    s.vibe = 1; s.bottle(true);
    expect(s.over).toBe(true);
    expect(s.reason).toBe('bouncer');
    expect(s.stars()).toBe(0);
  });

  it('puts Panda to sleep on the sofa after too much rum', () => {
    const s = createClub('normal');
    for (let i = 0; i < 20 && !s.over; i++) s.rum();
    expect(s.reason).toBe('asleep');
    expect(s.won).toBe(false);
  });

  it('scores flirts for the confidence (they always fail)', () => {
    const s = createClub('easy');
    expect(s.flirt(false)).toBe(POINTS.flirt);
    expect(s.flirts).toBe(1);
  });

  it('cools the wild meter down and tires Panda with time', () => {
    const s = createClub('normal');
    s.wild = 0.5;
    for (let i = 0; i < 100; i++) s.step(0.1);
    expect(s.wild).toBeLessThan(0.5);
    expect(s.tired).toBeCloseTo(MODES.normal.tiredRate * 10, 3);
  });

  it('wins at closing time with stars on accuracy (3 needs a bottle)', () => {
    const s = createClub('easy');
    for (let i = 0; i < 90; i++) s.hit('perfect');
    s.miss();
    let ended = false;
    for (let i = 0; i < 2000 && !ended; i++) { ended = s.step(0.05).ended; s.tired = 0; }
    expect(s.won).toBe(true);
    expect(s.reason).toBe('closing');
    expect(s.stars()).toBe(2);
    s.bottles = 1;
    expect(s.stars()).toBe(3);
    s.perfects = 1; s.misses = 10;
    expect(s.stars()).toBe(1);
  });

  it('lasts 45 to 120 seconds in every mode, harder on hard', () => {
    for (const cfg of Object.values(MODES)) {
      expect(cfg.duration).toBeGreaterThanOrEqual(45);
      expect(cfg.duration).toBeLessThanOrEqual(120);
    }
    expect(MODES.easy.bpm).toBeLessThan(MODES.hard.bpm);
    expect(MODES.easy.lead).toBeGreaterThan(MODES.hard.lead);
  });
});

describe('w05 Molière: the full vibe', () => {
  it('holds a full vibe until the bottle is ordered, while Panda goes wild', () => {
    const s = createClub('normal');
    s.vibe = 1;
    for (let i = 0; i < 50; i++) s.step(0.1);
    expect(s.vibeFull()).toBe(true);
    expect(s.wild).toBeCloseTo(0.1, 5);
    expect(s.bottle(false)).toBeGreaterThan(0);
  });
});
