// Kenney CC0 model packs (office, nature, platform), loaded once and copied
// on demand. get() returns null when a pack is missing, so worlds always keep
// a fallback shape.
//
//   await models.load(['office']);
//   const desk = models.get('desk', { height: 0.8 });

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const BASE = `${import.meta.env.BASE_URL}models/`;

export function createModels() {
  const loader = new GLTFLoader();
  const packs = new Map();
  const nodes = new Map();

  function load(names = []) {
    return Promise.all(names.map((name) => {
      if (!packs.has(name)) {
        packs.set(name, loader.loadAsync(`${BASE}${name}.glb`).then((gltf) => {
          // Group mesh parts by object name: "desk-part0" + "desk-part1" -> "desk".
          const groups = new Map();
          gltf.scene.traverse((o) => {
            if (!o.isMesh) return;
            const key = o.name.replace(/-part\d+$/, '');
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(o);
          });
          for (const [key, meshes] of groups) {
            const g = new THREE.Group();
            for (const m of meshes) {
              const copy = m.clone();
              m.updateWorldMatrix(true, false);
              copy.matrix.copy(m.matrixWorld);
              copy.matrix.decompose(copy.position, copy.quaternion, copy.scale);
              copy.castShadow = true;
              copy.receiveShadow = true;
              g.add(copy);
            }
            nodes.set(key, g);
          }
          return true;
        }).catch(() => false));
      }
      return packs.get(name);
    }));
  }

  /** A copy of a model scaled to the given height (or width), feet on y = 0. */
  function get(name, { height, width } = {}) {
    const source = nodes.get(name);
    if (!source) return null;
    const copy = source.clone(true);
    const box = new THREE.Box3().setFromObject(copy);
    const size = box.getSize(new THREE.Vector3());
    const scale = height ? height / Math.max(size.y, 0.001) : width ? width / Math.max(size.x, 0.001) : 1;
    copy.scale.multiplyScalar(scale);
    const center = box.getCenter(new THREE.Vector3());
    const holder = new THREE.Group();
    copy.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    holder.add(copy);
    return holder;
  }

  return { load, get, has: (name) => nodes.has(name) };
}
