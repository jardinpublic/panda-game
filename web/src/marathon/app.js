// Pandadventures marathon: mobile-portrait shell. Home (the gang on the
// beach), the run (between-screen -> order -> micro-game -> outcome, faster
// and faster, 3 lives, boss every 10th), game over, shop and missions.
//
// Debug URLs: ?game=<id> plays only that micro-game, ?level=N starts at game N
// (faster), ?boss forces bosses, ?coins=N gives coins. window.__m drives it in tests.

import './marathon.css';
import { GAMES, BOSSES } from './games/index.js';
import { createMarathon } from './rules.js';
import { startMicro } from './micro.js';
import { createFx } from './fx.js';
import * as art from './art.js';
import { PAL, CAST_IDS } from './art.js';
import { sfx, unlock, startGroove, setGroove, stopGroove, setMuted, isMuted } from './sound.js';
import { loadMeta, saveMeta, refillMissions, applyRun, buy, HEROES, HATS } from './meta.js';
import { t, locale, toggleLocale } from '../core/i18n.js';
import './texts.js';

const params = new URLSearchParams(location.search);
const DEBUG_GAME = params.get('game');
const START_LEVEL = Number(params.get('level') || 0);
const FORCE_BOSS = params.has('boss');
const ALL_DEFS = [...GAMES, ...BOSSES];
const byId = (id) => ALL_DEFS.find((d) => d.id === id);

// ---- DOM ------------------------------------------------------------------------

document.body.textContent = '';
const root = el('div', 'm-root', document.body);
const phone = el('div', 'm-phone', root);
const canvas = el('canvas', 'm-canvas', phone);
const ui = el('div', 'm-ui', phone);
const c = canvas.getContext('2d');

function el(tag, cls, parent, html) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html != null) node.innerHTML = html;
  if (parent) parent.appendChild(node);
  return node;
}

// ---- state ----------------------------------------------------------------------

const A = {
  screen: 'home', // home | run | over
  W: 400,
  H: 800,
  scale: 1,
  t: 0,
  meta: loadMeta(),
  fx: createFx(),
  run: null,
  paused: false,
  cameoOrder: [],
};
if (params.get('coins')) A.meta.coins = Number(params.get('coins'));
A.meta = refillMissions(A.meta, pickGameId);
saveMeta(A.meta);

function pickGameId() {
  return GAMES[Math.floor(Math.random() * GAMES.length)]?.id || 'spit';
}

function resize() {
  const rect = phone.getBoundingClientRect();
  const dpr = Math.min(2.5, window.devicePixelRatio || 1);
  A.scale = rect.width / 400;
  A.H = Math.round(Math.min(900, Math.max(640, rect.height / A.scale)));
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${A.H * A.scale}px`;
  canvas.style.top = `${Math.max(0, (rect.height - A.H * A.scale) / 2)}px`;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(A.H * A.scale * dpr);
  A.dpr = dpr;
}
window.addEventListener('resize', resize);
resize();

// ---- input ----------------------------------------------------------------------

const touch = { id: null, x0: 0, y0: 0, t0: 0, swiped: false };

function toLogical(e) {
  const r = canvas.getBoundingClientRect();
  return [((e.clientX - r.left) / r.width) * 400, ((e.clientY - r.top) / r.height) * A.H];
}

function micro() {
  return A.run && A.run.phase === 'play' ? A.run.micro : null;
}

canvas.addEventListener('pointerdown', (e) => {
  unlock();
  canvas.setPointerCapture?.(e.pointerId);
  const [x, y] = toLogical(e);
  Object.assign(touch, { id: e.pointerId, x0: x, y0: y, t0: performance.now(), swiped: false });
  micro()?.input('press', x, y);
  e.preventDefault();
});
canvas.addEventListener('pointermove', (e) => {
  if (touch.id !== e.pointerId) return;
  const [x, y] = toLogical(e);
  micro()?.input('move', x, y);
  const dx = x - touch.x0;
  const dy = y - touch.y0;
  if (!touch.swiped && Math.hypot(dx, dy) > 34) {
    touch.swiped = true;
    const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    micro()?.input('swipe', dir);
  }
});
const up = (e) => {
  if (touch.id !== e.pointerId) return;
  const [x, y] = toLogical(e);
  touch.id = null;
  micro()?.input('release', x, y);
};
canvas.addEventListener('pointerup', up);
canvas.addEventListener('pointercancel', up);

const KEY_SWIPE = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down', KeyQ: 'left', KeyZ: 'up' };
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  unlock();
  if (KEY_SWIPE[e.code]) micro()?.input('swipe', KEY_SWIPE[e.code]);
  if (e.code === 'Space' || e.code === 'Enter') {
    if (A.screen === 'run') micro()?.input('press', 200, A.H * 0.55);
    else if (A.screen !== 'run' && !document.querySelector('.m-sheet')) startRun();
    e.preventDefault();
  }
  if (e.code === 'Escape' && A.screen === 'run') togglePause();
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'Space' || e.code === 'Enter') micro()?.input('release', 200, A.H * 0.55);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && A.screen === 'run' && !A.paused) togglePause();
});

// ---- run ------------------------------------------------------------------------

function shuffled(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Next friend to cameo on the between-screen: cycles so everyone shows up. */
function nextCameo() {
  if (!A.cameoOrder.length) A.cameoOrder = shuffled(CAST_IDS.filter((id) => id !== A.meta.hero));
  return A.cameoOrder.pop();
}

function startRun() {
  unlock();
  sfx.click();
  const pool = DEBUG_GAME ? [DEBUG_GAME] : GAMES.map((d) => d.id);
  const m = createMarathon({ pool });
  m.level = START_LEVEL;
  A.run = { m, phase: 'between', phaseT: 0, first: true, micro: null, last: null, banner: null, cameo: nextCameo(), quote: '', lifeLostT: 9, lifeGainT: 9, prevLives: m.lives, outcomeWord: '' };
  A.fx.clear();
  A.screen = 'run';
  A.paused = false;
  prepareBetween();
  startGroove(96, 0.4);
  renderUI();
}

function prepareBetween() {
  const r = A.run;
  r.phase = 'between';
  r.phaseT = 0;
  r.boss = !DEBUG_GAME && (FORCE_BOSS || r.m.isBoss()) && BOSSES.length > 0;
  if (DEBUG_GAME && byId(DEBUG_GAME)?.boss) r.boss = true;
  r.banner = r.boss ? 'boss' : r.m.level > 0 && r.m.level % 5 === 0 && r.last ? 'faster' : null;
  if (r.banner === 'boss') sfx.boss();
  else if (r.banner === 'faster') sfx.speedup();
  r.cameo = nextCameo();
  r.quote = t(`quote_${r.cameo}`);
  r.betweenLen = r.first ? 1.7 : Math.max(0.9, Math.min(1.5, 1.45 / Math.sqrt(r.m.speed()))) + (r.banner ? 0.5 : 0);
  setGroove(92 + (r.m.speed() - 1) * 46, Math.min(1, 0.3 + r.m.level * 0.03));
}

function startMicroGame() {
  const r = A.run;
  let def;
  if (r.boss) {
    def = DEBUG_GAME ? byId(DEBUG_GAME) : BOSSES[Math.floor(Math.random() * BOSSES.length)];
    r.m.current = def.id;
  } else {
    def = byId(r.m.next());
  }
  r.def = def;
  r.micro = startMicro(def, {
    W: 400,
    H: A.H,
    speed: r.m.speed(),
    boss: r.boss,
    random: Math.random,
    hero: A.meta.hero,
    hat: A.meta.hat,
    friends: CAST_IDS,
    lang: locale(),
    fx: A.fx,
    sfx,
    level: r.m.level,
  });
  r.phase = 'play';
  r.phaseT = 0;
  r.first = false;
  r.lastTick = 99;
}

function finishMicroGame() {
  const r = A.run;
  const won = r.micro.g.won;
  r.prevLives = r.m.lives;
  r.m.report(won);
  r.last = won ? 'win' : 'lose';
  r.outcomeWord = t(won ? 'm.win' : 'm.lose');
  r.phase = 'outcome';
  r.phaseT = 0;
  if (won) {
    sfx.coin();
    A.fx.text(70, 70, `+${10 * r.m.multiplier()}`, { size: 26, color: PAL.mango });
    if (r.boss) {
      r.m.heal();
      r.m.coins += 5;
      r.lifeGainT = 0;
      sfx.life();
    }
  } else {
    r.lifeLostT = 0;
    A.fx.flash('rgba(239, 45, 107, 0.35)', 0.25);
  }
}

function gameOver() {
  const r = A.run;
  const res = applyRun(A.meta, { level: r.m.level, bestStreak: r.m.bestStreak, coins: r.m.coins, score: r.m.score, stats: r.m.stats });
  A.meta = refillMissions(res.meta, pickGameId);
  saveMeta(A.meta);
  r.result = res;
  A.screen = 'over';
  setGroove(84, 0.2);
  if (res.newBest && r.m.score > 0) sfx.best();
  else sfx.over();
  if (res.newBest && r.m.score > 0) A.fx.burst(200, A.H * 0.3, { kind: 'petal', n: 30, speed: 320 });
  renderUI();
}

function togglePause() {
  if (A.screen !== 'run') return;
  A.paused = !A.paused;
  if (A.paused) stopGroove();
  else startGroove(92 + (A.run.m.speed() - 1) * 46, 0.5);
  renderUI();
}

function update(dt) {
  A.t += dt;
  if (A.screen === 'run' && !A.paused) {
    const r = A.run;
    r.phaseT += dt;
    r.lifeLostT += dt;
    r.lifeGainT += dt;
    if (r.phase === 'between' && r.phaseT >= r.betweenLen) startMicroGame();
    else if (r.phase === 'play') {
      r.micro.step(dt);
      const left = r.micro.g.left;
      if (left < 1.05 && !r.micro.g.done) {
        const tick = Math.ceil(left / 0.25);
        if (tick !== r.lastTick) {
          r.lastTick = tick;
          sfx.tick(left < 0.5);
        }
      }
      if (r.micro.g.done) finishMicroGame();
    } else if (r.phase === 'outcome') {
      r.micro.step(dt);
      if (r.phaseT >= 0.8) {
        if (r.m.isOver()) gameOver();
        else prepareBetween();
      }
    }
  }
  A.fx.update(dt);
}

// ---- drawing --------------------------------------------------------------------

const BG = [
  ['#16c6c9', '#0a6d93'],
  ['#ff7b54', '#ef2d6b'],
  ['#ffb23e', '#ff6f61'],
  ['#7c3aed', '#2a1559'],
  ['#2bc48a', '#0a7f9e'],
];

function draw() {
  c.setTransform(A.dpr * A.scale, 0, 0, A.dpr * A.scale, 0, 0);
  c.clearRect(0, 0, 400, A.H);
  const [ox, oy] = A.fx.offset();
  c.save();
  c.translate(ox, oy);
  if (A.screen === 'home') drawHome();
  else if (A.screen === 'run') drawRun();
  else drawOverBg();
  c.restore();
  A.fx.draw(c, 400, A.H);
}

function drawHome() {
  const H = A.H;
  art.scene.beach(c, 400, H, A.t, { horizon: 0.42, shore: 0.55 });
  const others = CAST_IDS.filter((id) => id !== A.meta.hero);
  const spots = [
    [48, 0.63, 118, 'dance'], [352, 0.63, 118, 'idle'], [100, 0.6, 104, 'cheer'], [300, 0.6, 104, 'dance'],
    [150, 0.585, 92, 'idle'], [250, 0.585, 92, 'cheer'], [30, 0.74, 140, 'idle'], [370, 0.74, 140, 'dance'], [200, 0.575, 86, 'dance'],
  ];
  const order = spots.map((s, i) => ({ s, id: others[i] })).filter((x) => x.id).sort((a, b) => a.s[1] - b.s[1]);
  for (const { s, id } of order) art.person(c, id, s[0], H * s[1], s[2], s[3], A.t + s[0], { flip: s[0] > 200 });
  art.person(c, A.meta.hero, 200, H * 0.76, 230, 'idle', A.t, { hat: A.meta.hat });
}

function stageBg(level) {
  const H = A.H;
  const [a, b] = BG[Math.floor(level / 3) % BG.length];
  const g = c.createRadialGradient(200, H * 0.35, 20, 200, H * 0.45, H * 0.8);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  c.fillStyle = g;
  c.fillRect(0, 0, 400, H);
  // Slow rotating sun rays.
  c.save();
  c.translate(200, H * 0.3);
  c.rotate(A.t * 0.15);
  c.fillStyle = 'rgba(255,255,255,0.07)';
  for (let i = 0; i < 12; i++) {
    c.rotate(Math.PI / 6);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(-40, -H);
    c.lineTo(40, -H);
    c.fill();
  }
  c.restore();
  // Two madras ribbons.
  c.save();
  c.globalAlpha = 0.9;
  c.translate(0, H * 0.53);
  c.rotate(-0.12);
  art.madrasBand(c, -40, 0, 480, 16, 0.4);
  c.restore();
  for (let i = 0; i < 6; i++) art.hibiscus(c, (i * 83 + A.t * 12) % 440 - 20, H * 0.12 + ((i * 131) % (H * 0.3)), 9 + (i % 3) * 3, A.t * 0.5 + i, 'rgba(255,255,255,0.18)');
}

function drawLives(x, y, size, lives, lostT, gainT) {
  for (let i = 0; i < 3; i++) {
    const alive = i < lives;
    const justLost = i === lives && lostT < 0.8;
    const justGained = i === lives - 1 && gainT < 0.6;
    let s = size;
    let yy = y;
    let alpha = 1;
    if (justLost) {
      yy += lostT * lostT * 220;
      alpha = 1 - lostT / 0.8;
    }
    if (justGained) s *= 1 + Math.sin(gainT * 10) * 0.3;
    const xx = x + (i - 1) * size * 2.3;
    if (!alive && !justLost) {
      art.hibiscus(c, xx, y, s, 0, 'rgba(255,255,255,0.25)');
      continue;
    }
    c.globalAlpha = alpha;
    art.hibiscus(c, xx, yy, s, justLost ? lostT * 6 : Math.sin(A.t * 2 + i) * 0.15);
    c.globalAlpha = 1;
  }
}

function drawRun() {
  const r = A.run;
  const H = A.H;
  if (r.phase === 'between') {
    drawBetween(r);
    return;
  }
  r.micro.draw(c);
  drawHud(r);
  if (r.phase === 'play') drawOrder(r);
  if (r.phase === 'outcome') drawOutcome(r);
  void H;
}

function drawBetween(r) {
  const H = A.H;
  const k = r.phaseT;
  stageBg(r.m.level);
  // Medallion with the next game number.
  const pop = Math.min(1, k * 5);
  const s = 0.6 + 0.4 * easeOutBack(pop);
  c.save();
  c.translate(200, H * 0.27);
  c.scale(s, s);
  art.shadowed(c, () => art.circle(c, 0, 0, 74, 'rgba(255,255,255,0.95)'), 26, 10);
  art.circle(c, 0, 0, 62, r.boss ? PAL.night : PAL.cream);
  art.text(c, t('m.game'), 0, -28, { size: 16, color: r.boss ? PAL.mango : PAL.coral, shadow: false, weight: 600 });
  art.text(c, String(r.m.level + 1), 0, 12, { size: 54, color: r.boss ? '#fff' : PAL.ink, shadow: false });
  c.restore();
  drawLives(200, H * 0.42, 15, r.m.lives, r.lifeLostT, r.lifeGainT);
  art.text(c, String(r.m.score), 200, H * 0.48, { size: 26, color: '#fff' });
  // The hero reacts to the last game, a friend cameos with a punchline.
  const pose = r.last === 'win' ? 'cheer' : r.last === 'lose' ? 'sad' : 'idle';
  art.person(c, A.meta.hero, 150, H * 0.9, 220, pose, A.t, { hat: A.meta.hat });
  const slide = easeOutBack(Math.min(1, k * 3));
  const fx = 470 - slide * 155;
  art.person(c, r.cameo, fx, H * 0.88, 170, r.last === 'lose' ? 'point' : 'dance', A.t + 2, { flip: true });
  if (k > 0.25) art.bubble(c, r.quote, Math.min(fx, 330), H * 0.88 - 175, { size: 16 });
  if (r.first) {
    banner(t('m.ready'), H * 0.62, k, PAL.mango);
  } else if (r.banner) {
    banner(t(r.banner === 'boss' ? 'm.boss' : 'm.faster'), H * 0.62, k, r.banner === 'boss' ? PAL.hibiscus : PAL.mango);
  }
  if (r.m.multiplier() > 1) chip(`x${r.m.multiplier()}`, 200, H * 0.53, PAL.hibiscus);
}

function banner(str, y, k, color) {
  const p = Math.min(1, k * 4);
  const s = 0.3 + 0.7 * easeOutBack(p);
  c.save();
  c.translate(200, y);
  c.rotate(-0.06 + Math.sin(A.t * 6) * 0.02);
  c.scale(s, s);
  art.text(c, str, 0, 0, { size: 52, color: '#fff', stroke: color });
  c.restore();
}

function chip(str, x, y, color) {
  c.save();
  c.font = `700 18px ${art.FONT}`;
  const w = (c.measureText(str).width || 30) + 22;
  art.rrect(c, x - w / 2, y - 15, w, 30, 15);
  c.fillStyle = color;
  c.fill();
  c.restore();
  art.text(c, str, x, y + 1, { size: 18, color: '#fff', shadow: false });
}

function drawHud(r) {
  const H = A.H;
  // Score pill.
  c.save();
  art.rrect(c, 12, 12, 118, 38, 19);
  c.fillStyle = 'rgba(20, 12, 40, 0.38)';
  c.fill();
  c.restore();
  art.text(c, String(r.m.score), 71, 32, { size: 22, color: '#fff', shadow: false });
  if (r.m.multiplier() > 1) chip(`x${r.m.multiplier()}`, 150, 31, PAL.hibiscus);
  // Lives.
  c.save();
  art.rrect(c, 290, 12, 98, 38, 19);
  c.fillStyle = 'rgba(20, 12, 40, 0.38)';
  c.fill();
  c.restore();
  drawLives(339, 31, 9, r.m.lives, r.lifeLostT, r.lifeGainT);
  // Fuse timer.
  if (r.phase === 'play') {
    const g = r.micro.g;
    const k = g.left / g.duration;
    const x = 24;
    const w = 352;
    const y = H - 34;
    c.save();
    art.rrect(c, x, y, w, 14, 7);
    c.fillStyle = 'rgba(20, 12, 40, 0.35)';
    c.fill();
    const grad = c.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, PAL.hibiscus);
    grad.addColorStop(0.5, PAL.mango);
    grad.addColorStop(1, PAL.lagoon);
    if (k > 0.01) {
      art.rrect(c, x, y, Math.max(14, w * k), 14, 7);
      c.fillStyle = grad;
      c.fill();
    }
    c.restore();
    const sx = x + w * k;
    art.circle(c, sx, y + 7, 9 + Math.sin(A.t * 30) * 2, 'rgba(255, 220, 120, 0.6)');
    art.circle(c, sx, y + 7, 5, '#fff7c2');
  }
}

const INPUT_ICON = { tap: '👆', swipe: '👈 👉', hold: '✊', drag: '☝️', mash: '👆👆👆' };

function drawOrder(r) {
  const k = r.phaseT;
  const len = Math.max(0.55, 0.85 / Math.sqrt(r.m.speed()));
  if (k > len) return;
  const out = Math.max(0, (k - len * 0.7) / (len * 0.3));
  const s = (0.4 + 0.6 * easeOutBack(Math.min(1, k * 6))) * (1 - out * 0.3);
  c.save();
  c.globalAlpha = 1 - out;
  c.translate(200, A.H * 0.2);
  c.rotate(-0.05);
  c.scale(s, s);
  const verb = r.micro.g.tr(r.def.verb);
  const size = verb.length > 14 ? 34 : 46;
  art.text(c, verb, 0, 0, { size, color: '#fff', stroke: r.boss ? PAL.hibiscus : PAL.coral, max: 380 });
  art.text(c, `${INPUT_ICON[r.def.input] || ''}  ${t(`m.${r.def.input}`)}`, 0, size * 0.95, { size: 18, color: '#fff', stroke: 'rgba(20,12,40,0.5)' });
  c.restore();
}

function drawOutcome(r) {
  const k = r.phaseT;
  const won = r.last === 'win';
  if (!won) {
    const g = c.createRadialGradient(200, A.H / 2, A.H * 0.25, 200, A.H / 2, A.H * 0.75);
    g.addColorStop(0, 'rgba(239,45,107,0)');
    g.addColorStop(1, `rgba(239,45,107,${0.45 * Math.min(1, k * 4)})`);
    c.fillStyle = g;
    c.fillRect(0, 0, 400, A.H);
  }
  const s = 0.3 + 0.7 * easeOutBack(Math.min(1, k * 5));
  c.save();
  c.translate(200, A.H * 0.18);
  c.rotate(won ? -0.08 : 0.06);
  c.scale(s, s);
  art.text(c, r.outcomeWord, 0, 0, { size: 50, color: '#fff', stroke: won ? PAL.palm : PAL.hibiscus });
  c.restore();
}

function drawOverBg() {
  stageBg(A.run?.m.level || 0);
  art.person(c, A.meta.hero, 200, A.H * 0.8, 190, A.run?.result?.newBest ? 'cheer' : 'sad', A.t, { hat: A.meta.hat });
}

function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

// ---- DOM screens ------------------------------------------------------------------

function renderUI() {
  ui.textContent = '';
  if (A.screen === 'home') renderHome();
  else if (A.screen === 'run') renderRunUI();
  else renderOver();
}

function topBar() {
  const bar = el('div', 'm-top', ui);
  el('div', 'm-chip m-coins', bar, `<i class="m-coin"></i>${A.meta.coins}`);
  el('div', 'm-chip', bar, `${t('m.best')} <b>${A.meta.best}</b>`);
  const spacer = el('div', 'm-grow', bar);
  void spacer;
  const snd = el('button', 'm-icon', bar, isMuted() ? '🔇' : '🔊');
  snd.onclick = () => {
    setMuted(!isMuted());
    unlock();
    renderUI();
  };
  const lang = el('button', 'm-icon m-lang', bar, t('m.lang'));
  lang.onclick = () => {
    toggleLocale();
    renderUI();
  };
}

function renderHome() {
  topBar();
  const title = el('div', 'm-title', ui);
  el('h1', '', title, 'Panda<span>dventures</span>');
  el('p', '', title, t('m.tagline'));
  const play = el('button', 'm-btn m-play', ui, t('m.play'));
  play.onclick = startRun;
  const row = el('div', 'm-row', ui);
  const missions = el('button', 'm-btn m-ghost', row, `🎯 ${t('m.missions')}`);
  missions.onclick = () => openMissions();
  const shop = el('button', 'm-btn m-ghost', row, `🛍️ ${t('m.shop')}`);
  shop.onclick = () => openShop('heroes');
}

function renderRunUI() {
  const pause = el('button', 'm-icon m-pause', ui, A.paused ? '▶' : '❚❚');
  pause.onclick = togglePause;
  if (A.paused) {
    const sheet = el('div', 'm-modal', ui);
    el('h2', '', sheet, t('m.paused'));
    const resume = el('button', 'm-btn m-play', sheet, t('m.resume'));
    resume.onclick = togglePause;
    const quit = el('button', 'm-btn m-ghost m-dark', sheet, t('m.quit'));
    quit.onclick = () => {
      A.paused = false;
      gameOver();
    };
  }
}

function renderOver() {
  const r = A.run;
  const res = r.result;
  topBar();
  const card = el('div', 'm-card m-over', ui);
  el('div', 'm-band', card);
  el('h2', '', card, t('m.over'));
  el('div', 'm-score', card, String(r.m.score));
  if (res.newBest && r.m.score > 0) el('div', 'm-badge', card, `🏆 ${t('m.new_best')}`);
  const stats = el('div', 'm-stats', card);
  el('span', '', stats, t('m.reached', { n: r.m.level }));
  el('span', '', stats, t('m.streak', { n: r.m.bestStreak }));
  el('span', 'm-gold', stats, `<i class="m-coin"></i>${t('m.coins_won', { n: r.m.coins })}`);
  for (const mission of res.completed) el('div', 'm-done', card, `🎯 ${missionText(mission)} — ${t('m.mission_done', { n: mission.reward })}`);
  const replay = el('button', 'm-btn m-play', ui, t('m.replay'));
  replay.onclick = startRun;
  const row = el('div', 'm-row', ui);
  const menu = el('button', 'm-btn m-ghost', row, t('m.menu'));
  menu.onclick = () => {
    A.screen = 'home';
    startGroove(88, 0.25);
    renderUI();
  };
  const share = el('button', 'm-btn m-ghost', row, `💬 ${t('m.share')}`);
  share.onclick = () => brag(r);
}

async function brag(r) {
  const url = location.href.split('?')[0];
  const text = t('m.share_text', { n: r.m.level, score: r.m.score, url });
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return;
    }
  } catch {
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast(t('m.copied'));
  } catch {
    toast(text);
  }
}

function toast(str) {
  const node = el('div', 'm-toast', ui, str);
  setTimeout(() => node.remove(), 2200);
}

function missionText(m) {
  if (m.kind === 'game') {
    const def = byId(m.game);
    return t('m.m_game', { name: def ? def.verb[locale()] || def.verb.en : m.game, goal: m.goal });
  }
  return t(`m.m_${m.kind}`, { goal: m.goal });
}

function sheet(title) {
  const back = el('div', 'm-sheet-back', ui);
  const panel = el('div', 'm-sheet', ui);
  const head = el('div', 'm-sheet-head', panel);
  el('h2', '', head, title);
  const close = el('button', 'm-icon m-close', head, '✕');
  const done = () => {
    back.remove();
    panel.remove();
    renderUI();
  };
  close.onclick = done;
  back.onclick = done;
  return panel;
}

function openMissions() {
  sfx.click();
  const panel = sheet(`🎯 ${t('m.missions')}`);
  for (const m of A.meta.missions) {
    const row = el('div', 'm-mission', panel);
    el('div', 'm-mission-text', row, missionText(m));
    const bar = el('div', 'm-bar', row);
    el('i', '', bar).style.width = `${Math.min(100, (m.progress / m.goal) * 100)}%`;
    el('div', 'm-mission-meta', row, `${Math.min(m.progress, m.goal)} / ${m.goal}  ·  <i class="m-coin"></i>${m.reward}`);
  }
}

function openShop(tab) {
  sfx.click();
  const panel = sheet(`🛍️ ${t('m.shop')}`);
  const tabs = el('div', 'm-tabs', panel);
  for (const id of ['heroes', 'hats']) {
    const b = el('button', `m-tab${id === tab ? ' on' : ''}`, tabs, t(`m.${id}`));
    b.onclick = () => {
      ui.querySelector('.m-sheet-back')?.remove();
      panel.remove();
      openShop(id);
    };
  }
  el('div', 'm-chip m-coins m-shop-coins', panel, `<i class="m-coin"></i>${A.meta.coins}`);
  const grid = el('div', 'm-grid', panel);
  const items = tab === 'heroes' ? HEROES : HATS;
  for (const item of items) {
    const owned = A.meta.owned.includes(item.id);
    const on = tab === 'heroes' ? A.meta.hero === item.id : A.meta.hat === item.id;
    const cell = el('button', `m-item${on ? ' on' : ''}${owned ? '' : ' locked'}`, grid);
    const preview = el('canvas', 'm-preview', cell);
    preview.width = 160;
    preview.height = 170;
    const pc = preview.getContext('2d');
    pc.scale(2, 2);
    art.head(pc, tab === 'heroes' ? item.id : A.meta.hero, 40, 48, 70, { hat: tab === 'hats' ? item.id : 'none' });
    el('div', 'm-item-name', cell, tab === 'heroes' ? cap(item.id) : hatName(item.id));
    el('div', 'm-item-price', cell, on ? t('m.equipped') : owned ? t('m.equip') : `<i class="m-coin"></i>${item.price}`);
    cell.onclick = () => {
      if (!owned) {
        const next = buy(A.meta, item.id);
        if (!next) {
          cell.classList.remove('shake');
          void cell.offsetWidth;
          cell.classList.add('shake');
          sfx.bad();
          return;
        }
        A.meta = next;
        sfx.best();
      } else sfx.click();
      if (tab === 'heroes') A.meta.hero = item.id;
      else A.meta.hat = item.id;
      saveMeta(A.meta);
      ui.querySelector('.m-sheet-back')?.remove();
      panel.remove();
      openShop(tab);
    };
  }
}

const HAT_NAMES = {
  none: { en: 'No hat', fr: 'Sans' },
  shades: { en: 'Shades', fr: 'Lunettes' },
  flower: { en: 'Hibiscus', fr: 'Hibiscus' },
  bakoua: { en: 'Bakoua', fr: 'Bakoua' },
  madras: { en: 'Madras', fr: 'Madras' },
  party: { en: 'Party', fr: 'Fête' },
  crown: { en: 'Crown', fr: 'Couronne' },
};
const hatName = (id) => HAT_NAMES[id]?.[locale()] || id;
const cap = (s) => (s === 'eugenie' ? 'Eugénie' : s[0].toUpperCase() + s.slice(1));

// ---- loop -------------------------------------------------------------------------

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

art.loadHeads(`${import.meta.env.BASE_URL}cast/`).then(() => {
  renderUI();
  requestAnimationFrame(frame);
});
renderUI();

// Test hook: drive the app without a visible tab (rAF does not run when hidden).
window.__m = {
  A,
  startRun,
  tick(seconds = 1 / 60, step = 1 / 60) {
    for (let s = 0; s < seconds; s += step) update(step);
    draw();
  },
  input: (kind, a, b) => micro()?.input(kind, a, b),
  openShop,
  openMissions,
};
