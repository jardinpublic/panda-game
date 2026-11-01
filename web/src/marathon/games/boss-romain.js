// BOSS, world 1: "15h pétantes". It's 3 PM and the hero escapes the office,
// Romain chasing behind ("just a quick favour!"). Side-view runner on 3 floor
// rows: desks, printers and a colleague with "one last thing!" come from the
// right (a red "!" flags the row first). SWIPE up/down to change rows; any hit
// = caught. Phases: desks, then printers and colleagues, then double rows.
// Reach the exit: palm-lined parking and the Fiat Panda.

import { person, head, circle, ellipse, rrect, PAL, text, vgrad, shadowed, sky, sun, palm, sea, diamondRock, bubble } from '../art.js';
import { fiatPanda } from './kids.js';
import { handOf } from './lighter.js';
import { bossBanner, bossBar } from './boss-croco.js';

const ROWK = [0.56, 0.68, 0.8];
const SCALE = [0.8, 0.9, 1.0];
const KINDS = ['desk', 'printer', 'colleague'];

function desk(c, x, y, k, t) {
  c.save();
  c.translate(x, y);
  c.scale(k, k);
  ellipse(c, 0, 2, 70, 12, 'rgba(20,10,40,0.2)');
  c.fillStyle = '#9a6a3e';
  c.fillRect(-56, -66, 9, 66);
  c.fillRect(47, -66, 9, 66);
  shadowed(c, () => {
    rrect(c, -64, -78, 128, 16, 6);
    c.fillStyle = vgrad(c, -78, -62, ['#e0a46a', '#c98b55']);
    c.fill();
  }, 10, 4);
  rrect(c, -50, -62, 100, 36, 6);
  c.fillStyle = '#b57a48';
  c.fill();
  // Monitor, papers, mug.
  rrect(c, -34, -134, 60, 46, 7);
  c.fillStyle = '#2b2f3a';
  c.fill();
  rrect(c, -30, -130, 52, 38, 5);
  c.fillStyle = vgrad(c, -130, -92, ['#8fe3f7', '#3a9fd0']);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.5)';
  c.fillRect(-24, -122, 22, 4);
  c.fillRect(-24, -112, 34, 4);
  c.fillStyle = '#2b2f3a';
  c.fillRect(-8, -90, 8, 12);
  for (let i = 0; i < 4; i++) {
    rrect(c, 30, -84 - i * 5, 26, 6, 2);
    c.fillStyle = i % 2 ? '#ffffff' : '#f1ede4';
    c.fill();
  }
  rrect(c, -58, -94, 14, 16, 4);
  c.fillStyle = PAL.coral;
  c.fill();
  circle(c, -51, -102 - ((t * 20) % 10), 3, 'rgba(255,255,255,0.6)');
  c.restore();
}

function printer(c, x, y, k, t) {
  c.save();
  c.translate(x, y);
  c.scale(k, k);
  ellipse(c, 0, 2, 56, 11, 'rgba(20,10,40,0.2)');
  c.fillStyle = '#5a5d6a';
  c.fillRect(-36, -30, 72, 30);
  shadowed(c, () => {
    rrect(c, -48, -104, 96, 76, 16);
    c.fillStyle = vgrad(c, -104, -28, ['#f5f6fa', '#d3d6e0']);
    c.fill();
  }, 12, 5);
  rrect(c, -36, -96, 72, 10, 4);
  c.fillStyle = '#3a3d48';
  c.fill();
  circle(c, 34, -60, 5, Math.sin(t * 12) > 0 ? '#3ee07a' : '#1d7a45');
  // Sheets shooting out.
  for (let i = 0; i < 3; i++) {
    const q = (t * 1.6 + i / 3) % 1;
    c.save();
    c.translate(-10 - q * 40, -100 - q * 70);
    c.rotate(q * 3 + i);
    c.globalAlpha = 1 - q;
    c.fillStyle = '#ffffff';
    c.fillRect(-12, -15, 24, 30);
    c.fillStyle = 'rgba(60,70,90,0.35)';
    c.fillRect(-8, -9, 16, 2);
    c.fillRect(-8, -3, 16, 2);
    c.restore();
  }
  text(c, 'BRRRT', 0, -128, { size: 14, color: PAL.ink, shadow: false, weight: 800 });
  c.restore();
}

export default {
  id: 'boss-romain',
  world: 'w01',
  input: 'swipe',
  axis: 'y', // swipes are up/down
  base: 10,
  survive: true,
  boss: true,
  verb: { en: 'RUN, IT\'S 3 PM!', fr: 'FILE, 15H PÉTANTES !' },
  title: { en: "BOSS: 3 pm escape", fr: "BOSS : la fuite de 15h" },
  howto: { en: "Romain's chasing you with a file. Swipe up and down to dodge everything until the exit.", fr: "Romain te court après avec un dossier. Glisse en haut et en bas pour tout éviter jusqu'à la sortie." },
  winLine: { en: "Freedom! See you tomorrow!", fr: "Liberté ! À demain !" },
  rival: ["romain", "greg"],
  rivalLine: { en: "Fine… tomorrow then.", fr: "Bon… demain alors." },
  loseLine: { en: "Hoho, OK, one last thing then…", fr: "Hoho, bon, une dernière chose alors…" },
  create(g) {
    const K = 1 / Math.sqrt(g.speed);
    const chaser = g.cast('romain', 'greg');
    const chaserName = chaser[0].toUpperCase() + chaser.slice(1);
    const colleague = g.friend([chaser]);
    const ROWS = ROWK.map((k) => g.H * k);
    const floorTop = g.H * 0.5;
    const floorBot = g.H * 0.88;
    const heroX = 135;
    const spawnX = g.W + 80;
    const travel = 1.0 * K;
    const v = (spawnX - heroX) / travel;
    const doorT = g.duration - 0.3 * K;
    const doorDist = v * doorT;
    const banner = 1.3 * K;

    // Obstacles scheduled by arrival time; rows are aimed when the "!" shows.
    const obs = [];
    let a = 0.9 * K + travel;
    while (a <= doorT - 0.65 * K) {
      const p = a / g.duration;
      const kind = p < 0.36 ? 'desk' : p < 0.66 ? KINDS[Math.floor(g.random() * 3)] : 'double';
      const items = kind === 'double' ? [KINDS[Math.floor(g.random() * 3)], KINDS[Math.floor(g.random() * 3)]] : [kind];
      obs.push({ kind, items, arrive: a, tell: a - travel - 0.28 * K, lanes: [], state: 'wait' });
      a += (kind === 'double' ? 0.85 : p < 0.36 ? 0.78 : 0.62) * K;
    }
    const s = { t: 0, lane: 1, y: ROWS[1], sc: SCALE[1], moving: 0, dist: 0, crash: 0, crashed: false, started: false, ry: ROWS[1], rw: -(heroX - 25), won: false, said: 0, phase: 1 };

    function crash(o) {
      s.crashed = true;
      g.sfx.hit();
      g.sfx.bad();
      g.fx.shake(18);
      g.fx.flash('rgba(255,255,255,0.35)', 0.12);
      g.fx.burst(heroX + 30, s.y - 90, { kind: 'confetti', colors: ['#ffffff', '#f1ede4', '#fff7ea', '#cfe3f7'], n: 50, speed: 420 });
      g.fx.text(heroX + 20, s.y - 220, o.items.includes('colleague') ? g.tr({ en: 'CAUGHT!', fr: 'COINCÉ !' }) : 'BAM!', { size: 50, color: PAL.coral });
      g.say(70, s.y - 170, g.tr({ en: 'Oh, while you\'re here…', fr: 'Ah, tant que tu es là…' }), 1.8);
      g.lose();
    }

    const rowOf = (o, i) => o.lanes[i];
    const screenX = (o) => heroX + v * (o.arrive - s.t);

    return {
      update(dt) {
        s.t += dt;
        s.moving = Math.max(0, s.moving - dt);
        s.y += (ROWS[s.lane] - s.y) * Math.min(1, dt * 16);
        s.sc += (SCALE[s.lane] - s.sc) * Math.min(1, dt * 16);
        if (!s.started) {
          s.started = true;
          g.sfx.boss?.();
        }
        if (s.crashed) {
          s.crash = Math.min(1, s.crash + dt * 3);
          // Romain catches up, file in hand.
          s.rw += (s.dist - 70 - s.rw) * Math.min(1, dt * 4);
          s.ry += (s.y - s.ry) * Math.min(1, dt * 4);
          return;
        }
        if (s.won) {
          s.dist += (doorDist + 12 - s.dist) * Math.min(1, dt * 5);
          s.rw += (doorDist - 60 - s.rw) * Math.min(1, dt * 4);
          s.ry += (s.y - s.ry) * Math.min(1, dt * 3);
          return;
        }
        if (g.done) return;
        s.dist = Math.min(doorDist, s.dist + v * dt);
        s.rw = s.dist - (heroX - 25) + Math.sin(s.t * 1.5) * 8;
        s.ry += (s.y - s.ry) * Math.min(1, dt * 3);
        if (s.said === 0 && s.t > 0.5 * K) {
          s.said = 1;
          g.say(40, ROWS[0] - 150, g.tr({ en: 'Wait! Just a quick favour!', fr: 'Attends ! Un petit service !' }), 1.4);
        } else if (s.said === 1 && s.t > g.duration * 0.55) {
          s.said = 2;
          g.say(40, ROWS[0] - 150, g.tr({ en: 'Just one signature!', fr: 'Juste une signature !' }), 1.3);
        }
        for (const o of obs) {
          if (o.state === 'wait' && s.t >= o.tell) {
            o.state = 'tell';
            o.lanes = [s.lane];
            if (o.kind === 'double') o.lanes.push((s.lane + 1 + Math.floor(g.random() * 2)) % 3);
            g.sfx.tick(true);
          }
          if (o.state === 'tell' && s.t >= o.arrive) {
            o.state = 'passed';
            if (o.lanes.includes(s.lane)) {
              crash(o);
              return;
            }
            g.sfx.whoosh();
          }
        }
        const p = s.t / g.duration;
        if ((p >= 0.36 && s.phase < 2) || (p >= 0.66 && s.phase < 3)) {
          s.phase = p >= 0.66 ? 3 : 2;
          g.sfx.speedup();
          g.fx.text(200, g.H * 0.2, p >= 0.66 ? g.tr({ en: 'RUSH HOUR!', fr: 'L\'HEURE DE POINTE !' }) : g.tr({ en: 'PRINTERS!', fr: 'LES IMPRIMANTES !' }), { size: 32, color: PAL.mango, life: 1.1 });
        }
        if (s.dist >= doorDist) {
          s.won = true;
          g.sfx.good();
          g.sfx.hoho();
          g.fx.burst(heroX + 40, s.y - 100, { kind: 'confetti', n: 80, speed: 520 });
          g.fx.burst(heroX + 40, s.y - 100, { kind: 'petal', n: 20, speed: 320 });
          g.fx.text(200, g.H * 0.3, g.tr({ en: 'FREEDOM!', fr: 'LIBERTÉ !' }), { size: 44, color: PAL.mango, life: 1.6 });
          g.say(60, ROWS[0] - 150, g.tr({ en: 'Fine… tomorrow then!', fr: 'Bon… demain alors !' }), 1.8);
          g.win();
        }
      },
      swipe(dir) {
        if (dir === 'up' && s.lane > 0) s.lane--;
        else if (dir === 'down' && s.lane < 2) s.lane++;
        else return;
        s.moving = 0.22;
        g.sfx.tap();
      },
      draw(c) {
        const t = s.t;
        const doorX = heroX + doorDist - s.dist;
        // Office wall with sea-view windows (parallax).
        sky(c, g.W, floorTop, ['#f6f1e8', '#e6dccb']);
        const par = s.dist * 0.6;
        for (let i = 0; i < 12; i++) {
          const wx = 30 + i * 260 - par;
          if (wx > g.W || wx < -200) continue;
          const wy = g.H * 0.15;
          const ww = 170;
          const wh = g.H * 0.22;
          shadowed(c, () => {
            rrect(c, wx, wy, ww, wh, 14);
            c.fillStyle = '#7fd3ef';
            c.fill();
          }, 12, 4, 'rgba(20,10,40,0.15)');
          c.save();
          rrect(c, wx, wy, ww, wh, 14);
          c.clip();
          c.fillStyle = vgrad(c, wy, wy + wh, ['#7fd3ef', '#bfeaf6']);
          c.fillRect(wx, wy, ww, wh);
          sea(c, wx + ww + 40, wy + wh * 0.62, wh * 0.38, t);
          diamondRock(c, wx + ww * 0.68, wy + wh * 0.62, 26);
          palm(c, wx + 24, wy + wh + 10, wh * 0.8, t, 0.2);
          c.restore();
          c.fillStyle = 'rgba(255,255,255,0.7)';
          c.fillRect(wx + ww / 2 - 2, wy, 4, wh);
        }
        // The 3 PM clock.
        const cx = 330 - par;
        if (cx > -80) {
          shadowed(c, () => circle(c, cx, g.H * 0.42, 34, '#ffffff'), 10, 4);
          circle(c, cx, g.H * 0.42, 29, PAL.cream);
          c.strokeStyle = PAL.ink;
          c.lineWidth = 4;
          c.lineCap = 'round';
          c.beginPath();
          c.moveTo(cx, g.H * 0.42);
          c.lineTo(cx, g.H * 0.42 - 22);
          c.moveTo(cx, g.H * 0.42);
          c.lineTo(cx + 16, g.H * 0.42);
          c.stroke();
          circle(c, cx, g.H * 0.42, 4, PAL.hibiscus);
          text(c, g.tr({ en: '3 PM SHARP!', fr: '15H PÉTANTES !' }), cx, g.H * 0.42 - 50, { size: 16, color: PAL.hibiscus, shadow: false, weight: 800 });
        }
        // Office floor with moving tiles.
        c.fillStyle = vgrad(c, floorTop, floorBot, ['#e8d9c2', '#cbb596']);
        c.fillRect(0, floorTop, g.W, floorBot - floorTop);
        c.strokeStyle = 'rgba(120,90,60,0.18)';
        c.lineWidth = 2;
        for (let i = 0; i < 9; i++) {
          const x = ((i * 70 - s.dist) % 630 + 630) % 630 - 70;
          c.beginPath();
          c.moveTo(x, floorTop);
          c.lineTo(x - 60, floorBot);
          c.stroke();
        }
        for (const ry of ROWS) ellipse(c, 200, ry + 2, 210, 3, 'rgba(255,255,255,0.22)');
        c.fillStyle = '#b39a7a';
        c.fillRect(0, floorBot, g.W, g.H - floorBot);
        // Outside the exit: sky, palms, parking.
        if (doorX < g.W + 40) {
          c.save();
          c.beginPath();
          c.rect(doorX, 0, g.W + 60, g.H);
          c.clip();
          sky(c, g.W, floorTop, ['#58bdf0', '#ffd59e']);
          sun(c, doorX + 230, g.H * 0.16, 24);
          for (let i = 0; i < 4; i++) palm(c, doorX + 50 + i * 140, floorTop + 8, g.H * 0.26, t + i, i % 2 ? -0.12 : 0.14);
          c.fillStyle = vgrad(c, floorTop, floorBot, ['#77798a', '#55576a']);
          c.fillRect(doorX, floorTop, g.W + 60, floorBot - floorTop);
          c.fillStyle = 'rgba(255,255,255,0.75)';
          for (let i = 0; i < 6; i++) {
            c.save();
            c.translate(doorX + 70 + i * 90, floorTop + 10);
            c.rotate(-0.35);
            c.fillRect(-3, 0, 6, floorBot - floorTop - 40);
            c.restore();
          }
          c.fillStyle = '#4a4c5c';
          c.fillRect(doorX, floorBot, g.W + 60, g.H - floorBot);
          c.restore();
          // Door frame and the green EXIT sign.
          shadowed(c, () => {
            rrect(c, doorX - 14, g.H * 0.1, 28, floorBot - g.H * 0.1, 8);
            c.fillStyle = '#d9d2c4';
            c.fill();
          }, 12, 4);
          shadowed(c, () => {
            rrect(c, doorX - 66, g.H * 0.08, 132, 40, 10);
            c.fillStyle = '#1fae5c';
            c.fill();
          }, 16, 4, 'rgba(40,220,120,0.5)');
          text(c, g.tr({ en: 'EXIT ➜', fr: 'SORTIE ➜' }), doorX, g.H * 0.08 + 21, { size: 20, color: '#ffffff', shadow: false, weight: 800 });
        }
        // Back-to-front: obstacles, hero, Romain, the Fiat Panda.
        const list = [];
        for (const o of obs) {
          if (o.state !== 'tell' && !(o.state === 'passed' && screenX(o) > -120)) continue;
          const x = screenX(o);
          if (x > g.W + 120) continue;
          o.items.forEach((kind, i) => {
            const r = rowOf(o, i);
            list.push({ y: ROWS[r], draw: () => {
              const k = SCALE[r];
              if (kind === 'desk') desk(c, x, ROWS[r], k, t);
              else if (kind === 'printer') printer(c, x, ROWS[r], k, t);
              else {
                person(c, colleague, x, ROWS[r], 150 * k, 'point', t + i, { flip: true });
                const [fx, fy] = handOf(colleague, x, ROWS[r], 150 * k, 'point', t + i, true);
                rrect(c, fx - 20 * k, fy - 12 * k, 26 * k, 20 * k, 3);
                c.fillStyle = '#f2c46d';
                c.fill();
                if (x < g.W - 20 && x > heroX + 40) bubble(c, g.tr({ en: 'One last thing!', fr: 'Un dernier truc !' }), x, ROWS[r] - 150 * k - 8, { size: 14 });
              }
            } });
          });
        }
        const carX = heroX + 165 + doorDist - s.dist;
        if (carX < g.W + 140) list.push({ y: ROWS[1] + 1, draw: () => fiatPanda(c, carX, ROWS[1] + 6, t, { color: '#e8edf2' }) });
        list.push({ y: s.y + 0.5, draw: () => {
          const pose = s.crashed ? 'sad' : s.won ? 'cheer' : 'run';
          c.save();
          if (s.crashed) {
            c.translate(heroX, s.y);
            c.rotate(-0.5 * s.crash);
            c.translate(-heroX, -s.y);
          }
          person(c, g.hero, heroX, s.y, 150 * s.sc, pose, t * 1.25, { hat: g.hat });
          c.restore();
          if (s.moving > 0) for (let i = 0; i < 3; i++) ellipse(c, heroX - 40 - i * 16, s.y - 30 - i * 12, 12 - i * 3, 3, 'rgba(255,255,255,0.6)');
        } });
        const rx = heroX + s.rw - s.dist;
        list.push({ y: s.ry - 0.5, draw: () => {
          const rk = SCALE[Math.max(0, ROWS.findIndex((r) => r >= s.ry - 1))] || 1;
          person(c, chaser, rx, s.ry, 150 * rk, s.crashed ? 'point' : s.won ? 'sad' : 'run', t * 1.25 + 0.4, {});
          const [fx, fy] = handOf(chaser, rx, s.ry, 150 * rk, s.crashed ? 'point' : 'run', t * 1.25 + 0.4);
          rrect(c, fx - 6, fy - 14, 28, 22, 3);
          c.fillStyle = '#f2c46d';
          c.fill();
          if (!g.done) for (let i = 0; i < 2; i++) ellipse(c, rx + 30 + i * 12, s.ry - 160 * rk + ((t * 50 + i * 11) % 20), 3, 5, '#9fd8ff');
        } });
        list.sort((p, q) => p.y - q.y).forEach((d) => d.draw());
        // Red "!" flags on the right edge: the tell for each incoming row.
        for (const o of obs) {
          if (o.state !== 'tell') continue;
          const x = screenX(o);
          if (x < g.W - 30) continue;
          const pulse = 1 + 0.12 * Math.sin(t * 20);
          for (const r of o.lanes) {
            c.save();
            c.translate(g.W - 30, ROWS[r] - 60);
            c.scale(pulse, pulse);
            shadowed(c, () => circle(c, 0, 0, 20, '#ff4d5e'), 12, 3, 'rgba(255,60,80,0.6)');
            text(c, '!', 0, 1, { size: 28, color: '#ffffff', shadow: false, weight: 800 });
            c.restore();
          }
        }
        // Progress to the exit with the hero's head riding it.
        const prog = Math.min(1, s.dist / doorDist);
        bossBar(c, 120, 88, 262, prog, { label: g.tr({ en: 'EXIT', fr: 'SORTIE' }), color: PAL.leaf });
        head(c, g.hero, 120 + 262 * prog, 96, 36, { hat: g.hat });
        bossBanner(c, g.W, g.H * 0.26, t, banner, g.tr({ en: '3 PM Sharp', fr: '15h pétantes' }), g.tr({ en: `Escape ${chaserName}!`, fr: `Échappe à ${chaserName} !` }), PAL.hibiscus);
      },
      bot() {
        const next = [Infinity, Infinity, Infinity];
        for (const o of obs) if (o.state === 'tell') for (const l of o.lanes) next[l] = Math.min(next[l], o.arrive);
        const better = (p, q) => next[p] > next[q] || (next[p] === next[q] && Math.abs(p - s.lane) < Math.abs(q - s.lane));
        let best = s.lane;
        for (let l = 0; l < 3; l++) if (better(l, best)) best = l;
        if (best === s.lane) return null;
        const step = best > s.lane ? 1 : -1;
        if (next[s.lane + step] - s.t < 0.05) return null;
        return { swipe: step > 0 ? 'down' : 'up' };
      },
    };
  },
};
