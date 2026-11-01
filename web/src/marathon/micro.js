// Runs one micro-game: builds the `g` object it plays with, steps time,
// routes input and decides the outcome. Shared by the app and the tests.
//
// A micro-game module (see games/README.md):
//   export default { id, world, input, base, survive, verb: {en, fr}, create(g) }
//   create(g) returns { update(dt), draw(c), press?(x, y), release?(x, y),
//                       move?(x, y), swipe?(dir), bot?() }

import { bubble } from './art.js';

export const MIN_SECONDS = 1.6;

/** Seconds a micro-game lasts at this speed. Bosses slow down less. */
export function microDuration(def, speed, boss = false) {
  const min = def.min ?? MIN_SECONDS;
  return boss ? Math.max(min, def.base / Math.sqrt(speed)) : Math.max(min, def.base / speed);
}

export function startMicro(def, opts) {
  const { W = 400, H = 800, speed = 1, boss = false, random = Math.random, hero = 'panda', hat = 'none', friends = [], lang = 'en', fx, sfx, level = 0 } = opts;
  const duration = microDuration(def, speed, boss);
  const said = [];
  const g = {
    W, H, speed, boss, random, hero, hat, friends, lang, fx, sfx, level, duration,
    elapsed: 0,
    left: duration,
    done: false,
    won: false,
    timeout: false,
    /** Picks the EN or FR text of {en, fr}. */
    tr: (o) => (o && (o[lang] ?? o.en)) ?? '',
    pick: (list) => list[Math.floor(random() * list.length)],
    /** A friend other than the hero and other than `not`. */
    friend(not = []) {
      const pool = friends.filter((id) => id !== hero && !not.includes(id));
      return pool.length ? pool[Math.floor(random() * pool.length)] : 'cous';
    },
    /** First id of `wanted` that is not the hero (so the villain is never yourself). */
    cast(...wanted) {
      return wanted.find((id) => id !== hero) || g.friend(wanted);
    },
    win() {
      if (g.done) return;
      g.done = true;
      g.won = true;
    },
    lose() {
      if (g.done) return;
      g.done = true;
      g.won = false;
    },
    /** Speech bubble above (x, y) for `time` seconds. */
    say(x, y, str, time = 1.2) {
      said.push({ x, y, str, time });
    },
  };
  const inst = def.create(g);
  return {
    def, g, inst,
    step(dt) {
      g.elapsed += dt;
      g.left = Math.max(0, duration - g.elapsed);
      inst.update(dt);
      for (const b of said) b.time -= dt;
      for (let i = said.length - 1; i >= 0; i--) if (said[i].time <= 0) said.splice(i, 1);
      if (!g.done && g.elapsed >= duration) {
        g.timeout = true;
        if (def.survive) g.win();
        else g.lose();
      }
    },
    /** kind: 'press' | 'release' | 'move' | 'swipe'. Ignored once decided. */
    input(kind, a, b) {
      if (g.done) return;
      inst[kind]?.(a, b);
    },
    draw(c) {
      inst.draw(c);
      for (const b of said) bubble(c, b.str, b.x, b.y);
    },
  };
}

/** Applies a bot action ({press:[x,y]}, {release:[x,y]}, {move:[x,y]}, {swipe:dir}). */
export function applyAction(run, action) {
  if (!action) return;
  if (action.press) run.input('press', ...action.press);
  if (action.move) run.input('move', ...action.move);
  if (action.release) run.input('release', ...action.release);
  if (action.swipe) run.input('swipe', action.swipe);
}
