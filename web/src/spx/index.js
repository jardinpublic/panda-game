/*
 * 103 SPX: Panda's moped ride home through Montceau-les-Mines (see DESIGN.md).
 * Runs inside a <div>: a WebGL view (view.js) of the rules (rules.js), a DOM
 * HUD, touch and keyboard input, and its own sounds (sound.js).
 *
 *   const handle = await startSpx({ root, lang, t, sound, onGameOver, onExit, auto });
 *   handle.dispose();
 *
 * Touch: tap fast to pedal the engine into life; slide a thumb to steer;
 * flick up to jump; the round button does the action of the moment (hold it to
 * shout at Pépé Gogol, tap it to push Les Azzouz away or to whack Pietro Gangi).
 * Keyboard: ← → steer, ↑ / Space jump (Space pedals at the start), E / Enter
 * the action, Escape quits.
 */
import { createRules, CAST_SPEAKERS, clock } from './rules.js';
import { createAutoplay } from './autoplay.js';
import { createView } from './view.js';
import { createSound } from './sound.js';
import { createTexts } from './texts.js';
import { faceUrl } from './faces.js';
import { RING_MAP } from './route.js';
import { loadKit } from './kit.js';
import { heard, setVoiceMuted } from '../core/voice.js';

const CSS = `
.sx-root [hidden] { display: none !important; }
.sx-root { position: absolute; inset: 0; overflow: hidden; background: #f6d6b2; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; font-family: Fredoka, system-ui, sans-serif; color: #fff; }
.sx-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.sx-touch { position: absolute; inset: 0; touch-action: none; }
.sx-hud { position: absolute; inset: 0; pointer-events: none; }
.sx-top { position: absolute; top: max(10px, env(safe-area-inset-top)); left: 56px; right: 10px; display: flex; gap: 6px; align-items: center; }
.sx-chip { background: rgba(20, 16, 40, 0.55); backdrop-filter: blur(4px); border-radius: 999px; padding: 4px 10px; font-weight: 700; font-size: 15px; white-space: nowrap; }
.sx-chip.is-bump { animation: sx-bump .3s ease-out; }
.sx-score { font-size: 22px; margin-left: auto; padding: 3px 12px; letter-spacing: .5px; text-shadow: 0 2px 0 rgba(0,0,0,.25); }
.sx-mult { position: absolute; right: 10px; top: calc(max(10px, env(safe-area-inset-top)) + 40px); display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
.sx-mult b { font-size: 30px; font-weight: 800; color: #ffd23f; -webkit-text-stroke: 1.5px #5a2a00; text-shadow: 0 3px 0 #ef2d6b; line-height: 1; transform-origin: right center; }
.sx-mult b.is-up { animation: sx-multup .4s cubic-bezier(.3,1.8,.5,1); }
.sx-mult i { display: block; width: 64px; height: 6px; border-radius: 3px; background: rgba(255,255,255,.3); overflow: hidden; }
.sx-mult i span { display: block; height: 100%; background: #ffd23f; }
.sx-speedo { position: absolute; left: 8px; bottom: calc(max(8px, env(safe-area-inset-bottom)) + 4px); width: 118px; height: 118px; filter: drop-shadow(0 6px 10px rgba(0,0,0,.35)); }
.sx-flash { position: absolute; top: 0; bottom: 0; width: 34%; opacity: 0; pointer-events: none; }
.sx-flash.l { left: 0; background: linear-gradient(90deg, rgba(255,255,255,.55), rgba(255,255,255,0)); }
.sx-flash.r { right: 0; background: linear-gradient(270deg, rgba(255,255,255,.55), rgba(255,255,255,0)); }
.sx-flash.is-on { animation: sx-flash .45s ease-out; }
.sx-hurt { position: absolute; inset: 0; pointer-events: none; opacity: 0; box-shadow: inset 0 0 90px 30px rgba(230,30,40,.65); }
.sx-hurt.is-on { animation: sx-flash .7s ease-out; }
.sx-vignette { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 58%, rgba(30,10,0,.32) 100%); }
.sx-turbo { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .3s; box-shadow: inset 0 0 70px 18px rgba(90,170,255,.55); }
.sx-turbo.is-on { opacity: 1; }
.sx-close { position: absolute; top: max(10px, env(safe-area-inset-top)); left: 10px; width: 38px; height: 38px; border-radius: 50%; border: 0; background: rgba(20, 16, 40, 0.55); color: #fff; font-size: 24px; line-height: 38px; pointer-events: auto; }
.sx-map { position: absolute; right: 10px; top: calc(max(10px, env(safe-area-inset-top)) + 92px); width: 92px; height: 92px; border-radius: 16px; background: rgba(20, 16, 40, 0.45); }
.sx-street { position: absolute; left: 12px; top: calc(max(10px, env(safe-area-inset-top)) + 50px); background: #1f4fa0; border: 3px solid #e9efe6; outline: 3px solid #2d7a4b; border-radius: 10px; padding: 4px 14px; font-weight: 700; font-size: 16px; letter-spacing: 0.5px; white-space: nowrap; max-width: calc(100% - 136px); overflow: hidden; text-overflow: ellipsis; transition: opacity .4s, transform .4s; }
.sx-street.is-off { opacity: 0; transform: translateY(-12px); }
.sx-toasts { position: absolute; left: 0; right: 0; top: calc(max(10px, env(safe-area-inset-top)) + 210px); display: flex; flex-direction: column; align-items: center; gap: 4px; }
.sx-toast { background: rgba(20, 16, 40, 0.6); border-radius: 999px; padding: 3px 12px; font-weight: 700; font-size: 15px; animation: sx-up 1.6s ease-out forwards; }
.sx-pop { position: absolute; left: 0; right: 0; top: 37%; text-align: center; font-size: clamp(30px, 10vw, 54px); font-weight: 800; color: #ffd23f; -webkit-text-stroke: 2px #4a2a00; text-shadow: 0 4px 0 #ef2d6b; transform: scale(0.6); opacity: 0; transition: transform .25s cubic-bezier(.3,1.6,.5,1), opacity .25s; padding: 0 12px; line-height: 1.05; }
.sx-pop.is-on { transform: scale(1); opacity: 1; }
.sx-shout { position: absolute; left: 0; right: 0; top: 44%; text-align: center; font-weight: 800; color: #fff; -webkit-text-stroke: 2px #6b2a8e; font-size: clamp(18px, 6.4vw, 40px); padding: 0 6px; white-space: nowrap; letter-spacing: -0.5px; }
.sx-chat { position: absolute; left: 10px; right: 10px; bottom: calc(max(12px, env(safe-area-inset-bottom)) + 176px); display: flex; gap: 8px; align-items: flex-end; animation: sx-in .25s ease-out; }
.sx-chat img { width: 54px; height: 66px; object-fit: contain; flex: none; filter: drop-shadow(0 3px 4px rgba(0,0,0,.35)); }
.sx-chat p { margin: 0; background: #fffdf7; color: #2b2340; border-radius: 16px 16px 16px 4px; padding: 7px 12px; font-size: 16px; line-height: 1.25; box-shadow: 0 4px 14px rgba(20,10,40,.25); max-width: 78%; }
.sx-chat b { display: block; font-size: 12px; color: #ef2d6b; }
.sx-tip { position: absolute; left: 14px; right: 14px; bottom: calc(max(12px, env(safe-area-inset-bottom)) + 134px); text-align: center; font-weight: 700; font-size: 15px; text-shadow: 0 2px 4px rgba(0,0,0,.6); }
.sx-act { position: absolute; right: 16px; bottom: calc(max(14px, env(safe-area-inset-bottom)) + 8px); width: 92px; height: 92px; border-radius: 50%; border: 4px solid #fff; background: radial-gradient(circle at 35% 30%, #ff6f9a, #ef2d6b); color: #fff; font: 800 13px Fredoka, system-ui, sans-serif; box-shadow: 0 8px 22px rgba(239,45,107,.5); pointer-events: auto; animation: sx-pulse 1s ease-in-out infinite; padding: 6px; line-height: 1.1; touch-action: none; }
.sx-act[hidden] { display: none; }
.sx-act-label { position: absolute; right: 12px; bottom: calc(max(14px, env(safe-area-inset-bottom)) + 112px); max-width: calc(100% - 150px); text-align: right; background: rgba(20, 16, 40, 0.65); border-radius: 12px; padding: 6px 10px; font-weight: 700; font-size: 14px; }
.sx-pedal { position: absolute; left: 50%; bottom: 22%; transform: translateX(-50%); width: 132px; height: 132px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; font-size: 20px; color: #fff; background: conic-gradient(#ffd23f calc(var(--p) * 1turn), rgba(20,16,40,.55) 0); box-shadow: 0 10px 30px rgba(0,0,0,.3); }
.sx-pedal span { width: 108px; height: 108px; border-radius: 50%; display: grid; place-items: center; background: #ef2d6b; text-align: center; line-height: 1.05; }
.sx-mirror { position: absolute; left: 50%; transform: translateX(-50%); top: calc(max(10px, env(safe-area-inset-top)) + 92px); width: 150px; height: 74px; border-radius: 18px; border: 5px solid #26232e; box-shadow: 0 6px 14px rgba(0,0,0,.35), inset 0 0 0 2px rgba(255,255,255,.35); }
.sx-chase { top: calc(max(10px, env(safe-area-inset-top)) + 176px); }
.sx-duel { bottom: calc(max(12px, env(safe-area-inset-bottom)) + 236px); }
.sx-chase, .sx-duel { position: absolute; left: 50%; transform: translateX(-50%); background: rgba(20, 16, 40, 0.6); border-radius: 999px; padding: 4px 12px; font-weight: 700; font-size: 14px; white-space: nowrap; }
.sx-bar { display: inline-block; width: 90px; height: 8px; border-radius: 4px; background: rgba(255,255,255,.25); vertical-align: middle; margin-left: 6px; overflow: hidden; }
.sx-bar i { display: block; height: 100%; background: #ff3b3b; }
@keyframes sx-up { 0% { opacity: 0; transform: translateY(8px); } 15% { opacity: 1; transform: none; } 80% { opacity: 1; } 100% { opacity: 0; transform: translateY(-10px); } }
@keyframes sx-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes sx-bump { 0% { transform: scale(1.25); } 100% { transform: scale(1); } }
@keyframes sx-multup { 0% { transform: scale(1.9); } 100% { transform: scale(1); } }
@keyframes sx-flash { 0% { opacity: 1; } 100% { opacity: 0; } }
@keyframes sx-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.07); } }
`;

function el(tag, className, parent, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

/** Where the cast faces live (web/public/cast). */
export function castUrl(id) {
  const base = (import.meta.env && import.meta.env.BASE_URL) || './';
  return base + 'cast/' + id + '.svg';
}

export async function startSpx(options) {
  const { root } = options;
  const lang = options.lang === 'fr' ? 'fr' : 'en';
  const random = options.random || Math.random;
  const tx = createTexts(lang, random);
  const onGameOver = options.onGameOver || (() => {});
  const onExit = options.onExit || (() => {});
  const fmt = (n) => Math.round(n).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US');
  const listeners = [];
  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    listeners.push(() => target.removeEventListener(type, fn, opts));
  };
  const timers = new Set();
  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  };

  /* ---------- DOM ---------- */
  const shell = el('div', 'sx-root');
  el('style', '', shell).textContent = CSS;
  if (getComputedStyle(root).position === 'static') root.style.position = 'relative';
  root.appendChild(shell);
  const canvas = el('canvas', 'sx-canvas', shell);
  const touch = el('div', 'sx-touch', shell);
  const hud = el('div', 'sx-hud', shell);
  el('div', 'sx-vignette', hud);
  const turboGlow = el('div', 'sx-turbo', hud);
  const hurt = el('div', 'sx-hurt', hud);
  const flashL = el('div', 'sx-flash l', hud);
  const flashR = el('div', 'sx-flash r', hud);
  const top = el('div', 'sx-top', hud);
  const hearts = el('span', 'sx-chip', top);
  const clopes = el('span', 'sx-chip', top);
  const score = el('span', 'sx-chip sx-score', top);
  const multBox = el('div', 'sx-mult', hud);
  const multText = el('b', '', multBox);
  const multBar = el('span', '', el('i', '', multBox));
  multBox.hidden = true;
  const speedo = el('canvas', 'sx-speedo', hud);
  speedo.width = 236;
  speedo.height = 236;
  const map = el('canvas', 'sx-map', hud);
  map.width = 184;
  map.height = 184;
  const street = el('div', 'sx-street is-off', hud);
  const toasts = el('div', 'sx-toasts', hud);
  const pop = el('div', 'sx-pop', hud);
  const shout = el('div', 'sx-shout', hud);
  const chat = el('div', 'sx-chat', hud);
  chat.hidden = true;
  const tip = el('div', 'sx-tip', hud);
  const mirror = el('div', 'sx-mirror', hud);
  mirror.hidden = true;
  const chaseBox = el('div', 'sx-chase', hud);
  chaseBox.hidden = true;
  const duelBox = el('div', 'sx-duel', hud);
  duelBox.hidden = true;
  const pedalBtn = el('div', 'sx-pedal', hud);
  el('span', '', pedalBtn, lang === 'fr' ? 'PÉDALE !' : 'PEDAL!');
  const actLabel = el('div', 'sx-act-label', hud);
  actLabel.hidden = true;
  const act = el('button', 'sx-act', shell);
  act.type = 'button';
  act.hidden = true;
  const close = el('button', 'sx-close', shell, '×');
  close.type = 'button';
  close.setAttribute('aria-label', tx('quit'));

  /* ---------- Messages ---------- */
  const NAMES = { panda: 'Panda', cous: 'Cous', romain: 'Romain', victor: 'Victor', aline: 'Aline', babar: 'Babar' };
  function speakerOf(id) {
    if (CAST_SPEAKERS.includes(id)) return { name: NAMES[id] || id, face: castUrl(id) };
    return { name: tx(id + 'Name'), face: faceUrl(id) };
  }
  let chatTimer = 0;
  let popTimer = 0;
  let tipTimer = 0;
  let streetTimer = 0;
  const readMs = (text) => Math.min(7000, 1700 + String(text).length * 55);
  function say(kind, key, vars, speaker) {
    const text = kind === 'line' ? key : tx(key, vars);
    heard(text);
    if (kind === 'chat' || kind === 'line') {
      const who = speakerOf(speaker || 'panda');
      chat.replaceChildren();
      const img = el('img', '', chat);
      img.src = who.face;
      img.alt = '';
      const p = el('p', '', chat);
      el('b', '', p, who.name);
      p.append(text);
      chat.hidden = false;
      clearTimeout(chatTimer);
      chatTimer = later(() => (chat.hidden = true), readMs(text));
    } else if (kind === 'pop') {
      pop.textContent = text;
      pop.classList.add('is-on');
      clearTimeout(popTimer);
      popTimer = later(() => pop.classList.remove('is-on'), 1800);
    } else if (kind === 'toast') {
      const node = el('div', 'sx-toast', toasts, text);
      while (toasts.children.length > 3) toasts.firstChild.remove();
      later(() => node.remove(), 1700);
    } else if (kind === 'tip') {
      tip.textContent = text;
      tip.hidden = false;
      clearTimeout(tipTimer);
      tipTimer = later(() => (tip.hidden = true), Math.max(3500, readMs(text)));
    }
  }

  function flash(node) {
    node.classList.remove('is-on');
    void node.offsetWidth;
    node.classList.add('is-on');
  }
  function bump(node) {
    node.classList.remove('is-bump');
    void node.offsetWidth;
    node.classList.add('is-bump');
  }

  /* ---------- Rules, view, sound ---------- */
  const synth = createSound({ muted: options.sound === false });
  setVoiceMuted(options.sound === false);
  let sirenOn = false;
  let ended = false;
  let rules = null;
  let view = null;
  const out = {
    say,
    sound: (name, arg) => synth.play(name, arg),
    event: (name, data) => {
      view?.event(name, data);
      if (name === 'nearMiss') flash(data && data.side < 0 ? flashL : flashR);
      if (name === 'crash' || name === 'ram') flash(hurt);
      if (name === 'clope') bump(clopes);
      if (name === 'mult') {
        multText.classList.remove('is-up');
        void multText.offsetWidth;
        multText.classList.add('is-up');
      }
      if (name === 'street') {
        street.textContent = data.name;
        street.classList.remove('is-off');
        clearTimeout(streetTimer);
        streetTimer = later(() => street.classList.add('is-off'), 2600);
      }
      if (name === 'siren') {
        sirenOn = !!data.on;
        synth.setSiren(sirenOn, 0.5);
      }
      if (name === 'finish' || name === 'over') endRide(data, name === 'finish' ? 5200 : 2600);
    },
  };
  // The ready-made models (cars, tower blocks): the game still runs without them
  tip.textContent = tx('loading');
  const kit = await loadKit((import.meta.env && import.meta.env.BASE_URL) || './').catch(() => null);
  rules = createRules({ random, out });
  rules.newGame();
  const st = rules.state;
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  view = createView({ canvas, rules, tier: coarse ? 1 : 2, castUrl, texts: tx, kit });
  const bot = options.auto ? createAutoplay(rules) : null;

  function endRide(summary, ms) {
    if (ended) return;
    ended = true;
    act.hidden = true;
    actLabel.hidden = true;
    later(() => {
      synth.stopEngine();
      synth.setSiren(false);
      onGameOver({ score: summary.score, summary });
    }, ms);
  }

  /* ---------- Minimap: the real streets, north up ---------- */
  const mapBg = document.createElement('canvas');
  mapBg.width = map.width;
  mapBg.height = map.height;
  const pts = rules.route.mapPath;
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const pad = 16;
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const mk = (map.width - pad * 2) / span;
  const mx0 = (Math.min(...xs) + Math.max(...xs)) / 2;
  const my0 = (Math.min(...ys) + Math.max(...ys)) / 2;
  const toMap = (p) => [map.width / 2 + (p[0] - mx0) * mk, map.height / 2 - (p[1] - my0) * mk];
  {
    const g = mapBg.getContext('2d');
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.strokeStyle = 'rgba(255,255,255,0.85)';
    g.lineWidth = 6;
    g.beginPath();
    pts.forEach((p, i) => {
      const [x, y] = toMap(p);
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    });
    g.stroke();
    const [rx, ry] = toMap([RING_MAP.x, RING_MAP.y]);
    g.strokeStyle = '#ffd23f';
    g.lineWidth = 4;
    g.beginPath();
    g.arc(rx, ry, Math.max(5, RING_MAP.r * mk), 0, Math.PI * 2);
    g.stroke();
    const [hx, hy] = toMap(pts[pts.length - 1]);
    g.font = '28px system-ui';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('🏠', hx, hy - 4);
  }
  function drawMap() {
    const g = map.getContext('2d');
    g.clearRect(0, 0, map.width, map.height);
    g.drawImage(mapBg, 0, 0);
    const [x, y] = toMap(rules.route.mapPoint(st.s));
    g.fillStyle = '#ef2d6b';
    g.strokeStyle = '#fff';
    g.lineWidth = 4;
    g.beginPath();
    g.arc(x, y, 9, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }

  /* ---------- Speedometer: the 103's round dial, the turbo gauge around it ---------- */
  function drawSpeedo() {
    const g = speedo.getContext('2d');
    const W = speedo.width;
    const c = W / 2;
    g.clearRect(0, 0, W, W);
    const a0 = Math.PI * 0.75;
    const span = Math.PI * 1.5;
    // Turbo gauge
    g.lineCap = 'round';
    g.lineWidth = 14;
    g.strokeStyle = 'rgba(20,16,40,.55)';
    g.beginPath();
    g.arc(c, c, c - 9, a0, a0 + span);
    g.stroke();
    const full = st.boost > 0 ? 1 : st.gauge;
    if (full > 0.01) {
      g.strokeStyle = st.boost > 0 ? '#7cc0ff' : '#2ec4ff';
      g.shadowColor = '#7cc0ff';
      g.shadowBlur = st.boost > 0 ? 18 : 6;
      g.beginPath();
      g.arc(c, c, c - 9, a0, a0 + span * full);
      g.stroke();
      g.shadowBlur = 0;
    }
    // Dial
    g.fillStyle = '#f7f3ea';
    g.beginPath();
    g.arc(c, c, c - 20, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 5;
    g.strokeStyle = '#2b2340';
    g.stroke();
    g.fillStyle = '#2b2340';
    g.font = '700 17px Fredoka, system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (let k = 0; k <= 90; k += 10) {
      const a = a0 + (k / 90) * span;
      const r1 = c - 26;
      const r2 = k % 20 === 0 ? c - 40 : c - 34;
      g.lineWidth = k % 20 === 0 ? 4 : 2;
      g.strokeStyle = k >= 70 ? '#e23b3b' : '#2b2340';
      g.beginPath();
      g.moveTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1);
      g.lineTo(c + Math.cos(a) * r2, c + Math.sin(a) * r2);
      g.stroke();
      if (k % 20 === 0) g.fillText(String(k), c + Math.cos(a) * (c - 54), c + Math.sin(a) * (c - 54));
    }
    const kmh = st.v * 3.6;
    g.font = '800 30px Fredoka, system-ui, sans-serif';
    g.fillStyle = '#ef2d6b';
    g.fillText(String(Math.round(kmh)), c, c + 34);
    g.font = '700 13px Fredoka, system-ui, sans-serif';
    g.fillStyle = '#6b6480';
    g.fillText('km/h', c, c + 56);
    const a = a0 + (Math.min(95, kmh + (st.v > 1 ? Math.sin(performance.now() / 40) * 0.6 : 0)) / 90) * span;
    g.strokeStyle = '#e23b3b';
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(c - Math.cos(a) * 12, c - Math.sin(a) * 12);
    g.lineTo(c + Math.cos(a) * (c - 34), c + Math.sin(a) * (c - 34));
    g.stroke();
    g.fillStyle = '#2b2340';
    g.beginPath();
    g.arc(c, c, 10, 0, Math.PI * 2);
    g.fill();
  }

  /* ---------- Input ---------- */
  synth.unlock();
  let drag = null;
  const steerScale = () => (rules.tuning.edge * 2) / Math.max(200, shell.clientWidth * 0.8);
  on(touch, 'pointerdown', (e) => {
    synth.unlock();
    if (st.phase === 'pedal') {
      rules.pedal();
      return;
    }
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, jumped: false };
    touch.setPointerCapture?.(e.pointerId);
  });
  on(touch, 'pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    drag.moved += Math.abs(dx);
    drag.x = e.clientX;
    rules.nudge(dx * steerScale());
    if (!drag.jumped && drag.y - e.clientY > 42 && performance.now() - drag.t < 380) {
      drag.jumped = true;
      rules.jump();
    }
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    // A quick tap does the "tap" action too (push Les Azzouz, whack Pietro)
    if (!drag.jumped && drag.moved < 12 && performance.now() - drag.t < 250 && st.prompt && st.prompt.kind === 'tap') {
      rules.press();
      rules.release();
    }
    drag = null;
  };
  on(touch, 'pointerup', endDrag);
  on(touch, 'pointercancel', endDrag);
  on(act, 'pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    synth.unlock();
    act.setPointerCapture?.(e.pointerId);
    rules.press();
  });
  const actUp = () => rules.release();
  on(act, 'pointerup', actUp);
  on(act, 'pointercancel', actUp);
  on(close, 'click', () => onExit());
  const keys = new Set();
  on(window, 'keydown', (e) => {
    if (e.repeat && !['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'KeyQ'].includes(e.code)) return;
    keys.add(e.code);
    synth.unlock();
    if (e.code === 'Escape') onExit();
    else if (['Space', 'ArrowUp', 'KeyW', 'KeyZ'].includes(e.code)) {
      if (st.phase === 'pedal') rules.pedal();
      else rules.jump();
      e.preventDefault();
    } else if (['KeyE', 'Enter', 'ShiftLeft', 'ShiftRight'].includes(e.code) && !e.repeat) {
      rules.press();
      e.preventDefault();
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      if (st.phase === 'pedal') rules.pedal();
    }
  });
  on(window, 'keyup', (e) => {
    keys.delete(e.code);
    if (['KeyE', 'Enter', 'ShiftLeft', 'ShiftRight'].includes(e.code)) rules.release();
  });

  /* ---------- Loop ---------- */
  function resize() {
    const w = shell.clientWidth || 390;
    const h = shell.clientHeight || 844;
    view.resize(w, h);
  }
  resize();
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  observer?.observe(shell);

  const shown = {};
  const setText = (node, key, text) => {
    if (shown[key] !== text) {
      shown[key] = text;
      node.textContent = text;
    }
  };
  let voiceOn = false;
  let last = performance.now();
  let frameId = 0;
  let disposed = false;
  function frame(now) {
    if (disposed) return;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    try {
      if (bot) bot.step(dt);
      if (keys.has('ArrowLeft') || keys.has('KeyA') || keys.has('KeyQ')) rules.nudge(-7 * dt);
      if (keys.has('ArrowRight') || keys.has('KeyD')) rules.nudge(7 * dt);
      rules.update(dt);
      view.update(dt);
      hudFrame();
      synth.setEngine(st.phase === 'ride' ? st.v : 0, st.boost > 0);
      if (sirenOn) synth.setSiren(true, Math.max(0, 1 - st.chase.gap / 40));
      if (st.scream > 0 && !voiceOn) {
        voiceOn = true;
        synth.startVoice();
      } else if (st.scream === 0 && voiceOn) {
        voiceOn = false;
        synth.stopVoice();
      }
    } catch (err) {
      console.error(err);
      options.onError?.(err);
    }
    frameId = requestAnimationFrame(frame);
  }

  function hudFrame() {
    setText(hearts, 'h', '❤️'.repeat(st.hearts) + '🖤'.repeat(Math.max(0, rules.tuning.hearts - st.hearts)));
    setText(clopes, 'c', `🚬 ${st.clopes}`);
    setText(score, 's', fmt(st.score));
    multBox.hidden = st.mult <= 1;
    if (st.mult > 1) {
      setText(multText, 'm', '×' + st.mult);
      multBar.style.width = `${Math.round((st.comboT / rules.tuning.combo.window) * 100)}%`;
    }
    turboGlow.classList.toggle('is-on', st.boost > 0 && st.phase === 'ride');
    drawSpeedo();
    const pedaling = st.phase === 'pedal';
    pedalBtn.hidden = !pedaling;
    if (pedaling) pedalBtn.style.setProperty('--p', st.pedal.toFixed(3));
    const pr = st.prompt;
    const showAct = !!pr && !ended;
    act.hidden = !showAct;
    actLabel.hidden = !showAct;
    if (showAct) {
      setText(act, 'a', pr.kind === 'hold' ? (lang === 'fr' ? 'MAINTIENS' : 'HOLD') : lang === 'fr' ? 'TAPE !' : 'TAP!');
      setText(actLabel, 'al', tx(pr.key));
    }
    if (st.scream > 0) {
      shout.hidden = false;
      setText(shout, 'sh', 'PÉPÉ GOGO' + 'O'.repeat(1 + Math.round(Math.min(3, st.scream) * 4)) + 'L');
    } else shout.hidden = true;
    chaseBox.hidden = !st.chase.on;
    // The rear-view mirror shows the cops behind
    mirror.hidden = !st.chase.on;
    if (st.chase.on) {
      const a = mirror.getBoundingClientRect();
      const b = canvas.getBoundingClientRect();
      view.setMirror({ x: a.left - b.left + 5, y: a.top - b.top + 5, w: a.width - 10, h: a.height - 10 });
    } else view.setMirror(null);
    if (st.chase.on) {
      const danger = Math.max(0, Math.min(1, 1 - st.chase.gap / rules.tuning.police.maxGap));
      if (!chaseBox.firstChild) {
        chaseBox.append('🚓');
        el('span', 'sx-bar', chaseBox).append(el('i'));
      }
      chaseBox.querySelector('i').style.width = `${Math.round(danger * 100)}%`;
    }
    const d = st.duel;
    const b = d && !d.over ? st.entities.find((e) => e.id === d.id) : null;
    duelBox.hidden = !b;
    if (b) {
      const gap = Math.round(st.s - b.s);
      setText(duelBox, 'd', `🛵 Babar ${gap >= 0 ? '−' : '+'}${Math.abs(gap)} m · ${Math.round(d.finish - st.s)} m`);
    }
    drawMap();
  }
  frameId = requestAnimationFrame(frame);

  const handle = {
    rules,
    view,
    bot,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      for (const off of listeners) off();
      for (const id of timers) clearTimeout(id);
      observer?.disconnect();
      synth.dispose();
      view.dispose();
      shell.remove();
    },
    clock,
  };
  // The bot ride (?spxauto) is a test link: let the console reach the game
  if (options.auto) window.__spx = handle;
  return handle;
}
