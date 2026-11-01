// Particles and pop-ups for every world: confetti bursts, sparkles, dust,
// floating "+5 €" text. One pooled Points cloud plus DOM labels.

import * as THREE from 'three';

const MAX = 600;
const COLORS = [0xffd84a, 0xff6b8a, 0x6bd5ff, 0x8af27a, 0xffffff];

export function createFx(scene) {
  const positions = new Float32Array(MAX * 3);
  const colors = new Float32Array(MAX * 3);
  const velocities = new Float32Array(MAX * 3);
  const life = new Float32Array(MAX);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({ size: 0.22, vertexColors: true, transparent: true, depthWrite: false });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);
  let next = 0;
  const tmp = new THREE.Color();

  /** Explodes count particles at position (Vector3). */
  function burst(position, count = 20, { color = null, speed = 6, up = 4 } = {}) {
    for (let i = 0; i < count; i++) {
      const k = next;
      next = (next + 1) % MAX;
      positions[k * 3] = position.x;
      positions[k * 3 + 1] = position.y;
      positions[k * 3 + 2] = position.z;
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * speed;
      velocities[k * 3] = Math.cos(a) * r;
      velocities[k * 3 + 1] = up + Math.random() * up;
      velocities[k * 3 + 2] = Math.sin(a) * r;
      tmp.set(color ?? COLORS[i % COLORS.length]);
      colors[k * 3] = tmp.r; colors[k * 3 + 1] = tmp.g; colors[k * 3 + 2] = tmp.b;
      life[k] = 0.6 + Math.random() * 0.6;
    }
  }

  function update(dt) {
    for (let k = 0; k < MAX; k++) {
      if (life[k] <= 0) continue;
      life[k] -= dt;
      velocities[k * 3 + 1] -= 14 * dt;
      positions[k * 3] += velocities[k * 3] * dt;
      positions[k * 3 + 1] += velocities[k * 3 + 1] * dt;
      positions[k * 3 + 2] += velocities[k * 3 + 2] * dt;
      if (life[k] <= 0) positions[k * 3 + 1] = -999;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  }

  function dispose() {
    scene.remove(points);
    geometry.dispose();
    material.dispose();
  }

  return { burst, update, dispose, points };
}
