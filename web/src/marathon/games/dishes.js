// Rue Taine, at Cous's (world 3): Cous never did the dishes, and when the
// hero stayed at his place the sink was full of crusty plates, cockroaches and
// flies. DRAG your finger (a sponge) over the dirt to scrub each plate clean.
// Cockroaches peek out of the sink (antennae wiggle, "tic tic"), then dash
// across the plate: touch one with the sponge and it is over ("BEURK!").

import { rrect, circle, ellipse, PAL, text, shadowed, person, vgrad } from '../art.js';

const PLATE_R = 118;
const SPOT_R = 26;
const REACH = SPOT_R + 14; // the sponge scrubs a spot within this distance
const RUB = 120; // px of scrubbing to clean one spot
const ROACH_HIT = 30;
const DIRT = ['#c8372b', '#e0b52c', '#8a5a2b', '#6f8f2e']; // ketchup, mustard, sauce, pesto

/** One cockroach heading `dir` (radians), legs scuttling with t. */
function roach(c, x, y, dir, t, run) {
  c.save();
  c.translate(x, y);
  c.rotate(dir);
  c.strokeStyle = '#2b1a0e';
  c.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    const k = run ? Math.sin(t * 30 + i * 2) * 4 : 0;
    c.beginPath();
    c.moveTo(i * 6, 0);
    c.lineTo(i * 6 + k, -14);
    c.moveTo(i * 6, 0);
    c.lineTo(i * 6 - k, 14);
    c.stroke();
  }
  // antennae: they wiggle hard during the peek
  const w = Math.sin(t * (run ? 10 : 22)) * 0.35;
  c.beginPath();
  c.moveTo(14, -3);
  c.quadraticCurveTo(26, -10, 34, -14 + w * 12);
  c.moveTo(14, 3);
  c.quadraticCurveTo(26, 10, 34, 14 - w * 12);
  c.stroke();
  ellipse(c, 0, 0, 17, 9, '#5b3214');
  ellipse(c, 12, 0, 6, 6, '#3d200c');
  ellipse(c, -3, -3, 9, 3, 'rgba(255,220,180,0.35)');
  c.restore();
}

/** A buzzing fly or mosquito (just there to be gross). */
function fly(c, x, y, t) {
  ellipse(c, x - 5, y - 4, 6, 3, 'rgba(220,235,255,0.7)', Math.sin(t * 60) * 0.6 - 0.4);
  ellipse(c, x + 5, y - 4, 6, 3, 'rgba(220,235,255,0.7)', -Math.sin(t * 60) * 0.6 + 0.4);
  circle(c, x, y, 4, '#1e1e24');
}

function plateArt(c, x, y, r, shine) {
  shadowed(c, () => circle(c, x, y, r, '#f7f7f2'), 12, 5);
  circle(c, x, y, r * 0.66, '#ecece4');
  c.strokeStyle = 'rgba(42,63,143,0.35)';
  c.lineWidth = 4;
  c.beginPath();
  c.arc(x, y, r * 0.86, 0, Math.PI * 2);
  c.stroke();
  if (shine) ellipse(c, x - r * 0.35, y - r * 0.4, r * 0.25, r * 0.08, `rgba(255,255,255,${shine})`, -0.6);
}

export default {
  id: 'dishes',
  world: 'w03',
  input: 'drag',
  base: 6.5,
  min: 4,
  survive: false,
  verb: { en: 'SCRUB!', fr: 'FROTTE !' },
  title: { en: 'The rue Taine dishes', fr: 'La vaisselle d’la rue Taine' },
  howto: {
    en: 'Cous never does the dishes. Rub the dirt off every plate, but don’t touch the cockroaches!',
    fr: 'Cous fait jamais sa vaisselle. Frotte la crasse des assiettes, mais touche pas les cafards !',
  },
  winLine: { en: 'Squeaky clean, rue Taine!', fr: 'Ça brille, rue Taine !' },
  rival: ['cous', 'babar'],
  rivalLine: { en: 'I was gonna do it tomorrow…', fr: 'J’allais la faire d’main…' },
  loseLine: { en: 'Hoho… a cockroach up the sleeve!', fr: 'Hoho… un cafard dans la manche !' },
  create(g) {
    const { W, H } = g;
    const lazy = g.hero === 'cous' ? g.friend() : 'cous';
    const counterY = H * 0.36;
    const cx = 200;
    const cy = H * 0.6;
    const plates = 2;
    const roachV = 230 * Math.pow(g.speed, 0.6); // a quick dash across the plate
    const peekT = 0.55 / Math.sqrt(g.speed);
    const gap = () => (0.5 + g.random() * 0.5) / Math.sqrt(g.speed); // after the last one has gone
    const spotsPer = g.speed < 1.6 ? 3 : 2;

    function makePlate() {
      const spots = [];
      const first = Math.floor(g.random() * DIRT.length);
      for (let i = 0; i < spotsPer; i++) {
        const a = (i / spotsPer) * Math.PI * 2 + g.random() * 1.2;
        const r = 30 + g.random() * 40;
        spots.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, dirt: 1, col: DIRT[(first + i) % DIRT.length], seed: g.random() * 10 });
      }
      return spots;
    }

    const s = {
      t: 0,
      plate: makePlate(),
      done: 0, // plates cleaned
      slide: 0, // 0..1 while a clean plate slides to the rack
      down: false,
      x: cx,
      y: cy,
      roaches: [],
      nextRoach: (0.5 + g.random() * 0.4) / g.speed,
      side: g.random() < 0.5 ? -1 : 1,
      flies: [0, 1, 2].map((i) => ({ a: i * 2.1, r: 50 + i * 20, sp: 2 + i * 0.7 })),
      lostAt: null,
      shine: 0,
      bubbles: [],
      timeoutSaid: false,
      botA: 0,
    };

    function spawnRoach() {
      const side = s.side;
      s.side = -s.side;
      const y0 = cy + (g.random() - 0.5) * 170;
      const y1 = cy + (g.random() - 0.5) * 120;
      const x0 = cx + side * (PLATE_R + 34);
      const x1 = cx - side * (PLATE_R + 60);
      s.roaches.push({ x0, y0, x1, y1, x: x0, y: y0, k: 0, peek: peekT, len: Math.hypot(x1 - x0, y1 - y0), dir: Math.atan2(y1 - y0, x1 - x0) });
      g.sfx.tick();
    }

    /** Closest a roach gets to (x, y) over the next `ahead` seconds (for the bot). */
    const nearest = (r, x, y, ahead) => {
      let best = Infinity;
      for (let tau = 0; tau <= ahead; tau += 0.05) {
        const k = Math.min(1, r.k + (Math.max(0, tau - r.peek) * roachV) / r.len);
        best = Math.min(best, Math.hypot(r.x0 + (r.x1 - r.x0) * k - x, r.y0 + (r.y1 - r.y0) * k - y));
      }
      return best;
    };

    function scrub(dist) {
      if (s.slide || g.done) return;
      let any = false;
      for (const p of s.plate) {
        if (p.dirt <= 0) continue;
        if (Math.hypot(cx + p.x - s.x, cy + p.y - s.y) > REACH) continue;
        p.dirt = Math.max(0, p.dirt - dist / RUB);
        any = true;
        if (p.dirt === 0) {
          g.sfx.pop();
          g.fx.burst(cx + p.x, cy + p.y, { kind: 'spark', n: 8, colors: ['#ffffff', '#bfefff'], speed: 120 });
        }
      }
      if (any && g.random() < 0.3) s.bubbles.push({ x: s.x + (g.random() - 0.5) * 40, y: s.y + (g.random() - 0.5) * 30, r: 4 + g.random() * 7, life: 0.8 });
      if (s.plate.every((p) => p.dirt <= 0)) {
        s.done++;
        g.sfx.coin();
        g.fx.text(cx, cy - PLATE_R - 20, g.tr({ en: 'Clean!', fr: 'Propre !' }), { size: 24, color: PAL.cream });
        if (s.done >= plates) {
          s.shine = 1;
          g.sfx.good();
          g.fx.burst(cx, cy, { kind: 'confetti', n: 36 });
          g.say(240, 165, g.tr({ en: 'Squeaky clean!', fr: 'Ça brille !' }), 1.4);
          g.win();
        } else {
          s.slide = 0.001;
        }
      }
    }

    function gross(r) {
      s.lostAt = r;
      g.sfx.bad();
      g.fx.shake(10);
      g.fx.text(s.x, s.y - 50, g.tr({ en: 'YUCK!', fr: 'BEURK !' }), { size: 34, color: '#c8f56b' });
      g.say(240, 165, g.tr({ en: 'It’s on my hand!!', fr: 'Il est sur ma main !!' }), 1.5);
      g.lose();
    }

    return {
      update(dt) {
        s.t += dt;
        s.shine = Math.max(0, s.shine - dt * 0.5);
        for (const f of s.flies) f.a += f.sp * dt;
        for (const b of s.bubbles) {
          b.life -= dt;
          b.y -= dt * 20;
        }
        s.bubbles = s.bubbles.filter((b) => b.life > 0);
        if (s.slide) {
          s.slide += dt * 3.5;
          if (s.slide >= 1) {
            s.slide = 0;
            s.plate = makePlate();
          }
        }
        if (g.done) {
          if (!g.won && !s.lostAt && !s.timeoutSaid) {
            s.timeoutSaid = true;
            g.sfx.bad();
            g.say(80, counterY - 60, g.tr({ en: 'Leave it, I’ll do it tomorrow!', fr: 'Laisse, j’la f’rai d’main !' }), 1.4);
          }
          return;
        }
        // One cockroach at a time: the next one waits until the last has gone.
        if (!s.roaches.length) s.nextRoach -= dt;
        if (s.nextRoach <= 0 && !s.roaches.length) {
          spawnRoach();
          s.nextRoach = gap();
        }
        for (const r of s.roaches) {
          if (r.peek > 0) {
            r.peek -= dt;
            if (r.peek <= 0) g.sfx.whoosh();
          } else {
            r.k += (roachV * dt) / r.len;
          }
          r.x = r.x0 + (r.x1 - r.x0) * r.k;
          r.y = r.y0 + (r.y1 - r.y0) * r.k;
          if (s.down && r.peek <= 0 && Math.hypot(r.x - s.x, r.y - s.y) < ROACH_HIT) {
            gross(r);
            return;
          }
        }
        s.roaches = s.roaches.filter((r) => r.k < 1);
      },
      press(x, y) {
        if (g.done) return;
        s.down = true;
        s.x = x;
        s.y = y;
        g.sfx.tap();
      },
      move(x, y) {
        if (!s.down || g.done) return;
        const d = Math.hypot(x - s.x, y - s.y);
        s.x = x;
        s.y = y;
        scrub(Math.min(d, 60));
      },
      release() {
        s.down = false;
      },
      draw(c) {
        const t = s.t;
        // Back wall, a doorway to the living room where the lazy one lounges.
        c.fillStyle = vgrad(c, 0, counterY, ['#cfe3d6', '#b9d2c3']);
        c.fillRect(0, 0, W, counterY);
        rrect(c, 14, 100, 150, counterY - 100 + 20, 10);
        c.fillStyle = '#7d6a8f';
        c.fill();
        rrect(c, 20, counterY - 112, 138, 80, 16);
        c.fillStyle = '#c0582f';
        c.fill(); // sofa back
        person(c, lazy, 88, counterY - 10, 150, g.done ? (g.won ? 'point' : 'cheer') : 'sit', t + 2);
        rrect(c, 16, counterY - 40, 146, 34, 12);
        c.fillStyle = '#a84a27';
        c.fill(); // sofa seat
        // The blue street plaque: rue Taine.
        shadowed(c, () => {
          rrect(c, 178, 104, 104, 36, 6);
          c.fillStyle = '#1f4e9c';
          c.fill();
        }, 6, 3);
        rrect(c, 181, 107, 98, 30, 4);
        c.strokeStyle = '#ffffff';
        c.lineWidth = 2;
        c.stroke();
        text(c, 'RUE TAINE', 230, 122, { size: 14, color: '#ffffff', shadow: false });
        // The hero at the sink, behind the counter.
        person(c, g.hero, 320, counterY + 70, 230, g.done ? (g.won ? 'cheer' : 'sad') : 'idle', t, { flip: true, hat: g.hat });
        // Counter and the steel sink.
        c.fillStyle = vgrad(c, counterY, H, ['#e5dccd', '#cbbfa9']);
        c.fillRect(0, counterY, W, H - counterY);
        shadowed(c, () => {
          rrect(c, 24, counterY + 24, W - 48, H * 0.84 - counterY - 24, 28);
          c.fillStyle = vgrad(c, counterY + 24, H * 0.84, ['#8d96a3', '#b9c1cc']);
          c.fill();
        }, 6, -3, 'rgba(20,20,40,0.35)');
        // Grey dishwater, the pile still to do (left) and the rack (right).
        ellipse(c, cx, H * 0.8, 150, 26, 'rgba(120,128,110,0.5)');
        for (let i = 0; i < 5 - s.done; i++) ellipse(c, 78, H * 0.79 - i * 7, 46, 12, i % 2 ? '#e9e6dc' : '#d8d2c2');
        c.strokeStyle = '#d0d5dd';
        c.lineWidth = 4;
        for (let i = 0; i < 5; i++) {
          c.beginPath();
          c.moveTo(300 + i * 14, H * 0.74);
          c.lineTo(300 + i * 14, H * 0.82);
          c.stroke();
        }
        for (let i = 0; i < s.done; i++) ellipse(c, 312 + i * 14, H * 0.76, 6, 30, '#ffffff');
        // Bubbles of grime on the rim (the flies like it here).
        circle(c, 60, H * 0.45, 9, 'rgba(110,90,40,0.55)');
        circle(c, 340, H * 0.47, 7, 'rgba(110,90,40,0.55)');

        // The plate being scrubbed (slides to the rack when clean).
        const px = cx + s.slide * 160;
        const py = cy - Math.sin(s.slide * Math.PI) * 40;
        const pr = PLATE_R * (1 - s.slide * 0.6);
        plateArt(c, px, py, pr, 0.6 + s.shine * 0.4);
        if (!s.slide) {
          for (const p of s.plate) {
            if (p.dirt <= 0) continue;
            c.globalAlpha = Math.min(1, 0.25 + p.dirt);
            const rr = SPOT_R * (0.55 + 0.45 * p.dirt);
            ellipse(c, cx + p.x, cy + p.y, rr, rr * 0.8, p.col, p.seed);
            circle(c, cx + p.x + rr * 0.5, cy + p.y - rr * 0.3, rr * 0.4, p.col);
            circle(c, cx + p.x - rr * 0.6, cy + p.y + rr * 0.2, rr * 0.3, p.col);
            c.globalAlpha = 1;
          }
        }
        for (const b of s.bubbles) {
          c.strokeStyle = `rgba(255,255,255,${b.life})`;
          c.lineWidth = 2;
          c.beginPath();
          c.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          c.stroke();
        }
        // Cockroaches: peeking (wiggling antennae, a red "!") then dashing.
        for (const r of s.roaches) {
          roach(c, r.x, r.y, r.dir, t, r.peek <= 0);
          if (r.peek > 0) text(c, '!', r.x, r.y - 30, { size: 26, color: '#ff5a4f' });
        }
        // Flies circling the sink.
        for (const f of s.flies) fly(c, cx + Math.cos(f.a) * (PLATE_R + f.r * 0.4), cy - 40 + Math.sin(f.a * 1.3) * f.r, t + f.a);
        // The sponge under the finger.
        if (s.down || s.lostAt) {
          c.save();
          c.translate(s.x, s.y);
          c.rotate(Math.sin(t * 20) * 0.1);
          rrect(c, -26, -16, 52, 32, 8);
          c.fillStyle = '#ffd84a';
          c.fill();
          rrect(c, -26, -16, 52, 11, 6);
          c.fillStyle = '#3fa65a';
          c.fill();
          c.restore();
        }
        if (s.lostAt) roach(c, s.x + 6, s.y - 6, -0.8, t, true);
        // Plates left.
        if (!g.done) text(c, `🍽️ ×${plates - s.done}`, 330, counterY + 50, { size: 22, color: PAL.cream, stroke: '#4a5566' });
      },
      bot() {
        if (s.slide) return s.down ? { release: [s.x, s.y] } : null;
        const live = s.roaches.filter((r) => r.k < 1);
        const safe = (x, y) => live.every((r) => nearest(r, x, y, 0.55) > ROACH_HIT + 34);
        const target = s.plate
          .filter((p) => p.dirt > 0 && safe(cx + p.x, cy + p.y))
          .sort((a, b) => Math.hypot(cx + a.x - s.x, cy + a.y - s.y) - Math.hypot(cx + b.x - s.x, cy + b.y - s.y))[0];
        if (!target || (s.down && !safe(s.x, s.y))) return s.down ? { release: [s.x, s.y] } : null;
        s.botA += 0.3;
        const x = cx + target.x + Math.cos(s.botA) * 16;
        const y = cy + target.y + Math.sin(s.botA) * 16;
        return s.down ? { move: [x, y] } : { press: [x, y] };
      },
    };
  },
};
