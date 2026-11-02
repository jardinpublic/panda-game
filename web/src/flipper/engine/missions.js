// Engine from Pipeline Pinball (sfdx-hardis-training), same author.
/*
 * The ten missions of Eul' Flipper, one per world of Pandadventures, played on
 * table v2 "L'île de Panda", and Eul' Grand Hoho (the wizard mode) once all
 * ten are done. A mission starts at Le Molière (the scoop behind the
 * bouncers) and runs on the game clock; a mission that runs out of time is
 * simply still to do.
 *
 * A mission keeps its state in m, a plain object. The rules call start(m,
 * api), shot(m, shot, api) for every shot of the ball, and update(m, dt,
 * api); a mission calls api.done() when it is won. goal(m) gives the text key
 * and values of its goal line (index.js GOAL_TOTALS holds what each counts to).
 *
 * shot: { name, index } with name one of volcano (a hard hit on La Montagne
 * Pelée), crater, crab (index: which crab), coco (the coconut on its top
 * switch), magnet (Mamar caught the ball), cellar (La cave à rhum), fiat (the
 * Rampe Fiat Panda made, or diverted), silo (a ball in Le Silo), bouncer, moliere,
 * loop (Le looping de 15h pétantes), hoho, merguez (index: the letter),
 * bumper, sling, outlane.
 */

export const MISSION_COUNT = 10;

const BURP_SHOTS = ["loop", "cellar", "volcano", "fiat", "coco"];
const RED = 0xea001e;
const GREEN = 0x45c65a;
const MANGO = 0xfe9339;
// Where the crabs go to pinch the Fiat (the foot of its ramp)
const FIAT_SPOT = { x: 2.9, y: 10.4 };

export const MISSIONS = [
  // 0 15h pétantes: Romain wants it in order before 3 pm sharp: the loop, the Fiat ramp, the volcano
  {
    time: 60,
    start(m, api) {
      m.order = ["loop", "fiat", "volcano"];
      m.n = 0;
      api.light("shot-loop", 3, MANGO);
      api.say("chat", "pbChaseStart");
    },
    shot(m, shot, api) {
      if (shot.name !== m.order[m.n]) {
        return;
      }
      api.light("shot-" + shot.name, 0);
      m.n++;
      api.award(80000, "pbChaseHit", { n: m.n });
      if (m.n >= m.order.length) {
        api.done();
        return;
      }
      api.light("shot-" + m.order[m.n], 3, MANGO);
    },
    goal(m) {
      const minute = Math.max(0, Math.min(59, 60 - Math.ceil(m.timeLeft)));
      return ["pbGoal0", { n: m.n, hour: "14:" + String(minute).padStart(2, "0") }];
    },
    end(m, api) {
      for (const s of m.order) {
        api.light("shot-" + s, 0);
      }
    }
  },

  // 1 Concert en visio: a burp is coming; mute it by hitting the shot when it flashes green, never before
  {
    time: 60,
    start(m, api) {
      m.n = 0;
      m.target = null;
      api.say("chat", "pbConcertStart");
      nextBurp(m, api);
    },
    update(m, dt, api) {
      m.t -= dt;
      if (m.t > 0) {
        return;
      }
      if (m.phase === "wait") {
        m.phase = "burp";
        m.t = 4;
        api.light("shot-" + m.target, 3, GREEN);
        api.say("toast", "pbBurpNow");
      } else {
        api.light("shot-" + m.target, 0);
        api.say("tip", "pbBurpHeard");
        nextBurp(m, api);
      }
    },
    shot(m, shot, api) {
      if (shot.name !== m.target) {
        return;
      }
      if (m.phase === "burp") {
        api.light("shot-" + m.target, 0);
        m.n++;
        api.award(70000, "pbMuted");
        if (m.n >= 4) {
          api.done();
          return;
        }
        nextBurp(m, api);
      } else {
        // Muted too early: nobody hears the concert either
        m.timeLeft = Math.max(1, m.timeLeft - 5);
        api.say("tip", "pbTooEarly");
      }
    },
    goal(m) {
      return ["pbGoal1", { n: m.n }];
    },
    end(m, api) {
      for (const s of BURP_SHOTS) {
        api.light("shot-" + s, 0);
      }
    }
  },

  // 2 Hoho ma bagnole: three Fiat ramps while the crabs walk to the car to pinch it
  {
    time: 75,
    start(m, api) {
      m.n = 0;
      m.pinches = 0;
      api.crabs.show(3, true);
      api.crabs.target(FIAT_SPOT);
      api.crabs.speed(0.8);
      api.light("shot-fiat", 2);
      api.say("chat", "pbBagnoleStart");
    },
    update(m, dt, api) {
      for (let i = 0; i < api.crabs.count(); i++) {
        if (!api.crabs.isUp(i)) {
          continue;
        }
        const c = api.crabs.position(i);
        if (Math.hypot(c.ax - FIAT_SPOT.x, c.ay - FIAT_SPOT.y) < 0.55) {
          // A crab reached the car: a scratch, and it scuttles back home
          m.pinches++;
          m.timeLeft = Math.max(1, m.timeLeft - 6);
          api.crabs.home(i);
          api.say("tip", "pbScratched");
        }
      }
    },
    shot(m, shot, api) {
      if (shot.name === "crab") {
        api.award(30000, "pbKidShooed");
      } else if (shot.name === "fiat") {
        m.n++;
        api.award(100000, "pbPolished", { n: m.n });
        if (m.n >= 3) {
          api.done();
        }
      }
    },
    goal(m) {
      return ["pbGoal2", { n: m.n }];
    },
    end(m, api) {
      api.light("shot-fiat", 0);
    }
  },

  // 3 Plongée langouste: down the rum cellar twice to find it, then the coconut to crack it open
  {
    time: 70,
    start(m, api) {
      m.step = 0;
      m.n = 0;
      api.light("shot-cellar", 3, MANGO);
      api.say("chat", "pbDiveStart");
    },
    shot(m, shot, api) {
      if (m.step === 0 && shot.name === "cellar") {
        m.n++;
        api.award(70000, "pbLobsterHole");
        if (m.n >= 2) {
          m.step = 1;
          m.n = 0;
          api.light("shot-cellar", 0);
          api.light("shot-coco", 3, MANGO);
        }
      } else if (m.step === 1 && shot.name === "coco") {
        api.award(150000, "pbLobsterCaught");
        api.done();
      }
    },
    goal(m) {
      return ["pbGoal3_" + m.step, { n: m.n }];
    },
    end(m, api) {
      api.light("shot-cellar", 0);
      api.light("shot-coco", 0);
    }
  },

  // 4 Nuit au Molière: knock the bouncers down, slip in through the door, twice
  {
    time: 70,
    start(m, api) {
      m.n = 0;
      api.resetBouncers();
      api.light("shot-moliere", 3, MANGO);
      api.say("chat", "pbMoliereStart");
    },
    shot(m, shot, api) {
      if (shot.name === "bouncer") {
        api.award(20000, "pbBouncerDodged");
      } else if (shot.name === "moliere") {
        m.n++;
        api.award(150000, "pbMoliereIn", { n: m.n });
        if (m.n >= 2) {
          api.done();
        }
      } else if (shot.name === "outlane") {
        api.say("tip", "pbBouncerOut");
      }
    },
    goal(m) {
      return ["pbGoal4", { n: m.n }];
    },
    end(m, api) {
      api.light("shot-moliere", 0);
    }
  },

  // 5 La boule de Mamar: two balls, the magnet always on; four throws by Mamar
  {
    time: 60,
    start(m, api) {
      m.n = 0;
      api.addBall(10);
      api.forceMagnet(true);
      api.light("magnet", 3, MANGO);
      api.say("chat", "pbMamarStart");
    },
    shot(m, shot, api) {
      if (shot.name !== "magnet") {
        return;
      }
      m.n++;
      api.award(80000, "pbBatigol");
      if (m.n >= 4) {
        api.done();
      }
    },
    goal(m) {
      return ["pbGoal5", { n: m.n }];
    },
    end(m, api) {
      api.light("magnet", 0);
    }
  },

  // 6 Soirée fauve: the four crabs dance; flip them all on their backs
  {
    time: 60,
    start(m, api) {
      m.n = 0;
      api.crabs.show(3, true);
      for (let i = 0; i < 3; i++) {
        api.crabs.home(i);
      }
      api.crabs.speed(1.5);
      api.crabs.stay(true);
      api.say("chat", "pbFauveStart");
    },
    shot(m, shot, api) {
      if (shot.name !== "crab") {
        return;
      }
      m.n++;
      api.award(60000, "pbOnBeat");
      if (m.n === 3) {
        api.say("chat", "pbRomainJealous");
      }
      if (m.n >= 4) {
        api.award(150000, "pbFauveDone");
        api.done();
      }
    },
    goal(m) {
      return ["pbGoal6", { n: m.n }];
    }
  },

  // 7 Old Cous / New Cous: the Fiat ramp (Old Cous), then the loop (New Cous), in turn
  {
    time: 60,
    start(m, api) {
      m.n = 0;
      m.next = "fiat";
      api.light("shot-fiat", 2);
      api.say("chat", "pbOldNewStart");
    },
    shot(m, shot, api) {
      if (shot.name === m.next) {
        m.n++;
        api.light("shot-" + m.next, 0);
        api.award(60000, m.next === "fiat" ? "pbOldCousShot" : "pbNewCousShot");
        m.next = m.next === "fiat" ? "loop" : "fiat";
        api.light("shot-" + m.next, 2);
        if (m.n >= 4) {
          api.done();
        }
      } else if (shot.name === "outlane") {
        api.say("tip", "pbEmillePattes");
      }
    },
    goal(m) {
      return ["pbGoal7", { n: m.n }];
    },
    end(m, api) {
      api.light("shot-fiat", 0);
      api.light("shot-loop", 0);
    }
  },

  // 8 Carottés dans l'Silo: the diverter stays on the Silo; two balls in it
  {
    time: 75,
    start(m, api) {
      m.n = 0;
      api.forceDiverter(true);
      api.light("shot-fiat", 3, MANGO);
      api.say("chat", "pbSiloStart");
    },
    shot(m, shot, api) {
      if (shot.name !== "silo") {
        return;
      }
      m.n++;
      api.award(120000, "pbSiloLocked", { n: m.n });
      if (m.n >= 2) {
        api.done();
      }
    },
    goal(m) {
      return ["pbGoal8", { n: m.n }];
    },
    end(m, api) {
      api.light("shot-fiat", 0);
    }
  },

  // 9 Babar contre-attaque: four green MERGUEZ letters, and the red crabs (Babar's) to keep away from
  {
    time: 60,
    start(m, api) {
      m.green = api.shuffle([0, 1, 2, 3, 4, 5, 6]).slice(0, 4);
      m.hit = [];
      for (const i of m.green) {
        api.light("merguez" + i, 2, GREEN);
      }
      for (let i = 0; i < 3; i++) {
        api.crabs.red(i, true);
      }
      api.say("chat", "pbBabarStart");
    },
    shot(m, shot, api) {
      if (shot.name === "merguez" && m.green.includes(shot.index) && !m.hit.includes(shot.index)) {
        m.hit.push(shot.index);
        api.light("merguez" + shot.index, 1, GREEN);
        api.award(60000, "pbMerguezGrabbed");
        if (m.hit.length >= m.green.length) {
          api.done();
        }
      } else if (shot.name === "crab") {
        // A red crab: Babar's trap, a letter lost
        const lost = m.hit.pop();
        if (lost !== undefined) {
          api.light("merguez" + lost, 2, GREEN);
        }
        api.say("tip", lost !== undefined ? "pbBabarTrap0" : "pbBabarTrap1");
      }
    },
    goal(m) {
      return ["pbGoal9", { n: m.hit.length }];
    },
    end(m, api) {
      for (let i = 0; i < 7; i++) {
        api.light("merguez" + i, 0);
      }
    }
  }
];

function nextBurp(m, api) {
  const others = BURP_SHOTS.filter((s) => s !== m.target);
  m.target = others[Math.floor(api.random() * others.length)];
  m.phase = "wait";
  m.t = 2 + api.random() * 2.5;
  // The microphone is on (red): the burp comes when it flashes green
  api.light("shot-" + m.target, 1, RED);
}

/**
 * Eul' Grand Hoho: four balls, all the friends cheer, the volcano erupts every
 * ten seconds, every main shot is a jackpot; then Romain climbs on the volcano
 * to block the way to the beach: no more clock, a number of flips to hit the
 * volcano three times.
 */
const LAST_ROUND_FLIPS = 40;
const CHEER_EVERY_S = 6;
const CHEERS = 8;
const WIZARD_SHOTS = ["loop", "cellar", "volcano", "moliere", "fiat", "coco", "crater"];

export const WIZARD = {
  time: 100,
  start(m, api) {
    m.jackpots = 0;
    m.boss = 0;
    m.cheer = 1;
    m.cheerAt = CHEER_EVERY_S;
    m.eruptAt = 2;
    for (const s of WIZARD_SHOTS) {
      api.light("shot-" + s, 3);
    }
    api.addBall(12);
    api.addBall(12);
    api.addBall(12);
    api.say("chat", "pbCheer0");
  },
  update(m, dt, api) {
    // The friends cheer one after the other; the volcano erupts every ten seconds
    m.cheerAt -= dt;
    if (m.cheerAt <= 0) {
      m.cheerAt = CHEER_EVERY_S;
      api.say("chat", "pbCheer" + (m.cheer % CHEERS));
      m.cheer++;
    }
    m.eruptAt -= dt;
    if (m.eruptAt <= 0) {
      m.eruptAt = 10;
      api.erupt(5);
    }
  },
  shot(m, shot, api) {
    if (m.jackpots < 6 && WIZARD_SHOTS.includes(shot.name)) {
      m.jackpots++;
      api.award(1000000, "pbReleaseJackpot");
      if (m.jackpots === 6) {
        // The last round starts: the clock stops, the flips are counted
        m.flips = LAST_ROUND_FLIPS;
        api.award(0, "pbCodeFreeze", { n: LAST_ROUND_FLIPS });
      }
    } else if (m.jackpots >= 6 && shot.name === "volcano") {
      m.boss++;
      api.award(500000, "pbSalesManagerHit");
      if (m.boss >= 3) {
        api.award(5000000, "pbReleaseDone");
        api.done();
      }
    }
  },
  goal(m) {
    return m.jackpots < 6 ? ["pbGoalWizard", { n: m.jackpots }] : ["pbGoalWizardBoss", { n: m.boss, flips: m.flips }];
  },
  /** During the last round the clock stops: the flips run out instead. */
  frozen(m) {
    return m.jackpots >= 6;
  },
  flipsLeft(m) {
    return m.jackpots >= 6 ? m.flips : null;
  },
  flip(m, api) {
    if (m.jackpots < 6) {
      return;
    }
    m.flips--;
    if (m.flips <= 0) {
      api.fail("pbFreezeOver", "pbFreezeTip");
    }
  },
  end(m, api) {
    for (const s of WIZARD_SHOTS) {
      api.light("shot-" + s, 0);
    }
  }
};
