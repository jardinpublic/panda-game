// Cars from the gang's stories, side view, drawn in the art kit's style.
// Each takes the ground point under the middle of the car (x, y) and its
// length L, facing right (flip: facing left). Heads in the windows are
// friends' or extras' head pictures.

import { rrect, circle, ellipse, vgrad, shadowed, head } from './art.js';

function wheel(c, x, y, r, t, spin) {
  circle(c, x, y, r, '#202128');
  circle(c, x, y, r * 0.55, '#b9bdc8');
  c.save();
  c.translate(x, y);
  c.rotate(spin ? t * 14 : 0);
  c.strokeStyle = '#7d828f';
  c.lineWidth = r * 0.12;
  for (let i = 0; i < 4; i++) {
    c.rotate(Math.PI / 2);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(r * 0.5, 0);
    c.stroke();
  }
  c.restore();
}

/** A soft cone of light from (x, y) towards dir (1 right, -1 left). */
export function headlightBeam(c, x, y, dir, len, alpha = 1) {
  const g = c.createLinearGradient(x, y, x + dir * len, y);
  g.addColorStop(0, `rgba(255,246,200,${0.6 * alpha})`);
  g.addColorStop(1, 'rgba(255,246,200,0)');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x, y - 6);
  c.lineTo(x + dir * len, y - len * 0.5);
  c.lineTo(x + dir * len, y + len * 0.15);
  c.lineTo(x, y + 6);
  c.closePath();
  c.fill();
}

/**
 * Panda's white Renault Clio (early 2000s): round roof, five doors, black side strip.
 * opts: flip, t, spin (wheels turn), door (0..1, the rear door swung open),
 * driver, passenger (head ids), feet (Rudy's feet sticking out of the back window).
 */
export function clio(c, x, y, L, { flip = false, t = 0, spin = false, door = 0, driver = null, passenger = null, lean = 0, feet = null } = {}) {
  const body = '#f4f5f2';
  c.save();
  c.translate(x, y);
  if (flip) c.scale(-1, 1);
  ellipse(c, 0, 2, L * 0.52, L * 0.05, 'rgba(20,10,40,0.25)');
  // Cabin glass first, heads inside, then the body around them
  const roof = -L * 0.43;
  c.fillStyle = '#9fc7dc';
  c.beginPath();
  c.moveTo(-L * 0.36, -L * 0.27);
  c.lineTo(-L * 0.3, roof + L * 0.02);
  c.quadraticCurveTo(-L * 0.05, roof - L * 0.02, L * 0.1, roof + L * 0.01);
  c.lineTo(L * 0.25, -L * 0.27);
  c.closePath();
  c.fill();
  if (driver) head(c, driver, L * 0.07, -L * 0.33 + lean, L * 0.2, { rot: 0 });
  if (passenger) head(c, passenger, -L * 0.17, -L * 0.33, L * 0.2);
  // Body
  shadowed(c, () => {
    c.fillStyle = vgrad(c, -L * 0.3, 0, ['#ffffff', body, '#d9dcd8']);
    c.beginPath();
    c.moveTo(-L * 0.49, -L * 0.1);
    c.lineTo(-L * 0.48, -L * 0.25);
    c.quadraticCurveTo(-L * 0.47, -L * 0.3, -L * 0.36, -L * 0.29);
    c.lineTo(L * 0.25, -L * 0.28);
    c.quadraticCurveTo(L * 0.42, -L * 0.26, L * 0.48, -L * 0.17);
    c.lineTo(L * 0.5, -L * 0.07);
    c.quadraticCurveTo(L * 0.5, -L * 0.03, L * 0.45, -L * 0.03);
    c.lineTo(-L * 0.46, -L * 0.03);
    c.closePath();
    c.fill();
  }, 12, 5);
  // Window frames (body colour pillars)
  c.strokeStyle = body;
  c.lineWidth = L * 0.03;
  c.beginPath();
  c.moveTo(-L * 0.06, roof + L * 0.0);
  c.lineTo(-L * 0.06, -L * 0.27);
  c.stroke();
  c.strokeStyle = '#e6e8e4';
  c.lineWidth = L * 0.022;
  c.beginPath();
  c.moveTo(-L * 0.36, -L * 0.27);
  c.lineTo(-L * 0.3, roof + L * 0.02);
  c.quadraticCurveTo(-L * 0.05, roof - L * 0.02, L * 0.1, roof + L * 0.01);
  c.lineTo(L * 0.25, -L * 0.27);
  c.stroke();
  // Glass shine
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.beginPath();
  c.moveTo(L * 0.12, roof + L * 0.03);
  c.lineTo(L * 0.17, roof + L * 0.03);
  c.lineTo(L * 0.1, -L * 0.28);
  c.lineTo(L * 0.05, -L * 0.28);
  c.closePath();
  c.fill();
  // Black side strip, door lines, handles
  c.fillStyle = '#2b2d33';
  c.fillRect(-L * 0.44, -L * 0.13, L * 0.86, L * 0.025);
  c.strokeStyle = 'rgba(80,85,95,0.5)';
  c.lineWidth = 1.5;
  for (const dx of [-L * 0.06, L * 0.2]) {
    c.beginPath();
    c.moveTo(dx, -L * 0.27);
    c.lineTo(dx + L * 0.01, -L * 0.04);
    c.stroke();
  }
  c.fillStyle = '#9aa0aa';
  c.fillRect(L * 0.12, -L * 0.21, L * 0.04, L * 0.012);
  c.fillRect(-L * 0.15, -L * 0.21, L * 0.04, L * 0.012);
  // Lights: big clear headlight, red rear light
  ellipse(c, L * 0.44, -L * 0.16, L * 0.05, L * 0.03, '#fff6c8', -0.3);
  rrect(c, -L * 0.49, -L * 0.24, L * 0.035, L * 0.08, 4);
  c.fillStyle = '#e0453c';
  c.fill();
  // Bumpers
  rrect(c, L * 0.38, -L * 0.075, L * 0.13, L * 0.045, 6);
  c.fillStyle = '#e4e6e2';
  c.fill();
  rrect(c, -L * 0.5, -L * 0.075, L * 0.12, L * 0.045, 6);
  c.fill();
  // Rear door open: dark opening and the door swung towards us
  if (door > 0) {
    c.fillStyle = '#2a2d3a';
    c.beginPath();
    c.moveTo(-L * 0.32, -L * 0.26);
    c.lineTo(-L * 0.07, -L * 0.26);
    c.lineTo(-L * 0.06, -L * 0.04);
    c.lineTo(-L * 0.32, -L * 0.04);
    c.closePath();
    c.fill();
    const w = L * 0.25 * (1 - door * 0.55);
    c.fillStyle = vgrad(c, -L * 0.42, 0, ['#ffffff', '#dfe2de']);
    c.beginPath();
    c.moveTo(-L * 0.32, -L * 0.27);
    c.lineTo(-L * 0.32 - w, -L * 0.29 - door * L * 0.04);
    c.lineTo(-L * 0.32 - w, -L * 0.02 + door * L * 0.04);
    c.lineTo(-L * 0.32, -L * 0.04);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(159,199,220,0.9)';
    c.beginPath();
    c.moveTo(-L * 0.33, -L * 0.42);
    c.lineTo(-L * 0.32 - w * 0.9, -L * 0.42 - door * L * 0.04);
    c.lineTo(-L * 0.32 - w * 0.9, -L * 0.29 - door * L * 0.04);
    c.lineTo(-L * 0.33, -L * 0.27);
    c.closePath();
    c.fill();
  }
  if (feet) {
    // Rudy dived in head first: his shoes stick out of the back window
    for (const k of [0, 1]) {
      ellipse(c, -L * 0.36 - k * L * 0.04, -L * 0.33 - k * L * 0.03 + Math.sin(t * 12 + k) * 2, L * 0.035, L * 0.02, '#f4f1ea', -0.4);
    }
  }
  wheel(c, -L * 0.31, -L * 0.03, L * 0.085, t, spin);
  wheel(c, L * 0.3, -L * 0.03, L * 0.085, t, spin);
  // Little diamond badge on the nose
  c.fillStyle = '#c8ccd4';
  c.beginPath();
  c.moveTo(L * 0.475, -L * 0.13);
  c.lineTo(L * 0.485, -L * 0.115);
  c.lineTo(L * 0.475, -L * 0.1);
  c.lineTo(L * 0.465, -L * 0.115);
  c.closePath();
  c.fill();
  c.restore();
}

/**
 * José and Lamoule's old Peugeot 205: boxy little hatchback, faded red with one
 * grey primer door, black bumpers, square headlights. opts: flip, t, spin,
 * lights (0..1 headlights on), driver, passenger (head ids), bounce.
 */
export function peugeot205(c, x, y, L, { flip = false, t = 0, spin = false, lights = 0, driver = null, passenger = null, bounce = 0 } = {}) {
  const red = '#b5473a';
  c.save();
  c.translate(x, y);
  if (flip) c.scale(-1, 1);
  ellipse(c, 0, 2, L * 0.52, L * 0.05, 'rgba(20,10,40,0.3)');
  c.translate(0, -Math.abs(Math.sin(t * 9)) * bounce);
  const roof = -L * 0.45;
  // Glass and heads
  c.fillStyle = '#7fa3b5';
  c.beginPath();
  c.moveTo(-L * 0.42, -L * 0.29);
  c.lineTo(-L * 0.38, roof);
  c.lineTo(L * 0.05, roof);
  c.lineTo(L * 0.22, -L * 0.29);
  c.closePath();
  c.fill();
  if (driver) head(c, driver, L * 0.04, -L * 0.36, L * 0.2);
  if (passenger) head(c, passenger, -L * 0.21, -L * 0.37, L * 0.21);
  // Pillars and roof
  c.fillStyle = red;
  c.fillRect(-L * 0.42, roof - L * 0.02, L * 0.48, L * 0.03);
  c.strokeStyle = '#22242b';
  c.lineWidth = L * 0.03;
  c.beginPath();
  c.moveTo(-L * 0.12, roof);
  c.lineTo(-L * 0.12, -L * 0.29);
  c.stroke();
  c.strokeStyle = red;
  c.lineWidth = L * 0.025;
  c.beginPath();
  c.moveTo(-L * 0.42, -L * 0.29);
  c.lineTo(-L * 0.38, roof);
  c.lineTo(L * 0.05, roof);
  c.lineTo(L * 0.22, -L * 0.29);
  c.stroke();
  // Boxy body
  shadowed(c, () => {
    c.fillStyle = vgrad(c, -L * 0.3, 0, ['#c9584a', red, '#8f362c']);
    c.beginPath();
    c.moveTo(-L * 0.47, -L * 0.06);
    c.lineTo(-L * 0.46, -L * 0.29);
    c.lineTo(L * 0.24, -L * 0.3);
    c.lineTo(L * 0.47, -L * 0.22);
    c.lineTo(L * 0.48, -L * 0.06);
    c.closePath();
    c.fill();
  }, 10, 4);
  // The grey primer door (never repainted)
  c.fillStyle = '#9a9c9e';
  c.beginPath();
  c.moveTo(-L * 0.12, -L * 0.29);
  c.lineTo(L * 0.2, -L * 0.3);
  c.lineTo(L * 0.2, -L * 0.07);
  c.lineTo(-L * 0.12, -L * 0.07);
  c.closePath();
  c.fill();
  c.fillStyle = '#88898b';
  c.fillRect(L * 0.13, -L * 0.24, L * 0.04, L * 0.012);
  // Rust spots
  ellipse(c, -L * 0.36, -L * 0.1, L * 0.03, L * 0.015, '#7a3b1f');
  ellipse(c, L * 0.4, -L * 0.09, L * 0.02, L * 0.012, '#7a3b1f');
  // Black plastic bumpers and side strip
  c.fillStyle = '#26272c';
  c.fillRect(-L * 0.49, -L * 0.1, L * 0.1, L * 0.05);
  c.fillRect(L * 0.4, -L * 0.1, L * 0.1, L * 0.05);
  c.fillRect(-L * 0.44, -L * 0.15, L * 0.86, L * 0.02);
  // Square headlight, small rear light
  rrect(c, L * 0.44, -L * 0.2, L * 0.04, L * 0.05, 3);
  c.fillStyle = lights > 0 ? '#fff7cf' : '#d8dde0';
  c.fill();
  if (lights > 0) circle(c, L * 0.47, -L * 0.175, L * 0.06 * lights, `rgba(255,246,190,${0.45 * lights})`);
  rrect(c, -L * 0.48, -L * 0.25, L * 0.03, L * 0.07, 3);
  c.fillStyle = '#d63b30';
  c.fill();
  wheel(c, -L * 0.3, -L * 0.03, L * 0.085, t, spin);
  wheel(c, L * 0.31, -L * 0.03, L * 0.085, t, spin);
  c.restore();
}

/**
 * A police patrol car, side view: white with a blue band, "POLICE" on the
 * door, a light bar on the roof (blue flashes when `flash`) and a spotlight
 * by the driver's window. Returns the spotlight's position.
 */
export function policeCar(c, x, y, L, { flip = false, t = 0, spin = false, flash = false } = {}) {
  c.save();
  c.translate(x, y);
  if (flip) c.scale(-1, 1);
  ellipse(c, 0, 2, L * 0.52, L * 0.05, 'rgba(20,10,40,0.25)');
  // cabin glass
  c.fillStyle = '#2b3448';
  c.beginPath();
  c.moveTo(-L * 0.3, -L * 0.25);
  c.lineTo(-L * 0.2, -L * 0.42);
  c.lineTo(L * 0.14, -L * 0.42);
  c.lineTo(L * 0.27, -L * 0.25);
  c.closePath();
  c.fill();
  c.strokeStyle = '#f4f5f2';
  c.lineWidth = L * 0.02;
  c.beginPath();
  c.moveTo(-L * 0.03, -L * 0.42);
  c.lineTo(-L * 0.03, -L * 0.25);
  c.stroke();
  // body
  shadowed(c, () => {
    rrect(c, -L * 0.5, -L * 0.27, L, L * 0.2, L * 0.06);
    c.fillStyle = vgrad(c, -L * 0.27, -L * 0.07, ['#ffffff', '#dfe3ea']);
    c.fill();
  }, 10, 3);
  c.fillStyle = '#2550b8';
  c.fillRect(-L * 0.48, -L * 0.19, L * 0.96, L * 0.05);
  c.fillStyle = '#ffffff';
  c.font = `800 ${L * 0.055}px Fredoka, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('POLICE', -L * 0.02, -L * 0.165);
  // lights: headlight at the front, tail light at the back
  rrect(c, L * 0.44, -L * 0.24, L * 0.05, L * 0.04, 3);
  c.fillStyle = '#fff6c8';
  c.fill();
  rrect(c, -L * 0.5, -L * 0.24, L * 0.04, L * 0.05, 3);
  c.fillStyle = '#e8413c';
  c.fill();
  // light bar
  const on = flash && Math.sin(t * 18) > 0;
  rrect(c, -L * 0.12, -L * 0.47, L * 0.2, L * 0.05, 4);
  c.fillStyle = '#d9dde6';
  c.fill();
  circle(c, -L * 0.07, -L * 0.45, L * 0.025, on ? '#4f8cff' : '#2b4f9a');
  circle(c, L * 0.03, -L * 0.45, L * 0.025, !on && flash ? '#4f8cff' : '#2b4f9a');
  if (flash) {
    const gl = c.createRadialGradient(on ? -L * 0.07 : L * 0.03, -L * 0.45, 0, on ? -L * 0.07 : L * 0.03, -L * 0.45, L * 0.3);
    gl.addColorStop(0, 'rgba(80,140,255,0.55)');
    gl.addColorStop(1, 'rgba(80,140,255,0)');
    c.fillStyle = gl;
    c.fillRect(-L * 0.4, -L * 0.8, L * 0.8, L * 0.7);
  }
  // spotlight by the driver's window
  circle(c, L * 0.22, -L * 0.3, L * 0.025, '#fff6c8');
  wheel(c, -L * 0.3, -L * 0.06, L * 0.08, t, spin);
  wheel(c, L * 0.3, -L * 0.06, L * 0.08, t, spin);
  c.restore();
  return { x: x + (flip ? -1 : 1) * L * 0.22, y: y - L * 0.3 };
}
