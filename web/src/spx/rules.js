/*
 * 103 SPX rules: Panda's ride home on his 103 SPX, with no drawing at all, so
 * every rule can be tested (see web/test/spx.test.js and DESIGN.md).
 *
 * The rider is at distance `s` along the route (metres) and `x` metres to the
 * right of the road centre (French roads: Panda rides on the right, oncoming
 * cars on the left). Everything else on the road is an entity with its own s
 * and x. The view turns (s, x) into 3D with route.at(s, x).
 *
 *   const rules = createRules({ random, out });
 *   rules.newGame(); rules.pedal() …; rules.update(dt);
 *   rules.setTarget(x) / nudge(dx) · jump() · press() / release()
 *
 * out: say(kind, key, vars, speaker) with kind chat | line (ready text) | pop
 * (big word) | toast (points) | tip; sound(name); event(name, data).
 */
import { buildRoute } from './route.js';
import { gibberish } from './texts.js';

/** Every gameplay number in one place (data-driven, see DESIGN.md § Tuning). */
export const TUNING = {
  roadHalf: 3.5, // kerb, metres from the centre line
  edge: 4.9, // furthest a rider can go (the pavement)
  lane: 1.65, // lane centre
  vmax: 15, // m/s on the road (a tuned 103: 54 km/h)
  vPavement: 9,
  vBoost: 19.5,
  boostTime: 3,
  slipBonus: 2.6,
  accel: 5,
  steerRate: 11, // m/s sideways
  jumpTime: 0.6,
  jumpCooldown: 0.15,
  hearts: 3,
  clopes: 10,
  crashTime: 1.6,
  safeTime: 1.8, // no crash right after getting back on
  controlTime: 2.4,
  targetTime: 185, // seconds; faster than this earns a time bonus
  pedalPerTap: 0.14,
  pedalDecay: 0.12,
  police: { speed: 12.8, startGap: 30, catchGap: 2.4, maxGap: 42 },
  babar: { speed: 14.6, band: 0.04, ahead: -1.0, behind: 0.8 },
  points: {
    metre: 1,
    overtake: 100,
    nearMiss: 120,
    wheelie: 80,
    ouf: 150,
    can: 300,
    keufsLost: 1500,
    azzouzPush: 250,
    bonk: 400,
    pietroDown: 2000,
    duelWon: 3000,
    home: 2000,
    clope: 200,
    heart: 1000,
    perSecondSaved: 30,
    screamBase: 100,
    screamPerSecond: 320,
  },
};

/** Where the fixed events sit, metres into their street (the view puts the café and the bench there too). */
export const SPOTS = { gogol: 55, bench: 80, leg: 30, panne: 70 };

const PL = 0.95; // rider half-length
const PW = 0.32; // rider half-width
const SPAWN_AHEAD = 170;
const KEEP_BEHIND = 40;
const SOLID = new Set(['car', 'parked', 'gogol', 'pineur', 'bench', 'panne', 'impuissant']);

/** Speakers with a face from the cast (the others are drawn by the game). */
export const CAST_SPEAKERS = ['panda', 'cous', 'romain', 'victor', 'aline', 'babar'];

export function createRules(options = {}) {
  const random = options.random || Math.random;
  const out = Object.assign({ say() {}, sound() {}, event() {} }, options.out || {});
  const route = options.route || buildRoute();
  const T = options.tuning || TUNING;
  const P = T.points;
  const sec = Object.fromEntries(route.sections.map((x) => [x.id, x]));

  let nextId = 1;
  let plan = [];
  let later = [];

  const st = {
    route,
    phase: 'pedal', // pedal | ride | down | control | done | over
    pedal: 0,
    t: 0,
    s: 2,
    x: T.lane,
    target: T.lane,
    v: 0,
    hearts: T.hearts,
    clopes: T.clopes,
    score: 0,
    air: 0,
    jumpWait: 0,
    boost: 0,
    slip: false,
    safe: 0,
    down: 0,
    hasLeg: false,
    held: false,
    scream: 0, // seconds of "Pépé Gogoooool" so far
    prompt: null, // { key, kind: 'hold' | 'tap' }
    section: null,
    chase: { on: false, gap: 0, x: 0, done: false },
    duel: null,
    entities: [],
    summary: null,
    stats: { crashes: 0, overtakes: 0, cans: 0, bonks: 0, stolen: 0, screams: 0 },
  };

  const say = (kind, key, vars, speaker) => out.say(kind, key, vars || {}, speaker);
  const award = (points, key, vars) => {
    if (!points) return;
    st.score += points;
    if (key) say('toast', key, Object.assign({ points }, vars || {}));
  };
  const after = (seconds, fn) => later.push({ at: st.t + seconds, fn });
  const add = (e) => {
    const ent = Object.assign({ id: nextId++, v: 0, hl: 0.5, hw: 0.5, x: 0 }, e);
    st.entities.push(ent);
    return ent;
  };
  const find = (kind) => st.entities.find((e) => e.kind === kind);
  /** Schedules fn when the rider gets within `ahead` metres of s. */
  const at = (s, fn, ahead = SPAWN_AHEAD) => plan.push({ trigger: s - ahead, fn });

  /* ---------------- The plan of the ride ---------------- */

  function rand(a, b) {
    return a + (b - a) * random();
  }

  function buildPlan() {
    plan = [];
    const busy = []; // [s0, s1] stretches kept free of parked cars and holes
    const keepFree = (s, r) => busy.push([s - r, s + r]);
    const free = (s) => !busy.some(([a, b]) => s > a && s < b);

    // Events first (they reserve their stretch of road)
    const gogolS = sec.rollin.s0 + SPOTS.gogol;
    keepFree(gogolS, 30);
    at(gogolS, () => add({ kind: 'gogol', s: gogolS, x: 1.1, v: 5.5, hl: 1.0, hw: 0.45, base: 1.1, done: false }), 120);

    const pineurs = [sec.loge.s0 + 95, sec.cluny.s0 + 45, sec.pageot.s0 + 70];
    pineurs.forEach((s, i) => {
      keepFree(s, 18);
      at(s, () => {
        const side = random() < 0.5 ? -1 : 1;
        add({ kind: 'pineur', s, x: side * 4.5, dir: -side, hl: 0.35, hw: 0.35, nth: i, passed: false });
        say('pop', i === 0 ? 'pineurPop' : 'pineurAgain');
        out.event('pineur', { nth: i });
      }, 60);
    });

    // Pépé Impuissant: his old car has broken down in the right lane (it won't start, he can't do a thing)
    const panneS = sec.laville.s0 + SPOTS.panne;
    keepFree(panneS, 25);
    at(panneS, () => {
      add({ kind: 'panne', s: panneS, x: T.lane, hl: 2.0, hw: 0.8 });
      add({ kind: 'impuissant', s: panneS - 2.6, x: 3.9, hl: 0.35, hw: 0.35, passed: false });
      say('pop', 'impuissantPop');
      after(0.8, () => say('chat', 'impuissantSay', null, 'impuissant'));
      out.event('impuissant');
    }, 70);

    const benchS = sec.beaubernard.s0 + SPOTS.bench;
    keepFree(benchS, 45);
    at(benchS, () => add({ kind: 'bench', s: benchS, x: 4.75, hl: 1.1, hw: 0.32, greeted: false }), SPAWN_AHEAD);

    const legS = sec.desmoulins.s0 + SPOTS.leg;
    keepFree(legS, 12);
    keepFree(sec.desmoulins.s0 + 140, 130);
    at(legS, () => {
      add({ kind: 'leg', s: legS, x: 2.6, hl: 0.6, hw: 0.75 });
      say('tip', 'legHint');
    }, 70);

    // The ring: the cars go round the right way, so they all come at Panda
    const ring = route.ring;
    keepFree((ring.s0 + ring.s1) / 2, 40);
    at(ring.s0, () => {
      add({ kind: 'car', s: ring.s0 + 26, x: -T.lane, v: -7, hl: 2.0, hw: 0.8, oncoming: true, ring: true });
      add({ kind: 'car', s: ring.s0 + 46, x: T.lane, v: -7, hl: 2.0, hw: 0.8, oncoming: true, ring: true });
      add({ kind: 'car', s: ring.s1 + 6, x: -T.lane * 0.2, v: -6, hl: 2.0, hw: 0.8, oncoming: true, ring: true });
    }, 45);

    // Traffic, parked cars, speed bumps and holes, street by street
    const quiet = new Set(['petitbois', 'chateau', 'zup']);
    for (const street of route.sections) {
      if (quiet.has(street.id)) continue;
      const end = street.id === 'charolles' ? street.s1 - 50 : street.s1 - 8;
      // Oncoming cars
      const gapMin = ['barbes', 'desmoulins', 'vernois'].includes(street.id) ? 85 : 65;
      for (let s = street.s0 + rand(15, 40); s < end; s += rand(gapMin, gapMin + 40)) {
        const pos = s;
        // No oncoming car meets Panda right at the broken-down car: he must be able to go round it
        if (pos > panneS + 15 && pos < panneS + 105) continue;
        at(pos, () => add({ kind: 'car', s: pos, x: -T.lane + rand(-0.2, 0.2), v: -rand(9, 12), hl: 2.0, hw: 0.8, oncoming: true }), 150);
      }
      // A slow car to overtake (not where Pépé Gogol is, nor during the fights)
      if (['loge', 'moulin', 'moulin2', 'laville', 'pageot', 'beaubernard'].includes(street.id) && street.s1 - street.s0 > 100) {
        const pos = street.s0 + rand(25, Math.min(60, street.s1 - street.s0 - 60));
        at(pos, () => add({ kind: 'car', s: pos, x: T.lane, v: rand(7.5, 9), hl: 2.0, hw: 0.8, slow: true, passed: false }), 75);
      }
      // Parked cars along the kerbs
      for (let s = street.s0 + 18; s < street.s1 - 15; s += rand(30, 70)) {
        if (!free(s) || random() < 0.35) continue;
        const pos = s;
        const side = random() < 0.5 ? -1 : 1;
        at(pos, () => add({ kind: 'parked', s: pos, x: side * 3.05, hl: 2.0, hw: 0.8, side }));
      }
      // Speed bumps (one in a long street, two in the longest)
      const len = street.s1 - street.s0;
      const bumps = len > 300 ? 2 : len > 110 ? 1 : 0;
      for (let k = 1; k <= bumps; k++) {
        const pos = street.s0 + (len * k) / (bumps + 1) + rand(-10, 10);
        if (!free(pos)) continue;
        keepFree(pos, 6);
        at(pos, () => add({ kind: 'bump', s: pos, x: 0, hl: 0.5, hw: T.edge + 1, done: false }));
      }
      // Potholes
      const holes = len > 200 ? 2 : len > 120 ? 1 : 0;
      for (let k = 0; k < holes; k++) {
        const pos = street.s0 + rand(20, len - 20);
        if (!free(pos)) continue;
        keepFree(pos, 5);
        const x = rand(-2.6, 2.6);
        at(pos, () => add({ kind: 'hole', s: pos, x, hl: 0.55, hw: 0.6 }));
      }
    }
    plan.sort((a, b) => a.trigger - b.trigger);
  }

  /* ---------------- Game ---------------- */

  function newGame() {
    nextId = 1;
    later = [];
    Object.assign(st, {
      phase: 'pedal',
      pedal: 0,
      t: 0,
      s: 2,
      x: T.lane,
      target: T.lane,
      v: 0,
      hearts: T.hearts,
      clopes: T.clopes,
      score: 0,
      air: 0,
      jumpWait: 0,
      boost: 0,
      slip: false,
      safe: 0,
      down: 0,
      hasLeg: false,
      held: false,
      scream: 0,
      prompt: null,
      section: null,
      chase: { on: false, gap: 0, x: 0, done: false },
      duel: null,
      entities: [],
      summary: null,
      stats: { crashes: 0, overtakes: 0, cans: 0, bonks: 0, stolen: 0, screams: 0 },
    });
    buildPlan();
    say('tip', 'pedal');
  }

  /** One tap on the pedal: enough taps start the engine. */
  function pedal() {
    if (st.phase !== 'pedal') return;
    st.pedal = Math.min(1, st.pedal + T.pedalPerTap);
    out.sound('pedal');
    if (st.pedal >= 1) {
      st.phase = 'ride';
      st.v = 4;
      out.sound('start');
      out.event('start');
      say('pop', 'started');
      say('tip', 'controls');
      after(1.5, () => say('chat', 'cheerCous', null, 'cous'));
    }
  }

  function setTarget(x) {
    st.target = Math.max(-T.edge, Math.min(T.edge, x));
  }

  function nudge(dx) {
    setTarget(st.target + dx);
  }

  function jump() {
    if (st.phase !== 'ride' || st.air > 0 || st.jumpWait > 0) return;
    st.air = T.jumpTime;
    out.sound('jump');
    out.event('jump');
  }

  /** Thumb down: pedals before the start; the action of the moment after. */
  function press() {
    if (st.phase === 'pedal') {
      pedal();
      return;
    }
    st.held = true;
    if (st.phase !== 'ride') return;
    tapAzzouz() || tapPietro();
  }

  function release() {
    st.held = false;
    if (st.scream > 0) endScream();
  }

  function crash(reasonKey) {
    if (st.phase !== 'ride' || st.safe > 0) return false;
    st.hearts = Math.max(0, st.hearts - 1);
    st.stats.crashes++;
    st.phase = 'down';
    st.down = T.crashTime;
    st.safe = T.crashTime + T.safeTime;
    st.v = 0;
    st.air = 0;
    st.boost = 0;
    if (st.scream > 0) endScream();
    out.sound('crash');
    out.event('crash', { reason: reasonKey });
    say('toast', reasonKey || 'crash');
    if (st.hearts > 0) say('chat', 'crashPanda', null, 'panda');
    else say('pop', 'dead');
    return true;
  }

  /* ---------------- Pépé Gogol: hold to shout ---------------- */

  function gogolWindow() {
    const g = find('gogol');
    if (!g || g.done) return null;
    const ds = g.s - st.s;
    return ds > -8 && ds < 24 ? g : null;
  }

  function endScream() {
    const len = st.scream;
    st.scream = 0;
    const g = find('gogol');
    if (!g || g.done || len < 0.2) return;
    g.done = true;
    st.stats.screams++;
    const secs = Math.min(3, len);
    const points = Math.round((P.screamBase + P.screamPerSecond * secs) / 10) * 10;
    award(points, 'scream');
    const shout = 'PÉPÉ GOGO' + 'O'.repeat(1 + Math.round(secs * 4)) + 'L !';
    say('line', shout, null, 'panda');
    out.sound('scream');
    out.event('scream', { secs });
    after(0.9, () => {
      say('line', gibberish(random), null, 'gogol');
      out.sound('gibberish');
      out.event('gibberish');
    });
  }

  /* ---------------- Les Azzouz and Pietro Gangi: tap ---------------- */

  function tapAzzouz() {
    const a = st.entities.find((e) => e.kind === 'azzouz' && e.state === 'side' && Math.abs(e.s - st.s) < 3 && Math.abs(e.x - st.x) < 2.8);
    if (!a) return false;
    a.state = 'pushed';
    a.timer = 0;
    award(P.azzouzPush, 'azzouzPushed');
    if (!st.pushedOnce) {
      st.pushedOnce = true;
      say('chat', 'azzouzNo', null, 'panda');
    }
    out.sound('push');
    out.event('push', { id: a.id });
    return true;
  }

  function tapPietro() {
    const p = find('pietro');
    if (!p || p.state === 'down' || p.state === 'leave' || p.state === 'approach') return false;
    if (Math.abs(p.s - st.s) > 3 || Math.abs(p.x - st.x) > 2.9) return false;
    if (!st.hasLeg) {
      if (st.t - (st.noLegAt || -9) > 2) {
        st.noLegAt = st.t;
        say('toast', 'pietroNoLeg');
      }
      return true;
    }
    if (p.reel > 0) return true;
    p.hp--;
    p.reel = 0.8;
    p.s -= 3;
    st.stats.bonks++;
    out.sound('bonk');
    out.event('bonk', { id: p.id, hp: p.hp });
    if (p.hp <= 0) {
      p.state = 'down';
      p.timer = 0;
      award(P.pietroDown, 'pietroDown');
      say('pop', 'pietroDown', { points: P.pietroDown });
    } else {
      award(P.bonk, 'pietroBonk');
    }
    return true;
  }

  /* ---------------- Update ---------------- */

  function update(dt) {
    if (dt <= 0) return;
    dt = Math.min(dt, 0.05);
    if (st.phase === 'pedal') {
      st.pedal = Math.max(0, st.pedal - T.pedalDecay * dt);
      return;
    }
    if (st.phase === 'over') return;
    st.t += dt;
    for (const job of later.filter((j) => j.at <= st.t)) job.fn();
    later = later.filter((j) => j.at > st.t);

    moveRider(dt);
    while (plan.length && plan[0].trigger <= st.s) plan.shift().fn();
    streets();
    for (const e of st.entities) moveEntity(e, dt);
    touch();
    chase(dt);
    duel(dt);
    prompts();
    st.entities = st.entities.filter((e) => !e.gone && e.s > st.s - KEEP_BEHIND && e.s < st.s + 400);
    if (st.phase === 'ride' && st.s >= route.length - 5) finish();
  }

  function moveRider(dt) {
    st.safe = Math.max(0, st.safe - dt);
    st.jumpWait = Math.max(0, st.jumpWait - dt);
    if (st.air > 0) {
      st.air = Math.max(0, st.air - dt);
      if (st.air === 0) st.jumpWait = T.jumpCooldown;
    }
    st.boost = Math.max(0, st.boost - dt);
    if (st.phase === 'down' || st.phase === 'control') {
      st.v = 0;
      st.down -= dt;
      if (st.down <= 0) {
        if (st.hearts <= 0) return gameOver();
        st.phase = 'ride';
      }
      return;
    }
    if (st.phase === 'done') {
      // Into the drive of his house, on the right
      st.x += Math.sign(4.3 - st.x) * Math.min(Math.abs(4.3 - st.x), 2.5 * dt);
      st.v = Math.max(0, st.v - 9 * dt);
      st.s = Math.min(route.length, st.s + st.v * dt);
      return;
    }
    if (st.held && gogolWindow()) {
      st.scream = Math.min(4, st.scream + dt);
    } else if (st.scream > 0 && !st.held) {
      endScream();
    }
    const onPavement = Math.abs(st.x) > T.roadHalf;
    let vmax = onPavement ? T.vPavement : T.vmax;
    if (st.boost > 0) vmax = Math.max(vmax, T.vBoost);
    if (st.slip) vmax += T.slipBonus;
    // Stuck behind something slower going the same way: follow it instead of crashing into it
    for (const e of st.entities) {
      if (!(e.kind === 'car' || e.kind === 'gogol') || e.v <= 0) continue;
      const ds = e.s - st.s;
      if (ds > 0 && ds < e.hl + PL + 1.2 && Math.abs(e.x - st.x) < e.hw + PW) vmax = Math.min(vmax, e.v);
    }
    st.v += Math.max(-12 * dt, Math.min(T.accel * dt, vmax - st.v));
    const dx = st.target - st.x;
    st.x += Math.sign(dx) * Math.min(Math.abs(dx), T.steerRate * dt);
    st.x = Math.max(-T.edge, Math.min(T.edge, st.x));
    st.s += st.v * dt;
    if (st.v > 0.5) st.score += P.metre * st.v * dt;
  }

  function streets() {
    const now = route.sectionAt(st.s);
    if (st.section === now.id) return;
    const prev = st.section;
    st.section = now.id;
    out.event('street', { id: now.id, name: now.name });
    if (now.id === 'zup') {
      say('pop', 'wrongWay');
      say('chat', 'wrongWayPanda', null, 'panda');
      out.sound('horn');
    }
    if (prev === 'zup') startChase();
    if (now.id === 'laville') say('chat', 'romain', null, 'romain');
    if (now.id === 'vernois') startDuel();
    if (now.id === 'barbes') spawnAzzouz();
    if (now.id === 'desmoulins') after(2.5, spawnPietro);
    if (now.id === 'pageot') say('chat', 'victor', null, 'victor');
  }

  function spawnAzzouz() {
    [0, 5.5, 11].forEach((delay, i) =>
      after(delay, () => {
        if (st.phase === 'over' || st.phase === 'done') return;
        const side = st.x > 0.4 ? -1 : 1;
        add({ kind: 'azzouz', s: st.s - 14, x: st.x + side * 2.6, v: st.v + 3, hl: 0.9, hw: 0.4, side, state: 'approach', steal: 0, patience: 7, nth: i, timer: 0 });
      })
    );
  }

  function spawnPietro() {
    if (st.phase === 'over' || st.phase === 'done' || st.section !== 'desmoulins') return;
    const side = st.x > -1 ? -1 : 1;
    add({ kind: 'pietro', s: st.s - 12, x: st.x + side * 2.4, v: st.v + 3, hl: 0.95, hw: 0.42, side, state: 'approach', hp: 3, rams: 0, lunge: 0, clock: 0, reel: 0, timer: 0 });
  }

  function moveEntity(e, dt) {
    switch (e.kind) {
      case 'gogol': {
        e.t = (e.t || 0) + dt;
        e.x = e.base + Math.sin(e.t * 1.3) * 0.45;
        const gap = st.s - e.s;
        const behindPanda = gap > 0 && gap < e.hl + PL + 2 && Math.abs(e.x - st.x) < e.hw + PW + 0.2;
        e.s += (behindPanda ? Math.min(5.5, st.v) : 5.5) * dt;
        if (!e.done && e.s - st.s < -8) e.done = true; // missed him
        break;
      }
      case 'pineur':
        if (Math.abs(e.x) <= 4.6 || Math.sign(e.x) !== e.dir) e.x += e.dir * 1.15 * dt;
        e.walking = Math.abs(e.x) <= 4.6;
        break;
      case 'can':
        if (e.flight > 0) e.flight = Math.max(0, e.flight - dt);
        break;
      case 'azzouz':
        moveAzzouz(e, dt);
        break;
      case 'pietro':
        movePietro(e, dt);
        break;
      case 'babar':
        break; // duel() moves him
      default:
        // A car going Panda's way brakes behind him
        if (e.kind === 'car' && e.v > 0) {
          const gap = st.s - e.s;
          if (gap > 0 && gap < e.hl + PL + 2 && Math.abs(e.x - st.x) < e.hw + PW + 0.2) e.v = Math.min(e.cruise || (e.cruise = e.v), st.v);
          else if (e.cruise) e.v = e.cruise;
        }
        e.s += e.v * dt;
    }
  }

  function moveAzzouz(e, dt) {
    const toward = (x, rate) => {
      const d = x - e.x;
      e.x += Math.sign(d) * Math.min(Math.abs(d), rate * dt);
      e.x = Math.max(-T.edge, Math.min(T.edge, e.x));
    };
    e.timer += dt;
    if (e.state === 'approach') {
      e.v = st.v + 3.5;
      e.s += e.v * dt;
      toward(st.x + e.side * 1.35, 3);
      if (e.s >= st.s - 0.6) {
        e.state = 'side';
        say('chat', 'azzouzSay', null, 'azzouz');
        out.sound('azzouz');
      }
    } else if (e.state === 'side') {
      e.v = st.v + (st.s + 0.2 - e.s) * 2;
      e.s += e.v * dt;
      toward(st.x + e.side * 1.35, 4);
      const close = Math.abs(e.s - st.s) < 2.2 && Math.abs(e.x - st.x) < 1.9;
      e.steal = close ? e.steal + dt : Math.max(0, e.steal - dt);
      e.patience -= dt;
      if (e.steal >= 1.4) {
        st.clopes = Math.max(0, st.clopes - 1);
        st.stats.stolen++;
        e.state = 'leave';
        say('chat', 'azzouzStole', null, 'azzouz');
        say('toast', 'azzouzLost');
        out.sound('steal');
        out.event('steal', { id: e.id });
      } else if (e.patience <= 0) {
        e.state = 'leave';
      }
    } else if (e.state === 'leave') {
      e.v = Math.max(st.v, 8) + 6;
      e.s += e.v * dt;
      toward(e.side * 4, 2);
      if (e.s > st.s + 60) e.gone = true;
    } else if (e.state === 'pushed') {
      e.v = Math.max(0, st.v - 6);
      e.s += e.v * dt;
      toward(e.side * 4.4, 3);
      if (e.s < st.s - 30) e.gone = true;
    }
  }

  function movePietro(e, dt) {
    const toward = (x, rate) => {
      const d = x - e.x;
      e.x += Math.sign(d) * Math.min(Math.abs(d), rate * dt);
      e.x = Math.max(-T.edge, Math.min(T.edge, e.x));
    };
    e.timer += dt;
    e.reel = Math.max(0, e.reel - dt);
    if (e.state === 'approach') {
      e.v = st.v + 3.5;
      e.s += e.v * dt;
      toward(st.x + e.side * 1.9, 3);
      if (e.s >= st.s - 0.8) {
        e.state = 'side';
        e.clock = 0;
        say('chat', 'pietroHello', null, 'pietro');
        out.sound('pietro');
      }
      return;
    }
    if (e.state === 'down') {
      e.v = Math.max(0, e.v - 10 * dt);
      e.s += e.v * dt;
      toward(e.side * 4.6, 3);
      if (e.timer > 3) e.gone = true;
      return;
    }
    if (e.state === 'leave') {
      e.v = Math.max(0, st.v - 5);
      e.s += e.v * dt;
      toward(e.side * 4, 2);
      if (e.s < st.s - 30) e.gone = true;
      return;
    }
    // Alongside: keep level, lunge at Panda every 2 seconds
    const want = e.reel > 0 ? st.s - 3 : st.s + 0.3;
    e.v = st.v + (want - e.s) * 2.2;
    e.s += e.v * dt;
    e.clock += dt;
    if (e.lunge > 0) {
      e.lunge = Math.max(0, e.lunge - dt);
      toward(st.x + e.side * 0.5, 9);
      if (!e.hitThisLunge && st.phase === 'ride' && st.safe <= 0 && st.air === 0 && Math.abs(e.x - st.x) < 1.05 && Math.abs(e.s - st.s) < 1.8) {
        e.hitThisLunge = true;
        e.rams++;
        st.x -= e.side * 1.3;
        st.target = st.x;
        st.v *= 0.75;
        out.sound('ram');
        out.event('ram', { id: e.id });
        if (e.rams >= 3) {
          e.rams = 0;
          crash('pietroRam');
        } else {
          say('toast', 'pietroRam');
        }
      }
    } else {
      toward(st.x + e.side * 1.9, 5);
      if (e.clock > 2 && e.reel === 0) {
        e.clock = 0;
        e.lunge = 0.45;
        e.hitThisLunge = false;
      }
    }
    if (st.s >= sec.desmoulins.s1 - 5) {
      e.state = 'leave';
      say('chat', 'pietroBye', null, 'pietro');
    }
  }

  /** Contacts between Panda and everything on the road. */
  function touch() {
    if (st.phase !== 'ride') return;
    for (const e of st.entities) {
      const ds = e.s - st.s;
      const dx = e.x - st.x;
      const over = Math.abs(ds) < e.hl + PL && Math.abs(dx) < e.hw + PW;
      if (e.kind === 'car' && e.slow && !e.passed && ds < -(e.hl + PL)) {
        e.passed = true;
        st.stats.overtakes++;
        award(P.overtake, 'overtake');
      }
      if (e.kind === 'car' && e.oncoming && !e.passed && ds < 0) {
        e.passed = true;
        if (Math.abs(dx) < 2.1 && st.safe <= 0) award(P.nearMiss, 'nearMiss');
      }
      if ((e.kind === 'pineur' || e.kind === 'impuissant') && !e.passed && ds < -0.6) {
        e.passed = true;
        if (Math.abs(dx) < 1.6 && st.safe <= 0) award(P.ouf, 'ouf');
      }
      if (e.kind === 'bench' && !e.greeted && ds < 55) {
        e.greeted = true;
        say('chat', 'budHello', null, 'bud');
        after(1.3, () => say('chat', 'smoHello', null, 'smo'));
        throwCans(e);
      }
      if (!over) continue;
      if (SOLID.has(e.kind)) {
        // Same way as Panda: one follows the other, nobody crashes (they brake)
        if ((e.kind === 'car' || e.kind === 'gogol') && e.v > 0) continue;
        st.lastHit = e.kind + (e.oncoming ? ':oncoming' : e.slow ? ':slow' : '') + ' ds=' + ds.toFixed(1) + ' dx=' + dx.toFixed(1);
        crash('crash');
        return;
      }
      if (e.kind === 'hole' && st.air === 0) {
        crash('pothole');
        return;
      }
      if (e.kind === 'bump' && !e.done) {
        e.done = true;
        if (st.air > 0) {
          award(P.wheelie, 'wheelie');
        } else {
          st.v *= 0.45;
          say('toast', 'bumpHit');
          out.sound('bump');
          out.event('bump');
        }
      }
      if (e.kind === 'can' && !e.flight && !e.gone) {
        e.gone = true;
        st.boost = T.boostTime;
        st.stats.cans++;
        award(P.can, 'can');
        if (st.stats.cans === 1) say('chat', 'canPanda', null, 'panda');
        out.sound('can');
        out.event('can');
      }
      if (e.kind === 'leg' && !e.gone) {
        e.gone = true;
        st.hasLeg = true;
        say('tip', 'legGot');
        out.sound('pickup');
        out.event('leg');
      }
    }
  }

  function throwCans(bench) {
    for (let i = 0; i < 3; i++) {
      after(0.5 + i * 0.8, () => {
        if (st.phase === 'over' || st.phase === 'done') return;
        const s = Math.max(st.s + 28, bench.s - 25 + i * 22);
        add({ kind: 'can', s, x: rand(-2.6, 2.6), hl: 0.7, hw: 0.8, flight: 0.8, from: bench.id });
        out.sound('throw');
      });
    }
  }

  /* ---------------- Les keufs ---------------- */

  function startChase() {
    if (st.chase.done) return;
    st.chase = { on: true, gap: T.police.startGap, x: st.x, done: false };
    say('pop', 'keufsPop');
    after(0.6, () => say('chat', 'keufsHello', null, 'keufs'));
    out.event('siren', { on: true });
  }

  function chase(dt) {
    const c = st.chase;
    if (!c.on) return;
    if (st.phase === 'ride') c.gap = Math.min(T.police.maxGap, c.gap + (st.v - T.police.speed) * dt);
    c.x += (st.x - c.x) * Math.min(1, dt * 1.5);
    if (st.phase === 'ride' && c.gap < T.police.catchGap) {
      c.on = false;
      c.done = true;
      st.hearts = Math.max(0, st.hearts - 1);
      st.phase = 'control';
      st.down = T.controlTime;
      st.safe = T.controlTime + T.safeTime;
      st.v = 0;
      say('chat', 'keufsCaught', null, 'keufs');
      out.event('siren', { on: false, caught: true });
      out.sound('caught');
      return;
    }
    if (st.s >= sec.beaubernard.s0 + 25) {
      c.on = false;
      c.done = true;
      award(P.keufsLost, 'keufsLost');
      out.event('siren', { on: false });
    }
  }

  /* ---------------- Babar's RCX ---------------- */

  function startDuel() {
    const x = st.x > 0 ? st.x - 1.8 : st.x + 1.8;
    const b = add({ kind: 'babar', s: st.s + 1, x, v: st.v, hl: 0.95, hw: 0.42, lane: x > 0 ? T.lane : -T.lane });
    st.duel = { id: b.id, finish: sec.vernois.s1, over: false, won: null, slipAt: -9 };
    say('chat', 'babarStart', null, 'babar');
    out.sound('rev');
  }

  function duel(dt) {
    const d = st.duel;
    if (!d) return;
    const b = st.entities.find((e) => e.id === d.id);
    st.slip = false;
    if (!b) return;
    if (d.over) {
      b.s += b.v * dt;
      b.v = Math.max(6, b.v - 2 * dt);
      if (b.s > st.s + 50) b.gone = true;
      return;
    }
    const band = Math.max(T.babar.ahead, Math.min(T.babar.behind, (st.s - b.s) * T.babar.band));
    b.v = T.babar.speed + band;
    // Babar keeps out of the way of what is in his lane
    const blocked = st.entities.some((e) => SOLID.has(e.kind) && e !== b && e.s - b.s > 0 && e.s - b.s < 16 && Math.abs(e.x - b.lane) < 1.4);
    if (blocked) b.lane = -b.lane;
    b.x += Math.sign(b.lane - b.x) * Math.min(Math.abs(b.lane - b.x), 3 * dt);
    b.s += b.v * dt;
    // Shoulder to shoulder: they bump apart
    if (Math.abs(b.s - st.s) < 1.7 && Math.abs(b.x - st.x) < 0.9) {
      const push = st.x >= b.x ? 1 : -1;
      st.x = Math.max(-T.edge, Math.min(T.edge, st.x + push * 0.5));
      st.target = st.x;
      b.x -= push * 0.5;
    }
    // Right behind him: his slipstream
    const gap = b.s - st.s;
    if (st.phase === 'ride' && gap > 0.8 && gap < 9 && Math.abs(b.x - st.x) < 0.9) {
      st.slip = true;
      if (st.t - d.slipAt > 3) {
        d.slipAt = st.t;
        say('toast', 'slipstream');
      }
    }
    if (b.s >= d.finish || st.s >= d.finish) {
      d.over = true;
      d.won = st.s >= b.s;
      if (d.won) {
        award(P.duelWon, 'duelWon');
        say('chat', 'babarSulk', null, 'babar');
      } else {
        say('toast', 'duelLost');
        say('chat', 'babarWins', null, 'babar');
      }
      out.event('duel', { won: d.won });
    }
  }

  /* ---------------- What the thumb can do now ---------------- */

  function prompts() {
    st.prompt = null;
    if (st.phase !== 'ride') return;
    if (gogolWindow()) {
      st.prompt = { key: 'gogolHint', kind: 'hold' };
      return;
    }
    const a = st.entities.find((e) => e.kind === 'azzouz' && e.state === 'side');
    if (a) {
      st.prompt = { key: 'azzouzHint', kind: 'tap' };
      return;
    }
    const p = find('pietro');
    if (p && (p.state === 'side') && st.hasLeg) st.prompt = { key: 'pietroHint', kind: 'tap' };
  }

  /* ---------------- The end ---------------- */

  function finish() {
    st.phase = 'done';
    st.prompt = null;
    const time = st.t;
    const bonuses = [
      { key: 'bonusHome', points: P.home },
      { key: 'bonusClopes', vars: { n: st.clopes }, points: st.clopes * P.clope },
      { key: 'bonusHearts', vars: { n: st.hearts }, points: st.hearts * P.heart },
      { key: 'bonusTime', vars: { time: clock(time) }, points: Math.round(Math.max(0, T.targetTime - time) * P.perSecondSaved) },
    ];
    for (const b of bonuses) st.score += b.points;
    st.score = Math.round(st.score);
    st.summary = { finished: true, score: st.score, time, clopes: st.clopes, hearts: st.hearts, bonuses, stats: { ...st.stats } };
    out.sound('finish');
    out.event('finish', st.summary);
    say('chat', 'homePanda', null, 'panda');
    after(2.2, () => say('chat', 'homeAline', null, 'aline'));
  }

  function gameOver() {
    st.phase = 'over';
    st.prompt = null;
    st.score = Math.round(st.score);
    st.summary = { finished: false, score: st.score, time: st.t, clopes: st.clopes, hearts: 0, bonuses: [], stats: { ...st.stats } };
    out.sound('over');
    out.event('over', st.summary);
  }

  return { state: st, route, sec, newGame, update, pedal, setTarget, nudge, jump, press, release, tuning: T };
}

/** 2:05 style clock. */
export function clock(seconds) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
