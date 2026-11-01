// Pandadventures shell: title, world map, world intro, play, results.
// Worlds are loaded on demand (one in memory at a time) through registry.js.

import './styles.css';
import * as THREE from 'three';
import { createEngine } from './core/engine.js';
import { createModels } from './core/models.js';
import { createCharacter, createKid, CAST_IDS } from './core/cast.js';
import { createFx } from './core/fx.js';
import { createHud } from './core/hud.js';
import { Input } from './core/input.js';
import { sfx, unlock, startMusic, stopMusic, setMuted, isMuted } from './core/audio.js';
import { t, locale, toggleLocale, onLocaleChange } from './core/i18n.js';
import { registerTexts } from './core/strings.js';
import { load, store, recordRun, bestStars, isUnlocked, totalStars, MODES } from './core/save.js';
import { WORLDS, ORDER, MODE_FACTORS } from './worlds/registry.js';

const canvas = document.getElementById('game');
const ui = document.getElementById('ui');
const engine = createEngine(canvas);
const models = createModels();
const input = new Input(canvas);
let save = load();
let mode = 'normal';
let current = null; // { world, def, root, fx, hud, paused }

const L = (obj) => obj[locale()] ?? obj.en;
// ?unlock opens every world on the map (for a first look or a demo).
const UNLOCK_ALL = new URLSearchParams(location.search).has('unlock');

// --- Menu scene: a little island where the gang hangs out -------------------

const menu = { root: new THREE.Group(), cast: [] };
function buildMenuScene() {
  engine.setupSky({ top: '#2f86eb', bottom: '#bdf0ff', fogNear: 40, fogFar: 120 });
  engine.addLights(menu.root);
  const sea = new THREE.Mesh(new THREE.CircleGeometry(80, 48), new THREE.MeshStandardMaterial({ color: '#1fa3c8', roughness: 0.3 }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.4;
  menu.root.add(sea);
  const island = new THREE.Mesh(new THREE.CylinderGeometry(7, 8, 1, 40), new THREE.MeshStandardMaterial({ color: '#f6d58e' }));
  island.position.y = -0.4;
  island.receiveShadow = true;
  menu.root.add(island);
  const grass = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5, 0.3, 32), new THREE.MeshStandardMaterial({ color: '#6cc46a' }));
  grass.position.set(-1.5, 0.2, -1.5);
  menu.root.add(grass);
  CAST_IDS.forEach((id, i) => {
    const c = createCharacter(id, { scale: 0.9 });
    const a = (i / CAST_IDS.length) * Math.PI * 2;
    c.position.set(Math.cos(a) * 4.2, 0, Math.sin(a) * 4.2);
    c.lookAt(0, 0, 0);
    c.userData.state = id === 'panda' ? 'dance' : ['cheer', 'idle', 'dance'][i % 3];
    menu.root.add(c);
    menu.cast.push(c);
  });
  models.load(['nature']).then(() => {
    for (const [x, z, s] of [[-5, -4, 4], [5.5, -3, 3.4], [-6, 3, 3], [0, -6, 3.6]]) {
      const palm = models.get('tree_palm', { height: s });
      if (palm) { palm.position.set(x, 0, z); menu.root.add(palm); }
    }
  });
  engine.scene.add(menu.root);
}

let menuTime = 0;
function animateMenu(dt) {
  menuTime += dt;
  engine.camera.position.set(Math.cos(menuTime * 0.12) * 14, 7 + Math.sin(menuTime * 0.3), Math.sin(menuTime * 0.12) * 14);
  engine.camera.lookAt(0, 1.2, 0);
  for (const c of menu.cast) c.userData.animate(dt, c.userData.state);
}

// --- Screens --------------------------------------------------------------------

function screen(html, cls = '') {
  ui.innerHTML = `<div class="screen ${cls}">${html}</div>`;
  ui.querySelectorAll('[data-click]').forEach((b) => b.addEventListener('click', (e) => {
    unlock();
    sfx.click();
    actions[b.dataset.click]?.(b.dataset.arg, e);
  }));
  return ui.firstElementChild;
}

function topBar() {
  return `<div class="topbar">
    <button class="chip" data-click="hall">🏆 ${t('hall')}</button>
    <span class="chip">⭐ ${t('stars_total', { n: totalStars(save) })}</span>
    <button class="chip" data-click="sound">${isMuted() ? '🔇' : '🔊'}</button>
    <button class="chip" data-click="lang">${t('lang_switch')}</button>
  </div>`;
}

function showTitle() {
  screen(`${topBar()}
    <div class="title-box">
      <img class="title-face" src="${import.meta.env.BASE_URL}cast/panda.svg" alt="">
      <h1>${t('title')}</h1>
      <p>${t('tagline')}</p>
      <button class="big" data-click="map">${t('play')}</button>
    </div>`, 'title');
}

function stars(n, of = 3) {
  return Array.from({ length: of }, (_, i) => `<span class="${i < n ? 'star on' : 'star'}">★</span>`).join('');
}

function showMap() {
  const cards = WORLDS.map((w, i) => {
    const open = UNLOCK_ALL || isUnlocked(save, ORDER, w.id);
    return `<button class="card ${open ? '' : 'locked'}" style="--c:${w.color}" data-click="${open ? 'card' : 'lockedCard'}" data-arg="${w.id}">
      <span class="card-num">${i + 1}</span><span class="card-icon">${w.icon}</span>
      <span class="card-title">${L(w.title)}</span>
      <span class="card-genre">${L(w.genre)}</span>
      <span class="card-stars">${open ? stars(bestStars(save, w.id)) : '🔒 ' + t('locked')}</span>
    </button>`;
  }).join('');
  screen(`${topBar()}<h2 class="map-title">${t('map')}</h2><div class="cards">${cards}</div>`, 'map');
}

async function showCard(worldId) {
  const def = WORLDS.find((w) => w.id === worldId);
  screen(`<div class="modal" style="--c:${def.color}"><p>${t('loading')}</p></div>`, 'dim');
  const mod = await def.module();
  registerTexts(def.id, mod.TEXTS || {});
  await models.load(mod.MODELS || []);
  const howto = (mod.TEXTS?.[locale()]?.howto || mod.TEXTS?.en?.howto || []);
  const best = save.worlds[def.id]?.best?.[mode] ?? 0;
  screen(`<div class="modal" style="--c:${def.color}">
      <div class="modal-head"><span class="card-icon">${def.icon}</span><h2>${L(def.title)}</h2></div>
      <p class="blurb">${L(def.blurb)}</p>
      <h3>${t('how_to_play')}</h3>
      <ol>${(Array.isArray(howto) ? howto : [howto]).map((l) => `<li>${l}</li>`).join('')}</ol>
      <div class="modes">${t('mode')} ${MODES.map((m) => `<button class="mode ${m === mode ? 'on' : ''}" data-click="mode" data-arg="${m}">${t('mode_' + m)}</button>`).join('')}</div>
      <p class="best">${t('best')} : ${best}</p>
      <div class="row"><button data-click="map">${t('back_map')}</button><button class="big" data-click="play" data-arg="${def.id}">${t('start')}</button></div>
    </div>`, 'dim');
  current = { pendingModule: mod, def };
}

function showHall() {
  const rows = save.hall.slice(0, 20).map((h, i) => {
    const w = WORLDS.find((x) => x.id === h.worldId);
    return `<tr><td>${i + 1}</td><td>${w ? w.icon + ' ' + L(w.title) : h.worldId}</td><td>${t('mode_' + h.mode)}</td><td><b>${h.score}</b></td><td>${h.date}</td></tr>`;
  }).join('');
  screen(`<div class="modal"><h2>🏆 ${t('hall')}</h2>
    ${rows ? `<table>${rows}</table>` : `<p>${t('hall_empty')}</p>`}
    <div class="row"><button data-click="map">${t('back_map')}</button></div></div>`, 'dim');
}

// --- Playing ------------------------------------------------------------------------

function startWorld(worldId) {
  const def = WORLDS.find((w) => w.id === worldId);
  const mod = current?.pendingModule;
  engine.scene.remove(menu.root);
  ui.innerHTML = '';
  const root = new THREE.Group();
  engine.scene.add(root);
  const fx = createFx(engine.scene);
  const hud = createHud(ui, engine.camera, canvas);
  const pauseBtn = document.createElement('button');
  pauseBtn.className = 'pause-btn';
  pauseBtn.textContent = '❚❚';
  pauseBtn.addEventListener('click', () => togglePause());
  hud.el.appendChild(pauseBtn);
  input.reset();
  let seed = 12345;
  const ctx = {
    THREE, scene: engine.scene, camera: engine.camera, renderer: engine.renderer, root, fx, hud, input, sfx,
    models, t: (key, vars) => t(`${def.id}.${key}`, vars), tShared: t, locale,
    mode, speed: MODE_FACTORS[mode], quality: engine.quality,
    random: () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; },
    character: (id, opts) => createCharacter(id, opts), kid: (s) => createKid(s), castIds: CAST_IDS,
    quote: (id) => t(`quote_${id}`),
    setupSky: engine.setupSky, addLights: engine.addLights,
    music: (bpm, melody) => startMusic(bpm, melody),
    finish: (result) => endWorld(true, result),
    fail: (result) => endWorld(false, result),
  };
  const world = mod.createWorld(ctx);
  current = { world, def, root, fx, hud, paused: false, ended: false };
  world.start();
}

function togglePause() {
  if (!current?.world || current.ended) return;
  current.paused = !current.paused;
  if (current.paused) {
    const p = document.createElement('div');
    p.className = 'screen dim pause-screen';
    p.innerHTML = `<div class="modal"><h2>${t('pause')}</h2><div class="row">
      <button data-a="quit">${t('quit')}</button><button class="big" data-a="resume">${t('resume')}</button></div></div>`;
    p.querySelector('[data-a=quit]').onclick = () => { leaveWorld(); showMap(); };
    p.querySelector('[data-a=resume]').onclick = () => { p.remove(); current.paused = false; };
    ui.appendChild(p);
  } else {
    ui.querySelector('.pause-screen')?.remove();
  }
}

function leaveWorld() {
  if (!current?.world) return;
  stopMusic();
  current.world.dispose?.();
  current.fx.dispose();
  current.hud.dispose();
  engine.scene.remove(current.root);
  current.root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
  });
  current = null;
  engine.scene.fog = null;
  engine.scene.add(menu.root);
  engine.setupSky({ top: '#2f86eb', bottom: '#bdf0ff', fogNear: 40, fogFar: 120 });
  input.reset();
}

function endWorld(won, { score = 0, stars: earned = 0, line = '' } = {}) {
  if (!current || current.ended) return;
  current.ended = true;
  const def = current.def;
  const starsWon = won ? earned : 0;
  save = recordRun(save, def.id, mode, Math.round(score), starsWon);
  store(save);
  (won ? sfx.win : sfx.lose)();
  const friend = CAST_IDS[Math.floor(Math.random() * CAST_IDS.length)];
  const index = ORDER.indexOf(def.id);
  const nextId = ORDER[index + 1];
  setTimeout(() => {
    const box = document.createElement('div');
    box.className = 'screen dim';
    box.innerHTML = `<div class="modal result" style="--c:${def.color}">
      <h2>${won ? t('win_title') : t('lose_title')}</h2>
      ${line ? `<p class="blurb">${line}</p>` : ''}
      <div class="result-stars">${stars(starsWon)}</div>
      <p class="result-score">${t('score')} : <b>${Math.round(score)}</b></p>
      <div class="friend"><img src="${import.meta.env.BASE_URL}cast/${friend}.svg" alt=""><span class="bubble static">${t('quote_' + friend)}</span></div>
      <div class="row">
        <button data-a="map">${t('back_map')}</button>
        <button data-a="share">${t('share')}</button>
        <button data-a="retry" class="${won && nextId ? '' : 'big'}">${t('retry')}</button>
        ${won && nextId && isUnlocked(save, ORDER, nextId) ? `<button class="big" data-a="next">${t('next')}</button>` : ''}
      </div></div>`;
    box.querySelector('[data-a=map]').onclick = () => { leaveWorld(); showMap(); };
    box.querySelector('[data-a=retry]').onclick = async () => { leaveWorld(); await showCard(def.id); startWorld(def.id); };
    box.querySelector('[data-a=next]')?.addEventListener('click', () => { leaveWorld(); showCard(nextId); });
    box.querySelector('[data-a=share]').onclick = () => share(def, score);
    ui.appendChild(box);
  }, 900);
}

async function share(def, score) {
  const text = t('share_text', { score: Math.round(score), world: L(def.title), url: location.href.split('?')[0] });
  try {
    if (navigator.share) await navigator.share({ text });
    else { await navigator.clipboard.writeText(text); current?.hud?.banner(t('copied')); }
  } catch { /* user cancelled */ }
}

const actions = {
  map: () => showMap(),
  card: (id) => showCard(id),
  lockedCard: () => {},
  hall: () => showHall(),
  mode: (m) => { mode = m; showCard(current.def.id); },
  play: (id) => startWorld(id),
  lang: () => { toggleLocale(); rerender(); },
  sound: () => { setMuted(!isMuted()); rerender(); },
};

let lastScreen = showTitle;
function rerender() {
  if (ui.querySelector('.map')) showMap();
  else if (ui.querySelector('.title')) showTitle();
}
onLocaleChange(() => {});

// --- Main loop ---------------------------------------------------------------------

engine.onFrame((dt) => {
  if (current?.world) {
    if (!current.paused && !current.ended) {
      if (input.pressed('pause')) togglePause();
      current.world.update(dt);
    } else if (current.ended) {
      current.world.update?.(dt * 0.25);
    }
    current.fx.update(dt);
    current.hud.update(dt);
  } else {
    animateMenu(dt);
  }
  input.endFrame();
});

window.addEventListener('blur', () => { if (current?.world && !current.paused && !current.ended) togglePause(); });

buildMenuScene();
showTitle();

// Test and debug hooks: ?world=w01&mode=hard opens a world directly (all unlocked).
const params = new URLSearchParams(location.search);
if (params.get('world')) {
  mode = params.get('mode') || mode;
  showCard(params.get('world')).then(() => { if (params.has('autostart')) startWorld(params.get('world')); });
}
window.__panda = { get current() { return current; }, startWorld, showCard, input };
