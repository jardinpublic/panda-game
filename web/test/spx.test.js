// 103 SPX: the route, the rules and whole rides played by the bot.
import { describe, it, expect } from 'vitest';
import { buildRoute, SECTIONS } from '../src/spx/route.js';
import { createRules, TUNING, clock } from '../src/spx/rules.js';
import { createAutoplay } from '../src/spx/autoplay.js';
import { TEXTS, gibberish, createTexts } from '../src/spx/texts.js';

function seeded(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Rides with the bot until home or game over; returns rules and what was said. */
function ride(seed, { reaction = 0, tuning, stopAt } = {}) {
  const said = [];
  const events = [];
  const rules = createRules({
    random: seeded(seed),
    tuning,
    out: { say: (kind, key, vars, who) => said.push({ kind, key, who }), event: (name, data) => events.push({ name, data }) },
  });
  const bot = createAutoplay(rules, { reaction });
  rules.newGame();
  let t = 0;
  while (!['done', 'over'].includes(rules.state.phase) && t < 600) {
    if (stopAt && stopAt(rules)) break;
    bot.step(1 / 60);
    rules.update(1 / 60);
    t += 1 / 60;
  }
  return { rules, said, events };
}

describe('103 SPX route', () => {
  const route = buildRoute();
  it('goes from the Parc du Petit Bois to Rue de Charolles through the ZUP roundabout, Rue Beaubernard and Rue de la Place Pageot', () => {
    const names = route.sections.map((s) => s.name);
    expect(names[0]).toBe('Parc du Petit Bois');
    expect(names[names.length - 1]).toBe('Rue de Charolles');
    const order = ['Rond-point de la ZUP', 'Rue Beaubernard', 'Rue de la Place Pageot'].map((n) => names.indexOf(n));
    expect(order.every((i) => i > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('lays the streets end to end, each about its planned length', () => {
    for (let i = 1; i < route.sections.length; i++) expect(route.sections[i].s0).toBe(route.sections[i - 1].s1);
    expect(route.sections[route.sections.length - 1].s1).toBe(route.length);
    for (const sec of route.sections) {
      if (sec.ring) continue;
      const want = SECTIONS.find((s) => s.id === sec.id && s.name === sec.name).len;
      expect(Math.abs(sec.s1 - sec.s0 - want)).toBeLessThan(12);
    }
  });

  it('rides the roundabout on a true circle', () => {
    const ring = route.ring;
    for (let s = ring.s0 + 2; s < ring.s1 - 2; s += 3) {
      const p = route.at(s);
      expect(Math.hypot(p.x - ring.cx, p.z - ring.cz)).toBeCloseTo(ring.r, 0);
    }
  });

  it('gives a finite position and a map point everywhere', () => {
    for (let s = 0; s <= route.length; s += 0.7) {
      const p = route.at(s, 2);
      expect(Number.isFinite(p.x + p.z + p.heading)).toBe(true);
      const m = route.mapPoint(s);
      expect(Number.isFinite(m[0] + m[1])).toBe(true);
    }
  });
});

describe('103 SPX rules', () => {
  it('needs fast pedalling to start the engine', () => {
    const rules = createRules({ random: seeded(1) });
    rules.newGame();
    for (let i = 0; i < 5; i++) {
      rules.pedal();
      rules.update(0.5);
    }
    expect(rules.state.phase).toBe('pedal');
    for (let i = 0; i < 10; i++) rules.pedal();
    expect(rules.state.phase).toBe('ride');
  });

  it('a longer shout at Pépé Gogol scores more, and he answers in gibberish', () => {
    const scoreFor = (holdSeconds) => {
      const { rules, said } = ride(3, { stopAt: (r) => r.state.prompt && r.state.prompt.key === 'gogolHint' });
      const before = rules.state.score;
      rules.press();
      for (let t = 0; t < holdSeconds; t += 1 / 60) rules.update(1 / 60);
      rules.release();
      const gained = rules.state.score - before;
      for (let t = 0; t < 1.5; t += 1 / 60) rules.update(1 / 60);
      const reply = said.find((x) => x.kind === 'line' && x.who === 'gogol');
      return { gained, reply };
    };
    const short = scoreFor(0.4);
    const long = scoreFor(2.5);
    expect(long.gained).toBeGreaterThan(short.gained + 300);
    expect(long.reply).toBeTruthy();
    expect(long.reply.key).not.toBe('');
  });

  it('Les Azzouz take a cigarette from a rider who ignores them', () => {
    const { rules } = ride(2, { stopAt: (r) => r.state.entities.some((e) => e.kind === 'azzouz' && e.state === 'side') });
    const st = rules.state;
    const before = st.clopes;
    // Ride on in a straight line, never pushing them away
    for (let t = 0; t < 4; t += 1 / 60) rules.update(1 / 60);
    expect(st.clopes).toBe(before - 1);
    expect(st.stats.stolen).toBe(1);
  });

  it('tapping pushes Les Azzouz away before they steal', () => {
    const { rules } = ride(2, { stopAt: (r) => r.state.entities.some((e) => e.kind === 'azzouz' && e.state === 'side') });
    const before = rules.state.clopes;
    rules.press();
    rules.release();
    for (let t = 0; t < 2; t += 1 / 60) rules.update(1 / 60);
    expect(rules.state.clopes).toBe(before);
    expect(rules.state.entities.some((e) => e.kind === 'azzouz' && e.state === 'pushed')).toBe(true);
  });

  it('fast cops catch the rider: a check costs a life', () => {
    const tuning = { ...TUNING, police: { ...TUNING.police, speed: 40 } };
    const { rules, said } = ride(4, { tuning, stopAt: (r) => r.state.chase.done });
    expect(said.some((x) => x.key === 'keufsCaught')).toBe(true);
    expect(rules.state.hearts).toBeLessThan(TUNING.hearts);
  });

  it('three crashes end the ride without the home bonus', () => {
    const rules = createRules({ random: seeded(5) });
    rules.newGame();
    for (let i = 0; i < 10; i++) rules.pedal();
    // Ride straight in the oncoming lane with no steering: something will hit
    rules.setTarget(-1.65);
    for (let t = 0; t < 300 && rules.state.phase !== 'over' && rules.state.phase !== 'done'; t += 1 / 60) rules.update(1 / 60);
    expect(rules.state.phase).toBe('over');
    expect(rules.state.summary.finished).toBe(false);
    expect(rules.state.summary.bonuses).toEqual([]);
  });

  it('the bot rides home on most seeds, beats Babar and floors Pietro Gangi with the table leg', () => {
    let home = 0;
    let duels = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const { rules } = ride(seed);
      const st = rules.state;
      expect(Number.isFinite(st.score)).toBe(true);
      if (st.phase === 'done') home++;
      if (st.duel && st.duel.won) duels++;
      if (st.phase === 'done') {
        expect(st.stats.bonks).toBe(3);
        const bonus = st.summary.bonuses.reduce((sum, b) => sum + b.points, 0);
        expect(bonus).toBeGreaterThanOrEqual(2000);
        expect(st.summary.score).toBe(st.score);
      }
    }
    expect(home).toBeGreaterThanOrEqual(5);
    expect(duels).toBeGreaterThanOrEqual(4);
  });

  it('a rider with human reaction time (0.3 s) still gets home', () => {
    let home = 0;
    for (let seed = 11; seed <= 15; seed++) if (ride(seed, { reaction: 0.3 }).rules.state.phase === 'done') home++;
    expect(home).toBeGreaterThanOrEqual(4);
  });

  it('is the same ride for the same seed', () => {
    const a = ride(9).rules.state;
    const b = ride(9).rules.state;
    expect(a.score).toBe(b.score);
    expect(a.t).toBeCloseTo(b.t, 6);
  });
});

describe('103 SPX texts', () => {
  it('has every French key in English and the other way round', () => {
    expect(Object.keys(TEXTS.fr).sort()).toEqual(Object.keys(TEXTS.en).sort());
  });

  it('speaks patois bourguignon in French (eul’, me, y’est, te)', () => {
    const lines = Object.values(TEXTS.fr).flat().join(' \n ');
    expect(lines).not.toMatch(/\b[Ll]e (?!Bud|Smo)\w/);
    expect(lines).not.toMatch(/[Cc]['’]est\b/);
    expect(lines).not.toMatch(/\bmoi\b/i);
    expect(lines).not.toMatch(/\btu\b/i);
  });

  it('fills placeholders and makes up gibberish', () => {
    const t = createTexts('fr', seeded(1));
    expect(t('wheelie', { points: 80 })).toContain('80');
    expect(gibberish(seeded(3))).toMatch(/^[A-Z].+[!…]$/);
    expect(clock(125)).toBe('2:05');
  });
});
