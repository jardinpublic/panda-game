// Spear (world 4, lagoon dive): fish cross the lagoon at different depths.
// TAP to fire the spear gun straight up when the lionfish (invasive, the
// target) crosses the aim line. Never shoot the sea turtle (protected).
// Small reef fish dart out of the way; a lemon shark cruises far behind.

import { scene, person, rrect, circle, ellipse, PAL, text, shadowed } from '../art.js';

const AIM_X = 200;
const TOL = 12; // extra reach either side of the spear shaft

/** Lionfish facing +x: striped body, fanned venomous spines. */
function lionfish(c, t, glow = 0) {
  if (glow > 0) {
    const g = c.createRadialGradient(0, 0, 4, 0, 0, 80);
    g.addColorStop(0, `rgba(255,90,90,${0.45 * glow})`);
    g.addColorStop(1, 'rgba(255,90,90,0)');
    c.fillStyle = g;
    c.fillRect(-80, -80, 160, 160);
  }
  // Spines (dorsal fan and pectoral fans).
  c.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * 0.95 + i * 0.13 + Math.sin(t * 4 + i) * 0.03;
    c.strokeStyle = i % 2 ? '#fff1e6' : '#c8382f';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-6 + i * 3, -10);
    c.lineTo(-6 + i * 3 + Math.cos(a) * 40, -10 + Math.sin(a) * 40);
    c.stroke();
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const a = Math.PI * 0.62 + side * 0.15 + i * 0.12 + Math.sin(t * 5 + i) * 0.05;
      c.strokeStyle = i % 2 ? 'rgba(255,230,220,0.85)' : 'rgba(210,70,60,0.85)';
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(4, 6);
      c.lineTo(4 + Math.cos(a) * 36, 6 + Math.sin(a) * 34 * (side > 0 ? 1 : 0.7));
      c.stroke();
    }
  }
  // Tail.
  ellipse(c, -38, 0, 14, 12, '#e8a090', Math.sin(t * 9) * 0.2);
  // Striped body.
  c.save();
  c.beginPath();
  c.ellipse(0, 0, 34, 17, 0, 0, Math.PI * 2);
  c.clip();
  c.fillStyle = '#fff1e6';
  c.fillRect(-36, -18, 72, 36);
  c.fillStyle = '#c8382f';
  for (let x = -34; x < 36; x += 9) c.fillRect(x, -18, 4.5, 36);
  c.fillStyle = 'rgba(255,255,255,0.25)';
  c.fillRect(-34, -18, 70, 10);
  c.restore();
  circle(c, 22, -4, 4, '#1e1a33');
  circle(c, 23, -5, 1.3, '#ffffff');
}

/** Hawksbill-ish sea turtle facing +x. */
function turtle(c, t) {
  const f = Math.sin(t * 4) * 0.45;
  for (const [x, y, side] of [[22, -16, -1], [22, 16, 1], [-24, -12, -1], [-24, 12, 1]]) {
    ellipse(c, x + 6, y + side * 6, x > 0 ? 26 : 14, 8, '#7aa86a', side * (0.6 + f * (x > 0 ? 1 : 0.5)));
  }
  ellipse(c, 50, 0, 14, 11, '#8cbc78');
  circle(c, 56, -4, 2.5, '#1e1a33');
  const g = c.createRadialGradient(-6, -8, 2, 0, 0, 44);
  g.addColorStop(0, '#c9a35a');
  g.addColorStop(1, '#6e4f22');
  ellipse(c, 0, 0, 40, 28, g);
  c.strokeStyle = 'rgba(255,230,170,0.45)';
  c.lineWidth = 2;
  for (const [x, y] of [[-14, -8], [8, -10], [-12, 10], [10, 9], [-1, 0]]) {
    c.beginPath();
    c.ellipse(x, y, 9, 7, 0, 0, Math.PI * 2);
    c.stroke();
  }
}

/** Small reef fish facing +x (blue tang or yellowtail snapper). */
function reefFish(c, t, kind) {
  const body = kind ? '#2f6fe0' : '#ffd166';
  const fin = kind ? '#ffd23f' : '#ff9f43';
  c.fillStyle = fin;
  c.beginPath();
  c.moveTo(-16, 0);
  c.lineTo(-28, -10 + Math.sin(t * 12) * 3);
  c.lineTo(-28, 10 + Math.sin(t * 12) * 3);
  c.fill();
  ellipse(c, 0, 0, 20, 11, body);
  ellipse(c, -2, -4, 12, 4, 'rgba(255,255,255,0.3)');
  circle(c, 11, -3, 2.5, '#1e1a33');
}

/** A big soft lemon shark silhouette, far away. */
function shark(c, t) {
  c.fillStyle = 'rgba(200,190,120,0.28)';
  c.beginPath();
  c.moveTo(110, 0);
  c.quadraticCurveTo(60, -30, -80, -6);
  c.lineTo(-130, -34 + Math.sin(t * 3) * 6);
  c.lineTo(-118, 0);
  c.lineTo(-130, 30 + Math.sin(t * 3) * 6);
  c.lineTo(-80, 8);
  c.quadraticCurveTo(60, 26, 110, 0);
  c.fill();
  c.beginPath();
  c.moveTo(10, -18);
  c.lineTo(-14, -56);
  c.lineTo(-30, -14);
  c.fill();
}

export default {
  id: 'spear',
  world: 'w04',
  input: 'tap',
  base: 5,
  min: 2,
  survive: false,
  verb: { en: 'SPEAR THE LIONFISH!', fr: 'HARPONNE LE POISSON-LION !' },
  title: { en: "Lionfish hunt", fr: "Chasse au poisson-lion" },
  howto: { en: "Tap to fire when the lionfish crosses the line. Never shoot the turtle!", fr: "Touche pour tirer quand le poisson-lion passe la ligne. Jamais la tortue !" },
  winLine: { en: "Lionfish for dinner!", fr: "Poisson-lion au dîner !" },
  create(g) {
    const buddy = g.friend();
    const heroY = g.H * 0.9;
    const gunTop = heroY - 205;
    const v = 125 * g.speed;
    const D = g.duration;
    const yMin = 130;
    const yMax = gunTop - 60;
    const depth = () => yMin + g.random() * (yMax - yMin);
    // Each fish crosses the aim line at time `at`: x(t) = AIM_X + dir * speed * (t - at).
    const fish = [];
    const lionAt = D * (0.38 + g.random() * 0.2);
    const lion = { kind: 'lion', hw: 38, hh: 30, y: depth(), dir: g.random() < 0.5 ? 1 : -1, sp: v, at: lionAt };
    fish.push(lion);
    // The turtle crosses clearly before or after the lionfish, never on top of it.
    const turtleSp = v * 0.7;
    const sep = (40 + 38 + 2 * TOL) / turtleSp + 0.2 / g.speed;
    const tAt = g.random() < 0.5 ? lionAt - sep - g.random() * 0.15 : lionAt + sep + g.random() * 0.2;
    fish.push({ kind: 'turtle', hw: 40, hh: 28, y: depth(), dir: g.random() < 0.5 ? 1 : -1, sp: turtleSp, at: tAt });
    for (let i = 0; i < 3; i++) {
      fish.push({ kind: 'reef', variant: i % 2, hw: 20, hh: 12, y: depth(), dir: g.random() < 0.5 ? 1 : -1, sp: v * (1.1 + g.random() * 0.4), at: D * (0.15 + g.random() * 0.8) });
    }
    for (const f of fish) {
      f.x = AIM_X - f.dir * 9999;
      f.dart = 0;
      f.stuck = false;
    }
    const s = { t: 0, spear: null, reload: 0, recoil: 0, sharkX: -160, ended: false };
    const reloadT = 0.45 / g.speed;

    function position(f) {
      return AIM_X + f.dir * f.sp * (s.t - f.at);
    }

    /** First fish on the aim line from the gun upwards (lion/turtle block the shot). */
    function onLine() {
      return fish
        .filter((f) => !f.stuck && f.kind !== 'reef' && Math.abs(f.x - AIM_X) < f.hw + TOL && f.y < gunTop)
        .sort((a, b) => b.y - a.y)[0];
    }

    return {
      update(dt) {
        s.t += dt;
        s.reload = Math.max(0, s.reload - dt);
        s.recoil = Math.max(0, s.recoil - dt * 4);
        s.sharkX += dt * 30;
        if (s.sharkX > 560) s.sharkX = -160;
        for (const f of fish) {
          if (f.stuck) continue;
          if (g.done && f.kind !== 'reef') {
            // Freeze the threats once decided, let them drift off slowly.
            f.x += f.dir * f.sp * 0.25 * dt;
            continue;
          }
          f.x = position(f);
          if (f.dart > 0) {
            f.dart -= dt;
            f.y -= 220 * dt;
          }
        }
        if (s.spear) {
          s.spear.k = Math.min(1, s.spear.k + dt / 0.1);
          if (s.spear.k >= 1 && s.spear.miss) {
            s.spear.back += dt / reloadT;
            if (s.spear.back >= 1) s.spear = null;
          }
        }
        if (!g.done && s.t > lion.at + (lion.hw + TOL + 30) / lion.sp && !s.ended) {
          // The lionfish is gone: nothing left to shoot.
          s.ended = true;
          g.say(AIM_X, gunTop - 20, g.tr({ en: 'It got away!', fr: 'Il s\'est barré !' }), 1.4);
          g.sfx.bad();
          g.lose();
        }
      },
      press() {
        if (s.spear || s.reload > 0) return;
        s.recoil = 1;
        g.sfx.whoosh();
        const target = onLine();
        // Reef fish near the shaft dart away (no harm done).
        for (const f of fish) {
          if (f.kind === 'reef' && Math.abs(f.x - AIM_X) < f.hw + 40) {
            f.dart = 0.4;
            g.fx.burst(f.x, f.y, { kind: 'drop', n: 6, colors: ['#ffffff', '#bff4ff'], speed: 120 });
          }
        }
        if (!target) {
          s.spear = { k: 0, toY: 60, miss: true, back: 0 };
          s.reload = reloadT;
          return;
        }
        target.stuck = true;
        target.hitDx = target.x - AIM_X;
        s.spear = { k: 0, toY: target.y, miss: false, back: 0, fish: target };
        if (target.kind === 'lion') {
          g.sfx.hit();
          g.sfx.good();
          g.fx.burst(AIM_X, target.y, { kind: 'spark', n: 18, colors: [PAL.mango, '#fff3c4', PAL.coral], speed: 240 });
          g.fx.text(AIM_X, target.y - 50, g.tr({ en: 'Invader down!', fr: 'Envahisseur KO !' }), { size: 26, color: PAL.mango });
          g.say(330, heroY - 170, g.tr({ en: 'Hoho! Lionfish acras!', fr: 'Hoho ! Acras de poisson-lion !' }), 1.4);
          g.win();
        } else {
          g.sfx.bad();
          g.fx.shake(12);
          g.fx.flash('rgba(255,80,80,0.35)', 0.2);
          g.fx.burst(AIM_X, target.y, { kind: 'drop', n: 18, colors: ['#ffffff', '#bff4ff'] });
          g.say(330, heroY - 170, g.tr({ en: 'Not the turtle!!', fr: 'Pas la tortue !!' }), 1.6);
          g.lose();
        }
      },
      draw(c) {
        scene.lagoon(c, g.W, g.H, s.t);
        c.save();
        c.translate(s.sharkX, g.H * 0.22);
        shark(c, s.t);
        c.restore();
        // Aim line: glows red while the lionfish is on it.
        const lionOn = !lion.stuck && Math.abs(lion.x - AIM_X) < lion.hw + TOL;
        c.save();
        c.strokeStyle = lionOn ? 'rgba(255,120,110,0.85)' : 'rgba(255,255,255,0.35)';
        c.lineWidth = lionOn ? 4 : 2;
        c.setLineDash([12, 10]);
        c.lineDashOffset = -s.t * 60;
        c.beginPath();
        c.moveTo(AIM_X, gunTop);
        c.lineTo(AIM_X, 90);
        c.stroke();
        c.restore();
        // Fish.
        for (const f of fish) {
          if (f.x < -120 || f.x > 520) continue;
          c.save();
          const fx = f.stuck ? AIM_X + f.hitDx * 0.3 : f.x;
          c.translate(fx, f.y);
          if (f.dir < 0) c.scale(-1, 1);
          if (f.stuck) c.rotate(Math.sin(s.t * 20) * 0.1);
          if (f.kind === 'lion') lionfish(c, s.t, lionOn && !g.done ? 0.6 + 0.4 * Math.sin(s.t * 14) : 0);
          else if (f.kind === 'turtle') turtle(c, s.t);
          else reefFish(c, s.t, f.variant);
          c.restore();
          if (f.kind === 'turtle' && !g.done) text(c, '🚫', fx, f.y - 42, { size: 18, shadow: false });
        }
        // Spear.
        if (s.spear) {
          const sp = s.spear;
          const back = sp.miss ? Math.min(1, sp.back) : 0;
          const tipY = gunTop + (sp.toY - gunTop) * sp.k * (1 - back);
          c.strokeStyle = '#e6edf2';
          c.lineWidth = 4;
          c.lineCap = 'round';
          c.beginPath();
          c.moveTo(AIM_X, Math.min(gunTop, tipY + 120));
          c.lineTo(AIM_X, tipY);
          c.stroke();
          c.fillStyle = '#ffffff';
          c.beginPath();
          c.moveTo(AIM_X, tipY - 14);
          c.lineTo(AIM_X - 7, tipY + 4);
          c.lineTo(AIM_X + 7, tipY + 4);
          c.fill();
          c.strokeStyle = 'rgba(255,255,255,0.5)';
          c.lineWidth = 1.5;
          c.beginPath();
          c.moveTo(AIM_X, gunTop);
          c.lineTo(AIM_X + Math.sin(s.t * 10) * 6, tipY + 60);
          c.stroke();
          if (sp.k < 1) for (let i = 1; i < 4; i++) circle(c, AIM_X + (i % 2 ? 6 : -6), tipY + i * 30, 3 + i, 'rgba(255,255,255,0.4)');
        }
        // Buddy diver on the side.
        const bob = Math.sin(s.t * 2) * 5;
        const bpose = g.done ? (g.won ? 'cheer' : 'sad') : 'point';
        person(c, buddy, 335, heroY - 10 + bob, 140, bpose, s.t + 2, { flip: true });
        // Hero with the spear gun, pointing up.
        const rec = s.recoil * 10;
        person(c, g.hero, AIM_X, heroY + rec * 0.3, 160, g.done ? (g.won ? 'cheer' : 'sad') : 'idle', s.t, { hat: g.hat });
        shadowed(c, () => {
          rrect(c, AIM_X - 9, gunTop + rec, 18, 140, 8);
          c.fillStyle = '#2b3442';
          c.fill();
          rrect(c, AIM_X - 13, gunTop + 100 + rec, 26, 30, 8);
          c.fillStyle = '#8a5a34';
          c.fill();
        }, 8, 3);
        circle(c, AIM_X, gunTop + rec, 7, PAL.coral);
        if (!s.spear && s.reload <= 0 && !g.done) {
          c.strokeStyle = '#e6edf2';
          c.lineWidth = 4;
          c.beginPath();
          c.moveTo(AIM_X, gunTop + 40);
          c.lineTo(AIM_X, gunTop - 26);
          c.stroke();
        }
        if (!g.done) text(c, '👆', 300, g.H - 90, { size: 30, shadow: false });
      },
      bot() {
        if (s.spear || s.reload > 0) return null;
        const t = onLine();
        if (t && t.kind === 'lion' && Math.abs(lion.x - AIM_X) < lion.hw * 0.6) return { press: [AIM_X, g.H * 0.5] };
        return null;
      },
    };
  },
};
