// Sneak out (world 1, the escape): the colleague works with his back to you
// in a big office chair. HOLD to tiptoe to the exit, release to freeze. Before
// he swivels round the chair wobbles and he goes "Hmm?" (the tell). Moving
// while he looks = caught. Reach the door = freedom.

import { person, head, rrect, circle, ellipse, PAL, text, shadowed, vgrad, sky, sea, palm, diamondRock, sun, madrasBand } from '../art.js';

/** Tuning (seconds at speed 1; divided by speed unless noted). */
const TUNE = {
  walk: 135, // tiptoe speed, units per second (times speed)
  firstCalm: [0.6, 0.5], // min, random range before the first look
  calm: [0.45, 0.7],
  tell: 0.38, // "Hmm?" wobble; divided by speed^tellCurve so top speed stays fair
  tellCurve: 0.6,
  turn: 0.14, // chair swivel; caught once it is past halfway
  look: [0.45, 0.35],
  back: 0.18, // swivelling back: safe to move
};

/** Romain's state machine: phase -> next phase. */
const NEXT = { calm: 'tell', tell: 'turn', turn: 'look', look: 'back', back: 'calm' };

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const easeOut = (k) => 1 - (1 - k) ** 3;

export default {
  id: 'sneak',
  world: 'w01',
  input: 'hold',
  base: 6,
  survive: false,
  verb: { en: 'SNEAK OUT!', fr: 'FILE EN DOUCE !' },
  title: { en: "Sneak out", fr: "Filer en douce" },
  howto: { en: "Hold to tiptoe to the door. Let go when Romain turns around.", fr: "Maintiens pour avancer sur la pointe des pieds. Lâche quand Romain se retourne." },
  winLine: { en: "Out without a sound!", fr: "Sorti sans un bruit !" },
  rival: ["romain", "victor"],
  rivalLine: { en: "Well yes, you've got to work… and he's gone again?!", fr: "Bah oui, faut bosser… et il est encore parti ?!" },
  loseLine: { en: "Hoho, I was just going to the coffee machine!", fr: "Hoho, j'allais juste à la machine à café !" },
  create(g) {
    const { W, H } = g;
    const sp = g.speed;
    const boss = g.cast('romain', 'victor');
    const feetY = H * 0.84;
    const chairY = H * 0.64;
    const chairX = 196;
    const startX = 58;
    const doorX = 352;
    const goalX = doorX - 14;
    const s = {
      t: 0,
      x: startX,
      hold: false,
      walkT: 0,
      phase: 'calm',
      pt: 0, // time in phase
      len: (TUNE.firstCalm[0] + g.random() * TUNE.firstCalm[1]) / sp,
      end: null, // null | 'out' | 'caught' | 'late'
      endT: 0,
      steps: 0,
    };

    function phaseLength(p) {
      if (p === 'calm') return (TUNE.calm[0] + g.random() * TUNE.calm[1]) / sp;
      if (p === 'tell') return TUNE.tell / sp ** TUNE.tellCurve;
      if (p === 'turn') return TUNE.turn / sp;
      if (p === 'look') return (TUNE.look[0] + g.random() * TUNE.look[1]) / sp;
      return TUNE.back / sp;
    }

    function enter(p) {
      s.phase = p;
      s.pt = 0;
      s.len = phaseLength(p);
      if (p === 'tell') {
        g.sfx.click();
        g.say(chairX + 6, chairY - 112, g.tr({ en: 'Hmm?', fr: 'Hmm ?' }), s.len + 0.1);
      } else if (p === 'turn') g.sfx.whoosh();
    }

    /** How far the chair has swivelled to face you: 0 back, 1 facing. */
    function facing() {
      if (s.end === 'caught' || s.end === 'late') return 1;
      if (s.phase === 'turn') return s.pt / s.len;
      if (s.phase === 'look') return 1;
      if (s.phase === 'back') return 1 - s.pt / s.len;
      return 0;
    }

    const watching = () => s.phase === 'look' || (s.phase === 'turn' && s.pt / s.len > 0.5);

    function finish(kind) {
      s.end = kind;
      s.endT = 0;
      s.hold = false;
      if (kind === 'out') {
        g.sfx.hoho();
        g.sfx.good();
        g.fx.burst(doorX, feetY - 120, { kind: 'confetti', n: 28 });
        g.fx.burst(doorX, feetY - 60, { kind: 'petal', n: 8 });
        g.say(doorX - 30, feetY - 170, g.tr({ en: 'Hoho, freedom!', fr: 'Hoho, la liberté !' }), 1.4);
        g.win();
      } else if (kind === 'caught') {
        g.sfx.bad();
        g.fx.shake(14);
        g.fx.flash('rgba(239,45,107,0.3)', 0.2);
        g.fx.text(s.x, feetY - 190, g.tr({ en: 'CAUGHT!', fr: 'GRILLÉ !' }), { size: 40, color: PAL.hibiscus });
        g.say(chairX, chairY - 150, g.tr({ en: 'Where are you going?!', fr: 'Te vas où comme ça ?!' }), 1.6);
        g.lose();
      } else {
        g.sfx.bad();
        g.say(chairX, chairY - 150, g.tr({ en: 'Still here? Meeting time!', fr: 'Encore là ? Réunion !' }), 1.6);
      }
    }

    function drawRoom(c) {
      sky(c, W, H, ['#f6efe3', '#ebdfcb']);
      // Big window on the bay.
      const wy0 = 92;
      const wy1 = chairY - 150;
      shadowed(c, () => {
        rrect(c, 24, wy0, W - 48, wy1 - wy0, 18);
        c.fillStyle = '#7fd3ef';
        c.fill();
      }, 16, 6, 'rgba(20,10,40,0.15)');
      c.save();
      rrect(c, 24, wy0, W - 48, wy1 - wy0, 18);
      c.clip();
      const hz = wy0 + (wy1 - wy0) * 0.55;
      sky(c, W, hz, ['#5ab8e8', '#c4ecf7']);
      sun(c, 300, wy0 + 40, 16);
      diamondRock(c, 120, hz, 40);
      sea(c, W, hz, wy1 - hz, s.t);
      palm(c, W - 40, wy1 + 20, (wy1 - wy0) * 0.95, s.t, -0.2);
      c.restore();
      c.fillStyle = 'rgba(255,255,255,0.75)';
      c.fillRect(W / 2 - 2, wy0, 4, wy1 - wy0);
      madrasBand(c, 0, chairY - 40, W, 10, 0.4);
      // Floor with a runner rug leading to the door.
      c.fillStyle = vgrad(c, chairY - 30, H, ['#d9c7ae', '#bfa483']);
      c.fillRect(0, chairY - 30, W, H - chairY + 30);
      rrect(c, 20, feetY - 16, W - 40, 30, 15);
      c.fillStyle = 'rgba(239,45,107,0.18)';
      c.fill();
      // Footprints still to go.
      for (let x = startX + 30; x < goalX; x += 34) {
        if (x < s.x + 10) continue;
        ellipse(c, x, feetY + (x % 68 > 30 ? 4 : -4), 6, 3, 'rgba(90,60,40,0.18)');
      }
    }

    function drawDoor(c) {
      const top = feetY - 250;
      const open = s.end === 'out' ? easeOut(clamp(s.endT / 0.3)) : 0.08;
      shadowed(c, () => {
        rrect(c, doorX - 44, top, 88, 250, 8);
        c.fillStyle = '#f7f2ea';
        c.fill();
      }, 12, 4, 'rgba(20,10,40,0.16)');
      // Daylight behind the door.
      c.save();
      rrect(c, doorX - 36, top + 8, 72, 242, 6);
      c.clip();
      c.fillStyle = vgrad(c, top, feetY, ['#ffe9a8', '#ffb86b']);
      c.fillRect(doorX - 36, top, 72, 250);
      palm(c, doorX + 10, feetY + 30, 160, s.t, -0.1);
      c.restore();
      c.save();
      c.translate(doorX - 36, 0);
      c.scale(1 - open * 0.8, 1);
      rrect(c, 0, top + 8, 72, 242, 6);
      c.fillStyle = vgrad(c, top, feetY, ['#c48a5a', '#9b6a43']);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.12)';
      rrect(c, 8, top + 22, 56, 90, 6);
      c.fill();
      rrect(c, 8, top + 128, 56, 100, 6);
      c.fill();
      circle(c, 60, top + 134, 5, '#f2c14e');
      c.restore();
      shadowed(c, () => {
        rrect(c, doorX - 38, top - 30, 76, 22, 6);
        c.fillStyle = PAL.palm;
        c.fill();
      }, 14, 0, 'rgba(51,208,139,0.8)');
      text(c, g.tr({ en: 'EXIT', fr: 'SORTIE' }), doorX, top - 19, { size: 14, color: '#eafff4', shadow: false });
    }

    function drawDesk(c) {
      // Desk and monitor, facing the colleague (and us, behind him).
      const top = chairY - 118;
      c.fillStyle = '#8a6a4a';
      c.fillRect(chairX - 92, top + 14, 8, 70);
      c.fillRect(chairX + 84, top + 14, 8, 70);
      shadowed(c, () => {
        rrect(c, chairX - 104, top, 208, 18, 8);
        c.fillStyle = '#e8b47c';
        c.fill();
      }, 10, 4);
      c.fillStyle = '#3a3f52';
      c.fillRect(chairX - 6, top - 22, 12, 22);
      shadowed(c, () => {
        rrect(c, chairX - 62, top - 92, 124, 74, 8);
        c.fillStyle = '#2b3042';
        c.fill();
      }, 10, 4);
      rrect(c, chairX - 56, top - 86, 112, 62, 5);
      c.fillStyle = '#e9f4ff';
      c.fill();
      // A spreadsheet, obviously.
      c.fillStyle = PAL.sea;
      c.fillRect(chairX - 56, top - 86, 112, 10);
      c.strokeStyle = 'rgba(10,143,176,0.3)';
      c.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        c.beginPath();
        c.moveTo(chairX - 56, top - 76 + i * 10);
        c.lineTo(chairX + 56, top - 76 + i * 10);
        c.stroke();
      }
      for (let i = 1; i < 4; i++) {
        c.beginPath();
        c.moveTo(chairX - 56 + i * 28, top - 76);
        c.lineTo(chairX - 56 + i * 28, top - 24);
        c.stroke();
      }
      const blink = Math.floor(s.t * 3) % 2;
      c.fillStyle = blink ? PAL.mango : 'rgba(255,178,62,0.3)';
      c.fillRect(chairX - 28 + ((Math.floor(s.t * 2) % 3) * 28), top - 56, 26, 9);
      // Mug and a little potted palm.
      rrect(c, chairX + 66, top - 20, 18, 20, 5);
      c.fillStyle = PAL.coral;
      c.fill();
    }

    function drawChairBack(c, squeeze, wob) {
      // Seen from behind: tall backrest hides him, only his hair and elbows show.
      c.save();
      c.translate(chairX, chairY);
      c.rotate(wob);
      c.scale(squeeze, 1);
      const typing = s.phase === 'calm' && !s.end ? Math.sin(s.t * 22) * 2 : 0;
      for (const side of [-1, 1]) ellipse(c, side * 46, -66 + (side > 0 ? typing : -typing), 11, 9, '#c9d8e8');
      const twitch = s.phase === 'tell' ? -6 - Math.abs(Math.sin(s.pt * 40)) * 5 : 0;
      ellipse(c, 0, -104 + twitch, 30, 16, '#3a2a22');
      ellipse(c, -8, -112 + twitch, 12, 7, 'rgba(255,255,255,0.12)');
      shadowed(c, () => {
        rrect(c, -44, -104, 88, 90, 26);
        c.fillStyle = vgrad(c, -104, -14, ['#3f4a66', '#2a3248']);
        c.fill();
      }, 12, 5);
      c.fillStyle = 'rgba(255,255,255,0.1)';
      rrect(c, -34, -96, 20, 70, 10);
      c.fill();
      c.restore();
    }

    function drawChairFront(c, squeeze) {
      c.save();
      c.translate(chairX, chairY);
      c.scale(squeeze, 1);
      rrect(c, -44, -104, 88, 90, 26);
      c.fillStyle = vgrad(c, -104, -14, ['#3f4a66', '#2a3248']);
      c.fill();
      const caught = s.end === 'caught' || s.end === 'late';
      if (caught) {
        person(c, boss, 0, 30, 140, 'point', s.t, { flip: s.x < chairX });
      } else {
        person(c, boss, 0, 10, 140, 'sit', s.t);
      }
      c.restore();
    }

    function drawChairBase(c) {
      c.fillStyle = '#2a3248';
      c.fillRect(chairX - 4, chairY - 16, 8, 18);
      rrect(c, chairX - 46, chairY, 92, 8, 4);
      c.fill();
      for (const dx of [-42, 0, 42]) circle(c, chairX + dx, chairY + 10, 5, '#1c2030');
    }

    function drawGaze(c) {
      // Vision cone sweeping the floor while he looks.
      const f = facing();
      if (f < 0.5) return;
      const a = clamp((f - 0.5) * 2);
      const ey = chairY - 80;
      const grad = c.createLinearGradient(chairX, ey, chairX, feetY + 30);
      grad.addColorStop(0, `rgba(255,90,110,${0.45 * a})`);
      grad.addColorStop(1, `rgba(255,90,110,${0.08 * a})`);
      c.fillStyle = grad;
      c.beginPath();
      c.moveTo(chairX - 14, ey);
      c.lineTo(chairX + 14, ey);
      c.lineTo(W + 20, feetY + 40);
      c.lineTo(-20, feetY + 40);
      c.closePath();
      c.fill();
    }

    return {
      update(dt) {
        s.t += dt;
        s.endT += dt;
        if (g.done && !s.end) finish('late');
        if (s.end === 'out') {
          s.x += 160 * sp * dt;
          s.walkT += dt;
          return;
        }
        if (s.end) return;
        s.pt += dt;
        if (s.pt >= s.len) enter(NEXT[s.phase]);
        if (s.hold) {
          s.x = Math.min(goalX, s.x + TUNE.walk * sp * dt);
          s.walkT += dt;
          const step = Math.floor(s.walkT * 6);
          if (step !== s.steps) {
            s.steps = step;
            g.sfx.tick();
          }
          if (watching()) finish('caught');
          else if (s.x >= goalX) finish('out');
        }
      },
      press() {
        s.hold = true;
      },
      release() {
        s.hold = false;
      },
      draw(c) {
        drawRoom(c);
        drawDoor(c);
        drawDesk(c);
        drawChairBase(c);
        const f = facing();
        const wob = s.phase === 'tell' && !s.end ? Math.sin(s.pt * 30) * 0.05 : 0;
        if (f < 0.5) drawChairBack(c, Math.max(0.06, Math.cos(f * Math.PI)), wob);
        else drawChairFront(c, Math.max(0.06, -Math.cos(f * Math.PI)));
        if (f >= 1 && !s.end) text(c, '!', chairX + 50, chairY - 150, { size: 38, color: PAL.hibiscus, stroke: '#ffffff' });
        drawGaze(c);
        // The hero: tiptoeing, frozen like a statue, caught or escaping.
        const moving = s.hold || s.end === 'out';
        const pose = s.end === 'caught' || s.end === 'late' ? 'sad' : moving ? 'run' : 'idle';
        const alpha = s.end === 'out' ? clamp(1 - (s.endT - 0.25) * 3) : 1;
        if (alpha > 0) person(c, g.hero, s.x, feetY, 150, pose, s.walkT * 0.55, { hat: g.hat, squash: moving ? 0.95 : 0.9, alpha });
        if (!moving && !s.end && f > 0.3) {
          ellipse(c, s.x + 30, feetY - 140, 3.5, 6, 'rgba(120,200,255,0.9)');
          text(c, '…', s.x, feetY - 175, { size: 26, color: PAL.ink, shadow: false });
        }
        if (s.hold && !s.end) {
          for (let i = 0; i < 2; i++) text(c, i ? 'tip' : 'tap', s.x - 40 - i * 20, feetY - 20 - ((s.walkT * 60 + i * 20) % 40), { size: 13, color: 'rgba(30,26,51,0.45)', shadow: false });
        }
        if (s.end === 'caught') circle(c, s.x, feetY - 90, 90 * clamp(1 - s.endT * 2), `rgba(239,45,107,${0.25 * clamp(1 - s.endT * 2)})`);
        // Hold hint.
        if (!s.end && g.elapsed < 1) text(c, g.tr({ en: 'hold = tiptoe', fr: 'maintiens = avance' }), W / 2, H - 76, { size: 16, color: 'rgba(30,26,51,0.5)', shadow: false });
      },
      bot() {
        // Walk while he is busy (calm, the start of the tell, swivelling back); freeze otherwise.
        const tellLeft = s.phase === 'tell' ? s.len - s.pt : Infinity;
        const safe = s.phase === 'calm' || s.phase === 'back' || (s.phase === 'tell' && tellLeft > 0.1);
        if (safe && !s.hold) return { press: [W / 2, H / 2] };
        if (!safe && s.hold) return { release: [W / 2, H / 2] };
        return null;
      },
    };
  },
};
