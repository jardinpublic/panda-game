// Mamar's ball (world 6): Mamar has caught the hero in his capture ball, a
// madras-and-frosted-glass dome with a gold band (our own design). The ball
// wobbles three times; each wobble ends with a CLICK and a lamp lights up.
// MASH to crack the dome before the third click locks it. Free = burst and
// "Hoho!"; locked = Mamar shouts "Olé!".

import { scene, person, head, rrect, circle, ellipse, vgrad, text, madras, PAL } from '../art.js';

const CLICKS = [0.32, 0.6, 0.88]; // click times, as a share of the game length
const WOBBLE = 0.5; // seconds of rocking before each click, at speed 1
const LAMP = ['#4be08a', PAL.mango, '#ff3b5c'];

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** Presses needed to break out at this speed (the time to do it shrinks too). */
export function pressesNeeded(speed) {
  return Math.round(8 + 2 * (speed - 1));
}

export default {
  id: 'ball',
  world: 'w06',
  input: 'mash',
  base: 4.2,
  survive: false,
  verb: { en: 'BREAK FREE!', fr: 'LIBÈRE-TOI !' },
  title: { en: "Mamar's ball", fr: "La boule de Mamar" },
  howto: { en: "Mamar caught you in his ball. Tap like crazy to break out before the third click.", fr: "Mamar t'a capturé dans sa boule. Tapote comme un fou pour sortir avant eul’ troisième clic." },
  winLine: { en: "Free! Not today, Mamar!", fr: "Libre ! Pas aujourd'hui, Mamar !" },
  rival: ["mamar", "babar"],
  rivalLine: { en: "Batistuta would never have escaped!", fr: "Batistuta, il se serait jamais échappé !" },
  loseLine: { en: "Hoho, let me out, Mamar!", fr: "Hoho, laisse-moi sortir, Mamar !" },
  create(g) {
    const W = g.W;
    const H = g.H;
    const mamar = g.cast('mamar', 'babar');
    const need = pressesNeeded(g.speed);
    const clickAt = CLICKS.map((k) => k * g.duration);
    const wobble = WOBBLE / Math.sqrt(g.speed);
    const R = 98;
    const bx = 160;
    const by = H * 0.7;
    // Crack paths across the dome, fixed per game.
    const cracks = Array.from({ length: 5 }, (_, i) => {
      const a = Math.PI + 0.35 + (i / 4) * (Math.PI - 0.7) + (g.random() - 0.5) * 0.2;
      const pts = [[Math.cos(a) * R * 0.98, Math.sin(a) * R * 0.98]];
      for (let j = 1; j < 5; j++) {
        const [px, py] = pts[j - 1];
        pts.push([px * 0.78 + (g.random() - 0.5) * 22, py * 0.78 + (g.random() - 0.5) * 16]);
      }
      return pts;
    });
    const s = { t: 0, hits: 0, clicks: 0, jolt: 0, joltDir: 1, free: false, locked: false, endT: 0, ended: false, lampFlash: 0, botN: 0 };

    function breakFree() {
      s.free = true;
      s.ended = true;
      g.sfx.good();
      g.sfx.hoho();
      g.fx.shake(10);
      g.fx.flash('rgba(255,255,255,0.5)');
      g.fx.burst(bx, by - R * 0.4, { kind: 'spark', n: 34, colors: ['#ffffff', '#cfefff', '#9fe3ff'], speed: 340 });
      g.fx.burst(bx, by - R * 0.4, { kind: 'confetti', n: 30 });
      g.say(bx, by - 210, g.tr({ en: 'Hoho! Free!', fr: 'Hoho ! Libéré !' }), 1.4);
      g.win();
    }

    function lock() {
      s.locked = true;
      s.ended = true;
      g.sfx.tick(true);
      g.sfx.bad();
      g.fx.shake(6);
      g.fx.burst(bx, by - R, { kind: 'spark', n: 18, colors: [PAL.mango, '#fff3b0'], speed: 200 });
      g.say(300, H * 0.6 - 215, g.tr({ en: 'Olé! Caught!', fr: 'Olé ! Attrapé !' }), 1.6);
      g.lose();
    }

    return {
      update(dt) {
        s.t += dt;
        s.jolt = Math.max(0, s.jolt - dt * 7);
        s.lampFlash = Math.max(0, s.lampFlash - dt * 3);
        if (g.done) {
          s.endT += dt;
          if (!s.ended) {
            s.ended = true;
            s.locked = true;
          }
          return;
        }
        while (s.clicks < 3 && g.elapsed >= clickAt[s.clicks]) {
          s.clicks++;
          s.lampFlash = 1;
          if (s.clicks === 3) {
            lock();
            break;
          }
          g.sfx.tick();
          g.fx.text(bx, by - R - 30, g.tr({ en: 'CLICK!', fr: 'CLIC !' }), { size: 28, color: LAMP[s.clicks - 1] });
        }
      },
      press() {
        if (s.free || s.locked) return;
        s.hits++;
        s.jolt = 1;
        s.joltDir = s.hits % 2 ? 1 : -1;
        g.sfx.tap();
        g.fx.burst(bx + s.joltDir * 30, by - R * 0.6, { kind: 'spark', n: 4, colors: ['#ffffff', '#bfe9ff'], speed: 160 });
        if (s.hits >= need) breakFree();
      },
      draw(c) {
        scene.beach(c, W, H, s.t);
        // Mamar, football fan, with his ball at his feet.
        const mx = 305;
        const my = H * 0.6;
        const mPose = s.free ? 'sad' : s.locked ? 'cheer' : 'point';
        person(c, mamar, mx, my, 200, mPose, s.t, { flip: !s.locked });
        circle(c, mx + 52, my - 13, 13, '#ffffff');
        for (let i = 0; i < 5; i++) circle(c, mx + 52 + Math.cos(i * 1.26 + s.t) * 7, my - 13 + Math.sin(i * 1.26 + s.t) * 7, 3, '#2a2a33');
        // Rocking: a wobble before each click, a jolt on each press.
        let rot = 0;
        if (!g.done) {
          const next = clickAt[s.clicks];
          const u = next !== undefined ? 1 - (next - g.elapsed) / wobble : -1;
          if (u > 0 && u < 1) rot = Math.sin(u * Math.PI * 4) * 0.32 * Math.sin(u * Math.PI);
        }
        rot += s.jolt * s.joltDir * 0.18;
        const crack = clamp01(s.hits / need);
        if (s.locked) rot = Math.sin(s.endT * 20) * 0.04 * Math.max(0, 1 - s.endT * 2);
        const hop = s.jolt * 14;
        ellipse(c, bx, by + R + 4, R * 0.95, R * 0.2, 'rgba(20,10,40,0.25)');
        if (!s.free) {
          drawBall(c, bx, by - hop, R, s.t, { rot, hero: g.hero, hat: g.hat, crack, cracks, lamp: s.clicks, flash: s.lampFlash, struggle: crack > 0 && !s.locked });
        } else {
          // Shell halves fly apart, the hero pops out cheering.
          const k = clamp01(s.endT / 0.5);
          drawHalf(c, bx - 30 - k * 120, by + k * 30, R, -k * 1.2, 1 - k * 0.6);
          drawHalf(c, bx + 30 + k * 120, by + k * 30, R, k * 1.2, 1 - k * 0.6);
          const pop = Math.min(1, s.endT * 5);
          const size = 200 * (0.6 + 0.4 * pop + Math.sin(Math.min(1, s.endT * 3) * Math.PI) * 0.1);
          person(c, g.hero, bx, by + R, size, 'cheer', s.t, { hat: g.hat });
        }
        // Three lamps: how many clicks are gone.
        for (let i = 0; i < 3; i++) {
          const lit = i < s.clicks;
          const lx = bx - 40 + i * 40;
          const ly = by - R - 70;
          if (lit) {
            const glow = c.createRadialGradient(lx, ly, 2, lx, ly, 26);
            glow.addColorStop(0, LAMP[i]);
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            c.fillStyle = glow;
            c.fillRect(lx - 26, ly - 26, 52, 52);
          }
          circle(c, lx, ly, 11, lit ? LAMP[i] : 'rgba(255,255,255,0.35)');
          circle(c, lx - 3, ly - 3, 3.5, 'rgba(255,255,255,0.7)');
        }
        if (s.locked) {
          for (let i = 0; i < 3; i++) {
            const a = s.endT * 4 + (i * Math.PI * 2) / 3;
            star(c, bx + Math.cos(a) * 70, by - R - 20 + Math.sin(a) * 18, 10, PAL.mango);
          }
        }
        if (!g.done) {
          const left = need - s.hits;
          text(c, `👊 ×${left}`, bx, by + R + 48, { size: 26 + s.jolt * 8, color: PAL.cream, stroke: PAL.deep });
        }
      },
      bot() {
        s.botN++;
        return s.botN % 5 === 0 ? { press: [bx, by] } : null;
      },
    };
  },
};

/** The capture ball: madras bottom, frosted glass dome with the hero inside. */
function drawBall(c, x, y, R, t, { rot, hero, hat, crack, cracks, lamp, flash, struggle }) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  // Hero squashed inside the dome.
  c.save();
  c.beginPath();
  c.arc(0, 0, R, Math.PI, Math.PI * 2);
  c.closePath();
  c.clip();
  c.fillStyle = vgrad(c, -R, 0, ['#e9f6ff', '#bfe0f2']);
  c.fillRect(-R, -R, R * 2, R);
  const wig = struggle ? Math.sin(t * 30) * 0.1 : Math.sin(t * 2) * 0.05;
  head(c, hero, 0, -R * 0.32, R * 1.15, { hat, squash: 0.9, rot: wig });
  c.restore();
  // Bottom half in madras.
  c.save();
  c.beginPath();
  c.arc(0, 0, R, 0, Math.PI);
  c.closePath();
  c.clip();
  c.scale(0.7, 0.7);
  c.fillStyle = madras(c);
  c.fillRect(-R * 1.5, -R * 0.2, R * 3, R * 2);
  c.restore();
  const shade = c.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R * 1.05);
  shade.addColorStop(0, 'rgba(255,255,255,0.35)');
  shade.addColorStop(0.6, 'rgba(255,255,255,0.05)');
  shade.addColorStop(1, 'rgba(40,10,40,0.35)');
  circle(c, 0, 0, R, shade);
  // Frosted glass sheen on the dome.
  c.save();
  c.beginPath();
  c.arc(0, 0, R, Math.PI, Math.PI * 2);
  c.closePath();
  c.fillStyle = 'rgba(235,248,255,0.35)';
  c.fill();
  c.restore();
  ellipse(c, -R * 0.45, -R * 0.62, R * 0.24, R * 0.09, 'rgba(255,255,255,0.75)', -0.6);
  // Cracks spreading as the hero struggles.
  const shown = crack * cracks.length;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (let i = 0; i < cracks.length; i++) {
    const part = clamp01(shown - i);
    if (part <= 0) break;
    const pts = cracks[i];
    const n = Math.max(2, Math.ceil(part * pts.length));
    for (const [col, wdt] of [['rgba(30,60,100,0.45)', 4.5], ['#ffffff', 2.2]]) {
      c.strokeStyle = col;
      c.lineWidth = wdt;
      c.beginPath();
      pts.slice(0, n).forEach(([px, py], j) => (j ? c.lineTo(px, py) : c.moveTo(px, py)));
      c.stroke();
    }
  }
  // Gold band and the lock button.
  rrect(c, -R - 2, -10, R * 2 + 4, 20, 10);
  c.fillStyle = vgrad(c, -10, 10, ['#ffe58a', '#d9952b']);
  c.fill();
  circle(c, 0, 0, 25, '#fff7ea');
  const lampCol = lamp > 0 ? LAMP[Math.min(2, lamp - 1)] : '#9aa4b8';
  if (flash > 0) circle(c, 0, 0, 25 + flash * 16, `rgba(255,255,255,${0.5 * flash})`);
  circle(c, 0, 0, 15, lampCol);
  circle(c, -4, -4, 4, 'rgba(255,255,255,0.75)');
  c.restore();
}

/** One flying half of the broken shell. */
function drawHalf(c, x, y, R, rot, alpha) {
  c.save();
  c.globalAlpha = Math.max(0, alpha);
  c.translate(x, y);
  c.rotate(rot);
  c.beginPath();
  c.arc(0, 0, R * 0.7, 0, Math.PI);
  c.closePath();
  c.save();
  c.clip();
  c.scale(0.5, 0.5);
  c.fillStyle = madras(c);
  c.fillRect(-R * 1.5, -R * 0.2, R * 3, R * 2);
  c.restore();
  rrect(c, -R * 0.7 - 2, -7, R * 1.4 + 4, 14, 7);
  c.fillStyle = '#e9b347';
  c.fill();
  c.restore();
}

function star(c, x, y, r, color) {
  c.save();
  c.translate(x, y);
  c.fillStyle = color;
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  c.fill();
  c.restore();
}
