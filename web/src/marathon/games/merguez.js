// Barbecue: tap each merguez when it is golden. Too early it is raw, too
// late it burns. "Hoho les merguez!"

import { scene, person, rrect, circle, ellipse, PAL, text, shadowed } from '../art.js';

const GOLD = [0.55, 0.82];

function mix(a, b, k) {
  const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16));
  const pb = b.match(/\w\w/g).map((h) => parseInt(h, 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(',')})`;
}

function colorFor(d) {
  if (d < GOLD[0]) return mix('e88f8a', 'd0703e', Math.max(0, d) / GOLD[0]);
  if (d < GOLD[1]) return mix('d0703e', 'a8461f', (d - GOLD[0]) / (GOLD[1] - GOLD[0]));
  return mix('a8461f', '2a1712', Math.min(1, (d - GOLD[1]) / (1 - GOLD[1])));
}

export default {
  id: 'merguez',
  world: 'w10',
  input: 'tap',
  base: 5,
  survive: false,
  verb: { en: 'FLIP WHEN GOLDEN!', fr: 'RETOURNE QUAND C\'EST DORÉ !' },
  title: { en: "Hoho the merguez!", fr: "Hoho les merguez !" },
  howto: { en: "Tap each merguez when it turns golden. Too early it's raw, too late it burns.", fr: "Touche chaque merguez quand elle est dorée. Trop tôt c'est cru, trop tard c'est cramé." },
  winLine: { en: "Golden merguez for everyone!", fr: "Merguez dorées pour tout le monde !" },
  rival: ["mamar", "babar"],
  rivalLine: { en: "I wanted to see them burn!", fr: "Moi je voulais les voir cramer !" },
  loseLine: { en: "Hoho les merguez… burnt to a crisp!", fr: "Hoho les merguez… carbonisées !" },
  create(g) {
    const n = g.boss ? 4 : g.speed < 1.45 ? 2 : 3;
    const grillY = g.H * 0.6;
    const rate = g.speed / 3.1;
    const friend = g.friend();
    const sausages = Array.from({ length: n }, (_, i) => ({
      x: 200 + (i - (n - 1) / 2) * (n > 3 ? 78 : 95),
      y: grillY + 10,
      d: -0.1 - g.random() * 0.35 - (i % 2) * 0.12,
      flipped: false,
      flipT: 0,
      bad: false,
    }));
    const s = { t: 0 };

    function verdict() {
      if (sausages.every((m) => m.flipped)) {
        g.say(110, grillY - 170, g.tr({ en: 'Hoho, the merguez!', fr: 'Hoho les merguez !' }));
        g.sfx.hoho();
        g.fx.burst(200, grillY - 20, { kind: 'confetti', n: 30 });
        g.win();
      }
    }

    return {
      update(dt) {
        s.t += dt;
        for (const m of sausages) {
          if (m.flipped) {
            m.flipT += dt;
            continue;
          }
          if (!g.done) m.d += rate * dt;
          if (m.d >= 1 && !g.done) {
            m.bad = true;
            g.fx.burst(m.x, m.y - 10, { kind: 'smoke', n: 14, speed: 60 });
            g.say(m.x, m.y - 40, g.tr({ en: 'Burnt!', fr: 'Cramée !' }));
            g.sfx.bad();
            g.lose();
          }
        }
      },
      press(x, y) {
        const m = sausages.find((q) => !q.flipped && Math.abs(q.x - x) < 46 && Math.abs(q.y - y) < 80);
        if (!m) return;
        m.flipped = true;
        if (m.d < GOLD[0]) {
          m.bad = true;
          g.say(m.x, m.y - 40, g.tr({ en: 'Still raw!', fr: 'Encore crue !' }));
          g.sfx.bad();
          g.lose();
          return;
        }
        g.sfx.sizzle();
        g.sfx.good();
        g.fx.burst(m.x, m.y - 10, { kind: 'spark', colors: [PAL.mango, '#fff3c4'], n: 12, speed: 180 });
        g.fx.text(m.x, m.y - 50, g.tr({ en: 'Perfect!', fr: 'Parfait !' }), { size: 24, color: PAL.mango });
        verdict();
      },
      draw(c) {
        scene.yard(c, g.W, g.H, s.t);
        person(c, g.hero, 110, grillY - 35, 170, g.done ? (g.won ? 'cheer' : 'sad') : 'idle', s.t, { hat: g.hat });
        person(c, friend, 300, grillY - 45, 150, g.done && g.won ? 'dance' : 'idle', s.t + 1, { flip: true });
        // Grill body.
        shadowed(c, () => {
          rrect(c, 40, grillY - 40, 320, 110, 22);
          c.fillStyle = '#2b2b33';
          c.fill();
        }, 20, 10);
        for (let i = 0; i < 9; i++) {
          const gx = 70 + i * 33;
          const glow = c.createRadialGradient(gx, grillY + 30, 2, gx, grillY + 30, 26);
          const f = 0.6 + 0.4 * Math.sin(s.t * 6 + i * 1.7);
          glow.addColorStop(0, `rgba(255,${120 + 60 * f},40,${0.8 * f})`);
          glow.addColorStop(1, 'rgba(255,80,20,0)');
          c.fillStyle = glow;
          c.fillRect(gx - 26, grillY + 4, 52, 52);
        }
        c.strokeStyle = '#8b8d99';
        c.lineWidth = 3;
        for (let i = 0; i < 12; i++) {
          c.beginPath();
          c.moveTo(56 + i * 26, grillY - 28);
          c.lineTo(56 + i * 26, grillY + 56);
          c.stroke();
        }
        // Legs.
        c.fillStyle = '#2b2b33';
        c.fillRect(70, grillY + 66, 10, 90);
        c.fillRect(320, grillY + 66, 10, 90);
        for (const m of sausages) {
          const hop = m.flipped ? Math.max(0, Math.sin(Math.min(1, m.flipT * 4) * Math.PI)) * 40 : 0;
          const ready = !m.flipped && m.d >= GOLD[0] && m.d < GOLD[1];
          c.save();
          c.translate(m.x, m.y - hop);
          if (m.flipped) c.rotate(Math.min(1, m.flipT * 4) * Math.PI);
          if (ready) {
            const pulse = 0.5 + 0.5 * Math.sin(s.t * 14);
            ellipse(c, 0, 0, 30 + pulse * 4, 70 + pulse * 4, `rgba(255,210,90,${0.35 + 0.25 * pulse})`);
          }
          shadowed(c, () => {
            rrect(c, -15, -62, 30, 124, 15);
            c.fillStyle = colorFor(m.d);
            c.fill();
          }, 6, 3);
          c.fillStyle = 'rgba(255,255,255,0.35)';
          rrect(c, -9, -54, 6, 100, 3);
          c.fill();
          if (m.d > 0.3) {
            c.strokeStyle = 'rgba(40,15,10,0.55)';
            c.lineWidth = 4;
            for (let k = -1; k <= 1; k++) {
              c.beginPath();
              c.moveTo(-13, k * 30 - 6);
              c.lineTo(13, k * 30 + 6);
              c.stroke();
            }
          }
          c.restore();
          if (!m.flipped && m.d > 0.2) {
            for (let k = 0; k < 2; k++) circle(c, m.x + (k ? 10 : -8), m.y - 70 - ((s.t * 50 + k * 20 + m.x) % 50), 5 + k * 2, `rgba(245,245,250,${m.d > GOLD[1] ? 0.7 : 0.35})`);
          }
        }
        if (!g.done) text(c, '👆', 200, grillY + 140, { size: 34, shadow: false });
      },
      bot() {
        const m = sausages.find((q) => !q.flipped && q.d >= GOLD[0] + 0.03 && q.d < GOLD[1]);
        return m ? { press: [m.x, m.y] } : null;
      },
    };
  },
};
