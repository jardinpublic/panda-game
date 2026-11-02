/*
 * 103 SPX models, built from code (no model files): the Peugeot 103 SPX and
 * other mopeds, riders, walkers, cars (hatchback, saloon, van, bus, police),
 * and the small things on the road. Each is vertex-coloured geometry merged
 * into one mesh, so a phone draws a whole car in one call. Forward is +Z, up is
 * +Y, and the rider's right is −X.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const tmpQ = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);

export function M(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
}

/** A coloured copy of geom, moved by matrix m, ready to merge (position, normal, uv, color only). */
export function part(geom, color, m) {
  let g = geom.index ? geom.toNonIndexed() : geom.clone();
  geom.dispose();
  if (m) g.applyMatrix4(m);
  for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
  if (!g.attributes.normal) g.computeVertexNormals();
  const c = new THREE.Color(color);
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  g.groups = [];
  return g;
}

/** A cylinder from a to b ([x,y,z]). */
export function tube(a, b, r, color, seg = 8, r2 = r) {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  const geom = new THREE.CylinderGeometry(r2, r, len, seg);
  tmpQ.setFromUnitVectors(UP, vb.clone().sub(va).normalize());
  return part(geom, color, new THREE.Matrix4().compose(va.clone().add(vb).multiplyScalar(0.5), tmpQ.clone(), new THREE.Vector3(1, 1, 1)));
}

/** A tube along a smooth curve through points. */
export function curve(points, r, color, seg = 24, radial = 8) {
  const path = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return part(new THREE.TubeGeometry(path, seg, r, radial, false), color);
}

export const box = (w, h, d, color, m) => part(new THREE.BoxGeometry(w, h, d), color, m);
export const ball = (r, color, m, seg = 12) => part(new THREE.SphereGeometry(r, seg, Math.max(6, Math.round(seg * 0.7))), color, m);
export const cyl = (r, h, color, m, seg = 12, r2 = r) => part(new THREE.CylinderGeometry(r2, r, h, seg), color, m);
export const capsule = (r, len, color, m) => part(new THREE.CapsuleGeometry(r, len, 4, 10), color, m);
export const merge = (parts) => mergeGeometries(parts.filter(Boolean));

/** A side profile ([z, y] points, z forward) extruded across the width, edges rounded. */
export function profile(points, width, color, bevel = 0.05, m) {
  const shape = new THREE.Shape(points.map(([z, y]) => new THREE.Vector2(z, y)));
  const depth = Math.max(0.01, width - bevel * 2);
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 4 });
  g.rotateY(-Math.PI / 2);
  g.translate(depth / 2, 0, 0);
  return part(g, color, m);
}

/* ---------------- Mopeds ---------------- */

const CHROME = '#d4d8de';
const DARK = '#1f2124';
const RUBBER = '#18191b';

/** A mag wheel (5 spokes, like the SPX), centred on its axle, rolling about X. */
export function wheelGeometry(rim = '#bfc3c8', r = 0.29) {
  const p = [];
  p.push(part(new THREE.TorusGeometry(r - 0.045, 0.06, 8, 22), RUBBER, M(0, 0, 0, 0, Math.PI / 2, 0)));
  p.push(part(new THREE.TorusGeometry(r - 0.1, 0.018, 6, 20), rim, M(0, 0, 0, 0, Math.PI / 2, 0)));
  p.push(cyl(0.06, 0.12, rim, M(0, 0, 0, 0, 0, Math.PI / 2), 10));
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    p.push(box(0.03, r - 0.14, 0.035, rim, M(0, Math.cos(a) * (r - 0.1) * 0.5, Math.sin(a) * (r - 0.1) * 0.5, -a)));
  }
  return merge(p);
}

/**
 * The Peugeot 103 SPX without its wheels (they spin on their own): pressed-
 * steel spine frame, white side panels with the SPX stripe, the engine and its
 * variator cover, the chrome exhaust, fork, round mirrors, long seat and rack.
 * Wheels go at FRONT_WHEEL / REAR_WHEEL.
 */
export const FRONT_WHEEL = [0, 0.29, 0.62];
export const REAR_WHEEL = [0, 0.29, -0.58];

export function mopedBody(color = '#2f6fd1', opts = {}) {
  const p = [];
  const panel = opts.panel || '#f4f4f2';
  // Spine frame from the steering head down under the seat (the tank is inside it)
  p.push(curve([[0, 1.0, 0.44], [0, 0.78, 0.3], [0, 0.5, 0.08], [0, 0.52, -0.2], [0, 0.78, -0.42]], 0.075, color, 20, 10));
  p.push(box(0.2, 0.26, 0.42, color, M(0, 0.68, -0.18, 0.12)));
  // Side panels with the stripe
  for (const s of [-1, 1]) {
    p.push(box(0.02, 0.2, 0.4, panel, M(s * 0.105, 0.7, -0.22, 0.12)));
    p.push(box(0.022, 0.035, 0.38, opts.stripe || '#e23b3b', M(s * 0.106, 0.66, -0.22, 0.12)));
  }
  // Engine, cylinder with fins, variator cover on the left
  p.push(box(0.2, 0.2, 0.3, '#8e9399', M(0, 0.33, 0.02)));
  for (let k = 0; k < 4; k++) p.push(box(0.17, 0.02, 0.17, '#a6abb1', M(0, 0.47 + k * 0.035, 0.2, 0.5)));
  p.push(cyl(0.14, 0.06, '#c3c7cc', M(0.13, 0.33, -0.02, 0, 0, Math.PI / 2), 16));
  p.push(cyl(0.05, 0.08, '#555a60', M(0.16, 0.33, -0.02, 0, 0, Math.PI / 2), 10));
  // Exhaust: down from the cylinder, along the right, up to the silencer
  p.push(curve([[0, 0.48, 0.28], [-0.08, 0.3, 0.28], [-0.14, 0.24, 0.0], [-0.16, 0.34, -0.4]], 0.032, CHROME, 16, 8));
  p.push(cyl(0.055, 0.42, CHROME, M(-0.17, 0.4, -0.6, Math.PI / 2 - 0.25, 0, 0), 12, 0.045));
  // Pedals and cranks (moped!), on the crank axle
  // (the crank itself is a separate mesh for Panda's moped; NPC mopeds have it here)
  if (!opts.noCrank) p.push(...crankParts());
  // Rear: mudguard, rack, light, plate, shocks
  p.push(part(new THREE.TorusGeometry(0.33, 0.035, 4, 12, Math.PI * 0.8), color, M(0, 0.29, -0.58, 0, Math.PI / 2, Math.PI * 0.15)));
  p.push(box(0.2, 0.025, 0.36, CHROME, M(0, 0.86, -0.7)));
  for (const s of [-1, 1]) {
    p.push(tube([s * 0.1, 0.86, -0.54], [s * 0.1, 0.86, -0.88], 0.012, CHROME, 6));
    p.push(tube([s * 0.1, 0.84, -0.45], [s * 0.09, 0.32, -0.58], 0.022, '#3d4045', 6));
    p.push(tube([s * 0.1, 0.78, -0.47], [s * 0.095, 0.55, -0.53], 0.035, CHROME, 8));
  }
  p.push(box(0.12, 0.07, 0.06, '#c8102e', M(0, 0.8, -0.9)));
  p.push(box(0.16, 0.1, 0.01, '#f2f2f2', M(0, 0.7, -0.92, -0.2)));
  // The long seat
  p.push(part(new THREE.CapsuleGeometry(0.11, 0.42, 4, 10), opts.seat || '#202022', M(0, 0.88, -0.32, Math.PI / 2, 0, 0, 1.2, 1, 0.55)));
  // Fork, front mudguard, headlight in its cowl, handlebar, mirrors
  for (const s of [-1, 1]) p.push(tube([s * 0.07, 1.02, 0.47], [s * 0.07, 0.3, 0.62], 0.024, CHROME, 8));
  p.push(part(new THREE.TorusGeometry(0.33, 0.03, 4, 12, Math.PI * 0.6), CHROME, M(0, 0.29, 0.62, 0, Math.PI / 2, Math.PI * 0.25)));
  p.push(box(0.22, 0.18, 0.14, color, M(0, 1.03, 0.56, 0.25)));
  p.push(cyl(0.075, 0.03, '#fff6cc', M(0, 1.03, 0.635, Math.PI / 2 + 0.25), 14));
  p.push(tube([-0.32, 1.13, 0.43], [0.32, 1.13, 0.43], 0.018, CHROME, 6));
  for (const s of [-1, 1]) {
    p.push(tube([s * 0.25, 1.13, 0.43], [s * 0.35, 1.13, 0.42], 0.03, DARK, 8));
    p.push(tube([s * 0.2, 1.14, 0.43], [s * 0.3, 1.4, 0.4], 0.008, CHROME, 4));
    p.push(cyl(0.055, 0.02, '#d9dde2', M(s * 0.3, 1.42, 0.4, Math.PI / 2, 0, 0), 12));
  }
  if (opts.solex) {
    // Pépé Gogol's VéloSoleX: the engine on the front wheel, a basket
    p.push(box(0.2, 0.18, 0.26, DARK, M(0, 0.62, 0.66)));
    p.push(cyl(0.06, 0.22, '#777c82', M(0, 0.5, 0.75, 0, 0, Math.PI / 2), 10));
  }
  if (opts.rcx) {
    // Babar's 103 RCX: a little racing fairing and number plate
    p.push(box(0.3, 0.22, 0.05, '#ffffff', M(0, 1.02, 0.66, 0.3)));
    p.push(cyl(0.06, 0.25, '#2a2a2a', M(-0.17, 0.45, -0.55, Math.PI / 2 - 0.4, 0, 0), 10));
  }
  return merge(p);
}

/** Cranks and pedals, about their own axle (X), centred there. */
export function crankParts() {
  const p = [];
  for (const s of [-1, 1]) {
    p.push(box(0.02, 0.025, 0.16, '#555a60', M(s * 0.13, 0, s * 0.08)));
    p.push(box(0.1, 0.025, 0.06, DARK, M(s * 0.18, 0, s * 0.16)));
  }
  p.push(cyl(0.05, 0.27, '#555a60', M(0, 0, 0, 0, 0, Math.PI / 2), 10));
  return p;
}
export const CRANK_AXLE = [0, 0.33, 0.06];

/** A whole moped (wheels in place) for the other riders. */
export function mopedGeometry(color, opts = {}) {
  const body = mopedBody(color, { ...opts, noCrank: true });
  const w = wheelGeometry(opts.rim);
  const wf = w.clone().applyMatrix4(M(...FRONT_WHEEL));
  const wr = w.clone().applyMatrix4(M(...REAR_WHEEL));
  const crank = merge(crankParts()).applyMatrix4(M(...CRANK_AXLE));
  const g = merge([body, wf, wr, crank]);
  for (const x of [body, w, wf, wr, crank]) x.dispose();
  return g;
}

/* ---------------- People ---------------- */

/**
 * A rider's body without legs (hips at the seat). Arms reach the grips.
 * head: false leaves the head out (a face goes there instead).
 */
export function riderTorso({ shirt, skin = '#f0c4a4', hair = '#4a3426', head = true, glasses = false, jacket = null, belly = 0 }) {
  const p = [];
  p.push(capsule(0.19 + belly * 0.03, 0.3, shirt, M(0, 1.24, -0.16, 0.32, 0, 0, 1.08, 1, 0.9 + belly * 0.25)));
  if (belly) p.push(ball(0.2, shirt, M(0, 1.08, -0.05, 0, 0, 0, 1.05, 0.9, 1)));
  if (jacket) p.push(capsule(0.2, 0.26, jacket, M(0, 1.27, -0.18, 0.32, 0, 0, 1.12, 1, 0.92)));
  p.push(ball(0.17, '#2c3a52', M(0, 0.93, -0.3, 0, 0, 0, 1.25, 0.7, 1.15)));
  for (const s of [-1, 1]) {
    p.push(ball(0.08, jacket || shirt, M(s * 0.2, 1.42, -0.06)));
    p.push(tube([s * 0.21, 1.41, -0.05], [s * 0.28, 1.22, 0.18], 0.06, jacket || shirt, 8, 0.055));
    p.push(tube([s * 0.28, 1.22, 0.18], [s * 0.3, 1.14, 0.4], 0.045, skin, 8, 0.04));
    p.push(ball(0.05, skin, M(s * 0.3, 1.13, 0.42)));
  }
  p.push(tube([0, 1.46, -0.04], [0, 1.56, 0.0], 0.06, skin, 8));
  if (head) {
    p.push(ball(0.165, skin, M(0, 1.68, 0.02, 0, 0, 0, 1, 1.05, 1.02), 16));
    p.push(ball(0.172, hair, M(0, 1.72, -0.02, 0, 0, 0, 1.02, 0.86, 1.04), 16));
    p.push(ball(0.12, hair, M(0, 1.63, -0.1, 0, 0, 0, 1.2, 0.8, 0.9)));
    for (const s of [-1, 1]) p.push(ball(0.045, skin, M(s * 0.165, 1.66, 0.01, 0, 0, 0, 0.6, 1, 1)));
    if (glasses) for (const s of [-1, 1]) p.push(box(0.012, 0.015, 0.16, '#141414', M(s * 0.16, 1.7, 0.08)));
  }
  return merge(p);
}

/** One leg from the hip (at the origin) bent to the foot rest. side: −1 right, 1 left. */
export function riderLeg(side, legs = '#3b5b8c', shoes = '#222222') {
  const p = [];
  const knee = [side * 0.05, 0.04, 0.4];
  const foot = [side * 0.06, -0.5, 0.3];
  p.push(tube([0, 0, 0], knee, 0.085, legs, 8, 0.07));
  p.push(ball(0.07, legs, M(...knee)));
  p.push(tube(knee, foot, 0.065, legs, 8, 0.055));
  p.push(box(0.11, 0.08, 0.24, shoes, M(foot[0], foot[1] - 0.04, foot[2] + 0.06)));
  return merge(p);
}
export const HIP_L = [0.12, 0.93, -0.2];
export const HIP_R = [-0.12, 0.93, -0.2];

/** A whole static rider (legs merged) for the other riders. */
export function riderGeometry(opts) {
  const torso = riderTorso(opts);
  const l = riderLeg(1, opts.legs, opts.shoes).applyMatrix4(M(...HIP_L));
  const r = riderLeg(-1, opts.legs, opts.shoes).applyMatrix4(M(...HIP_R));
  return merge([torso, l, r]);
}

/** A standing person without legs and arms (they swing). Hips at 0.92. */
export function walkerBody({ coat, skin = '#eebd9c', scarf = null, bent = 0 }) {
  const p = [];
  p.push(capsule(0.21, 0.42, coat, M(0, 1.22, -bent * 0.1, bent, 0, 0)));
  p.push(ball(0.2, coat, M(0, 0.96, 0, 0, 0, 0, 1.05, 0.7, 1)));
  if (scarf) p.push(part(new THREE.TorusGeometry(0.11, 0.05, 6, 12), scarf, M(0, 1.5, -bent * 0.2, Math.PI / 2)));
  p.push(tube([0, 1.48, -bent * 0.2], [0, 1.6, -bent * 0.25], 0.06, skin));
  return merge(p);
}
export function walkerLeg(legs = '#4a4a52', shoes = '#2a2523') {
  return merge([tube([0, 0, 0], [0, -0.82, 0.02], 0.08, legs, 8, 0.07), box(0.12, 0.08, 0.26, shoes, M(0, -0.86, 0.06))]);
}
export function walkerArm(coat, skin = '#eebd9c') {
  return merge([tube([0, 0, 0], [0, -0.5, 0.06], 0.06, coat, 8, 0.05), ball(0.05, skin, M(0, -0.55, 0.07))]);
}

/** Somebody sitting (on a bench): legs bent forward. */
export function seatedGeometry({ shirt, legs, skin = '#e9b996', belly = 0 }) {
  const p = [];
  p.push(capsule(0.2 + belly * 0.04, 0.34, shirt, M(0, 0.92, -0.06, -0.12)));
  if (belly) p.push(ball(0.22, shirt, M(0, 0.78, 0.05, 0, 0, 0, 1, 0.85, 1)));
  for (const s of [-1, 1]) {
    p.push(tube([s * 0.11, 0.6, -0.02], [s * 0.13, 0.6, 0.42], 0.085, legs, 8, 0.075));
    p.push(tube([s * 0.13, 0.6, 0.42], [s * 0.13, 0.08, 0.46], 0.07, legs));
    p.push(box(0.12, 0.08, 0.24, '#2a2523', M(s * 0.13, 0.04, 0.52)));
    p.push(tube([s * 0.22, 1.12, -0.02], [s * 0.27, 0.86, 0.22], 0.055, shirt));
    p.push(ball(0.05, skin, M(s * 0.27, 0.84, 0.25)));
  }
  p.push(tube([0, 1.12, -0.06], [0, 1.24, -0.06], 0.06, skin));
  return merge(p);
}

/* ---------------- Cars ---------------- */

const GLASS = '#1d2a36';
const PLASTIC = '#2a2c30';

function wheelSet(hw, wz, r = 0.32, rim = '#b9bec5') {
  const p = [];
  for (const x of [-hw + 0.1, hw - 0.1]) {
    for (const z of wz) {
      p.push(cyl(r, 0.22, RUBBER, M(x, r, z, 0, 0, Math.PI / 2), 14));
      p.push(cyl(r * 0.62, 0.23, rim, M(x, r, z, 0, 0, Math.PI / 2), 12));
    }
  }
  return p;
}

function lightsAndPlates(hl, hw, yLight, yBumper, extra = {}) {
  const p = [];
  // Bumpers
  p.push(box(hw * 2 + 0.04, 0.2, 0.18, extra.bumper || PLASTIC, M(0, yBumper, hl - 0.02)));
  p.push(box(hw * 2 + 0.04, 0.2, 0.18, extra.bumper || PLASTIC, M(0, yBumper, -hl + 0.02)));
  // Headlights, grille, tail lights, plates
  for (const s of [-1, 1]) {
    p.push(box(0.36, 0.13, 0.05, '#f6f2dc', M(s * (hw - 0.3), yLight, hl - 0.04)));
    p.push(box(0.3, 0.14, 0.05, '#c21d22', M(s * (hw - 0.26), yLight + 0.02, -hl + 0.03)));
    p.push(box(0.08, 0.07, 0.05, '#ffa21a', M(s * (hw - 0.1), yLight - 0.08, hl - 0.05)));
  }
  p.push(box(hw * 0.7, 0.12, 0.05, '#18191b', M(0, yLight - 0.02, hl - 0.03)));
  p.push(box(0.5, 0.12, 0.03, '#f4f4f4', M(0, yBumper, hl + 0.08)));
  p.push(box(0.5, 0.12, 0.03, '#f4f4f4', M(0, yBumper + 0.05, -hl - 0.08)));
  for (const s of [-1, 1]) p.push(box(0.03, 0.03, 0.03, '#2a5bd7', M(s * 0.22, yBumper, hl + 0.095)));
  return p;
}

/** Mirrors on the doors. */
function mirrors(hw, y, z, color) {
  return [-1, 1].map((s) => box(0.16, 0.09, 0.1, color, M(s * (hw + 0.05), y, z)));
}

/**
 * Cars by model: 'hatch' (a small French hatchback), 'sedan', 'van', 'bus',
 * 'police', 'old' (Pépé Impuissant's old saloon, bonnet up). Sized as VEHICLES in rules.js.
 */
export function carGeometry(model, color, opts = {}) {
  if (!['hatch', 'police', 'sedan', 'old', 'van', 'bus'].includes(model)) model = 'hatch';
  const p = [];
  if (model === 'hatch' || model === 'police') {
    const hl = 1.9;
    const hw = 0.8;
    p.push(profile([[1.9, 0.22], [1.95, 0.5], [1.86, 0.74], [0.8, 0.9], [-1.82, 0.94], [-1.9, 0.62], [-1.86, 0.22]], hw * 2, color, 0.06));
    // Glass house, then the roof and the pillars in body colour
    p.push(profile([[0.84, 0.88], [0.08, 1.36], [-1.42, 1.38], [-1.8, 0.94]], hw * 2 - 0.2, GLASS, 0.04));
    p.push(profile([[0.12, 1.33], [0.04, 1.42], [-1.44, 1.43], [-1.42, 1.33]], hw * 2 - 0.16, color, 0.03));
    for (const s of [-1, 1]) {
      p.push(tube([s * (hw - 0.12), 0.9, 0.8], [s * (hw - 0.12), 1.36, 0.08], 0.045, color, 6));
      p.push(tube([s * (hw - 0.11), 0.92, -0.62], [s * (hw - 0.11), 1.37, -0.62], 0.05, color, 6));
      p.push(tube([s * (hw - 0.12), 0.95, -1.78], [s * (hw - 0.12), 1.38, -1.4], 0.07, color, 6));
    }
    p.push(...wheelSet(hw, [1.22, -1.22]));
    p.push(...lightsAndPlates(hl, hw, 0.68, 0.36));
    p.push(...mirrors(hw, 0.98, 0.65, color));
    // Door lines and handles
    for (const s of [-1, 1]) {
      p.push(box(0.01, 0.5, 0.012, '#000000', M(s * (hw + 0.005), 0.66, -0.62)));
      p.push(box(0.02, 0.03, 0.14, '#5a5e64', M(s * (hw + 0.01), 0.82, -0.3)));
    }
    if (model === 'police') {
      for (const s of [-1, 1]) {
        p.push(box(0.012, 0.16, 3.2, '#1f4fa8', M(s * (hw + 0.012), 0.58, 0)));
        p.push(box(0.012, 0.05, 3.2, '#e23b3b', M(s * (hw + 0.012), 0.69, 0)));
      }
      p.push(box(1.1, 0.08, 0.32, '#2b2b2b', M(0, 1.47, -0.5)));
    }
  } else if (model === 'sedan' || model === 'old') {
    const hl = 2.25;
    const hw = 0.85;
    p.push(profile([[2.25, 0.24], [2.3, 0.52], [2.2, 0.76], [1.05, 0.88], [-1.5, 0.94], [-2.2, 0.92], [-2.28, 0.6], [-2.2, 0.24]], hw * 2, color, 0.06));
    p.push(profile([[1.08, 0.86], [0.25, 1.36], [-0.98, 1.38], [-1.56, 0.92]], hw * 2 - 0.2, GLASS, 0.04));
    p.push(profile([[0.3, 1.33], [0.22, 1.42], [-1.0, 1.43], [-0.98, 1.33]], hw * 2 - 0.16, color, 0.03));
    for (const s of [-1, 1]) {
      p.push(tube([s * (hw - 0.12), 0.88, 1.06], [s * (hw - 0.12), 1.36, 0.25], 0.045, color, 6));
      p.push(tube([s * (hw - 0.11), 0.92, -0.35], [s * (hw - 0.11), 1.37, -0.35], 0.05, color, 6));
      p.push(tube([s * (hw - 0.12), 0.94, -1.54], [s * (hw - 0.12), 1.38, -0.98], 0.07, color, 6));
      p.push(box(0.02, 0.03, 0.14, '#5a5e64', M(s * (hw + 0.01), 0.82, 0.1)));
      p.push(box(0.02, 0.03, 0.14, '#5a5e64', M(s * (hw + 0.01), 0.82, -0.8)));
    }
    p.push(...wheelSet(hw, [1.4, -1.4], 0.33, model === 'old' ? '#d8dbe0' : undefined));
    p.push(...lightsAndPlates(hl, hw, 0.7, 0.38, model === 'old' ? { bumper: '#cfd3d8' } : {}));
    p.push(...mirrors(hw, 0.98, 0.95, color));
    if (model === 'old') {
      // Bonnet up, the engine showing
      p.push(box(1.5, 0.05, 1.05, color, M(0, 1.28, 1.48, -1.05)));
      p.push(box(1.1, 0.3, 0.8, '#3a3d42', M(0, 0.78, 1.6)));
    }
  } else if (model === 'van') {
    const hl = 2.4;
    const hw = 0.95;
    p.push(profile([[2.4, 0.26], [2.46, 0.62], [2.22, 0.98], [1.55, 1.12], [0.82, 1.86], [-2.32, 1.9], [-2.42, 1.7], [-2.42, 0.26]], hw * 2, color, 0.07));
    // Windscreen and the front side windows (a panel van behind)
    p.push(profile([[1.5, 1.14], [0.85, 1.8], [0.62, 1.8], [0.62, 1.14]], hw * 2 + 0.02, GLASS, 0));
    p.push(box(1.6, 0.62, 0.04, GLASS, M(0, 1.47, 1.2, -0.84)));
    for (const s of [-1, 1]) {
      p.push(box(0.02, 0.03, 0.16, '#5a5e64', M(s * (hw + 0.01), 0.98, 0.9)));
      p.push(box(0.012, 1.4, 0.02, '#000000', M(s * (hw + 0.006), 1.05, -0.4)));
    }
    p.push(...wheelSet(hw, [1.55, -1.55], 0.34));
    p.push(...lightsAndPlates(hl, hw, 0.84, 0.4));
    p.push(...mirrors(hw, 1.28, 1.25, PLASTIC));
    if (opts.stripe) for (const s of [-1, 1]) p.push(box(0.012, 0.2, 3.4, opts.stripe, M(s * (hw + 0.012), 1.25, -0.6)));
    // Rear doors: two windows, the split line, a handle
    for (const s of [-1, 1]) p.push(box(0.62, 0.42, 0.03, GLASS, M(s * 0.42, 1.48, -hl - 0.1)));
    p.push(box(0.02, 1.5, 0.03, '#000000', M(0, 1.1, -hl - 0.1)));
    p.push(box(0.16, 0.04, 0.04, '#5a5e64', M(0.12, 1.05, -hl - 0.11)));
  } else if (model === 'bus') {
    const hl = 5.6;
    const hw = 1.25;
    p.push(profile([[5.6, 0.32], [5.65, 1.05], [5.55, 2.85], [5.3, 3.02], [-5.45, 3.02], [-5.6, 2.8], [-5.62, 0.32]], hw * 2, color, 0.1));
    // Window band, windscreen, the stripe, doors
    p.push(profile([[5.45, 1.25], [5.5, 2.75], [-5.35, 2.75], [-5.35, 1.4], [3.6, 1.4], [3.6, 1.25]], hw * 2 + 0.03, GLASS, 0));
    for (const s of [-1, 1]) {
      p.push(box(0.012, 0.28, 10.9, opts.stripe || '#1aa39a', M(s * (hw + 0.016), 0.95, 0)));
      p.push(box(0.012, 2.3, 1.2, GLASS, M(s * (hw + 0.016), 1.45, 4.3)));
      for (let k = 0; k < 6; k++) p.push(box(0.02, 1.45, 0.08, color, M(s * (hw + 0.012), 2.02, 3.3 - k * 1.65)));
    }
    p.push(box(1.6, 0.24, 0.04, '#111111', M(0, 2.82, 5.62)));
    p.push(box(1.2, 0.12, 0.05, '#ffb000', M(0, 2.82, 5.645)));
    p.push(box(1.7, 0.22, 0.4, '#cfd3d8', M(0, 3.12, -1.5)));
    p.push(...wheelSet(hw, [3.9, -3.4], 0.48));
    p.push(...lightsAndPlates(hl, hw, 0.85, 0.42));
    p.push(...mirrors(hw + 0.1, 2.5, 5.4, PLASTIC));
  }
  return merge(p);
}

/* ---------------- Things on the road ---------------- */

/** An oversized cigarette (the pickups): white paper, orange filter, glowing tip. */
export function clopeGeometry() {
  return merge([
    cyl(0.055, 0.36, '#f7f5ef', M(0, 0, 0.045, Math.PI / 2, 0, 0), 12),
    cyl(0.057, 0.13, '#e48a2e', M(0, 0, -0.195, Math.PI / 2, 0, 0), 12),
    cyl(0.053, 0.025, '#ff5a1f', M(0, 0, 0.235, Math.PI / 2, 0, 0), 12),
  ]);
}

/** The 8.6 cans Le Bud and Le Smo throw (oversized, red and gold). */
export function canGeometry() {
  return merge([
    cyl(0.17, 0.46, '#c8102e', M(0, 0, 0), 16),
    cyl(0.172, 0.1, '#e4b43a', M(0, 0.06, 0), 16),
    cyl(0.14, 0.03, '#c9ced6', M(0, 0.245, 0), 16),
    cyl(0.14, 0.03, '#c9ced6', M(0, -0.245, 0), 16),
  ]);
}

/** The table leg from the Café des Sports (a turned wooden leg). */
export function legGeometry() {
  return merge([
    cyl(0.06, 0.9, '#8a5a2b', M(0, 0, 0), 10, 0.045),
    ball(0.075, '#7a4a22', M(0, 0.2, 0)),
    ball(0.07, '#7a4a22', M(0, -0.15, 0)),
    box(0.16, 0.06, 0.16, '#5f3d1d', M(0, 0.47, 0)),
  ]);
}

export function benchGeometry() {
  const wood = '#9a6a3c';
  const iron = '#2f3a3f';
  const p = [];
  for (let k = 0; k < 3; k++) p.push(box(2.0, 0.04, 0.13, wood, M(0, 0.48, -0.15 + k * 0.15)));
  for (let k = 0; k < 2; k++) p.push(box(2.0, 0.12, 0.04, wood, M(0, 0.72 + k * 0.17, -0.24, -0.15)));
  for (const x of [-0.85, 0.85]) {
    p.push(box(0.06, 0.48, 0.42, iron, M(x, 0.24, 0)));
    p.push(box(0.06, 0.5, 0.06, iron, M(x, 0.75, -0.22, -0.15)));
  }
  // Empty cans under the bench
  for (const [x, z] of [[-0.3, 0.3], [0.1, 0.35], [0.5, 0.28], [0.95, 0.25]]) p.push(cyl(0.035, 0.12, '#c8102e', M(x, 0.06, z, 0, 0, x > 0.4 ? Math.PI / 2 : 0), 8));
  return merge(p);
}

/** Speed bump: a yellow-and-black hump across the road. */
export function bumpGeometry(width = 7) {
  const p = [];
  const n = 14;
  for (let i = 0; i < n; i++) {
    const g = new THREE.CylinderGeometry(0.45, 0.45, width / n, 12, 1, false, 0, Math.PI);
    p.push(part(g, i % 2 ? '#1d1d1f' : '#f2c230', M(-width / 2 + (i + 0.5) * (width / n), 0, 0, 0, Math.PI / 2, Math.PI / 2, 1, 1, 0.3)));
  }
  return merge(p);
}

/** A lamp post (modern, curved arm) or an old-style lantern. */
export function lampGeometry() {
  return merge([
    cyl(0.1, 0.5, '#3d4248', M(0, 0.25, 0), 8, 0.08),
    tube([0, 0.4, 0], [0, 5.2, 0], 0.06, '#4a5058', 8, 0.045),
    curve([[0, 5.1, 0], [0, 5.5, 0.3], [0, 5.5, 1.1]], 0.04, '#4a5058', 10, 6),
    box(0.3, 0.12, 0.6, '#3d4248', M(0, 5.48, 1.25)),
    box(0.24, 0.03, 0.5, '#fff1c2', M(0, 5.41, 1.25)),
  ]);
}

/** A round tree (lime, plane tree) or a cone (conifer); vertex colours vary. */
export function treeGeometry(kind = 'round', seed = 1) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const p = [];
  if (kind === 'cone') {
    p.push(cyl(0.16, 1.2, '#5a4030', M(0, 0.6, 0), 6, 0.12));
    for (let k = 0; k < 3; k++) p.push(part(new THREE.ConeGeometry(1.5 - k * 0.38, 2.0, 8), ['#3e6b3a', '#47773f', '#528545'][k], M(0, 1.6 + k * 1.15, 0)));
    return merge(p);
  }
  const trunk = kind === 'plane' ? '#a89a7a' : '#6b4a2f';
  p.push(cyl(0.2, 2.6, trunk, M(0, 1.3, 0), 7, 0.15));
  p.push(tube([0, 2.2, 0], [0.7, 3.2, 0.2], 0.08, trunk, 5));
  p.push(tube([0, 2.4, 0], [-0.6, 3.4, -0.3], 0.08, trunk, 5));
  const greens = kind === 'plane' ? ['#6e9a45', '#7aa64d', '#5f8a3c'] : ['#557f37', '#62903f', '#4a7231', '#6c9a46'];
  const blobs = kind === 'plane' ? 6 : 5;
  for (let k = 0; k < blobs; k++) {
    const a = (k / blobs) * Math.PI * 2 + rnd();
    const r = k === 0 ? 0 : 0.9 + rnd() * 0.4;
    const y = 3.6 + (k === 0 ? 0.9 : rnd() * 0.9);
    p.push(part(new THREE.IcosahedronGeometry(1.15 + rnd() * 0.45, 1), greens[k % greens.length], M(Math.cos(a) * r, y, Math.sin(a) * r, rnd(), rnd(), 0, 1, 0.85, 1)));
  }
  return merge(p);
}

/** A mine headframe (chevalement), Montceau's landmark: lattice tower and its two wheels. */
export function headframeGeometry() {
  const steel = '#5d4a3e';
  const p = [];
  const H = 22;
  for (const [x, z] of [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]]) p.push(tube([x, 0, z], [x * 0.35, H, z * 0.35], 0.18, steel, 6));
  for (let k = 1; k < 6; k++) {
    const y = (k / 6) * H;
    const f = 1 - (k / 6) * 0.65;
    const d = 2.2 * f;
    p.push(box(d * 2, 0.16, 0.16, steel, M(0, y, d)));
    p.push(box(d * 2, 0.16, 0.16, steel, M(0, y, -d)));
    p.push(box(0.16, 0.16, d * 2, steel, M(d, y, 0)));
    p.push(box(0.16, 0.16, d * 2, steel, M(-d, y, 0)));
  }
  // The strut leaning against it
  p.push(tube([0, H - 1, 0], [0, 0, 11], 0.3, steel, 6));
  p.push(tube([0.8, H - 6, 0.5], [0.8, 0, 9], 0.2, steel, 6));
  // Platform and wheels
  p.push(box(3.2, 0.3, 3.2, steel, M(0, H, 0)));
  for (const x of [-0.7, 0.7]) {
    p.push(part(new THREE.TorusGeometry(1.6, 0.12, 6, 20), '#3f342e', M(x, H + 1.7, 0, 0, Math.PI / 2, 0)));
    for (let k = 0; k < 4; k++) p.push(box(0.08, 3.2, 0.08, '#3f342e', M(x, H + 1.7, 0, (k * Math.PI) / 4)));
  }
  return merge(p);
}

/** The mine wagon (berline) on the ZUP roundabout, on its rails. */
export function wagonGeometry() {
  const p = [box(3.4, 0.1, 0.12, '#5b4a3a', M(0, 0.35, -0.5)), box(3.4, 0.1, 0.12, '#5b4a3a', M(0, 0.35, 0.5))];
  for (let k = -3; k <= 3; k++) p.push(box(0.2, 0.08, 1.4, '#6e5a44', M(k * 0.5, 0.28, 0)));
  p.push(box(1.8, 0.9, 1.1, '#7a5236', M(0, 1.0, 0)));
  p.push(box(1.84, 0.1, 1.14, '#3a2f28', M(0, 1.46, 0)));
  for (const [x, z] of [[-0.6, -0.55], [0.6, -0.55], [-0.6, 0.55], [0.6, 0.55]]) p.push(cyl(0.22, 0.08, '#2f2f33', M(x, 0.55, z, Math.PI / 2), 12));
  p.push(part(new THREE.SphereGeometry(0.62, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#1d1d20', M(0, 1.42, 0, 0, 0, 0, 1.25, 0.55, 0.75)));
  return merge(p);
}
