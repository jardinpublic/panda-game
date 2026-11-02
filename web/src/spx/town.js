/*
 * 103 SPX scenery: Montceau-les-Mines around the route. Sky, clouds and the far
 * skyline with its mine headframes; the road (painted centre line, gutters,
 * zebra crossings), kerbs and pavements; the house fronts, shops and their
 * awnings, the ZUP tower blocks, front walls and hedges, trees, lamps, signs;
 * the Parc du Petit Bois, the roundabout with its mine wagon, the Lac du
 * Plessis, the Café des Sports and Panda's yellow house with the gang.
 *
 *   const town = buildTown({ scene, route, sec, texts, tier, keep, castTexture, mats });
 *   town.update(camera, clock); town.gang (people to animate)
 */
import * as THREE from 'three';
import { SPOTS } from './rules.js';
import * as T from './textures.js';
import { M, part, box, cyl, merge, treeGeometry, lampGeometry, headframeGeometry, wagonGeometry, walkerBody, walkerLeg, walkerArm } from './models.js';

const HOUSE_SET = 7; // metres from the road centre to the front walls, at least

export function buildTown({ scene, route, sec, texts, tier, keep, castTexture, sunDir, kit = null }) {
  const lambert = (o) => keep(new THREE.MeshLambertMaterial(o));
  const tex = (c, o) => keep(T.texture(c, o));
  const VC = lambert({ vertexColors: true });
  const ring = route.ring;
  const updaters = [];

  /* ---------------- Sky, clouds, skyline ---------------- */
  const skyMat = keep(
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        top: { value: new THREE.Color('#3b86d6') },
        mid: { value: new THREE.Color('#8fc2ea') },
        horizon: { value: new THREE.Color('#f4dcbc') },
        sunDir: { value: sunDir.clone() },
        sunColor: { value: new THREE.Color('#fff1d0') },
      },
      vertexShader: `varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; uniform vec3 sunDir; uniform vec3 sunColor; varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float h = max(d.y, 0.0);
          vec3 c = mix(horizon, mid, smoothstep(0.0, 0.18, h));
          c = mix(c, top, smoothstep(0.18, 0.75, h));
          if (d.y < 0.0) c = horizon;
          float s = max(dot(d, normalize(sunDir)), 0.0);
          c += sunColor * (pow(s, 900.0) * 1.6 + pow(s, 24.0) * 0.28 + pow(s, 4.0) * 0.08);
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    })
  );
  const sky = new THREE.Mesh(keep(new THREE.SphereGeometry(520, 32, 16)), skyMat);
  sky.renderOrder = -20;
  sky.frustumCulled = false;
  scene.add(sky);

  const skyline = new THREE.Mesh(
    keep(new THREE.CylinderGeometry(430, 430, 80, 64, 1, true)),
    keep(new THREE.MeshBasicMaterial({ map: (() => { const t = tex(T.skylineCanvas(), { repeat: true }); t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(3, 1); return t; })(), transparent: true, side: THREE.BackSide, fog: false, depthWrite: false }))
  );
  skyline.renderOrder = -19;
  skyline.frustumCulled = false;
  scene.add(skyline);

  const cloudTexs = [0, 1, 2].map((k) => tex(T.cloudCanvas(21 + k * 7)));
  const clouds = [];
  for (let i = 0; i < 12; i++) {
    const m = keep(new THREE.SpriteMaterial({ map: cloudTexs[i % 3], transparent: true, depthWrite: false, fog: false, opacity: 0.92 }));
    const s = new THREE.Sprite(m);
    const a = (i / 12) * Math.PI * 2 + i * 0.37;
    const r = 400 + (i % 3) * 30;
    const w = 80 + (i % 4) * 26;
    s.scale.set(w, w * 0.42, 1);
    s.userData = { a, r, y: 120 + (i % 5) * 18 };
    s.renderOrder = -18;
    scene.add(s);
    clouds.push(s);
  }
  updaters.push((cam, t) => {
    sky.position.copy(cam.position);
    skyline.position.set(cam.position.x, 30, cam.position.z);
    for (const c of clouds) {
      const a = c.userData.a + t * 0.004;
      c.position.set(cam.position.x + Math.cos(a) * c.userData.r, c.userData.y, cam.position.z + Math.sin(a) * c.userData.r);
    }
  });

  /* ---------------- Ground ---------------- */
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < route.xs.length; i++) {
    minX = Math.min(minX, route.xs[i]);
    maxX = Math.max(maxX, route.xs[i]);
    minZ = Math.min(minZ, route.zs[i]);
    maxZ = Math.max(maxZ, route.zs[i]);
  }
  const grassTex = tex(T.grassCanvas(), { repeat: true });
  const gw = maxX - minX + 900;
  const gd = maxZ - minZ + 900;
  grassTex.repeat.set(gw / 8, gd / 8);
  const ground = new THREE.Mesh(keep(new THREE.PlaneGeometry(gw, gd)), lambert({ map: grassTex }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set((minX + maxX) / 2, -0.02, (minZ + maxZ) / 2);
  ground.receiveShadow = true;
  scene.add(ground);

  /* ---------------- Road, kerbs, pavements ---------------- */
  /** A strip along the route from lateral a to b, facing up (or a wall from y0 to y1 at lateral a). */
  function ribbon(a, b, ya, yb, uFrom, uTo, vLen, s0 = 0, s1 = route.length, step = 1.5) {
    const pos = [];
    const uv = [];
    const idx = [];
    let n = 0;
    for (let s = s0; ; s += step) {
      const ss = Math.min(s, s1);
      const pa = route.at(ss, a);
      const pb = route.at(ss, b);
      pos.push(pa.x, ya, pa.z, pb.x, yb, pb.z);
      uv.push(uFrom, ss / vLen, uTo, ss / vLen);
      if (n > 0) {
        const i = n * 2;
        idx.push(i - 2, i - 1, i, i - 1, i + 1, i);
      }
      n++;
      if (ss >= s1) break;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return keep(g);
  }
  const maxAniso = 8;
  const roadTex = tex(T.roadCanvas({ dashes: true }), { repeat: true, aniso: maxAniso });
  const roadPlain = tex(T.roadCanvas({ dashes: false, seed: 4 }), { repeat: true, aniso: maxAniso });
  const roadMat = lambert({ map: roadTex });
  const roadPlainMat = lambert({ map: roadPlain });
  const addMesh = (g, m, { cast = false, receive = true } = {}) => {
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    scene.add(mesh);
    return mesh;
  };
  // Marked road everywhere but on the roundabout (and its last metres up to Panda's house)
  const r0 = ring ? ring.s0 : route.length;
  const r1 = ring ? ring.s1 : route.length;
  addMesh(ribbon(-3.5, 3.5, 0, 0, 0, 1, 14, 0, r0), roadMat);
  if (ring) addMesh(ribbon(-3.5, 3.5, 0, 0, 0, 1, 14, r1, route.length), roadMat);
  const paveTex = tex(T.pavementCanvas(), { repeat: true });
  const paveMat = lambert({ map: paveTex });
  const kerbTex = tex(T.kerbCanvas(), { repeat: true });
  const kerbMat = lambert({ map: kerbTex });
  for (const [s0, s1] of ring ? [[0, r0 + 1], [r1 - 1, route.length]] : [[0, route.length]]) {
    for (const side of [-1, 1]) {
      const a = side * 3.5;
      const b = side * 5.6;
      addMesh(ribbon(Math.min(a, b) === a ? a : b, Math.min(a, b) === a ? b : a, 0.14, 0.14, 0, 1, 2, s0, s1), paveMat);
      // Kerb: top and the face toward the road
      const k0 = side * 3.5;
      const k1 = side * 3.68;
      addMesh(ribbon(Math.min(k0, k1), Math.max(k0, k1), 0.15, 0.15, 0, 0.2, 1, s0, s1), kerbMat);
      addMesh(side > 0 ? ribbon(3.5, 3.5, 0, 0.15, 0, 0.3, 1, s0, s1) : ribbon(-3.5, -3.5, 0.15, 0, 0, 0.3, 1, s0, s1), kerbMat);
    }
  }

  // Rue de Charolles goes on past Panda's house
  {
    const e = route.at(route.length);
    const ext = 70;
    const strip = (width, lateral, y, map, vRepeat) => {
      const t = map.clone();
      keep(t);
      t.repeat.set(1, vRepeat);
      t.needsUpdate = true;
      const m = addMesh(keep(new THREE.PlaneGeometry(width, ext)), lambert({ map: t }));
      m.rotation.order = 'YXZ';
      m.rotation.set(-Math.PI / 2, e.heading, 0);
      m.position.set(e.x + e.dx * (ext / 2 - 0.3) + e.rx * lateral, y, e.z + e.dz * (ext / 2 - 0.3) + e.rz * lateral);
    };
    strip(7, 0, 0, roadTex, ext / 14);
    strip(2.1, 4.55, 0.14, paveTex, ext / 2);
    strip(2.1, -4.55, 0.14, paveTex, ext / 2);
  }

  // Zebra crossings at the junctions
  const zebraTex = tex(T.zebraCanvas());
  const zebraMat = lambert({ map: zebraTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const zebraGeom = keep(new THREE.PlaneGeometry(6.6, 3));
  for (const street of route.sections) {
    if (street.ring || street.index === 0 || (ring && Math.abs(street.s0 - ring.s1) < 2)) continue;
    const p = route.at(street.s0 + 9);
    const z = new THREE.Mesh(zebraGeom, zebraMat);
    z.rotation.set(-Math.PI / 2, 0, p.heading + Math.PI / 2);
    z.position.set(p.x, 0.012, p.z);
    z.receiveShadow = true;
    scene.add(z);
  }

  /* ---------------- The roundabout and the Lac du Plessis ---------------- */
  let lake = null;
  if (ring) {
    const r = ring.r;
    const rt = roadPlain.clone();
    keep(rt);
    rt.repeat.set(4, 4);
    rt.needsUpdate = true;
    const ringRoad = addMesh(keep(new THREE.RingGeometry(r - 3.5, r + 3.5, 72, 1)), lambert({ map: rt }));
    ringRoad.rotation.x = -Math.PI / 2;
    ringRoad.position.set(ring.cx, 0.001, ring.cz);
    const pt = paveTex.clone();
    keep(pt);
    pt.repeat.set(14, 14);
    pt.needsUpdate = true;
    const outer = addMesh(keep(new THREE.RingGeometry(r + 3.5, r + 5.6, 72, 1)), lambert({ map: pt }));
    outer.rotation.x = -Math.PI / 2;
    outer.position.set(ring.cx, 0.13, ring.cz);
    // The island: kerb, lawn, flower beds and the mine wagon
    const flowers = [];
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * Math.PI * 2;
      flowers.push(part(new THREE.IcosahedronGeometry(0.17, 0), ['#e94f6b', '#ffd23f', '#ffffff', '#ff8a3d'][i % 4], M(Math.cos(a) * (r - 5.3 + (i % 3) * 0.35), 0.42, Math.sin(a) * (r - 5.3 + (i % 3) * 0.35))));
    }
    const island = merge([
      cyl(r - 3.5, 0.3, '#c9c6bf', M(0, 0.15, 0), 64),
      cyl(r - 3.9, 0.34, '#6f9a45', M(0, 0.17, 0), 64),
      cyl(r - 4.6, 0.38, '#5d3b28', M(0, 0.19, 0), 64, r - 6),
      cyl(r - 6.2, 0.4, '#77a34b', M(0, 0.2, 0), 64),
      ...flowers,
    ]);
    const islandMesh = addMesh(keep(island), VC, { cast: false });
    islandMesh.position.set(ring.cx, 0, ring.cz);
    const wagon = addMesh(keep(wagonGeometry()), VC, { cast: true });
    wagon.position.set(ring.cx, 0.4, ring.cz);
    wagon.rotation.y = 0.7;
    // The lake east-south-east of the roundabout, as on the map
    const dir = new THREE.Vector2(0.94, 0.34).normalize();
    let dist = r + 52;
    const clear = (x, z, need) => {
      for (let s = 0; s < route.length; s += 3) {
        const p = route.at(s);
        if (Math.hypot(p.x - x, p.z - z) < need) return false;
      }
      return true;
    };
    while (!clear(ring.cx + dir.x * dist, ring.cz + dir.y * dist, 44) && dist < 170) dist += 6;
    const water = new THREE.Mesh(keep(new THREE.CircleGeometry(36, 48)), keep(new THREE.MeshStandardMaterial({ color: '#3d7da6', roughness: 0.12, metalness: 0.1 })));
    water.rotation.x = -Math.PI / 2;
    water.scale.set(1, 0.6, 1);
    water.position.set(ring.cx + dir.x * dist, 0.03, ring.cz + dir.y * dist);
    water.receiveShadow = true;
    scene.add(water);
    const bank = new THREE.Mesh(keep(new THREE.CircleGeometry(39, 48)), lambert({ color: '#b9a57e' }));
    bank.rotation.x = -Math.PI / 2;
    bank.scale.set(1, 0.62, 1);
    bank.position.set(water.position.x, 0.0, water.position.z);
    scene.add(bank);
    lake = { x: water.position.x, z: water.position.z };
    updaters.push((cam, t) => {
      water.material.color.setHSL(0.56, 0.45, 0.42 + Math.sin(t * 0.7) * 0.015);
    });
  }

  /* ---------------- Placing things beside the road ---------------- */
  const cell = 12;
  const grid = new Map();
  for (let s = 0; s <= route.length; s += 2) {
    const p = route.at(s);
    const k = Math.floor(p.x / cell) + ',' + Math.floor(p.z / cell);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(p);
  }
  /** Is (x, z) closer than `need` to the road centre line anywhere? */
  const nearRoad = (x, z, need) => {
    const gx = Math.floor(x / cell);
    const gz = Math.floor(z / cell);
    const span = Math.ceil(need / cell);
    for (let i = -span; i <= span; i++) {
      for (let j = -span; j <= span; j++) {
        const list = grid.get(gx + i + ',' + (gz + j));
        if (!list) continue;
        for (const p of list) if ((p.x - x) ** 2 + (p.z - z) ** 2 < need * need) return true;
      }
    }
    return false;
  };
  const nearRing = (x, z, extra) => ring && Math.hypot(x - ring.cx, z - ring.cz) < ring.r + extra;
  const inLake = (x, z, extra = 0) => lake && Math.hypot(x - lake.x, (z - lake.z) / 0.62) < 40 + extra;
  const rnd = T.seeded(7);
  const facing = (p, side) => Math.atan2(-side * p.rx, -side * p.rz);

  const dummy = new THREE.Object3D();
  /** Instanced copies of geom; with `chunk`, split along the route so the far ones are culled. */
  function instances(geom, mat, list, place, { colorOf, cast = true, chunk = 0 } = {}) {
    if (!list.length) return;
    keep(geom);
    const groups = new Map();
    for (const it of list) {
      const k = chunk ? Math.floor((it.s || 0) / chunk) : 0;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(it);
    }
    for (const items of groups.values()) {
      const mesh = new THREE.InstancedMesh(geom, mat, items.length);
      items.forEach((it, i) => {
        dummy.position.set(0, 0, 0);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        place(dummy, it);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        if (colorOf) mesh.setColorAt(i, new THREE.Color(colorOf(it)));
      });
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      mesh.computeBoundingSphere();
      scene.add(mesh);
    }
  }

  /* ---------------- Houses and shops ---------------- */
  const shopsAt = [
    { s: sec.laville.s0 + 40, kind: 'coiffure' },
    { s: sec.beaubernard.s0 + 150, kind: 'boulangerie' },
    { s: sec.barbes.s0 + 18, kind: 'tabac' },
    { s: sec.barbes.s0 + 120, kind: 'pharmacie' },
    { s: sec.desmoulins.s0 + SPOTS.leg + 6, kind: 'cafe' },
    { s: sec.desmoulins.s0 + 130, kind: 'boulangerie' },
    { s: sec.pageot.s0 + 120, kind: 'tabac' },
  ];
  const houses = [];
  const walls = [];
  const hedges = [];
  const trees = [];
  const planes = [];
  const shops = [];
  const parkEnd = route.sections[0].s1 + 8;
  const homeS = route.length - 14;
  for (const side of [-1, 1]) {
    let s = 3;
    while (s < route.length) {
      const w = 7.5 + rnd() * 2.5;
      const d = 7 + rnd() * 2;
      const garden = 1.4 + rnd() * 2.6;
      const off = 5.6 + garden + d / 2;
      const mid = s + w / 2;
      const p = route.at(mid, side * off);
      const shop = side > 0 && shopsAt.find((q) => !q.used && Math.abs(q.s - mid) < w * 0.7);
      const free = !nearRing(p.x, p.z, 26) && !inLake(p.x, p.z, 8) && mid < homeS - 6 && !nearRoad(p.x, p.z, Math.max(off - 0.5, HOUSE_SET)) && !nearRoad(p.x, p.z, Math.max(w, d) / 2 + 3);
      if (mid > parkEnd && free && (shop || rnd() > 0.08)) {
        let variant = Math.floor(rnd() * T.FACADES.length);
        if (shop) {
          shop.used = true;
          variant = 'shop:' + shop.kind;
        }
        // Shops sit on the pavement line: no front garden
        const shopOff = 5.6 + 0.2 + d / 2;
        const pp = shop ? route.at(mid, side * shopOff) : p;
        const h = 5.6 + rnd() * 0.9;
        houses.push({ s: mid, x: pp.x, z: pp.z, w, d, h, rot: facing(pp, side), variant, roof: ['#c4643f', '#a9553a', '#8c4a3a', '#6d6f76', '#b8714f'][Math.floor(rnd() * 5)] });
        if (shop) shops.push({ ...shop, p: route.at(mid, side * 5.9), rot: facing(pp, side), w });
        else {
          const wp = route.at(mid, side * 5.85);
          if (!nearRoad(wp.x, wp.z, 5.5)) (rnd() < 0.55 ? walls : hedges).push({ s: mid, x: wp.x, z: wp.z, len: w - 0.6, rot: wp.heading, c: rnd() });
          if (rnd() < 0.35) {
            const tp = route.at(mid + (rnd() - 0.5) * w * 0.6, side * (6.6 + garden * 0.5));
            if (!nearRoad(tp.x, tp.z, 6.4)) trees.push({ s: mid, x: tp.x, z: tp.z, size: 0.55 + rnd() * 0.3, kind: rnd() < 0.3 ? 'cone' : 'round' });
          }
        }
      } else if (!nearRing(p.x, p.z, 8) && !inLake(p.x, p.z, 3) && mid < homeS - 8) {
        // A gap: trees (many in the park)
        const inPark = mid < parkEnd;
        for (let k = 0; k < (inPark ? 5 : 2); k++) {
          const tp = route.at(s + rnd() * w, side * (7 + rnd() * (inPark ? 22 : 7)));
          if (!nearRoad(tp.x, tp.z, 6.6) && !inLake(tp.x, tp.z, 2)) trees.push({ s: mid, x: tp.x, z: tp.z, size: 0.8 + rnd() * 0.5, kind: rnd() < 0.25 ? 'cone' : 'round' });
        }
      }
      s += w + 0.3 + rnd() * 2;
    }
  }
  // The Parc du Petit Bois all round the start (behind Panda too: the camera looks back at him)
  {
    const p0 = route.at(0);
    for (let i = 0; i < 140; i++) {
      const a = rnd() * Math.PI * 2;
      const rr = 8 + Math.sqrt(rnd()) * 70;
      const x = p0.x + Math.cos(a) * rr;
      const z = p0.z + Math.sin(a) * rr;
      const ahead = (x - p0.x) * p0.dx + (z - p0.z) * p0.dz;
      if (ahead > parkEnd || nearRoad(x, z, 7.5)) continue;
      trees.push({ s: 0, x, z, size: 0.8 + rnd() * 0.6, kind: rnd() < 0.3 ? 'cone' : 'round' });
    }
  }
  // Plane trees along the avenue, in the pavement
  for (let s = sec.laville.s0 + 10; s < sec.laville.s1 - 6; s += 13) {
    for (const side of [-1, 1]) {
      const p = route.at(s + side * 3, side * 5.15);
      planes.push({ s, x: p.x, z: p.z, size: 0.95 });
    }
  }
  // Trees round the lake and the roundabout
  if (ring) {
    for (let i = 0; i < 46; i++) {
      const a = rnd() * Math.PI * 2;
      const rr = ring.r + 12 + rnd() * 60;
      const x = ring.cx + Math.cos(a) * rr;
      const z = ring.cz + Math.sin(a) * rr;
      if (!nearRoad(x, z, 7) && !inLake(x, z, 2)) trees.push({ s: ring.s0, x, z, size: 0.9 + rnd() * 0.6, kind: rnd() < 0.3 ? 'cone' : 'round' });
    }
  }

  // House boxes: front (+Z) painted, sides and back plain, one instanced mesh per front
  const boxGeom = new THREE.BoxGeometry(1, 1, 1);
  boxGeom.translate(0, 0.5, 0);
  keep(boxGeom);
  const plainTop = lambert({ color: '#8a7f73' });
  const variants = new Map();
  for (const h of houses) {
    if (!variants.has(h.variant)) variants.set(h.variant, []);
    variants.get(h.variant).push(h);
  }
  let seed = 100;
  for (const [variant, list] of variants) {
    const f = typeof variant === 'string' ? T.SHOPS[variant.slice(5)] : T.FACADES[variant];
    const front = lambert({ map: tex(T.facadeCanvas(f, seed++)) });
    const sideMat = lambert({ map: tex(T.sideWallCanvas(f, seed++)) });
    instances(boxGeom, [sideMat, sideMat, plainTop, plainTop, front, sideMat], list, (o, h) => {
      o.position.set(h.x, 0, h.z);
      o.rotation.y = h.rot;
      o.scale.set(h.w, h.h, h.d);
    });
  }
  // Hip roofs, tinted tiles
  const roofGeom = new THREE.BufferGeometry();
  {
    const i = 0.28;
    const v = [];
    const uv = [];
    const quad = (a, b, c, d, ua, ub, uc, ud) => {
      v.push(...a, ...b, ...c, ...a, ...c, ...d);
      uv.push(...ua, ...ub, ...uc, ...ua, ...uc, ...ud);
    };
    const tri = (a, b, c, ua, ub, uc) => {
      v.push(...a, ...b, ...c);
      uv.push(...ua, ...ub, ...uc);
    };
    quad([-0.5, 0, 0.5], [0.5, 0, 0.5], [0.5 - i, 1, 0], [-0.5 + i, 1, 0], [0, 0], [3, 0], [3 - i * 3, 2.2], [i * 3, 2.2]);
    quad([0.5, 0, -0.5], [-0.5, 0, -0.5], [-0.5 + i, 1, 0], [0.5 - i, 1, 0], [0, 0], [3, 0], [3 - i * 3, 2.2], [i * 3, 2.2]);
    tri([-0.5, 0, -0.5], [-0.5, 0, 0.5], [-0.5 + i, 1, 0], [0, 0], [3, 0], [1.5, 2.2]);
    tri([0.5, 0, 0.5], [0.5, 0, -0.5], [0.5 - i, 1, 0], [0, 0], [3, 0], [1.5, 2.2]);
    roofGeom.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    roofGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    roofGeom.computeVertexNormals();
  }
  const tiles = tex(T.tilesCanvas(), { repeat: true });
  const roofMat = lambert({ map: tiles, side: THREE.DoubleSide });
  instances(roofGeom, roofMat, houses, (o, h) => {
    o.position.set(h.x, h.h - 0.05, h.z);
    o.rotation.y = h.rot;
    o.scale.set(h.w + 0.7, 2.6, h.d + 0.7);
  }, { colorOf: (h) => h.roof });
  // Eaves boards under the roofs (a lighter band)
  instances(new THREE.BoxGeometry(1, 0.18, 1), lambert({ color: '#efe8d8' }), houses, (o, h) => {
    o.position.set(h.x, h.h, h.z);
    o.rotation.y = h.rot;
    o.scale.set(h.w + 0.5, 1, h.d + 0.5);
  }, { cast: false });
  const chimney = merge([box(0.62, 1.7, 0.62, '#9c4f37', M(0, 0.85, 0)), box(0.8, 0.14, 0.8, '#7a3d2b', M(0, 1.72, 0)), cyl(0.1, 0.4, '#8c8f94', M(0.12, 1.95, 0), 6)]);
  instances(chimney, VC, houses.filter((h, k) => k % 3 !== 1), (o, h) => {
    o.position.set(h.x, h.h + 1.0, h.z);
    o.rotation.y = h.rot;
    o.translateX(h.w * 0.26);
    o.translateZ(-h.d * 0.12);
  });
  // Shop awnings (striped, tilted) and the red TABAC "carotte"
  for (const sh of shops) {
    const f = T.SHOPS[sh.kind];
    const c = T.canvas(128, 64);
    const g = c.getContext('2d');
    for (let k = 0; k < 8; k++) {
      g.fillStyle = f.awning[k % 2];
      g.fillRect(k * 16, 0, 16, 64);
    }
    g.fillStyle = f.awning[0];
    for (let k = 0; k < 8; k++) {
      g.beginPath();
      g.arc(k * 16 + 8, 56, 8, 0, Math.PI);
      g.fill();
    }
    const awn = new THREE.Mesh(keep(new THREE.PlaneGeometry(sh.w * 0.66, 1.5)), lambert({ map: tex(c), side: THREE.DoubleSide }));
    const grp = new THREE.Group();
    awn.position.set(-sh.w * 0.12, 2.75, 0.62);
    awn.rotation.x = -1.05;
    awn.castShadow = true;
    grp.add(awn);
    if (sh.kind === 'tabac') {
      const carrot = new THREE.Mesh(keep(merge([part(new THREE.OctahedronGeometry(0.5, 0), '#c8241c', M(0, 0, 0, 0, 0, 0, 0.35, 1, 0.9)), box(0.04, 0.04, 0.9, '#2f2f33', M(0, 0.55, -0.45))])), VC);
      carrot.position.set(sh.w * 0.38, 3.6, 0.9);
      carrot.castShadow = true;
      grp.add(carrot);
    }
    for (const side of [-1, 1]) {
      const pl = kit && kit.make('planter', { width: 1.1 });
      if (!pl) break;
      pl.position.set(side * sh.w * 0.42, 0.14, 1.1);
      grp.add(pl);
    }
    grp.position.set(sh.p.x, 0, sh.p.z);
    grp.rotation.y = sh.rot;
    scene.add(grp);
  }

  // Front walls (stone, with a coping) and hedges
  const wallGeom = merge([box(1, 0.7, 0.28, '#d6cbb5', M(0, 0.35, 0)), box(1, 0.08, 0.36, '#bfb39b', M(0, 0.74, 0))]);
  instances(wallGeom, VC, walls, (o, w) => {
    o.position.set(w.x, 0.12, w.z);
    o.rotation.y = w.rot + Math.PI / 2;
    o.scale.set(w.len, 1, 1);
  }, { chunk: 200 });
  const pillars = [];
  for (const w of walls) for (const k of [-0.5, 0.5]) pillars.push({ ...w, k });
  instances(merge([box(0.4, 1.0, 0.4, '#cfc3ab', M(0, 0.5, 0)), box(0.5, 0.1, 0.5, '#b5a88e', M(0, 1.05, 0))]), VC, pillars, (o, w) => {
    o.position.set(w.x, 0.12, w.z);
    o.rotation.y = w.rot + Math.PI / 2;
    o.translateX(w.k * w.len);
  }, { chunk: 200 });
  const hedgeTex = tex(T.grassCanvas(41), { repeat: true });
  hedgeTex.repeat.set(1, 0.3);
  instances(new THREE.BoxGeometry(1, 1.15, 0.7).translate(0, 0.57, 0), lambert({ map: hedgeTex }), hedges, (o, h) => {
    o.position.set(h.x, 0.12, h.z);
    o.rotation.y = h.rot + Math.PI / 2;
    o.scale.set(h.len, 0.8 + h.c * 0.4, 1);
  }, { colorOf: (h) => (h.c < 0.5 ? '#5f8a3e' : '#4e7a36'), chunk: 200 });

  // Trees
  const kinds = { round: [treeGeometry('round', 3), treeGeometry('round', 9)], cone: [treeGeometry('cone')] };
  const treeMat = lambert({ vertexColors: true, flatShading: true });
  for (const [kind, geoms] of Object.entries(kinds)) {
    geoms.forEach((g, gi) => {
      const list = trees.filter((t, i) => t.kind === kind && i % geoms.length === gi);
      instances(g, treeMat, list, (o, t) => {
        o.position.set(t.x, 0, t.z);
        o.rotation.y = t.x * 1.7;
        o.scale.setScalar(t.size);
      }, { chunk: 160, colorOf: (t) => new THREE.Color().setHSL(0.24 + ((t.x * 13.1) % 1) * 0.04, 0.35, 0.82 + ((t.z * 7.3) % 1) * 0.2) });
    });
  }
  instances(treeGeometry('plane', 5), treeMat, planes, (o, t) => {
    o.position.set(t.x, 0.14, t.z);
    o.rotation.y = t.z;
    o.scale.setScalar(t.size);
  }, { chunk: 160 });

  // Lamps (alternating sides), green bins
  const lamps = [];
  for (let s = 12, k = 0; s < route.length - 10; s += 27, k++) {
    if (ring && s > ring.s0 - 4 && s < ring.s1 + 4) continue;
    const side = k % 2 ? 1 : -1;
    const p = route.at(s, side * 5.3);
    lamps.push({ s, x: p.x, z: p.z, rot: facing(p, side) });
  }
  instances(lampGeometry(), VC, lamps, (o, l) => {
    o.position.set(l.x, 0.12, l.z);
    o.rotation.y = l.rot;
  }, { chunk: 200 });
  const bins = [];
  for (let s = 40, k = 0; s < route.length - 30; s += 55 + (k * 17) % 30, k++) {
    if (ring && s > ring.s0 - 8 && s < ring.s1 + 8) continue;
    const side = k % 2 ? -1 : 1;
    const p = route.at(s, side * 5.25);
    bins.push({ s, x: p.x, z: p.z, rot: p.heading });
  }
  instances(merge([box(0.58, 0.95, 0.7, '#2f7d4a', M(0, 0.47, 0)), box(0.62, 0.08, 0.76, '#276b3f', M(0, 0.98, 0)), cyl(0.09, 0.62, '#222', M(0, 0.09, -0.3, 0, 0, Math.PI / 2), 8)]), VC, bins, (o, b) => {
    o.position.set(b.x, 0.12, b.z);
    o.rotation.y = b.rot;
  }, { chunk: 200 });

  /* ---------------- ZUP tower blocks ---------------- */
  if (ring) {
    const towerTexs = ['#e07a2f', '#3a86c8'].map((c, k) => T.towerCanvas(c, 17 + k));
    const spots = [
      [-0.6, 62, 44, 15],
      [1.6, 70, 38, 15],
      [3.0, 66, 50, 18],
      [4.4, 78, 40, 15],
      [5.4, 92, 46, 18],
    ];
    spots.forEach(([a, r, len, hgt], k) => {
      const x = ring.cx + Math.cos(a) * r;
      const z = ring.cz + Math.sin(a) * r;
      if (nearRoad(x, z, len / 2 + 9) || inLake(x, z, len / 2)) return;
      // Kenney's apartment blocks when they loaded, else painted boxes
      const ready = kit && kit.make(['building-k', 'building-n', 'building-l'][k % 3], k % 3 === 2 ? { height: hgt * 1.6 } : k % 3 === 1 ? { width: len * 0.62 } : { width: len });
      if (ready) {
        ready.position.set(x, 0, z);
        ready.rotation.y = -a + Math.PI / 2;
        scene.add(ready);
        return;
      }
      const g = new THREE.BoxGeometry(len, hgt, 11);
      g.translate(0, hgt / 2, 0);
      // Repeat the front every 4 m, one storey band per 3 m
      const uvs = g.attributes.uv;
      for (let i = 0; i < uvs.count; i++) {
        const face = Math.floor(i / 4);
        const along = face === 4 || face === 5 ? len / 4 : face === 0 || face === 1 ? 11 / 4 : 1;
        uvs.setXY(i, uvs.getX(i) * along, uvs.getY(i) * (hgt / 15));
      }
      const t = tex(towerTexs[k % 2], { repeat: true });
      const m = lambert({ map: t });
      const mesh = addMesh(keep(g), [m, m, lambert({ color: '#9a958c' }), m, m, m], { cast: true });
      mesh.position.set(x, 0, z);
      mesh.rotation.y = -a + Math.PI / 2;
    });
  }

  /* ---------------- Landmarks ---------------- */
  // A mine headframe off Rue de la Loge, Montceau's emblem
  {
    const p = route.at(sec.loge.s0 + 70, -58);
    const hf = addMesh(keep(headframeGeometry()), VC, { cast: true });
    hf.position.set(p.x, 0, p.z);
    hf.rotation.y = p.heading + 0.6;
    const p2 = route.at(sec.vernois.s0 + 160, 75);
    const hf2 = addMesh(hf.geometry, VC, { cast: true });
    hf2.position.set(p2.x, 0, p2.z);
    hf2.rotation.y = p2.heading - 0.8;
  }

  // Street plaques at the start of each street, the park and lake signs, the café
  // Big enamel plaques on posts, turned a little toward the road so the rider can read them coming
  const signPost = (text, color, s, lateral) => {
    const grp = new THREE.Group();
    const board = new THREE.Mesh(keep(new THREE.PlaneGeometry(3.6, 1.0)), lambert({ map: tex(T.plaqueCanvas(text, color)), side: THREE.DoubleSide }));
    board.position.y = 3.0;
    board.castShadow = true;
    grp.add(board);
    const post = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.06, 0.06, 3.0, 6)), lambert({ color: '#4a4f55' }));
    post.position.y = 1.5;
    grp.add(post);
    const p = route.at(s, lateral);
    grp.position.set(p.x, 0.12, p.z);
    grp.rotation.y = p.heading + Math.PI - Math.sign(lateral) * 0.45;
    scene.add(grp);
  };
  for (const street of route.sections) {
    if (street.ring || street.index === 0) continue;
    const name = street.name.toUpperCase();
    signPost(name, '#1f4fa0', street.s0 + 14, 5.0);
    // Long streets: again further on, on the other side
    const len = street.s1 - street.s0;
    for (let k = 1; k * 110 < len - 40; k++) signPost(name, '#1f4fa0', street.s0 + 14 + k * 110, k % 2 ? -5.0 : 5.0);
  }
  signPost('PARC DU PETIT BOIS', '#2f6b3a', 8, -5.0);
  if (ring) signPost('LAC DU PLESSIS', '#2f6b3a', ring.s0 - 3, 4.9);

  // Road signs: no entry at the roundabout (Panda goes in anyway), give way
  const roadSign = (kind, s, lateral, size = 0.75) => {
    const grp = new THREE.Group();
    const face = new THREE.Mesh(keep(new THREE.PlaneGeometry(size, size)), lambert({ map: tex(T.signCanvas(kind)), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
    face.position.y = 2.2;
    grp.add(face);
    const post = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6)), lambert({ color: '#8c9096' }));
    post.position.y = 1.1;
    grp.add(post);
    const p = route.at(s, lateral);
    grp.position.set(p.x, 0.12, p.z);
    grp.rotation.y = p.heading + Math.PI;
    scene.add(grp);
  };
  if (ring) {
    roadSign('interdit', ring.s0 - 8, 4.6, 0.85);
    roadSign('interdit', ring.s0 - 8, -4.6, 0.85);
    roadSign('cedez', ring.s0 - 14, 4.6);
  }
  roadSign('bus', sec.laville.s0 + 80, 5.2, 0.6);

  // The Café des Sports terrace (a table is missing a leg)
  {
    const legS = sec.desmoulins.s0 + SPOTS.leg;
    const parts = [];
    const table = (x, z, tilt = 0) => {
      parts.push(cyl(0.45, 0.05, '#f2f2f2', M(x, 0.78, z, tilt, 0, tilt * 0.6), 16));
      if (!tilt) parts.push(cyl(0.04, 0.76, '#6b6f75', M(x, 0.38, z), 8));
      for (const a of [0, 2.1, 4.2]) parts.push(box(0.4, 0.06, 0.4, '#d23c3c', M(x + Math.cos(a) * 0.68, 0.45, z + Math.sin(a) * 0.68)), box(0.4, 0.4, 0.05, '#d23c3c', M(x + Math.cos(a) * 0.86, 0.66, z + Math.sin(a) * 0.86, 0, -a + Math.PI / 2)));
    };
    table(0, 0);
    table(1.8, 1.0, 0.35);
    table(-1.7, 0.8);
    const parasol = kit && kit.make('detail-parasol-a', { height: 2.6 });
    if (!parasol) {
      parts.push(cyl(0.04, 2.5, '#cfcfcf', M(0, 1.25, 0), 8));
      parts.push(part(new THREE.ConeGeometry(1.7, 0.6, 10), '#1f3f8f', M(0, 2.55, 0)));
    }
    const terrace = addMesh(keep(merge(parts)), VC, { cast: true });
    const p = route.at(legS + 4, 4.6);
    terrace.position.set(p.x, 0.14, p.z);
    terrace.rotation.y = p.heading;
    if (parasol) {
      parasol.position.set(p.x, 0.14, p.z);
      scene.add(parasol);
      const second = kit.make('detail-parasol-a', { height: 2.6 });
      const q = route.at(legS + 1, 4.9);
      second.position.set(q.x, 0.14, q.z);
      scene.add(second);
    }
  }

  // A bus shelter on the avenue
  {
    const p = route.at(sec.laville.s0 + 84, 5.1);
    const shelter = merge([
      box(3.2, 0.08, 1.4, '#3d4248', M(0, 2.4, 0)),
      box(3.2, 2.2, 0.04, '#9fc0d6', M(0, 1.2, -0.62)),
      box(0.08, 2.4, 1.4, '#3d4248', M(-1.6, 1.2, 0)),
      box(0.08, 2.4, 1.4, '#3d4248', M(1.6, 1.2, 0)),
      box(2.4, 0.08, 0.4, '#8a5a2b', M(0, 0.48, -0.4)),
    ]);
    const m = addMesh(keep(shelter), VC, { cast: true });
    m.position.set(p.x, 0.14, p.z);
    m.rotation.y = facing(p, 1);
  }

  /* ---------------- Panda's house, the gang, the finish ---------------- */
  const gang = [];
  {
    const end = route.length;
    const p = route.at(end - 2, 11.8);
    const home = new THREE.Group();
    const f = { wall: '#f2c94c', trim: 'stone', shutter: '#2f6fd1', door: '#2f6fd1' };
    const front = lambert({ map: tex(T.facadeCanvas(f, 777)) });
    const sideM = lambert({ map: tex(T.sideWallCanvas(f, 778)) });
    const body = new THREE.Mesh(keep(new THREE.BoxGeometry(10, 6.2, 8).translate(0, 3.1, 0)), [sideM, sideM, plainTop, plainTop, front, sideM]);
    body.castShadow = true;
    body.receiveShadow = true;
    home.add(body);
    const roof = new THREE.Mesh(roofGeom, lambert({ map: tiles, side: THREE.DoubleSide, color: '#c4643f' }));
    roof.position.y = 6.15;
    roof.scale.set(10.8, 3, 8.8);
    roof.castShadow = true;
    home.add(roof);
    const c = T.canvas(512, 128);
    const g = c.getContext('2d');
    g.fillStyle = '#ef2d6b';
    g.beginPath();
    g.roundRect(0, 0, 512, 128, 24);
    g.fill();
    g.strokeStyle = '#fff';
    g.lineWidth = 8;
    g.stroke();
    g.fillStyle = '#ffffff';
    g.font = '800 70px Fredoka, system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(texts('house').toUpperCase(), 256, 68);
    const banner = new THREE.Mesh(keep(new THREE.PlaneGeometry(4.6, 1.15)), lambert({ map: tex(c), side: THREE.DoubleSide }));
    banner.position.set(0, 4.7, 4.06);
    home.add(banner);
    // Bunting from the house to the gate
    const flags = [];
    for (let k = 0; k < 14; k++) flags.push(part(new THREE.ConeGeometry(0.16, 0.3, 3), ['#ef2d6b', '#ffd23f', '#2ec4b6', '#3a86ff'][k % 4], M(-4.5 + k * 0.7, 6.0 - Math.sin((k / 13) * Math.PI) * 0.6, 4.3, Math.PI)));
    home.add(new THREE.Mesh(keep(merge(flags)), VC));
    home.position.set(p.x, 0, p.z);
    home.rotation.y = facing(p, 1);
    scene.add(home);
    // The gang on the pavement in front of the house
    const ids = ['cous', 'aline', 'romain', 'victor', 'mamar', 'eugenie', 'violaine', 'greg'];
    const coats = ['#2ec4b6', '#e94f6b', '#3a86ff', '#7cb342', '#74acdf', '#ffb703', '#8e5cc2', '#d62828'];
    ids.forEach((id, i) => {
      const gp = route.at(end - 11.5 + i * 1.35, 5.0 + (i % 2) * 0.7);
      const person = new THREE.Group();
      const bodyM = new THREE.Mesh(keep(walkerBody({ coat: coats[i] })), VC);
      bodyM.castShadow = true;
      person.add(bodyM);
      const legs = [];
      const arms = [];
      for (const s of [-1, 1]) {
        const leg = new THREE.Mesh(keep(walkerLeg('#3b4a66')), VC);
        leg.position.set(s * 0.11, 0.92, 0);
        person.add(leg);
        legs.push(leg);
        const arm = new THREE.Mesh(keep(walkerArm(coats[i])), VC);
        arm.position.set(s * 0.27, 1.42, 0);
        person.add(arm);
        arms.push(arm);
      }
      const face = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: castTexture(id), transparent: true })));
      face.scale.set(0.82, 1.0, 1);
      face.position.set(0, 1.98, 0.05);
      person.add(face);
      person.position.set(gp.x, 0.14, gp.z);
      person.rotation.y = facing(gp, 1);
      scene.add(person);
      gang.push({ person, arms, legs, i });
    });
    // The finish: a chequered line across the road, and a gate in the garden wall
    const fl = T.chequerCanvas();
    const ft = tex(fl);
    ft.magFilter = THREE.NearestFilter;
    const fp = route.at(end - 6);
    const line = new THREE.Mesh(keep(new THREE.PlaneGeometry(7, 1.2)), lambert({ map: ft, polygonOffset: true, polygonOffsetFactor: -2 }));
    line.rotation.set(-Math.PI / 2, 0, fp.heading + Math.PI / 2);
    line.position.set(fp.x, 0.015, fp.z);
    line.receiveShadow = true;
    scene.add(line);
  }

  return {
    update(camera, t) {
      for (const u of updaters) u(camera, t);
    },
    gang,
  };
}
