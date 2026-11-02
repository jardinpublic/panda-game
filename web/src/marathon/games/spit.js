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
  title: { en: "Babar's spit", fr: "Eul’ crachat de Babar" },
  howto: { en: "Babar is loading a spit. Swipe left or right to dodge every one.", fr: "Babar prépare un crachat. Glisse à gauche ou à droite pour les esquiver tous." },
  winLine: { en: "Dry as a bone!", fr: "Sec comme un os !" },
  rival: ["babar", "mamar"],
  rivalLine: { en: "Pfff… I'm out of spit.", fr: "Pfff… J'ai plus de salive." },
  loseLine: { en: "Hoho… right in the face!", fr: "Hoho… en pleine face !" },
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
    // Each gob is aimed when Babar starts his "Hrrrk" (a green ring marks the
    // lane), so the whole tell + flight is the time to dodge (~0.55 s at top speed).
    const s = { lane: 1, x: LANES[1], t: 0, gobs: [], launched: 0, nextAt: 0.7 / g.speed, villainX: 200, hit: false, moving: 0, aim: null, close: 0 };

    function launch() {
      s.gobs.push({ lane: s.aim ?? s.lane, x0: s.villainX, t: 0, passed: false });
      s.aim = null;
      s.launched++;
      s.nextAt += gap;
      g.sfx.whoosh();
    }

    return {
      update(dt) {
        s.t += dt;
        s.x += (LANES[s.lane] - s.x) * Math.min(1, dt * 18);
        s.moving = Math.max(0, s.moving - dt);
        s.close = Math.max(0, s.close - dt);
        if (!g.done) {
          // Babar locks on to the hero's lane as he starts hawking, then walks to aim.
          if (s.launched < total && s.aim === null && s.nextAt - s.t < tell) {
            s.aim = s.lane;
            g.sfx.tick();
          }
          const aimX = LANES[s.aim ?? s.lane];
          s.villainX += (aimX * 0.6 + 80 - s.villainX) * Math.min(1, dt * 3);
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
              // Near miss: the gob lands right next to the hero.
              if (Math.abs(gob.lane - s.lane) === 1 && s.close <= 0) {
                s.close = 0.5;
                g.fx.text(s.x, heroY - 230, g.tr({ en: 'Phew!', fr: 'Ouf !' }), { size: 24, color: PAL.cream });
              }
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
        // Target rings: the lane Babar is aiming at, and where each gob will land.
        const targets = s.gobs.filter((gob) => !gob.passed).map((gob) => [gob.lane, Math.min(1, gob.t)]);
        if (s.aim !== null && !g.done) targets.push([s.aim, 0]);
        for (const [lane, k] of targets) {
          const pulse = 0.5 + 0.5 * Math.sin(s.t * (10 + k * 14));
          ellipse(c, LANES[lane], heroY + 4, 40 + 14 * k, 12 + 4 * k, `rgba(170,235,130,${0.45 + 0.4 * k * pulse})`);
          text(c, '⚠', LANES[lane], heroY + 36, { size: 18, shadow: false });
        }
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
