// "Eul' Flipper": the table layout. Logical size 400 x 780, y down.
// The whole gang has a spot:
//   Babar, Mamar, Romain  pop bumpers (top)
//   Victor, Greg          slingshots (aubergine / XXL burger)
//   Cous                  Fiat Panda orbit (left loop), Old Cous / New Cous sign
//   Eugénie               ti-punch spinner lane (right)
//   Violaine              Le Molière kick-out hole (starts missions)
//   Aline                 the Silo ball lock (multiball)
//   Panda                 the apron between the flippers, reacts to everything
//   Georges the croco     a target swimming across the middle
// Merguez drop targets light the boar kickback (Babar's pet) in the left outlane.

import { seg, circle, arc, flipper, sensor } from './physics.js';

export const TABLE_W = 400;
export const TABLE_H = 780;
export const DRAIN_Y = 772;

export const L = {
  left: 12, // playfield left wall
  laneIn: 356, // plunger lane inner wall
  right: 388, // outer right wall
  arcCx: 200,
  arcCy: 200,
  arcR: 188,
  plunger: { x: 372, y: 728 },
  flipL: { x: 116, y: 662 },
  flipR: { x: 252, y: 662 },
  flipLen: 60,
  bumpers: [
    { id: 'babar', x: 150, y: 178, r: 24 },
    { id: 'mamar', x: 240, y: 178, r: 24 },
    { id: 'romain', x: 195, y: 236, r: 24 },
  ],
  tatou: [122, 157, 192, 227, 262], // lane centres, letters T A T O U
  tatouY: 74,
  silo: { x: 84, y: 256, r: 14 }, // Aline's lock
  moliere: { x: 290, y: 312, r: 14 }, // Violaine's kick-out
  croco: { y: 398, x0: 120, x1: 250, r: 17 },
  merguez: [
    [70, 400, 86, 388],
    [92, 384, 108, 372],
    [114, 368, 130, 356],
    [136, 352, 152, 340],
  ],
  orbit: { x: 12, y: 430, w: 34, h: 40 }, // Cous's Fiat Panda loop entrance
  spinner: { x: 322, y: 330, w: 34, h: 24 }, // Eugénie's ti-punch spinner
  kickback: { x: 12, y: 680, w: 28, h: 40 },
};

/** Builds a fresh table: {bodies, flippers, sensors, parts}. */
export function buildTable() {
  const bodies = [];
  const add = (b) => (Array.isArray(b) ? bodies.push(...b) : bodies.push(b));

  // Cabinet: top arc, left wall, right wall, plunger lane.
  add(arc(L.arcCx, L.arcCy, L.arcR, Math.PI, Math.PI * 2, 28, { e: 0.4 }));
  add(seg(L.left, L.arcCy, L.left, 700, { e: 0.4 }));
  add(seg(L.right, L.arcCy, L.right, TABLE_H, { e: 0.4 }));
  add(seg(L.laneIn, 252, L.laneIn, TABLE_H, { e: 0.4 }));
  add(seg(358, 742, 386, 742, { e: 0.1, tag: 'plungerFloor' }));
  // Lane gate: lets the launched ball out, stops the playfield ball from falling in.
  add(seg(L.laneIn, 252, L.right, 214, { e: 0.3, oneWay: [0, -1] }));

  // Left orbit channel (Cous) and right spinner lane (Eugénie).
  add(seg(46, 214, 46, 470, { e: 0.4 }));
  add(circle(46, 470, 5, { e: 0.5 }));
  add(seg(322, 262, 322, 432, { e: 0.4 }));
  add(circle(322, 432, 5, { e: 0.5 }));

  // TATOU lane guides under the arc.
  for (const x of [105, 140, 175, 210, 245, 280]) add(seg(x, 60, x, 96, { e: 0.4, thick: 3 }));

  // Pop bumpers with the gang's faces.
  const bumpers = L.bumpers.map((b) => circle(b.x, b.y, b.r, { e: 0.55, kick: 330, tag: 'bumper', who: b.id, flash: 0 }));
  add(bumpers);

  // Merguez drop targets.
  const merguez = L.merguez.map(([x1, y1, x2, y2], i) => seg(x1, y1, x2, y2, { e: 0.35, tag: 'merguez', index: i, thick: 4 }));
  add(merguez);

  // Georges the croco: a moving round target.
  const croco = circle(L.croco.x0, L.croco.y, L.croco.r, { e: 0.7, kick: 120, tag: 'croco', vx: 0, flash: 0 });
  add(croco);

  // Slingshots (Victor left, Greg right) and the inlane / outlane guides.
  const slingL = seg(58, 548, 100, 626, { e: 0.4, kick: 520, tag: 'sling', who: 'victor', flash: 0, thick: 3 });
  const slingR = seg(310, 548, 268, 626, { e: 0.4, kick: 520, tag: 'sling', who: 'greg', flash: 0, thick: 3 });
  add([slingL, slingR]);
  add([seg(58, 548, 58, 606), seg(58, 606, 100, 626), seg(310, 548, 310, 606), seg(310, 606, 268, 626)]);
  add([seg(38, 520, 38, 612), seg(38, 612, L.flipL.x, 652), seg(330, 520, 330, 612), seg(330, 612, L.flipR.x, 652)]);
  add([circle(38, 520, 4), circle(330, 520, 4)]);
  // Bottom corners funnel the outlanes down to the drain.
  add([seg(L.left, 700, 26, 780), seg(L.laneIn, 700, 342, 780)]);

  const flippers = [
    flipper(L.flipL.x, L.flipL.y, L.flipLen, 0.52, -0.48, 'left'),
    flipper(L.flipR.x, L.flipR.y, L.flipLen, Math.PI - 0.52, Math.PI + 0.48, 'right'),
  ];

  const sensors = [
    ...L.tatou.map((x, i) => sensor('tatou', { x: x - 14, y: L.tatouY - 10, w: 28, h: 26 }, { index: i, dir: 'down' })),
    sensor('orbit', L.orbit, { dir: 'up' }),
    sensor('spinner', L.spinner),
    sensor('silo', { x: L.silo.x, y: L.silo.y, r: L.silo.r }),
    sensor('moliere', { x: L.moliere.x, y: L.moliere.y, r: L.moliere.r }),
    sensor('kickback', L.kickback, { dir: 'down' }),
    sensor('inlane', { x: 40, y: 600, w: 70, h: 30 }, { dir: 'down', side: 'left' }),
    sensor('inlane', { x: 262, y: 600, w: 70, h: 30 }, { dir: 'down', side: 'right' }),
    sensor('lane', { x: L.laneIn, y: 260, w: L.right - L.laneIn, h: 470 }),
  ];

  return { bodies, flippers, sensors, parts: { bumpers, merguez, croco, slings: [slingL, slingR] } };
}
