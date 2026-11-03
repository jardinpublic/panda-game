// José and Lamoule cruise Montceau-les-Mines in their old Peugeot 205, looking
// for the gang, who would rather not spend the evening with them. The gang is
// having a beer at one of their spots (picked at random). Headlights sweep in
// from one side and the engine rumbles: SWIPE to dive behind the cover on the
// OTHER side before the car's lights reach you. Later, a second pass comes from
// the other side, so the gang has to switch cover.

import { person, beerCan, rrect, circle, ellipse, vgrad, text, PAL } from '../art.js';
import { peugeot205, headlightBeam } from '../cars.js';

const GANG = 150; // size of the friends
const CAR = 240; // length of the 205
const COVER_X = { left: 70, right: 330 };

/** Their spots in Montceau, each with what there is to hide behind on the left and right. */
export const SPOTS = [
  { id: 'jardin', name: 'Jardin Public', cover: ['hedge', 'bush'], ground: 'grass' },
  { id: 'aldi', name: 'Derrière l’ALDI', cover: ['bin', 'carts'], ground: 'parking' },
  { id: 'zup', name: 'Terrain de la ZUP', cover: ['wall', 'bin'], ground: 'dirt' },
  { id: 'plessis', name: 'Lac du Plessis', cover: ['reeds', 'bush'], ground: 'grass' },
  { id: 'preau', name: 'Préau du CRAPA', cover: ['bush', 'hedge'], ground: 'grass' },
  { id: 'butte', name: 'Butte du CRAPA', cover: ['bush', 'rock'], ground: 'grass' },
  { id: 'marches', name: 'Marches au-dessus de chez Vic', cover: ['wall', 'bin'], ground: 'steps' },
];

function cover(c, kind, x, y, t) {
  if (kind === 'bush' || kind === 'hedge') {
    const w = kind === 'hedge' ? 46 : 40;
    for (let i = 0; i < 6; i++) {
      const a = i / 5;
      circle(c, x - w + a * w * 2, y - 50 - Math.sin(a * Math.PI) * 26 + (i % 2) * 8, 30, i % 2 ? '#1f5a3a' : '#25693f');
    }
    rrect(c, x - w - 26, y - 72, w * 2 + 52, 74, 30);
    c.fillStyle = '#21603d';
    c.fill();
    for (let i = 0; i < 9; i++) circle(c, x - w + ((i * 37) % (w * 2)), y - 70 + ((i * 23) % 60), 4, 'rgba(120,200,140,0.35)');
  } else if (kind === 'bin') {
    // A big green wheelie container
    rrect(c, x - 64, y - 100, 128, 94, 10);
    c.fillStyle = vgrad(c, y - 100, y, ['#2f7d4e', '#1f5c38']);
    c.fill();
    rrect(c, x - 70, y - 108, 140, 16, 6);
    c.fillStyle = '#245f3c';
    c.fill();
    circle(c, x - 44, y - 2, 9, '#1c1d22');
    circle(c, x + 44, y - 2, 9, '#1c1d22');
    c.fillStyle = 'rgba(255,255,255,0.12)';
    c.fillRect(x - 54, y - 90, 18, 76);
  } else if (kind === 'carts') {
    // Shopping trolleys nested in a row
    for (let i = 0; i < 3; i++) {
      const cx = x - 32 + i * 22;
      c.strokeStyle = 'rgba(200,205,215,0.9)';
      c.lineWidth = 3;
      c.strokeRect(cx - 34, y - 100, 76, 64);
      for (let k = 1; k < 5; k++) {
        c.beginPath();
        c.moveTo(cx - 34 + k * 15, y - 100);
        c.lineTo(cx - 34 + k * 15, y - 36);
        c.stroke();
      }
      c.fillStyle = 'rgba(150,160,175,0.35)';
      c.fillRect(cx - 34, y - 100, 76, 64);
      circle(c, cx - 26, y - 8, 7, '#2a2b30');
      circle(c, cx + 34, y - 8, 7, '#2a2b30');
      c.beginPath();
      c.moveTo(cx - 34, y - 36);
      c.lineTo(cx - 26, y - 14);
      c.lineTo(cx + 34, y - 14);
      c.lineTo(cx + 42, y - 36);
      c.stroke();
    }
    // A cardboard pallet in front so the gang is really hidden
    rrect(c, x - 70, y - 62, 140, 62, 6);
    c.fillStyle = '#b98b55';
    c.fill();
    c.fillStyle = 'rgba(0,0,0,0.12)';
    c.fillRect(x - 70, y - 34, 140, 4);
  } else if (kind === 'wall') {
    // Low wall of old bricks
    rrect(c, x - 70, y - 92, 140, 92, 6);
    c.fillStyle = '#8d5a46';
    c.fill();
    c.fillStyle = 'rgba(40,20,15,0.25)';
    for (let r = 0; r < 5; r++) for (let k = 0; k < 5; k++) c.fillRect(x - 70 + k * 30 + (r % 2) * 15, y - 92 + r * 18, 2, 18);
    for (let r = 1; r < 5; r++) c.fillRect(x - 70, y - 92 + r * 18, 140, 2);
    c.fillStyle = '#a99c8e';
    c.fillRect(x - 74, y - 98, 148, 10);
  } else if (kind === 'reeds') {
    for (let i = 0; i < 13; i++) {
      const rx = x - 64 + i * 10.5;
      const h = 96 + ((i * 37) % 30);
      c.strokeStyle = i % 2 ? '#3f6b3a' : '#4f7d45';
      c.lineWidth = 6;
      c.beginPath();
      c.moveTo(rx, y);
      c.quadraticCurveTo(rx + Math.sin(t * 2 + i) * 6, y - h * 0.6, rx + Math.sin(t * 2 + i) * 10, y - h);
      c.stroke();
      if (i % 3 === 0) ellipse(c, rx + Math.sin(t * 2 + i) * 10, y - h + 6, 5, 14, '#6b4a2e');
    }
    rrect(c, x - 72, y - 76, 144, 76, 26);
    c.fillStyle = '#365e33';
    c.fill();
  } else if (kind === 'rock') {
    ellipse(c, x, y - 48, 72, 56, '#6f6a73');
    ellipse(c, x - 18, y - 70, 42, 26, '#7f7a84');
    ellipse(c, x + 8, y - 4, 76, 12, 'rgba(0,0,0,0.25)');
  }
}

/** The backdrop of a spot: night sky, a few landmarks, the ground. */
function backdrop(c, spot, W, H, groundY, t) {
  c.fillStyle = vgrad(c, 0, groundY, ['#0d1230', '#1d2350', '#33305e']);
  c.fillRect(0, 0, W, groundY);
  for (let i = 0; i < 26; i++) circle(c, (i * 97) % W, 90 + ((i * 53) % (groundY * 0.45)), 1.2 + (i % 3) * 0.4, `rgba(255,255,255,${0.35 + 0.35 * Math.sin(t * 2 + i)})`);
  circle(c, W * 0.8, 150, 26, '#f3ecc8');
  circle(c, W * 0.8 + 9, 144, 24, '#1d2350');
  const id = spot.id;
  if (id === 'zup' || id === 'aldi') {
    // Tower blocks of the ZUP, or the back of the supermarket
    if (id === 'zup') {
      for (let i = 0; i < 4; i++) {
        const bx = 10 + i * 100;
        const bh = 210 + (i % 2) * 70;
        c.fillStyle = '#2c2c48';
        c.fillRect(bx, groundY - 40 - bh, 80, bh);
        for (let r = 0; r < bh / 26 - 1; r++) for (let k = 0; k < 4; k++) if ((r * 4 + k + i) % 5 < 2) {
          c.fillStyle = '#e8c56d';
          c.fillRect(bx + 8 + k * 18, groundY - 40 - bh + 12 + r * 26, 10, 12);
        }
      }
      // The goal of the pitch
      c.strokeStyle = 'rgba(240,240,240,0.85)';
      c.lineWidth = 5;
      c.strokeRect(150, groundY - 120, 100, 80);
    } else {
      c.fillStyle = '#4a4e63';
      c.fillRect(0, groundY - 260, W, 220);
      c.fillStyle = '#3c4054';
      c.fillRect(140, groundY - 170, 120, 130); // loading bay
      c.fillStyle = 'rgba(255,255,255,0.1)';
      for (let k = 0; k < 8; k++) c.fillRect(140, groundY - 170 + k * 16, 120, 2);
      circle(c, 120, groundY - 220, 8, '#ffe9a8');
      ellipse(c, 120, groundY - 200, 60, 30, 'rgba(255,233,168,0.12)');
    }
  } else if (id === 'plessis') {
    c.fillStyle = vgrad(c, groundY - 120, groundY - 30, ['#1e3a63', '#14284a']);
    c.fillRect(0, groundY - 120, W, 90);
    for (let i = 0; i < 6; i++) ellipse(c, W * 0.8 + Math.sin(t * 2 + i) * 8, groundY - 110 + i * 14, 22 - i * 3, 2, 'rgba(243,236,200,0.5)');
  } else if (id === 'preau' || id === 'butte') {
    // The shelter of the CRAPA (small and far below when on the hill)
    const far = id === 'butte';
    const px = far ? 260 : 200;
    const py = far ? groundY - 150 : groundY - 40;
    const k = far ? 0.45 : 1;
    c.fillStyle = '#3a2e2a';
    for (const dx of [-110, 110]) c.fillRect(px + dx * k - 6 * k, py - 190 * k, 12 * k, 190 * k);
    c.fillStyle = '#5a3f33';
    c.beginPath();
    c.moveTo(px - 150 * k, py - 180 * k);
    c.lineTo(px, py - 250 * k);
    c.lineTo(px + 150 * k, py - 180 * k);
    c.closePath();
    c.fill();
    for (const tx of [30, 370]) {
      c.fillStyle = '#2a2420';
      c.fillRect(tx - 8, groundY - 220, 16, 180);
      circle(c, tx, groundY - 240, 60, '#173d2a');
    }
    if (far) {
      // Our hill
      c.fillStyle = '#244a33';
      c.beginPath();
      c.moveTo(0, groundY - 30);
      c.quadraticCurveTo(W / 2, groundY - 120, W, groundY - 30);
      c.lineTo(W, groundY);
      c.lineTo(0, groundY);
      c.fill();
    }
  } else if (id === 'marches') {
    // Old stone steps climbing between houses
    c.fillStyle = '#3a3550';
    c.fillRect(0, groundY - 300, 110, 260);
    c.fillRect(290, groundY - 280, 110, 240);
    c.fillStyle = '#e8c56d';
    c.fillRect(30, groundY - 250, 26, 34);
    c.fillRect(320, groundY - 220, 26, 34);
    for (let i = 0; i < 8; i++) {
      c.fillStyle = i % 2 ? '#6d6878' : '#615c6d';
      c.fillRect(120 + i * 4, groundY - 60 - i * 26, 160 - i * 8, 26);
    }
  } else {
    // Jardin Public: trees, lamps, the gate
    for (const tx of [40, 200, 360]) {
      c.fillStyle = '#2a2420';
      c.fillRect(tx - 8, groundY - 230, 16, 190);
      circle(c, tx, groundY - 250, 64, '#173d2a');
      circle(c, tx - 30, groundY - 220, 40, '#1d4a31');
    }
    for (const lx of [120, 280]) {
      c.fillStyle = '#26262e';
      c.fillRect(lx - 3, groundY - 150, 6, 110);
      circle(c, lx, groundY - 156, 10, '#ffe9a8');
      ellipse(c, lx, groundY - 40, 50, 10, 'rgba(255,233,168,0.15)');
    }
  }
  // Ground
  const gc = spot.ground === 'parking' ? ['#4b4b58', '#3a3a45'] : spot.ground === 'dirt' ? ['#6b5440', '#4d3c2e'] : spot.ground === 'steps' ? ['#5b566a', '#45414f'] : ['#2f5e3e', '#22452e'];
  c.fillStyle = vgrad(c, groundY - 40, H, gc);
  c.fillRect(0, groundY - 40, W, H - groundY + 40);
  if (spot.ground === 'parking') {
    c.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 6; i++) c.fillRect(i * 80 + 20, groundY + 30, 8, 60);
  }
}

export default {
  id: 'car205',
  world: 'w03',
  input: 'swipe',
  base: 4.5,
  min: 2.4,
  survive: false,
  verb: { en: 'HIDE!', fr: 'PLANQUEZ-VOUS !' },
  title: { en: 'Here comes the car!', fr: 'V’là la bagnole !' },
  howto: {
    en: 'José and Lamoule are cruising Montceau in their old 205. The headlights show where they come from: swipe to hide on the other side!',
    fr: 'José et Lamoule tournent dans Montceau en vieille 205. Les phares montrent d’où y viennent : glisse pour te planquer d’l’autre côté !',
  },
  winLine: { en: 'They drove right past!', fr: 'Y sont passés sans nous voir !' },
  rival: ['mamar', 'babar'],
  rivalLine: { en: 'I could have told them where you were…', fr: 'J’aurais pu leur dire où vous étiez…' },
  loseLine: { en: 'Hoho… they found us.', fr: 'Hoho… y nous ont trouvés.' },
  create(g) {
    const spot = SPOTS[Math.floor(g.random() * SPOTS.length)];
    const a = g.friend();
    const b = g.friend([a]);
    const groundY = g.H * 0.8;
    const passes = g.speed < 1.5 ? 1 : 2;
    const first = g.random() < 0.5 ? 'left' : 'right';
    const sides = passes === 1 ? [first] : [first, first === 'left' ? 'right' : 'left'];
    const waitT = 0.35 / g.speed;
    const tellT = Math.max(0.55, 1.0 / g.speed);
    const shineT = 0.5 / g.speed;
    const leaveT = 0.4 / g.speed;
    const s = { t: 0, pass: 0, phase: 'wait', pt: 0, pos: 'mid', x: 200, caught: false, said: false };
    const other = (side) => (side === 'left' ? 'right' : 'left');
    const side = () => sides[Math.min(s.pass, sides.length - 1)];
    const targetX = () => (s.pos === 'mid' ? 200 : COVER_X[s.pos]);
    const hidden = () => s.pos === other(side()) && Math.abs(s.x - COVER_X[s.pos]) < 24;

    return {
      update(dt) {
        s.t += dt;
        s.pt += dt;
        // The gang runs to its cover
        const tx = targetX();
        s.x += Math.sign(tx - s.x) * Math.min(Math.abs(tx - s.x), 900 * dt);
        if (g.done) return;
        if (s.phase === 'wait' && s.pt >= waitT) {
          s.phase = 'tell';
          s.pt = 0;
          g.sfx.tick();
        } else if (s.phase === 'tell') {
          if (s.pt >= tellT) {
            s.phase = 'shine';
            s.pt = 0;
          }
        } else if (s.phase === 'shine') {
          if (!hidden()) {
            // Spotted in the headlights
            s.caught = true;
            g.sfx.bad();
            g.fx.flash('rgba(255,246,190,0.55)');
            g.fx.shake(6);
            const cx = side() === 'left' ? 90 : g.W - 90;
            g.say(cx, groundY - CAR * 0.5, g.tr({ en: 'Hey guys! We were looking for you!', fr: 'Eh les gars ! On vous cherchait !' }), 1.5);
            g.lose();
          } else if (s.pt >= shineT) {
            s.phase = 'leave';
            s.pt = 0;
            g.sfx.whoosh();
            if (s.pass + 1 >= sides.length) {
              const cx = side() === 'left' ? 100 : g.W - 100;
              g.say(cx, groundY - CAR * 0.5, g.tr({ en: 'They’re not here…', fr: 'Y sont pas là…' }), 1.3);
              g.sfx.good();
              g.fx.burst(COVER_X[s.pos], groundY - 120, { kind: 'confetti', n: 26 });
              g.win();
            }
          }
        } else if (s.phase === 'leave' && s.pt >= leaveT) {
          s.pass++;
          s.phase = 'tell';
          s.pt = 0;
          g.sfx.tick();
        }
      },
      swipe(dir) {
        if (g.done || (dir !== 'left' && dir !== 'right')) return;
        if (s.pos === dir) return;
        s.pos = dir;
        g.sfx.whoosh();
      },
      draw(c) {
        const { W, H } = g;
        backdrop(c, spot, W, H, groundY, s.t);
        // Where we are, like a street sign
        c.font = `700 17px 'Fredoka', system-ui, sans-serif`;
        const sw = Math.min(W - 40, (c.measureText(spot.name).width || spot.name.length * 9) + 44);
        rrect(c, W / 2 - sw / 2, 96, sw, 36, 8);
        c.fillStyle = '#1f4e8c';
        c.fill();
        text(c, `📍 ${spot.name}`, W / 2, 115, { size: 17, color: '#fff', shadow: false, max: sw - 16 });

        // The car: off-screen during the tell (its lights and noise give it away),
        // then nose in, headlights on whoever is still out in the open.
        const sd = side();
        const dir = sd === 'left' ? 1 : -1;
        let k = 0;
        if (s.phase === 'tell') k = Math.min(1, s.pt / tellT);
        else if (s.phase === 'shine' || g.done && !g.won) k = 1;
        else if (s.phase === 'leave') k = Math.max(0, 1 - s.pt / leaveT);
        const showCar = s.phase !== 'wait';
        const restX = sd === 'left' ? 30 : W - 30;
        const carX = restX - dir * (1 - k) ** 2 * CAR * 0.9;
        if (showCar) {
          // The tell: light spilling on the ground on that side, and the engine
          ellipse(c, sd === 'left' ? 60 : W - 60, groundY + 20, 120 * k + 30, 26, `rgba(255,240,180,${0.15 + 0.35 * k})`);
          if (s.phase === 'tell' && k < 0.9) text(c, 'VROUM', sd === 'left' ? 70 : W - 70, groundY - CAR * 0.75 - Math.sin(s.t * 30) * 3, { size: 22, color: '#ffe9a8', stroke: 'rgba(120,60,0,0.6)' });
        }

        // The gang, drinking, then crouched behind cover
        const crouch = s.pos !== 'mid' && Math.abs(s.x - targetX()) < 4;
        const pose = s.caught ? 'sad' : g.done && g.won ? 'cheer' : crouch ? 'idle' : 'idle';
        const squash = crouch ? 0.85 : 1; // heads peek over the cover
        const gx = s.x;
        person(c, a, gx - 40, groundY, GANG, pose, s.t, { squash });
        person(c, b, gx + 40, groundY, GANG, pose, s.t + 1, { squash });
        person(c, g.hero, gx, groundY + 8, GANG, pose, s.t + 2, { hat: g.hat, squash });
        if (!crouch && !s.caught) {
          beerCan(c, gx - 22, groundY - GANG * 0.42, 0.9, 0.3);
          beerCan(c, gx + 58, groundY - GANG * 0.42, 0.9, -0.3);
        }
        if (showCar) {
          // Headlights over the scene: whoever is still in the open is lit up
          c.save();
          c.globalCompositeOperation = 'lighter';
          headlightBeam(c, carX + dir * CAR * 0.47, groundY + 30 - CAR * 0.17, dir, 240 * (0.3 + 0.7 * k), 0.5 + 0.5 * k);
          c.restore();
        }
        // Cover on both sides (in front of the gang)
        cover(c, spot.cover[0], COVER_X.left, groundY + 14, s.t);
        cover(c, spot.cover[1], COVER_X.right, groundY + 14, s.t);
        if (showCar) peugeot205(c, carX, groundY + 30, CAR, { flip: dir < 0, t: s.t, spin: s.phase === 'tell' || s.phase === 'leave', lights: 0.4 + 0.6 * k, driver: 'jose', passenger: 'lamoule', bounce: 2 });
        // Passes to dodge
        for (let i = 0; i < sides.length; i++) circle(c, W / 2 - (sides.length - 1) * 17 + i * 34, H * 0.2, 11, i < s.pass || (g.won && i <= s.pass) ? PAL.mango : 'rgba(255,255,255,0.22)');
      },
      bot() {
        if (g.done) return null;
        if (s.phase === 'tell' && s.pt > tellT * 0.3 && s.pos !== other(side())) return { swipe: other(side()) };
        if (s.phase === 'leave' && s.pos !== other(sides[Math.min(s.pass + 1, sides.length - 1)])) return null;
        return null;
      },
    };
  },
};
