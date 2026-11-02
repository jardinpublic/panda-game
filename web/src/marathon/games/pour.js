// Pour (beach bar "paillote", ti-punch running gag): a friend holds the glass,
// the hero holds the rum. HOLD to pour, RELEASE when the rum sits between the
// two dose lines. Past the top line it is too strong (and spills); releasing
// under the bottom line is "water". Pour speed scales with g.speed.

import { scene, person, rrect, circle, ellipse, PAL, text, shadowed, vgrad, madrasBand, OUTFITS } from '../art.js';

const GX = 205; // glass centre
const GW_TOP = 124;
const GW_BOT = 100;
const GH = 170;
const TILT = -2.1; // bottle angle while pouring (radians)

/** Rum bottle centred on its pivot (the hero's hand), neck towards -y. */
function bottle(c, t) {
  shadowed(c, () => {
    c.fillStyle = vgrad(c, -70, 60, ['#2f8a5a', '#145c3a']);
    rrect(c, -24, -60, 48, 120, 14);
    c.fill();
    c.beginPath();
    c.moveTo(-24, -46);
    c.quadraticCurveTo(-8, -64, -9, -84);
    c.lineTo(9, -84);
    c.quadraticCurveTo(8, -64, 24, -46);
    c.fill();
    rrect(c, -9, -100, 18, 20, 4);
    c.fill();
  }, 10, 4);
  rrect(c, -10, -108, 20, 10, 4);
  c.fillStyle = '#c99a5b';
  c.fill();
  // Label with a madras band.
  rrect(c, -20, -18, 40, 50, 6);
  c.fillStyle = PAL.cream;
  c.fill();
  madrasBand(c, -20, -18, 40, 10, 0.3);
  text(c, 'RHUM', 0, 6, { size: 11, color: PAL.ink, shadow: false, weight: 700 });
  text(c, '50°', 0, 21, { size: 9, color: PAL.hibiscus, shadow: false, weight: 700 });
  c.fillStyle = 'rgba(255,255,255,0.25)';
  rrect(c, -18, -54, 7, 100, 3);
  c.fill();
  circle(c, 14, -40 + Math.sin(t * 2) * 2, 2, 'rgba(255,255,255,0.4)');
}

export default {
  id: 'pour',
  world: 'w05',
  input: 'hold',
  base: 4.5,
  min: 2.4,
  survive: false,
  verb: { en: 'POUR THE DOSE!', fr: 'VERSE LA DOSE !' },
  title: { en: "The right dose", fr: "La bonne dose" },
  howto: { en: "Hold to pour the rum. Let go between the two lines.", fr: "Maintiens pour verser eul’ rhum. Lâche entre les deux traits." },
  winLine: { en: "Perfect ti-punch!", fr: "Ti-punch parfait !" },
  rival: ["greg", "cous"],
  rivalLine: { en: "I was hoping you'd spill it…", fr: "J'espérais que te déborderais…" },
  loseLine: { en: "Hoho… still thirsty!", fr: "Hoho… j'ai encore soif !" },
  create(g) {
    const friend = g.friend();
    const gy = g.H * 0.62; // glass bottom
    const counterY = gy + 26;
    const low = 0.42 + g.random() * 0.2;
    const high = low + 0.17;
    const rate = 0.3 * Math.pow(g.speed, 0.85); // dose zone lasts ~0.29 s at speed 2.2
    const pivot = { x: 300, y: gy - 240 };
    const s = { t: 0, level: 0, pouring: false, tilt: 0, glug: 0, spill: 0, inZone: false, verdict: null, endShown: false, raise: 0 };

    const neck = () => ({ x: pivot.x + 98 * Math.sin(s.tilt), y: pivot.y - 98 * Math.cos(s.tilt) });
    const surfaceY = () => gy - 8 - s.level * (GH - 8);

    function decide(win, line) {
      g.say(GX, gy - GH - 30, line, 1.5);
      if (win) {
        g.sfx.good();
        g.sfx.hoho();
        g.fx.burst(GX, surfaceY(), { kind: 'confetti', n: 32 });
        g.win();
      } else {
        g.sfx.bad();
        g.fx.shake(8);
        g.lose();
      }
    }

    return {
      update(dt) {
        s.t += dt;
        // After an overflow the bottle keeps glugging a moment, then lifts.
        if (s.spill > 0) {
          s.spill -= dt;
          if (s.spill <= 0) s.pouring = false;
        }
        s.tilt += ((s.pouring ? TILT : 0) - s.tilt) * Math.min(1, dt * 22);
        if (s.verdict === 'win') s.raise = Math.min(1, s.raise + dt * 3);
        if (s.pouring && (!g.done || s.spill > 0)) {
          const wobble = 1 + 0.15 * Math.sin(s.t * 18);
          s.level = Math.min(1.02, s.level + rate * wobble * dt);
          s.glug -= dt;
          if (s.glug <= 0) {
            s.glug = 0.14 / Math.sqrt(g.speed);
            g.sfx.pop();
          }
          const inZone = s.level >= low && s.level <= high;
          if (inZone && !s.inZone) g.sfx.tick(true);
          s.inZone = inZone;
          if (s.level >= 1 && s.spill > 0) {
            g.fx.burst(GX + (g.random() < 0.5 ? -GW_TOP / 2 : GW_TOP / 2), gy - GH, { kind: 'drop', n: 3, colors: ['#ffc45a', '#e08a2a'], speed: 120, up: 0 });
          }
          if (s.level > high && !g.done) {
            s.verdict = 'strong';
            s.spill = 0.45;
            g.sfx.splash();
            decide(false, g.tr({ en: 'Whoa! Too strong!', fr: 'Wouy ! Trop fort !' }));
          }
        }
        if (g.done && !g.won && g.timeout && !s.endShown) {
          s.endShown = true;
          g.say(110, gy - 120, g.tr({ en: 'So? I\'m thirsty!', fr: 'Alors ? J\'ai soif moi !' }), 1.4);
          g.sfx.bad();
        }
      },
      press() {
        if (s.pouring) return;
        s.pouring = true;
        s.glug = 0;
        g.sfx.tap();
      },
      release() {
        if (!s.pouring) return;
        s.pouring = false;
        if (s.level < 0.04) return; // a tiny tap does not count
        if (s.level < low) {
          s.verdict = 'water';
          decide(false, g.tr({ en: 'Ti-punch? That\'s water!', fr: 'Ti-punch ? C\'est de l\'eau ça !' }));
        } else {
          s.verdict = 'win';
          g.fx.text(GX, surfaceY() - 40, g.tr({ en: 'Perfect dose!', fr: 'Dose parfaite !' }), { size: 26, color: PAL.mango });
          decide(true, g.tr({ en: 'Hoho! Santé!', fr: 'Hoho ! Santé !' }));
        }
      },
      draw(c) {
        scene.beach(c, g.W, g.H, s.t, { horizon: 0.4, shore: 0.52 });
        // Thatched roof (straw fringe).
        c.fillStyle = vgrad(c, 0, 120, ['#c99a4b', '#e8c97e']);
        c.fillRect(0, 0, g.W, 96);
        for (let x = -10; x < g.W + 10; x += 14) {
          const len = 22 + ((x * 7) % 13) + Math.sin(s.t * 2 + x) * 2;
          c.fillStyle = (x / 14) % 2 ? '#d8b265' : '#c49a50';
          c.beginPath();
          c.moveTo(x, 90);
          c.lineTo(x + 14, 90);
          c.lineTo(x + 7, 90 + len);
          c.fill();
        }
        // Bamboo posts of the paillote.
        for (const px of [18, 382]) {
          c.fillStyle = vgrad(c, 0, g.H, ['#d9b26a', '#b48a46']);
          rrect(c, px - 9, 100, 18, counterY - 90, 8);
          c.fill();
          c.fillStyle = 'rgba(90,60,20,0.35)';
          for (let y = 150; y < counterY; y += 70) c.fillRect(px - 9, y, 18, 4);
        }
        // Friend holds the glass, hero holds the bottle (both behind the counter).
        const fpose = g.done ? (g.won ? 'cheer' : 'sad') : 'point';
        const lift = s.raise * 40;
        person(c, friend, 95, gy + 72 - lift * 0.2, 220, fpose, s.t + 1);
        const hpose = g.done ? (g.won ? 'cheer' : 'sad') : 'idle';
        person(c, g.hero, 345, gy + 72, 200, hpose, s.t, { flip: true, hat: g.hat });
        // The glass.
        c.save();
        c.translate(0, -lift);
        const top = gy - GH;
        const glassPath = () => {
          c.beginPath();
          c.moveTo(GX - GW_TOP / 2, top);
          c.lineTo(GX - GW_BOT / 2, gy);
          c.lineTo(GX + GW_BOT / 2, gy);
          c.lineTo(GX + GW_TOP / 2, top);
          c.closePath();
        };
        shadowed(c, () => {
          glassPath();
          c.fillStyle = 'rgba(225,245,255,0.28)';
          c.fill();
        }, 18, 8, 'rgba(20,10,40,0.2)');
        c.save();
        glassPath();
        c.clip();
        // Dose band between the two lines.
        const yLow = gy - 8 - low * (GH - 8);
        const yHigh = gy - 8 - high * (GH - 8);
        const pulse = 0.5 + 0.5 * Math.sin(s.t * 12);
        c.fillStyle = s.inZone && s.pouring && !g.done ? `rgba(120,255,170,${0.3 + 0.25 * pulse})` : 'rgba(255,214,102,0.22)';
        c.fillRect(GX - GW_TOP, yHigh, GW_TOP * 2, yLow - yHigh);
        // Lime slice and cane sugar at the bottom.
        ellipse(c, GX, gy - 10, GW_BOT * 0.42, 6, 'rgba(255,248,225,0.9)');
        // Rum.
        if (s.level > 0) {
          const sy = surfaceY();
          c.fillStyle = vgrad(c, sy, gy, ['rgba(255,200,95,0.9)', 'rgba(205,120,35,0.95)']);
          c.beginPath();
          c.moveTo(GX - GW_TOP, gy);
          for (let x = -GW_TOP; x <= GW_TOP; x += 8) c.lineTo(GX + x, sy + Math.sin(x * 0.12 + s.t * 14) * (s.pouring ? 3 : 1));
          c.lineTo(GX + GW_TOP, gy);
          c.fill();
          ellipse(c, GX, sy, GW_TOP * 0.5, 4, 'rgba(255,240,200,0.45)');
          for (let i = 0; i < 5; i++) circle(c, GX - 40 + i * 20, gy - ((s.t * 60 + i * 37) % Math.max(10, gy - sy)), 2, 'rgba(255,255,255,0.45)');
        }
        c.save();
        c.translate(GX + 18, gy - 18);
        c.rotate(-0.3);
        c.beginPath();
        c.arc(0, 0, 18, Math.PI, 0);
        c.fillStyle = '#6fd04f';
        c.fill();
        c.beginPath();
        c.arc(0, 0, 14, Math.PI, 0);
        c.fillStyle = '#d9f7a8';
        c.fill();
        c.restore();
        c.restore();
        // Dose lines.
        c.save();
        c.setLineDash([8, 6]);
        c.lineWidth = 3;
        for (const [y, col] of [[yLow, '#ffffff'], [yHigh, PAL.hibiscus]]) {
          c.strokeStyle = col;
          c.beginPath();
          c.moveTo(GX - GW_TOP / 2 + 4, y);
          c.lineTo(GX + GW_TOP / 2 - 4, y);
          c.stroke();
        }
        c.restore();
        c.strokeStyle = PAL.mango;
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(GX + GW_TOP / 2 + 6, yLow);
        c.lineTo(GX + GW_TOP / 2 + 14, yLow);
        c.lineTo(GX + GW_TOP / 2 + 14, yHigh);
        c.lineTo(GX + GW_TOP / 2 + 6, yHigh);
        c.stroke();
        text(c, 'DOSE', GX + GW_TOP / 2 + 22, (yLow + yHigh) / 2, { size: 13, color: PAL.mango, align: 'left', stroke: 'rgba(30,26,51,0.6)' });
        // Glass rim and highlight.
        ellipse(c, GX, top, GW_TOP / 2, 7, 'rgba(255,255,255,0.35)');
        c.fillStyle = 'rgba(255,255,255,0.45)';
        c.fillRect(GX - GW_TOP / 2 + 12, top + 14, 6, GH - 34);
        rrect(c, GX - GW_BOT / 2, gy - 8, GW_BOT, 8, 3);
        c.fillStyle = 'rgba(230,245,255,0.6)';
        c.fill();
        c.restore();
        // Bamboo counter in front.
        shadowed(c, () => {
          c.fillStyle = vgrad(c, counterY, counterY + 24, ['#e2bd76', '#b48a46']);
          rrect(c, -10, counterY, g.W + 20, 24, 10);
          c.fill();
        }, 14, 6);
        c.fillStyle = vgrad(c, counterY + 24, g.H, ['#c79c55', '#8f6a32']);
        c.fillRect(0, counterY + 24, g.W, g.H - counterY - 24);
        c.strokeStyle = 'rgba(90,60,20,0.3)';
        c.lineWidth = 3;
        for (let x = 20; x < g.W; x += 34) {
          c.beginPath();
          c.moveTo(x, counterY + 26);
          c.lineTo(x, g.H);
          c.stroke();
        }
        // Rum stream from the neck to the surface.
        const n = neck();
        if (s.pouring && s.tilt < TILT * 0.6) {
          const sy = Math.min(gy - 8, surfaceY() - lift);
          c.strokeStyle = 'rgba(255,190,80,0.85)';
          c.lineCap = 'round';
          c.lineWidth = 7 + Math.sin(s.t * 30) * 1.5;
          c.beginPath();
          c.moveTo(n.x, n.y);
          c.quadraticCurveTo(n.x - 6, n.y + 20, GX + 10, sy);
          c.stroke();
          circle(c, GX + 10 + Math.sin(s.t * 20) * 6, sy - 2, 5, 'rgba(255,240,200,0.7)');
        }
        // The hero's arm reaching up to the bottle.
        const o = OUTFITS[g.hero] || OUTFITS.panda;
        c.strokeStyle = o.pattern === 'madras' ? '#f0a92b' : o.shirt;
        c.lineCap = 'round';
        c.lineWidth = 15;
        c.beginPath();
        c.moveTo(332, gy + 72 - 84);
        c.quadraticCurveTo(350, pivot.y + 70, pivot.x + 8, pivot.y + 16);
        c.stroke();
        circle(c, pivot.x + 8, pivot.y + 16, 9, o.skin);
        // The bottle in the hero's hand.
        c.save();
        c.translate(pivot.x, pivot.y);
        c.rotate(s.tilt);
        bottle(c, s.t);
        c.restore();
        if (!g.done && !s.pouring) text(c, g.tr({ en: 'HOLD ✋', fr: 'MAINTIENS ✋' }), 200, g.H * 0.9, { size: 26, color: PAL.cream, stroke: 'rgba(30,26,51,0.5)' });
      },
      bot() {
        if (!s.pouring && s.level === 0 && g.elapsed > 0.15) return { press: [200, 400] };
        if (s.pouring && s.level >= (low + high) / 2) return { release: [200, 400] };
        return null;
      },
    };
  },
};
