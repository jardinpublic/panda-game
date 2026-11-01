// Emille-pattes! (world 8): a big Martinique scolopendra zigzags across
// Cous's terrace towards his bare feet while he screams on a plastic chair.
// TAP the centipede to flip it away with a sandal. From speed 1.8 it takes two
// smacks (it is dazed for a moment in between). Before each turn it rears its
// head and its antennae flash. If it reaches the chair, Cous faints.

import { person, rrect, circle, ellipse, PAL, text, shadowed, vgrad, sun, diamondRock, hibiscus, palm } from '../art.js';

const SEGS = 12;
const GAP = 15; // distance between body segments along the trail
const X_MIN = 60;
const X_MAX = 340;

/** Point at arc distance d along a polyline (head first). */
function along(pts, d) {
  let left = d;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len >= left && len > 0) {
      const k = left / len;
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, ang: Math.atan2(a.y - b.y, a.x - b.x) };
    }
    left -= len;
  }
  const a = pts[pts.length - 2] || pts[0];
  const b = pts[pts.length - 1];
  return { x: b.x, y: b.y, ang: Math.atan2(a.y - b.y, a.x - b.x) || 0 };
}

/** The scolopendra itself, drawn from its trail. belly: flipped over. */
function centipedeBody(c, pts, t, { belly = false, rear = 0, flash = 0, dazed = 0 } = {}) {
  const segs = [];
  for (let i = 0; i < SEGS; i++) segs.push(along(pts, i * GAP));
  // Legs first, rippling in a wave from head to tail.
  c.lineCap = 'round';
  for (let i = SEGS - 1; i >= 1; i--) {
    const p = segs[i];
    const r = 13 - i * 0.45;
    const nx = -Math.sin(p.ang);
    const ny = Math.cos(p.ang);
    const speed = belly ? 40 : dazed > 0 ? 6 : 22;
    for (const side of [-1, 1]) {
      const wave = Math.sin(t * speed - i * 0.9 + (side > 0 ? Math.PI : 0)) * 6;
      const kx = p.x + nx * side * (r + 8) + Math.cos(p.ang) * wave;
      const ky = p.y + ny * side * (r + 8) + Math.sin(p.ang) * wave;
      c.strokeStyle = belly ? '#ffcf8a' : '#f2a33a';
      c.lineWidth = 3.4;
      c.beginPath();
      c.moveTo(p.x + nx * side * r * 0.6, p.y + ny * side * r * 0.6);
      c.quadraticCurveTo(kx, ky, kx - Math.cos(p.ang) * 7, ky - Math.sin(p.ang) * 7);
      c.stroke();
    }
  }
  // Tail cerci: two long trailing legs.
  const tail = segs[SEGS - 1];
  for (const side of [-1, 1]) {
    c.strokeStyle = '#e8892c';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(tail.x, tail.y);
    const bx = tail.x - Math.cos(tail.ang + side * 0.35) * 26;
    const by = tail.y - Math.sin(tail.ang + side * 0.35) * 26;
    c.quadraticCurveTo((tail.x + bx) / 2 + Math.sin(t * 9) * 3, (tail.y + by) / 2, bx, by);
    c.stroke();
  }
  // Body segments, tail to head: glossy orange-red plates.
  for (let i = SEGS - 1; i >= 1; i--) {
    const p = segs[i];
    const r = 13 - i * 0.45;
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.ang);
    const gr = c.createRadialGradient(-r * 0.2, -r * 0.4, 1, 0, 0, r * 1.2);
    if (belly) {
      gr.addColorStop(0, '#ffe2b0');
      gr.addColorStop(1, '#f2a35a');
    } else {
      gr.addColorStop(0, '#ff8a3d');
      gr.addColorStop(0.6, '#e2451f');
      gr.addColorStop(1, '#9e2414');
    }
    ellipse(c, 0, 0, r * 0.95, r, gr);
    ellipse(c, -r * 0.45, 0, r * 0.18, r * 0.85, belly ? 'rgba(200,110,50,0.35)' : 'rgba(90,20,10,0.35)');
    if (!belly) ellipse(c, r * 0.1, -r * 0.45, r * 0.4, r * 0.16, 'rgba(255,255,255,0.35)');
    c.restore();
  }
  // Head: rears up before a turn (drawn bigger and lifted), cute big eyes.
  const h = segs[0];
  c.save();
  c.translate(h.x, h.y - rear * 10);
  c.rotate(h.ang);
  const hs = 1 + rear * 0.18;
  c.scale(hs, hs);
  // Antennae, flashing yellow as the turn tell.
  for (const side of [-1, 1]) {
    c.strokeStyle = flash > 0 ? (Math.sin(t * 50) > 0 ? '#fff3a0' : PAL.mango) : '#d9772a';
    c.lineWidth = flash > 0 ? 4 : 3;
    c.beginPath();
    c.moveTo(10, side * 6);
    c.quadraticCurveTo(30, side * (16 + Math.sin(t * 12 + side) * 5), 44, side * (8 + Math.sin(t * 7) * 6 + rear * 10));
    c.stroke();
  }
  // Forcipules (little pincers).
  for (const side of [-1, 1]) {
    c.strokeStyle = '#ffd166';
    c.lineWidth = 3.5;
    c.beginPath();
    c.moveTo(10, side * 8);
    c.quadraticCurveTo(22, side * 12, 20, side * 3);
    c.stroke();
  }
  const hg = c.createRadialGradient(2, -4, 1, 0, 0, 16);
  hg.addColorStop(0, belly ? '#ffe2b0' : '#c9361b');
  hg.addColorStop(1, belly ? '#e8904a' : '#7a170c');
  ellipse(c, 0, 0, 15, 14, hg);
  if (!belly) {
    for (const side of [-1, 1]) {
      circle(c, 5, side * 7, 5.5, '#ffffff');
      if (dazed > 0) {
        c.strokeStyle = PAL.ink;
        c.lineWidth = 1.6;
        c.beginPath();
        c.arc(5, side * 7, 2.8, t * 12, t * 12 + 4.5);
        c.stroke();
      } else circle(c, 7, side * 7, 2.6, PAL.ink);
      circle(c, 6, side * 7 - 1.5, 1, '#fff');
    }
  }
  c.restore();
}

/** A rubber flip-flop (the sandal of justice). */
function sandal(c, x, y, rot, s = 1) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  shadowed(c, () => {
    ellipse(c, 0, 0, 18, 34, PAL.lagoon);
  }, 10, 4);
  ellipse(c, 0, 2, 13, 28, '#7be3e6');
  c.strokeStyle = PAL.hibiscus;
  c.lineWidth = 5;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-12, 4);
  c.quadraticCurveTo(0, -24, 12, 4);
  c.stroke();
  circle(c, 0, -20, 3, PAL.hibiscus);
  c.restore();
}

/** Terrace: sea view with the Diamond Rock, balustrade, bougainvillea, deck. */
function terrace(c, W, H, deckY, t) {
  c.fillStyle = vgrad(c, 0, deckY, ['#58bdf0', '#a9e2f7', '#ffe3b3']);
  c.fillRect(0, 0, W, deckY);
  sun(c, W * 0.8, 120, 22);
  const horizon = deckY - 150;
  c.fillStyle = vgrad(c, horizon, deckY, [PAL.lagoon, PAL.sea]);
  c.fillRect(0, horizon, W, deckY - horizon);
  diamondRock(c, W * 0.3, horizon + 4, 40);
  c.strokeStyle = 'rgba(255,255,255,0.35)';
  c.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const x = (i * 83 + t * 14) % (W + 40) - 20;
    c.beginPath();
    c.moveTo(x, horizon + 20 + i * 18);
    c.lineTo(x + 28, horizon + 20 + i * 18);
    c.stroke();
  }
  palm(c, W - 20, deckY - 40, 210, t, -0.18);
  // Balustrade.
  c.fillStyle = '#fbf3e6';
  c.fillRect(0, deckY - 78, W, 10);
  for (let x = 8; x < W; x += 26) {
    rrect(c, x, deckY - 68, 12, 64, 6);
    c.fill();
  }
  // Bougainvillea spilling over the corner.
  for (let i = 0; i < 16; i++) circle(c, (i * 23) % 120 - 10, deckY - 90 + Math.sin(i * 1.7) * 18, 12, i % 3 ? '#e0408a' : '#c72c7a');
  for (let i = 0; i < 6; i++) ellipse(c, (i * 31) % 120, deckY - 96 + (i % 3) * 10, 9, 5, PAL.palm, i);
  // Wooden deck in perspective.
  c.fillStyle = vgrad(c, deckY, H, ['#d4a26a', '#b07a45']);
  c.fillRect(0, deckY, W, H - deckY);
  c.strokeStyle = 'rgba(90,50,20,0.25)';
  c.lineWidth = 2;
  for (let i = -6; i <= 6; i++) {
    c.beginPath();
    c.moveTo(W / 2 + i * 34, deckY);
    c.lineTo(W / 2 + i * 90, H);
    c.stroke();
  }
  // A potted hibiscus and a ti-punch on the floor.
  rrect(c, W - 70, H - 150, 44, 46, 8);
  c.fillStyle = PAL.coral;
  c.fill();
  for (let i = 0; i < 5; i++) ellipse(c, W - 48 + (i - 2) * 10, H - 160 - (i % 2) * 10, 8, 18, i % 2 ? PAL.palm : PAL.leaf, (i - 2) * 0.4);
  hibiscus(c, W - 58, H - 178, 11, t * 0.2);
  hibiscus(c, W - 36, H - 168, 9, 1 + t * 0.2, PAL.mango);
}

/** White plastic garden chair, seat at (x, y). */
function chair(c, x, y, shake) {
  c.save();
  c.translate(x + shake, y);
  ellipse(c, 0, 66, 54, 10, 'rgba(20,10,40,0.25)');
  c.fillStyle = '#f4f4f0';
  for (const lx of [-38, 30]) {
    rrect(c, lx, 6, 9, 60, 4);
    c.fill();
  }
  c.fillStyle = '#dedfd8';
  for (const lx of [-26, 20]) {
    rrect(c, lx, 6, 8, 52, 4);
    c.fill();
  }
  shadowed(c, () => {
    rrect(c, -44, -4, 88, 16, 8);
    c.fillStyle = '#ffffff';
    c.fill();
  }, 8, 3);
  c.fillStyle = '#ebece6';
  rrect(c, -40, -70, 80, 62, 16);
  c.fill();
  c.fillStyle = 'rgba(160,165,160,0.35)';
  for (let i = 0; i < 4; i++) {
    rrect(c, -30 + i * 16, -60, 9, 40, 4);
    c.fill();
  }
  c.restore();
}

export default {
  id: 'centipede',
  world: 'w08',
  input: 'tap',
  base: 4.5,
  min: 2.2,
  survive: false,
  verb: { en: 'SMACK IT!', fr: 'TAPE-LA !' },
  title: { en: 'Emille-pattes!', fr: 'Emille-pattes !' },
  howto: { en: 'A giant centipede is crawling to Cous’s bare feet. Tap it to flip it away with a sandal.', fr: 'Une scolopendre fonce vers les pieds nus de Cous. Touche-la pour l’envoyer valser à coups de tong.' },
  winLine: { en: 'Emille et une nuit… of fear!', fr: 'Emille et une nuit… de terreur !' },
  create(g) {
    const screamer = g.cast('cous', 'greg');
    const deckY = g.H * 0.36;
    const chairX = 236;
    const seatY = g.H * 0.74;
    const goal = { x: chairX, y: seatY + 40 };
    const hits = g.speed >= 1.8 ? 2 : 1;
    const startY = deckY + 30;
    const arrive = g.duration * 0.72; // idle: it reaches the feet before the end
    const vy = (goal.y - startY) / arrive;
    const vx = 110 * Math.sqrt(g.speed);
    const tell = 0.24 / g.speed;
    const daze = 0.32 / Math.sqrt(g.speed);
    const x0 = X_MIN + 30 + g.random() * (X_MAX - X_MIN - 60);
    const head = { x: x0, y: startY };
    const pts = [];
    for (let i = 0; i <= SEGS * GAP; i += 6) pts.push({ x: x0, y: startY - i });
    const s = {
      t: 0, dir: x0 < 200 ? 1 : -1, nextTurn: (0.45 + g.random() * 0.3) / g.speed, rear: 0, flash: 0,
      hp: hits, dazed: 0, kb: { x: 0, y: 0 }, flip: null, smack: null, faint: 0, eaten: false, scream: 0, shake: 0,
    };

    function trailPush(x, y) {
      const last = pts[0];
      if (Math.hypot(x - last.x, y - last.y) >= 3) pts.unshift({ x, y });
      else { last.x = x; last.y = y; }
      if (pts.length > 160) pts.length = 160;
    }

    function scream(time = 0.9) {
      g.say(chairX, seatY - 200, g.tr({ en: 'EMILLE-PATTES!!!', fr: 'EMILLE-PATTES !!!' }), time);
      s.scream = 0.25;
    }

    return {
      update(dt) {
        s.t += dt;
        s.flash = Math.max(0, s.flash - dt);
        s.scream = Math.max(0, s.scream - dt);
        s.shake = Math.max(0, s.shake - dt * 3);
        if (s.smack) s.smack.k += dt * 5;
        if (s.t < 0.05 && !s.screamed) {
          s.screamed = true;
          scream(1.1);
        }
        if (s.flip) {
          // Flying away belly-up, spinning.
          s.flip.vy += 1600 * dt;
          s.flip.x += s.flip.vx * dt;
          s.flip.y += s.flip.vy * dt;
          s.flip.rot += s.flip.spin * dt;
          return;
        }
        if (s.eaten) {
          s.faint = Math.min(1, s.faint + dt * 2.2);
          return;
        }
        if (g.done) return;
        if (s.dazed > 0) {
          s.dazed -= dt;
          // Knocked back: the whole body slides away from the chair.
          const dx = s.kb.x * dt;
          const dy = s.kb.y * dt;
          s.kb.x *= Math.exp(-7 * dt);
          s.kb.y *= Math.exp(-7 * dt);
          for (const p of pts) {
            p.x += dx;
            p.y += dy;
          }
          head.x = Math.max(X_MIN, Math.min(X_MAX, pts[0].x));
          head.y = Math.max(deckY + 10, pts[0].y);
          pts[0].x = head.x;
          pts[0].y = head.y;
          return;
        }
        // Zigzag: rear up (tell), then swap direction.
        const near = head.y > goal.y - 110;
        if (!near && s.t >= s.nextTurn - tell && s.rear === 0 && s.t < s.nextTurn) {
          s.flash = tell;
          g.sfx.tick();
        }
        s.rear = !near && s.t >= s.nextTurn - tell && s.t < s.nextTurn ? Math.min(1, (s.t - (s.nextTurn - tell)) / tell) : 0;
        if (s.t >= s.nextTurn) {
          s.dir = -s.dir;
          s.nextTurn = s.t + (0.5 + g.random() * 0.35) / g.speed;
          g.sfx.whoosh();
        }
        const slow = s.rear > 0 ? 0.35 : 1;
        let mx = s.dir * vx * slow;
        if (near) mx = (goal.x - head.x) * 4; // last stretch: straight for the toes
        head.x += mx * dt;
        head.y += vy * (s.rear > 0 ? 0.6 : 1) * dt;
        if (head.x < X_MIN || head.x > X_MAX) {
          head.x = Math.max(X_MIN, Math.min(X_MAX, head.x));
          s.dir = head.x <= X_MIN ? 1 : -1;
        }
        trailPush(head.x, head.y);
        if (head.y >= goal.y - 6 && Math.abs(head.x - goal.x) < 60) {
          s.eaten = true;
          g.sfx.bad();
          g.fx.shake(16);
          g.fx.flash('rgba(255,111,97,0.5)');
          g.fx.text(chairX, seatY - 250, g.tr({ en: 'AAAAH!', fr: 'AAAAH !' }), { size: 40, color: PAL.coral });
          g.say(chairX, seatY - 200, g.tr({ en: 'Emille… pattes…', fr: 'Emille… pattes…' }), 1.4);
          g.lose();
        }
      },
      press(x, y) {
        if (s.flip || s.eaten || s.dazed > 0) {
          g.sfx.tap();
          return;
        }
        // Generous hit test: the head, or any body segment.
        let hit = Math.hypot(head.x - x, head.y - y) < 70;
        for (let i = 1; i < SEGS && !hit; i++) {
          const p = along(pts, i * GAP);
          if (Math.hypot(p.x - x, p.y - y) < 48) hit = true;
        }
        if (!hit) {
          g.sfx.tap();
          s.smack = { x, y, k: 0, miss: true };
          return;
        }
        s.hp--;
        s.smack = { x: head.x, y: head.y, k: 0 };
        g.sfx.hit();
        g.fx.shake(8);
        g.fx.burst(head.x, head.y, { kind: 'spark', n: 12, colors: [PAL.mango, '#fff', PAL.coral], speed: 220 });
        g.fx.text(head.x, head.y - 50, 'SHLAK!', { size: 30, color: PAL.cream });
        if (s.hp > 0) {
          // Not yet: dazed and knocked back away from the chair.
          s.dazed = daze;
          const ax = head.x - goal.x;
          const ay = head.y - goal.y;
          const len = Math.hypot(ax, ay) || 1;
          s.kb = { x: (ax / len) * 420, y: (ay / len) * 420 };
          g.sfx.pop();
          return;
        }
        // Flipped belly-up and sent flying.
        const cx = head.x;
        const cy = head.y;
        s.flip = { cx, cy, x: cx, y: cy, vx: cx < 200 ? -260 : 260, vy: -900, rot: 0, spin: cx < 200 ? -9 : 9 };
        g.sfx.whoosh();
        g.sfx.good();
        g.fx.burst(cx, cy, { kind: 'confetti', n: 22 });
        g.say(chairX, seatY - 200, g.tr({ en: 'Emille et une nuit… of fear!', fr: 'Emille et une nuit… de terreur !' }), 1.4);
        g.win();
      },
      draw(c) {
        terrace(c, g.W, g.H, deckY, s.t);
        // Cous on his chair, screaming, feet bare.
        const panic = s.flip ? 0 : 1;
        const sh = panic * Math.sin(s.t * 70) * (s.scream > 0 ? 3 : 1.2);
        chair(c, chairX, seatY, s.eaten ? 0 : sh);
        c.save();
        if (s.eaten) {
          c.translate(chairX + 20, seatY + 66);
          c.rotate(s.faint * 1.45);
          person(c, screamer, 0, -66 + s.faint * 30, 170, 'sad', s.t, { squash: 1 - s.faint * 0.1 });
        } else {
          person(c, screamer, chairX + sh, seatY + 2, 170, 'cheer', s.t * (s.flip ? 1 : 1.8));
        }
        c.restore();
        if (!s.flip && !s.eaten) {
          text(c, '!!', chairX + 58, seatY - 210 + Math.sin(s.t * 20) * 3, { size: 34, color: PAL.coral, stroke: '#fff' });
          // Sweat drops.
          for (let i = 0; i < 2; i++) circle(c, chairX - 40 + i * 76, seatY - 150 + ((s.t * 80 + i * 30) % 40), 4, 'rgba(160,220,255,0.85)');
        }
        if (s.eaten) {
          for (let i = 0; i < 3; i++) {
            const a = s.t * 5 + (i * Math.PI * 2) / 3;
            text(c, '★', chairX + 90 + Math.cos(a) * 30, seatY + 10 + Math.sin(a) * 8, { size: 18, color: '#fff3a0' });
          }
        }
        // The hero, sandal raised, ready to strike.
        const swing = s.smack && !s.smack.miss && s.smack.k < 1;
        person(c, g.hero, 78, g.H * 0.9, 150, g.done ? (g.won ? 'cheer' : 'sad') : swing ? 'cheer' : 'point', s.t, { hat: g.hat });
        // Target ring under the centipede's head (readability).
        if (!s.flip && !g.done) {
          const pulse = 0.5 + 0.5 * Math.sin(s.t * 10);
          c.strokeStyle = s.dazed > 0 ? 'rgba(255,255,255,0.4)' : `rgba(255,209,102,${0.35 + 0.35 * pulse})`;
          c.lineWidth = 3;
          c.beginPath();
          c.arc(head.x, head.y, 34 + pulse * 4, 0, Math.PI * 2);
          c.stroke();
          // Danger line between the centipede and the chair once it is close.
          const close = 1 - Math.min(1, Math.hypot(head.x - goal.x, head.y - goal.y) / 260);
          if (close > 0) ellipse(c, goal.x, goal.y + 20, 70, 18, `rgba(255,111,97,${close * 0.45})`);
        }
        // The centipede.
        if (s.flip) {
          c.save();
          c.translate(s.flip.x, s.flip.y);
          c.rotate(s.flip.rot);
          c.translate(-s.flip.cx, -s.flip.cy);
          centipedeBody(c, pts, s.t, { belly: true });
          c.restore();
        } else {
          c.save();
          ellipse(c, head.x, head.y + 14, 22, 6, 'rgba(20,10,40,0.18)');
          centipedeBody(c, pts, s.t, { rear: s.rear, flash: s.flash, dazed: s.dazed });
          c.restore();
          if (s.flash > 0) text(c, '!', head.x, head.y - 44, { size: 28, color: PAL.mango, stroke: '#fff' });
          if (s.dazed > 0) {
            for (let i = 0; i < 3; i++) {
              const a = s.t * 9 + (i * Math.PI * 2) / 3;
              text(c, '★', head.x + Math.cos(a) * 24, head.y - 28 + Math.sin(a) * 7, { size: 15, color: '#fff3a0' });
            }
          }
          if (s.hp < hits && !g.done) text(c, `${s.hp}`, head.x + 30, head.y - 30, { size: 20, color: PAL.cream, stroke: PAL.hibiscus });
        }
        // The sandal smack.
        if (s.smack && s.smack.k < 1) {
          const k = s.smack.k;
          const down = Math.min(1, k * 3);
          sandal(c, s.smack.x + 20 * (1 - down), s.smack.y - 40 * (1 - down), -0.6 + down * 0.6, s.smack.miss ? 0.8 : 1.15 - down * 0.15);
          if (!s.smack.miss && k > 0.2) {
            c.strokeStyle = `rgba(255,255,255,${1 - k})`;
            c.lineWidth = 4;
            c.beginPath();
            c.arc(s.smack.x, s.smack.y, 20 + k * 40, 0, Math.PI * 2);
            c.stroke();
          }
        }
      },
      bot() {
        if (s.flip || s.eaten || s.dazed > 0) return null;
        if (s.t < 0.25) return null; // reaction time
        if (s.smack && s.smack.k < 1) return null; // one smack at a time
        return { press: [head.x, head.y] };
      },
    };
  },
};
