// Hoho ma bagnole! Kids rush at the Fiat Panda. Tap each kid to shoo it away.

import { scene, person, kid, rrect, circle, ellipse, PAL, text, shadowed } from '../art.js';

/** The little boxy Fiat Panda, centred on x, wheels on y. */
export function fiatPanda(c, x, y, t = 0, { color = '#e8edf2', shake = 0, alarm = false } = {}) {
  c.save();
  c.translate(x + Math.sin(t * 60) * shake, y);
  ellipse(c, 0, 4, 120, 14, 'rgba(20,10,40,0.25)');
  shadowed(c, () => {
    rrect(c, -110, -80, 220, 70, 16);
    c.fillStyle = color;
    c.fill();
  }, 14, 6);
  // cabin
  c.fillStyle = color;
  rrect(c, -78, -132, 150, 60, 12);
  c.fill();
  c.fillStyle = alarm && Math.sin(t * 30) > 0 ? '#ffd166' : '#8fd3f4';
  rrect(c, -68, -124, 62, 44, 8);
  c.fill();
  rrect(c, 2, -124, 62, 44, 8);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.5)';
  c.fillRect(-60, -120, 8, 36);
  c.fillRect(10, -120, 8, 36);
  // stripe and badge
  c.fillStyle = '#5a6070';
  c.fillRect(-110, -36, 220, 8);
  text(c, 'PANDA', 40, -54, { size: 18, color: '#5a6070', shadow: false, weight: 700 });
  circle(c, -96, -58, 9, '#fff3b0');
  circle(c, 100, -58, 8, '#ff6b6b');
  for (const wx of [-66, 66]) {
    circle(c, wx, -10, 24, '#22232b');
    circle(c, wx, -10, 11, '#c9ccd6');
  }
  c.restore();
}

export default {
  id: 'kids',
  world: 'w03',
  input: 'tap',
  base: 5,
  survive: true,
  verb: { en: 'SAVE THE CAR!', fr: 'SAUVE LA BAGNOLE !' },
  create(g) {
    const total = g.boss ? 10 : 3 + Math.min(2, Math.floor((g.speed - 1) * 2));
    const carX = 200;
    const carY = g.H * 0.6;
    const runTime = 1.7 / Math.sqrt(g.speed) / Math.max(1, g.speed * 0.75);
    const spawnWindow = g.duration - runTime - 0.25;
    const kids = Array.from({ length: total }, (_, i) => {
      const side = i % 2 ? 1 : -1;
      return {
        seed: Math.floor(g.random() * 97),
        at: 0.15 + (spawnWindow * i) / Math.max(1, total - 1) * (0.85 + g.random() * 0.15),
        side,
        x0: side * 240 + 200,
        y: carY - 30 + (g.random() - 0.3) * g.H * 0.28,
        x: side * 240 + 200,
        state: 'wait', // wait | run | flee | won
        k: 0,
      };
    });
    const s = { t: 0, alarm: 0 };

    return {
      update(dt) {
        s.t += dt;
        s.alarm = Math.max(0, s.alarm - dt);
        for (const k of kids) {
          if (k.state === 'wait' && s.t >= k.at && !g.done) k.state = 'run';
          if (k.state === 'run') {
            if (g.done) continue;
            k.k += dt / runTime;
            const target = carX + k.side * 95;
            k.x = k.x0 + (target - k.x0) * Math.min(1, k.k);
            if (k.k >= 1) {
              k.state = 'won';
              s.alarm = 2;
              g.fx.shake(14);
              g.sfx.hit();
              g.say(carX, carY - 150, g.tr({ en: 'Hoho my bagnole!!', fr: 'Hoho ma bagnole !!' }));
              g.lose();
            }
          } else if (k.state === 'flee') {
            k.x += k.side * 700 * dt;
          }
        }
        if (!g.done && kids.every((k) => k.state === 'flee')) {
          g.fx.burst(carX, carY - 80, { kind: 'petal', n: 16 });
          g.win();
        }
      },
      press(x, y) {
        let best = null;
        let bestD = 70;
        for (const k of kids) {
          if (k.state !== 'run') continue;
          const d = Math.hypot(k.x - x, k.y - 40 - y);
          if (d < bestD) {
            best = k;
            bestD = d;
          }
        }
        if (!best) return;
        best.state = 'flee';
        g.sfx.pop();
        g.fx.burst(best.x, best.y - 50, { kind: 'spark', n: 10, colors: [PAL.mango, '#fff'], speed: 200 });
        g.fx.text(best.x, best.y - 90, g.tr({ en: 'Shoo!', fr: 'Ouste !' }), { size: 24, color: PAL.cream });
      },
      draw(c) {
        scene.street(c, g.W, g.H, s.t);
        person(c, g.hero, 330, carY - 120, 140, g.done ? (g.won ? 'cheer' : 'sad') : 'point', s.t, { flip: true, hat: g.hat });
        const sorted = [...kids].sort((a, b) => a.y - b.y);
        const behind = sorted.filter((k) => k.y < carY);
        const front = sorted.filter((k) => k.y >= carY);
        const drawKid = (k) => {
          if (k.state === 'wait') return;
          c.save();
          c.translate(k.x, k.y);
          const dir = k.state === 'flee' ? k.side : -k.side;
          c.scale(dir, 1);
          kid(c, 0, 0, 80, k.seed, s.t, 'run');
          c.restore();
          if (k.state === 'flee') text(c, '!', k.x, k.y - 100, { size: 30, color: PAL.hibiscus });
        };
        behind.forEach(drawKid);
        fiatPanda(c, carX, carY, s.t, { shake: s.alarm > 0 ? 3 : 0, alarm: s.alarm > 0 });
        front.forEach(drawKid);
      },
      bot() {
        const target = kids.filter((k) => k.state === 'run' && k.k > 0.15).sort((a, b) => b.k - a.k)[0];
        return target ? { press: [target.x, target.y - 40] } : null;
      },
    };
  },
};
