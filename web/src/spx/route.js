/*
 * The 103 SPX route: Panda rides from the Parc du Petit Bois to his house on
 * Rue de Charolles, Montceau-les-Mines, through the ZUP roundabout (by the Lac
 * du Plessis, taken the wrong way), Rue Beaubernard and Rue de la Place Pageot.
 *
 * Street order and shapes come from OpenStreetMap (OSRM driving route, checked
 * 2026-11-02). `map` holds each street's points in metres (x east, y north, from
 * 46.67 N 4.37 E); `len` is the street's length in the game (the real streets,
 * about 4.3 km, are squeezed into about 2.4 km, with room for each event).
 *
 * buildRoute() turns this into the road the game rides on: a centre line
 * sampled every metre (corners rounded), each street's start and end distance,
 * and the minimap position of any distance.
 */

/** The ZUP roundabout on the minimap (centre and radius, metres). */
export const RING_MAP = { x: 467, y: 628, r: 30 };

/** Ring direction on the map: entry from the north-east, exit to the south-west, clockwise (the wrong way). */
const RING_ENTRY_DEG = 56;
const RING_EXIT_DEG = -134;
const RING_RADIUS = 16;

export const SECTIONS = [
  { id: 'petitbois', name: 'Parc du Petit Bois', len: 45, map: [[640, 1335], [602, 1318]] },
  { id: 'chateau', name: 'Rue du Château', len: 60, map: [[602, 1318], [544, 1310]] },
  { id: 'rollin', name: 'Rue du Chancelier Rollin', len: 200, map: [[544, 1310], [556, 1288], [838, 1090]] },
  { id: 'loge', name: 'Rue de la Loge', len: 170, map: [[838, 1090], [640, 837]] },
  { id: 'moulin', name: 'Rue du Champ du Moulin', len: 130, map: [[640, 837], [578, 778], [514, 696], [484, 653]] },
  { id: 'zup', name: 'Rond-point de la ZUP', ring: true, len: 0, map: [] },
  { id: 'moulin2', name: 'Rue du Champ du Moulin', len: 130, map: [[446, 606], [417, 575], [299, 417]] },
  { id: 'cluny', name: 'Rue de Cluny', len: 80, map: [[299, 417], [174, 466]] },
  { id: 'laville', name: 'Avenue Jean Laville', len: 130, map: [[174, 466], [49, 261]] },
  { id: 'beaubernard', name: 'Rue Beaubernard', len: 260, map: [[49, 261], [-328, -100]] },
  { id: 'barbes', name: 'Rue Barbès', len: 220, map: [[-328, -100], [-231, -158], [-203, -204], [-197, -253], [-209, -467]] },
  { id: 'desmoulins', name: 'Rue Camille Desmoulins', len: 260, map: [[-209, -467], [-284, -484], [-292, -506], [-313, -682]] },
  { id: 'vernois', name: 'Rue du Vernois', len: 340, map: [[-313, -682], [-354, -1040], [-409, -1152], [-444, -1342]] },
  { id: 'pageot', name: 'Rue de la Place Pageot', len: 200, map: [[-444, -1342], [-827, -1169]] },
  { id: 'charolles', name: 'Rue de Charolles', len: 110, map: [[-827, -1169], [-986, -1113]] },
];

/** Corner radius of the street junctions (game metres). */
const CORNER_RADIUS = 11;

function ringMapPoints(steps = 12) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const a = ((RING_ENTRY_DEG + ((RING_EXIT_DEG - RING_ENTRY_DEG) * i) / steps) * Math.PI) / 180;
    pts.push([RING_MAP.x + Math.cos(a) * RING_MAP.r, RING_MAP.y + Math.sin(a) * RING_MAP.r]);
  }
  return pts;
}

const polyLength = (pts) => pts.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);

/**
 * Builds the road. World axes: X east, Z south (three.js: forward is -Z when
 * riding north). Returns { length, sections, ring, at(s), sectionAt(s),
 * mapPoint(s), mapPath }.
 */
export function buildRoute() {
  const ringArc = (Math.abs(RING_EXIT_DEG - RING_ENTRY_DEG) * Math.PI) / 180;
  const sections = SECTIONS.map((sec) => {
    const map = sec.ring ? ringMapPoints() : sec.map;
    const len = sec.ring ? Math.round(RING_RADIUS * ringArc) : sec.len;
    return { ...sec, map, len };
  });

  // 1. Raw corner points in game metres: each street keeps its real shape, scaled to its game length.
  //    The ring is laid out exactly (radius RING_RADIUS), its points flagged so corners there are not rounded.
  const raw = [{ x: 0, z: 0, keep: false, sec: 0 }];
  let ring = null;
  sections.forEach((sec, i) => {
    const scale = sec.len / Math.max(1, polyLength(sec.map));
    const last = raw[raw.length - 1];
    if (sec.ring) {
      // The real ring shape (wrong way round), scaled to RING_RADIUS, starting where the street before it ends
      const k = RING_RADIUS / RING_MAP.r;
      const dense = ringMapPoints(24);
      const offX = last.x - dense[0][0] * k;
      const offZ = last.z + dense[0][1] * k;
      dense.slice(1).forEach((p, n) => {
        raw.push({ x: p[0] * k + offX, z: -p[1] * k + offZ, keep: n < dense.length - 2, sec: i });
      });
      ring = { cx: RING_MAP.x * k + offX, cz: -RING_MAP.y * k + offZ, r: RING_RADIUS, sec: i };
      return;
    }
    for (let k = 1; k < sec.map.length; k++) {
      const dx = (sec.map[k][0] - sec.map[k - 1][0]) * scale;
      const dz = -(sec.map[k][1] - sec.map[k - 1][1]) * scale;
      const p = raw[raw.length - 1];
      raw.push({ x: p.x + dx, z: p.z + dz, keep: false, sec: i });
    }
  });
  // 2. Round the corners: cut back each corner and put an arc in.
  const pts = [{ x: raw[0].x, z: raw[0].z, sec: raw[0].sec }];
  for (let i = 1; i < raw.length - 1; i++) {
    const a = raw[i - 1];
    const b = raw[i];
    const c = raw[i + 1];
    const v1x = b.x - a.x;
    const v1z = b.z - a.z;
    const v2x = c.x - b.x;
    const v2z = c.z - b.z;
    const l1 = Math.hypot(v1x, v1z);
    const l2 = Math.hypot(v2x, v2z);
    const turn = Math.atan2(v1x * v2z - v1z * v2x, v1x * v2x + v1z * v2z);
    if (b.keep || Math.abs(turn) < 0.05 || !l1 || !l2) {
      pts.push({ x: b.x, z: b.z, sec: b.sec });
      continue;
    }
    const cut = Math.min(CORNER_RADIUS * Math.tan(Math.abs(turn) / 2), l1 * 0.45, l2 * 0.45);
    const r = cut / Math.tan(Math.abs(turn) / 2);
    const sx = b.x - (v1x / l1) * cut;
    const sz = b.z - (v1z / l1) * cut;
    // Centre of the arc: perpendicular to the first leg, on the inside of the turn
    const nx = (-v1z / l1) * Math.sign(turn);
    const nz = (v1x / l1) * Math.sign(turn);
    const cx = sx + nx * r;
    const cz = sz + nz * r;
    const a0 = Math.atan2(sz - cz, sx - cx);
    const steps = Math.max(2, Math.ceil(Math.abs(turn) / 0.12));
    for (let k = 0; k <= steps; k++) {
      const ang = a0 + (turn * k) / steps;
      pts.push({ x: cx + Math.cos(ang) * r, z: cz + Math.sin(ang) * r, sec: k < steps / 2 ? b.sec : c.sec });
    }
  }
  const lastRaw = raw[raw.length - 1];
  pts.push({ x: lastRaw.x, z: lastRaw.z, sec: lastRaw.sec });

  // 3. Resample every metre.
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
  const length = Math.floor(cum[cum.length - 1]);
  const N = length + 1;
  const xs = new Float32Array(N);
  const zs = new Float32Array(N);
  const secOf = new Uint8Array(N);
  let j = 0;
  for (let s = 0; s < N; s++) {
    while (j < pts.length - 2 && cum[j + 1] < s) j++;
    const span = cum[j + 1] - cum[j] || 1;
    const f = Math.min(1, Math.max(0, (s - cum[j]) / span));
    xs[s] = pts[j].x + (pts[j + 1].x - pts[j].x) * f;
    zs[s] = pts[j].z + (pts[j + 1].z - pts[j].z) * f;
    // A point belongs to the street of the segment it lies on (the segment's end point)
    secOf[s] = pts[j + 1].sec;
  }
  // Sections must follow each other in order: smooth out any jitter at the joins.
  for (let s = 1; s < N; s++) if (secOf[s] < secOf[s - 1]) secOf[s] = secOf[s - 1];

  const bounds = sections.map((sec, i) => {
    let s0 = -1;
    let s1 = -1;
    for (let s = 0; s < N; s++) {
      if (secOf[s] === i) {
        if (s0 < 0) s0 = s;
        s1 = s;
      }
    }
    return { ...sec, index: i, s0: Math.max(0, s0), s1: Math.max(0, s1 + 1) };
  });
  // Close any gap so every distance belongs to a street
  for (let i = 1; i < bounds.length; i++) bounds[i].s0 = bounds[i - 1].s1;
  bounds[bounds.length - 1].s1 = length;
  if (ring) {
    ring.s0 = bounds[ring.sec].s0;
    ring.s1 = bounds[ring.sec].s1;
  }

  const clampS = (s) => Math.max(0, Math.min(length, s));

  /** Position and heading at distance s, shifted `lateral` metres to the right. */
  function at(s, lateral = 0) {
    const c = clampS(s);
    const i = Math.min(N - 2, Math.floor(c));
    const f = c - i;
    const x = xs[i] + (xs[i + 1] - xs[i]) * f;
    const z = zs[i] + (zs[i + 1] - zs[i]) * f;
    // Direction from a few metres around, for a smooth heading
    const a = Math.max(0, i - 2);
    const b = Math.min(N - 1, i + 3);
    let dx = xs[b] - xs[a];
    let dz = zs[b] - zs[a];
    const dl = Math.hypot(dx, dz) || 1;
    dx /= dl;
    dz /= dl;
    // Right of the riding direction (X east, Z south): (-dz, dx)
    const rx = -dz;
    const rz = dx;
    return { x: x + rx * lateral, z: z + rz * lateral, dx, dz, rx, rz, heading: Math.atan2(dx, dz) };
  }

  /** How sharply the road turns at s (radians per metre, + = to the right). */
  function curvature(s) {
    const a = at(s - 4);
    const b = at(s + 4);
    let d = Math.atan2(a.dx * b.dz - a.dz * b.dx, a.dx * b.dx + a.dz * b.dz);
    return d / 8;
  }

  function sectionAt(s) {
    const c = clampS(s);
    return bounds.find((b) => c >= b.s0 && c < b.s1) || bounds[bounds.length - 1];
  }

  /** Where distance s is on the real map (minimap), metres. */
  function mapPoint(s) {
    const sec = sectionAt(s);
    const f = sec.s1 > sec.s0 ? (clampS(s) - sec.s0) / (sec.s1 - sec.s0) : 0;
    const total = polyLength(sec.map);
    let want = f * total;
    for (let k = 1; k < sec.map.length; k++) {
      const p = sec.map[k - 1];
      const q = sec.map[k];
      const l = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (want <= l || k === sec.map.length - 1) {
        const g = l ? Math.min(1, want / l) : 0;
        return [p[0] + (q[0] - p[0]) * g, p[1] + (q[1] - p[1]) * g];
      }
      want -= l;
    }
    return sec.map[0];
  }

  const mapPath = bounds.flatMap((b) => b.map);

  return { length, sections: bounds, ring, at, curvature, sectionAt, mapPoint, mapPath, xs, zs };
}
