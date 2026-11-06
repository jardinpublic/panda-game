/*
 * Golden Merguez rules (see DESIGN.md): pure logic, no DOM, no three.js.
 *
 *   const r = createRules({ hero: 'panda', random });
 *   r.setOut(true);            // hold: pop out of cover (and throw)
 *   r.aimBy(dYaw, dPitch);     // drag: turn the aim (radians)
 *   r.step(dt);                // advance the game
 *   r.events.splice(0);        // what happened (for the view, the HUD, the sounds)
 *
 * The hero stands at a station facing -z. Directions are angles from the eye:
 * yaw > 0 to the right, pitch > 0 up. Heights in metres.
 */
import { CAST_IDS } from '../marathon/art.js';

export const HEARTS = 5;
export const EYE_OUT = 1.45; // eye height out of cover
export const EYE_IN = 1.15; // crouched behind cover (high enough to see over it)
const OUT_TIME = 0.14; // popping out / ducking back
const RELOAD = 0.75; // seconds in cover to refill
const TELL = 0.7; // an opponent's wind-up before throwing
const THROW = 0.35; // stays out after throwing
const ENEMY_SPEED = 14; // m/s of an opponent's throw
const BODY_H = 1.0;
const HEAD_H = 1.55;
const BODY_R = 0.32;
const HEAD_R = 0.16;
const MAX_TELLS = 2; // opponents winding up at the same time
const SIDE = 1.2; // how far the hero can slide left or right along the cover (m)
const MOVE_SPEED = 2.4; // m/s, sliding sideways
const STAY = 0.35; // after a throw, the hero stays out this long, then ducks back on their own
const QUEUE = 2; // taps waiting to be thrown
const DODGE = 0.6; // a throw misses a hero who moved this far since it was thrown (m)
const COMBO_STEP = 3;
const MAX_MULT = 5;

/** Every weapon: damage, throws per second, clip, flight speed (m/s), and how it behaves. */
export const WEAPONS = {
  merguez: { dmg: 2, rate: 3, clip: 8, speed: 24 },
  mollard: { dmg: 1, rate: 5, clip: 12, speed: 28, every: 5, big: 'chorizo' },
  chorizo: { dmg: 4, rate: 1, clip: 1, speed: 20 },
  shot: { dmg: 1, rate: 1.8, clip: 6, speed: 22, n: 3, spread: 0.07 },
  andouille: { dmg: 4, rate: 1.2, clip: 4, speed: 21 },
  crotte: { dmg: 1, rate: 6, clip: 16, speed: 30 },
  gardon: { dmg: 2, rate: 2.6, clip: 8, speed: 22, bounce: true },
  rouleau: { dmg: 4, rate: 1.1, clip: 4, speed: 21 },
  archet: { dmg: 3, rate: 2, clip: 6, speed: 26, pierce: true },
  treuffe: { dmg: 2, rate: 2.6, clip: 8, speed: 20, assist: 0.2 },
  cote: { dmg: 6, rate: 0.8, clip: 3, speed: 20 },
  mouchoir: { dmg: 1, rate: 1.6, clip: 6, speed: 18, n: 4, spread: 0.09 },
  poissonchat: { dmg: 3, rate: 1.6, clip: 6, speed: 20, bounce: true },
  sardine: { dmg: 1, rate: 4, clip: 12, speed: 26, n: 2, spread: 0.05 },
  poulet: { dmg: 4, rate: 1, clip: 4, speed: 20 },
  boule: { dmg: 2, rate: 1, clip: 3, speed: 16 },
  pomme: { dmg: 1, rate: 2, clip: 6, speed: 18 },
  pv: { dmg: 1, rate: 2, clip: 6, speed: 18 },
  glacon: { dmg: 1, rate: 3, clip: 8, speed: 22 },
  pantoufle: { dmg: 2, rate: 1.5, clip: 4, speed: 18 },
};

export const WEAPON_OF = {
  panda: 'merguez', babar: 'mollard', cous: 'shot', mamar: 'andouille', victor: 'crotte', romain: 'gardon',
  eugenie: 'rouleau', violaine: 'archet', aline: 'treuffe', greg: 'cote', jojo: 'mouchoir',
  rudy: 'poissonchat', jose: 'sardine', lamoule: 'poulet', gogol: 'boule', pineur: 'boule', gardien: 'pomme',
  controleur: 'pv', videur: 'glacon', proprio: 'pantoufle', flic: 'pv', chasseur: 'pomme',
};

/** People from the levels who are not in the gang (faces painted by 103 RCX's faces.js). */
export const PEOPLE = ['gogol', 'pineur', 'gardien', 'controleur', 'videur', 'proprio', 'flic', 'chasseur'];

/** How far someone steps out of a cover to peek (past the end of a car, a stall, a tent). */
const REACH = { car205: 2.5, car: 2.5, kiosk: 2.5, tent: 2.3, dj: 2.3, gate: 2.0 };

/** Who stands in for a boss the hero is playing (never fight yourself). */
const STAND_IN = { babar: 'mamar', romain: 'greg' };

/**
 * The levels. Each station: where the hero stands (x, z), the hero's cover, and
 * the opponents: `gang` (a gang member drawn at random), or a person/boss id,
 * with their cover and its position. Opponents peek out to `side` (-1 left, 1 right).
 */
export const LEVELS = [
  {
    id: 'jardin',
    name: { fr: 'Eul’ Jardin Public', en: 'The Public Garden' },
    par: 110,
    stations: [
      { x: 0, z: 0, cover: 'hedge', foes: [{ who: 'gang', x: -2.4, z: -7, cover: 'bench', side: 1 }, { who: 'gang', x: 2.6, z: -9, cover: 'tree', side: -1 }] },
      { x: 0.5, z: -16, cover: 'bench', foes: [{ who: 'gang', x: -2.2, z: -24, cover: 'fountain', side: -1 }, { who: 'pineur', x: 3, z: -23, cover: 'bin', side: -1 }] },
      { x: -0.5, z: -34, cover: 'tree', foes: [{ who: 'gang', x: -3.2, z: -42, cover: 'kiosque', side: 1 }, { who: 'gang', x: 2.4, z: -41, cover: 'bench', side: -1 }, { who: 'gardien', x: 0.4, z: -44.5, cover: 'kiosque', side: 1 }] },
      { x: 0, z: -52, cover: 'bin', foes: [{ who: 'gogol', x: -2.4, z: -59, cover: 'wall', side: 1 }, { who: 'pineur', x: 2, z: -60, cover: 'wall', side: -1 }, { who: 'gang', x: 3.8, z: -58.5, cover: 'hedge', side: -1 }] },
      { x: 0, z: -68, cover: 'bench', boss: true, foes: [{ who: 'lamoule', x: 0.4, z: -77, cover: 'car205', side: 1, boss: true }] },
    ],
  },
  {
    id: 'gare',
    name: { fr: 'La gare de Montceau', en: 'Montceau station' },
    par: 120,
    stations: [
      { x: 0, z: 0, cover: 'cart', foes: [{ who: 'gang', x: -2.4, z: -8, cover: 'pillar', side: 1 }, { who: 'controleur', x: 2.6, z: -9, cover: 'machine', side: -1 }] },
      { x: 0, z: -16, cover: 'bench', foes: [{ who: 'gang', x: -2.8, z: -24, cover: 'cart', side: 1 }, { who: 'gang', x: 2.2, z: -25, cover: 'pillar', side: -1 }] },
      { x: 0, z: -32, cover: 'machine', foes: [{ who: 'controleur', x: -2.2, z: -40, cover: 'bench', side: 1 }, { who: 'gang', x: 2.8, z: -41, cover: 'machine', side: -1 }, { who: 'gang', x: 0.2, z: -43, cover: 'pillar', side: 1 }] },
      { x: 0, z: -50, cover: 'bench', foes: [{ who: 'gang', x: -3, z: -58, cover: 'cart', side: 1 }, { who: 'controleur', x: 2.6, z: -59, cover: 'bench', side: -1 }, { who: 'gang', x: 0.4, z: -61, cover: 'machine', side: 1 }] },
      { x: 0, z: -68, cover: 'cart', boss: true, foes: [{ who: 'romain', x: 0.4, z: -77, cover: 'kiosk', side: 1, boss: true }] },
    ],
  },
  {
    id: 'moliere',
    name: { fr: 'Le Molière', en: 'Le Molière club' },
    par: 120,
    stations: [
      { x: 0, z: 0, cover: 'table', foes: [{ who: 'gang', x: -2.4, z: -8, cover: 'speaker', side: 1 }, { who: 'videur', x: 2.4, z: -9, cover: 'table', side: -1 }] },
      { x: 0, z: -16, cover: 'sofa', foes: [{ who: 'gang', x: -2.6, z: -24, cover: 'table', side: 1 }, { who: 'gang', x: 2.6, z: -23, cover: 'sofa', side: -1 }] },
      { x: 0, z: -32, cover: 'table', foes: [{ who: 'videur', x: -2.4, z: -40, cover: 'speaker', side: 1 }, { who: 'gang', x: 2.4, z: -41, cover: 'table', side: -1 }, { who: 'gang', x: 0, z: -43, cover: 'bar', side: 1 }] },
      { x: 0, z: -50, cover: 'sofa', foes: [{ who: 'gang', x: -2.8, z: -58, cover: 'sofa', side: 1 }, { who: 'videur', x: 2.6, z: -59, cover: 'speaker', side: -1 }, { who: 'gang', x: 0.2, z: -61, cover: 'table', side: 1 }] },
      { x: 0, z: -68, cover: 'table', boss: true, foes: [{ who: 'jose', x: 0.3, z: -77, cover: 'dj', side: 1, boss: true }] },
    ],
  },
  {
    id: 'rue',
    name: { fr: 'La rue du garage d’Cous', en: 'Cous’s garage street' },
    par: 120,
    stations: [
      { x: 0, z: 0, cover: 'bin', foes: [{ who: 'gang', x: -2.6, z: -8, cover: 'car', side: 1 }, { who: 'proprio', x: 2.4, z: -9, cover: 'hedge', side: -1 }] },
      { x: 0, z: -16, cover: 'hedge', foes: [{ who: 'gang', x: -2.4, z: -24, cover: 'bin', side: 1 }, { who: 'flic', x: 2.6, z: -25, cover: 'car', side: -1 }] },
      { x: 0, z: -32, cover: 'bin', foes: [{ who: 'gang', x: -2.8, z: -40, cover: 'hedge', side: 1 }, { who: 'proprio', x: 2.4, z: -41, cover: 'bin', side: -1 }, { who: 'gang', x: 0.2, z: -43, cover: 'car', side: 1 }] },
      { x: 0, z: -50, cover: 'hedge', foes: [{ who: 'flic', x: -2.6, z: -58, cover: 'car', side: 1 }, { who: 'gang', x: 2.6, z: -59, cover: 'hedge', side: -1 }, { who: 'flic', x: 0.3, z: -61, cover: 'bin', side: 1 }] },
      { x: 0, z: -68, cover: 'bin', boss: true, foes: [{ who: 'babar', x: 0.3, z: -77, cover: 'gate', side: 1, boss: true }] },
    ],
  },
  {
    id: 'crapa',
    name: { fr: 'Les bois du CRAPA', en: 'The CRAPA woods' },
    par: 140,
    stations: [
      { x: 0, z: 0, cover: 'log', foes: [{ who: 'gang', x: -2.4, z: -8, cover: 'tree', side: 1 }, { who: 'chasseur', x: 2.6, z: -9, cover: 'rock', side: -1 }] },
      { x: 0, z: -16, cover: 'rock', foes: [{ who: 'gang', x: -2.6, z: -24, cover: 'rock', side: 1 }, { who: 'gang', x: 2.4, z: -25, cover: 'tree', side: -1 }] },
      { x: 0, z: -32, cover: 'log', foes: [{ who: 'chasseur', x: -2.4, z: -40, cover: 'tree', side: 1 }, { who: 'gang', x: 2.6, z: -41, cover: 'rock', side: -1 }, { who: 'gang', x: 0, z: -43, cover: 'tree', side: 1 }] },
      { x: 0, z: -50, cover: 'rock', foes: [{ who: 'gang', x: -2.8, z: -58, cover: 'log', side: 1 }, { who: 'chasseur', x: 2.6, z: -59, cover: 'tree', side: -1 }, { who: 'gang', x: 0.3, z: -61, cover: 'rock', side: 1 }] },
      { x: 0, z: -68, cover: 'log', boss: true, foes: [{ who: 'rudy', x: 0.3, z: -77, cover: 'tent', side: 1, boss: true }] },
    ],
  },
];

export const HP = { gang: 6, people: 4, boss: 40 };
const BOSS_HP_PER_LEVEL = 10; // each boss is tougher than the last (Rudy: 80)

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const angDist = (y1, p1, y2, p2) => Math.hypot(y1 - y2, p1 - p2);

export function createRules({ hero = 'panda', random = Math.random, level = 0, levels = LEVELS } = {}) {
  const weapon = WEAPON_OF[hero] || 'merguez';
  const W = WEAPONS[weapon];
  // The gang members met as opponents (Jojo too, with his tissues), never the hero.
  const pool = shuffle([...CAST_IDS.filter((id) => id !== hero), 'jojo'], random);
  let poolAt = 0;

  const r = {
    hero,
    weapon,
    events: [],
    time: 0,
    levelTime: 0,
    score: 0,
    combo: 0,
    hearts: HEARTS,
    kos: 0,
    hits: 0,
    level,
    levels,
    station: 0,
    phase: 'fight', // fight | move | levelDone | over
    phaseT: 0,
    stand: false, // the player wants to stand up (out of cover)
    fire: false, // throws over and over (the test bot)
    tap: 0, // a tap on the throw button waiting to be thrown (seconds left)
    queue: [], // tapped targets waiting to be thrown at: { foe, head } or { yaw, pitch }
    stay: 0, // seconds left out of cover after the last throw
    move: 0, // -1 sliding left, 1 right, 0 still
    ox: 0, // sideways offset along the cover (m)
    rise: 0, // 0 in cover .. 1 fully out
    yaw: 0,
    pitch: 0,
    ammo: W.clip,
    reload: 0,
    cool: 0,
    throws: 0,
    foes: [],
    shots: [], // the hero's throws in flight
    incoming: [], // opponents' throws in flight
    finished: false,
    pos: { x: 0, z: 0 },
    from: { x: 0, z: 0 },
    say(who, text) {
      r.events.push({ type: 'say', who, text });
    },
  };

  function shuffle(list, rnd) {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /** Difficulty of the current station: opponents hide less and throw sooner. */
  const diff = () => 1 + r.station * 0.06 + r.level * 0.15;

  function startStation() {
    const L = levels[r.level];
    const st = L.stations[r.station];
    r.from = { ...r.pos };
    r.pos = { x: st.x, z: st.z };
    r.foes = st.foes.map((f, i) => {
      let who = f.who;
      if (who === 'gang') who = pool[poolAt++ % pool.length];
      if (f.boss && who === hero) who = STAND_IN[who] || 'mamar';
      const kind = f.boss ? 'boss' : PEOPLE.includes(who) ? 'people' : 'gang';
      return {
        id: `${r.level}-${r.station}-${i}`,
        who,
        kind,
        weapon: WEAPON_OF[who] || 'boule',
        x: f.x,
        z: f.z,
        cover: f.cover,
        side: f.side || 1,
        reach: REACH[f.cover] || 0.75,
        hp: HP[kind] + (kind === 'boss' ? r.level * BOSS_HP_PER_LEVEL : 0),
        max: HP[kind] + (kind === 'boss' ? r.level * BOSS_HP_PER_LEVEL : 0),
        state: 'hide', // hide | tell | throw | ko
        t: (0.5 + random() * 1.2 + i * 0.5) / diff(),
        peek: 0, // 0 hidden .. 1 out
        hurt: 0,
        said: 0,
      };
    });
    if (st.boss) {
      const b = r.foes.find((f) => f.kind === 'boss');
      r.events.push({ type: 'boss', who: b.who });
    }
    r.events.push({ type: 'station', index: r.station, boss: !!st.boss });
  }

  /** Where a foe stands right now (it steps sideways out of its cover to peek). */
  r.foePos = (f) => ({ x: f.x + f.side * f.reach * f.peek, z: f.z });
  r.eye = () => EYE_IN + (EYE_OUT - EYE_IN) * r.rise;
  r.exposed = () => r.rise > 0.5;
  /** Direction from the eye to a foe's body or head. */
  r.dirTo = (f, h = BODY_H) => {
    const p = r.foePos(f);
    const dx = p.x - r.pos.x - r.ox;
    const dz = p.z - r.pos.z;
    const dist = Math.hypot(dx, dz);
    return { yaw: Math.atan2(dx, -dz), pitch: Math.atan2(h - r.eye(), dist), dist };
  };
  const visible = (f) => f.state === 'tell' || f.state === 'throw';

  /** Stand up and throw at once (the test bot plays like this). */
  r.setOut = (v) => {
    r.stand = !!v;
    r.fire = !!v;
  };
  r.setStand = (v) => {
    r.stand = !!v;
  };
  r.setFire = (v) => {
    r.fire = !!v;
  };
  /** Tapped on someone: pop out, throw at them (head or body), duck back. */
  r.tapFoe = (id, head = false) => {
    if (r.queue.length < QUEUE) r.queue.push({ foe: id, head: !!head });
  };
  /** Tapped on nobody: throw that way anyway. */
  r.tapDir = (yaw, pitch) => {
    if (r.queue.length < QUEUE) r.queue.push({ yaw, pitch });
  };
  /** One tap, one throw (kept a moment if the weapon is not ready yet). */
  r.tapFire = () => {
    r.tap = 0.45; // long enough to stand up first
  };
  r.setMove = (dir) => {
    r.move = Math.sign(dir || 0);
  };
  r.heroX = () => r.pos.x + r.ox;
  r.aimBy = (dy, dp) => {
    r.yaw = clamp(r.yaw + dy, -0.75, 0.75);
    r.pitch = clamp(r.pitch + dp, -0.35, 0.35);
  };
  r.aimTo = (y, p) => {
    r.yaw = clamp(y, -0.75, 0.75);
    r.pitch = clamp(p, -0.35, 0.35);
  };
  r.mult = () => Math.min(MAX_MULT, 1 + Math.floor(r.combo / COMBO_STEP));
  r.stationCount = () => levels[r.level].stations.length;
  r.boss = () => r.foes.find((f) => f.kind === 'boss') || null;

  /** The foe under the crosshair (with aim assist): { foe, head } or null. */
  function pick(assist) {
    let best = null;
    for (const f of r.foes) {
      if (!visible(f)) continue;
      const b = r.dirTo(f, BODY_H);
      const h = r.dirTo(f, HEAD_H);
      const bodyR = Math.atan(BODY_R / b.dist) + assist;
      const headR = Math.atan(HEAD_R / b.dist) + assist * 0.35;
      const dh = angDist(r.yaw, r.pitch, h.yaw, h.pitch);
      const db = angDist(r.yaw, r.pitch, b.yaw, b.pitch);
      const head = dh < headR;
      if (!head && db > bodyR) continue;
      const d = Math.min(dh, db);
      if (!best || d < best.d) best = { foe: f, head, d };
    }
    return best;
  }

  function throwOne(forced = null) {
    const big = W.every && (r.throws + 1) % W.every === 0;
    const kind = big ? W.big : weapon;
    const spec = WEAPONS[kind];
    const n = spec.n || 1;
    for (let i = 0; i < n; i++) {
      const off = n > 1 ? (i - (n - 1) / 2) * (spec.spread || 0) : 0;
      const yaw = r.yaw + off;
      const keep = r.yaw;
      r.yaw = yaw;
      const target = i === Math.floor(n / 2) && forced ? forced : pick(spec.assist ?? W.assist ?? 0.1);
      r.yaw = keep;
      const dist = target ? r.dirTo(target.foe).dist : 18;
      r.shots.push({ kind, dmg: spec.dmg, yaw, pitch: r.pitch, target: target?.foe.id ?? null, head: !!target?.head, t: 0, T: dist / spec.speed, dist, bounce: !!spec.bounce, pierce: !!spec.pierce });
    }
    r.throws++;
    r.ammo--;
    r.cool = 1 / W.rate;
    r.events.push({ type: 'throw', who: hero, weapon: kind, mine: true });
  }

  function hitFoe(f, dmg, head, how = '') {
    const real = head ? dmg * 2 : dmg;
    f.hp -= real;
    f.hurt = 0.35;
    r.hits++;
    r.combo++;
    const m = r.mult();
    r.score += 10 * real * m + (head ? 50 * m : 0);
    r.events.push({ type: 'hit', foe: f.id, who: f.who, head, dmg: real, how, mult: m });
    if (f.who === 'mamar' && f.said <= 0) {
      f.said = 4;
      r.say('mamar', 'proie');
    }
    if (f.hp <= 0) {
      f.state = 'ko';
      f.t = 0;
      r.kos++;
      r.score += f.kind === 'boss' ? 5000 : 300 * m;
      r.events.push({ type: 'ko', foe: f.id, who: f.who, boss: f.kind === 'boss' });
    }
  }

  function land(s) {
    const f = r.foes.find((x) => x.id === s.target);
    // Still out, or not yet fully back behind the cover: it lands.
    if (f && f.state !== 'ko' && (visible(f) || f.peek > 0.35)) return hitFoe(f, s.dmg, s.head);
    if (f && f.state !== 'ko' && s.pierce) return hitFoe(f, Math.max(1, Math.floor(s.dmg / 2)), false, 'pierce');
    if (s.bounce) {
      const other = r.foes.find((x) => x.state !== 'ko' && visible(x));
      if (other) return hitFoe(other, Math.max(1, Math.floor(s.dmg / 2)), false, 'bounce');
    }
    r.events.push({ type: 'miss', foe: f?.id ?? null, kind: s.kind, cover: !!f });
  }

  function foeThrow(f) {
    const spec = WEAPONS[f.weapon] || WEAPONS.boule;
    const d = r.dirTo(f).dist;
    const n = f.kind === 'boss' && f.hp < f.max / 2 ? 2 : 1;
    for (let i = 0; i < n; i++) r.incoming.push({ foe: f.id, who: f.who, kind: f.weapon, t: -i * 0.28, T: d / ENEMY_SPEED, dist: d, side: n > 1 ? (i ? 1 : -1) : 0, tx: r.heroX() });
    void spec;
    r.events.push({ type: 'throw', who: f.who, weapon: f.weapon, foe: f.id });
  }

  function stepFoes(dt) {
    const telling = r.foes.filter((f) => f.state === 'tell').length;
    for (const f of r.foes) {
      f.hurt = Math.max(0, f.hurt - dt);
      f.said = Math.max(0, f.said - dt);
      if (f.state === 'ko') {
        f.t += dt;
        f.peek = Math.max(0, f.peek - dt * 2);
        continue;
      }
      const want = f.state === 'hide' ? 0 : 1;
      f.peek += Math.sign(want - f.peek) * Math.min(Math.abs(want - f.peek), dt * 6);
      f.t -= dt;
      if (f.t > 0) continue;
      if (f.state === 'hide') {
        if (telling >= MAX_TELLS || r.phase !== 'fight') {
          f.t = 0.3;
          continue;
        }
        f.state = 'tell';
        f.t = f.kind === 'boss' ? 0.6 : TELL;
        r.events.push({ type: 'tell', foe: f.id, who: f.who });
        if (f.who === 'mamar' && f.said <= 0) {
          f.said = 4;
          r.say('mamar', 'proie');
        }
      } else if (f.state === 'tell') {
        f.state = 'throw';
        f.t = THROW;
        foeThrow(f);
      } else {
        f.state = 'hide';
        const boss = f.kind === 'boss';
        f.t = ((boss ? 0.7 : 1.1) + random() * (boss ? 0.8 : 1.5)) / diff();
        if (boss && random() < 0.5) f.side = -f.side; // the boss changes side of his car
      }
    }
  }

  function stepIncoming(dt) {
    for (const s of r.incoming) s.t += dt;
    for (const s of r.incoming.filter((x) => x.t >= x.T)) {
      // Standing where it was aimed: hit. Ducked, or slid aside in time: it misses.
      if (r.exposed() && r.phase === 'fight' && Math.abs(r.heroX() - s.tx) < DODGE) {
        r.hearts--;
        r.combo = 0;
        r.events.push({ type: 'hurt', who: s.who, kind: s.kind, hearts: r.hearts });
        if (hero === 'mamar') r.say('mamar', 'proie');
        if (r.hearts <= 0) {
          r.phase = 'over';
          r.events.push({ type: 'over', won: false });
        }
      } else {
        r.events.push({ type: 'block', kind: s.kind });
      }
    }
    r.incoming = r.incoming.filter((x) => x.t < x.T);
  }

  r.step = (dt) => {
    if (r.phase === 'over') return;
    r.time += dt;
    r.levelTime += dt;
    r.phaseT += dt;
    // Pop out / duck
    // Out while told to stand, while a tap waits, or just after a throw; else back in cover.
    if (!r.queue.length) r.stay = Math.max(0, r.stay - dt);
    const target = (r.stand || r.queue.length > 0 || r.stay > 0) && r.phase === 'fight' ? 1 : 0;
    if (r.phase === 'fight') r.ox = clamp(r.ox + r.move * MOVE_SPEED * dt, -SIDE, SIDE);
    r.rise += Math.sign(target - r.rise) * Math.min(Math.abs(target - r.rise), dt / OUT_TIME);
    // Reload in cover
    if (r.rise < 0.5 && r.ammo < W.clip) {
      r.reload += dt;
      if (r.reload >= RELOAD) {
        r.ammo = W.clip;
        r.reload = 0;
        r.events.push({ type: 'reload' });
      }
    } else if (r.rise >= 0.5) r.reload = 0;
    // Throwing
    r.cool = Math.max(0, r.cool - dt);
    r.tap = Math.max(0, r.tap - dt);
    // A tapped target: aim at it and throw (it is hit if still out, or not fully back, when it lands).
    if (r.phase === 'fight' && r.rise >= 1 && r.queue.length && r.cool <= 0) {
      const q = r.queue.shift();
      if (r.ammo <= 0) {
        r.queue = [];
        r.stay = 0;
        r.events.push({ type: 'empty' });
      } else {
        const f = q.foe ? r.foes.find((x) => x.id === q.foe && x.state !== 'ko') : null;
        if (f) {
          const d = r.dirTo(f, q.head ? HEAD_H : BODY_H);
          r.aimTo(d.yaw, d.pitch);
          throwOne({ foe: f, head: q.head });
        } else {
          r.aimTo(q.yaw ?? r.yaw, q.pitch ?? r.pitch);
          throwOne();
        }
        r.stay = STAY;
      }
    }
    const wants = r.fire || r.tap > 0;
    if (r.phase === 'fight' && r.rise >= 1 && wants && r.ammo > 0 && r.cool <= 0) {
      throwOne();
      r.tap = 0;
    }
    if (r.phase === 'fight' && r.rise >= 1 && wants && r.ammo <= 0 && r.cool <= 0) {
      r.tap = 0;
      r.cool = 0.8;
      r.events.push({ type: 'empty' });
    }
    // Gentle aim assist: the crosshair drifts onto a nearby foe who is out.
    if (r.rise >= 1) {
      let near = null;
      for (const f of r.foes) {
        if (!visible(f)) continue;
        const b = r.dirTo(f);
        const d = angDist(r.yaw, r.pitch, b.yaw, b.pitch);
        if (d < 0.16 && (!near || d < near.d)) near = { d, b };
      }
      if (near) {
        const k = Math.min(1, dt * 4);
        r.yaw += (near.b.yaw - r.yaw) * k;
        r.pitch += (near.b.pitch - r.pitch) * k;
      }
    }
    // The hero's throws in flight
    for (const s of r.shots) s.t += dt;
    for (const s of r.shots.filter((x) => x.t >= x.T)) land(s);
    r.shots = r.shots.filter((x) => x.t < x.T);
    stepFoes(dt);
    stepIncoming(dt);
    if (r.phase === 'over') return;
    // Station cleared: move on (or finish the level).
    if (r.phase === 'fight' && r.foes.length && r.foes.every((f) => f.state === 'ko')) {
      r.incoming = [];
      if (r.station + 1 < r.stationCount()) {
        r.phase = 'move';
        r.phaseT = 0;
        r.events.push({ type: 'cleared', index: r.station });
      } else {
        const L = levels[r.level];
        const bonus = r.hearts * 500 + Math.max(0, Math.round(L.par - r.levelTime)) * 20;
        r.score += bonus;
        r.phase = 'levelDone';
        r.phaseT = 0;
        r.events.push({ type: 'level', index: r.level, bonus, time: r.levelTime });
      }
    } else if (r.phase === 'move' && r.phaseT >= 1.3) {
      r.station++;
      r.phase = 'fight';
      r.phaseT = 0;
      r.yaw = 0;
      r.pitch = 0;
      r.ox = 0;
      startStation();
    } else if (r.phase === 'levelDone' && r.phaseT >= 2.5) {
      if (r.level + 1 < levels.length) {
        r.level++;
        r.station = 0;
        r.levelTime = 0;
        r.hearts = Math.min(HEARTS, r.hearts + 1); // a heart back between levels
        r.pos = { x: 0, z: 0 };
        r.ox = 0;
        r.events.push({ type: 'levelStart', index: r.level });
        r.phase = 'fight';
        r.phaseT = 0;
        startStation();
      } else {
        r.finished = true;
        r.phase = 'over';
        r.events.push({ type: 'over', won: true });
      }
    }
  };

  /** How far the hero has walked between two stations (0..1), for the camera. */
  r.walk = () => (r.phase === 'move' ? Math.min(1, r.phaseT / 1.3) : 1);
  r.nextStation = () => levels[r.level].stations[r.station + 1] || null;
  r.summary = () => ({ score: r.score, level: r.level + (r.finished ? 1 : 0), finished: r.finished, time: Math.round(r.time), kos: r.kos, hero });

  startStation();
  return r;
}

/** A test player: taps the closest face that is out, never when something is about to land. */
export function botInput(r) {
  const danger = r.incoming.some((s) => s.T - s.t < 0.55 && s.t > -0.05);
  if (danger || r.queue.length || r.cool > 0.05) return;
  const foes = r.foes.filter((f) => f.state === 'tell' || f.state === 'throw');
  if (!foes.length) return;
  const f = foes.sort((a, b) => r.dirTo(a).dist - r.dirTo(b).dist)[0];
  r.tapFoe(f.id, true);
}
