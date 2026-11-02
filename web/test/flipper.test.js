// Tests ported from Pipeline Pinball (sfdx-hardis-training, scripts/guinea-run/pinball.test.mjs), same author.
import { describe, it, expect } from 'vitest';
import { createPhysics, MAX_SPEED } from '../src/flipper/engine/physics.js';
import { buildTable, TABLE } from '../src/flipper/engine/layout.js';
import { createRules, BALLS_PER_GAME } from '../src/flipper/engine/rules.js';
import { createAutoplay } from '../src/flipper/engine/autoplay.js';
import { TEXTS } from '../src/flipper/texts.js';
import { TABLE_TEXTS } from '../src/flipper/texts-table.js';

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
      // The toys in any state: the door open or shut, the crater open, the diverter on, the post up
      const parts = table.parts;
      const open = random() < 0.5;
      parts.bouncers.forEach((b) => (b.enabled = !open));
      parts.crater.enabled = random() < 0.4;
      parts.fiatDiverter.on = random() < 0.4;
      parts.magnet.on = random() < 0.5;
      p.raise(parts.post, random() < 0.3);
      const bot = createAutoplay(table, random);
      const ball = p.addBall(TABLE.plunger.x, TABLE.plunger.y + 0.55, 0, 0, 0);
      let still = 0;
      for (let t = 0; t < 60 && ball.active; t += 1 / 60) {
        bot.step(1 / 60, { press() {}, release() {}, launched() {} });
        p.advance(1 / 60);
        p.readEvents((e) => {
          if (e.type === 'enter') {
            if (e.tag === 'cellar') {
              p.sendOnPath(e.ball, parts.paths.cellar, 40);
            } else {
              p.release(e.ball, -1.2, -9);
            }
          } else if (e.type === 'rampDone' && e.tag === 'silo') {
            p.sendOnPath(e.ball, parts.paths.siloExit, 8);
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

/** Runs a bare physics world for `seconds`, collecting its events. */
function run(p, seconds, events) {
  for (let t = 0; t < seconds; t += 1 / 120) {
    p.advance(1 / 120);
    p.readEvents((e) => events && events.push({ type: e.type, tag: e.tag, value: e.value, ball: e.ball }));
  }
}

describe('flipper v2 mechanisms', () => {
  it('a bash toy loses a hit point to each hard hit, none to a soft one', () => {
    const p = createPhysics();
    p.setGravity(0);
    const toy = p.bashToy(0, 5, 0.9, { hp: 3, minSpeed: 6, tag: 'volcano' });
    const events = [];
    const soft = p.addBall(0, 3, 0, 3, 0);
    run(p, 1, events);
    expect(toy.bash.hp).toBe(3);
    p.removeBall(soft);
    for (let i = 0; i < 3; i++) {
      const ball = p.addBall(0, 3, 0, 25, 0);
      run(p, 0.5, events);
      p.removeBall(ball);
    }
    expect(toy.bash.hp).toBe(0);
    expect(events.filter((e) => e.type === 'bash').map((e) => e.value)).toEqual([2, 1, 0]);
  });

  it('creatures walk, turn inside their bounds, and a flipped one stays still', () => {
    const p = createPhysics();
    const crabs = [0, 1, 2].map((i) => p.creature(-1 + i, 8, 0.3, { tag: 'crab' + i, bounds: [-2.5, 7.5, 2.5, 10], speed: 1.5, heading: i }));
    const start = crabs.map((c) => [c.shape.ax, c.shape.ay]);
    let minGap = Infinity;
    for (let t = 0; t < 30; t += 1 / 60) {
      p.advance(1 / 60);
      for (const c of crabs) {
        expect(c.shape.ax).toBeGreaterThanOrEqual(-2.5);
        expect(c.shape.ax).toBeLessThanOrEqual(2.5);
        expect(c.shape.ay).toBeGreaterThanOrEqual(7.5);
        expect(c.shape.ay).toBeLessThanOrEqual(10);
      }
      minGap = Math.min(minGap, Math.hypot(crabs[0].shape.ax - crabs[1].shape.ax, crabs[0].shape.ay - crabs[1].shape.ay));
    }
    crabs.forEach((c, i) => expect(Math.hypot(c.shape.ax - start[i][0], c.shape.ay - start[i][1]) + Math.abs(c.heading)).toBeGreaterThan(0.1));
    expect(minGap).toBeGreaterThan(0.3);
    p.flipCreature(crabs[0], true);
    const [x, y] = [crabs[0].shape.ax, crabs[0].shape.ay];
    p.advance(2);
    expect([crabs[0].shape.ax, crabs[0].shape.ay]).toEqual([x, y]);
    expect(crabs[0].shape.enabled).toBe(false);
    // A ball hitting a walking crab: a hit event with its tag
    const events = [];
    const c = crabs[1];
    p.setGravity(0);
    p.addBall(c.shape.ax, c.shape.ay - 2, 0, 20, 0);
    run(p, 0.4, events);
    expect(events.some((e) => e.type === 'hit' && e.tag === 'crab1')).toBe(true);
  });

  it('a captive ball takes the momentum of a hard hit up to its top switch, not of a soft one', () => {
    const p = createPhysics();
    const coco = p.captive(0, 5, 0, 7, 0.3, { tag: 'coco', mass: 1.2 });
    const events = [];
    const soft = p.addBall(0, 3, 0, 9, 0);
    run(p, 1.5, events);
    expect(events.some((e) => e.type === 'top')).toBe(false);
    expect(events.some((e) => e.type === 'hit' && e.tag === 'cocoBall')).toBe(true);
    // Back to its rest under gravity
    expect(coco.s).toBeLessThan(0.05);
    p.removeBall(soft);
    const hard = p.addBall(0, 3.5, 0, 34, 0);
    run(p, 1, events);
    expect(events.some((e) => e.type === 'top' && e.tag === 'coco')).toBe(true);
    // The play ball bounced back down, slower than it came
    expect(hard.vy).toBeLessThan(10);
  });

  it('a magnet catches a slow ball, holds it, and throws it on release; a fast one only bends', () => {
    const p = createPhysics();
    p.setGravity(0);
    const m = p.magnet(0, 5, 0.6, { tag: 'magnet', maxSpeed: 25 });
    const events = [];
    const fast = p.addBall(0.3, 2, 0, 40, 0);
    run(p, 0.3, events);
    expect(fast.mode).toBe('table');
    p.removeBall(fast);
    const ball = p.addBall(0.3, 3, 0, 10, 0);
    run(p, 1, events);
    expect(events.some((e) => e.type === 'enter' && e.tag === 'magnet')).toBe(true);
    expect(ball.mode).toBe('held');
    expect(Math.hypot(ball.x, ball.y - 5)).toBeLessThan(0.02);
    expect(m.holding).toBe(ball);
    p.release(ball, 20, 0);
    expect(m.holding).toBe(null);
    run(p, 0.2);
    expect(ball.x).toBeGreaterThan(2);
    expect(ball.mode).toBe('table');
  });

  it('a diverter switches the exit of a ramp only while it is on', () => {
    const p = createPhysics();
    const ramp = p.path([0, 0, 0, 0, 2, 0.5, 0, 4, 0.5, 3, 4, 0.5, 3, 0, 0], { tag: 'fiat' });
    const lock = p.path([0, 4, 0.5, -1, 4.5, 0.6], { tag: 'silo', holdAtEnd: true });
    const div = p.diverter(ramp, 2, lock);
    const events = [];
    const a = p.addBall(0, -1, 0, 0, 0);
    p.sendOnPath(a, ramp, 30);
    run(p, 1.5, events);
    expect(events.some((e) => e.type === 'rampDone' && e.tag === 'fiat')).toBe(true);
    div.on = true;
    const b = p.addBall(0, -1, 0, 0, 0);
    p.sendOnPath(b, ramp, 30);
    run(p, 1.5, events);
    expect(events.some((e) => e.type === 'divert' && e.tag === 'fiat')).toBe(true);
    expect(events.some((e) => e.type === 'rampDone' && e.tag === 'silo')).toBe(true);
    expect(b.mode).toBe('held');
    expect(b.h).toBeCloseTo(0.6, 1);
  });

  it('an up-post saves a ball between the flippers only while it is up', () => {
    const table = buildTable();
    const p = table.physics;
    const post = table.parts.post;
    const drop = () => {
      const ball = p.addBall(post.ax, 3.2, 0, -6, 0);
      let lowest = 10;
      for (let t = 0; t < 1.5 && ball.active; t += 1 / 120) {
        p.advance(1 / 120);
        p.readEvents(() => {});
        lowest = Math.min(lowest, ball.y);
      }
      if (ball.active) p.removeBall(ball);
      return lowest;
    };
    expect(drop()).toBeLessThan(-1);
    p.raise(post, true);
    expect(drop()).toBeGreaterThan(post.ay);
    p.raise(post, false);
    expect(post.enabled).toBe(false);
  });

  it('the vertical loop sends back a slow ball and lets a fast one round', () => {
    const table = buildTable();
    const p = table.physics;
    const loop = table.parts.paths.loop;
    const events = [];
    const slow = p.addBall(0, 8, 0, 0, 0);
    p.sendOnPath(slow, loop, 14);
    run(p, 3, events);
    expect(events.some((e) => e.type === 'rampBack' && e.tag === 'loop')).toBe(true);
    expect(events.some((e) => e.type === 'rampDone' && e.tag === 'loop')).toBe(false);
    p.removeBall(slow);
    const fast = p.addBall(0, 8, 0, 0, 0);
    p.sendOnPath(fast, loop, 48);
    let top = 0;
    for (let t = 0; t < 3 && !events.some((e) => e.type === 'rampDone'); t += 1 / 120) {
      p.advance(1 / 120);
      p.readEvents((e) => events.push(e));
      if (fast.mode === 'path') top = Math.max(top, fast.h);
    }
    expect(events.some((e) => e.type === 'rampDone' && e.tag === 'loop')).toBe(true);
    expect(top).toBeGreaterThan(2.5);
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

  it('the loop lights the lock, the diverter turns the Fiat ramp into the Silo, three locks start the multiball', () => {
    const table = buildTable();
    const p = table.physics;
    const log = [];
    const rules = createRules(table, quietOut(log), seeded(3));
    rules.newGame();
    for (let lock = 0; lock < 3; lock++) {
      const ball = p.addBall(0, 8, 0, 0, 0);
      rules.event({ type: 'rampDone', tag: 'loop', value: 30, ball });
      expect(rules.state.lockLit).toBe(true);
      rules.update(0.1);
      expect(table.parts.fiatDiverter.on).toBe(true);
      // Up the Fiat ramp for real: the diverter drops the ball in the Silo
      p.sendOnPath(ball, table.parts.paths.fiat, 40);
      for (let t = 0; t < 2 && ball.mode === 'path'; t += 1 / 60) {
        p.advance(1 / 60);
        p.readEvents((e) => rules.event(e));
        rules.update(1 / 60);
      }
      expect(ball.mode).toBe('held');
      expect(log).toContain('silo');
      rules.update(2);
      p.removeBall(ball);
    }
    expect(rules.state.mb).toBeTruthy();
    expect(log).toContain('pbMultiball');
    for (let i = 0; i < 6; i++) rules.update(0.5);
    expect(p.activeBalls()).toBeGreaterThanOrEqual(3);
  });

  it('the volcano erupts after its hit points; a ball in the crater starts the eruption multiball', () => {
    const table = buildTable();
    const log = [];
    const rules = createRules(table, quietOut(log), seeded(4));
    rules.newGame();
    const p = table.physics;
    const v = table.parts.volcano;
    expect(v.bash.hp).toBe(4);
    for (let i = 3; i >= 0; i--) rules.event({ type: 'bash', tag: 'volcano', value: i });
    rules.update(0.1);
    expect(table.parts.crater.enabled).toBe(true);
    expect(log).toContain('pbEruptionLit');
    const ball = p.addBall(TABLE.crater.x, TABLE.crater.y - 1.2, 0, 8, 0);
    for (let t = 0; t < 1 && ball.mode === 'table'; t += 1 / 60) {
      p.advance(1 / 60);
      p.readEvents((e) => rules.event(e));
      rules.update(1 / 60);
    }
    expect(rules.state.eruption).toBeTruthy();
    expect(v.bash.hp).toBe(5);
    rules.update(3);
    expect(p.activeBalls()).toBeGreaterThanOrEqual(2);
  });

  it('crabs flip when hit, all of them is the frenzy, and they come back', () => {
    const table = buildTable();
    const log = [];
    const rules = createRules(table, quietOut(log), seeded(6));
    rules.newGame();
    const crabs = table.parts.crabs;
    for (let i = 0; i < 3; i++) rules.event({ type: 'hit', tag: 'crab' + i, value: 10 });
    expect(crabs.slice(0, 3).every((c) => c.flipped)).toBe(true);
    expect(log).toContain('pbCrabFrenzy');
    for (let i = 0; i < 20; i++) rules.update(0.5);
    expect(crabs.slice(0, 3).every((c) => !c.flipped)).toBe(true);
  });

  it('the coconut lights the kickback and raises the boar; three bouncers open Le Molière', () => {
    const table = buildTable();
    const log = [];
    const rules = createRules(table, quietOut(log), seeded(8));
    rules.newGame();
    rules.state.kickbackR = false;
    rules.event({ type: 'top', tag: 'coco', value: 9, ball: null });
    rules.update(0.1);
    expect(rules.state.kickbackR).toBe(true);
    expect(table.parts.post.enabled).toBe(true);
    for (let i = 0; i < 12; i++) rules.update(1);
    expect(table.parts.post.enabled).toBe(false);
    for (let i = 0; i < 3; i++) rules.event({ type: 'hit', tag: 'bouncer' + i, value: 10 });
    expect(table.parts.bouncers.every((b) => !b.enabled)).toBe(true);
    expect(log).toContain('pbDoorOpen');
  });

  it('a whole game played by the bot ends with no escaped or stuck ball, and makes the main shots', () => {
    const shots = {};
    for (const seed of [11, 23, 37]) {
      const { rules, t, problems, log } = botGame(seed);
      expect(rules.over, `seed ${seed}: ended within an hour (${Math.round(t / 60)} min, score ${rules.state.score})`).toBe(true);
      expect(problems, `seed ${seed}`).toEqual([]);
      expect(rules.state.score).toBeGreaterThan(0);
      for (const name of log) shots[name] = (shots[name] || 0) + 1;
    }
    // The bot plays the island: the loop, the Fiat ramp, the cellar, the volcano, the crabs, the coconut
    for (const key of ['pbLoop', 'fiat', 'cellar', 'volcano', 'crab', 'coco']) {
      expect(Object.keys(shots).some((k) => k.startsWith(key)), `${key} in ${JSON.stringify(shots)}`).toBe(true);
    }
  }, 300000);
});

describe('flipper texts', () => {
  it('every English key has a French text', () => {
    const missing = Object.keys(TEXTS.en).filter((k) => TEXTS.fr[k] === undefined);
    expect(missing).toEqual([]);
  });

  it('every table label has both languages, and every key the rules say exists', () => {
    expect(Object.keys(TABLE_TEXTS.en).filter((k) => TABLE_TEXTS.fr[k] === undefined)).toEqual([]);
    expect(Object.keys(TABLE_TEXTS.fr).filter((k) => TABLE_TEXTS.en[k] === undefined)).toEqual([]);
    // A few bot games: every text key the rules and missions say has an English and a French text
    const said = new Set();
    for (const seed of [5, 9]) {
      const { log } = botGame(seed, 900);
      for (const k of log) if (/^pb/.test(k)) said.add(k);
    }
    const known = (k) => TEXTS.en[k] !== undefined && TEXTS.fr[k] !== undefined;
    expect([...said].filter((k) => !known(k))).toEqual([]);
  }, 120000);
});
