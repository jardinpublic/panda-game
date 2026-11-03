// Dawn in Montceau: Rudy has decided to go and live in the woods of the CRAPA,
// and sneaks out of his house with everything on his back. The hero drives past
// in the white Clio, slowly (stopping would wake the house), back door open.
// HOLD to make Rudy run beside the car, LET GO to jump in when the open door is
// right next to him. Too early or too late: he falls flat and the house lights up.

import { person, rrect, circle, ellipse, vgrad, text, PAL } from '../art.js';
import { clio } from '../cars.js';

const RUDY = 160;
const CAR = 290;
const TOL = 24; // how close Rudy must be to the door to make it in
const DOOR = -0.195; // the open door's middle, from the car's middle (in car lengths)

/** Rudy's huge bag: a rolled tent, a pillow and a saucepan hanging off it. */
function bag(c, x, y, s, t) {
  rrect(c, x - s * 0.13, y - s * 0.62, s * 0.2, s * 0.34, s * 0.06);
  c.fillStyle = '#c0582f';
  c.fill();
  rrect(c, x - s * 0.16, y - s * 0.7, s * 0.26, s * 0.08, s * 0.04);
  c.fillStyle = '#3b6e8f';
  c.fill(); // rolled tent
  ellipse(c, x - s * 0.04, y - s * 0.76, s * 0.09, s * 0.045, '#f3efe6'); // pillow
  c.save();
  c.translate(x - s * 0.15, y - s * 0.42);
  c.rotate(Math.sin(t * 14) * 0.4);
  c.strokeStyle = '#3a3d45';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, s * 0.06);
  c.stroke();
  ellipse(c, 0, s * 0.1, s * 0.05, s * 0.04, '#9aa1ad'); // saucepan
  c.restore();
}

export default {
  id: 'rudy-escape',
  world: 'w03',
  input: 'hold',
  base: 4.5,
  min: 2.2,
  survive: false,
  verb: { en: 'RUN, JUMP!', fr: 'COURS, SAUTE !' },
  title: { en: 'Rudy’s great escape', fr: 'L’évasion de Rudy' },
  howto: {
    en: 'Dawn: Rudy sneaks out to live in the CRAPA woods. Hold to run beside the Clio, let go to jump in the open door!',
    fr: 'À l’aube, Rudy s’évade pour vivre dans les bois du CRAPA. Reste appuyé pour courir à côté d’la Clio, lâche pour sauter par la portière !',
  },
  winLine: { en: 'Free! Off to the CRAPA!', fr: 'Libre ! Direction eul’ CRAPA !' },
  rival: ['babar', 'mamar'],
  rivalLine: { en: 'His mum was making pancakes…', fr: 'Chez sa mère, y’avait des crêpes…' },
  loseLine: { en: 'Hoho… busted.', fr: 'Hoho… y’est pris.' },
  create(g) {
    const mate = g.friend();
    const roadY = g.H * 0.6; // the Clio's wheels
    const feetY = g.H * 0.85; // Rudy runs on the near side of the street
    const vc = 60 * g.speed; // the car rolls on
    const vr = 2 * vc; // Rudy running
    const jumpT = 0.38 / Math.sqrt(g.speed);
    const s = {
      t: 0,
      x: 64, // Rudy
      carX: 64 + 90 - DOOR * CAR, // the open door starts 90 px ahead of Rudy
      hold: false,
      jump: null, // { k, from, ok }
      inCar: false,
      fallen: false,
      light: 0,
      shout: false,
      gone: 0,
    };
    const doorX = () => s.carX + DOOR * CAR;

    function jump() {
      const ok = Math.abs(s.x - doorX()) < TOL;
      s.jump = { k: 0, from: s.x, ok, dx: doorX() - s.x };
      g.sfx.whoosh();
      if (ok) {
        g.sfx.good();
        g.win();
      } else {
        g.sfx.bad();
        g.lose();
      }
    }

    return {
      update(dt) {
        s.t += dt;
        // The car: rolls slowly, then speeds off once Rudy is in
        s.carX += (s.inCar ? vc * 4 : vc) * dt;
        if (s.fallen) s.light = Math.min(1, s.light + dt * 3);
        if (s.jump) {
          s.jump.k = Math.min(1, s.jump.k + dt / jumpT);
          if (s.jump.k >= 1 && !s.inCar && !s.fallen) {
            if (s.jump.ok) {
              s.inCar = true;
              g.fx.burst(doorX(), roadY - CAR * 0.2, { kind: 'confetti', n: 30 });
              g.say(s.carX + CAR * 0.07, roadY - CAR * 0.45, g.tr({ en: 'Free! Off to the CRAPA!', fr: 'Libre ! Direction eul’ CRAPA !' }), 1.2);
            } else {
              s.fallen = true;
              g.fx.shake(6);
              g.fx.text(s.x + 40, feetY - 60, g.tr({ en: 'SPLAT', fr: 'PAF' }), { size: 28, color: PAL.cream });
              g.say(90, g.H * 0.3, g.tr({ en: 'Rudy?! What are you doing?', fr: 'Rudy ?! Qu’est-ce que te fais ?' }), 1.4);
            }
          }
          return;
        }
        if (g.done) return;
        if (s.hold) s.x = Math.min(g.W - 30, s.x + vr * dt);
        // The open door is right there: the driver shouts
        if (!s.shout && Math.abs(s.x - doorX()) < TOL) {
          s.shout = true;
          g.say(Math.min(g.W - 90, s.carX + CAR * 0.07), roadY - CAR * 0.48, g.tr({ en: 'Jump!', fr: 'Saute !' }), 0.8);
        }
        // Gone without him
        if (doorX() > g.W - 30) {
          s.fallen = true;
          g.sfx.bad();
          g.lose();
        }
      },
      press() {
        if (g.done || s.jump) return;
        s.hold = true;
        g.sfx.tap();
      },
      release() {
        if (!s.hold || g.done || s.jump) return;
        s.hold = false;
        jump();
      },
      draw(c) {
        const { W, H } = g;
        // Dawn sky over the rooftops
        c.fillStyle = vgrad(c, 0, roadY, ['#2c3e70', '#8f6fa0', '#f6a38a', '#ffd59e']);
        c.fillRect(0, 0, W, roadY);
        circle(c, W * 0.82, roadY - CAR * 0.75, 34, 'rgba(255,236,170,0.9)');
        // Houses, shutters closed; Rudy's on the left, a knotted sheet hanging from his window
        const houses = [
          { x: -10, w: 170, h: 280, col: '#e9d6b8', roof: '#9b4a35' },
          { x: 170, w: 120, h: 240, col: '#d8c7b0', roof: '#7d4433' },
          { x: 300, w: 120, h: 260, col: '#e3cfae', roof: '#8a4c38' },
        ];
        const base = roadY - CAR * 0.3;
        for (const h of houses) {
          c.fillStyle = h.col;
          c.fillRect(h.x, base - h.h, h.w, h.h);
          c.fillStyle = h.roof;
          c.beginPath();
          c.moveTo(h.x - 10, base - h.h);
          c.lineTo(h.x + h.w / 2, base - h.h - 50);
          c.lineTo(h.x + h.w + 10, base - h.h);
          c.closePath();
          c.fill();
          for (let i = 0; i < Math.floor(h.w / 60); i++) {
            const wx = h.x + 20 + i * 60;
            rrect(c, wx, base - h.h + 40, 34, 46, 4);
            c.fillStyle = '#6f8fa8';
            c.fill();
            // shutters (closed, except Rudy's window)
            if (!(h === houses[0] && i === 1)) {
              c.fillStyle = '#5f7f5a';
              c.fillRect(wx, base - h.h + 40, 34, 46);
            }
          }
        }
        // Rudy's window: open, with the sheet rope; lights up if he gets caught
        const rw = { x: houses[0].x + 80, y: base - houses[0].h + 40 };
        rrect(c, rw.x, rw.y, 34, 46, 4);
        c.fillStyle = s.light > 0 ? `rgba(255,214,110,${0.5 + 0.5 * s.light})` : '#3a3448';
        c.fill();
        c.strokeStyle = '#f2efe6';
        c.lineWidth = 7;
        c.beginPath();
        c.moveTo(rw.x + 17, rw.y + 46);
        for (let i = 1; i <= 5; i++) c.lineTo(rw.x + 17 + Math.sin(s.t * 2 + i) * 3, rw.y + 46 + i * 30);
        c.stroke();
        for (let i = 1; i < 5; i++) circle(c, rw.x + 17 + Math.sin(s.t * 2 + i) * 3, rw.y + 46 + i * 30, 6, '#f2efe6');
        // Downstairs door light (the house wakes up)
        rrect(c, houses[0].x + 30, base - 80, 40, 80, 4);
        c.fillStyle = s.light > 0 ? `rgba(255,214,110,${0.5 + 0.5 * s.light})` : '#6b4a35';
        c.fill();
        // Hedge, sidewalk, road
        c.fillStyle = '#3f6b3e';
        c.fillRect(0, base - 26, W, 26);
        for (let i = 0; i < 14; i++) circle(c, i * 30 + 10, base - 24, 16, i % 2 ? '#3f6b3e' : '#4a7a47');
        c.fillStyle = '#b8b1a6';
        c.fillRect(0, base, W, roadY - base - 30);
        c.fillStyle = vgrad(c, roadY - 30, H, ['#6c6d78', '#53545e']);
        c.fillRect(0, roadY - 30, W, H - roadY + 30);
        c.fillStyle = 'rgba(255,255,255,0.65)';
        for (let i = 0; i < 6; i++) c.fillRect(i * 90 - 20, (roadY + feetY) / 2 - 20, 50, 6);

        // The Clio, back door open, the hero at the wheel
        const lean = Math.sin(s.t * 8) * 2;
        clio(c, s.carX, roadY, CAR, { t: s.t, spin: true, door: s.inCar ? 0 : 1, driver: g.hero, passenger: s.inCar ? null : mate, lean, feet: s.inCar });
        // Tell: the door glows green when Rudy is lined up with it
        const d = Math.abs(s.x - doorX());
        if (!g.done && !s.jump && d < TOL * 1.6) ellipse(c, doorX(), roadY - CAR * 0.15, 40, 34, `rgba(120,255,150,${0.45 * (1 - d / (TOL * 1.6))})`);

        // Rudy: running (held), standing (not), diving, or flat on the road
        if (!s.inCar) {
          if (s.jump && !s.fallen) {
            const k = s.jump.k;
            const tx = s.jump.ok ? doorX() : s.jump.from + 60;
            const ty = s.jump.ok ? roadY - CAR * 0.12 : feetY;
            const x = s.jump.from + (tx - s.jump.from) * k;
            const y = feetY + (ty - feetY) * k - Math.sin(k * Math.PI) * 70;
            c.save();
            c.translate(x, y);
            c.rotate(k * (s.jump.ok ? 1.2 : 1.5));
            bag(c, -6, 0, RUDY * (1 - k * 0.15), s.t);
            person(c, 'rudy', 0, 0, RUDY * (1 - k * 0.15), 'cheer', s.t);
            c.restore();
          } else if (s.fallen) {
            const x = s.jump ? s.jump.from + 60 : s.x;
            c.save();
            c.translate(x, feetY);
            c.rotate(Math.PI / 2);
            person(c, 'rudy', 0, 0, RUDY, 'sad', s.t);
            c.restore();
            text(c, '★', x - 40 + Math.cos(s.t * 8) * 20, feetY - 50, { size: 18, color: '#ffd84a', shadow: false });
          } else {
            bag(c, s.x - 8, feetY, RUDY, s.t);
            person(c, 'rudy', s.x, feetY, RUDY, s.hold ? 'run' : 'idle', s.t);
          }
        }
      },
      bot() {
        if (g.done || s.jump) return null;
        if (!s.hold) return { press: [200, 400] };
        if (Math.abs(s.x - doorX()) < 8) return { release: [200, 400] };
        return null;
      },
    };
  },
};
