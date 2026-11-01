// Lighter (world 10): the hero grills merguez, back turned. Babar tiptoes up
// behind in steps and pauses, lighter in hand, flicking it now and then.
// ONE tap to turn around: catch him inside the red zone (close, lighter up)
// and he is caught red-handed. Too early he whistles innocently; too late,
// lighter on the shoulder: AÏE!
//
// Also exports handOf() and drawLighter(), reused by boss-babar.js.

import { scene, person, circle, ellipse, rrect, PAL, text, shadowed, OUTFITS } from '../art.js';

const ease = (k) => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);

/** Right-arm angle of art.js person() for a pose (mirrors armAngles there). */
function armAngle(pose, t) {
  switch (pose) {
    case 'cheer': return 2.6 + Math.cos(t * 12) * 0.25;
    case 'run': return -Math.sin(t * 14) * 0.9 + 0.3;
    case 'sad': return 0.08;
    case 'point': return 1.75;
    case 'dance': return 1.8 - Math.sin(t * 8) * 0.8;
    case 'sit': return 0.6;
    default: return 0.25 - Math.sin(t * 2) * 0.04;
  }
}

/** Where person(c, id, x, y, s, pose, t, {flip, squash}) puts its right hand. */
export function handOf(id, x, y, s, pose, t, flip = false, squash = 1) {
  const o = OUTFITS[id] || OUTFITS.panda;
  const k = s * (o.small || 1) * (o.tall || 1);
  const torsoW = k * 0.25 * (o.wide || 1);
  const bob = pose === 'run' ? Math.abs(Math.sin(t * 14)) * k * 0.04 : pose === 'dance' ? Math.abs(Math.sin(t * 8)) * k * 0.05 : Math.sin(t * 3) * k * 0.008;
  const hip = -k * 0.2 - bob + (pose === 'sit' ? k * 0.12 : 0);
  const top = hip - k * 0.27;
  const a = armAngle(pose, t);
  const ex = torsoW * 0.47 + Math.sin(a) * k * 0.2;
  const ey = top + k * 0.04 + Math.cos(a) * k * 0.2;
  return [x + (flip ? -ex : ex), y + ey * squash];
}

/** A pocket lighter held at (x, y); flame 0 = off, 1 = lit, 1.6 = big. */
export function drawLighter(c, x, y, flame, t, scale = 1) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  if (flame > 0) {
    const f = flame * (0.9 + 0.12 * Math.sin(t * 40) + 0.06 * Math.sin(t * 67));
    const glow = c.createRadialGradient(0, -16, 1, 0, -16, 34 * f);
    glow.addColorStop(0, 'rgba(255,200,90,0.55)');
    glow.addColorStop(1, 'rgba(255,120,40,0)');
    c.fillStyle = glow;
    c.fillRect(-40 * f, -56 * f, 80 * f, 80 * f);
    const g = c.createRadialGradient(0, -12, 1, 0, -14 * f, 14 * f);
    g.addColorStop(0, '#fffbe0');
    g.addColorStop(0.45, '#ffd34d');
    g.addColorStop(1, 'rgba(255,110,40,0.85)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(0, -10);
    c.quadraticCurveTo(-8 * f, -14 * f, 0, -30 * f - Math.sin(t * 30) * 3);
    c.quadraticCurveTo(8 * f, -14 * f, 0, -10);
    c.fill();
  }
  shadowed(c, () => {
    rrect(c, -6, -6, 12, 22, 4);
    c.fillStyle = PAL.coral;
    c.fill();
  }, 6, 2);
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.fillRect(-4, -3, 3, 16);
  rrect(c, -6, -11, 12, 6, 2);
  c.fillStyle = '#c9ccd6';
  c.fill();
  circle(c, 3, -11, 3, '#8b8d99');
  c.restore();
}

export default {
  id: 'lighter',
  world: 'w10',
  input: 'tap',
  base: 4.5,
  survive: false,
  verb: { en: 'CATCH HIM!', fr: 'PRENDS-LE !' },
  title: { en: "Babar's lighter", fr: "Le briquet de Babar" },
  howto: { en: "Babar sneaks up with his lighter. Tap to turn around once he's in the red zone.", fr: "Babar approche avec son briquet. Touche pour te retourner quand il est dans la zone rouge." },
  winLine: { en: "Caught red-handed!", fr: "Pris la main dans le sac !" },
  rival: ["babar", "mamar"],
  rivalLine: { en: "What do I have to do with it?!", fr: "Qué don' qu' j'ai à voir ?!" },
  loseLine: { en: "Hoho, my shoulder!", fr: "Hoho, mon épaule !" },
  create(g) {
    const sp = g.speed;
    const villain = g.cast('babar', 'mamar');
    const friend = g.friend([villain]);
    const feetY = g.H * 0.8;
    const heroX = 272;
    const zone = [heroX - 128, heroX - 56];
    const x0 = -50;
    const aimX = heroX - 92;
    const touchX = heroX - 60;
    const aimT = 0.5 / Math.pow(sp, 0.6);
    const lungeT = 0.1 / sp;
    // Timeline: steps and pauses; the last pause is just outside the zone.
    const nSteps = 4;
    const segs = [];
    let tt = 0.25 / sp;
    let x = x0;
    segs.push({ kind: 'pause', t0: 0, t1: tt, x0: x, x1: x });
    for (let i = 0; i < nSteps; i++) {
      const nx = x0 + ((aimX - x0) * (i + 1)) / nSteps;
      segs.push({ kind: 'step', t0: tt, t1: tt + 0.24 / sp, x0: x, x1: nx });
      tt += 0.24 / sp;
      x = nx;
      if (i < nSteps - 1) {
        const p = (0.12 + g.random() * 0.32) / sp;
        segs.push({ kind: 'pause', t0: tt, t1: tt + p, x0: x, x1: x, flick: g.random() < 0.65 });
        tt += p;
      }
    }
    const aimAt = tt;
    const lungeAt = aimAt + aimT;
    const touchAt = lungeAt + lungeT;
    const s = { t: 0, phase: 'sneak', bx: x0, turn: 0, turnT: -1, jump: 0, endT: 0, dropY: 0, notes: 0, flicked: null };

    function babarX(t) {
      if (t >= touchAt) return touchX;
      if (t >= lungeAt) return aimX + (touchX - aimX) * ease((t - lungeAt) / lungeT);
      if (t >= aimAt) return aimX;
      const sg = segs.find((q) => t >= q.t0 && t < q.t1) || segs[segs.length - 1];
      return sg.x0 + (sg.x1 - sg.x0) * ease((t - sg.t0) / (sg.t1 - sg.t0));
    }

    function turnAround() {
      s.turnT = s.t;
    }

    return {
      update(dt) {
        s.t += dt;
        if (s.turnT >= 0) s.turn = Math.min(1, (s.t - s.turnT) / 0.14);
        if (s.phase === 'burnt') s.jump = Math.min(1, s.jump + dt * 2.6);
        if (s.phase === 'caught') s.dropY = Math.min(1, s.dropY + dt * 3);
        if (g.done) {
          s.endT += dt;
          return;
        }
        s.bx = babarX(s.t);
        const sg = segs.find((q) => s.t >= q.t0 && s.t < q.t1);
        if (sg && sg.flick && s.flicked !== sg) {
          s.flicked = sg;
          g.sfx.tick();
        }
        if (s.phase === 'sneak' && s.t >= aimAt) {
          s.phase = 'aim';
          g.sfx.tick(true);
          g.sfx.sizzle();
        }
        if (s.t >= touchAt) {
          s.phase = 'burnt';
          turnAround();
          g.sfx.hit();
          g.sfx.sizzle();
          g.fx.shake(16);
          g.fx.flash('rgba(255,150,60,0.35)', 0.18);
          g.fx.burst(heroX - 22, feetY - 78, { kind: 'spark', n: 30, colors: [PAL.mango, '#fff3c4', PAL.coral], speed: 320 });
          g.fx.burst(heroX - 22, feetY - 78, { kind: 'smoke', n: 8, speed: 60 });
          g.fx.text(heroX - 30, feetY - 210, g.tr({ en: 'OUCH!', fr: 'AÏE !' }), { size: 50, color: PAL.coral });
          g.say(s.bx, feetY - 175, g.tr({ en: 'Hehehe!', fr: 'Héhéhé !' }));
          g.lose();
        }
      },
      press() {
        if (s.phase !== 'sneak' && s.phase !== 'aim') return;
        turnAround();
        if (s.bx >= zone[0]) {
          s.phase = 'caught';
          g.sfx.good();
          g.sfx.hoho();
          g.fx.burst(s.bx + 20, feetY - 120, { kind: 'confetti', n: 36 });
          g.fx.text(200, feetY - 260, g.tr({ en: 'CAUGHT RED-HANDED!', fr: 'PRIS SUR LE FAIT !' }), { size: 30, color: PAL.mango });
          g.say(s.bx - 10, feetY - 170, g.tr({ en: 'Uh… lighting the barbecue?', fr: 'Euh… j\'allumais le barbecue ?' }), 1.6);
          g.win();
        } else {
          s.phase = 'whistle';
          g.sfx.bad();
          g.fx.text(200, feetY - 260, g.tr({ en: 'Too early!', fr: 'Trop tôt !' }), { size: 34, color: PAL.cream });
          g.say(Math.max(40, s.bx), feetY - 170, g.tr({ en: '♪ Whistle whistle… ♪', fr: '♪ Fiou fiou… ♪' }), 1.6);
          g.lose();
        }
      },
      draw(c) {
        const t = s.t;
        scene.yard(c, g.W, g.H, t);
        // Friend at the back table, in on the joke.
        person(c, friend, 58, g.H * 0.64, 110, g.done ? (g.won ? 'cheer' : 'dance') : 'sit', t + 1.3, {});
        // Grill on the right with smoke.
        shadowed(c, () => {
          rrect(c, 322, feetY - 120, 110, 52, 16);
          c.fillStyle = '#2b2b33';
          c.fill();
        }, 16, 6);
        c.fillStyle = '#2b2b33';
        c.fillRect(345, feetY - 70, 8, 70);
        c.fillRect(405, feetY - 70, 8, 70);
        for (let i = 0; i < 4; i++) {
          const gx = 340 + i * 22;
          const f = 0.6 + 0.4 * Math.sin(t * 7 + i * 1.9);
          const glow = c.createRadialGradient(gx, feetY - 104, 1, gx, feetY - 104, 18);
          glow.addColorStop(0, `rgba(255,${130 + 60 * f},50,${0.8 * f})`);
          glow.addColorStop(1, 'rgba(255,80,20,0)');
          c.fillStyle = glow;
          c.fillRect(gx - 18, feetY - 122, 36, 36);
        }
        c.fillStyle = '#b5532c';
        for (let i = 0; i < 3; i++) {
          rrect(c, 338 + i * 24, feetY - 128, 18, 8, 4);
          c.fill();
        }
        for (let i = 0; i < 3; i++) circle(c, 350 + i * 20, feetY - 140 - ((t * 38 + i * 15) % 50), 7 + i * 2, 'rgba(240,240,250,0.45)');

        // The red "caught you" zone on the grass behind the hero.
        const inZone = s.bx >= zone[0] && !g.done;
        const pulse = 0.5 + 0.5 * Math.sin(t * (inZone ? 18 : 5));
        const zx = (zone[0] + zone[1]) / 2;
        const zg = c.createRadialGradient(zx, feetY + 4, 4, zx, feetY + 4, 60);
        zg.addColorStop(0, `rgba(255,70,70,${inZone ? 0.55 + 0.25 * pulse : 0.22 + 0.08 * pulse})`);
        zg.addColorStop(1, 'rgba(255,70,70,0)');
        ellipse(c, zx, feetY + 4, (zone[1] - zone[0]) / 2 + 14, 18, zg);
        c.save();
        c.setLineDash([7, 7]);
        c.lineDashOffset = -t * 20;
        c.strokeStyle = `rgba(255,90,90,${inZone ? 0.95 : 0.55})`;
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(zx, feetY + 4, (zone[1] - zone[0]) / 2 + 8, 14, 0, 0, Math.PI * 2);
        c.stroke();
        c.setLineDash([]);
        c.restore();

        // Babar.
        const sg = segs.find((q) => t >= q.t0 && t < q.t1);
        let pose = 'idle';
        let poseT = t;
        let flame = 0;
        let lift = 0;
        let squash = 0.93;
        if (s.phase === 'caught') {
          pose = 'sad';
          squash = 1;
        } else if (s.phase === 'whistle') {
          pose = 'idle';
          squash = 1;
        } else if (s.phase === 'burnt') {
          pose = 'cheer';
          squash = 1;
        } else if (s.phase === 'aim' || t >= aimAt) {
          pose = 'point';
          flame = t >= lungeAt ? 1.6 : 1.3;
          squash = 0.9 + Math.sin(t * 30) * 0.01;
        } else if (sg && sg.kind === 'step') {
          pose = 'run';
          const k = (t - sg.t0) / (sg.t1 - sg.t0);
          poseT = k * 0.45;
          lift = Math.sin(k * Math.PI) * 10;
        } else if (sg && sg.flick) {
          const k = (t - sg.t0) / (sg.t1 - sg.t0);
          flame = k > 0.3 && k < 0.75 ? 0.7 : 0;
        }
        const by = feetY - lift;
        person(c, villain, s.bx, by, 165, pose, poseT, { squash });
        if (s.phase === 'caught') {
          // Blushing, the lighter falls to the grass.
          const hy = by - 165 * 0.62;
          circle(c, s.bx - 20, hy + 14, 10, 'rgba(255,110,130,0.55)');
          circle(c, s.bx + 22, hy + 14, 10, 'rgba(255,110,130,0.55)');
          const [hx0, hy0] = handOf(villain, s.bx, by, 165, 'point', t, false, 1);
          drawLighter(c, hx0 + 6 * s.dropY, hy0 + (feetY - hy0 - 6) * ease(s.dropY), 0, t);
          for (let i = 0; i < 2; i++) ellipse(c, s.bx + 40 + i * 10, hy - 30 + ((t * 40 + i * 12) % 26), 3, 5, '#9fd8ff');
        } else if (s.phase === 'whistle') {
          for (let i = 0; i < 3; i++) {
            const k = (t * 0.9 + i / 3) % 1;
            c.globalAlpha = 1 - k;
            text(c, i % 2 ? '♫' : '♪', s.bx + 30 + k * 40 + Math.sin(k * 9) * 6, by - 150 - k * 60, { size: 24, color: PAL.violet });
            c.globalAlpha = 1;
          }
        } else {
          const [hx0, hy0] = handOf(villain, s.bx, by, 165, pose, poseT, false, squash);
          drawLighter(c, hx0 + 2, hy0, flame, t);
          if (pose === 'point' && s.phase !== 'burnt') text(c, 'Tchik!', hx0 + 4, hy0 - 52, { size: 16, color: PAL.cream, stroke: 'rgba(30,20,50,0.5)' });
        }

        // Hero, back turned (facing the grill), spins round on tap.
        const k = s.turn;
        const jump = s.phase === 'burnt' ? Math.sin(s.jump * Math.PI) * 46 : 0;
        const heroPose = g.done ? (g.won ? 'point' : s.phase === 'burnt' ? 'sad' : 'idle') : 'idle';
        c.save();
        c.translate(heroX, 0);
        c.scale(Math.cos(k * Math.PI) || 0.001, 1);
        person(c, g.hero, 0, feetY - jump, 175, heroPose, t, { hat: g.hat });
        c.restore();
        if (!g.done) {
          // Humming away, no idea.
          for (let i = 0; i < 2; i++) {
            const q = (t * 0.7 + i / 2) % 1;
            c.globalAlpha = 1 - q;
            text(c, i ? '♫' : '♪', heroX + 40 + q * 30, feetY - 200 - q * 50, { size: 22, color: PAL.cream });
            c.globalAlpha = 1;
          }
        }
        if (s.phase === 'burnt') {
          circle(c, heroX - 24, feetY - 80 - jump, 9 + 4 * Math.sin(t * 20), 'rgba(255,140,60,0.7)');
          for (let i = 0; i < 3; i++) circle(c, heroX - 24 + i * 6, feetY - 100 - jump - ((t * 50 + i * 14) % 40), 5 + i, 'rgba(120,110,120,0.4)');
        }
      },
      bot() {
        return s.phase === 'aim' && s.t >= aimAt + 0.04 ? { press: [200, 400] } : null;
      },
    };
  },
};
