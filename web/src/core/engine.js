// three.js renderer, scene, camera and loop, with quality tiers for phones.
// Worlds get a fresh root Group; the engine keeps the renderer for the page.

import * as THREE from 'three';

/** Picks a starting quality tier from the device: 0 = low, 1 = mid, 2 = high. */
export function guessTier(nav = navigator, screen = window.screen) {
  const cores = nav.hardwareConcurrency || 4;
  const memory = nav.deviceMemory || 4;
  const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  const small = Math.min(screen.width, screen.height) < 500;
  if (cores <= 4 || memory <= 3) return 0;
  if (coarse || small) return 1;
  return 2;
}

const TIERS = [
  { pixelRatio: 1, shadows: false, antialias: false, far: 90 },
  { pixelRatio: 1.5, shadows: true, antialias: true, far: 140 },
  { pixelRatio: 2, shadows: true, antialias: true, far: 200 },
];

export function createEngine(canvas) {
  const tierIndex = guessTier();
  const tier = TIERS[tierIndex];
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: tier.antialias, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier.pixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = tier.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, tier.far);
  let frameFn = null;
  let last = performance.now();
  let slowFrames = 0;

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    // Drop the pixel ratio once if the device struggles for ~2 seconds.
    slowFrames = dt > 1 / 40 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
    if (slowFrames > 120 && renderer.getPixelRatio() > 1) {
      renderer.setPixelRatio(1);
      slowFrames = 0;
      resize();
    }
    if (document.hidden) return;
    if (frameFn) frameFn(dt);
    renderer.render(scene, camera);
  });

  /** Standard bright tropical lighting and sky for a world. */
  function setupSky({ top = '#3d8ff0', bottom = '#c8f0ff', fog = 0xc8f0ff, fogNear = 30, fogFar = tier.far } = {}) {
    const sky = document.createElement('canvas');
    sky.width = 2;
    sky.height = 256;
    const g = sky.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, top);
    grad.addColorStop(1, bottom);
    g.fillStyle = grad;
    g.fillRect(0, 0, 2, 256);
    const texture = new THREE.CanvasTexture(sky);
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.background = texture;
    scene.fog = new THREE.Fog(fog, fogNear, fogFar);
  }

  function addLights(root) {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x88aa77, 1.4);
    root.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2d6, 2.4);
    sun.position.set(8, 18, 6);
    sun.castShadow = tier.shadows;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -25;
    sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -25;
    root.add(sun);
    root.add(sun.target);
    return sun;
  }

  return {
    THREE, renderer, scene, camera, tier: tierIndex, quality: tier,
    onFrame(fn) { frameFn = fn; },
    resize, setupSky, addLights,
  };
}
