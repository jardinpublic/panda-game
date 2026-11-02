// Le Molière's door (world 5): a huge bouncer slides left and right in front
// of the door like a goalkeeper. TAP to dash the hero inside while the door is
// clear. Bump into him = "Not tonight!". Tell: before he sets off again he
// crouches, leans the way he will go, his shades glint and the ti-bwa ticks;
// the carpet glow fades at the same moment.

import { person, rrect, circle, ellipse, vgrad, shadowed, text, neon, palm, sky, groundShadow, PAL } from '../art.js';

const SIDES = [72, 328]; // bouncer patrol ends
const BLOCK = 98; // |bouncer x - door centre| under this blocks the dash
const DOOR_X = 200;

const smooth = (u) => u * u * (3 - 2 * u);
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** A generic big bouncer (not one of the friends), feet at (x, y). */
function bouncer(c, x, y, t, { lean = 0, squash = 1, glint = 0, arms = 'down' } = {}) {
  const skin = '#9a6646';
  c.save();
  groundShadow(c, x, y, 170);
  c.translate(x, y);
  c.rotate(lean);
  c.scale(1, squash);
  // Legs and shoes.
  c.fillStyle = '#17171f';
  rrect(c, -50, -112, 44, 112, 16);
  c.fill();
  rrect(c, 6, -112, 44, 112, 16);
  c.fill();
  ellipse(c, -30, -4, 32, 11, '#08080c');
  ellipse(c, 30, -4, 32, 11, '#08080c');
  ellipse(c, -38, -8, 10, 3, 'rgba(255,255,255,0.25)');
  ellipse(c, 22, -8, 10, 3, 'rgba(255,255,255,0.25)');
  // Massive jacket.
  shadowed(c, () => {
    c.fillStyle = vgrad(c, -260, -100, ['#34343f', '#15151c']);
    c.beginPath();
    c.moveTo(-96, -238);
    c.quadraticCurveTo(0, -262, 96, -238);
    c.quadraticCurveTo(110, -170, 64, -100);
    c.lineTo(-64, -100);
    c.quadraticCurveTo(-110, -170, -96, -238);
    c.closePath();
    c.fill();
  }, 18, 8);
  // Shirt V, tie and lapels.
  c.fillStyle = '#f4f4f8';
  c.beginPath();
  c.moveTo(-22, -246);
  c.lineTo(22, -246);
  c.lineTo(0, -180);
  c.closePath();
  c.fill();
  c.fillStyle = '#0b0b10';
  c.beginPath();
  c.moveTo(-6, -240);
  c.lineTo(6, -240);
  c.lineTo(8, -196);
  c.lineTo(0, -186);
  c.lineTo(-8, -196);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.07)';
  c.beginPath();
  c.moveTo(-22, -246);
  c.lineTo(0, -180);
  c.lineTo(-40, -150);
  c.lineTo(-60, -236);
  c.closePath();
  c.fill();
  circle(c, 52, -214, 6, '#f0c040'); // badge
  // Arms.
  c.lineCap = 'round';
  c.strokeStyle = '#22222b';
  c.lineWidth = 40;
  if (arms === 'cross') {
    for (const side of [-1, 1]) {
      c.beginPath();
      c.moveTo(side * 86, -226);
      c.quadraticCurveTo(side * 100, -170, side * -30, -176);
      c.stroke();
    }
    circle(c, -40, -176, 17, skin);
    circle(c, 40, -176, 17, skin);
  } else if (arms === 'stop') {
    c.beginPath();
    c.moveTo(-86, -226);
    c.lineTo(-104, -128);
    c.stroke();
    circle(c, -104, -122, 18, skin);
    c.beginPath();
    c.moveTo(86, -226);
    c.lineTo(132, -300);
    c.stroke();
    ellipse(c, 136, -318, 22, 26, skin);
  } else {
    for (const side of [-1, 1]) {
      c.beginPath();
      c.moveTo(side * 86, -226);
      c.lineTo(side * (104 + Math.sin(t * 2) * 2), -128);
      c.stroke();
      circle(c, side * 104, -122, 18, skin);
    }
  }
  // Neck and bald head.
  rrect(c, -26, -282, 52, 44, 14);
  c.fillStyle = skin;
  c.fill();
  circle(c, -44, -304, 11, '#8a583b');
  circle(c, 44, -304, 11, '#8a583b');
  const hg = c.createRadialGradient(-12, -330, 6, 0, -306, 48);
  hg.addColorStop(0, '#c08560');
  hg.addColorStop(1, '#7c4e33');
  c.beginPath();
  c.ellipse(0, -306, 44, 50, 0, 0, Math.PI * 2);
  c.fillStyle = hg;
  c.fill();
  ellipse(c, -14, -338, 14, 7, 'rgba(255,255,255,0.32)', -0.3);
  // Shades.
  c.fillStyle = '#0d0d14';
  rrect(c, -38, -318, 34, 18, 7);
  c.fill();
  rrect(c, 4, -318, 34, 18, 7);
  c.fill();
  c.fillRect(-6, -314, 12, 4);
  c.fillStyle = 'rgba(120,200,255,0.35)';
  c.fillRect(-32, -315, 10, 4);
  c.fillRect(10, -315, 10, 4);
  if (glint > 0) {
    c.save();
    c.translate(28, -314);
    c.rotate(t * 6);
    c.globalAlpha = glint;
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) {
      c.rotate(Math.PI / 2);
      c.beginPath();
      c.moveTo(0, -3);
      c.lineTo(14, 0);
      c.lineTo(0, 3);
      c.fill();
    }
    c.restore();
  }
  // Stern mouth and earpiece.
  c.strokeStyle = '#3a2216';
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(-14, -276);
  c.quadraticCurveTo(0, -280, 14, -276);
  c.stroke();
  c.strokeStyle = 'rgba(220,230,240,0.8)';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(48, -300);
  c.bezierCurveTo(60, -280, 40, -270, 54, -246);
  c.stroke();
  c.restore();
}

export default {
  id: 'bouncer',
  world: 'w05',
  input: 'tap',
  base: 4,
  survive: false,
  verb: { en: 'GET IN!', fr: 'RENTRE !' },
  title: { en: "The bouncer", fr: "Eul’ videur" },
  howto: { en: "The bouncer slides in front of the door. Tap to dash in when the way is clear.", fr: "Eul’ videur bouge devant la porte. Touche pour foncer quand eul’ passage est libre." },
  winLine: { en: "You're in!", fr: "T'es dedans !" },
  rival: ["victor", "babar"],
  rivalLine: { en: "Who let him in?!", fr: "Qui l'a laissé entrer ?!" },
  loseLine: { en: "Hoho, do you know who I am?!", fr: "Hoho, te sais qui je suis ?!" },
  create(g) {
    const W = g.W;
    const H = g.H;
    const doorTop = H * 0.2;
    const doorY = H * 0.47; // threshold
    const lineY = H * 0.57; // bouncer's feet
    const startY = H * 0.86;
    const moveT = 0.5 / g.speed;
    const tellT = 0.28 / g.speed;
    const dashT = 0.32 / Math.pow(g.speed, 0.75);
    const cross = (startY - lineY) / (startY - doorY); // dash progress at the bouncer's line
    const inside1 = g.friend();
    const inside2 = g.friend([inside1]);
    const first = g.random() < 0.5 ? 0 : 1;
    const b = { x: DOOR_X, from: DOOR_X, to: SIDES[first], side: first, state: 'move', t: 0, dur: moveT * 0.6, ticked: false };
    const hero = { state: 'wait', p: 0, back: 0 }; // wait | dash | bump | in
    const s = { t: 0, ended: false, endT: 0, glow: 0 };

    function holdTime() {
      // speed^0.8: at top speed a pause still outlasts reaction + the dash.
      return (0.65 + g.random() * 0.35) / Math.pow(g.speed, 0.8);
    }

    function heroPos() {
      if (hero.state === 'bump') {
        const k = smooth(clamp01(hero.back / 0.35));
        const y = lineY + 10 + (startY - lineY - 10) * k;
        return { x: DOOR_X, y: y - Math.sin(k * Math.PI) * 50, size: 190 - (190 - 150) * (1 - k) };
      }
      const p = clamp01(hero.p);
      return { x: DOOR_X, y: startY + (doorY - startY) * p, size: 190 - p * 85 };
    }

    function bump() {
      hero.state = 'bump';
      hero.back = 0;
      s.ended = true;
      g.sfx.hit();
      g.sfx.bad();
      g.fx.shake(16);
      g.fx.flash('rgba(255,50,90,0.3)');
      g.fx.burst(DOOR_X, lineY - 120, { kind: 'spark', n: 14, colors: ['#ffffff', PAL.mango], speed: 240 });
      g.say(b.x, lineY - 350, g.tr({ en: 'Not tonight!', fr: 'Pa jòdi-a ! Pas ce soir !' }), 1.6);
      g.lose();
    }

    function stepBouncer(dt) {
      b.t += dt;
      if (b.state === 'move') {
        const k = smooth(clamp01(b.t / b.dur));
        b.x = b.from + (b.to - b.from) * k;
        if (b.t >= b.dur) {
          b.state = 'hold';
          b.t = 0;
          b.dur = holdTime();
          b.ticked = false;
        }
      } else if (b.state === 'hold') {
        if (!b.ticked && b.dur - b.t <= tellT) {
          b.ticked = true;
          g.sfx.tick();
        }
        if (b.t >= b.dur) {
          b.state = 'move';
          b.t = 0;
          b.from = b.x;
          b.side = 1 - b.side;
          b.to = SIDES[b.side];
          b.dur = moveT;
        }
      }
    }

    return {
      update(dt) {
        s.t += dt;
        if (!g.done) stepBouncer(dt);
        if (hero.state === 'dash' || hero.state === 'in') {
          const before = hero.p;
          hero.p += dt / dashT;
          if (hero.state === 'dash' && before < cross && hero.p >= cross) {
            if (Math.abs(b.x - DOOR_X) < BLOCK) bump();
            else {
              hero.state = 'in';
              s.ended = true;
              g.sfx.good();
              g.sfx.hoho();
              g.fx.burst(DOOR_X, doorY - 80, { kind: 'confetti', n: 40 });
              g.fx.flash('rgba(255,120,220,0.25)');
              g.say(DOOR_X, doorTop + 30, g.tr({ en: 'Hoho! I\'m in!', fr: 'Hoho ! Je suis dedans !' }), 1.4);
              g.win();
            }
          }
        } else if (hero.state === 'bump') {
          hero.back += dt;
        }
        if (g.done) {
          s.endT += dt;
          if (!s.ended) {
            // Time ran out at the door.
            s.ended = true;
            g.sfx.bad();
            g.say(b.x, lineY - 350, g.tr({ en: 'Closed. Go home!', fr: 'Fermé. Rentre chez toi !' }), 1.6);
          }
        }
        const open = !g.done && b.state === 'hold' && b.dur - b.t > tellT;
        s.glow += ((open ? 1 : 0) - s.glow) * Math.min(1, dt * 14);
      },
      press() {
        if (hero.state !== 'wait') return;
        hero.state = 'dash';
        hero.p = 0;
        g.sfx.whoosh();
        g.fx.burst(DOOR_X, startY - 10, { kind: 'smoke', n: 8, speed: 90 });
      },
      draw(c) {
        // Night sky, palms and the club facade.
        sky(c, W, H, ['#120c30', '#3a1c5e', '#7a2f6b']);
        for (let i = 0; i < 24; i++) circle(c, (i * 89) % W, (i * 47) % (H * 0.3), 1 + (i % 3) * 0.5, `rgba(255,255,255,${0.4 + 0.4 * Math.sin(s.t * 2 + i)})`);
        circle(c, 340, 70, 20, 'rgba(255,245,215,0.9)');
        palm(c, 6, doorY + 30, H * 0.36, s.t, 0.18);
        palm(c, W - 6, doorY + 30, H * 0.34, s.t + 2, -0.18);
        shadowed(c, () => {
          rrect(c, 44, doorTop - 90, W - 88, doorY - doorTop + 110, 26);
          c.fillStyle = vgrad(c, doorTop - 90, doorY, ['#2a1846', '#1a0e30']);
          c.fill();
        }, 24, 8);
        neon(c, 'Le Molière', 200, doorTop - 46, 40, PAL.hibiscus, s.t);
        // The doorway: the party inside.
        c.save();
        rrect(c, 112, doorTop, 176, doorY - doorTop, 22);
        c.clip();
        c.fillStyle = vgrad(c, doorTop, doorY, ['#ff3d9a', '#8a2bb0', '#3a1466']);
        c.fillRect(112, doorTop, 176, doorY - doorTop);
        c.save();
        c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) {
          const a = Math.sin(s.t * 1.6 + i * 2) * 0.5;
          c.save();
          c.translate(150 + i * 50, doorTop);
          c.rotate(a);
          c.fillStyle = [PAL.lagoon, PAL.mango, '#ffffff'][i] + '44';
          c.beginPath();
          c.moveTo(-4, 0);
          c.lineTo(4, 0);
          c.lineTo(40, doorY - doorTop);
          c.lineTo(-40, doorY - doorTop);
          c.fill();
          c.restore();
        }
        c.restore();
        circle(c, 200, doorTop + 22, 14, '#d8dce8');
        for (let i = 0; i < 6; i++) circle(c, 192 + (i % 3) * 8, doorTop + 16 + Math.floor(i / 3) * 10, 2.5, `rgba(255,255,255,${0.5 + 0.5 * Math.sin(s.t * 8 + i)})`);
        const cheer = g.done && g.won ? 'cheer' : 'dance';
        person(c, inside1, 152, doorY - 6, 120, cheer, s.t);
        person(c, inside2, 250, doorY - 4, 115, 'dance', s.t + 0.6, { flip: true });
        c.restore();
        c.strokeStyle = vgrad(c, doorTop, doorY, ['#ffe08a', '#c98a2a']);
        c.lineWidth = 8;
        rrect(c, 112, doorTop, 176, doorY - doorTop, 22);
        c.stroke();
        // Pavement and red carpet.
        c.fillStyle = vgrad(c, doorY, H, ['#2a2140', '#140f24']);
        c.fillRect(0, doorY, W, H - doorY);
        c.fillStyle = vgrad(c, doorY, H, ['#d0204a', '#7a0d28']);
        c.beginPath();
        c.moveTo(118, doorY);
        c.lineTo(282, doorY);
        c.lineTo(350, H);
        c.lineTo(50, H);
        c.closePath();
        c.fill();
        c.strokeStyle = 'rgba(255,214,110,0.8)';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(122, doorY);
        c.lineTo(58, H);
        c.moveTo(278, doorY);
        c.lineTo(342, H);
        c.stroke();
        // Green glow on the threshold while the way is clear.
        if (s.glow > 0.02) {
          const gg = c.createRadialGradient(DOOR_X, doorY + 10, 4, DOOR_X, doorY + 10, 120);
          gg.addColorStop(0, `rgba(90,255,170,${0.55 * s.glow})`);
          gg.addColorStop(1, 'rgba(90,255,170,0)');
          c.fillStyle = gg;
          c.fillRect(DOOR_X - 120, doorY - 60, 240, 160);
        }
        // Velvet ropes.
        for (const px of [26, 374]) {
          rrect(c, px - 5, H * 0.62, 10, 70, 5);
          c.fillStyle = '#e8b84a';
          c.fill();
          circle(c, px, H * 0.62, 9, '#ffd76a');
        }
        c.strokeStyle = '#a3123a';
        c.lineWidth = 6;
        c.beginPath();
        c.moveTo(26, H * 0.63);
        c.quadraticCurveTo(10, H * 0.7, -10, H * 0.66);
        c.moveTo(374, H * 0.63);
        c.quadraticCurveTo(390, H * 0.7, 410, H * 0.66);
        c.stroke();
        // Bouncer and hero, back to front.
        const hp = heroPos();
        const tell = !g.done && b.state === 'hold' && b.dur - b.t <= tellT;
        const tellK = tell ? 1 - (b.dur - b.t) / tellT : 0;
        const dir = b.state === 'move' ? Math.sign(b.to - b.from) : b.side === 0 ? 1 : -1;
        const moving = b.state === 'move' ? Math.sin(clamp01(b.t / b.dur) * Math.PI) : 0;
        const lean = tell ? dir * 0.08 * tellK : moving * dir * 0.1;
        const arms = hero.state === 'bump' ? 'stop' : g.done && !g.won ? 'cross' : 'down';
        const drawBouncer = () => bouncer(c, b.x, lineY, s.t, { lean, squash: 1 - tellK * 0.06, glint: tell ? 1 : 0, arms });
        const drawHero = () => {
          if (hero.state === 'in' && hero.p > 1) {
            const fade = clamp01(1 - (hero.p - 1) * 3);
            if (fade <= 0) return;
            person(c, g.hero, hp.x, hp.y, hp.size, 'cheer', s.t, { hat: g.hat, alpha: fade });
            return;
          }
          const pose = hero.state === 'bump' ? 'sad' : hero.state === 'wait' ? 'idle' : 'run';
          person(c, g.hero, hp.x, hp.y, hp.size, pose, s.t, { hat: g.hat });
        };
        if (hp.y < lineY) {
          drawHero();
          drawBouncer();
        } else {
          drawBouncer();
          drawHero();
        }
        if (tell) text(c, '!', b.x + dir * 70, lineY - 360, { size: 38, color: PAL.mango, stroke: PAL.night });
        if (!g.done && hero.state === 'wait') text(c, '👆', 200, H - 50, { size: 30, shadow: false });
      },
      bot() {
        if (hero.state !== 'wait' || g.done) return null;
        return b.state === 'hold' && b.t > 0.02 && b.dur - b.t > tellT * 0.6 ? { press: [200, H * 0.7] } : null;
      },
    };
  },
};
