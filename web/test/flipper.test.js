// Tests ported from Pipeline Pinball (sfdx-hardis-training, scripts/guinea-run/pinball.test.mjs), same author.
import { describe, it, expect } from 'vitest';
import { createPhysics, MAX_SPEED } from '../src/flipper/engine/physics.js';
import { buildTable, TABLE } from '../src/flipper/engine/layout.js';
import { createRules, BALLS_PER_GAME } from '../src/flipper/engine/rules.js';
import { createAutoplay } from '../src/flipper/engine/autoplay.js';
import { TEXTS } from '../src/flipper/texts.js';

function seeded(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function quietOut(log) {
  return {
    say: (kind, key) => log && log.push(key),
    sound() {},
    event: (name, data) => log && log.push(name + (data && data.id !== undefined ? ':' + data.id : '')),
    text: (key) => key,
    onBeat: () => true,
  };
}

function isOut(ball) {
  return ball.floor === 0
    ? ball.x < TABLE.left - 0.6 || ball.x > TABLE.right + 0.6 || ball.y > TABLE.top + 0.4
    : ball.x < TABLE.upperLeft - 0.4 || ball.x > TABLE.upperRight + 0.4 || ball.y > TABLE.upperTop + 0.4;
}

/** Plays a whole game with the bot; returns the rules, the time played and any escaped or stuck ball seen. */
function botGame(seed, maxSeconds = 3600) {
  const random = seeded(seed);
  const table = buildTable();
  const log = [];
  const rules = createRules(table, quietOut(log), random);
  const bot = createAutoplay(table, random);
  rules.newGame();
  const dt = 1 / 60;
  const still = new Map();
  const problems = [];
  let t = 0;
  while (!rules.over && t < maxSeconds) {
    bot.step(dt, { press: (f) => rules.flip(f.side), release() {}, launched: () => rules.launched() });
    table.physics.advance(dt);
    table.physics.readEvents((e) => rules.event(e));
    rules.update(dt);
    t += dt;
    const flipping = Object.values(table.parts.flippers).some((f) => f.held);
    for (const ball of table.physics.balls) {
      if (!ball.active || ball.mode !== 'table') {
        still.delete(ball);
        continue;
      }
      if (isOut(ball)) problems.push(`escaped at ${ball.x.toFixed(2)},${ball.y.toFixed(2)} floor ${ball.floor}`);
      const onPlunger = ball.x > TABLE.laneWall && ball.y < 2;
      const slow = !flipping && !onPlunger && Math.hypot(ball.vx, ball.vy) < 0.5;
      const s = slow ? (still.get(ball) || 0) + dt : 0;
      still.set(ball, s);
      if (s > 8) {
        problems.push(`stuck at ${ball.x.toFixed(2)},${ball.y.toFixed(2)} floor ${ball.floor}`);
        still.set(ball, 0);
      }
    }
  }
  return { rules, t, log, problems };
}

describe('flipper physics', () => {
  it('the fastest ball never passes through a thin wall', () => {
    for (let i = 0; i < 60; i++) {
      const p = createPhysics();
      p.capsule(-60, 5, 60, 5, { r: 0.06 });
      p.setGravity(0);
      const angle = -Math.PI / 2 + (i / 59 - 0.5) * 2.6;
      const ball = p.addBall(0, 8, Math.cos(angle) * MAX_SPEED, Math.sin(angle) * MAX_SPEED, 0);
      for (let k = 0; k < 120; k++) {
        p.advance(1 / 240);
        expect(ball.y, 'crossed the wall at angle ' + angle.toFixed(2)).toBeGreaterThan(5);
      }
    }
  });

  it('a flipper sends a ball resting on it up the table, fast', () => {
    const table = buildTable();
    const p = table.physics;
    const ball = p.addBall(-1.4, 3.6, 0, -2, 0);
    p.advance(0.25);
    table.parts.flippers.left.held = true;
    let top = 0;
    let up = 0;
    for (let k = 0; k < 30; k++) {
      p.advance(1 / 240);
      top = Math.max(top, Math.hypot(ball.vx, ball.vy));
      up = Math.max(up, ball.vy);
    }
    expect(top).toBeGreaterThan(60);
    expect(up).toBeGreaterThan(40);
  });

  it('random play: no ball escapes the table, none stays stuck', () => {
    const random = seeded(7);
    for (let run = 0; run < 60; run++) {
      const table = buildTable();
      const p = table.physics;
      table.parts.productionGate.enabled = random() < 0.5;
      for (const admin of table.parts.admins) {
        admin.enabled = random() < 0.3;
      }
      const bot = createAutoplay(table, random);
      const ball = p.addBall(TABLE.plunger.x, TABLE.plunger.y + 0.55, 0, 0, 0);
      let still = 0;
      for (let t = 0; t < 60 && ball.active; t += 1 / 60) {
        bot.step(1 / 60, { press() {}, release() {}, launched() {} });
        p.advance(1 / 60);
        p.readEvents((e) => {
          if (e.type === 'enter') {
            if (e.tag === 'release') {
              p.sendOnPath(e.ball, table.parts.paths.release, 6);
            } else {
              p.release(e.ball, 4.4, -12.4);
            }
          } else if (e.type === 'cross' && e.tag === 'upperDrain' && e.value > 0) {
            p.sendOnPath(e.ball, table.parts.paths.down, 4);
          }
        });
        const flipping = Object.values(table.parts.flippers).some((f) => f.held);
        const onPlunger = ball.x > TABLE.laneWall && ball.y < 2;
        still = ball.mode === 'table' && !flipping && !onPlunger && Math.hypot(ball.vx, ball.vy) < 0.5 ? still + 1 / 60 : 0;
        expect(still, `run ${run}: stuck at ${ball.x.toFixed(2)},${ball.y.toFixed(2)}`).toBeLessThan(3);
        if (ball.mode === 'table') {
          expect(isOut(ball), `run ${run}: left the table at ${ball.x.toFixed(2)},${ball.y.toFixed(2)}`).toBe(false);
        }
      }
    }
  });
});

describe('flipper rules', () => {
  it('three drains end the game', () => {
    const table = buildTable();
    const rules = createRules(table, quietOut([]), seeded(5));
    rules.newGame();
    expect(BALLS_PER_GAME).toBe(3);
    let t = 0;
    // Nobody flips: the ball is launched and drains, again and again
    while (!rules.over && t < 900) {
      if (table.physics.ballOnPlunger()) {
        table.physics.pullPlunger(1);
        if (table.physics.releasePlunger()) rules.launched();
      }
      table.physics.advance(1 / 60);
      table.physics.readEvents((e) => rules.event(e));
      rules.update(1 / 60);
      t += 1 / 60;
    }
    expect(rules.over).toBe(true);
  });

  it('five drop targets light the lock, three locks start the multiball with 3 balls', () => {
    const table = buildTable();
    const log = [];
    const rules = createRules(table, quietOut(log), seeded(3));
    rules.newGame();
    const ball = table.physics.balls.find((b) => b.active);
    ball.x = 0;
    ball.y = 10;
    for (let lock = 0; lock < 3; lock++) {
      for (let i = 0; i < 5; i++) {
        rules.event({ type: 'hit', tag: 'drop' + i, value: 10, ball });
      }
      expect(rules.state.lockLit).toBe(true);
      rules.event({ type: 'rampDone', tag: 'integration', value: 30, ball });
      rules.update(2);
    }
    expect(rules.state.mb).toBeTruthy();
    expect(log).toContain('pbMultiball');
    for (let i = 0; i < 10; i++) rules.update(0.5);
    expect(table.physics.activeBalls()).toBe(3);
  });

  it('a whole game played by the bot ends with no escaped or stuck ball', () => {
    for (const seed of [11, 23]) {
      const { rules, t, problems } = botGame(seed);
      expect(rules.over, `seed ${seed}: ended within an hour (${Math.round(t / 60)} min, score ${rules.state.score})`).toBe(true);
      expect(problems, `seed ${seed}`).toEqual([]);
      expect(rules.state.score).toBeGreaterThan(0);
    }
  }, 300000);
});

describe('flipper texts', () => {
  it('every English key has a French text', () => {
    const missing = Object.keys(TEXTS.en).filter((k) => TEXTS.fr[k] === undefined);
    expect(missing).toEqual([]);
  });
});
