// Mute the burp (world 2, the video-call concert). The gang bobs along to a
// concert on a video call. The hero's cheeks puff up (the tell), then the
// BURP starts: tap MUTE (or anywhere) within the reaction window. Tap before
// the burp and everyone saw you mute for nothing; too slow and the whole call
// hears it.

import { scene, head, rrect, circle, ellipse, PAL, text, shadowed, vgrad, sky, sea, palm, sun, OUTFITS, hibiscus } from '../art.js';

/** Tuning (seconds at speed 1, divided by the speed). */
const TUNE = {
  calm: 0.35, // before the cheeks start puffing
  puffMin: 0.6, // cheeks puff for puffMin + random * puffRange
  puffRange: 1.4,
  react: 0.6, // time to mute once the burp starts...
  reactFloor: 0.28, // ...never below this, so top speed stays humanly possible
  feintSpeed: 1.4, // from this speed the hero swallows once mid-puff (a fake-out)
  feintTime: 0.16,
};

const NAMES = { panda: 'Panda', cous: 'Cous', mamar: 'Mamar', babar: 'Babar', victor: 'Victor', romain: 'Romain', eugenie: 'Eugénie', violaine: 'Violaine', aline: 'Aline', greg: 'Greg' };

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const easeOut = (k) => 1 - (1 - k) ** 3;

/** Microphone glyph centred on (x, y), s tall; slashed when muted. */
function mic(c, x, y, s, color, slashed = false) {
  c.save();
  c.translate(x, y);
  c.fillStyle = color;
  rrect(c, -s * 0.18, -s * 0.5, s * 0.36, s * 0.62, s * 0.18);
  c.fill();
  c.strokeStyle = color;
  c.lineWidth = s * 0.09;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(0, -s * 0.05, s * 0.3, 0.15, Math.PI - 0.15);
  c.stroke();
  c.beginPath();
  c.moveTo(0, s * 0.26);
  c.lineTo(0, s * 0.42);
  c.moveTo(-s * 0.16, s * 0.44);
  c.lineTo(s * 0.16, s * 0.44);
  c.stroke();
  if (slashed) {
    c.lineWidth = s * 0.11;
    c.beginPath();
    c.moveTo(-s * 0.38, -s * 0.48);
    c.lineTo(s * 0.38, s * 0.42);
    c.stroke();
  }
  c.restore();
}

export default {
  id: 'mute',
  world: 'w02',
  input: 'tap',
  base: 4,
  survive: false,
  verb: { en: 'MUTE THE BURP!', fr: 'COUPE LE MICRO !' },
  title: { en: "The video-call concert", fr: "Le concert en visio" },
  howto: { en: "Panda's about to burp on the call. Tap MUTE right when the burp starts, not before.", fr: "Panda va roter en pleine visio. Touche MUET pile quand le rot part, pas avant." },
  winLine: { en: "Nobody heard a thing!", fr: "Personne n'a rien entendu !" },
  rival: ["romain", "victor"],
  rivalLine: { en: "I was so sure I'd hear it…", fr: "J'étais sûr de l'entendre…" },
  loseLine: { en: "Hoho… that was the dog!", fr: "Hoho… c'était le chien !" },
  create(g) {
    const { W, H } = g;
    const sp = g.speed;
    const puffAt = TUNE.calm / sp;
    const puffLen = (TUNE.puffMin + g.random() * TUNE.puffRange) / sp;
    const burpAt = puffAt + puffLen;
    const react = Math.max(TUNE.reactFloor, TUNE.react / sp);
    const feintAt = sp >= TUNE.feintSpeed && puffLen > 0.55 / sp ? puffAt + puffLen * (0.35 + g.random() * 0.25) : -1;
    const feintLen = TUNE.feintTime / sp;

    // The call: one big tile for the hero, 4-6 friends below.
    const count = 4 + Math.floor(g.random() * 3);
    const friends = [];
    for (let i = 0; i < count; i++) friends.push(g.friend(friends));
    const big = { x: 16, y: 112, w: W - 32, h: H * 0.5 - 112 };
    const gridTop = big.y + big.h + 10;
    const gridBot = H * 0.775;
    const cols = count > 4 ? 3 : 2;
    const tw = (W - 32 - (cols - 1) * 8) / cols;
    const th = (gridBot - gridTop - 8) / 2;
    const tiles = friends.map((id, i) => ({
      id,
      x: 16 + (i % cols) * (tw + 8),
      y: gridTop + Math.floor(i / cols) * (th + 8),
      tint: PAL.creole[(i * 2 + 1) % PAL.creole.length],
      laugh: i % 2 === 0, // on a heard burp: half laugh, half are disgusted
      phase: g.random() * 6,
    }));
    const btnY = H * 0.865;
    const btnR = Math.min(40, H * 0.05);
    const faceX = W / 2;
    const faceH = big.h * 0.78;
    const faceY = big.y + big.h * 0.56;
    const s = { t: 0, phase: 'calm', burpT: 0, endT: 0, rings: [], muted: false, gulped: false };

    function puff() {
      if (s.phase === 'calm' || s.phase === 'false') return 0;
      if (s.phase === 'puff') {
        let k = easeOut(clamp((s.t - puffAt) / puffLen));
        if (feintAt > 0 && s.t > feintAt && s.t < feintAt + feintLen) k *= 0.45 + 0.55 * Math.abs(Math.cos(((s.t - feintAt) / feintLen) * Math.PI));
        return k;
      }
      return Math.max(0, 1 - s.burpT * 5);
    }

    function decide(kind) {
      s.phase = kind;
      s.endT = 0;
      if (kind === 'muted') {
        s.muted = true;
        g.sfx.click();
        g.sfx.good();
        g.fx.burst(faceX, btnY, { kind: 'spark', n: 16, colors: [PAL.mango, '#ffffff', PAL.hibiscus], speed: 240 });
        g.fx.text(faceX, big.y + 40, g.tr({ en: 'MUTED!', fr: 'MICRO COUPÉ !' }), { size: 36, color: PAL.mango });
        g.win();
      } else if (kind === 'false') {
        s.muted = true;
        g.sfx.click();
        g.sfx.bad();
        g.fx.shake(6);
        g.fx.text(faceX, big.y + 40, g.tr({ en: 'False alarm!', fr: 'Fausse alerte !' }), { size: 34, color: PAL.coral });
        const t0 = tiles[0];
        g.say(t0.x + tw / 2, t0.y + 14, g.tr({ en: 'Why did you mute?', fr: 'Pourquoi tu coupes ?' }), 1.6);
        g.lose();
      } else {
        g.sfx.splash();
        g.sfx.bad();
        g.fx.shake(16);
        g.fx.flash('rgba(190,240,140,0.45)', 0.25);
        g.fx.burst(faceX, faceY + faceH * 0.2, { kind: 'drop', n: 18, colors: ['#d8f0c0', '#b5df9a', '#ffffff'], speed: 320 });
        const t0 = tiles[Math.min(1, tiles.length - 1)];
        g.say(t0.x + tw / 2, t0.y + 14, g.tr({ en: 'Everybody heard that!', fr: 'Tout le monde a entendu !' }), 1.6);
        g.lose();
      }
    }

    function drawTileBg(c, x, y, w, h, tint) {
      c.save();
      rrect(c, x, y, w, h, 14);
      c.clip();
      c.fillStyle = vgrad(c, y, y + h, ['#343a55', '#22263a']);
      c.fillRect(x, y, w, h);
      c.globalAlpha = 0.28;
      c.fillStyle = vgrad(c, y, y + h, [tint, 'rgba(0,0,0,0)']);
      c.fillRect(x, y, w, h);
      c.globalAlpha = 1;
      // Soft room lights (bokeh).
      for (let i = 0; i < 3; i++) circle(c, x + w * (0.2 + i * 0.3), y + h * (0.25 + (i % 2) * 0.1), w * 0.09, 'rgba(255,240,210,0.08)');
      c.restore();
    }

    function nameTag(c, x, y, id, mutedTag) {
      const label = NAMES[id] || id;
      c.save();
      c.font = `600 13px 'Fredoka', system-ui, sans-serif`;
      const w = (c.measureText(label).width || label.length * 7) + 34;
      rrect(c, x, y - 11, w, 22, 11);
      c.fillStyle = 'rgba(15,16,28,0.6)';
      c.fill();
      mic(c, x + 13, y, 14, mutedTag ? PAL.coral : '#ffffff', mutedTag);
      c.restore();
      text(c, label, x + 24, y + 1, { size: 13, color: '#ffffff', align: 'left', shadow: false, weight: 600 });
    }

    function drawHeroTile(c) {
      const speaking = s.phase === 'burp' || s.phase === 'heard';
      c.save();
      rrect(c, big.x, big.y, big.w, big.h, 18);
      c.clip();
      // The hero's living room in Martinique: a window on the lagoon.
      sky(c, W, big.y + big.h, ['#ffd9b0', '#f6c18f']);
      const wx = big.x + 18;
      const wy = big.y + 16;
      const ww = big.w * 0.42;
      const wh = big.h * 0.5;
      rrect(c, wx, wy, ww, wh, 10);
      c.save();
      c.clip();
      sky(c, W, wy + wh * 0.6, ['#5ab8e8', '#ffd59e']);
      sun(c, wx + ww * 0.7, wy + wh * 0.3, 10);
      sea(c, W, wy + wh * 0.6, wh * 0.4, s.t);
      palm(c, wx + 14, wy + wh + 6, wh * 0.95, s.t, 0.15);
      c.restore();
      hibiscus(c, big.x + big.w - 40, big.y + 40, 16, s.t * 0.3);
      hibiscus(c, big.x + big.w - 62, big.y + 62, 11, 1 + s.t * 0.3, PAL.mango);
      // The hero, cheeks puffing.
      const k = puff();
      const burping = s.phase === 'burp' || s.phase === 'heard' || (s.phase === 'muted' && s.burpT < 1.2);
      const open = burping ? clamp(s.burpT * 8) * (s.phase === 'heard' ? 1 : Math.max(0.2, 1 - s.endT * 1.2)) : 0;
      const jitter = k > 0.6 ? Math.sin(s.t * 70) * (k - 0.6) * 5 : 0;
      const bob = s.phase === 'calm' ? Math.sin(s.t * 6) * 0.06 : 0;
      const rot = burping ? -0.14 * open : bob;
      const hx = faceX + jitter;
      const hw = faceH * (360 / 440);
      c.save();
      c.translate(hx, faceY);
      c.scale(1 + k * 0.06, 1 - k * 0.02);
      head(c, g.hero, 0, 0, faceH, { rot, hat: g.hat });
      // Puffed cheeks bulging past the face, flushed red.
      if (k > 0.02) {
        const skin = OUTFITS[g.hero]?.skin || '#f0c3a3';
        for (const side of [-1, 1]) {
          const cxk = side * hw * (0.26 + k * 0.05) - hw * 0.02;
          const cyk = faceH * 0.12;
          const rr = hw * (0.05 + k * 0.12);
          ellipse(c, cxk, cyk, rr, rr * 0.95, skin);
          const blush = c.createRadialGradient(cxk, cyk, 0, cxk, cyk, rr);
          blush.addColorStop(0, `rgba(240,70,80,${0.55 * k})`);
          blush.addColorStop(1, 'rgba(240,70,80,0)');
          ellipse(c, cxk, cyk, rr, rr * 0.95, blush);
          circle(c, cxk - side * rr * 0.25, cyk - rr * 0.35, rr * 0.18, 'rgba(255,255,255,0.45)');
        }
        // Lips pressed shut.
        ellipse(c, -hw * 0.03, faceH * 0.24, hw * 0.06 * (1 - k * 0.4), hw * 0.025, '#b4505a');
        if (k > 0.7) for (const side of [-1, 1]) ellipse(c, side * hw * 0.44, -faceH * 0.18, 3, 6, 'rgba(120,200,255,0.85)');
      }
      if (open > 0) {
        ellipse(c, -hw * 0.03, faceH * 0.24, hw * 0.13 * open, hw * 0.11 * open, '#3a1420');
        ellipse(c, -hw * 0.03, faceH * 0.28, hw * 0.07 * open, hw * 0.04 * open, '#e2606e');
      }
      c.restore();
      // Burp shockwaves: green and loud, or grey and silent when muted.
      for (const ring of s.rings) {
        const a = clamp(1 - ring.age / 0.8);
        c.strokeStyle = s.muted ? `rgba(200,205,220,${a * 0.5})` : `rgba(180,235,120,${a * 0.8})`;
        c.lineWidth = 6 * a + 1;
        c.beginPath();
        c.arc(faceX, faceY + faceH * 0.24, 20 + ring.age * 420, 0, Math.PI * 2);
        c.stroke();
      }
      c.restore();
      if (open > 0) {
        const size = 30 + s.burpT * 60;
        const word = g.tr({ en: 'BUUURP', fr: 'BRROOOAP' });
        const col = s.muted ? 'rgba(220,225,235,0.75)' : '#c6f27a';
        text(c, word, faceX, big.y + big.h - 34, { size: Math.min(size, 64), color: col, stroke: s.muted ? null : '#3f6b1d' });
        if (s.muted) {
          c.strokeStyle = PAL.coral;
          c.lineWidth = 6;
          c.lineCap = 'round';
          c.beginPath();
          c.moveTo(faceX - 110, big.y + big.h - 34);
          c.lineTo(faceX + 110, big.y + big.h - 34);
          c.stroke();
        }
      }
      // Active-speaker border: lights up green the instant there is sound.
      c.save();
      c.lineWidth = speaking ? 6 : 2;
      c.strokeStyle = speaking ? PAL.leaf : 'rgba(255,255,255,0.12)';
      if (speaking) {
        c.shadowColor = PAL.leaf;
        c.shadowBlur = 18;
      }
      rrect(c, big.x, big.y, big.w, big.h, 18);
      c.stroke();
      c.restore();
      nameTag(c, big.x + 12, big.y + big.h - 20, g.hero, s.muted);
      // Voice level bars.
      const lvl = speaking ? 1 : s.phase === 'puff' ? 0.15 + puff() * 0.2 : 0.08;
      for (let i = 0; i < 4; i++) {
        const h = 6 + lvl * 26 * (0.5 + 0.5 * Math.abs(Math.sin(s.t * 18 + i * 1.7)));
        rrect(c, big.x + big.w - 52 + i * 9, big.y + big.h - 14 - h, 6, h, 3);
        c.fillStyle = s.muted ? 'rgba(255,255,255,0.25)' : speaking ? PAL.leaf : 'rgba(255,255,255,0.7)';
        c.fill();
      }
    }

    function drawFriendTile(c, tile, i) {
      const { x, y } = tile;
      drawTileBg(c, x, y, tw, th, tile.tint);
      const heard = s.phase === 'heard';
      const confused = s.phase === 'false';
      const react = heard ? clamp(s.endT * 4) : 0;
      const beat = Math.sin(s.t * 6.5 + tile.phase);
      let rot = beat * 0.12;
      let dy = Math.abs(beat) * 4;
      let scale = 1;
      if (heard && tile.laugh) {
        rot = Math.sin(s.t * 24 + i) * 0.18;
        dy = Math.abs(Math.sin(s.t * 20 + i)) * 10;
      } else if (heard) {
        rot = 0.35 * react * (i % 3 ? 1 : -1);
        scale = 1 - 0.18 * react;
        dy = -6 * react;
      } else if (confused) {
        rot = 0.1 * Math.sin(i * 2);
        dy = 0;
      }
      const hh = th * 0.78 * scale;
      c.save();
      rrect(c, x, y, tw, th, 14);
      c.clip();
      head(c, tile.id, x + tw / 2, y + th * 0.56 - dy, hh, { rot });
      if (heard && !tile.laugh) {
        c.fillStyle = `rgba(150,220,90,${0.28 * react})`;
        c.fillRect(x, y, tw, th);
      }
      c.restore();
      // Little reactions.
      if (heard) {
        const word = tile.laugh ? g.tr({ en: 'CHEH!', fr: 'CHEH !' }) : g.tr({ en: 'Yuck!', fr: 'Beurk !' });
        text(c, word, x + tw / 2, y + 18 + Math.sin(s.t * 12 + i) * 3, { size: 18, color: tile.laugh ? PAL.mango : '#b8f27a', stroke: 'rgba(20,20,30,0.6)' });
      } else if (confused) {
        text(c, '?', x + tw - 18, y + 22, { size: 24, color: PAL.cream });
      } else {
        const ny = y + th * 0.3 - ((s.t * 30 + i * 13) % (th * 0.3));
        text(c, i % 2 ? '♪' : '♫', x + tw - 16, ny, { size: 16, color: 'rgba(255,255,255,0.55)', shadow: false });
      }
      c.save();
      c.lineWidth = 2;
      c.strokeStyle = 'rgba(255,255,255,0.1)';
      rrect(c, x, y, tw, th, 14);
      c.stroke();
      c.restore();
      nameTag(c, x + 8, y + th - 16, tile.id, false);
    }

    function drawButtons(c) {
      const burping = s.phase === 'burp';
      // Side buttons: camera and hang-up, for the video-call look.
      for (const [bx, col] of [[faceX - 112, 'rgba(255,255,255,0.14)'], [faceX + 112, PAL.coral]]) {
        circle(c, bx, btnY, btnR * 0.72, col);
      }
      c.fillStyle = '#ffffff';
      rrect(c, faceX - 124, btnY - 8, 18, 16, 4);
      c.fill();
      c.beginPath();
      c.moveTo(faceX - 106, btnY);
      c.lineTo(faceX - 98, btnY - 7);
      c.lineTo(faceX - 98, btnY + 7);
      c.fill();
      c.save();
      c.translate(faceX + 112, btnY);
      c.rotate(2.3);
      c.strokeStyle = '#ffffff';
      c.lineWidth = 6;
      c.lineCap = 'round';
      c.beginPath();
      c.arc(0, 4, 11, Math.PI * 1.15, Math.PI * 1.85);
      c.stroke();
      c.restore();
      // The big MUTE button.
      const pressedK = s.muted ? clamp(1 - s.endT * 6) : 0;
      const pulse = burping ? 0.5 + 0.5 * Math.sin(s.t * 30) : 0;
      shadowed(c, () => {
        circle(c, faceX, btnY, btnR * (1 - pressedK * 0.12), s.muted ? PAL.hibiscus : '#f4f5fa');
      }, 16 + pulse * 12, 6, burping ? 'rgba(180,235,120,0.8)' : 'rgba(0,0,0,0.4)');
      const shine = c.createRadialGradient(faceX - btnR * 0.3, btnY - btnR * 0.4, 1, faceX, btnY, btnR);
      shine.addColorStop(0, 'rgba(255,255,255,0.5)');
      shine.addColorStop(1, 'rgba(255,255,255,0)');
      circle(c, faceX, btnY, btnR * (1 - pressedK * 0.12), shine);
      mic(c, faceX, btnY - 2, btnR * 0.9, s.muted ? '#ffffff' : PAL.ink, s.muted);
      text(c, g.tr({ en: 'MUTE', fr: 'MICRO' }), faceX, btnY + btnR + 4, { size: 13, color: 'rgba(255,255,255,0.75)', shadow: false });
    }

    return {
      update(dt) {
        s.t += dt;
        s.endT += dt;
        if (s.phase === 'burp' || s.phase === 'heard' || (s.phase === 'muted' && s.burpT > 0)) {
          s.burpT += dt;
          s.ringT = (s.ringT || 0) - dt;
          if (s.ringT <= 0 && s.burpT < 1.4) {
            s.ringT = 0.12;
            s.rings.push({ age: 0 });
          }
        }
        for (const ring of s.rings) ring.age += dt;
        while (s.rings.length && s.rings[0].age > 0.8) s.rings.shift();
        if (g.done) {
          if (s.phase === 'muted' && !s.gulped && s.endT > 0.5) {
            s.gulped = true;
            g.sfx.hoho();
            g.say(faceX + 60, big.y + 30, g.tr({ en: 'Hoho… nobody heard!', fr: 'Hoho… personne a rien entendu !' }), 1.4);
          }
          return;
        }
        if (s.phase === 'calm' && s.t >= puffAt) {
          s.phase = 'puff';
          g.sfx.pop();
        }
        if (s.phase === 'puff' && feintAt > 0 && !s.feinted && s.t >= feintAt) {
          s.feinted = true;
          g.fx.text(faceX + 90, faceY - 40, g.tr({ en: 'gulp', fr: 'glup' }), { size: 20, color: PAL.cream, life: 0.6 });
        }
        if (s.phase === 'puff' && s.t >= burpAt) {
          s.phase = 'burp';
          s.burpT = 0;
          g.sfx.hit();
        }
        if (s.phase === 'burp' && s.burpT >= react) decide('heard');
      },
      press() {
        if (s.phase === 'burp') decide('muted');
        else if (s.phase === 'calm' || s.phase === 'puff') decide('false');
      },
      draw(c) {
        scene.call(c, W, H, s.t);
        // Call header.
        rrect(c, 16, 84, 74, 22, 11);
        c.fillStyle = PAL.hibiscus;
        c.fill();
        circle(c, 30, 95, 4, '#ffffff');
        text(c, g.tr({ en: 'LIVE', fr: 'DIRECT' }), 60, 96, { size: 13, color: '#ffffff', shadow: false });
        text(c, g.tr({ en: '♪ Zouk concert', fr: '♪ Concert zouk' }), W - 16, 96, { size: 14, color: 'rgba(255,255,255,0.7)', align: 'right', shadow: false, weight: 600 });
        drawHeroTile(c);
        tiles.forEach((tile, i) => drawFriendTile(c, tile, i));
        drawButtons(c);
      },
      bot() {
        return s.phase === 'burp' && s.burpT > 0.05 ? { press: [faceX, btnY] } : null;
      },
    };
  },
};
