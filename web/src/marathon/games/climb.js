// Carottés dans l'Silo (world 9): climb the outside of the corn silo. The
// ledge above slides left and right on its rail; TAP to jump when it is over
// you (it glows green). 3 jumps, 4 at high speed, and the two friends on the
// catwalk pull you up. Jump at nothing and you fall.

import { scene, person, rrect, circle, ellipse, PAL, text, shadowed, vgrad, palm } from '../art.js';

/** Tuning (units are stage units; times in seconds at speed 1). */
const TUNE = {
  gap: 150, // height between ledges
  ledgeW: 120,
  tol: 52, // max offset between ledge centre and hero to land (the 120-wide ledge still visibly covers the hero)
  swing: 120, // ledge travel either side of the hero
  slide: 230, // ledge speed, times speed^slideCurve
  slideCurve: 0.85,
  jump: 0.34, // jump time, divided by sqrt(speed)
  startDelay: 0.25, // before the first ledge moves
  fourAt: 1.9, // speed from which it takes 4 jumps
};

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const easeOut = (k) => 1 - (1 - k) ** 3;
const HX = 200; // the hero climbs straight up the middle

export default {
  id: 'climb',
  world: 'w09',
  input: 'tap',
  base: 5.5,
  survive: false,
  verb: { en: 'JUMP UP!', fr: 'SAUTE !' },
  title: { en: "Carottés dans l'Silo", fr: "Carottés dans l'Silo" },
  howto: { en: "Tap to jump onto the ledge when it slides right above you.", fr: "Touche pour sauter sur la corniche quand elle passe au-dessus de toi." },
  winLine: { en: "Top of the silo!", fr: "En haut du silo !" },
  rival: ["romain", "aline"],
  rivalLine: { en: "I bet he'd never make it…", fr: "J'avais parié qu'il y arriverait jamais…" },
  loseLine: { en: "Hoho… do it for the silo, they said!", fr: "Hoho… Do it for the silo, qu'ils disaient !" },
  create(g) {
    const { W, H } = g;
    const sp = g.speed;
    const n = sp >= TUNE.fourAt ? 4 : 3;
    const v = TUNE.slide * sp ** TUNE.slideCurve;
    const jumpT = TUNE.jump / Math.sqrt(sp);
    const left = g.cast('aline', 'violaine');
    const right = g.cast('romain', 'victor');
    // Ledge i (1..n) sits at world y = -i * gap; parked to one side until it is the next one.
    const ledges = Array.from({ length: n }, (_, i) => {
      const side = (i + (g.random() < 0.5 ? 0 : 1)) % 2 ? 1 : -1;
      const x = HX + side * TUNE.swing * (0.65 + g.random() * 0.35);
      return { x, home: x, dir: -side, active: false, locked: false, phase: g.random() * 6 };
    });
    const roofY = -(n * TUNE.gap) - TUNE.gap * 0.8;
    const s = {
      t: 0,
      level: 0,
      jumping: false,
      jt: 0,
      land: 0,
      fall: null, // {y, vy, rot}
      toRoof: -1,
      cam: H * 0.8 + 50,
      endT: 0,
    };

    const worldY = (lv) => -lv * TUNE.gap;
    const next = () => ledges[s.level];
    const aligned = () => next() && Math.abs(next().x - HX) <= TUNE.tol;

    function heroWorld() {
      if (s.fall) return s.fall.y;
      if (s.toRoof >= 0) {
        const k = clamp(s.toRoof / 0.45);
        return worldY(n) + (roofY - worldY(n)) * easeOut(k) - Math.sin(k * Math.PI) * 50;
      }
      if (s.jumping) {
        const k = clamp(s.jt / jumpT);
        return worldY(s.level) + (worldY(s.level + 1) - worldY(s.level)) * easeOut(k) - Math.sin(k * Math.PI) * 34;
      }
      return worldY(s.level);
    }

    function startFall(vy) {
      s.fall = { y: heroWorld(), vy, rot: 0 };
      s.jumping = false;
    }

    function landed() {
      s.jumping = false;
      s.level++;
      s.land = 0.15;
      g.sfx.pop();
      g.sfx.coin();
      const sy = worldY(s.level) + s.cam;
      g.fx.burst(HX, sy, { kind: 'spark', n: 12, colors: ['#ffd34d', '#ffe98a', PAL.mango], speed: 200 });
      g.fx.text(HX + 70, sy - 80, `${s.level}/${n}`, { size: 26, color: PAL.mango });
      if (s.level >= n) {
        s.toRoof = 0;
        g.sfx.hoho();
        g.sfx.good();
        g.fx.burst(HX, sy - 160, { kind: 'confetti', n: 36 });
        g.say(HX - 110, Math.max(140, roofY + s.cam - 120), g.tr({ en: 'You made it!', fr: 'T\'es au sommet !' }), 1.4);
        g.win();
      } else {
        next().active = true;
      }
    }

    return {
      update(dt) {
        s.t += dt;
        s.land = Math.max(0, s.land - dt);
        if (g.done) s.endT += dt;
        // Ran out of time: arms give up.
        if (g.done && !g.won && !s.fall) {
          startFall(-120);
          g.sfx.bad();
          g.say(HX, heroWorld() + s.cam - 150, g.tr({ en: 'My arms…', fr: 'Mes bras…' }), 1.2);
        }
        if (s.t >= TUNE.startDelay / sp && s.level === 0 && !ledges[0].active && !ledges[0].locked) ledges[0].active = true;
        for (const L of ledges) {
          if (L.locked) continue;
          if (L.active && !g.done) {
            L.x += L.dir * v * dt;
            if (L.x > HX + TUNE.swing) {
              L.x = HX + TUNE.swing;
              L.dir = -1;
            } else if (L.x < HX - TUNE.swing) {
              L.x = HX - TUNE.swing;
              L.dir = 1;
            }
          } else if (!L.active) {
            L.x = L.home + Math.sin(s.t * 2 + L.phase) * 5;
          }
        }
        if (s.jumping) {
          s.jt += dt;
          if (s.jt >= jumpT) landed();
        }
        if (s.toRoof >= 0) s.toRoof += dt;
        if (s.fall) {
          s.fall.vy += 2000 * dt;
          s.fall.y += s.fall.vy * dt;
          s.fall.rot += dt * 5;
        }
        // Camera rises with the hero, and shows the catwalk at the end.
        const lv = s.toRoof >= 0 ? n + 0.8 : s.jumping ? s.level + clamp(s.jt / jumpT) : s.level;
        const target = H * 0.8 + 50 + lv * TUNE.gap * 0.72; // +50 keeps the catwalk friends clear of the HUD
        if (!s.fall) s.cam += (target - s.cam) * Math.min(1, dt * 7);
      },
      press() {
        if (s.jumping || s.fall || s.toRoof >= 0) return;
        const L = next();
        if (!L) return;
        g.sfx.whoosh();
        if (aligned()) {
          L.locked = true;
          L.active = false;
          s.jumping = true;
          s.jt = 0;
        } else {
          startFall(-520);
          g.sfx.bad();
          g.fx.shake(12);
          g.fx.text(HX, heroWorld() + s.cam - 160, g.tr({ en: 'Missed!', fr: 'Raté !' }), { size: 34, color: PAL.hibiscus });
          g.say(HX - 120, Math.max(140, roofY + s.cam - 110), g.tr({ en: 'Noooo!', fr: 'Nooon !' }), 1.2);
          g.lose();
        }
      },
      draw(c) {
        const cam = s.cam;
        scene.silo(c, W, H, s.t);
        // Distant Montagne Pelée and cane fields, slow parallax.
        const par = (cam - H * 0.8) * 0.18;
        c.fillStyle = 'rgba(70,120,140,0.45)';
        c.beginPath();
        c.moveTo(-20, H * 0.78 + par);
        c.quadraticCurveTo(W * 0.3, H * 0.6 + par, W * 0.52, H * 0.55 + par);
        c.quadraticCurveTo(W * 0.62, H * 0.53 + par, W * 0.72, H * 0.58 + par);
        c.quadraticCurveTo(W * 0.9, H * 0.66 + par, W + 20, H * 0.74 + par);
        c.lineTo(W + 20, H + 400);
        c.lineTo(-20, H + 400);
        c.fill();
        c.fillStyle = vgrad(c, H * 0.8 + par, H + par, ['#59b86a', '#2f8a4f']);
        c.fillRect(0, H * 0.8 + par, W, H * 0.4 + 200);
        palm(c, 20, H * 0.86 + par * 1.6, 130, s.t, 0.2);
        palm(c, W - 10, H * 0.9 + par * 1.6, 120, s.t + 2, -0.25);

        c.save();
        c.translate(0, cam);
        // The silo: brushed metal cylinder with ribs, cap and catwalk.
        const top = roofY;
        const bodyGrad = c.createLinearGradient(60, 0, 340, 0);
        bodyGrad.addColorStop(0, '#8d9aa8');
        bodyGrad.addColorStop(0.3, '#eef3f7');
        bodyGrad.addColorStop(0.55, '#c3ced9');
        bodyGrad.addColorStop(1, '#73808f');
        shadowed(c, () => {
          c.fillStyle = bodyGrad;
          c.fillRect(60, top, 280, -top + H);
        }, 22, 0, 'rgba(20,10,40,0.25)');
        c.strokeStyle = 'rgba(70,85,100,0.18)';
        c.lineWidth = 2;
        for (let y = top + 12; y < H; y += 22) {
          c.beginPath();
          c.moveTo(60, y);
          c.lineTo(340, y);
          c.stroke();
        }
        for (let y = top + 30; y < H; y += 66) for (const x of [92, 308]) circle(c, x, y, 2.5, 'rgba(60,70,85,0.35)');
        c.save();
        c.globalAlpha = 0.16;
        const word = g.tr({ en: 'CORN', fr: 'MAÏS' });
        for (let i = 0; i < word.length; i++) text(c, word[i], 200, worldY(0.6) - (word.length - 1 - i) * 70 - 30, { size: 64, color: PAL.deep, shadow: false });
        c.restore();
        // Cap.
        c.fillStyle = vgrad(c, top - 92, top, ['#dfe6ec', '#97a4b2']);
        c.beginPath();
        c.moveTo(56, top);
        c.quadraticCurveTo(200, top - 130, 344, top);
        c.closePath();
        c.fill();
        circle(c, 200, top - 66, 9, '#8d9aa8');
        // Catwalk and its friends.
        const cheer = g.done && g.won;
        person(c, left, 92, top, 112, cheer ? 'cheer' : 'point', s.t, { flip: false });
        person(c, right, 308, top, 112, cheer ? 'cheer' : 'idle', s.t + 1, { flip: true });
        c.fillStyle = '#5a6577';
        rrect(c, 30, top, 340, 10, 4);
        c.fill();
        c.strokeStyle = PAL.mango;
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(30, top - 34);
        c.lineTo(370, top - 34);
        c.stroke();
        c.lineWidth = 3;
        for (let x = 34; x <= 370; x += 42) {
          c.beginPath();
          c.moveTo(x, top);
          c.lineTo(x, top - 34);
          c.stroke();
        }
        // Ground ledge.
        c.fillStyle = vgrad(c, 0, 60, ['#c9b79a', '#a8936f']);
        rrect(c, 40, 0, 320, 60, 10);
        c.fill();
        // Rails and ledges.
        ledges.forEach((L, i) => {
          const y = worldY(i + 1);
          c.fillStyle = 'rgba(50,60,75,0.7)';
          rrect(c, HX - TUNE.swing - TUNE.ledgeW / 2, y + 14, TUNE.swing * 2 + TUNE.ledgeW, 6, 3);
          c.fill();
          const isNext = i === s.level && !s.fall && !g.done;
          const ok = isNext && Math.abs(L.x - HX) <= TUNE.tol;
          // Target notch on the rail, right above the hero.
          if (isNext) {
            c.fillStyle = ok ? PAL.leaf : 'rgba(255,255,255,0.75)';
            c.beginPath();
            c.moveTo(HX - 9, y + 30);
            c.lineTo(HX + 9, y + 30);
            c.lineTo(HX, y + 20);
            c.fill();
          }
          c.save();
          if (ok) {
            c.shadowColor = PAL.leaf;
            c.shadowBlur = 22;
          }
          rrect(c, L.x - TUNE.ledgeW / 2, y, TUNE.ledgeW, 16, 6);
          c.fillStyle = ok ? vgrad(c, y, y + 16, ['#7dffb8', PAL.palm]) : L.locked ? vgrad(c, y, y + 16, ['#ffd38a', '#d9902e']) : vgrad(c, y, y + 16, ['#ffc46b', '#e0862f']);
          c.fill();
          c.restore();
          c.fillStyle = 'rgba(40,30,20,0.25)';
          for (let k = -2; k <= 2; k++) {
            c.beginPath();
            c.moveTo(L.x + k * 22 - 6, y + 16);
            c.lineTo(L.x + k * 22 + 4, y);
            c.lineTo(L.x + k * 22 + 10, y);
            c.lineTo(L.x + k * 22, y + 16);
            c.fill();
          }
          for (const dx of [-36, 36]) circle(c, L.x + dx, y + 19, 5, '#3a4252');
        });
        // Guide: a soft light column from the hero to the next rail.
        if (!s.jumping && !s.fall && next() && !g.done) {
          const y0 = worldY(s.level) - 120;
          const y1 = worldY(s.level + 1) + 30;
          const glow = c.createLinearGradient(0, y0, 0, y1);
          glow.addColorStop(0, 'rgba(255,255,255,0)');
          glow.addColorStop(1, aligned() ? 'rgba(125,255,184,0.45)' : 'rgba(255,255,255,0.3)');
          c.fillStyle = glow;
          c.fillRect(HX - 10, y1, 20, y0 - y1);
        }
        // The hero.
        const hy = heroWorld();
        const pose = s.fall ? 'sad' : s.toRoof > 0.45 ? 'dance' : s.jumping || s.toRoof >= 0 ? 'cheer' : 'idle';
        const squash = s.land > 0 ? 1 - s.land * 1.2 : s.jumping ? 1.06 : 1;
        c.save();
        c.translate(HX, hy);
        if (s.fall) c.rotate(Math.sin(s.fall.rot) * 0.6);
        person(c, g.hero, 0, 0, 118, pose, s.t, { hat: g.hat, squash });
        c.restore();
        c.restore();
        if (!g.done && s.level === 0 && s.t < 0.9) text(c, '⬆', HX, H * 0.8 - 160, { size: 30, color: 'rgba(255,255,255,0.8)', shadow: false });
      },
      bot() {
        if (s.jumping || s.fall || s.toRoof >= 0 || !next()) return null;
        return Math.abs(next().x - HX) <= TUNE.tol * 0.55 ? { press: [HX, H / 2] } : null;
      },
    };
  },
};
