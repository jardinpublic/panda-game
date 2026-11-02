import { describe, it, expect } from 'vitest';
import { step, ball, seg, flipperTip, MAX_SPEED } from '../src/pinball/physics.js';
import { buildTable, L, DRAIN_Y } from '../src/pinball/table.js';
import { createPinball, launchSpeed, MISSIONS } from '../src/pinball/game.js';
import { createAutoplay } from '../src/pinball/autoplay.js';
import { emptyMeta, applyPinball, normalizeMeta, mergeMeta } from '../src/marathon/meta.js';

function seeded(seed) {
  let x = seed * 9301 + 49297;
  return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
}
const quiet = { msg: () => {}, sfx: () => {}, say: () => {}, fx: () => {} };

describe('pinball physics', () => {
  it('flippers are solid and send the ball up fast', () => {
    for (const k of [0.3, 0.6, 0.9]) {
      const t = buildTable();
      const f = t.flippers[0];
      const tip = flipperTip(f);
      const b = ball(f.x + (tip.x - f.x) * k, f.y + (tip.y - f.y) * k - 50, 0, 200);
      const w = { balls: [b], bodies: t.bodies, flippers: t.flippers, sensors: [] };
      for (let i = 0; i < 12; i++) step(w, 1 / 60);
      expect(b.y).toBeLessThan(f.y + 20); // resting on the flipper, not through it
      f.pressed = true;
      let up = 0;
      for (let i = 0; i < 30; i++) { step(w, 1 / 60); up = Math.max(up, -b.vy); }
      expect(up).toBeGreaterThan(1000);
    }
  });

  it('a ball at top speed never tunnels through a wall', () => {
    for (let a = 0; a < 24; a++) {
      const angle = (a / 24) * Math.PI * 2;
      const wall = seg(150, 300, 250, 300);
      const b = ball(200 - Math.cos(angle) * 40, 260, Math.cos(angle) * MAX_SPEED * 0.3, Math.abs(Math.sin(angle)) * MAX_SPEED + 200);
      const w = { balls: [b], bodies: [wall], flippers: [], sensors: [] };
      for (let i = 0; i < 6; i++) step(w, 1 / 60);
      if (b.x > 150 && b.x < 250) expect(b.y).toBeLessThan(300);
    }
  });

  it('the plunger always gets the ball out of its lane, and a full pull loops the table', () => {
    expect(launchSpeed(0)).toBeLessThan(launchSpeed(0.5));
    for (const pull of [0, 0.5, 1]) {
      const g = createPinball({ out: quiet, random: seeded(3) });
      g.update(1 / 60, { right: true });
      g.state.plunger.pull = pull;
      g.update(1 / 60, { right: false });
      let minY = 999;
      for (let i = 0; i < 120; i++) {
        g.update(1 / 60, {});
        minY = Math.min(minY, g.world.balls[0].y);
      }
      expect(minY).toBeLessThan(250);
    }
  });
});

describe('pinball games (test player)', () => {
  const results = [];
  for (let seed = 1; seed <= 8; seed++) {
    const random = seeded(seed);
    const game = createPinball({ out: quiet, random });
    const bot = createAutoplay(game, random);
    let t = 0;
    let escaped = 0;
    let stuck = 0;
    while (!game.state.over && t < 1800) {
      game.update(1 / 60, bot(1 / 60));
      t += 1 / 60;
      for (const b of game.world.balls) {
        if (!b.alive || b.held) continue;
        if (b.x < L.left - 2 || b.x > L.right + 2 || b.y < -20) escaped++;
        if (b.still > 3) stuck++;
      }
    }
    results.push({ over: game.state.over, t, score: game.state.score, missions: game.state.nextMission, escaped, stuck });
  }

  it('every game ends (3 balls drain) and scores', () => {
    for (const r of results) {
      expect(r.over).toBe(true);
      expect(r.score).toBeGreaterThan(10000);
    }
  });
  it('no ball ever leaves the table or stays stuck', () => {
    for (const r of results) {
      expect(r.escaped).toBe(0);
      expect(r.stuck).toBe(0);
    }
  });
  it('games last long enough to be fun and missions get started', () => {
    const avg = results.reduce((a, r) => a + r.t, 0) / results.length;
    expect(avg).toBeGreaterThan(60);
    expect(results.some((r) => r.missions > 0)).toBe(true);
  });
});

describe('pinball rules', () => {
  it('Le Molière starts the missions in order and the clock can run out', () => {
    const g = createPinball({ out: quiet, random: seeded(1) });
    const b = g.world.balls[0];
    b.held = null;
    b.x = L.moliere.x;
    b.y = L.moliere.y - 30;
    b.vx = 0;
    b.vy = 60;
    for (let i = 0; i < 30; i++) g.update(1 / 60, {});
    expect(g.state.mission?.def.id).toBe(MISSIONS[0].id);
    for (let i = 0; i < 60 * 45 && g.state.mission; i++) g.update(1 / 60, {});
    expect(g.state.mission).toBe(null);
  });

  it('a drained ball during ball save comes back', () => {
    const g = createPinball({ out: quiet, random: seeded(2) });
    g.state.ballSave = 5;
    const b = g.world.balls[0];
    b.held = null;
    b.x = 190;
    b.y = DRAIN_Y + 5;
    g.update(1 / 60, {});
    expect(g.state.ballNo).toBe(1);
    expect(g.world.balls.filter((x) => x.alive).length).toBe(1);
  });
});

describe('flipper high scores', () => {
  it('keeps its own best and top 10, merged across tabs', () => {
    let meta = emptyMeta();
    meta = applyPinball(meta, { score: 120000, hero: 'panda', at: 1 }).meta;
    const res = applyPinball(meta, { score: 450000, hero: 'cous', at: 2 });
    expect(res.newBest).toBe(true);
    expect(res.rank).toBe(1);
    expect(res.meta.pinball.best).toBe(450000);
    expect(res.meta.pinball.scores.map((x) => x.score)).toEqual([450000, 120000]);
    expect(res.meta.best).toBe(0); // the marathon record is separate
    const other = normalizeMeta({ ...emptyMeta(), pinball: { best: 900000, scores: [{ score: 900000, at: 3 }] }, updated: 1 });
    const merged = mergeMeta(normalizeMeta({ ...res.meta, updated: 5 }), other);
    expect(merged.pinball.best).toBe(900000);
    expect(merged.pinball.scores.length).toBe(3);
  });
});
