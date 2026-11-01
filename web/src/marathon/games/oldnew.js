// Old Cous or New Cous? Swipe the card left (Old Cous, wild) or right (New
// Cous, wise). Cards come from world 8.

import { CARDS } from '../../worlds/w08-oldnew/cards.js';
import { head, rrect, PAL, text, wrap, shadowed, sky, hibiscus, madrasBand } from '../art.js';

export default {
  id: 'oldnew',
  world: 'w08',
  input: 'swipe',
  base: 6,
  min: 3,
  survive: false,
  verb: { en: 'OLD OR NEW COUS?', fr: 'OLD OU NEW COUS ?' },
  title: { en: "Old Cous or New Cous?", fr: "Old Cous ou New Cous ?" },
  howto: { en: "Read the card. Swipe left for Old Cous, right for New Cous.", fr: "Lis la carte. Glisse à gauche pour Old Cous, à droite pour New Cous." },
  winLine: { en: "You know Cous by heart!", fr: "Tu connais Cous par cœur !" },
  create(g) {
    const card = CARDS[Math.floor(g.random() * CARDS.length)];
    const s = { t: 0, fly: 0, dir: 0, drag: 0 };
    const cy = g.H * 0.5;

    function answer(side) {
      s.dir = side === 'left' ? -1 : 1;
      const right = (side === 'left' ? 'old' : 'new') === card.a;
      if (right) {
        g.sfx.good();
        g.fx.burst(200 + s.dir * 120, cy, { kind: 'confetti', n: 24 });
        g.win();
      } else {
        g.sfx.bad();
        g.fx.shake(10);
        g.say(200, cy - 170, card.a === 'old' ? g.tr({ en: 'That was Old Cous!', fr: 'C\'était Old Cous !' }) : g.tr({ en: 'That was New Cous!', fr: 'C\'était New Cous !' }));
        g.lose();
      }
    }

    return {
      update(dt) {
        s.t += dt;
        if (s.dir) s.fly += dt * 3;
      },
      swipe(dir) {
        if (dir === 'left' || dir === 'right') answer(dir);
      },
      press(x) {
        // Tapping a side panel also answers.
        if (x < 90) answer('left');
        else if (x > 310) answer('right');
      },
      draw(c) {
        sky(c, g.W, g.H, ['#ff9a76', '#ffcf8a', '#7fd6e8']);
        // Side panels: Old Cous (wild night) and New Cous (wise museum).
        const lean = Math.sin(s.t * 3) * 0.06;
        c.globalAlpha = 0.95;
        head(c, 'cous', 52, cy - 210, 110, { rot: -0.15 + lean, hat: 'shades' });
        text(c, 'OLD', 52, cy - 135, { size: 26, color: PAL.hibiscus, stroke: '#fff' });
        text(c, '◀', 30, cy, { size: 40, color: 'rgba(255,255,255,0.8)' });
        head(c, 'cous', 348, cy - 210, 110, { rot: 0.15 - lean, hat: 'bakoua' });
        text(c, 'NEW', 348, cy - 135, { size: 26, color: PAL.sea, stroke: '#fff' });
        text(c, '▶', 370, cy, { size: 40, color: 'rgba(255,255,255,0.8)' });
        c.globalAlpha = 1;
        // The card.
        c.save();
        c.translate(200 + s.dir * s.fly * 420, cy + s.fly * s.fly * 60);
        c.rotate(s.dir * s.fly * 0.6 + Math.sin(s.t * 2) * 0.015);
        shadowed(c, () => {
          rrect(c, -120, -150, 240, 300, 26);
          c.fillStyle = PAL.cream;
          c.fill();
        }, 24, 10);
        madrasBand(c, -120, -150, 240, 26, 0.5);
        hibiscus(c, 92, 118, 16, s.t);
        const lines = wrap(c, g.tr(card), 200, 22);
        const size = lines.length > 6 ? 18 : 22;
        const fitted = size === 22 ? lines : wrap(c, g.tr(card), 200, size);
        fitted.forEach((ln, i) => text(c, ln, 0, -((fitted.length - 1) * size * 1.25) / 2 + i * size * 1.25 + 8, { size, color: PAL.ink, shadow: false, weight: 600 }));
        c.restore();
      },
      bot() {
        return s.dir ? null : g.elapsed > 0.4 ? { swipe: card.a === 'old' ? 'left' : 'right' } : null;
      },
    };
  },
};
