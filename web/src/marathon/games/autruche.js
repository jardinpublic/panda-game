// At 15, in front of Cous's garage (world 3): the police car is cruising up the
// street, its spotlight sweeping the gardens. The gang is hidden in the garage,
// except Jojo: he only put his HEAD in the bush, and the rest of him stands on
// the pavement, like an ostrich. DRAG to the right to push him into the bush;
// he keeps backing out ("If I can't see them, they can't see me!"). The light
// passes twice: if it lands on his bottom, the car stops ("Evening, young
// man…"), and Cous's mum hears all about it. Everyone gets punished.

import { head, circle, ellipse, rrect, vgrad, text, PAL } from '../art.js';
import { policeCar } from '../cars.js';

const BUSH = [[215, -76, 80], [167, -44, 52], [257, -34, 56], [189, -122, 46], [128, -32, 46]]; // between the house and the garage // x, y from the ground, r
const JOJO = 250;
const BEND = 1.25; // his back, bent right over towards the bush

/** Jojo standing, bent over at the hips, head stuck in the bush (drawn over by it). */
function ostrich(c, x, y, s, t) {
  const hipY = y - s * 0.2;
  c.lineCap = 'round';
  ellipse(c, x, y, s * 0.13, s * 0.025, 'rgba(0,0,0,0.25)');
  // straight legs, tracksuit trousers with the white stripe, trainers
  for (const side of [-1, 1]) {
    const wob = Math.sin(t * 3 + side) * s * 0.006;
    c.strokeStyle = '#2b3a8f';
    c.lineWidth = s * 0.075;
    c.beginPath();
    c.moveTo(x + side * s * 0.04, hipY);
    c.lineTo(x + side * s * 0.05 + wob, y - s * 0.01);
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.8)';
    c.lineWidth = s * 0.012;
    c.beginPath();
    c.moveTo(x + side * s * 0.065, hipY + s * 0.01);
    c.lineTo(x + side * s * 0.075 + wob, y - s * 0.02);
    c.stroke();
    ellipse(c, x + side * s * 0.06 + s * 0.02, y, s * 0.05, s * 0.022, '#f4f1ea');
  }
  // the bottom, sticking out, and the bent back
  c.save();
  c.translate(x, hipY);
  c.rotate(BEND);
  ellipse(c, 0, 0, s * 0.1, s * 0.075, '#2b3a8f');
  rrect(c, -s * 0.11, -s * 0.36, s * 0.22, s * 0.38, s * 0.09);
  c.fillStyle = vgrad(c, -s * 0.36, 0, ['#3c4fc0', '#2b3a8f']);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.85)';
  c.fillRect(-s * 0.005, -s * 0.34, s * 0.01, s * 0.3);
  head(c, 'jojo', 0, -s * 0.52, s * 0.36);
  c.restore();
  // arms hanging down from the shoulders
  const sx = x + Math.sin(BEND) * s * 0.3;
  const sy = hipY - Math.cos(BEND) * s * 0.3;
  c.strokeStyle = '#3c4fc0';
  c.lineWidth = s * 0.055;
  for (const side of [-1, 1]) {
    const sw = Math.sin(t * 4 + side) * s * 0.02;
    c.beginPath();
    c.moveTo(sx + side * s * 0.03, sy);
    c.lineTo(sx + side * s * 0.04 + sw, sy + s * 0.2);
    c.stroke();
    circle(c, sx + side * s * 0.04 + sw, sy + s * 0.21, s * 0.028, '#e8b48f');
  }
}

export default {
  id: 'autruche',
  world: 'w03',
  input: 'drag',
  base: 6,
  min: 3.6,
  survive: true,
  verb: { en: 'HIDE JOJO!', fr: 'CACHE JOJO !' },
  title: { en: 'The ostrich', fr: 'L’autruche' },
  howto: {
    en: 'The cops are coming! Jojo only hid his head in the bush. Drag right to push him in before the light gets him!',
    fr: 'Les flics passent ! Jojo a juste mis sa tête dans eul’ buisson. Glisse vers la droite pour l’pousser dedans avant qu’la lumière l’attrape !',
  },
  winLine: { en: 'Jojo is invisible!', fr: 'Jojo est invisible !' },
  rival: ['cous', 'babar'],
  rivalLine: { en: 'Jojo, the ostrich…', fr: 'Eul’ Jojo, y’est une autruche…' },
  loseLine: { en: 'Hoho… Jojo got caught. Everybody’s grounded!', fr: 'Hoho… Jojo s’est fait pincer. Tout l’monde est puni !' },
  create(g) {
    const { W, H } = g;
    const groundY = H * 0.66; // the pavement where Jojo stands
    const roadY = H * 0.86; // the patrol car's wheels
    // Everyone else hid properly in the garage, the hero included.
    const gang = [g.hero, ...['panda', 'cous', 'mamar', 'babar', 'romain', 'victor'].filter((id) => id !== g.hero)];
    const P = 2.0 / Math.pow(g.speed, 0.6); // one sweep of the spotlight
    const pop = 0.4 * Math.pow(g.speed, 0.75); // how fast Jojo backs out of the bush
    const passes = [];
    let at = 0.7 / Math.sqrt(g.speed);
    for (let i = 0; i < 2; i++) {
      passes.push({ start: at, dir: i % 2 ? -1 : 1 });
      at += P + 0.35 / Math.sqrt(g.speed);
    }
    const endAt = at;
    const s = { t: 0, e: 1, down: false, px: 0, py: 0, spot: -999, carX: -200, dir: 1, caught: false, stopT: 0, said: false, botX: 0, endT: 0 };

    const jx = () => 125 - 70 * s.e; // fully in, his head stays inside the bush // Jojo's feet: further out of the bush as e grows
    const bodyX = () => jx() + 40;

    function caught() {
      s.caught = true;
      g.sfx.bad();
      g.fx.shake(8);
      g.say(s.carX, roadY - 120, g.tr({ en: 'Evening, young man…', fr: 'Bonsoir jeune homme…' }), 1.8);
      g.lose();
    }

    return {
      update(dt) {
        s.t += dt;
        if (g.done) {
          s.endT += dt;
          if (!g.won && s.endT > 1.0 && !s.said) {
            s.said = true;
            g.say(73, H * 0.18, g.tr({ en: 'Yes, it’s my son and his friends, I know!', fr: 'Oui, y’est mon fils et ses copains, j’suis au courant !' }), 2.2);
            g.fx.text(200, H * 0.5, g.tr({ en: 'GROUNDED!', fr: 'PUNIS !' }), { size: 44, color: PAL.hibiscus, life: 1.6 });
          }
          return;
        }
        // Jojo backs out of the bush on his own ("I can't see them…").
        const before = s.e;
        s.e = Math.min(1, s.e + pop * dt);
        if (before < 0.6 && s.e >= 0.6) g.say(bodyX() - 20, groundY - JOJO * 0.8, g.tr({ en: 'Can’t see them, so…', fr: 'J’vois rien, donc…' }), 0.9);
        // The car and its spotlight sweeping the gardens.
        const pass = passes.find((p) => s.t >= p.start && s.t < p.start + P);
        if (pass) {
          const k = (s.t - pass.start) / P;
          s.dir = pass.dir;
          s.spot = pass.dir > 0 ? -90 + k * (W + 180) : W + 90 - k * (W + 180);
          s.carX = s.spot - pass.dir * 30;
          if (Math.abs(s.spot - bodyX()) < 50 && s.e > 0.3) {
            caught();
            return;
          }
        } else {
          s.spot = -999;
          s.carX = -300;
        }
        if (s.t >= endAt) {
          g.sfx.good();
          g.fx.burst(bodyX(), groundY - 120, { kind: 'petal', n: 16, colors: ['#3f8a4a', '#62b36b'] });
          g.say(330, H * 0.42, g.tr({ en: 'Phew…', fr: 'Ouf…' }), 1.4);
          g.win();
        }
      },
      press(x, y) {
        if (g.done) return;
        s.down = true;
        s.px = x;
        s.py = y;
      },
      move(x, y) {
        if (!s.down || g.done) return;
        const dx = x - s.px;
        s.px = x;
        s.py = y;
        if (dx > 0) {
          const before = s.e;
          s.e = Math.max(0, s.e - dx / 110);
          if (before > 0.05 && s.e <= 0.05) g.sfx.pop();
          if (Math.floor(before * 6) !== Math.floor(s.e * 6)) g.fx.burst(205, groundY - 150, { kind: 'petal', n: 3, colors: ['#3f8a4a', '#62b36b'], speed: 120 });
        }
      },
      release() {
        s.down = false;
      },
      draw(c) {
        const t = s.t;
        // Night sky; behind the garden wall, Cous's parents' house and the garage.
        c.fillStyle = vgrad(c, 0, H * 0.6, ['#141a3a', '#26305e']);
        c.fillRect(0, 0, W, H * 0.6);
        circle(c, 200, 150, 22, 'rgba(255,246,210,0.9)');
        c.fillStyle = '#d8cbb3';
        c.fillRect(0, H * 0.14, 150, H * 0.33);
        c.fillStyle = '#8a4c38';
        c.beginPath();
        c.moveTo(-10, H * 0.14);
        c.lineTo(70, H * 0.08);
        c.lineTo(160, H * 0.14);
        c.closePath();
        c.fill();
        const lit = g.done && !g.won && s.endT > 0.8;
        rrect(c, 48, H * 0.19, 50, 46, 4);
        c.fillStyle = lit ? 'rgba(255,214,110,0.95)' : '#2b2f4a';
        c.fill();
        rrect(c, 244, H * 0.32, 154, H * 0.2, 6);
        c.fillStyle = '#c9bca4';
        c.fill();
        rrect(c, 254, H * 0.36, 136, H * 0.16, 4);
        c.fillStyle = '#16131c';
        c.fill();
        text(c, 'GARAGE', 321, H * 0.34, { size: 11, color: '#6b5a48', shadow: false });
        const peek = g.done ? (g.won ? 0 : 1) : 0.5 + 0.5 * Math.sin(t * 2);
        // Two rows of heads peeking out (the back row first).
        const back = gang.slice(0, 3);
        const front = gang.slice(3);
        back.forEach((id, i) => head(c, id, 280 + i * 42, H * 0.425 - peek * 4 * ((i % 2) * 2 - 1), 44, { hat: id === g.hero ? g.hat : 'none', rot: (i - 1) * 0.08 }));
        front.forEach((id, i) => {
          const x = 321 + (i - (front.length - 1) / 2) * 33;
          head(c, id, x, H * 0.475 + peek * 3 * ((i % 2) * 2 - 1), 44, { hat: id === g.hero ? g.hat : 'none', rot: (i - 1) * 0.08 });
        });
        // Lawn, the low garden wall, the pavement, the curb and the street.
        c.fillStyle = '#244a2e';
        c.fillRect(0, H * 0.52, W, H * 0.06);
        c.fillStyle = vgrad(c, H * 0.56, H * 0.6, ['#b7ab98', '#968a78']);
        c.fillRect(0, H * 0.56, W, H * 0.04);
        c.fillStyle = '#8f8a84';
        c.fillRect(0, H * 0.6, W, groundY - H * 0.6 + 14);
        c.fillStyle = '#c9c4bc';
        c.fillRect(0, groundY + 14, W, 8);
        c.fillStyle = vgrad(c, groundY + 22, H, ['#43444f', '#36373f']);
        c.fillRect(0, groundY + 22, W, H - groundY - 22);
        c.fillStyle = 'rgba(255,255,255,0.4)';
        for (let i = 0; i < 6; i++) c.fillRect(i * 80 + 10, H * 0.8, 40, 4);

        // Jojo on the pavement, bent over, head in the bush on the garden border.
        ostrich(c, jx(), groundY, JOJO, t);
        for (const [x, y, r] of BUSH) circle(c, x, groundY + y, r, '#2f6b3a');
        for (const [x, y, r] of BUSH) circle(c, x - r * 0.25, groundY + y - r * 0.3, r * 0.45, 'rgba(120,200,120,0.18)');

        // The patrol car, driving right past him.
        const stopped = g.done && !g.won;
        let lamp = null;
        if (s.carX > -250) lamp = policeCar(c, s.carX, roadY, 190, { flip: s.dir < 0, t, spin: !stopped, flash: stopped });

        // The spotlight: a cone from the car and a bright patch on the garden.
        if (lamp && s.spot > -200) {
          const sy = groundY - 90;
          const cone = c.createLinearGradient(lamp.x, lamp.y, s.spot, sy);
          cone.addColorStop(0, 'rgba(255,250,215,0.55)');
          cone.addColorStop(1, 'rgba(255,250,215,0.12)');
          c.fillStyle = cone;
          c.beginPath();
          c.moveTo(lamp.x, lamp.y);
          c.lineTo(s.spot - 70, sy);
          c.lineTo(s.spot + 70, sy);
          c.closePath();
          c.fill();
          const gl = c.createRadialGradient(s.spot, sy, 0, s.spot, sy, 110);
          gl.addColorStop(0, 'rgba(255,250,215,0.55)');
          gl.addColorStop(1, 'rgba(255,250,215,0)');
          c.fillStyle = gl;
          c.fillRect(s.spot - 110, sy - 110, 220, 220);
        }
        // How much of Jojo still shows.
        if (!g.done) {
          rrect(c, 250, 96, 130, 14, 7);
          c.fillStyle = 'rgba(0,0,0,0.35)';
          c.fill();
          rrect(c, 252, 98, 126 * s.e, 10, 5);
          c.fillStyle = s.e > 0.3 ? '#ff7a4f' : '#7dffb0';
          c.fill();
          text(c, '🍑', 238, 103, { size: 16, shadow: false });
        }
      },
      bot() {
        // Keep the finger on him and stroke right whenever he shows; start a new stroke at the edge.
        if (!s.down) {
          s.botX = 120;
          return { press: [s.botX, groundY - 100] };
        }
        if (s.botX > 380) return { release: [s.botX, groundY - 100] };
        if (s.e <= 0.05) return null;
        s.botX += 8;
        return { move: [s.botX, groundY - 100] };
      },
    };
  },
};
