// Rudy lives in the woods of the CRAPA now (for three days, before going home
// to his mum). The gang brings him food: he waits in the bushes behind the
// fence. DRAG back like a slingshot and let go to throw a sandwich, a baguette
// and a beer over the fence, right into his hands. Short: the nettles. Long: the
// pond. At higher speed the wind blows (the leaves show which way).

import { person, beerCan, rrect, circle, ellipse, vgrad, text, PAL } from '../art.js';

const GRAVITY = 1200;
const POWER = 4.2; // throw speed per pixel of pull
const MAX_PULL = 175;
const CATCH = 36; // how close to Rudy's hands counts as caught
const RUDY = 150;
const ITEMS = ['sandwich', 'baguette', 'can'];

function item(c, kind, x, y, rot) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  if (kind === 'sandwich') {
    rrect(c, -18, -4, 36, 10, 4);
    c.fillStyle = '#7cc46b';
    c.fill();
    rrect(c, -18, -12, 36, 10, 5);
    c.fillStyle = '#f0c27a';
    c.fill();
    rrect(c, -18, 4, 36, 10, 5);
    c.fill();
    c.fillStyle = '#e46b5a';
    c.fillRect(-14, 1, 28, 3);
  } else if (kind === 'baguette') {
    ellipse(c, 0, 0, 34, 8, '#d9a14f');
    c.strokeStyle = '#b37a32';
    c.lineWidth = 2;
    for (const dx of [-18, -6, 6, 18]) {
      c.beginPath();
      c.moveTo(dx - 4, -4);
      c.lineTo(dx + 4, 3);
      c.stroke();
    }
  } else {
    beerCan(c, 0, 0, 1, 0);
  }
  c.restore();
}

/** Simulates a throw from (x, y) at (vx, vy) with the wind; calls step(x, y) until it returns true. */
export function fly(x, y, vx, vy, wind, step, dt = 1 / 120, maxT = 3) {
  for (let t = 0; t < maxT; t += dt) {
    vx += wind * dt;
    vy += GRAVITY * dt;
    x += vx * dt;
    y += vy * dt;
    if (step(x, y)) return;
  }
}

export default {
  id: 'rudy-food',
  world: 'w03',
  input: 'drag',
  base: 7,
  min: 3.6,
  survive: false,
  verb: { en: 'THROW!', fr: 'LANCE !' },
  title: { en: 'Feed Rudy', fr: 'Ravitaille Rudy' },
  howto: {
    en: 'Rudy is starving in the CRAPA woods. Pull back and let go to throw the food over the fence, right into his hands!',
    fr: 'Rudy crève la dalle dans les bois du CRAPA. Tire en arrière et lâche pour lancer la bouffe par-dessus la clôture, pile dans ses mains !',
  },
  winLine: { en: 'Yum! I can last three more days!', fr: 'Miam ! J’tiens encore trois jours !' },
  rival: ['mamar', 'babar'],
  rivalLine: { en: 'I’d have eaten that sandwich myself…', fr: 'Me, j’l’aurais mangé, eul’ sandwich…' },
  loseLine: { en: 'Hoho… Rudy will starve.', fr: 'Hoho… Rudy va crever d’faim.' },
  create(g) {
    const mate = g.friend();
    const groundY = g.H * 0.8;
    const need = g.speed < 1.5 ? 3 : 2;
    const hand = { x: 92, y: groundY - 128 };
    const fenceX = 164;
    const fenceTop = groundY - 112;
    const pondX = 362;
    const wind = g.speed >= 1.6 ? (g.random() < 0.5 ? -1 : 1) * (70 + g.random() * 60) : 0;
    const gapT = 0.35 / g.speed;
    const spot = () => 272 + g.random() * 64;
    const s = {
      t: 0,
      n: 0, // items caught
      rx: spot(),
      rxTo: 0,
      state: 'ready', // ready | fly | gap | done
      drag: null, // { x0, y0, x, y }
      it: null, // { x, y, vx, vy, rot, kind }
      gt: 0,
      chomp: 0,
      miss: null,
      moved: false,
    };
    s.rxTo = s.rx;
    const catchPoint = () => ({ x: s.rx, y: groundY - RUDY * 1.12 });
    const velocity = () => {
      if (!s.drag) return null;
      let dx = s.drag.x0 - s.drag.x;
      let dy = s.drag.y0 - s.drag.y;
      const n = Math.hypot(dx, dy);
      if (n > MAX_PULL) {
        dx *= MAX_PULL / n;
        dy *= MAX_PULL / n;
      }
      return { vx: dx * POWER, vy: dy * POWER, pull: Math.min(n, MAX_PULL) };
    };

    function missed(kind, x, y) {
      s.state = 'done';
      s.miss = { kind, x, y };
      g.sfx.bad();
      if (kind === 'pond') {
        g.sfx.splash();
        g.fx.burst(Math.min(x, g.W - 20), groundY + 10, { kind: 'drop', n: 18 });
        g.fx.text(Math.min(x, g.W - 50), groundY - 40, 'PLOUF', { size: 28, color: '#bfe9ff' });
      } else if (kind === 'fence') {
        g.fx.text(fenceX, fenceTop - 30, 'BONG', { size: 26, color: PAL.cream });
      } else {
        g.fx.text(x, groundY - 50, g.tr({ en: 'Nettles!', fr: 'Les orties !' }), { size: 22, color: '#d7f5b0' });
      }
      g.lose();
    }

    return {
      update(dt) {
        s.t += dt;
        s.chomp = Math.max(0, s.chomp - dt * 2.5);
        s.rx += (s.rxTo - s.rx) * Math.min(1, dt * 8);
        if (s.state === 'fly') {
          const it = s.it;
          const steps = 4;
          for (let i = 0; i < steps && s.state === 'fly'; i++) {
            const h = dt / steps;
            const px = it.x;
            it.vx += wind * h;
            it.vy += GRAVITY * h;
            it.x += it.vx * h;
            it.y += it.vy * h;
            it.rot += it.spin * h;
            const cp = catchPoint();
            if (Math.hypot(it.x - cp.x, it.y - cp.y) < CATCH) {
              s.n++;
              s.chomp = 1;
              g.sfx.coin();
              g.fx.text(cp.x, cp.y - 30, g.tr({ en: 'Yum!', fr: 'Miam !' }), { size: 26, color: PAL.mango });
              g.fx.burst(cp.x, cp.y, { kind: 'spark', n: 12, colors: [PAL.mango, '#fff3c4'] });
              if (s.n >= need) {
                s.state = 'done';
                g.sfx.good();
                g.fx.burst(cp.x, cp.y - 40, { kind: 'confetti', n: 30 });
                g.say(cp.x - 30, cp.y - 40, g.tr({ en: 'Yum! I can last three more days!', fr: 'Miam ! J’tiens encore trois jours !' }), 1.4);
                g.win();
              } else {
                s.state = 'gap';
                s.gt = 0;
                s.rxTo = spot();
              }
            } else if (px < fenceX && it.x >= fenceX && it.y > fenceTop) missed('fence', it.x, it.y);
            else if (it.y > groundY - 10 || it.x > g.W + 20) missed(it.x > pondX ? 'pond' : 'nettles', it.x, it.y);
          }
        } else if (s.state === 'gap') {
          s.gt += dt;
          if (s.gt >= gapT) s.state = 'ready';
        }
      },
      press(x, y) {
        if (g.done || s.state !== 'ready') return;
        s.drag = { x0: x, y0: y, x, y };
        s.moved = false;
        g.sfx.tap();
      },
      move(x, y) {
        if (!s.drag) return;
        s.drag.x = x;
        s.drag.y = y;
        s.moved = true;
      },
      release() {
        if (!s.drag || g.done || s.state !== 'ready') {
          s.drag = null;
          return;
        }
        const v = velocity();
        s.drag = null;
        if (v.pull < 20) return; // just a tap: no throw
        s.it = { x: hand.x, y: hand.y, vx: v.vx, vy: v.vy, rot: 0, spin: 6, kind: ITEMS[s.n % ITEMS.length] };
        s.state = 'fly';
        g.sfx.whoosh();
      },
      draw(c) {
        const { W, H } = g;
        // The CRAPA woods
        c.fillStyle = vgrad(c, 0, groundY, ['#7ec8e3', '#bfe6c8', '#e9f3d0']);
        c.fillRect(0, 0, W, groundY);
        for (let i = 0; i < 9; i++) {
          const tx = i * 52 - 10;
          c.fillStyle = '#5b3f2c';
          c.fillRect(tx - 6, groundY - 300 - (i % 3) * 30, 12, 300);
          circle(c, tx, groundY - 320 - (i % 3) * 30, 54, i % 2 ? '#2f7a4a' : '#3b8a52');
          circle(c, tx - 26, groundY - 290 - (i % 3) * 30, 36, '#45975c');
        }
        // Wooden sign
        c.fillStyle = '#7a5332';
        c.fillRect(30, groundY - 230, 8, 110);
        rrect(c, 4, groundY - 262, 112, 38, 6);
        c.fillStyle = '#9b6a3f';
        c.fill();
        text(c, 'CRAPA', 60, groundY - 243, { size: 20, color: '#fff5dc', shadow: false });
        // Ground, the pond on the far right, the nettles
        c.fillStyle = vgrad(c, groundY, H, ['#5aa04f', '#3f7a3b']);
        c.fillRect(0, groundY, W, H - groundY);
        ellipse(c, pondX + 60, groundY + 18, 80, 22, '#3e8fbf');
        ellipse(c, pondX + 50, groundY + 14, 50, 8, 'rgba(255,255,255,0.35)');
        for (let i = 0; i < 7; i++) {
          const nx = fenceX + 16 + i * 8;
          c.strokeStyle = '#2f6a2a';
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(nx, groundY + 4);
          c.lineTo(nx + Math.sin(i + s.t * 2) * 4, groundY - 22 - (i % 3) * 6);
          c.stroke();
          ellipse(c, nx + 3, groundY - 14 - (i % 3) * 6, 5, 3, '#3c8a33', 0.6);
        }
        // Wind: leaves drifting
        if (wind) {
          for (let i = 0; i < 6; i++) {
            const lx = (((i * 73 + s.t * wind * 0.9) % (W + 40)) + W + 40) % (W + 40) - 20;
            ellipse(c, lx, 170 + i * 40 + Math.sin(s.t * 3 + i) * 10, 7, 3.5, '#6fae4a', s.t * 4 + i);
          }
          text(c, wind > 0 ? '💨 ➜' : '⬅ 💨', W / 2, 150, { size: 26, color: '#ffffff' });
        }

        // Rudy in the bushes, arms up when food is coming
        const cp = catchPoint();
        person(c, 'rudy', s.rx, groundY + 14, RUDY, s.state === 'fly' || g.won ? 'cheer' : s.miss ? 'sad' : 'idle', s.t, { squash: 1 - s.chomp * 0.05 });
        if (s.state === 'ready' || s.state === 'fly') ellipse(c, cp.x, cp.y, CATCH, CATCH * 0.7, `rgba(255,216,74,${0.18 + 0.1 * Math.sin(s.t * 6)})`);
        for (let i = 0; i < 6; i++) circle(c, s.rx - 70 + i * 28, groundY - 40 - (i % 2) * 14, 30, i % 2 ? '#2f7a3a' : '#3b8a45');
        // The fence: posts and wire
        c.fillStyle = '#8a6440';
        for (const fx of [fenceX - 5, fenceX + 44]) c.fillRect(fx, fenceTop, 10, groundY - fenceTop + 4);
        c.strokeStyle = 'rgba(80,80,90,0.85)';
        c.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          c.beginPath();
          c.moveTo(fenceX - 18, fenceTop + 8 + i * 26);
          c.lineTo(fenceX + 66, fenceTop + 8 + i * 26);
          c.stroke();
        }
        // The throwers: the hero and a friend with the shopping bag
        person(c, mate, 30, groundY + 6, 140, g.won ? 'cheer' : 'idle', s.t);
        rrect(c, 44, groundY - 46, 40, 46, 5);
        c.fillStyle = '#c99a62';
        c.fill();
        item(c, 'baguette', 70, groundY - 52, -1.2);
        const v = velocity();
        person(c, g.hero, 96, groundY + 12, 150, g.won ? 'cheer' : v ? 'point' : 'idle', s.t, { hat: g.hat, flip: false });
        // Item in hand, the aim line while pulling, the item in flight
        if (s.state === 'ready' && !g.done) {
          const back = v ? Math.min(1, v.pull / MAX_PULL) : 0;
          item(c, ITEMS[s.n % ITEMS.length], hand.x - back * 14, hand.y + back * 8, 0);
          if (v && v.pull >= 20) {
            let k = 0;
            fly(hand.x, hand.y, v.vx, v.vy, 0, (x, y) => {
              k++;
              if (k % 6 === 0) circle(c, x, y, 3.5, `rgba(255,255,255,${0.9 - k / 90})`);
              return k > 60 || y > groundY;
            });
          }
        }
        if (s.it && (s.state === 'fly' || s.miss)) item(c, s.it.kind, s.miss ? s.miss.x : s.it.x, s.miss ? Math.min(s.miss.y, groundY) : s.it.y, s.it.rot);
        // Food delivered so far
        for (let i = 0; i < need; i++) circle(c, W / 2 - (need - 1) * 17 + i * 34, H * 0.2, 11, i < s.n ? PAL.mango : 'rgba(255,255,255,0.4)');
      },
      bot() {
        if (g.done || s.state !== 'ready') return null;
        if (!s.drag) return { press: [220, 520] };
        if (!s.moved) {
          // Aim: the throw speed that passes closest to Rudy's hands, at a fixed angle
          const cp = catchPoint();
          let best = null;
          for (let sp = 250; sp <= MAX_PULL * POWER; sp += 4) {
            const vx = sp * Math.cos(-0.95);
            const vy = sp * Math.sin(-0.95);
            let d = Infinity;
            fly(hand.x, hand.y, vx, vy, wind, (x, y) => {
              d = Math.min(d, Math.hypot(x - cp.x, y - cp.y));
              return y > groundY || x > g.W;
            });
            if (!best || d < best.d) best = { d, vx, vy };
          }
          return { move: [220 - best.vx / POWER, 520 - best.vy / POWER] };
        }
        return { release: [s.drag.x, s.drag.y] };
      },
    };
  },
};
