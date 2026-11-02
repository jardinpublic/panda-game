// Engine from Pipeline Pinball (sfdx-hardis-training), same author.
/*
 * The ten missions of Eul' Flipper, one per world of Pandadventures, and
 * Eul' Grand Hoho (the wizard mode) once all ten are done. A mission starts
 * at Le Molière (the scoop) and runs on the game clock; a mission that runs out
 * of time is simply still to do, with the story of its world on the way out.
 *
 * A mission keeps its state in m, a plain object the checkpoint saves as is.
 * The rules call start(m, api), shot(m, shot, api) for every shot of the ball,
 * and update(m, dt, api); a mission calls api.done() when it is won. goal(m)
 * gives the text key and values of its goal line (index.js GOAL_TOTALS holds
 * what each goal counts to).
 *
 * shot: { name, index } with name one of integration (Rampe Fiat Panda), uat
 * (Rampe du Rhum), preprod (Tour de l'île, the left orbit), orbitRight (Route
 * de la plage), production (Montée du Silo made), scoop (Le Molière), release,
 * bumper, sling, drop (T-A-T-O-U), check (8.6 cans), admin (the kids round the
 * Fiat), rabbit (Georges eul' croco), salesManager (Romain), spinner (index:
 * spins), hotfix (La boule de Mamar), outlane, drain.
 *
 * The mission ids are fixed: rules.js gives mission 3 the giant ball and
 * mission 5 its second ball back on a resume, keeps the kids' raid away from
 * mission 2 and makes Georges swim faster in mission 8.
 */

export const MISSION_COUNT = 10;

const MAJOR_SHOTS = ["integration", "uat", "preprod", "orbitRight"];
const RED = 0xea001e;
const GREEN = 0x45c65a;
const MANGO = 0xfe9339;

export const MISSIONS = [
  // 0 15h pétantes: Romain wants everything before 3 pm sharp, one lit shot after the other
  {
    time: 60,
    start(m, api) {
      m.order = api.shuffle(MAJOR_SHOTS);
      m.n = 0;
      api.light("shot-" + m.order[0], 3, MANGO);
      api.say("chat", "pbChaseStart");
    },
    shot(m, shot, api) {
      if (shot.name !== m.order[m.n]) {
        return;
      }
      api.light("shot-" + shot.name, 0);
      m.n++;
      api.award(60000, "pbChaseHit", { n: m.n });
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
      for (const s of MAJOR_SHOTS) {
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
        m.t = 3.4;
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
      for (const s of MAJOR_SHOTS) {
        api.light("shot-" + s, 0);
      }
    }
  },

  // 2 Hoho ma bagnole: kids pop up round the Fiat; hit each before it scratches the car, polish the scratches on the Fiat ramp
  {
    time: 75,
    start(m, api) {
      m.caught = 0;
      m.rise = 1.5;
      m.up = [0, 0, 0];
      m.scratches = 0;
      api.say("chat", "pbBagnoleStart");
    },
    update(m, dt, api) {
      m.rise -= dt;
      if (m.rise <= 0) {
        const free = [0, 1, 2].filter((i) => m.up[i] <= 0);
        if (free.length) {
          const i = free[Math.floor(api.random() * free.length)];
          m.up[i] = 7;
          api.admin(i, true);
        }
        m.rise = 3.2;
      }
      for (let i = 0; i < 3; i++) {
        if (m.up[i] > 0) {
          m.up[i] -= dt;
          if (m.up[i] <= 0) {
            api.admin(i, false);
            m.scratches++;
            api.light("shot-integration", 3, RED);
            api.say("tip", "pbScratched");
          }
        }
      }
    },
    shot(m, shot, api) {
      if (shot.name === "admin" && m.up[shot.index] > 0) {
        m.up[shot.index] = 0;
        api.admin(shot.index, false);
        m.caught++;
        api.award(50000, "pbKidShooed");
      } else if (shot.name === "integration" && m.scratches > 0) {
        m.scratches--;
        m.caught++;
        api.award(80000, "pbPolished");
        if (!m.scratches) {
          api.light("shot-integration", 0);
        }
      }
      if (m.caught >= 6) {
        api.done();
      }
    },
    goal(m) {
      return ["pbGoal2", { n: m.caught }];
    },
    end(m, api) {
      for (let i = 0; i < 3; i++) {
        api.admin(i, false);
      }
      api.light("shot-integration", 0);
    }
  },

  // 3 Plongée langouste: a giant ball dives through the coral (bumpers), finds the lobster's holes (both orbits), then back up the rum ramp
  {
    time: 70,
    start(m, api) {
      m.step = 0;
      m.hits = 0;
      m.holes = [];
      api.setGiant(true);
      api.say("chat", "pbDiveStart");
    },
    shot(m, shot, api) {
      if (m.step === 0 && shot.name === "bumper") {
        m.hits++;
        api.award(6000, "");
        if (m.hits >= 8) {
          m.step = 1;
          m.hits = 0;
          api.award(60000, "pbReefDone");
          api.light("shot-preprod", 2);
          api.light("shot-orbitRight", 2);
        }
      } else if (m.step === 1 && (shot.name === "preprod" || shot.name === "orbitRight") && !m.holes.includes(shot.name)) {
        m.holes.push(shot.name);
        m.hits = m.holes.length;
        api.light("shot-" + shot.name, 0);
        api.award(60000, "pbLobsterHole");
        if (m.holes.length >= 2) {
          m.step = 2;
          api.light("shot-uat", 3, MANGO);
        }
      } else if (m.step === 2 && shot.name === "uat") {
        api.award(120000, "pbLobsterCaught");
        api.done();
      }
    },
    goal(m) {
      return ["pbGoal3_" + m.step, { n: m.hits }];
    },
    end(m, api) {
      api.setGiant(false);
      for (const s of ["preprod", "orbitRight", "uat"]) {
        api.light("shot-" + s, 0);
      }
    }
  },

  // 4 Nuit au Molière: the bouncer looks left, then right; slip past on the orbits in turn, then in through the door
  {
    time: 65,
    start(m, api) {
      m.n = 0;
      m.next = "preprod";
      api.light("shot-preprod", 2);
      api.say("chat", "pbMoliereStart");
    },
    shot(m, shot, api) {
      if (shot.name === m.next) {
        api.light("shot-" + m.next, 0);
        m.n++;
        if (m.next === "scoop") {
          api.award(150000, "pbMoliereIn");
          api.done();
          return;
        }
        api.award(50000, "pbBouncerDodged");
        m.next = m.n >= 4 ? "scoop" : m.next === "preprod" ? "orbitRight" : "preprod";
        api.light("shot-" + m.next, m.next === "scoop" ? 3 : 2);
      } else if (shot.name === "outlane") {
        api.say("tip", "pbBouncerOut");
      }
    },
    goal(m) {
      return ["pbGoal4", { n: m.n }];
    },
    end(m, api) {
      for (const s of ["preprod", "orbitRight", "scoop"]) {
        api.light("shot-" + s, 0);
      }
    }
  },

  // 5 La boule de Mamar: two balls, every big shot is a goal; Mamar's ball (the capture saucer) scores two
  {
    time: 50,
    start(m, api) {
      m.n = 0;
      api.addBall(10);
      api.light("shot-hotfix", 3, MANGO);
      api.say("chat", "pbMamarStart");
    },
    shot(m, shot, api) {
      if (![...MAJOR_SHOTS, "production", "hotfix"].includes(shot.name)) {
        return;
      }
      m.n = Math.min(8, m.n + (shot.name === "hotfix" ? 2 : 1));
      api.award(shot.name === "hotfix" ? 100000 : 50000, "pbBatigol");
      if (m.n >= 8) {
        api.done();
      }
    },
    goal(m) {
      return ["pbGoal5", { n: m.n }];
    },
    end(m, api) {
      api.light("shot-hotfix", 0);
    }
  },

  // 6 Soirée fauve: the ti-punch spinner and the shots on the beat warm the party up to 100%; the bumpers cool it down
  {
    time: 60,
    start(m, api) {
      m.vibe = 40;
      m.jealous = false;
      api.light("shot-preprod", 2);
      api.say("chat", "pbFauveStart");
    },
    shot(m, shot, api) {
      if (shot.name === "spinner") {
        m.vibe = Math.min(100, m.vibe + shot.index * 1.6);
        api.award(2000 * shot.index, "");
      } else if (shot.name === "bumper") {
        m.vibe = Math.max(0, m.vibe - 0.6);
      } else if ([...MAJOR_SHOTS, "drop", "check", "scoop"].includes(shot.name) && api.onBeat()) {
        m.vibe = Math.min(100, m.vibe + 6);
        api.award(40000, "pbOnBeat");
      }
      if (!m.jealous && m.vibe >= 70) {
        m.jealous = true;
        api.say("chat", "pbRomainJealous");
      }
      if (m.vibe >= 100) {
        api.award(150000, "pbFauveDone");
        api.done();
      }
    },
    goal(m) {
      return ["pbGoal6", { n: Math.floor(m.vibe) }];
    },
    end(m, api) {
      api.light("shot-preprod", 0);
    }
  },

  // 7 Old Cous / New Cous: the Fiat ramp (Old Cous), then the rum ramp (New Cous), in turn
  {
    time: 60,
    start(m, api) {
      m.n = 0;
      m.next = "integration";
      api.light("shot-integration", 2);
      api.say("chat", "pbOldNewStart");
    },
    shot(m, shot, api) {
      if (shot.name === m.next) {
        m.n++;
        api.light("shot-" + m.next, 0);
        api.award(50000, m.next === "integration" ? "pbOldCousShot" : "pbNewCousShot");
        m.next = m.next === "integration" ? "uat" : "integration";
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
      api.light("shot-integration", 0);
      api.light("shot-uat", 0);
    }
  },

  // 8 Carottés dans l'Silo: up the Silo to the roof, five hits on Georges eul' croco
  {
    time: 80,
    start(m, api) {
      m.n = 0;
      api.openProduction(true);
      api.light("rabbit", 2);
      api.say("chat", "pbSiloStart");
    },
    shot(m, shot, api) {
      if (shot.name === "rabbit") {
        m.n++;
        api.award(60000, "pbCrocoHit");
        if (m.n >= 5) {
          api.done();
        }
      }
    },
    goal(m) {
      return ["pbGoal8", { n: m.n }];
    },
    end(m, api) {
      api.light("rabbit", 0);
      api.openProduction(false);
    }
  },

  // 9 Babar contre-attaque: grab the green merguez drops, dodge the red ones (Babar's traps)
  {
    time: 55,
    start(m, api) {
      api.resetDrops();
      const order = api.shuffle([0, 1, 2, 3, 4]);
      m.green = order.slice(0, 3);
      m.red = order.slice(3);
      m.hit = [];
      for (let i = 0; i < 5; i++) {
        api.light("drop" + i, 2, m.green.includes(i) ? 0x2e844a : RED);
      }
      api.say("chat", "pbBabarStart");
    },
    shot(m, shot, api) {
      if (shot.name !== "drop" || m.hit.includes(shot.index)) {
        return;
      }
      m.hit.push(shot.index);
      api.light("drop" + shot.index, 0);
      if (m.red.includes(shot.index)) {
        api.fail("pbBabarGotYou", shot.index === m.red[0] ? "pbBabarTrap0" : "pbBabarTrap1");
        return;
      }
      api.award(50000, "pbMerguezGrabbed");
      if (m.green.every((i) => m.hit.includes(i))) {
        api.done();
      }
    },
    goal(m) {
      return ["pbGoal9", { n: m.hit.filter((i) => m.green.includes(i)).length }];
    },
    end(m, api) {
      for (let i = 0; i < 5; i++) {
        api.light("drop" + i, 0);
      }
      api.resetDrops();
    }
  }
];

function nextBurp(m, api) {
  const others = MAJOR_SHOTS.filter((s) => s !== m.target);
  m.target = others[Math.floor(api.random() * others.length)];
  m.phase = "wait";
  m.t = 2 + api.random() * 2.5;
  // The microphone is on (red): the burp comes when it flashes green
  api.light("shot-" + m.target, 1, RED);
}

/**
 * Eul' Grand Hoho: four balls, all the friends cheer, every shot a jackpot;
 * then Romain blocks the way to the beach for the last round: no more clock,
 * a number of flips to hit him three times.
 */
const LAST_ROUND_FLIPS = 40;
const CHEER_EVERY_S = 6;
const CHEERS = 8;

export const WIZARD = {
  time: 100,
  start(m, api) {
    m.jackpots = 0;
    m.boss = 0;
    m.cheer = 1;
    m.cheerAt = CHEER_EVERY_S;
    api.openProduction(true);
    api.salesManager(true);
    for (const s of ["integration", "uat", "preprod", "orbitRight", "scoop"]) {
      api.light("shot-" + s, 3);
    }
    api.addBall(12);
    api.addBall(12);
    api.addBall(12);
    api.say("chat", "pbCheer0");
  },
  update(m, dt, api) {
    // The friends cheer one after the other
    m.cheerAt -= dt;
    if (m.cheerAt <= 0) {
      m.cheerAt = CHEER_EVERY_S;
      api.say("chat", "pbCheer" + (m.cheer % CHEERS));
      m.cheer++;
    }
  },
  shot(m, shot, api) {
    if (["integration", "uat", "preprod", "orbitRight", "scoop"].includes(shot.name)) {
      m.jackpots++;
      api.award(1000000, "pbReleaseJackpot");
      if (m.jackpots === 6) {
        // The last round starts: the clock stops, the flips are counted
        m.flips = LAST_ROUND_FLIPS;
        api.award(0, "pbCodeFreeze", { n: LAST_ROUND_FLIPS });
      }
    } else if (shot.name === "salesManager" && m.jackpots >= 6) {
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
    // Romain stands in front of the way out again, as before
    api.salesManager(true);
    api.openProduction(false);
    for (const s of ["integration", "uat", "preprod", "orbitRight", "scoop"]) {
      api.light("shot-" + s, 0);
    }
  }
};
