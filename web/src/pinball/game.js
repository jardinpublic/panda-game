// "Eul' Flipper" rules: balls, scoring, missions, multiball, ball save, skill
// shot, end-of-ball bonus. Pure logic on top of physics.js (no DOM, no sound):
// it reports what happened through `out` callbacks, so tests can play it.
//
//   const game = createPinball({ out });
//   game.update(dt, { left, right, nudge });   // every frame
//   game.state.over                            // true at game over

import { step, ball as makeBall, flipperTip } from './physics.js';
import { buildTable, L, DRAIN_Y } from './table.js';

export const BALLS = 3;
export const BALL_SAVE = 10; // seconds after each launch
export const MISSION_TIME = 40;

/** The missions Violaine starts at Le Molière, in order. */
export const MISSIONS = [
  { id: 'bagnole', goal: 3, title: { en: 'Hoho my bagnole!', fr: 'Hoho ma bagnole !' }, how: { en: 'Take the Fiat Panda loop 3 times', fr: 'Fais 3 fois eul’ tour en Fiat Panda' } },
  { id: 'merguez', goal: 4, title: { en: 'Merguez party', fr: 'Merguez party' }, how: { en: 'Knock down the 4 merguez', fr: 'Fais tomber les 4 merguez' } },
  { id: 'clock', goal: 15, title: { en: '15h pétantes', fr: '15h pétantes' }, how: { en: 'Spin the ti-punch 15 times', fr: 'Fais tourner eul’ ti-punch 15 fois' } },
  { id: 'croco', goal: 3, title: { en: 'Croco hunt', fr: 'Chasse au croco' }, how: { en: 'Hit Georges 3 times', fr: 'Touche Georges 3 fois' } },
  { id: 'bande', goal: 3, title: { en: 'The whole gang', fr: 'Toute la bande' }, how: { en: 'Hit Babar, Mamar and Romain', fr: 'Touche Babar, Mamar et Romain' } },
  { id: 'impots', goal: 10, title: { en: 'Pay your taxes', fr: 'Paie tes impôts' }, how: { en: 'Hit the slingshots 10 times', fr: 'Touche les lance-pierres 10 fois' } },
  { id: 'zouk', goal: 5, title: { en: 'Zouk ball', fr: 'Bal zouk' }, how: { en: 'Light T-A-T-O-U', fr: 'Allume T-A-T-O-U' } },
];

/** Plunger launch speed for a pull of 0..1. Flat middle = forgiving skill shot. */
export function launchSpeed(pull) {
  const pts = [[0, 1180], [0.25, 1420], [0.75, 1520], [1, 1960]];
  for (let i = 1; i < pts.length; i++) {
    if (pull <= pts[i][0]) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      return y0 + ((pull - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return pts[pts.length - 1][1];
}

export function createPinball({ out = {}, random = Math.random } = {}) {
  const say = out.say || (() => {}); // (who, key) a friend's line
  const msg = out.msg || (() => {}); // (text {en,fr}, kind) big message
  const sfx = out.sfx || (() => {});
  const fx = out.fx || (() => {}); // (kind, x, y)

  const table = buildTable();
  const world = { balls: [], bodies: table.bodies, flippers: table.flippers, sensors: table.sensors };
  const parts = table.parts;

  const s = {
    score: 0,
    ballNo: 1,
    extra: 0,
    over: false,
    t: 0,
    bonusX: 1,
    tatou: [false, false, false, false, false],
    skillLane: 2,
    skillUntil: 0,
    merguezDown: [false, false, false, false],
    kickbackLit: true,
    crocoHits: 0,
    lockLit: false,
    locked: 0,
    multiball: false,
    jackpotLit: false,
    fauve: 0, // wizard mode seconds left (double scoring)
    mission: null, // {def, n, t, seen}
    nextMission: 0,
    done: [],
    extraGiven: false,
    ballSave: 0,
    plunger: { pull: 0, ready: false },
    cous: 'old',
    combo: 0,
    comboT: 0,
    stats: { lanes: 0, targets: 0, bumpers: 0, missions: 0, loops: 0 },
    endBonus: null, // {lines, total, t} while counting the bonus
    tilt: 0,
    tilted: false,
    lastLeft: false,
    lastRight: false,
    moliere: null, // {ball, t}
  };

  function award(points, x, y) {
    const mult = s.fauve > 0 ? 2 : 1;
    const p = Math.round(points * mult);
    s.score += p;
    if (x != null) fx('points', x, y, p);
    return p;
  }

  function serveBall() {
    const b = makeBall(L.plunger.x, L.plunger.y - 10);
    b.held = 'plunger';
    world.balls.push(b);
    s.plunger = { pull: 0, ready: true };
    s.skillLane = Math.floor(random() * 5);
    s.tilt = 0;
    s.tilted = false;
    return b;
  }

  function launch(b, pull) {
    b.held = null;
    b.x = L.plunger.x;
    b.vx = 0;
    b.vy = -launchSpeed(pull);
    s.plunger.ready = false;
    s.skillUntil = s.t + 5;
    if (s.ballSave <= 0) s.ballSave = BALL_SAVE;
    sfx('launch');
  }

  function autoLaunch(b) {
    b.held = 'plunger';
    b.x = L.plunger.x;
    b.y = L.plunger.y - 10;
    b.vx = b.vy = 0;
    setTimeoutT(0.6, () => launch(b, 0.9));
  }

  // Tiny scheduler on game time (so tests stay deterministic).
  const timers = [];
  function setTimeoutT(delay, fn) {
    timers.push({ at: s.t + delay, fn });
  }

  function progress(id, amount = 1, key) {
    const m = s.mission;
    if (!m || m.def.id !== id || m.complete) return;
    if (key != null) {
      if (m.seen.has(key)) return;
      m.seen.add(key);
    }
    m.n = Math.min(m.def.goal, m.n + amount);
    if (m.n >= m.def.goal) completeMission();
  }

  function completeMission() {
    const m = s.mission;
    m.complete = true;
    s.done.push(m.def.id);
    s.stats.missions++;
    award(150000 + Math.round(m.t) * 2000);
    msg({ en: 'MISSION COMPLETE!', fr: 'MISSION RÉUSSIE !' }, 'big');
    say('panda', 'win');
    sfx('mission');
    s.mission = null;
    if (s.done.length === 3 && !s.extraGiven) {
      s.extraGiven = true;
      s.extra++;
      msg({ en: 'EXTRA BALL!', fr: 'BALLE EN PLUS !' }, 'big');
      sfx('extra');
    }
    if (s.done.length >= MISSIONS.length) startFauve();
  }

  function startMission() {
    const def = MISSIONS[s.nextMission % MISSIONS.length];
    s.nextMission++;
    s.mission = { def, n: 0, t: MISSION_TIME, seen: new Set(), complete: false };
    msg(def.title, 'mission');
    say('violaine', 'mission');
    sfx('mission');
  }

  function startFauve() {
    s.fauve = 40;
    s.done = [];
    msg({ en: 'SOIRÉE FAUVE! x2', fr: 'SOIRÉE FAUVE ! x2' }, 'big');
    startMultiball(3);
  }

  function startMultiball(n) {
    s.multiball = true;
    s.jackpotLit = true;
    s.ballSave = Math.max(s.ballSave, 12);
    // Release locked balls first, then add from the plunger.
    for (const b of world.balls) {
      if (b.held === 'silo') {
        b.held = null;
        b.vx = 220 + random() * 80;
        b.vy = 160;
      }
    }
    s.locked = 0;
    s.lockLit = false;
    const live = world.balls.filter((b) => b.alive).length;
    for (let i = live; i < n; i++) setTimeoutT(0.4 + i * 0.6, () => autoLaunch(serveBall()));
    msg({ en: 'Do it FOR THE SILO!', fr: 'Do it FOR THE SILO !' }, 'big');
    say('aline', 'silo');
    sfx('multiball');
  }

  /** Balls on the table (a ball resting in the Silo lock does not count). */
  function liveBalls() {
    return world.balls.filter((b) => b.alive && b.held !== 'silo');
  }

  // ---- what the ball touches ----------------------------------------------------

  function onHit(b, body, speed) {
    if (s.tilted) return;
    if (body.type === 'flipper') {
      if (speed > 300) sfx('flipHit');
      return;
    }
    if (body.tag === 'bumper') {
      body.flash = 1;
      s.stats.bumpers++;
      award(1000, body.x, body.y - 30);
      sfx('bumper');
      if (random() < 0.25) say(body.who, 'bumper');
      progress('bande', 1, body.who);
    } else if (body.tag === 'sling') {
      body.flash = 1;
      award(150);
      sfx('sling');
      progress('impots');
    } else if (body.tag === 'merguez' && speed > 120) {
      body.active = false;
      s.merguezDown[body.index] = true;
      s.stats.targets++;
      award(2500, (body.x1 + body.x2) / 2, body.y1 - 20);
      sfx('target');
      progress('merguez');
      if (s.merguezDown.every(Boolean)) {
        award(25000);
        s.kickbackLit = true;
        s.lockLit = true;
        msg({ en: 'MERGUEZ! Boar ready, silo open', fr: 'MERGUEZ ! Sanglier prêt, silo ouvert' }, 'big');
        say('panda', 'merguez');
        setTimeoutT(1.2, () => {
          s.merguezDown = [false, false, false, false];
          parts.merguez.forEach((m) => (m.active = true));
        });
      }
    } else if (body.tag === 'croco' && speed > 80) {
      body.flash = 1;
      s.crocoHits++;
      award(5000, body.x, body.y - 30);
      sfx('croco');
      progress('croco');
      if (s.crocoHits % 3 === 0) {
        award(100000);
        msg({ en: 'GEORGES KO! 100,000', fr: 'GEORGES KO ! 100 000' }, 'big');
      }
    }
  }

  function onSensor(b, zone) {
    if (s.tilted && zone.tag !== 'lane') return;
    switch (zone.tag) {
      case 'tatou': {
        const i = zone.index;
        if (s.t < s.skillUntil && i === s.skillLane) {
          s.skillUntil = 0;
          award(50000);
          msg({ en: 'SKILL SHOT! 50,000', fr: 'SKILL SHOT ! 50 000' }, 'big');
          sfx('skill');
        }
        if (!s.tatou[i]) {
          s.tatou[i] = true;
          s.stats.lanes++;
          award(2000);
          sfx('lane');
          progress('zouk', 1, i);
        } else award(500);
        if (s.tatou.every(Boolean)) {
          s.bonusX = Math.min(6, s.bonusX + 1);
          s.lockLit = true;
          award(20000);
          msg({ en: `TATOU! Bonus x${s.bonusX}`, fr: `TATOU ! Bonus x${s.bonusX}` }, 'big');
          setTimeoutT(0.8, () => (s.tatou = [false, false, false, false, false]));
        }
        break;
      }
      case 'orbit': {
        s.stats.loops++;
        s.combo = s.t < s.comboT ? s.combo + 1 : 1;
        s.comboT = s.t + 4;
        s.cous = s.cous === 'old' ? 'new' : 'old';
        award(10000 * s.combo, 60, 420);
        say('cous', s.cous === 'old' ? 'old' : 'new');
        sfx('orbit');
        progress('bagnole');
        if (s.multiball && s.jackpotLit) {
          award(250000);
          msg({ en: 'JACKPOT! 250,000', fr: 'JACKPOT ! 250 000' }, 'big');
          sfx('jackpot');
        }
        break;
      }
      case 'spinner': {
        const spins = Math.max(1, Math.min(12, Math.round(Math.abs(b.vy) / 130)));
        award(200 * spins, 340, 320);
        sfx('spinner');
        progress('clock', spins);
        break;
      }
      case 'silo': {
        const speed = Math.hypot(b.vx, b.vy);
        if (s.lockLit && !s.multiball && speed < 1100) {
          b.held = 'silo';
          b.x = L.silo.x;
          b.y = L.silo.y;
          b.vx = b.vy = 0;
          s.locked++;
          s.lockLit = false;
          award(25000);
          sfx('lock');
          if (s.locked >= 2) startMultiball(3);
          else {
            msg({ en: 'BALL LOCKED IN THE SILO', fr: 'BALLE BLOQUÉE DANS L’SILO' }, 'mission');
            say('aline', 'lock');
            setTimeoutT(0.8, () => autoLaunch(serveBall()));
          }
        } else if (s.multiball && s.jackpotLit) {
          award(500000);
          msg({ en: 'SUPER JACKPOT! 500,000', fr: 'SUPER JACKPOT ! 500 000' }, 'big');
          sfx('jackpot');
        } else award(3000);
        break;
      }
      case 'moliere': {
        const speed = Math.hypot(b.vx, b.vy);
        if (speed > 1300 || s.moliere) {
          award(1000);
          break;
        }
        b.held = 'moliere';
        b.x = L.moliere.x;
        b.y = L.moliere.y;
        b.vx = b.vy = 0;
        s.moliere = { ball: b, t: 1.6 };
        award(25000);
        sfx('saucer');
        if (!s.mission) startMission();
        break;
      }
      case 'kickback':
        if (s.kickbackLit) {
          s.kickbackLit = false;
          b.vx = 40;
          b.vy = -1250;
          msg({ en: 'THE BOAR KICKS IT BACK!', fr: 'EUL’ SANGLIER LA RENVOIE !' }, 'mission');
          say('babar', 'boar');
          sfx('kickback');
        }
        break;
      case 'inlane':
        award(1000);
        break;
      default:
        break;
    }
  }

  // ---- ball lost ----------------------------------------------------------------

  function drain(b) {
    b.alive = false;
    const left = liveBalls().length;
    if (s.ballSave > 0 && !s.tilted) {
      msg({ en: 'Hoho, not yet! Ball saved', fr: 'Hoho, pas encore ! Balle sauvée' }, 'mission');
      sfx('save');
      autoLaunch(serveBall());
      return;
    }
    if (left > 0) {
      if (left === 1 && s.multiball) {
        s.multiball = false;
        s.jackpotLit = false;
      }
      return;
    }
    // Last ball: count the bonus, then next ball or game over.
    s.multiball = false;
    s.jackpotLit = false;
    s.mission = null;
    say('rival', 'drain');
    sfx('drain');
    const lines = s.tilted
      ? []
      : [
          [{ en: 'Lanes', fr: 'Couloirs' }, s.stats.lanes * 3000],
          [{ en: 'Merguez', fr: 'Merguez' }, s.stats.targets * 2000],
          [{ en: 'Bumpers', fr: 'Bumpers' }, s.stats.bumpers * 200],
          [{ en: 'Loops', fr: 'Tours' }, s.stats.loops * 5000],
          [{ en: 'Missions', fr: 'Missions' }, s.stats.missions * 50000],
        ];
    const total = lines.reduce((a, [, v]) => a + v, 0) * s.bonusX;
    s.endBonus = { lines, total, bonusX: s.bonusX, t: 0 };
    s.score += total;
    s.stats = { lanes: 0, targets: 0, bumpers: 0, missions: 0, loops: 0 };
    s.bonusX = 1;
    setTimeoutT(2.8, () => {
      s.endBonus = null;
      world.balls = world.balls.filter((x) => x.alive || x.held === 'silo');
      if (s.extra > 0) {
        s.extra--;
        msg({ en: 'SHOOT AGAIN!', fr: 'REJOUE !' }, 'big');
        serveBall();
      } else if (s.ballNo < BALLS) {
        s.ballNo++;
        serveBall();
      } else {
        s.over = true;
        sfx('over');
      }
    });
  }

  // ---- the frame ----------------------------------------------------------------

  /** input: {left, right: held flippers, nudge: true on the frame of a nudge}. */
  function update(dt, input = {}) {
    if (s.over) return;
    s.t += dt;
    for (let i = timers.length - 1; i >= 0; i--) {
      if (timers[i].at <= s.t) {
        const tm = timers.splice(i, 1)[0];
        tm.fn();
      }
    }
    if (s.endBonus) s.endBonus.t += dt;
    s.ballSave = Math.max(0, s.ballSave - dt);
    s.fauve = Math.max(0, s.fauve - dt);
    s.tilt = Math.max(0, s.tilt - dt * 0.5);

    const plungerBall = world.balls.find((b) => b.alive && b.held === 'plunger');
    const left = !!input.left && !s.tilted;
    let right = !!input.right && !s.tilted;
    // The right flipper button pulls the plunger while a ball waits on it.
    if (plungerBall && s.plunger.ready) {
      if (input.right) s.plunger.pull = Math.min(1, s.plunger.pull + dt / 0.9);
      else if (s.lastRight) launch(plungerBall, s.plunger.pull); // even a quick tap launches a soft shot
      // The left button moves the skill-shot lane.
      if (left && !s.lastLeft) s.skillLane = (s.skillLane + 1) % 5;
      right = false;
    } else {
      // Flipping rotates the lit TATOU lanes (classic lane change).
      if (left && !s.lastLeft) s.tatou = [...s.tatou.slice(1), s.tatou[0]];
      if (right && !s.lastRight) s.tatou = [s.tatou[4], ...s.tatou.slice(0, 4)];
    }
    if (left && !s.lastLeft) sfx('flip');
    if (right && !s.lastRight) sfx('flip');
    s.lastLeft = !!input.left;
    s.lastRight = !!input.right;
    world.flippers[0].pressed = left;
    world.flippers[1].pressed = right;

    if (input.nudge && !s.tilted) {
      s.tilt += 1;
      for (const b of liveBalls()) {
        if (b.held) continue;
        b.vx += (random() - 0.5) * 160;
        b.vy -= 160;
      }
      sfx('nudge');
      if (s.tilt > 3) {
        s.tilted = true;
        s.mission = null;
        s.ballSave = 0;
        msg({ en: 'TILT!', fr: 'TILT !' }, 'big');
      } else if (s.tilt > 2) msg({ en: 'Careful… DANGER', fr: 'Attention… DANGER' }, 'mission');
    }

    // Georges swims across.
    const c = parts.croco;
    const span = L.croco.x1 - L.croco.x0;
    const nx = L.croco.x0 + span * (0.5 + 0.5 * Math.sin(s.t * 0.9));
    c.vx = (nx - c.x) / dt;
    c.x = nx;
    for (const p of [...parts.bumpers, c, ...parts.slings]) p.flash = Math.max(0, (p.flash || 0) - dt * 4);

    step(world, dt, onHit, onSensor);

    // Le Molière holds the ball, then kicks it toward the left flipper.
    if (s.moliere) {
      s.moliere.t -= dt;
      if (s.moliere.t <= 0) {
        const b = s.moliere.ball;
        b.held = null;
        b.vx = -260 - random() * 60;
        b.vy = 240;
        s.moliere = null;
        sfx('kick');
      }
    }

    // Missions run on a clock.
    if (s.mission) {
      s.mission.t -= dt;
      if (s.mission.t <= 0) {
        msg({ en: 'Mission failed… Cheh!', fr: 'Mission ratée… Cheh !' }, 'mission');
        s.mission = null;
      }
    }

    for (const b of world.balls) {
      if (!b.alive || b.held) continue;
      if (b.y > DRAIN_Y || b.x < 0 || b.x > 400 || b.y < -40) drain(b);
      else if (b.still > 2.5) {
        // Never stuck: a gentle shake.
        b.vx += (random() - 0.5) * 300;
        b.vy -= 380;
        b.still = 0;
      }
    }
  }

  serveBall();
  return { state: s, world, update, parts, missions: MISSIONS, flipperTip };
}
