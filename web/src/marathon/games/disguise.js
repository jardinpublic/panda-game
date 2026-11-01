// Soirée fauve, Cous's 40th (world 7): 4-6 guests in leopard, lion and tiger
// costumes and masks. One of them is the hero. TAP the right one. Tell: the
// hero can't help it, a tiny yellow "Hoho" bubble pops over his mask now and
// then (and his own hair pokes out round the mask). At higher speed the guests
// swap places shell-game style first. Wrong guest = lose.

import { scene, head, rrect, circle, ellipse, shadowed, text, neon, groundShadow, PAL } from '../art.js';

const PRINTS = {
  leopard: { base: '#f0b54a', dark: '#5a3518', light: '#fbe6b4' },
  tiger: { base: '#f2862e', dark: '#2a1a12', light: '#fff1dc' },
  lion: { base: '#e6ad5a', dark: '#9a5420', light: '#fff0cf' },
};
const KINDS = Object.keys(PRINTS);

const smooth = (u) => u * u * (3 - 2 * u);
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** Slot positions [x, feet as a share of H] for n guests. */
function slotsFor(n) {
  if (n <= 4) return [[62, 0.74], [154, 0.74], [246, 0.74], [338, 0.74]].slice(0, n);
  const back = [[90, 0.58], [200, 0.58], [310, 0.58]];
  return n === 5 ? [...back, [140, 0.8], [260, 0.8]] : [...back, [78, 0.8], [200, 0.8], [322, 0.8]];
}

/** Animal print over a rectangle (spots, stripes or a lion's plain coat). */
function printFill(c, kind, x, y, w, h) {
  const p = PRINTS[kind];
  c.fillStyle = p.base;
  c.fillRect(x, y, w, h);
  if (kind === 'leopard') {
    c.strokeStyle = p.dark;
    c.lineWidth = Math.max(1.5, w * 0.035);
    for (let i = 0; i < 12; i++) {
      const sx = x + ((i * 37) % 100) / 100 * w;
      const sy = y + ((i * 61) % 100) / 100 * h;
      const r = Math.max(2, w * 0.06);
      circle(c, sx, sy, r * 0.6, '#d98e2c');
      c.beginPath();
      c.arc(sx, sy, r, 0.3, Math.PI * 1.7);
      c.stroke();
    }
  } else if (kind === 'tiger') {
    c.fillStyle = p.dark;
    for (let i = 0; i < 6; i++) {
      const sy = y + (i + 0.5) * (h / 6);
      for (const side of [0, 1]) {
        const sx = side ? x + w : x;
        const dir = side ? -1 : 1;
        c.beginPath();
        c.moveTo(sx, sy - h * 0.035);
        c.quadraticCurveTo(sx + dir * w * 0.25, sy, sx + dir * w * 0.38, sy + h * 0.02);
        c.quadraticCurveTo(sx + dir * w * 0.2, sy + h * 0.03, sx, sy + h * 0.035);
        c.fill();
      }
    }
  } else {
    ellipse(c, x + w / 2, y + h * 0.65, w * 0.3, h * 0.35, 'rgba(255,240,210,0.45)');
  }
}

/** An animal mask over a head centred at (0, 0), h tall. lift 0..1 pushes it up. */
function drawMask(c, kind, h, lift) {
  const p = PRINTS[kind];
  c.save();
  c.translate(0, -lift * h * 0.5);
  c.rotate(-lift * 0.35);
  c.scale(1 - lift * 0.2, 1 - lift * 0.2);
  const fx = -0.02 * h;
  const fy = -0.08 * h;
  if (kind === 'lion') {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      ellipse(c, fx + Math.cos(a) * h * 0.3, fy + Math.sin(a) * h * 0.32, h * 0.12, h * 0.08, i % 2 ? p.dark : '#c47a30', a);
    }
  }
  // Ears.
  for (const side of [-1, 1]) {
    const ex = fx + side * h * 0.19;
    const ey = fy - h * 0.25;
    if (kind === 'lion') {
      circle(c, ex, ey + h * 0.02, h * 0.07, p.base);
      circle(c, ex, ey + h * 0.02, h * 0.04, '#e58d7a');
    } else {
      c.fillStyle = p.base;
      c.beginPath();
      c.moveTo(ex - side * h * 0.1, ey + h * 0.08);
      c.quadraticCurveTo(ex + side * h * 0.02, ey - h * 0.16, ex + side * h * 0.1, ey + h * 0.04);
      c.closePath();
      c.fill();
      circle(c, ex + side * h * 0.01, ey + h * 0.01, h * 0.035, kind === 'tiger' ? p.dark : '#e58d7a');
    }
  }
  // Face plate with its print.
  shadowed(c, () => ellipse(c, fx, fy, h * 0.27, h * 0.3, p.base), 8, 3);
  c.save();
  c.beginPath();
  c.ellipse(fx, fy, h * 0.27, h * 0.3, 0, 0, Math.PI * 2);
  c.clip();
  printFill(c, kind, fx - h * 0.27, fy - h * 0.3, h * 0.54, h * 0.6);
  ellipse(c, fx - h * 0.1, fy - h * 0.16, h * 0.12, h * 0.06, 'rgba(255,255,255,0.22)', -0.4);
  c.restore();
  // Muzzle, nose, eye holes, whiskers.
  ellipse(c, fx - h * 0.06, fy + h * 0.15, h * 0.085, h * 0.07, p.light);
  ellipse(c, fx + h * 0.06, fy + h * 0.15, h * 0.085, h * 0.07, p.light);
  ellipse(c, fx, fy + h * 0.21, h * 0.06, h * 0.04, p.light);
  c.fillStyle = '#3a2018';
  c.beginPath();
  c.moveTo(fx - h * 0.045, fy + h * 0.085);
  c.quadraticCurveTo(fx, fy + h * 0.07, fx + h * 0.045, fy + h * 0.085);
  c.quadraticCurveTo(fx, fy + h * 0.15, fx - h * 0.045, fy + h * 0.085);
  c.fill();
  for (const side of [-1, 1]) {
    ellipse(c, fx + side * h * 0.1, fy - h * 0.02, h * 0.055, h * 0.03, PAL.ink, side * 0.25);
    circle(c, fx + side * h * 0.1 + h * 0.015, fy - h * 0.03, h * 0.009, '#ffffff');
  }
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = Math.max(1, h * 0.008);
  for (const side of [-1, 1]) {
    for (let i = -1; i <= 1; i++) {
      c.beginPath();
      c.moveTo(fx + side * h * 0.1, fy + h * 0.15 + i * h * 0.02);
      c.lineTo(fx + side * h * 0.25, fy + h * 0.13 + i * h * 0.04);
      c.stroke();
    }
  }
  c.restore();
}

/** A costumed guest, feet at (x, y), s tall. */
function drawGuest(c, gst, x, y, s, t, { lift = 0, hop = 0, dance = false }) {
  const p = PRINTS[gst.kind];
  const legH = s * 0.2;
  const torsoH = s * 0.27;
  const torsoW = s * 0.27;
  const headH = s * 0.55;
  const bob = dance ? Math.abs(Math.sin(t * 8 + gst.phase)) * s * 0.05 : Math.sin(t * 3 + gst.phase) * s * 0.01;
  const hip = -legH - bob - hop;
  const top = hip - torsoH;
  c.save();
  groundShadow(c, x, y, torsoW * 1.7);
  c.translate(x, y);
  c.rotate(Math.sin(t * 2 + gst.phase) * 0.03 + (dance ? Math.sin(t * 8 + gst.phase) * 0.06 : 0));
  // Tail.
  c.lineCap = 'round';
  c.strokeStyle = p.base;
  c.lineWidth = s * 0.045;
  const sw = Math.sin(t * 4 + gst.phase) * s * 0.06;
  c.beginPath();
  c.moveTo(torsoW * 0.3, hip - s * 0.02);
  c.quadraticCurveTo(torsoW * 1.1, hip + s * 0.02, torsoW * 0.9 + sw, hip - s * 0.16);
  c.stroke();
  circle(c, torsoW * 0.9 + sw, hip - s * 0.16, s * 0.035, gst.kind === 'lion' ? p.dark : PAL.ink);
  // Legs and paws.
  c.strokeStyle = p.base;
  c.lineWidth = s * 0.085;
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * torsoW * 0.22, hip);
    c.lineTo(side * torsoW * 0.24, -s * 0.02);
    c.stroke();
    ellipse(c, side * torsoW * 0.26, -s * 0.01, s * 0.055, s * 0.03, p.light);
  }
  // Onesie body.
  c.save();
  rrect(c, -torsoW / 2, top, torsoW, torsoH + s * 0.03, torsoW * 0.4);
  c.clip();
  printFill(c, gst.kind, -torsoW / 2, top, torsoW, torsoH + s * 0.03);
  c.fillStyle = 'rgba(255,255,255,0.16)';
  c.fillRect(-torsoW / 2, top, torsoW * 0.32, torsoH + s * 0.03);
  c.fillStyle = 'rgba(0,0,0,0.12)';
  c.fillRect(torsoW * 0.22, top, torsoW * 0.3, torsoH + s * 0.03);
  c.restore();
  // Arms with paw mittens.
  c.strokeStyle = p.base;
  c.lineWidth = s * 0.075;
  const arm = dance ? 1.9 + Math.sin(t * 8 + gst.phase) * 0.7 : 0.3;
  for (const side of [-1, 1]) {
    const a = side === 1 ? arm : dance ? 1.9 - Math.sin(t * 8 + gst.phase) * 0.7 : 0.3;
    const sx = side * torsoW * 0.47;
    const sy = top + s * 0.04;
    const ex = sx + side * Math.sin(a) * s * 0.2;
    const ey = sy + Math.cos(a) * s * 0.2;
    c.beginPath();
    c.moveTo(sx, sy);
    c.lineTo(ex, ey);
    c.stroke();
    circle(c, ex, ey, s * 0.045, p.light);
  }
  // The friend's own head, then the mask over it.
  const hy = top - headH * 0.38;
  c.translate(0, hy);
  head(c, gst.id, 0, 0, headH);
  drawMask(c, gst.kind, headH, lift);
  c.restore();
}

/** Small speech bubble above (x, y). */
function mini(c, str, x, y, bg, fg) {
  const w = str.length * 9 + 22;
  const h = 26;
  const bx = Math.max(4, Math.min(396 - w, x - w / 2));
  shadowed(c, () => {
    rrect(c, bx, y - h, w, h, 13);
    c.fillStyle = bg;
    c.fill();
    c.beginPath();
    c.moveTo(x - 5, y - 2);
    c.lineTo(x - 1, y + 7);
    c.lineTo(x + 5, y - 2);
    c.fill();
  }, 8, 3);
  text(c, str, bx + w / 2, y - h / 2, { size: 15, color: fg, shadow: false });
}

export default {
  id: 'disguise',
  world: 'w07',
  input: 'tap',
  base: 5,
  min: 2.6,
  survive: false,
  verb: { en: 'FIND YOURSELF!', fr: 'TROUVE-TOI !' },
  title: { en: "Soirée fauve", fr: "Soirée fauve" },
  howto: { en: "Everyone's in animal costume. Watch for the tiny \"Hoho\" and tap the real you.", fr: "Tout le monde est déguisé. Repère le petit « Hoho » et touche le vrai toi." },
  winLine: { en: "Found you, wild one!", fr: "Trouvé, le fauve !" },
  create(g) {
    const W = g.W;
    const H = g.H;
    const n = g.speed < 1.4 ? 4 : g.speed < 2 ? 5 : 6;
    const slots = slotsFor(n).map(([x, k]) => ({ x, y: H * k, size: k < 0.7 ? 150 : 172 }));
    const ids = [g.hero];
    if (g.hero !== 'cous') ids.push('cous'); // the birthday boy is in disguise too
    while (ids.length < n) ids.push(g.friend(ids));
    // Shuffle who stands where.
    const order = ids.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(g.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const guests = ids.map((id, i) => ({
      id,
      hero: i === 0,
      kind: KINDS[Math.floor(g.random() * KINDS.length)],
      slot: order[i],
      from: order[i],
      to: order[i],
      u: 1,
      arc: 0,
      phase: g.random() * 6,
      lift: 0,
    }));
    const hero = guests[0];
    const others = guests.slice(1);
    // Shell-game swaps; the first one always moves the hero.
    const swapCount = g.speed < 1.3 ? 1 : g.speed < 1.9 ? 2 : 3;
    const swapDur = 0.36 / g.speed;
    const shuffleStart = 0.75 / Math.sqrt(g.speed);
    const swaps = Array.from({ length: swapCount }, (_, i) => {
      const a = i === 0 ? hero : guests[Math.floor(g.random() * guests.length)];
      const pool = guests.filter((q) => q !== a);
      const b = pool[Math.floor(g.random() * pool.length)];
      return { at: shuffleStart + i * swapDur * 1.1, a, b, started: false };
    });
    const shuffleEnd = shuffleStart + swapCount * swapDur * 1.1;
    const tellFrom = shuffleEnd + 0.12;
    const period = 0.9 / Math.sqrt(g.speed);
    const s = { t: 0, picked: null, ended: false, endT: 0, lastHoho: false };

    function pos(q) {
      const A = slots[q.from];
      const B = slots[q.to];
      const k = smooth(clamp01(q.u));
      return {
        x: A.x + (B.x - A.x) * k,
        y: A.y + (B.y - A.y) * k + q.arc * Math.sin(k * Math.PI) * 55,
        size: A.size + (B.size - A.size) * k,
      };
    }

    function hohoOn(t) {
      if (t >= 0.1 && t < 0.6) return true;
      if (t < tellFrom) return false;
      return (t - tellFrom) % period < 0.4;
    }

    function decoy(t) {
      if (t < tellFrom || !others.length) return null;
      const k = (t - tellFrom + period / 2) % period;
      if (k > 0.35) return null;
      const cycle = Math.floor((t - tellFrom + period / 2) / period);
      return others[(cycle * 7 + 3) % others.length];
    }

    function pick(q) {
      s.picked = q;
      s.ended = true;
      const p = pos(q);
      if (q.hero) {
        g.sfx.good();
        g.sfx.hoho();
        g.fx.burst(p.x, p.y - p.size * 0.8, { kind: 'confetti', n: 36 });
        g.fx.burst(p.x, p.y - p.size * 0.8, { kind: 'petal', n: 10 });
        g.say(p.x, p.y - p.size * 1.05, g.tr({ en: 'Hoho! It\'s me!', fr: 'Hoho ! C\'est moi !' }), 1.4);
        g.win();
      } else {
        g.sfx.bad();
        g.fx.shake(10);
        g.fx.burst(p.x, p.y - p.size * 0.8, { kind: 'smoke', n: 10, speed: 80 });
        g.say(p.x, p.y - p.size * 1.05, g.tr({ en: 'Nope, wrong cat!', fr: 'Raté, mauvais fauve !' }), 1.4);
        g.lose();
      }
    }

    return {
      update(dt) {
        s.t += dt;
        if (!g.done) {
          for (const sw of swaps) {
            if (sw.started || s.t < sw.at) continue;
            sw.started = true;
            const sa = sw.a.slot;
            const sb = sw.b.slot;
            Object.assign(sw.a, { from: sa, to: sb, slot: sb, u: 0, arc: -1 });
            Object.assign(sw.b, { from: sb, to: sa, slot: sa, u: 0, arc: 1 });
            g.sfx.whoosh();
          }
          const on = hohoOn(s.t);
          if (on && !s.lastHoho) {
            if (s.t < 0.6) g.sfx.hoho();
            else g.sfx.click();
          }
          s.lastHoho = on;
        }
        for (const q of guests) {
          if (q.u < 1) q.u = Math.min(1, q.u + dt / swapDur);
        }
        if (g.done) {
          s.endT += dt;
          if (!s.ended) {
            // Time out: the hero reveals himself.
            s.ended = true;
            g.sfx.bad();
            const p = pos(hero);
            g.say(p.x, p.y - p.size * 1.05, g.tr({ en: 'Hoho, I was here!', fr: 'Hoho, j\'étais là !' }), 1.4);
          }
          if (s.picked) s.picked.lift = Math.min(1, s.picked.lift + dt * 5);
          if (!g.won && s.endT > 0.3) hero.lift = Math.min(1, hero.lift + dt * 5);
        }
      },
      press(x, y) {
        if (s.picked) return;
        let best = null;
        let bestD = Infinity;
        for (const q of guests) {
          const p = pos(q);
          const d = Math.hypot(p.x - x, p.y - p.size * 0.5 - y);
          if (d < p.size * 0.55 && d < bestD) {
            best = q;
            bestD = d;
          }
        }
        if (!best) return;
        g.sfx.tap();
        pick(best);
      },
      draw(c) {
        scene.garden(c, W, H, s.t);
        neon(c, g.tr({ en: 'COUS IS 40!', fr: 'COUS A 40 ANS !' }), 200, 238, 30, PAL.mango, s.t);
        text(c, g.tr({ en: 'wild party', fr: 'soirée fauve' }), 200, 272, { size: 18, color: PAL.cream, weight: 600 });
        const sorted = [...guests].sort((a, b) => pos(a).y - pos(b).y);
        const hoho = !g.done && hohoOn(s.t);
        const fake = !g.done ? decoy(s.t) : null;
        const party = g.done && g.won;
        for (const q of sorted) {
          const p = pos(q);
          const hop = q.hero && hoho ? Math.abs(Math.sin(s.t * 18)) * 6 : 0;
          drawGuest(c, q, p.x, p.y, p.size, s.t, { lift: q.lift, hop, dance: party && !q.hero });
          if (party && q.hero) text(c, '★', p.x, p.y - p.size * 1.12, { size: 30, color: PAL.mango });
        }
        // Bubbles on top of everyone.
        const headTop = (q) => {
          const p = pos(q);
          return [p.x + p.size * 0.16, p.y - p.size * 0.95];
        };
        if (hoho) {
          const [x, y] = headTop(hero);
          mini(c, 'Hoho', x, y, PAL.mango, PAL.ink);
        }
        if (fake) {
          const [x, y] = headTop(fake);
          mini(c, g.tr({ en: 'Rrrr!', fr: 'Grrr !' }), x, y, 'rgba(255,255,255,0.92)', PAL.violet);
        }
        if (g.done && !g.won && hero.lift > 0.5) {
          const [x, y] = headTop(hero);
          mini(c, 'Hoho', x, y, PAL.mango, PAL.ink);
        }
      },
      bot() {
        if (g.done || g.elapsed < tellFrom + 0.1) return null;
        const p = pos(hero);
        return { press: [p.x, p.y - p.size * 0.5] };
      },
    };
  },
};
