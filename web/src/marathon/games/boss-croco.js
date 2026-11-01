// BOSS, world 11: Georges the Lézarde attacks from the mangrove water in 3
// lanes. Ripples + eyes surfacing (red when he is about to go) tell the lane;
// SWIPE left/right to dodge each lunge. When he misses, his snout lies on the
// dock: TAP it to bonk him. 3 HP; one bite and it's over. At his last HP he
// lunges twice in a row.
//
// Also exports bossBanner() and bossBar(), the shared boss presentation
// (used by boss-babar.js and boss-romain.js).

import { scene, person, circle, ellipse, rrect, PAL, text, vgrad, shadowed, madrasBand } from '../art.js';

const LANES = [85, 200, 315];
const ease = (k) => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
const WATER = ['#bfe9e0', '#ffffff', '#7cc8a8'];

/** Big "BOSS" banner that slides in, holds and slides out over `dur` seconds. */
export function bossBanner(c, W, y, t, dur, title, sub, accent = PAL.mango) {
  if (t > dur) return;
  const inK = ease(t / 0.25);
  const outK = ease((t - (dur - 0.28)) / 0.28);
  const x = (1 - inK) * -W * 1.1 + outK * W * 1.1;
  c.save();
  c.translate(x, y);
  c.rotate(-0.045);
  shadowed(c, () => {
    rrect(c, -30, -52, W + 60, 104, 6);
    c.fillStyle = vgrad(c, -52, 52, ['rgba(26,18,56,0.95)', 'rgba(70,24,96,0.95)']);
    c.fill();
  }, 22, 8);
  madrasBand(c, -30, -60, W + 60, 10, 0.3);
  madrasBand(c, -30, 50, W + 60, 10, 0.3);
  const pulse = 1 + Math.sin(t * 14) * 0.04;
  c.save();
  c.translate(W / 2, -27);
  c.scale(pulse, pulse);
  text(c, '⚡ BOSS ⚡', 0, 0, { size: 18, color: accent, weight: 800 });
  c.restore();
  text(c, title, W / 2, 4, { size: 34, color: PAL.cream, stroke: accent, max: W - 30 });
  text(c, sub, W / 2, 34, { size: 15, color: '#ffd9e6', max: W - 40 });
  c.restore();
}

/** Boss gauge (HP, breath, distance...) at the top of the stage. */
export function bossBar(c, x, y, w, frac, { label = '', color = PAL.hibiscus, segments = 0, flash = 0 } = {}) {
  const h = 20;
  const f = Math.max(0, Math.min(1, frac));
  text(c, label, x - 8, y + h / 2 + 1, { size: 15, color: PAL.cream, align: 'right', stroke: 'rgba(30,20,50,0.6)' });
  shadowed(c, () => {
    rrect(c, x, y, w, h, h / 2);
    c.fillStyle = 'rgba(26,18,56,0.78)';
    c.fill();
  }, 10, 3);
  if (f > 0) {
    const gr = c.createLinearGradient(x, 0, x + w, 0);
    gr.addColorStop(0, color);
    gr.addColorStop(1, '#fff3c4');
    rrect(c, x + 3, y + 3, Math.max(8, (w - 6) * f), h - 6, (h - 6) / 2);
    c.fillStyle = flash > 0 ? '#ffffff' : gr;
    c.fill();
    rrect(c, x + 6, y + 4, Math.max(4, (w - 12) * f), 4, 2);
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.fill();
  }
  c.fillStyle = 'rgba(26,18,56,0.85)';
  for (let i = 1; i < segments; i++) c.fillRect(x + (w * i) / segments - 1.5, y + 2, 3, h - 4);
}

/** A rounded tooth from (x, y); len > 0 points down. */
function tooth(c, x, y, len, w) {
  c.fillStyle = '#fffaf0';
  c.beginPath();
  c.moveTo(x - w, y);
  c.quadraticCurveTo(x - w * 0.3, y + len * 0.7, x, y + len);
  c.quadraticCurveTo(x + w * 0.3, y + len * 0.7, x + w, y);
  c.closePath();
  c.fill();
}

function mix(a, b, k) {
  const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16));
  const pb = b.match(/\w\w/g).map((h) => parseInt(h, 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(',')})`;
}

function eyes(c, y, s, red, ko, t) {
  for (const side of [-1, 1]) {
    const ex = side * 40;
    if (red > 0 && !ko) {
      const gl = c.createRadialGradient(ex, y, 3, ex, y, 56);
      gl.addColorStop(0, `rgba(255,40,40,${0.7 * red})`);
      gl.addColorStop(1, 'rgba(255,40,40,0)');
      c.fillStyle = gl;
      c.fillRect(ex - 60, y - 60, 120, 120);
    }
    circle(c, ex, y + 4, 29, '#3f9a5a');
    circle(c, ex, y, 26, '#5bbb70');
    circle(c, ex, y, 18, '#fff8e6');
    if (ko) {
      c.strokeStyle = PAL.ink;
      c.lineWidth = 4;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(ex - 8, y - 8);
      c.lineTo(ex + 8, y + 8);
      c.moveTo(ex + 8, y - 8);
      c.lineTo(ex - 8, y + 8);
      c.stroke();
      continue;
    }
    circle(c, ex, y + 1, 13, mix('f6d84a', 'ff2b2b', red));
    ellipse(c, ex, y + 1, 3.6 - red * 1.6, 11, PAL.ink);
    circle(c, ex - 5, y - 6, 4, '#ffffff');
    // Angry lids: inner corners lower.
    c.fillStyle = '#4aa463';
    c.beginPath();
    c.moveTo(side * 12, y - 28);
    c.lineTo(side * 68, y - 28);
    c.lineTo(side * 64, y - 15);
    c.lineTo(side * 16, y - 4 + Math.sin(t * 2) * 1.5);
    c.closePath();
    c.fill();
  }
}

/**
 * Georges seen from the dock, snout pointing at the camera. (x, y) is the tip
 * of the lower jaw; the head goes up the screen. open 0..1.
 */
function crocoFront(c, x, y, s, open, t, { red = 0, flash = 0, ko = false, alpha = 1, rot = 0 } = {}) {
  const gap = open * 64;
  const yt = -8 - gap;
  c.save();
  c.globalAlpha *= alpha;
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  // Neck trailing back into the water.
  c.fillStyle = vgrad(c, -340, -150, ['rgba(47,122,71,0)', '#2f7a47']);
  rrect(c, -58, -340, 116, 210, 50);
  c.fill();
  // Lower jaw.
  c.fillStyle = vgrad(c, -120, 6, ['#3f9a5a', '#8cc46f', '#d6e8a2']);
  c.beginPath();
  c.moveTo(-64, -130);
  c.lineTo(-64, -34);
  c.quadraticCurveTo(-62, 6, -26, 8);
  c.lineTo(26, 8);
  c.quadraticCurveTo(62, 6, 64, -34);
  c.lineTo(64, -130);
  c.closePath();
  c.fill();
  if (gap > 2) {
    c.fillStyle = vgrad(c, -130, -6, ['#4a0f26', '#b83a5c', '#ff8fa3']);
    rrect(c, -52, -130, 104, 124, 32);
    c.fill();
    ellipse(c, 0, -42, 32, 22, '#ff6f8a');
    ellipse(c, -8, -48, 14, 5, 'rgba(255,255,255,0.3)');
    for (const tx of [-36, -18, 0, 18, 36]) tooth(c, tx, -6, -14, 5.5);
    for (const side of [-1, 1]) for (const ty of [-30, -56, -82]) tooth(c, side * 52, ty, -12, 5);
  }
  // Upper jaw, lifting (foreshortened) as he opens.
  c.fillStyle = vgrad(c, -214, yt, ['#2f7a47', '#4aa463', '#74cf82']);
  c.beginPath();
  c.moveTo(-62, -214);
  c.lineTo(-62, yt - 40);
  c.quadraticCurveTo(-60, yt, -24, yt);
  c.lineTo(24, yt);
  c.quadraticCurveTo(60, yt, 62, yt - 40);
  c.lineTo(62, -214);
  c.closePath();
  c.fill();
  for (const tx of [-40, -24, -8, 8, 24, 40]) tooth(c, tx, yt - 3, Math.abs(tx) === 40 ? 20 : 13, 5.5);
  for (const side of [-1, 1]) for (const ty of [yt - 22, yt - 46]) tooth(c, side * 60, ty, 11, 5);
  ellipse(c, 0, yt - 26, 28, 15, '#5bbb70');
  ellipse(c, -12, yt - 27, 6, 4, '#1f4d30');
  ellipse(c, 12, yt - 27, 6, 4, '#1f4d30');
  for (let row = 0; row < 4; row++) {
    const ry = yt - 64 - row * ((150 + yt) / 4.2);
    if (ry < -200) break;
    ellipse(c, -24, ry, 9, 6, 'rgba(40,110,60,0.55)');
    ellipse(c, 24, ry, 9, 6, 'rgba(40,110,60,0.55)');
  }
  ellipse(c, -30, (yt - 214) / 2, 9, 60, 'rgba(255,255,255,0.16)');
  eyes(c, -214, s, red, ko, t);
  if (ko) {
    c.fillStyle = '#ff6f8a';
    rrect(c, 8, yt - 6, 22, 40, 10);
    c.fill();
  }
  if (flash > 0) {
    c.globalAlpha *= Math.min(1, flash);
    ellipse(c, 0, -110, 76, 140, '#ffffff');
  }
  c.restore();
}

/** Only the eyes and nostrils above the water: the lurking tell. */
function lurk(c, x, y, s, rise, red, t) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.globalAlpha *= Math.min(1, rise * 1.4);
  const up = (1 - rise) * 22;
  ellipse(c, 0, 92 + up, 28, 12, '#4aa463');
  ellipse(c, -10, 88 + up, 5, 3, '#1f4d30');
  ellipse(c, 10, 88 + up, 5, 3, '#1f4d30');
  c.translate(0, up);
  eyes(c, 0, s, red, false, t);
  c.restore();
  // Water lapping over the lower half.
  ellipse(c, x, y + 26 * s, 84 * s, 14 * s, 'rgba(46,120,100,0.9)');
}

function ripples(c, x, y, t, size = 1, alpha = 1) {
  c.lineWidth = 2.5;
  for (let i = 0; i < 3; i++) {
    const k = (t * 1.5 + i / 3) % 1;
    c.strokeStyle = `rgba(255,255,255,${(1 - k) * 0.6 * alpha})`;
    c.beginPath();
    c.ellipse(x, y, (30 + k * 70) * size, (9 + k * 20) * size, 0, 0, Math.PI * 2);
    c.stroke();
  }
}

export default {
  id: 'boss-croco',
  world: 'w11',
  input: 'swipe',
  base: 10,
  survive: false,
  boss: true,
  verb: { en: 'DODGE & BONK!', fr: 'ESQUIVE ET TAPE !' },
  title: { en: "BOSS: Georges the Lézarde", fr: "BOSS : Georges la Lézarde" },
  howto: { en: "Swipe to dodge his lunges, then tap his snout. Three bonks and he's done.", fr: "Glisse pour esquiver ses attaques, puis touche son museau. Trois coups et c'est fini." },
  winLine: { en: "Georges is KO!", fr: "Georges est KO !" },
  rival: ["victor", "greg"],
  rivalLine: { en: "My Georges… knocked out…", fr: "Mon Georges… KO…" },
  loseLine: { en: "Hoho, he bit me!", fr: "Hoho, il m'a mordu !" },
  create(g) {
    const K = 1 / Math.sqrt(g.speed);
    const T = { intro: 1.0 * K, lunge: 0.2 * K, stun: 0.8 * K, hurt: 0.4 * K, gap: 0.3 * K, banner: 1.3 * K };
    const heroY = Math.min(g.H * 0.88, g.H - 70);
    const lurkY = g.H * 0.56;
    const dockY = g.H * 0.76;
    const biteY = heroY - 70;
    const friend = g.friend();
    const s = { t: 0, lane: 1, x: LANES[1], moving: 0, hp: 3, flash: 0, started: false, bitten: false };
    const cr = { phase: 'hidden', t: 0, wait: T.intro, lane: 1, combo: 0, tellT: 0.7 * K, retreatT: 0.35 * K, from: biteY };

    function setPhase(p) {
      cr.phase = p;
      cr.t = 0;
    }

    function bite() {
      s.bitten = true;
      setPhase('bite');
      g.sfx.hit();
      g.sfx.splash();
      g.fx.shake(22);
      g.fx.flash('rgba(255,70,70,0.4)', 0.22);
      g.fx.burst(s.x, biteY - 20, { kind: 'spark', n: 40, colors: ['#ffffff', PAL.mango, '#ff6b6b'], speed: 420 });
      g.fx.burst(s.x, biteY, { kind: 'drop', n: 26, colors: WATER, speed: 300 });
      g.fx.text(s.x, biteY - 190, 'CHOMP!', { size: 54, color: '#ff5a5a' });
      g.say(s.x, heroY - 170, g.tr({ en: 'OUCH! Georges!!', fr: 'AÏE ! Georges !!' }));
      g.lose();
    }

    function impact() {
      if (cr.lane === s.lane) {
        bite();
        return;
      }
      const lx = LANES[cr.lane];
      g.sfx.hit();
      g.fx.shake(9);
      g.fx.burst(lx, biteY, { kind: 'spark', n: 16, colors: ['#c9a27a', '#fff3c4'], speed: 240 });
      g.fx.text(lx, biteY - 210, g.tr({ en: 'CLACK!', fr: 'CLAC !' }), { size: 34, color: PAL.cream });
      if (cr.combo === 2) {
        cr.combo = 1;
        cr.retreatT = 0.22 * K;
        cr.from = biteY;
        setPhase('retreat');
      } else {
        cr.combo = 0;
        setPhase('stun');
      }
    }

    return {
      update(dt) {
        s.t += dt;
        cr.t += dt;
        s.x += (LANES[s.lane] - s.x) * Math.min(1, dt * 18);
        s.moving = Math.max(0, s.moving - dt);
        s.flash = Math.max(0, s.flash - dt * 4);
        if (!s.started) {
          s.started = true;
          g.sfx.boss?.();
        }
        if (g.done) return;
        if (cr.phase === 'hidden' && cr.t >= cr.wait) {
          if (s.hp === 1 && cr.combo === 0) cr.combo = 2;
          // He goes for the hero's lane most of the time.
          cr.lane = cr.combo === 1 || g.random() < 0.7 ? s.lane : (s.lane + 1 + Math.floor(g.random() * 2)) % 3;
          cr.tellT = (cr.combo === 1 ? 0.45 : 0.7 * (1 - 0.12 * (3 - s.hp))) * K;
          setPhase('tell');
          g.sfx.tick(true);
          g.fx.burst(LANES[cr.lane], lurkY + 20, { kind: 'drop', n: 8, colors: WATER, speed: 120 });
        } else if (cr.phase === 'tell' && cr.t >= cr.tellT) {
          setPhase('lunge');
          g.sfx.whoosh();
          g.sfx.splash();
          g.fx.burst(LANES[cr.lane], lurkY + 40, { kind: 'drop', n: 30, colors: WATER, speed: 360 });
        } else if (cr.phase === 'lunge' && cr.t >= T.lunge) {
          impact();
        } else if (cr.phase === 'stun' && cr.t >= T.stun) {
          cr.retreatT = 0.35 * K;
          cr.from = biteY;
          setPhase('retreat');
          g.say(LANES[cr.lane], biteY - 220, g.tr({ en: 'Grrr…', fr: 'Grrr…' }), 0.8);
        } else if (cr.phase === 'hurt' && cr.t >= T.hurt) {
          cr.retreatT = 0.35 * K;
          cr.from = biteY - 30;
          setPhase('retreat');
        } else if (cr.phase === 'retreat' && cr.t >= cr.retreatT) {
          cr.wait = cr.combo === 1 ? 0.04 * K : T.gap;
          setPhase('hidden');
          g.fx.burst(LANES[cr.lane], lurkY + 30, { kind: 'drop', n: 12, colors: WATER, speed: 160 });
        }
      },
      swipe(dir) {
        if (dir === 'left' && s.lane > 0) s.lane--;
        else if (dir === 'right' && s.lane < 2) s.lane++;
        else return;
        s.moving = 0.25;
        g.sfx.tap();
      },
      press(x, y) {
        if (cr.phase !== 'stun') return;
        const lx = LANES[cr.lane];
        if (Math.abs(x - lx) > 95 || y < biteY - 240 || y > biteY + 60) return;
        s.hp--;
        s.flash = 1;
        g.sfx.hit();
        g.sfx.pop();
        g.fx.shake(16);
        g.fx.flash('rgba(255,255,255,0.35)', 0.1);
        g.fx.burst(lx, biteY - 50, { kind: 'spark', n: 46, colors: [PAL.mango, '#fff3c4', '#ffffff'], speed: 460 });
        g.fx.text(lx, biteY - 150, 'BONK!', { size: 52, color: PAL.mango });
        if (s.hp <= 0) {
          setPhase('dead');
          g.sfx.good();
          g.sfx.hoho();
          g.fx.burst(200, g.H * 0.5, { kind: 'confetti', n: 80, speed: 520 });
          g.fx.burst(lx, biteY - 80, { kind: 'petal', n: 24, speed: 360 });
          g.fx.text(200, g.H * 0.36, g.tr({ en: 'GEORGES IS DOWN!', fr: 'GEORGES EST K.O. !' }), { size: 36, color: PAL.mango, life: 1.6 });
          g.say(s.x, heroY - 170, g.tr({ en: 'Hoho! Not today, Georges!', fr: 'Hoho ! Pas aujourd\'hui, Georges !' }), 1.6);
          g.win();
        } else {
          setPhase('hurt');
        }
      },
      draw(c) {
        const t = s.t;
        scene.mangrove(c, g.W, g.H, t);
        person(c, friend, 40, g.H * 0.5 + 4, 92, g.done ? (g.won ? 'dance' : 'sad') : cr.phase === 'stun' ? 'cheer' : 'idle', t + 1.7, {});
        // A dark shape drifting under the water while he hides.
        if (cr.phase === 'hidden' && !g.done) ellipse(c, 200 + Math.sin(t * 1.3) * 120, lurkY + 50, 70, 16, 'rgba(10,40,30,0.22)');
        const lx = LANES[cr.lane];
        if (cr.phase === 'tell') {
          const rise = ease(cr.t / (0.25 * K));
          const red = cr.t > cr.tellT * 0.5 ? 0.8 + 0.2 * Math.sin(t * 30) : 0;
          ripples(c, lx, lurkY + 30, t, 1.1);
          lurk(c, lx + (red ? Math.sin(t * 70) * 2 : 0), lurkY, 0.62, rise, red, t);
          // Wake chevrons pointing at the dock.
          c.strokeStyle = `rgba(255,255,255,${0.35 + 0.3 * rise})`;
          c.lineWidth = 4;
          c.lineCap = 'round';
          for (let i = 0; i < 3; i++) {
            const cy = lurkY + 110 + ((t * 120 + i * 30) % 90);
            c.beginPath();
            c.moveTo(lx - 22, cy - 10);
            c.lineTo(lx, cy);
            c.lineTo(lx + 22, cy - 10);
            c.stroke();
          }
        }
        // Wooden dock.
        c.fillStyle = vgrad(c, dockY, g.H, ['#c99a62', '#a87a48']);
        c.fillRect(0, dockY, g.W, g.H - dockY);
        c.fillStyle = 'rgba(80,50,25,0.35)';
        for (let y = dockY + 26; y < g.H; y += 30) c.fillRect(0, y, g.W, 3);
        c.fillStyle = '#8a5f35';
        c.fillRect(0, dockY - 6, g.W, 10);
        for (const px of [20, 140, 260, 380]) {
          rrect(c, px - 8, dockY - 22, 16, 30, 6);
          c.fillStyle = '#7a5230';
          c.fill();
        }
        for (const x of LANES) ellipse(c, x, heroY + 4, 44, 11, 'rgba(255,255,255,0.15)');
        if (cr.phase === 'tell' || cr.phase === 'lunge') {
          const a = 0.35 + 0.3 * Math.sin(t * 16);
          ellipse(c, lx, heroY + 4, 50, 14, `rgba(255,70,70,${a})`);
        }
        // Georges out of the water.
        let pose = null;
        if (cr.phase === 'lunge') {
          const p = ease(cr.t / T.lunge);
          pose = { y: lurkY + 60 + (biteY - lurkY - 60) * p, s: 0.6 + 0.25 * p, open: 0.5 + 0.5 * p, red: 1 };
          ellipse(c, lx, lurkY + 40, 70, 16, 'rgba(255,255,255,0.45)');
        } else if (cr.phase === 'stun') {
          pose = { y: biteY, s: 0.85, open: 0.12 + 0.05 * Math.sin(t * 6), red: 0 };
        } else if (cr.phase === 'hurt') {
          pose = { y: biteY - ease(cr.t / T.hurt) * 30, s: 0.85, open: 0.35, red: 0, flash: 1 - cr.t / T.hurt };
        } else if (cr.phase === 'retreat') {
          const p = ease(cr.t / cr.retreatT);
          pose = { y: cr.from + (lurkY + 60 - cr.from) * p, s: 0.85 - 0.25 * p, open: 0.1, red: 0, alpha: 1 - p * 0.85 };
        } else if (cr.phase === 'bite') {
          pose = { y: biteY - 6, s: 0.88, open: Math.max(0, 0.6 - cr.t * 8), red: 1, rot: Math.sin(t * 26) * 0.06 };
        } else if (cr.phase === 'dead') {
          pose = { y: biteY - Math.min(1, cr.t * 2) * 40, s: 0.85, open: 0.25, red: 0, ko: true, rot: Math.sin(t * 3) * 0.12 };
        }
        const drawCroco = () => {
          if (!pose) return;
          crocoFront(c, lx, pose.y, pose.s, pose.open, t, { red: pose.red, flash: pose.flash || 0, ko: pose.ko, alpha: pose.alpha ?? 1, rot: pose.rot || 0 });
        };
        const drawHero = () => {
          const hp = s.bitten ? 'sad' : g.done && g.won ? 'cheer' : s.moving > 0 ? 'run' : cr.phase === 'stun' ? 'point' : 'idle';
          person(c, g.hero, s.x, heroY, 150, hp, t, { hat: g.hat, flip: cr.phase === 'stun' && lx < s.x, squash: s.bitten ? 0.9 : 1 });
        };
        if (s.bitten) {
          drawHero();
          drawCroco();
        } else {
          drawCroco();
          drawHero();
        }
        if (cr.phase === 'stun' && !g.done) {
          const r = 54 + Math.sin(t * 14) * 6;
          c.strokeStyle = PAL.mango;
          c.lineWidth = 5;
          c.beginPath();
          c.arc(lx, biteY - 60, r, 0, Math.PI * 2);
          c.stroke();
          text(c, g.tr({ en: 'TAP!', fr: 'TAPE !' }), lx, biteY - 60, { size: 26, color: PAL.cream, stroke: 'rgba(30,20,50,0.6)' });
        }
        if (cr.phase === 'hurt' || cr.phase === 'dead') {
          for (let i = 0; i < 5; i++) {
            const a = t * 5 + (i * Math.PI * 2) / 5;
            text(c, '★', lx + Math.cos(a) * 60, (pose ? pose.y : biteY) - 190 + Math.sin(a) * 16, { size: 20, color: PAL.mango, shadow: false });
          }
        }
        bossBar(c, 120, 88, 262, s.hp / 3, { label: 'GEORGES', color: '#3fc46a', segments: 3, flash: s.flash });
        bossBanner(c, g.W, g.H * 0.24, t, T.banner, g.tr({ en: 'Georges the Lézarde', fr: 'Georges la Lézarde' }), g.tr({ en: 'King of the mangrove', fr: 'Roi de la mangrove' }), PAL.leaf);
      },
      bot() {
        if ((cr.phase === 'tell' && cr.t > 0.12 * K) || cr.phase === 'lunge') {
          if (cr.lane === s.lane) return { swipe: s.lane === 0 ? 'right' : 'left' };
        }
        if (cr.phase === 'stun' && cr.t > 0.1 * K) return { press: [LANES[cr.lane], biteY - 60] };
        return null;
      },
    };
  },
};
