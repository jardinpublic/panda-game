// At 15, in Montceau (world 3): the night of the first big party in Cous's
// garage. On the way back, Mamar breaks one lamp of a house's gate and Babar
// the other. A window lights up and the owner comes out in his dressing gown,
// broom up. The gang runs up the street to Cous's garage: SWIPE (or tap a
// side) to change lane and dodge bins, hedges, a dog and a parked car. Every
// obstacle hit lets the owner catch up; the second one, he gets you. Reach the
// garage... and a police siren rises in the distance.

import { person, rrect, circle, ellipse, vgrad, text, PAL } from '../art.js';

const LANES = [110, 200, 290];
const KINDS = ['bin', 'hedge', 'dog', 'car'];

/** The furious owner: dressing gown, slippers, a moustache and a broom over his head. */
function owner(c, x, y, s, t, swing) {
  c.save();
  c.translate(x, y);
  ellipse(c, 0, 0, s * 0.18, s * 0.035, 'rgba(0,0,0,0.25)');
  const run = Math.sin(t * 14);
  c.lineCap = 'round';
  c.strokeStyle = '#e9c7a8';
  c.lineWidth = s * 0.06;
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * s * 0.05, -s * 0.22);
    c.lineTo(side * s * 0.06 + side * run * s * 0.05, -s * 0.02);
    c.stroke();
    ellipse(c, side * s * 0.07 + side * run * s * 0.05, -s * 0.01, s * 0.06, s * 0.025, '#7a3b5c'); // slippers
  }
  // Dressing gown with its belt
  rrect(c, -s * 0.16, -s * 0.6, s * 0.32, s * 0.42, s * 0.12);
  c.fillStyle = vgrad(c, -s * 0.6, -s * 0.18, ['#9b3d4f', '#6f2636']);
  c.fill();
  c.fillStyle = '#e8c96a';
  c.fillRect(-s * 0.16, -s * 0.36, s * 0.32, s * 0.03);
  // The broom, swung over his head
  c.save();
  c.translate(s * 0.12, -s * 0.55);
  c.rotate(-1.1 + swing * 0.9);
  c.strokeStyle = '#a8763d';
  c.lineWidth = s * 0.03;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, -s * 0.5);
  c.stroke();
  rrect(c, -s * 0.09, -s * 0.62, s * 0.18, s * 0.13, s * 0.03);
  c.fillStyle = '#d8b25a';
  c.fill();
  c.restore();
  circle(c, s * 0.13, -s * 0.55, s * 0.04, '#e9c7a8');
  // Head: bald top, grey sides, big moustache, shouting
  const hy = -s * 0.75;
  circle(c, 0, hy, s * 0.15, '#efc6a4');
  ellipse(c, -s * 0.14, hy, s * 0.04, s * 0.06, '#b9b4ad');
  ellipse(c, s * 0.14, hy, s * 0.04, s * 0.06, '#b9b4ad');
  circle(c, -s * 0.05, hy - s * 0.03, s * 0.018, '#2a1a10');
  circle(c, s * 0.05, hy - s * 0.03, s * 0.018, '#2a1a10');
  c.strokeStyle = '#2a1a10';
  c.lineWidth = s * 0.012;
  c.beginPath();
  c.moveTo(-s * 0.09, hy - s * 0.08);
  c.lineTo(-s * 0.02, hy - s * 0.06);
  c.moveTo(s * 0.09, hy - s * 0.08);
  c.lineTo(s * 0.02, hy - s * 0.06);
  c.stroke();
  ellipse(c, 0, hy + s * 0.07, s * 0.05, s * 0.04 + Math.abs(run) * s * 0.01, '#6b2a2a');
  ellipse(c, -s * 0.045, hy + s * 0.035, s * 0.06, s * 0.022, '#9a9590', -0.2);
  ellipse(c, s * 0.045, hy + s * 0.035, s * 0.06, s * 0.022, '#9a9590', 0.2);
  c.restore();
}

/** An obstacle standing in a lane, its bottom-centre at (x, y). */
function obstacle(c, kind, x, y, t) {
  if (kind === 'bin') {
    ellipse(c, x, y, 30, 7, 'rgba(0,0,0,0.25)');
    rrect(c, x - 24, y - 62, 48, 60, 6);
    c.fillStyle = vgrad(c, y - 62, y, ['#3e8e4f', '#2a6638']);
    c.fill();
    rrect(c, x - 28, y - 70, 56, 12, 5);
    c.fillStyle = '#2f7a40';
    c.fill();
    circle(c, x - 18, y - 2, 6, '#1e1e24');
    circle(c, x + 18, y - 2, 6, '#1e1e24');
  } else if (kind === 'hedge') {
    ellipse(c, x, y, 40, 8, 'rgba(0,0,0,0.25)');
    for (const [dx, dy, r] of [[-20, -24, 24], [18, -26, 26], [0, -44, 26], [-2, -18, 24]]) circle(c, x + dx, y + dy, r, '#2f6b3a');
    circle(c, x - 8, y - 48, 12, 'rgba(120,200,120,0.35)');
  } else if (kind === 'dog') {
    ellipse(c, x, y, 38, 8, 'rgba(0,0,0,0.25)');
    c.fillStyle = '#8a5a35';
    c.beginPath();
    c.moveTo(x - 30, y);
    c.lineTo(x - 30, y - 40);
    c.lineTo(x, y - 62);
    c.lineTo(x + 30, y - 40);
    c.lineTo(x + 30, y);
    c.closePath();
    c.fill();
    rrect(c, x - 14, y - 34, 28, 34, 12);
    c.fillStyle = '#2a1a10';
    c.fill();
    // the dog, barking out of its kennel
    const jump = Math.abs(Math.sin(t * 10)) * 4;
    circle(c, x, y - 14 - jump, 13, '#d9a35c');
    ellipse(c, x - 11, y - 20 - jump, 5, 9, '#8a5a35', 0.4);
    ellipse(c, x + 11, y - 20 - jump, 5, 9, '#8a5a35', -0.4);
    circle(c, x, y - 9 - jump, 4, '#2a1a10');
    text(c, 'Wouf !', x + 34, y - 64, { size: 14, color: PAL.cream });
  } else {
    // A parked bagnole seen from behind.
    ellipse(c, x, y, 42, 8, 'rgba(0,0,0,0.25)');
    rrect(c, x - 38, y - 44, 76, 38, 9);
    c.fillStyle = vgrad(c, y - 44, y - 6, ['#7d8597', '#5a6172']);
    c.fill();
    rrect(c, x - 28, y - 66, 56, 26, 9);
    c.fillStyle = '#6b7385';
    c.fill();
    rrect(c, x - 23, y - 62, 46, 18, 6);
    c.fillStyle = '#2b3448';
    c.fill();
    rrect(c, x - 34, y - 34, 14, 7, 3);
    c.fillStyle = '#e8413c';
    c.fill();
    rrect(c, x + 20, y - 34, 14, 7, 3);
    c.fill();
    rrect(c, x - 33, y - 8, 14, 10, 3);
    c.fillStyle = '#1e1e24';
    c.fill();
    rrect(c, x + 19, y - 8, 14, 10, 3);
    c.fill();
  }
}

export default {
  id: 'proprio',
  world: 'w03',
  input: 'swipe',
  base: 6,
  min: 3.6,
  survive: true,
  verb: { en: 'RUN!', fr: 'COURS !' },
  title: { en: 'Here comes the owner!', fr: 'Cours, v’là eul’ proprio !' },
  howto: {
    en: 'Age 15: Mamar and Babar each broke a lamp on a gate. Swipe to dodge all the way to Cous’s garage, the owner is right behind you!',
    fr: 'À 15 ans, Mamar et Babar ont cassé chacun une lampe d’un portail. Glisse pour esquiver jusqu’au garage d’Cous : eul’ proprio te court après !',
  },
  winLine: { en: 'Made it to the garage… is that a siren?!', fr: 'Au garage… c’est quoi c’te sirène ?!' },
  rival: ['cous', 'mamar'],
  rivalLine: { en: 'Not a word to my mum…', fr: 'Pas un mot à ma mère…' },
  loseLine: { en: 'Hoho… the owner got me with his broom.', fr: 'Hoho… eul’ proprio m’a eu au balai.' },
  create(g) {
    const { W, H } = g;
    const heroY = H * 0.68;
    const spawnY = 110;
    const v = 280 * Math.pow(g.speed, 0.75); // the street scrolling past
    const travel = (heroY - spawnY) / v;
    const ahead = ['mamar', 'babar', 'jojo', 'cous'].filter((id) => id !== g.hero).slice(0, 3);
    // Obstacles, scheduled up front; each is aimed when it appears (mostly at the hero's lane).
    const obs = [];
    let at = 0.6 / Math.sqrt(g.speed);
    while (at + travel < g.duration - 0.35) {
      obs.push({ spawn: at, lane: -1, kind: KINDS[Math.floor(g.random() * KINDS.length)], y: -999, state: 'wait', aim: g.random() < 0.7 });
      at += (0.8 + g.random() * 0.3) / Math.pow(g.speed, 0.6);
    }
    const mates = ahead.map((id, i) => ({ id, base: LANES[i], x: LANES[i], y: heroY - 150 - (i % 2) * 30 }));
    const s = { t: 0, lane: 1, x: LANES[1], gap: 2, ownerGap: 2, stumble: 0, swing: 0, caught: false, bonk: 0, sirenSaid: false, cling: 0 };

    function hit(o) {
      o.state = 'hit';
      s.gap--;
      s.stumble = 0.45;
      g.sfx.hit();
      g.fx.shake(10);
      g.fx.burst(s.x, heroY - 40, { kind: 'spark', n: 14, colors: ['#ffffff', PAL.mango], speed: 220 });
      if (s.gap <= 0) {
        s.caught = true;
        s.bonk = 0.001;
        g.sfx.bad();
        g.fx.text(s.x, heroY - 170, 'BONK !', { size: 40, color: PAL.cream });
        g.say(s.x + 60, heroY - 60, g.tr({ en: 'Got you, you little rascal!', fr: 'J’te tiens, p’tit voyou !' }), 1.6);
        g.lose();
      } else {
        g.say(200, heroY + 40, g.tr({ en: 'Come back here, you hooligans!', fr: 'Revenez ici, bande ed’ voyous !' }), 1.2);
      }
    }

    return {
      update(dt) {
        s.t += dt;
        s.x += (LANES[s.lane] - s.x) * Math.min(1, dt * 16);
        s.stumble = Math.max(0, s.stumble - dt);
        s.swing += dt * (s.caught ? 4 : 9);
        s.ownerGap += (s.gap - s.ownerGap) * Math.min(1, dt * 5);
        if (s.bonk) s.bonk += dt;
        // The two lamps, one after the other: Mamar's, then Babar's.
        if (s.cling === 0 && s.t >= 0.02) {
          s.cling = 1;
          g.sfx.pop();
          g.fx.text(LANES[0] - 20, H - 70, 'CLING !', { size: 26, color: '#fff3c4' });
        } else if (s.cling === 1 && s.t >= 0.3) {
          s.cling = 2;
          g.sfx.pop();
          g.fx.text(LANES[2] + 20, H - 70, 'CLING !', { size: 26, color: '#fff3c4' });
        }
        // The friends ahead sidestep the obstacles coming at them.
        for (const m of mates) {
          const o = obs.find((o) => o.state !== 'wait' && Math.abs(LANES[o.lane] - m.base) < 10 && Math.abs(o.y - m.y) < 90);
          const want = o ? m.base + (m.base >= 200 ? -60 : 60) : m.base;
          m.x += (want - m.x) * Math.min(1, dt * 10);
        }
        if (g.done) {
          if (g.won && !s.sirenSaid) {
            s.sirenSaid = true;
            g.sfx.good();
            g.fx.flash('rgba(70,120,255,0.35)', 0.25);
            g.say(200, heroY - 150, g.tr({ en: 'The cops!!', fr: 'Les flics !!' }), 1.6);
          }
          return;
        }
        for (const o of obs) {
          if (o.state === 'wait' && s.t >= o.spawn) {
            o.state = 'come';
            o.lane = o.aim ? s.lane : Math.floor(g.random() * 3);
            g.sfx.tick();
          }
          if (o.state === 'come') {
            o.y = spawnY + (s.t - o.spawn) * v;
            if (o.y >= heroY - 6) {
              if (o.lane === s.lane) {
                hit(o);
                if (g.done) return;
              } else {
                o.state = 'past';
                g.sfx.whoosh();
              }
            }
          } else if (o.state === 'past' || o.state === 'hit') {
            o.y = spawnY + (s.t - o.spawn) * v;
          }
        }
      },
      swipe(dir) {
        if (dir === 'left' && s.lane > 0) s.lane--;
        else if (dir === 'right' && s.lane < 2) s.lane++;
        else return;
        g.sfx.tap();
      },
      press(x) {
        // Tapping a side also changes lane (one-thumb comfort).
        this.swipe(x < s.x - 40 ? 'left' : x > s.x + 40 ? 'right' : '');
      },
      draw(c) {
        const t = s.t;
        const dist = Math.min(t, g.duration) * v;
        // Night street: pavements, houses scrolling on both sides, the road with its dashes.
        c.fillStyle = vgrad(c, 0, H, ['#1b2245', '#2a2f55', '#3a3a5e']);
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#4a4a58';
        c.fillRect(56, 0, W - 112, H);
        c.fillStyle = 'rgba(255,255,255,0.35)';
        for (let i = -1; i < 12; i++) {
          const y = ((i * 90 + dist) % 1080) - 90;
          c.fillRect(153, y, 6, 44);
          c.fillRect(243, y, 6, 44);
        }
        for (const side of [0, 1]) {
          for (let i = -1; i < 6; i++) {
            const y = ((i * 170 + dist * 1.0 + side * 85) % 1020) - 170;
            const x = side ? W - 52 : 0;
            c.fillStyle = side ? '#5d4a6b' : '#4f5a78';
            c.fillRect(x, y, 52, 150);
            rrect(c, x + 12, y + 30, 28, 34, 4);
            c.fillStyle = (i + side) % 3 ? 'rgba(255,214,110,0.75)' : 'rgba(30,30,50,0.9)';
            c.fill();
          }
          // street lamps: an orange glow every so often
          for (let i = -1; i < 4; i++) {
            const y = ((i * 300 + dist + side * 150) % 1200) - 150;
            const lx = side ? W - 62 : 62;
            const gl = c.createRadialGradient(lx, y, 0, lx, y, 70);
            gl.addColorStop(0, 'rgba(255,190,90,0.45)');
            gl.addColorStop(1, 'rgba(255,190,90,0)');
            c.fillStyle = gl;
            c.fillRect(lx - 70, y - 70, 140, 140);
            circle(c, lx, y, 7, '#ffd27a');
          }
        }
        // The gate with its two broken lamps, left behind at the bottom.
        const gateY = heroY + 190 + dist;
        if (gateY < H + 120) {
          for (const gx of [70, 330]) {
            rrect(c, gx - 16, gateY - 110, 32, 110, 4);
            c.fillStyle = '#c9c0b0';
            c.fill();
            circle(c, gx, gateY - 124, 15, '#3a3a48');
            c.strokeStyle = '#d9e4ff';
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(gx - 9, gateY - 132);
            c.lineTo(gx + 2, gateY - 122);
            c.lineTo(gx - 3, gateY - 114);
            c.moveTo(gx + 2, gateY - 122);
            c.lineTo(gx + 10, gateY - 128);
            c.stroke();
          }
          c.strokeStyle = '#2a2a33';
          c.lineWidth = 5;
          for (let i = 0; i < 9; i++) {
            c.beginPath();
            c.moveTo(96 + i * 26, gateY - 4);
            c.lineTo(96 + i * 26, gateY - 80);
            c.stroke();
          }
        }
        // Cous's garage, arriving at the end of the run.
        const garageY = heroY - (g.duration - Math.min(t, g.duration)) * v - 20;
        if (garageY > -40) {
          rrect(c, 60, garageY - 150, 280, 150, 8);
          c.fillStyle = '#d8cbb3';
          c.fill();
          rrect(c, 90, garageY - 120, 220, 120, 4);
          c.fillStyle = '#1e1a22';
          c.fill();
          c.fillStyle = 'rgba(255,214,110,0.35)';
          c.fillRect(90, garageY - 30, 220, 30);
          text(c, 'GARAGE', 200, garageY - 135, { size: 14, color: '#6b5a48', shadow: false });
        }
        // Obstacles, back to front.
        for (const o of obs) {
          if (o.state === 'wait' || o.y > H + 80) continue;
          if (o.state === 'come' && o.y < heroY) {
            // tell: the lane glows where it will pass
            const k = (o.y - spawnY) / (heroY - spawnY);
            ellipse(c, LANES[o.lane], heroY + 4, 36 + 10 * k, 10, `rgba(255,120,80,${0.15 + 0.3 * k})`);
          }
          obstacle(c, o.kind, LANES[o.lane] + (o.state === 'hit' ? (o.y - heroY) * 0.6 : 0), o.y, t);
        }
        // The gang running ahead (wobbly), the hero, the owner behind.
        mates.forEach((m, i) => person(c, m.id, m.x + Math.sin(t * 3 + i * 2) * 8, m.y, 105, g.done && !g.won ? 'sad' : 'run', t + i));
        const pose = s.caught ? 'sad' : s.stumble > 0 ? 'sad' : 'run';
        person(c, g.hero, s.x, heroY, 140, pose, t, { hat: g.hat });
        const oy = heroY + 30 + s.ownerGap * 60;
        owner(c, s.caught ? s.x + 30 : 200 + Math.sin(t * 2) * 40, Math.min(H - 20, oy), 150, t, Math.sin(s.swing));
        if (!g.done) {
          for (let i = 0; i < 2; i++) text(c, i < s.gap ? '❤' : '♡', 340 + i * 26, 110, { size: 22, color: PAL.hibiscus });
        }
      },
      bot() {
        // Leave a lane with an obstacle arriving soon, for one with nothing close.
        const soon = (lane) => obs.some((o) => o.state === 'come' && o.lane === lane && heroY - o.y < v * 0.9 && o.y < heroY);
        if (!soon(s.lane)) return null;
        const options = [s.lane - 1, s.lane + 1].filter((l) => l >= 0 && l <= 2 && !soon(l));
        if (!options.length) return null;
        return { swipe: options[0] < s.lane ? 'left' : 'right' };
      },
    };
  },
};
