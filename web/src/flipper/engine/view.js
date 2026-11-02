// Engine from Pipeline Pinball (sfdx-hardis-training), same author.
/*
 * What Eul' Flipper looks like: Martinique by night in a neon arcade cabinet.
 * The painted playfield, every wall and toy of layout.js in 3D (chrome rails,
 * translucent hibiscus and lagoon plastics), the friends of Pandadventures on
 * the table (Babar, Mamar and Greg on the bumper caps, Cous on the Old/New
 * sign of the Fiat ramp, Eugenie at the rum bar, Violaine at Le Molière, Aline
 * on the silo, Romain blocking the beach, Victor by his 8.6 cans, Georges the
 * croco swimming on the silo roof, Panda on the apron), the little Fiat Panda,
 * the giant ti-punch glass, the lights the rules switch, the chrome ball, and
 * the camera at the flipper end that follows the play.
 *
 * Table units are scene units: the table point (x, y) is (x, 0, -y) in the
 * table group, which leans back like a real cabinet. Walls, posts and lights
 * are instanced, one draw per kind; nothing is allocated per frame.
 */
import { TABLE, sy } from "./layout.js";
import { BALL_RADIUS } from "./physics.js";
import { createBallMesh } from "./ball.js";
import { paintField, paintUpper, paintApron, paintSign, paintBumperCap, paintFlow, paintTerminal, paintNeon, paintCan, paintLetter, paintMadras, paintCorrugated, shapePoints, tableText, castUrl } from "./art.js";

const LEAN = 0.11;
const WALL_HEIGHT = { wall: 0.5, rubber: 0.4, rail: 0.3, post: 0.45, gate: 0.3, diverter: 0.42, sling: 0.42, upper: 0.45 };
// As on the arcade: brushed chrome guides, mirror posts, black rubbers; the
// mouths of the ramps are their own coloured plastic (RAMP_TINT)
const WALL_LOOK = {
  wall: { color: 0xd4dbe6, metalness: 0.92, roughness: 0.22 },
  upper: { color: 0xd4dbe6, metalness: 0.92, roughness: 0.22 },
  post: { color: 0xf2f6fb, metalness: 1, roughness: 0.1 },
  gate: { color: 0xf2f6fb, metalness: 1, roughness: 0.1 },
  rubber: { color: 0x121016, metalness: 0, roughness: 0.75 },
  sling: { color: 0xff2d7a, metalness: 0, roughness: 0.45, emissive: 0xff2d7a, emissiveIntensity: 0.15 },
  diverter: { color: 0x22d3ee, metalness: 0.2, roughness: 0.3, emissive: 0x22d3ee, emissiveIntensity: 0.3 }
};
// Rampe Fiat Panda (mango), Rampe du Rhum (hibiscus), Montée du Silo (lagoon)
const RAMP_TINT = { integration: 0xffa62b, uat: 0xff3d8b, production: 0x22d3ee };
// The friends on the bumper caps, in the order of layout.js
const BUMPER_CAST = [
  ["babar", 0xff6a3d, "Babar"],
  ["mamar", 0x22d3ee, "Mamar"],
  ["greg", 0xb06bff, "Greg"]
];
const FLASH_DECAY = 6;
// A ball this close to the edge of the screen counts as out of sight (table units)
const SIGHT_MARGIN = 0.8;
// The admins' faces: the raid admins, the author of the monster Flow; faded while a ball is behind one
const FACE_R = 0.7;
const FACE_HEIGHT = 1.25;
const FLOW_FACE_R = 0.6;
const FLOW_FACE_HEIGHT = 1.9;
const FACE_FADED = 0.25;

export function createView(THREE, ctx, table, options) {
  const t = ctx.t;
  const root = ctx.root;
  const engine = ctx.engine;
  const camera = ctx.camera;
  const tier = engine.tier;
  const disposables = [];
  const keep = (thing) => {
    disposables.push(thing);
    return thing;
  };

  const group = new THREE.Group();
  group.rotation.x = LEAN;
  root.add(group);
  const upper = new THREE.Group();
  upper.position.y = TABLE.upperHeight;
  group.add(upper);

  // An arcade at night: what the chrome and the plastics reflect, a dim room,
  // and the table lit by its own lamps (on the better quality tiers)
  const roomTexture = keep(paintRoom(THREE));
  engine.scene.environment = roomTexture;
  if (engine.scene.background && engine.scene.background.setHex) {
    engine.scene.background.setHex(0x12082a);
  }
  engine.hemi.intensity = 0.6;
  if (engine.hemi.color) {
    engine.hemi.color.setHex(0xc9b8ff);
    engine.hemi.groundColor.setHex(0x0e3a4a);
  }
  engine.sun.intensity = 1.25;
  const lamps = [];
  if (tier >= 1) {
    for (const [x, y, hue] of [
      [-2.2, 4.5, 0xffd2a0],
      [2.2, 4.5, 0xffd2a0],
      [0, 11.5, 0xffe6f2],
      [0, 18.5, 0xd8c8ff]
    ]) {
      const lamp = new THREE.PointLight(hue, 5, 9, 1.8);
      lamp.position.set(x, 3.2, -y);
      group.add(lamp);
      lamps.push(lamp);
    }
  }

  const tmp = new THREE.Object3D();
  const color = new THREE.Color();
  const vec = new THREE.Vector3();

  /* ---------- The playfield and the cabinet ---------- */

  const fieldW = TABLE.right - TABLE.left + 0.4;
  const fieldY0 = -1.6;
  const fieldY1 = TABLE.top + 0.3;
  const fieldTexture = keep(paintField(THREE, t, table.lights, tier));
  // The playfield under its clear coat: a little shine, the lamps reflected in it
  const field = new THREE.Mesh(keep(new THREE.PlaneGeometry(fieldW, fieldY1 - fieldY0)), keep(new THREE.MeshStandardMaterial({ map: fieldTexture, roughness: 0.38, metalness: 0.02, envMapIntensity: 0.3 })));
  field.rotation.x = -Math.PI / 2;
  field.position.set((TABLE.left + TABLE.right) / 2, 0, -(fieldY0 + fieldY1) / 2);
  field.receiveShadow = true;
  group.add(field);

  const wood = keep(new THREE.MeshStandardMaterial({ color: 0x170b2c, roughness: 0.35, metalness: 0.3 }));
  const chrome = keep(new THREE.MeshStandardMaterial({ color: 0xeef3f8, roughness: 0.12, metalness: 1 }));
  // The cabinet sides in madras, a little dimmed by the night
  const madrasTexture = keep(paintMadras(THREE, "rgba(20,6,40,0.25)"));
  madrasTexture.repeat.set(1, 6);
  const cabinetRed = keep(new THREE.MeshStandardMaterial({ map: madrasTexture, roughness: 0.6, metalness: 0.05 }));
  const box = keep(new THREE.BoxGeometry(1, 1, 1));
  // The cabinet, as on the arcade: black side rails capped with chrome, red sides, a lockdown bar
  const cabinetTop = TABLE.arc.y + 5.4;
  for (const [x0, x1, y0, y1, h, material] of [
    [TABLE.left - 0.75, TABLE.left - 0.1, fieldY0 - 0.6, cabinetTop, 1.0, wood],
    [TABLE.right + 0.08, TABLE.right + 0.7, fieldY0 - 0.6, cabinetTop, 1.0, wood],
    [TABLE.left - 0.75, TABLE.right + 0.7, TABLE.arc.y + 4, cabinetTop, 1.0, wood],
    [TABLE.left - 1.15, TABLE.left - 0.75, fieldY0 - 0.6, cabinetTop, 1.25, cabinetRed],
    [TABLE.right + 0.7, TABLE.right + 1.1, fieldY0 - 0.6, cabinetTop, 1.25, cabinetRed],
    [TABLE.left - 0.75, TABLE.left - 0.45, fieldY0 - 0.6, cabinetTop, 1.06, chrome],
    [TABLE.right + 0.4, TABLE.right + 0.7, fieldY0 - 0.6, cabinetTop, 1.06, chrome]
  ]) {
    const m = new THREE.Mesh(box, material);
    m.scale.set(x1 - x0, h, y1 - y0);
    m.position.set((x0 + x1) / 2, h / 2 - 0.15, -(y0 + y1) / 2);
    m.receiveShadow = true;
    group.add(m);
  }
  const lockdown = new THREE.Mesh(box, chrome);
  lockdown.scale.set(TABLE.right - TABLE.left + 2.2, 0.3, 0.6);
  lockdown.position.set((TABLE.left + TABLE.right) / 2, 0.85, -(fieldY0 - 0.45));
  group.add(lockdown);
  const apronTexture = keep(paintApron(THREE, t, castUrl("panda")));
  apronTexture.center.set(0.5, 0.5);
  const apron = new THREE.Mesh(box, [wood, wood, keep(new THREE.MeshStandardMaterial({ map: apronTexture, roughness: 0.6 })), wood, wood, wood]);
  apron.scale.set(TABLE.laneWall - TABLE.left - 0.1, 0.32, 1.9);
  apron.position.set((TABLE.left + TABLE.laneWall) / 2, 0.16, 0.65);
  group.add(apron);

  /* ---------- Walls, posts, rubbers: a box and two round ends per capsule ---------- */

  const kinds = {};
  for (const w of table.walls) {
    // The walls of a ramp's mouth take the colour of its plastic
    const kind = w.kind === "rail" ? "rail-" + (w.shape.ax < -1 ? "uat" : w.shape.ax > 1 ? "integration" : "production") : w.kind;
    (kinds[kind] = kinds[kind] || []).push(w.shape);
  }
  const cylinder = keep(new THREE.CylinderGeometry(1, 1, 1, 16));
  const wallMeshes = [];
  for (const [kind, shapes] of Object.entries(kinds)) {
    let material;
    if (kind.startsWith("rail-")) {
      const tint = RAMP_TINT[kind.slice(5)];
      material = keep(new THREE.MeshStandardMaterial({ color: tint, emissive: tint, emissiveIntensity: 0.22, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.62, depthWrite: false }));
    } else {
      material = keep(new THREE.MeshStandardMaterial(Object.assign({}, WALL_LOOK[kind] || WALL_LOOK.wall)));
    }
    const h = WALL_HEIGHT[kind.startsWith("rail-") ? "rail" : kind] || 0.5;
    const bodies = new THREE.InstancedMesh(box, material, shapes.length);
    const ends = new THREE.InstancedMesh(cylinder, material, shapes.length * 2);
    shapes.forEach((s, i) => {
      placeWall(bodies, i, s, h);
      placePost(ends, i * 2, s.ax, s.ay, s.r, h, s.floor);
      placePost(ends, i * 2 + 1, s.bx, s.by, s.rb, h, s.floor);
    });
    for (const m of [bodies, ends]) {
      m.castShadow = tier > 0;
      m.receiveShadow = true;
      m.instanceMatrix.needsUpdate = true;
      group.add(m);
    }
    wallMeshes.push({ kind, shapes, bodies, ends, h });
  }

  function floorY(floor) {
    return floor === 1 ? TABLE.upperHeight : 0;
  }

  // Black rubber rings round every post and lane guide end
  const ringSpots = [];
  for (const w of table.walls) {
    const s = w.shape;
    if (w.kind === "post") {
      ringSpots.push([s.ax, s.ay, s.r, s.floor], [s.bx, s.by, s.rb, s.floor]);
    } else if (w.kind === "rubber" && s.ax === s.bx && s.ay === s.by) {
      ringSpots.push([s.ax, s.ay, s.r, s.floor]);
    }
  }
  if (ringSpots.length) {
    const rings = new THREE.InstancedMesh(keep(new THREE.TorusGeometry(1, 0.32, 8, 20)), keep(new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.8 })), ringSpots.length);
    ringSpots.forEach(([x, y, r, floor], i) => {
      tmp.position.set(x, floorY(floor) + 0.28, -y);
      tmp.rotation.set(Math.PI / 2, 0, 0);
      tmp.scale.setScalar(r + 0.08);
      tmp.updateMatrix();
      rings.setMatrixAt(i, tmp.matrix);
    });
    rings.instanceMatrix.needsUpdate = true;
    group.add(rings);
  }

  function placeWall(mesh, i, s, h) {
    const dx = s.bx - s.ax;
    const dy = s.by - s.ay;
    const len = Math.hypot(dx, dy);
    tmp.position.set((s.ax + s.bx) / 2, floorY(s.floor) + h / 2, -(s.ay + s.by) / 2);
    tmp.rotation.set(0, Math.atan2(dy, dx), 0);
    tmp.scale.set(Math.max(0.001, len), h, (s.r + s.rb));
    tmp.updateMatrix();
    mesh.setMatrixAt(i, tmp.matrix);
  }

  function placePost(mesh, i, x, y, r, h, floor) {
    tmp.position.set(x, floorY(floor) + h / 2, -y);
    tmp.rotation.set(0, 0, 0);
    tmp.scale.set(r, h, r);
    tmp.updateMatrix();
    mesh.setMatrixAt(i, tmp.matrix);
  }

  // The production gate drops into the table when production opens
  const gateEntry = wallMeshes.find((w) => w.kind === "diverter");

  /* ---------- The slingshots' plastics ---------- */

  // Printed plastics over the slingshots, as on the arcade: colour, a white edge, a gloss
  const slingTexture = keep(paintPlastic(THREE));
  const slingMaterial = keep(new THREE.MeshStandardMaterial({ map: slingTexture, roughness: 0.12, metalness: 0.05, transparent: true, opacity: 0.93 }));
  const slingFlash = [];
  for (const side of [-1, 1]) {
    const shape = new THREE.Shape();
    const [a, b, c] = TABLE.sling;
    shape.moveTo(side * -a[0], a[1]);
    shape.lineTo(side * -b[0], b[1]);
    shape.lineTo(side * -c[0], c[1]);
    shape.closePath();
    const geometry = keep(new THREE.ExtrudeGeometry(shape, { depth: 0.46, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.03, bevelSegments: 2 }));
    // The print maps across the triangle, from its top corner
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (Math.abs(uv.getX(i)) - 1.75) / 1.4, (uv.getY(i) - 3.45) / 2.55);
    }
    const material = slingMaterial.clone();
    keep(material);
    const mesh = new THREE.Mesh(geometry, material);
    // Shape y is table y: laid flat, it lands on -z and the depth goes up
    mesh.rotation.x = -Math.PI / 2;
    group.add(mesh);
    slingFlash.push({ material, flash: 0 });
  }

  /* ---------- Pop bumpers: Babar, Mamar, Greg ---------- */

  const bumperBody = keep(new THREE.MeshStandardMaterial({ color: 0xf3f6fa, roughness: 0.2, metalness: 0.45 }));
  const bumperBaseGeometry = keep(new THREE.CylinderGeometry(0.58, 0.62, 0.42, 24));
  const bumperCapGeometry = keep(new THREE.CylinderGeometry(0.66, 0.66, 0.14, 24));
  const bumperFaceGeometry = keep(new THREE.CircleGeometry(0.6, 32));
  const bumperSkirtGeometry = keep(new THREE.CylinderGeometry(0.64, 0.64, 0.1, 24, 1, true));
  const bumperRingGeometry = keep(new THREE.TorusGeometry(0.6, 0.05, 6, 24));
  const bumpers = table.parts.bumpers.map((b, index) => {
    const [who, hue, name] = BUMPER_CAST[index % BUMPER_CAST.length];
    const g = new THREE.Group();
    const base = new THREE.Mesh(bumperBaseGeometry, bumperBody);
    base.position.y = 0.21;
    base.castShadow = tier > 0;
    // A translucent coloured cap, the friend's face printed on its top
    const capMaterial = keep(new THREE.MeshStandardMaterial({ color: hue, emissive: hue, emissiveIntensity: 0.25, roughness: 0.15, transparent: true, opacity: 0.85 }));
    const cap = new THREE.Mesh(bumperCapGeometry, capMaterial);
    cap.position.y = 0.5;
    const faceTexture = keep(paintBumperCap(THREE, hue, castUrl(who), name));
    const faceMat = keep(new THREE.MeshStandardMaterial({ map: faceTexture, emissiveMap: faceTexture, emissive: 0xffffff, emissiveIntensity: 0.25, roughness: 0.3 }));
    const top = new THREE.Mesh(bumperFaceGeometry, faceMat);
    top.rotation.x = -Math.PI / 2;
    top.position.y = 0.075;
    cap.add(top);
    // A neon skirt that flashes with the hit
    const skirtMaterial = keep(new THREE.MeshBasicMaterial({ color: hue, toneMapped: false, transparent: true, opacity: 0.85 }));
    const skirt = new THREE.Mesh(bumperSkirtGeometry, skirtMaterial);
    skirt.position.y = 0.08;
    const ring = new THREE.Mesh(bumperRingGeometry, chrome);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.32;
    g.add(base, cap, ring, skirt);
    g.position.set(b.ax, 0, -b.ay);
    g.scale.setScalar(b.r / 0.6);
    group.add(g);
    return { group: g, cap, capMaterial, faceMat, skirtMaterial, hue, flash: 0 };
  });

  /* ---------- Flippers ---------- */

  // Arcade flippers: a glossy white bat over a red rubber band all round it,
  // and a chrome cap on the pivot
  const flipperMaterial = keep(new THREE.MeshStandardMaterial({ color: 0xfbfbf7, roughness: 0.18, metalness: 0.05 }));
  const flipperRubber = keep(new THREE.MeshStandardMaterial({ color: 0xff2d7a, roughness: 0.55 }));
  const flipperStripe = keep(new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.3, emissive: 0x22d3ee, emissiveIntensity: 0.4 }));
  const capGeometry = keep(new THREE.CylinderGeometry(1, 1, 1, 20));
  const flippers = Object.values(table.parts.flippers).map((f) => {
    const s = f.shape;
    const g = new THREE.Group();
    const rubber = new THREE.Mesh(keep(flipperGeometry(THREE, f.length, s.r + 0.06, s.rb + 0.06, 0.2)), flipperRubber);
    rubber.position.y = 0.04;
    const body = new THREE.Mesh(keep(flipperGeometry(THREE, f.length, s.r, s.rb, 0.3)), flipperMaterial);
    body.position.y = 0.04;
    body.castShadow = tier > 0;
    // A thin coloured stripe along the top, as on the old bats
    const stripe = new THREE.Mesh(keep(flipperGeometry(THREE, f.length * 0.82, s.r * 0.32, s.rb * 0.32, 0.02)), flipperStripe);
    stripe.position.set(f.length * 0.06, 0.38, 0);
    const cap = new THREE.Mesh(capGeometry, chrome);
    cap.scale.set(s.r * 0.55, 0.1, s.r * 0.55);
    cap.position.y = 0.4;
    g.add(rubber, body, stripe, cap);
    g.position.set(s.pivotX, floorY(s.floor) + 0.02, -s.pivotY);
    group.add(g);
    return { f, group: g };
  });

  /* ---------- Targets ---------- */

  // T-A-T-O-U: a letter on each drop target, square to the bank
  const drops = table.parts.drops.map((d, i) => {
    const material = keep(new THREE.MeshStandardMaterial({ map: keep(paintLetter(THREE, "TATOU"[i] || "", 0x22d3ee)), roughness: 0.35, emissive: 0x22d3ee, emissiveIntensity: 0.12 }));
    const m = new THREE.Mesh(box, material);
    m.scale.set(Math.max(0.3, Math.hypot(d.bx - d.ax, d.by - d.ay) + 0.24), 0.5, 0.14);
    m.rotation.y = Math.atan2(d.by - d.ay, d.bx - d.ax);
    m.position.set((d.ax + d.bx) / 2, 0.25, -(d.ay + d.by) / 2);
    m.castShadow = tier > 0;
    group.add(m);
    return { mesh: m, sink: 0 };
  });
  // Victor's three 8.6 cans
  const canMaterial = keep(new THREE.MeshStandardMaterial({ map: keep(paintCan(THREE)), metalness: 0.65, roughness: 0.28 }));
  const canGeometry = keep(new THREE.CylinderGeometry(0.2, 0.2, 0.52, 18));
  for (const c of table.parts.standups) {
    const m = new THREE.Mesh(canGeometry, canMaterial);
    m.position.set((c.ax + c.bx) / 2, 0.26, -(c.ay + c.by) / 2);
    m.rotation.y = -0.6;
    m.castShadow = tier > 0;
    group.add(m);
  }
  const checkMaterial = keep(new THREE.MeshStandardMaterial({ color: 0xffa62b, roughness: 0.4, emissive: 0xffa62b, emissiveIntensity: 0.3 }));
  for (const c of table.parts.upperTargets) {
    const m = new THREE.Mesh(box, checkMaterial);
    m.scale.set(0.2, 0.46, 0.5);
    m.position.set(c.ax, floorY(c.floor) + 0.23, -(c.ay + c.by) / 2);
    group.add(m);
  }

  // IMPÔTS: three targets on the left wall (backups)...
  const backupMaterial = keep(new THREE.MeshStandardMaterial({ color: 0xffa62b, roughness: 0.35, emissive: 0xffa62b, emissiveIntensity: 0.3 }));
  for (const b of table.parts.backups) {
    const m = new THREE.Mesh(box, backupMaterial);
    m.scale.set(0.18, 0.42, 0.52);
    m.position.set(b.ax + 0.05, 0.21, -(b.ay + b.by) / 2);
    group.add(m);
  }

  // ...and three round ones on the right wall (quality), that sink in when hit
  const qualityFace = keep(new THREE.CylinderGeometry(0.26, 0.26, 0.12, 20));
  const quality = table.parts.quality.map((q) => {
    const material = keep(new THREE.MeshStandardMaterial({ color: 0xffa62b, roughness: 0.3, emissive: 0xffa62b, emissiveIntensity: 0.2 }));
    const m = new THREE.Mesh(qualityFace, material);
    m.rotation.z = Math.PI / 2;
    m.position.set(q.ax - 0.02, 0.26, -(q.ay + q.by) / 2);
    group.add(m);
    return { mesh: m, material, base: q.ax - 0.02, push: 0 };
  });

  // The monster Flow: a disc that spins in the playfield, until it is refactored into Apex
  /**
   * A round portrait in a white ring, as on the cards. Drawn into a canvas
   * first, as the other worlds do: an SVG handed straight to a texture draws
   * nothing in WebGPU (it has no size of its own). White until it loads.
   */
  function faceMaterial(url) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const c = canvas.getContext("2d");
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.arc(128, 128, 126, 0, Math.PI * 2);
    c.fill();
    const texture = keep(new THREE.CanvasTexture(canvas));
    texture.colorSpace = THREE.SRGBColorSpace;
    // Transparent so that it fades when a ball rolls behind it (fadeFace)
    const material = keep(new THREE.MeshBasicMaterial({ map: texture, alphaTest: 0.5, toneMapped: false, transparent: true }));
    if (url) {
      const portrait = new Image();
      portrait.decoding = "async";
      portrait.onload = () => {
        c.save();
        c.beginPath();
        c.arc(128, 128, 114, 0, Math.PI * 2);
        c.clip();
        c.drawImage(portrait, 14, 14, 228, 228);
        c.restore();
        texture.needsUpdate = true;
      };
      // A portrait that does not load keeps the white disc
      portrait.onerror = () => {};
      portrait.src = url;
    }
    return material;
  }

  // Eul' cyclone: a hurricane disc that spins; calm (a sun and a palm) once beaten
  const flowTextures = { spin: keep(paintFlow(THREE, false)), apex: keep(paintFlow(THREE, true)) };
  const flowMaterial = keep(new THREE.MeshStandardMaterial({ map: flowTextures.spin, emissiveMap: flowTextures.spin, roughness: 0.3, emissive: 0xffffff, emissiveIntensity: 0.25 }));
  const flowDisc = new THREE.Mesh(keep(new THREE.CylinderGeometry(TABLE.flow.r, TABLE.flow.r, 0.03, 40)), flowMaterial);
  flowDisc.position.set(TABLE.flow.x, 0.02, -TABLE.flow.y);
  group.add(flowDisc);
  let flowFlash = 0;
  // The admin who built the monster Flow, over it until it is refactored into Apex
  const flowFace = new THREE.Group();
  const flowFaceMaterial = faceMaterial(options.flowFaceUrl);
  // On a post, high enough to stand clear of the Flow's own picture
  const flowFacePost = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8)), keep(new THREE.MeshStandardMaterial({ color: 0x032d60, roughness: 0.5 })));
  flowFacePost.position.y = 0.8;
  const flowFaceDisc = new THREE.Mesh(keep(new THREE.CircleGeometry(FLOW_FACE_R, 32)), flowFaceMaterial);
  flowFaceDisc.position.y = FLOW_FACE_HEIGHT;
  flowFace.add(flowFacePost, flowFaceDisc);
  flowFace.position.set(TABLE.flow.x, 0, -TABLE.flow.y);
  group.add(flowFace);
  let flowFaceSink = 0;
  // Eul' barbecue: Babar's grill sign, behind its saucer
  const terminalScreen = new THREE.Mesh(keep(new THREE.PlaneGeometry(1.5, 0.94)), keep(new THREE.MeshBasicMaterial({ map: keep(paintTerminal(THREE, tableText(t, "tbBarbecue"), castUrl("babar"))), toneMapped: false, transparent: true })));
  terminalScreen.position.set(TABLE.terminal.x, 0.95, -(TABLE.terminal.y + 0.72));
  terminalScreen.rotation.x = -0.35;
  group.add(terminalScreen);
  let terminalFlash = 0;
  // Validate: a green target
  const validateShape = table.parts.validate;
  const validateMaterial = keep(new THREE.MeshStandardMaterial({ color: 0x0e8fa8, roughness: 0.35, emissive: 0x22d3ee, emissiveIntensity: 0.3 }));
  const validateMesh = new THREE.Mesh(box, validateMaterial);
  validateMesh.scale.set(Math.hypot(validateShape.bx - validateShape.ax, validateShape.by - validateShape.ay) + 0.2, 0.42, 0.18);
  validateMesh.position.set((validateShape.ax + validateShape.bx) / 2, 0.21, -(validateShape.ay + validateShape.by) / 2);
  validateMesh.rotation.y = Math.atan2(validateShape.by - validateShape.ay, validateShape.bx - validateShape.ax);
  group.add(validateMesh);
  let validateFlash = 0;

  /* ---------- The admins who rise, with their faces ---------- */

  // Bigger than the admin's post (0.44, what the ball hits): a face read on a phone
  const disc = keep(new THREE.CircleGeometry(FACE_R, 32));
  const admins = table.parts.admins.map((a, i) => {
    const g = new THREE.Group();
    const post = new THREE.Mesh(cylinder, keep(new THREE.MeshStandardMaterial({ color: 0x032d60, roughness: 0.5 })));
    post.scale.set(0.42, 0.5, 0.42);
    post.position.y = 0.25;
    const face = new THREE.Mesh(disc, faceMaterial(options.faceUrl(i)));
    face.position.y = FACE_HEIGHT;
    g.add(post, face);
    g.position.set(a.ax, -1.2, -a.ay);
    g.visible = false;
    group.add(g);
    return { group: g, face, rise: 0, up: false };
  });

  /* ---------- Scoop, release hole, spinner, plunger ---------- */

  const holeMaterial = keep(new THREE.MeshBasicMaterial({ color: 0x050a14 }));
  const rimGeometry = keep(new THREE.TorusGeometry(0.44, 0.05, 6, 24));
  for (const [x, y, floor, hue] of [
    [TABLE.scoop.x, TABLE.scoop.y, 0, 0xff6ad5],
    [TABLE.release.x, TABLE.release.y, 1, 0xffd23f],
    [TABLE.hotfix.x, TABLE.hotfix.y, 0, 0xff3d8b],
    [TABLE.terminal.x, TABLE.terminal.y, 0, 0xff6a3d]
  ]) {
    const h = new THREE.Mesh(keep(new THREE.CircleGeometry(0.42, 24)), holeMaterial);
    h.rotation.x = -Math.PI / 2;
    h.position.set(x, floorY(floor) + 0.012, -y);
    group.add(h);
    const rim = new THREE.Mesh(rimGeometry, keep(new THREE.MeshStandardMaterial({ color: hue, emissive: hue, emissiveIntensity: 0.8 })));
    rim.rotation.x = Math.PI / 2;
    rim.position.set(x, floorY(floor) + 0.03, -y);
    group.add(rim);
  }
  // The ti-punch spinner: a lime-green plate
  const spinner = new THREE.Mesh(box, keep(new THREE.MeshStandardMaterial({ color: 0x9be15d, emissive: 0x4a8a1c, emissiveIntensity: 0.3, metalness: 0.5, roughness: 0.25 })));
  spinner.scale.set(1.0, 0.42, 0.03);
  spinner.position.set(-4.47, 0.42, -sy(11.2));
  group.add(spinner);
  let spinLeft = 0;
  const plunger = new THREE.Group();
  const rod = new THREE.Mesh(cylinder, chrome);
  rod.scale.set(0.08, 1.4, 0.08);
  rod.rotation.x = Math.PI / 2;
  rod.position.set(0, 0.3, 0.7);
  const knob = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.4, 0.4, 0.14, 18)), keep(new THREE.MeshStandardMaterial({ color: 0xff2d7a, roughness: 0.3 })));
  knob.rotation.x = Math.PI / 2;
  knob.position.set(0, 0.3, 0);
  plunger.add(rod, knob);
  plunger.position.set(TABLE.plunger.x, 0, -TABLE.plunger.y + 0.1);
  group.add(plunger);

  /* ---------- Ramps and wires ---------- */

  const rampMaterial = keep(new THREE.MeshStandardMaterial({ color: 0xeef3f8, roughness: 0.12, metalness: 1 }));
  const plastic = RAMP_TINT;
  // The signs of the ramps, with a friend each: Cous (Old / New, flips on each
  // Fiat shot), Eugenie at the rum bar, Aline at the silo
  const signs = {
    integration: { text: "tbOldCous", face: "cous", alt: "tbNewCous" },
    uat: { text: "tbRampRhum", face: "eugenie" },
    production: { text: "tbRampSilo", face: "aline" }
  };
  let cousSign = null;
  let fiat = null;
  const curves = {};
  for (const [name, p] of Object.entries(table.parts.paths)) {
    const pts = [];
    for (let i = 0; i < p.points.length; i += 3) {
      pts.push(new THREE.Vector3(p.points[i], p.points[i + 2] + BALL_RADIUS, -p.points[i + 1]));
    }
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    curves[name] = curve;
    // A ramp that climbs is plastic up to its crest (all the way for the
    // production ramp, which lands on the Production floor); what comes down
    // after it is a wire rail
    let crest = 0;
    if (plastic[name]) {
      let top = -1;
      for (let i = 0; i < p.points.length / 3; i++) {
        if (p.points[i * 3 + 2] > top + 1e-6) {
          top = p.points[i * 3 + 2];
          crest = p.lengths[i] / p.total;
        }
      }
      crest = name === "production" ? 1 : Math.min(1, crest + 0.06);
      const ramp = new THREE.Mesh(keep(rampGeometry(THREE, curve, 0, crest, Math.max(20, Math.round(p.total * crest * 5)))), keep(new THREE.MeshStandardMaterial({ color: plastic[name], emissive: plastic[name], emissiveIntensity: 0.3, roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.58, side: THREE.DoubleSide, depthWrite: false })));
      ramp.renderOrder = 2;
      group.add(ramp);
    }
    if (crest < 1) {
      const segments = Math.max(24, Math.round(p.total * (1 - crest) * 4));
      // Two side rails at the ball's sides, one under it
      // A habitrail: two thin rails at the ball's sides
      for (const [side, drop] of [
        [-(BALL_RADIUS + 0.06), -0.05],
        [BALL_RADIUS + 0.06, -0.05]
      ]) {
        const offset = [];
        for (let i = 0; i <= segments; i++) {
          const u = crest + ((1 - crest) * i) / segments;
          const at = curve.getPointAt(u);
          const tangent = curve.getTangentAt(u);
          const sideV = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
          offset.push(at.clone().addScaledVector(sideV, side).add(new THREE.Vector3(0, drop, 0)));
        }
        const rail = new THREE.Mesh(keep(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(offset), segments, 0.028, 5, false)), rampMaterial);
        rail.castShadow = tier > 1;
        group.add(rail);
      }
    }
    if (plastic[name]) {
      // A printed sign standing on the ramp at its crest, out of the way of the mouth
      const sign = signs[name];
      const signMaterial = keep(new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.3, emissive: 0xffffff, emissiveIntensity: 0.35, side: THREE.DoubleSide }));
      const front = keep(paintSign(THREE, tableText(t, sign.text), name === "integration" ? 0x8a6a4a : plastic[name], { face: castUrl(sign.face) }));
      signMaterial.map = front;
      signMaterial.emissiveMap = front;
      const flag = new THREE.Mesh(keep(new THREE.PlaneGeometry(1.35, 1.7)), signMaterial);
      // The side ramps show theirs at the top bend, in sight from the flippers
      const signU = name === "production" ? Math.max(0, crest - 0.08) : Math.min(crest, p.lengths[4] / p.total);
      const crestAt = curve.getPointAt(signU);
      flag.scale.setScalar(0.8);
      flag.position.set(crestAt.x, crestAt.y + 0.9, crestAt.z);
      flag.rotation.x = -0.35;
      group.add(flag);
      if (sign.alt) {
        const back = keep(paintSign(THREE, tableText(t, sign.alt), plastic[name], { face: castUrl(sign.face) }));
        cousSign = { material: signMaterial, textures: [front, back], at: 0, turn: 0, flag };
      }
      if (name === "integration") {
        // The road of the Fiat: a dashed line up its plastic
        const dashes = new THREE.InstancedMesh(box, keep(new THREE.MeshBasicMaterial({ color: 0xffd23f, toneMapped: false })), 9);
        for (let k = 0; k < 9; k++) {
          const u = 0.1 + ((crest - 0.16) * k) / 8;
          const at = curve.getPointAt(u);
          const tangent = curve.getTangentAt(u);
          tmp.position.set(at.x, Math.max(0.01, at.y - BALL_RADIUS - 0.02), at.z);
          tmp.rotation.set(0, Math.atan2(-tangent.x, -tangent.z), 0);
          tmp.scale.set(0.05, 0.012, 0.16);
          tmp.updateMatrix();
          dashes.setMatrixAt(k, tmp.matrix);
        }
        dashes.instanceMatrix.needsUpdate = true;
        dashes.renderOrder = 3;
        group.add(dashes);
        // The little Fiat Panda, parked at the top of its road, nose down the ramp
        fiat = buildFiat(THREE, keep);
        const parkU = Math.min(crest, p.lengths[3] / p.total + 0.015);
        const at = curve.getPointAt(parkU);
        const tangent = curve.getTangentAt(parkU);
        fiat.group.position.set(at.x, Math.max(0, at.y - BALL_RADIUS - 0.02), at.z);
        fiat.group.rotation.y = Math.atan2(-tangent.x, -tangent.z) + Math.PI;
        fiat.base = fiat.group.position.y;
        group.add(fiat.group);
      }
    }
  }
  // The giant ti-punch glass at the end of the Rampe du Rhum: its wire runs into it
  const tiPunch = buildTiPunch(THREE, keep);
  tiPunch.position.set(TABLE.left - 0.45, 0.85, -sy(14.75));
  group.add(tiPunch);

  /* ---------- The Production floor ---------- */

  const upperTexture = keep(paintUpper(THREE, t, table.lights, tier));
  const upperW = TABLE.upperRight - TABLE.upperLeft + 0.6;
  const upperL = TABLE.upperTop - TABLE.upperBottom;
  const deck = new THREE.Mesh(box, [wood, wood, keep(new THREE.MeshStandardMaterial({ map: upperTexture, roughness: 0.5 })), wood, wood, wood]);
  deck.scale.set(upperW, 0.18, upperL);
  deck.position.set(0, -0.09, -(TABLE.upperBottom + TABLE.upperTop) / 2);
  deck.receiveShadow = true;
  upper.add(deck);
  // The silo under the roof: corrugated steel, a neon rim, Aline on its front
  const siloR = 4.4;
  const siloY = (TABLE.upperBottom + TABLE.upperTop) / 2;
  const siloTexture = keep(paintCorrugated(THREE));
  const silo = new THREE.Mesh(keep(new THREE.CylinderGeometry(siloR, siloR, TABLE.upperHeight + 0.2, tier > 1 ? 48 : 32, 1, true)), keep(new THREE.MeshStandardMaterial({ map: siloTexture, metalness: 0.7, roughness: 0.35 })));
  silo.position.set(0, TABLE.upperHeight / 2 - 0.2, -siloY);
  group.add(silo);
  const siloRim = new THREE.Mesh(keep(new THREE.TorusGeometry(siloR, 0.06, 6, 48)), keep(new THREE.MeshBasicMaterial({ color: 0xffa62b, toneMapped: false })));
  siloRim.rotation.x = Math.PI / 2;
  siloRim.position.set(0, TABLE.upperHeight - 0.12, -siloY);
  group.add(siloRim);
  const aline = new THREE.Mesh(keep(new THREE.CircleGeometry(0.55, 28)), faceMaterial(castUrl("aline")));
  aline.position.set(-2.3, 1.05, -(siloY - Math.sqrt(siloR * siloR - 2.3 * 2.3) - 0.04));
  group.add(aline);
  // Georges the croco swims across the silo roof (the rabbit of the rules);
  // Romain stands in front of the beach hole (the Sales Manager of the rules)
  const rabbitShape = table.parts.rabbit;
  const croco = buildCroco(THREE, keep);
  const rabbit = croco.group;
  rabbit.position.set(0, TABLE.upperHeight, -rabbitShape.ay);
  group.add(rabbit);
  let rabbitHop = 0;
  const smShape = table.parts.salesManager;
  const salesManager = new THREE.Group();
  const smMaterial = faceMaterial(options.salesManagerUrl);
  const smPost = new THREE.Mesh(cylinder, keep(new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.5 })));
  smPost.scale.set(0.42, 0.6, 0.42);
  smPost.position.y = 0.3;
  const smFace = new THREE.Mesh(keep(new THREE.CircleGeometry(0.55, 28)), smMaterial);
  smFace.position.y = 1.15;
  smFace.rotation.x = -0.3;
  salesManager.add(smPost, smFace);
  salesManager.position.set(smShape.ax, TABLE.upperHeight, -smShape.ay);
  group.add(salesManager);
  let smShake = 0;

  /* ---------- Toys and dome lights ---------- */

  const toys = [];
  // Two palms at the top corners of the cabinet, swaying
  for (const [x, lean] of [
    [TABLE.left - 0.45, 0.18],
    [TABLE.right + 0.45, -0.18]
  ]) {
    const tree = buildPalm(THREE, keep, lean);
    tree.position.set(x, 0.85, -(TABLE.arc.y + 3.4));
    group.add(tree);
    toys.push({ object: tree, spin: 0, bob: 0, base: 0.85, sway: lean });
  }
  // Le Molière: the neon club entrance behind the scoop, Violaine at the decks
  const moliereMaterial = keep(new THREE.MeshBasicMaterial({ map: keep(paintNeon(THREE, tableText(t, "tbMoliere"), "#ff3d8b", castUrl("violaine"))), toneMapped: false, transparent: true }));
  const moliere = new THREE.Mesh(keep(new THREE.PlaneGeometry(2.1, 0.82)), moliereMaterial);
  moliere.position.set(TABLE.scoop.x, 0.85, -(TABLE.scoop.y + 0.75));
  moliere.rotation.x = -0.3;
  group.add(moliere);
  // Victor, by his 8.6 cans on the right bank
  const victorMaterial = faceMaterial(castUrl("victor"));
  const victor = new THREE.Mesh(keep(new THREE.CircleGeometry(0.36, 28)), victorMaterial);
  victor.position.set(4.62, 0.95, -8.2);
  group.add(victor);
  // Dome lights on the side rails and over the slingshots
  const domeGeometry = keep(new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2));
  const domes = [
    [TABLE.left - 0.42, sy(11.2), 1.05, 0xff3d8b],
    [TABLE.right + 0.4, sy(17.2), 1.05, 0xffa62b],
    [TABLE.left - 0.42, 9.0, 1.05, 0x22d3ee],
    [TABLE.right + 0.4, 9.0, 1.05, 0xff3d8b],
    [-3.1, 5.9, 0.48, 0xffa62b],
    [3.1, 5.9, 0.48, 0x22d3ee]
  ].map(([x, y, h, hue], i) => {
    const material = keep(new THREE.MeshStandardMaterial({ color: hue, emissive: hue, emissiveIntensity: 0.3, roughness: 0.15, transparent: true, opacity: 0.9 }));
    const dome = new THREE.Mesh(domeGeometry, material);
    dome.scale.setScalar(h > 1 ? 0.28 : 0.2);
    dome.position.set(x, h, -y);
    group.add(dome);
    return { material, phase: i * 1.3 };
  });

  /* ---------- Lights ---------- */

  const lightMeshes = {};
  const lightGeometry = {};
  for (const shape of ["round", "delta", "hex", "star", "chevron", "bulb"]) {
    lightGeometry[shape] = keep(insertGeometry(THREE, shape));
  }
  // An insert adds its light to the print under it: dark, the print shows; lit, it glows
  const lightMaterial = keep(new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  const bulbMaterial = keep(new THREE.MeshBasicMaterial({ toneMapped: false }));
  for (const shape of Object.keys(lightGeometry)) {
    const list = table.lights.map((l, i) => ({ l, i })).filter((x) => x.l.shape === shape);
    if (!list.length) {
      continue;
    }
    const mesh = new THREE.InstancedMesh(lightGeometry[shape], shape === "bulb" ? bulbMaterial : lightMaterial, list.length);
    list.forEach(({ l }, k) => {
      tmp.position.set(l.x, floorY(l.floor) + 0.015, -l.y);
      tmp.rotation.set(-Math.PI / 2, 0, -l.angle);
      tmp.scale.setScalar(l.size);
      tmp.updateMatrix();
      mesh.setMatrixAt(k, tmp.matrix);
      mesh.setColorAt(k, color.setHex(l.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
    lightMeshes[shape] = { mesh, list };
  }

  // What each light follows: a chevron chases towards its shot, a bulb of the
  // general illumination glows warm and flickers with the play
  const lightRole = table.lights.map((l) => {
    const chev = /^chev-(.+)-(\d)$/.exec(l.id);
    if (chev) {
      return { kind: "chevron", parent: table.lights.findIndex((x) => x.id === "shot-" + chev[1]), step: Number(chev[2]) };
    }
    if (l.id.startsWith("gi-")) {
      return { kind: "gi", seed: Math.random() * 10 };
    }
    if (l.id.startsWith("mission")) {
      return { kind: "mission", step: Number(l.id.slice(7)) };
    }
    return { kind: "plain" };
  });
  let showTime = 0;
  let giFlash = 0;

  /* ---------- The balls ---------- */

  const ballMeshes = table.physics.balls.map(() => {
    const m = createBallMesh(THREE);
    m.group.visible = false;
    group.add(m.group);
    return m;
  });
  let giant = false;

  /* ---------- The camera ---------- */

  const look = { y: 6, target: 6 };
  // What the view shows of the table (table y), up while it frames the Production floor
  const sight = { up: false, from: -Infinity, to: Infinity };

  function placeCamera(dt) {
    const balls = table.physics.balls;
    // Follow the lowest ball on the table, the one that needs the flippers next;
    // the Production floor when only balls up there are in play
    let low = null;
    let up = null;
    for (const b of balls) {
      if (!b.active) {
        continue;
      }
      if (b.floor === 1 && b.mode === "table") {
        up = up && up.y < b.y ? up : b;
      } else if (!low || b.y < low.y) {
        low = b;
      }
    }
    const aspect = camera.aspect || 1;
    const portrait = aspect < 1;
    // A phone looks down more, so the whole length fits; a wide screen leans
    // back like a player at the cabinet and follows the ball
    const vfov = portrait ? 58 : 46;
    camera.fov = vfov;
    const half = (vfov * Math.PI) / 360;
    const hfov = 2 * Math.atan(Math.tan(half) * aspect);
    const width = TABLE.right - TABLE.left + 1.0;
    // A wide screen sits lower, about 35 degrees off the vertical, as the arcade
    // desktop views do: the ramps and the toys stand up off the playfield
    const pitch = portrait ? 1.18 : 0.96;
    // Far enough for the width, and on a wide screen for the whole length too:
    // the flippers and the top of the table are always in sight there
    let distance = width / 2 / Math.tan(hfov / 2) + 1.0;
    let below = 0;
    let above = 0;
    for (let i = 0; i < 40; i++) {
      // How far the view reaches below and above its centre, on the table
      const height = Math.sin(pitch) * distance;
      const across = Math.cos(pitch) * distance;
      below = across - height / Math.tan(pitch + half);
      above = pitch - half > 0.06 ? height / Math.tan(pitch - half) - across : 40;
      if (portrait || below + above >= TABLE.top + 2.2) {
        break;
      }
      distance *= 1.04;
    }
    const span = below + above;
    // The flippers stay in sight while the ball is in the lower part
    const min = -0.9 + below;
    const max = Math.max(min, TABLE.top + 0.6 - above);
    let target;
    sight.up = Boolean(up && (!low || low.y > 9 || low.mode === "path"));
    if (sight.up) {
      const middle = (TABLE.upperBottom + TABLE.upperTop) / 2 + below - span / 2;
      // A phone centres the upper floor a little low, under the goal line and the buttons, whole
      target = portrait ? middle - span * 0.07 : Math.max(min, Math.min(middle, TABLE.upperTop + 0.6 - above));
    } else if (low) {
      // The ball a quarter of the way up the view
      target = Math.max(min, Math.min(max, low.y - span * 0.28 + below));
    } else {
      target = min;
    }
    look.target = target;
    const k = 1 - Math.exp(-dt * (low && low.y < 4 ? 6 : 3));
    look.y += (look.target - look.y) * k;
    // The part of the table in sight, with a margin for the edges of the screen
    sight.from = look.y - below + SIGHT_MARGIN;
    sight.to = look.y + above - SIGHT_MARGIN;
    vec.set((TABLE.left + TABLE.right) / 2, look.y > 20 ? TABLE.upperHeight : 0, -look.y);
    group.localToWorld(vec);
    const tx = vec.x;
    const ty = vec.y;
    const tz = vec.z;
    camera.position.set(tx, ty + Math.sin(pitch) * distance, tz + Math.cos(pitch) * distance);
    camera.lookAt(tx, ty, tz);
    camera.updateProjectionMatrix();
    engine.aimSun(tx, tz);
  }

  /**
   * A face standing up off the table hides the table just behind it, seen
   * from the player: it fades while a ball rolls there, so no ball is lost
   * behind a face. (x, y) the foot of its post, h the height of the face, r its radius.
   */
  function fadeFace(material, x, y, h, r, dt) {
    // Seen from the player's height, a face at h covers the table about h * 0.45 further up
    const middle = y + h * 0.45;
    let behind = false;
    const balls = table.physics.balls;
    for (let i = 0; i < balls.length; i++) {
      const b = balls[i];
      if (b.active && b.floor === 0 && Math.abs(b.x - x) < r + 0.35 && Math.abs(b.y - middle) < r + 0.45) {
        behind = true;
        break;
      }
    }
    material.opacity += ((behind ? FACE_FADED : 1) - material.opacity) * Math.min(1, dt * 12);
  }

  /* ---------- Each frame ---------- */

  let time = 0;
  let fiatRiding = false;
  let fiatHop = 0;
  const q = new THREE.Quaternion();
  const axis = new THREE.Vector3();

  /**
   * mood: { attract (the ball waits on the plunger), tilted }. Lights follow
   * the rules, then the moments of the game play over them: a light show
   * after a jackpot, a chase while the table waits.
   */
  function update(dt, lights, mood) {
    time += dt;
    showTime = Math.max(0, showTime - dt);
    giFlash = Math.max(0, giFlash - dt * 3);
    const attract = Boolean(mood && mood.attract);
    const tilted = Boolean(mood && mood.tilted);
    const physics = table.physics;
    // Balls
    physics.balls.forEach((b, i) => {
      const m = ballMeshes[i];
      m.group.visible = b.active;
      if (!b.active) {
        return;
      }
      const h = b.mode === "path" ? b.h : floorY(b.floor) + b.h;
      const scale = giant ? 1.5 : 1;
      m.group.position.set(b.x, h + b.r * scale, -b.y);
      m.group.scale.setScalar(scale);
      // Rolling: the distance covered turns it round the axis across the motion
      const dx = b.spinX;
      const dy = b.spinY;
      b.spinX = 0;
      b.spinY = 0;
      const d = Math.hypot(dx, dy);
      if (d > 1e-5) {
        axis.set(-dy, 0, -dx).normalize();
        q.setFromAxisAngle(axis, -d / (b.r * scale));
        m.body.quaternion.premultiply(q);
      }
      m.update(dt);
    });
    // Flippers
    for (const { f, group: g } of flippers) {
      const a = f.side === 1 ? f.angle : Math.PI - f.angle;
      g.rotation.y = a;
    }
    // Plunger
    const pull = physics.plunger ? physics.plunger.pull : 0;
    plunger.position.z = -TABLE.plunger.y + 0.1 + pull * 0.9;
    // Bumpers and slings flash
    for (const b of bumpers) {
      b.flash = Math.max(0, b.flash - dt * FLASH_DECAY);
      b.capMaterial.emissiveIntensity = 0.25 + b.flash * 1.6;
      b.faceMat.emissiveIntensity = 0.25 + b.flash * 0.9;
      b.skirtMaterial.color.setHex(b.hue).multiplyScalar(0.7 + b.flash * 1.6);
      b.cap.position.y = 0.5 - b.flash * 0.08;
    }
    for (const s of slingFlash) {
      s.flash = Math.max(0, s.flash - dt * FLASH_DECAY);
      s.material.emissive.setHex(0xff2d7a);
      s.material.emissiveIntensity = s.flash;
    }
    // Drop targets sink, admins rise
    table.parts.drops.forEach((d, i) => {
      const target = d.enabled ? 0 : 1;
      drops[i].sink += (target - drops[i].sink) * Math.min(1, dt * 14);
      drops[i].mesh.position.y = 0.25 - drops[i].sink * 0.5;
    });
    table.parts.admins.forEach((a, i) => {
      const v = admins[i];
      const target = a.enabled ? 1 : 0;
      v.rise += (target - v.rise) * Math.min(1, dt * 8);
      v.group.visible = v.rise > 0.02;
      v.group.position.y = -1.2 + v.rise * 1.2;
      v.group.rotation.y = Math.sin(time * 3 + i) * 0.15;
      if (v.group.visible) {
        // The face turns to the player, read whole from any view
        v.face.lookAt(camera.position);
        fadeFace(v.face.material, a.ax, a.ay, FACE_HEIGHT, FACE_R, dt);
      }
    });
    if (gateEntry) {
      const open = !table.parts.productionGate.enabled;
      const y = open ? -gateEntry.h : 0;
      gateEntry.bodies.position.y += (y - gateEntry.bodies.position.y) * Math.min(1, dt * 8);
      gateEntry.ends.position.y = gateEntry.bodies.position.y;
    }
    if (spinLeft > 0) {
      spinner.rotation.x += dt * 30;
      spinLeft -= dt;
    } else {
      spinner.rotation.x += (Math.round(spinner.rotation.x / Math.PI) * Math.PI - spinner.rotation.x) * Math.min(1, dt * 6);
    }
    // The monster Flow spins while it is on
    if (table.parts.flow.enabled) {
      flowDisc.rotation.y += dt * 4.5;
    }
    // Its author stands over the monster Flow, and sinks once it is refactored into Apex
    flowFaceSink += ((table.parts.flow.enabled ? 0 : 1) - flowFaceSink) * Math.min(1, dt * 3);
    flowFace.visible = flowFaceSink < 0.98;
    if (flowFace.visible) {
      flowFace.position.y = -flowFaceSink * 1.5 + Math.sin(time * 2.4) * 0.06;
      flowFaceDisc.lookAt(camera.position);
      fadeFace(flowFaceMaterial, TABLE.flow.x, TABLE.flow.y, FLOW_FACE_HEIGHT, FLOW_FACE_R, dt);
    }
    flowFlash = Math.max(0, flowFlash - dt * 3);
    flowMaterial.emissiveIntensity = 0.25 + flowFlash;
    terminalFlash = Math.max(0, terminalFlash - dt * 0.8);
    terminalScreen.material.color.setScalar(1 + terminalFlash);
    validateFlash = Math.max(0, validateFlash - dt * 2);
    validateMaterial.emissiveIntensity = 0.3 + validateFlash * 1.4;
    for (const q of quality) {
      q.push = Math.max(0, q.push - dt * 5);
      q.mesh.position.x = q.base + q.push * 0.1;
      q.material.emissiveIntensity = 0.2 + q.push * 1.5;
    }
    for (const toy of toys) {
      toy.object.rotation.y += dt * toy.spin;
      toy.object.position.y = toy.base + Math.sin(time * 1.6 + toy.base) * toy.bob;
      if (toy.sway) {
        toy.object.rotation.z = toy.sway * 0.3 + Math.sin(time * 0.9 + toy.sway * 10) * 0.04;
      }
    }
    // The Fiat: a ball on its road, it bounces, flashes its lights, and Cous flips his sign
    let onFiat = false;
    for (const b of physics.balls) {
      if (b.active && b.mode === "path" && b.path === table.parts.paths.integration) {
        onFiat = true;
      }
    }
    if (onFiat && !fiatRiding) {
      fiatHop = 1;
      if (cousSign) {
        cousSign.at = 1 - cousSign.at;
        cousSign.turn = 1;
      }
    }
    fiatRiding = onFiat;
    fiatHop = Math.max(0, fiatHop - dt * 1.2);
    if (fiat) {
      fiat.group.position.y = fiat.base + Math.abs(Math.sin(time * 18)) * fiatHop * 0.12;
      fiat.lights.emissiveIntensity = 0.6 + fiatHop * 4 * (Math.sin(time * 20) > 0 ? 1 : 0.2);
      for (const wheel of fiat.wheels) {
        wheel.rotation.x += dt * fiatHop * 30;
      }
    }
    if (cousSign && cousSign.turn > 0) {
      // The sign turns round on its post and shows the other Cous
      cousSign.turn = Math.max(0, cousSign.turn - dt * 2.5);
      cousSign.flag.rotation.y = cousSign.turn * Math.PI * 2;
      if (cousSign.turn < 0.5 && cousSign.material.map !== cousSign.textures[cousSign.at]) {
        cousSign.material.map = cousSign.material.emissiveMap = cousSign.textures[cousSign.at];
        cousSign.material.needsUpdate = true;
      }
    }
    // The signs standing on the table fade while a ball rolls behind them
    fadeFace(moliereMaterial, TABLE.scoop.x, TABLE.scoop.y + 0.6, 0.72, 0.8, dt);
    fadeFace(terminalScreen.material, TABLE.terminal.x, TABLE.terminal.y + 0.6, 0.95, 0.6, dt);
    victor.lookAt(camera.position);
    fadeFace(victorMaterial, 4.62, 8.2, 0.95, 0.36, dt);
    for (const dome of domes) {
      dome.material.emissiveIntensity = tilted ? 0 : showTime > 0 ? (Math.sin(time * 24 + dome.phase) > 0 ? 2.4 : 0.2) : 0.35 + Math.max(0, Math.sin(time * 2.2 + dome.phase)) * 0.9 + giFlash;
    }
    // Georges swims across and snaps his jaws (wide when hit); Romain shakes his head
    rabbit.position.x = rabbitShape.ax;
    rabbitHop = Math.max(0, rabbitHop - dt * 3);
    rabbit.position.y = TABLE.upperHeight + Math.sin(time * 2.2) * 0.04 + rabbitHop * 0.35;
    const heading = rabbitShape.vx >= 0 ? -0.35 : Math.PI + 0.35;
    rabbit.rotation.y += (heading - rabbit.rotation.y) * Math.min(1, dt * 5);
    croco.jaw.rotation.z = 0.08 + Math.max(0, Math.sin(time * 3.1)) * 0.22 + rabbitHop * 0.5;
    croco.tail.rotation.y = Math.sin(time * 5) * 0.35;
    const smUp = smShape.enabled;
    salesManager.position.y += ((smUp ? TABLE.upperHeight : TABLE.upperHeight - 1.6) - salesManager.position.y) * Math.min(1, dt * 6);
    smShake = Math.max(0, smShake - dt * 2.5);
    salesManager.rotation.y = Math.sin(time * 18) * smShake * 0.5;
    // Lights
    for (const { mesh, list } of Object.values(lightMeshes)) {
      list.forEach(({ i, l: place }, k) => {
        const l = lights[i];
        const role = lightRole[i];
        let level = lightLevel(l.mode, time);
        if (role.kind === "chevron") {
          // Three chevrons chase towards a lit shot, one after the other
          const parent = role.parent >= 0 ? lights[role.parent] : null;
          level = parent && parent.mode > 0 ? (((time * 5 - (2 - role.step)) % 3) + 3) % 3 < 1 ? 1.3 : 0.18 : 0.08;
        } else if (role.kind === "gi") {
          level = tilted ? 0.05 : 0.85 + Math.sin(time * 9 + role.seed) * 0.05 + giFlash * 0.8;
        } else if (role.kind === "mission" && attract && l.mode === 0) {
          // The table waits: the mission ring runs round
          level = ((time * 8 - role.step) % 10 + 10) % 10 < 1.6 ? 1 : 0.14;
        }
        if (showTime > 0 && role.kind !== "gi") {
          // A light show: a band of light sweeps up the table, the rest blinks
          const band = (time * 1.6) % 1;
          const at = place.y / 30;
          level = Math.abs(at - band) < 0.07 ? 1.6 : Math.sin(time * 22 + place.x) > 0.3 ? 0.9 : 0.12;
        }
        if (tilted && role.kind !== "gi") {
          level = 0.05;
        }
        // Dark inserts add almost nothing: their print shows
        if (role.kind !== "gi" && level < 0.3) {
          level *= 0.25;
        }
        color.setHex(l.color).multiplyScalar(level * (level > 0.5 ? 1.6 : 1));
        mesh.setColorAt(k, color);
      });
      mesh.instanceColor.needsUpdate = true;
    }
    placeCamera(dt);
  }

  return {
    update,
    placeCamera,
    /** The part of the table in sight: { up, from, to }, read by physics.freezeOutOfSight. */
    get sight() {
      return sight;
    },
    /** Where ball i is in the scene, into out, or null when it is not on the table. */
    ballPoint(i, out) {
      const m = ballMeshes[i];
      return m && m.group.visible ? m.group.getWorldPosition(out) : null;
    },
    /** The point of the scene over a table point, for confetti. */
    worldPoint(x, y, floor, out) {
      out.set(x, floorY(floor || 0) + 0.6, -y);
      return group.localToWorld(out);
    },
    flashBumper(i) {
      if (bumpers[i]) {
        bumpers[i].flash = 1;
      }
      giFlash = Math.max(giFlash, 0.35);
    },
    /** A light show over the whole table, for the big moments. */
    show(seconds) {
      showTime = Math.max(showTime, seconds || 1.8);
      giFlash = 1;
    },
    /** state: "hit" (a ball through it), "apex" (refactored, it stops), "spin" (back for a new ball). */
    flow(state) {
      if (state === "hit") {
        flowFlash = 1;
      } else {
        flowMaterial.map = state === "apex" ? flowTextures.apex : flowTextures.spin;
        flowMaterial.emissive.setHex(state === "apex" ? 0x1b96ff : 0xfe9339);
        flowMaterial.needsUpdate = true;
        flowFlash = 1;
      }
    },
    terminal() {
      terminalFlash = 1.5;
    },
    validate() {
      validateFlash = 1;
    },
    pushQuality(i) {
      if (quality[i]) {
        quality[i].push = 1;
      }
    },
    flashSling(i) {
      if (slingFlash[i]) {
        slingFlash[i].flash = 1;
      }
    },
    spin(n) {
      spinLeft = Math.min(1.5, spinLeft + n * 0.08);
    },
    rabbitHit() {
      rabbitHop = 1;
    },
    salesManagerHit() {
      smShake = 1;
    },
    setGiant(on) {
      giant = on;
    },
    snapCamera() {
      look.y = look.target;
    },
    dispose() {
      engine.scene.environment = null;
      for (const m of ballMeshes) {
        m.dispose();
      }
      for (const thing of disposables) {
        if (thing && thing.dispose) {
          thing.dispose();
        }
      }
      root.remove(group);
    }
  };
}

/* ---------- Geometry ---------- */

function flipperGeometry(THREE, length, r1, r2, height) {
  const shape = new THREE.Shape();
  const a = Math.asin(Math.max(-1, Math.min(1, (r1 - r2) / length)));
  shape.absarc(0, 0, r1, Math.PI / 2 + a, Math.PI * 1.5 - a, false);
  shape.absarc(length, 0, r2, -Math.PI / 2 - a, Math.PI / 2 + a, false);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 10 });
  // Flat on the table: shape y becomes -z (table y), the depth goes up
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

/** How bright a light of the rules is now: off, on, a slow blink, a fast one. */
function lightLevel(mode, time) {
  if (mode === 1) {
    return 1;
  }
  if (mode === 2) {
    return Math.sin(time * 6) > 0 ? 1 : 0.2;
  }
  if (mode === 3) {
    return Math.sin(time * 16) > 0 ? 1.15 : 0.2;
  }
  return 0.14;
}

/**
 * A plastic ramp along a curve, from u0 to u1 of its length: a floor under the
 * ball and a wall on each side. As on the arcade, it starts flat on the
 * playfield with a mouth as wide as the shot (about two balls and a half),
 * narrows to its lane, and its walls rise from nothing at the mouth.
 */
function rampGeometry(THREE, curve, u0, u1, segments) {
  const LANE = BALL_RADIUS + 0.15;
  const MOUTH = 0.6;
  // The flare covers this much of the ramp, from its mouth
  const FLARE = 1.6;
  const FLOOR = -(BALL_RADIUS + 0.03);
  const WALL = 0.32;
  const positions = [];
  const at = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();
  const rows = [];
  for (let i = 0; i <= segments; i++) {
    const u = u0 + ((u1 - u0) * i) / segments;
    curve.getPointAt(u, at);
    curve.getTangentAt(u, tangent);
    side.set(-tangent.z, 0, tangent.x).normalize();
    // Flat on the playfield at the mouth, then the ramp's own height
    const floorY = Math.max(0.005, at.y + FLOOR);
    const along = u * curve.getLength();
    const k = u0 === 0 ? Math.min(1, along / FLARE) : 1;
    const ease = k * k * (3 - 2 * k);
    const HALF = MOUTH + (LANE - MOUTH) * ease;
    const wall = WALL * (0.25 + 0.75 * ease);
    rows.push([
      [at.x - side.x * HALF, floorY + wall, at.z - side.z * HALF],
      [at.x - side.x * HALF, floorY, at.z - side.z * HALF],
      [at.x + side.x * HALF, floorY, at.z + side.z * HALF],
      [at.x + side.x * HALF, floorY + wall, at.z + side.z * HALF]
    ]);
  }
  // Three strips: the left wall, the floor, the right wall
  for (let i = 0; i < segments; i++) {
    for (let k = 0; k < 3; k++) {
      const a = rows[i][k];
      const b = rows[i][k + 1];
      const c = rows[i + 1][k];
      const d = rows[i + 1][k + 1];
      positions.push(...a, ...c, ...b, ...b, ...c, ...d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** A flat insert of any shape of art.js, one unit across. */
function insertGeometry(THREE, shape) {
  const pts = shapePoints(shape);
  if (!pts) {
    return new THREE.CircleGeometry(1, shape === "bulb" ? 12 : 24);
  }
  const outline = new THREE.Shape();
  for (let i = 0; i < pts.length; i += 2) {
    if (i === 0) {
      outline.moveTo(pts[i], pts[i + 1]);
    } else {
      outline.lineTo(pts[i], pts[i + 1]);
    }
  }
  outline.closePath();
  return new THREE.ShapeGeometry(outline);
}

/**
 * The room the table stands in, for reflections: a Martinique night, deep
 * violet over the lagoon, warm strip lights, neon glows (hibiscus, lagoon,
 * mango), the moon. The chrome ball and the rails mirror it.
 */
function paintRoom(THREE) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const c = canvas.getContext("2d");
  const g = c.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#2a1a5e");
  g.addColorStop(0.45, "#1b0b3f");
  g.addColorStop(0.55, "#0a3a5a");
  g.addColorStop(1, "#06223f");
  c.fillStyle = g;
  c.fillRect(0, 0, 512, 256);
  // Warm strip lights overhead
  c.fillStyle = "#fff1dc";
  for (let i = 0; i < 6; i++) {
    c.fillRect(20 + i * 85, 16, 52, 9);
  }
  // The moon
  c.fillStyle = "#fff6e0";
  c.beginPath();
  c.arc(400, 60, 14, 0, Math.PI * 2);
  c.fill();
  for (const [x, color] of [
    [60, "rgba(255,61,139,0.9)"],
    [190, "rgba(34,211,238,0.9)"],
    [320, "rgba(255,166,43,0.9)"],
    [460, "rgba(155,107,255,0.9)"]
  ]) {
    const n = c.createRadialGradient(x, 125, 2, x, 125, 70);
    n.addColorStop(0, color);
    n.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = n;
    c.fillRect(x - 70, 55, 140, 140);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** A printed slingshot plastic: hibiscus to lagoon, a white edge, a hibiscus flower. */
function paintPlastic(THREE) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const c = canvas.getContext("2d");
  const g = c.createLinearGradient(0, 0, 256, 256);
  g.addColorStop(0, "#ff7ab8");
  g.addColorStop(0.5, "#ff2d7a");
  g.addColorStop(1, "#0a8fb0");
  c.fillStyle = g;
  c.fillRect(0, 0, 256, 256);
  c.strokeStyle = "rgba(255,255,255,0.95)";
  c.lineWidth = 14;
  c.strokeRect(7, 7, 242, 242);
  // A hibiscus: five petals round a yellow heart
  c.save();
  c.translate(150, 120);
  c.fillStyle = "rgba(255,230,240,0.75)";
  for (let i = 0; i < 5; i++) {
    c.rotate((Math.PI * 2) / 5);
    c.beginPath();
    c.ellipse(0, -34, 22, 34, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = "#ffd23f";
  c.beginPath();
  c.arc(0, 0, 10, 0, Math.PI * 2);
  c.fill();
  c.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* ---------- Toys built from primitives ---------- */

/** The little Fiat Panda: a boxy car, its windows, four wheels, headlights. { group, wheels, lights }. */
function buildFiat(THREE, keep) {
  const group = new THREE.Group();
  const paint = keep(new THREE.MeshStandardMaterial({ color: 0xd8312c, metalness: 0.35, roughness: 0.3 }));
  const glass = keep(new THREE.MeshStandardMaterial({ color: 0x14243a, metalness: 0.6, roughness: 0.1 }));
  const black = keep(new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: 0.7 }));
  const lights = keep(new THREE.MeshStandardMaterial({ color: 0xfff6c8, emissive: 0xfff2a8, emissiveIntensity: 0.6 }));
  const cube = keep(new THREE.BoxGeometry(1, 1, 1));
  const wheelGeometry = keep(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 12));
  const part = (material, sx, sy, sz, x, y, z) => {
    const m = new THREE.Mesh(cube, material);
    m.scale.set(sx, sy, sz);
    m.position.set(x, y, z);
    group.add(m);
    return m;
  };
  // Length along z (the nose at +z), the boxy cabin of the old Panda
  part(paint, 0.5, 0.2, 0.92, 0, 0.2, 0);
  part(paint, 0.48, 0.2, 0.55, 0, 0.4, -0.06);
  part(glass, 0.5, 0.14, 0.4, 0, 0.42, -0.04);
  part(glass, 0.44, 0.13, 0.02, 0, 0.42, 0.22);
  part(black, 0.54, 0.07, 0.06, 0, 0.13, 0.47);
  part(black, 0.54, 0.07, 0.06, 0, 0.13, -0.47);
  part(lights, 0.1, 0.06, 0.02, -0.16, 0.24, 0.465);
  part(lights, 0.1, 0.06, 0.02, 0.16, 0.24, 0.465);
  const wheels = [];
  for (const [x, z] of [
    [-0.25, 0.28],
    [0.25, 0.28],
    [-0.25, -0.28],
    [0.25, -0.28]
  ]) {
    const w = new THREE.Mesh(wheelGeometry, black);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.11, z);
    group.add(w);
    wheels.push(w);
  }
  group.scale.setScalar(0.85);
  return { group, wheels, lights, base: 0 };
}

/** The giant ti-punch glass: clear glass, golden rum, a lime wedge, a straw. */
function buildTiPunch(THREE, keep) {
  const group = new THREE.Group();
  const glass = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.52, 0.42, 1.45, 24, 1, true)), keep(new THREE.MeshStandardMaterial({ color: 0xe8fbff, metalness: 0.1, roughness: 0.04, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })));
  glass.position.y = 0.72;
  const bottom = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 24)), keep(new THREE.MeshStandardMaterial({ color: 0xe8fbff, roughness: 0.05, transparent: true, opacity: 0.5 })));
  bottom.position.y = 0.05;
  const rum = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.47, 0.42, 0.8, 24)), keep(new THREE.MeshStandardMaterial({ color: 0xe08a2a, emissive: 0x8a3c00, emissiveIntensity: 0.45, roughness: 0.15, transparent: true, opacity: 0.82 })));
  rum.position.y = 0.5;
  const lime = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.26, 0.26, 0.07, 16, 1, false, 0, Math.PI)), keep(new THREE.MeshStandardMaterial({ color: 0x9be15d, emissive: 0x3a7a10, emissiveIntensity: 0.35, roughness: 0.4 })));
  lime.rotation.set(Math.PI / 2, 0, 0.4);
  lime.position.set(0.32, 1.42, 0.25);
  const straw = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.035, 0.035, 1.6, 8)), keep(new THREE.MeshStandardMaterial({ color: 0xff3d8b, emissive: 0xff3d8b, emissiveIntensity: 0.3 })));
  straw.rotation.z = -0.3;
  straw.position.set(0.12, 1.15, -0.1);
  group.add(bottom, rum, glass, lime, straw);
  return group;
}

/** Georges the croco, low-poly: body, head and jaws (+x is his nose), eyes, ridges, a tail. */
function buildCroco(THREE, keep) {
  const group = new THREE.Group();
  const green = keep(new THREE.MeshStandardMaterial({ color: 0x2f9e44, roughness: 0.55, flatShading: true }));
  const belly = keep(new THREE.MeshStandardMaterial({ color: 0xb8e07a, roughness: 0.6, flatShading: true }));
  const white = keep(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }));
  const black = keep(new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.2 }));
  const pink = keep(new THREE.MeshStandardMaterial({ color: 0xff7aa8, roughness: 0.5 }));
  const cube = keep(new THREE.BoxGeometry(1, 1, 1));
  const ball = keep(new THREE.SphereGeometry(1, 10, 8));
  const cone = keep(new THREE.ConeGeometry(1, 1, 5));
  const body = new THREE.Mesh(keep(new THREE.SphereGeometry(1, 8, 6)), green);
  body.scale.set(0.62, 0.26, 0.4);
  body.position.y = 0.3;
  const under = new THREE.Mesh(cube, belly);
  under.scale.set(0.9, 0.08, 0.5);
  under.position.y = 0.12;
  // The head: the upper jaw with the eyes, the lower jaw that snaps
  const head = new THREE.Group();
  head.position.set(0.55, 0.32, 0);
  const upperJaw = new THREE.Mesh(cube, green);
  upperJaw.scale.set(0.55, 0.13, 0.32);
  upperJaw.position.set(0.22, 0.03, 0);
  const jaw = new THREE.Group();
  const lowerJaw = new THREE.Mesh(cube, belly);
  lowerJaw.scale.set(0.52, 0.08, 0.3);
  lowerJaw.position.set(0.22, -0.04, 0);
  const tongue = new THREE.Mesh(cube, pink);
  tongue.scale.set(0.3, 0.02, 0.16);
  tongue.position.set(0.2, 0.0, 0);
  jaw.add(lowerJaw, tongue);
  jaw.position.set(0, -0.05, 0);
  head.add(upperJaw, jaw);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(ball, white);
    eye.scale.setScalar(0.09);
    eye.position.set(0.02, 0.14, side * 0.1);
    const pupil = new THREE.Mesh(ball, black);
    pupil.scale.setScalar(0.045);
    pupil.position.set(0.08, 0.16, side * 0.11);
    const tooth = new THREE.Mesh(cone, white);
    tooth.scale.set(0.025, 0.06, 0.025);
    tooth.rotation.x = Math.PI;
    tooth.position.set(0.36, -0.06, side * 0.13);
    head.add(eye, pupil, tooth);
  }
  // The tail, that swishes
  const tail = new THREE.Group();
  tail.position.set(-0.5, 0.26, 0);
  const tailCone = new THREE.Mesh(cone, green);
  tailCone.scale.set(0.16, 0.6, 0.12);
  tailCone.rotation.z = Math.PI / 2;
  tailCone.position.x = -0.3;
  tail.add(tailCone);
  // Ridges along the back, four little feet
  for (let i = 0; i < 4; i++) {
    const ridge = new THREE.Mesh(cone, green);
    ridge.scale.set(0.05, 0.1, 0.05);
    ridge.position.set(-0.3 + i * 0.2, 0.55, 0);
    group.add(ridge);
  }
  for (const [x, z] of [
    [0.3, 0.32],
    [0.3, -0.32],
    [-0.3, 0.32],
    [-0.3, -0.32]
  ]) {
    const foot = new THREE.Mesh(cube, green);
    foot.scale.set(0.14, 0.12, 0.12);
    foot.position.set(x, 0.08, z);
    group.add(foot);
  }
  group.add(body, under, head, tail);
  group.scale.setScalar(1.05);
  return { group, jaw, tail };
}

/** A palm tree: a leaning trunk, a crown of fronds. */
function buildPalm(THREE, keep, lean) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.07, 0.13, 2.4, 7)), keep(new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.8, flatShading: true })));
  trunk.position.y = 1.2;
  group.add(trunk);
  const frond = keep(new THREE.ConeGeometry(0.16, 1.2, 4));
  const leaf = keep(new THREE.MeshStandardMaterial({ color: 0x1f8a4c, emissive: 0x0a4a2a, emissiveIntensity: 0.4, roughness: 0.6, flatShading: true }));
  for (let i = 0; i < 7; i++) {
    const f = new THREE.Mesh(frond, leaf);
    const a = (i / 7) * Math.PI * 2;
    f.position.set(Math.cos(a) * 0.45, 2.35, Math.sin(a) * 0.45);
    f.rotation.set(Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25);
    f.scale.set(1, 1, 0.35);
    group.add(f);
  }
  group.rotation.z = lean;
  return group;
}
