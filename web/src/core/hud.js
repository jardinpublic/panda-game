// In-game overlay (DOM over the canvas): score, hearts, objective, progress,
// banners, speech bubbles and floating text anchored to 3D objects, and big
// on-screen buttons for touch.

import * as THREE from 'three';

const v = new THREE.Vector3();

export function createHud(layer, camera, canvas) {
  const el = document.createElement('div');
  el.className = 'hud';
  el.innerHTML = `
    <div class="hud-top">
      <div class="hud-hearts"></div>
      <div class="hud-score"></div>
      <div class="hud-progress"><div class="hud-progress-fill"></div><span class="hud-progress-label"></span></div>
    </div>
    <div class="hud-objective"></div>
    <div class="hud-meters"></div>
    <div class="hud-banner"></div>
    <div class="hud-buttons"></div>
    <div class="hud-anchors"></div>`;
  layer.appendChild(el);
  const $ = (s) => el.querySelector(s);
  const anchors = [];
  let bannerTimer = null;

  function project(target) {
    if (target.isVector3) v.copy(target);
    else target.getWorldPosition(v);
    v.project(camera);
    const r = canvas.getBoundingClientRect();
    return { x: (v.x * 0.5 + 0.5) * r.width, y: (-v.y * 0.5 + 0.5) * r.height, visible: v.z < 1 };
  }

  function anchor(target, node, seconds, offsetY, rise) {
    $('.hud-anchors').appendChild(node);
    anchors.push({ target, node, left: seconds, total: seconds, offsetY, rise });
  }

  return {
    el,
    setScore(value, label = '') {
      $('.hud-score').textContent = `${label}${value}`;
    },
    setHearts(value, max) {
      $('.hud-hearts').innerHTML = Array.from({ length: max }, (_, i) => `<span class="${i < value ? 'on' : 'off'}">♥</span>`).join('');
    },
    setObjective(text) {
      $('.hud-objective').textContent = text || '';
      $('.hud-objective').style.display = text ? 'block' : 'none';
    },
    setProgress(ratio, label = '') {
      $('.hud-progress').style.display = 'block';
      $('.hud-progress-fill').style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
      $('.hud-progress-label').textContent = label;
    },
    /** Named extra meters, e.g. meter('suspicion', 0.4, '#f44'). */
    meter(name, ratio, color = '#ffd84a', label = '') {
      let m = el.querySelector(`.hud-meter[data-name="${name}"]`);
      if (!m) {
        m = document.createElement('div');
        m.className = 'hud-meter';
        m.dataset.name = name;
        m.innerHTML = '<span></span><div><i></i></div>';
        $('.hud-meters').appendChild(m);
      }
      m.querySelector('span').textContent = label;
      m.querySelector('i').style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
      m.querySelector('i').style.background = color;
    },
    banner(text, ms = 1600, color = '#ffd84a') {
      const b = $('.hud-banner');
      b.textContent = text;
      b.style.color = color;
      b.classList.remove('show');
      void b.offsetWidth;
      b.classList.add('show');
      clearTimeout(bannerTimer);
      bannerTimer = setTimeout(() => b.classList.remove('show'), ms);
    },
    /** Speech bubble above a 3D object (or Vector3). */
    say(target, text, seconds = 2, height = 2.6) {
      const old = anchors.find((a) => a.target === target && a.node.classList.contains('bubble'));
      if (old) { old.node.remove(); anchors.splice(anchors.indexOf(old), 1); }
      const node = document.createElement('div');
      node.className = 'bubble';
      node.textContent = text;
      anchor(target, node, seconds, height, 0);
    },
    /** Floating text that rises and fades (e.g. "+5 €"). */
    float(target, text, color = '#ffd84a', height = 2) {
      const node = document.createElement('div');
      node.className = 'floater';
      node.textContent = text;
      node.style.color = color;
      anchor(target, node, 0.9, height, 60);
    },
    /** Touch buttons: [{id, label, onDown, onUp, side: 'left'|'right'}]. Returns a map id -> element. */
    buttons(specs) {
      const box = $('.hud-buttons');
      box.innerHTML = '';
      const map = {};
      for (const s of specs) {
        const b = document.createElement('button');
        b.className = `hud-btn ${s.side || 'right'}`;
        b.textContent = s.label;
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); b.classList.add('down'); s.onDown?.(); });
        const up = (e) => { e.preventDefault(); b.classList.remove('down'); s.onUp?.(); };
        b.addEventListener('pointerup', up);
        b.addEventListener('pointerleave', up);
        box.appendChild(b);
        map[s.id] = b;
      }
      return map;
    },
    update(dt) {
      for (let i = anchors.length - 1; i >= 0; i--) {
        const a = anchors[i];
        a.left -= dt;
        if (a.left <= 0) { a.node.remove(); anchors.splice(i, 1); continue; }
        const worldPos = a.target.isVector3 ? a.target.clone() : new THREE.Vector3().setFromMatrixPosition(a.target.matrixWorld);
        worldPos.y += a.offsetY;
        const p = project(worldPos);
        const t = 1 - a.left / a.total;
        a.node.style.display = p.visible ? 'block' : 'none';
        a.node.style.transform = `translate(${p.x}px, ${p.y - a.rise * t}px) translate(-50%, -100%)`;
        if (a.rise) a.node.style.opacity = String(1 - t);
      }
    },
    dispose() {
      clearTimeout(bannerTimer);
      el.remove();
    },
  };
}
