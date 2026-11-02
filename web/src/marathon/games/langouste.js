// Langouste (world 4, lagoon dive): a spiny lobster lies on the legal size
// gauge. Swipe UP to keep it (its horns reach the red MIN line), DOWN to throw
// it back. Running joke: the hero's catches are usually a bit small. Keeping a
// small one brings the coast guard friend with a fine.

import { scene, person, rrect, circle, ellipse, PAL, text, shadowed, vgrad } from '../art.js';

const RULER_X0 = 40;
const RULER_X1 = 360;
const LEGAL = 205; // legal length in stage units, from the tail fan to the horns
const LINE_X = RULER_X0 + LEGAL;

/** A Caribbean spiny lobster, tail tip at the origin, body along +x, belly on y = 0. */
export function lobster(c, L, t, { flick = 0 } = {}) {
  const h = L * 0.15;
  c.save();
  c.lineCap = 'round';
  // Long spiny antennae sweep back over the body (they do not count in the size).
  for (const side of [0, 1]) {
    const sway = Math.sin(t * 3 + side * 1.7) * L * 0.04;
    const bx = L * 0.94;
    const by = -h * 1.5;
    const ex = L * (side ? 0.62 : 0.78) + sway;
    const ey = -L * (side ? 0.6 : 0.7);
    for (let i = 0; i < 3; i++) {
      c.strokeStyle = ['#9c3a22', '#d0643a', '#f6b07a'][i];
      c.lineWidth = Math.max(1, L * (0.045 - i * 0.015));
      c.beginPath();
      c.moveTo(bx, by);
      c.quadraticCurveTo(L * 1.22, -L * (0.3 + side * 0.06), ex, ey);
      c.stroke();
    }
  }
  // Walking legs.
  c.strokeStyle = '#c95a32';
  c.lineWidth = Math.max(1.5, L * 0.018);
  for (let i = 0; i < 4; i++) {
    const lx = L * (0.6 + i * 0.08);
    const step = Math.sin(t * 9 + i * 1.3) * L * 0.012;
    c.beginPath();
    c.moveTo(lx, -h * 0.5);
    c.lineTo(lx + L * 0.03 + step, -h * 0.15);
    c.lineTo(lx + L * 0.01 + step, 0);
    c.stroke();
  }
  // Tail fan.
  c.save();
  c.translate(L * 0.12, -h * 0.55);
  c.rotate(flick);
  for (const a of [-0.75, -0.38, 0, 0.38, 0.75]) {
    c.save();
    c.rotate(Math.PI + a);
    ellipse(c, L * 0.065, 0, L * 0.075, h * 0.24, a === 0 ? '#e9824a' : '#d4623a');
    c.restore();
  }
  c.restore();
  // Abdomen segments, growing towards the head.
  for (let i = 0; i < 5; i++) {
    const sh = h * (0.95 + i * 0.12);
    const sx = L * (0.1 + i * 0.09);
    c.fillStyle = vgrad(c, -sh, 0, ['#f08a4b', '#b8462a']);
    rrect(c, sx, -sh, L * 0.105, sh, sh * 0.45);
    c.fill();
    circle(c, sx + L * 0.05, -sh * 0.62, Math.max(1, L * 0.012), 'rgba(255,228,180,0.9)');
    c.fillStyle = 'rgba(255,255,255,0.18)';
    rrect(c, sx + 2, -sh + 2, L * 0.08, sh * 0.25, sh * 0.12);
    c.fill();
  }
  // Carapace with spines and the two front horns (the measuring point).
  const cx = L * 0.74;
  const cy = -h;
  c.fillStyle = '#a63c22';
  for (let i = 0; i < 6; i++) {
    const sx = L * (0.56 + i * 0.065);
    c.beginPath();
    c.moveTo(sx - L * 0.018, cy - h * 0.82);
    c.lineTo(sx + L * 0.012, cy - h * 1.22);
    c.lineTo(sx + L * 0.02, cy - h * 0.8);
    c.fill();
  }
  c.beginPath();
  c.moveTo(L * 0.9, cy - h * 0.7);
  c.lineTo(L, cy - h * 0.95);
  c.lineTo(L * 0.93, cy - h * 0.3);
  c.fill();
  const grad = c.createRadialGradient(cx - L * 0.06, cy - h * 0.4, 1, cx, cy, L * 0.26);
  grad.addColorStop(0, '#ffa766');
  grad.addColorStop(0.6, '#d8592f');
  grad.addColorStop(1, '#93301b');
  ellipse(c, cx, cy, L * 0.22, h * 1.0, grad);
  for (let i = 0; i < 5; i++) circle(c, cx - L * 0.12 + i * L * 0.055, cy - h * 0.2 + (i % 2) * h * 0.35, Math.max(1, L * 0.014), 'rgba(255,232,190,0.85)');
  ellipse(c, cx - L * 0.05, cy - h * 0.55, L * 0.1, h * 0.22, 'rgba(255,255,255,0.25)');
  // Eyes on short stalks.
  circle(c, L * 0.94, cy - h * 0.55, Math.max(2, L * 0.022), '#1e1a33');
  circle(c, L * 0.945, cy - h * 0.6, Math.max(0.8, L * 0.007), '#ffffff');
  c.restore();
}

const NAMES = { panda: 'Panda', cous: 'Cous', mamar: 'Mamar', babar: 'Babar', victor: 'Victor', romain: 'Romain', eugenie: 'Eugénie', violaine: 'Violaine', aline: 'Aline', greg: 'Greg' };

export default {
  id: 'langouste',
  world: 'w04',
  input: 'swipe',
  base: 5.5,
  min: 3.2,
  survive: false,
  verb: { en: 'KEEP OR THROW BACK?', fr: 'GARDER OU RELÂCHER ?' },
  axis: 'y', // swipes are up/down
  title: { en: "Legal size?", fr: "Taille légale ?" },
  howto: { en: "Does the lobster's head reach the GREEN zone of the ruler? Keep it: swipe up or tap KEEP. Head in the RED zone? Too small: swipe down or tap THROW BACK.", fr: "La t\u00eate de la langouste arrive dans la zone VERTE de la r\u00e8gle ? Garde-la : glisse en haut ou touche GARDE. T\u00eate dans eul’ ROUGE ? Trop petite : glisse en bas ou touche REL\u00c2CHE." },
  winLine: { en: "No fine today!", fr: "Pas d'amende aujourd'hui !" },
  rival: ["victor", "greg"],
  rivalLine: { en: "No fine today… what a shame.", fr: "Pas d'amende aujourd'hui… dommage." },
  loseLine: { en: "Hoho, it was THIS big underwater!", fr: "Hoho, sous l'eau elle était grosse comme ça !" },
  create(g) {
    const total = g.boss ? 4 : g.speed >= 1.9 ? 3 : 2;
    const guard = g.cast('victor', 'greg');
    const rulerY = g.H * 0.44;
    const heroY = g.H * 0.86;
    const inT = 0.34 / Math.sqrt(g.speed);
    const outT = 0.32 / Math.sqrt(g.speed);
    const bag = { x: 330, y: g.H * 0.17 };
    // The hero's catches are usually too small: ~60 % undersized.
    const catches = Array.from({ length: total }, () => {
      const small = g.random() < 0.6;
      const len = small ? LEGAL - 28 - g.random() * 42 : LEGAL + 14 + g.random() * 55;
      return { len, small, state: 'wait', k: 0, out: 0, dir: 0 };
    });
    const s = { t: 0, i: 0, kept: 0, guardK: 0, guardOn: false, verdict: null, mood: 0, endShown: false };
    catches[0].state = 'in';
    catches[0].at = 0.08;

    function current() {
      return catches[s.i];
    }

    function answer(dir) {
      const l = current();
      if (!l || l.state !== 'in' || l.k < 0.35) return;
      l.state = 'out';
      l.dir = dir === 'up' ? -1 : 1;
      const keep = dir === 'up';
      if (keep && l.small) {
        // Busted: the coast guard friend pops in with a fine.
        s.guardOn = true;
        s.verdict = 'fine';
        g.sfx.bad();
        g.fx.flash('rgba(90,160,255,0.35)', 0.25);
        g.fx.shake(10);
        g.say(330, heroY - 190, g.tr({ en: 'Too small! Fine!', fr: 'Trop petite ! Amende !' }), 1.6);
        g.lose();
        return;
      }
      if (!keep && !l.small) {
        s.verdict = 'dinner';
        g.sfx.bad();
        g.fx.burst(LINE_X, rulerY - 40, { kind: 'drop', n: 14, colors: ['#ffffff', '#bff4ff'] });
        g.say(110, heroY - 180, g.tr({ en: 'Hoho… that was dinner!', fr: 'Hoho… c\'était le dîner !' }), 1.6);
        g.lose();
        return;
      }
      if (keep) {
        s.kept++;
        g.sfx.coin();
        g.fx.burst(bag.x, bag.y + 30, { kind: 'spark', n: 14, colors: [PAL.mango, '#fff3c4'], speed: 200 });
        g.fx.text(200, rulerY - 120, g.tr({ en: 'Legal! Dinner!', fr: 'Légale ! Au dîner !' }), { size: 26, color: PAL.mango });
      } else {
        g.sfx.splash();
        g.fx.burst(200, rulerY + 40, { kind: 'drop', n: 16, colors: ['#ffffff', '#bff4ff', PAL.lagoon] });
        g.fx.text(200, rulerY + 90, g.tr({ en: 'Grow up, little one!', fr: 'Grandis bien, ti moun !' }), { size: 24, color: PAL.cream });
      }
      s.mood = 0.5;
      if (s.i === total - 1) {
        g.sfx.hoho();
        g.fx.burst(200, rulerY - 60, { kind: 'confetti', n: 30 });
        g.say(110, heroY - 180, g.tr({ en: 'Hoho! Fair fishing!', fr: 'Hoho ! Pêche réglo !' }), 1.4);
        g.win();
      }
    }

    return {
      update(dt) {
        s.t += dt;
        s.mood = Math.max(0, s.mood - dt);
        if (s.guardOn) s.guardK = Math.min(1, s.guardK + dt * 5);
        for (let i = 0; i < catches.length; i++) {
          const l = catches[i];
          if (l.state === 'wait' && i === s.i && s.t >= l.at && !g.done) l.state = 'in';
          if (l.state === 'in') l.k = Math.min(1, l.k + dt / inT);
          if (l.state === 'out') {
            l.out += dt / outT;
            if (i === s.i && l.out >= 0.55 && i + 1 < total && !g.done) {
              s.i++;
              catches[s.i].at = s.t;
              catches[s.i].state = 'in';
            }
          }
        }
        if (g.done && !g.won && g.timeout && !s.endShown) {
          s.endShown = true;
          g.sfx.bad();
          g.say(110, heroY - 180, g.tr({ en: 'Hoho… it swam off!', fr: 'Hoho… elle s\'est sauvée !' }), 1.4);
          const l = current();
          if (l && l.state === 'in') {
            l.state = 'out';
            l.dir = 1;
          }
        }
      },
      swipe(dir) {
        if (dir === 'up' || dir === 'down') answer(dir);
      },
      press(x, y) {
        // The two big buttons: KEEP above the ruler, THROW BACK below it.
        if (y < rulerY - 70) answer('up');
        else if (y > rulerY + 90 && y < heroY - 40) answer('down');
      },
      draw(c) {
        scene.lagoon(c, g.W, g.H, s.t);
        // Counter: catch n / total.
        text(c, `${Math.min(s.i + 1, total)}/${total}`, 60, g.H * 0.13, { size: 26, color: PAL.cream });
        // Mesh bag (keep) at the top right.
        const bagSwing = Math.sin(s.t * 2) * 0.06;
        c.save();
        c.translate(bag.x, bag.y);
        c.rotate(bagSwing);
        c.strokeStyle = 'rgba(255,255,255,0.7)';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(-30, 0);
        c.lineTo(0, -26);
        c.lineTo(30, 0);
        c.stroke();
        shadowed(c, () => {
          rrect(c, -36, 0, 72, 70, 28);
          c.fillStyle = 'rgba(255,190,90,0.35)';
          c.fill();
        }, 10, 4);
        for (let k = 0; k < s.kept; k++) ellipse(c, -12 + k * 14, 46 - k * 6, 18, 9, '#d8592f', 0.4 - k * 0.5);
        c.strokeStyle = 'rgba(255,240,210,0.75)';
        c.lineWidth = 1.5;
        for (let k = -30; k <= 30; k += 12) {
          c.beginPath();
          c.moveTo(k, 2);
          c.lineTo(k * 0.7, 68);
          c.stroke();
        }
        for (let k = 12; k < 70; k += 12) {
          c.beginPath();
          c.moveTo(-34, k);
          c.lineTo(34, k);
          c.stroke();
        }
        c.restore();
        // Two big buttons: KEEP (up) and THROW BACK (down).
        const pulse = 0.6 + 0.4 * Math.sin(s.t * 6);
        if (!g.done) {
          const btn = (y, label, col, dy) => {
            shadowed(c, () => {
              rrect(c, 70, y - 26, 260, 52, 26);
              c.fillStyle = col;
              c.fill();
            }, 14, 5);
            text(c, label, 200, y + 1 + dy * pulse * 2, { size: 24, color: '#fff', shadow: false });
          };
          btn(rulerY - 185, `✅ ${g.tr({ en: 'KEEP', fr: 'GARDE' })}  ▲`, '#18a96b', -1);
          btn(rulerY + 130, `🌊 ${g.tr({ en: 'THROW BACK', fr: 'RELÂCHE' })}  ▼`, '#1c86c9', 1);
        }
        // The legal size gauge.
        shadowed(c, () => {
          rrect(c, RULER_X0 - 8, rulerY, RULER_X1 - RULER_X0 + 16, 38, 10);
          c.fillStyle = vgrad(c, rulerY, rulerY + 38, ['#ffe08a', '#f5b942']);
          c.fill();
        }, 12, 5);
        // Red = too small, green = legal: where the head lands is the answer.
        c.save();
        rrect(c, RULER_X0 - 8, rulerY, RULER_X1 - RULER_X0 + 16, 38, 10);
        c.clip();
        c.fillStyle = 'rgba(239, 45, 107, 0.55)';
        c.fillRect(RULER_X0 - 8, rulerY, LINE_X - RULER_X0 + 8, 38);
        c.fillStyle = 'rgba(22, 170, 100, 0.6)';
        c.fillRect(LINE_X, rulerY, RULER_X1 - LINE_X + 8, 38);
        c.restore();
        c.strokeStyle = 'rgba(80,50,10,0.55)';
        c.lineWidth = 2;
        for (let x = RULER_X0, n = 0; x <= RULER_X1; x += 16, n++) {
          c.beginPath();
          c.moveTo(x, rulerY + 2);
          c.lineTo(x, rulerY + (n % 5 === 0 ? 16 : 9));
          c.stroke();
        }
        // The MIN line glows; brighter while a lobster is being judged.
        const judging = current()?.state === 'in';
        const lg = c.createLinearGradient(LINE_X - 18, 0, LINE_X + 18, 0);
        lg.addColorStop(0, 'rgba(239,45,107,0)');
        lg.addColorStop(0.5, `rgba(239,45,107,${judging ? 0.35 + 0.2 * pulse : 0.25})`);
        lg.addColorStop(1, 'rgba(239,45,107,0)');
        c.fillStyle = lg;
        c.fillRect(LINE_X - 18, rulerY - 130, 36, 170);
        c.save();
        c.strokeStyle = PAL.hibiscus;
        c.lineWidth = 4;
        c.setLineDash([10, 7]);
        c.beginPath();
        c.moveTo(LINE_X, rulerY - 120);
        c.lineTo(LINE_X, rulerY + 38);
        c.stroke();
        c.restore();
        rrect(c, LINE_X - 26, rulerY - 152, 52, 26, 13);
        c.fillStyle = PAL.hibiscus;
        c.fill();
        text(c, 'MIN', LINE_X, rulerY - 139, { size: 16, color: '#fff', shadow: false });
        text(c, g.tr({ en: 'TOO SMALL', fr: 'TROP PETITE' }), (RULER_X0 + LINE_X) / 2, rulerY + 27, { size: 14, color: '#fff', shadow: false, weight: 700 });
        text(c, g.tr({ en: 'OK', fr: 'OK' }) + ' ✓', (LINE_X + RULER_X1) / 2, rulerY + 27, { size: 14, color: '#fff', shadow: false, weight: 700 });
        // The lobsters.
        for (const l of catches) {
          if (l.state === 'wait') continue;
          if (l.state === 'out' && l.out >= 1.4) continue;
          c.save();
          if (l.state === 'in') {
            const e = 1 - Math.pow(1 - l.k, 3);
            c.translate(RULER_X0 + (1 - e) * -60, rulerY + (1 - e) * 160);
            c.globalAlpha = Math.min(1, l.k * 2.5);
            lobster(c, l.len, s.t + l.len, { flick: Math.sin(s.t * 10) * 0.12 * (1 - l.k) });
          } else {
            const k = Math.min(1.4, l.out);
            const e = k * k;
            if (l.dir < 0 && s.verdict !== 'fine') {
              // Into the bag.
              const sc = 1 - Math.min(0.8, k * 0.6);
              c.translate(RULER_X0 + (bag.x - 40 - RULER_X0) * Math.min(1, e), rulerY - (rulerY - bag.y - 40) * Math.min(1, e));
              c.scale(sc, sc);
              c.globalAlpha = Math.max(0, 1 - Math.max(0, k - 0.9) * 2);
            } else if (l.dir < 0) {
              // Lifted up, then caught by the coast guard: it hangs there.
              c.translate(RULER_X0 + Math.min(1, k) * 20, rulerY - Math.min(1, k) * 70);
            } else {
              // Thrown back: tail-flips down and away.
              c.translate(RULER_X0 + e * 140, rulerY + e * 260);
              c.rotate(e * 0.5);
              c.globalAlpha = Math.max(0, 1 - k * 0.8);
            }
            lobster(c, l.len, s.t + l.len, { flick: Math.sin(s.t * 26) * 0.35 });
          }
          c.restore();
        }
        // The hero floats in snorkel gear with the gauge.
        const bob = Math.sin(s.t * 2.2) * 5;
        const pose = g.done ? (g.won ? 'cheer' : 'sad') : s.mood > 0 ? 'cheer' : 'point';
        person(c, g.hero, 105, heroY + bob, 175, pose, s.t, { hat: g.hat });
        // Snorkel and mask.
        c.save();
        c.strokeStyle = PAL.mango;
        c.lineWidth = 6;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(140, heroY + bob - 175);
        c.lineTo(146, heroY + bob - 220);
        c.stroke();
        c.restore();
        text(c, g.tr({ en: `${NAMES[g.hero] || 'Panda'}'s catch`, fr: `La pêche de ${NAMES[g.hero] || 'Panda'}` }), 110, heroY + 34, { size: 15, color: 'rgba(255,255,255,0.8)', weight: 600 });
        // The coast guard pops in on a wrong keep.
        if (s.guardOn) {
          const gx = 470 - s.guardK * 150;
          person(c, guard, gx, heroY + 4, 175, 'point', s.t, { flip: true, hat: 'shades' });
          shadowed(c, () => {
            c.save();
            c.translate(gx - 70, heroY - 120);
            c.rotate(-0.15 + Math.sin(s.t * 8) * 0.05);
            rrect(c, -34, -22, 68, 44, 8);
            c.fillStyle = PAL.cream;
            c.fill();
            c.fillStyle = PAL.hibiscus;
            c.fillRect(-34, -22, 68, 10);
            text(c, g.tr({ en: 'FINE', fr: 'AMENDE' }), 0, 6, { size: 14, color: PAL.ink, shadow: false });
            c.restore();
          }, 8, 3);
        }
      },
      bot() {
        const l = current();
        if (!l || l.state !== 'in' || l.k < 0.75) return null;
        return { swipe: l.small ? 'down' : 'up' };
      },
    };
  },
};
