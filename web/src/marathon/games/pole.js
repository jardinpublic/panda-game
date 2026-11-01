// Pole fitness (world 5): Violaine coaches in her neon pole-fitness studio
// while the hero clumsily clings to the pole. He keeps tilting left or right
// (a random drift that flips with a creak and a wobble); TAP the left or right
// half of the screen to push that way and stay upright. Tilt past the limit
// and he slides down the pole in a heap. Survive and he strikes a silly pose.

import { person, rrect, circle, ellipse, PAL, text, shadowed, vgrad, neon, hibiscus } from '../art.js';

const NAMES = { panda: 'Panda', cous: 'Cous', mamar: 'Mamar', babar: 'Babar', victor: 'Victor', romain: 'Romain', eugenie: 'Eugénie', violaine: 'Violaine', aline: 'Aline', greg: 'Greg' };
const LIMIT = 0.82; // radians: past this he lets go

const BOASTS = [
  { en: "Hoho, I'm a natural!", fr: 'Hoho, je suis un naturel !' },
  { en: 'Hoho, watch these muscles!', fr: 'Hoho, regarde ces muscles !' },
  { en: 'Hoho, easy peasy!', fr: 'Hoho, fastoche !' },
];

/** A monstera-ish potted plant, pot base at (x, y). */
function plant(c, x, y, s, t) {
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.42 + Math.sin(t * 1.4 + i) * 0.04;
    const len = s * (0.75 + (i % 2) * 0.25);
    c.save();
    c.translate(x, y - s * 0.45);
    c.rotate(a);
    c.strokeStyle = '#1d7a52';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(len * 0.7, 0);
    c.stroke();
    ellipse(c, len * 0.75, 0, len * 0.32, len * 0.2, i % 2 ? PAL.palm : PAL.leaf);
    ellipse(c, len * 0.75, 0, len * 0.26, 1.2, 'rgba(255,255,255,0.35)');
    c.restore();
  }
  shadowed(c, () => {
    c.fillStyle = vgrad(c, y - s * 0.5, y, ['#f2e3cf', '#d8c1a3']);
    c.beginPath();
    c.moveTo(x - s * 0.32, y - s * 0.5);
    c.lineTo(x + s * 0.32, y - s * 0.5);
    c.lineTo(x + s * 0.24, y);
    c.lineTo(x - s * 0.24, y);
    c.closePath();
    c.fill();
  }, 10, 4, 'rgba(20,10,40,0.3)');
}

/** The studio: violet wall, mirrors, neon sign, sunset window, wooden floor. */
function studio(c, W, H, floorY, t, glow) {
  c.fillStyle = vgrad(c, 0, floorY, ['#2a1650', '#43216e', '#5b2a86']);
  c.fillRect(0, 0, W, floorY);
  // Sunset window with a palm silhouette (it's Martinique).
  c.save();
  rrect(c, 24, 96, 92, 150, 46);
  c.clip();
  c.fillStyle = vgrad(c, 96, 246, ['#ff7b54', '#ffc46b', '#ffe3a8']);
  c.fillRect(24, 96, 92, 150);
  circle(c, 70, 200, 22, '#fff2b0');
  c.fillStyle = 'rgba(10,143,176,0.85)';
  c.fillRect(24, 212, 92, 40);
  c.strokeStyle = 'rgba(40,20,60,0.75)';
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(98, 250);
  c.quadraticCurveTo(92, 180, 84, 150);
  c.stroke();
  for (let i = 0; i < 5; i++) ellipse(c, 84 + Math.cos(i * 1.3) * 16, 150 + Math.sin(i * 1.3) * 6, 18, 4, 'rgba(40,20,60,0.75)', i * 1.3 + Math.sin(t) * 0.05);
  c.restore();
  // Mirrors along the back wall, with soft diagonal reflections.
  for (let i = 0; i < 3; i++) {
    const mx = 140 + i * 88;
    c.save();
    rrect(c, mx, 110, 78, floorY - 130, 10);
    c.clip();
    c.fillStyle = vgrad(c, 110, floorY, ['rgba(190,170,255,0.32)', 'rgba(120,90,200,0.22)']);
    c.fillRect(mx, 110, 78, floorY - 130);
    c.fillStyle = 'rgba(255,255,255,0.14)';
    c.beginPath();
    const off = ((t * 30 + i * 40) % 220) - 60;
    c.moveTo(mx + off, 110);
    c.lineTo(mx + off + 22, 110);
    c.lineTo(mx + off - 60, floorY);
    c.lineTo(mx + off - 82, floorY);
    c.closePath();
    c.fill();
    c.restore();
  }
  neon(c, 'POLE FIT', W / 2 + 40, 78, 30, PAL.hibiscus, t);
  hibiscus(c, 92, 70, 14, t * 0.3, PAL.lagoon);
  // Neon strip along the floor line, pulsing harder when in danger.
  c.save();
  c.shadowColor = glow > 0.5 ? PAL.coral : PAL.lagoon;
  c.shadowBlur = 18;
  c.fillStyle = glow > 0.5 ? PAL.coral : PAL.lagoon;
  c.fillRect(0, floorY - 4, W, 4);
  c.restore();
  // Warm wooden floor with planks.
  c.fillStyle = vgrad(c, floorY, H, ['#c98a55', '#9c6038']);
  c.fillRect(0, floorY, W, H - floorY);
  c.strokeStyle = 'rgba(80,40,20,0.22)';
  c.lineWidth = 2;
  for (let i = 1; i < 8; i++) {
    const y = floorY + i * i * 3.2;
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(W, y);
    c.stroke();
  }
  // Yoga mat under the pole.
  ellipse(c, W / 2, floorY + 30, 120, 20, 'rgba(255,111,97,0.75)');
  ellipse(c, W / 2, floorY + 27, 110, 15, 'rgba(255,160,140,0.5)');
}

/** The chrome pole from the ceiling to the floor. */
function pole(c, x, y0, y1) {
  const g = c.createLinearGradient(x - 8, 0, x + 8, 0);
  g.addColorStop(0, '#9aa3b8');
  g.addColorStop(0.35, '#ffffff');
  g.addColorStop(0.7, '#c4cada');
  g.addColorStop(1, '#6e7690');
  c.fillStyle = g;
  c.fillRect(x - 7, y0, 14, y1 - y0);
  ellipse(c, x, y0, 20, 6, '#c4cada');
  ellipse(c, x, y1, 26, 8, '#8f97ad');
}

/** Curved arrow above the hero showing where he is drifting. */
function tiltArrow(c, x, y, dir, power, warn, t) {
  c.save();
  c.translate(x, y);
  c.scale(dir, 1);
  const col = warn ? (Math.sin(t * 40) > 0 ? '#ffffff' : PAL.coral) : power > 0.55 ? PAL.coral : PAL.mango;
  c.globalAlpha = 0.6 + power * 0.4;
  c.strokeStyle = col;
  c.lineWidth = 7;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(0, 40, 50, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.6);
  c.stroke();
  const ex = Math.cos(-Math.PI / 2 + 0.6) * 50;
  const ey = 40 + Math.sin(-Math.PI / 2 + 0.6) * 50;
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(ex + 12, ey + 2);
  c.lineTo(ex - 8, ey - 12);
  c.lineTo(ex - 6, ey + 14);
  c.closePath();
  c.fill();
  c.restore();
}

export default {
  id: 'pole',
  world: 'w05',
  input: 'tap',
  base: 5,
  min: 2,
  survive: true,
  verb: { en: 'STAY UP!', fr: 'TIENS BON !' },
  title: { en: 'Pole fitness', fr: 'Pole fitness' },
  howto: { en: 'Violaine is coaching you on the pole. Tap the left or right side to lean back and stay upright.', fr: 'Violaine te coache à la barre. Touche à gauche ou à droite pour te redresser et tenir debout.' },
  winLine: { en: 'Gainage level: legend!', fr: 'Gainage niveau légende !' },
  rival: ["violaine", "aline"],
  rivalLine: { en: "Fine… that was almost decent.", fr: "Bon… c'était presque correct." },
  loseLine: { en: "Hoho, the pole was slippery!", fr: "Hoho, la barre glissait !" },
  create(g) {
    const coach = g.cast('violaine', 'aline');
    const heroName = NAMES[g.hero] || 'Panda';
    const floorY = g.H * 0.8;
    const poleX = 200;
    const pivotY = floorY - 64; // where his legs grip the pole
    const heroSize = 165;
    const grav = 1.5 * g.speed; // unstable: the further he leans, the faster he goes
    const push = 0.6 * g.speed; // the random drift
    const impulse = 0.75 + 0.2 * g.speed; // one tap
    const tell = 0.32 / g.speed;
    const firstDir = g.random() < 0.5 ? -1 : 1;
    const s = {
      t: 0, a: firstDir * 0.04, v: firstDir * 0.08, dir: firstDir, lastTap: -1,
      nextFlip: (0.9 + g.random() * 0.5) / g.speed, warned: false, wobble: 0,
      tap: 0, tapSide: 0, slide: 0, pose: 0, creak: 0, coachLine: 0.9, boasted: 0,
    };

    function coachSay() {
      const lines = [
        { en: `Core, ${heroName}! Core!`, fr: `Gainage, ${heroName} !` },
        { en: 'Engage those abs!', fr: 'Serre les abdos !' },
        { en: 'Breathe! And hold!', fr: 'Respire ! Et tiens !' },
      ];
      g.say(335, floorY - 150, g.tr(lines[Math.floor(g.random() * lines.length)]), 0.9);
      s.coachLine = 1.1 / Math.sqrt(g.speed);
    }

    return {
      update(dt) {
        s.t += dt;
        s.tap = Math.max(0, s.tap - dt);
        s.creak = Math.max(0, s.creak - dt);
        s.wobble = Math.max(0, s.wobble - dt * 3);
        if (g.done) {
          if (g.won) {
            if (!s.celebrated) {
              s.celebrated = true;
              g.sfx.hoho();
              g.fx.burst(poleX, pivotY - 120, { kind: 'confetti', n: 24 });
              g.say(poleX - 60, pivotY - 150, g.tr({ en: 'Hoho! The human flag!', fr: 'Hoho ! Le drapeau humain !' }), 1.4);
            }
            // Ridiculous victory pose: the "human flag", arms out.
            s.pose = Math.min(1, s.pose + dt * 4);
            s.a += (-1.3 - s.a) * Math.min(1, dt * 10);
          } else {
            // Slides down the pole into a heap on the mat.
            s.slide = Math.min(1, s.slide + dt * 2.6);
            s.v += Math.sign(s.a || 1) * 6 * dt;
            s.a = Math.max(-1.55, Math.min(1.55, s.a + s.v * dt));
          }
          return;
        }
        // Drift: flips side now and then, with a creak + wobble tell first.
        if (!s.warned && s.t >= s.nextFlip - tell) {
          s.warned = true;
          s.wobble = 1;
          s.creak = tell;
          g.sfx.tick();
        }
        if (s.t >= s.nextFlip) {
          s.dir = g.random() < 0.65 ? -s.dir : s.dir;
          s.nextFlip = s.t + (0.75 + g.random() * 0.55) / g.speed;
          s.warned = false;
        }
        const acc = grav * Math.sin(s.a) + push * s.dir;
        s.v += acc * dt;
        s.v *= Math.exp(-1.4 * dt);
        s.a += s.v * dt;
        // Violaine keeps shouting; the hero keeps boasting.
        s.coachLine -= dt;
        if (s.coachLine <= 0 && Math.abs(s.a) > 0.3) coachSay();
        if (Math.abs(s.a) > LIMIT) {
          g.sfx.bad();
          g.sfx.whoosh();
          g.fx.shake(14);
          g.fx.burst(poleX + Math.sign(s.a) * 60, floorY - 20, { kind: 'smoke', n: 10, speed: 120 });
          g.fx.text(poleX, floorY - 220, g.tr({ en: 'Wheee…', fr: 'Wiiii…' }), { size: 30, color: PAL.cream });
          g.say(335, floorY - 150, g.tr({ en: `Core, ${heroName}!!`, fr: `Gainage, ${heroName} !!` }), 1.4);
          g.lose();
        }
      },
      press(x) {
        const side = x < g.W / 2 ? -1 : 1;
        s.v += side * impulse;
        s.tap = 0.18;
        s.lastTap = s.t;
        s.tapSide = side;
        g.sfx.tap();
        const hx = poleX + Math.sin(s.a) * heroSize * 0.7;
        const hy = pivotY - Math.cos(s.a) * heroSize * 0.7;
        g.fx.burst(hx, hy, { kind: 'spark', n: 6, colors: [PAL.lagoon, '#ffffff', PAL.mango], speed: 140 });
        if (s.boasted < 2 && s.t > 0.4 + s.boasted * 1.2) {
          g.say(hx, hy - 50, g.tr(BOASTS[s.boasted % BOASTS.length]), 0.9);
          s.boasted++;
        }
      },
      draw(c) {
        const danger = Math.min(1, Math.abs(s.a) / LIMIT);
        studio(c, g.W, g.H, floorY, s.t, danger);
        plant(c, 34, floorY + 10, 70, s.t);
        plant(c, 372, floorY + 14, 60, s.t + 1);
        // The coach, pointing at the hero.
        const coachPose = g.done ? (g.won ? 'cheer' : 'point') : danger > 0.45 ? 'point' : 'idle';
        person(c, coach, 336, floorY + 20, 140, coachPose, s.t + 0.5, { flip: true });
        pole(c, poleX, 40, floorY + 22);
        // Danger glow on the side he is falling to.
        if (!g.done && danger > 0.4) {
          const side = Math.sign(s.a);
          const gr = c.createLinearGradient(side > 0 ? g.W : 0, 0, side > 0 ? g.W - 120 : 120, 0);
          gr.addColorStop(0, `rgba(255,111,97,${(danger - 0.4) * 0.9})`);
          gr.addColorStop(1, 'rgba(255,111,97,0)');
          c.fillStyle = gr;
          c.fillRect(side > 0 ? g.W - 120 : 0, 0, 120, g.H);
        }
        // The hero, pivoting on his leg grip.
        const jitter = s.wobble * Math.sin(s.t * 60) * 0.05;
        const feetY = pivotY + s.slide * (floorY - pivotY + 6);
        ellipse(c, poleX + Math.sin(s.a) * heroSize * 0.5, floorY + 20, 50, 9, 'rgba(20,10,40,0.25)');
        c.save();
        c.translate(poleX, feetY);
        c.rotate(s.a + jitter);
        let pose = 'cheer';
        if (g.done) pose = g.won ? 'dance' : 'sad';
        const squash = g.done && !g.won ? 1 - s.slide * 0.25 : s.tap > 0 ? 0.95 : 1;
        person(c, g.hero, s.tapSide * s.tap * 20, 0, heroSize, pose, s.t, { hat: g.hat, squash });
        c.restore();
        // Hands on the pole while he is still holding.
        if (!(g.done && !g.won)) {
          const gripY = feetY - heroSize * 0.95 * Math.cos(Math.min(0.6, Math.abs(s.a)));
          circle(c, poleX - 5, gripY, 7, '#f0c3a3');
          circle(c, poleX + 5, gripY + 10, 7, '#e8b898');
        }
        if (!g.done) {
          // Tell: tilt arrow above his head + creak lines near the grip.
          const headX = poleX + Math.sin(s.a) * heroSize;
          const headY = feetY - Math.cos(s.a) * heroSize;
          tiltArrow(c, headX, headY - 70, s.dir, danger, s.creak > 0, s.t);
          if (s.creak > 0) text(c, g.tr({ en: 'creak', fr: 'crii' }), poleX - 50 * s.dir, pivotY - 30, { size: 18, color: PAL.cream });
          // Where to tap: the side opposite his lean lights up.
          const want = s.a > 0.05 ? -1 : s.a < -0.05 ? 1 : 0;
          for (const side of [-1, 1]) {
            const on = want === side;
            const bx = side < 0 ? 66 : g.W - 66;
            const by = g.H - 96;
            c.save();
            c.globalAlpha = on ? 0.95 : 0.35;
            rrect(c, bx - 40, by - 26, 80, 52, 26);
            c.fillStyle = on ? PAL.lagoon : 'rgba(255,255,255,0.25)';
            c.fill();
            c.restore();
            text(c, side < 0 ? '◀' : '▶', bx, by + 1, { size: 26, color: '#fff', shadow: false });
          }
        } else if (g.won) {
          text(c, '★', poleX - 120, pivotY - 140 + Math.sin(s.t * 6) * 6, { size: 30, color: PAL.mango });
          text(c, '★', poleX + 120, pivotY - 170 + Math.cos(s.t * 6) * 6, { size: 24, color: PAL.lagoon });
        } else if (s.slide >= 1) {
          for (let i = 0; i < 3; i++) {
            const a = s.t * 5 + (i * Math.PI * 2) / 3;
            text(c, '★', poleX + Math.sign(s.a) * 90 + Math.cos(a) * 30, floorY - 40 + Math.sin(a) * 8, { size: 18, color: '#fff3a0' });
          }
        }
      },
      bot() {
        // Human tempo: at most ~3 taps a second.
        if (s.t - s.lastTap < 0.3) return null;
        const ahead = s.a + s.v * 0.35;
        if (ahead > 0.1 && s.v > -0.4) return { press: [80, g.H / 2] };
        if (ahead < -0.1 && s.v < 0.4) return { press: [g.W - 80, g.H / 2] };
        return null;
      },
    };
  },
};

