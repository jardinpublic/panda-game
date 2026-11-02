// A simple pinball player for tests and the demo: flips when a ball comes
// down onto a flipper, plunges with a random strength.

export function createAutoplay(game, random = Math.random) {
  const hold = { left: 0, right: 0 };
  let plungeFor = 0;
  return function input(dt) {
    const s = game.state;
    const w = game.world;
    hold.left = Math.max(0, hold.left - dt);
    hold.right = Math.max(0, hold.right - dt);
    const waiting = w.balls.find((b) => b.alive && b.held === 'plunger');
    if (waiting && s.plunger.ready) {
      if (plungeFor <= 0) plungeFor = 0.2 + random() * 0.8;
      plungeFor -= dt;
      return { right: plungeFor > 0 };
    }
    for (const b of w.balls) {
      if (!b.alive || b.held || b.vy < -50) continue;
      for (const f of w.flippers) {
        const side = f.side === 'left' ? 1 : -1;
        const along = (b.x - f.x) * side;
        if (along > -5 && along < f.length + 12 && b.y > f.y - 46 && b.y < f.y + 30) {
          if (hold[f.side] <= 0) hold[f.side] = 0.18;
        }
      }
    }
    return { left: hold.left > 0.06, right: hold.right > 0.06 };
  };
}
