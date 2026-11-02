/*
 * 103 SPX in 3D (three.js): late-afternoon sun with shadows, Montceau built by
 * town.js, Panda on his animated 103 SPX (wheels, pedals, lean, wheelies,
 * crashes), everything on the road drawn from the rules' state, exhaust smoke,
 * a turbo flame, speed lines and a chase camera.
 *
 *   const view = createView({ canvas, rules, tier, castUrl, texts });
 *   view.update(dt); view.resize(w, h); view.event(name, data); view.dispose();
 */
import * as THREE from 'three';
import { paintFace } from './faces.js';
import { buildTown } from './town.js';
import * as T from './textures.js';
import {
  M,
  box,
  merge,
  mopedBody,
  mopedGeometry,
  wheelGeometry,
  crankParts,
  FRONT_WHEEL,
  REAR_WHEEL,
  CRANK_AXLE,
  riderTorso,
  riderLeg,
  riderGeometry,
  HIP_L,
  HIP_R,
  walkerBody,
  walkerLeg,
  walkerArm,
  seatedGeometry,
  carGeometry,
  clopeGeometry,
  canGeometry,
  legGeometry,
  benchGeometry,
  bumpGeometry,
} from './models.js';

const CAR_COLORS = ['#d6332b', '#2f6fd1', '#f2f2f0', '#2a2c30', '#9aa3ad', '#e8b923', '#2f8a6e', '#7a2f3f', '#f08a24', '#3c4f7a', '#c9c2b0'];
const VAN_COLORS = ['#f2f2f0', '#f6c000', '#d9d9d6', '#3a6ea5'];
const FOG = '#efdcc2';
/** Things that drive or ride along the road (they steer when they change lane). */
const MOVERS = new Set(['car', 'gogol', 'azzouz', 'pietro', 'babar']);
/** The code-built car for each Kenney model, if the models could not load. */
const FALLBACK = { sedan: 'sedan', 'sedan-sports': 'sedan', 'hatchback-sports': 'hatch', suv: 'sedan', taxi: 'sedan', van: 'van', delivery: 'van', truck: 'van', 'garbage-truck': 'bus', tractor: 'van' };

export function createView({ canvas, rules, tier = 1, castUrl = (id) => `./cast/${id}.svg`, texts = (k) => k, kit = null }) {
  const st = rules.state;
  const route = rules.route;
  const disposables = [];
  const keep = (x) => (disposables.push(x), x);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier >= 2 ? 2 : 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  // Phones drop the GPU context when the app goes to the background: let it come back
  let lost = false;
  const onLost = (e) => {
    e.preventDefault();
    lost = true;
  };
  const onRestored = () => {
    lost = false;
  };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FOG);
  scene.fog = new THREE.Fog(FOG, 70, 300);
  const camera = new THREE.PerspectiveCamera(66, 1, 0.1, 1100);
  scene.add(camera);

  /* ---- Light: a warm late-afternoon sun, a blue sky above ---- */
  const sunDir = new THREE.Vector3(-0.55, 0.62, 0.56).normalize();
  scene.add(new THREE.HemisphereLight('#cfe4ff', '#7d6c52', 1.35));
  const sun = new THREE.DirectionalLight('#ffe2b8', 2.5);
  sun.castShadow = true;
  const shadowSize = tier >= 2 ? 2048 : 1024;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  const sc = sun.shadow.camera;
  sc.left = -30;
  sc.right = 30;
  sc.top = 30;
  sc.bottom = -30;
  sc.near = 1;
  sc.far = 160;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  scene.add(sun.target);

  // Reflections for the paint and the lake: a little sky-and-ground world, pre-filtered once
  {
    const envScene = new THREE.Scene();
    const g = new THREE.SphereGeometry(10, 24, 12);
    const colors = [];
    const pos = g.attributes.position;
    const top = new THREE.Color('#5c9be0');
    const hor = new THREE.Color('#f6e4cc');
    const bot = new THREE.Color('#6f6a5c');
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 10;
      const c = y > 0 ? hor.clone().lerp(top, Math.pow(y, 0.6)) : hor.clone().lerp(bot, Math.min(1, -y * 3));
      colors.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    envScene.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const sunBall = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 5.4, 4.6) }));
    sunBall.position.copy(sunDir).multiplyScalar(8);
    envScene.add(sunBall);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(envScene, 0.02);
    scene.environment = keep(env.texture);
    pmrem.dispose();
    g.dispose();
  }

  const lambert = (o) => keep(new THREE.MeshLambertMaterial(o));
  const VC = lambert({ vertexColors: true });
  const PAINT = keep(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.32, metalness: 0.35, envMapIntensity: 0.9 }));

  /* ---- Faces and labels ---- */
  const loader = new THREE.TextureLoader();
  const castTextures = new Map();
  function castTexture(id) {
    if (!castTextures.has(id)) {
      const t = loader.load(castUrl(id));
      t.colorSpace = THREE.SRGBColorSpace;
      castTextures.set(id, t);
    }
    return castTextures.get(id);
  }
  const spriteMat = (map, o = {}) => keep(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, ...o }));
  function sprite(map, w, h, o) {
    const s = new THREE.Sprite(spriteMat(map, o));
    s.scale.set(w, h, 1);
    return s;
  }
  const faceTextures = new Map();
  function faceSprite(id, size, variant = 0) {
    const key = id + ':' + variant;
    if (!faceTextures.has(key)) {
      const t = keep(new THREE.CanvasTexture(paintFace(id, variant)));
      t.colorSpace = THREE.SRGBColorSpace;
      faceTextures.set(key, t);
    }
    return sprite(faceTextures.get(key), size, size * 1.25);
  }
  const castSprite = (id, size) => sprite(castTexture(id), size, size * 1.22);
  const labels = new Map();
  function label(text, bg, w = 2.6) {
    if (!labels.has(text)) labels.set(text, keep(T.texture(T.labelCanvas(text, bg))));
    const s = sprite(labels.get(text), w, w / 4);
    s.renderOrder = 5;
    return s;
  }

  /* ---- Montceau ---- */
  const town = buildTown({ scene, route, sec: rules.sec, texts, tier, keep, castTexture, sunDir, kit });

  /* ---- Panda on his 103 SPX ---- */
  const panda = new THREE.Group(); // on the road, facing along it
  const lean = new THREE.Group(); // rolls into the turns
  const pitch = new THREE.Group(); // wheelies, pivoting on the back wheel
  pitch.position.set(0, 0, REAR_WHEEL[2]);
  const bike = new THREE.Group();
  bike.position.set(0, 0, -REAR_WHEEL[2]);
  panda.add(lean);
  lean.add(pitch);
  pitch.add(bike);
  const shadowy = (m) => ((m.castShadow = true), m);
  bike.add(shadowy(new THREE.Mesh(keep(mopedBody('#2f6fd1', { noCrank: true, stripe: '#e23b3b' })), PAINT)));
  const wheelG = keep(wheelGeometry());
  const wheelF = shadowy(new THREE.Mesh(wheelG, PAINT));
  wheelF.position.set(...FRONT_WHEEL);
  const wheelR = shadowy(new THREE.Mesh(wheelG, PAINT));
  wheelR.position.set(...REAR_WHEEL);
  const crank = new THREE.Mesh(keep(merge(crankParts())), VC);
  crank.position.set(...CRANK_AXLE);
  bike.add(wheelF, wheelR, crank);
  const rider = new THREE.Group();
  bike.add(rider);
  rider.add(shadowy(new THREE.Mesh(keep(riderTorso({ shirt: '#f2b705', hair: '#5a3e2c', skin: '#f3b8a0', glasses: true })), VC)));
  const legL = shadowy(new THREE.Mesh(keep(riderLeg(1, '#3b5b8c')), VC));
  legL.position.set(...HIP_L);
  const legR = shadowy(new THREE.Mesh(keep(riderLeg(-1, '#3b5b8c')), VC));
  legR.position.set(...HIP_R);
  rider.add(legL, legR);
  {
    // His face wrapped on the front of his head (the cast portrait, cropped to the face)
    const faceTex = loader.load(castUrl('panda'));
    faceTex.colorSpace = THREE.SRGBColorSpace;
    faceTex.repeat.set(0.7, 1.15);
    faceTex.offset.set(0.15, -0.01);
    keep(faceTex);
    const face = new THREE.Mesh(keep(new THREE.SphereGeometry(0.176, 24, 16, Math.PI * 0.12, Math.PI * 0.76, Math.PI * 0.18, Math.PI * 0.64)), lambert({ map: faceTex, transparent: true, alphaTest: 0.2 }));
    face.position.set(0, 1.68, 0.02);
    face.scale.set(1, 1.05, 1.02);
    rider.add(face);
    const decal = keep(T.texture(T.decalCanvas('103 SPX', null, '#ffffff', 256, 64, 46)));
    for (const s of [-1, 1]) {
      const d = new THREE.Mesh(keep(new THREE.PlaneGeometry(0.34, 0.085)), lambert({ map: decal, transparent: true }));
      d.position.set(s * 0.118, 0.73, -0.22);
      d.rotation.set(0.12 * s, (s * Math.PI) / 2, 0);
      bike.add(d);
    }
  }
  // The table leg, in his right hand once he has it
  const swing = new THREE.Group();
  swing.position.set(-0.3, 1.13, 0.42);
  const club = shadowy(new THREE.Mesh(keep(legGeometry()), VC));
  club.position.set(-0.05, 0.38, -0.1);
  club.rotation.set(-0.5, 0, 0.35);
  swing.add(club);
  swing.visible = false;
  rider.add(swing);
  // The turbo flame out of the exhaust
  const flameTex = keep(T.texture(T.glowCanvas('rgba(140,200,255,1)', 'rgba(60,90,255,0)')));
  const flame = sprite(flameTex, 0.5, 0.5, { blending: THREE.AdditiveBlending, fog: false });
  flame.position.set(-0.17, 0.42, -0.86);
  flame.visible = false;
  bike.add(flame);
  scene.add(panda);

  /* ---- Smoke, dust, sparkles ---- */
  const puffTex = keep(T.texture(T.glowCanvas('rgba(236,238,244,0.95)', 'rgba(236,238,244,0)')));
  const starTex = keep(T.texture(starCanvas()));
  const ringTex = keep(T.texture(ringCanvas()));
  function pool(n, map, size, o) {
    const list = [];
    for (let i = 0; i < n; i++) {
      const s = sprite(map, size, size, o);
      s.visible = false;
      scene.add(s);
      list.push({ s, life: 0, max: 1, vx: 0, vy: 0, vz: 0, grow: 1, alpha: 1, spin: 0 });
    }
    return list;
  }
  const puffs = pool(48, puffTex, 0.4);
  const stars = pool(30, starTex, 0.32, { fog: false });
  const rings = pool(6, ringTex, 1, { fog: false });
  function emit(list, x, y, z, o = {}) {
    const p = list.find((q) => q.life <= 0);
    if (!p) return null;
    p.life = p.max = o.life || 1;
    p.s.visible = true;
    p.s.position.set(x, y, z);
    p.vx = o.vx || 0;
    p.vy = o.vy || 0;
    p.vz = o.vz || 0;
    p.grow = o.grow ?? 1;
    p.size = o.size || 0.4;
    p.alpha = o.alpha ?? 0.6;
    p.gravity = o.gravity || 0;
    p.spin = o.spin || 0;
    p.s.material.color.set(o.color || '#ffffff');
    p.s.scale.setScalar(p.size);
    return p;
  }
  function stepPool(list, dt) {
    for (const p of list) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.vy -= p.gravity * dt;
      p.s.position.x += p.vx * dt;
      p.s.position.y += p.vy * dt;
      p.s.position.z += p.vz * dt;
      const k = 1 - p.life / p.max;
      p.s.scale.setScalar(p.size * (1 + k * p.grow));
      p.s.material.opacity = Math.max(0, p.life / p.max) * p.alpha;
      p.s.material.rotation += p.spin * dt;
      if (p.life <= 0) p.s.visible = false;
    }
  }
  function burst(x, y, z, n = 10, color = '#ffd23f', speed = 2.6) {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + Math.random();
      emit(stars, x, y, z, { life: 0.7, vx: Math.cos(a) * speed, vz: Math.sin(a) * speed, vy: 2 + Math.random() * 2, gravity: 7, size: 0.3, grow: -0.5, alpha: 1, color, spin: 8 });
    }
  }
  function dust(x, z, n = 8, color = '#b8a68a') {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2;
      emit(puffs, x + Math.cos(a) * 0.4, 0.3, z + Math.sin(a) * 0.4, { life: 1.1, vx: Math.cos(a) * 1.6, vz: Math.sin(a) * 1.6, vy: 0.6, size: 0.7, grow: 2.2, alpha: 0.55, color });
    }
  }

  /* ---- Speed lines (in front of the camera) ---- */
  const LINES = 46;
  const linePos = new Float32Array(LINES * 6);
  const lineData = [];
  for (let i = 0; i < LINES; i++) lineData.push({ a: Math.random() * Math.PI * 2, r: 1.1 + Math.random() * 2.2, z: -2 - Math.random() * 16, len: 0.8 + Math.random() * 1.6 });
  const lineGeom = keep(new THREE.BufferGeometry());
  lineGeom.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  const lineMat = keep(new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, depthTest: false, fog: false, blending: THREE.AdditiveBlending }));
  const speedLines = new THREE.LineSegments(lineGeom, lineMat);
  speedLines.frustumCulled = false;
  speedLines.renderOrder = 50;
  camera.add(speedLines);

  /* ---- Things on the road ---- */
  const geo = new Map();
  const once = (key, make) => {
    if (!geo.has(key)) geo.set(key, keep(make()));
    return geo.get(key);
  };
  const objects = new Map();
  const glowTex = keep(T.texture(T.glowCanvas('rgba(255,220,90,0.9)', 'rgba(255,200,60,0)')));
  const holeTex = keep(T.texture(holeCanvas()));
  const at = (obj, x, y, z) => (obj.position.set(x, y, z), obj);

  function rider3(g, moped, riderOpts, face, labelText, labelBg) {
    g.add(shadowy(new THREE.Mesh(moped, PAINT)));
    g.add(shadowy(new THREE.Mesh(once('rider:' + JSON.stringify(riderOpts), () => riderGeometry({ ...riderOpts, head: false })), VC)));
    g.add(at(face, 0, 1.78, 0.02));
    if (labelText) g.add(at(label(labelText, labelBg), 0, 2.72, 0));
  }

  function walker(g, coat, faceSpr, opts = {}) {
    const body = shadowy(new THREE.Mesh(once('walker:' + coat, () => walkerBody({ coat, bent: opts.bent || 0 })), VC));
    g.add(body);
    const limbs = [];
    for (const s of [-1, 1]) {
      const leg = shadowy(new THREE.Mesh(once('leg:' + (opts.legs || '#4a4a52'), () => walkerLeg(opts.legs || '#4a4a52')), VC));
      leg.position.set(s * 0.11, 0.92, 0);
      const arm = shadowy(new THREE.Mesh(once('arm:' + coat, () => walkerArm(coat)), VC));
      arm.position.set(s * 0.27, 1.42, -(opts.bent || 0) * 0.15);
      g.add(leg, arm);
      limbs.push({ leg, arm, s });
    }
    if (opts.cane) {
      const cane = new THREE.Mesh(once('cane', () => merge([box(0.04, 0.95, 0.04, '#5a3b22', M(0, -0.47, 0)), box(0.04, 0.04, 0.18, '#5a3b22', M(0, 0, 0.07))])), VC);
      cane.position.set(-0.32, 0.95, 0.18);
      g.add(cane);
    }
    g.add(at(faceSpr, 0, 1.86, 0.02));
    g.userData.limbs = limbs;
  }

  function makeObject(e) {
    const g = new THREE.Group();
    switch (e.kind) {
      case 'car':
      case 'parked': {
        const ready = kit && kit.make(e.model, { length: e.hl * 2, width: e.hw * 2 });
        if (ready) {
          g.add(ready);
          break;
        }
        const model = FALLBACK[e.model] || 'hatch';
        const color = model === 'bus' ? '#f4f4f2' : model === 'van' ? VAN_COLORS[e.id % VAN_COLORS.length] : CAR_COLORS[e.id % CAR_COLORS.length];
        g.add(shadowy(new THREE.Mesh(once('car:' + model + color, () => carGeometry(model, color, { stripe: model === 'van' && color === '#f6c000' ? '#2f5fa8' : undefined })), PAINT)));
        break;
      }
      case 'gogol':
        rider3(g, once('solex', () => mopedGeometry('#1d1d20', { solex: true })), { shirt: '#6d6a75', legs: '#4a4652', jacket: '#55525c' }, faceSprite('gogol', 0.82), texts('gogolName').toUpperCase(), '#8e5cc2');
        break;
      case 'pineur': {
        walker(g, '#a08a6a', faceSprite('pineur', 0.84), { cane: true, bent: 0.18 });
        const l = label(texts('pineurName').toUpperCase(), '#e07a10', 3.6);
        g.add(at(l, 0, 2.9, 0));
        break;
      }
      case 'panne':
        g.add(shadowy(new THREE.Mesh(once('panne', () => carGeometry('old', '#d8c9a3')), PAINT)));
        g.userData.steam = true;
        break;
      case 'impuissant': {
        walker(g, '#7d8b9a', faceSprite('impuissant', 0.84), { bent: 0.1 });
        g.add(at(label(texts('impuissantName').toUpperCase(), '#6c7a89', 3.8), 0, 2.9, 0));
        break;
      }
      case 'bench': {
        g.add(shadowy(new THREE.Mesh(once('bench', benchGeometry), VC)));
        const bud = shadowy(new THREE.Mesh(once('bud', () => seatedGeometry({ shirt: '#6b4f3a', legs: '#3d4a5c', belly: 1 })), VC));
        bud.position.x = -0.45;
        const smo = shadowy(new THREE.Mesh(once('smo', () => seatedGeometry({ shirt: '#5c6b3a', legs: '#4a3d33' })), VC));
        smo.position.x = 0.45;
        g.add(bud, smo);
        g.add(at(faceSprite('bud', 0.8), -0.45, 1.58, 0.05));
        g.add(at(faceSprite('smo', 0.8), 0.45, 1.58, 0.05));
        g.add(at(label(texts('budName').toUpperCase(), '#2a9d8f'), -0.9, 2.45, 0));
        g.add(at(label(texts('smoName').toUpperCase(), '#2a9d8f'), 1.1, 2.95, 0));
        break;
      }
      case 'clope':
        // Drawn all together (see the cigarettes below)
        g.userData.clope = true;
        break;
      case 'can': {
        const spin = new THREE.Group();
        spin.add(shadowy(new THREE.Mesh(once('can', canGeometry), VC)));
        g.add(spin);
        g.add(at(sprite(glowTex, 1.6, 1.6, { blending: THREE.AdditiveBlending, opacity: 0.8 }), 0, 0.7, 0));
        g.userData.spin = spin;
        spin.position.y = 0.7;
        break;
      }
      case 'leg': {
        const spin = new THREE.Group();
        spin.add(shadowy(new THREE.Mesh(once('leg', legGeometry), VC)));
        spin.position.y = 0.9;
        spin.rotation.z = 0.5;
        g.add(spin);
        g.add(at(sprite(keep(T.texture(T.glowCanvas('rgba(120,220,255,0.9)', 'rgba(120,220,255,0)'))), 1.7, 1.7, { blending: THREE.AdditiveBlending }), 0, 0.9, 0));
        g.userData.spin = spin;
        break;
      }
      case 'bump': {
        const m = new THREE.Mesh(once('bump', () => bumpGeometry(7.2)), VC);
        m.receiveShadow = true;
        g.add(m);
        break;
      }
      case 'hole': {
        const m = new THREE.Mesh(once('hole', () => new THREE.PlaneGeometry(1.5, 1.2)), lambert({ map: holeTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }));
        m.rotation.x = -Math.PI / 2;
        m.position.y = 0.02;
        g.add(m);
        break;
      }
      case 'azzouz': {
        const colors = ['#2f7fd1', '#e0a21b', '#d23c5a'];
        const c = colors[e.nth % 3];
        rider3(g, once('azzMob' + c, () => mopedGeometry(c)), { shirt: c, legs: '#2a2d36', jacket: '#24262c' }, faceSprite('azzouz', 0.8, e.nth), e.nth === 0 ? texts('azzouzName').toUpperCase() : null, '#2f7fd1');
        break;
      }
      case 'pietro':
        rider3(g, once('pietroMob', () => mopedGeometry('#b3261e')), { shirt: '#1f1f22', legs: '#2d3340', belly: 1 }, faceSprite('pietro', 0.84), texts('pietroName').toUpperCase(), '#b3261e');
        break;
      case 'babar':
        rider3(g, once('rcx', () => mopedGeometry('#d62828', { rcx: true })), { shirt: '#74acdf', legs: '#3b5b8c' }, castSprite('babar', 0.8), 'BABAR · 103 RCX', '#d62828');
        break;
      default:
        break;
    }
    scene.add(g);
    return g;
  }

  // The cigarettes on the road: all in one instanced mesh, their glows in one set of points
  const MAX_CLOPES = 160;
  const clopeMesh = new THREE.InstancedMesh(keep(clopeGeometry()), VC, MAX_CLOPES);
  clopeMesh.frustumCulled = false;
  scene.add(clopeMesh);
  const glowPos = new Float32Array(MAX_CLOPES * 3);
  const glowGeom = keep(new THREE.BufferGeometry());
  glowGeom.setAttribute('position', new THREE.BufferAttribute(glowPos, 3));
  const glowPoints = new THREE.Points(glowGeom, keep(new THREE.PointsMaterial({ map: glowTex, size: 1.4, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 })));
  glowPoints.frustumCulled = false;
  scene.add(glowPoints);
  const clopeDummy = new THREE.Object3D();
  function drawClopes() {
    let n = 0;
    for (const e of st.entities) {
      if (e.kind !== 'clope' || e.gone || n >= MAX_CLOPES) continue;
      const p = route.at(e.s, e.x);
      const y = (e.high ? 1.7 : 0.75) + Math.sin(clock * 4 + e.id) * 0.06;
      clopeDummy.position.set(p.x, y, p.z);
      clopeDummy.rotation.set(0, clock * 3 + e.id, 0.25);
      clopeDummy.updateMatrix();
      clopeMesh.setMatrixAt(n, clopeDummy.matrix);
      glowPos[n * 3] = p.x;
      glowPos[n * 3 + 1] = y;
      glowPos[n * 3 + 2] = p.z;
      n++;
    }
    clopeMesh.count = n;
    clopeMesh.instanceMatrix.needsUpdate = true;
    glowGeom.setDrawRange(0, n);
    glowGeom.attributes.position.needsUpdate = true;
  }

  // Les keufs: the police car, blue lights flashing, when the chase is on
  const police = new THREE.Group();
  const kitPolice = kit && kit.make('police', { length: 4.2, width: 1.8 });
  if (kitPolice) police.add(kitPolice);
  else police.add(shadowy(new THREE.Mesh(once('police', () => carGeometry('police', '#f4f6f8')), PAINT)));
  const blue = keep(T.texture(T.glowCanvas('rgba(70,120,255,1)', 'rgba(40,80,255,0)')));
  const red = keep(T.texture(T.glowCanvas('rgba(255,70,70,1)', 'rgba(255,40,40,0)')));
  const lightL = sprite(blue, 1.4, 1.4, { blending: THREE.AdditiveBlending, fog: false });
  const lightR = sprite(red, 1.4, 1.4, { blending: THREE.AdditiveBlending, fog: false });
  lightL.position.set(0.3, 1.58, -0.5);
  lightR.position.set(-0.3, 1.58, -0.5);
  police.add(lightL, lightR);
  {
    const side = keep(T.texture(T.decalCanvas('POLICE', null, '#1f4fa8', 256, 64, 44)));
    for (const s of [-1, 1]) {
      const d = new THREE.Mesh(keep(new THREE.PlaneGeometry(1.0, 0.25)), lambert({ map: side, transparent: true }));
      d.position.set(s * 0.82, 0.85, -0.3);
      d.rotation.y = (s * Math.PI) / 2;
      police.add(d);
    }
  }
  police.add(at(faceSprite('keufs', 0.62), 0.38, 1.25, 0.3));
  police.add(at(label(texts('keufsName').toUpperCase(), '#1f4fa8'), 0, 2.55, 0));
  police.visible = false;
  scene.add(police);

  // "TÛÛT !" bubbles over honking cars
  const honkTex = keep(T.texture(T.labelCanvas('TÛÛT !', '#f08a24')));
  const honks = [];

  /* ---- Camera and per-frame update ---- */
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const camDir = new THREE.Vector3(0, 0, 1);
  let camReady = false;
  let shake = 0;
  let clock = 0;
  let wheelAngle = 0;
  let crankAngle = 0;
  let crashSpin = 0;
  let endOrbit = 0;
  let baseFov = 66;
  let fovKick = 0;
  let swingT = 0;
  let swingSide = 1;
  let leanNow = 0;
  let yawNow = 0;
  let sideNow = 0;
  let camH = null;
  let prevX = st.x;

  function place(obj, s, x, flip = false, y = 0) {
    const p = route.at(s, x);
    obj.position.set(p.x, y, p.z);
    obj.rotation.y = p.heading + (flip ? Math.PI : 0);
    return p;
  }

  function update(dt) {
    clock += dt;
    const T_ = rules.tuning;
    const down = st.phase === 'down' || st.phase === 'over';
    const riding = st.phase === 'ride' || st.phase === 'done';

    /* Panda */
    const lift = st.air > 0 ? Math.sin((1 - st.air / T_.jumpTime) * Math.PI) * 0.6 : 0;
    const p = place(panda, st.s, st.x, false, lift);
    // Sideways speed (m/s, + = to the right), smoothed: the rules move Panda across at a steady rate
    const sideSpeed = Math.max(-15, Math.min(15, (st.x - prevX) / Math.max(dt, 1e-4)));
    prevX = st.x;
    sideNow += (sideSpeed - sideNow) * Math.min(1, dt * 10);
    const v = Math.max(st.v, 0.1);
    const steering = st.phase === 'ride' || st.phase === 'done';
    // The 103 points where it is going: a lane change turns it, it does not slide sideways
    // (rotation.y turns left when positive, hence the minus)
    const wantYaw = steering ? -Math.atan2(sideNow, Math.max(5, v)) * 0.9 : 0;
    yawNow += (wantYaw - yawNow) * Math.min(1, dt * 12);
    panda.rotation.y += yawNow;
    // It leans INTO the bend (the angle a real rider takes: atan(v² × curvature / g)) and into a lane
    // change; rotation.z leans to the right when positive. Curvature is + for a bend to the right.
    const curve = route.curvature(st.s);
    const wantLean = steering ? Math.max(-0.6, Math.min(0.6, Math.atan((v * v * curve) / 9.8) + sideNow * 0.032)) : 0;
    leanNow += (wantLean - leanNow) * Math.min(1, dt * 6);
    crashSpin += ((down ? 1.45 : 0) - crashSpin) * Math.min(1, dt * (down ? 10 : 4));
    lean.rotation.z = leanNow - crashSpin;
    // Panda hangs off a little more than the bike
    rider.rotation.z = leanNow * 0.25;
    lean.rotation.y = down ? Math.sin(clock * 3) * 0.3 * crashSpin : 0;
    pitch.rotation.x = st.air > 0 ? -Math.sin((1 - st.air / T_.jumpTime) * Math.PI) * 0.5 : st.boost > 0 && riding ? -0.08 : 0;
    bike.position.y = riding ? Math.sin(clock * 34) * 0.006 * Math.min(1, st.v / 6) : 0;
    wheelAngle += (st.v * dt) / 0.29;
    wheelF.rotation.x = wheelAngle;
    wheelR.rotation.x = wheelAngle;
    // Pedalling at the start, feet resting afterwards
    if (st.phase === 'pedal') crankAngle += dt * (4 + st.pedal * 14);
    crank.rotation.x = crankAngle;
    const pedalling = st.phase === 'pedal' ? 1 : 0;
    legL.rotation.x = Math.sin(crankAngle) * 0.35 * pedalling;
    legR.rotation.x = -Math.sin(crankAngle) * 0.35 * pedalling;
    rider.rotation.x = st.boost > 0 ? 0.12 : 0;
    // Invincible just after getting back on: blink
    panda.visible = !(st.safe > 0 && st.phase === 'ride' && Math.floor(clock * 12) % 2 === 0);
    // The table leg
    swing.visible = st.hasLeg;
    swingT = Math.max(0, swingT - dt);
    swing.rotation.set(-0.3, 0, swingT > 0 ? swingSide * Math.sin((1 - swingT / 0.35) * Math.PI) * 1.6 : 0);
    // Turbo flame
    flame.visible = st.boost > 0 && riding;
    if (flame.visible) flame.scale.setScalar(0.5 + Math.random() * 0.35);

    // Smoke: a two-stroke always smokes (blue-grey), more when pedalling hard
    const ex = route.at(st.s - 0.95, st.x + 0.17);
    if ((st.phase === 'ride' || st.phase === 'pedal') && Math.random() < dt * (st.phase === 'pedal' ? 5 + st.pedal * 16 : 9)) {
      emit(puffs, ex.x, 0.42 + lift, ex.z, { life: 1.3, vy: 0.5, vx: (Math.random() - 0.5) * 0.4, vz: (Math.random() - 0.5) * 0.4, size: 0.3, grow: 3, alpha: 0.42, color: '#c9d0de' });
    }
    stepPool(puffs, dt);
    stepPool(stars, dt);
    stepPool(rings, dt);

    /* Everything on the road */
    const alive = new Set();
    for (const e of st.entities) {
      alive.add(e.id);
      let o = objects.get(e.id);
      if (!o) {
        o = makeObject(e);
        objects.set(e.id, o);
      }
      if (e.kind === 'can' && e.flight > 0) {
        const bench = st.entities.find((b) => b.id === e.from);
        const f = 1 - e.flight / 0.8;
        const from = bench ? route.at(bench.s, bench.x) : route.at(e.s, e.x);
        const to = route.at(e.s, e.x);
        o.position.set(from.x + (to.x - from.x) * f, Math.sin(f * Math.PI) * 3.2, from.z + (to.z - from.z) * f);
        o.userData.spin.rotation.z += dt * 12;
        continue;
      }
      const flip = e.kind === 'car' && e.oncoming;
      place(o, e.s, e.x, flip);
      // Vehicles and riders turn when they change lane (they do not slide sideways)
      if (MOVERS.has(e.kind)) {
        const u = o.userData;
        const side = u.px === undefined ? 0 : (e.x - u.px) / Math.max(dt, 1e-4);
        u.px = e.x;
        u.side = (u.side || 0) + (Math.max(-12, Math.min(12, side)) - (u.side || 0)) * Math.min(1, dt * 8);
        o.rotation.y += (flip ? 1 : -1) * Math.atan2(u.side, Math.max(4, Math.abs(e.v || 0))) * 0.85;
      }
      if (e.kind === 'parked') o.rotation.y += e.side * 0.04;
      if (o.userData.spin) {
        o.userData.spin.rotation.y = clock * 3 + e.id;
        o.userData.spin.position.y += Math.sin(clock * 4 + e.id) * 0.004;
      }
      if (o.userData.limbs) {
        const walking = e.kind === 'pineur' ? e.walking : e.kind === 'impuissant';
        const ph = clock * (e.kind === 'pineur' ? 4 : 2.5) + e.id;
        for (const l of o.userData.limbs) {
          l.leg.rotation.x = walking && e.kind === 'pineur' ? Math.sin(ph) * 0.45 * l.s : 0;
          l.arm.rotation.x = e.kind === 'impuissant' ? -0.4 - Math.abs(Math.sin(ph)) * 0.9 : walking ? -Math.sin(ph) * 0.4 * l.s : 0;
          l.arm.rotation.z = e.kind === 'impuissant' ? l.s * 0.3 : 0;
        }
      }
      if (e.kind === 'pineur') o.rotation.y = route.at(e.s).heading + (e.dir > 0 ? -Math.PI / 2 : Math.PI / 2);
      if (e.kind === 'impuissant') o.rotation.y += -Math.PI / 2 + Math.sin(clock * 1.5) * 0.4;
      if (e.kind === 'bench') o.rotation.y -= Math.PI / 2;
      if (o.userData.steam && Math.random() < dt * 9) {
        const sp = route.at(e.s + 1.9, e.x);
        emit(puffs, sp.x, 1.2, sp.z, { life: 1.6, vy: 0.9, size: 0.5, grow: 2.5, alpha: 0.6, color: '#ffffff' });
      }
      if (e.kind === 'pietro') o.rotation.z = (e.state === 'down' ? Math.min(1.45, e.timer * 3) : e.reel > 0 ? Math.sin(e.reel * 20) * 0.25 : e.lunge > 0 ? -e.side * 0.3 : 0) * (e.side || 1);
      if (e.kind === 'azzouz' && e.state === 'pushed') o.rotation.z = Math.sin(clock * 18) * 0.25;
      if (['gogol', 'azzouz', 'babar', 'pietro'].includes(e.kind)) o.position.y = Math.sin(clock * 30 + e.id) * 0.008;
    }
    drawClopes();
    for (const [id, o] of objects) {
      if (alive.has(id)) continue;
      scene.remove(o);
      objects.delete(id);
    }
    for (let i = honks.length - 1; i >= 0; i--) {
      const h = honks[i];
      h.life -= dt;
      const o = objects.get(h.id);
      if (h.life <= 0 || !o) {
        scene.remove(h.s);
        honks.splice(i, 1);
        continue;
      }
      h.s.position.set(o.position.x, 2.4 + (1.2 - h.life) * 0.6, o.position.z);
      h.s.material.opacity = Math.min(1, h.life * 3);
    }

    // Les keufs
    police.visible = st.chase.on;
    if (st.chase.on) {
      place(police, st.s - st.chase.gap, st.chase.x);
      const blink = Math.floor(clock * 7) % 2 === 0;
      lightL.visible = blink;
      lightR.visible = !blink;
    }

    // The gang waves when Panda gets close
    const nearHome = st.s > route.length - 70;
    for (const m of town.gang) {
      const wave = nearHome ? Math.sin(clock * 9 + m.i) : 0;
      m.arms[0].rotation.z = nearHome ? -2.4 + wave * 0.4 : 0;
      m.arms[1].rotation.z = nearHome && m.i % 2 ? 2.4 - wave * 0.4 : 0;
      m.person.position.y = 0.14 + (st.phase === 'done' ? Math.abs(Math.sin(clock * 6 + m.i)) * 0.25 : 0);
    }

    /* Camera */
    shake = Math.max(0, shake - dt * 2.2);
    fovKick = Math.max(0, fovKick - dt * 6);
    const speedK = Math.max(0, Math.min(1, (st.v - 12) / 9));
    // The camera turns smoothly with the road a little ahead (an angle, eased, so a bend is a swing, not a jerk)
    const ahead = route.at(st.s + 3);
    const wantH = ahead.heading + yawNow * 0.3;
    if (camH === null) camH = wantH;
    let dH = wantH - camH;
    dH = Math.atan2(Math.sin(dH), Math.cos(dH));
    camH += dH * (1 - Math.exp(-dt * 3.2));
    camDir.set(Math.sin(camH), 0, Math.cos(camH));
    let wantPos;
    let wantLook;
    if (st.phase === 'pedal') {
      // Front three-quarter: see Panda pedalling his heart out
      const f = route.at(st.s + 3.4, st.x + 1.7);
      wantPos = new THREE.Vector3(f.x, 1.6, f.z);
      wantLook = new THREE.Vector3(p.x, 1.2, p.z);
    } else if (st.phase === 'done') {
      // Round to the front: Panda, his house and the gang
      endOrbit = Math.min(1, endOrbit + dt * 0.3);
      const e = endOrbit * endOrbit * (3 - 2 * endOrbit);
      // From behind Panda round to the other side of the street: Panda, the house and the whole gang
      const bx = p.x - camDir.x * 5.6 - p.rx * 0.5;
      const bz = p.z - camDir.z * 5.6 - p.rz * 0.5;
      const fx = p.x + camDir.x * 5 - p.rx * 13;
      const fz = p.z + camDir.z * 5 - p.rz * 13;
      wantPos = new THREE.Vector3(bx + (fx - bx) * e, 3.1 + e * 1.4, bz + (fz - bz) * e);
      wantLook = new THREE.Vector3(p.x + (p.rx * 2.5 - camDir.x * 4) * e, 1.3 + e * 0.8, p.z + (p.rz * 2.5 - camDir.z * 4) * e);
    } else {
      // Behind and above, looking well down the road: the rider in the lower third
      const back = 5.6 + speedK * 1.1;
      const high = 3.1 - speedK * 0.35;
      const rx = -camDir.z;
      const rz = camDir.x;
      const side = -st.x * 0.22;
      wantPos = new THREE.Vector3(p.x - camDir.x * back + rx * side, high + lift * 0.4, p.z - camDir.z * back + rz * side);
      // Look ahead of Panda, partly round the bend
      const la = route.at(st.s + 9, st.x * 0.8);
      const sx = p.x + camDir.x * 9 - rx * st.x * 0.1;
      const sz = p.z + camDir.z * 9 - rz * st.x * 0.1;
      wantLook = new THREE.Vector3(sx + (la.x - sx) * 0.35, 0.5, sz + (la.z - sz) * 0.35);
    }
    if (!camReady) {
      camPos.copy(wantPos);
      camLook.copy(wantLook);
      camReady = true;
    }
    const k = 1 - Math.exp(-dt * (st.phase === 'ride' ? 9 : 3));
    camPos.lerp(wantPos, k);
    camLook.lerp(wantLook, Math.min(1, k * 1.3));
    camera.position.copy(camPos);
    if (shake > 0) camera.position.add(new THREE.Vector3((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake * 0.6, (Math.random() - 0.5) * shake));
    camera.up.set(0, 1, 0);
    camera.lookAt(camLook);
    // The horizon tilts a little with the bike
    camera.rotateZ(-leanNow * 0.14);
    const fov = baseFov + speedK * 7 + (st.boost > 0 || st.slip ? 7 : 0) + fovKick * 6;
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov += (fov - camera.fov) * Math.min(1, dt * 4);
      camera.updateProjectionMatrix();
    }

    // Speed lines when going fast
    const lineAlpha = st.phase === 'ride' ? Math.max(st.boost > 0 ? 0.55 : 0, (speedK - 0.55) * 0.6) : 0;
    lineMat.opacity += (lineAlpha - lineMat.opacity) * Math.min(1, dt * 6);
    if (lineMat.opacity > 0.01) {
      const v = (st.v + 8) * 1.6;
      lineData.forEach((l, i) => {
        l.z += v * dt;
        if (l.z > -1) {
          l.z = -14 - Math.random() * 6;
          l.a = Math.random() * Math.PI * 2;
        }
        const x = Math.cos(l.a) * l.r;
        const y = Math.sin(l.a) * l.r * 1.6;
        linePos.set([x, y, l.z, x, y, l.z - l.len], i * 6);
      });
      lineGeom.attributes.position.needsUpdate = true;
    }
    speedLines.visible = lineMat.opacity > 0.01;

    // The sun follows Panda so his shadow is always sharp
    sun.position.set(p.x + sunDir.x * 60, sunDir.y * 60, p.z + sunDir.z * 60);
    sun.target.position.set(p.x + camDir.x * 12, 0, p.z + camDir.z * 12);
    town.update(camera, clock);
    if (!lost) {
      renderer.shadowMap.needsUpdate = true;
      renderer.render(scene, camera);
      if (mirrorRect && st.chase.on) renderMirror(p);
    }
  }

  /* ---- The rear-view mirror (during the chase) ---- */
  const mirrorCam = new THREE.PerspectiveCamera(34, 2, 0.5, 70);
  let mirrorRect = null;
  function renderMirror(p) {
    const { x, y, w, h } = mirrorRect;
    const H = canvas.clientHeight;
    const W = canvas.clientWidth;
    const back = route.at(st.s - Math.max(12, st.chase.gap), st.chase.x * 0.7);
    mirrorCam.position.set(p.x + camDir.x * 0.4, 1.8, p.z + camDir.z * 0.4);
    mirrorCam.lookAt(back.x, 0.8, back.z);
    mirrorCam.aspect = w / h;
    mirrorCam.updateProjectionMatrix();
    speedLines.visible = false;
    panda.visible = false;
    renderer.setScissorTest(true);
    renderer.setScissor(x, H - y - h, w, h);
    renderer.setViewport(x, H - y - h, w, h);
    renderer.render(scene, mirrorCam);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, W, H);
    panda.visible = true;
  }

  function event(name, data) {
    if (name === 'crash' || name === 'ram') {
      shake = name === 'crash' ? 0.7 : 0.3;
      if (name === 'crash') {
        burst(panda.position.x, 1.4, panda.position.z, 12, '#ffffff', 3.2);
        dust(panda.position.x, panda.position.z, 10);
      }
    }
    if (name === 'bonk' && data) {
      const o = objects.get(data.id);
      if (o) {
        burst(o.position.x, 1.9, o.position.z, 12, '#ffd23f');
        const pietro = st.entities.find((e) => e.id === data.id);
        swingSide = pietro && pietro.x > st.x ? -1 : 1;
      }
      swingT = 0.35;
      shake = 0.25;
    }
    if (name === 'push') swingT = 0.2;
    if (name === 'bump') {
      shake = 0.35;
      dust(panda.position.x, panda.position.z, 5, '#cfc6b4');
    }
    if (name === 'can' || name === 'leg') burst(panda.position.x, 1.3, panda.position.z, 10, name === 'can' ? '#ff5a5a' : '#7bdff2');
    if (name === 'clope' && data) {
      const e = st.entities.find((q) => q.id === data.id);
      if (e) {
        const p = route.at(e.s, e.x);
        burst(p.x, e.high ? 1.7 : 0.8, p.z, 6, '#ffd23f', 1.8);
      }
    }
    if (name === 'turbo') {
      fovKick = 1;
      burst(panda.position.x, 0.6, panda.position.z, 14, '#7cc0ff', 3.5);
    }
    if (name === 'nearMiss') fovKick = Math.max(fovKick, 0.5);
    if (name === 'scream' || name === 'gibberish') {
      for (let k = 0; k < 3; k++) {
        const r = emit(rings, panda.position.x, 1.7, panda.position.z, { life: 0.6 + k * 0.15, size: 0.5, grow: 5, alpha: 0.8, color: name === 'scream' ? '#ffffff' : '#c9a7ff' });
        if (r && name === 'gibberish') {
          const g = st.entities.find((e) => e.kind === 'gogol');
          if (g) {
            const gp = route.at(g.s, g.x);
            r.s.position.set(gp.x, 1.8, gp.z);
          }
        }
      }
    }
    if (name === 'honk' && data) {
      const s = new THREE.Sprite(spriteMat(honkTex));
      s.scale.set(2.2, 0.55, 1);
      scene.add(s);
      honks.push({ s, id: data.id, life: 1.2 });
    }
    if (name === 'finish') burst(panda.position.x, 2, panda.position.z, 24, '#ef2d6b', 4);
  }

  function resize(w, h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Portrait phones: a taller view so the road ahead fits
    baseFov = w < h ? 70 : 56;
    camera.fov = baseFov;
    camera.updateProjectionMatrix();
  }

  function dispose() {
    canvas.removeEventListener('webglcontextlost', onLost);
    canvas.removeEventListener('webglcontextrestored', onRestored);
    for (const d of disposables) d.dispose?.();
    for (const t of castTextures.values()) t.dispose();
    kit?.dispose();
    renderer.dispose();
  }

  return { update, event, resize, dispose, renderer, scene, camera, setMirror: (r) => (mirrorRect = r) };
}

function starCanvas() {
  const c = T.canvas(64, 64);
  const g = c.getContext('2d');
  g.translate(32, 32);
  g.fillStyle = '#ffffff';
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 9 : 28;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
  return c;
}

function ringCanvas() {
  const c = T.canvas(128, 128);
  const g = c.getContext('2d');
  g.strokeStyle = '#ffffff';
  g.lineWidth = 8;
  g.beginPath();
  g.arc(64, 64, 52, 0, Math.PI * 2);
  g.stroke();
  return c;
}

function holeCanvas() {
  const c = T.canvas(128, 96);
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 48, 6, 64, 48, 46);
  grad.addColorStop(0, 'rgba(18,18,20,0.95)');
  grad.addColorStop(0.7, 'rgba(30,30,32,0.9)');
  grad.addColorStop(0.85, 'rgba(90,88,84,0.8)');
  grad.addColorStop(1, 'rgba(90,88,84,0)');
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(64, 48, 60, 44, 0, 0, Math.PI * 2);
  g.fill();
  return c;
}
