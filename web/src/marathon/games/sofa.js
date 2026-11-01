// Le Molière, 4 am (world 5): the hero slumps on the club sofa and his eyelids
// keep sliding shut, faster with speed. MASH to prop them open until the timer
// runs out. Eyes fully shut = he is asleep and the gang doodles on his face.
// Tell: before each heavy nod he yawns ("Haaa…") and leans back.

import { scene, person, head, rrect, circle, ellipse, vgrad, shadowed, text, neon, madras, PAL, OUTFITS } from '../art.js';

const START_LID = 0.3; // 0 = wide open, 1 = asleep
const LIFT = 0.12; // lid lifted by one press
const DROWSE = 0.34; // lid closing per second at speed 1 (x1.5 by the end)
const NOD_RATE = 2.4; // closing multiplier during a heavy nod
const MARKER = '#2f6fe4';

// Eye centres and radii in the cast SVG coordinates (viewBox 20 20 360 440),
// so the lids sit exactly on each caricature's eyes.
const EYES = {
  panda: [[178.3, 212.7, 12.3, 7.4], [252.5, 212.7, 15, 9]],
  cous: [[179.7, 221.6, 11.7, 7], [246.5, 221.6, 14.3, 8.6]],
  mamar: [[179.7, 208.7, 12.3, 4.1], [246.5, 208.7, 15, 5]],
  babar: [[177.3, 199.8, 12.3, 4.1], [257, 199.8, 15, 5]],
  victor: [[178.7, 201, 12.3, 6], [251, 200, 15, 7]],
  greg: [[178.7, 202, 12.3, 6], [251, 201, 15, 7]],
  romain: [[179.4, 218.4, 12.3, 9.5], [248, 218.4, 15, 11.5]],
  eugenie: [[178.3, 198.1, 12.3, 9.5], [252.5, 198.1, 15, 11.5]],
  violaine: [[179.7, 206.2, 12.3, 9.5], [246.5, 206.2, 15, 11.5]],
  aline: [[180, 203.8, 11.9, 9.2], [244.9, 203.8, 14.5, 11.2]],
};

const clamp01 = (v) => Math.max(0, Math.min(1, v));

function mixHex(a, b, k) {
  const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16));
  const pb = b.match(/\w\w/g).map((h) => parseInt(h, 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(',')})`;
}

/** Eye shapes in head-local units for a head h tall. */
function eyesOf(id, h) {
  return (EYES[id] || EYES.panda).map(([sx, sy, rx, ry]) => ({
    x: ((sx - 200) / 440) * h,
    y: ((sy - 240) / 440) * h,
    rx: ((rx + 4) / 440) * h,
    ry: ((Math.max(ry, 6) + 5) / 440) * h,
  }));
}

/** One upper eyelid sliding down over an eye (lid 0..1), with its lash line. */
function drawLid(c, e, lid, skin, k) {
  if (lid < 0.03) return;
  const top = e.y - e.ry - 2;
  const edge = top + (2 * e.ry + 4) * lid;
  const bulge = e.ry * 0.45;
  c.save();
  c.beginPath();
  c.ellipse(e.x, e.y, e.rx, e.ry, 0, 0, Math.PI * 2);
  c.clip();
  c.fillStyle = vgrad(c, top, edge + bulge, [mixHex(skin, '#6b3a3a', 0.4), skin]);
  c.beginPath();
  c.moveTo(e.x - e.rx - 3, top - 3);
  c.lineTo(e.x + e.rx + 3, top - 3);
  c.lineTo(e.x + e.rx + 3, edge);
  c.quadraticCurveTo(e.x, edge + bulge * 2, e.x - e.rx - 3, edge);
  c.closePath();
  c.fill();
  c.strokeStyle = '#2a1d18';
  c.lineWidth = 3 * k;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(e.x - e.rx - 3, edge);
  c.quadraticCurveTo(e.x, edge + bulge * 2, e.x + e.rx + 3, edge);
  c.stroke();
  c.restore();
  if (lid > 0.55) {
    // Sleepy lashes droop under the lid.
    c.strokeStyle = '#2a1d18';
    c.lineWidth = 2.2 * k;
    for (const u of [0.3, 0.5, 0.7]) {
      const px = e.x - e.rx * 0.8 + e.rx * 1.6 * u;
      const py = edge + bulge * 2 * 2 * u * (1 - u);
      c.beginPath();
      c.moveTo(px, py);
      c.lineTo(px + (u - 0.5) * 6 * k, py + 6 * k);
      c.stroke();
    }
  }
}

export default {
  id: 'sofa',
  world: 'w05',
  input: 'mash',
  base: 4.5,
  survive: true,
  verb: { en: 'STAY AWAKE!', fr: 'RESTE ÉVEILLÉ !' },
  title: { en: "4 am at Le Molière", fr: "4h du mat' au Molière" },
  howto: { en: "Panda's falling asleep on the sofa. Tap again and again to keep his eyes open.", fr: "Panda s'endort sur le canapé. Tapote encore et encore pour garder ses yeux ouverts." },
  winLine: { en: "Still up at 5 am!", fr: "Encore debout à 5h !" },
  create(g) {
    const W = g.W;
    const H = g.H;
    const dancer1 = g.friend();
    const dancer2 = g.friend([dancer1]);
    const skin = (OUTFITS[g.hero] || OUTFITS.panda).skin;
    const outfit = OUTFITS[g.hero] || OUTFITS.panda;
    const hat = g.hat === 'shades' ? 'none' : g.hat; // shades would hide the eyelids
    const headH = Math.min(360, H * 0.44);
    const headX = 200;
    const headY = H * 0.47;
    const eyes = eyesOf(g.hero, headH);
    const unit = headH / 440;
    const s = {
      t: 0,
      lid: START_LID,
      show: START_LID,
      kick: 0,
      phase: 'calm', // calm -> yawn -> nod -> calm
      phaseT: 0,
      calmFor: (0.8 + g.random() * 0.4) / g.speed,
      ended: false,
      endT: 0,
      botN: 0,
    };
    const yawnFor = 0.38 / g.speed;
    const nodFor = 0.3 / g.speed;

    function fallAsleep() {
      s.lid = 1;
      s.ended = true;
      g.sfx.bad();
      g.fx.shake(8);
      g.fx.text(headX + 90, headY - headH * 0.45, 'Zzz…', { size: 40, color: PAL.cream, life: 1.4 });
      g.say(70, H * 0.3, g.tr({ en: 'He\'s out! Markers!', fr: 'I ka dòmi ! Les feutres !' }), 1.6);
      g.lose();
    }

    function nextPhase() {
      s.phaseT = 0;
      if (s.phase === 'calm') {
        s.phase = 'yawn';
        g.sfx.whoosh();
      } else if (s.phase === 'yawn') {
        s.phase = 'nod';
      } else {
        s.phase = 'calm';
        s.calmFor = (0.7 + g.random() * 0.5) / g.speed;
      }
    }

    return {
      update(dt) {
        s.t += dt;
        s.kick = Math.max(0, s.kick - dt * 6);
        if (g.done) {
          s.endT += dt;
          if (!s.ended) {
            // Survived the timer: eyes pop open, big "Hoho!".
            s.ended = true;
            g.sfx.hoho();
            g.sfx.good();
            g.fx.burst(headX, headY - headH * 0.3, { kind: 'confetti', n: 36 });
            g.say(headX, headY - headH * 0.5, g.tr({ en: 'Hoho! Still up at 5 am!', fr: 'Hoho ! Toujours là à 5 h !' }), 1.6);
          }
          if (g.won) s.lid = Math.max(0, s.lid - dt * 3);
          s.show += (s.lid - s.show) * Math.min(1, dt * 20);
          return;
        }
        s.phaseT += dt;
        const limit = s.phase === 'calm' ? s.calmFor : s.phase === 'yawn' ? yawnFor : nodFor;
        if (s.phaseT >= limit) nextPhase();
        const tired = 1 + 0.5 * clamp01(g.elapsed / g.duration);
        s.lid += DROWSE * g.speed * tired * (s.phase === 'nod' ? NOD_RATE : 1) * dt;
        s.show += (s.lid - s.show) * Math.min(1, dt * 20);
        if (s.lid >= 1) fallAsleep();
      },
      press() {
        s.lid = Math.max(0, s.lid - LIFT);
        s.kick = 1;
        g.sfx.tap();
        s.presses = (s.presses || 0) + 1;
        const e = eyes[s.presses % 2];
        g.fx.burst(headX + e.x, headY + e.y, { kind: 'spark', n: 4, colors: [PAL.mango, '#ffffff'], speed: 160 });
      },
      draw(c) {
        scene.club(c, W, H, s.t);
        // Clock: 4 am creeping to 5 am.
        const mins = Math.min(59, Math.floor((g.elapsed / g.duration) * 60));
        neon(c, `4:${String(mins).padStart(2, '0')}`, 340, 112, 24, PAL.lagoon, s.t);
        // Friends still dancing behind the sofa.
        const party = g.done && !g.won ? 'cheer' : 'dance';
        person(c, dancer1, 72, H * 0.5, 170, party, s.t);
        person(c, dancer2, 330, H * 0.5, 160, 'dance', s.t + 0.7, { flip: true });
        // Chesterfield sofa back in deep velvet.
        shadowed(c, () => {
          rrect(c, 8, H * 0.38, W - 16, H * 0.5, 70);
          c.fillStyle = vgrad(c, H * 0.38, H * 0.88, ['#9b2c5e', '#6a1640', '#3d0b26']);
          c.fill();
        }, 24, 10);
        for (let r = 0; r < 3; r++) {
          for (let i = 0; i < 6; i++) {
            const bx = 46 + i * 62 + (r % 2) * 31;
            const by = H * 0.43 + r * 46;
            if (bx > W - 30) continue;
            ellipse(c, bx, by + 2, 7, 5, 'rgba(30,0,20,0.35)');
            circle(c, bx, by, 4.5, '#c24a7e');
          }
        }
        c.fillStyle = 'rgba(255,255,255,0.08)';
        rrect(c, 30, H * 0.39, W - 60, 18, 9);
        c.fill();
        // Slump: lean back on a yawn, flop forward on a nod, drift with drowsiness.
        const yawnK = s.phase === 'yawn' && !g.done ? Math.sin(clamp01(s.phaseT / yawnFor) * Math.PI * 0.5) : 0;
        const nodK = s.phase === 'nod' && !g.done ? Math.sin(clamp01(s.phaseT / nodFor) * Math.PI) : 0;
        const asleep = g.done && !g.won;
        const rot = -0.06 - s.show * 0.22 + yawnK * 0.16 - nodK * 0.12 + (asleep ? -0.1 : 0) + Math.sin(s.t * 1.7) * 0.02;
        const hy = headY + s.show * 26 - s.kick * 12 + nodK * 22 - yawnK * 8 + (g.done && g.won ? Math.sin(s.endT * 10) * 6 : 0);
        // Body under the head.
        c.save();
        c.translate(headX, hy + headH * 0.33);
        c.rotate(rot * 0.45);
        shadowed(c, () => {
          rrect(c, -150, 0, 300, H, 110);
          c.fillStyle = outfit.pattern === 'madras' ? madras(c) : outfit.shirt;
          c.fill();
        }, 22, 8);
        c.fillStyle = 'rgba(255,255,255,0.13)';
        rrect(c, -128, 18, 80, H * 0.4, 40);
        c.fill();
        c.fillStyle = 'rgba(0,0,0,0.14)';
        rrect(c, 60, 18, 80, H * 0.4, 40);
        c.fill();
        c.fillStyle = skin;
        c.beginPath();
        c.moveTo(-34, -2);
        c.lineTo(34, -2);
        c.lineTo(0, 48);
        c.closePath();
        c.fill();
        c.restore();
        // Head close-up and the eyelids, in the same transform.
        c.save();
        c.translate(headX, hy);
        c.rotate(rot);
        head(c, g.hero, 0, 0, headH, { hat });
        // Tired bags under the eyes.
        for (const e of eyes) ellipse(c, e.x, e.y + e.ry * 1.25, e.rx * 0.9, e.ry * 0.35, `rgba(110,60,140,${0.12 + s.show * 0.25})`);
        for (const e of eyes) drawLid(c, e, s.show, skin, unit);
        if (asleep) drawDoodles(c, eyes, headH, s.endT);
        c.restore();
        // Ti-punch slowly tipping in his hand.
        const gx = 318;
        const gy = H * 0.8;
        c.save();
        c.translate(gx, gy);
        c.rotate(0.15 + s.show * 0.55);
        rrect(c, -20, -50, 40, 54, 10);
        c.fillStyle = 'rgba(220,240,255,0.35)';
        c.fill();
        rrect(c, -16, -30, 32, 30, 8);
        c.fillStyle = 'rgba(255,196,90,0.85)';
        c.fill();
        circle(c, 10, -46, 10, '#7fd34e');
        circle(c, 10, -46, 6, '#c8f29a');
        c.restore();
        circle(c, gx - 6, gy + 6, 20, skin);
        // Velvet armrests in front.
        for (const ax of [-30, W - 70]) {
          shadowed(c, () => {
            rrect(c, ax, H * 0.72, 100, H * 0.32, 44);
            c.fillStyle = vgrad(c, H * 0.72, H, ['#a8326a', '#5a1235']);
            c.fill();
          }, 18, 6);
        }
        // Zzz drifting up while the lids are heavy.
        if (s.show > 0.5 || asleep) {
          const a = asleep ? 1 : clamp01((s.show - 0.5) * 2.5);
          for (let i = 0; i < 3; i++) {
            const k = (s.t * 0.8 + i / 3) % 1;
            c.globalAlpha = a * Math.sin(k * Math.PI);
            text(c, 'z', headX + 100 + k * 50 + i * 6, hy - headH * 0.4 - k * 90, { size: 22 + i * 8, color: PAL.cream, stroke: PAL.violet });
          }
          c.globalAlpha = 1;
        }
        if (yawnK > 0.2) text(c, g.tr({ en: 'Haaaa…', fr: 'Haaaa…' }), headX - 110, hy - headH * 0.48, { size: 26, color: PAL.cream, stroke: PAL.violet });
        // Heavy-eyes curtains: the whole view closes like his lids.
        const fade = asleep ? clamp01(1 - s.endT / 0.4) : g.done ? 0 : 1;
        const k = clamp01((s.show - 0.3) / 0.7) * fade;
        if (k > 0) {
          const reach = k * k * (H / 2 + 40);
          c.fillStyle = vgrad(c, 0, Math.max(1, reach), ['rgba(12,5,26,0.96)', 'rgba(40,14,52,0.9)']);
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(W, 0);
          c.lineTo(W, reach * 0.7);
          c.quadraticCurveTo(W / 2, reach * 1.3, 0, reach * 0.7);
          c.closePath();
          c.fill();
          c.fillStyle = vgrad(c, H - Math.max(1, reach), H, ['rgba(40,14,52,0.9)', 'rgba(12,5,26,0.96)']);
          c.beginPath();
          c.moveTo(0, H);
          c.lineTo(W, H);
          c.lineTo(W, H - reach * 0.7);
          c.quadraticCurveTo(W / 2, H - reach * 1.3, 0, H - reach * 0.7);
          c.closePath();
          c.fill();
        }
        if (asleep) {
          // A friend leans in with a marker, giggling.
          const lean = clamp01(s.endT / 0.3);
          head(c, dancer1, -60 + lean * 110, H * 0.62, 150, { rot: 0.35 });
          c.save();
          c.translate(-10 + lean * 120, H * 0.55);
          c.rotate(-0.7);
          rrect(c, -6, -40, 12, 50, 5);
          c.fillStyle = '#f4f4f8';
          c.fill();
          rrect(c, -6, -40, 12, 14, 4);
          c.fillStyle = MARKER;
          c.fill();
          c.restore();
        }
        if (!g.done) text(c, '👆', 200, H - 70, { size: 34 + s.kick * 8, shadow: false });
      },
      bot() {
        s.botN++;
        return s.botN % 5 === 0 ? { press: [200, H * 0.5] } : null;
      },
    };
  },
};

/** Marker doodles the gang adds once he is asleep (head-local units). */
function drawDoodles(c, eyes, h, t) {
  const pop = (start) => clamp01((t - start) / 0.15);
  const k = h / 440;
  c.save();
  c.strokeStyle = MARKER;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.lineWidth = 5 * k;
  // Round glasses.
  const a = pop(0.15);
  if (a > 0) {
    c.globalAlpha = a;
    for (const e of eyes) {
      c.beginPath();
      c.arc(e.x, e.y, e.rx * 1.6, 0, Math.PI * 2);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(eyes[0].x + eyes[0].rx * 1.6, eyes[0].y);
    c.lineTo(eyes[1].x - eyes[1].rx * 1.6, eyes[1].y);
    c.stroke();
  }
  // Curly moustache.
  const b = pop(0.45);
  if (b > 0) {
    c.globalAlpha = b;
    const mx = 25 * k;
    const my = 70 * k;
    c.lineWidth = 7 * k;
    for (const side of [-1, 1]) {
      c.beginPath();
      c.moveTo(mx, my);
      c.quadraticCurveTo(mx + side * 40 * k, my + 22 * k, mx + side * 62 * k, my - 6 * k);
      c.quadraticCurveTo(mx + side * 70 * k, my - 20 * k, mx + side * 56 * k, my - 18 * k);
      c.stroke();
    }
  }
  // A heart on the cheek.
  const d = pop(0.75);
  if (d > 0) {
    c.globalAlpha = d;
    c.fillStyle = PAL.hibiscus;
    const hx = -70 * k;
    const hy = 40 * k;
    const r = 12 * k * (0.6 + 0.4 * d);
    circle(c, hx - r * 0.55, hy, r * 0.6, PAL.hibiscus);
    circle(c, hx + r * 0.55, hy, r * 0.6, PAL.hibiscus);
    c.beginPath();
    c.moveTo(hx - r * 1.1, hy + r * 0.15);
    c.lineTo(hx, hy + r * 1.3);
    c.lineTo(hx + r * 1.1, hy + r * 0.15);
    c.closePath();
    c.fill();
  }
  c.restore();
}
