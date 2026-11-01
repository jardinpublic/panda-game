// BOSS, world 10: Babar's barbecue barrage. Spit gobs ("Hrrrk", green target
// ring) and lighter dashes ("Tchik!", orange ring: he charges down the lane,
// lighter first) come down 3 lanes, aimed at the hero. SWIPE left/right to
// dodge for the whole fight. Three phases: spits, then dashes, then double
// spits. His breath gauge drains; it ends with Babar out of breath.

import { scene, person, circle, ellipse, rrect, PAL, text, shadowed } from '../art.js';
import { handOf, drawLighter } from './lighter.js';
import { bossBanner, bossBar } from './boss-croco.js';

const LANES = [95, 200, 305];
const ease = (k) => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
const GOB = ['#d8f0c0', '#b5df9a', '#ffffff'];

export default {
  id: 'boss-babar',
  world: 'w10',
  input: 'swipe',
  base: 9,
  survive: true,
  boss: true,
  verb: { en: 'SURVIVE BABAR!', fr: 'SURVIS À BABAR !' },
  title: { en: "BOSS: Babar unleashed", fr: "BOSS : Babar déchaîné" },
  howto: { en: "Spits and lighter charges from every lane. Swipe to dodge until he runs out of breath.", fr: "Crachats et charges au briquet de partout. Glisse pour esquiver jusqu'à ce qu'il soit à bout de souffle." },
  winLine: { en: "Babar is out of breath!", fr: "Babar est à bout de souffle !" },
  rival: ["babar", "mamar"],
  rivalLine: { en: "Ah ben mon Romain… I'm out of breath.", fr: "Ah ben mon Romain… j'ai plus de souffle." },
  loseLine: { en: "Hoho, stop it, Babar!", fr: "Hoho, arrête Babar !" },
  create(g) {
    const K = 1 / Math.sqrt(g.speed);
    const villain = g.cast('babar', 'mamar');
    const name = villain[0].toUpperCase() + villain.slice(1);
    const friend = g.friend([villain]);
    const topY = g.H * 0.42;
    const heroY = Math.min(g.H * 0.86, g.H - 70);
    const mouthY = topY - 92;
    const hitY = heroY - 120;
    const TELL = { spit: 0.5 * K, dash: 0.62 * K, double: 0.62 * K };
    const FLY = { spit: 0.5 * K, dash: 0.42 * K, double: 0.55 * K };
    const BACK = 0.45 * K;
    const banner = 1.3 * K;

    // The whole fight is scheduled up front; lanes are aimed when each tell starts.
    const events = [];
    let free = 1.1 * K;
    let last = -9;
    let prev = '';
    const endBy = g.duration - 0.5 * K;
    for (let i = 0; i < 40; i++) {
      const p = free / g.duration;
      let kind = 'spit';
      if (p >= 0.62) kind = prev !== 'double' && g.random() < 0.6 ? 'double' : prev === 'dash' ? 'spit' : 'dash';
      else if (p >= 0.32) kind = prev !== 'dash' && g.random() < 0.55 ? 'dash' : 'spit';
      const gapNeeded = (kind === 'double' || prev === 'double' ? 0.85 : 0.55) * K;
      let start = free;
      let arrive = start + TELL[kind] + FLY[kind];
      if (arrive < last + gapNeeded) {
        start += last + gapNeeded - arrive;
        arrive = last + gapNeeded;
      }
      if (arrive > endBy) break;
      events.push({ kind, start, launch: start + TELL[kind], arrive, lanes: [], state: 'wait', x0: 200 });
      last = arrive;
      prev = kind;
      free = kind === 'dash' ? arrive + BACK : start + TELL[kind] + 0.1 * K;
    }
    const endAt = last + 0.35 * K;
    const s = { t: 0, lane: 1, x: LANES[1], moving: 0, bx: 200, by: topY, bsize: 150, hit: '', started: false, phaseShown: 0, trailT: 0 };

    function hitBy(e) {
      if (e.kind === 'dash') {
        s.hit = 'burn';
        g.sfx.hit();
        g.sfx.sizzle();
        g.fx.shake(18);
        g.fx.flash('rgba(255,150,60,0.4)', 0.2);
        g.fx.burst(s.x - 20, heroY - 80, { kind: 'spark', n: 44, colors: [PAL.mango, '#fff3c4', PAL.coral], speed: 420 });
        g.fx.burst(s.x - 20, heroY - 80, { kind: 'smoke', n: 10, speed: 70 });
        g.fx.text(s.x, heroY - 230, g.tr({ en: 'OUCH!', fr: 'AÏE !' }), { size: 54, color: PAL.coral });
      } else {
        s.hit = 'spit';
        g.sfx.splash();
        g.fx.shake(14);
        g.fx.burst(s.x, hitY, { kind: 'drop', colors: GOB, n: 34, speed: 340 });
        g.fx.text(s.x, heroY - 230, g.tr({ en: 'SPLAT!', fr: 'SPLATCH !' }), { size: 48, color: '#c9f0a8' });
      }
      g.say(s.bx, s.by - 170, g.tr({ en: 'Hehehe!', fr: 'Héhéhé !' }));
      g.lose();
    }

    function dashEvent() {
      return events.find((e) => e.kind === 'dash' && s.t >= e.start && s.t < e.arrive + BACK);
    }

    return {
      update(dt) {
        s.t += dt;
        s.x += (LANES[s.lane] - s.x) * Math.min(1, dt * 18);
        s.moving = Math.max(0, s.moving - dt);
        if (!s.started) {
          s.started = true;
          g.sfx.boss?.();
        }
        // Babar's body follows his current move (also after the end).
        const d = !g.done && dashEvent();
        if (d) {
          const lx = LANES[d.lanes[0] ?? s.lane];
          if (s.t < d.launch) {
            s.bx += (lx - s.bx) * Math.min(1, dt * 10);
            s.by = topY;
          } else if (s.t < d.arrive) {
            s.bx = lx;
            s.by = topY + (heroY - 8 - topY) * ease((s.t - d.launch) / FLY.dash);
          } else {
            const k = ease((s.t - d.arrive) / BACK);
            s.by = heroY - 8 + (topY - heroY + 8) * k;
            s.bx += (200 - s.bx) * Math.min(1, dt * 6);
          }
        } else {
          s.by += (topY - s.by) * Math.min(1, dt * 8);
          const aim = events.find((e) => e.state === 'tell' && e.kind === 'spit');
          const tx = aim ? LANES[aim.lanes[0]] * 0.6 + 80 : 200;
          s.bx += (tx - s.bx) * Math.min(1, dt * 5);
        }
        s.bsize = 150 + 40 * ((s.by - topY) / (heroY - topY));
        if (g.done) return;
        for (const e of events) {
          if (e.state === 'wait' && s.t >= e.start) {
            e.state = 'tell';
            e.lanes = [s.lane];
            if (e.kind === 'double') e.lanes.push((s.lane + 1 + Math.floor(g.random() * 2)) % 3);
            if (e.kind === 'dash') g.sfx.tick(true);
            else g.sfx.tick();
          }
          if (e.state === 'tell' && s.t >= e.launch) {
            e.state = 'fly';
            e.x0 = s.bx;
            g.sfx.whoosh();
          }
          if (e.state === 'fly' && s.t >= e.arrive) {
            e.state = 'done';
            if (e.lanes.includes(s.lane)) {
              hitBy(e);
              return;
            }
            g.sfx.pop();
            if (e.kind === 'dash') g.fx.burst(LANES[e.lanes[0]], heroY - 80, { kind: 'spark', n: 12, colors: [PAL.mango, '#fff3c4'], speed: 200 });
          }
        }
        if (d && s.t >= d.launch && s.t < d.arrive) {
          s.trailT -= dt;
          if (s.trailT <= 0) {
            s.trailT = 0.05;
            const [hx, hy] = handOf(villain, s.bx, s.by, s.bsize, 'run', s.t);
            g.fx.burst(hx, hy - 10, { kind: 'spark', n: 3, colors: [PAL.mango, '#ffd34d'], speed: 90 });
          }
        }
        const phase = s.t / g.duration < 0.32 ? 1 : s.t / g.duration < 0.62 ? 2 : 3;
        if (phase > s.phaseShown) {
          s.phaseShown = phase;
          if (phase > 1) {
            g.sfx.speedup();
            g.fx.text(200, g.H * 0.2, phase === 2 ? g.tr({ en: 'THE LIGHTER!', fr: 'LE BRIQUET !' }) : g.tr({ en: 'DOUBLE SPIT!', fr: 'DOUBLE CRACHAT !' }), { size: 34, color: PAL.mango, life: 1.2 });
          }
        }
        if (s.t >= endAt && events.every((e) => e.state === 'done')) {
          g.sfx.good();
          g.sfx.hoho();
          g.fx.burst(200, g.H * 0.45, { kind: 'confetti', n: 80, speed: 520 });
          g.fx.burst(s.bx, s.by - 80, { kind: 'drop', n: 16, colors: ['#9fd8ff', '#ffffff'], speed: 200 });
          g.fx.text(200, g.H * 0.22, g.tr({ en: 'BABAR IS OUT OF BREATH!', fr: 'BABAR EST À BOUT DE SOUFFLE !' }).replace('BABAR', name.toUpperCase()), { size: 26, color: PAL.mango, life: 1.6 });
          g.say(s.bx, s.by - 160, g.tr({ en: 'Pff… pff… time out…', fr: 'Pff… pff… pause…' }), 1.8);
          g.win();
        }
      },
      swipe(dir) {
        if (dir === 'left' && s.lane > 0) s.lane--;
        else if (dir === 'right' && s.lane < 2) s.lane++;
        else return;
        s.moving = 0.25;
        g.sfx.tap();
      },
      press(x) {
        // Tapping a side also dodges, for one-thumb comfort (like spit.js).
        this.swipe(x < s.x - 40 ? 'left' : x > s.x + 40 ? 'right' : '');
      },
      draw(c) {
        const t = s.t;
        scene.yard(c, g.W, g.H, t);
        // Barbecue behind Babar.
        shadowed(c, () => {
          rrect(c, 300, topY - 64, 76, 44, 12);
          c.fillStyle = '#2b2b33';
          c.fill();
        }, 14, 5);
        for (let i = 0; i < 3; i++) {
          const f = 0.6 + 0.4 * Math.sin(t * 7 + i * 2);
          circle(c, 316 + i * 22, topY - 58, 9, `rgba(255,${120 + 60 * f},40,${0.7 * f})`);
          circle(c, 314 + i * 20, topY - 74 - ((t * 40 + i * 13) % 34), 7 + i, 'rgba(240,240,250,0.5)');
        }
        person(c, friend, 40, topY + 18, 110, g.done ? (g.won ? 'dance' : 'cheer') : 'idle', t + 0.8, {});
        // Lane marks and the tells on the grass.
        for (const lx of LANES) ellipse(c, lx, heroY + 4, 46, 12, 'rgba(255,255,255,0.18)');
        for (const e of events) {
          if (e.state !== 'tell' && e.state !== 'fly') continue;
          const k = Math.min(1, (t - e.start) / (e.arrive - e.start));
          const pulse = 0.5 + 0.5 * Math.sin(t * (10 + k * 14));
          for (const l of e.lanes) {
            const col = e.kind === 'dash' ? `rgba(255,110,50,${0.3 + 0.45 * k * pulse + 0.15})` : `rgba(170,235,130,${0.3 + 0.45 * k * pulse + 0.15})`;
            ellipse(c, LANES[l], heroY + 4, 40 + 14 * k, 12 + 4 * k, col);
            text(c, e.kind === 'dash' ? '🔥' : '⚠', LANES[l], heroY + 36, { size: 18, shadow: false });
          }
        }
        // Spit gobs in flight.
        for (const e of events) {
          if (e.kind === 'dash' || e.state !== 'fly') continue;
          const k = Math.min(1.2, (t - e.launch) / (e.arrive - e.launch));
          for (const l of e.lanes) {
            const x = e.x0 + (LANES[l] - e.x0) * k;
            const y = mouthY + (hitY - mouthY) * k - Math.sin(Math.min(1, k) * Math.PI) * 50;
            const r = 8 + k * 18;
            ellipse(c, x, heroY + 6, r * 0.9, r * 0.25, 'rgba(0,0,0,0.12)');
            for (let i = 1; i < 4; i++) circle(c, x - (x - e.x0) * 0.05 * i, y - i * 10, r * (0.5 - i * 0.1), 'rgba(220,245,200,0.6)');
            const grad = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(1, '#a8d98a');
            circle(c, x, y, r, grad);
          }
        }
        // Babar and the hero, back to front.
        const d = dashEvent();
        const tired = g.done && g.won;
        const aiming = !g.done && events.find((e) => e.state === 'tell');
        let bpose = 'idle';
        if (tired) bpose = 'sit';
        else if (d && t >= d.launch) bpose = 'run';
        else if (aiming) bpose = 'point';
        else if (g.done) bpose = 'cheer';
        const drawBabar = () => {
          const sq = aiming && aiming.kind !== 'spit' ? 0.92 : tired ? 0.96 + Math.sin(t * 10) * 0.03 : 1;
          person(c, villain, s.bx, s.by, s.bsize, bpose, t, { squash: sq });
          const headY = s.by - s.bsize * 0.62;
          if (aiming && aiming.kind !== 'dash') {
            circle(c, s.bx - 18, headY + 8, 9, 'rgba(255,140,140,0.65)');
            circle(c, s.bx + 16, headY + 8, 9, 'rgba(255,140,140,0.65)');
            text(c, 'Hrrrk…', s.bx + 72, headY - 50, { size: 20, color: PAL.cream, stroke: 'rgba(30,20,50,0.45)' });
          }
          if ((d && !tired) || (aiming && aiming.kind === 'dash')) {
            const [hx, hy] = handOf(villain, s.bx, s.by, s.bsize, bpose, t, false, sq);
            drawLighter(c, hx + 2, hy, d && t >= d.launch ? 1.7 : 1.2 + 0.3 * Math.sin(t * 20), t, s.bsize / 150);
            if (bpose === 'point') text(c, 'Tchik! Tchik!', hx, hy - 58, { size: 17, color: PAL.cream, stroke: 'rgba(30,20,50,0.5)' });
          }
          if (tired) {
            for (let i = 0; i < 3; i++) ellipse(c, s.bx - 40 + i * 40, headY - 20 + ((t * 50 + i * 17) % 40), 3.5, 6, '#9fd8ff');
            text(c, '💨', s.bx + 50, headY + 10 + Math.sin(t * 6) * 4, { size: 24, shadow: false });
          }
        };
        const drawHero = () => {
          const pose = s.hit ? 'sad' : g.done && g.won ? 'cheer' : s.moving > 0 ? 'run' : 'idle';
          const jump = s.hit === 'burn' ? Math.abs(Math.sin(t * 9)) * 18 : 0;
          person(c, g.hero, s.x, heroY - jump, 170, pose, t, { hat: g.hat });
          if (s.hit === 'spit') ellipse(c, s.x + 6, heroY - 108, 26, 18, 'rgba(190,235,160,0.9)');
          if (s.hit === 'burn') circle(c, s.x - 22, heroY - 80 - jump, 10 + 4 * Math.sin(t * 20), 'rgba(255,140,60,0.75)');
        };
        if (s.by > heroY - 30) {
          drawHero();
          drawBabar();
        } else {
          drawBabar();
          drawHero();
        }
        const breath = g.done && g.won ? 0 : 1 - Math.min(1, t / endAt);
        bossBar(c, 120, 88, 262, breath, { label: g.tr({ en: 'BREATH', fr: 'SOUFFLE' }), color: PAL.hibiscus });
        bossBanner(c, g.W, g.H * 0.2, t, banner, g.tr({ en: `${name}'s Barrage`, fr: `Le barrage de ${name}` }), g.tr({ en: 'Barbecue from hell', fr: 'Le barbecue infernal' }), PAL.coral);
      },
      bot() {
        // Head for the lane whose next hit comes last; never step into one about to land.
        const next = [Infinity, Infinity, Infinity];
        for (const e of events) {
          if ((e.state === 'tell' && s.t - e.start > 0.1 * K) || e.state === 'fly') for (const l of e.lanes) next[l] = Math.min(next[l], e.arrive);
        }
        const better = (a, b) => next[a] > next[b] || (next[a] === next[b] && Math.abs(a - s.lane) < Math.abs(b - s.lane));
        let best = s.lane;
        for (let l = 0; l < 3; l++) if (better(l, best)) best = l;
        if (best === s.lane) return null;
        const step = best > s.lane ? 1 : -1;
        if (next[s.lane + step] - s.t < 0.05) return null;
        return { swipe: step > 0 ? 'right' : 'left' };
      },
    };
  },
};
