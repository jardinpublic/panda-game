// Bastille, 4 am. Vic dozes on the stairs outside the Supersonic while the
// hero dances inside (seen through the window). A pickpocket in a hoodie creeps
// up and reaches for the passport sticking out of Vic's pocket: TAP to make Vic
// jump awake right then and the thief backs off. Waking him too early is wasted:
// he nods off again and is too drowsy to wake for a moment. Scare the thief off
// two or three times. (The real night: the passport was stolen, and Vic never
// joined Violaine in Australia.)

import { person, rrect, circle, ellipse, vgrad, text, neon, PAL } from '../art.js';

const VIC = 200; // Vic's size
const THIEF = 190;

/** The pickpocket: dark hoodie, face in the shadow of the hood, crouched, facing left. */
function pickpocket(c, x, y, s, t, { reach = 0, hand = null, frozen = false, run = false } = {}) {
  const k = s;
  c.save();
  ellipse(c, x, y, k * 0.16, k * 0.03, 'rgba(0,0,0,0.3)');
  const bob = run ? Math.abs(Math.sin(t * 16)) * k * 0.03 : frozen ? 0 : Math.abs(Math.sin(t * 7)) * k * 0.015;
  const by = y - bob;
  c.lineCap = 'round';
  // Bent legs, on tiptoe
  const step = run ? Math.sin(t * 16) * 0.6 : frozen ? 0 : Math.sin(t * 7) * 0.25;
  c.strokeStyle = '#23252e';
  c.lineWidth = k * 0.07;
  for (const side of [-1, 1]) {
    const a = side * step;
    c.beginPath();
    c.moveTo(x + side * k * 0.04, by - k * 0.26);
    c.lineTo(x - k * 0.06 + Math.sin(a) * k * 0.1, by - k * 0.13);
    c.lineTo(x + side * k * 0.03 + Math.sin(a) * k * 0.12, by);
    c.stroke();
    ellipse(c, x + side * k * 0.03 + Math.sin(a) * k * 0.12 - k * 0.02, by, k * 0.045, k * 0.022, '#e9e6de');
  }
  // Hoodie body, leaning forward (to the left)
  c.save();
  c.translate(x, by - k * 0.26);
  c.rotate(-0.35 - reach * 0.15);
  rrect(c, -k * 0.11, -k * 0.3, k * 0.22, k * 0.32, k * 0.09);
  c.fillStyle = vgrad(c, -k * 0.3, 0, ['#3b3f4d', '#262833']);
  c.fill();
  c.restore();
  // Hood and face in the shadow
  const hx = x - k * 0.17 - reach * k * 0.04;
  const hy = by - k * 0.56;
  circle(c, hx, hy, k * 0.1, '#30333f');
  ellipse(c, hx - k * 0.025, hy + k * 0.01, k * 0.065, k * 0.07, '#14151b');
  // Two shifty eyes, looking at the passport (or away, whistling, when frozen)
  const look = frozen ? k * 0.02 : -k * 0.012;
  circle(c, hx - k * 0.05 + look, hy, k * 0.012, '#f2f2f2');
  circle(c, hx - k * 0.012 + look, hy, k * 0.012, '#f2f2f2');
  // The reaching arm
  const sx = x - k * 0.13;
  const sy = by - k * 0.45;
  const tx = hand ? hand.x : sx - k * 0.12;
  const ty = hand ? hand.y : sy + k * 0.12;
  const ex = sx + (tx - sx) * (frozen ? 0.15 : 0.25 + reach * 0.75);
  const ey = sy + (ty - sy) * (frozen ? 0.15 : 0.25 + reach * 0.75);
  c.strokeStyle = '#2f3240';
  c.lineWidth = k * 0.055;
  c.beginPath();
  c.moveTo(sx, sy);
  c.lineTo(ex, ey);
  c.stroke();
  circle(c, ex, ey, k * 0.03, '#d9a882');
  if (frozen) {
    // Whistling innocently
    text(c, '♪', hx - k * 0.2, hy - k * 0.12 - Math.sin(t * 6) * 6, { size: 22, color: '#cfe8ff', shadow: false });
  }
  c.restore();
  return { x: ex, y: ey };
}

export default {
  id: 'passport',
  world: 'w05',
  input: 'tap',
  base: 8,
  min: 3.8,
  survive: false,
  verb: { en: 'WAKE VIC!', fr: 'RÉVEILLE VIC !' },
  title: { en: 'Wake Vic up!', fr: 'Réveille Vic !' },
  howto: {
    en: 'Bastille, 4 am: Vic dozes on the stairs outside the Supersonic. When the pickpocket reaches for his passport, tap to wake him!',
    fr: '4h du mat à Bastille : Vic pionce sur les marches devant eul’ Supersonic. Quand eul’ pickpocket tend la main vers son passeport, touche pour eul’ réveiller !',
  },
  winLine: { en: 'Passport saved! Australia, here he comes!', fr: 'Eul’ passeport y’est sauvé ! L’Australie l’attend !' },
  rival: ['babar', 'mamar'],
  rivalLine: { en: 'I had a buyer for that passport…', fr: 'J’avais un acheteur pour eul’ passeport…' },
  // Said by the hero on the fail scene: Vic will never make it to Violaine
  loseLine: { en: 'Hoho… Vic can’t fly to Vio now. She’ll destroy him!', fr: 'Hoho… Vic pourra pas r’joindre Vio. Elle va l’détruire !' },
  create(g) {
    const vic = g.cast('victor', 'cous');
    const need = g.speed < 1.9 ? 2 : 3;
    const vicX = 112;
    const feetY = g.H * 0.74;
    const groundY = g.H * 0.86;
    const pass = { x: vicX + VIC * 0.13, y: feetY - VIC * 0.13 };
    const walk = 85 * g.speed;
    const reachT = Math.max(0.5, 0.85 / g.speed);
    const awakeT = 0.55 / g.speed;
    const drowsyT = 0.4 / g.speed;
    const pauseT = 0.25 / g.speed;
    const reachX = pass.x + 110; // the thief's feet when his hand can reach
    const backX = reachX + 110; // where he backs off to
    const s = {
      t: 0,
      vic: 'sleep', // sleep | awake | drowsy
      vt: 0,
      thief: { x: g.W + 40, state: 'come', k: 0, pt: 0 }, // come | reach | flee | pause | run
      repels: 0,
      stolen: false,
      hand: null,
      jolt: 0,
    };

    function wake() {
      s.vic = 'awake';
      s.vt = 0;
      s.jolt = 1;
      g.sfx.pop();
      g.fx.text(vicX + 10, feetY - VIC * 0.98, '!', { size: 34, color: PAL.mango });
      const th = s.thief;
      if (th.state === 'reach') {
        th.state = 'flee';
        s.repels++;
        g.sfx.good();
        g.fx.text(th.x - 40, groundY - THIEF * 0.75, g.tr({ en: 'HEY!', fr: 'HÉ !' }), { size: 30, color: '#ffd84a' });
        g.fx.burst(pass.x + 20, pass.y, { kind: 'spark', n: 14, colors: [PAL.mango, '#fff3c4'] });
        g.fx.shake(4);
        if (s.repels >= need) {
          th.state = 'run';
          g.sfx.hoho();
          g.fx.burst(vicX, feetY - VIC * 0.8, { kind: 'confetti', n: 30 });
          g.say(vicX + 30, feetY - VIC * 0.82, g.tr({ en: 'Huh? What? I wasn’t sleeping!', fr: 'Hein ? Quoi ? J’dormais pas !' }), 1.4);
          g.win();
        }
      }
    }

    return {
      update(dt) {
        s.t += dt;
        s.vt += dt;
        s.jolt = Math.max(0, s.jolt - dt * 4);
        if (s.vic === 'awake' && s.vt >= awakeT) {
          s.vic = 'drowsy';
          s.vt = 0;
        } else if (s.vic === 'drowsy' && s.vt >= drowsyT) {
          s.vic = 'sleep';
          s.vt = 0;
        }
        const th = s.thief;
        th.pt += dt;
        if (th.state === 'run') {
          th.x += 280 * dt;
          return;
        }
        if (g.done) return;
        if (th.state === 'come') {
          // He freezes (and whistles) while Vic is awake
          if (s.vic !== 'awake') th.x -= walk * dt;
          if (th.x <= reachX) {
            th.x = reachX;
            th.state = 'reach';
            th.k = 0;
            g.sfx.tick();
          }
        } else if (th.state === 'reach') {
          th.k += dt / reachT;
          if (th.k >= 1) {
            // Too late: the passport is gone
            s.stolen = true;
            th.state = 'run';
            g.sfx.bad();
            g.fx.flash('rgba(255,60,80,0.4)');
            g.say(vicX + 30, feetY - VIC * 0.82, g.tr({ en: 'My passport!!', fr: 'Mon passeport !!' }), 1.4);
            g.lose();
          }
        } else if (th.state === 'flee') {
          th.x += 320 * g.speed * dt;
          if (th.x >= backX) {
            th.x = backX;
            th.state = 'pause';
            th.pt = 0;
          }
        } else if (th.state === 'pause' && th.pt >= pauseT) {
          th.state = 'come';
        }
      },
      press() {
        if (g.done) return;
        if (s.vic === 'sleep') wake();
        else if (s.vic === 'drowsy') {
          // Too sleepy to react yet
          g.sfx.tap();
          g.fx.text(vicX + 40, feetY - VIC * 0.9, 'Zzz…', { size: 20, color: 'rgba(255,255,255,0.85)' });
        }
      },
      draw(c) {
        const { W, H } = g;
        // Paris at night: stone buildings, lit windows
        c.fillStyle = vgrad(c, 0, H, ['#0f1530', '#272350', '#3a2c55']);
        c.fillRect(0, 0, W, H);
        c.fillStyle = vgrad(c, 70, groundY, ['#4c4766', '#5f5874']);
        c.fillRect(0, 70, W, groundY - 70);
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 5; col++) {
            const x = 18 + col * 78;
            const y = 96 + row * 74;
            const lit = (row * 5 + col) % 3 === 1;
            rrect(c, x, y, 40, 54, 4);
            c.fillStyle = lit ? '#ffd88a' : '#2b2a40';
            c.fill();
            c.fillStyle = 'rgba(30,25,45,0.55)';
            c.fillRect(x - 4, y + 52, 48, 5); // balcony
          }
        }
        // The Supersonic: neon sign and the big window on the dance floor
        rrect(c, 196, H * 0.33, 190, 46, 10);
        c.fillStyle = '#1b1530';
        c.fill();
        neon(c, 'Supersonic', 291, H * 0.33 + 23, 30, PAL.hibiscus, s.t);
        const wx = 210;
        const wy = H * 0.33 + 56;
        const ww = 166;
        const wh = feetY - wy - 40;
        c.save();
        rrect(c, wx, wy, ww, wh, 10);
        c.clip();
        c.fillStyle = vgrad(c, wy, wy + wh, ['#2a0f45', '#170a2b']);
        c.fillRect(wx, wy, ww, wh);
        for (let i = 0; i < 3; i++) {
          const a = Math.sin(s.t * 2.4 + i * 2) * 0.7;
          c.save();
          c.translate(wx + 30 + i * 55, wy);
          c.rotate(a);
          c.fillStyle = [`rgba(239,45,107,0.35)`, `rgba(18,194,201,0.35)`, `rgba(255,178,62,0.35)`][i];
          c.beginPath();
          c.moveTo(-5, 0);
          c.lineTo(5, 0);
          c.lineTo(40, wh);
          c.lineTo(-40, wh);
          c.fill();
          c.restore();
        }
        person(c, g.hero, wx + ww / 2, wy + wh + 10, 140, g.done && g.won ? 'cheer' : 'dance', s.t, { hat: g.hat });
        c.restore();
        c.strokeStyle = '#8b7fa8';
        c.lineWidth = 4;
        rrect(c, wx, wy, ww, wh, 10);
        c.stroke();
        // Metro sign
        c.fillStyle = '#3c3f48';
        c.fillRect(30, H * 0.36, 5, 90);
        circle(c, 32, H * 0.36, 17, '#f2c94c');
        text(c, 'M', 32, H * 0.36 + 1, { size: 20, color: '#1e1a33', shadow: false });
        text(c, 'Bastille', 76, H * 0.36 + 34, { size: 13, color: '#e8e2f2', shadow: false, weight: 600 });
        // Sidewalk and the stairs Vic sleeps on
        c.fillStyle = vgrad(c, feetY, H, ['#6d6878', '#47434f']);
        c.fillRect(0, feetY + 30, W, H - feetY);
        for (let i = 0; i < 3; i++) {
          const y = feetY - 30 + i * 30;
          c.fillStyle = i % 2 ? '#9b95a3' : '#8d8796';
          c.fillRect(0, y, 236 + i * 20, 30);
          c.fillStyle = 'rgba(255,255,255,0.25)';
          c.fillRect(0, y, 236 + i * 20, 3);
        }
        // Street lamp's warm pool
        ellipse(c, 330, groundY + 20, 90, 18, 'rgba(255,214,140,0.18)');

        // Vic: slumped asleep, upright when awake
        const lean = s.vic === 'awake' ? 0.05 * s.jolt : s.vic === 'drowsy' ? -0.1 : -0.22 + Math.sin(s.t * 2) * 0.03;
        c.save();
        c.translate(vicX, feetY);
        c.rotate(lean);
        person(c, vic, 0, 0, VIC, 'sit', s.t, {});
        c.restore();
        if (s.vic !== 'awake' && !(g.done && g.won)) {
          for (let i = 0; i < 3; i++) {
            const p = (s.t * 0.7 + i / 3) % 1;
            text(c, 'z', vicX + 40 + p * 40, feetY - VIC * 0.95 - p * 50, { size: 16 + p * 14, color: `rgba(255,255,255,${0.9 - p * 0.8})`, shadow: false });
          }
        }
        // The passport sticking out of his pocket (glows while the hand goes for it)
        const th = s.thief;
        const danger = th.state === 'reach' ? th.k : 0;
        let px = pass.x;
        let py = pass.y;
        if (s.stolen && s.hand) {
          px = s.hand.x;
          py = s.hand.y;
        }
        if (danger > 0 && !g.done) ellipse(c, px, py, 26 + danger * 12, 18 + danger * 8, `rgba(255,70,90,${0.2 + 0.5 * danger})`);
        c.save();
        c.translate(px, py);
        c.rotate(-0.5);
        rrect(c, -9, -13, 18, 26, 3);
        c.fillStyle = '#7d1f35';
        c.fill();
        circle(c, 0, -2, 4, '#e2bd58');
        c.restore();

        // The pickpocket
        const hand = pickpocket(c, th.x, groundY, THIEF, s.t, {
          reach: th.state === 'reach' ? th.k : 0,
          hand: pass,
          frozen: th.state === 'come' && s.vic === 'awake',
          run: th.state === 'run' || th.state === 'flee',
        });
        if (th.state === 'reach' || s.stolen) s.hand = hand;

        // Scares so far
        for (let i = 0; i < need; i++) circle(c, W / 2 - (need - 1) * 17 + i * 34, H * 0.2, 11, i < s.repels ? PAL.mango : 'rgba(255,255,255,0.22)');
      },
      bot() {
        if (g.done) return null;
        if (s.thief.state === 'reach' && s.thief.k > 0.25 && s.vic === 'sleep') return { press: [200, 400] };
        return null;
      },
    };
  },
};
