// A player with human reaction time: the test bot's actions land 0.22 s late.
// Every game must stay winnable at the start of a run for such a player.
import { describe, it, expect } from 'vitest';
import { GAMES, BOSSES } from '../src/marathon/games/index.js';
import { startMicro, applyAction } from '../src/marathon/micro.js';
import { createFx } from '../src/marathon/fx.js';
import { CAST_IDS } from '../src/marathon/art.js';

const REACTION = 0.22;
// Their bots wait for the last safe moment on purpose, so a delayed copy is
// always late; a person gets plenty of warning (sneak: a 0.45 s "Hmm?" tell,
// tipunch: the glass slides ~1 s before the zone,
// coma: a steady beat, the head lifts and the step glows for the whole 0.62 s
// pull before each bonk).
const LAST_MOMENT_BOTS = ['sneak', 'tipunch', 'coma'];
const noSound = new Proxy({}, { get: () => () => {} });

function seeded(seed) {
  let x = seed * 9301 + 49297;
  return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
}

function playLate(def, { speed, seed, boss }) {
  const random = seeded(seed);
  const run = startMicro(def, { W: 400, H: 820, speed, boss, random, hero: 'panda', friends: CAST_IDS, lang: 'en', fx: createFx(random), sfx: noSound });
  const queue = [];
  let t = 0;
  while (!run.g.done && t < 40) {
    const action = run.inst.bot?.();
    // The bot asks repeatedly while the condition holds: a person reacts once.
    if (action && !queue.some((q) => q.key === JSON.stringify(action))) queue.push({ at: t + REACTION, action, key: JSON.stringify(action) });
    while (queue.length && queue[0].at <= t) applyAction(run, queue.shift().action);
    run.step(1 / 60);
    t += 1 / 60;
  }
  return run.g.won;
}

describe.each([...GAMES.map((d) => [d, false]), ...BOSSES.map((d) => [d, true])].filter(([d]) => !LAST_MOMENT_BOTS.includes(d.id)))('human timing %#', (def, boss) => {
  it(`${def.id}: winnable with a 0.22 s reaction at the start of a run`, () => {
    let wins = 0;
    for (let seed = 1; seed <= 12; seed++) wins += playLate(def, { speed: 1, seed, boss }) ? 1 : 0;
    expect(wins, `${def.id} won ${wins}/12`).toBeGreaterThanOrEqual(8);
  });
});
