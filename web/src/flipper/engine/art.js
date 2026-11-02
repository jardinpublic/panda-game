// Engine from Pipeline Pinball (sfdx-hardis-training), same author.
/*
 * The printed art of Eul' Flipper, painted on canvases: Martinique by night.
 * The playfield (a deep violet sky over the lagoon, stars, Diamond Rock and
 * the palms in silhouette with a neon rim, madras panels by the slingshots,
 * the Fiat road to its ramp, a dark bezel and a muted print under every
 * insert, so a lit insert glows through its own print), the silo roof, the
 * apron with Panda, the title and two rule cards, the ramp signs with the
 * friends' faces, the bumper caps (Babar, Mamar, Greg), Le Molière's neon,
 * eul' barbecue, eul' cyclone, the 8.6 cans and the T-A-T-O-U drops.
 *
 * The insert shapes live here too (shapePoints), so the painted bezel and the
 * lit insert of view.js are the same shape. Faces are the cast SVGs, drawn
 * into the canvas once they load (the texture updates then).
 */
import { TABLE } from "./layout.js";
import { rounded, fitText } from "../support/painter.js";
import { TABLE_TEXTS } from "../texts-table.js";

export const NIGHT = {
  violet: "#1b0b3f",
  indigo: "#2a1670",
  lagoon: "#0a5d7a",
  deep: "#06223f",
  cyan: "#22d3ee",
  mango: "#ffa62b",
  hibiscus: "#ff3d8b",
  lime: "#9be15d",
  gold: "#ffd23f"
};

/** The picture of a friend of the cast (web/public/cast). */
export function castUrl(id) {
  const env = typeof import.meta !== "undefined" && import.meta.env;
  const base = (env && env.BASE_URL) || "./";
  return base + "cast/" + id + ".svg";
}

function guessLang(t) {
  try {
    if (typeof t !== "function") {
      return null;
    }
    // The flipper's own translator answers its keys in the player's language
    const s = t("tbTitle");
    if (s && s !== "tbTitle") {
      return null;
    }
    let probe = t("pbFieldExtraBall") || "";
    if (probe === "pbFieldExtraBall") {
      probe = "";
    }
    if (/bille|balle/i.test(probe)) {
      return "fr";
    }
    if (/ball/i.test(probe)) {
      return "en";
    }
  } catch (e) {
    // no translator: fall through
  }
  const html = typeof document !== "undefined" && document.documentElement && document.documentElement.lang;
  return html && /^en/i.test(html) ? "en" : "fr";
}

/** A text of the table: the translator's, else TABLE_TEXTS (before index.js merges them). */
export function tableText(t, key) {
  let s = "";
  try {
    s = typeof t === "function" ? t(key) : "";
  } catch (e) {
    s = "";
  }
  if (typeof s === "string" && s && s !== key) {
    return s;
  }
  const lang = (typeof t === "function" && guessLang(t)) || "fr";
  const own = TABLE_TEXTS[lang] || TABLE_TEXTS.fr;
  const v = own[key] !== undefined ? own[key] : TABLE_TEXTS.en[key];
  return str(v !== undefined ? v : key);
}

/** Any value as a string: never undefined, so string methods are safe. */
function str(v) {
  return v === undefined || v === null ? "" : String(v);
}

/** The outline of an insert shape, in unit coordinates (y up), or null for a circle. */
export function shapePoints(shape) {
  switch (shape) {
    case "delta":
      // The arrowhead of the arcade tables, notched at its base
      return [0, 1, 0.86, -0.62, 0, -0.2, -0.86, -0.62];
    case "hex": {
      const out = [];
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 2 + (i * Math.PI) / 3;
        out.push(Math.cos(a), Math.sin(a));
      }
      return out;
    }
    case "star": {
      const out = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 1 : 0.45;
        const a = Math.PI / 2 + (i * Math.PI) / 5;
        out.push(Math.cos(a) * r, Math.sin(a) * r);
      }
      return out;
    }
    case "chevron":
      return [0, 0.9, 1, -0.2, 0.62, -0.55, 0, 0.12, -0.62, -0.55, -1, -0.2];
    default:
      return null;
  }
}

function seeded(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function texture(THREE, canvas, tier) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = tier > 1 ? 8 : 2;
  return tex;
}

function hex(color, k) {
  const r = Math.min(255, Math.round(((color >> 16) & 255) * k));
  const g = Math.min(255, Math.round(((color >> 8) & 255) * k));
  const b = Math.min(255, Math.round((color & 255) * k));
  return "rgb(" + r + "," + g + "," + b + ")";
}

function canvasOf(w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return [canvas, canvas.getContext("2d")];
}

/**
 * A round face in a ring, drawn now as a coloured disc, then as the portrait
 * once it loads (tex.needsUpdate). An SVG straight on a texture draws nothing
 * in WebGPU: always through a canvas.
 */
function face(c, tex, url, x, y, r, ring) {
  c.save();
  c.beginPath();
  c.arc(x, y, r + r * 0.09, 0, Math.PI * 2);
  c.fillStyle = ring || "#ffffff";
  c.fill();
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = "#fff4e0";
  c.fill();
  c.restore();
  if (!url || typeof Image === "undefined") {
    return;
  }
  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    c.save();
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.clip();
    c.drawImage(img, x - r, y - r, r * 2, r * 2);
    c.restore();
    if (tex) {
      tex.needsUpdate = true;
    }
  };
  img.onerror = () => {};
  img.src = url;
}

/** Neon text: a coloured glow under a white-hot core. */
function neonText(c, label, x, y, maxWidth, size, color) {
  const text = str(label);
  c.save();
  c.shadowColor = color;
  c.shadowBlur = size * 0.6;
  c.fillStyle = color;
  fitText(c, text, x, y, maxWidth, size, "900");
  c.shadowBlur = size * 0.25;
  c.fillStyle = "#ffffff";
  fitText(c, text, x, y, maxWidth, size * 0.96, "900");
  c.restore();
}

/** Madras: a warm plaid of the Antilles, crossing bands over a base colour. */
export function madras(c, x, y, w, h, unit) {
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.fillStyle = "#e8341c";
  c.fillRect(x, y, w, h);
  const bands = [
    ["rgba(255,210,63,0.75)", 0.9],
    ["rgba(28,140,70,0.7)", 0.5],
    ["rgba(255,140,0,0.65)", 0.35],
    ["rgba(30,60,170,0.55)", 0.25],
    ["rgba(255,255,255,0.5)", 0.07],
    ["rgba(130,0,60,0.55)", 0.4]
  ];
  const step = unit * 3.2;
  let off = 0;
  for (const [color, k] of bands) {
    c.fillStyle = color;
    for (let p = -step; p < Math.max(w, h) + step; p += step) {
      c.fillRect(x + p + off, y, unit * k, h);
      c.fillRect(x, y + p + off, w, unit * k);
    }
    off += unit * (k + 0.18);
  }
  c.restore();
}

/** A palm in silhouette: a curved trunk, fronds. */
function palm(c, x, y, h, lean, color, rim) {
  c.save();
  c.lineCap = "round";
  const tx = x + lean * h;
  const ty = y - h;
  for (const [stroke, w] of [
    [rim, h * 0.075],
    [color, h * 0.055]
  ]) {
    c.strokeStyle = stroke;
    c.lineWidth = w;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + lean * h * 0.15, y - h * 0.6, tx, ty);
    c.stroke();
  }
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * 0.95 + (i / 6) * Math.PI * 0.9 + (i % 2 ? 0.08 : -0.05);
    const len = h * (0.5 + (i % 3) * 0.08);
    const ex = tx + Math.cos(a) * len;
    const ey = ty + Math.sin(a) * len * 0.55 + len * 0.28;
    c.fillStyle = color;
    c.strokeStyle = rim;
    c.lineWidth = h * 0.012;
    c.beginPath();
    c.moveTo(tx, ty);
    c.quadraticCurveTo((tx + ex) / 2 + Math.sin(a) * len * 0.15, (ty + ey) / 2 - len * 0.32, ex, ey);
    c.quadraticCurveTo((tx + ex) / 2, (ty + ey) / 2 - len * 0.05, tx, ty);
    c.fill();
    c.stroke();
  }
  c.restore();
}

/** Stars over a sky band. */
function stars(c, x0, y0, w, h, count, seed) {
  const rnd = seeded(seed);
  for (let i = 0; i < count; i++) {
    const s = rnd() < 0.07 ? 3 : rnd() < 0.3 ? 2 : 1.2;
    c.fillStyle = "rgba(255," + (230 + Math.round(rnd() * 25)) + ",255," + (0.35 + rnd() * 0.6) + ")";
    c.fillRect(x0 + rnd() * w, y0 + rnd() * h, s, s);
  }
}

/** A shape path at a point: insert shapes, or a circle. */
function insertPath(c, shape, x, y, r, angle) {
  const pts = shapePoints(shape === "bulb" ? "round" : shape);
  c.beginPath();
  if (!pts) {
    c.arc(x, y, r, 0, Math.PI * 2);
    return;
  }
  const cos = Math.cos(-angle || 0);
  const sin = Math.sin(-angle || 0);
  for (let i = 0; i < pts.length; i += 2) {
    const px = pts[i] * cos - pts[i + 1] * sin;
    const py = pts[i] * sin + pts[i + 1] * cos;
    const X = x + px * r;
    const Y = y - py * r;
    if (i === 0) {
      c.moveTo(X, Y);
    } else {
      c.lineTo(X, Y);
    }
  }
  c.closePath();
}

/** The playfield, printed. lights: the inserts of layout.js, painted with their bezels and labels. */
export function paintField(THREE, t, lights, tier) {
  const width = TABLE.right - TABLE.left + 0.4;
  const y0 = -1.6;
  const length = TABLE.top + 0.3 - y0;
  const scale = tier > 1 ? 96 : 72;
  const [canvas, c] = canvasOf(Math.round(width * scale), Math.round(length * scale));
  const X = (x) => (x - (TABLE.left - 0.2)) * scale;
  const Y = (y) => canvas.height - (y - y0) * scale;
  const U = (u) => u * scale;
  const W = canvas.width;
  const tx = (key) => tableText(t, key);

  // The night: deep violet at the top, the lagoon at the flippers
  const sky = c.createLinearGradient(0, Y(TABLE.top), 0, Y(y0));
  sky.addColorStop(0, "#14062e");
  sky.addColorStop(0.28, NIGHT.violet);
  sky.addColorStop(0.42, NIGHT.indigo);
  sky.addColorStop(0.5, "#16357e");
  sky.addColorStop(0.75, NIGHT.lagoon);
  sky.addColorStop(1, NIGHT.deep);
  c.fillStyle = sky;
  c.fillRect(0, 0, W, canvas.height);
  // Soft neon hazes
  for (const [x, y, r, tint] of [
    [-3, 19, 4.5, "255,61,139"],
    [3.5, 20, 4, "155,107,255"],
    [0, 12, 5, "34,211,238"],
    [-3.5, 6, 4, "34,211,238"],
    [3.5, 5, 4, "255,166,43"]
  ]) {
    const n = c.createRadialGradient(X(x), Y(y), 0, X(x), Y(y), U(r));
    n.addColorStop(0, "rgba(" + tint + ",0.22)");
    n.addColorStop(1, "rgba(" + tint + ",0)");
    c.fillStyle = n;
    c.fillRect(0, 0, W, canvas.height);
  }
  stars(c, 0, Y(TABLE.top + 0.3), W, Y(14.5) - Y(TABLE.top + 0.3), Math.round(W * 0.35), 11);
  // The moon over the top lanes, and its path on the lagoon
  const moon = c.createRadialGradient(X(3.6), Y(21.4), U(0.1), X(3.6), Y(21.4), U(1.4));
  moon.addColorStop(0, "rgba(255,246,220,0.95)");
  moon.addColorStop(0.35, "rgba(255,240,200,0.55)");
  moon.addColorStop(1, "rgba(255,240,200,0)");
  c.fillStyle = moon;
  c.fillRect(X(2.2), Y(22.8), U(2.8), U(2.8));

  // The horizon: Diamond Rock out at sea, palms on both shores
  const HORIZON = 14.4;
  c.save();
  c.fillStyle = "#0d0526";
  c.strokeStyle = "rgba(34,211,238,0.85)";
  c.lineWidth = U(0.05);
  c.shadowColor = NIGHT.cyan;
  c.shadowBlur = U(0.2);
  c.beginPath();
  c.moveTo(X(-3.3 + 3.6), Y(HORIZON));
  c.bezierCurveTo(X(-3.0 + 3.6), Y(HORIZON + 1.2), X(-2.4 + 3.6), Y(HORIZON + 3.6), X(-1.5 + 3.6), Y(HORIZON + 4.1));
  c.bezierCurveTo(X(-1.0 + 3.6), Y(HORIZON + 4.3), X(-0.6 + 3.6), Y(HORIZON + 3.4), X(-0.35 + 3.6), Y(HORIZON + 2.4));
  c.bezierCurveTo(X(-0.1 + 3.6), Y(HORIZON + 1.6), X(0.4 + 3.6), Y(HORIZON + 0.8), X(0.7 + 3.6), Y(HORIZON));
  c.closePath();
  c.fill();
  c.stroke();
  c.restore();
  // The sea line
  c.fillStyle = "rgba(34,211,238,0.35)";
  c.fillRect(X(-5), Y(HORIZON) - U(0.025), U(10), U(0.05));
  palm(c, X(-4.1), Y(HORIZON - 0.4), U(3.6), 0.12, "#0d0526", "rgba(255,61,139,0.85)");
  palm(c, X(4.2), Y(HORIZON - 0.2), U(3.2), -0.15, "#0d0526", "rgba(255,166,43,0.85)");
  palm(c, X(3.2), Y(HORIZON - 0.4), U(2.2), 0.1, "#120836", "rgba(155,107,255,0.7)");
  // The lagoon: the moon's path, waves
  c.save();
  const rnd = seeded(4);
  for (let y = HORIZON - 0.2; y > 2; y -= 0.32) {
    const k = (HORIZON - y) / HORIZON;
    for (let i = 0; i < 5; i++) {
      const x = 3.4 + (rnd() - 0.5) * (0.6 + k * 4) - k * 2.2;
      c.fillStyle = "rgba(255,240,200," + (0.22 * (1 - k)) + ")";
      c.fillRect(X(x), Y(y), U(0.3 + rnd() * 0.8), U(0.035));
    }
    c.strokeStyle = "rgba(120,240,255," + (0.08 + 0.05 * (1 - k)) + ")";
    c.lineWidth = U(0.025);
    c.beginPath();
    for (let x = -5; x <= 5.2; x += 0.5) {
      const yy = y + Math.sin(x * 2.1 + y * 3) * 0.05;
      if (x === -5) {
        c.moveTo(X(x), Y(yy));
      } else {
        c.lineTo(X(x), Y(yy));
      }
    }
    c.stroke();
  }
  c.restore();

  // The zones of the shots, round their mouths: the rhum ramp (hibiscus), the
  // Fiat road (mango), the silo (lagoon cyan), Le Molière (pink neon)
  const zone = (x0, y0z, x1, y1, color, open) => {
    rounded(c, X(x0), Y(y1), U(x1 - x0), U(y1 - y0z), U(open ? 0 : 0.45));
    const g = c.createLinearGradient(0, Y(y1), 0, Y(y0z));
    g.addColorStop(0, color.replace("A", "0.5"));
    g.addColorStop(1, color.replace("A", open ? "0" : "0.08"));
    c.fillStyle = g;
    c.fill();
    if (!open) {
      c.lineWidth = U(0.05);
      c.strokeStyle = color.replace("A", "0.8");
      c.stroke();
    }
  };
  // Table v2: the loop's lane (hibiscus), the coconut's lane (lime)
  zone(-4.55, 10.65, -3.35, 13.2, "rgba(255,61,139,A)", true);
  zone(3.95, 10.3, 4.95, 13.3, "rgba(155,225,93,A)");

  // The beach in the middle where the land crabs walk: sand, crab tracks
  c.save();
  const beach = c.createRadialGradient(X(0), Y(9), U(0.4), X(0), Y(9), U(3.6));
  beach.addColorStop(0, "rgba(255,214,150,0.32)");
  beach.addColorStop(0.7, "rgba(255,190,120,0.16)");
  beach.addColorStop(1, "rgba(255,190,120,0)");
  c.fillStyle = beach;
  c.beginPath();
  c.ellipse(X(0), Y(9), U(3.4), U(1.6), 0, 0, Math.PI * 2);
  c.fill();
  const trk = seeded(9);
  c.fillStyle = "rgba(60,30,90,0.35)";
  for (let i = 0; i < 70; i++) {
    const x = -2.6 + trk() * 5.2;
    const y = 7.8 + trk() * 2.4;
    c.fillRect(X(x), Y(y), U(0.05), U(0.05));
    c.fillRect(X(x + 0.12), Y(y + 0.03), U(0.05), U(0.05));
  }
  c.restore();

  // La Montagne Pelée: lava flows run from the foot of the volcano down the table
  c.save();
  c.lineCap = "round";
  for (const [dx, len, w] of [
    [-1.3, 2.4, 0.16],
    [-0.5, 1.6, 0.12],
    [0.55, 1.9, 0.14],
    [1.1, 1.2, 0.1]
  ]) {
    const g = c.createLinearGradient(X(TABLE.volcano.x), Y(TABLE.volcano.y - 0.6), X(TABLE.volcano.x + dx), Y(TABLE.volcano.y - 0.6 - len));
    g.addColorStop(0, "rgba(255,110,30,0.75)");
    g.addColorStop(1, "rgba(255,40,0,0)");
    c.strokeStyle = g;
    c.lineWidth = U(w);
    c.shadowColor = "rgba(255,80,0,0.9)";
    c.shadowBlur = U(0.15);
    c.beginPath();
    c.moveTo(X(TABLE.volcano.x + dx * 0.4), Y(TABLE.volcano.y - 0.7));
    c.quadraticCurveTo(X(TABLE.volcano.x + dx * 0.9), Y(TABLE.volcano.y - 0.7 - len * 0.5), X(TABLE.volcano.x + dx), Y(TABLE.volcano.y - 0.7 - len));
    c.stroke();
  }
  // A glow round its foot
  const foot = c.createRadialGradient(X(TABLE.volcano.x), Y(TABLE.volcano.y), U(0.8), X(TABLE.volcano.x), Y(TABLE.volcano.y), U(2.1));
  foot.addColorStop(0, "rgba(255,90,20,0.45)");
  foot.addColorStop(1, "rgba(255,90,20,0)");
  c.fillStyle = foot;
  c.fillRect(X(TABLE.volcano.x - 2.2), Y(TABLE.volcano.y + 2.2), U(4.4), U(4.4));
  c.restore();

  // Le Molière: a red carpet up to the door of the club, between ropes
  c.save();
  c.fillStyle = "rgba(200,20,60,0.55)";
  c.fillRect(X(TABLE.moliere.x - 0.55), Y(12.7), U(1.1), U(1.5));
  c.strokeStyle = "rgba(255,210,63,0.8)";
  c.lineWidth = U(0.04);
  c.strokeRect(X(TABLE.moliere.x - 0.55), Y(12.7), U(1.1), U(1.5));
  c.restore();

  // The rum cellar: a trapdoor of barrel staves round the hole
  c.save();
  c.fillStyle = "rgba(120,60,20,0.75)";
  c.beginPath();
  c.arc(X(TABLE.cellar.x), Y(TABLE.cellar.y), U(0.75), 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "rgba(255,166,43,0.7)";
  c.lineWidth = U(0.04);
  for (let k = -2; k <= 2; k++) {
    c.beginPath();
    c.moveTo(X(TABLE.cellar.x + k * 0.26), Y(TABLE.cellar.y - 0.7));
    c.lineTo(X(TABLE.cellar.x + k * 0.26), Y(TABLE.cellar.y + 0.7));
    c.stroke();
  }
  c.restore();

  // Mamar's ball: a football pitch's centre circle round the magnet
  c.save();
  c.strokeStyle = "rgba(255,255,255,0.55)";
  c.lineWidth = U(0.04);
  c.beginPath();
  c.arc(X(TABLE.magnet.x), Y(TABLE.magnet.y), U(0.95), 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = "rgba(40,160,80,0.25)";
  c.fill();
  c.restore();

  // The Fiat road: asphalt from the flippers to the Fiat ramp, a dashed line
  c.save();
  c.lineCap = "round";
  const road = () => {
    c.beginPath();
    c.moveTo(X(0.9), Y(6.9));
    c.bezierCurveTo(X(1.8), Y(7.5), X(2.7), Y(8.4), X(2.9), Y(10.9));
  };
  c.strokeStyle = "rgba(20,14,30,0.75)";
  c.lineWidth = U(0.62);
  road();
  c.stroke();
  c.strokeStyle = "rgba(255,166,43,0.55)";
  c.lineWidth = U(0.04);
  c.setLineDash([U(0.22), U(0.2)]);
  road();
  c.stroke();
  c.restore();

  // The lower playfield: madras panels behind the slingshots and the inlanes
  for (const side of [-1, 1]) {
    c.save();
    c.beginPath();
    c.moveTo(X(side * 5), Y(-1.6));
    c.lineTo(X(side * 5), Y(7.1));
    c.lineTo(X(side * 4.0), Y(6.5));
    c.lineTo(X(side * 2.3), Y(2.4));
    c.lineTo(X(side * 0.6), Y(-1.6));
    c.closePath();
    c.clip();
    madras(c, 0, Y(7.2), W, Y(-1.6) - Y(7.2), U(0.42));
    c.fillStyle = "rgba(10,4,30,0.5)";
    c.fillRect(0, 0, W, canvas.height);
    c.restore();
  }
  // Madras strips along the outer walls
  madras(c, X(-5.2), Y(TABLE.arc.y), U(0.22), Y(-1.6) - Y(TABLE.arc.y), U(0.18));
  // Outlane and inlane arrows
  c.fillStyle = "rgba(255,255,255,0.4)";
  for (const [x, y] of [
    [-3.55, 5.3],
    [3.55, 5.3],
    [-4.5, 5.3],
    [4.5, 5.3]
  ]) {
    insertPath(c, "chevron", X(x), Y(y), U(0.22), Math.PI);
    c.fill();
  }

  // Every insert: a dark bezel, a muted print, its label or its letter
  c.textAlign = "center";
  c.textBaseline = "middle";
  for (const l of lights) {
    if (l.floor !== 0 || l.shape === "bulb") {
      continue;
    }
    const x = X(l.x);
    const y = Y(l.y);
    const r = U(l.size);
    insertPath(c, l.shape, x, y, r * 1.28, l.angle);
    c.fillStyle = "#0a0418";
    c.fill();
    c.lineWidth = U(0.03);
    c.strokeStyle = "rgba(255,255,255,0.5)";
    c.stroke();
    insertPath(c, l.shape, x, y, r, l.angle);
    const g = c.createRadialGradient(x, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, hex(l.color, 0.6));
    g.addColorStop(1, hex(l.color, 0.25));
    c.fillStyle = g;
    c.fill();
    if (l.text) {
      c.fillStyle = "#ffffff";
      c.save();
      c.shadowColor = "rgba(0,0,0,0.9)";
      c.shadowBlur = U(0.04);
      fitText(c, l.text, x, y + U(0.01), r * 1.6, r * (l.text.length > 1 ? 0.8 : 1.15), "900");
      c.restore();
    }
    if (l.label) {
      const text = tableText(t, l.label);
      c.fillStyle = "#ffffff";
      if (l.shape === "hex" || l.labelAt === "inside") {
        const words = text.split(" ");
        const lines = words.length > 1 && text.length > 9 ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")] : [text];
        lines.forEach((part, i) => fitText(c, part.toUpperCase(), x, y + (i - (lines.length - 1) / 2) * U(0.17), r * 1.5, U(0.16), "900"));
      } else {
        fitText(c, text.toUpperCase(), x, y + (l.labelAt === "above" ? -r * 1.9 : r * 1.75), U(l.labelWidth || 1.9), U(0.15), "900");
      }
    }
  }

  // The words of the playfield
  const label = (text, x, y, size, color, angle, max) => {
    c.save();
    c.translate(X(x), Y(y));
    c.rotate(angle || 0);
    c.fillStyle = color;
    c.shadowColor = "rgba(0,0,0,0.85)";
    c.shadowBlur = U(0.06);
    fitText(c, text, 0, 0, U(max || 2.6), U(size), "900");
    c.restore();
  };
  label(tx("tbLoop").toUpperCase(), -3.95, 11.55, 0.17, "#ffc2dc", 0, 1.15);
  label(tx("tbCellar").toUpperCase(), TABLE.cellar.x, TABLE.cellar.y - 1.6, 0.15, "#ffd9a0", 0, 1.3);
  label(tx("tbVolcano").toUpperCase(), TABLE.volcano.x - 0.2, 18.15, 0.2, "#ffb08a", 0, 1.4);
  label(tx("tbBouncers").toUpperCase(), TABLE.moliere.x, 12.5, 0.13, "#ffc2ec", 0, 1.3);
  label(tx("tbRampFiat").toUpperCase(), 2.9, 11.65, 0.14, "#ffe2b8", 0, 1.2);
  label(tx("tbCoco").toUpperCase(), 4.45, 11.9, 0.18, "#d8ffb0", Math.PI / 2, 1.8);
  label(tx("tbCrabs").toUpperCase(), 0, 10.75, 0.18, "#ffd9a0", 0, 2.6);
  label(tx("tbMagnet").toUpperCase(), TABLE.magnet.x, TABLE.magnet.y - 1.1, 0.13, "#b8f6ff", 0, 1.8);
  label(tx("tbSilo").toUpperCase(), 4.45, 14.0, 0.14, "#ffd9a0", 0, 1.1);
  label(tx("tbIsland").toUpperCase(), 2.6, 21.6, 0.2, "#ffe9a0", 0, 2.4);
  // The plunger lane
  c.fillStyle = "rgba(0,0,0,0.45)";
  c.fillRect(X(5.0), Y(14), X(6.1) - X(5.0), Y(-1.6) - Y(14));
  return texture(THREE, canvas, tier);
}


/** The apron: Panda (Hoho!), the title, two rule cards on madras. */
export function paintApron(THREE, t, pandaUrl) {
  const [canvas, c] = canvasOf(2048, 384);
  const tex = texture(THREE, canvas, 2);
  const g = c.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#2a1258");
  g.addColorStop(1, "#0d0626");
  c.fillStyle = g;
  c.fillRect(0, 0, canvas.width, canvas.height);
  // A madras edge along the top
  madras(c, 0, 0, canvas.width, 22, 14);
  c.textAlign = "center";
  c.textBaseline = "middle";
  const card = (x, text, color) => {
    madras(c, x - 10, 58, 640, 290, 20);
    rounded(c, x, 68, 620, 270, 20);
    c.fillStyle = "#fff6e6";
    c.fill();
    c.fillStyle = color;
    c.fillRect(x, 68, 14, 270);
    c.fillStyle = "#2a1258";
    const words = text.split(" ");
    const lines = [];
    let current = "";
    c.font = "800 40px 'Open Sans', Arial, sans-serif";
    for (const word of words) {
      const next = current ? current + " " + word : word;
      if (c.measureText(next).width > 560 && current) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    lines.push(current);
    lines.slice(0, 4).forEach((part, i) => c.fillText(part, x + 318, 203 + (i - (Math.min(lines.length, 4) - 1) / 2) * 52));
  };
  card(60, tableText(t, "tbApronRule1"), NIGHT.hibiscus);
  card(canvas.width - 680, tableText(t, "tbApronRule2"), NIGHT.mango);
  // Panda, in the middle, and his "Hoho!"
  face(c, tex, pandaUrl, 830, 196, 112, NIGHT.gold);
  c.save();
  c.translate(830, 64);
  c.rotate(-0.12);
  rounded(c, -74, -30, 148, 58, 26);
  c.fillStyle = "#ffffff";
  c.fill();
  c.fillStyle = "#2a1258";
  fitText(c, tableText(t, "tbHoho"), 0, 0, 130, 38, "900");
  c.restore();
  neonText(c, tableText(t, "tbTitle").toUpperCase(), 1170, 168, 420, 84, NIGHT.hibiscus);
  c.fillStyle = "#b8f6ff";
  fitText(c, tableText(t, "tbSubtitle"), 1170, 272, 420, 32, "800");
  return tex;
}

/**
 * A sign over a ramp: its colour, a friend's face, its name, read from the
 * flippers. opts: { face (url), sub (a second line) }.
 */
export function paintSign(THREE, label, color, opts) {
  const text = str(label);
  const o = opts || {};
  const [canvas, c] = canvasOf(256, 320);
  const tex = texture(THREE, canvas, 2);
  rounded(c, 6, 6, 244, 308, 26);
  const g = c.createLinearGradient(0, 0, 0, 320);
  g.addColorStop(0, hex(color, 0.85));
  g.addColorStop(1, hex(color, 0.25));
  c.fillStyle = g;
  c.fill();
  c.lineWidth = 8;
  c.strokeStyle = "#ffffff";
  c.stroke();
  const b = c.createRadialGradient(128, 112, 4, 128, 112, 120);
  b.addColorStop(0, "rgba(255,255,255,0.7)");
  b.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = b;
  c.fillRect(0, 0, 256, 320);
  face(c, tex, o.face, 128, 112, 78, "#ffffff");
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = "#ffffff";
  c.shadowColor = "rgba(0,0,0,0.8)";
  c.shadowBlur = 8;
  const words = text.toUpperCase().split(" ");
  if (words.length > 2) {
    const half = Math.ceil(words.length / 2);
    fitText(c, words.slice(0, half).join(" "), 128, 232, 226, 38, "900");
    fitText(c, words.slice(half).join(" "), 128, 276, 226, 38, "900");
  } else {
    fitText(c, text.toUpperCase(), 128, 250, 226, 46, "900");
  }
  return tex;
}

/** Le Molière: a neon club sign, Violaine (the DJ) at its side. */
export function paintNeon(THREE, label, color, faceUrl) {
  const text = str(label);
  const [canvas, c] = canvasOf(512, 200);
  const tex = texture(THREE, canvas, 2);
  rounded(c, 4, 4, 504, 192, 30);
  c.fillStyle = "rgba(14,4,30,0.92)";
  c.fill();
  c.lineWidth = 6;
  c.strokeStyle = color;
  c.shadowColor = color;
  c.shadowBlur = 18;
  c.stroke();
  c.shadowBlur = 0;
  face(c, tex, faceUrl, 92, 100, 66, color);
  c.textAlign = "center";
  c.textBaseline = "middle";
  neonText(c, text.toUpperCase(), 320, 92, 300, 66, color);
  c.fillStyle = "rgba(255,255,255,0.75)";
  fitText(c, "♪ DJ · CLUB ♪", 320, 156, 260, 26, "800");
  return tex;
}



/** The cap of a pop bumper: a friend's face on a bright dome, his name under it. */
export function paintBumperCap(THREE, color, faceUrl, name) {
  const [canvas, c] = canvasOf(256, 256);
  const tex = texture(THREE, canvas, 1);
  const g = c.createRadialGradient(110, 100, 10, 128, 128, 128);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.3, hex(color, 1.1));
  g.addColorStop(1, hex(color, 0.45));
  c.fillStyle = g;
  c.fillRect(0, 0, 256, 256);
  face(c, tex, faceUrl, 128, 118, 82, "#ffffff");
  if (name) {
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "#ffffff";
    c.shadowColor = "rgba(0,0,0,0.85)";
    c.shadowBlur = 6;
    fitText(c, str(name).toUpperCase(), 128, 224, 150, 30, "900");
  }
  return tex;
}


/** A letter of T-A-T-O-U on the face of a drop target. */
export function paintLetter(THREE, letter, color) {
  const [canvas, c] = canvasOf(128, 128);
  const g = c.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, hex(color, 1.1));
  g.addColorStop(1, hex(color, 0.5));
  c.fillStyle = g;
  c.fillRect(0, 0, 128, 128);
  c.strokeStyle = "#ffffff";
  c.lineWidth = 8;
  c.strokeRect(4, 4, 120, 120);
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = "#ffffff";
  c.shadowColor = "rgba(0,0,0,0.6)";
  c.shadowBlur = 6;
  fitText(c, letter, 64, 68, 100, 96, "900");
  return texture(THREE, canvas, 1);
}

/** Madras cloth, for the cabinet sides and the slingshot plastics. */
export function paintMadras(THREE, tint) {
  const [canvas, c] = canvasOf(256, 256);
  madras(c, 0, 0, 256, 256, 26);
  if (tint) {
    c.fillStyle = tint;
    c.fillRect(0, 0, 256, 256);
  }
  const tex = texture(THREE, canvas, 1);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

