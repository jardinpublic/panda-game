// Greg's XXL burger (world 7): Greg lives in the USA, where everything is
// XXL. Layers slide left and right above the stack; TAP to drop each one. It
// must land overlapping the layer below (generous at speed 1, tighter later).
// Fill it up, then the top bun with a little flag pick: "That's a SMALL in
// the US!". A layer that misses tumbles off the plate: lose.

import { rrect, circle, ellipse, PAL, text, shadowed, person, vgrad, sky, neon } from '../art.js';

const FILLINGS = ['cheese', 'lettuce', 'tomato', 'bacon', 'patty', 'onion'];
const SHAPE = {
  bottom: { h: 26, w: 156 },
  patty: { h: 26, w: 150 },
  cheese: { h: 10, w: 160 },
  lettuce: { h: 14, w: 168 },
  tomato: { h: 12, w: 140 },
  bacon: { h: 12, w: 162 },
  onion: { h: 10, w: 142 },
  top: { h: 50, w: 158 },
};

/** Draws a layer whose bottom-centre is (x, y). */
function layer(c, type, x, y, t, { rot = 0, flag = 0 } = {}) {
  const { h, w } = SHAPE[type];
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  const L = -w / 2;
  if (type === 'bottom') {
    shadowed(c, () => {
      rrect(c, L, -h, w, h, 12);
      c.fillStyle = vgrad(c, -h, 0, ['#f2b25e', '#d98a3a']);
      c.fill();
    }, 10, 4);
    c.fillStyle = 'rgba(255,240,200,0.6)';
    c.fillRect(L + 6, -h, w - 12, 5);
  } else if (type === 'patty') {
    shadowed(c, () => {
      rrect(c, L, -h, w, h, 13);
      c.fillStyle = vgrad(c, -h, 0, ['#7a4228', '#4d2614']);
      c.fill();
    }, 8, 3);
    for (let i = 0; i < 11; i++) circle(c, L + 10 + i * 12.5, -h / 2 + ((i * 7) % 9) - 4, 2.2, 'rgba(30,12,5,0.55)');
    ellipse(c, L + w * 0.3, -h + 6, w * 0.2, 3, 'rgba(255,200,160,0.25)');
  } else if (type === 'cheese') {
    c.fillStyle = '#ffc93c';
    rrect(c, L, -h, w, h, 4);
    c.fill();
    for (const dx of [L + 14, L + w * 0.45, L + w - 22]) {
      c.beginPath();
      c.moveTo(dx - 9, -1);
      c.quadraticCurveTo(dx, 18 + Math.sin(t * 2 + dx) * 2, dx + 9, -1);
      c.fill();
    }
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.fillRect(L + 6, -h + 2, w - 12, 2);
  } else if (type === 'lettuce') {
    c.fillStyle = '#5fd06a';
    c.beginPath();
    c.moveTo(L, -h / 2);
    for (let i = 0; i <= 12; i++) c.lineTo(L + (w * i) / 12, -h + (i % 2 ? 0 : 6));
    for (let i = 12; i >= 0; i--) c.lineTo(L + (w * i) / 12, (i % 2 ? 2 : -3));
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(220,255,210,0.6)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(L + 10, -h / 2);
    c.lineTo(L + w - 10, -h / 2);
    c.stroke();
  } else if (type === 'tomato') {
    for (const dx of [-w * 0.25, w * 0.25]) {
      ellipse(c, dx, -h / 2, w * 0.26, h / 2 + 1, '#e8413c');
      ellipse(c, dx, -h / 2, w * 0.2, h / 2 - 2, '#ff7a6b');
      for (let k = -1; k <= 1; k++) circle(c, dx + k * 10, -h / 2, 2, '#ffe1a8');
    }
  } else if (type === 'bacon') {
    for (let k = 0; k < 2; k++) {
      c.fillStyle = k ? '#e98a7a' : '#b8473a';
      c.beginPath();
      for (let i = 0; i <= 16; i++) {
        const xx = L + (w * i) / 16;
        const yy = -h + k * 5 + Math.sin(i * 1.3 + t * 3) * 3;
        if (i === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy);
      }
      for (let i = 16; i >= 0; i--) c.lineTo(L + (w * i) / 16, -h + k * 5 + 7 + Math.sin(i * 1.3 + t * 3) * 3);
      c.fill();
    }
  } else if (type === 'onion') {
    for (let k = 0; k < 4; k++) {
      c.strokeStyle = k % 2 ? '#e9c6f0' : '#c98fd6';
      c.lineWidth = 4;
      c.beginPath();
      c.ellipse(L + 22 + k * 33, -h / 2, 18, h / 2, 0, 0, Math.PI * 2);
      c.stroke();
    }
  } else if (type === 'top') {
    shadowed(c, () => {
      c.beginPath();
      c.moveTo(L, 0);
      c.bezierCurveTo(L, -h * 1.25, L + w, -h * 1.25, L + w, 0);
      c.closePath();
      const gr = c.createRadialGradient(-w * 0.15, -h * 0.75, 4, 0, -h * 0.4, w * 0.6);
      gr.addColorStop(0, '#ffcf7a');
      gr.addColorStop(0.6, '#eb9a42');
      gr.addColorStop(1, '#c87628');
      c.fillStyle = gr;
      c.fill();
    }, 10, 4);
    for (let i = 0; i < 12; i++) {
      const sx = L + 18 + ((i * 47) % (w - 36));
      const sy = -h * 0.4 - ((i * 23) % 26);
      ellipse(c, sx, sy, 4, 2.2, '#fff4d6', (i % 3) * 0.5);
    }
    ellipse(c, -w * 0.18, -h * 0.72, w * 0.18, 6, 'rgba(255,255,255,0.35)', -0.15);
    if (flag > 0) {
      // Toothpick with a little stars-and-stripes flag.
      const up = Math.min(1, flag * 4);
      const fy = -h * 0.92 - 70 * up;
      c.strokeStyle = '#e8d2a0';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(0, -h * 0.6);
      c.lineTo(0, fy);
      c.stroke();
      const wave = Math.sin(t * 8) * 3;
      c.save();
      c.translate(2, fy);
      for (let r = 0; r < 5; r++) {
        c.fillStyle = r % 2 ? '#ffffff' : '#d7263d';
        c.fillRect(0, r * 5 + (r > 2 ? wave * 0.3 : 0), 44, 5);
      }
      c.fillStyle = '#2a3f8f';
      c.fillRect(0, 0, 18, 15);
      for (let k = 0; k < 4; k++) circle(c, 4 + (k % 2) * 9, 4 + Math.floor(k / 2) * 7, 1.6, '#fff');
      c.restore();
    }
  }
  c.restore();
}

function giantSoda(c, x, y, t) {
  // A cup the size of a person: "medium" in the US.
  const w = 84;
  const h = 230;
  c.save();
  shadowed(c, () => {
    c.beginPath();
    c.moveTo(x - w / 2, y - h);
    c.lineTo(x + w / 2, y - h);
    c.lineTo(x + w * 0.38, y);
    c.lineTo(x - w * 0.38, y);
    c.closePath();
    c.fillStyle = '#ffffff';
    c.fill();
  }, 14, 6);
  c.clip();
  c.fillStyle = '#d7263d';
  for (let i = -3; i < 6; i++) {
    c.beginPath();
    c.moveTo(x - w / 2 + i * 26, y - h);
    c.lineTo(x - w / 2 + i * 26 + 13, y - h);
    c.lineTo(x - w / 2 + i * 26 + 33, y);
    c.lineTo(x - w / 2 + i * 26 + 20, y);
    c.fill();
  }
  c.restore();
  rrect(c, x - w / 2 - 6, y - h - 14, w + 12, 16, 8);
  c.fillStyle = '#f2f2f6';
  c.fill();
  c.strokeStyle = '#ff6f61';
  c.lineWidth = 8;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x + 6, y - h - 10);
  c.lineTo(x + 26, y - h - 90);
  c.lineTo(x + 52, y - h - 104);
  c.stroke();
  text(c, 'XXL', x, y - h * 0.5, { size: 26, color: '#2a3f8f', stroke: '#fff' });
}

export default {
  id: 'burger',
  world: 'w07',
  input: 'tap',
  base: 7,
  min: 3.8,
  survive: false,
  verb: { en: 'STACK IT!', fr: 'EMPILE !' },
  title: { en: "Greg's XXL burger", fr: 'Eul’ burger XXL de Greg' },
  howto: { en: 'Tap to drop each layer onto the burger. Miss the stack and it falls off!', fr: 'Touche pour lâcher chaque étage sur eul’ burger. Si te rates la pile, ça tombe !' },
  winLine: { en: "That's a SMALL in the US!", fr: 'Aux USA, ça c\'est une SMALL !' },
  rival: ["greg", "romain"],
  rivalLine: { en: "In the US, we'd make it bigger.", fr: "Aux States, on l'aurait fait plus gros." },
  loseLine: { en: "Hoho, my XXL burger!", fr: "Hoho, mon burger XXL !" },
  create(g) {
    const greg = g.cast('greg', 'romain');
    const need = g.boss ? 6 : g.speed < 1.45 ? 4 : g.speed < 2 ? 5 : 6;
    const tol = Math.max(32, 72 - 15 * g.speed); // max centre offset that still sticks
    const v = 230 * Math.pow(g.speed, 0.85);
    const A = 125;
    const lift = 100;
    const gravity = 2600 * g.speed;
    const baseY = g.H * 0.8;

    // Queue: a patty first, then random fillings (never twice in a row), then the top bun.
    const queue = ['patty'];
    while (queue.length < need) {
      const last = queue[queue.length - 1];
      const opts = FILLINGS.filter((f) => f !== last);
      queue.push(opts[Math.floor(g.random() * opts.length)]);
    }
    queue.push('top');

    const stack = [{ type: 'bottom', x: 200, y: baseY }];
    const s = { t: 0, cur: null, wait: 0.25 / g.speed, bounce: 0, flag: 0, lost: null, timeoutSaid: false, placed: 0 };

    function topOf() {
      return stack[stack.length - 1];
    }
    function stackTopY() {
      const top = topOf();
      return top.y - SHAPE[top.type].h;
    }
    function spawn() {
      const type = queue[stack.length - 1];
      const center = Math.max(130, Math.min(270, topOf().x));
      const side = g.random() < 0.5 ? -1 : 1;
      s.cur = { type, center, u: side * 0.7, dir: -side, x: center + side * A * 0.7, y: stackTopY() - lift, vy: 0, state: 'slide' };
      g.sfx.whoosh();
    }

    return {
      update(dt) {
        s.t += dt;
        s.bounce = Math.max(0, s.bounce - dt * 4);
        if (s.flag) s.flag += dt;
        if (!g.done && !s.cur && s.placed < queue.length) {
          s.wait -= dt;
          if (s.wait <= 0) spawn();
        }
        const cur = s.cur;
        if (cur && cur.state === 'slide' && !g.done) {
          cur.u += (cur.dir * v * dt) / A;
          if (cur.u > 1) { cur.u = 2 - cur.u; cur.dir = -1; }
          if (cur.u < -1) { cur.u = -2 - cur.u; cur.dir = 1; }
          cur.x = cur.center + cur.u * A;
          cur.y = stackTopY() - lift + Math.sin(s.t * 6) * 3;
        } else if (cur && cur.state === 'fall') {
          cur.vy += gravity * dt;
          cur.y += cur.vy * dt;
          const land = stackTopY();
          if (cur.y >= land) {
            cur.y = land;
            const off = cur.x - topOf().x;
            if (Math.abs(off) <= tol) {
              stack.push({ type: cur.type, x: cur.x, y: land });
              s.cur = null;
              s.placed++;
              s.wait = 0.12 / g.speed;
              s.bounce = 1;
              g.sfx.pop();
              const nice = Math.abs(off) < tol * 0.35;
              g.fx.burst(cur.x, land, { kind: 'spark', n: nice ? 14 : 7, colors: [PAL.mango, '#fff3c4', '#ffffff'], speed: 160 });
              g.fx.text(cur.x + 70, land - 30, nice ? g.tr({ en: 'Perfect!', fr: 'Parfait !' }) : 'XL!', { size: nice ? 24 : 20, color: nice ? PAL.mango : PAL.cream });
              if (cur.type === 'top') {
                s.flag = 0.001;
                g.sfx.hoho();
                g.sfx.coin();
                g.fx.burst(200, land - 60, { kind: 'confetti', n: 40, colors: ['#d7263d', '#ffffff', '#2a3f8f', PAL.mango] });
                g.fx.shake(6);
                g.say(330, baseY - 110, g.tr({ en: "That's a SMALL in the US!", fr: 'Aux USA, ça c\'est une SMALL !' }), 1.6);
                g.win();
              } else {
                g.sfx.tick();
              }
            } else {
              // Misses: tips over the edge and tumbles off the counter.
              cur.state = 'tumble';
              cur.vx = Math.sign(off || 1) * 180;
              cur.vy = -260;
              cur.rot = 0;
              s.lost = cur;
              g.sfx.bad();
              g.fx.shake(10);
              g.fx.burst(cur.x, land, { kind: 'drop', n: 14, colors: ['#ffc93c', '#e8413c', '#5fd06a'], speed: 200 });
              g.say(330, baseY - 110, g.tr({ en: 'Nooo! My XXL burger!', fr: 'Nooon ! Mon burger XXL !' }), 1.5);
              g.lose();
            }
          }
        } else if (cur && cur.state === 'tumble') {
          cur.vy += 1800 * dt;
          cur.x += cur.vx * dt;
          cur.y += cur.vy * dt;
          cur.rot += Math.sign(cur.vx) * dt * 6;
        }
        if (g.done && !g.won && !s.lost && !s.timeoutSaid) {
          s.timeoutSaid = true;
          g.sfx.bad();
          g.say(330, baseY - 110, g.tr({ en: "Too slow! I'm starving!", fr: "Trop lent ! J'ai trop faim !" }), 1.4);
        }
      },
      press() {
        const cur = s.cur;
        if (!cur || cur.state !== 'slide') return;
        cur.state = 'fall';
        cur.vy = 0;
        g.sfx.tap();
      },
      draw(c) {
        const W = g.W;
        const H = g.H;
        // Retro-modern American diner: pastel wall, neon, chrome counter.
        sky(c, W, H, ['#ffd7c2', '#ffb8b0', '#f59bb0']);
        c.fillStyle = 'rgba(18,194,201,0.85)';
        c.fillRect(0, H * 0.34, W, 16);
        c.fillStyle = 'rgba(255,255,255,0.7)';
        c.fillRect(0, H * 0.34 + 16, W, 4);
        // Window to a big sky with a tiny Martinique postcard on the wall.
        shadowed(c, () => {
          rrect(c, 22, 92, 150, 110, 18);
          c.fillStyle = '#7fd3ef';
          c.fill();
        }, 12, 4);
        ellipse(c, 70, 130, 26, 9, 'rgba(255,255,255,0.8)');
        ellipse(c, 130, 160, 30, 8, 'rgba(255,255,255,0.7)');
        rrect(c, 22, 92, 150, 110, 18);
        c.strokeStyle = '#e6e9f0';
        c.lineWidth = 6;
        c.stroke();
        neon(c, 'DINER', 290, 120, 44, PAL.hibiscus, s.t);
        neon(c, '★ XXL ★', 290, 172, 24, PAL.lagoon, s.t + 3);
        // Checkered floor.
        const floorY = baseY + 60;
        c.fillStyle = '#f4f0ea';
        c.fillRect(0, floorY, W, H - floorY);
        for (let r = 0; r < 8; r++) for (let k = 0; k < 10; k++) if ((r + k) % 2) {
          c.fillStyle = 'rgba(40,30,60,0.75)';
          c.fillRect(k * 40, floorY + r * 30, 40, 30);
        }
        // Greg and the hero behind the counter.
        const won = g.done && g.won;
        person(c, g.hero, 58, baseY + 70, 150, g.done ? (won ? 'cheer' : 'sad') : 'idle', s.t, { hat: g.hat });
        giantSoda(c, 372, baseY + 18, s.t);
        person(c, greg, 322, baseY + 70, 160, g.done ? (won ? 'dance' : 'point') : 'point', s.t + 1, { flip: true, hat: 'party' });
        // Counter.
        shadowed(c, () => {
          rrect(c, -10, baseY + 8, W + 20, 26, 8);
          c.fillStyle = vgrad(c, baseY + 8, baseY + 34, ['#f3f6fb', '#b9c2d3']);
          c.fill();
        }, 12, 5);
        c.fillStyle = vgrad(c, baseY + 34, floorY, ['#12c2c9', '#0a8fb0']);
        c.fillRect(0, baseY + 34, W, floorY - baseY - 34);
        c.fillStyle = 'rgba(255,255,255,0.25)';
        for (let i = 0; i < 8; i++) c.fillRect(i * 52 + 10, baseY + 40, 6, floorY - baseY - 46);
        // Plate and the burger stack (it bounces when a layer lands).
        ellipse(c, 200, baseY + 4, 108, 16, '#ffffff');
        ellipse(c, 200, baseY + 2, 86, 10, '#eef1f6');
        const sq = 1 - Math.sin(s.bounce * Math.PI) * 0.06;
        c.save();
        c.translate(0, baseY);
        c.scale(1, sq);
        c.translate(0, -baseY);
        for (const l of stack) layer(c, l.type, l.x, l.y, s.t, { flag: l.type === 'top' ? s.flag : 0 });
        c.restore();
        // The sliding layer, with its drop guide.
        const cur = s.cur;
        if (cur && cur.state !== 'tumble') {
          if (cur.state === 'slide') {
            const ok = Math.abs(cur.x - topOf().x) <= tol;
            c.fillStyle = ok ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.14)';
            c.fillRect(cur.x - SHAPE[cur.type].w / 2, cur.y, SHAPE[cur.type].w, stackTopY() - cur.y);
          }
          layer(c, cur.type, cur.x, cur.y, s.t);
        }
        if (s.lost) layer(c, s.lost.type, s.lost.x, s.lost.y, s.t, { rot: s.lost.rot });
        // Layers left to go.
        if (!g.done) {
          const left = queue.length - s.placed;
          text(c, `🍔 ×${left}`, 200, Math.max(110, stackTopY() - lift - 70), { size: 24, color: PAL.cream, stroke: PAL.hibiscus });
        }
      },
      bot() {
        const cur = s.cur;
        if (!cur || cur.state !== 'slide') return null;
        return Math.abs(cur.x - topOf().x) < tol * 0.35 ? { press: [200, g.H / 2] } : null;
      },
    };
  },
};
