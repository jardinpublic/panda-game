/*
 * Ready-made 3D models for 103 RCX: Kenney's CC0 kits (www.kenney.nl), in
 * web/public/models/kenney (see the LICENSE.txt there). Cars and the police
 * car (Car Kit), the ZUP tower blocks and café parasols (City Kit Commercial),
 * planters (City Kit Suburban).
 *
 *   const kit = await loadKit(baseUrl);   // never throws: a missing model is just left out
 *   kit.make('sedan', { length, width, height }) → a new Object3D, or null
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const KIT_FILES = {
  cars: ['sedan', 'sedan-sports', 'hatchback-sports', 'suv', 'taxi', 'van', 'delivery', 'truck', 'garbage-truck', 'tractor', 'police'],
  town: ['building-k', 'building-l', 'building-n', 'detail-parasol-a'],
  garden: ['planter'],
};

export async function loadKit(base) {
  const loader = new GLTFLoader();
  const models = new Map();
  const jobs = [];
  for (const [folder, names] of Object.entries(KIT_FILES)) {
    for (const name of names) {
      jobs.push(
        loader
          .loadAsync(`${base}models/kenney/${folder}/${name}.glb`)
          .then((gltf) => {
            // One mesh per material (all parts merged): a whole car is one draw call
            const src = gltf.scene;
            src.updateMatrixWorld(true);
            const byMat = new Map();
            src.traverse((o) => {
              if (!o.isMesh) return;
              const g = o.geometry.clone();
              g.applyMatrix4(o.matrixWorld);
              for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a);
              const geom = g.index ? g.toNonIndexed() : g;
              if (!byMat.has(o.material)) byMat.set(o.material, []);
              byMat.get(o.material).push(geom);
            });
            const scene = new THREE.Group();
            for (const [mat, list] of byMat) {
              const merged = list.length > 1 ? mergeGeometries(list) : list[0];
              for (const geom of merged ? [merged] : list) {
                const mesh = new THREE.Mesh(geom, mat);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                scene.add(mesh);
              }
            }
            src.traverse((o) => o.isMesh && o.geometry.dispose());
            const box = new THREE.Box3().setFromObject(scene);
            models.set(name, { scene, box, size: box.getSize(new THREE.Vector3()) });
          })
          .catch(() => {})
      );
    }
  }
  await Promise.all(jobs);
  return {
    has: (name) => models.has(name),
    /** A copy of a model sized to { length (Z), width (X), height (Y) } metres, standing on y = 0. Missing sizes keep the proportions of the given ones. */
    make(name, { length, width, height } = {}) {
      const m = models.get(name);
      if (!m) return null;
      const copy = m.scene.clone(true);
      const s = m.size;
      const kx = width ? width / s.x : null;
      const kz = length ? length / s.z : null;
      const ky = height ? height / s.y : null;
      const any = kx || kz || ky || 1;
      const holder = new THREE.Group();
      copy.scale.set(kx || any, ky || any, kz || any);
      const c = m.box.getCenter(new THREE.Vector3());
      copy.position.set(-c.x * copy.scale.x, -m.box.min.y * copy.scale.y, -c.z * copy.scale.z);
      holder.add(copy);
      return holder;
    },
    dispose() {
      for (const m of models.values()) {
        m.scene.traverse((o) => {
          if (o.isMesh) {
            o.geometry.dispose();
            for (const mat of [].concat(o.material)) {
              mat.map?.dispose();
              mat.dispose();
            }
          }
        });
      }
    },
  };
}
