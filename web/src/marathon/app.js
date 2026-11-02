// Pandadventures marathon: mobile-portrait shell. Home (the gang on the
// beach), the run (between-screen -> order -> micro-game -> outcome, faster
// and faster, 3 lives, boss every 10th), game over, shop and missions.
//
// Debug URLs: ?game=<id> plays only that micro-game, ?level=N starts at game N
// (faster), ?boss forces bosses, ?coins=N gives coins, ?pbauto makes Eul' Flipper play
// itself. window.__m drives it in tests.

import './marathon.css';
import { GAMES, BOSSES } from './games/index.js';
import { createMarathon } from './rules.js';
import { startMicro } from './micro.js';
import { createFx } from './fx.js';
import * as art from './art.js';
import { PAL, CAST_IDS } from './art.js';
import { sfx, unlock, startGroove, setGroove, stopGroove, setMuted, isMuted } from './sound.js';
import { loadMeta, saveMeta, onMetaChanged, askPersist, refillMissions, applyRun, applyPinball, applySpx, dropOldRecords, buy, HEROES, HATS } from './meta.js';
import { t, locale, toggleLocale } from '../core/i18n.js';
import { installMode } from './install.js';
import { GAMES as BOARD_GAMES, NAME_MAX, createOnline, memoryBackend, toSend, rowFor, bestRun, cleanName, newPlayerId } from './online.js';
import { makeShareCard } from './sharecard.js';
import './texts.js';

const params = new URLSearchParams(location.search);
const DEBUG_GAME = params.get('game');
const START_LEVEL = Number(params.get('level') || 0);
const FORCE_BOSS = params.has('boss');
// Test links (?game, ?level, ?boss, ?coins) never write the player's save.
const VOLATILE = ['game', 'level', 'boss', 'coins'].some((k) => params.has(k));
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
  dpr: 1,
  t: 0,
  meta: loadMeta(),
  fx: createFx(),
  run: null,
  paused: false,
  cameoOrder: [],
};
if (params.get('coins')) A.meta.coins = Number(params.get('coins'));

/** Stores the save (merged with other tabs). Test links keep it in memory only. */
function persist() {
  if (!VOLATILE) A.meta = saveMeta(A.meta);
}
if (!VOLATILE) {
  onMetaChanged((stored) => {
    if (A.screen === 'run') return;
    A.meta = stored;
    if (!document.querySelector('.m-sheet')) renderUI();
  });
}
// A mission about a game that no longer exists is dropped and replaced.
A.meta.missions = A.meta.missions.filter((m) => m.kind !== 'game' || byId(m.game));
A.meta = refillMissions(A.meta, pickGameId);
persist();

function pickGameId() {
  return GAMES[Math.floor(Math.random() * GAMES.length)]?.id || 'spit';
}

function resize() {
  const rect = phone.getBoundingClientRect();
  // A tab loaded in the background can report a zero size: keep the last good one.
  if (rect.width < 10 || rect.height < 10) return;
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
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(phone);
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
  try {
    canvas.setPointerCapture?.(e.pointerId);
  } catch {
    // Some browsers refuse capture for synthetic or stale pointers: play on.
  }
  const [x, y] = toLogical(e);
  if (isExtra()) return;
  Object.assign(touch, { id: e.pointerId, x0: x, y0: y, t0: performance.now(), swiped: false });
  if (A.screen === 'run' && A.run && (A.run.phase === 'intro' || A.run.phase === 'result' || A.run.phase === 'outcome')) skipPhase();
  else micro()?.input('press', x, y);
  e.preventDefault();
});
canvas.addEventListener('pointermove', (e) => {
  if (isExtra()) return;
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
  if (isExtra()) return;
  if (touch.id !== e.pointerId) return;
  const [x, y] = toLogical(e);
  touch.id = null;
  micro()?.input('release', x, y);
};
canvas.addEventListener('pointerup', up);
canvas.addEventListener('pointercancel', up);

const KEY_SWIPE = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down', KeyQ: 'left', KeyZ: 'up' };
window.addEventListener('keydown', (e) => {
  if (isExtra()) {
    // Eul' Flipper and 103 SPX listen to the keyboard themselves; Escape leaves the flipper (103 SPX handles its own).
    if (e.code === 'Escape' && A.screen === 'pinball') leavePinball();
    return;
  }
  if (e.repeat) return;
  unlock();
  if (KEY_SWIPE[e.code]) micro()?.input('swipe', KEY_SWIPE[e.code]);
  if (e.code === 'Space' || e.code === 'Enter') {
    if (A.screen === 'run') {
      if (micro()) micro().input('press', 200, A.H * 0.55);
      else skipPhase();
    }
    else if (A.screen !== 'run' && !document.querySelector('.m-sheet')) startRun();
    e.preventDefault();
  }
  if (e.code === 'Escape' && A.screen === 'run') togglePause();
});
window.addEventListener('keyup', (e) => {
  if (isExtra()) return;
  if (e.code === 'Space' || e.code === 'Enter') micro()?.input('release', 200, A.H * 0.55);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && A.screen === 'run' && !A.paused) togglePause();

});

// ---- run ------------------------------------------------------------------------
// Phases: ready -> intro (what to do) -> play -> outcome (stamp over the game)
// -> result (success / fail scene) -> intro ... -> game over.
// Intro and result can be skipped with a tap once they have been up a moment.

const READY_LEN = 2.2;
// 3, 2, 1, GO! before each game: the scene shows, nothing moves yet.
const GETSET_LEN = 2.4;
// The ending scene of each mini-game: the hero cheers or sulks, the rival reacts.
const OUTCOME_LEN = 5;
const OUTCOME_SKIP = 1.5;
// Taps right after a scene opens are ignored, so a late tap from the game
// never skips the scene you wanted to read.
const SKIP_AFTER = 0.9;
// The intro waits for a tap; after this long it starts by itself.
const INTRO_MAX = 12;

function shuffled(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Next friend to cameo: cycles so everyone shows up. */
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
  const heroLine = A.meta.hero === 'panda' ? t('m.lascars') : t(`quote_${A.meta.hero}`);
  A.run = { heroLine, m, phase: 'ready', phaseT: 0, micro: null, last: null, banner: null, cameo: nextCameo(), quote: '', lifeLostT: 9, lifeGainT: 9, seen: new Set(), shownScore: 0, gained: 0 };
  A.fx.clear();
  A.screen = 'run';
  A.paused = false;
  startGroove(96, 0.4);
  renderUI();
}

/** Picks and builds the next micro-game, shown frozen behind its intro card. */
function prepareIntro() {
  const r = A.run;
  r.phase = 'intro';
  r.phaseT = 0;
  r.boss = !DEBUG_GAME && (FORCE_BOSS || r.m.isBoss()) && BOSSES.length > 0;
  let def;
  if (DEBUG_GAME) {
    def = byId(DEBUG_GAME);
    r.boss = !!def?.boss;
    r.m.next();
  } else if (r.boss) {
    def = BOSSES[Math.floor(Math.random() * BOSSES.length)];
  } else {
    def = byId(r.m.next());
  }
  r.m.current = def.id;
  r.def = def;
  r.banner = r.boss ? 'boss' : r.m.level > 0 && r.m.level % 5 === 0 ? 'faster' : null;
  if (r.banner === 'boss') sfx.boss();
  else if (r.banner === 'faster') sfx.speedup();
  else sfx.whoosh();
  const firstTime = !r.seen.has(def.id);
  r.seen.add(def.id);
  r.introLen = INTRO_MAX;
  void firstTime;
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
  setGroove(92 + (r.m.speed() - 1) * 46, Math.min(1, 0.3 + r.m.level * 0.03));
}

function startPlay() {
  const r = A.run;
  r.phase = 'getset';
  r.phaseT = 0;
  r.lastCount = 4;
}

function go() {
  const r = A.run;
  r.phase = 'play';
  r.phaseT = 0;
  r.lastTick = 99;
  sfx.good();
}

function finishMicroGame() {
  const r = A.run;
  const won = r.micro.g.won;
  const before = r.m.coins;
  r.shownScore = r.m.score;
  r.m.report(won);
  r.last = won ? 'win' : 'lose';
  r.outcomeWord = t(won ? 'm.win' : 'm.lose');
  r.rival = r.micro.g.cast(...(r.def.rival || ['cous']));
  // When the hero loses, the rival rubs it in (picked once, so it does not flicker).
  r.tease = t('m.tease');
  r.endFx = 0;
  r.phase = 'outcome';
  r.phaseT = 0;
  if (won) {
    sfx.coin();
    if (r.boss) {
      r.m.heal();
      r.m.coins += 5;
    }
  } else {
    A.fx.flash('rgba(239, 45, 107, 0.35)', 0.25);
  }
  r.gained = r.m.coins - before;
}

function showResult() {
  const r = A.run;
  r.phase = 'result';
  r.phaseT = 0;
  r.cameo = nextCameo();
  r.quote = t(`quote_${r.cameo}`);
  r.resultLen = r.last === 'win' ? 4.5 : 5;
  if (r.last === 'win') {
    sfx.good();
    A.fx.burst(200, A.H * 0.3, { kind: 'confetti', n: 36, speed: 340 });
    if (r.boss) {
      r.lifeGainT = 0;
      sfx.life();
    }
  } else {
    r.lifeLostT = 0;
    sfx.bad();
  }
}

function skipPhase() {
  const r = A.run;
  if (!r || A.paused || r.phaseT < SKIP_AFTER) return;
  if (r.phase === 'intro') startPlay();
  else if (r.phase === 'outcome' && r.phaseT >= OUTCOME_SKIP) showResult();
  else if (r.phase === 'result') afterResult();
}

function afterResult() {
  if (A.run.m.isOver()) gameOver();
  else prepareIntro();
}

function gameOver() {
  if (A.screen !== 'run') return;
  const r = A.run;
  // Saving must never stop the game-over screen from showing.
  let res = { meta: A.meta, completed: [], newBest: false, rank: 0 };
  try {
    res = applyRun(A.meta, { level: r.m.level, bestStreak: r.m.bestStreak, coins: r.m.coins, score: r.m.score, stats: r.m.stats, hero: A.meta.hero });
    A.meta = refillMissions(res.meta, pickGameId);
    persist();
    askPersist();
  } catch (err) {
    reportError(err);
  }
  r.result = res;
  r.endedAt = Date.now();
  A.screen = 'over';
  setGroove(84, 0.2);
  if (res.newBest && r.m.score > 0) {
    sfx.best();
    A.fx.burst(200, A.H * 0.3, { kind: 'petal', n: 30, speed: 320 });
  } else sfx.over();
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
  if (isExtra()) {
    A.fx.update(dt);
    return;
  }
  if (A.screen === 'run' && !A.paused) {
    const r = A.run;
    r.phaseT += dt;
    r.lifeLostT += dt;
    r.lifeGainT += dt;
    if (r.phase === 'ready' && r.phaseT >= READY_LEN) prepareIntro();
    else if (r.phase === 'intro' && r.phaseT >= r.introLen) startPlay();
    else if (r.phase === 'getset') {
      const n = Math.ceil(3 - (r.phaseT / GETSET_LEN) * 3);
      if (n !== r.lastCount && n > 0) {
        r.lastCount = n;
        sfx.tick(false);
      }
      if (r.phaseT >= GETSET_LEN) go();
    }
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
      if (r.phaseT >= OUTCOME_LEN) showResult();
    } else if (r.phase === 'result') {
      r.shownScore += (r.m.score - r.shownScore) * Math.min(1, dt * 6);
      if (r.phaseT >= r.resultLen) afterResult();
    }
    // Safety net: never stay stuck after the last life.
    if (A.screen === 'run' && r.m.isOver() && r.phase !== 'outcome' && r.phaseT > 12) gameOver();
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
  if (isExtra()) stageBg(['#2a1559', '#0a6d93']);
  else if (A.screen === 'home') drawHome();
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

/** Colourful animated backdrop: a gradient, slow sun rays, a madras ribbon, petals. */
function stageBg(colors) {
  const H = A.H;
  const [a, b] = colors;
  const g = c.createRadialGradient(200, H * 0.35, 20, 200, H * 0.45, H * 0.8);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  c.fillStyle = g;
  c.fillRect(0, 0, 400, H);
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
  c.save();
  c.globalAlpha = 0.9;
  c.translate(0, H * 0.58);
  c.rotate(-0.12);
  art.madrasBand(c, -40, 0, 480, 16, 0.4);
  c.restore();
  for (let i = 0; i < 6; i++) art.hibiscus(c, ((i * 83 + A.t * 12) % 440) - 20, H * 0.12 + ((i * 131) % (H * 0.3)), 9 + (i % 3) * 3, A.t * 0.5 + i, 'rgba(255,255,255,0.18)');
}

const levelColors = (level) => BG[Math.floor(level / 3) % BG.length];

function drawLives(x, y, size, lives, lostT, gainT) {
  for (let i = 0; i < 3; i++) {
    const alive = i < lives;
    const justLost = i === lives && lostT < 0.9;
    const justGained = i === lives - 1 && gainT < 0.6;
    let s = size;
    let yy = y;
    let alpha = 1;
    if (justLost) {
      const k = Math.max(0, lostT - 0.25);
      yy += k * k * 260;
      alpha = 1 - k / 0.65;
    }
    if (justGained) s *= 1 + Math.sin(gainT * 10) * 0.3;
    const xx = x + (i - 1) * size * 2.3;
    if (!alive && !justLost) {
      art.hibiscus(c, xx, y, s, 0, 'rgba(255,255,255,0.25)');
      continue;
    }
    c.globalAlpha = Math.max(0, alpha);
    art.hibiscus(c, xx, yy, s * (justLost && lostT < 0.25 ? 1 + lostT * 2 : 1), justLost ? lostT * 6 : Math.sin(A.t * 2 + i) * 0.15);
    c.globalAlpha = 1;
  }
}

function drawRun() {
  const r = A.run;
  if (r.phase === 'ready') return drawReady(r);
  if (r.phase === 'result') return drawResult(r);
  r.micro.draw(c);
  if (r.phase === 'intro') return drawIntro(r);
  drawHud(r);
  if (r.phase === 'getset') drawCountdown(r);
  if (r.phase === 'play') drawGo(r);
  if (r.phase === 'outcome') drawOutcome(r);
}

function drawReady(r) {
  const H = A.H;
  stageBg(levelColors(0));
  art.person(c, A.meta.hero, 150, H * 0.9, 230, 'cheer', A.t, { hat: A.meta.hat });
  art.person(c, r.cameo, 300, H * 0.88, 180, 'dance', A.t + 2, { flip: true });
  // Panda raises his 8.6.
  if (A.meta.hero === 'panda') art.beerCan(c, 196, H * 0.9 - 160 + Math.sin(A.t * 12) * 3, 30, 0.2);
  banner(t('m.ready'), H * 0.32, r.phaseT, PAL.mango, 60);
  drawLives(200, H * 0.45, 16, r.m.lives, 9, 9);
  if (r.phaseT > 0.4) art.bubble(c, r.heroLine, 160, H * 0.9 - 240, { size: 16, maxW: 300 });
}

/** Intro: the frozen first frame behind a card that says what to do. */
function drawIntro(r) {
  const H = A.H;
  const k = r.phaseT;
  c.fillStyle = 'rgba(18, 10, 36, 0.58)';
  c.fillRect(0, 0, 400, H);
  const pop = easeOutBack(Math.min(1, k * 4));
  const cardW = 340;
  const lines = art.wrap(c, r.micro.g.tr(r.def.howto), cardW - 50, 20, 500);
  const cardH = 250 + lines.length * 26;
  const cx = 200;
  const cy = H * 0.47;
  c.save();
  c.translate(cx, cy);
  c.scale(0.7 + 0.3 * pop, 0.7 + 0.3 * pop);
  c.globalAlpha = Math.min(1, k * 5);
  art.shadowed(c, () => {
    art.rrect(c, -cardW / 2, -cardH / 2, cardW, cardH, 28);
    c.fillStyle = r.boss ? '#24133f' : 'rgba(255, 250, 242, 0.97)';
    c.fill();
  }, 30, 12);
  art.madrasBand(c, -cardW / 2, -cardH / 2, cardW, 14, 0.4);
  const ink = r.boss ? '#fff' : PAL.ink;
  let y = -cardH / 2 + 44;
  chip(`${t('m.game')} ${r.m.level + 1}`, 0, y - 6, r.boss ? PAL.hibiscus : PAL.lagoon);
  y += 40;
  art.text(c, r.micro.g.tr(r.def.title), 0, y, { size: 28, color: ink, shadow: false, max: cardW - 30 });
  y += 38;
  art.text(c, r.micro.g.tr(r.def.verb), 0, y, { size: 22, color: r.boss ? PAL.mango : PAL.coral, shadow: false, max: cardW - 30 });
  y += 34;
  lines.forEach((ln, i) => art.text(c, ln, 0, y + i * 26, { size: 20, weight: 500, color: r.boss ? '#e8defa' : '#4a4560', shadow: false }));
  y += lines.length * 26 + 44;
  drawGesture(r.def.input, 0, y, k, ink, r.def.axis);
  c.restore();
  // The intro waits for the player: a pulsing hint says how to go on.
  if (k > SKIP_AFTER) art.text(c, t('m.tap_to_go'), 200, H - 52, { size: 22, weight: 500, color: `rgba(255,255,255,${0.6 + 0.4 * Math.sin(A.t * 5)})` });
  if (r.banner) banner(t(r.banner === 'boss' ? 'm.boss' : 'm.faster'), H * 0.12, k, r.banner === 'boss' ? PAL.hibiscus : PAL.mango, 46);
  drawLivesTop(r);
}

/** Small animated hand showing the gesture: tap, swipe, hold, drag or mash. */
function drawGesture(input, x, y, k, ink, axis = 'x') {
  const t2 = A.t;
  c.save();
  c.translate(x, y);
  const ring = (rx, ry, phase) => {
    const p = phase % 1;
    c.strokeStyle = `rgba(18, 194, 201, ${1 - p})`;
    c.lineWidth = 3;
    c.beginPath();
    c.arc(rx, ry, 8 + p * 26, 0, Math.PI * 2);
    c.stroke();
  };
  let hx = 0;
  let hy = 0;
  if (input === 'tap') {
    const p = (t2 * 1.4) % 1;
    hy = p < 0.25 ? -8 + p * 32 : 0;
    ring(0, -18, t2 * 1.4);
  } else if (input === 'mash') {
    hy = Math.abs(Math.sin(t2 * 18)) * -8;
    ring(0, -18, t2 * 4);
    ring(0, -18, t2 * 4 + 0.5);
  } else if (input === 'swipe' && axis === 'y') {
    hy = Math.sin(t2 * 3) * 34;
    c.strokeStyle = 'rgba(18, 194, 201, 0.6)';
    c.lineWidth = 4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(60, -50);
    c.lineTo(60, 20);
    c.stroke();
    art.text(c, '▲', 60, -62, { size: 20, color: PAL.lagoon, shadow: false });
    art.text(c, '▼', 60, 32, { size: 20, color: PAL.lagoon, shadow: false });
    hx = 0;
  } else if (input === 'swipe') {
    hx = Math.sin(t2 * 3) * 70;
    c.strokeStyle = 'rgba(18, 194, 201, 0.6)';
    c.lineWidth = 4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-80, -18);
    c.lineTo(80, -18);
    c.stroke();
    art.text(c, '◀', -94, -18, { size: 20, color: PAL.lagoon, shadow: false });
    art.text(c, '▶', 94, -18, { size: 20, color: PAL.lagoon, shadow: false });
  } else if (input === 'drag') {
    hx = Math.sin(t2 * 1.6) * 80;
    c.setLineDash([4, 8]);
    c.strokeStyle = 'rgba(18, 194, 201, 0.7)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-90, -18);
    c.lineTo(90, -18);
    c.stroke();
    c.setLineDash([]);
  } else if (input === 'hold') {
    const p = (t2 * 0.6) % 1;
    c.strokeStyle = 'rgba(18, 194, 201, 0.25)';
    c.lineWidth = 6;
    c.beginPath();
    c.arc(0, -18, 26, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = PAL.lagoon;
    c.beginPath();
    c.arc(0, -18, 26, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
    c.stroke();
  }
  art.text(c, '👆', hx, hy, { size: 38, shadow: false });
  art.text(c, t(`m.${input}`), 0, 40, { size: 16, color: ink, weight: 600, shadow: false });
  c.restore();
  void k;
}

function drawLivesTop(r) {
  c.save();
  art.rrect(c, 290, 12, 98, 38, 19);
  c.fillStyle = 'rgba(20, 12, 40, 0.38)';
  c.fill();
  c.restore();
  drawLives(339, 31, 9, r.m.lives, r.lifeLostT, r.lifeGainT);
}

/** Result: a full scene after each game. Success = party, fail = a friend teases. */
function drawResult(r) {
  const H = A.H;
  const k = r.phaseT;
  const won = r.last === 'win';
  stageBg(won ? (r.boss ? ['#ffd166', '#ef8a17'] : ['#2fd6b0', '#0a7f9e']) : ['#ff8a7a', '#b8235a']);
  // Title.
  banner(r.outcomeWord, H * 0.13, k, won ? PAL.palm : PAL.hibiscus, 58);
  const line = won ? r.micro.g.tr(r.def.winLine) : r.micro.g.tr(r.def.title);
  if (k > 0.2) art.text(c, line, 200, H * 0.22, { size: 21, color: '#fff', weight: 600, max: 370 });
  // Score, coins, streak.
  art.text(c, String(Math.round(r.shownScore)), 200, H * 0.31, { size: 52, color: '#fff' });
  if (won && r.gained > 0 && k > 0.3) {
    const cy = H * 0.37;
    art.circle(c, 176, cy, 10, '#ffc83d');
    art.circle(c, 173, cy - 3, 4, '#fff3b0');
    art.text(c, `+${r.gained}`, 210, cy + 1, { size: 22, color: '#fff3b0' });
  }
  if (won && r.m.streak >= 3) chip(`🔥 ${r.m.streak}  ·  x${r.m.multiplier()}`, 200, H * 0.42, PAL.hibiscus);
  drawLives(200, H * 0.48, 16, r.m.lives, r.lifeLostT, r.lifeGainT);
  if (r.boss && won && k > 0.4) art.text(c, t('m.life'), 200, H * 0.53, { size: 20, color: '#fff', stroke: PAL.hibiscus });
  // The hero and a friend reacting with a punchline.
  const heroPose = won ? 'cheer' : 'sad';
  const hop = won ? Math.abs(Math.sin(k * 7)) * 14 : 0;
  art.person(c, A.meta.hero, 135, H * 0.93 - hop, 230, heroPose, A.t, { hat: A.meta.hat });
  const slide = easeOutBack(Math.min(1, k * 2.5));
  const fx = 480 - slide * 175;
  art.person(c, r.cameo, fx, H * 0.91, 180, won ? 'dance' : 'point', A.t + 2, { flip: true });
  if (k > 0.45) art.bubble(c, r.quote, Math.min(fx - 10, 320), H * 0.91 - 190, { size: 16 });
  if (k > SKIP_AFTER) art.text(c, t('m.tap_to_go'), 200, H - 26, { size: 15, weight: 500, color: 'rgba(255,255,255,0.75)' });
}

function banner(str, y, k, color, size = 52) {
  const p = Math.min(1, k * 4);
  const s = 0.3 + 0.7 * easeOutBack(p);
  c.save();
  c.translate(200, y);
  c.rotate(-0.05 + Math.sin(A.t * 6) * 0.015);
  c.scale(s, s);
  art.text(c, str, 0, 0, { size, color: '#fff', stroke: color, max: 380 });
  c.restore();
}

function chip(str, x, y, color) {
  c.save();
  c.font = `700 18px ${art.FONT}`;
  const w = (c.measureText(str).width || 30) + 24;
  art.rrect(c, x - w / 2, y - 15, w, 30, 15);
  c.fillStyle = color;
  c.fill();
  c.restore();
  art.text(c, str, x, y + 1, { size: 18, color: '#fff', shadow: false });
}

function drawHud(r) {
  const H = A.H;
  c.save();
  art.rrect(c, 12, 12, 118, 38, 19);
  c.fillStyle = 'rgba(20, 12, 40, 0.38)';
  c.fill();
  c.restore();
  art.text(c, String(r.m.score), 71, 32, { size: 22, color: '#fff', shadow: false });
  if (r.m.multiplier() > 1) chip(`x${r.m.multiplier()}`, 150, 31, PAL.hibiscus);
  drawLivesTop(r);
  if (r.phase === 'play' || r.phase === 'getset') {
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

/** 3, 2, 1 over the still scene, with the order as a reminder. */
function drawCountdown(r) {
  const k = r.phaseT;
  const n = Math.max(1, Math.ceil(3 - (k / GETSET_LEN) * 3));
  const f = (k / GETSET_LEN) * 3 % 1;
  c.fillStyle = 'rgba(18, 10, 36, 0.25)';
  c.fillRect(0, 0, 400, A.H);
  c.save();
  c.translate(200, A.H * 0.42);
  const s = 0.6 + 0.6 * easeOutBack(Math.min(1, f * 4));
  c.scale(s, s);
  c.globalAlpha = 1 - Math.max(0, f - 0.75) * 4;
  art.text(c, String(n), 0, 0, { size: 110, color: '#fff', stroke: r.boss ? PAL.hibiscus : PAL.coral });
  c.restore();
  art.text(c, r.micro.g.tr(r.def.verb), 200, A.H * 0.2, { size: 30, color: '#fff', stroke: 'rgba(20,12,40,0.6)', max: 380 });
}

/** A short "GO!" as the game starts (the intro already explained it). */
function drawGo(r) {
  const k = r.phaseT;
  if (k > 0.5) return;
  c.save();
  c.globalAlpha = 1 - Math.max(0, (k - 0.3) / 0.2);
  c.translate(200, A.H * 0.2);
  const s = 0.5 + 0.5 * easeOutBack(Math.min(1, k * 7));
  c.scale(s, s);
  art.text(c, t('m.go'), 0, 0, { size: 56, color: '#fff', stroke: r.boss ? PAL.hibiscus : PAL.coral });
  c.restore();
}

/**
 * The ending scene (5 s) over the game's own last frames: cinema bars, the
 * hero comes up big. Win: the rival sulks with a sore-loser line. Lose: the
 * hero complains ("Hoho…") while the rival laughs.
 */
function drawOutcome(r) {
  const H = A.H;
  const k = r.phaseT;
  const won = r.last === 'win';
  const g = r.micro.g;
  // Mood over the scene.
  const mood = Math.min(1, Math.max(0, (k - 0.6) * 2));
  c.fillStyle = won ? `rgba(255, 210, 120, ${0.18 * mood})` : `rgba(40, 30, 70, ${0.35 * mood})`;
  c.fillRect(0, 0, 400, H);
  if (won) {
    const glow = c.createRadialGradient(120, H * 0.7, 10, 120, H * 0.7, 260);
    glow.addColorStop(0, `rgba(255, 236, 160, ${0.55 * mood})`);
    glow.addColorStop(1, 'rgba(255, 236, 160, 0)');
    c.fillStyle = glow;
    c.fillRect(0, 0, 400, H);
    if (k > 0.8 && r.endFx === 0) { r.endFx = 1; A.fx.burst(120, H * 0.55, { kind: 'confetti', n: 40, speed: 380 }); }
    if (k > 2.6 && r.endFx === 1) { r.endFx = 2; A.fx.burst(300, H * 0.5, { kind: 'petal', n: 20, speed: 260 }); }
  } else {
    // Rain.
    c.strokeStyle = `rgba(200, 220, 255, ${0.45 * mood})`;
    c.lineWidth = 2;
    for (let i = 0; i < 40; i++) {
      const x = (i * 53 + A.t * 60) % 420 - 10;
      const y = (i * 97 + A.t * 520) % (H + 40) - 20;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x - 4, y + 16);
      c.stroke();
    }
  }
  // Cinema bars.
  const bar = 64 * easeOutBack(Math.min(1, Math.max(0, (k - 0.5) * 3)));
  c.fillStyle = 'rgba(12, 8, 24, 0.92)';
  c.fillRect(0, 0, 400, bar);
  c.fillRect(0, H - bar, 400, bar);
  // The hero comes up big; the rival slides in.
  const heroIn = easeOutBack(Math.min(1, Math.max(0, (k - 0.7) * 2.2)));
  const rivalIn = easeOutBack(Math.min(1, Math.max(0, (k - 1.1) * 2.2)));
  const heroFeet = H + 10 + (1 - heroIn) * 320;
  const rivalFeet = H + 10;
  const hop = won ? Math.abs(Math.sin(k * 7)) * 18 : 0;
  if (!won) {
    // A little storm cloud over the hero.
    const cy = heroFeet - 330;
    art.ellipse(c, 115, cy, 58, 24, 'rgba(90, 95, 120, 0.85)');
    art.circle(c, 90, cy - 12, 26, 'rgba(90, 95, 120, 0.85)');
    art.circle(c, 132, cy - 18, 30, 'rgba(90, 95, 120, 0.85)');
  }
  art.person(c, r.rival, 300 + (1 - rivalIn) * 260, rivalFeet, 250, won ? 'sad' : 'point', A.t + 3, { flip: true });
  art.person(c, A.meta.hero, 120, heroFeet - hop, 310, won ? 'cheer' : 'sad', A.t, { hat: A.meta.hat });
  // Lines.
  const heroHeadTop = heroFeet - 300;
  const rivalHeadTop = rivalFeet - 245;
  if (won) {
    if (k > 1.6) art.bubble(c, g.tr(r.def.rivalLine), 300, rivalHeadTop, { size: 17, maxW: 250 });
    if (k > 0.9) art.text(c, g.tr(r.def.winLine), 200, bar + 70, { size: 22, color: '#fff', stroke: PAL.palm, max: 380 });
  } else {
    if (k > 1.2) art.bubble(c, g.tr(r.def.loseLine), 150, heroHeadTop, { size: 18, maxW: 260 });
    if (k > 2.2) art.bubble(c, r.tease, 320, rivalHeadTop, { size: 16, maxW: 250 });
  }
  // The stamp.
  const s = 0.3 + 0.7 * easeOutBack(Math.min(1, k * 5));
  c.save();
  c.translate(200, bar + 30);
  c.rotate(won ? -0.06 : 0.05);
  c.scale(s, s);
  art.text(c, r.outcomeWord, 0, 0, { size: 46, color: '#fff', stroke: won ? PAL.palm : PAL.hibiscus });
  c.restore();
  if (k > OUTCOME_SKIP) art.text(c, t('m.tap_to_go'), 200, H - bar / 2, { size: 15, weight: 500, color: 'rgba(255,255,255,0.75)' });
}

function drawOverBg() {
  stageBg(levelColors(A.run?.m.level || 0));
  art.person(c, A.meta.hero, 200, A.H * 0.8, 190, A.run?.result?.newBest ? 'cheer' : 'sad', A.t, { hat: A.meta.hat });
}

function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

// ---- DOM screens ------------------------------------------------------------------

// ---- Eul' Flipper ---------------------------------------------------------------------

let flipperModule = null;

/** Opens Eul' Flipper: the 3D table loads on demand (three.js stays out of the main game). */
async function startPinball() {
  unlock();
  sfx.click();
  disposeFlipper();
  A.screen = 'pinball';
  A.paused = false;
  A.pbDone = false;
  A.pbResult = null;
  stopGroove();
  renderUI();
  try {
    flipperModule = flipperModule || (await import('../flipper/index.js'));
    if (A.screen !== 'pinball') return;
    const root = document.createElement('div');
    root.className = 'm-flipper-root';
    phone.insertBefore(root, ui);
    A.pbRoot = root;
    A.pb = await flipperModule.startFlipper({
      root,
      lang: locale(),
      t,
      hero: A.meta.hero,
      hat: A.meta.hat,
      sound: !isMuted(),
      auto: params.has('pbauto'),
      onGameOver: ({ score }) => pinballOver(score),
      onExit: leavePinball,
    });
    renderUI();
  } catch (err) {
    reportError(err);
    leavePinball();
  }
}

function disposeFlipper() {
  try {
    A.pb?.dispose?.();
  } catch (err) {
    reportError(err);
  }
  A.pb = null;
  A.pbRoot?.remove();
  A.pbRoot = null;
}

function pinballOver(score = 0) {
  if (A.pbDone) return;
  A.pbDone = true;
  let res = { meta: A.meta, rank: 0, newBest: false };
  try {
    res = applyPinball(A.meta, { score, hero: A.meta.hero });
    A.meta = res.meta;
    persist();
    askPersist();
  } catch (err) {
    reportError(err);
  }
  A.pbResult = { ...res, score };
  if (res.newBest && score > 0) sfx.best();
  renderUI();
}

function leavePinball() {
  disposeFlipper();
  A.screen = 'home';
  A.paused = false;
  A.pbDone = false;
  startGroove(88, 0.25);
  renderUI();
}

function renderPinballUI() {
  if (!A.pb && !A.pbDone) {
    el('div', 'm-chip m-loading', ui, t('pb.loading'));
    return;
  }
  if (!A.pbDone) return;
  const r = A.pbResult;
  const card = el('div', 'm-card m-over', ui);
  el('div', 'm-band', card);
  el('h2', '', card, t('pb.over'));
  el('div', 'm-score', card, r.score.toLocaleString(locale()));
  if (r.newBest && r.score > 0) el('div', 'm-badge', card, `🏆 ${t('m.new_best')}`);
  const stats = el('div', 'm-stats', card);
  el('span', '', stats, `${t('pb.best')} ${A.meta.pinball.best.toLocaleString(locale())}`);
  if (r.rank > 0) el('span', 'm-gold', stats, `🏆 ${t('pb.rank', { n: r.rank })}`);
  const again = el('button', 'm-btn m-play', ui, t('m.replay'));
  again.onclick = startPinball;
  const row = el('div', 'm-row', ui);
  const menu = el('button', 'm-btn m-ghost', row, t('m.menu'));
  menu.onclick = leavePinball;
  const top = el('button', 'm-btn m-ghost', row, `🏆 ${t('pb.scores')}`);
  top.onclick = () => openRecords('flipper');
  if (r.score > 0) onlineBlock(ui, 'flipper', r.newBest);
}

// ---- 103 SPX ----------------------------------------------------------------------------

let spxModule = null;

/** The bonus games with a screen of their own (they take the input and the drawing). */
function isExtra() {
  return A.screen === 'pinball' || A.screen === 'spx';
}

/** Opens 103 SPX: Panda's moped ride home through Montceau (3D, loaded on demand). */
async function startSpxRide() {
  unlock();
  sfx.click();
  disposeSpx();
  A.screen = 'spx';
  A.paused = false;
  A.sxDone = false;
  A.sxResult = null;
  stopGroove();
  renderUI();
  try {
    spxModule = spxModule || (await import('../spx/index.js'));
    if (A.screen !== 'spx') return;
    const root = document.createElement('div');
    root.className = 'm-flipper-root';
    phone.insertBefore(root, ui);
    A.sxRoot = root;
    A.sx = await spxModule.startSpx({
      root,
      lang: locale(),
      sound: !isMuted(),
      auto: params.has('spxauto'),
      onGameOver: ({ score, summary }) => spxOver(score, summary),
      onExit: leaveSpx,
      onError: reportError,
    });
    if (!isMuted()) startGroove(112, 0.22);
    renderUI();
  } catch (err) {
    reportError(err);
    leaveSpx();
  }
}

function disposeSpx() {
  try {
    A.sx?.dispose?.();
  } catch (err) {
    reportError(err);
  }
  A.sx = null;
  A.sxRoot?.remove();
  A.sxRoot = null;
}

function spxOver(score = 0, summary = {}) {
  if (A.sxDone) return;
  A.sxDone = true;
  let res = { meta: A.meta, rank: 0, newBest: false };
  try {
    res = applySpx(A.meta, { score, hero: A.meta.hero, time: summary.time || 0, finished: !!summary.finished });
    A.meta = res.meta;
    persist();
    askPersist();
  } catch (err) {
    reportError(err);
  }
  A.sxResult = { ...res, score, summary };
  if (res.newBest && score > 0) sfx.best();
  renderUI();
}

function leaveSpx() {
  disposeSpx();
  A.screen = 'home';
  A.paused = false;
  A.sxDone = false;
  startGroove(88, 0.25);
  renderUI();
}

function renderSpxUI() {
  if (!A.sx && !A.sxDone) {
    el('div', 'm-chip m-loading', ui, t('spx.loading'));
    return;
  }
  if (!A.sxDone) return;
  const r = A.sxResult;
  const sum = r.summary || {};
  const card = el('div', 'm-card m-over', ui);
  el('div', 'm-band', card);
  el('h2', '', card, sum.finished ? t('spx.over') : t('spx.crashed'));
  el('div', 'm-score', card, r.score.toLocaleString(locale()));
  if (r.newBest && r.score > 0) el('div', 'm-badge', card, `🏆 ${t('m.new_best')}`);
  const stats = el('div', 'm-stats', card);
  if (sum.time) el('span', '', stats, `⏱️ ${t('spx.time')} ${Math.floor(sum.time / 60)}:${String(Math.round(sum.time % 60)).padStart(2, '0')}`);
  el('span', '', stats, `🚬 ${sum.clopes ?? 0}`);
  el('span', '', stats, `${t('spx.best')} ${A.meta.spx.best.toLocaleString(locale())}`);
  if (r.rank > 0) el('span', 'm-gold', stats, `🏆 ${t('spx.rank', { n: r.rank })}`);
  const again = el('button', 'm-btn m-play', ui, t('m.replay'));
  again.onclick = startSpxRide;
  const row = el('div', 'm-row', ui);
  const menu = el('button', 'm-btn m-ghost', row, t('m.menu'));
  menu.onclick = leaveSpx;
  const top = el('button', 'm-btn m-ghost', row, `🏆 ${t('spx.scores')}`);
  top.onclick = () => openRecords('spx');
  if (r.score > 0) onlineBlock(ui, 'spx', r.newBest);
}

function renderUI() {
  ui.textContent = '';
  if (A.screen === 'home') renderHome();
  else if (A.screen === 'run') renderRunUI();
  else if (A.screen === 'pinball') renderPinballUI();
  else if (A.screen === 'spx') renderSpxUI();
  else renderOver();
}

function topBar() {
  const bar = el('div', 'm-top', ui);
  el('div', 'm-chip m-coins', bar, `<i class="m-coin"></i>${A.meta.coins}`);
  el('div', 'm-chip', bar, `${t('m.best')} <b>${A.meta.best}</b>`);
  const spacer = el('div', 'm-grow', bar);
  void spacer;
  const install = installKind();
  if (install && A.screen === 'home') {
    const ib = el('button', 'm-icon m-install', bar, '📲');
    ib.title = t('m.install');
    ib.onclick = () => installGame(install);
  }
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

/** How the game can be added to the home screen here: 'prompt', 'ios', 'android' (menu steps) or null (see install.js). */
function installKind() {
  let standalone = false;
  try {
    standalone = matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || !!navigator.standalone;
  } catch {
    // Old browser: go on.
  }
  return installMode({
    standalone,
    hasPrompt: !!window.__installPrompt,
    appOnPhone: !!window.__appOnPhone,
    ua: navigator.userAgent || '',
    platform: navigator.platform || '',
    touchPoints: navigator.maxTouchPoints || 0,
  });
}

// Chrome can tell whether this game's app is on the phone (manifest related_applications)
try {
  navigator.getInstalledRelatedApps?.().then((apps) => {
    window.__appOnPhone = apps.length > 0;
    if (window.__appOnPhone) renderUI();
  }).catch(() => {});
} catch {
  // Not supported.
}

async function installGame(kind) {
  sfx.click();
  if (kind === 'prompt' && window.__installPrompt) {
    const offer = window.__installPrompt;
    window.__installPrompt = null;
    try {
      await offer.prompt();
      const choice = await offer.userChoice;
      void choice;
    } catch {
      // Dismissed or refused.
    }
    renderUI();
    return;
  }
  const panel = sheet(`📲 ${t('m.install')}`);
  el('p', 'm-install-steps', panel, t(kind === 'android' ? 'm.install_android' : 'm.install_ios'));
  el('p', 'm-hint', panel, t('m.install_offline'));
}
window.addEventListener('pandadventures:installable', () => {
  if (A.screen === 'home' && !document.querySelector('.m-sheet')) renderUI();
  setTimeout(offerInstall, 400);
});

/**
 * Not installed yet: a popup at startup offers to put the game on the home
 * screen (the browser's own prompt on Android and desktop Chrome, the Safari
 * steps on iPhone). Once a day at most, never during a game or over another sheet.
 */
const INSTALL_ASKED = 'pandadventures.installAskedAt';
let installOffered = false;
function offerInstall() {
  if (installOffered || VOLATILE || A.screen !== 'home' || document.querySelector('.m-sheet')) return;
  const kind = installKind();
  if (!kind) return;
  try {
    if (Date.now() - (Number(localStorage.getItem(INSTALL_ASKED)) || 0) < 20 * 3600e3) return;
    localStorage.setItem(INSTALL_ASKED, String(Date.now()));
  } catch {
    // No storage: ask this time anyway.
  }
  installOffered = true;
  const panel = sheet(`📲 ${t('m.install_title')}`);
  panel.classList.add('m-install-offer');
  el('p', 'm-install-lead', panel, t('m.install_lead'));
  const list = el('ul', 'm-install-list', panel);
  for (const k of ['install_b1', 'install_b2', 'install_b3']) el('li', '', list, t(`m.${k}`));
  const close = () => {
    ui.querySelectorAll('.m-sheet, .m-sheet-back').forEach((n) => n.remove());
    renderUI();
  };
  if (kind === 'ios' || kind === 'android') {
    el('p', 'm-install-steps', panel, t(kind === 'android' ? 'm.install_android' : 'm.install_ios'));
    const ok = el('button', 'm-btn m-play', panel, t('m.install_ok'));
    ok.onclick = close;
  } else {
    const go = el('button', 'm-btn m-play', panel, `📲 ${t('m.install_now')}`);
    go.onclick = () => {
      close();
      installGame('prompt');
    };
  }
  const later = el('button', 'm-btn m-ghost m-later', panel, t('m.install_later'));
  later.onclick = close;
}
setTimeout(offerInstall, 1200);

function renderHome() {
  topBar();
  const title = el('div', 'm-title', ui);
  el('h1', '', title, 'Pand<span>Aventures</span>');
  el('p', '', title, t('m.tagline'));
  const play = el('button', 'm-btn m-play', ui, t('m.play'));
  play.onclick = startRun;
  const best = A.meta.pinball.best;
  const flip = el('button', 'm-btn m-ghost m-flipper', ui, `${t('pb.play')}${best ? ` · ${best.toLocaleString(locale())}` : ''}`);
  flip.onclick = startPinball;
  const spxBest = A.meta.spx.best;
  const spx = el('button', 'm-btn m-ghost m-flipper m-spx', ui, `${t('spx.play')}${spxBest ? ` · ${spxBest.toLocaleString(locale())}` : ''}`);
  spx.onclick = startSpxRide;
  const row = el('div', 'm-row', ui);
  const missions = el('button', 'm-btn m-ghost', row, `🎯 ${t('m.missions')}`);
  missions.onclick = () => openMissions();
  const records = el('button', 'm-btn m-ghost m-hof', row, `🏆 ${t('m.records')}`);
  records.onclick = () => openRecords();
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
  try {
    renderOverScreen();
  } catch (err) {
    reportError(err);
    // Minimal screen: the score and the two ways out.
    ui.textContent = '';
    el('div', 'm-card m-over', ui, `<h2>${t('m.over')}</h2><div class="m-score">${A.run?.m.score ?? 0}</div>`);
    const replay = el('button', 'm-btn m-play', ui, t('m.replay'));
    replay.onclick = startRun;
    const menu = el('button', 'm-btn m-ghost', ui, t('m.menu'));
    menu.onclick = () => {
      A.screen = 'home';
      renderUI();
    };
  }
}

function renderOverScreen() {
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
  if (res.rank > 0 && r.m.score > 0) el('span', 'm-gold', stats, `🏆 ${t('m.rank', { n: res.rank })}`);
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
  prepareCard(r);
  share.onclick = () => brag(r);
  if (r.m.score > 0) onlineBlock(ui, 'marathon', !!res.newBest);
}

/** Prepares the score card picture as soon as the game-over screen shows (sharing must stay inside the tap). */
function prepareCard(r) {
  if (r.card) return;
  try {
    prepareCardNow(r);
  } catch (err) {
    r.card = Promise.resolve(null);
    reportError(err);
  }
}

function prepareCardNow(r) {
  r.card = makeShareCard({
    score: r.m.score,
    reached: t('m.reached', { n: r.m.level }),
    best: !!(r.result?.newBest && r.m.score > 0),
    record: t('m.new_best'),
    hero: A.meta.hero,
    hat: A.meta.hat,
    url: location.href.split('?')[0],
  }).catch(() => null);
  r.card.then((file) => (r.cardFile = file));
}

/** Shares the run: the score card picture and a line of text (WhatsApp from the phone's share menu). */
async function brag(r) {
  const url = location.href.split('?')[0];
  const text = t('m.share_text', { n: r.m.level, score: r.m.score, url });
  const file = r.cardFile;
  try {
    if (file && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return;
    }
    if (navigator.share) {
      await navigator.share({ text });
      return;
    }
  } catch (e) {
    if (e?.name === 'AbortError') return;
  }
  // No share menu (a computer): download the picture and copy the text.
  if (file) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  try {
    await navigator.clipboard.writeText(text);
    toast(t(file ? 'm.card_saved' : 'm.copied'));
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

function recordRow(panel, rank, hero, title, meta) {
  const row = el('div', 'm-record', panel);
  el('b', 'm-record-rank', row, `${rank}`);
  const img = el('img', '', row);
  img.src = `${import.meta.env.BASE_URL}cast/${CAST_IDS.includes(hero) ? hero : 'panda'}.svg`;
  img.alt = '';
  const mid = el('div', 'm-record-mid', row);
  el('div', 'm-record-score', mid).textContent = title;
  el('div', 'm-record-meta', mid).textContent = meta;
  return row;
}

/** Talks to the online Hall of Fame (Supabase); ?fakeonline plays with a pretend board on this page. */
const net = params.has('fakeonline') ? createOnline({ url: 'https://fake.local', key: 'fake', fetch: memoryBackend(fakeGang()).fetch }) : createOnline();

/** Sends every best not on the board yet (a new player, a new record, or one that waited for the network). */
let syncing = null;
let syncRetry = 0;
let resetChecked = false;
function syncScores() {
  if (!net.configured || VOLATILE && !params.has('fakeonline')) return Promise.resolve();
  if (syncing) return syncing;
  syncing = (async () => {
    // Once per launch: were this player's records reset on the board (scores from an
    // easier old version)? Then the runs before it are forgotten here too.
    if (!resetChecked && A.meta.online.id) {
      try {
        const since = await net.since(A.meta.online.id);
        resetChecked = true;
        if (since > A.meta.online.since) {
          A.meta.online.since = since;
          A.meta.online.sent = { marathon: 0, flipper: 0, spx: 0 };
          dropOldRecords(A.meta);
          persist();
          if (A.screen === 'home' && !document.querySelector('.m-sheet')) renderUI();
        }
      } catch {
        // No network: send nothing until the reset is known
        clearTimeout(syncRetry);
        syncRetry = setTimeout(() => syncScores(), 12000);
        return;
      }
    }
    for (const game of toSend(A.meta)) {
      const row = rowFor(A.meta, game);
      const res = await net.send(row);
      if (res === 'later') {
        // No network, or too soon after the last send: try again in a while
        clearTimeout(syncRetry);
        syncRetry = setTimeout(() => syncScores(), 12000);
        break;
      }
      // Sent, or refused for good (an impossible score): either way, do not send it again
      A.meta.online.sent[game] = Math.max(A.meta.online.sent[game] || 0, row.score);
      persist();
    }
  })().finally(() => {
    syncing = null;
  });
  return syncing;
}
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => syncScores());
  setTimeout(() => syncScores(), 1500);
}

/** Is this game's best already on the board? Still to send (it is a real score, waiting for the network)? */
const bestSent = (game) => {
  const best = bestRun(A.meta, game);
  return !!best && (A.meta.online.sent[game] || 0) >= best.score;
};
const bestWaiting = (game) => toSend(A.meta).includes(game);

/** Asks for the name shown on the board (once; it can be changed in the Hall of Fame). */
function askName(after) {
  sfx.click();
  const panel = sheet(`🏆 ${t('m.name_title')}`);
  el('p', 'm-hint m-name-hint', panel, t('m.name_hint'));
  const input = el('input', 'm-input', panel);
  input.type = 'text';
  input.maxLength = NAME_MAX;
  input.autocomplete = 'nickname';
  input.placeholder = t('m.name_placeholder');
  input.value = A.meta.online.name || '';
  el('p', 'm-hint', panel, t('m.name_kids'));
  // The face shown next to the name on the board: any of the gang
  el('h3', 'm-sec', panel, `🙂 ${t('m.avatar_pick')}`);
  let face = CAST_IDS.includes(A.meta.online.avatar) ? A.meta.online.avatar : CAST_IDS.includes(A.meta.hero) ? A.meta.hero : 'panda';
  const faces = el('div', 'm-faces', panel);
  for (const id of CAST_IDS) {
    const b = el('button', `m-face${id === face ? ' on' : ''}`, faces);
    b.type = 'button';
    b.setAttribute('aria-label', id);
    const img = el('img', '', b);
    img.src = `${import.meta.env.BASE_URL}cast/${id}.svg`;
    img.alt = '';
    b.onclick = () => {
      face = id;
      faces.querySelectorAll('.m-face').forEach((x) => x.classList.toggle('on', x === b));
    };
  }
  const ok = el('button', 'm-btn m-play', panel, t('m.name_ok'));
  const done = () => {
    const name = cleanName(input.value);
    if (!name) {
      input.classList.remove('shake');
      void input.offsetWidth;
      input.classList.add('shake');
      input.focus();
      return;
    }
    const o = A.meta.online;
    // A new name or face for someone already on the board: send the bests again so the board shows it now
    if (o.name && (o.name !== name || o.avatar !== face)) o.sent = { marathon: 0, flipper: 0, spx: 0 };
    o.name = name;
    o.avatar = face;
    o.id ||= newPlayerId();
    o.asked = true;
    persist();
    ui.querySelectorAll('.m-sheet, .m-sheet-back').forEach((n) => n.remove());
    renderUI();
    toast(t('m.name_saved', { name }));
    syncScores().then(() => renderUI());
    after?.();
  };
  ok.onclick = done;
  input.onkeydown = (e) => {
    if (e.key === 'Enter') done();
  };
  setTimeout(() => input.focus(), 50);
}

/**
 * The Hall of Fame line of an end screen: no name yet → a big button to give one
 * (asked once on its own); a new record → whether it reached the board.
 */
function onlineBlock(parent, game, newBest) {
  if (!net.configured) return;
  const o = A.meta.online;
  const best = bestRun(A.meta, game);
  if (!cleanName(o.name)) {
    if (!best) return;
    const b = el('button', 'm-btn m-play m-hof-cta', parent, `🏆 ${t('m.name_ask')}`);
    b.onclick = () => askName();
    if (!o.asked) {
      o.asked = true;
      persist();
      setTimeout(() => {
        if (!document.querySelector('.m-sheet')) askName();
      }, 900);
    }
    return;
  }
  if (!newBest) {
    syncScores();
    return;
  }
  if (!bestSent(game) && !bestWaiting(game)) return;
  const line = el('div', 'm-online', parent, bestSent(game) ? `📡 ${t('m.sync_sent')}` : `⏳ ${t('m.sync_wait')}`);
  syncScores().then(() => {
    line.textContent = bestSent(game) ? `📡 ${t('m.sync_sent')}` : `⏳ ${t('m.sync_wait')}`;
  });
}

function openRecords(tab = 'marathon') {
  if (!BOARD_GAMES.includes(tab)) tab = 'marathon';
  sfx.click();
  const panel = sheet(`🏆 ${t('m.records')}`);
  const tabs = el('div', 'm-tabs', panel);
  for (const id of BOARD_GAMES) {
    const b = el('button', `m-tab${id === tab ? ' on' : ''}`, tabs, t(`m.tab_${id}`));
    b.onclick = () => {
      ui.querySelector('.m-sheet-back')?.remove();
      panel.remove();
      openRecords(id);
    };
  }
  const date = (at) => (at ? new Date(at).toLocaleDateString(locale()) : '');
  const clockOf = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  const detail = (x, at) => {
    if (tab === 'marathon') return `${t('m.reached', { n: x.level })} · ${date(at)}`;
    if (tab === 'spx') {
      const secs = x.time ?? x.ride_time;
      const home = x.finished ?? x.home;
      return `${home ? '🏠' : '💥'} ${secs ? `${clockOf(secs)} · ` : ''}${date(at)}`;
    }
    return date(at);
  };
  const fmt = (n) => Number(n).toLocaleString(locale());

  // The gang's board first, then the records of this phone
  if (net.configured) {
    const name = cleanName(A.meta.online.name);
    const me = el('button', 'm-btn m-ghost m-me', panel, name ? `${name} · ✏️ ${t('m.name_change')}` : `🏆 ${t('m.name_ask')}`);
    if (name) {
      const img = document.createElement('img');
      img.src = `${import.meta.env.BASE_URL}cast/${CAST_IDS.includes(A.meta.online.avatar) ? A.meta.online.avatar : 'panda'}.svg`;
      img.alt = '';
      me.prepend(img);
    }
    me.onclick = () => {
      ui.querySelectorAll('.m-sheet, .m-sheet-back').forEach((n) => n.remove());
      askName(() => openRecords(tab));
    };
    el('h3', 'm-sec', panel, `👥 ${t('m.board_gang')}`);
    const status = el('p', 'm-empty', panel, t('m.loading'));
    const list = el('div', '', panel);
    net
      .board(tab)
      .then((rows) => {
        status.remove();
        if (!rows.length) el('p', 'm-empty', list, t('m.gang_empty'));
        rows.forEach((x, i) => {
          const row = recordRow(list, i + 1, x.hero, `${fmt(x.score)}  ·  ${x.name}`, detail(x, x.played_at));
          if (i < 3) row.classList.add(`m-podium-${i + 1}`);
          if (name && x.name === name) row.classList.add('is-me');
        });
        if (name && bestWaiting(tab)) el('p', 'm-hint', list, `⏳ ${t('m.sync_wait')}`);
      })
      .catch(() => {
        status.textContent = t('m.gang_offline');
      });
  }
  el('h3', 'm-sec', panel, `📱 ${t('m.board_mine')}`);
  const mine = tab === 'marathon' ? A.meta.scores : tab === 'flipper' ? A.meta.pinball.scores : A.meta.spx.scores;
  if (!mine.length) el('p', 'm-empty', panel, t(tab === 'marathon' ? 'm.no_records' : tab === 'flipper' ? 'pb.none' : 'spx.none'));
  mine.forEach((x, i) => recordRow(panel, i + 1, x.hero, fmt(x.score), detail(x, x.at)));
  if (net.configured) el('p', 'm-hint', panel, t('m.gang_hint'));
}

/** A pretend gang for ?fakeonline (test links only). */
function fakeGang() {
  const at = Date.now() - 3600e3;
  return [
    { player_id: 'f1', name: 'Cous', game: 'marathon', score: 520, level: 40, streak: 14, hero: 'cous', played_at: new Date(at).toISOString() },
    { player_id: 'f2', name: 'Eul’ Tatou', game: 'marathon', score: 300, level: 25, streak: 9, hero: 'panda', played_at: new Date(at).toISOString() },
    { player_id: 'f1', name: 'Cous', game: 'spx', score: 41250, ride_time: 138, home: true, hero: 'panda', played_at: new Date(at).toISOString() },
    { player_id: 'f3', name: 'Babar', game: 'flipper', score: 812300, hero: 'babar', played_at: new Date(at).toISOString() },
  ];
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
      persist();
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
  citroen: { en: 'Citroën', fr: 'Citroën' },
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
  try {
    update(dt);
    draw();
  } catch (err) {
    reportError(err);
  }
  requestAnimationFrame(frame);
}

let lastReported = '';
/** Shows an error once (small toast) and keeps it in storage, so a bug on a phone can be reported. */
function reportError(err) {
  const text = String(err?.message || err).slice(0, 140);
  console.error(err);
  try {
    localStorage.setItem('pandadventures.lastError', `${new Date().toISOString()} ${text} ${String(err?.stack || '').slice(0, 400)}`);
  } catch {
    // No storage.
  }
  if (text !== lastReported) {
    lastReported = text;
    try {
      toast(`Oups : ${text}`);
    } catch {
      // The UI itself is broken: nothing more to do.
    }
  }
}
window.addEventListener('error', (e) => reportError(e.error || e.message));
window.addEventListener('unhandledrejection', (e) => reportError(e.reason));

// Draw at once: faces have a drawn fallback until their pictures arrive.
requestAnimationFrame(frame);
art.loadHeads(`${import.meta.env.BASE_URL}cast/`).then(() => renderUI());
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
