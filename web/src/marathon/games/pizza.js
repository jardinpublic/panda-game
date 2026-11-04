// Cous's kitchen during lockdown (world 3): he ordered a pizza every day and the
// empty boxes made a tower that touched the ceiling. A box slides left and
// right on top of the pile; TAP to drop it. It must land on the box below
// (generous at speed 1, tighter later). Every box is one more kilo on Cous's
// bathroom scale: the last one touches the ceiling at 100 kg. A box that
// misses tumbles off and the tower wobbles: lose.

import { rrect, circle, ellipse, PAL, text, shadowed, person, vgrad } from '../art.js';

const BOX_W = 140;
const BOX_H = 26;
const LIFT = 40; // the sliding box floats this high above the pile
const A = 105; // half the slide

/** A closed pizza box seen from the front, its bottom-centre at (x, y). */
function pizzaBox(c, x, y, { rot = 0, seed = 0, alpha = 1 } = {}) {
  c.save();
  c.globalAlpha = alpha;
  c.translate(x, y);
  c.rotate(rot);
  const L = -BOX_W / 2;
  rrect(c, L, -BOX_H, BOX_W, BOX_H, 4);
  c.fillStyle = vgrad(c, -BOX_H, 0, ['#e7c48c', '#c99a5b']);
  c.fill();
  // lid edge and the printed logo on the side
  c.fillStyle = 'rgba(255,245,220,0.55)';
  c.fillRect(L + 3, -BOX_H, BOX_W - 6, 4);
  ellipse(c, L + 34 + (seed % 3) * 26, -BOX_H / 2 + 1, 15, 7, '#d23b2f');
  text(c, "PIZZ'", L + 34 + (seed % 3) * 26, -BOX_H / 2 + 1, { size: 8, color: '#fff3d6', shadow: false });
  if (seed % 2) ellipse(c, L + BOX_W - 30, -BOX_H / 2 + 3, 9, 4, 'rgba(140,80,20,0.35)'); // grease
  c.restore();
}

export default {
  id: 'pizza',
  world: 'w03',
  input: 'tap',
  base: 7,
  min: 3.8,
  survive: false,
  verb: { en: 'STACK IT!', fr: 'EMPILE !' },
  title: { en: 'The Pizza Tower', fr: 'La tour de Pizz’' },
  howto: {
    en: 'Lockdown: Cous orders a pizza every day. Tap to drop each empty box on the pile, up to the ceiling!',
    fr: 'Confinement : Cous commande une pizza tous les jours. Touche pour lâcher chaque boîte sur la pile, jusqu’au plafond !',
  },
  winLine: { en: '100 kg! The ceiling’s touched!', fr: 'Cent kilos ! Eul’ plafond y’est touché !' },
  rival: ['mamar', 'babar'],
  rivalLine: { en: 'You could’ve saved me a slice…', fr: 'Te m’aurais gardé une part…' },
  loseLine: { en: 'Hoho… the Pizza Tower fell down.', fr: 'Hoho… la tour de Pizz’ s’est écroulée.' },
  create(g) {
    const { W, H } = g;
    // Cous is the one on the scale; if he is the hero, a friend helps.
    const mate = g.hero === 'cous' ? g.friend() : g.hero;
    const need = g.speed < 1.45 ? 5 : g.speed < 2 ? 6 : 7;
    const tol = Math.max(30, 62 - 12 * g.speed); // max centre offset that still sticks
    const v = 200 * Math.pow(g.speed, 0.85);
    const gravity = 2400 * g.speed;
    const floorY = H * 0.88;
    const ceilY = 150;
    // The old pile already reaches high: `need` more boxes touch the ceiling.
    const old = Math.round((floorY - ceilY) / BOX_H) - need;
    const stack = [];
    for (let i = 0; i < old; i++) stack.push({ x: 200 + (g.random() - 0.5) * 12, y: floorY - i * BOX_H, seed: i });
    const s = { t: 0, cur: null, wait: 0.25 / g.speed, placed: 0, wobble: 0, wobbleDir: 1, lost: null, kgPop: 0, dust: 0, timeoutSaid: false };

    const topOf = () => stack[stack.length - 1];
    const stackTopY = () => topOf().y - BOX_H;
    const kg = () => 100 - need + s.placed;

    function spawn() {
      const center = Math.max(150, Math.min(250, topOf().x));
      const side = g.random() < 0.5 ? -1 : 1;
      s.cur = { center, u: side * 0.75, dir: -side, x: center + side * A * 0.75, y: stackTopY() - LIFT, vy: 0, state: 'slide', seed: stack.length };
      g.sfx.whoosh();
    }

    return {
      update(dt) {
        s.t += dt;
        s.wobble = Math.max(0, s.wobble - dt * 2.5);
        s.kgPop = Math.max(0, s.kgPop - dt * 2);
        if (s.dust) s.dust += dt;
        if (!g.done && !s.cur && s.placed < need) {
          s.wait -= dt;
          if (s.wait <= 0) spawn();
        }
        const cur = s.cur;
        if (cur && cur.state === 'slide' && !g.done) {
          cur.u += (cur.dir * v * dt) / A;
          if (cur.u > 1) { cur.u = 2 - cur.u; cur.dir = -1; }
          if (cur.u < -1) { cur.u = -2 - cur.u; cur.dir = 1; }
          cur.x = cur.center + cur.u * A;
          cur.y = stackTopY() - LIFT + Math.sin(s.t * 6) * 3;
        } else if (cur && cur.state === 'fall') {
          cur.vy += gravity * dt;
          cur.y += cur.vy * dt;
          const land = stackTopY();
          if (cur.y >= land) {
            cur.y = land;
            const off = cur.x - topOf().x;
            if (Math.abs(off) <= tol) {
              stack.push({ x: cur.x, y: land, seed: cur.seed });
              s.cur = null;
              s.placed++;
              s.wait = 0.12 / g.speed;
              s.wobble = 0.4 + Math.abs(off) / tol;
              s.wobbleDir = Math.sign(off) || 1;
              s.kgPop = 1;
              g.sfx.pop();
              g.fx.text(150, floorY - 30, '+1 kg', { size: 20, color: PAL.mango });
              if (s.placed >= need) {
                // The last box hits the ceiling: plaster dust, Cous at 100 kg.
                s.dust = 0.001;
                g.sfx.good();
                g.sfx.coin();
                g.fx.shake(8);
                g.fx.burst(cur.x, ceilY, { kind: 'smoke', n: 18, colors: ['#f4efe6', '#ddd5c8'], speed: 140 });
                g.fx.burst(200, H * 0.45, { kind: 'confetti', n: 40 });
                g.say(80, floorY - 170, g.tr({ en: '100 kg! The ceiling’s touched!', fr: 'Cent kilos ! Eul’ plafond y’est touché !' }), 1.6);
                g.win();
              } else {
                g.sfx.tick();
                const nice = Math.abs(off) < tol * 0.35;
                if (nice) g.fx.text(cur.x + 80, land - 24, g.tr({ en: 'Perfect!', fr: 'Parfait !' }), { size: 20, color: PAL.cream });
              }
            } else {
              // Misses: tips off the pile and tumbles to the floor.
              cur.state = 'tumble';
              cur.vx = Math.sign(off || 1) * 170;
              cur.vy = -200;
              cur.rot = 0;
              s.lost = cur;
              s.cur = null;
              s.wobble = 1.6;
              s.wobbleDir = Math.sign(off) || 1;
              g.sfx.bad();
              g.fx.shake(10);
              g.say(80, floorY - 170, g.tr({ en: 'My tower!!', fr: 'Ma tour !!' }), 1.5);
              g.lose();
            }
          }
        }
        const lost = s.lost;
        if (lost) {
          lost.vy += 1600 * dt;
          lost.x += lost.vx * dt;
          lost.y = Math.min(floorY, lost.y + lost.vy * dt);
          if (lost.y < floorY) lost.rot += Math.sign(lost.vx) * dt * 5;
        }
        if (g.done && !g.won && !s.lost && !s.timeoutSaid) {
          s.timeoutSaid = true;
          g.sfx.bad();
          g.say(80, floorY - 170, g.tr({ en: 'Too slow… still hungry!', fr: 'Trop lent… j’ai encore faim !' }), 1.4);
        }
      },
      press() {
        const cur = s.cur;
        if (!cur || cur.state !== 'slide' || g.done) return;
        cur.state = 'fall';
        cur.vy = 0;
        g.sfx.tap();
      },
      draw(c) {
        // Kitchen wall, tiles behind the counter, a window on the empty street.
        c.fillStyle = vgrad(c, 0, floorY, ['#f3dcc0', '#eccba6']);
        c.fillRect(0, 0, W, floorY);
        c.fillStyle = 'rgba(255,255,255,0.35)';
        for (let r = 0; r < 5; r++) for (let k = 0; k < 9; k++) if ((r + k) % 2) c.fillRect(k * 46, floorY - 240 + r * 30, 44, 28);
        shadowed(c, () => {
          rrect(c, 250, 200, 120, 130, 12);
          c.fillStyle = '#9fd8f0';
          c.fill();
        }, 10, 4);
        c.fillStyle = 'rgba(255,255,255,0.8)';
        c.fillRect(306, 200, 8, 130);
        c.fillRect(250, 262, 120, 8);
        // The fridge with the lockdown form stuck on it.
        shadowed(c, () => {
          rrect(c, 8, floorY - 330, 96, 330, 14);
          c.fillStyle = vgrad(c, floorY - 330, floorY, ['#f7f8fa', '#d7dbe3']);
          c.fill();
        }, 12, 5);
        c.fillStyle = 'rgba(0,0,0,0.12)';
        c.fillRect(10, floorY - 210, 92, 3);
        rrect(c, 84, floorY - 300, 8, 60, 4);
        c.fillStyle = '#b9bfcb';
        c.fill();
        c.save();
        c.translate(46, floorY - 270);
        c.rotate(-0.06);
        c.fillStyle = '#ffffff';
        c.fillRect(-24, -30, 48, 62);
        c.fillStyle = 'rgba(40,50,80,0.5)';
        for (let i = 0; i < 6; i++) c.fillRect(-18, -18 + i * 8, i === 0 ? 36 : 28 - (i % 3) * 6, 3);
        text(c, 'ATTESTATION', 0, -24, { size: 6, color: '#2a3f8f', shadow: false });
        circle(c, 0, -32, 4, PAL.hibiscus);
        c.restore();
        // Ceiling with its lamp; it gets a crack and dust when the tower hits it.
        c.fillStyle = vgrad(c, 0, ceilY, ['#d9cfc0', '#f1e9dc']);
        c.fillRect(0, 0, W, ceilY);
        c.fillStyle = 'rgba(120,100,80,0.25)';
        c.fillRect(0, ceilY - 4, W, 4);
        c.strokeStyle = '#8b7a66';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(340, ceilY);
        c.lineTo(340, ceilY + 40);
        c.stroke();
        ellipse(c, 340, ceilY + 48, 22, 12, '#ffd56b');
        if (s.dust) {
          c.strokeStyle = '#7a6a58';
          c.lineWidth = 2.5;
          c.beginPath();
          const cx = topOf().x;
          c.moveTo(cx - 30, ceilY - 2);
          c.lineTo(cx - 10, ceilY - 18);
          c.lineTo(cx + 6, ceilY - 6);
          c.lineTo(cx + 34, ceilY - 26);
          c.stroke();
        }
        // Floor.
        c.fillStyle = vgrad(c, floorY, H, ['#b98a5e', '#94673f']);
        c.fillRect(0, floorY, W, H - floorY);
        c.fillStyle = 'rgba(255,255,255,0.12)';
        for (let i = 0; i < 6; i++) c.fillRect(0, floorY + 12 + i * 24, W, 2);

        // The tower: it sways around its foot when a box lands off-centre.
        const sway = Math.sin(s.wobble * 9) * s.wobble * 0.018 * s.wobbleDir;
        c.save();
        c.translate(200, floorY);
        c.rotate(sway);
        c.translate(-200, -floorY);
        for (const b of stack) pizzaBox(c, b.x, b.y, { seed: b.seed });
        c.restore();
        // The sliding box, with its drop guide.
        const cur = s.cur;
        if (cur) {
          if (cur.state === 'slide' && !g.done) {
            const ok = Math.abs(cur.x - topOf().x) <= tol;
            c.fillStyle = ok ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.14)';
            c.fillRect(cur.x - BOX_W / 2, cur.y, BOX_W, stackTopY() - cur.y);
          }
          pizzaBox(c, cur.x, cur.y, { seed: cur.seed });
        }
        if (s.lost) pizzaBox(c, s.lost.x, s.lost.y, { rot: s.lost.rot, seed: s.lost.seed });

        // Cous on his bathroom scale, the mate cheering on the other side.
        const won = g.done && g.won;
        shadowed(c, () => {
          rrect(c, 22, floorY - 14, 96, 18, 8);
          c.fillStyle = '#eef1f6';
          c.fill();
        }, 8, 3);
        person(c, 'cous', 70, floorY - 12, 150, g.done ? (won ? 'cheer' : 'sad') : 'idle', s.t, { hat: g.hero === 'cous' ? g.hat : 'none' });
        const pop = 1 + s.kgPop * 0.3;
        rrect(c, 46, floorY - 4, 48, 18, 5);
        c.fillStyle = kg() >= 100 ? PAL.hibiscus : '#2a3346';
        c.fill();
        text(c, `${kg()} kg`, 70, floorY + 5, { size: 12 * pop, color: kg() >= 100 ? '#fff' : '#7dffb0', shadow: false });
        person(c, mate, 340, floorY, 150, g.done ? (won ? 'dance' : 'sad') : 'point', s.t + 1, { flip: true, hat: mate === g.hero ? g.hat : 'none' });

        // Boxes left to go.
        if (!g.done) text(c, `🍕 ×${need - s.placed}`, 62, ceilY + 36, { size: 24, color: PAL.cream, stroke: '#d23b2f' });
      },
      bot() {
        const cur = s.cur;
        if (!cur || cur.state !== 'slide') return null;
        return Math.abs(cur.x - topOf().x) < tol * 0.35 ? { press: [200, g.H / 2] } : null;
      },
    };
  },
};
