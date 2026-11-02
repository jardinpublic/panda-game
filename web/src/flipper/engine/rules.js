// Engine from Pipeline Pinball (sfdx-hardis-training), same author.
/*
 * The rules of Eul' Flipper, table v2 "L'île de Panda": points, balls, the
 * shots of the island (DESIGN.md "Shots for the rules": volcano, crater,
 * crab, coco, magnet, cellar, fiat, silo, bouncer, moliere, loop, hoho,
 * merguez, bumper, sling, outlane, drain), the two multiballs (Le Silo: the
 * loop lights the lock, the Fiat ramp's diverter drops the ball in the Silo,
 * three locks "Do it FOR THE SILO !"; L'Éruption: the volcano erupts after its
 * hit points, a ball in its crater), Le Molière (three bouncers, then the
 * scoop starts a mission), Eul' Grand Hoho (the wizard) and the levels.
 * No Three.js and no page here: the rules read the events of the physics and
 * tell the world module what to show through `out`, so the tests play them in
 * Node.
 *
 * Everything that must survive a pause lives in `s`, a plain object. What only
 * matters for the balls on screen (a ball held in a hole, balls waiting to be
 * launched) lives in `rt`.
 *
 * out: say(kind, key, vars) (kind: toast, coach, tip, chat), sound(name),
 * event(name, data), text(key), onBeat().
 */
import { TABLE } from "./layout.js";
import { GRAVITY } from "./physics.js";
import { MISSIONS, WIZARD, MISSION_COUNT } from "./missions.js";

export const BALLS_PER_GAME = 3;
const COMBO_WINDOW = 3.5;
const SCOOP_HOLD = 1.1;
const SELECT_HOLD = 3.2;
const LAUNCH_SPEED = 62;
const NOTE_LIFE = 25;
// Replay scores: passing one knocks, and gives an extra ball (a free game on the arcade)
const REPLAYS = [5000000, 25000000, 75000000, 150000000, 300000000];
// A rollover seen again within this is the same ball on the same switch
const ROLLOVER_GAP = 0.35;
// On a lost ball, a friend says "Cheh !": this many lines (pbCheh0..)
const CHEH_LINES = 9;
// Marche arrière: fast enough to clear the inlane post every time
const KICKBACK_SPEED = 30;
// The main shots: combos, Victor's aubergine, the missions' lit shots
export const MAJOR = ["loop", "cellar", "volcano", "moliere", "fiat", "coco"];
// The Silo multiball: jackpots on the loop, the Fiat ramp and the cellar, the super jackpot in the Silo
const JACKPOT_SHOTS = ["loop", "fiat", "cellar"];
const JACKPOT = 400000;
const JACKPOT_COLORS = [0x1b96ff, 0x45c65a, 0xffd23f, 0xfe9339, 0xea001e];
const SUPER_MIN = 1500000;
// L'Éruption: the volcano's hit points (more after each eruption), the crater's time open
const VOLCANO_HP = 4;
const VOLCANO_HP_MAX = 8;
const CRATER_S = 20;
const CRATER_HOLD = 1.6;
const ERUPTION_JACKPOT = 300000;
// The crabs: a flipped crab is back on its feet after this; a frenzy brings them all back sooner
const CRAB_BACK_S = 22;
const CRAB_FRENZY_BACK_S = 10;
const CRAB_COMBO_S = 6;
// Eul' coco: the boar's post stays up this long
const POST_S = 10;
// The magnet lights again after this many bumper hits
const MAGNET_BUMPERS = 12;
const MAGNET_HOLD = 1.0;
const CELLAR_HOLD = 1.0;
const SILO_HOLD = 1.2;
// The loops made one after the other: each pays more
const LOOP_WINDOW = 4;
const LOOP_MAX = 10;
// MERGUEZ: the barbecue hurry-up, collected on the coconut, worth less every second
const HURRY_START = 1000000;
const HURRY_FLOOR = 100000;
const HURRY_S = 20;
// A soft plunge into a lit H-O-H-O lane, then the volcano: the skill shots
const SKILL = 100000;
const SUPER_SKILL = 400000;
// Les caves à rhum: what the cellar gives, at random
const CELLAR_AWARDS = [
  { key: "pbCellarRum", points: 150000 },
  { key: "pbCellarLock", effect: "lock" },
  { key: "pbCellarSave", effect: "save" },
  { key: "pbCellarCan", effect: "bonusX" },
  { key: "pbCellarMagnet", effect: "magnet" },
  { key: "pbCellarNote", effect: "note" },
  { key: "pbCellarBoar", effect: "post" },
  { key: "pbCellarRaclette", points: 100000, chat: "pbAlineRaclette" }
];
// The light modes: off, on, slow blink, fast blink
export const OFF = 0;
export const ON = 1;
export const BLINK = 2;
export const FAST = 3;

/** A new game's state. */
export function newState() {
  return {
    v: 2,
    score: 0,
    clock: 0,
    ballNo: 1,
    extraBalls: 0,
    extraLit: false,
    level: 1,
    done: new Array(MISSION_COUNT).fill(false),
    missionsTotal: 0,
    missionsThisLevel: 0,
    notes: 0,
    note: null,
    mission: null,
    select: 0,
    locks: 0,
    lockLit: false,
    mb: null,
    eruption: null,
    bonusX: 1,
    stats: { bumpers: 0, ramps: 0, targets: 0, crabs: 0, missions: 0 },
    bouncers: [true, true, true],
    hoho: [false, false, false, false],
    merguez: [false, false, false, false, false, false, false],
    cocos: 0,
    kickbackR: true,
    postUntil: 0,
    eruptions: 0,
    craterUntil: 0,
    magnetLit: true,
    bumperCount: 0,
    crabCombo: 0,
    lastCrab: -10,
    saveUntil: 0,
    saveArmed: true,
    skill: null,
    combo: 0,
    lastMajor: -10,
    tilt: 0,
    tilted: false,
    replayNext: 0,
    loops: 0,
    lastLoop: -10,
    hurry: null,
    cous: false,
    over: false
  };
}

export function createRules(table, out, random) {
  const physics = table.physics;
  const parts = table.parts;
  let s = newState();
  // Kicks vary a little, as real coils do: no shot repeats itself forever
  physics.setJitter(() => (random() - 0.5) * 0.14);
  physics.setRandom(random);
  const rt = {
    pending: [],
    scoop: null,
    cellar: null,
    magnet: null,
    silo: [],
    crater: null,
    bouncersResetAt: 0,
    crabBack: [0, 0, 0, 0],
    // The fourth crab walks only in its missions
    crabShown: [true, true, true, false],
    crabRed: [false, false, false, false],
    forceDiverter: false,
    forceMagnet: false,
    nextBallAt: 0,
    ending: false,
    served: false,
    laneAt: [-1, -1, -1, -1],
    matched: false,
    overAt: 0
  };

  // The lights the view draws: the state lights them, a mission lights over them
  const lights = table.lights.map((l) => ({ id: l.id, mode: OFF, color: l.color, base: l.color }));
  const lightIndex = new Map(lights.map((l, i) => [l.id, i]));

  const api = {
    award: (points, key, vars) => award(points, key, vars),
    done: () => endMission(true),
    fail: (key, tip) => {
      out.say("tip", tip || key);
      endMission(false, key);
    },
    light(id, mode, color) {
      if (!s.mission) {
        return;
      }
      s.mission.lights[id] = [mode, color || 0];
    },
    say: (kind, key, vars) => out.say(kind, key, vars),
    text: (key) => out.text(key),
    random,
    shuffle(list) {
      const a = list.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    addBall: (save) => {
      launchLater(0.4);
      s.saveUntil = Math.max(s.saveUntil, s.clock + (save || 8));
    },
    onBeat: () => out.onBeat(),
    /** The Fiat ramp's diverter held towards the Silo (or let go). */
    forceDiverter(on) {
      rt.forceDiverter = on;
    },
    /** Mamar's magnet on for the whole mission (or back to the rules). */
    forceMagnet(on) {
      rt.forceMagnet = on;
    },
    /** The crabs: shown (the fourth one), sent towards a point, red, faster. */
    crabs: {
      count: () => parts.crabs.length,
      show(i, on) {
        rt.crabShown[i] = on;
        physics.flipCreature(parts.crabs[i], !on);
        rt.crabBack[i] = 0;
        out.event("crab", { i, shown: on });
      },
      target(point) {
        for (const c of parts.crabs) {
          c.target = point;
        }
      },
      speed(v) {
        for (const c of parts.crabs) {
          c.speed = v;
        }
      },
      red(i, on) {
        rt.crabRed[i] = on;
        out.event("crab", { i, red: on });
      },
      isUp: (i) => rt.crabShown[i] && !parts.crabs[i].flipped,
      position: (i) => parts.crabs[i].shape,
      /** Back home on its feet, as if it had never left. */
      home(i) {
        physics.flipCreature(parts.crabs[i], false);
      },
      /** Flipped crabs stay on their backs (true) until the mission ends. */
      stay(on) {
        rt.crabsStay = on;
      }
    },
    resetBouncers,
    /** The volcano erupts now (the wizard), its crater open for `seconds`. */
    erupt(seconds) {
      s.craterUntil = s.clock + (seconds || 5);
      out.event("volcano", "erupt");
      out.sound("pbJackpot");
    }
  };

  /* ---------- Points ---------- */

  function levelMult() {
    return 1 + 0.5 * (s.level - 1);
  }

  function award(points, key, vars) {
    const value = Math.round(points * levelMult());
    s.score += value;
    if (key) {
      out.say("toast", key, Object.assign({ points: value }, vars || {}));
    }
    // A replay score passed: the knocker, and an extra ball
    if (s.replayNext < REPLAYS.length && s.score >= REPLAYS[s.replayNext]) {
      s.replayNext++;
      s.extraBalls++;
      out.say("coach", "pbReplay");
      out.sound("pbExtra");
    }
    return value;
  }

  /* ---------- Balls ---------- */

  function serve() {
    const ball = physics.addBall(TABLE.plunger.x, TABLE.plunger.y + 0.55, 0, 0, 0);
    s.saveArmed = true;
    s.skill = { lane: Math.floor(random() * 4), until: 0, done: false };
    rt.served = true;
    return ball;
  }

  /** A ball launched later, from the plunger (auto) or out of the Silo. */
  function launchLater(delay, from) {
    rt.pending.push({ at: s.clock + delay, from: from || "plunger" });
  }

  function inPlay() {
    return physics.activeBalls() + rt.pending.length;
  }

  function setFlippers(on) {
    for (const f of Object.values(parts.flippers)) {
      f.enabled = on;
      if (!on) {
        f.held = false;
      }
    }
  }

  function drained() {
    const left = inPlay();
    if (!s.tilted && s.clock < s.saveUntil) {
      launchLater(0.8);
      out.say("toast", "pbBallSaved", {}, "good");
      out.sound("pbSave");
      return;
    }
    if (left > 0) {
      if (left === 1) {
        endMultiball();
      }
      return;
    }
    endBall();
  }

  function endMultiball() {
    if (s.mb) {
      s.mb = null;
      out.event("multiball", false);
    }
    if (s.eruption) {
      s.eruption = null;
      out.event("eruption", false);
    }
    if (s.mission && s.mission.id === "wizard") {
      endMission(false);
    }
  }

  function endBall() {
    rt.ending = true;
    // The ball is lost: a friend never misses the chance
    out.say("chat", "pbCheh" + Math.floor(random() * CHEH_LINES));
    if (s.mission) {
      endMission(false);
    }
    s.mb = null;
    s.eruption = null;
    const lines = [];
    let total = 0;
    if (!s.tilted) {
      const st = s.stats;
      for (const [key, n, each] of [
        ["pbBonusRamps", st.ramps, 10000],
        ["pbBonusTargets", st.targets, 2500],
        ["pbBonusBumpers", st.bumpers, 500],
        ["pbBonusCrabs", st.crabs, 5000],
        ["pbBonusMissions", st.missions, 100000]
      ]) {
        if (n > 0) {
          const v = Math.round(n * each * levelMult());
          total += v;
          lines.push({ key, n, points: v });
        }
      }
      if (s.bonusX > 1) {
        lines.push({ key: "pbBonusX", n: s.bonusX, points: total * (s.bonusX - 1) });
        total *= s.bonusX;
      }
    }
    s.score += total;
    out.event("endOfBall", { lines, total, tilted: s.tilted });
    rt.nextBallAt = s.clock + 2.8;
  }

  function nextBall() {
    rt.ending = false;
    s.stats = { bumpers: 0, ramps: 0, targets: 0, crabs: 0, missions: 0 };
    s.bonusX = 1;
    s.loops = 0;
    s.hurry = null;
    s.magnetLit = true;
    s.postUntil = 0;
    s.crabCombo = 0;
    s.tilt = 0;
    s.tilted = false;
    s.combo = 0;
    s.craterUntil = 0;
    parts.volcano.bash.hp = volcanoHp();
    for (let i = 0; i < parts.crabs.length; i++) {
      physics.flipCreature(parts.crabs[i], !rt.crabShown[i]);
      rt.crabBack[i] = 0;
    }
    out.event("crab", null);
    setFlippers(true);
    physics.setKicks(true);
    if (s.extraBalls > 0) {
      s.extraBalls--;
      out.say("coach", "pbShootAgain");
      serve();
      return;
    }
    if (s.ballNo >= BALLS_PER_GAME) {
      // The match, as on the arcade: the last two digits of the score against a
      // number drawn now; a match is one more ball
      if (!rt.matched) {
        rt.matched = true;
        const drawn = Math.floor(random() * 10) * 10;
        const won = drawn === s.score % 100;
        out.event("match", { drawn, won });
        if (won) {
          out.say("coach", "pbMatchWon");
          out.sound("pbExtra");
          serve();
          return;
        }
      }
      rt.overAt = s.clock + 2.4;
      return;
    }
    s.ballNo++;
    out.say("coach", "pbBallN", { n: s.ballNo });
    serve();
  }

  function summary() {
    return { score: s.score, ms: Math.round(s.clock * 1000), level: s.level, missions: s.missionsTotal, notes: s.notes };
  }

  /* ---------- Missions ---------- */

  function missionDef(id) {
    return id === "wizard" ? WIZARD : MISSIONS[id];
  }

  function missionTime(def) {
    return Math.round(def.time * Math.max(0.7, 1 - 0.05 * (s.level - 1)));
  }

  function startMission(id) {
    const def = missionDef(id);
    s.mission = { id, m: { timeLeft: missionTime(def) }, lights: {} };
    def.start(s.mission.m, api);
    out.event("mission", { id, started: true });
    out.say("coach", id === "wizard" ? "pbReleaseDay" : "pbMission" + id);
    out.sound("pbMission");
  }

  function endMission(ok, why) {
    const mission = s.mission;
    if (!mission) {
      return;
    }
    const def = missionDef(mission.id);
    if (def.end) {
      def.end(mission.m, api);
    }
    // Whatever the mission did to the toys goes back to the rules
    rt.forceDiverter = false;
    rt.forceMagnet = false;
    rt.crabsStay = false;
    for (let i = 0; i < parts.crabs.length; i++) {
      if (rt.crabBack[i] === Infinity) {
        rt.crabBack[i] = s.clock + CRAB_FRENZY_BACK_S;
      }
    }
    api.crabs.target(null);
    api.crabs.speed(0.9);
    for (let i = 0; i < parts.crabs.length; i++) {
      if (rt.crabRed[i]) {
        api.crabs.red(i, false);
      }
    }
    if (rt.crabShown[3]) {
      api.crabs.show(3, false);
    }
    s.mission = null;
    if (mission.id === "wizard") {
      out.event("mission", { id: "wizard", ok });
      levelUp();
      return;
    }
    if (ok) {
      s.done[mission.id] = true;
      s.missionsTotal++;
      s.missionsThisLevel++;
      s.stats.missions++;
      award(300000 + Math.round(mission.m.timeLeft) * 10000, "pbMissionDone");
      out.sound("pbJackpot");
      if (s.missionsThisLevel === 2 || s.missionsThisLevel === 6) {
        s.extraLit = true;
        out.say("toast", "pbExtraLit", {}, "good");
      }
      if (!s.note && random() < 0.4) {
        lightNote();
      }
    }
    out.event("mission", { id: mission.id, ok, why: why || "" });
    s.select = nextMission(s.select);
  }

  function nextMission(from) {
    for (let k = 0; k < MISSION_COUNT; k++) {
      const id = (from + k) % MISSION_COUNT;
      if (!s.done[id]) {
        return id;
      }
    }
    return 0;
  }

  function allDone() {
    return s.done.every(Boolean);
  }

  function levelUp() {
    s.level++;
    s.done = new Array(MISSION_COUNT).fill(false);
    s.missionsThisLevel = 0;
    s.select = 0;
    s.extraLit = true;
    out.event("level", s.level);
    out.say("coach", "pbNextLevel", { n: s.level });
  }

  // Generous at first: 15 seconds, a little less at each level
  function saveTime() {
    return Math.max(6, 16 - s.level);
  }

  /* ---------- Shots ---------- */

  function shot(name, index) {
    const sh = { name, index: index || 0 };
    // Victor's aubergine waits on one lit shot
    if (s.note && s.note.shot === name) {
      s.note = null;
      s.notes++;
      award(1000000, "pbNoteFound");
      out.event("note", s.notes);
    }
    if (MAJOR.includes(name)) {
      s.combo = s.clock - s.lastMajor < COMBO_WINDOW ? Math.min(s.combo + 1, 5) : 1;
      s.lastMajor = s.clock;
      if (s.combo >= 2) {
        award(25000 * s.combo, "pbCombo", { n: s.combo });
        out.sound("pbCombo");
      }
    }
    if (s.mission) {
      missionDef(s.mission.id).shot(s.mission.m, sh, api);
    }
    if (s.mb && !s.mission) {
      multiballShot(name);
    }
  }

  function multiballShot(name) {
    const mb = s.mb;
    const step = mb.step || 0;
    if (mb.lit[name]) {
      mb.lit[name] = false;
      const value = JACKPOT * (step + 1);
      mb.collected = (mb.collected || 0) + value;
      award(value, "pbJackpot", { n: step + 1 });
      out.event("jackpot", false);
      out.sound("pbJackpot");
      if (!JACKPOT_SHOTS.some((n) => mb.lit[n])) {
        mb.superLit = true;
        out.say("coach", "pbSuperLit");
      }
    }
  }

  /** The super jackpot in the Silo pays back the round; the next round is worth a step more. */
  function superJackpot() {
    const mb = s.mb;
    mb.superLit = false;
    for (const n of JACKPOT_SHOTS) {
      mb.lit[n] = true;
    }
    award(Math.max(SUPER_MIN, mb.collected || 0), "pbSuperJackpot");
    mb.collected = 0;
    mb.step = Math.min(JACKPOT_COLORS.length - 1, (mb.step || 0) + 1);
    out.event("jackpot", true);
    out.sound("pbJackpot");
  }

  function startMultiball() {
    s.mb = { lit: { loop: true, fiat: true, cellar: true }, superLit: false, step: 0, collected: 0 };
    s.hurry = null;
    s.lockLit = false;
    s.locks = 0;
    // The Silo lets its balls go, one after the other
    launchLater(0.6, "silo");
    launchLater(1.6, "silo");
    s.saveUntil = s.clock + 14;
    out.event("multiball", true);
    out.say("coach", "pbMultiball");
    out.say("chat", "pbSiloCry");
    out.sound("pbMultiball");
  }

  function lightNote() {
    s.note = { shot: MAJOR[Math.floor(random() * MAJOR.length)], until: s.clock + NOTE_LIFE };
    out.say("toast", "pbNoteLit", {}, "good");
  }

  function lightLock() {
    if (!s.mb && !s.eruption && !s.lockLit && s.locks < 3) {
      s.lockLit = true;
      out.say("toast", "pbLockLit", {}, "good");
      out.sound("pbGate");
    }
  }

  function resetBouncers() {
    for (let i = 0; i < 3; i++) {
      s.bouncers[i] = true;
      parts.bouncers[i].enabled = true;
    }
    out.event("bouncers", null);
  }

  function doorOpen() {
    return !s.bouncers.some(Boolean);
  }

  /** A ball in Le Molière's box, behind the bouncers: they must not pop up on it. */
  function ballBehindDoor() {
    for (const b of physics.balls) {
      if (b.active && b.mode === "table" && Math.abs(b.x - TABLE.moliere.x) < 1.0 && b.y > 12.5 && b.y < 14.4) {
        return true;
      }
    }
    return false;
  }

  function volcanoHp() {
    return Math.min(VOLCANO_HP_MAX, VOLCANO_HP + s.eruptions);
  }

  function hurryValue() {
    const left = Math.max(0, s.hurry.until - s.clock) / HURRY_S;
    return Math.round((HURRY_FLOOR + (HURRY_START - HURRY_FLOOR) * left) / 1000) * 1000;
  }

  /* ---------- The toys ---------- */

  function moliereEnter(ball) {
    award(15000, "");
    shot("moliere");
    if (rt.ending) {
      rt.scoop = { ball, until: s.clock + SCOOP_HOLD, start: null };
      return;
    }
    // Eul' Grand Hoho once the ten are done; otherwise a mission, picked with the flippers while the ball waits
    if (!s.mission && !s.mb && !s.eruption) {
      if (allDone()) {
        rt.scoop = { ball, until: s.clock + 2.2, start: "wizard" };
        out.say("coach", "pbReleaseDayReady");
        return;
      }
      s.select = nextMission(s.select);
      rt.scoop = { ball, until: s.clock + SELECT_HOLD, start: "select" };
      out.event("select", s.select);
      return;
    }
    if (s.extraLit) {
      s.extraLit = false;
      s.extraBalls++;
      out.say("coach", "pbExtraBall");
      out.sound("pbExtra");
    }
    rt.scoop = { ball, until: s.clock + SCOOP_HOLD, start: null };
  }

  function ejectScoop() {
    const hold = rt.scoop;
    rt.scoop = null;
    if (hold.start === "wizard") {
      startMission("wizard");
    } else if (hold.start === "select") {
      out.event("select", -1);
      startMission(s.select);
    }
    if (hold.ball.active && hold.ball.mode === "held") {
      // Out through the open door, down to the flippers, never twice the same way
      physics.release(hold.ball, -1.2 + (random() - 0.5) * 1.6, -9 + (random() - 0.5) * 2);
      out.sound("pbKick");
    }
    // The bouncers stand up again once the ball is out of the box
    rt.bouncersResetAt = s.clock + 1.2;
  }

  function cellarEnter(ball) {
    award(25000, "");
    s.stats.ramps++;
    shot("cellar");
    out.sound("pbLock");
    const a = CELLAR_AWARDS[Math.floor(random() * CELLAR_AWARDS.length)];
    const vars = {};
    switch (a.effect) {
      case "lock":
        lightLock();
        break;
      case "save":
        s.saveUntil = Math.max(s.saveUntil, s.clock + 15);
        break;
      case "bonusX":
        s.bonusX = Math.min(10, s.bonusX + 1);
        vars.n = s.bonusX;
        break;
      case "magnet":
        s.magnetLit = true;
        break;
      case "note":
        if (!s.note) {
          lightNote();
        }
        break;
      case "post":
        s.postUntil = s.clock + POST_S;
        break;
      default:
        break;
    }
    award(a.points || 50000, a.key, vars);
    if (a.chat) {
      out.say("chat", a.chat);
    }
    out.event("cellar", { key: a.key });
    rt.cellar = { ball, until: s.clock + CELLAR_HOLD };
  }

  function craterEnter(ball) {
    s.craterUntil = 0;
    shot("crater");
    rt.crater = { ball, until: s.clock + CRATER_HOLD };
    out.event("volcano", "crater");
    if (s.mission && s.mission.id === "wizard") {
      return;
    }
    s.eruptions++;
    parts.volcano.bash.hp = volcanoHp();
    if (!s.mb && !s.eruption) {
      // L'Éruption: a second ball out of the plunger, and every volcano hit a jackpot
      s.eruption = { jackpots: 0 };
      launchLater(1.2);
      s.saveUntil = Math.max(s.saveUntil, s.clock + 12);
      award(250000, "pbEruption");
      out.event("eruption", true);
      out.sound("pbMultiball");
    } else {
      award(500000, "pbCraterJackpot");
      out.sound("pbJackpot");
    }
  }

  function volcanoBash(hp) {
    if (s.tilted) {
      return;
    }
    out.event("volcano", "hit");
    if (s.eruption) {
      return;
    }
    if (hp > 0) {
      award(20000, "pbVolcanoHit", { n: hp });
      out.sound("pbBumper");
      return;
    }
    // Out of hit points: it erupts, and its crater opens
    s.craterUntil = s.clock + CRATER_S;
    award(100000, "pbEruptionLit");
    out.event("volcano", "erupt");
    out.sound("pbJackpot");
    // A skill shot carried on: the volcano right after a lit lane
    if (s.skill && s.skill.super && s.clock < s.skill.super) {
      s.skill.super = 0;
      award(SUPER_SKILL, "pbSuperSkill");
    }
  }

  function volcanoHit(e) {
    if (e.value < 6) {
      return;
    }
    if (s.eruption) {
      s.eruption.jackpots++;
      award(ERUPTION_JACKPOT + 25000 * Math.min(8, s.eruption.jackpots), "pbJackpot", { n: s.eruption.jackpots });
      out.event("jackpot", false);
      out.sound("pbJackpot");
    }
    if (s.skill && s.skill.super && s.clock < s.skill.super) {
      s.skill.super = 0;
      award(SUPER_SKILL, "pbSuperSkill");
      out.sound("pbJackpot");
    }
    shot("volcano");
  }

  function magnetEnter(ball) {
    award(20000, "");
    shot("magnet");
    out.event("magnet", "catch");
    out.sound("pbLock");
    if (!rt.forceMagnet) {
      s.magnetLit = false;
    }
    rt.magnet = { ball, until: s.clock + MAGNET_HOLD };
  }

  /** Mamar throws the ball: into the crater when it is open, at the volcano, or down to the flippers. */
  function throwFromMagnet(ball) {
    const m = TABLE.magnet;
    let tx;
    let ty;
    let speed;
    if (s.clock < s.craterUntil) {
      tx = TABLE.crater.x;
      ty = TABLE.crater.y;
      speed = 14;
    } else if (random() < 0.6) {
      tx = TABLE.volcano.x;
      ty = TABLE.volcano.y;
      speed = 26;
    } else {
      tx = 1.6 + (random() - 0.5);
      ty = 4;
      speed = 14;
    }
    const d = Math.hypot(tx - m.x, ty - m.y) || 1;
    physics.release(ball, ((tx - m.x) / d) * speed, ((ty - m.y) / d) * speed);
    out.say("toast", "pbBatigol", {}, "good");
    out.event("magnet", "throw");
    out.sound("pbKick");
  }

  function cocoTop() {
    if (s.tilted) {
      return;
    }
    s.cocos++;
    award(50000, "pbCoco", { n: s.cocos });
    out.sound("pbJackpot");
    out.event("coco", s.cocos);
    // Babar's coconut: Marche arrière lit, the boar up between the flippers
    if (!s.kickbackR) {
      s.kickbackR = true;
      out.say("toast", "pbKickbackLit", {}, "good");
    }
    s.postUntil = s.clock + POST_S;
    if ((s.cocos === 3 || s.cocos === 12) && !s.extraLit) {
      s.extraLit = true;
      out.say("toast", "pbExtraLit", {}, "good");
    }
    if (s.hurry) {
      award(hurryValue(), "pbHurryDone");
      s.hurry = null;
      out.event("jackpot", false);
    }
    shot("coco");
  }

  function crabHit(i) {
    const c = parts.crabs[i];
    if (c.flipped || !rt.crabShown[i]) {
      return;
    }
    physics.flipCreature(c, true);
    rt.crabBack[i] = rt.crabsStay ? Infinity : s.clock + CRAB_BACK_S;
    s.crabCombo = s.clock - s.lastCrab < CRAB_COMBO_S ? Math.min(5, s.crabCombo + 1) : 1;
    s.lastCrab = s.clock;
    s.stats.crabs++;
    award(10000 * s.crabCombo, "pbCrab", { n: s.crabCombo });
    out.event("crab", { i, flipped: true });
    out.sound("pbTarget");
    shot("crab", i);
    let standing = 0;
    for (let k = 0; k < parts.crabs.length; k++) {
      if (rt.crabShown[k] && !parts.crabs[k].flipped) {
        standing++;
      }
    }
    if (standing === 0 && !rt.crabsStay) {
      award(200000, "pbCrabFrenzy");
      out.event("jackpot", true);
      out.sound("pbJackpot");
      for (let k = 0; k < parts.crabs.length; k++) {
        rt.crabBack[k] = rt.crabShown[k] ? s.clock + CRAB_FRENZY_BACK_S : 0;
      }
    }
  }

  function siloLock(ball) {
    rt.silo.push({ ball, until: s.clock + SILO_HOLD });
    out.sound("pbLock");
    out.event("silo", "in");
    shot("silo");
    if (s.mb && s.mb.superLit) {
      superJackpot();
    } else if (!s.mb && !s.mission && s.lockLit) {
      s.locks++;
      s.lockLit = false;
      if (s.locks >= 3) {
        startMultiball();
      } else {
        award(50000, "pbLocked", { n: s.locks });
      }
    } else {
      award(25000, "");
    }
  }

  /* ---------- Physics events ---------- */

  function event(e) {
    if (s.over) {
      return;
    }
    const tag = e.tag;
    switch (e.type) {
      case "drain":
        drained();
        return;
      case "hit":
        hit(tag, e);
        return;
      case "bash":
        if (tag === "volcano") {
          volcanoBash(e.value);
        }
        return;
      case "top":
        if (tag === "coco") {
          cocoTop();
        }
        return;
      case "cross":
        cross(tag, e);
        return;
      case "divert":
        if (tag === "fiat") {
          s.stats.ramps++;
          award(50000, "");
          out.sound("pbGate");
          out.event("divert", null);
          shot("fiat");
        }
        return;
      case "rampDone":
        rampDone(tag, e);
        return;
      case "rampBack":
        if (tag === "loop" && !s.tilted) {
          out.say("toast", "pbLoopShort", {}, "bad");
        }
        return;
      case "enter":
        if (tag === "moliere") {
          moliereEnter(e.ball);
        } else if (tag === "cellar") {
          cellarEnter(e.ball);
        } else if (tag === "crater") {
          craterEnter(e.ball);
        } else if (tag === "magnet") {
          magnetEnter(e.ball);
        }
        return;
      default:
        return;
    }
  }

  function hit(tag, e) {
    if (s.tilted) {
      return;
    }
    if (tag.startsWith("bumper")) {
      const i = Number(tag.slice(6));
      s.stats.bumpers++;
      award(2500, "");
      out.sound("pbBumper");
      out.event("bumper", i);
      shot("bumper", i);
      s.bumperCount++;
      if (s.bumperCount % MAGNET_BUMPERS === 0 && !s.magnetLit) {
        s.magnetLit = true;
        out.say("toast", "pbMagnetLit", {}, "good");
      }
    } else if (tag === "slingL" || tag === "slingR") {
      award(510, "");
      out.sound("pbSling");
      out.event("sling", tag === "slingL" ? 0 : 1);
      shot("sling");
    } else if (tag === "volcano") {
      volcanoHit(e);
    } else if (tag.startsWith("crab")) {
      crabHit(Number(tag.slice(4)));
    } else if (tag.startsWith("bouncer")) {
      const i = Number(tag.slice(7));
      if (!s.bouncers[i]) {
        return;
      }
      s.bouncers[i] = false;
      parts.bouncers[i].enabled = false;
      s.stats.targets++;
      award(5000, "");
      out.sound("pbDrop");
      out.event("bouncers", i);
      shot("bouncer", i);
      if (doorOpen()) {
        award(25000, "pbDoorOpen");
        out.sound("pbGate");
      }
    } else if (tag.startsWith("merguez")) {
      const i = Number(tag.slice(7));
      s.stats.targets++;
      award(3000, "");
      out.sound("pbTarget");
      out.event("merguez", i);
      shot("merguez", i);
      if (s.merguez[i]) {
        return;
      }
      s.merguez[i] = true;
      if (s.merguez.every(Boolean)) {
        s.merguez = s.merguez.map(() => false);
        award(50000, "pbMerguezAll");
        if (!s.hurry && !s.mb && !s.eruption) {
          // Babar fires up the barbecue: collect it on his coconut before it burns
          s.hurry = { until: s.clock + HURRY_S };
          out.say("coach", "pbHurryStart");
          out.sound("pbTiltWarn");
        }
      }
    } else if (tag === "cocoBall") {
      award(2000, "");
      out.sound("pbTarget");
    } else if (tag === "post") {
      award(5000, "");
      out.sound("pbBumper");
      out.event("post", "hit");
    } else if (tag === "flipper") {
      out.event("flipperHit", e.value);
    }
  }

  function cross(tag, e) {
    if (s.tilted) {
      return;
    }
    if (tag === "kickbackR" && e.value > 0) {
      if (s.kickbackR) {
        s.kickbackR = false;
        // The bank closes the outlane over its top: the kick lifts the ball over the inlane post
        physics.sendOnPath(e.ball, parts.kickPaths.right, KICKBACK_SPEED);
        out.say("toast", "pbKickbackR", {}, "good");
        out.sound("pbKick");
      }
      return;
    }
    // A rollover fires whichever way the ball rolls over it: down from the
    // plunge, or up out of the bumpers
    if (tag.startsWith("hoho")) {
      const i = Number(tag.slice(4));
      if (s.clock - rt.laneAt[i] > ROLLOVER_GAP) {
        rt.laneAt[i] = s.clock;
        laneCross(i);
      }
      return;
    }
    if ((tag === "outlaneL" || tag === "outlaneR") && e.value > 0) {
      award(10000, "");
      shot("outlane");
      return;
    }
    if ((tag === "inlaneL" || tag === "inlaneR") && e.value > 0) {
      award(1000, "");
    }
  }

  function laneCross(i) {
    award(2000, "");
    out.sound("pbLane");
    shot("hoho", i);
    if (s.skill && !s.skill.done && s.clock < s.skill.until) {
      s.skill.done = true;
      if (i === s.skill.lane) {
        s.skill.super = s.clock + 6;
        award(SKILL, "pbSkillShot");
        out.sound("pbJackpot");
      }
    }
    s.hoho[i] = true;
    if (s.hoho.every(Boolean)) {
      s.hoho = [false, false, false, false];
      if (s.bonusX < 10) {
        s.bonusX++;
      }
      award(10000, "pbBonusXUp", { n: s.bonusX });
    }
  }

  function rampDone(tag, e) {
    if (tag === "loop") {
      s.stats.ramps++;
      s.loops = s.clock - s.lastLoop < LOOP_WINDOW ? Math.min(LOOP_MAX, s.loops + 1) : 1;
      s.lastLoop = s.clock;
      award(75000 * s.loops, "pbLoop", { n: s.loops });
      out.sound("pbRamp");
      out.event("loop", s.loops);
      lightLock();
      shot("loop");
    } else if (tag === "fiat") {
      s.stats.ramps++;
      award(50000, "");
      out.sound("pbRamp");
      if (!s.mission) {
        // Cous's sign flips at every Fiat ramp: Old Cous, New Cous
        s.cous = !s.cous;
        out.say("toast", s.cous ? "pbOldCous" : "pbNewCous");
      }
      out.event("fiat", null);
      shot("fiat");
    } else if (tag === "silo") {
      siloLock(e.ball);
    }
  }

  /* ---------- Lights ---------- */

  function setLight(id, mode, color) {
    const i = lightIndex.get(id);
    if (i === undefined) {
      return;
    }
    lights[i].mode = mode;
    lights[i].color = color || lights[i].base;
  }

  function diverterOn() {
    return rt.forceDiverter || Boolean(s.mb && s.mb.superLit) || (s.lockLit && !s.mb && !s.eruption && !s.mission);
  }

  function refreshLights() {
    for (const l of lights) {
      l.mode = OFF;
      l.color = l.base;
    }
    for (let i = 0; i < 3; i++) {
      setLight("lock" + i, i < s.locks ? ON : i === s.locks && s.lockLit ? FAST : OFF);
    }
    if (!s.mb && !s.lockLit && s.locks < 3) {
      setLight("shot-loop", BLINK);
    }
    if (diverterOn()) {
      setLight("shot-fiat", FAST, 0xfe9339);
    }
    if (s.mb) {
      const color = JACKPOT_COLORS[s.mb.step || 0];
      for (const n of JACKPOT_SHOTS) {
        if (s.mb.lit[n]) {
          setLight("shot-" + n, FAST, color);
        }
      }
    }
    const hp = parts.volcano.bash.hp;
    const craterOpen = s.clock < s.craterUntil;
    for (let i = 0; i < 4; i++) {
      setLight("lava" + i, craterOpen ? FAST : i < 4 - Math.min(4, hp) ? ON : OFF);
    }
    setLight("crater", craterOpen ? FAST : s.eruption ? BLINK : OFF);
    setLight("shot-volcano", craterOpen ? FAST : s.eruption ? FAST : BLINK, craterOpen || s.eruption ? 0xff2a00 : 0);
    setLight("magnet", magnetOn() ? BLINK : OFF);
    for (let i = 0; i < 4; i++) {
      setLight("hoho" + i, s.hoho[i] ? ON : s.skill && !s.skill.done && s.skill.lane === i && rt.served ? FAST : OFF);
      setLight("crab" + i, rt.crabShown[i] && parts.crabs[i].flipped ? ON : OFF);
    }
    for (let i = 0; i < 7; i++) {
      setLight("merguez" + i, s.merguez[i] ? ON : s.hurry ? FAST : OFF);
    }
    setLight("shot-coco", s.hurry ? FAST : BLINK, s.hurry ? 0xff6a3d : 0);
    setLight("shot-cellar", BLINK);
    setLight("kickbackR", s.kickbackR ? ON : OFF);
    setLight("post", s.clock < s.postUntil ? (s.postUntil - s.clock < 2 ? FAST : ON) : OFF);
    // Shoot again: blinking while the ball is saved, lit while an extra ball waits
    setLight("ballSave", s.clock < s.saveUntil ? (s.saveUntil - s.clock < 2 ? FAST : BLINK) : s.extraBalls > 0 ? ON : OFF);
    setLight("extraBall", s.extraLit ? BLINK : OFF);
    if (!s.mission && !s.mb && !s.eruption) {
      setLight("shot-moliere", doorOpen() ? FAST : allDone() ? FAST : BLINK, doorOpen() ? 0 : 0x9b6bff);
    } else if (s.extraLit) {
      setLight("shot-moliere", BLINK, 0xfe9339);
    }
    for (let i = 0; i < MISSION_COUNT; i++) {
      setLight("mission" + i, s.done[i] ? ON : s.mission && s.mission.id === i ? FAST : rt.scoop && rt.scoop.start === "select" && s.select === i ? FAST : OFF);
    }
    setLight("missionWizard", s.mission && s.mission.id === "wizard" ? FAST : allDone() ? BLINK : OFF);
    if (s.note) {
      setLight("note", FAST);
      setLight("shot-" + s.note.shot, FAST, 0xb06bff);
    }
    if (s.mission) {
      for (const [id, [mode, color]] of Object.entries(s.mission.lights)) {
        setLight(id, mode, color);
      }
    }
    if (s.tilted) {
      for (const l of lights) {
        l.mode = OFF;
      }
    }
  }

  function magnetOn() {
    return !s.tilted && (s.magnetLit || rt.forceMagnet);
  }

  /* ---------- The clock ---------- */

  function update(dt) {
    if (s.over) {
      return;
    }
    s.clock += dt;
    for (let i = rt.pending.length - 1; i >= 0; i--) {
      const p = rt.pending[i];
      if (s.clock < p.at) {
        continue;
      }
      if (p.from === "silo") {
        rt.pending.splice(i, 1);
        const ball = physics.addBall(TABLE.silo.x, TABLE.silo.y, 0, 0, 0);
        if (ball) {
          physics.sendOnPath(ball, parts.paths.siloExit, 8);
          out.event("silo", "out");
          out.sound("pbKick");
        }
      } else if (!physics.ballOnPlunger()) {
        rt.pending.splice(i, 1);
        const ball = physics.addBall(TABLE.plunger.x, TABLE.plunger.y + 0.6, 0, LAUNCH_SPEED, 0);
        if (ball) {
          out.sound("pbKick");
        }
      }
    }
    if (rt.scoop && s.clock >= rt.scoop.until) {
      ejectScoop();
    }
    if (rt.cellar && s.clock >= rt.cellar.until) {
      const ball = rt.cellar.ball;
      rt.cellar = null;
      if (ball.active && ball.mode === "held") {
        // The VUK: straight up out of the cellar onto its wire
        physics.sendOnPath(ball, parts.paths.cellar, 40);
        out.event("cellar", { vuk: true });
        out.sound("pbKick");
      }
    }
    if (rt.magnet && s.clock >= rt.magnet.until) {
      const ball = rt.magnet.ball;
      rt.magnet = null;
      if (ball.active && ball.mode === "held") {
        throwFromMagnet(ball);
      }
    }
    if (rt.crater && s.clock >= rt.crater.until) {
      const ball = rt.crater.ball;
      rt.crater = null;
      if (ball.active && ball.mode === "held") {
        // The volcano spits it out, down towards the flippers
        physics.release(ball, (random() - 0.5) * 6, -10);
        out.sound("pbKick");
      }
    }
    for (let i = rt.silo.length - 1; i >= 0; i--) {
      const lock = rt.silo[i];
      if (s.clock >= lock.until) {
        rt.silo.splice(i, 1);
        if (lock.ball.active && lock.ball.mode === "held") {
          physics.sendOnPath(lock.ball, parts.paths.siloExit, 8);
          out.event("silo", "out");
        }
      }
    }
    if (rt.bouncersResetAt && s.clock >= rt.bouncersResetAt && !ballBehindDoor() && !rt.scoop) {
      rt.bouncersResetAt = 0;
      resetBouncers();
    }
    for (let i = 0; i < parts.crabs.length; i++) {
      if (rt.crabBack[i] && s.clock >= rt.crabBack[i]) {
        rt.crabBack[i] = 0;
        if (rt.crabShown[i]) {
          physics.flipCreature(parts.crabs[i], false);
          out.event("crab", { i, flipped: false });
        }
      }
    }
    // The crater closes when nobody got in: the volcano is whole again
    if (s.craterUntil && s.clock >= s.craterUntil) {
      s.craterUntil = 0;
      parts.volcano.bash.hp = volcanoHp();
      out.event("volcano", "close");
    }
    if (rt.ending && s.clock >= rt.nextBallAt && !rt.overAt) {
      nextBall();
    }
    if (rt.overAt && s.clock >= rt.overAt) {
      rt.overAt = 0;
      s.over = true;
      out.event("gameOver", summary());
      return;
    }
    if (s.mission) {
      const m = s.mission.m;
      const def = missionDef(s.mission.id);
      if (def.update) {
        def.update(m, dt, api);
      }
      if (s.mission && !(def.frozen && def.frozen(s.mission.m))) {
        s.mission.m.timeLeft -= dt;
        if (s.mission.m.timeLeft <= 0) {
          endMission(false, "pbTimeUp");
        }
      }
    }
    if (s.note && s.clock > s.note.until) {
      s.note = null;
    }
    if (s.hurry && s.clock > s.hurry.until) {
      s.hurry = null;
      out.say("tip", "pbHurryMissed");
    }
    s.tilt = Math.max(0, s.tilt - dt * 0.45);
    // The toys follow the rules
    parts.fiatDiverter.on = diverterOn();
    parts.crater.enabled = s.clock < s.craterUntil;
    parts.magnet.on = magnetOn();
    physics.raise(parts.post, s.clock < s.postUntil && !s.tilted);
    refreshLights();
  }

  return {
    lights,
    get state() {
      return s;
    },
    get over() {
      return s.over;
    },
    /** The crabs as the rules see them, for the view: shown, red. */
    crabLook(i) {
      return { shown: rt.crabShown[i], red: rt.crabRed[i] };
    },
    /** Starts a new game: the first ball on the plunger. */
    newGame() {
      s = newState();
      physics.setGravity(GRAVITY);
      resetBouncers();
      setFlippers(true);
      physics.setKicks(true);
      rt.matched = false;
      rt.overAt = 0;
      parts.volcano.bash.hp = volcanoHp();
      for (let i = 0; i < parts.crabs.length; i++) {
        physics.flipCreature(parts.crabs[i], !rt.crabShown[i]);
      }
      serve();
      update(0);
    },
    /** The state to save, as plain data. */
    snapshot() {
      return JSON.parse(JSON.stringify(s));
    },
    /** Back where a saved game was: the ball waits on the plunger, saved. */
    restore(saved) {
      s = Object.assign(newState(), saved && saved.v === 2 ? saved : {});
      s.mb = null;
      s.eruption = null;
      s.mission = null;
      physics.setGravity(GRAVITY);
      for (let i = 0; i < 3; i++) {
        parts.bouncers[i].enabled = s.bouncers[i];
      }
      parts.volcano.bash.hp = volcanoHp();
      s.craterUntil = 0;
      s.tilted = false;
      s.tilt = 0;
      setFlippers(true);
      physics.setKicks(true);
      serve();
      s.saveUntil = 0;
      refreshLights();
    },
    update,
    event,
    /** The plunger let a ball go: the ball save starts now, and the skill shot. */
    launched() {
      if (s.saveArmed) {
        s.saveArmed = false;
        s.saveUntil = s.clock + saveTime();
      }
      if (s.skill && !s.skill.until) {
        s.skill.until = s.clock + 6;
      }
    },
    /** A flipper pressed: the lit lanes move along, a mission is picked while the ball waits in the scoop. */
    flip(side) {
      if (s.tilted || s.over) {
        return;
      }
      if (rt.scoop && rt.scoop.start === "select") {
        let id = s.select;
        for (let k = 0; k < MISSION_COUNT; k++) {
          id = (id + (side > 0 ? 1 : MISSION_COUNT - 1)) % MISSION_COUNT;
          if (!s.done[id]) {
            break;
          }
        }
        s.select = id;
        rt.scoop.until = Math.max(rt.scoop.until, s.clock + 1.5);
        out.event("select", id);
        return;
      }
      if (s.mission) {
        const def = missionDef(s.mission.id);
        if (def.flip) {
          def.flip(s.mission.m, api);
        }
      }
      const l = s.hoho;
      s.hoho = side > 0 ? [l[3], l[0], l[1], l[2]] : [l[1], l[2], l[3], l[0]];
      if (s.skill && !s.skill.done && !s.skill.until) {
        s.skill.lane = (s.skill.lane + (side > 0 ? 1 : 3)) % 4;
      }
    },
    /** A nudge: how hard the table moves (0 once tilted). */
    nudge() {
      if (s.tilted || s.over) {
        return 0;
      }
      s.tilt += 1;
      if (s.tilt > 2.6) {
        s.tilted = true;
        setFlippers(false);
        physics.setKicks(false);
        if (s.mission) {
          endMission(false);
        }
        s.saveUntil = 0;
        out.say("coach", "pbTilt");
        out.sound("pbTilt");
        out.event("tilt", true);
        return 0;
      }
      if (s.tilt > 1.6) {
        out.say("toast", "pbTiltWarning", {}, "bad");
        out.sound("pbTiltWarn");
      }
      return 1;
    },
    /** What the HUD shows. */
    hud() {
      const mission = s.mission;
      let goal = null;
      if (mission) {
        goal = missionDef(mission.id).goal(mission.m);
      } else if (rt.scoop && rt.scoop.start === "select") {
        goal = ["pbGoalSelect", {}];
      } else if (s.mb) {
        goal = s.mb.superLit ? ["pbHintSuper", {}] : ["pbHintJackpots", {}];
      } else if (s.eruption) {
        goal = ["pbHintEruption", {}];
      } else if (s.clock < s.craterUntil) {
        goal = ["pbHintCrater", {}];
      } else if (s.lockLit) {
        goal = ["pbHintLock", { n: s.locks + 1 }];
      } else if (allDone()) {
        goal = ["pbHintReleaseDay", {}];
      } else if (doorOpen()) {
        goal = ["pbHintMoliere", {}];
      } else {
        goal = [Math.floor(s.clock / 9) % 2 ? "pbHintLoop" : "pbHintDoor", {}];
      }
      return {
        score: s.score,
        ballNo: s.ballNo,
        extraBalls: s.extraBalls,
        level: s.level,
        bonusX: s.bonusX,
        mission: mission ? mission.id : null,
        timeLeft: mission ? Math.max(0, Math.ceil(mission.m.timeLeft)) : 0,
        goal,
        select: rt.scoop && rt.scoop.start === "select" ? s.select : -1,
        done: s.done,
        multiball: Boolean(s.mb || s.eruption),
        hurry: s.hurry ? hurryValue() : 0,
        flips: mission && missionDef(mission.id).flipsLeft ? missionDef(mission.id).flipsLeft(mission.m) : null,
        tilted: s.tilted
      };
    },
    summary
  };
}
