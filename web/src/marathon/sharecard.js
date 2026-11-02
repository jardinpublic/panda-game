// The score card shared on WhatsApp: a 1080x1350 picture of the run (hero,
// score, the game and how far, the gang) drawn with the game's own art kit.
// Used by PandAventures, Eul' Flipper and 103 RCX.

import * as art from './art.js';
import { PAL, CAST_IDS } from './art.js';

const W = 400;
const H = 500;
const SCALE = 2.7; // 1080 x 1350 pixels

/**
 * Draws the card and resolves a PNG File. run: {score, scoreText (the score as
 * shown, optional), reached (the line under it), best (new record?), record,
 * hero, hat, url}.
 */
export function makeShareCard(run) {
  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const c = canvas.getContext('2d');
  c.scale(SCALE, SCALE);

  // Sunset backdrop with rays, madras bands and a few hibiscus.
  art.sky(c, W, H, ['#ff9a6b', '#ff6f61', '#c2306f']);
  c.save();
  c.translate(W / 2, H * 0.36);
  c.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 12; i++) {
    c.rotate(Math.PI / 6);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(-36, -H);
    c.lineTo(36, -H);
    c.fill();
  }
  c.restore();
  art.madrasBand(c, -10, 0, W + 20, 14, 0.4);
  art.madrasBand(c, -10, H - 14, W + 20, 14, 0.4);
  for (let i = 0; i < 7; i++) art.hibiscus(c, 30 + i * 58, 70 + (i % 2) * 210, 9 + (i % 3) * 3, i, 'rgba(255,255,255,0.18)');

  // Title.
  art.text(c, 'PandAventures', W / 2, 46, { size: 40, color: '#fff', stroke: PAL.hibiscus });

  // The score.
  art.text(c, run.scoreText || String(run.score), W / 2, 112, { size: 72, color: '#fff7c2', stroke: 'rgba(120,20,60,0.55)', max: W - 36 });
  art.text(c, run.reached, W / 2, 162, { size: 22, color: '#fff', weight: 600, max: W - 36 });
  if (run.best) {
    art.rrect(c, W / 2 - 92, 180, 184, 34, 17);
    c.fillStyle = PAL.mango;
    c.fill();
    art.text(c, `🏆 ${run.record}`, W / 2, 198, { size: 18, color: '#5a3200', shadow: false });
  }

  // The gang behind the hero.
  const others = CAST_IDS.filter((id) => id !== run.hero);
  others.forEach((id, i) => {
    const x = 26 + i * (348 / (others.length - 1));
    const y = 262 + (i % 2) * 18;
    art.head(c, id, x, y, 62);
  });

  // The hero, big and happy.
  art.person(c, run.hero, W / 2, H - 34, 230, 'cheer', 0.4, { hat: run.hat });
  art.text(c, 'Hoho !', W / 2 + 92, H - 200, { size: 26, color: '#fff', stroke: PAL.palm });

  // Where to play.
  art.text(c, run.url.replace(/^https?:\/\//, '').replace(/\/$/, ''), W / 2, H - 26, { size: 13, color: '#fff', weight: 600 });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(new File([blob], 'pandadventures.png', { type: 'image/png' })) : reject(new Error('no image'))), 'image/png');
  });
}
