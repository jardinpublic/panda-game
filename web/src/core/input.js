// One input layer for keyboard, mouse and touch. Worlds read actions and
// gestures from here, never raw DOM events.
//   held(action)      true while left/right/up/down/action is held
//   pressed(action)   true on the frame it went down (consume with endFrame)
//   swipes            queue of 'left' | 'right' | 'up' | 'down' gestures
//   taps              queue of {x, y} in normalised screen coords (-1..1)
//   pointer           current pointer {x, y, down} in normalised coords

const KEYS = {
  ArrowLeft: 'left', KeyA: 'left', KeyQ: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', KeyZ: 'up',
  ArrowDown: 'down', KeyS: 'down',
  Space: 'action', Enter: 'action',
  Escape: 'pause', KeyP: 'pause',
};
const SWIPE_DISTANCE = 30;

export class Input {
  constructor(element) {
    this.element = element;
    this._held = new Set();
    this._pressed = new Set();
    this.swipes = [];
    this.taps = [];
    this.pointer = { x: 0, y: 0, down: false };
    this._start = null;
    this._onKeyDown = (e) => {
      const action = KEYS[e.code];
      if (!action) return;
      if (!this._held.has(action)) this._pressed.add(action);
      this._held.add(action);
      if (action === 'up' || action === 'down') this.swipes.push(action);
      if (action === 'left' || action === 'right') this.swipes.push(action);
      e.preventDefault();
    };
    this._onKeyUp = (e) => {
      const action = KEYS[e.code];
      if (action) this._held.delete(action);
    };
    this._onDown = (e) => {
      this._updatePointer(e);
      this.pointer.down = true;
      this._start = { x: e.clientX, y: e.clientY, t: performance.now() };
      this._pressed.add('touch');
      this._held.add('touch');
    };
    this._onMove = (e) => {
      this._updatePointer(e);
      if (!this._start) return;
      const dx = e.clientX - this._start.x;
      const dy = e.clientY - this._start.y;
      if (Math.hypot(dx, dy) > SWIPE_DISTANCE) {
        this.swipes.push(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
        this._start = { x: e.clientX, y: e.clientY, t: performance.now(), swiped: true };
      }
    };
    this._onUp = (e) => {
      this._updatePointer(e);
      this.pointer.down = false;
      this._held.delete('touch');
      if (this._start && !this._start.swiped && performance.now() - this._start.t < 350) {
        this.taps.push({ x: this.pointer.x, y: this.pointer.y });
      }
      this._start = null;
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    element.addEventListener('pointerdown', this._onDown);
    window.addEventListener('pointermove', this._onMove);
    window.addEventListener('pointerup', this._onUp);
    window.addEventListener('pointercancel', this._onUp);
  }

  _updatePointer(e) {
    const r = this.element.getBoundingClientRect();
    this.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.pointer.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
  }

  held(action) {
    return this._held.has(action);
  }

  pressed(action) {
    return this._pressed.has(action);
  }

  /** Horizontal axis from keys: -1, 0 or 1. */
  axisX() {
    return (this.held('right') ? 1 : 0) - (this.held('left') ? 1 : 0);
  }

  /** Clears per-frame state. Call once at the end of every frame. */
  endFrame() {
    this._pressed.clear();
    this.swipes.length = 0;
    this.taps.length = 0;
  }

  /** Forgets everything held (window lost focus, world switched). */
  reset() {
    this._held.clear();
    this.endFrame();
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.element.removeEventListener('pointerdown', this._onDown);
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
    window.removeEventListener('pointercancel', this._onUp);
  }
}
