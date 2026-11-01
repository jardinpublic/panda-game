import { describe, it, expect } from 'vitest';
import { GAMES, BOSSES } from '../src/marathon/games/index.js';
import { startMicro, applyAction } from '../src/marathon/micro.js';
import { createFx } from '../src/marathon/fx.js';
import { CAST_IDS } from '../src/marathon/art.js';

// A canvas context that accepts every call, so draw() runs in Node.
function fakeContext() {
  const gradient = { addColorStop() {} };
  const target = { measureText: (s) => ({ width: String(s).length * 9 }), createLinearGradient: () => gradient, createRadialGradient: () => gradient, createPattern: () => null };
  return new Proxy(target, {
    get: (t, k) => (k in t ? t[k] : () => undefined),
    set: (t, k, v) => { t[k] = v; return true; },
  });
}

function seeded(seed) {
  let x = seed * 9301 + 49297;
  return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
}

const noSound = new Proxy({}, { get: () => () => {} });

/** Plays one micro-game to the end. mode: 'bot' | 'idle'. Returns true if won. */
function play(def, { speed, seed, mode, boss = false, hero = 'panda' }) {
  const random = seeded(seed);
  const run = startMicro(def, { W: 400, H: 820, speed, boss, random, hero, friends: CAST_IDS, lang: seed % 2 ? 'fr' : 'en', fx: createFx(random), sfx: noSound });
  const c = fakeContext();
  let frames = 0;
  while (!run.g.done && frames < 60 * 30) {
    if (mode === 'bot') applyAction(run, run.inst.bot?.());
    run.step(1 / 60);
    if (frames % 7 === 0) run.draw(c);
    frames++;
  }
  // Keep animating a little after the end, like the app does.
  for (let i = 0; i < 30; i++) { run.step(1 / 60); run.g.fx.update(1 / 60); }
  run.draw(c);
  return run.g.won;
}

const ALL = [...GAMES.map((d) => [d, false]), ...BOSSES.map((d) => [d, true])];

describe.each(ALL)('micro-game %#', (def, boss) => {
  it(`${def.id}: declares its contract`, () => {
    expect(def.id).toMatch(/^[a-z0-9-]+$/);
    expect(def.verb.en).toBeTruthy();
    expect(def.verb.fr).toBeTruthy();
    for (const key of ['title', 'howto', 'winLine']) {
      expect(def[key]?.en, `${def.id}.${key}.en`).toBeTruthy();
      expect(def[key]?.fr, `${def.id}.${key}.fr`).toBeTruthy();
    }
    expect(['tap', 'swipe', 'hold', 'drag', 'mash']).toContain(def.input);
    expect(def.base).toBeGreaterThan(1);
  });

  for (const speed of [1, 1.7, 2.4]) {
    it(`${def.id}: a good player wins at speed ${speed}`, () => {
      let wins = 0;
      for (let seed = 1; seed <= 12; seed++) wins += play(def, { speed, seed, mode: 'bot', boss }) ? 1 : 0;
      expect(wins).toBeGreaterThanOrEqual(11);
    });
  }

  it(`${def.id}: doing nothing loses`, () => {
    let wins = 0;
    for (let seed = 1; seed <= 12; seed++) wins += play(def, { speed: 1, seed, mode: 'idle', boss }) ? 1 : 0;
    expect(wins).toBeLessThanOrEqual(1);
  });

  it(`${def.id}: works when every friend is the hero`, () => {
    for (const hero of CAST_IDS) play(def, { speed: 1.3, seed: 3, mode: 'bot', boss, hero });
  });
});

it('ids are unique', () => {
  const ids = ALL.map(([d]) => d.id);
  expect(new Set(ids).size).toBe(ids.length);
});
