import { describe, it, expect } from 'vitest';
import { createRules, botInput, WEAPONS, WEAPON_OF, LEVELS, HEARTS } from '../src/merguez/rules.js';
import { CAST_IDS, EXTRA_IDS } from '../src/marathon/art.js';

function seeded(seed) {
  let x = seed * 9301 + 49297;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

/** Plays with `input(r)` every frame until the run ends or `seconds` pass. */
function play(opts, input, seconds = 240) {
  const r = createRules({ random: seeded(opts.seed ?? 1), ...opts });
  const events = [];
  for (let t = 0; t < seconds && r.phase !== 'over'; t += 1 / 60) {
    input(r);
    r.step(1 / 60);
    events.push(...r.events.splice(0));
  }
  return { r, events };
}

describe('Golden Merguez rules', () => {
  it('gives every friend, boss and person a weapon that exists', () => {
    for (const id of [...CAST_IDS, ...EXTRA_IDS, 'gogol', 'pineur', 'gardien']) {
      expect(WEAPONS[WEAPON_OF[id]], id).toBeTruthy();
    }
  });

  it('a good player clears the Jardin Public with every hero', () => {
    for (const hero of CAST_IDS) {
      let wins = 0;
      for (let seed = 1; seed <= 4; seed++) {
        const { r } = play({ hero, seed }, botInput);
        if (r.finished && r.hearts > 0) wins++;
      }
      expect(wins, hero).toBeGreaterThanOrEqual(3);
    }
  });

  it('is safe in cover, and nothing happens while you hide', () => {
    const { r, events } = play({ hero: 'panda' }, (x) => x.setOut(false), 60);
    expect(r.hearts).toBe(HEARTS);
    expect(r.station).toBe(0);
    expect(events.some((e) => e.type === 'block')).toBe(true);
  });

  it('standing out without fighting back gets you knocked out', () => {
    const { r } = play({ hero: 'panda' }, (x) => {
      x.setOut(true);
      x.aimTo(0, 0.34); // throwing at the sky
    }, 120);
    expect(r.hearts).toBe(0);
    expect(r.phase).toBe('over');
    expect(r.finished).toBe(false);
  });

  it('pays more for a hit in the face and for a combo', () => {
    const { events } = play({ hero: 'panda', seed: 2 }, botInput);
    const hits = events.filter((e) => e.type === 'hit');
    expect(hits.some((e) => e.head)).toBe(true);
    expect(hits.some((e) => e.mult >= 2)).toBe(true);
  });

  it('ends the level against Lamoule, with a level bonus', () => {
    const { events } = play({ hero: 'cous', seed: 3 }, botInput);
    expect(events.find((e) => e.type === 'boss')?.who).toBe('lamoule');
    expect(events.some((e) => e.type === 'ko' && e.boss)).toBe(true);
    expect(events.find((e) => e.type === 'level').bonus).toBeGreaterThan(0);
  });

  it('never makes you fight yourself as a boss', () => {
    const levels = [{ id: 't', name: {}, par: 60, stations: [{ x: 0, z: 0, cover: 'bench', boss: true, foes: [{ who: 'babar', x: 0, z: -10, cover: 'car205', boss: true }] }] }];
    const r = createRules({ hero: 'babar', levels, random: seeded(1) });
    expect(r.foes[0].who).toBe('mamar');
    expect(createRules({ hero: 'panda', levels, random: seeded(1) }).foes[0].who).toBe('babar');
  });

  it('makes Mamar say he is easy prey', () => {
    const levels = [{ id: 't', name: {}, par: 60, stations: [{ x: 0, z: 0, cover: 'bench', foes: [{ who: 'mamar', x: 0, z: -10, cover: 'tree' }] }] }];
    const { events } = play({ hero: 'panda', levels }, botInput, 30);
    expect(events.some((e) => e.type === 'say' && e.who === 'mamar' && e.text === 'proie')).toBe(true);
  });

  it('has a first level with a boss at the end', () => {
    const st = LEVELS[0].stations;
    expect(st[st.length - 1].boss).toBe(true);
  });
});
