// Mamar's sandwich (world 3): New Year's Eve in a fast-food place, Mamar has
// to finish his sandwiches before midnight, each one bigger than the last, up
// to the "spécial viande argentine". MASH to take bites, but every bite fills
// his throat: tap too fast and he chokes. Tell: the throat gauge turns red,
// he sweats and goes pink. The wall clock counts down to midnight.

import { rrect, circle, ellipse, PAL, text, shadowed, person, vgrad, bulbs, neon } from '../art.js';

const SIZES = [
  { bites: 2, w: 84, h: 58 },
  { bites: 3, w: 104, h: 72 },
  { bites: 4, w: 124, h: 88 },
  { bites: 5, w: 148, h: 104 },
  { bites: 6, w: 170, h: 120 },
];
const GULP = 0.2; // throat filled by one bite
const MAMAR = 330;

/** A burger seen from the side, its left (bitten) edge at `edge`. */
function sandwich(c, x, y, size, eaten, { flag = false, t = 0 } = {}) {
  const { w, h } = size;
  const left = x - w / 2;
  const edge = left + w * eaten;
  const top = y - h / 2;
  c.save();
  // Clip away the eaten part, with a scalloped bite edge.
  c.beginPath();
  c.moveTo(edge, top - 60);
  const n = 3;
  for (let i = 0; i < n; i++) {
    const y0 = top + (h * i) / n;
    c.quadraticCurveTo(edge + (eaten > 0 ? 22 : 0), y0 + h / n / 2, edge, y0 + h / n);
  }
  c.lineTo(edge, y + h);
  c.lineTo(x + w, y + h);
  c.lineTo(x + w, top - 60);
  c.closePath();
  c.clip();
  const L = (f) => top + h * f;
  // bottom bun, patty, cheese, lettuce, top bun
  rrect(c, left, L(0.74), w, h * 0.26, h * 0.1);
  c.fillStyle = vgrad(c, L(0.74), L(1), ['#f0a958', '#d98a3a']);
  c.fill();
  rrect(c, left - 3, L(0.52), w + 6, h * 0.22, h * 0.1);
  c.fillStyle = vgrad(c, L(0.52), L(0.74), ['#7a4228', '#4d2614']);
  c.fill();
  c.fillStyle = '#ffc93c';
  c.fillRect(left - 4, L(0.47), w + 8, h * 0.07);
  c.fillStyle = '#5fd06a';
  c.beginPath();
  c.moveTo(left - 6, L(0.47));
  for (let i = 0; i <= 10; i++) c.lineTo(left - 6 + ((w + 12) * i) / 10, L(i % 2 ? 0.4 : 0.47));
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(left, L(0.42));
  c.quadraticCurveTo(left, L(0), x, L(0));
  c.quadraticCurveTo(left + w, L(0), left + w, L(0.42));
  c.closePath();
  c.fillStyle = vgrad(c, L(0), L(0.42), ['#f6b864', '#dc8b3c']);
  c.fill();
  for (let i = 0; i < 6; i++) ellipse(c, left + w * (0.2 + i * 0.12), L(0.12 + (i % 2) * 0.1), 3, 1.6, '#fff3d6');
  c.restore();
  if (flag && eaten < 0.8) {
    // The little sign on a pick: "viande argentine".
    const fx = x + w * 0.25;
    c.strokeStyle = '#e8dcc0';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(fx, L(0.2));
    c.lineTo(fx, top - 46);
    c.stroke();
    const wave = Math.sin(t * 5) * 2;
    c.fillStyle = '#74acdf';
    c.fillRect(fx, top - 46 + wave * 0.3, 54, 10);
    c.fillStyle = '#ffffff';
    c.fillRect(fx, top - 36 + wave * 0.3, 54, 10);
    c.fillStyle = '#74acdf';
    c.fillRect(fx, top - 26 + wave * 0.3, 54, 10);
    circle(c, fx + 27, top - 31 + wave * 0.3, 3.5, '#f6b40e');
  }
}

export default {
  id: 'sandwich',
  world: 'w03',
  input: 'mash',
  base: 6,
  min: 3.6,
  survive: false,
  verb: { en: 'EAT!', fr: 'MANGE !' },
  title: { en: 'Mamar’s sandwich', fr: 'Eul’ sandwich du Mamar' },
  howto: {
    en: 'New Year’s Eve at the burger place: Mamar must finish his sandwiches before midnight. Tap to bite, but not too fast or he chokes!',
    fr: 'Réveillon au fast-food : Mamar doit finir ses sandwichs avant minuit. Tapote pour croquer, mais pas trop vite ou y s’étouffe !',
  },
  winLine: { en: 'Happy New Year, Mamar!', fr: 'Bonne année, Mamar !' },
  rival: ['babar', 'romain'],
  rivalLine: { en: 'I’d have eaten ten.', fr: 'Me, j’en aurais mangé dix.' },
  loseLine: { en: 'Hoho… there’s still Argentine beef on the plate.', fr: 'Hoho… y’a encore d’la viande argentine dans l’assiette.' },
  create(g) {
    const { W, H } = g;
    const mate = g.hero === 'mamar' ? g.friend() : g.hero;
    const order = g.speed < 1.4 ? [0, 1, 2] : g.speed < 2 ? [1, 2, 3] : [2, 3, 4];
    const drain = 0.5 * Math.pow(g.speed, 1.1); // throat emptying per second
    const tableY = H * 0.76;
    const mx = 140; // Mamar
    const feetY = tableY + 60;
    const k = MAMAR;
    const headY = feetY - k * 0.2 - k * 0.27 - k * 0.55 * 0.38;
    const mouth = { x: mx + 2, y: headY + k * 0.55 * 0.2 };
    const s = { t: 0, idx: 0, bites: 0, slide: 0, throat: 0, chew: 0, choked: false, fire: [], nextFire: 0.4, botN: 0, timeoutSaid: false };
    const size = () => SIZES[order[s.idx]];

    function bite() {
      const sz = size();
      s.bites++;
      s.chew = 1;
      s.throat += GULP;
      g.sfx.pop();
      g.fx.burst(mouth.x + 30, mouth.y, { kind: 'drop', n: 5, colors: ['#f0a958', '#7a4228', '#5fd06a'], speed: 110 });
      if (s.throat >= 1) {
        s.throat = 1;
        s.choked = true;
        g.sfx.bad();
        g.fx.shake(10);
        g.fx.burst(mouth.x + 20, mouth.y, { kind: 'drop', n: 18, colors: ['#f0a958', '#7a4228', '#5fd06a'], speed: 260 });
        g.fx.text(mouth.x + 70, mouth.y - 80, g.tr({ en: 'COUGH!', fr: 'KEUF !' }), { size: 32, color: PAL.cream });
        g.say(320, tableY - 230, g.tr({ en: 'Breathe, Mamar!', fr: 'Respire, Mamar !' }), 1.5);
        g.lose();
        return;
      }
      if (s.bites >= sz.bites) {
        s.idx++;
        s.bites = 0;
        g.sfx.coin();
        if (s.idx >= order.length) {
          g.sfx.good();
          g.fx.burst(200, 200, { kind: 'confetti', n: 50 });
          for (let i = 0; i < 4; i++) s.fire.push({ x: 60 + i * 90, y: 160 + (i % 2) * 40, life: 1.2 + i * 0.1, col: [PAL.mango, PAL.hibiscus, PAL.lagoon, PAL.leaf][i] });
          g.say(mx + 40, headY - 90, g.tr({ en: 'Happy New Year!', fr: 'Bonne année !' }), 1.6);
          g.win();
        } else {
          s.slide = 1;
          g.fx.text(mouth.x + 110, mouth.y - 70, g.tr({ en: 'Next!', fr: 'Au suivant !' }), { size: 22, color: PAL.cream });
        }
      }
    }

    return {
      update(dt) {
        s.t += dt;
        s.chew = Math.max(0, s.chew - dt * 5);
        s.slide = Math.max(0, s.slide - dt * 6);
        if (!s.choked) s.throat = Math.max(0, s.throat - drain * dt);
        // Fireworks outside: a few now and then, a big show on a win.
        s.nextFire -= dt;
        if (s.nextFire <= 0) {
          s.nextFire = 0.7 + g.random() * 0.6;
          s.fire.push({ x: 40 + g.random() * 320, y: 120 + g.random() * 80, life: 1, col: [PAL.mango, PAL.hibiscus, PAL.lagoon, PAL.leaf][Math.floor(g.random() * 4)] });
        }
        for (const f of s.fire) f.life -= dt;
        s.fire = s.fire.filter((f) => f.life > 0);
        if (g.done && !g.won && !s.choked && !s.timeoutSaid) {
          s.timeoutSaid = true;
          g.sfx.bad();
          g.say(mx + 40, headY - 90, g.tr({ en: 'Midnight… and there’s some left!', fr: 'Minuit… et y’en reste !' }), 1.5);
        }
      },
      press() {
        if (g.done || s.slide > 0.3) return;
        bite();
      },
      draw(c) {
        const t = s.t;
        // Night window with fireworks over the town.
        c.fillStyle = vgrad(c, 0, tableY, ['#1b1f4a', '#3a2d6b', '#6b3f7a']);
        c.fillRect(0, 0, W, tableY);
        c.fillStyle = 'rgba(10,10,30,0.6)';
        for (let i = 0; i < 9; i++) c.fillRect(i * 46, 300 - ((i * 37) % 60), 40, 120);
        for (const f of s.fire) {
          const r = (1 - f.life) * 60 + 10;
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            circle(c, f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, 3, f.col);
          }
        }
        // The restaurant: window frame, neon, party garland, the countdown clock.
        c.fillStyle = '#f4ead8';
        c.fillRect(0, 380, W, tableY - 380);
        c.fillStyle = '#d23b2f';
        c.fillRect(0, 380, W, 10);
        neon(c, 'BURGERS', 280, 420, 30, PAL.hibiscus, t);
        bulbs(c, 0, 92, W, 92, t, 11);
        const secs = Math.ceil(g.left);
        const clock = g.left <= 0 ? '00:00:00' : `23:59:${String(60 - Math.min(59, secs)).padStart(2, '0')}`;
        shadowed(c, () => {
          rrect(c, 230, 116, 150, 44, 10);
          c.fillStyle = '#16182a';
          c.fill();
        }, 8, 3);
        text(c, clock, 305, 139, { size: 24, color: secs <= 2 ? '#ff5a4f' : '#7dffb0', shadow: false });

        // Mamar behind the table, chewing (party hat on), the mate across.
        const pink = Math.max(0, s.throat - 0.55) / 0.45;
        person(c, 'mamar', mx, feetY, MAMAR, g.done ? (g.won ? 'cheer' : 'sad') : 'idle', t, { hat: 'party', squash: 1 - s.chew * 0.035 });
        if (pink > 0) {
          circle(c, mouth.x, headY, k * 0.2, `rgba(255,80,90,${pink * 0.3})`);
          for (let i = 0; i < 2; i++) ellipse(c, mx - 50 + i * 100, headY - 40 + ((t * 80 + i * 30) % 50), 4, 7, 'rgba(160,220,255,0.9)');
        }
        person(c, mate, 340, feetY, 260, g.done ? (g.won ? 'dance' : 'point') : 'point', t + 1, { flip: true, hat: mate === g.hero ? g.hat : 'party' });
        // Table with the tray.
        shadowed(c, () => {
          rrect(c, -10, tableY, W + 20, 30, 8);
          c.fillStyle = vgrad(c, tableY, tableY + 30, ['#ffcf5a', '#e2a92c']);
          c.fill();
        }, 12, 5);
        c.fillStyle = vgrad(c, tableY + 30, H, ['#b5452f', '#8c3322']);
        c.fillRect(0, tableY + 30, W, H - tableY - 30);
        rrect(c, 60, tableY - 8, 250, 14, 5);
        c.fillStyle = '#c0392b';
        c.fill();
        rrect(c, 262, tableY - 60, 34, 54, 6);
        c.fillStyle = '#ffffff';
        c.fill();
        c.fillStyle = '#d23b2f';
        c.fillRect(262, tableY - 46, 34, 12);
        c.strokeStyle = '#ffd84a';
        c.lineWidth = 4;
        for (let i = 0; i < 5; i++) {
          c.beginPath();
          c.moveTo(80 + i * 7, tableY - 8);
          c.lineTo(76 + i * 9, tableY - 40);
          c.stroke();
        }
        // The sandwich in front of his mouth (the next one slides in from the right).
        if (s.idx < order.length) {
          const sz = size();
          const eaten = s.bites / sz.bites;
          const cx = mouth.x + 18 + sz.w / 2 - eaten * sz.w + s.slide * 120;
          sandwich(c, cx, mouth.y + 8, sz, eaten, { flag: s.idx === order.length - 1, t });
        }
        // The throat gauge: green, then red when he is about to choke.
        const gx = 20;
        const gy = 230;
        const gh = 220;
        rrect(c, gx, gy, 26, gh, 13);
        c.fillStyle = 'rgba(255,255,255,0.25)';
        c.fill();
        const fill = s.throat * (gh - 6);
        rrect(c, gx + 3, gy + gh - 3 - fill, 20, Math.max(0, fill), 10);
        c.fillStyle = s.throat > 0.7 ? (Math.sin(t * 30) > 0 ? '#ff4a4a' : '#ffb04a') : '#5fd06a';
        c.fill();
        text(c, '😮', gx + 13, gy - 18, { size: 22 });
        // Sandwiches left.
        if (!g.done) text(c, `🍔 ×${order.length - s.idx}`, 330, 200, { size: 24, color: PAL.cream, stroke: PAL.hibiscus });
      },
      bot() {
        s.botN++;
        return s.botN % 7 === 0 && s.throat < 0.55 ? { press: [200, H * 0.5] } : null;
      },
    };
  },
};
