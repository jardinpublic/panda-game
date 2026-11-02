/*
 * A rider that plays 103 SPX on its own: for the tests (a whole ride, many
 * seeds) and the ?spxauto link. It looks ahead, picks the safest lateral spot,
 * jumps bumps and holes, shouts at Pépé Gogol, pushes Les Azzouz away and
 * whacks Pietro Gangi once it has the table leg.
 */

export function createAutoplay(rules, options = {}) {
  const st = rules.state;
  const reaction = options.reaction || 0; // seconds of delay before it sees a new thing (human-like)
  let pedalClock = 0;
  let holdFor = 0;
  let tapWait = 0;
  const seen = new Map();

  function danger(x) {
    let cost = Math.abs(x - 1.65) * 0.25;
    if (Math.abs(x) > 3.5) cost += 1.5;
    for (const e of st.entities) {
      const solid = ['car', 'parked', 'pineur', 'bench', 'gogol', 'hole', 'panne', 'impuissant'].includes(e.kind);
      if (!solid) continue;
      const ds = e.s - st.s;
      if (ds < -2.5 || ds > 55) continue;
      // A human sees a thing only a moment after it comes into view
      if (reaction && st.t - (seen.get(e.id) ?? (seen.set(e.id, st.t), st.t)) < reaction) continue;
      if ((e.kind === 'car' || e.kind === 'gogol') && e.v > 0) {
        // Same way as us: following it is safe, only slower
        if (ds > 0 && ds < 25 && Math.abs(x - e.x) < e.hw + 0.9) cost += 1.6;
        continue;
      }
      const closing = Math.max(1, st.v - (e.v || 0));
      const tt = Math.max(0, ds) / closing;
      if (tt > 3.2) continue;
      // Where it will be when we get there
      let ex = e.x;
      if (e.kind === 'pineur' && e.walking) ex += e.dir * 1.15 * tt;
      const half = e.hw + 0.38 + 0.45;
      if (e.kind === 'hole') {
        if (Math.abs(x - ex) < half) cost += 4 / (tt + 0.4);
        continue;
      }
      if (Math.abs(x - ex) < half) cost += 120 / (tt + 0.25);
      else if (Math.abs(x - ex) < half + 0.6) cost += 8 / (tt + 0.25);
    }
    for (const e of st.entities) {
      if ((e.kind === 'can' || e.kind === 'leg') && e.s - st.s > 0 && e.s - st.s < 40 && Math.abs(x - e.x) < 0.6) cost -= 2.5;
    }
    // Moving far takes time: favour staying close
    cost += Math.abs(x - st.x) * 0.12;
    return cost;
  }

  function step(dt) {
    if (st.phase === 'pedal') {
      pedalClock -= dt;
      if (pedalClock <= 0) {
        pedalClock = 0.09;
        rules.pedal();
      }
      return;
    }
    if (st.phase !== 'ride') {
      if (st.held) rules.release();
      return;
    }
    let best = st.x;
    let bestCost = Infinity;
    for (let x = -4.8; x <= 4.81; x += 0.2) {
      const c = danger(x);
      if (c < bestCost) {
        bestCost = c;
        best = x;
      }
    }
    rules.setTarget(best);
    // Jump the speed bumps and the holes just before reaching them
    for (const e of st.entities) {
      if (e.kind !== 'bump' && e.kind !== 'hole') continue;
      const ds = e.s - st.s;
      const lead = Math.max(1.2, st.v * 0.12);
      if (ds > 0 && ds < lead + 1.2 && (e.kind === 'bump' ? !e.done : Math.abs(e.x - st.x) < e.hw + 0.6)) rules.jump();
    }
    // The thumb
    tapWait = Math.max(0, tapWait - dt);
    if (holdFor > 0) {
      holdFor -= dt;
      if (holdFor <= 0) rules.release();
      return;
    }
    const p = st.prompt;
    if (p && p.kind === 'hold') {
      rules.press();
      holdFor = 1.8;
    } else if (p && p.kind === 'tap' && tapWait === 0) {
      rules.press();
      rules.release();
      tapWait = 0.35;
    }
  }

  return { step };
}
