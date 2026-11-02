// The "Eul' Flipper" screen inside the marathon app: input (screen halves =
// flippers, the right one pulls the plunger, swipe up = nudge), HUD, friends'
// speech bubbles, sounds, game over and its own high scores.

import * as art from '../marathon/art.js';
import { PAL } from '../marathon/art.js';
import { createFx } from '../marathon/fx.js';
import { createPinball } from './game.js';
import { createAutoplay } from './autoplay.js';
import { drawTable } from './render.js';
import { TABLE_H } from './table.js';

const HUD_H = 74;

// Where each friend sits on the table (for speech bubbles).
const SPOTS = {
  babar: [150, 150], mamar: [240, 150], romain: [195, 208], cous: [30, 474], violaine: [292, 318],
  aline: [44, 236], panda: [300, 724], victor: [76, 626], greg: [292, 626], eugenie: [340, 430],
};

export function createPinballScreen({ t, lang, sfx, hero, hat, quote, tease, auto = false }) {
  const fx = createFx();
  const bubbles = [];
  const banners = [];
  const sound = {
    flip: () => sfx.click(), flipHit: () => sfx.tap(), bumper: () => sfx.pop(), sling: () => sfx.tick(),
    target: () => sfx.coin(), croco: () => sfx.hit(), lane: () => sfx.coin(), orbit: () => sfx.whoosh(),
    spinner: () => sfx.tick(), lock: () => sfx.life(), multiball: () => sfx.speedup(), jackpot: () => sfx.best(),
    mission: () => sfx.good(), extra: () => sfx.life(), save: () => sfx.life(), drain: () => sfx.bad(),
    over: () => sfx.over(), launch: () => sfx.whoosh(), kick: () => sfx.pop(), saucer: () => sfx.pop(),
    kickback: () => sfx.whoosh(), skill: () => sfx.best(), nudge: () => sfx.hit(),
  };
  const lines = {
    cous: { old: { en: 'Old Cous!', fr: 'Old Cous !' }, new: { en: 'New Cous!', fr: 'New Cous !' } },
    aline: { lock: { en: 'Do it for the silo!', fr: 'Do it for the silo !' }, silo: { en: 'SILO!', fr: 'SILO !' } },
    babar: { boar: { en: 'Ah ben mon Romain… go, boar!', fr: 'Ah ben mon Romain… vas-y eul’ sanglier !' } },
    violaine: { mission: { en: 'Mission time, Tatou!', fr: 'Allez Tatou, mission !' } },
    panda: { win: { en: 'Hoho!', fr: 'Hoho !' }, merguez: { en: 'Hoho les merguez!', fr: 'Hoho les merguez !' } },
  };

  const game = createPinball({
    out: {
      sfx: (name) => sound[name]?.(),
      msg: (text, kind) => banners.push({ text: text[lang] ?? text.en, kind, t: 0 }),
      fx: (kind, x, y, p) => fx.text(x, y, `+${p.toLocaleString(lang)}`, { size: 16, color: PAL.mango, life: 0.8 }),
      say: (who, key) => {
        let id = who;
        let text;
        if (who === 'rival') {
          const others = Object.keys(SPOTS).filter((k) => k !== 'panda');
          id = others[Math.floor(Math.random() * others.length)];
          text = tease();
        } else if (lines[who]?.[key]) text = lines[who][key][lang] ?? lines[who][key].en;
        else text = quote(who);
        const [x, y] = SPOTS[id] || SPOTS.panda;
        bubbles.splice(0, bubbles.length, { x, y, text, t: 0 });
      },
    },
  });
  game.hat = hat;
  // Self-play (?pbauto): for tests and demos.
  const bot = auto ? createAutoplay(game) : null;

  const held = new Map(); // pointerId -> 'left' | 'right'
  const keys = { left: false, right: false };
  let nudge = false;
  let elapsed = 0;

  function layout(H) {
    const scale = Math.min(1, (H - HUD_H - 6) / TABLE_H);
    return { scale, ox: (400 - 400 * scale) / 2, oy: HUD_H };
  }

  return {
    game,
    /** kind: 'down' | 'move' | 'up'; x, y in stage units. */
    pointer(kind, id, x, y) {
      if (kind === 'down') held.set(id, { side: x < 200 ? 'left' : 'right', y0: y, t0: elapsed });
      else if (kind === 'move') {
        const h = held.get(id);
        if (h && h.y0 - y > 45 && elapsed - h.t0 < 0.3 && !h.nudged) {
          h.nudged = true;
          nudge = true;
        }
      } else held.delete(id);
    },
    key(code, down) {
      if (['ArrowLeft', 'ShiftLeft', 'KeyA', 'KeyQ', 'KeyZ'].includes(code)) keys.left = down;
      if (['ArrowRight', 'ShiftRight', 'KeyD', 'KeyM', 'ArrowDown', 'Space', 'KeyS'].includes(code)) keys.right = down;
      if (down && (code === 'ArrowUp' || code === 'KeyW')) nudge = true;
    },
    update(dt) {
      elapsed += dt;
      let left = keys.left;
      let right = keys.right;
      for (const h of held.values()) {
        if (h.side === 'left') left = true;
        else right = true;
      }
      game.update(dt, bot ? bot(dt) : { left, right, nudge });
      nudge = false;
      fx.update(dt);
      for (const b of banners) b.t += dt;
      while (banners.length && banners[0].t > (banners[0].kind === 'big' ? 2.2 : 1.8)) banners.shift();
      for (const b of bubbles) b.t += dt;
      if (bubbles.length && bubbles[0].t > 1.8) bubbles.shift();
    },
    draw(c, H, now) {
      const s = game.state;
      art.sky(c, 400, H, ['#160c33', '#0b2c45']);
      const { scale, ox, oy } = layout(H);
      c.save();
      c.translate(ox, oy);
      c.scale(scale, scale);
      c.save();
      c.beginPath();
      c.rect(0, 0, 400, TABLE_H);
      c.clip();
      drawTable(c, game, now, lang);
      fx.draw(c, 400, TABLE_H);
      for (const b of bubbles) art.bubble(c, b.text, b.x, b.y - 14, { size: 14, maxW: 220 });
      c.restore();
      c.restore();
      // HUD.
      art.text(c, s.score.toLocaleString(lang), 200, 26, { size: 30, color: '#fff' });
      art.text(c, `${t('pb.ball')} ${Math.min(s.ballNo, 3)}/3${s.extra ? ' +1' : ''}`, 92, 26, { size: 14, color: 'rgba(255,255,255,0.8)', weight: 600 });
      if (s.bonusX > 1) art.text(c, `x${s.bonusX}`, 350, 26, { size: 18, color: PAL.mango });
      if (s.ballSave > 0) art.text(c, '🛟', 330, 26, { size: 16, shadow: false });
      const banner = banners[0];
      if (banner) {
        const k = Math.min(1, banner.t * 6);
        c.save();
        c.globalAlpha = k;
        art.rrect(c, 14, 44, 372, 26, 13);
        c.fillStyle = banner.kind === 'big' ? PAL.hibiscus : 'rgba(255,255,255,0.14)';
        c.fill();
        c.restore();
        art.text(c, banner.text, 200, 58, { size: 15, color: '#fff', shadow: false, max: 360 });
      } else if (s.mission) {
        const m = s.mission;
        const label = `${m.def.title[lang] ?? m.def.title.en} · ${m.def.how[lang] ?? m.def.how.en} ${m.n}/${m.def.goal}`;
        art.rrect(c, 14, 44, 372, 26, 13);
        c.fillStyle = 'rgba(255,178,62,0.22)';
        c.fill();
        c.save();
        art.rrect(c, 14, 44, 372 * (m.t / 40), 26, 13);
        c.fillStyle = 'rgba(255,178,62,0.25)';
        c.fill();
        c.restore();
        art.text(c, label, 200, 58, { size: 12, color: '#fff', shadow: false, max: 360 });
      } else if (s.plunger.ready) {
        art.text(c, t('pb.launch'), 200, 58, { size: 13, color: 'rgba(255,255,255,0.85)', shadow: false, max: 370 });
      } else {
        art.text(c, t('pb.hint'), 200, 58, { size: 12, color: 'rgba(255,255,255,0.6)', shadow: false, max: 370 });
      }
      // End-of-ball bonus card.
      if (s.endBonus) {
        const e = s.endBonus;
        c.save();
        c.fillStyle = 'rgba(12, 8, 30, 0.82)';
        art.rrect(c, 50, H * 0.3, 300, 230, 22);
        c.fill();
        c.restore();
        art.text(c, t('pb.bonus'), 200, H * 0.3 + 30, { size: 24, color: PAL.mango });
        e.lines.forEach(([label, v], i) => {
          if (e.t > 0.2 + i * 0.25) {
            art.text(c, label[lang] ?? label.en, 90, H * 0.3 + 66 + i * 26, { size: 15, color: '#fff', align: 'left', shadow: false });
            art.text(c, v.toLocaleString(lang), 310, H * 0.3 + 66 + i * 26, { size: 15, color: '#fff', align: 'right', shadow: false });
          }
        });
        if (e.t > 1.6) art.text(c, `x${e.bonusX} = ${e.total.toLocaleString(lang)}`, 200, H * 0.3 + 205, { size: 22, color: PAL.mango });
      }
    },
  };
}
