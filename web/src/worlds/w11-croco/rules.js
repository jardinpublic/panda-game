// World 11 rules, no rendering: Georges, the (vegan) crocodile of the Lézarde.
// A cycle: 1) dodge  — telegraphed tail swipes (jump) and lunges (step aside);
//          2) feed   — Georges is tired: throw vegetables into his mouth to calm him;
//          3) wrestle — quick-time prompts (arrows / swipes) against a timer.
// Each good prompt takes one point of Georges' fight; when it reaches 0 he is
// pinned and joins the party. A failed or finished round sends you back to the
// dodge phase with Georges a bit weaker and a bit angrier.
// Unit-tested in test/w11-croco.test.js.

export const BANK = { minX: -6, maxX: 6 };
export const DIRS = ['left', 'right', 'up', 'down'];

export const DIFFICULTY = {
  easy: { hearts: 5, health: 9, attacks: 5, telegraph: 1.3, gap: 1.5, lungeHalf: 1.1, feedNeed: 4, feedTime: 16, aimTol: 1.6, sway: 2.5, promptTime: 2.2, prompts: 3, cousEvery: 3.5, par: 130, ramp: 0.06 },
  normal: { hearts: 4, health: 12, attacks: 6, telegraph: 1.0, gap: 1.15, lungeHalf: 1.25, feedNeed: 5, feedTime: 13, aimTol: 1.2, sway: 3.5, promptTime: 1.5, prompts: 4, cousEvery: 4.5, par: 115, ramp: 0.08 },
  hard: { hearts: 3, health: 14, attacks: 7, telegraph: 0.78, gap: 0.85, lungeHalf: 1.4, feedNeed: 6, feedTime: 11, aimTol: 0.9, sway: 4.5, promptTime: 1.05, prompts: 5, cousEvery: 6, par: 105, ramp: 0.1 },
};

export const MOVE_SPEED = 7;
export const JUMP_SPEED = 11;
export const GRAVITY = 32;
export const STRIKE_WINDOW = 0.25;
export const RECOVER_TIME = 0.5;
export const FLIGHT_TIME = 0.6;
export const THROW_COOLDOWN = 0.3;
export const INTRO_TIME = 3;
export const BREAK_TIME = 1.2;
export const INVULN_TIME = 1.2;
export const TAIL_CLEAR = 0.5; // must be this high when the tail passes
export const MIN_TELEGRAPH = 0.55;

/** Telegraph time for the given cycle (Georges gets angrier each cycle). */
export function telegraphFor(cfg, cycle) {
  return Math.max(MIN_TELEGRAPH, cfg.telegraph * (1 - cfg.ramp * cycle));
}

export const SWAY_FREQ = 0.5;

/** Georges' mouth position along the river while he is tired. */
export function crocoXAt(clock, sway) {
  return Math.sin(clock * SWAY_FREQ) * sway;
}

/** Stars from remaining hearts and time (only when Georges was pinned). */
export function starsFor({ won, hearts, maxHearts, time, par }) {
  if (!won) return 0;
  if (hearts >= maxHearts - 1 && time <= par) return 3;
  if (hearts >= Math.ceil(maxHearts / 2) || time <= par) return 2;
  return 1;
}

/** Final score. */
export function scoreFor({ won, hearts, time, par, dodges, fed, pins }) {
  const base = dodges * 25 + fed * 40 + pins * 60;
  if (!won) return base;
  return 2000 + base + hearts * 400 + Math.max(0, Math.round((par - time) * 20));
}

/**
 * Creates the fight. step(dt, {move, jump, throw, swipe}) advances one frame
 * (move -1..1, swipe = 'left'|'right'|'up'|'down'|null) and returns a reused
 * array of events: dodgePhase, telegraph, strike, hit, dodged, babarSpit,
 * tired, feedPhase, throw, cousThrow, fed, splash, sandwich, calmed, recover,
 * wrestlePhase, prompt, pin, wrong, breakFree, won, lost.
 */
export function createCrocoState({ mode = 'normal', random = Math.random } = {}) {
  const cfg = DIFFICULTY[mode] || DIFFICULTY.normal;
  const events = [];

  const s = {
    mode,
    cfg,
    phase: 'intro', // intro | dodge | break | feed | wrestle | won | lost
    next: 'dodge',
    phaseT: INTRO_TIME,
    time: 0,
    cycle: 0,
    hearts: cfg.hearts,
    health: cfg.health,
    px: 0,
    py: 0,
    vy: 0,
    invuln: 0,
    // dodge
    attack: null, // {kind: 'tail'|'lunge', t, tele, x, struck, hit}
    attacksLeft: cfg.attacks,
    attackGap: 1,
    lastKind: 'tail',
    spitDone: false,
    // feed
    calm: 0,
    feedClock: 0,
    veggies: [], // {x, t, from: 'panda'|'cous'}
    throwCd: 0,
    cousT: cfg.cousEvery,
    sandwichUsed: false,
    lastFedFrom: null,
    // wrestle
    prompt: null, // {dir, t, limit}
    promptsDone: 0,
    // stats
    dodges: 0,
    fed: 0,
    pins: 0,
    hitsTaken: 0,
    over: false,
    won: false,

    crocoX() {
      return s.phase === 'feed' ? crocoXAt(s.feedClock, cfg.sway) : 0;
    },

    step(dt, inp = {}) {
      events.length = 0;
      if (s.over) return events;
      s.time += dt;
      s.invuln = Math.max(0, s.invuln - dt);
      s.throwCd = Math.max(0, s.throwCd - dt);
      if (s.phase !== 'wrestle') movePanda(dt, inp);

      switch (s.phase) {
        case 'intro':
        case 'break':
          s.phaseT -= dt;
          if (s.phaseT <= 0) enter(s.next);
          break;
        case 'dodge': stepDodge(dt); break;
        case 'feed': stepFeed(dt, inp); break;
        case 'wrestle': stepWrestle(dt, inp); break;
        default: break;
      }
      // Vegetables still in flight finish their arc whatever the phase.
      stepVeggies(dt);
      return events;
    },

    stars() {
      return starsFor({ won: s.won, hearts: s.hearts, maxHearts: cfg.hearts, time: s.time, par: cfg.par });
    },

    score() {
      return scoreFor({ won: s.won, hearts: s.hearts, time: s.time, par: cfg.par, dodges: s.dodges, fed: s.fed, pins: s.pins });
    },
  };

  function movePanda(dt, inp) {
    const m = Math.max(-1, Math.min(1, inp.move || 0));
    s.px = Math.max(BANK.minX, Math.min(BANK.maxX, s.px + m * MOVE_SPEED * dt));
    if (inp.jump && s.py <= 0 && s.phase !== 'feed') s.vy = JUMP_SPEED;
    s.vy -= GRAVITY * dt;
    s.py += s.vy * dt;
    if (s.py <= 0) { s.py = 0; s.vy = 0; }
  }

  function enter(phase) {
    s.phase = phase;
    if (phase === 'dodge') {
      s.attack = null;
      s.attacksLeft = cfg.attacks;
      s.attackGap = 0.8;
      s.spitDone = false;
      events.push('dodgePhase');
    } else if (phase === 'feed') {
      s.calm = 0;
      s.feedClock = 0;
      s.phaseT = cfg.feedTime;
      s.cousT = cfg.cousEvery * 0.6;
      s.sandwichUsed = false;
      events.push('feedPhase');
    } else if (phase === 'wrestle') {
      s.promptsDone = 0;
      events.push('wrestlePhase');
      newPrompt();
    }
  }

  function toBreak(next, secs = BREAK_TIME) {
    s.phase = 'break';
    s.next = next;
    s.phaseT = secs;
    s.attack = null;
    s.prompt = null;
  }

  // --- Phase 1: dodge -------------------------------------------------------------
  function stepDodge(dt) {
    if (!s.attack) {
      s.attackGap -= dt;
      if (s.attackGap > 0) return;
      if (s.attacksLeft <= 0) {
        events.push('tired');
        toBreak('feed');
        return;
      }
      // Mostly alternate, sometimes repeat to keep you honest.
      const kind = random() < 0.7 ? (s.lastKind === 'tail' ? 'lunge' : 'tail') : s.lastKind;
      s.lastKind = kind;
      let tele = telegraphFor(cfg, s.cycle);
      if (!s.spitDone && s.attacksLeft === cfg.attacks - 1) {
        // Babar spits at Georges: he blinks, the next telegraph is longer.
        s.spitDone = true;
        tele += 0.35;
        events.push('babarSpit');
      }
      s.attack = { kind, t: 0, tele, x: s.px, struck: false, hit: false };
      events.push('telegraph');
      return;
    }
    const a = s.attack;
    a.t += dt;
    if (a.t >= a.tele && !a.struck) {
      a.struck = true;
      events.push('strike');
    }
    if (a.struck && !a.hit && a.t < a.tele + STRIKE_WINDOW && s.invuln <= 0) {
      const caught = a.kind === 'tail' ? s.py < TAIL_CLEAR : Math.abs(s.px - a.x) < cfg.lungeHalf;
      if (caught) {
        a.hit = true;
        s.hearts--;
        s.hitsTaken++;
        s.invuln = INVULN_TIME;
        events.push('hit');
        if (s.hearts <= 0) {
          s.over = true;
          s.phase = 'lost';
          events.push('lost');
          return;
        }
      }
    }
    if (a.t >= a.tele + STRIKE_WINDOW + RECOVER_TIME) {
      if (!a.hit) { s.dodges++; events.push('dodged'); }
      s.attacksLeft--;
      s.attack = null;
      s.attackGap = cfg.gap;
    }
  }

  // --- Phase 2: feed ----------------------------------------------------------------
  function stepFeed(dt, inp) {
    s.feedClock += dt;
    s.phaseT -= dt;
    if (inp.throw && s.throwCd <= 0) {
      s.throwCd = THROW_COOLDOWN;
      s.veggies.push({ x: s.px, t: 0, from: 'panda' });
      events.push('throw');
    }
    s.cousT -= dt;
    if (s.cousT <= 0) {
      s.cousT = cfg.cousEvery;
      // Cous lobs a carrot that lands right in Georges' mouth.
      s.veggies.push({ x: null, t: 0, from: 'cous' });
      events.push('cousThrow');
    }
    if (!s.sandwichUsed && s.feedClock > 2.5 && s.hearts < cfg.hearts) {
      s.sandwichUsed = true;
      s.hearts++;
      events.push('sandwich');
    }
    if (s.phaseT <= 0 && s.phase === 'feed') {
      events.push('recover');
      s.cycle++;
      toBreak('dodge');
    }
  }

  function stepVeggies(dt) {
    for (let i = s.veggies.length - 1; i >= 0; i--) {
      const v = s.veggies[i];
      v.t += dt;
      if (v.t < FLIGHT_TIME) continue;
      s.veggies.splice(i, 1);
      if (s.phase !== 'feed') continue;
      const cx = s.crocoX();
      const inMouth = v.from === 'cous' || Math.abs(v.x - cx) < cfg.aimTol;
      if (inMouth) {
        s.calm++;
        s.fed++;
        s.lastFedFrom = v.from;
        events.push('fed');
        if (s.calm >= cfg.feedNeed) {
          events.push('calmed');
          toBreak('wrestle', 1);
          s.veggies.length = 0;
          return;
        }
      } else {
        events.push('splash');
      }
    }
  }

  // --- Phase 3: wrestle ------------------------------------------------------------------
  function newPrompt() {
    let dir = DIRS[Math.floor(random() * 4)];
    if (s.prompt && dir === s.prompt.dir) dir = DIRS[(DIRS.indexOf(dir) + 1) % 4];
    s.prompt = { dir, t: 0, limit: cfg.promptTime };
    events.push('prompt');
  }

  function stepWrestle(dt, inp) {
    const p = s.prompt;
    if (!p) return;
    p.t += dt;
    if (inp.swipe) {
      if (inp.swipe === p.dir) {
        s.health--;
        s.pins++;
        s.promptsDone++;
        events.push('pin');
        if (s.health <= 0) {
          s.health = 0;
          s.prompt = null;
          s.over = true;
          s.won = true;
          s.phase = 'won';
          events.push('won');
          return;
        }
        if (s.promptsDone >= cfg.prompts) {
          events.push('breakFree');
          s.cycle++;
          toBreak('dodge', 1.4);
          return;
        }
        newPrompt();
        return;
      }
      events.push('wrong');
      s.cycle++;
      toBreak('dodge', 1.4);
      return;
    }
    if (p.t >= p.limit) {
      events.push('wrong');
      s.cycle++;
      toBreak('dodge', 1.4);
    }
  }

  return s;
}
