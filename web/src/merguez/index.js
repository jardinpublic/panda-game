/*
 * Golden Merguez (see DESIGN.md): the gang throws food at each other across
 * Montceau-les-Mines. Runs inside a <div>: a WebGL view (view.js) of the rules
 * (rules.js), a DOM HUD, touch and keyboard input, the marathon's sounds.
 *
 *   const handle = await startMerguez({ root, lang, hero, onGameOver, onExit });
 *   handle.dispose();
 *
 * Touch: hold anywhere to pop out of cover and throw, drag to aim, let go to
 * duck back (and reload). Keyboard: Space holds out, arrows aim, Escape quits.
 */
import { createRules, botInput, HEARTS, LEVELS } from './rules.js';
export { WEAPON_OF } from './rules.js';
import { createView } from './view.js';
import { loadHeads } from '../marathon/art.js';
import { sfx } from '../marathon/sound.js';
import { paintFace } from '../spx/faces.js';

const CSS = `
.gm-root { position: absolute; inset: 0; overflow: hidden; background: #a9d6f2; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; font-family: Fredoka, system-ui, sans-serif; color: #fff; }
.gm-root [hidden] { display: none !important; }
.gm-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.gm-touch { position: absolute; inset: 0; touch-action: none; }
.gm-hud { position: absolute; inset: 0; pointer-events: none; }
.gm-top { position: absolute; top: max(10px, env(safe-area-inset-top)); left: 56px; right: 10px; display: flex; gap: 6px; align-items: center; }
.gm-chip { background: rgba(20, 16, 40, 0.55); backdrop-filter: blur(4px); border-radius: 999px; padding: 4px 10px; font-weight: 700; font-size: 15px; white-space: nowrap; }
.gm-score { font-size: 22px; margin-left: auto; padding: 3px 12px; }
.gm-mult { position: absolute; right: 12px; top: calc(max(10px, env(safe-area-inset-top)) + 42px); font-size: 30px; font-weight: 800; color: #ffd23f; -webkit-text-stroke: 1.5px #5a2a00; text-shadow: 0 3px 0 #ef2d6b; }
.gm-mult.is-up { animation: gm-up .4s cubic-bezier(.3,1.8,.5,1); }
.gm-cross { position: absolute; left: 50%; top: 50%; width: 34px; height: 34px; margin: -17px 0 0 -17px; border-radius: 50%; border: 3px solid rgba(255,255,255,.9); box-shadow: 0 0 0 2px rgba(0,0,0,.25); transition: transform .12s, border-color .12s, opacity .15s; }
.gm-cross::after { content: ''; position: absolute; left: 50%; top: 50%; width: 6px; height: 6px; margin: -3px; border-radius: 50%; background: #fff; }
.gm-cross.is-on { border-color: #ff3b3b; transform: scale(.8); }
.gm-cross.is-hid { opacity: .35; }
.gm-ammo { position: absolute; left: 12px; bottom: calc(max(12px, env(safe-area-inset-bottom)) + 6px); background: rgba(20,16,40,.55); border-radius: 14px; padding: 6px 10px; font-weight: 700; font-size: 14px; }
.gm-ammo i { display: inline-block; width: 9px; height: 16px; margin-right: 3px; border-radius: 3px; background: #ffd23f; vertical-align: middle; }
.gm-ammo i.off { background: rgba(255,255,255,.25); }
.gm-boss { position: absolute; left: 50%; transform: translateX(-50%); top: calc(max(10px, env(safe-area-inset-top)) + 46px); background: rgba(20, 16, 40, 0.6); border-radius: 999px; padding: 4px 12px; font-weight: 700; font-size: 14px; white-space: nowrap; }
.gm-boss span { display: inline-block; width: 110px; height: 9px; border-radius: 5px; background: rgba(255,255,255,.25); vertical-align: middle; margin-left: 6px; overflow: hidden; }
.gm-boss span i { display: block; height: 100%; background: #ff3b3b; transition: width .2s; }
.gm-pop { position: absolute; left: 0; right: 0; top: 34%; text-align: center; font-size: clamp(28px, 9vw, 48px); font-weight: 800; color: #ffd23f; -webkit-text-stroke: 2px #4a2a00; text-shadow: 0 4px 0 #ef2d6b; transform: scale(.6); opacity: 0; transition: transform .25s cubic-bezier(.3,1.6,.5,1), opacity .25s; padding: 0 12px; line-height: 1.05; }
.gm-pop.is-on { transform: scale(1); opacity: 1; }
.gm-toasts { position: absolute; left: 0; right: 0; top: 58%; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.gm-toast { background: rgba(20, 16, 40, 0.6); border-radius: 999px; padding: 3px 12px; font-weight: 700; font-size: 15px; animation: gm-fade 1.5s ease-out forwards; }
.gm-chat { position: absolute; left: 10px; right: 10px; bottom: calc(max(12px, env(safe-area-inset-bottom)) + 70px); display: flex; gap: 8px; align-items: flex-end; animation: gm-in .25s ease-out; }
.gm-chat img { width: 54px; height: 66px; object-fit: contain; flex: none; filter: drop-shadow(0 3px 4px rgba(0,0,0,.35)); }
.gm-chat p { margin: 0; background: #fffdf7; color: #2b2340; border-radius: 16px 16px 16px 4px; padding: 7px 12px; font-size: 16px; line-height: 1.25; box-shadow: 0 4px 14px rgba(20,10,40,.25); max-width: 78%; }
.gm-chat b { display: block; font-size: 12px; color: #ef2d6b; }
.gm-tip { position: absolute; left: 14px; right: 14px; bottom: calc(max(12px, env(safe-area-inset-bottom)) + 52px); text-align: center; font-weight: 700; font-size: 15px; text-shadow: 0 2px 4px rgba(0,0,0,.7); }
.gm-hurt { position: absolute; inset: 0; pointer-events: none; opacity: 0; }
.gm-hurt.is-on { animation: gm-splat 1.1s ease-out; }
.gm-hurt i { position: absolute; border-radius: 50%; }
.gm-close { position: absolute; top: max(10px, env(safe-area-inset-top)); left: 10px; width: 38px; height: 38px; border-radius: 50%; border: 0; background: rgba(20, 16, 40, 0.55); color: #fff; font-size: 24px; line-height: 38px; pointer-events: auto; }
.gm-intro { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(20,16,40,.45); pointer-events: none; }
.gm-intro div { text-align: center; padding: 18px 22px; border-radius: 22px; background: rgba(20,16,40,.7); max-width: 86%; }
.gm-intro h2 { margin: 0 0 4px; font-size: 30px; color: #ffd23f; -webkit-text-stroke: 1.5px #4a2a00; }
.gm-intro h3 { margin: 0 0 10px; font-size: 18px; }
.gm-intro p { margin: 4px 0; font-size: 15px; line-height: 1.3; }
.gm-shake { animation: gm-shake .3s; }
@keyframes gm-up { 0% { transform: scale(1.9); } 100% { transform: scale(1); } }
@keyframes gm-fade { 0% { opacity: 0; transform: translateY(8px); } 15% { opacity: 1; transform: none; } 80% { opacity: 1; } 100% { opacity: 0; transform: translateY(-10px); } }
@keyframes gm-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes gm-splat { 0% { opacity: 1; } 70% { opacity: .9; } 100% { opacity: 0; } }
@keyframes gm-shake { 0%, 100% { transform: none; } 25% { transform: translate(-6px, 3px); } 50% { transform: translate(5px, -4px); } 75% { transform: translate(-3px, 2px); } }
`;

const T = {
  fr: {
    quit: 'Quitter', hold: 'Reste appuyé pour sortir et lancer, glisse pour viser. Lâche pour t’planquer !', go: 'C’est parti !',
    advance: 'Avance !', head: 'En pleine poire !', ko: '{name} KO !', reload: 'Planque-toi pour recharger !', cleared: '{level} nettoyé ! +{bonus}',
    end: 'À suivre…', over: 'T’es KO !', proie: 'Je suis une proie facile !', lamoule: 'Vous allez bouffer du poulet !',
    level: 'Niveau {n}', boss: 'BOSS', combo: 'COMBO', weapon: 'Arme : {w}',
  },
  en: {
    quit: 'Quit', hold: 'Hold to pop out and throw, drag to aim. Let go to take cover!', go: 'Go!',
    advance: 'Move up!', head: 'Right in the face!', ko: '{name} is out!', reload: 'Take cover to reload!', cleared: '{level} cleared! +{bonus}',
    end: 'To be continued…', over: 'You’re out!', proie: 'I’m easy prey!', lamoule: 'You’re gonna eat chicken!',
    level: 'Level {n}', boss: 'BOSS', combo: 'COMBO', weapon: 'Weapon: {w}',
  },
};

export const NAMES = {
  panda: 'Panda', cous: 'Cous', mamar: 'Mamar', babar: 'Babar', victor: 'Victor', romain: 'Romain', eugenie: 'Eugénie', violaine: 'Violaine',
  aline: 'Aline', greg: 'Greg', jojo: 'Jojo', rudy: 'Rudy', jose: 'José', lamoule: 'Lamoule', gogol: 'Pépé Gogol', pineur: 'Pépé Pineur', gardien: 'Eul’ gardien',
};

export const WEAPON_NAMES = {
  merguez: { fr: 'Merguez', en: 'Merguez' }, mollard: { fr: 'Mollards', en: 'Spit gobs' }, chorizo: { fr: 'Chorizo', en: 'Chorizo' },
  shot: { fr: 'Shots de Cointreau-saucisse', en: 'Cointreau-sausage shots' }, andouille: { fr: 'Andouille', en: 'Andouille' },
  crotte: { fr: 'Crottes de nez', en: 'Bogeys' }, gardon: { fr: 'Gardons', en: 'Roach fish' }, rouleau: { fr: 'Rouleau à pâtisserie', en: 'Rolling pin' },
  archet: { fr: 'Archet de violon', en: 'Violin bow' }, rose: { fr: 'Roses', en: 'Roses' }, cote: { fr: 'Côte de bœuf XXXXL', en: 'XXXXL rib steak' },
  mouchoir: { fr: 'Mouchoirs', en: 'Tissues' }, poissonchat: { fr: 'Poisson-chat', en: 'Catfish' }, sardine: { fr: 'Sardines', en: 'Sardines' },
  poulet: { fr: 'Poulet', en: 'Chicken' }, boule: { fr: 'Boules de pétanque', en: 'Pétanque balls' }, pomme: { fr: 'Pommes de pin', en: 'Pine cones' },
};

function el(tag, className, parent, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

export function castUrl(id) {
  const base = (import.meta.env && import.meta.env.BASE_URL) || './';
  return base + 'cast/' + id + '.svg';
}

export async function startMerguez(options) {
  const { root } = options;
  const lang = options.lang === 'fr' ? 'fr' : 'en';
  const tx = (k, vars = {}) => (T[lang][k] || k).replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? '');
  const onGameOver = options.onGameOver || (() => {});
  const onExit = options.onExit || (() => {});
  const fmt = (n) => Math.round(n).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US');
  const base = (import.meta.env && import.meta.env.BASE_URL) || './';
  await loadHeads(base + 'cast/');

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
  const shell = el('div', 'gm-root');
  el('style', '', shell).textContent = CSS;
  if (getComputedStyle(root).position === 'static') root.style.position = 'relative';
  root.appendChild(shell);
  const canvas = el('canvas', 'gm-canvas', shell);
  const touch = el('div', 'gm-touch', shell);
  const hud = el('div', 'gm-hud', shell);
  const hurt = el('div', 'gm-hurt', hud);
  const top = el('div', 'gm-top', hud);
  const hearts = el('span', 'gm-chip', top);
  const levelChip = el('span', 'gm-chip', top);
  const score = el('span', 'gm-chip gm-score', top);
  const mult = el('div', 'gm-mult', hud);
  const cross = el('div', 'gm-cross', hud);
  const ammo = el('div', 'gm-ammo', hud);
  const bossBox = el('div', 'gm-boss', hud);
  bossBox.hidden = true;
  const pop = el('div', 'gm-pop', hud);
  const toasts = el('div', 'gm-toasts', hud);
  const chat = el('div', 'gm-chat', hud);
  chat.hidden = true;
  const tip = el('div', 'gm-tip', hud);
  const intro = el('div', 'gm-intro', shell);
  const close = el('button', 'gm-close', shell, '×');
  close.type = 'button';
  close.setAttribute('aria-label', tx('quit'));

  const rules = createRules({ hero: options.hero || 'panda', random: options.random || Math.random });
  const view = createView({ canvas, rules });
  const auto = !!options.auto;

  // Level card
  const card = el('div', '', intro);
  const L = LEVELS[0];
  el('h3', '', card, tx('level', { n: 1 }));
  el('h2', '', card, L.name[lang]);
  el('p', '', card, tx('weapon', { w: WEAPON_NAMES[rules.weapon][lang] }));
  el('p', '', card, tx('hold'));
  let started = false;
  function start() {
    if (started) return;
    started = true;
    intro.remove();
    showPop(tx('go'), 900);
  }
  later(start, 2600);

  /* ---------- Messages ---------- */
  let popTimer = 0;
  function showPop(text, ms = 1200) {
    pop.textContent = text;
    pop.classList.add('is-on');
    clearTimeout(popTimer);
    popTimer = later(() => pop.classList.remove('is-on'), ms);
  }
  function toast(text) {
    const n = el('div', 'gm-toast', toasts, text);
    later(() => n.remove(), 1500);
  }
  let chatTimer = 0;
  function sayLine(who, text) {
    chat.replaceChildren();
    const img = el('img', '', chat);
    img.src = NAMES[who] && !['gogol', 'pineur', 'gardien'].includes(who) ? castUrl(who) : paintFace(who).toDataURL();
    img.alt = '';
    const p = el('p', '', chat);
    el('b', '', p, NAMES[who] || who);
    p.append(text);
    chat.hidden = false;
    clearTimeout(chatTimer);
    chatTimer = later(() => (chat.hidden = true), 2200);
  }
  let tipTimer = 0;
  function showTip(text, ms = 1800) {
    tip.textContent = text;
    clearTimeout(tipTimer);
    tipTimer = later(() => (tip.textContent = ''), ms);
  }
  function splat(color) {
    hurt.replaceChildren();
    for (let i = 0; i < 6; i++) {
      const d = el('i', '', hurt);
      const s = 60 + Math.random() * 120;
      d.style.cssText = `left:${10 + Math.random() * 70}%;top:${10 + Math.random() * 70}%;width:${s}px;height:${s * 0.8}px;background:${color};opacity:.85`;
    }
    hurt.classList.remove('is-on');
    void hurt.offsetWidth;
    hurt.classList.add('is-on');
    shell.classList.remove('gm-shake');
    void shell.offsetWidth;
    shell.classList.add('gm-shake');
  }
  const SPLAT = { mollard: '#d9f2c4', crotte: '#b8c95a', shot: '#f39a1e', andouille: '#8f7a6c', merguez: '#b8402c', chorizo: '#a3221d', rose: '#d8243c', mouchoir: '#ffffff', poulet: '#e0a050', boule: '#9aa2ac', pomme: '#7a4f2a' };

  let over = false;
  function handle(e) {
    view.event(e);
    if (e.type === 'throw' && e.mine) sfx.tap();
    else if (e.type === 'throw') sfx.whoosh();
    else if (e.type === 'tell') sfx.tick(true);
    else if (e.type === 'hit') {
      sfx.pop();
      if (e.head) toast(tx('head'));
    } else if (e.type === 'ko') {
      sfx.coin();
      toast(tx('ko', { name: NAMES[e.who] || e.who }));
      if (e.boss) {
        sfx.good();
        bossBox.hidden = true;
      }
    } else if (e.type === 'hurt') {
      sfx.hit();
      splat(SPLAT[e.kind] || '#c0392b');
    } else if (e.type === 'block') sfx.splash();
    else if (e.type === 'empty') showTip(tx('reload'));
    else if (e.type === 'cleared') showPop(tx('advance'));
    else if (e.type === 'boss') {
      sfx.boss();
      bossBox.hidden = false;
      bossBox.replaceChildren(document.createTextNode(`${tx('boss')} ${NAMES[e.who] || e.who}`));
      el('i', '', el('span', '', bossBox));
      if (e.who === 'lamoule') sayLine('lamoule', tx('lamoule'));
    } else if (e.type === 'say' && e.text === 'proie') sayLine(e.who, tx('proie'));
    else if (e.type === 'level') {
      sfx.good();
      showPop(tx('cleared', { level: LEVELS[e.index].name[lang], bonus: fmt(e.bonus) }), 2300);
    } else if (e.type === 'over') {
      over = true;
      if (e.won) {
        sfx.best();
        showPop(tx('end'), 2000);
      } else {
        sfx.over();
        showPop(tx('over'), 2000);
      }
      rules.setOut(false);
      later(() => onGameOver({ score: rules.score, summary: rules.summary() }), 2100);
    }
  }

  /* ---------- HUD ---------- */
  let lastMult = 1;
  function hudUpdate() {
    hearts.textContent = '❤'.repeat(Math.max(0, rules.hearts)) + '♡'.repeat(Math.max(0, HEARTS - rules.hearts));
    levelChip.textContent = `${rules.station + 1}/${rules.stationCount()}`;
    score.textContent = fmt(rules.score);
    const m = rules.mult();
    mult.textContent = m > 1 ? `×${m}` : '';
    if (m > lastMult) {
      mult.classList.remove('is-up');
      void mult.offsetWidth;
      mult.classList.add('is-up');
    }
    lastMult = m;
    const clip = rules.ammo;
    const max = Math.min(16, Math.max(clip, ammoMax));
    ammo.replaceChildren(document.createTextNode(`${WEAPON_NAMES[rules.weapon][lang]} `));
    for (let i = 0; i < max; i++) el('i', i < clip ? '' : 'off', ammo);
    cross.classList.toggle('is-hid', rules.rise < 0.5);
    const onFoe = rules.foes.some((f) => (f.state === 'tell' || f.state === 'throw') && Math.hypot(rules.dirTo(f).yaw - rules.yaw, rules.dirTo(f).pitch - rules.pitch) < 0.09);
    cross.classList.toggle('is-on', onFoe && rules.rise >= 1);
    const b = rules.boss();
    if (b && !bossBox.hidden) {
      const bar = bossBox.querySelector('i');
      if (bar) bar.style.width = `${Math.max(0, (b.hp / b.max) * 100)}%`;
    }
  }
  const ammoMax = rules.ammo;

  /* ---------- Input ---------- */
  let pointer = null;
  const SENS = 0.0045;
  on(touch, 'pointerdown', (ev) => {
    if (over) return;
    start();
    pointer = { id: ev.pointerId, x: ev.clientX, y: ev.clientY };
    touch.setPointerCapture?.(ev.pointerId);
    rules.setOut(true);
  });
  on(touch, 'pointermove', (ev) => {
    if (!pointer || ev.pointerId !== pointer.id) return;
    const dx = ev.clientX - pointer.x;
    const dy = ev.clientY - pointer.y;
    pointer.x = ev.clientX;
    pointer.y = ev.clientY;
    rules.aimBy(dx * SENS, -dy * SENS);
  });
  const up = (ev) => {
    if (!pointer || ev.pointerId !== pointer.id) return;
    pointer = null;
    rules.setOut(false);
  };
  on(touch, 'pointerup', up);
  on(touch, 'pointercancel', up);
  const keys = new Set();
  on(window, 'keydown', (ev) => {
    if (ev.key === 'Escape') return onExit();
    keys.add(ev.key);
    if (ev.key === ' ') {
      start();
      rules.setOut(true);
      ev.preventDefault();
    }
  });
  on(window, 'keyup', (ev) => {
    keys.delete(ev.key);
    if (ev.key === ' ') rules.setOut(false);
  });
  on(close, 'click', () => onExit());
  on(window, 'resize', () => view.resize());

  /* ---------- Loop ---------- */
  let raf = 0;
  let last = performance.now();
  let alive = true;
  function frame(now) {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (started && !over) {
      const k = 1.4 * dt;
      if (keys.has('ArrowLeft')) rules.aimBy(-k, 0);
      if (keys.has('ArrowRight')) rules.aimBy(k, 0);
      if (keys.has('ArrowUp')) rules.aimBy(0, k * 0.7);
      if (keys.has('ArrowDown')) rules.aimBy(0, -k * 0.7);
      if (auto) botInput(rules);
      rules.step(dt);
    } else if (over) rules.step(dt);
    for (const e of rules.events.splice(0)) handle(e);
    view.render(dt);
    hudUpdate();
  }
  raf = requestAnimationFrame(frame);

  return {
    rules,
    /** Testing and screenshots: plays `seconds` of game at once (with the bot if `auto`). */
    advance(seconds) {
      start();
      for (let i = 0; i < seconds * 60; i++) {
        if (auto) botInput(rules);
        rules.step(1 / 60);
        for (const e of rules.events.splice(0)) handle(e);
        view.render(1 / 60);
      }
      hudUpdate();
    },
    dispose() {
      alive = false;
      cancelAnimationFrame(raf);
      for (const off of listeners) off();
      for (const id of timers) clearTimeout(id);
      view.dispose();
      shell.remove();
    },
  };
}
