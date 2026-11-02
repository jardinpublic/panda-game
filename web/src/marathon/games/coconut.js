// Coconut (world 4, beach): the hero lounges on a beach chair under the
// palms. Coconuts shake, then drop; their shadow grows on the sand where they
// will land. DRAG the chair left/right to dodge. One bonk and it is over.
// A friend sunbathing on a towel nearby comments.

import { scene, person, palm, rrect, circle, ellipse, PAL, text, shadowed, madrasBand } from '../art.js';

const X_MIN = 60;
const X_MAX = 340;
const HIT = 44; // half-width of the hero's head zone

function coconutBall(c, x, y, r, rot = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  const g = c.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#9a6a3c');
  g.addColorStop(1, '#4a2f18');
  circle(c, 0, 0, r, g);
  circle(c, -r * 0.25, -r * 0.1, r * 0.11, '#2a1a0c');
  circle(c, r * 0.05, -r * 0.3, r * 0.11, '#2a1a0c');
  circle(c, r * 0.15, r * 0.05, r * 0.11, '#2a1a0c');
  ellipse(c, -r * 0.35, -r * 0.45, r * 0.3, r * 0.14, 'rgba(255,255,255,0.18)', -0.6);
  c.restore();
}

/** A lounge chair with a striped canvas, seat at (x, y). */
function chair(c, x, y, t) {
  ellipse(c, x, y + 30, 80, 12, 'rgba(20,10,40,0.2)');
  c.strokeStyle = '#c99a5b';
  c.lineWidth = 6;
  c.lineCap = 'round';
  for (const [a, b] of [[[-60, 28], [-30, -4]], [[55, 28], [30, -4]], [[-40, 28], [-60, -60]]]) {
    c.beginPath();
    c.moveTo(x + a[0], y + a[1]);
    c.lineTo(x + b[0], y + b[1]);
    c.stroke();
  }
  // Canvas: seat and backrest, red/white Creole stripes.
  c.save();
  c.translate(x, y);
  c.beginPath();
  c.moveTo(-70, -66);
  c.lineTo(-48, 0);
  c.lineTo(70, 0);
  c.lineTo(70, 10);
  c.lineTo(-56, 10);
  c.lineTo(-80, -60);
  c.closePath();
  c.fillStyle = PAL.coral;
  c.fill();
  c.clip();
  c.fillStyle = 'rgba(255,255,255,0.75)';
  for (let i = -90; i < 80; i += 18) c.fillRect(i, -70, 8, 90);
  c.restore();
}

export default {
  id: 'coconut',
  world: 'w04',
  input: 'drag',
  base: 5,
  survive: true,
  verb: { en: 'DODGE THE COCONUTS!', fr: 'ESQUIVE LES COCOS !' },
  title: { en: "Coconut rain", fr: "Pluie de cocos" },
  howto: { en: "Coconuts shake before they fall. Drag the beach chair out of the way.", fr: "Les cocos tremblent avant de tomber. Fais glisser eul’ transat pour les éviter." },
  winLine: { en: "Not a single bump!", fr: "Pas une bosse !" },
  rival: ["babar", "mamar"],
  rivalLine: { en: "I shook that palm for nothing…", fr: "J'ai secoué eul’ cocotier pour rien…" },
  loseLine: { en: "Hoho, my head!", fr: "Hoho, ma tête !" },
  create(g) {
    const friend = g.friend();
    const seatY = g.H * 0.74;
    const headY = seatY - 110;
    const topY = g.H * 0.17;
    const n = g.boss ? 7 : 3 + Math.min(2, Math.floor((g.speed - 1) * 1.6));
    const tell = 0.55 / g.speed;
    const fall = 0.5 / Math.sqrt(g.speed);
    const first = 0.3 / g.speed;
    const gap = Math.max(0.25 / g.speed, (g.duration - first - tell - fall - 0.15) / Math.max(1, n - 1));
    const nuts = Array.from({ length: n }, (_, i) => ({ at: first + i * gap, state: 'wait', x: 200, y: topY, k: 0, vy: 0, rot: 0, landed: 0 }));
    const s = { t: 0, x: 200, target: 200, drag: false, grab: 0, vx: 0, hit: false, close: 0, quip: 0 };

    return {
      update(dt) {
        s.t += dt;
        const before = s.x;
        if (!s.hit) s.x += (s.target - s.x) * Math.min(1, dt * 16);
        s.vx = (s.x - before) / Math.max(dt, 1e-6);
        s.close = Math.max(0, s.close - dt);
        for (const nut of nuts) {
          if (nut.state === 'wait' && s.t >= nut.at && !g.done) {
            // Aims at where the hero is lounging right now.
            nut.state = 'shake';
            nut.x = Math.max(X_MIN, Math.min(X_MAX, s.x + (g.random() - 0.5) * 40));
            nut.k = 0;
            g.sfx.tick();
          }
          if (nut.state === 'shake') {
            nut.k += dt / tell;
            if (nut.k >= 1) {
              nut.state = 'fall';
              nut.k = 0;
              g.sfx.whoosh();
            }
          } else if (nut.state === 'fall') {
            nut.k += dt / fall;
            nut.y = topY + (headY - topY) * nut.k * nut.k;
            nut.rot += dt * 8;
            if (nut.k >= 1 && !nut.judged) {
              nut.judged = true;
              if (!g.done && Math.abs(nut.x - s.x) < HIT) {
                s.hit = true;
                nut.state = 'bonk';
                nut.vy = -320;
                nut.vx = (nut.x < s.x ? -1 : 1) * 140;
                g.sfx.hit();
                g.fx.shake(14);
                g.fx.burst(s.x, headY - 10, { kind: 'spark', n: 16, colors: ['#fff3a0', '#ffffff', PAL.mango], speed: 220 });
                g.fx.text(s.x, headY - 60, 'BONK!', { size: 34, color: PAL.mango });
                g.say(300, g.H * 0.86 - 80, g.tr({ en: 'Cheh! Bonk!', fr: 'Cheh ! Bonk !' }), 1.4);
                g.lose();
              } else {
                nut.state = 'drop';
                if (!g.done) {
                  s.close = Math.abs(nut.x - s.x) < HIT + 40 ? 0.6 : 0;
                  if (s.close) g.fx.text(s.x, headY - 60, g.tr({ en: 'Phew!', fr: 'Ouf !' }), { size: 22, color: PAL.cream });
                }
              }
            }
          } else if (nut.state === 'drop') {
            // Falls on to the sand and rolls a bit.
            const ground = seatY + 38;
            if (nut.y < ground) {
              nut.vy += 2600 * dt;
              nut.y = Math.min(ground, nut.y + nut.vy * dt + 6);
              if (nut.y >= ground) {
                g.sfx.pop();
                g.fx.burst(nut.x, ground, { kind: 'smoke', n: 6, speed: 60 });
              }
            }
            nut.landed += dt;
          } else if (nut.state === 'bonk') {
            nut.vy += 1500 * dt;
            nut.x += nut.vx * dt;
            nut.y += nut.vy * dt;
            nut.rot += dt * 12;
          }
        }
        if (!g.done && nuts.every((nt) => nt.state === 'drop')) {
          g.sfx.hoho();
          g.fx.burst(s.x, headY - 20, { kind: 'petal', n: 16 });
          g.say(s.x, headY - 50, g.tr({ en: 'Hoho! Not today!', fr: 'Hoho ! Pas aujourd\'hui !' }), 1.3);
          g.win();
        }
      },
      press(x) {
        s.drag = true;
        s.grab = s.target - x;
        g.sfx.tap();
      },
      move(x) {
        if (!s.drag) return;
        s.target = Math.max(X_MIN, Math.min(X_MAX, x + s.grab));
      },
      release() {
        s.drag = false;
      },
      draw(c) {
        scene.beach(c, g.W, g.H, s.t, { horizon: 0.42, shore: 0.55 });
        // Palm canopy overhead: crowns all across the top.
        palm(c, 30, g.H * 0.62, g.H * 0.46, s.t, 0.3);
        palm(c, 380, g.H * 0.6, g.H * 0.44, s.t + 2, -0.42);
        palm(c, 190, g.H * 0.5, g.H * 0.36, s.t + 1, 0.02);
        // Friend on a madras towel, in the foreground.
        const towelY = g.H * 0.86;
        c.save();
        c.translate(300, towelY);
        c.rotate(-0.05);
        shadowed(c, () => madrasBand(c, -70, -18, 140, 40, 0.4), 8, 3);
        c.restore();
        const fpose = g.done ? (g.won ? 'cheer' : 'point') : s.close > 0 ? 'cheer' : 'sit';
        person(c, friend, 300, towelY + 6, 110, fpose, s.t + 1, { flip: true, hat: 'shades' });
        // Shadows grow on the sand where each coconut will land.
        for (const nut of nuts) {
          if (nut.state !== 'shake' && nut.state !== 'fall') continue;
          const grow = nut.state === 'shake' ? nut.k * 0.5 : 0.5 + nut.k * 0.5;
          ellipse(c, nut.x, seatY + 34, 12 + grow * 30, 4 + grow * 9, `rgba(20,10,40,${0.12 + grow * 0.3})`);
          if (nut.state === 'shake') {
            c.strokeStyle = `rgba(255,111,97,${0.3 + 0.4 * Math.abs(Math.sin(s.t * 18))})`;
            c.lineWidth = 3;
            c.beginPath();
            c.ellipse(nut.x, seatY + 34, 26 + grow * 30, 8 + grow * 9, 0, 0, Math.PI * 2);
            c.stroke();
          }
        }
        // Landed coconuts on the sand.
        for (const nut of nuts) if (nut.state === 'drop') coconutBall(c, nut.x, nut.y - 14, 18, nut.rot);
        // Hero lounging on the sliding chair.
        const tilt = Math.max(-0.12, Math.min(0.12, -s.vx / 3000));
        c.save();
        c.translate(s.x, seatY);
        c.rotate(tilt);
        chair(c, 0, 0, s.t);
        person(c, g.hero, -8, 6, 150, s.hit ? 'sad' : g.done && g.won ? 'cheer' : 'sit', s.t, { hat: g.hat, squash: s.hit ? 0.88 : 1 });
        c.restore();
        if (s.hit) {
          for (let i = 0; i < 3; i++) {
            const a = s.t * 5 + (i * Math.PI * 2) / 3;
            text(c, '★', s.x + Math.cos(a) * 36, headY - 40 + Math.sin(a) * 10, { size: 18, color: '#fff3a0' });
          }
        }
        // Coconuts in the crowns: shaking ones wobble and glow, then fall.
        for (const nut of nuts) {
          if (nut.state === 'shake') {
            const wob = Math.sin(s.t * 50) * 4 * (0.4 + nut.k);
            const glow = c.createRadialGradient(nut.x, topY, 2, nut.x, topY, 36);
            glow.addColorStop(0, `rgba(255,200,90,${0.35 + 0.3 * nut.k})`);
            glow.addColorStop(1, 'rgba(255,200,90,0)');
            c.fillStyle = glow;
            c.fillRect(nut.x - 36, topY - 36, 72, 72);
            ellipse(c, nut.x - 16, topY - 14, 30, 8, PAL.palm, -0.3 + wob * 0.02);
            ellipse(c, nut.x + 16, topY - 14, 30, 8, PAL.leaf, 0.3 - wob * 0.02);
            coconutBall(c, nut.x + wob, topY, 18, wob * 0.05);
            text(c, '!', nut.x, topY - 40, { size: 26, color: PAL.coral, stroke: '#fff' });
          } else if (nut.state === 'fall' || nut.state === 'bonk') {
            if (nut.state === 'fall') for (let i = 1; i < 4; i++) circle(c, nut.x, nut.y - i * 16, 14 - i * 3, `rgba(255,255,255,${0.25 - i * 0.06})`);
            coconutBall(c, nut.x, nut.y, 18, nut.rot);
          }
        }
        if (!g.done && !s.drag) text(c, '👈 👉', s.x, seatY + 74, { size: 26, shadow: false });
      },
      bot() {
        const threats = nuts.filter((nt) => nt.state === 'shake' || nt.state === 'fall');
        if (!threats.length) return null;
        if (!s.drag) return { press: [s.x, seatY] };
        // Go to the spot farthest from every incoming coconut.
        let best = s.target;
        let bestD = -1;
        for (let x = X_MIN; x <= X_MAX; x += 10) {
          const d = Math.min(...threats.map((nt) => Math.abs(nt.x - x)));
          if (d > bestD + 0.5) {
            best = x;
            bestD = d;
          }
        }
        if (threats.every((nt) => Math.abs(nt.x - s.target) > HIT + 30)) return null;
        return { move: [best - s.grab, seatY] };
      },
    };
  },
};
