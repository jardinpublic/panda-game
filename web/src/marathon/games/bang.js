// Babar's bang (world 10), a scenario by Romain: Babar, ZUP cap and hoodie, a
// bang in his right hand and a Push Pop in his left; Rudy next to him with his
// guitar, his Reebok Pumps and a bottle of Jack's. MASH to pull very hard: the smoke climbs in the
// bang and Babar's lungs fill (they empty a little when you slow down). Full
// lungs before the end: a cloud fills the whole screen, worthy of Chernobyl,
// and Rudy: "Bravo Garçooooon, décoll'ment d'la plèvre !". Too slow: a sad
// little puff, and Rudy: "Rigoloooooo va."

import { person, rrect, circle, ellipse, vgrad, text, PAL } from '../art.js';
import { handOf } from './lighter.js';

const PULL = 0.085; // lungs filled by one tap
const LEAK = 0.13; // lungs emptying per second at speed 1 (× √speed)
const BABAR = 270;
const RUDY = 220;

/** Rudy's guitar, held across his body. */
function guitar(c, x, y, s, t) {
  c.save();
  c.translate(x, y);
  c.rotate(0.6 + Math.sin(t * 6) * 0.04); // neck up and away from his face
  rrect(c, -s * 0.03, -s * 0.62, s * 0.06, s * 0.5, s * 0.02);
  c.fillStyle = '#6b3f1d';
  c.fill();
  rrect(c, -s * 0.05, -s * 0.7, s * 0.1, s * 0.1, s * 0.02);
  c.fillStyle = '#3a2412';
  c.fill();
  ellipse(c, 0, -s * 0.06, s * 0.17, s * 0.13, '#c8572a');
  ellipse(c, 0, s * 0.1, s * 0.21, s * 0.16, '#c8572a');
  circle(c, 0, -s * 0.02, s * 0.05, '#2a1a10');
  c.restore();
}

export default {
  id: 'bang',
  world: 'w10',
  input: 'mash',
  base: 4.5,
  min: 3,
  survive: false,
  verb: { en: 'PULL HARD!', fr: 'TIRE FORT !' },
  title: { en: 'Babar’s bang', fr: 'Eul’ bang’ du Babar' },
  howto: {
    en: 'Babar must blow a cloud worthy of Chernobyl. Tap fast to pull very hard on the bang!',
    fr: 'Babar doit faire un nuage digne d’Tchernobyl. Tapote vite pour tirer très fort sur eul’ bang’ !',
  },
  winLine: { en: 'Pleura detachment!', fr: 'Décoll’ment d’la plèvre !' },
  rival: ['babar', 'victor'],
  rivalLine: { en: 'Not even a little cloud…', fr: 'Même pas un p’tit nuage…' },
  loseLine: { en: 'Hoho… not enough puff.', fr: 'Hoho… pas assez d’souffle.' },
  create(g) {
    const { W, H } = g;
    const feetY = H * 0.86;
    const bx = 150; // Babar
    const rx = 320; // Rudy
    const leak = LEAK * Math.sqrt(g.speed);
    const k = BABAR * 1.0;
    const headY = feetY - k * 0.2 - k * 0.27 - k * 0.55 * 0.38;
    const mouth = { x: bx, y: headY + k * 0.55 * 0.2 };
    const [bongHandX, bongHandY] = handOf('babar', bx, feetY, BABAR, 'idle', 0, true); // his right hand (screen left)
    const [popX, popY] = handOf('babar', bx, feetY, BABAR, 'idle', 0, false); // his left hand
    const watcher = g.hero !== 'babar' ? g.hero : null; // the hero watches from the sofa
    const s = { t: 0, lungs: 0, pull: 0, cloud: 0, puffs: [], won: false, lost: false, bubbles: [], botN: 0 };

    function exhale() {
      s.won = true;
      g.sfx.good();
      g.fx.shake(10);
      for (let i = 0; i < 26; i++) s.puffs.push({ x: mouth.x + (g.random() - 0.3) * 60, y: mouth.y, vx: (g.random() - 0.4) * 260, vy: -60 - g.random() * 220, r: 30 + g.random() * 40 });
      g.say(rx - 30, feetY - RUDY * 1.02, g.tr({ en: 'Bravo boyyyyy, pleura detachment!', fr: 'Bravo Garçooooon, décoll’ment d’la plèvre !' }), 2.2);
      g.win();
    }

    return {
      update(dt) {
        s.t += dt;
        s.pull = Math.max(0, s.pull - dt * 5);
        for (const b of s.bubbles) {
          b.y -= dt * 60;
          b.life -= dt;
        }
        s.bubbles = s.bubbles.filter((b) => b.life > 0);
        if (s.won) {
          s.cloud = Math.min(1, s.cloud + dt * 0.9);
          for (const p of s.puffs) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.r += dt * 90;
          }
          return;
        }
        if (g.done) {
          if (!s.lost) {
            // Time's up: a sad little puff
            s.lost = true;
            g.sfx.bad();
            g.fx.text(mouth.x + 40, mouth.y - 20, 'pfff…', { size: 22, color: '#e8e4dc' });
            g.say(rx - 30, feetY - RUDY * 1.02, g.tr({ en: 'Rigoloooooo, go on.', fr: 'Rigoloooooo va.' }), 2);
          }
          return;
        }
        s.lungs = Math.max(0, s.lungs - leak * dt);
      },
      press() {
        if (g.done) return;
        s.lungs = Math.min(1, s.lungs + PULL);
        s.pull = 1;
        g.sfx.pop();
        for (let i = 0; i < 2; i++) s.bubbles.push({ x: bongHandX - 6 + g.random() * 12, y: bongHandY + 34, r: 2 + g.random() * 3, life: 0.5 });
        if (s.lungs >= 1) exhale();
      },
      draw(c) {
        const t = s.t;
        // A flat in the ZUP at night: purple walls, the window on the tower blocks
        c.fillStyle = vgrad(c, 0, feetY, ['#3a2a55', '#5a3f6e']);
        c.fillRect(0, 0, W, feetY);
        rrect(c, 230, 110, 150, 170, 10);
        c.fillStyle = '#141a3a';
        c.fill();
        for (let i = 0; i < 3; i++) {
          c.fillStyle = '#2a2f55';
          c.fillRect(240 + i * 48, 170 - (i % 2) * 30, 40, 110 + (i % 2) * 30);
          for (let w = 0; w < 6; w++) if ((w + i) % 3) {
            c.fillStyle = 'rgba(255,214,110,0.8)';
            c.fillRect(246 + i * 48 + (w % 2) * 18, 182 - (i % 2) * 30 + Math.floor(w / 2) * 26, 10, 12);
          }
        }
        c.strokeStyle = '#d8cbb3';
        c.lineWidth = 6;
        c.strokeRect(230, 110, 150, 170);
        // A poster and a lava lamp
        rrect(c, 80, 120, 90, 120, 6);
        c.fillStyle = '#e8b830';
        c.fill();
        text(c, 'ZUP', 125, 180, { size: 30, color: '#3a2a55', shadow: false });
        rrect(c, 22, feetY - 120, 30, 70, 12);
        c.fillStyle = `hsl(${(t * 40) % 360}, 80%, 60%)`;
        c.fill();
        // Floor and the old sofa where the hero watches
        c.fillStyle = vgrad(c, feetY, H, ['#6b4a3a', '#4a3226']);
        c.fillRect(0, feetY, W, H - feetY);
        if (watcher) {
          rrect(c, 200, feetY - 110, 190, 70, 18);
          c.fillStyle = '#7a3a2a';
          c.fill();
          person(c, watcher, 245, feetY - 24, 150, s.won ? 'cheer' : 'sit', t + 1);
          rrect(c, 196, feetY - 64, 198, 40, 14);
          c.fillStyle = '#8a4432';
          c.fill();
        }
        // Rudy with his guitar, his Reebok Pumps (the little orange pump on each shoe)
        person(c, 'rudy', rx, feetY, RUDY, s.won ? 'cheer' : g.done ? 'point' : 'idle', t + 2, { flip: true });
        guitar(c, rx + 4, feetY - RUDY * 0.36, RUDY, t);
        for (const side of [-1, 1]) circle(c, rx + side * RUDY * 0.07 + 4, feetY - 4, 4, '#f07a1e');
        // and his bottle of Jack's in the other hand: square, black label
        const [jx, jy] = handOf('rudy', rx, feetY, RUDY, 'idle', t + 2, false);
        c.save();
        c.translate(jx + 4, jy + 6);
        c.rotate(0.15);
        rrect(c, -9, -30, 18, 34, 3);
        c.fillStyle = 'rgba(150,80,30,0.85)';
        c.fill();
        rrect(c, -4, -44, 8, 16, 2);
        c.fill();
        rrect(c, -5, -48, 10, 6, 2);
        c.fillStyle = '#1d1d24';
        c.fill();
        rrect(c, -8, -22, 16, 16, 2);
        c.fill();
        text(c, 'JACK’S', 0, -14, { size: 5, color: '#f4f1ea', shadow: false });
        c.restore();
        circle(c, jx + 4, jy + 2, 6, '#efc0a0');
        // Babar, the bang in his right hand, the Push Pop in his left
        const sq = 1 + s.pull * 0.03 + s.lungs * 0.05; // he swells as he pulls
        person(c, 'babar', bx, feetY, BABAR, s.won ? 'cheer' : 'idle', t, { hat: 'none', squash: sq });
        // The bang: a glass tube from his hand up to his mouth, water, smoke rising with the lungs
        const baseY = bongHandY + 48;
        const topY = mouth.y + 6;
        const tubeX = bongHandX + 4;
        ellipse(c, tubeX, baseY, 22, 16, 'rgba(200,230,255,0.55)');
        ellipse(c, tubeX, baseY + 4, 18, 10, 'rgba(90,170,220,0.6)'); // water
        rrect(c, tubeX - 9, topY, 18, baseY - topY, 8);
        c.fillStyle = 'rgba(200,230,255,0.45)';
        c.fill();
        const smokeTop = baseY - (baseY - topY) * s.lungs;
        rrect(c, tubeX - 7, smokeTop, 14, baseY - smokeTop, 6);
        c.fillStyle = 'rgba(235,235,240,0.85)';
        c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.7)';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(tubeX - 5, topY + 6);
        c.lineTo(tubeX - 5, baseY - 10);
        c.stroke();
        // the mouthpiece reaching his mouth
        c.strokeStyle = 'rgba(200,230,255,0.7)';
        c.lineWidth = 8;
        c.beginPath();
        c.moveTo(tubeX, topY + 4);
        c.lineTo(mouth.x - 4, mouth.y + 2);
        c.stroke();
        for (const b of s.bubbles) circle(c, b.x, b.y, b.r, `rgba(255,255,255,${b.life * 1.6})`);
        circle(c, bongHandX, bongHandY + 10, 9, '#efc19f'); // his fingers on the glass
        // The Push Pop in his other hand
        rrect(c, popX - 7, popY - 34, 14, 34, 4);
        c.fillStyle = '#4fb4ff';
        c.fill();
        rrect(c, popX - 6, popY - 52, 12, 20, 6);
        c.fillStyle = '#ff4f9a';
        c.fill();
        // The lungs gauge
        rrect(c, 20, 110, 30, 220, 14);
        c.fillStyle = 'rgba(255,255,255,0.2)';
        c.fill();
        const fill = 214 * s.lungs;
        rrect(c, 23, 327 - fill, 24, fill, 11);
        c.fillStyle = s.lungs > 0.75 ? '#7dffb0' : '#e8e4dc';
        c.fill();
        text(c, '🫁', 35, 92, { size: 24, shadow: false });
        // The Chernobyl cloud
        if (s.won) {
          for (const p of s.puffs) circle(c, p.x, p.y, p.r, 'rgba(236,236,242,0.85)');
          c.fillStyle = `rgba(236,236,242,${s.cloud * 0.92})`;
          c.fillRect(0, 0, W, H);
          if (s.cloud > 0.6) text(c, '☢', W / 2, H * 0.4, { size: 90, color: `rgba(232,184,48,${(s.cloud - 0.6) * 2})`, shadow: false });
        }
      },
      bot() {
        s.botN++;
        return s.botN % 4 === 0 ? { press: [200, H * 0.5] } : null;
      },
    };
  },
};
