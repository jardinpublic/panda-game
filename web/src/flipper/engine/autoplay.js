// Engine from Pipeline Pinball (sfdx-hardis-training), same author.
/*
 * A player for the checks and the demo: it flips when a ball comes over a
 * flipper, plunges a waiting ball, and lets go. Each time a ball comes down
 * to a flipper it picks a point along the bat to hit it with (the point sets
 * where the shot goes: near the tip goes across the table, near the pivot up
 * the same side), so it makes the loop, the Fiat ramp, the cellar, the
 * volcano and Le Molière now and then, never like a person. A ball resting
 * on the boar's post at the tip of a bat is flipped off it too.
 */

const HOLD_S = 0.16;
const REST_S = 0.12;

export function createAutoplay(table, random) {
  const physics = table.physics;
  const flips = Object.values(table.parts.flippers).map((f) => ({ f, until: 0, rest: 0, aim: 0.6 }));
  let plunging = 0;
  let strength = 1;
  let clock = 0;

  /** Is a ball over this flipper, at the point the bot aims to hit it with? */
  function ballOver(x) {
    const f = x.f;
    const s = f.shape;
    for (const b of physics.balls) {
      if (!b.active || b.mode !== "table" || b.floor !== s.floor) {
        continue;
      }
      // Where the ball is along the flipper, from the pivot to the tip
      const ex = s.bx - s.pivotX;
      const ey = s.by - s.pivotY;
      const len2 = ex * ex + ey * ey;
      const k = ((b.x - s.pivotX) * ex + (b.y - s.pivotY) * ey) / len2;
      if (k < 0.15 || k > 1.35) {
        continue;
      }
      const cx = s.pivotX + ex * Math.min(1, k);
      const cy = s.pivotY + ey * Math.min(1, k);
      const d = Math.hypot(b.x - cx, b.y - cy);
      // A ball sitting still past the tip (on the boar's post): flip it off
      if (k > 1.05) {
        if (d < 0.7 && Math.hypot(b.vx, b.vy) < 3) {
          return true;
        }
        continue;
      }
      const coming = b.vy < 1 || b.y < cy + 0.6;
      // A ball rolling slowly down the bat waits until it reaches the aimed point
      const slow = Math.hypot(b.vx, b.vy) < 6 && b.vy < 1;
      if (slow && Math.abs(k - x.aim) > 0.12 && k < 0.95) {
        continue;
      }
      if (d < 0.95 + random() * 0.35 && coming && b.y > cy - 0.2) {
        return true;
      }
    }
    return false;
  }

  return {
    /** One frame of play; it tells the controls what it pressed, for the rules' lanes. */
    step(dt, controls) {
      clock += dt;
      for (const x of flips) {
        if (x.f.held) {
          if (clock >= x.until) {
            x.f.held = false;
            x.rest = clock + REST_S;
            // The next shot aims somewhere else along the bat
            x.aim = 0.3 + random() * 0.6;
            controls.release(x.f);
          }
        } else if (clock >= x.rest && x.f.enabled && ballOver(x)) {
          x.f.held = true;
          x.until = clock + HOLD_S;
          controls.press(x.f);
        }
      }
      const waiting = physics.ballOnPlunger();
      if (waiting && !plunging) {
        plunging = clock + 0.6;
        strength = 0.25 + random() * 0.75;
      }
      if (plunging) {
        physics.pullPlunger(Math.min(strength, (clock - (plunging - 0.6)) * 2));
        if (clock >= plunging) {
          plunging = 0;
          if (physics.releasePlunger()) {
            controls.launched();
          }
        }
      }
    }
  };
}
