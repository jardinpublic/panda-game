// 15h pétantes (world 1): the hero's office in public administration. The
// minute hand races towards 15:00; tap while it is inside the glowing window
// at 12 to grab the beach bag and bolt. Tap early: the colleague by the door
// says it is not 15h yet. Too late: a fresh pile of files lands on the desk.

import { person, rrect, circle, ellipse, PAL, text, shadowed, vgrad, sky, sea, palm, diamondRock, sun, madrasBand, hibiscus } from '../art.js';

/** Tuning. Minutes are clock minutes past 14:00 (60 = 15:00). */
const TUNE = {
  window: 2, // half-width of the 15:00 window, in clock minutes (±12° on the dial)
  windowTime: 0.2, // seconds the hand takes to cross half the window at speed 1
  windowCurve: 0.7, // window time shrinks as speed^-curve
  arriveMin: 1.7, // seconds until 15:00 at speed 1 (min + random range)
  arriveRange: 1.2,
  dash: 0.6, // seconds of the winning dash
};

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const easeOut = (k) => 1 - (1 - k) ** 3;
const easeIn = (k) => k * k;
const pad = (n) => String(n).padStart(2, '0');
const MIN_RAD = Math.PI / 30; // one clock minute on the dial

export default {
  id: 'clock',
  world: 'w01',
  input: 'tap',
  base: 5,
  survive: false,
  verb: { en: 'TAP AT 15:00!', fr: 'TAPE À 15H PILE !' },
  title: { en: "15h pétantes", fr: "15h pétantes" },
  howto: { en: "Watch the clock. Tap exactly when it hits 15:00 to bolt out of the office.", fr: "Regarde l'horloge. Touche pile à 15h pour filer du bureau." },
  winLine: { en: "15h on the dot, see you!", fr: "15h pile, à plus !" },
  create(g) {
    const { W, H } = g;
    const halfTime = TUNE.windowTime / g.speed ** TUNE.windowCurve;
    const rate = TUNE.window / halfTime; // clock minutes per second
    const arrive = (TUNE.arriveMin + g.random() * TUNE.arriveRange) / g.speed;
    const boss = g.cast('romain', 'victor');
    const r = Math.min(122, H * 0.15);
    const cx = W / 2;
    const cy = Math.max(84 + r, H * 0.3);
    const floorY = H * 0.82;
    const deskY = floorY - 100;
    const heroX = 130;
    const doorX = 352;
    const s = {
      t: 0,
      m: 60 - rate * arrive,
      tick: -1,
      chimed: false,
      end: null, // null | 'out' | 'early' | 'late'
      endT: 0,
      wobble: 0,
      pileLanded: false,
    };
    s.tick = Math.floor(s.m / 5);

    const inWindow = () => Math.abs(s.m - 60) <= TUNE.window;

    function finish(kind) {
      s.end = kind;
      s.endT = 0;
      if (kind === 'out') {
        g.sfx.hoho();
        g.sfx.good();
        g.sfx.whoosh();
        g.fx.burst(heroX + 20, deskY - 20, { kind: 'confetti', n: 26, colors: ['#ffffff', '#f3f0e6', PAL.mango, PAL.lagoon], speed: 320 });
        g.fx.burst(cx, cy - r * 0.8, { kind: 'spark', n: 14, colors: [PAL.leaf, '#e9fff3'], speed: 200 });
        g.fx.text(cx, cy + r + 30, g.tr({ en: '15:00 sharp!', fr: '15h pétantes !' }), { size: 34, color: PAL.mango });
        g.say(heroX + 10, deskY - 200, g.tr({ en: 'Hoho, 15h pétantes!', fr: 'Hoho, 15h pétantes !' }), 1.6);
        g.win();
      } else if (kind === 'early') {
        g.sfx.bad();
        g.fx.shake(10);
        s.wobble = 1;
        g.say(doorX - 10, floorY - 175, g.tr({ en: "It's not 15h yet!", fr: "Il est pas encore 15h !" }), 1.8);
        g.lose();
      } else {
        g.sfx.bad();
        s.wobble = 0.6;
        g.say(doorX - 10, floorY - 175, g.tr({ en: 'Too late! New file for you.', fr: 'Trop tard ! Un dossier pour toi.' }), 1.8);
        g.lose();
      }
    }

    function drawRoom(c) {
      // Warm wall, a madras chair rail and a view of the lagoon calling you.
      sky(c, W, H, ['#fbf3e4', '#f1e2c8']);
      c.fillStyle = 'rgba(255,255,255,0.35)';
      for (let i = 0; i < 9; i++) c.fillRect(i * 48, 0, 22, H * 0.66);
      const wy0 = cy + r + 22;
      const wy1 = deskY + 12;
      shadowed(c, () => {
        rrect(c, 22, wy0, 280, wy1 - wy0, 16);
        c.fillStyle = '#7fd3ef';
        c.fill();
      }, 16, 6, 'rgba(20,10,40,0.15)');
      c.save();
      rrect(c, 22, wy0, 280, wy1 - wy0, 16);
      c.clip();
      const hz = wy0 + (wy1 - wy0) * 0.5;
      sky(c, W, hz, ['#5ab8e8', '#bfeaf6']);
      sun(c, 250, wy0 + 26, 13);
      diamondRock(c, 205, hz, 34);
      sea(c, W, hz, wy1 - hz, s.t);
      palm(c, 40, wy1 + 10, (wy1 - wy0) * 0.9, s.t, 0.2);
      c.restore();
      c.fillStyle = 'rgba(255,255,255,0.75)';
      c.fillRect(160, wy0, 4, wy1 - wy0);
      madrasBand(c, 0, deskY + 18, W, 10, 0.4);
      c.fillStyle = vgrad(c, floorY - 40, H, ['#d9c7ae', '#bfa483']);
      c.fillRect(0, floorY - 40, W, H - floorY + 40);
      c.fillStyle = 'rgba(255,255,255,0.12)';
      for (let i = 0; i < 6; i++) c.fillRect(0, floorY - 30 + i * 22, W, 2);
    }

    function drawDoor(c) {
      const top = floorY - 250;
      shadowed(c, () => {
        rrect(c, doorX - 42, top, 84, 250, 8);
        c.fillStyle = '#f7f2ea';
        c.fill();
      }, 12, 4, 'rgba(20,10,40,0.16)');
      // Ajar after the dash: a slice of sunshine.
      const open = s.end === 'out' ? easeOut(clamp(s.endT / 0.25)) : 0;
      rrect(c, doorX - 34, top + 8, 68, 242, 6);
      c.fillStyle = open > 0 ? vgrad(c, top, floorY, ['#ffe9a8', '#ffb86b']) : '#b07a4f';
      c.fill();
      c.save();
      c.translate(doorX - 34, 0);
      c.scale(1 - open * 0.75, 1);
      rrect(c, 0, top + 8, 68, 242, 6);
      c.fillStyle = vgrad(c, top, floorY, ['#c48a5a', '#9b6a43']);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.12)';
      rrect(c, 8, top + 22, 52, 90, 6);
      c.fill();
      rrect(c, 8, top + 128, 52, 100, 6);
      c.fill();
      circle(c, 56, top + 132, 5, '#f2c14e');
      c.restore();
      // Glowing exit sign.
      shadowed(c, () => {
        rrect(c, doorX - 36, top - 30, 72, 22, 6);
        c.fillStyle = PAL.palm;
        c.fill();
      }, 14, 0, 'rgba(51,208,139,0.8)');
      text(c, g.tr({ en: 'EXIT', fr: 'SORTIE' }), doorX, top - 19, { size: 14, color: '#eafff4', shadow: false });
    }

    function drawClock(c) {
      const near = clamp((s.m - 46) / 12);
      const live = inWindow() && !g.done;
      const shake = s.wobble * Math.sin(s.t * 60) * 6;
      c.save();
      c.translate(cx + shake, cy);
      // Body: lagoon rim, cream face.
      shadowed(c, () => circle(c, 0, 0, r, PAL.sea), 24, 10);
      const rim = c.createLinearGradient(-r, -r, r, r);
      rim.addColorStop(0, PAL.lagoon);
      rim.addColorStop(1, PAL.deep);
      circle(c, 0, 0, r, rim);
      const face = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r * 0.9);
      face.addColorStop(0, '#ffffff');
      face.addColorStop(1, live ? '#dcffe9' : '#f6eee0');
      circle(c, 0, 0, r * 0.88, face);
      // The 15:00 window: grows brighter as the hand gets close.
      const a0 = -Math.PI / 2 - TUNE.window * MIN_RAD;
      const a1 = -Math.PI / 2 + TUNE.window * MIN_RAD;
      c.save();
      c.shadowColor = live ? PAL.leaf : PAL.mango;
      c.shadowBlur = 8 + near * 18 + (live ? 12 : 0);
      c.beginPath();
      c.arc(0, 0, r * 0.86, a0, a1);
      c.arc(0, 0, r * 0.52, a1, a0, true);
      c.closePath();
      c.fillStyle = live ? PAL.leaf : `rgba(255,178,62,${0.35 + 0.55 * near + 0.1 * Math.sin(s.t * 18) * near})`;
      c.fill();
      c.restore();
      // Ticks.
      c.lineCap = 'round';
      for (let i = 0; i < 60; i++) {
        const a = i * MIN_RAD;
        const big = i % 5 === 0;
        c.strokeStyle = big ? 'rgba(30,26,51,0.75)' : 'rgba(30,26,51,0.25)';
        c.lineWidth = big ? 4 : 2;
        c.beginPath();
        c.moveTo(Math.cos(a) * r * (big ? 0.72 : 0.78), Math.sin(a) * r * (big ? 0.72 : 0.78));
        c.lineTo(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82);
        c.stroke();
      }
      const fs = r * 0.17;
      text(c, '12', 0, -r * 0.6, { size: fs, color: live ? '#0d6b45' : PAL.ink, shadow: false });
      text(c, '3', r * 0.6, 0, { size: fs, color: PAL.ink, shadow: false });
      text(c, '6', 0, r * 0.6, { size: fs, color: PAL.ink, shadow: false });
      text(c, '9', -r * 0.6, 0, { size: fs, color: PAL.ink, shadow: false });
      // Digital readout.
      const hh = 14 + Math.floor(s.m / 60);
      const mm = ((Math.floor(s.m) % 60) + 60) % 60;
      rrect(c, -r * 0.27, r * 0.22, r * 0.54, r * 0.24, r * 0.1);
      c.fillStyle = live ? PAL.palm : 'rgba(30,26,51,0.8)';
      c.fill();
      text(c, `${hh}:${pad(mm)}`, 0, r * 0.345, { size: r * 0.16, color: '#ffffff', shadow: false });
      // Hour hand (near 3) and the racing minute hand with motion ghosts.
      const ha = ((2 + s.m / 60) / 12) * Math.PI * 2 - Math.PI / 2;
      c.strokeStyle = PAL.ink;
      c.lineWidth = r * 0.075;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(ha) * r * 0.45, Math.sin(ha) * r * 0.45);
      c.stroke();
      const ma = (s.m / 60) * Math.PI * 2 - Math.PI / 2;
      const spin = g.done ? 0 : rate;
      for (let i = 3; i >= 0; i--) {
        const a = ma - i * spin * 0.004;
        c.save();
        c.globalAlpha = i ? 0.12 / i : 1;
        c.rotate(a);
        c.beginPath();
        c.moveTo(-r * 0.12, -r * 0.045);
        c.lineTo(r * 0.8, -r * 0.014);
        c.quadraticCurveTo(r * 0.85, 0, r * 0.8, r * 0.014);
        c.lineTo(-r * 0.12, r * 0.045);
        c.closePath();
        c.fillStyle = PAL.hibiscus;
        c.fill();
        c.restore();
      }
      circle(c, 0, 0, r * 0.08, PAL.mango);
      circle(c, 0, 0, r * 0.03, '#ffffff');
      // Glass highlight.
      c.fillStyle = 'rgba(255,255,255,0.22)';
      c.beginPath();
      c.ellipse(-r * 0.3, -r * 0.4, r * 0.45, r * 0.18, -0.6, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    function drawBag(c, x, y, rot = 0) {
      // Madras beach bag with a towel and a snorkel sticking out.
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.fillStyle = PAL.lagoon;
      rrect(c, -6, -66, 12, 34, 6);
      c.fill();
      ellipse(c, 4, -66, 10, 6, PAL.coral);
      c.fillStyle = PAL.creole[0];
      rrect(c, -26, -46, 30, 22, 8);
      c.fill();
      c.strokeStyle = '#8a5a34';
      c.lineWidth = 4;
      c.beginPath();
      c.arc(0, -36, 22, Math.PI * 1.1, Math.PI * 1.9);
      c.stroke();
      shadowed(c, () => {
        c.save();
        c.beginPath();
        c.moveTo(-34, -34);
        c.lineTo(34, -34);
        c.lineTo(28, 0);
        c.lineTo(-28, 0);
        c.closePath();
        c.clip();
        madrasBand(c, -34, -34, 68, 34, 0.45);
        c.restore();
      }, 8, 3);
      hibiscus(c, 14, -18, 8, s.t);
      c.restore();
    }

    function drawDesk(c) {
      shadowed(c, () => {
        rrect(c, 24, deskY, 272, floorY - deskY - 4, 12);
        c.fillStyle = vgrad(c, deskY, floorY, ['#d39a64', '#a8703f']);
        c.fill();
      }, 18, 8);
      rrect(c, 18, deskY - 8, 284, 16, 8);
      c.fillStyle = '#e8b47c';
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.18)';
      rrect(c, 40, deskY + 20, 110, 40, 8);
      c.fill();
      // Paper stack with a rubber stamp; it grows on a late tap.
      const extra = s.end === 'late' ? 9 : 0;
      const drop = s.end === 'late' ? easeIn(clamp(s.endT / 0.35)) : 1;
      for (let i = 0; i < 3 + extra; i++) {
        const y = deskY - 10 - i * 7;
        const falling = i >= 3 ? (1 - drop) * -(H * 0.6 + i * 20) : 0;
        c.fillStyle = ['#fffaf0', '#cfe8ff', '#ffe1c2', '#e3f7d9'][i % 4];
        rrect(c, 46 + Math.sin(i * 2.1) * 4, y + falling - 6, 62, 9, 3);
        c.fill();
      }
      circle(c, 92, deskY - 34 - extra * 7, 8, PAL.hibiscus);
      c.fillStyle = '#6b4a2a';
      c.fillRect(89, deskY - 30 - extra * 7, 6, 12);
      // Coffee mug.
      rrect(c, 178, deskY - 30, 22, 24, 6);
      c.fillStyle = '#ffffff';
      c.fill();
      c.strokeStyle = '#ffffff';
      c.lineWidth = 4;
      c.beginPath();
      c.arc(202, deskY - 18, 6, -1.2, 1.2);
      c.stroke();
      for (let i = 0; i < 2; i++) circle(c, 186 + i * 7, deskY - 40 - ((s.t * 26 + i * 12) % 26), 3 + i, 'rgba(255,255,255,0.6)');
    }

    return {
      update(dt) {
        s.t += dt;
        s.endT += dt;
        s.wobble = Math.max(0, s.wobble - dt * 2.5);
        // The clock keeps running, slowed right down once it is decided.
        s.m += rate * dt * (g.done ? 0.08 : 1);
        if (g.done) {
          if (s.end === 'late' && !s.pileLanded && s.endT > 0.35) {
            s.pileLanded = true;
            g.sfx.hit();
            g.fx.shake(14);
            g.fx.burst(77, deskY - 40, { kind: 'confetti', n: 18, colors: ['#ffffff', '#cfe8ff', '#ffe1c2'], speed: 220 });
          }
          if (s.end === null) {
            // Ran out of time (only possible if the hand never left the window).
            s.end = 'late';
            s.endT = 0;
          }
          return;
        }
        const tick = Math.floor(s.m / 5);
        if (tick !== s.tick) {
          s.tick = tick;
          g.sfx.tick(s.m > 50);
        }
        if (!s.chimed && inWindow()) {
          s.chimed = true;
          g.sfx.coin();
        }
        if (s.m > 60 + TUNE.window) finish('late');
      },
      press() {
        if (s.end) return;
        if (inWindow()) finish('out');
        else if (s.m < 60) finish('early');
      },
      draw(c) {
        drawRoom(c);
        drawDoor(c);
        drawClock(c);
        const dashing = s.end === 'out';
        const k = dashing ? clamp(s.endT / TUNE.dash) : 0;
        // The colleague guards the door.
        const bossPose = s.end === 'early' || s.end === 'late' ? 'point' : 'idle';
        const blown = dashing && s.endT > TUNE.dash * 0.5 ? Math.sin(s.endT * 30) * 0.03 : 0;
        person(c, boss, doorX - 6 + (dashing ? easeOut(clamp(s.endT / 0.3)) * 26 : 0), floorY, 150, bossPose, s.t, { flip: true, squash: 1 + blown });
        if (!dashing) {
          // Sitting, itching to leave: bounces harder as 15:00 gets close.
          const itch = clamp((s.m - 50) / 10);
          const hop = g.done ? 0 : Math.abs(Math.sin(s.t * (10 + itch * 14))) * itch * 6;
          const pose = s.end === 'early' || s.end === 'late' ? 'sad' : 'sit';
          person(c, g.hero, heroX, floorY - 45 - hop, 200, pose, s.t, { hat: g.hat });
          if (itch > 0.4 && !g.done) {
            ellipse(c, heroX + 44, deskY - 150, 3.5, 6, 'rgba(120,200,255,0.85)');
          }
        }
        drawDesk(c);
        if (!dashing) drawBag(c, 248, deskY - 4, s.end ? 0 : Math.sin(s.t * 6) * 0.03);
        else {
          // Hop over the desk, grab the bag, out of the door.
          const x = heroX + easeIn(k) * (W + 140 - heroX);
          const y = floorY - Math.sin(clamp(k * 1.6) * Math.PI) * 70;
          person(c, g.hero, x, y, 170, 'run', s.t * 1.4, { hat: g.hat });
          drawBag(c, x + 46, y - 66, -0.3 + Math.sin(s.t * 20) * 0.1);
          for (let i = 1; i < 4; i++) ellipse(c, x - 30 - i * 26, y - 70 + i * 6, 16 - i * 3, 4, `rgba(255,255,255,${0.5 - i * 0.12})`);
        }
      },
      bot() {
        return !s.end && Math.abs(s.m - 60) < TUNE.window * 0.5 ? { press: [cx, cy] } : null;
      },
    };
  },
};
