// Juice: particles (confetti, petals, sparks, drops), floating texts, screen
// shake and flashes. Pure state + a draw(c); no DOM.

import { PAL, circle, ellipse, hibiscus, text } from './art.js';

const CONFETTI = [PAL.hibiscus, PAL.mango, PAL.lagoon, PAL.leaf, '#ffffff', PAL.coral];

export function createFx(random = Math.random) {
  const parts = [];
  const texts = [];
  const fx = {
    shakeAmount: 0,
    flashColor: null,
    flashT: 0,

    /** kind: 'confetti' | 'petal' | 'spark' | 'drop' | 'smoke'. */
    burst(x, y, { n = 18, kind = 'confetti', colors = CONFETTI, speed = 260, up = 0.4, life = 1 } = {}) {
      for (let i = 0; i < n; i++) {
        const a = random() * Math.PI * 2;
        const v = speed * (0.35 + random() * 0.65);
        parts.push({
          x, y, kind,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - speed * up,
          rot: random() * 6,
          vr: (random() - 0.5) * 12,
          size: kind === 'petal' ? 7 + random() * 6 : kind === 'smoke' ? 10 + random() * 10 : 3 + random() * 4,
          color: colors[Math.floor(random() * colors.length)],
          life: life * (0.6 + random() * 0.6),
          age: 0,
        });
      }
    },
    /** A floating label that rises and fades. */
    text(x, y, str, { color = PAL.white, size = 30, life = 0.9 } = {}) {
      texts.push({ x, y, str, color, size, life, age: 0 });
    },
    shake(amount = 8) {
      fx.shakeAmount = Math.max(fx.shakeAmount, amount);
    },
    flash(color = 'rgba(255,255,255,0.6)', time = 0.15) {
      fx.flashColor = color;
      fx.flashT = time;
    },
    update(dt) {
      for (const p of parts) {
        p.age += dt;
        const drag = p.kind === 'petal' || p.kind === 'smoke' ? 2.5 : 0.8;
        p.vx -= p.vx * drag * dt;
        p.vy += (p.kind === 'smoke' ? -60 : p.kind === 'petal' ? 160 : 520) * dt;
        p.vy -= p.vy * (drag * 0.3) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
      }
      for (let i = parts.length - 1; i >= 0; i--) if (parts[i].age > parts[i].life) parts.splice(i, 1);
      for (const tx of texts) tx.age += dt;
      for (let i = texts.length - 1; i >= 0; i--) if (texts[i].age > texts[i].life) texts.splice(i, 1);
      fx.shakeAmount = Math.max(0, fx.shakeAmount - dt * 40);
      fx.flashT = Math.max(0, fx.flashT - dt);
    },
    /** Camera offset for the current shake. */
    offset() {
      const a = fx.shakeAmount;
      return a ? [(random() - 0.5) * a, (random() - 0.5) * a] : [0, 0];
    },
    draw(c, W, H) {
      for (const p of parts) {
        const k = 1 - p.age / p.life;
        c.save();
        c.globalAlpha = Math.min(1, k * 2);
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        if (p.kind === 'confetti') {
          c.fillStyle = p.color;
          c.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
        } else if (p.kind === 'petal') {
          hibiscus(c, 0, 0, p.size, 0, p.color);
        } else if (p.kind === 'smoke') {
          circle(c, 0, 0, p.size * (1 + p.age), `rgba(230,230,240,${0.35 * k})`);
        } else if (p.kind === 'drop') {
          ellipse(c, 0, 0, p.size * 0.6, p.size, p.color);
        } else {
          circle(c, 0, 0, p.size * k + 1, p.color);
        }
        c.restore();
      }
      for (const tx of texts) {
        const k = tx.age / tx.life;
        const pop = k < 0.15 ? 0.6 + (k / 0.15) * 0.5 : 1.1 - Math.min(0.1, (k - 0.15));
        c.save();
        c.globalAlpha = 1 - Math.max(0, (k - 0.6) / 0.4);
        c.translate(tx.x, tx.y - k * 50);
        c.scale(pop, pop);
        text(c, tx.str, 0, 0, { size: tx.size, color: tx.color, stroke: 'rgba(30,20,50,0.55)' });
        c.restore();
      }
      if (fx.flashT > 0 && fx.flashColor) {
        c.save();
        c.globalAlpha = Math.min(1, fx.flashT * 6);
        c.fillStyle = fx.flashColor;
        c.fillRect(0, 0, W, H);
        c.restore();
      }
    },
    clear() {
      parts.length = 0;
      texts.length = 0;
      fx.shakeAmount = 0;
      fx.flashT = 0;
    },
  };
  return fx;
}
