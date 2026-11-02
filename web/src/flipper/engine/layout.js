// Engine from Pipeline Pinball (sfdx-hardis-training), same author.
/*
 * Eul' Flipper, table v2 "L'île de Panda", as data: every wall, post,
 * flipper, target, toy, ramp and light, in table units (see physics.js). The
 * physics, the view and the rules all read it from here, so a post moved here
 * moves everywhere.
 *
 * The proportions are an arcade table's, 1 unit for 5 cm: a 27 mm ball,
 * 3 inch flippers with their pivots 7 inches apart, ramp mouths about two
 * balls and a half wide, a playfield a little over twice as long as wide.
 *
 * v2 is built round element types Pipeline Pinball does not have (DESIGN.md,
 * "Table v2"): no fan of three ramps, no orbits, no upper floor, no third
 * flipper, no spinning disc, no saucers.
 *
 *   top          H-O-H-O, four rollovers under the arc (the skill shot, lane
 *                change with the flippers); the pop bumpers Babar, Mamar and
 *                Greg in a cluster under them, on the right
 *   upper middle La Montagne Pelée, the volcano (a bash toy with hit points,
 *                centre top) and its crater (a hole that opens when it
 *                erupts); eul' ballon d'Mamar, a magnet under a disc on the
 *                left; the G of MERGUEZ up on the left
 *   the shots    from left to right: Le looping de 15h pétantes (a wire
 *                loop-the-loop, left), La cave à rhum (a cellar hole: the
 *                ball sinks, travels under the table and a VUK kicks it up
 *                onto a wire to the left inlane), the volcano up the middle,
 *                Le Molière (a scoop behind a drawbridge of three drop
 *                targets, the bouncers), the Rampe Fiat Panda (right, with a
 *                diverter into Le Silo, the visible lock hanging over the
 *                right side), Eul' coco (a captive coconut in a short lane on
 *                the right wall)
 *   y 7.5 to 10  the land crabs walking sideways across the middle; the two
 *                banks with the M-E and U-E of MERGUEZ
 *   y 0 to 7     the slingshots (Victor, Greg), the inlanes and outlanes, the
 *                kickback "Marche arrière" (right outlane), eul' sanglier (the
 *                up-post between the flippers), the flippers; the plunger
 *                lane on the right
 */
import { createPhysics, BALL_RADIUS } from "./physics.js";

/** Table v2 is built at its final size: kept for the callers of v1, it changes nothing. */
export function sy(y) {
  return y;
}

// The toys and holes, where the view and the art find them too
const VOLCANO = { x: -0.35, y: 16.4, r: 0.95 };
const CRATER = { x: -0.35, y: 15.15, r: 0.42 };
const CELLAR = { x: -2.1, y: 12.4 };
const MOLIERE = { x: 1.35, y: 13.7 };
const MAGNET = { x: -2.6, y: 15.9, r: 0.6 };
// The coconut's rail, in its lane on the right wall: rest at the bottom, the switch at the top
const COCO = { x: 4.45, y0: 11.1, y1: 12.9, r: 0.3 };
// The Silo hangs over the right side, the balls stack in it (visible lock)
const SILO = { x: 4.45, y: 14.85, h: 2.0 };
const POST = { x: 0, y: 1.05, r: 0.2 };
const CRAB_BOUNDS = [-2.6, 7.7, 2.6, 10.3];
const CRAB_HOMES = [
  [-1.5, 8.5],
  [0.1, 9.5],
  [1.5, 8.3],
  [-0.6, 10.0]
];
const BUMPERS = [
  [1.25, 18.35],
  [3.45, 18.35],
  [2.35, 17.15]
];
const HOHO = [0.65, 1.65, 2.65, 3.65];
const HOHO_Y = 20.45;
const BOUNCERS = [0.85, 1.35, 1.85];
const BOUNCER_Y = 12.85;

const DESIGN = {
  left: -5,
  right: 6.1,
  laneWall: 5,
  top: 23.05,
  // No upper floor any more: kept so the callers that test a floor 1 read sane values
  upperBottom: 99,
  upperTop: 99,
  upperLeft: -3.6,
  upperRight: 3.6,
  upperHeight: 2.2,
  plunger: { x: 5.56, y: 0.6 },
  arc: { x: 0.55, y: 17.5, r: 5.55 },
  // The left slingshot's corners (the right one mirrors it): top, bottom, the tip over the flipper
  sling: [
    [-3.1, 5.9],
    [-3.1, 4.2],
    [-1.8, 3.5]
  ]
};

/** The table as built: what the view, the rules and the tests read. */
export const TABLE = Object.assign({}, DESIGN, {
  ball: BALL_RADIUS,
  volcano: VOLCANO,
  crater: CRATER,
  cellar: CELLAR,
  moliere: MOLIERE,
  magnet: MAGNET,
  coco: COCO,
  silo: SILO,
  post: POST,
  crabBounds: CRAB_BOUNDS,
  hoho: HOHO,
  hohoY: HOHO_Y
});

// Under each side, a bank turned towards the far flipper sends a ball coming
// down the side wall back into play: M-E of MERGUEZ on the left, U-E on the right
const BANK_TOP = [-5, 9.4];
const BANK_END = [-3.9, 7.5];
const BANK_TARGETS = [0.3, 0.72];

/** A point along the left bank (mirrored for the right one), pushed off its face by `off`. */
export function bankPoint(k, off, side) {
  const dx = BANK_END[0] - BANK_TOP[0];
  const dy = BANK_END[1] - BANK_TOP[1];
  const len = Math.hypot(dx, dy);
  // The face looks up and across the table, towards the other flipper
  const nx = -dy / len;
  const ny = dx / len;
  const x = BANK_TOP[0] + dx * k + nx * off;
  const y = BANK_TOP[1] + dy * k + ny * off;
  return [side === -1 ? -x : x, y];
}
const BANK_LENGTH = Math.hypot(BANK_END[0] - BANK_TOP[0], BANK_END[1] - BANK_TOP[1]);

/**
 * The seven MERGUEZ standups round the playfield, in letter order:
 * [ax, ay, bx, by, light x, light y]. M and E on the left bank, R on the left
 * wall, G up on the left, U and E on the right bank, Z on the right wall.
 */
function merguezSpots() {
  const half = 0.2 / BANK_LENGTH;
  const bank = (k, side) => {
    const [ax, ay] = bankPoint(k - half, 0.04, side);
    const [bx, by] = bankPoint(k + half, 0.04, side);
    const [lx, ly] = bankPoint(k, 0.7, side);
    return [ax, ay, bx, by, lx, ly];
  };
  return [bank(BANK_TARGETS[0], 1), bank(BANK_TARGETS[1], 1), [-4.86, 11.85, -4.86, 12.35, -4.35, 12.1], [-3.35, 19.15, -2.95, 18.8, -2.75, 19.45], bank(BANK_TARGETS[0], -1), bank(BANK_TARGETS[1], -1), [4.86, 14.45, 4.86, 14.95, 4.35, 14.7]];
}

// The right inlane wire, the way back of the Fiat ramp and of the Silo
const RIGHT_WIRE = [6.45, 15.2, 2.15, 6.5, 9.5, 2.0, 6.4, 7.2, 1.7, 4.4, 6.3, 0.9, 3.6, 5.9, 0.3, 3.55, 5.5, 0];
// The kick of "Marche arrière", in the right outlane: up the outlane, over the post, down the inlane
const KICK_PATH = [4.5, 1.4, 0, 4.5, 5.2, 0.3, 4.45, 6.3, 0.9, 4.0, 6.75, 1.1, 3.6, 5.9, 0.3, 3.55, 5.5, 0];

/** Builds the table: { physics, parts, walls, lights }. */
export function buildTable() {
  const p = createPhysics();
  const walls = [];
  const keep = (list, kind) => {
    for (const s of Array.isArray(list) ? list : [list]) {
      walls.push({ shape: s, kind });
    }
    return list;
  };
  const T = DESIGN;

  // The cabinet: left wall, the arc over the top, the outer wall of the plunger lane
  keep(p.capsule(T.left, -1.5, T.left, T.arc.y, { r: 0.12, bounce: 0.45 }), "wall");
  keep(p.arc(T.arc.x, T.arc.y, T.arc.r, Math.PI, 0, 28, { r: 0.12, bounce: 0.4, friction: 0.01 }), "wall");
  keep(p.capsule(T.right, T.arc.y, T.right, -1.5, { r: 0.08, bounce: 0.4 }), "wall");
  // The plunger lane: its inner wall, and a gate that lets the ball out, not back
  keep(p.capsule(T.laneWall, -1.5, T.laneWall, 16.1, { r: 0.1, bounce: 0.4 }), "wall");
  keep(p.capsule(6.02, 16.95, 5.05, 16.22, { r: 0.06, bounce: 0.2, oneWay: { x: 0, y: 1 } }), "gate");
  p.setPlunger(5.12, 5.98, T.plunger.y);

  /* ---------- Top: H-O-H-O and the bumpers ---------- */

  // The posts between the four rollovers, shorter to the right under the arc
  for (const [x, top] of [
    [0.15, 21.2],
    [1.15, 21.2],
    [2.15, 21.05],
    [3.15, 20.85],
    [4.15, 20.6]
  ]) {
    keep(p.capsule(x, 19.85, x, top, { r: 0.08, bounce: 0.5 }), "post");
  }
  const hoho = HOHO.map((x, i) => p.line(x + 0.47, HOHO_Y, x - 0.47, HOHO_Y, { tag: "hoho" + i }));
  // Babar, Mamar and Greg: a tight triangle under the lanes, no ball rests between two of them
  const bumpers = BUMPERS.map(([x, y], i) => p.circle(x, y, 0.6, { bounce: 0.6, kick: 15, tag: "bumper" + i }));

  /* ---------- La Montagne Pelée and its crater ---------- */

  // Four hits and it erupts: the rules set its hit points, harder each time
  const volcano = p.bashToy(VOLCANO.x, VOLCANO.y, VOLCANO.r, { hp: 4, minSpeed: 7, tag: "volcano", bounce: 0.45 });
  // The crater: open only after an eruption, at the foot of the volcano facing the flippers
  const crater = p.hole(CRATER.x, CRATER.y, CRATER.r, { tag: "crater", capture: true, enabled: false });

  /* ---------- Eul' ballon d'Mamar: the magnet ---------- */

  const magnet = p.magnet(MAGNET.x, MAGNET.y, MAGNET.r, { tag: "magnet", maxSpeed: 26, pull: 30 });

  /* ---------- La cave à rhum: a cellar hole, the VUK and its wire ---------- */

  keep(p.arc(CELLAR.x, CELLAR.y, 0.62, -0.25, Math.PI + 0.25, 8, { r: 0.08, bounce: 0.2 }), "wall");
  const cellar = p.hole(CELLAR.x, CELLAR.y, 0.32, { tag: "cellar", capture: true });
  // The VUK kicks the ball straight up out of the cellar onto a wire, over the
  // loop's mouth and down the left side to the left inlane
  const cellarPath = p.path(
    [CELLAR.x, CELLAR.y, 0, CELLAR.x, CELLAR.y + 0.1, 1.4, -2.5, 12.0, 2.2, -3.3, 11.3, 2.3, -4.6, 10.4, 2.15, -5.45, 9.4, 2.0, -5.35, 7.2, 1.7, -4.3, 6.3, 0.8, -3.6, 5.9, 0.3, -3.55, 5.5, 0],
    { tag: "cellarWire", exitMax: 9 }
  );

  /* ---------- Le Molière: the scoop behind the bouncers ---------- */

  keep(p.arc(MOLIERE.x, MOLIERE.y, 0.62, -0.25, Math.PI + 0.25, 8, { r: 0.08, bounce: 0.2 }), "wall");
  // Side guides from the back wall down to the bouncers: the door is the only way in
  keep(p.capsule(MOLIERE.x - 0.6, MOLIERE.y - 0.15, BOUNCERS[0] - 0.25, BOUNCER_Y, { r: 0.08, bounce: 0.3 }), "wall");
  keep(p.capsule(MOLIERE.x + 0.6, MOLIERE.y - 0.15, BOUNCERS[2] + 0.25, BOUNCER_Y, { r: 0.08, bounce: 0.3 }), "wall");
  const moliere = p.hole(MOLIERE.x, MOLIERE.y, 0.32, { tag: "moliere", capture: true });
  const bouncers = BOUNCERS.map((x, i) => p.capsule(x - 0.13, BOUNCER_Y, x + 0.13, BOUNCER_Y, { r: 0.12, bounce: 0.35, hop: 0.15, tag: "bouncer" + i }));

  /* ---------- Le looping de 15h pétantes ---------- */

  // The approach climbs to the foot of the loop, the loop turns over the
  // table, and the ball comes out at the top left, rolling towards the magnet
  const loopPath = p.verticalLoop(
    [-3.95, 10.9, 0, -4.0, 12.4, 0.55, -4.05, 13.4, 0.9],
    1.1,
    -4.55,
    [-4.6, 14.7, 0.75, -4.55, 15.7, 0.45, -4.3, 16.6, 0.15, -3.85, 17.0, 0, -3.4, 16.9, 0],
    { tag: "loop", exitMax: 12, friction: 3, drag: 0.25 }
  );
  p.line(-4.55, 10.9, -3.35, 10.9, { path: loopPath, tag: "loopMouth" });

  /* ---------- The Rampe Fiat Panda, its diverter and Le Silo ---------- */

  const fiatPath = p.path([2.9, 10.9, 0, 2.95, 12.6, 0.9, 3.1, 14.2, 1.7, 3.45, 15.2, 2.0, 4.0, 15.7, 2.1, 4.9, 15.9, 2.2].concat(RIGHT_WIRE), { tag: "fiat", exitMax: 9 });
  p.line(2.3, 10.9, 3.5, 10.9, { path: fiatPath, tag: "fiatMouth" });
  // Past the bend, the diverter turns the ball into the Silo when the lock is lit
  const siloPath = p.path([4.0, 15.7, 2.1, 4.3, 15.35, 2.1, SILO.x, SILO.y, SILO.h], { tag: "silo", holdAtEnd: true });
  const fiatDiverter = p.diverter(fiatPath, 4, siloPath);
  // Out of the Silo: the balls it lets go roll down the right wire to the right inlane
  const siloExit = p.path([SILO.x, SILO.y, SILO.h, 4.9, 15.55, 2.25].concat(RIGHT_WIRE), { tag: "siloExit", exitMax: 9 });

  /* ---------- Eul' coco: the captive coconut ---------- */

  // Its lane on the right wall: the inner wall, and a cap sloped to the left (no ball rests on it)
  keep(p.capsule(3.9, 10.35, 3.9, 13.25, { r: 0.1, bounce: 0.4 }), "wall");
  keep(p.capsule(3.9, 13.3, 5.0, 13.6, { r: 0.1, bounce: 0.4 }), "wall");
  const coco = p.captive(COCO.x, COCO.y0, COCO.x, COCO.y1, COCO.r, { tag: "coco", mass: 1.3, bounce: 0.8 });

  /* ---------- MERGUEZ ---------- */

  const merguez = merguezSpots().map(([ax, ay, bx, by], i) => p.capsule(ax, ay, bx, by, { r: 0.1, bounce: 0.4, hop: 0.2, tag: "merguez" + i }));

  // The two banks: a solid wedge from the wall, its face turned to the middle
  for (const side of [1, -1]) {
    const [tx, ty] = bankPoint(0, 0, side);
    const [ex, ey] = bankPoint(1, 0, side);
    keep(p.wall([tx, ty, ex, ey, side * -5, 7.1], { r: 0.1, bounce: 0.45 }), "wall");
  }

  /* ---------- Les crabes de terre ---------- */

  // Four crabs; the rules keep the fourth one home except in its missions
  const crabs = CRAB_HOMES.map(([x, y], i) => p.creature(x, y, 0.36, { tag: "crab" + i, bounds: CRAB_BOUNDS, speed: 0.9, heading: i % 2 ? Math.PI : 0 }));

  /* ---------- The lower playfield ---------- */

  for (const side of [-1, 1]) {
    // The inlane guide ends over the flipper's pivot: the ball rolls on to the bat
    keep(p.wall([side * 4.0, 6.4, side * 4.0, 3.5, side * 2.3, 2.75], { r: 0.1, bounce: 0.45, falloff: 0.0025 }), "wall");
    // The post at the top of the inlane guide: a rubber that keeps some balls out of the outlane
    keep(p.circle(side * 4.0, 6.52, 0.18, { bounce: 0.9, falloff: 0.0075, hop: 0.2 }), "rubber");
    const [a, b, c] = T.sling;
    keep(p.capsule(side * -a[0], a[1], side * -b[0], b[1], { r: 0.12, bounce: 0.9, falloff: 0.0125 }), "rubber");
    keep(p.capsule(side * -b[0], b[1], side * -c[0], c[1], { r: 0.12, bounce: 0.9, falloff: 0.0125 }), "rubber");
  }
  const [sa, , sc] = T.sling;
  // The slingshots kick hardest in the middle of the band, about 1 m/s
  const sling = { r: 0.14, bounce: 0.9, falloff: 0.0125, kick: 22, kickMin: 4, kickProfile: true, hop: 0.15 };
  const slings = [
    keep(p.capsule(sc[0], sc[1], sa[0], sa[1], Object.assign({ tag: "slingL" }, sling)), "sling"),
    keep(p.capsule(-sa[0], sa[1], -sc[0], sc[1], Object.assign({ tag: "slingR" }, sling)), "sling")
  ];
  p.line(-4.0, 4.6, T.left, 4.6, { tag: "outlaneL" });
  p.line(T.laneWall, 4.6, 4.0, 4.6, { tag: "outlaneR" });
  p.line(-3.1, 4.6, -4.0, 4.6, { tag: "inlaneL" });
  p.line(4.0, 4.6, 3.1, 4.6, { tag: "inlaneR" });
  // Marche arrière, in the right outlane: the bank closes the lane over its
  // top, so the kick lifts the ball up the lane and over the inlane post
  const kickbackR = p.line(T.laneWall, 1.4, 4.0, 1.4, { tag: "kickbackR" });
  const kickPaths = { right: p.path(KICK_PATH, { tag: "kickbackR", exitMax: 9 }) };

  // Arcade flippers: pivots 7 inches apart, the bats 31 degrees down at rest and 21 up
  const left = p.flipper(-2.05, 2.4, 1.65, { side: 1, rest: -0.54, up: 0.37, r: 0.24, rb: 0.12, tag: "flipper" });
  const right = p.flipper(2.05, 2.4, 1.65, { side: -1, rest: -0.54, up: 0.37, r: 0.24, rb: 0.12, tag: "flipper" });
  // Eul' sanglier: the up-post between the flippers, down until the coconut lights it
  const post = p.post(POST.x, POST.y, POST.r, { tag: "post", bounce: 0.55 });
  p.build();

  const lights = buildLights();
  return {
    physics: p,
    walls,
    lights,
    parts: {
      flippers: { left, right },
      bumpers,
      slings,
      hoho,
      volcano,
      crater,
      magnet,
      cellar,
      moliere,
      bouncers,
      fiatDiverter,
      coco,
      merguez,
      crabs,
      post,
      kickbackR,
      kickPaths,
      paths: { loop: loopPath, fiat: fiatPath, silo: siloPath, siloExit, cellar: cellarPath }
    }
  };
}

/**
 * The inserts of the playfield the rules light, as on an arcade table: a
 * delta in front of each shot, chevrons chasing towards it, the honeycomb of
 * the ten missions over the flippers, round inserts for the targets, the
 * Silo's locks and the lanes, warm bulbs. Each one { id, x, y, floor, size,
 * shape ("round", "delta", "hex", "star", "chevron", "bulb"), angle, color,
 * label (a text key painted near it), text (a letter painted inside) }.
 */
function buildLights() {
  const lights = [];
  const add = (id, x, y, options) => {
    lights.push(Object.assign({ id, x, y, floor: 0, size: 0.32, shape: "round", angle: 0, color: 0x0176d3, label: "" }, options));
  };
  // The shots, from left to right: a big delta in front of each
  const shots = [
    ["loop", -3.95, 9.95, 0xff3d8b, 0.46, 0],
    ["cellar", -2.1, 11.2, 0xffa62b, 0.42, 0],
    ["volcano", -0.35, 13.6, 0xff4a1c, 0.52, 0],
    ["moliere", 1.35, 11.95, 0xff6ad5, 0.42, 0],
    ["fiat", 2.9, 9.95, 0xffd23f, 0.5, 0],
    ["coco", 4.45, 9.85, 0x9be15d, 0.36, 0]
  ];
  for (const [name, x, y, color, size, angle] of shots) {
    add("shot-" + name, x, y, { shape: "delta", color, size, angle });
  }
  // Chasing chevrons under the main shots
  for (const [name, x, y] of shots) {
    if (name === "coco" || name === "cellar") {
      continue;
    }
    for (let k = 0; k < 3; k++) {
      add("chev-" + name + "-" + k, x, y - 0.6 - k * 0.38, { shape: "chevron", size: 0.22, color: 0xffd23f });
    }
  }
  // The volcano's hit points, a row of embers under it; the crater, a red eye
  for (let i = 0; i < 4; i++) {
    add("lava" + i, -0.95 + i * 0.4, 14.35, { size: 0.13, color: 0xff4a1c });
  }
  add("crater", CRATER.x, CRATER.y, { size: 0.36, color: 0xff2a00, label: "tbCrater", labelAt: "inside" });
  // The magnet glows under Mamar's disc
  add("magnet", MAGNET.x, MAGNET.y, { size: 0.55, color: 0x22d3ee });
  // Le Silo: three lock lamps by the Fiat ramp's mouth
  [0, 1, 2].forEach((i) => add("lock" + i, 3.62, 8.95 + i * 0.42, { size: 0.17, color: 0xffa62b }));
  // H-O-H-O in the lanes
  HOHO.forEach((x, i) => add("hoho" + i, x, HOHO_Y - 0.5, { shape: "star", size: 0.34, color: 0xffd23f, text: "HOHO"[i] }));
  // M-E-R-G-U-E-Z by their standups
  merguezSpots().forEach((spot, i) => add("merguez" + i, spot[4], spot[5], { size: 0.2, color: 0xff6a3d, text: "MERGUEZ"[i] }));
  // The crabs flipped, a row of four over the honeycomb
  for (let i = 0; i < 4; i++) {
    add("crab" + i, -0.75 + i * 0.5, 7.05, { size: 0.15, color: 0xff3d3d });
  }
  // The general illumination: warm bulbs round the top arc and along the bottom
  for (let i = 0; i < 11; i++) {
    const a = Math.PI * (0.06 + (0.88 * i) / 10);
    add("gi-" + i, TABLE.arc.x + Math.cos(a) * (TABLE.arc.r - 0.45), TABLE.arc.y + Math.sin(a) * (TABLE.arc.r - 0.45), { shape: "bulb", size: 0.12, color: 0xffd28a });
  }
  for (let i = 0; i < 4; i++) {
    add("gi-a" + i, [-4.5, -3.55, 3.55, 4.5][i], 1.9, { shape: "bulb", size: 0.1, color: 0xffd28a });
  }
  add("kickbackR", 4.5, 2.6, { size: 0.24, color: 0xff3d3d, label: "tbReverse", labelWidth: 0.95 });
  add("post", POST.x, POST.y, { size: 0.3, color: 0xff6a3d, label: "tbSanglier", labelAt: "below" });
  add("ballSave", 0, 2.3, { size: 0.4, color: 0x22d3ee, label: "pbFieldShootAgain", labelAt: "inside" });
  add("extraBall", -1.25, 6.3, { size: 0.24, shape: "star", color: 0xffa62b, label: "pbFieldExtraBall", labelAt: "above" });
  add("note", 1.25, 6.3, { size: 0.24, shape: "star", color: 0xb06bff, label: "tbAubergine", labelAt: "above" });
  // The honeycomb of the ten missions, over the flippers, Eul' Grand Hoho under it
  const rows = [
    [5.55, [-0.78, 0, 0.78]],
    [4.87, [-1.17, -0.39, 0.39, 1.17]],
    [4.19, [-0.78, 0, 0.78]]
  ];
  let mission = 0;
  for (const [y, xs] of rows) {
    for (const x of xs) {
      add("mission" + mission, x, y, { shape: "hex", size: 0.38, color: 0xff3d8b, label: "pbShort" + mission });
      mission++;
    }
  }
  add("missionWizard", 0, 3.51, { shape: "hex", size: 0.38, color: 0xffb020, label: "pbNameWizard" });
  return lights;
}
