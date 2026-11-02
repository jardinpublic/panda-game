// Laser sword duel at dusk on the beach, under two setting suns ("Tatooine" is
// one of Panda's nicknames). A friend attacks high or low: swipe up or down to
// block on that side, then swipe towards them to strike back. Three hits wins.
// "Zioum zioum sabre laser !"

import { person, ellipse, circle, text, sky, sun, sea, sand, palm, diamondRock, OUTFITS, PAL } from '../art.js';

const HITS = 3;
const SIZE = 235;
const HERO_BLADE = '#4fc3ff';
const FOE_BLADE = '#ff3b4a';

/** A glowing blade from (x, y) along angle a (radians, 0 = pointing right). */
function blade(c, x, y, a, len, color, hot = 0) {
  const ex = x + Math.cos(a) * len;
  const ey = y + Math.sin(a) * len;
  c.save();
  c.lineCap = 'round';
  c.shadowColor = color;
  c.shadowBlur = 18 + hot * 16;
  c.strokeStyle = color;
  c.globalAlpha = 0.55;
  c.lineWidth = 15 + hot * 6;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(ex, ey);
  c.stroke();
  c.globalAlpha = 1;
  c.shadowBlur = 8;
  c.strokeStyle = '#ffffff';
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(ex, ey);
  c.stroke();
  c.restore();
  // Hilt
  c.save();
  c.lineCap = 'round';
  c.strokeStyle = '#3d4048';
  c.lineWidth = 9;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x - Math.cos(a) * 26, y - Math.sin(a) * 26);
  c.stroke();
  c.strokeStyle = '#b9bec8';
  c.lineWidth = 9;
  c.beginPath();
  c.moveTo(x - Math.cos(a) * 6, y - Math.sin(a) * 6);
  c.lineTo(x - Math.cos(a) * 11, y - Math.sin(a) * 11);
  c.stroke();
  c.restore();
}

export default {
  id: 'saber',
  world: 'w08',
  input: 'swipe',
  base: 7,
  survive: false,
  verb: { en: 'BLOCK!', fr: 'PARE !' },
  title: { en: 'Laser sword duel', fr: 'Duel au sabre laser' },
  howto: {
    en: 'Your friend swings high or low: swipe up or down to block on that side, then swipe towards them to strike. Three hits!',
    fr: 'Ton pote attaque en haut ou en bas : glisse vers eul’ haut ou vers eul’ bas pour parer, puis vers lui pour frapper. Trois touches !',
  },
  winLine: { en: 'Zioum zioum, victory!', fr: 'Zioum zioum, y’est gagné !' },
  rival: ['babar', 'mamar'],
  rivalLine: { en: 'My sword ran out of battery…', fr: 'Mon sabre y’est déchargé…' },
  loseLine: { en: 'Hoho… cut in half!', fr: 'Hoho… coupé en deux !' },
  create(g) {
    const foe = g.friend();
    const heroX = 104;
    const foeX = 306;
    const feetY = g.H * 0.8;
    const gap = 0.35 / g.speed;
    const wind = Math.max(0.4, 0.8 / g.speed);
    const stun = Math.max(0.45, 0.75 / g.speed);
    const recoil = 0.35 / g.speed;
    // phase: 'gap' → 'wind' (the attack shows: high or low) → 'stun' (blocked: strike now!) → 'recoil' → 'gap'…
    const s = { t: 0, phase: 'gap', pt: -0.25 / g.speed, side: 'high', guard: 'mid', hits: 0, lunge: 0, hurt: 0, clash: 0, cut: false, said: false };

    function next(phase) {
      s.phase = phase;
      s.pt = 0;
    }

    function strike() {
      if (s.phase !== 'stun' || g.done) return;
      s.hits++;
      s.lunge = 1;
      s.hurt = 1;
      g.sfx.hit();
      g.fx.burst(foeX - 30, feetY - SIZE * 0.5, { kind: 'spark', n: 22, colors: [HERO_BLADE, '#ffffff', PAL.mango] });
      g.fx.shake(6);
      if (s.hits >= HITS) {
        g.sfx.good();
        g.fx.burst(heroX, feetY - SIZE, { kind: 'confetti', n: 34 });
        g.win();
      } else next('recoil');
    }

    return {
      rival: foe,
      update(dt) {
        s.t += dt;
        s.pt += dt;
        s.lunge = Math.max(0, s.lunge - dt * 4);
        s.hurt = Math.max(0, s.hurt - dt * 3);
        s.clash = Math.max(0, s.clash - dt * 4);
        if (!s.said) {
          s.said = true;
          g.say(heroX + 10, feetY - SIZE * 0.95, g.tr({ en: 'Zioum zioum, laser sword!', fr: 'Zioum zioum sabre laser !' }), Math.max(1.2, 1.8 / g.speed));
          g.sfx.whoosh();
        }
        if (g.done) return;
        if (s.phase === 'gap' && s.pt >= gap) {
          s.side = g.random() < 0.5 ? 'high' : 'low';
          next('wind');
          g.sfx.tick();
        } else if (s.phase === 'wind' && s.pt >= wind) {
          // The blow lands: blocked on the right side, or the hero is hit
          if (s.guard === s.side) {
            s.clash = 1;
            g.sfx.whoosh();
            g.fx.text(heroX + 70, s.side === 'high' ? feetY - SIZE * 1.02 : feetY - SIZE * 0.2, 'ZIOUM !', { size: 26, color: '#e6f7ff' });
            g.fx.burst(heroX + 60, s.side === 'high' ? feetY - SIZE * 0.85 : feetY - SIZE * 0.25, { kind: 'spark', n: 16, colors: [FOE_BLADE, HERO_BLADE, '#ffffff'] });
            next('stun');
          } else {
            s.cut = true;
            g.fx.flash('rgba(255,60,80,0.5)');
            g.fx.shake(12);
            g.sfx.bad();
            g.lose();
          }
        } else if (s.phase === 'stun' && s.pt >= stun) {
          // Too slow to strike back: they recover and attack again
          s.guard = 'mid';
          next('gap');
        } else if (s.phase === 'recoil' && s.pt >= recoil) {
          s.guard = 'mid';
          next('gap');
        }
      },
      swipe(dir) {
        if (dir === 'up' || dir === 'down') {
          if (s.phase === 'stun') return;
          s.guard = dir === 'up' ? 'high' : 'low';
          g.sfx.tap();
        } else if (dir === 'right') {
          if (s.phase === 'stun') strike();
          else g.sfx.whoosh();
        }
      },
      press(x, y) {
        // One-thumb comfort: tap to strike when they reel, else tap high or low to guard
        if (s.phase === 'stun') strike();
        else this.swipe(y < feetY - SIZE * 0.55 ? 'up' : 'down');
      },
      draw(c) {
        const { W, H } = g;
        // Dusk under two suns, the sea, the sand
        const horizon = H * 0.46;
        sky(c, W, horizon, ['#2a1f55', '#7c3f8f', '#f08a5d']);
        sun(c, W * 0.62, horizon * 0.86, 24, '#ffd9a0');
        sun(c, W * 0.8, horizon * 0.93, 15, '#ffb27a');
        for (let i = 0; i < 18; i++) circle(c, (i * 97) % W, 30 + ((i * 53) % (horizon * 0.5)), 1.4, 'rgba(255,255,255,0.7)');
        diamondRock(c, W * 0.25, horizon, 40, 'rgba(30,20,60,0.6)');
        sea(c, W, horizon, H * 0.14, s.t, '#3b4f8f', '#25336b');
        sand(c, W, horizon + H * 0.14, H, s.t);
        c.fillStyle = 'rgba(30,20,60,0.28)';
        c.fillRect(0, 0, W, H);
        palm(c, -16, H * 0.66, H * 0.34, s.t, 0.25);

        // The friend: winds up high or low, lunges, reels when blocked or hit
        const wk = s.phase === 'wind' ? Math.min(1, s.pt / wind) : 0;
        const fx = foeX + (s.phase === 'wind' ? -wk * 34 : 0) + s.hurt * 30;
        person(c, foe, fx, feetY, SIZE, s.hurt > 0 || s.phase === 'stun' ? 'sad' : 'idle', s.t, { flip: true });
        const o = OUTFITS[foe] || OUTFITS.panda;
        const k = SIZE * (o.small || 1) * (o.tall || 1);
        let fa = -2.1; // resting: blade up and forward (to the left)
        let fy = feetY - k * 0.42;
        if (s.phase === 'wind') {
          fa = s.side === 'high' ? -2.1 - wk * 0.9 + (wk > 0.85 ? (wk - 0.85) * 9 : 0) : 2.2 + wk * 0.6;
          fy = s.side === 'high' ? feetY - k * (0.42 + wk * 0.3) : feetY - k * (0.35 - wk * 0.05);
        } else if (s.phase === 'stun' || s.hurt > 0) {
          fa = -1.2;
          fy = feetY - k * 0.36;
        }
        blade(c, fx - 44, fy, fa, 118, FOE_BLADE, wk);
        // Tell: a red glow where the blow will land on the hero (head or legs)
        if (s.phase === 'wind' && !g.done) {
          const ty = s.side === 'high' ? feetY - SIZE * 0.85 : feetY - SIZE * 0.22;
          ellipse(c, heroX + 18, ty, 50 + wk * 14, 22 + wk * 6, `rgba(255,70,90,${0.25 + 0.45 * wk})`);
          text(c, s.side === 'high' ? '⬆' : '⬇', heroX - 70, ty, { size: 46, color: '#ffd0d6', stroke: 'rgba(200,30,60,0.8)' });
        }
        if (s.phase === 'stun' && !g.done) {
          for (let i = 0; i < 3; i++) text(c, '★', fx + Math.cos(s.t * 8 + i * 2.1) * 30, feetY - SIZE * 0.98 + Math.sin(s.t * 8 + i * 2.1) * 8, { size: 16, color: '#ffd84a', shadow: false });
          text(c, '➜', (heroX + foeX) / 2, feetY - SIZE * 0.55 + Math.sin(s.t * 14) * 4, { size: 56, color: '#b8ffcf', stroke: 'rgba(20,120,60,0.8)' });
        }

        // The hero and their guard
        const hx = heroX + s.lunge * 60;
        person(c, g.hero, hx, feetY, SIZE, s.cut ? 'sad' : g.done && g.won ? 'cheer' : 'idle', s.t, { hat: g.hat });
        let ha = -1.0;
        let hy = feetY - SIZE * 0.42;
        let bx = hx + 40;
        if (s.lunge > 0) {
          ha = -0.12;
          hy = feetY - SIZE * 0.5;
        } else if (s.guard === 'high') {
          ha = -0.18;
          hy = feetY - SIZE * 0.78;
          bx = hx + 14;
        } else if (s.guard === 'low') {
          ha = 1.3;
          hy = feetY - SIZE * 0.42;
          bx = hx + 48;
        }
        if (g.done && g.won) {
          // Raised in the right hand, arms in the air
          ha = -1.45;
          hy = feetY - SIZE * 0.6;
          bx = hx + 52;
        }
        blade(c, bx, hy, ha, 118, HERO_BLADE, s.clash);

        // Hits so far
        for (let i = 0; i < HITS; i++) circle(c, W / 2 - 34 + i * 34, H * 0.2, 11, i < s.hits ? HERO_BLADE : 'rgba(255,255,255,0.22)');
      },
      bot() {
        if (g.done) return null;
        if (s.phase === 'wind' && s.pt > wind * 0.35 && s.guard !== s.side) return { swipe: s.side === 'high' ? 'up' : 'down' };
        if (s.phase === 'stun' && s.pt > 0.12) return { swipe: 'right' };
        return null;
      },
    };
  },
};
