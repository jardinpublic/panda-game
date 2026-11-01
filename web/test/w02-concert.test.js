import { describe, it, expect } from 'vitest';
import { createConcert, generateChart, generateLooks, modeConfig, LEAD_IN, USELESS_MUTE } from '../src/worlds/w02-concert/rules.js';

/** Deterministic 0..1 generator (same LCG as the game). */
function seeded(seed = 12345) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

/** Moves the clock to time t in small steps, collecting events. */
function runTo(s, t, step = 1 / 60) {
  const all = [];
  while (s.t < t - 1e-9 && !s.over) all.push(...s.advance(Math.min(step, t - s.t)).map((e) => ({ ...e })));
  return all;
}

/** Moves the clock to exactly t (in small steps) so a hit lands on time. */
function at(s, t) { runTo(s, t); s.t = t; }

/** A boss look that has no note in its window, and an empty stretch before it. */
const firstLook = (s) => s.looks[0];

describe('w02 chart', () => {
  it('is deterministic for a seed and one note at a time', () => {
    const cfg = modeConfig('normal');
    const a = generateChart(cfg, seeded(7));
    const b = generateChart(cfg, seeded(7));
    expect(a.map((n) => [n.t, n.lane])).toEqual(b.map((n) => [n.t, n.lane]));
    for (let i = 1; i < a.length; i++) expect(a[i].t).toBeGreaterThan(a[i - 1].t + 0.15);
    for (const n of a) expect([0, 1, 2]).toContain(n.lane);
    expect(a[0].t).toBe(LEAD_IN);
    expect(a[a.length - 1].t).toBeLessThanOrEqual(cfg.duration - 2);
  });

  it('lasts 70-90 s and gets denser and faster with the mode', () => {
    const counts = {};
    for (const mode of ['easy', 'normal', 'hard']) {
      const cfg = modeConfig(mode);
      expect(cfg.duration).toBeGreaterThanOrEqual(70);
      expect(cfg.duration).toBeLessThanOrEqual(90);
      counts[mode] = generateChart(cfg, seeded(3)).length;
    }
    expect(counts.easy).toBeLessThan(counts.normal);
    expect(counts.normal).toBeLessThan(counts.hard);
    expect(modeConfig('easy').bpm).toBeLessThan(modeConfig('hard').bpm);
    expect(modeConfig('easy').good).toBeGreaterThan(modeConfig('hard').good);
  });

  it('schedules more, shorter boss warnings on hard, all inside the song', () => {
    const easy = generateLooks(modeConfig('easy'), seeded(9));
    const hard = generateLooks(modeConfig('hard'), seeded(9));
    expect(easy.length).toBeGreaterThanOrEqual(3);
    expect(hard.length).toBeGreaterThan(easy.length);
    for (const looks of [easy, hard]) {
      for (let i = 0; i < looks.length; i++) {
        expect(looks[i].lookAt).toBeGreaterThan(looks[i].warnAt);
        expect(looks[i].endAt).toBeLessThan(modeConfig('hard').duration);
        if (i) expect(looks[i].warnAt).toBeGreaterThan(looks[i - 1].endAt);
      }
    }
  });
});

describe('w02 hits and combo', () => {
  it('judges perfect, good and stray presses', () => {
    const s = createConcert({ mode: 'normal', rand: seeded(1) });
    const n = s.notes[0];
    at(s, n.t + 0.01);
    expect(s.hit(n.lane).type).toBe('perfect');
    expect(s.score).toBe(100);
    const m = s.notes[1];
    at(s, m.t - 0.1);
    expect(s.hit(m.lane).type).toBe('good');
    expect(s.combo).toBe(2);
    // Nothing under the line any more: a stray breaks the combo on normal.
    expect(s.hit((m.lane + 1) % 3).type).toBe('stray');
    expect(s.combo).toBe(0);
  });

  it('forgives strays on easy', () => {
    const s = createConcert({ mode: 'easy', rand: seeded(1) });
    at(s, s.notes[0].t);
    s.hit(s.notes[0].lane);
    s.hit((s.notes[0].lane + 1) % 3);
    expect(s.combo).toBe(1);
  });

  it('counts a miss when a note slides past and resets the combo', () => {
    const s = createConcert({ mode: 'normal', rand: seeded(2) });
    at(s, s.notes[0].t);
    s.hit(s.notes[0].lane);
    const events = runTo(s, s.notes[1].t + 0.5);
    expect(events.some((e) => e.type === 'miss')).toBe(true);
    expect(s.miss).toBeGreaterThan(0);
    expect(s.combo).toBe(0);
  });

  it('raises the multiplier every 8 combo, up to x4', () => {
    const s = createConcert({ rand: seeded(4) });
    s.combo = 0; expect(s.multiplier()).toBe(1);
    s.combo = 8; expect(s.multiplier()).toBe(2);
    s.combo = 16; expect(s.multiplier()).toBe(3);
    s.combo = 99; expect(s.multiplier()).toBe(4);
  });
});

describe('w02 boss and mute', () => {
  it('catches Panda when the boss looks and the mic is open', () => {
    const s = createConcert({ mode: 'normal', rand: seeded(5) });
    const l = firstLook(s);
    const events = runTo(s, l.lookAt + 0.05);
    expect(events.some((e) => e.type === 'warn')).toBe(true);
    expect(events.some((e) => e.type === 'caught')).toBe(true);
    expect(s.hearts).toBe(modeConfig('normal').hearts - 1);
    expect(s.caught).toBe(1);
  });

  it('saves Panda when he mutes during the warning, clutch when late', () => {
    const s = createConcert({ mode: 'normal', rand: seeded(5) });
    const l = firstLook(s);
    runTo(s, l.warnAt + 0.1);
    expect(s.phase()).toBe('warn');
    const r = s.mute();
    expect(r.type).toBe('saved');
    expect(s.muted()).toBe(true);
    const events = runTo(s, l.lookAt + 0.05);
    expect(events.some((e) => e.type === 'safe')).toBe(true);
    expect(s.hearts).toBe(modeConfig('normal').hearts);

    const c = createConcert({ mode: 'normal', rand: seeded(5) });
    runTo(c, c.looks[0].lookAt - 0.2);
    expect(c.mute().type).toBe('clutch');
    expect(c.score).toBeGreaterThan(s.score - 1);
  });

  it('silences notes while muted: no points, no miss', () => {
    const s = createConcert({ mode: 'normal', rand: seeded(5) });
    const l = firstLook(s);
    runTo(s, l.warnAt + 0.05);
    s.mute();
    const inside = s.notes.filter((n) => n.t > s.t && n.t <= l.endAt);
    expect(inside.every((n) => n.judged === 'ghost')).toBe(true);
    expect(s.hit(0).type).toBe('muted');
    const missesBefore = s.miss;
    runTo(s, l.endAt);
    expect(s.miss).toBe(missesBefore);
  });

  it('costs the combo to mute for nothing', () => {
    const s = createConcert({ mode: 'normal', rand: seeded(5) });
    at(s, s.notes[0].t);
    s.hit(s.notes[0].lane);
    expect(s.phase()).toBe('calm');
    expect(s.mute().type).toBe('useless');
    expect(s.combo).toBe(0);
    expect(s.uselessMutes).toBe(1);
    expect(s.mutedUntil).toBeCloseTo(s.t + USELESS_MUTE);
  });

  it('is too late to mute once he is looking', () => {
    const s = createConcert({ mode: 'normal', rand: seeded(5) });
    runTo(s, firstLook(s).lookAt + 0.1);
    expect(s.mute().type).toBe('late');
  });
});

describe('w02 end of run', () => {
  it('fails when all hearts are lost', () => {
    const s = createConcert({ mode: 'hard', rand: seeded(8) });
    const events = runTo(s, 200);
    expect(s.over).toBe(true);
    expect(events.some((e) => e.type === 'fail')).toBe(true);
    expect(s.won()).toBe(false);
    expect(s.stars()).toBe(0);
  });

  it('finishes the song with stars on accuracy, using a perfect bot', () => {
    for (const mode of ['easy', 'normal', 'hard']) {
      const s = createConcert({ mode, rand: seeded(11) });
      let i = 0;
      const dt = 1 / 120;
      while (!s.over) {
        s.advance(dt);
        const l = s.activeLook();
        if (l && s.t < l.lookAt && !l.muted && l.lookAt - s.t < 0.3) s.mute();
        while (i < s.notes.length && s.notes[i].t <= s.t) {
          if (!s.notes[i].judged) s.hit(s.notes[i].lane);
          i++;
        }
      }
      expect(s.won()).toBe(true);
      expect(s.t).toBeGreaterThanOrEqual(modeConfig(mode).duration);
      expect(s.caught).toBe(0);
      expect(s.accuracy()).toBeGreaterThan(0.85);
      expect(s.stars()).toBe(3);
      expect(s.clutches).toBe(s.looks.length);
    }
  });

  it('awards 1 to 3 stars by accuracy', () => {
    const s = createConcert({ rand: seeded(1) });
    s.over = true;
    s.perfect = 50; s.miss = 50;
    expect(s.stars()).toBe(1);
    s.perfect = 70; s.miss = 30;
    expect(s.stars()).toBe(2);
    s.perfect = 90; s.miss = 10;
    expect(s.stars()).toBe(3);
    s.caught = 1;
    expect(s.stars()).toBe(2);
  });
});
