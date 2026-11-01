// Babar spits from the barbecue. Swipe left/right to dodge each gob.

import { scene, person, ellipse, circle, PAL, text } from '../art.js';

const LANES = [95, 200, 305];

export default {
  id: 'spit',
  world: 'w10',
  input: 'swipe',
  base: 4.5,
  survive: true,
  verb: { en: 'DODGE!', fr: 'ESQUIVE !' },
  create(g) {
    const villain = g.cast('babar', 'mamar');
    const total = g.boss ? 6 : 3;
    const gap = 1 / g.speed;
    const travel = 0.75 / g.speed;
    const tell = 0.45 / g.speed;
    const topY = g.H * 0.4;
    const heroY = g.H * 0.86;
    const mouthY = topY - 92;
    const hitY = heroY - 120;
    const s = { lane: 1, x: LANES[1], t: 0, gobs: [], launched: 0, nextAt: 0.7 / g.speed, villainX: 200, hit: false, moving: 0 };

    function launch() {
      s.gobs.push({ lane: s.lane, x0: s.villainX, t: 0, passed: false });
      s.launched++;
      s.nextAt += gap;
      g.sfx.whoosh();
    }

    return {
      update(dt) {
        s.t += dt;
        s.x += (LANES[s.lane] - s.x) * Math.min(1, dt * 18);
        s.moving = Math.max(0, s.moving - dt);
        if (!g.done) {
          // Babar walks to aim before each gob.
          s.villainX += (LANES[s.lane] * 0.6 + 80 - s.villainX) * Math.min(1, dt * 3);
          if (s.launched < total && s.t >= s.nextAt) launch();
        }
        for (const gob of s.gobs) {
          gob.t += dt / travel;
          if (!gob.passed && gob.t >= 1) {
            gob.passed = true;
            if (gob.lane === s.lane && !g.done) {
              s.hit = true;
              g.fx.burst(s.x, hitY, { kind: 'drop', colors: ['#d8f0c0', '#b5df9a', '#ffffff'], n: 22 });
              g.fx.shake(12);
              g.sfx.splash();
              g.lose();
            } else if (!g.done) {
              g.sfx.pop();
            }
          }
        }
        if (!g.done && s.launched >= total && s.gobs.every((x) => x.passed)) g.win();
      },
      swipe(dir) {
        if (dir === 'left' && s.lane > 0) s.lane--;
        else if (dir === 'right' && s.lane < 2) s.lane++;
        else return;
        s.moving = 0.25;
        g.sfx.tap();
      },
      press(x) {
        // Tapping a side also dodges, for one-thumb comfort.
        this.swipe(x < s.x - 40 ? 'left' : x > s.x + 40 ? 'right' : '');
      },
      draw(c) {
        scene.yard(c, g.W, g.H, s.t);
        // Barbecue behind Babar.
        ellipse(c, 330, topY - 10, 40, 10, 'rgba(0,0,0,0.15)');
        c.fillStyle = '#3a3a44';
        c.fillRect(300, topY - 60, 60, 40);
        for (let i = 0; i < 3; i++) circle(c, 312 + i * 18, topY - 64 - ((s.t * 40 + i * 13) % 30), 6 + i, 'rgba(240,240,250,0.5)');
        const aiming = s.launched < total && s.nextAt - s.t < tell;
        person(c, villain, s.villainX, topY, 150, aiming ? 'point' : 'idle', s.t, { squash: aiming ? 0.94 : 1 });
        if (aiming) {
          circle(c, s.villainX - 18, mouthY + 4, 9, 'rgba(255,140,140,0.65)');
          circle(c, s.villainX + 16, mouthY + 4, 9, 'rgba(255,140,140,0.65)');
          text(c, g.tr({ en: 'Hrrrk…', fr: 'Hrrrk…' }), s.villainX + 70, mouthY - 50, { size: 20, color: PAL.cream });
        }
        // Lane marks on the grass.
        for (const lx of LANES) ellipse(c, lx, heroY + 4, 46, 12, 'rgba(255,255,255,0.18)');
        for (const gob of s.gobs) {
          if (gob.t > 1.25) continue;
          const k = Math.min(1.25, gob.t);
          const x = gob.x0 + (LANES[gob.lane] - gob.x0) * k;
          const y = mouthY + (hitY - mouthY) * k - Math.sin(Math.min(1, k) * Math.PI) * 40;
          const r = 7 + k * 16;
          ellipse(c, x, heroY + 6, r * 0.9, r * 0.25, 'rgba(0,0,0,0.12)');
          for (let i = 1; i < 4; i++) circle(c, x - (x - gob.x0) * 0.05 * i, y - i * 9, r * (0.5 - i * 0.1), 'rgba(220,245,200,0.6)');
          const grad = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(1, '#a8d98a');
          circle(c, x, y, r, grad);
        }
        person(c, g.hero, s.x, heroY, 190, s.hit ? 'sad' : s.moving > 0 ? 'run' : g.done && g.won ? 'cheer' : 'idle', s.t, { hat: g.hat });
        if (s.hit) ellipse(c, s.x + 6, heroY - 118, 26, 18, 'rgba(190,235,160,0.9)');
      },
      bot() {
        const threat = s.gobs.find((x) => !x.passed && x.lane === s.lane && x.t > 0.35);
        if (threat) return { swipe: s.lane === 0 ? 'right' : s.lane === 2 ? 'left' : 'left' };
        return null;
      },
    };
  },
};
