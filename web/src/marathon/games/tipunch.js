// Ti-punch (world 5, Le Molière nightclub): the bartender friend slides a
// ti-punch along the bar. TAP to stop it inside the glowing zone in front of
// the hero. Too short, too far, or off the end of the counter (smash) loses.
// Two glasses at high speed.

import { scene, person, rrect, circle, ellipse, PAL, text, shadowed, vgrad } from '../art.js';

const START_X = 78;
const ZONE_X = 302;
const ZONE_HALF = 30;
const END_X = 388;

/** A ti-punch in a short rocks glass, bottom centre on (x, y). */
export function tiPunch(c, x, y, s = 1, t = 0) {
  const w = 34 * s;
  const h = 40 * s;
  c.save();
  c.translate(x, y);
  ellipse(c, 0, 1, w * 0.62, 5 * s, 'rgba(10,5,25,0.35)');
  // Liquid: golden rum, a lime wedge and an ice cube.
  c.save();
  c.beginPath();
  c.moveTo(-w / 2, -h);
  c.lineTo(-w * 0.44, 0);
  c.lineTo(w * 0.44, 0);
  c.lineTo(w / 2, -h);
  c.clip();
  c.fillStyle = vgrad(c, -h * 0.6, 0, ['rgba(255,196,90,0.85)', 'rgba(214,128,40,0.95)']);
  c.fillRect(-w, -h * 0.58 + Math.sin(t * 9) * 1.2 * s, w * 2, h);
  rrect(c, -w * 0.3, -h * 0.66, w * 0.32, w * 0.3, 3 * s);
  c.fillStyle = 'rgba(235,250,255,0.75)';
  c.fill();
  c.restore();
  c.save();
  c.translate(w * 0.28, -h * 0.82);
  c.rotate(0.5);
  c.beginPath();
  c.arc(0, 0, w * 0.28, 0, Math.PI);
  c.fillStyle = '#6fd04f';
  c.fill();
  c.beginPath();
  c.arc(0, 0, w * 0.22, 0, Math.PI);
  c.fillStyle = '#d9f7a8';
  c.fill();
  c.restore();
  // Glass walls with a thick base and a highlight.
  c.fillStyle = 'rgba(220,240,255,0.22)';
  c.beginPath();
  c.moveTo(-w / 2, -h);
  c.lineTo(-w * 0.44, 0);
  c.lineTo(w * 0.44, 0);
  c.lineTo(w / 2, -h);
  c.fill();
  rrect(c, -w * 0.44, -5 * s, w * 0.88, 5 * s, 2 * s);
  c.fillStyle = 'rgba(230,245,255,0.55)';
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.55)';
  c.fillRect(-w * 0.36, -h * 0.92, 3 * s, h * 0.8);
  ellipse(c, 0, -h, w / 2, 3.5 * s, 'rgba(255,255,255,0.4)');
  c.restore();
}

export default {
  id: 'tipunch',
  world: 'w05',
  input: 'tap',
  base: 5,
  min: 2.6,
  survive: false,
  verb: { en: 'STOP THE TI-PUNCH!', fr: 'ARRÊTE LE TI-PUNCH !' },
  title: { en: "Ti-punch slide", fr: "Le ti-punch glissé" },
  howto: { en: "The ti-punch slides down the bar. Tap to stop it in the glowing ring.", fr: "Le ti-punch glisse sur le bar. Touche pour l'arrêter dans le cercle lumineux." },
  winLine: { en: "Right in front of you. Santé!", fr: "Pile devant toi. Santé !" },
  rival: ["victor", "mamar"],
  rivalLine: { en: "I wanted to drink it myself…", fr: "Je voulais le boire moi-même…" },
  loseLine: { en: "Hoho, my ti-punch!", fr: "Hoho, mon ti-punch !" },
  create(g) {
    const bartender = g.friend();
    const dancer = g.friend([bartender]);
    const total = g.boss || g.speed >= 1.8 ? 2 : 1;
    const barY = g.H * 0.6; // counter top where glasses stand
    const windup = 0.4 / g.speed;
    const pause = 0.22 / g.speed;
    const glasses = Array.from({ length: total }, () => ({
      v: (230 + 120 * (g.speed - 1)) * (0.92 + g.random() * 0.16),
      state: 'wait', // wait | windup | slide | stop | fall | taken
      x: START_X,
      k: 0,
      y: barY,
      vy: 0,
      rot: 0,
    }));
    const s = { t: 0, i: 0, shards: [], served: 0, cheer: 0 };
    glasses[0].state = 'windup';

    const cur = () => glasses[s.i];

    function next() {
      if (s.i + 1 < total) {
        s.i++;
        cur().state = 'windup';
        cur().k = -pause / windup;
      }
    }

    function smash(gl) {
      gl.state = 'fall';
      gl.vy = -60;
      g.sfx.whoosh();
    }

    return {
      update(dt) {
        s.t += dt;
        s.cheer = Math.max(0, s.cheer - dt);
        for (const gl of glasses) {
          if (gl.state === 'windup') {
            if (g.done) continue;
            gl.k += dt / windup;
            if (gl.k >= 1) {
              gl.state = 'slide';
              gl.k = 0;
              g.sfx.whoosh();
            }
          } else if (gl.state === 'slide') {
            if (g.done) {
              // Decided by another glass: this one skids to a halt.
              gl.v *= Math.max(0, 1 - dt * 6);
            }
            gl.x += gl.v * dt;
            if (gl.x > END_X && !g.done) {
              smash(gl);
              g.say(ZONE_X, barY - 175, g.tr({ en: 'Noooo! My ti-punch!', fr: 'Nooon ! Mon ti-punch !' }), 1.4);
              g.lose();
            }
          } else if (gl.state === 'fall') {
            gl.vy += 1800 * dt;
            gl.x += 160 * dt;
            gl.y += gl.vy * dt;
            gl.rot += dt * 9;
            const floor = g.H * 0.8;
            if (gl.y >= floor) {
              gl.state = 'broken';
              g.sfx.hit();
              g.sfx.bad();
              g.fx.shake(12);
              g.fx.burst(Math.min(390, gl.x), floor, { kind: 'spark', n: 26, colors: ['#e6f6ff', '#bfe9ff', '#ffffff', PAL.mango], speed: 300 });
              g.fx.burst(Math.min(390, gl.x), floor, { kind: 'drop', n: 14, colors: ['#ffc45a', '#e08a2a'], speed: 200 });
            }
          } else if (gl.state === 'stop') {
            gl.k += dt;
            if (gl.k > 0.18) {
              gl.state = 'taken';
              gl.k = 0;
              if (!g.done) next();
            }
          } else if (gl.state === 'taken') {
            gl.k = Math.min(1, gl.k + dt * 3);
          }
        }
      },
      press() {
        const gl = cur();
        if (!gl || gl.state !== 'slide') return;
        const d = gl.x - ZONE_X;
        gl.x += 4; // a tiny skid
        if (Math.abs(d) <= ZONE_HALF) {
          gl.state = 'stop';
          gl.k = 0;
          s.served++;
          s.cheer = 0.5;
          g.sfx.click();
          g.sfx.good();
          g.fx.burst(gl.x, barY - 30, { kind: 'spark', n: 14, colors: [PAL.mango, '#fff3c4', PAL.hibiscus], speed: 200 });
          g.fx.text(gl.x, barY - 90, Math.abs(d) < ZONE_HALF * 0.35 ? g.tr({ en: 'Perfect!', fr: 'Parfait !' }) : g.tr({ en: 'Nice!', fr: 'Joli !' }), { size: 26, color: PAL.mango });
          if (s.served === total) {
            g.sfx.hoho();
            g.fx.burst(ZONE_X, barY - 120, { kind: 'confetti', n: 30 });
            g.say(ZONE_X, barY - 175, g.tr({ en: 'Hoho! Santé!', fr: 'Hoho ! Santé !' }), 1.4);
            g.win();
          }
          return;
        }
        // Stopped in the wrong place.
        gl.state = 'miss';
        g.sfx.bad();
        g.fx.shake(8);
        g.say(ZONE_X, barY - 175, d < 0 ? g.tr({ en: 'Too short!', fr: 'Trop court !' }) : g.tr({ en: 'Too far!', fr: 'Trop loin !' }), 1.4);
        g.lose();
      },
      draw(c) {
        scene.club(c, g.W, g.H, s.t);
        // A friend dancing at the back of the club.
        person(c, dancer, 200, barY - 40, 100, 'dance', s.t, { alpha: 0.75 });
        // Bartender winds up before each slide.
        const gl = cur();
        const winding = gl && gl.state === 'windup' && gl.k > 0;
        person(c, bartender, 64, barY + 60, 190, winding ? 'point' : g.done && g.won ? 'cheer' : 'idle', s.t + 1, { squash: winding ? 0.96 : 1 });
        if (winding) text(c, g.tr({ en: 'Ti-punch!', fr: 'Ti-punch !' }), 90, barY - 200, { size: 22, color: PAL.cream });
        // Hero waiting at the end of the bar.
        const hpose = g.done ? (g.won ? 'cheer' : 'sad') : s.cheer > 0 ? 'cheer' : 'idle';
        person(c, g.hero, ZONE_X + 10, barY + 60, 190, hpose, s.t, { flip: true, hat: g.hat });
        // Counter: polished wood with a neon edge.
        shadowed(c, () => {
          c.fillStyle = vgrad(c, barY - 6, barY + 26, ['#9a5a34', '#5e3218']);
          rrect(c, -10, barY - 6, END_X + 10, 30, 8);
          c.fill();
        }, 16, 8, 'rgba(0,0,0,0.5)');
        c.fillStyle = 'rgba(255,255,255,0.18)';
        c.fillRect(0, barY - 4, END_X - 6, 4);
        c.fillStyle = vgrad(c, barY + 24, g.H * 0.78, ['#2a1745', '#160c2a']);
        c.fillRect(0, barY + 24, END_X - 8, g.H * 0.78 - barY - 24);
        c.save();
        c.shadowColor = PAL.hibiscus;
        c.shadowBlur = 14;
        c.fillStyle = PAL.hibiscus;
        c.fillRect(0, barY + 24, END_X - 8, 3);
        c.restore();
        for (let i = 0; i < 5; i++) {
          c.fillStyle = `hsla(${(i * 70 + s.t * 50) % 360}, 80%, 60%, 0.12)`;
          rrect(c, 12 + i * 76, barY + 40, 60, g.H * 0.78 - barY - 56, 10);
          c.fill();
        }
        // The glowing stop zone.
        const inZone = gl && gl.state === 'slide' && Math.abs(gl.x - ZONE_X) <= ZONE_HALF;
        const pulse = 0.5 + 0.5 * Math.sin(s.t * 10);
        const zg = c.createRadialGradient(ZONE_X, barY, 4, ZONE_X, barY, ZONE_HALF + 30);
        zg.addColorStop(0, inZone ? 'rgba(255,214,102,0.9)' : `rgba(18,194,201,${0.4 + 0.2 * pulse})`);
        zg.addColorStop(1, 'rgba(18,194,201,0)');
        c.fillStyle = zg;
        c.fillRect(ZONE_X - ZONE_HALF - 30, barY - 40, (ZONE_HALF + 30) * 2, 70);
        c.save();
        c.strokeStyle = inZone ? PAL.mango : PAL.lagoon;
        c.shadowColor = inZone ? PAL.mango : PAL.lagoon;
        c.shadowBlur = 12;
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(ZONE_X, barY + 2, ZONE_HALF + 6, 9, 0, 0, Math.PI * 2);
        c.stroke();
        c.restore();
        // Glasses.
        for (const q of glasses) {
          if (q.state === 'wait' || q.state === 'broken') continue;
          if (q.state === 'windup') {
            if (q.k > 0) tiPunch(c, START_X - 8 * q.k, barY, 1, s.t);
            continue;
          }
          if (q.state === 'slide') {
            for (let i = 1; i <= 3; i++) {
              c.globalAlpha = 0.18 / i;
              tiPunch(c, q.x - i * q.v * 0.03, barY, 1, s.t);
            }
            c.globalAlpha = 1;
            c.strokeStyle = 'rgba(255,255,255,0.35)';
            c.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
              c.beginPath();
              c.moveTo(q.x - 24 - i * 6, barY - 10 - i * 10);
              c.lineTo(q.x - 60 - i * 10, barY - 10 - i * 10);
              c.stroke();
            }
          }
          if (q.state === 'fall') {
            c.save();
            c.translate(q.x, q.y);
            c.rotate(q.rot);
            tiPunch(c, 0, 0, 1, s.t);
            c.restore();
            continue;
          }
          const lift = q.state === 'taken' ? q.k * 40 : 0;
          if (q.state === 'taken' && q.k >= 1) continue;
          tiPunch(c, q.x, barY - lift, 1, s.t);
        }
        if (!g.done) text(c, '👆', 200, g.H * 0.86, { size: 30, shadow: false });
      },
      bot() {
        const q = cur();
        if (!q || q.state !== 'slide') return null;
        return q.x >= ZONE_X - 6 && q.x <= ZONE_X + ZONE_HALF - 4 ? { press: [200, 400] } : null;
      },
    };
  },
};
