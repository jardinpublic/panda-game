// Croco (world 11): Georges the Lézarde holds the hero's sapat (sandal) in his
// open jaws and the hero's hand is in there gripping it. The jaws twitch
// (fakes: eyes stay yellow). When he REALLY snaps, his eyes flash red and the
// jaw shudders wide open: TAP right then to yank the hand out with the sandal.
// Too early he clamps down on the sandal (lost); too late: CHOMP.

import { scene, head, person, circle, ellipse, PAL, text, vgrad, madras, hibiscus, OUTFITS } from '../art.js';

const L = 215; // snout length from the hinge
const ease = (k) => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
const WATER = ['#bfe9e0', '#ffffff', '#7cc8a8'];

function rot(x, y, a) {
  const cs = Math.cos(a);
  const sn = Math.sin(a);
  return [x * cs - y * sn, x * sn + y * cs];
}

function mix(a, b, k) {
  const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16));
  const pb = b.match(/\w\w/g).map((h) => parseInt(h, 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(',')})`;
}

/** A rounded tooth from (x, y), len > 0 points down, < 0 points up. */
function tooth(c, x, y, len, w) {
  c.fillStyle = '#fffaf0';
  c.beginPath();
  c.moveTo(x - w, y);
  c.quadraticCurveTo(x - w * 0.3, y + len * 0.7, x, y + len);
  c.quadraticCurveTo(x + w * 0.3, y + len * 0.7, x + w, y);
  c.closePath();
  c.fill();
}

/** Long back in the water, trailing off to the right. Hinge at (0, 0). */
function body(c) {
  c.fillStyle = vgrad(c, -50, 60, ['#5cb870', '#3d8f55', '#2f7a47']);
  c.beginPath();
  c.moveTo(-10, 40);
  c.quadraticCurveTo(20, -52, 120, -40);
  c.quadraticCurveTo(240, -28, 300, 8);
  c.lineTo(300, 60);
  c.lineTo(-10, 60);
  c.closePath();
  c.fill();
  for (let i = 0; i < 7; i++) {
    const x = 70 + i * 32;
    const y = -40 + Math.pow(i / 6, 2) * 34;
    ellipse(c, x, y, 11, 8, '#2f7a47');
    ellipse(c, x - 2, y - 2, 4, 3, 'rgba(255,255,255,0.25)');
  }
}

/** Pink mouth between the jaws (drawn first). */
function mouth(c, upper, lower) {
  const [ux, uy] = rot(-L + 24, 6, upper);
  const [lx, ly] = rot(-L + 24, -4, -lower);
  const g = c.createRadialGradient(30, -10, 4, -L * 0.4, -10, L * 0.75);
  g.addColorStop(0, '#4a0f26');
  g.addColorStop(0.35, '#a8324f');
  g.addColorStop(1, '#ff8fa3');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(60, -4);
  c.lineTo(ux, uy);
  c.quadraticCurveTo(Math.min(ux, lx) - 8, (uy + ly) / 2, lx, ly);
  c.closePath();
  c.fill();
}

function lowerJaw(c, lower) {
  c.save();
  c.rotate(-lower);
  c.fillStyle = vgrad(c, -4, 46, ['#4aa463', '#3d8f55', '#2f7a47']);
  c.beginPath();
  c.moveTo(60, -6);
  c.lineTo(-L + 26, -4);
  c.quadraticCurveTo(-L + 2, -2, -L + 6, 14);
  c.quadraticCurveTo(-L + 16, 34, -L + 60, 38);
  c.lineTo(20, 46);
  c.quadraticCurveTo(76, 40, 60, -6);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(232,238,176,0.8)';
  c.beginPath();
  c.moveTo(-L + 24, 28);
  c.quadraticCurveTo(-L + 60, 42, 14, 42);
  c.lineTo(14, 47);
  c.quadraticCurveTo(-L + 50, 48, -L + 18, 32);
  c.closePath();
  c.fill();
  ellipse(c, -70, -6, 72, 11, '#ff7891');
  ellipse(c, -80, -9, 40, 3, 'rgba(255,255,255,0.25)');
  c.strokeStyle = '#e9849a';
  c.lineWidth = 5;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-L + 20, -3);
  c.lineTo(30, -5);
  c.stroke();
  for (let x = -L + 26; x < -30; x += 24) tooth(c, x, -3, x < -L + 60 ? -18 : -13, 6.5);
  c.restore();
}

function upperJaw(c, upper, red, blink, t) {
  c.save();
  c.rotate(upper);
  c.fillStyle = vgrad(c, -110, 4, ['#7ad488', '#4aa463', '#2f7a47']);
  c.beginPath();
  c.moveTo(70, 4);
  c.lineTo(-L + 22, 2);
  c.quadraticCurveTo(-L - 4, 0, -L - 2, -18);
  c.quadraticCurveTo(-L, -42, -L + 26, -46);
  c.quadraticCurveTo(-L + 48, -46, -L + 66, -38);
  c.quadraticCurveTo(-90, -46, -40, -56);
  c.quadraticCurveTo(-5, -64, 8, -82);
  c.quadraticCurveTo(40, -116, 80, -72);
  c.quadraticCurveTo(98, -30, 70, 4);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(225,235,160,0.85)';
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(-L + 16, -1);
  c.lineTo(62, 1);
  c.stroke();
  for (const [x, y, r] of [[-L + 64, -34, 6], [-128, -44, 7], [-92, -48, 8], [-52, -54, 7], [60, -92, 6], [84, -56, 5]]) ellipse(c, x, y, r * 1.3, r, 'rgba(40,110,60,0.55)');
  ellipse(c, -110, -48, 64, 6, 'rgba(255,255,255,0.2)', -0.08);
  ellipse(c, -L + 24, -45, 7, 4, '#1f4d30');
  for (let x = -L + 18; x < -24; x += 22) tooth(c, x, 1, x < -L + 40 ? 24 : 15, 6.5);
  // Eye on its bulge: big, cute, and red when he is about to snap.
  if (red > 0) {
    const gl = c.createRadialGradient(30, -86, 4, 30, -86, 64);
    gl.addColorStop(0, `rgba(255,40,40,${0.75 * red})`);
    gl.addColorStop(1, 'rgba(255,40,40,0)');
    c.fillStyle = gl;
    c.fillRect(-40, -156, 140, 140);
  }
  circle(c, 32, -84, 29, '#5bbb70');
  circle(c, 30, -86, 20, '#fff8e6');
  circle(c, 26, -86, 14, mix('f6d84a', 'ff2b2b', red));
  ellipse(c, 24, -86, 3.6 - red * 1.6, 11, PAL.ink);
  circle(c, 20, -92, 4, '#ffffff');
  // Menacing lid, slanting down toward the snout.
  const b = blink * 18;
  c.fillStyle = '#4fae66';
  c.beginPath();
  c.moveTo(4, -112);
  c.lineTo(58, -112);
  c.lineTo(54, -102 + b);
  c.lineTo(8, -90 + b);
  c.closePath();
  c.fill();
  if (red > 0) {
    c.strokeStyle = `rgba(255,80,80,${0.8 * red})`;
    c.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const a = -1.9 + i * 0.5;
      c.beginPath();
      c.moveTo(30 + Math.cos(a) * 40, -86 + Math.sin(a) * 40);
      c.lineTo(30 + Math.cos(a) * (52 + Math.sin(t * 40) * 3), -86 + Math.sin(a) * (52 + Math.sin(t * 40) * 3));
      c.stroke();
    }
  }
  c.restore();
}

/** A flip-flop (sapat), sole centred on (x, y). */
function sandal(c, x, y, r = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(r);
  ellipse(c, 0, 4, 40, 10, '#b8235a');
  ellipse(c, 0, 0, 40, 9, PAL.hibiscus);
  ellipse(c, -6, -2, 26, 3, 'rgba(255,255,255,0.3)');
  c.strokeStyle = PAL.mango;
  c.lineWidth = 5;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-24, -1);
  c.quadraticCurveTo(-8, -24, 14, -1);
  c.stroke();
  hibiscus(c, -6, -13, 7, 0.4, '#ffffff');
  c.restore();
}

export default {
  id: 'croco',
  world: 'w11',
  input: 'tap',
  base: 4.5,
  survive: false,
  verb: { en: 'WAIT… PULL!', fr: 'ATTENDS… TIRE !' },
  title: { en: "Georges the croco", fr: "Georges eul’ croco" },
  howto: { en: "Georges has your sandal. Ignore the fake twitches and pull out when his eyes go red.", fr: "Georges a ta sapate. Ignore les fausses alertes et tire quand ses yeux deviennent rouges." },
  winLine: { en: "Sandal saved, fingers too!", fr: "Sapate sauvée, doigts aussi !" },
  rival: ["victor", "greg"],
  rivalLine: { en: "Georges was hungry, you know…", fr: "Georges avait faim, te sais…" },
  loseLine: { en: "Hoho, my sandal!", fr: "Hoho, ma sapate !" },
  create(g) {
    const sp = g.speed;
    const hx = 318;
    const hy = g.H * 0.56;
    const snapAt = g.duration * (0.42 + g.random() * 0.24);
    const tellT = 0.5 / Math.pow(sp, 0.6);
    const fakeT = 0.17 / Math.sqrt(sp);
    const fakes = [];
    for (let ft = (0.3 + g.random() * 0.25) / sp; ft < snapAt - 0.32 / sp - fakeT && fakes.length < 3; ft += (0.42 + g.random() * 0.45) / sp) fakes.push(ft);
    const watcher = g.friend();
    const o = OUTFITS[g.hero] || OUTFITS.panda;
    const s = { t: 0, pt: 0, phase: 'wait', upper: 0.42, lower: 0.03, yank: 0, faked: -1, clac: false, hand: [hx - 144, hy - 23] };

    function setPhase(p) {
      s.phase = p;
      s.pt = 0;
    }

    function bitten() {
      setPhase('bitten');
      g.sfx.hit();
      g.sfx.splash();
      g.fx.shake(18);
      g.fx.flash('rgba(255,70,70,0.35)', 0.2);
      g.fx.burst(s.hand[0], s.hand[1], { kind: 'spark', n: 28, colors: ['#ffffff', PAL.mango, '#ff6b6b'], speed: 330 });
      g.fx.burst(hx - 100, hy + 30, { kind: 'drop', n: 22, colors: WATER, speed: 260 });
      g.fx.text(hx - 110, hy - 160, 'CHOMP!', { size: 48, color: '#ff5a5a' });
      g.say(70, hy + 60, g.tr({ en: 'OUCH OUCH OUCH!', fr: 'AÏE AÏE AÏE !' }));
      g.lose();
    }

    return {
      update(dt) {
        s.t += dt;
        s.pt += dt;
        if (s.phase === 'wait') {
          let dip = 0;
          for (const f of fakes) {
            const k = (s.t - f) / fakeT;
            if (k < 0 || k > 1) continue;
            dip = Math.sin(k * Math.PI) * 0.17;
            if (s.faked !== f) {
              s.faked = f;
              g.sfx.click();
              g.fx.burst(hx - 140, hy + 30, { kind: 'drop', n: 5, colors: WATER, speed: 90 });
            }
          }
          s.upper = 0.42 + Math.sin(s.t * 2.2) * 0.025 - dip;
          s.lower = 0.03 + dip * 0.2;
          if (!g.done && s.t >= snapAt) {
            setPhase('tell');
            g.sfx.tick(true);
            g.sfx.whoosh();
            g.fx.flash('rgba(255,60,60,0.16)', 0.12);
            g.fx.text(hx + 10, hy - 190, '!!', { size: 46, color: '#ff4d4d' });
          }
        } else if (s.phase === 'tell') {
          const k = ease(s.pt / (tellT * 0.35));
          s.upper = 0.42 + 0.2 * k + Math.sin(s.t * 80) * 0.03;
          s.lower = 0.03 + 0.07 * k + Math.cos(s.t * 70) * 0.012;
          if (!g.done && s.pt >= tellT) bitten();
        } else if (!(s.phase === 'safe' && s.pt < 0.08)) {
          // Jaws slam shut.
          s.upper += (0 - s.upper) * Math.min(1, dt * 30);
          s.lower += (0 - s.lower) * Math.min(1, dt * 30);
          if (s.phase === 'safe' && !s.clac) {
            s.clac = true;
            g.sfx.hit();
            g.fx.shake(7);
            g.fx.text(hx - 150, hy - 70, g.tr({ en: 'CLACK!', fr: 'CLAC !' }), { size: 34, color: PAL.cream });
          }
        }
        if (s.phase === 'safe' || s.phase === 'early') s.yank = Math.min(1, s.yank + dt / 0.18);
      },
      press() {
        if (s.phase === 'wait') {
          setPhase('early');
          g.sfx.whoosh();
          g.sfx.bad();
          g.fx.shake(8);
          g.fx.burst(hx - 140, hy, { kind: 'drop', n: 14, colors: WATER, speed: 200 });
          g.fx.text(200, hy - 200, g.tr({ en: 'Too early!', fr: 'Trop tôt !' }), { size: 34, color: PAL.cream });
          g.say(70, hy + 60, g.tr({ en: 'My sandal!!', fr: 'Ma sapat !!' }));
          g.lose();
        } else if (s.phase === 'tell') {
          setPhase('safe');
          g.sfx.whoosh();
          g.sfx.good();
          g.sfx.hoho();
          g.fx.burst(120, hy + 20, { kind: 'confetti', n: 40, speed: 320 });
          g.fx.burst(120, hy + 20, { kind: 'spark', n: 14, colors: [PAL.mango, '#fff3c4'], speed: 240 });
          g.fx.text(200, hy - 210, g.tr({ en: 'SANDAL SAVED!', fr: 'SAPAT SAUVÉE !' }), { size: 32, color: PAL.mango });
          g.win();
        }
      },
      draw(c) {
        const t = s.t;
        scene.mangrove(c, g.W, g.H, t);
        person(c, watcher, 46, g.H * 0.5 + 6, 100, g.done ? (g.won ? 'cheer' : 'sad') : s.phase === 'tell' ? 'point' : 'idle', t + 2, { flip: false });
        const y = hy + Math.sin(t * 1.6) * 2;
        const red = s.phase === 'tell' || s.phase === 'bitten' ? 0.75 + 0.25 * Math.sin(t * 30) : 0;
        c.save();
        c.translate(hx, y);
        body(c);
        mouth(c, s.upper, s.lower);
        lowerJaw(c, s.lower);
        c.restore();
        // Water line hides the lower body.
        c.fillStyle = vgrad(c, y + 34, g.H, ['rgba(63,143,122,0.94)', 'rgba(29,90,76,0.98)']);
        c.fillRect(0, y + 34, g.W, g.H - y - 34);
        c.strokeStyle = 'rgba(255,255,255,0.35)';
        c.lineWidth = 2.5;
        for (let i = 0; i < 3; i++) {
          const k = (t * 0.8 + i / 3) % 1;
          c.globalAlpha = 1 - k;
          c.beginPath();
          c.ellipse(hx + 20, y + 38, 150 + k * 90, 10 + k * 8, 0, 0, Math.PI * 2);
          c.stroke();
        }
        c.globalAlpha = 1;
        // Sandal on the tongue, the hand gripping its strap.
        const [sx0, sy0] = rot(-136, -9, -s.lower);
        const sandalX = hx + sx0;
        const sandalY = y + sy0;
        const yk = ease(s.yank);
        const inH = [sandalX - 8, sandalY - 14];
        const outH = [96, y + 70];
        const hand = [inH[0] + (outH[0] - inH[0]) * yk, inH[1] + (outH[1] - inH[1]) * yk];
        s.hand = hand;
        const pinned = s.phase === 'early' && s.upper < 0.2;
        if (s.phase === 'safe') sandal(c, hand[0] + 8, hand[1] + 14, -0.5 * yk);
        else if (!pinned) sandal(c, sandalX, sandalY, -s.lower);
        // The hero peeks over the yole's gunwale.
        const nervous = s.phase === 'wait' || s.phase === 'tell';
        head(c, g.hero, 72, y + 132, 150, {
          hat: g.hat,
          rot: s.phase === 'bitten' ? Math.sin(t * 40) * 0.08 : g.won ? -0.18 : -0.05 + Math.sin(t * 3) * 0.02,
          squash: s.phase === 'bitten' ? 0.92 : 1,
        });
        if (nervous) for (let i = 0; i < 2; i++) ellipse(c, 128 - i * 100, y + 82 + ((t * 40 + i * 13) % 26), 4, 6, '#bfe9ff');
        // Reaching arm: sleeve from below the gunwale, forearm into the jaws.
        const sh = [120, y + 220];
        const el = [(sh[0] + hand[0]) / 2 + 28, (sh[1] + hand[1]) / 2 + 10];
        c.lineCap = 'round';
        c.strokeStyle = o.skin;
        c.lineWidth = 24;
        c.beginPath();
        c.moveTo(el[0], el[1]);
        c.lineTo(hand[0], hand[1]);
        c.stroke();
        c.strokeStyle = o.pattern === 'madras' ? madras(c) : o.shirt;
        c.lineWidth = 34;
        c.beginPath();
        c.moveTo(sh[0], sh[1]);
        c.lineTo(el[0], el[1]);
        c.stroke();
        circle(c, hand[0], hand[1], 17, o.skin);
        for (let i = 0; i < 3; i++) ellipse(c, hand[0] - 9 + i * 8, hand[1] + 12, 4.5, 8, o.skin);
        if (s.phase === 'safe' && yk >= 1) {
          // Sandal held high in triumph.
          for (let i = 0; i < 4; i++) {
            const a = t * 3 + (i * Math.PI) / 2;
            circle(c, hand[0] + Math.cos(a) * 40, hand[1] + Math.sin(a) * 30, 3, '#fff3c4');
          }
        }
        // Upper jaw over the hand.
        const jit = s.phase === 'tell' ? Math.sin(t * 90) * 2 : 0;
        c.save();
        c.translate(hx + jit, y);
        upperJaw(c, s.upper, red, s.phase === 'early' && s.pt > 0.3 ? 0.45 : 0, t);
        c.restore();
        if (pinned) sandal(c, hx - L - 4, y - 4, 0.5);
        if (s.phase === 'bitten') {
          for (let i = 0; i < 4; i++) {
            const a = t * 5 + (i * Math.PI) / 2;
            text(c, '★', hx - 150 + Math.cos(a) * 46, y - 40 + Math.sin(a) * 16, { size: 18, color: PAL.mango, shadow: false });
          }
        }
        // Yole (Martinique racing boat) in the foreground.
        const gy = y + 205;
        c.fillStyle = vgrad(c, gy - 30, g.H, ['#ff8a5c', '#e2553f', '#a83a3a']);
        c.beginPath();
        c.moveTo(-20, gy + 6);
        c.quadraticCurveTo(140, gy + 14, 268, gy - 34);
        c.lineTo(276, gy - 18);
        c.quadraticCurveTo(220, g.H, 120, g.H + 10);
        c.lineTo(-20, g.H + 10);
        c.closePath();
        c.fill();
        c.strokeStyle = PAL.cream;
        c.lineWidth = 7;
        c.beginPath();
        c.moveTo(-20, gy + 8);
        c.quadraticCurveTo(140, gy + 16, 270, gy - 30);
        c.stroke();
        c.strokeStyle = PAL.lagoon;
        c.lineWidth = 6;
        c.beginPath();
        c.moveTo(-20, gy + 34);
        c.quadraticCurveTo(140, gy + 40, 262, gy - 4);
        c.stroke();
        hibiscus(c, 200, gy + 22, 12, t * 0.2, PAL.cream);
        if (s.phase === 'wait' && sp < 1.5) {
          text(c, g.tr({ en: 'Red eyes = PULL!', fr: 'Yeux rouges = TIRE !' }), 200, Math.min(g.H - 80, gy + 80), { size: 20, color: PAL.cream, stroke: 'rgba(30,20,50,0.45)' });
        }
      },
      bot() {
        return s.phase === 'tell' && s.pt > 0.06 ? { press: [200, 400] } : null;
      },
    };
  },
};
