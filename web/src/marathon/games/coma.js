// The morning of the BAC, in the tunnel under Montceau-les-Mines station: the
// hero is sleeping off a big night at the bottom of the stairs. Jojo Gueugneau
// drags them up to the platforms by the feet, and their head bonks on every
// step. Tap right on each BONK: three good ones and the hero wakes up in time.

import { person, ellipse, circle, rrect, vgrad, text, PAL } from '../art.js';

const STEPS = 7; // pulls from the bottom to the top of the stairs
const WAKE = 3; // good taps to wake up
const HERO = 185; // hero size
const JOJO = 215; // Jojo's size

/** Jojo Gueugneau: tracksuit, and the face of a very dim, very happy dog. */
function jojo(c, x, y, s, t, lean = 0, surprised = false) {
  const k = s;
  c.save();
  c.translate(x, y);
  ellipse(c, 0, 0, k * 0.16, k * 0.03, 'rgba(0,0,0,0.22)');
  c.rotate(lean);
  c.lineCap = 'round';
  // Legs (tracksuit trousers with a white stripe)
  for (const side of [-1, 1]) {
    c.strokeStyle = '#2b3a8f';
    c.lineWidth = k * 0.09;
    c.beginPath();
    c.moveTo(side * k * 0.05, -k * 0.2);
    c.lineTo(side * k * 0.08, 0);
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.8)';
    c.lineWidth = k * 0.015;
    c.beginPath();
    c.moveTo(side * k * 0.075, -k * 0.19);
    c.lineTo(side * k * 0.105, -k * 0.01);
    c.stroke();
    ellipse(c, side * k * 0.09, 0, k * 0.06, k * 0.03, '#f4f1ea');
  }
  // Tracksuit top
  rrect(c, -k * 0.13, -k * 0.47, k * 0.26, k * 0.29, k * 0.1);
  c.fillStyle = vgrad(c, -k * 0.47, -k * 0.18, ['#3c4fc0', '#2b3a8f']);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.85)';
  c.fillRect(-k * 0.006, -k * 0.46, k * 0.012, k * 0.27);
  // Arms reaching down to the hero's ankles
  c.strokeStyle = '#3c4fc0';
  c.lineWidth = k * 0.07;
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * k * 0.11, -k * 0.42);
    c.lineTo(-k * 0.2 + side * k * 0.03, -k * 0.24);
    c.stroke();
    circle(c, -k * 0.21 + side * k * 0.03, -k * 0.23, k * 0.035, '#f1c19f');
  }
  // Head: a dim, happy dog. Long floppy ears, a patch on one eye, big muzzle, tongue out
  const hy = -k * 0.62;
  const wob = Math.sin(t * 9) * 0.1;
  circle(c, 0, hy, k * 0.15, '#f1c19f');
  ellipse(c, k * 0.06, hy - k * 0.035, k * 0.06, k * 0.055, '#a8703f');
  for (const side of [-1, 1]) {
    c.save();
    c.translate(side * k * 0.12, hy - k * 0.08);
    c.rotate(side * (0.15 + wob));
    ellipse(c, side * k * 0.02, k * 0.12, k * 0.06, k * 0.15, '#7a4a26');
    ellipse(c, side * k * 0.02, k * 0.13, k * 0.035, k * 0.11, '#94603a');
    c.restore();
  }
  // Tuft of hair
  for (let i = -1; i <= 1; i++) ellipse(c, i * k * 0.03, hy - k * 0.14, k * 0.025, k * 0.05, '#6b4423', i * 0.4);
  // Big eyes looking at each other
  const eye = surprised ? 0.05 : 0.042;
  for (const side of [-1, 1]) {
    circle(c, side * k * 0.055, hy - k * 0.035, k * eye, '#ffffff');
    circle(c, side * k * 0.055 - side * k * 0.016, hy - k * 0.03, k * 0.018, '#2a1a10');
  }
  // Muzzle, dog nose, buck teeth, tongue hanging out
  ellipse(c, 0, hy + k * 0.065, k * 0.085, k * 0.06, '#f8dcc4');
  ellipse(c, 0, hy + k * 0.03, k * 0.035, k * 0.024, '#3a2418');
  c.strokeStyle = '#3a2418';
  c.lineWidth = k * 0.008;
  c.beginPath();
  c.moveTo(0, hy + k * 0.05);
  c.lineTo(0, hy + k * 0.075);
  c.stroke();
  c.fillStyle = '#ffffff';
  c.fillRect(-k * 0.02, hy + k * 0.08, k * 0.018, k * 0.03);
  c.fillRect(k * 0.003, hy + k * 0.08, k * 0.018, k * 0.03);
  if (!surprised) ellipse(c, k * 0.035, hy + k * 0.13 + Math.sin(t * 7) * k * 0.008, k * 0.026, k * 0.045, '#e86a7a', 0.2);
  else circle(c, 0, hy + k * 0.115, k * 0.025, '#6b2a2a');
  c.restore();
}

/** The man who lives in the tunnel: beanie, beard, blanket, on his cardboard. */
function tunnelMan(c, x, y, s, t) {
  const k = s;
  rrect(c, x - k * 0.3, y - k * 0.03, k * 0.6, k * 0.05, 4);
  c.fillStyle = '#b08850';
  c.fill();
  // Blanket over the knees
  rrect(c, x - k * 0.2, y - k * 0.22, k * 0.4, k * 0.2, k * 0.08);
  c.fillStyle = vgrad(c, y - k * 0.22, y, ['#7a5c8e', '#5d4470']);
  c.fill();
  // Coat
  rrect(c, x - k * 0.13, y - k * 0.45, k * 0.24, k * 0.28, k * 0.09);
  c.fillStyle = '#5b6b4a';
  c.fill();
  // Head, beard, beanie
  const hy = y - k * 0.55 + Math.sin(t * 2) * 1.5;
  circle(c, x, hy, k * 0.1, '#e5b593');
  ellipse(c, x, hy + k * 0.06, k * 0.09, k * 0.07, '#9a9a9a');
  circle(c, x - k * 0.035, hy - k * 0.01, k * 0.012, '#2a1a10');
  circle(c, x + k * 0.035, hy - k * 0.01, k * 0.012, '#2a1a10');
  ellipse(c, x, hy - k * 0.07, k * 0.1, k * 0.06, '#c0392b');
  circle(c, x, hy - k * 0.14, k * 0.025, '#e8e2d6');
  // Cup for coins
  rrect(c, x + k * 0.22, y - k * 0.1, k * 0.07, k * 0.09, 3);
  c.fillStyle = '#e8e2d6';
  c.fill();
}

export default {
  id: 'coma',
  world: 'w03',
  input: 'tap',
  base: 5.2,
  survive: false,
  verb: { en: 'WAKE UP!', fr: 'RÉVEILLE-TE !' },
  title: { en: 'Coma before the BAC', fr: 'Coma avant eul’ BAC' },
  howto: {
    en: 'Jojo Gueugneau drags Panda up the station stairs. Tap right when the head BONKS a step: three good ones and he wakes up for the BAC!',
    fr: 'Jojo Gueugneau traîne Panda dans l’escalier d’la gare. Touche pile quand sa tête cogne eune marche : trois fois et y s’réveille pour eul’ BAC !',
  },
  winLine: { en: 'Awake and off to the BAC!', fr: 'Réveillé, en route pour eul’ BAC !' },
  rival: ['mamar', 'babar'],
  rivalLine: { en: 'Pfff… he’ll get his BAC after all.', fr: 'Pfff… y va l’avoir, son BAC.' },
  loseLine: { en: 'Hoho… the BAC will be for next year…', fr: 'Hoho… eul’ BAC, y’est pour l’an prochain…' },
  create(g) {
    const interval = 0.62 / g.speed;
    const first = 0.55 / g.speed;
    const window = Math.max(0.1, 0.17 / Math.sqrt(g.speed));
    // The stairs climb from the tunnel (bottom left) to the platforms (top right).
    const bottom = { x: 40, y: g.H * 0.76 };
    const top = { x: 330, y: g.H * 0.34 };
    const dx = (top.x - bottom.x) / (STEPS + 1);
    const dy = (bottom.y - top.y) / (STEPS + 1);
    const s = { t: 0, pulls: 0, good: 0, judged: -1, flash: 0, bonk: 0, up: 0, said: false, woke: false };
    const bonkAt = (i) => first + i * interval;

    /** Where everyone is after `p` pulls: Jojo's feet, his hands, the hero's angle and head. */
    function rig(p, lean) {
      const k = Math.min(STEPS + 0.4, p + 2.2);
      const jx = bottom.x + dx * k;
      const jy = bottom.y - dy * k;
      // Jojo's hands, turned with his lean (see jojo(): about (-0.2, -0.24) of his size)
      const hx = -0.2 * JOJO;
      const hy = -0.24 * JOJO;
      const hands = { x: jx + hx * Math.cos(lean) - hy * Math.sin(lean), y: jy + hx * Math.sin(lean) + hy * Math.cos(lean) };
      // The head rests on the stairs, about two steps below Jojo
      const rest = { x: jx - dx * 2.1, y: jy + dy * 2.1 };
      const v = { x: rest.x - hands.x, y: rest.y - hands.y };
      const n = Math.hypot(v.x, v.y) || 1;
      const angle = Math.atan2(v.x / n, -v.y / n);
      const reach = HERO * 0.66;
      return { jojo: { x: jx, y: jy }, hands, feet: { x: jx, y: jy }, angle, head: { x: hands.x + (v.x / n) * reach, y: hands.y + (v.y / n) * reach } };
    }
    /** Pull progress: whole steps done, plus the fraction of the current pull (eased). */
    function progress() {
      if (s.t < first - interval) return 0;
      const raw = (s.t - first) / interval + 1;
      const n = Math.floor(raw);
      const f = raw - n;
      return Math.min(STEPS, n - 1 + Math.min(1, f * 1.35) ** 2);
    }

    return {
      update(dt) {
        s.t += dt;
        s.flash = Math.max(0, s.flash - dt);
        s.bonk = Math.max(0, s.bonk - dt);
        if (!s.said && s.t > 0.05) {
          s.said = true;
          g.say(300, g.H * 0.93 - 100, g.tr({ en: 'It’s just a little alcohol coma', fr: 'Y’est qu’un p’tit coma éthylique' }), Math.max(1.3, 2.2 / g.speed));
        }
        if (s.woke) {
          s.up = Math.min(1, s.up + dt * 3);
          return;
        }
        // Each pull ends with the head bonking the next step.
        while (s.pulls < STEPS && s.t >= bonkAt(s.pulls)) {
          s.pulls++;
          s.bonk = 0.25;
          g.sfx.hit();
          const h = rig(s.pulls, 0.08).head;
          g.fx.text(h.x - 30, h.y + 30, 'BONK', { size: 22, color: PAL.cream });
          g.fx.shake(4);
        }
        // Past the last bonk's window with too few good taps: dragged to the top, still asleep.
        if (!g.done && s.pulls >= STEPS && s.t > bonkAt(STEPS - 1) + window) {
          g.sfx.bad();
          g.lose();
        }
      },
      press() {
        if (g.done) return;
        // The nearest bonk to this tap
        const i = Math.max(0, Math.min(STEPS - 1, Math.round((s.t - first) / interval)));
        const off = Math.abs(s.t - bonkAt(i));
        if (off <= window && i !== s.judged) {
          s.judged = i;
          s.good++;
          s.flash = 0.3;
          g.sfx.good();
          const f = rig(i + 1, 0.08).head;
          g.fx.burst(f.x, f.y, { kind: 'spark', n: 14, colors: [PAL.mango, '#fff3c4'] });
          g.fx.text(f.x + 10, f.y - 50, g.tr({ en: 'BAC!', fr: 'BAC !' }), { size: 26, color: PAL.mango });
          if (s.good >= WAKE) {
            s.woke = true;
            g.sfx.hoho();
            g.fx.burst(f.x + 40, f.y - 80, { kind: 'confetti', n: 30 });
            g.say(Math.max(110, rig(s.pulls, 0.08).jojo.x - 105), rig(s.pulls, 0.08).jojo.y - HERO * 0.95, g.tr({ en: 'Hoho! The BAC!', fr: 'Hoho ! Eul’ BAC !' }), 1.2);
            g.win();
          }
        } else {
          g.sfx.tap();
          g.fx.text(150, g.H * 0.5, 'Zzz…', { size: 20, color: 'rgba(255,255,255,0.8)' });
        }
      },
      draw(c) {
        const { W, H } = g;
        // The tunnel: tiled walls, neon tubes, a dark floor
        c.fillStyle = vgrad(c, 0, H, ['#2e3440', '#4a5160', '#262a33']);
        c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(238,230,200,0.13)';
        for (let y = 60; y < H * 0.9; y += 26) for (let x = (y / 26) % 2 ? 0 : -18; x < W; x += 36) c.fillRect(x + 2, y + 2, 32, 22);
        for (const nx of [90, 300]) {
          const on = Math.sin(s.t * 23 + nx) > -0.92 ? 1 : 0.3;
          rrect(c, nx - 50, 30, 100, 10, 5);
          c.fillStyle = `rgba(235,250,255,${0.85 * on})`;
          c.fill();
          ellipse(c, nx, 60, 120, 40, `rgba(220,240,255,${0.07 * on})`);
        }
        // Sign to the platforms
        rrect(c, 230, 80, 160, 52, 10);
        c.fillStyle = '#1f4e8c';
        c.fill();
        text(c, 'Montceau-les-Mines', 310, 96, { size: 14, color: '#fff', shadow: false });
        text(c, g.tr({ en: 'Platforms ↗', fr: 'Quais ↗' }), 310, 117, { size: 16, color: '#ffd84a', shadow: false });
        // Exam notice taped to the wall
        rrect(c, 24, 90, 108, 70, 6);
        c.fillStyle = '#f6f1e2';
        c.fill();
        text(c, 'BAC', 78, 112, { size: 22, color: PAL.hibiscus, shadow: false });
        text(c, g.tr({ en: 'today 8 am', fr: 'ce matin 8h' }), 78, 140, { size: 13, color: PAL.ink, shadow: false, weight: 600 });
        // Floor of the tunnel
        c.fillStyle = '#20232b';
        c.fillRect(0, bottom.y + 10, W, H - bottom.y);
        // The stairs, with yellow nosings and a rail
        for (let i = 0; i <= STEPS + 1; i++) {
          const x = bottom.x + dx * i - 30;
          const y = bottom.y - dy * i;
          c.fillStyle = i % 2 ? '#8b919c' : '#7d838e';
          c.fillRect(x, y, W - x, dy + 1);
          c.fillStyle = '#e8c43a';
          c.fillRect(x, y, W - x, 4);
        }
        c.strokeStyle = '#c9ced6';
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(bottom.x - 20, bottom.y - 70);
        c.lineTo(top.x + 40, top.y - 70);
        c.stroke();
        // The man on his cardboard, at the foot of the stairs
        tunnelMan(c, 305, H * 0.95, 150, s.t);

        // Jojo stands a step up and leans back; the hero hangs from his hands by the
        // ankles, head down on the steps.
        const p = s.woke ? s.pulls : progress();
        const frac = p - Math.floor(p);
        const pull = s.woke ? 0 : Math.sin(Math.min(1, frac) * Math.PI);
        const lean = 0.08 + pull * 0.16;
        const pose = rig(p, lean);
        const lift = s.woke ? 0 : pull * 0.3;
        // Tell: the step edge the head is about to hit glows as the bonk comes
        if (!g.done && s.pulls < STEPS) {
          const k = Math.max(0, 1 - (bonkAt(s.pulls) - s.t) / interval);
          const nh = rig(s.pulls + 1, 0.08).head;
          ellipse(c, nh.x, nh.y + 26, 26 + k * 10, 8 + k * 3, `rgba(255,216,74,${0.2 + 0.6 * k})`);
        }
        if (!s.woke) {
          c.save();
          c.translate(pose.hands.x, pose.hands.y);
          c.rotate(pose.angle + lift);
          person(c, g.hero, 0, 0, HERO, s.bonk > 0 ? 'sad' : 'idle', s.t, { hat: g.hat, squash: s.bonk > 0 ? 0.95 : 1 });
          c.restore();
          const h = pose.head;
          if (s.bonk > 0) for (let i = 0; i < 4; i++) text(c, '★', h.x + Math.cos(s.t * 9 + i * 1.6) * 34, h.y - 10 + Math.sin(s.t * 9 + i * 1.6) * 12, { size: 16, color: '#ffd84a', shadow: false });
          else text(c, 'z', h.x - 40 + Math.sin(s.t * 3) * 4, h.y - 20 - ((s.t * 18) % 20), { size: 18, color: 'rgba(255,255,255,0.75)', shadow: false });
        }
        jojo(c, pose.jojo.x, pose.jojo.y, JOJO, s.t, lean, s.woke);
        text(c, 'Jojo Gueugneau', pose.jojo.x, pose.jojo.y - JOJO * 0.88, { size: 13, color: PAL.cream, weight: 600 });
        if (s.woke) {
          // Up on their feet, a step below Jojo, arms in the air
          const x = pose.jojo.x - 105;
          const y = bottom.y - ((x - bottom.x) / dx) * dy + dy * 0.6;
          person(c, g.hero, x, y - s.up * 14, HERO, 'cheer', s.t, { hat: g.hat });
        }

        // Wake meter: three eyes that open one by one
        for (let i = 0; i < WAKE; i++) {
          const x = W / 2 - 50 + i * 50;
          const y = H * 0.22;
          const open = i < s.good;
          circle(c, x, y, 18, open ? '#fff7e0' : 'rgba(255,255,255,0.2)');
          if (open) circle(c, x, y, 8, '#3a2418');
          else {
            c.strokeStyle = 'rgba(255,255,255,0.7)';
            c.lineWidth = 3;
            c.beginPath();
            c.arc(x, y - 4, 10, 0.2, Math.PI - 0.2);
            c.stroke();
          }
        }
        if (s.flash > 0) {
          c.fillStyle = `rgba(255,240,180,${s.flash * 0.5})`;
          c.fillRect(0, 0, W, H);
        }
      },
      bot() {
        if (g.done || s.pulls >= STEPS) return null;
        const i = s.pulls;
        if (i !== s.judged && Math.abs(s.t - bonkAt(i)) < 0.02) return { press: [200, 400] };
        return null;
      },
    };
  },
};
