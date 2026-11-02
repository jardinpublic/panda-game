// Engine from Pipeline Pinball (sfdx-hardis-training), same author.
/*
 * The ball of Eul' Flipper: a chrome steel ball, as on the arcade. A mirror
 * finish that reflects the room (scene.environment, the neon Martinique night
 * of view.js), plus its own painted reflection so it reads as chrome even
 * where the environment is dark: a bright sky band, a dark horizon, two hot
 * highlights. The painted reflection does not turn with the ball (a real
 * reflection stays put while the ball rolls); the body still turns, with a
 * faint brushed band that shows it rolling.
 */

import { BALL_RADIUS } from "./physics.js";

let shared = null;

function sharedParts(THREE) {
  if (shared) {
    shared.users++;
    return shared;
  }
  // The reflection painted on the ball, seen from the player: sky above, the
  // playfield's neon below, a dark horizon band between
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const c = canvas.getContext("2d");
  const g = c.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.3, "#cfd8ff");
  g.addColorStop(0.47, "#5a5f7a");
  g.addColorStop(0.53, "#1a1530");
  g.addColorStop(0.7, "#3a2a6a");
  g.addColorStop(0.85, "#ff7ab8");
  g.addColorStop(1, "#22d3ee");
  c.fillStyle = g;
  c.fillRect(0, 0, 128, 128);
  const reflection = new THREE.CanvasTexture(canvas);
  reflection.colorSpace = THREE.SRGBColorSpace;
  // The steel under it: a brushed band that shows the ball rolling
  const steelCanvas = document.createElement("canvas");
  steelCanvas.width = 128;
  steelCanvas.height = 64;
  const s = steelCanvas.getContext("2d");
  s.fillStyle = "#e9eef5";
  s.fillRect(0, 0, 128, 64);
  s.fillStyle = "#b9c3d1";
  s.fillRect(0, 29, 128, 6);
  const steel = new THREE.CanvasTexture(steelCanvas);
  steel.colorSpace = THREE.SRGBColorSpace;
  shared = {
    users: 1,
    reflection,
    steel,
    sphere: new THREE.SphereGeometry(1, 32, 20),
    small: new THREE.SphereGeometry(1, 10, 8),
    body: new THREE.MeshStandardMaterial({ map: steel, color: 0xffffff, metalness: 1, roughness: 0.06, envMapIntensity: 1.6 }),
    // The painted reflection: a shell that faces the camera, added over the steel
    shine: new THREE.MeshBasicMaterial({ map: reflection, transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }),
    spark: new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
    dispose() {
      shared.users--;
      if (shared.users > 0) {
        return;
      }
      for (const thing of [shared.reflection, shared.steel, shared.sphere, shared.small, shared.body, shared.shine, shared.spark]) {
        thing.dispose();
      }
      shared = null;
    }
  };
  return shared;
}

/** One ball: { group (placed by the view), body (turned as it rolls), update(dt), dispose() }. */
export function createBallMesh(THREE) {
  const parts = sharedParts(THREE);
  const r = BALL_RADIUS;
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);
  const steel = new THREE.Mesh(parts.sphere, parts.body);
  steel.scale.setScalar(r);
  steel.castShadow = true;
  body.add(steel);
  // The reflection stays upright, facing the player (it does not roll)
  const shine = new THREE.Mesh(parts.sphere, parts.shine);
  shine.scale.setScalar(r * 1.004);
  shine.renderOrder = 3;
  group.add(shine);
  // Two hot highlights from the lamps overhead
  const spark = new THREE.Mesh(parts.small, parts.spark);
  spark.scale.setScalar(r * 0.16);
  spark.position.set(-r * 0.35, r * 0.78, r * 0.38);
  group.add(spark);
  const spark2 = new THREE.Mesh(parts.small, parts.spark);
  spark2.scale.setScalar(r * 0.07);
  spark2.position.set(r * 0.42, r * 0.7, r * 0.5);
  group.add(spark2);
  let disposed = false;
  return {
    group,
    body,
    update() {},
    dispose() {
      if (!disposed) {
        disposed = true;
        parts.dispose();
      }
    }
  };
}
