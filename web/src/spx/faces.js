/*
 * Cartoon faces of the 103 RCX characters who are not in the gang (Pépé
 * Gogol, Pépé Pineur, Le Bud, Le Smo, the cops, Pietro Gangi, Les Azzouz),
 * painted on a canvas in the style of the cast faces (web/public/cast/*.svg):
 * thick warm outline, flat colours, big eyes. Same treatment for everyone,
 * no caricature. Browser only (canvas).
 */

const OUTLINE = '#4a3a30';

/** Each face: skin, hair, and the bits that make it recognisable. */
export const FACES = {
  gogol: { skin: '#f2c3a6', hair: '#e8e4dc', style: 'sides', hat: 'beret', hatColor: '#25262b', glasses: 'round', stubble: '#c9c4ba', mouth: 'grin', brows: 'up', nose: 'big' },
  pineur: { skin: '#eebd9c', hair: '#dcd8d0', style: 'sides', hat: 'flatcap', hatColor: '#6d6152', moustache: '#e9e6df', brows: 'bushy', browColor: '#efece6', mouth: 'flat', nose: 'pointy', wrinkles: true, eyes: 'squint' },
  impuissant: { skin: '#f0c7aa', hair: '#d9d4cb', style: 'sides', glasses: 'round', moustache: '#d9d4cb', brows: 'sad', browColor: '#cfc9bf', mouth: 'sad', nose: 'big', wrinkles: true },
  bud: { skin: '#e9b48f', hair: '#7a5a3c', style: 'short', hat: 'beanie', hatColor: '#c8432f', beard: '#7f6248', mouth: 'smile', nose: 'red', eyes: 'sleepy' },
  smo: { skin: '#f0c19d', hair: '#3c3631', style: 'long', hat: 'hood', hatColor: '#6b7b4a', beard: '#3c3631', mouth: 'gap', nose: 'round', eyes: 'sleepy' },
  keufs: { skin: '#f0c4a3', hair: '#4b3a2e', style: 'short', hat: 'kepi', hatColor: '#1f2b4d', moustache: '#4b3a2e', brows: 'stern', mouth: 'flat', nose: 'round' },
  pietro: { skin: '#e3ad84', hair: '#1d1a19', style: 'slick', stubble: '#3a2e28', brows: 'angry', browColor: '#1d1a19', mouth: 'snarl', nose: 'big', chain: true },
  // The Jardin Public's park keeper (Golden Merguez): green cap, grey moustache, stern.
  gardien: { skin: '#eec09f', hair: '#8a8580', style: 'short', hat: 'kepi', hatColor: '#2e5a34', moustache: '#9a948c', brows: 'stern', mouth: 'flat', nose: 'round', wrinkles: true },
  azzouz: { skin: '#d9a07a', hair: '#231d1a', style: 'short', hat: 'capback', hatColor: '#2f7fd1', stubble: '#5a4436', mouth: 'cheeky', nose: 'round', brows: 'up' },
};

const cache = new Map();

/** A 256×320 canvas with the face of `id` (cached). */
export function paintFace(id, variant = 0) {
  const key = id + ':' + variant;
  if (cache.has(key)) return cache.get(key);
  const spec = { ...(FACES[id] || FACES.bud) };
  if (id === 'azzouz' && variant) spec.hatColor = ['#2f7fd1', '#e0a21b', '#d23c5a'][variant % 3];
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 320;
  drawFace(c.getContext('2d'), spec);
  cache.set(key, c);
  return c;
}

/** The face as a data: URL, for the chat bubble. */
export function faceUrl(id, variant = 0) {
  return paintFace(id, variant).toDataURL('image/png');
}

function drawFace(g, f) {
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const cx = 128;
  const cy = 170;
  const stroke = (w = 7) => {
    g.strokeStyle = OUTLINE;
    g.lineWidth = w;
    g.stroke();
  };
  const fill = (color) => {
    g.fillStyle = color;
    g.fill();
  };
  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, ((n >> 16) & 255) * k));
    const gg = Math.max(0, Math.min(255, ((n >> 8) & 255) * k));
    const b = Math.max(0, Math.min(255, (n & 255) * k));
    return `rgb(${r | 0},${gg | 0},${b | 0})`;
  };

  // Neck and collar
  g.beginPath();
  g.moveTo(cx - 34, 250);
  g.lineTo(cx - 40, 320);
  g.lineTo(cx + 40, 320);
  g.lineTo(cx + 34, 250);
  g.closePath();
  fill(shade(f.skin, 0.88));
  stroke(6);
  if (f.chain) {
    g.beginPath();
    g.arc(cx, 268, 30, 0.15 * Math.PI, 0.85 * Math.PI);
    g.strokeStyle = '#e8b923';
    g.lineWidth = 6;
    g.stroke();
  }
  if (f.hat === 'hood') {
    g.beginPath();
    g.ellipse(cx, 160, 104, 122, 0, 0, Math.PI * 2);
    fill(f.hatColor);
    stroke();
  }
  // Long hair behind the head
  if (f.style === 'long') {
    g.beginPath();
    g.ellipse(cx, 175, 92, 108, 0, 0, Math.PI * 2);
    fill(f.hair);
    stroke();
  }
  // Ears
  for (const side of [-1, 1]) {
    g.beginPath();
    g.ellipse(cx + side * 78, 172, 16, 24, 0, 0, Math.PI * 2);
    fill(f.skin);
    stroke(6);
  }
  // Head
  g.beginPath();
  g.moveTo(cx, 62);
  g.bezierCurveTo(cx + 62, 62, cx + 80, 100, cx + 80, 160);
  g.bezierCurveTo(cx + 80, 222, cx + 52, 262, cx, 262);
  g.bezierCurveTo(cx - 52, 262, cx - 80, 222, cx - 80, 160);
  g.bezierCurveTo(cx - 80, 100, cx - 62, 62, cx, 62);
  g.closePath();
  fill(f.skin);
  stroke();
  // Cheeks
  g.globalAlpha = 0.28;
  for (const side of [-1, 1]) {
    g.beginPath();
    g.ellipse(cx + side * 46, 196, 16, 10, 0, 0, Math.PI * 2);
    fill('#e0645a');
  }
  g.globalAlpha = 1;
  // Stubble and beards
  if (f.stubble) {
    g.save();
    g.globalAlpha = 0.45;
    g.beginPath();
    g.moveTo(cx - 74, 185);
    g.bezierCurveTo(cx - 62, 250, cx - 30, 262, cx, 262);
    g.bezierCurveTo(cx + 30, 262, cx + 62, 250, cx + 74, 185);
    g.bezierCurveTo(cx + 40, 205, cx - 40, 205, cx - 74, 185);
    fill(f.stubble);
    g.restore();
  }
  if (f.beard) {
    g.beginPath();
    g.moveTo(cx - 78, 168);
    g.bezierCurveTo(cx - 80, 250, cx - 40, 290, cx, 292);
    g.bezierCurveTo(cx + 40, 290, cx + 80, 250, cx + 78, 168);
    g.bezierCurveTo(cx + 50, 214, cx - 50, 214, cx - 78, 168);
    fill(f.beard);
    stroke(6);
  }
  // Hair on top
  g.fillStyle = f.hair;
  if (f.style === 'sides') {
    for (const side of [-1, 1]) {
      g.beginPath();
      g.ellipse(cx + side * 70, 130, 18, 36, side * 0.2, 0, Math.PI * 2);
      fill(f.hair);
      stroke(5);
    }
  } else if (f.style === 'short' || f.style === 'long') {
    g.beginPath();
    g.moveTo(cx - 80, 140);
    g.bezierCurveTo(cx - 84, 70, cx - 30, 52, cx, 54);
    g.bezierCurveTo(cx + 30, 52, cx + 84, 70, cx + 80, 140);
    g.bezierCurveTo(cx + 60, 104, cx + 20, 96, cx - 10, 100);
    g.bezierCurveTo(cx - 40, 104, cx - 66, 112, cx - 80, 140);
    fill(f.hair);
    stroke(6);
  } else if (f.style === 'slick') {
    g.beginPath();
    g.moveTo(cx - 80, 132);
    g.bezierCurveTo(cx - 86, 60, cx + 86, 40, cx + 80, 132);
    g.bezierCurveTo(cx + 66, 94, cx - 40, 76, cx - 80, 132);
    fill(f.hair);
    stroke(6);
    g.strokeStyle = shade(f.hair, 2.4);
    g.lineWidth = 3;
    for (let k = -2; k <= 2; k++) {
      g.beginPath();
      g.moveTo(cx - 50 + k * 14, 96 - Math.abs(k) * 2);
      g.quadraticCurveTo(cx + k * 10, 66, cx + 50 + k * 8, 80);
      g.stroke();
    }
  }
  // Hats
  if (f.hat === 'beret') {
    g.beginPath();
    g.ellipse(cx - 6, 74, 84, 30, -0.12, 0, Math.PI * 2);
    fill(f.hatColor);
    stroke(6);
    g.beginPath();
    g.moveTo(cx - 4, 46);
    g.lineTo(cx + 2, 32);
    stroke(6);
  } else if (f.hat === 'flatcap') {
    g.beginPath();
    g.moveTo(cx - 84, 112);
    g.bezierCurveTo(cx - 86, 54, cx + 70, 44, cx + 86, 104);
    g.lineTo(cx + 96, 118);
    g.bezierCurveTo(cx + 40, 104, cx - 40, 102, cx - 84, 112);
    fill(f.hatColor);
    stroke(6);
  } else if (f.hat === 'beanie') {
    g.beginPath();
    g.moveTo(cx - 82, 122);
    g.bezierCurveTo(cx - 86, 30, cx + 86, 30, cx + 82, 122);
    g.closePath();
    fill(f.hatColor);
    stroke(6);
    g.beginPath();
    g.roundRect(cx - 86, 106, 172, 26, 10);
    fill(shade(f.hatColor, 0.8));
    stroke(6);
    g.beginPath();
    g.arc(cx, 40, 14, 0, Math.PI * 2);
    fill(shade(f.hatColor, 1.2));
    stroke(5);
  } else if (f.hat === 'hood') {
    g.beginPath();
    g.moveTo(cx - 84, 150);
    g.bezierCurveTo(cx - 80, 60, cx + 80, 60, cx + 84, 150);
    g.bezierCurveTo(cx + 70, 96, cx - 70, 96, cx - 84, 150);
    fill(f.hatColor);
    stroke(6);
  } else if (f.hat === 'kepi') {
    g.beginPath();
    g.roundRect(cx - 74, 46, 148, 66, 16);
    fill(f.hatColor);
    stroke(6);
    g.beginPath();
    g.rect(cx - 74, 92, 148, 14);
    fill('#d9dde6');
    g.beginPath();
    g.moveTo(cx - 80, 112);
    g.quadraticCurveTo(cx, 140, cx + 80, 112);
    g.lineTo(cx + 74, 106);
    g.lineTo(cx - 74, 106);
    g.closePath();
    fill('#141a2e');
    stroke(5);
    g.beginPath();
    g.arc(cx, 72, 10, 0, Math.PI * 2);
    fill('#e9c74a');
  } else if (f.hat === 'capback') {
    g.beginPath();
    g.moveTo(cx - 80, 120);
    g.bezierCurveTo(cx - 84, 46, cx + 84, 46, cx + 80, 120);
    g.bezierCurveTo(cx + 40, 100, cx - 40, 100, cx - 80, 120);
    fill(f.hatColor);
    stroke(6);
    g.beginPath();
    g.roundRect(cx - 34, 104, 68, 14, 6);
    fill('#f4f4f4');
    stroke(4);
  }
  // Brows
  const browColor = f.browColor || shade(f.hair, 0.7);
  for (const side of [-1, 1]) {
    g.beginPath();
    const bx = cx + side * 34;
    const by = f.brows === 'up' ? 126 : 134;
    if (f.brows === 'sad') {
      g.moveTo(bx - side * 18, by + 6);
      g.lineTo(bx + side * 18, by - 6);
    } else if (f.brows === 'angry' || f.brows === 'stern') {
      g.moveTo(bx - side * 20, by - 6);
      g.lineTo(bx + side * 18, by + (f.brows === 'angry' ? 8 : 2));
    } else {
      g.moveTo(bx - 18, by + 2);
      g.quadraticCurveTo(bx, by - 8, bx + 18, by + 2);
    }
    g.strokeStyle = browColor;
    g.lineWidth = f.brows === 'bushy' ? 14 : 9;
    g.stroke();
  }
  // Eyes
  for (const side of [-1, 1]) {
    const ex = cx + side * 34;
    const ey = 160;
    if (f.eyes === 'squint') {
      g.beginPath();
      g.moveTo(ex - 14, ey);
      g.quadraticCurveTo(ex, ey - 8, ex + 14, ey);
      g.strokeStyle = OUTLINE;
      g.lineWidth = 6;
      g.stroke();
      continue;
    }
    g.beginPath();
    g.ellipse(ex, ey, 17, f.eyes === 'sleepy' ? 12 : 19, 0, 0, Math.PI * 2);
    fill('#ffffff');
    stroke(5);
    g.beginPath();
    g.arc(ex + 2, ey + 2, 8, 0, Math.PI * 2);
    fill('#2b211c');
    g.beginPath();
    g.arc(ex + 5, ey - 2, 3, 0, Math.PI * 2);
    fill('#ffffff');
    if (f.eyes === 'sleepy') {
      g.beginPath();
      g.ellipse(ex, ey - 6, 18, 9, 0, Math.PI, Math.PI * 2);
      fill(f.skin);
      g.beginPath();
      g.moveTo(ex - 17, ey - 4);
      g.lineTo(ex + 17, ey - 4);
      stroke(5);
    }
  }
  if (f.glasses === 'round') {
    for (const side of [-1, 1]) {
      g.beginPath();
      g.arc(cx + side * 34, 160, 27, 0, Math.PI * 2);
      g.strokeStyle = '#2a2a2a';
      g.lineWidth = 6;
      g.stroke();
    }
    g.beginPath();
    g.moveTo(cx - 8, 158);
    g.lineTo(cx + 8, 158);
    g.stroke();
  }
  if (f.wrinkles) {
    g.strokeStyle = shade(f.skin, 0.75);
    g.lineWidth = 3;
    for (const y of [102, 112]) {
      g.beginPath();
      g.moveTo(cx - 30, y);
      g.quadraticCurveTo(cx, y - 5, cx + 30, y);
      g.stroke();
    }
  }
  // Nose
  g.beginPath();
  if (f.nose === 'big') g.ellipse(cx, 196, 20, 16, 0, 0, Math.PI * 2);
  else if (f.nose === 'pointy') {
    g.moveTo(cx - 6, 170);
    g.lineTo(cx + 14, 206);
    g.lineTo(cx - 8, 206);
  } else g.ellipse(cx, 196, 13, 11, 0, 0, Math.PI * 2);
  fill(f.nose === 'red' ? '#d9675a' : shade(f.skin, 0.9));
  stroke(5);
  // Moustache
  if (f.moustache) {
    g.beginPath();
    g.moveTo(cx - 40, 222);
    g.quadraticCurveTo(cx - 20, 202, cx, 214);
    g.quadraticCurveTo(cx + 20, 202, cx + 40, 222);
    g.quadraticCurveTo(cx, 226, cx - 40, 222);
    fill(f.moustache);
    stroke(5);
  }
  // Mouth
  g.beginPath();
  const my = 232;
  switch (f.mouth) {
    case 'grin':
      g.moveTo(cx - 34, my - 6);
      g.quadraticCurveTo(cx, my + 34, cx + 34, my - 6);
      g.closePath();
      fill('#7a2d2a');
      stroke(5);
      g.beginPath();
      g.rect(cx - 22, my - 4, 44, 9);
      fill('#ffffff');
      break;
    case 'gap':
      g.moveTo(cx - 30, my - 4);
      g.quadraticCurveTo(cx, my + 26, cx + 30, my - 4);
      g.closePath();
      fill('#7a2d2a');
      stroke(5);
      g.beginPath();
      g.rect(cx - 20, my - 3, 14, 8);
      g.rect(cx + 6, my - 3, 14, 8);
      fill('#ffffff');
      break;
    case 'smile':
    case 'cheeky':
      g.moveTo(cx - 28, my - 4);
      g.quadraticCurveTo(cx + (f.mouth === 'cheeky' ? 10 : 0), my + 18, cx + 30, my - (f.mouth === 'cheeky' ? 12 : 4));
      stroke(6);
      break;
    case 'sad':
      g.moveTo(cx - 24, my + 8);
      g.quadraticCurveTo(cx, my - 8, cx + 24, my + 8);
      stroke(6);
      break;
    case 'snarl':
      g.moveTo(cx - 28, my + 6);
      g.quadraticCurveTo(cx, my - 8, cx + 28, my + 6);
      stroke(7);
      break;
    default:
      g.moveTo(cx - 22, my);
      g.lineTo(cx + 22, my);
      stroke(6);
  }
}
