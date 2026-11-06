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
import { createRules, botInput, HEARTS, LEVELS, PEOPLE } from './rules.js';
export { WEAPON_OF } from './rules.js';
import { createView } from './view.js';
import { NAMES, WEAPON_NAMES, BONUS_NAMES } from './names.js';
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
.gm-clock { font-variant-numeric: tabular-nums; transition: background .3s; }
.gm-clock.is-near { background: rgba(232,118,31,.85); }
.gm-clock.is-late { background: rgba(214,40,40,.85); }
.gm-mult { position: absolute; right: 12px; top: calc(max(10px, env(safe-area-inset-top)) + 42px); font-size: 30px; font-weight: 800; color: #ffd23f; -webkit-text-stroke: 1.5px #5a2a00; text-shadow: 0 3px 0 #ef2d6b; }
.gm-mult.is-up { animation: gm-up .4s cubic-bezier(.3,1.8,.5,1); }
.gm-tapmark { position: absolute; width: 56px; height: 56px; margin: -28px 0 0 -28px; border-radius: 50%; border: 4px solid #ffd23f; pointer-events: none; animation: gm-tap .35s ease-out forwards; }
.gm-tuto { position: absolute; left: 7%; right: 7%; top: 16%; text-align: center; background: rgba(255,253,247,.96); color: #2b2340; border-radius: 18px; padding: 10px 16px; font-weight: 700; font-size: 17px; line-height: 1.25; box-shadow: 0 8px 24px rgba(20,10,40,.35); animation: gm-in .3s ease-out; pointer-events: none; }
.gm-tuto b { color: #ef2d6b; }
@keyframes gm-tap { from { transform: scale(.4); opacity: 1; } to { transform: scale(1.3); opacity: 0; } }
.gm-cross { position: absolute; left: 50%; top: 50%; width: 34px; height: 34px; margin: -17px 0 0 -17px; border-radius: 50%; border: 3px solid rgba(255,255,255,.9); box-shadow: 0 0 0 2px rgba(0,0,0,.25); transition: transform .12s, border-color .12s, opacity .15s; }
.gm-cross::after { content: ''; position: absolute; left: 50%; top: 50%; width: 6px; height: 6px; margin: -3px; border-radius: 50%; background: #fff; }
.gm-cross.is-on { border-color: #ff3b3b; transform: scale(.8); }
.gm-cross.is-hid { opacity: .35; }
.gm-ammo { position: absolute; left: 12px; bottom: calc(max(12px, env(safe-area-inset-bottom)) + 10px); background: rgba(20,16,40,.55); border-radius: 14px; padding: 6px 10px; font-weight: 700; font-size: 14px; }
.gm-ctrl { position: absolute; left: 10px; right: 10px; bottom: calc(max(12px, env(safe-area-inset-bottom)) + 4px); display: flex; align-items: flex-end; gap: 10px; pointer-events: none; }
.gm-b { pointer-events: auto; touch-action: none; border: 3px solid rgba(255,255,255,.85); color: #fff; font: 800 14px Fredoka, system-ui, sans-serif; display: grid; place-items: center; text-shadow: 0 1px 3px rgba(0,0,0,.4); box-shadow: 0 6px 16px rgba(20,10,40,.35); -webkit-tap-highlight-color: transparent; }
.gm-b:active, .gm-b.is-on { transform: scale(.94); filter: brightness(1.15); }
.gm-move { width: 62px; height: 62px; border-radius: 50%; background: rgba(20,16,40,.5); font-size: 26px; }
.gm-stand { width: 84px; height: 62px; border-radius: 20px; background: linear-gradient(160deg, #3fb37a, #1f7a52); line-height: 1.05; text-align: center; padding: 2px; }
.gm-stand.is-up { background: linear-gradient(160deg, #ffb03a, #e8641f); }
.gm-fire { margin-left: auto; width: 96px; height: 96px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #ff6f9a, #ef2d6b); }
.gm-fire canvas { width: 66px; height: 66px; pointer-events: none; }
.gm-fire.is-off { filter: grayscale(.8) brightness(.8); }
.gm-ammo i { display: inline-block; width: 9px; height: 16px; margin-right: 3px; border-radius: 3px; background: #ffd23f; vertical-align: middle; }
.gm-ammo i.off { background: rgba(255,255,255,.25); }
.gm-boss { position: absolute; left: 50%; transform: translateX(-50%); top: calc(max(10px, env(safe-area-inset-top)) + 46px); background: rgba(20, 16, 40, 0.6); border-radius: 999px; padding: 4px 12px; font-weight: 700; font-size: 14px; white-space: nowrap; }
.gm-boss span { display: inline-block; width: 110px; height: 9px; border-radius: 5px; background: rgba(255,255,255,.25); vertical-align: middle; margin-left: 6px; overflow: hidden; }
.gm-boss span i { display: block; height: 100%; background: #ff3b3b; transition: width .2s; }
.gm-pop { position: absolute; left: 0; right: 0; top: 34%; text-align: center; font-size: clamp(28px, 9vw, 48px); font-weight: 800; color: #ffd23f; -webkit-text-stroke: 2px #4a2a00; text-shadow: 0 4px 0 #ef2d6b; transform: scale(.6); opacity: 0; transition: transform .25s cubic-bezier(.3,1.6,.5,1), opacity .25s; padding: 0 12px; line-height: 1.05; white-space: pre-line; }
.gm-pop.is-on { transform: scale(1); opacity: 1; }
.gm-toasts { position: absolute; left: 0; right: 0; top: 58%; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.gm-toast { background: rgba(20, 16, 40, 0.6); border-radius: 999px; padding: 3px 12px; font-weight: 700; font-size: 15px; animation: gm-fade 1.5s ease-out forwards; }
.gm-chat { position: absolute; left: 10px; right: 10px; bottom: calc(max(12px, env(safe-area-inset-bottom)) + 58px); display: flex; gap: 8px; align-items: flex-end; animation: gm-in .25s ease-out; }
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
    quit: 'Quitter', hold: 'Tape sur quelqu’un pour y lancer un coup d’{w} ! Après, te r’tournes à couvert tout seul.',
    tuto1: 'Tape sur <b>quelqu’un</b> pour y lancer un coup d’{w} !', tuto2: 'Un <b>!</b> rouge ? Y va lancer : attends à couvert… pis tape-le quand y ressort !', tuto3: 'Vise <b>la tête</b> : en pleine poire, ça paie double !', go: 'C’est parti !',
    soon: 'À suivre…', up: 'DEBOUT', down: 'À\nCOUVERT', standFirst: 'Lève-toi pour lancer !',
    advance: 'Avance !', head: 'En pleine poire !', ko: '{name} KO !', reload: 'Planque-toi pour recharger !', cleared: '{level} nettoyé !\n⏱ +{time}  ❤ +{hearts}',
    end: 'Mission accomplie !', over: 'T’es KO !', proie: 'Je suis une proie facile !', lamoule: 'Vous allez bouffer du poulet !',
    romain: 'Un sac d’os dans ta poire !', jose: 'Sardines à volonté !', babar: 'Héhéhé… un p’tit coup d’rouge ?', rudy: 'Bienvenue dans mon CRAPA !',
    mamar: 'Je suis une proie facile… mais pas ce soir !', greg: 'Aux States, on fait des côtes plus grosses !',
    level: 'Niveau {n}', boss: 'BOSS', combo: 'COMBO', weapon: 'Arme : {w}',
  },
  en: {
    quit: 'Quit', hold: 'Tap someone to throw your {w} at them! You duck back into cover by yourself.',
    tuto1: 'Tap <b>someone</b> to throw your {w} at them!', tuto2: 'A red <b>!</b>? They’re about to throw: wait in cover… then tap them when they come out!', tuto3: 'Aim for <b>the head</b>: right in the face pays double!', go: 'Go!',
    soon: 'To be continued…', up: 'STAND', down: 'TAKE\nCOVER', standFirst: 'Stand up to throw!',
    advance: 'Move up!', head: 'Right in the face!', ko: '{name} is out!', reload: 'Take cover to reload!', cleared: '{level} cleared!\n⏱ +{time}  ❤ +{hearts}',
    end: 'Mission accomplished!', over: 'You’re out!', proie: 'I’m easy prey!', lamoule: 'You’re gonna eat chicken!',
    romain: 'A bag of bones in your face!', jose: 'All-you-can-eat sardines!', babar: 'Hehehe… fancy a glass of red?', rudy: 'Welcome to my CRAPA!',
    mamar: 'I’m easy prey… but not tonight!', greg: 'In the States, we grill bigger ribs!',
    level: 'Level {n}', boss: 'BOSS', combo: 'COMBO', weapon: 'Weapon: {w}',
  },
};

export { NAMES, WEAPON_NAMES } from './names.js';

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

/** Levels open in this version (the others are still being built). */
export const PLAYABLE = 5;

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
  const clock = el('span', 'gm-chip gm-clock', top);
  const score = el('span', 'gm-chip gm-score', top);
  const mult = el('div', 'gm-mult', hud);
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

  const rules = createRules({ hero: options.hero || 'panda', random: options.random || Math.random, levels: LEVELS.slice(options.from || 0, (options.from || 0) + (options.levels || PLAYABLE)) });
  const view = createView({ canvas, rules });
  const auto = !!options.auto;

  // Level card
  const card = el('div', '', intro);
  const L = rules.levels[0];
  el('h3', '', card, tx('level', { n: 1 }));
  el('h2', '', card, L.name[lang]);
  el('p', '', card, tx('weapon', { w: WEAPON_NAMES[rules.weapon][lang] }));
  el('p', '', card, tx('hold', { w: WEAPON_NAMES[rules.weapon][lang].toLowerCase() }));
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
    img.src = PEOPLE.includes(who) ? paintFace(who).toDataURL() : castUrl(who);
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
  const SPLAT = { cubi: '#8e1b34', crotte: '#b8c95a', megaphone: '#e8e4dc', citrouille: '#f08a24', museau: '#e7a9a0', merguez: '#b8402c', treuffe: '#c9a36a', mouchoir: '#ffffff', poulet: '#e0a050', boule: '#9aa2ac', pomme: '#7a4f2a' };

  let over = false;
  function handle(e) {
    view.event(e);
    if (e.type === 'throw' && e.mine) sfx.tap();
    else if (e.type === 'throw') sfx.whoosh();
    else if (e.type === 'tell') sfx.tick(true);
    else if (e.type === 'bonus') {
      sfx.coin();
      showPop(`${BONUS_NAMES[e.kind][lang]} !\n+${fmt(e.pts)}`, 1300);
    } else if (e.type === 'bonusIn') sfx.whoosh();
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
      if (T[lang][e.who]) sayLine(e.who, tx(e.who));
    } else if (e.type === 'say' && e.text === 'proie') sayLine(e.who, tx('proie'));
    else if (e.type === 'levelStart') {
      showPop(`${tx('level', { n: e.index + 1 })}\n${rules.levels[e.index].name[lang]}`, 2400);
      sfx.speedup();
    } else if (e.type === 'level') {
      sfx.good();
      showPop(tx('cleared', { level: rules.levels[e.index].name[lang], time: fmt(e.timeBonus), hearts: fmt(e.heartBonus) }), 2600);
    } else if (e.type === 'over') {
      over = true;
      if (e.won) {
        sfx.best();
        showPop(rules.levels.length < LEVELS.length ? tx('soon') : tx('end'), 2000);
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
    // The level's stopwatch: orange near the par time, red past it (no more time bonus).
    const secs = Math.floor(rules.levelTime);
    clock.textContent = `⏱ ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    clock.classList.toggle('is-late', rules.levelTime > rules.par());
    clock.classList.toggle('is-near', rules.levelTime <= rules.par() && rules.levelTime > rules.par() - 20);
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
    const b = rules.boss();
    if (b && !bossBox.hidden) {
      const bar = bossBox.querySelector('i');
      if (bar) bar.style.width = `${Math.max(0, (b.hp / b.max) * 100)}%`;
    }
  }
  const ammoMax = rules.ammo;

  /* ---------- Input ---------- */
  // Tap someone: the hero pops out, throws at them and ducks back (rules.js).
  function tapAt(x, y) {
    if (over) return;
    start();
    const hit = view.pick(x, y);
    if (hit.bonus) rules.tapBonus(hit.bonus);
    else if (hit.foe) rules.tapFoe(hit.foe, hit.head);
    else rules.tapDir(hit.yaw, hit.pitch);
    const mark = el('div', 'gm-tapmark', hud);
    const box = shell.getBoundingClientRect();
    mark.style.left = `${x - box.left}px`;
    mark.style.top = `${y - box.top}px`;
    if (hit.foe) mark.style.borderColor = '#ff3b3b';
    if (hit.bonus) mark.style.borderColor = '#7dffb0';
    later(() => mark.remove(), 400);
    tuto.tapped();
  }
  on(touch, 'pointerdown', (ev) => {
    ev.preventDefault();
    tapAt(ev.clientX, ev.clientY);
  });
  // Keyboard: Space throws at the closest person who is out.
  on(window, 'keydown', (ev) => {
    if (ev.key === 'Escape') return onExit();
    if (ev.repeat) return;
    if (ev.key === ' ') {
      ev.preventDefault();
      start();
      const f = rules.foes.filter((x) => x.state === 'tell' || x.state === 'throw').sort((a, b) => rules.dirTo(a).dist - rules.dirTo(b).dist)[0];
      if (f) rules.tapFoe(f.id, true);
      tuto.tapped();
    }
  });

  /* ---------- Tutorial: three short tips on the first station ---------- */
  const tuto = (() => {
    const box = el('div', 'gm-tuto', hud);
    box.hidden = true;
    let step = 0;
    const show = (key) => {
      box.innerHTML = tx(key, { w: WEAPON_NAMES[rules.weapon][lang].toLowerCase() });
      box.hidden = false;
    };
    return {
      update() {
        if (!started || over || step > 3) return;
        if (step === 0) {
          show('tuto1');
          step = 1;
        } else if (step === 2 && rules.foes.some((f) => f.state === 'tell')) {
          show('tuto2');
          step = 3;
          later(() => {
            if (step === 3) {
              show('tuto3');
              step = 4;
              later(() => (box.hidden = true), 3500);
            }
          }, 3500);
        }
        if (rules.station > 0 || rules.level > 0) {
          box.hidden = true;
          step = 9;
        }
      },
      tapped() {
        if (step <= 1) {
          box.hidden = true;
          step = 2;
        }
      },
    };
  })();
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
      if (auto) botInput(rules);
      rules.step(dt);
    } else if (over) rules.step(dt);
    for (const e of rules.events.splice(0)) handle(e);
    view.render(dt);
    hudUpdate();
    tuto.update();
  }
  raf = requestAnimationFrame(frame);

  return {
    rules,
    view,
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
      tuto.update();
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
