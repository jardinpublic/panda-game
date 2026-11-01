import { describe, it, expect } from 'vitest';
import {
  createCrocoState, starsFor, scoreFor, telegraphFor, crocoXAt, DIFFICULTY, BANK,
  INTRO_TIME, STRIKE_WINDOW, MIN_TELEGRAPH, SWAY_FREQ,
} from '../src/worlds/w11-croco/rules.js';

const DT = 1 / 60;
/** Deterministic pseudo-random generator (same as the game's). */
function seeded(seed = 12345) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
const run = (s, secs, inp = {}) => {
  const all = [];
  for (let i = 0; i < Math.round(secs / DT); i++) all.push(...s.step(DT, inp));
  return all;
};
/** Advances until the given phase is reached (or a timeout). */
function until(s, phase, inp = {}, max = 60) {
  for (let i = 0; i < max / DT && s.phase !== phase && !s.over; i++) s.step(DT, inp);
  return s.phase === phase;
}

/** A good player: dodges, aims at the mouth, answers the prompts. */
function botInput(s) {
  const inp = { move: 0, jump: false, throw: false, swipe: null };
  if (s.phase === 'dodge' && s.attack) {
    const a = s.attack;
    if (a.kind === 'tail') inp.jump = a.t >= a.tele - 0.12;
    else {
      const away = a.x > 0 ? -1 : 1;
      if (Math.abs(s.px - a.x) < DIFFICULTY[s.mode].lungeHalf + 0.4) inp.move = away;
    }
  } else if (s.phase === 'feed') {
    // Lead the target a little: where the mouth will be when the veggie lands.
    const target = crocoXAt(s.feedClock + 0.6, s.cfg.sway);
    inp.move = Math.max(-1, Math.min(1, (target - s.px) * 3));
    inp.throw = Math.abs(target - s.px) < s.cfg.aimTol * 0.5;
  } else if (s.phase === 'wrestle' && s.prompt && s.prompt.t > 0.3) {
    inp.swipe = s.prompt.dir;
  }
  return inp;
}
function playBot(mode, seed = 7) {
  const s = createCrocoState({ mode, random: seeded(seed) });
  for (let i = 0; i < 300 / DT && !s.over; i++) s.step(DT, botInput(s));
  return s;
}

describe('w11 helpers', () => {
  it('awards stars on hearts left and time', () => {
    const base = { won: true, maxHearts: 4, par: 115 };
    expect(starsFor({ ...base, won: false, hearts: 4, time: 50 })).toBe(0);
    expect(starsFor({ ...base, hearts: 4, time: 100 })).toBe(3);
    expect(starsFor({ ...base, hearts: 3, time: 110 })).toBe(3);
    expect(starsFor({ ...base, hearts: 3, time: 150 })).toBe(2);
    expect(starsFor({ ...base, hearts: 1, time: 100 })).toBe(2);
    expect(starsFor({ ...base, hearts: 1, time: 150 })).toBe(1);
  });

  it('scores a win far above a loss', () => {
    const stats = { hearts: 2, time: 100, par: 115, dodges: 10, fed: 8, pins: 12 };
    expect(scoreFor({ ...stats, won: true })).toBeGreaterThan(scoreFor({ ...stats, won: false }));
    expect(scoreFor({ ...stats, won: false })).toBe(10 * 25 + 8 * 40 + 12 * 60);
  });

  it('shortens telegraphs each cycle but never below the minimum', () => {
    const cfg = DIFFICULTY.hard;
    expect(telegraphFor(cfg, 1)).toBeLessThan(telegraphFor(cfg, 0));
    expect(telegraphFor(cfg, 50)).toBe(MIN_TELEGRAPH);
  });

  it('makes hard mode tougher than easy', () => {
    const e = DIFFICULTY.easy;
    const h = DIFFICULTY.hard;
    expect(h.hearts).toBeLessThan(e.hearts);
    expect(h.telegraph).toBeLessThan(e.telegraph);
    expect(h.promptTime).toBeLessThan(e.promptTime);
    expect(h.aimTol).toBeLessThan(e.aimTol);
    expect(h.health).toBeGreaterThan(e.health);
  });
});

describe('w11 dodge phase', () => {
  it('starts with an intro, then telegraphs an attack', () => {
    const s = createCrocoState({ mode: 'normal', random: seeded() });
    expect(s.phase).toBe('intro');
    const ev = run(s, INTRO_TIME + 1.2);
    expect(ev).toContain('dodgePhase');
    expect(ev).toContain('telegraph');
    expect(s.attack).not.toBeNull();
  });

  it('a tail swipe hits a grounded Panda and misses a jumping one', () => {
    const s = createCrocoState({ mode: 'normal', random: () => 0.9 });
    until(s, 'dodge');
    s.attack = { kind: 'tail', t: 0, tele: 0.5, x: 0, struck: false, hit: false };
    const ev = run(s, 0.5 + STRIKE_WINDOW);
    expect(ev).toContain('hit');
    expect(s.hearts).toBe(DIFFICULTY.normal.hearts - 1);

    const j = createCrocoState({ mode: 'normal', random: () => 0.9 });
    until(j, 'dodge');
    j.attack = { kind: 'tail', t: 0, tele: 0.5, x: 0, struck: false, hit: false };
    run(j, 0.4);
    j.step(DT, { jump: true });
    const ev2 = run(j, 0.9);
    expect(ev2).not.toContain('hit');
    expect(ev2).toContain('dodged');
  });

  it('a lunge only catches Panda inside the marked zone', () => {
    const s = createCrocoState({ mode: 'normal', random: () => 0.9 });
    until(s, 'dodge');
    s.attack = { kind: 'lunge', t: 0, tele: 0.6, x: 0, struck: false, hit: false };
    const ev = run(s, 1.4, { move: 1 }); // step aside to the right
    expect(ev).not.toContain('hit');
    expect(s.px).toBeGreaterThan(DIFFICULTY.normal.lungeHalf);
    expect(s.px).toBeLessThanOrEqual(BANK.maxX);
  });

  it('Georges gets tired after his attacks and the feeding starts', () => {
    const s = createCrocoState({ mode: 'easy', random: seeded() });
    let ev = [];
    for (let i = 0; i < 60 / DT && s.phase !== 'feed'; i++) ev.push(...s.step(DT, botInput(s)));
    expect(ev).toContain('tired');
    expect(ev).toContain('babarSpit');
    expect(s.phase).toBe('feed');
    expect(s.dodges).toBeGreaterThan(0);
  });

  it('losing every heart ends the fight', () => {
    const s = createCrocoState({ mode: 'hard', random: seeded() });
    const ev = run(s, 120); // standing still, never jumping
    expect(ev).toContain('lost');
    expect(s.over).toBe(true);
    expect(s.won).toBe(false);
    expect(s.stars()).toBe(0);
  });
});

describe('w11 feeding and wrestling', () => {
  function atFeed(mode = 'normal') {
    const s = createCrocoState({ mode, random: seeded() });
    for (let i = 0; i < 60 / DT && s.phase !== 'feed'; i++) s.step(DT, botInput(s));
    return s;
  }

  it('a veggie thrown at the mouth calms Georges, a bad throw splashes', () => {
    const s = atFeed();
    s.cousT = 99;
    s.sandwichUsed = true;
    s.feedClock = Math.PI / 2 / SWAY_FREQ; // mouth at its far right, nearly still
    s.px = s.cfg.sway;
    s.step(DT, { throw: true });
    const ev = run(s, 0.7);
    expect(ev).toContain('fed');
    expect(s.calm).toBe(1);
    s.feedClock = Math.PI / 2 / SWAY_FREQ;
    s.px = -s.cfg.sway;
    s.step(DT, { throw: true });
    expect(run(s, 0.7)).toContain('splash');
    expect(s.calm).toBe(1);
  });

  it('Cous throws carrots and Mamar heals Panda with a sandwich', () => {
    const s = atFeed('easy');
    s.hearts = 2;
    const ev = run(s, 4);
    expect(ev).toContain('cousThrow');
    expect(ev).toContain('sandwich');
    expect(s.hearts).toBe(3);
  });

  it('Georges recovers if you do not feed him in time', () => {
    const s = atFeed('hard');
    s.cousT = 999;
    const ev = run(s, DIFFICULTY.hard.feedTime + 0.1);
    expect(ev).toContain('recover');
    expect(s.cycle).toBe(1);
    run(s, 1.5);
    expect(s.phase).toBe('dodge');
  });

  it('enough veggies lead to the wrestling prompts', () => {
    const s = atFeed();
    s.calm = DIFFICULTY.normal.feedNeed - 1;
    s.feedClock = Math.PI / 2 / SWAY_FREQ;
    s.px = s.cfg.sway;
    s.cousT = 99;
    s.step(DT, { throw: true });
    const ev = run(s, 2);
    expect(ev).toContain('calmed');
    expect(ev).toContain('wrestlePhase');
    expect(s.phase).toBe('wrestle');
    expect(s.prompt).not.toBeNull();
  });

  it('right swipes pin Georges, a wrong one sends you back with less health for him', () => {
    const s = atFeed();
    s.phase = 'wrestle';
    s.promptsDone = 0;
    s.prompt = { dir: 'left', t: 0, limit: 2 };
    const h0 = s.health;
    s.step(DT, { swipe: 'left' });
    expect(s.health).toBe(h0 - 1);
    const wrongDir = s.prompt.dir === 'up' ? 'down' : 'up';
    const ev = s.step(DT, { swipe: wrongDir });
    expect(ev).toContain('wrong');
    expect(s.health).toBe(h0 - 1);
    run(s, 1.6);
    expect(s.phase).toBe('dodge');
  });

  it('a prompt that times out is a failure', () => {
    const s = atFeed();
    s.phase = 'wrestle';
    s.prompt = { dir: 'up', t: 0, limit: 0.5 };
    expect(run(s, 0.6)).toContain('wrong');
  });

  it('pinning the last point of health wins', () => {
    const s = atFeed();
    s.phase = 'wrestle';
    s.health = 1;
    s.prompt = { dir: 'right', t: 0, limit: 2 };
    const ev = s.step(DT, { swipe: 'right' });
    expect(ev).toContain('won');
    expect(s.won).toBe(true);
    expect(s.stars()).toBeGreaterThanOrEqual(1);
  });
});

describe('w11 full runs', () => {
  for (const mode of ['easy', 'normal', 'hard']) {
    it(`a good player beats Georges on ${mode} in a 70-130 s fight`, () => {
      const s = playBot(mode);
      expect(s.won).toBe(true);
      expect(s.time).toBeGreaterThan(70);
      expect(s.time).toBeLessThan(130);
      expect(s.stars()).toBeGreaterThanOrEqual(2);
    });
  }

  it('a player who never jumps loses faster on hard than on easy', () => {
    const lazy = (mode) => {
      const s = createCrocoState({ mode, random: seeded(3) });
      for (let i = 0; i < 300 / DT && !s.over; i++) s.step(DT, {});
      return s;
    };
    const easy = lazy('easy');
    const hard = lazy('hard');
    expect(hard.over).toBe(true);
    expect(hard.time).toBeLessThan(easy.over ? easy.time + 0.001 : 999);
  });
});
