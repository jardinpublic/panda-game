// Babar's pet boar (world 10): un sanglier domestique, chunky and very
// enthusiastic. In Babar's yard it paws the ground (dust, snorts, a red "!"),
// then charges across. TAP (or swipe up) to jump over it, with squash and
// stretch. It turns around at the other side and comes back: 2-3 charges
// (4 in a boss). One hit and the hero is bowled over. Babar watches:
// "Ah ben mon Romain…".

import { scene, person, rrect, circle, ellipse, PAL, text, creoleHouse, palm } from '../art.js';

const HERO_X = 200;
const SPOTS = [375, 25]; // where the boar stands between charges (right, left)
const REACH = 66; // boar half-length + hero half-width
const CLEAR_H = 46; // feet this high clear the boar's back
const JUMP_H = 150;

/** A cute chunky boar, feet at (x, y), facing `face` (1 right, -1 left). */
function boar(c, x, y, s, t, { face = -1, run = 0, paw = 0, happy = 0 } = {}) {
  c.save();
  c.translate(x, y);
  ellipse(c, 0, 2, 62 * s, 10 * s, 'rgba(20,10,40,0.22)');
  c.scale(face * s, s);
  const bob = run ? Math.abs(Math.sin(t * 22)) * 5 : happy ? Math.abs(Math.sin(t * 10)) * 6 : 0;
  c.translate(0, -bob);
  c.rotate(run ? 0.06 : paw ? -0.04 : 0);
  // Legs (back pair darker), animated by run / paw.
  const legs = [[-36, 0.8], [-18, 1], [24, 0.8], [40, 1]];
  legs.forEach(([lx, shade], i) => {
    let a = run ? Math.sin(t * 22 + i * 1.6) * 0.6 : 0;
    let lift = 0;
    if (paw && i === 3) {
      a = Math.sin(t * 16) * 0.5 - 0.2;
      lift = Math.max(0, Math.sin(t * 16)) * 6;
    }
    c.save();
    c.translate(lx, -22 - lift);
    c.rotate(a);
    rrect(c, -7, 0, 14, 24, 6);
    c.fillStyle = shade < 1 ? '#4a3427' : '#5d4232';
    c.fill();
    rrect(c, -7, 18, 14, 7, 3);
    c.fillStyle = '#2a1d16';
    c.fill();
    c.restore();
  });
  // Body.
  const gr = c.createRadialGradient(-10, -60, 6, 0, -38, 72);
  gr.addColorStop(0, '#b08664');
  gr.addColorStop(0.6, '#8a6247');
  gr.addColorStop(1, '#624330');
  ellipse(c, 0, -40, 60, 32, gr);
  ellipse(c, 4, -24, 44, 12, 'rgba(240,200,170,0.35)');
  // Bristly back.
  c.fillStyle = '#3e2a1f';
  c.beginPath();
  c.moveTo(-46, -58);
  for (let i = 0; i <= 12; i++) {
    const bx = -46 + i * 7.5;
    const by = -40 - Math.sqrt(Math.max(0, 1 - (bx / 60) ** 2)) * 32;
    const spike = 9 + (i % 3) * 3 + (paw || run ? 3 : 0);
    c.lineTo(bx + 3, by - spike);
    c.lineTo(bx + 7, by + 2);
  }
  c.lineTo(44, -56);
  c.closePath();
  c.fill();
  // Curly little tail.
  c.strokeStyle = '#6b4a36';
  c.lineWidth = 3;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(-64, -50, 6, 0.2 + Math.sin(t * 12) * 0.3, Math.PI * 1.7 + Math.sin(t * 12) * 0.3);
  c.stroke();
  // Head.
  const hg = c.createRadialGradient(46, -52, 4, 52, -42, 32);
  hg.addColorStop(0, '#a87d5c');
  hg.addColorStop(1, '#6e4d38');
  ellipse(c, 50, -42, 28, 24, hg, 0.15);
  // Ear.
  c.fillStyle = '#5d3f2f';
  c.beginPath();
  c.moveTo(34, -58);
  c.lineTo(40, -80 + Math.sin(t * 9) * 2);
  c.lineTo(50, -60);
  c.fill();
  // Snout.
  ellipse(c, 76, -36, 12, 13, '#e6a19a');
  ellipse(c, 79, -36, 8, 10, '#f2b6ae');
  ellipse(c, 77, -40, 2.2, 3.4, '#5a2f2a');
  ellipse(c, 77, -31, 2.2, 3.4, '#5a2f2a');
  // Tusks.
  c.fillStyle = '#fff4dc';
  for (const ty of [-28, -26]) {
    c.beginPath();
    c.moveTo(64, ty);
    c.quadraticCurveTo(72, ty - 4, 70, ty - 16);
    c.quadraticCurveTo(76, ty - 6, 69, ty + 2);
    c.closePath();
    c.fill();
  }
  // Eye and brow.
  circle(c, 56, -52, 4.6, '#1e1a33');
  circle(c, 57.5, -53.5, 1.6, '#ffffff');
  if (paw || run) {
    c.strokeStyle = '#2a1d16';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(48, -62);
    c.lineTo(62, -57);
    c.stroke();
  } else {
    ellipse(c, 60, -42, 6, 4, 'rgba(255,120,130,0.45)');
  }
  c.restore();
}

export default {
  id: 'boar',
  world: 'w10',
  input: 'tap',
  base: 7,
  survive: true,
  verb: { en: 'JUMP!', fr: 'SAUTE !' },
  title: { en: "Babar's pet boar", fr: 'Le sanglier domestique de Babar' },
  howto: { en: 'The boar paws the ground, then charges. Tap (or swipe up) to jump over it!', fr: 'Le sanglier gratte le sol, puis il charge. Touche (ou glisse vers le haut) pour sauter par-dessus !' },
  winLine: { en: 'Olé! Not even a scratch!', fr: 'Olé ! Même pas une égratignure !' },
  create(g) {
    const babar = g.cast('babar', 'mamar');
    const groundY = g.H * 0.8;
    const tell = 0.75 / g.speed;
    const vb = 380 * Math.pow(g.speed, 0.7);
    const travel = (SPOTS[0] - SPOTS[1]) / vb;
    const skid = 0.25 / g.speed;
    const J = 0.6 / Math.pow(g.speed, 0.3);
    const first = 0.3 / g.speed;
    let total = g.boss ? 4 : g.speed < 1.45 ? 2 : 3;
    // Never schedule a charge that cannot finish before the clock runs out.
    while (total > 2 && first + total * (tell + skid) + (total - 1) * travel + travel * 0.6 > g.duration - 0.15) total--;

    const s = {
      t: 0,
      bx: SPOTS[0],
      face: -1, // facing left: it charges from the right first
      state: 'wait', // wait | paw | charge | skid | done
      k: first,
      charges: 0,
      passed: 0,
      dust: 0,
      jumpT: -1, // seconds into the current jump, -1 on the ground
      land: 0, // landing squash timer
      hit: false,
      fly: 0,
    };

    function heroH() {
      if (s.jumpT < 0) return 0;
      const u = s.jumpT / J;
      return JUMP_H * 4 * u * (1 - u);
    }

    function jump() {
      if (s.jumpT >= 0 || s.hit) return;
      s.jumpT = 0;
      g.sfx.whoosh();
      g.fx.burst(HERO_X, groundY, { kind: 'smoke', n: 6, speed: 70 });
    }

    function babarSays(en, fr, time = 1.3) {
      g.say(320, groundY - 280, g.tr({ en, fr }), time);
    }

    return {
      update(dt) {
        s.t += dt;
        s.land = Math.max(0, s.land - dt);
        if (s.jumpT >= 0) {
          s.jumpT += dt;
          if (s.jumpT >= J) {
            s.jumpT = -1;
            s.land = 0.14;
            g.sfx.tap();
            g.fx.burst(HERO_X, groundY, { kind: 'smoke', n: 5, speed: 50 });
          }
        }
        if (s.hit) s.fly += dt;
        // Boar state machine: wait -> paw (tell) -> charge -> skid -> paw ...
        if (s.state === 'wait') {
          s.k -= dt;
          if (s.k <= 0 && !g.done) {
            s.state = 'paw';
            s.k = tell;
          }
        } else if (s.state === 'paw') {
          s.k -= dt;
          s.dust -= dt;
          if (s.dust <= 0) {
            s.dust = 0.2 / g.speed;
            g.sfx.tick();
            g.fx.burst(s.bx + s.face * 30, groundY - 4, { kind: 'smoke', n: 4, speed: 60, colors: ['#d9c3a0', '#c7ad86'] });
          }
          if (s.k <= 0 && !g.done) {
            s.state = 'charge';
            s.charges++;
            g.sfx.whoosh();
            g.fx.burst(s.bx - s.face * 40, groundY - 6, { kind: 'smoke', n: 10, speed: 120, colors: ['#d9c3a0', '#c7ad86'] });
          }
        } else if (s.state === 'charge') {
          const target = s.face < 0 ? SPOTS[1] : SPOTS[0];
          const prev = s.bx;
          s.bx += s.face * vb * dt;
          // Collision while overlapping the hero.
          if (!s.hit && !g.done && Math.abs(s.bx - HERO_X) < REACH && heroH() < CLEAR_H) {
            s.hit = true;
            g.sfx.hit();
            g.fx.shake(16);
            g.fx.burst(HERO_X, groundY - 60, { kind: 'spark', n: 18, colors: ['#fff3a0', '#ffffff', PAL.mango], speed: 240 });
            g.fx.text(HERO_X, groundY - 180, 'POW!', { size: 36, color: PAL.coral });
            babarSays('Ah ben mon Romain…', 'Ah ben mon Romain…', 1.6);
            g.lose();
          }
          // Cleared: the boar's tail has passed the hero.
          const passedNow = (s.face < 0 && prev >= HERO_X - REACH && s.bx < HERO_X - REACH) || (s.face > 0 && prev <= HERO_X + REACH && s.bx > HERO_X + REACH);
          if (passedNow && !s.hit && !g.done) {
            s.passed++;
            g.sfx.good();
            g.fx.text(HERO_X, groundY - 220, g.tr({ en: 'Olé!', fr: 'Olé !' }), { size: 30, color: PAL.mango });
            if (s.passed >= total) {
              g.sfx.hoho();
              g.fx.burst(HERO_X, groundY - 120, { kind: 'confetti', n: 34 });
              babarSays('Ah ben mon Romain… what a jump!', 'Ah ben mon Romain… quel saut !', 1.5);
              g.win();
            }
          }
          if ((s.face < 0 && s.bx <= target) || (s.face > 0 && s.bx >= target)) {
            s.bx = target;
            s.state = 'skid';
            s.k = skid;
            g.fx.burst(s.bx, groundY - 4, { kind: 'smoke', n: 8, speed: 90, colors: ['#d9c3a0', '#c7ad86'] });
          }
        } else if (s.state === 'skid') {
          s.k -= dt;
          if (s.k <= 0) {
            s.face = -s.face;
            if (g.done || s.charges >= total) s.state = 'done';
            else {
              s.state = 'paw';
              s.k = tell;
              s.dust = 0;
            }
          }
        }
      },
      press() {
        jump();
      },
      swipe(dir) {
        if (dir === 'up') jump();
      },
      draw(c) {
        const W = g.W;
        scene.yard(c, W, g.H, s.t);
        creoleHouse(c, 240, g.H * 0.6, 130, 90, PAL.creole[2], '#3d7ac8');
        palm(c, 30, g.H * 0.62, g.H * 0.3, s.t, 0.18);
        // Babar on his porch, watching.
        const won = g.done && g.won;
        person(c, babar, 320, g.H * 0.62, 120, g.done ? (won ? 'cheer' : 'point') : s.state === 'paw' ? 'point' : 'idle', s.t + 1, { flip: true });
        // A dusty track across the lawn.
        ellipse(c, W / 2, groundY + 2, W * 0.6, 22, 'rgba(200,170,120,0.35)');
        // Hero: squash on landing, stretch going up, bowled over when hit.
        const h = heroH();
        const u = s.jumpT >= 0 ? s.jumpT / J : 0;
        let squash = 1;
        if (s.jumpT >= 0) squash = u < 0.5 ? 1.15 - u * 0.3 : 1 + (u - 0.5) * 0.2;
        if (s.land > 0) squash = 0.8 + (1 - s.land / 0.14) * 0.2;
        if (s.hit) {
          const k = Math.min(1, s.fly * 4);
          const dir = -s.face;
          c.save();
          c.translate(HERO_X + dir * k * 60, groundY - Math.sin(k * Math.PI) * 50);
          c.rotate(dir * k * 1.45);
          person(c, g.hero, 0, 0, 170, 'sad', s.t, { hat: g.hat });
          c.restore();
          for (let i = 0; i < 3; i++) {
            const a = s.t * 5 + (i * Math.PI * 2) / 3;
            text(c, '★', HERO_X + dir * 70 + Math.cos(a) * 30, groundY - 70 + Math.sin(a) * 9, { size: 18, color: '#fff3a0' });
          }
        } else {
          ellipse(c, HERO_X, groundY + 2, 30 - Math.min(18, h * 0.12), 7, 'rgba(20,10,40,0.18)');
          person(c, g.hero, HERO_X, groundY - h, 170, s.jumpT >= 0 ? 'cheer' : won ? 'dance' : 'idle', s.t, { hat: g.hat, squash });
        }
        // The boar.
        const charging = s.state === 'charge';
        const pawing = s.state === 'paw';
        if (charging) {
          // Speed lines behind it.
          c.strokeStyle = 'rgba(255,255,255,0.6)';
          c.lineWidth = 3;
          c.lineCap = 'round';
          for (let i = 0; i < 4; i++) {
            const ly = groundY - 20 - i * 16;
            const lx = s.bx - s.face * (70 + (i % 2) * 14);
            c.beginPath();
            c.moveTo(lx, ly);
            c.lineTo(lx - s.face * (26 + i * 6), ly);
            c.stroke();
          }
        }
        const shake = pawing ? Math.sin(s.t * 40) * 1.5 : 0;
        boar(c, s.bx + shake, groundY, 1.05, s.t, { face: s.face, run: charging ? 1 : 0, paw: pawing ? 1 : 0, happy: s.state === 'done' || (g.done && !g.won) ? 1 : 0 });
        if (pawing) {
          // Snort puffs from the snout.
          const nx = s.bx + s.face * 86;
          for (let i = 0; i < 2; i++) {
            const k = (s.t * 3 + i * 0.5) % 1;
            circle(c, nx + s.face * k * 20, groundY - 40 - k * 10 + i * 8, 4 + k * 7, `rgba(255,255,255,${0.6 * (1 - k)})`);
          }
          const prog = 1 - s.k / tell;
          if (prog > 0.45) {
            const pop = 1 + Math.max(0, 0.3 - (prog - 0.45)) * 2;
            text(c, '!', s.bx, groundY - 120, { size: 44 * pop, color: PAL.coral, stroke: '#fff' });
          } else {
            text(c, g.tr({ en: 'Snort!', fr: 'Groin !' }), s.bx - s.face * 10, groundY - 112, { size: 18, color: PAL.cream, stroke: '#6b4a36' });
          }
        }
        if (!g.done && s.jumpT < 0) text(c, '👆', HERO_X, groundY + 60, { size: 28, shadow: false });
      },
      bot() {
        if (s.state !== 'charge' || s.jumpT >= 0) return null;
        const d = (HERO_X - s.bx) * s.face; // distance still to cover to the hero
        return d > 0 && d <= vb * J * 0.5 + 4 ? { press: [HERO_X, groundY - 80] } : null;
      },
    };
  },
};
