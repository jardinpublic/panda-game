// Draws "Eul' Flipper": a night Martinique table with neon rails, the gang on
// its bumpers and signs, and Panda on the apron. Table units (400 x 780).

import * as art from '../marathon/art.js';
import { PAL } from '../marathon/art.js';
import { L, TABLE_H } from './table.js';
import { flipperTip } from './physics.js';

const NEON = '#5ff3e6';
const NEON2 = '#ffb23e';
const TATOU = ['T', 'A', 'T', 'O', 'U'];

function glowLine(c, pts, color, width = 5, glow = 12) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.shadowColor = color;
  c.shadowBlur = glow;
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.stroke();
  c.restore();
}

function insert(c, x, y, r, on, color, label) {
  // A round playfield light.
  c.save();
  if (on) {
    c.shadowColor = color;
    c.shadowBlur = 16;
  }
  art.circle(c, x, y, r, on ? color : 'rgba(255,255,255,0.12)');
  c.restore();
  if (label) art.text(c, label, x, y + 1, { size: r * 1.2, color: on ? '#1a1238' : 'rgba(255,255,255,0.55)', shadow: false });
}

/** Static table art, cached on an offscreen canvas. */
let backdrop = null;
function drawBackdrop(c, bodies = []) {
  // Night sky to lagoon.
  art.sky(c, 400, TABLE_H, ['#1b1040', '#2b1a5e', '#123f5c', '#0b2c45']);
  // Faint madras pattern.
  c.save();
  c.globalAlpha = 0.07;
  c.fillStyle = art.madras(c);
  c.fillRect(0, 0, 400, TABLE_H);
  c.restore();
  // Stars, moon, Diamond Rock and palms printed on the playfield.
  for (let i = 0; i < 40; i++) art.circle(c, (i * 97) % 400, (i * 53) % 300, 1 + (i % 3) * 0.4, 'rgba(255,255,255,0.35)');
  // A thin crescent moon in the corner, outside the playfield.
  art.circle(c, 372, 34, 11, 'rgba(255,245,210,0.55)');
  art.circle(c, 377, 30, 10, '#1b1040');
  art.diamondRock(c, 200, 520, 90, 'rgba(10, 20, 40, 0.45)');
  c.save();
  c.globalAlpha = 0.35;
  art.palm(c, 30, 560, 150, 0, 0.18);
  art.palm(c, 350, 560, 140, 1, -0.2);
  c.restore();
  // Title in the middle of the playfield.
  c.save();
  c.globalAlpha = 0.85;
  art.text(c, 'Eul’ Flipper', 200, 470, { size: 34, color: '#fff', stroke: PAL.hibiscus });
  c.restore();
  art.madrasBand(c, 0, TABLE_H - 70, 400, 70, 0.5);
  // Static walls with their neon glow, painted once (glow is costly on phones).
  for (const b of bodies) {
    if (b.type !== 'seg' || b.tag === 'merguez' || b.tag === 'sling' || b.tag === 'plungerFloor') continue;
    glowLine(c, [[b.x1, b.y1], [b.x2, b.y2]], b.oneWay ? 'rgba(255,255,255,0.4)' : NEON, b.oneWay ? 2 : 4, 8);
  }
}

export function drawTable(c, game, t, lang) {
  const s = game.state;
  const w = game.world;
  const tr = (o) => (o && (o[lang] ?? o.en)) ?? '';
  if (!backdrop && typeof document !== 'undefined') {
    backdrop = document.createElement('canvas');
    backdrop.width = 800;
    backdrop.height = TABLE_H * 2;
    const bc = backdrop.getContext('2d');
    bc.scale(2, 2);
    drawBackdrop(bc, w.bodies);
  }
  if (backdrop) c.drawImage(backdrop, 0, 0, 400, TABLE_H);
  else drawBackdrop(c, w.bodies);

  // TATOU lanes and their letters.
  L.tatou.forEach((x, i) => insert(c, x, L.tatouY + 30, 11, s.tatou[i], NEON2, TATOU[i]));
  if (s.plunger.ready || s.t < s.skillUntil) {
    const x = L.tatou[s.skillLane];
    const p = 0.5 + 0.5 * Math.sin(t * 10);
    art.circle(c, x, L.tatouY + 30, 15 + p * 3, `rgba(255,255,255,${0.25 + p * 0.3})`);
  }

  // Bonus multiplier, lock and kickback lights.
  for (let i = 0; i < 5; i++) insert(c, 140 + i * 30, 590, 9, s.bonusX >= i + 2, PAL.hibiscus, `x${i + 2}`);
  insert(c, L.silo.x, L.silo.y + 32, 8, s.lockLit, '#7cf07a');
  insert(c, 26, 650, 8, s.kickbackLit, '#7cf07a');


  // Cous at the Fiat Panda loop, with the Old / New sign.
  art.head(c, 'cous', 30, 500, 46);
  art.text(c, s.cous === 'old' ? 'OLD' : 'NEW', 30, 528, { size: 11, color: s.cous === 'old' ? PAL.hibiscus : NEON, shadow: false });
  art.text(c, '🚗', 29, 455, { size: 16, shadow: false });

  // Eugénie at the ti-punch spinner.
  art.head(c, 'eugenie', 340, 456, 44);
  const spinAngle = t * 6;
  c.save();
  c.translate(339, 342);
  c.scale(Math.cos(spinAngle), 1);
  c.fillStyle = '#e8edf2';
  c.fillRect(-14, -3, 28, 6);
  c.restore();
  art.text(c, '🍹', 339, 300, { size: 16, shadow: false });

  // Aline's silo lock.
  c.save();
  c.fillStyle = 'rgba(200, 210, 220, 0.85)';
  art.rrect(c, L.silo.x - 20, L.silo.y - 60, 40, 46, 10);
  c.fill();
  c.restore();
  art.text(c, 'SILO', L.silo.x, L.silo.y - 37, { size: 10, color: '#344', shadow: false });
  art.circle(c, L.silo.x, L.silo.y, L.silo.r + 3, '#0b0a14');
  art.head(c, 'aline', L.silo.x - 40, L.silo.y + 6, 40);

  // Violaine at Le Molière.
  art.circle(c, L.moliere.x, L.moliere.y, L.moliere.r + 3, '#0b0a14');
  art.neon(c, 'Le Molière', L.moliere.x, L.moliere.y - 34, 13, PAL.hibiscus, t);
  art.head(c, 'violaine', L.moliere.x + 2, L.moliere.y + 40, 40);
  if (!s.mission) {
    const p = 0.5 + 0.5 * Math.sin(t * 6);
    art.circle(c, L.moliere.x, L.moliere.y, L.moliere.r + 6 + p * 4, `rgba(239,45,107,${0.25 + p * 0.25})`);
  }

  // Merguez targets.
  for (const m of game.parts.merguez) {
    c.save();
    c.lineCap = 'round';
    c.lineWidth = 9;
    c.strokeStyle = m.active ? '#c8642a' : 'rgba(200,100,42,0.18)';
    c.beginPath();
    c.moveTo(m.x1, m.y1);
    c.lineTo(m.x2, m.y2);
    c.stroke();
    c.restore();
  }

  // Georges the croco.
  const cr = game.parts.croco;
  art.ellipse(c, cr.x, cr.y + 6, cr.r * 1.5, cr.r * 0.7, 'rgba(0,0,0,0.25)');
  art.ellipse(c, cr.x, cr.y, cr.r * 1.4, cr.r, cr.flash > 0 ? '#a8f07a' : '#3f9a4f');
  art.ellipse(c, cr.x + (cr.vx >= 0 ? 12 : -12), cr.y + 2, cr.r * 0.9, cr.r * 0.55, '#57b766');
  for (const dx of [-6, 6]) {
    art.circle(c, cr.x + dx, cr.y - cr.r * 0.6, 5, '#fff7c2');
    art.circle(c, cr.x + dx, cr.y - cr.r * 0.6, 2.4, '#111');
  }

  // Slingshots: Victor's aubergine and Greg's XXL burger.
  for (const sl of game.parts.slings) {
    const left = sl.who === 'victor';
    const ax = left ? 58 : 310;
    c.save();
    c.beginPath();
    c.moveTo(ax, 548);
    c.lineTo(ax, 606);
    c.lineTo(left ? 100 : 268, 626);
    c.closePath();
    c.fillStyle = sl.flash > 0 ? '#fff3c4' : left ? '#6b2f8f' : '#c8642a';
    c.fill();
    c.restore();
    glowLine(c, [[sl.x1, sl.y1], [sl.x2, sl.y2]], sl.flash > 0 ? '#ffffff' : NEON2, 5, 14);
    art.text(c, left ? '🍆' : '🍔', left ? 70 : 298, 592, { size: 16, shadow: false });
    art.head(c, sl.who, left ? 76 : 292, 650, 34);
  }

  // Pop bumpers with Babar, Mamar and Romain.
  for (const b of game.parts.bumpers) {
    const f = b.flash || 0;
    c.save();
    c.shadowColor = PAL.hibiscus;
    c.shadowBlur = 10 + f * 20;
    art.circle(c, b.x, b.y, b.r + 4, f > 0 ? '#ffffff' : PAL.hibiscus);
    c.restore();
    art.circle(c, b.x, b.y, b.r, '#1d1438');
    art.head(c, b.who, b.x, b.y + 4, b.r * 2.4 * (1 + f * 0.15));
  }

  // Flippers.
  for (const f of w.flippers) {
    const tip = flipperTip(f);
    c.save();
    c.lineCap = 'round';
    c.strokeStyle = '#ffffff';
    c.lineWidth = 16;
    c.shadowColor = NEON;
    c.shadowBlur = 10;
    c.beginPath();
    c.moveTo(f.x, f.y);
    c.lineTo(tip.x, tip.y);
    c.stroke();
    c.lineWidth = 7;
    c.strokeStyle = PAL.hibiscus;
    c.beginPath();
    c.moveTo(f.x, f.y);
    c.lineTo(tip.x, tip.y);
    c.stroke();
    c.restore();
  }

  // Plunger spring.
  const pull = s.plunger.ready ? s.plunger.pull : 0;
  c.save();
  c.fillStyle = PAL.mango;
  art.rrect(c, 362, 742 + pull * 22, 20, 30, 4);
  c.fill();
  c.restore();

  // Panda on the apron, reacting.
  const happy = s.fauve > 0 || s.multiball || (s.mission && s.mission.n > 0);
  art.head(c, 'panda', 184, 742 + Math.sin(t * 3) * 2, 64, { rot: happy ? Math.sin(t * 8) * 0.08 : 0, hat: game.hat || 'none' });

  // Balls: shiny steel with a little trail.
  for (const b of w.balls) {
    if (!b.alive) continue;
    const g = c.createRadialGradient(b.x - 3, b.y - 3, 1, b.x, b.y, b.r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.4, '#d7dde8');
    g.addColorStop(1, '#6d778a');
    c.save();
    c.shadowColor = 'rgba(0,0,0,0.4)';
    c.shadowBlur = 6;
    c.shadowOffsetY = 3;
    art.circle(c, b.x, b.y, b.r, g);
    c.restore();
  }
}
