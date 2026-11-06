import { describe, it, expect } from 'vitest';
import { createRules, botInput, WEAPONS, WEAPON_OF, LEVELS, HEARTS, PEOPLE } from '../src/merguez/rules.js';
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
    for (const id of [...CAST_IDS, ...EXTRA_IDS, ...PEOPLE]) {
      expect(WEAPONS[WEAPON_OF[id]], id).toBeTruthy();
    }
  });

  it('a good player finishes the five levels with every hero', () => {
    for (const hero of CAST_IDS) {
      let wins = 0;
      for (let seed = 1; seed <= 4; seed++) {
        const { r } = play({ hero, seed }, botInput, 600);
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

  it('has five levels, each ending with its boss: Lamoule, Romain, José, Babar, Rudy', () => {
    const bosses = LEVELS.map((L) => {
      const last = L.stations[L.stations.length - 1];
      expect(last.boss).toBe(true);
      return last.foes[0].who;
    });
    expect(bosses).toEqual(['lamoule', 'romain', 'jose', 'babar', 'rudy']);
    const { events } = play({ hero: 'panda', seed: 1 }, botInput, 600);
    expect(events.filter((e) => e.type === 'boss').map((e) => e.who)).toEqual(bosses);
    expect(events.filter((e) => e.type === 'levelStart').map((e) => e.index)).toEqual([1, 2, 3, 4]);
  });

  it('replaces Romain and Babar as bosses when you play them', () => {
    for (const hero of ['romain', 'babar']) {
      const { events } = play({ hero, seed: 2 }, botInput, 600);
      const bosses = events.filter((e) => e.type === 'boss').map((e) => e.who);
      expect(bosses).not.toContain(hero);
      expect(bosses.length).toBe(5);
    }
  });

  it('lets you slide along the cover while ducked, safely', () => {
    const { r } = play({ hero: 'panda' }, (x) => {
      x.setStand(false);
      x.setMove(Math.sin(x.time * 2) > 0 ? 1 : -1);
    }, 30);
    expect(r.hearts).toBe(HEARTS);
    expect(Math.abs(r.ox)).toBeGreaterThan(0.1);
  });

  it('a throw misses if you slide aside in time, even standing', () => {
    const { events } = play({ hero: 'panda', seed: 4 }, (x) => {
      x.setStand(true);
      x.setFire(false);
      // Slide to the other side as soon as something is on its way.
      const s = x.incoming.find((i) => i.t >= 0);
      if (s) x.setMove(s.tx > x.pos.x ? -1 : 1);
      else x.setMove(0);
    }, 20);
    const dodged = events.filter((e) => e.type === 'block').length;
    const hurt = events.filter((e) => e.type === 'hurt').length;
    expect(dodged).toBeGreaterThan(0);
    expect(hurt).toBeLessThan(dodged);
  });

  it('only throws when you press the throw button', () => {
    const { r } = play({ hero: 'panda' }, (x) => {
      x.setStand(true);
      x.setFire(false);
    }, 3);
    expect(r.throws).toBe(0);
  });

  it('throws once per tap', () => {
    const r = createRules({ hero: 'panda', random: seeded(1) });
    r.setStand(true);
    for (let i = 0; i < 30; i++) r.step(1 / 60);
    r.tapFire();
    for (let i = 0; i < 120; i++) r.step(1 / 60);
    expect(r.throws).toBe(1);
    r.tapFire();
    r.step(1 / 60);
    expect(r.throws).toBe(2);
  });

  it('a tap on someone pops out, throws at them and ducks back by itself', () => {
    const r = createRules({ hero: 'panda', random: seeded(3) });
    let f = null;
    for (let i = 0; i < 600 && !f; i++) {
      r.step(1 / 60);
      f = r.foes.find((x) => x.state === 'tell');
    }
    r.tapFoe(f.id, false);
    let wasOut = false;
    for (let i = 0; i < 20; i++) {
      r.step(1 / 60);
      if (r.rise >= 1) wasOut = true;
    }
    expect(wasOut).toBe(true);
    expect(r.throws).toBe(1);
    expect(r.shots[0]?.target ?? r.hits).toBeTruthy();
    for (let i = 0; i < 60; i++) r.step(1 / 60);
    expect(r.rise).toBe(0); // back in cover without doing anything
  });

  it('gives a heart back between levels', () => {
    const r = createRules({ hero: 'panda', random: seeded(1) });
    r.hearts = 2;
    for (let t = 0; t < 300 && r.level === 0; t += 1 / 60) {
      botInput(r);
      r.step(1 / 60);
    }
    expect(r.level).toBe(1);
    expect(r.hearts).toBe(3);
  });
});
