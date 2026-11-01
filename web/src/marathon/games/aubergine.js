// Victor's vegetable garden (world 10): aubergines grow and wobble on their
// plants while Victor brags about how BIG they are. The champion keeps
// changing: TAP the biggest one while it is the biggest. The leader is always
// clearly bigger (>= ~18 %), except during a quick "boing" swap, where both
// contenders count. Wrong pick: "That's a baby one!". Too slow: lose.

import { sky, sun, palm, rrect, circle, ellipse, PAL, text, shadowed, person, vgrad, creoleHouse } from '../art.js';

const LEAD = 1; // the champion's size
const OTHERS = [0.48, 0.78]; // everyone else: leader stays >= 1.18x the runner-up
const WOBBLE = 0.025; // breathing, on top of the target size
const FAIR = 0.95; // a tap counts if within 5 % of the biggest (only matters mid-swap)
const CLEAR = 1.15; // the bot (and the "obvious" moment) needs this margin

function aubergine(c, x, y, L, hw, rot, t, { glow = 0, sad = 0 } = {}) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  // Stem up to the branch.
  c.strokeStyle = '#3f8a3a';
  c.lineWidth = 4;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0, -14);
  c.quadraticCurveTo(3, -6, 0, 4);
  c.stroke();
  if (glow > 0) {
    const gl = c.createRadialGradient(0, L * 0.6, 4, 0, L * 0.6, L * 0.8);
    gl.addColorStop(0, `rgba(255,230,140,${0.45 * glow})`);
    gl.addColorStop(1, 'rgba(255,230,140,0)');
    c.fillStyle = gl;
    c.fillRect(-L, -L * 0.2, L * 2, L * 1.6);
  }
  // Body: narrow at the cap, round and heavy at the bottom.
  shadowed(c, () => {
    c.beginPath();
    c.moveTo(0, 2);
    c.bezierCurveTo(hw * 0.6, 2, hw * 1.05, L * 0.45, hw, L * 0.72);
    c.bezierCurveTo(hw * 0.92, L * 1.04, -hw * 0.92, L * 1.04, -hw, L * 0.72);
    c.bezierCurveTo(-hw * 1.05, L * 0.45, -hw * 0.6, 2, 0, 2);
    const gr = c.createRadialGradient(-hw * 0.4, L * 0.45, 2, 0, L * 0.6, L * 0.75);
    gr.addColorStop(0, sad ? '#8f6aa6' : '#a465dc');
    gr.addColorStop(0.45, sad ? '#5e3f73' : '#62268e');
    gr.addColorStop(1, sad ? '#33243f' : '#2c0d44');
    c.fillStyle = gr;
    c.fill();
  }, 10, 5);
  // Glossy highlight.
  ellipse(c, -hw * 0.45, L * 0.5, hw * 0.16, L * 0.22, 'rgba(255,255,255,0.32)', 0.12);
  circle(c, -hw * 0.38, L * 0.78, hw * 0.08, 'rgba(255,255,255,0.4)');
  // Green calyx cap.
  c.fillStyle = '#4fae46';
  for (let i = 0; i < 5; i++) {
    const a = -0.9 + (i / 4) * 1.8;
    c.beginPath();
    c.moveTo(Math.sin(a) * hw * 0.25, 2);
    c.quadraticCurveTo(Math.sin(a) * hw * 0.7, L * 0.08, Math.sin(a) * hw * 0.55, L * 0.17 + Math.cos(a) * 4);
    c.quadraticCurveTo(Math.sin(a) * hw * 0.2, L * 0.08, 0, 2);
    c.fill();
  }
  ellipse(c, 0, 4, hw * 0.42, 6, '#5fc255');
  c.restore();
}

function plant(c, x, topY, bedY, t, i) {
  c.strokeStyle = '#3d7a34';
  c.lineWidth = 6;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, bedY);
  c.quadraticCurveTo(x + Math.sin(t * 1.2 + i) * 6, (bedY + topY) / 2, x, topY);
  c.stroke();
  for (let k = 0; k < 6; k++) {
    const side = k % 2 ? 1 : -1;
    const ly = topY - 6 + k * 18;
    const sway = Math.sin(t * 1.6 + i + k) * 0.08;
    ellipse(c, x + side * 26, ly, 30, 13, k % 3 ? PAL.palm : PAL.leaf, side * (0.45 + sway));
  }
  // Little purple flower.
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + t * 0.4;
    circle(c, x + 30 + Math.cos(a) * 5, topY - 20 + Math.sin(a) * 5, 4, '#c79be8');
  }
  circle(c, x + 30, topY - 20, 3, '#ffd166');
}

export default {
  id: 'aubergine',
  world: 'w10',
  input: 'tap',
  base: 5.5,
  min: 2.6,
  survive: false,
  verb: { en: 'PICK THE BIGGEST!', fr: 'CUEILLE LA PLUS GROSSE !' },
  title: { en: "Victor's giant aubergines", fr: 'Les aubergines géantes de Victor' },
  howto: { en: 'The aubergines keep growing and shrinking. Tap the biggest one while it is the biggest!', fr: 'Les aubergines grossissent et rapetissent. Touche la plus grosse pendant qu\'elle est la plus grosse !' },
  winLine: { en: 'Biggest aubergine in Martinique!', fr: 'La plus grosse aubergine de la Martinique !' },
  rival: ["victor", "greg"],
  rivalLine: { en: "You took my finest one…", fr: "Tu m'as pris la plus belle…" },
  loseLine: { en: "Hoho, they all look the same!", fr: "Hoho, elles se ressemblent toutes !" },
  create(g) {
    const villain = g.cast('victor', 'greg');
    const n = g.boss || g.speed >= 1.6 ? 4 : 3;
    const picksNeeded = g.boss ? 3 : 1;
    const bedY = g.H * 0.76;
    const hangY = bedY - 215;
    const colW = (g.W - 20) / n;
    const scale = n > 3 ? 0.84 : 1;
    const maxL = 150 * scale;
    const maxHW = 34 * scale;
    const growT = 0.75 / g.speed;
    const rate = 7 * g.speed;
    const peopleY = hangY + 12;

    const plants = Array.from({ length: n }, (_, i) => ({
      x: 10 + colW * (i + 0.5),
      cur: 0.6,
      target: 0.6,
      phase: g.random() * 6,
      wob: 2 + g.random() * 2.5,
      picked: 0,
      bad: false,
      good: false,
    }));
    const s = { t: 0, leader: Math.floor(g.random() * n), nextSwap: 0, swaps: 0, picks: 0, laugh: 0, cheer: 0, timeoutSaid: false };

    function assign() {
      // Others get spread-out sizes so the garden reads as small / medium / BIG.
      const others = plants.map((_, i) => i).filter((i) => i !== s.leader);
      const slots = others.map((_, k) => OTHERS[0] + ((OTHERS[1] - OTHERS[0]) * (k + g.random() * 0.6)) / Math.max(1, others.length - 0.4));
      for (let k = slots.length - 1; k > 0; k--) {
        const j = Math.floor(g.random() * (k + 1));
        [slots[k], slots[j]] = [slots[j], slots[k]];
      }
      others.forEach((i, k) => { plants[i].target = Math.min(OTHERS[1], slots[k]); });
      plants[s.leader].target = LEAD;
    }
    assign();
    for (const p of plants) p.cur = p.target;
    s.nextSwap = growT + (0.9 + g.random() * 0.5) / g.speed;

    function swap() {
      let nl = Math.floor(g.random() * (n - 1));
      if (nl >= s.leader) nl++;
      s.leader = nl;
      s.swaps++;
      assign();
      s.nextSwap = s.t + (0.85 + g.random() * 0.55) / g.speed;
      g.sfx.pop();
      if (s.swaps === 1 && !g.done) {
        g.say(villainX(), peopleY - 150, g.tr(g.pick([
          { en: 'Biggest aubergine in Martinique!', fr: 'La plus grosse aubergine de la Martinique !' },
          { en: 'It grows while you watch!', fr: 'Elle pousse à vue d\'œil !' },
          { en: 'Bigger than my head!', fr: 'Plus grosse que ma tête !' },
        ])), 1.1);
      }
    }

    function grow() {
      const k = Math.min(1, s.t / growT);
      // Ease out with a little overshoot: they "boing" out of the ground.
      const c1 = 1.7;
      return 1 + (c1 + 1) * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
    }

    function size(i) {
      const p = plants[i];
      return Math.max(0.02, grow() * p.cur * (1 + WOBBLE * Math.sin(s.t * p.wob + p.phase)));
    }

    function villainX() {
      return 300;
    }

    function columnAt(x) {
      let best = -1;
      let bd = colW * 0.55;
      plants.forEach((p, i) => {
        const d = Math.abs(p.x - x);
        if (d < bd) { bd = d; best = i; }
      });
      return best;
    }

    g.say(villainX(), peopleY - 150, g.tr({ en: 'Look at the size of this one!', fr: 'Regarde-moi la taille de celle-là !' }), 1.2);

    return {
      update(dt) {
        s.t += dt;
        s.laugh = Math.max(0, s.laugh - dt);
        for (const p of plants) {
          if (!g.done) p.cur += (p.target - p.cur) * Math.min(1, dt * rate);
          if (p.picked) p.picked += dt;
        }
        if (!g.done && s.t >= s.nextSwap) swap();
        if (g.done && !g.won && !s.timeoutSaid && !plants.some((p) => p.bad)) {
          s.timeoutSaid = true;
          s.laugh = 1.5;
          g.sfx.bad();
          g.say(villainX(), peopleY - 150, g.tr({ en: 'Too slow! I\'m keeping them!', fr: 'Trop lent ! Je les garde !' }), 1.4);
        }
      },
      press(x, y) {
        if (y < hangY - 80 || y > bedY + 60) return;
        const i = columnAt(x);
        if (i < 0 || plants[i].picked) return;
        const p = plants[i];
        const sizes = plants.map((_, k) => (plants[k].picked ? 0 : size(k)));
        const max = Math.max(...sizes);
        p.picked = 0.001;
        g.sfx.tap();
        const cx = p.x;
        const cy = hangY + maxL * sizes[i] * 0.6;
        if (sizes[i] >= FAIR * max) {
          p.good = true;
          s.picks++;
          g.sfx.good();
          g.fx.burst(cx, cy, { kind: 'spark', n: 16, colors: [PAL.mango, '#fff3c4', '#c79be8'], speed: 220 });
          g.fx.text(cx, cy - 70, 'XXL!', { size: 32, color: PAL.mango });
          if (s.picks >= picksNeeded) {
            g.sfx.hoho();
            g.fx.burst(cx, cy, { kind: 'confetti', n: 34, colors: ['#8a3fc2', '#c79be8', PAL.leaf, PAL.mango, '#fff'] });
            g.fx.shake(6);
            g.say(villainX(), peopleY - 150, g.tr({ en: 'Biggest aubergine in Martinique!', fr: 'La plus grosse aubergine de la Martinique !' }), 1.5);
            g.win();
          } else {
            // Boss: a new aubergine sprouts in its place and the race restarts.
            p.picked = 0;
            p.good = false;
            p.cur = 0.2;
            swap();
          }
        } else {
          p.bad = true;
          s.laugh = 1.5;
          g.sfx.bad();
          g.fx.burst(cx, cy, { kind: 'smoke', n: 10, speed: 70 });
          g.fx.text(cx, cy - 60, g.tr({ en: 'Tiny!', fr: 'Riquiqui !' }), { size: 26, color: PAL.coral });
          g.fx.shake(8);
          g.say(villainX(), peopleY - 150, g.tr({ en: "Hahaha! That's a baby one!", fr: "Hahaha ! C'est un bébé, ça !" }), 1.5);
          g.lose();
        }
      },
      draw(c) {
        const W = g.W;
        const H = g.H;
        // Sunny hillside garden, Montagne Pelée in the haze.
        sky(c, W, H * 0.62, ['#4fb4ea', '#a8e2f6', '#e8f7ee']);
        sun(c, 330, 95, 24);
        for (let i = 0; i < 3; i++) ellipse(c, ((i * 150 + s.t * 10) % (W + 140)) - 70, 120 + i * 34, 46, 12, 'rgba(255,255,255,0.75)');
        c.fillStyle = 'rgba(70,120,110,0.45)';
        c.beginPath();
        c.moveTo(-20, H * 0.5);
        c.quadraticCurveTo(110, H * 0.22, 190, H * 0.24);
        c.quadraticCurveTo(290, H * 0.3, W + 20, H * 0.5);
        c.fill();
        c.fillStyle = vgrad(c, H * 0.4, H * 0.62, ['#7fcf72', '#55b35c']);
        c.beginPath();
        c.moveTo(0, H * 0.5);
        c.quadraticCurveTo(W * 0.5, H * 0.38, W, H * 0.48);
        c.lineTo(W, H);
        c.lineTo(0, H);
        c.fill();
        creoleHouse(c, 150, H * 0.47, 70, 52, PAL.creole[1], '#c8553d');
        palm(c, -12, H * 0.58, H * 0.36, s.t, 0.22);
        palm(c, W + 12, H * 0.6, H * 0.32, s.t + 2, -0.25);
        // Bamboo fence.
        for (let x = 4; x < W; x += 18) {
          rrect(c, x, peopleY - 70, 12, 80, 5);
          c.fillStyle = x % 36 ? '#d8b56a' : '#cfa95c';
          c.fill();
        }
        c.fillStyle = '#b8924a';
        c.fillRect(0, peopleY - 50, W, 5);
        c.fillStyle = vgrad(c, peopleY, H, ['#6cc067', '#3f9550']);
        c.fillRect(0, peopleY, W, H - peopleY);
        // The gang behind the bed.
        const vPose = g.done ? (g.won ? 'cheer' : 'point') : 'point';
        const vy = peopleY + (s.laugh > 0 ? -Math.abs(Math.sin(s.t * 18)) * 6 : 0);
        person(c, g.hero, 82, peopleY + 30, 140, g.done ? (g.won ? 'cheer' : 'sad') : 'idle', s.t, { hat: g.hat });
        person(c, villain, villainX(), vy + 30, 150, vPose, s.t + 1, { flip: true, hat: 'bakoua' });
        if (s.laugh > 0) text(c, 'HA HA!', villainX() + 40, peopleY - 150 + Math.sin(s.t * 20) * 3, { size: 18, color: PAL.cream, stroke: PAL.hibiscus });
        // Raised wooden bed with dark soil.
        shadowed(c, () => {
          rrect(c, 8, bedY - 10, W - 16, 74, 14);
          c.fillStyle = '#a8703d';
          c.fill();
        }, 14, 6);
        c.fillStyle = 'rgba(255,255,255,0.12)';
        c.fillRect(14, bedY + 14, W - 28, 4);
        c.fillStyle = 'rgba(60,30,10,0.25)';
        c.fillRect(14, bedY + 38, W - 28, 3);
        ellipse(c, W / 2, bedY - 8, W / 2 - 14, 12, '#4a2f1f');
        for (let i = 0; i < 14; i++) circle(c, 24 + i * 27, bedY - 10 + (i % 3) * 2, 3, '#3a2416');
        // Plants and their aubergines.
        plants.forEach((p, i) => {
          plant(c, p.x, hangY, bedY - 8, s.t, i);
        });
        plants.forEach((p, i) => {
          const sz = size(i);
          if (p.picked && p.good) {
            // Flies up, spinning, into the sky.
            const k = Math.min(1, p.picked * 2.2);
            aubergine(c, p.x + k * 10, hangY - k * 120 + 8, maxL * sz * 1.1, maxHW * sz * 1.1, Math.sin(s.t * 10) * 0.25 * k, s.t, { glow: 1 });
            return;
          }
          const k = p.bad ? Math.min(1, p.picked * 3) : 0;
          const rot = Math.sin(s.t * (1.4 + i * 0.3) + p.phase) * 0.07 + k * 0.4;
          aubergine(c, p.x + 6, hangY + 8 + k * 20, maxL * sz * (1 - k * 0.15), maxHW * sz * (1 - k * 0.15), rot, s.t, { sad: k });
        });
        if (!g.done && s.t > growT) text(c, '👆', W / 2, bedY + 100, { size: 30, shadow: false });
      },
      bot() {
        if (s.t < growT * 1.05) return null;
        const sizes = plants.map((_, i) => (plants[i].picked ? 0 : size(i)));
        const order = sizes.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
        if (order[0][0] < CLEAR * order[1][0]) return null;
        const i = order[0][1];
        return { press: [plants[i].x, hangY + maxL * sizes[i] * 0.6] };
      },
    };
  },
};
