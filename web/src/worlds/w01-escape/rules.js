// World 1 rules, no rendering: lanes, jump and slide, speed ramp, Romain's
// gap, turbo, score and stars. Unit-tested in test/w01-rules.test.js.

export const LANES = [-2.2, 0, 2.2];
export const laneX = (lane) => LANES[lane];

const GRAVITY = 38;
const JUMP_SPEED = 13;
const SLIDE_TIME = 0.7;
const LANE_SPEED = 16;

/**
 * Creates the run state. length: metres to the beach. speedFactor: mode
 * multiplier (1 easy, 1.3 normal, 1.65 hard).
 */
export function createRunState({ length = 1200, speedFactor = 1, bumpDamage = 25 } = {}) {
  const s = {
    length,
    distance: 0,
    lane: 1,
    x: 0,
    y: 0,
    vy: 0,
    sliding: 0,
    gap: 100, // Romain's distance, 0 = caught
    turbo: 0,
    coins: 0,
    coinsTotal: 0,
    bumps: 0,
    safe: 0, // seconds of protection after a bump

    speed() {
      const ramp = 1 + Math.min(1, s.distance / s.length) * 0.6;
      return 11 * speedFactor * ramp * (s.turbo > 0 ? 1.5 : 1);
    },
    targetX() {
      return LANES[s.lane];
    },
    /** Advances one frame. input: {left, right, jump, slide}. Returns {jumped, landed}. */
    step(dt, input) {
      const events = { jumped: false, landed: false };
      if (input.left) s.lane = Math.max(0, s.lane - 1);
      if (input.right) s.lane = Math.min(2, s.lane + 1);
      const onGround = s.y <= 0;
      if (input.jump && onGround) {
        s.vy = JUMP_SPEED;
        s.sliding = 0;
        events.jumped = true;
      }
      if (input.slide) {
        s.sliding = SLIDE_TIME;
        if (!onGround) s.vy = -JUMP_SPEED; // slam down
      }
      s.vy -= GRAVITY * dt;
      s.y += s.vy * dt;
      if (s.y <= 0) {
        if (!onGround) events.landed = true;
        s.y = 0;
        s.vy = 0;
      }
      s.sliding = Math.max(0, s.sliding - dt);
      s.turbo = Math.max(0, s.turbo - dt);
      s.safe = Math.max(0, s.safe - dt);
      const dx = s.targetX() - s.x;
      s.x += Math.sign(dx) * Math.min(Math.abs(dx), LANE_SPEED * dt);
      s.distance += s.speed() * dt;
      s.gap = Math.min(100, s.gap + dt * 6); // Romain tires a little
      return events;
    },
    /** True when the current pose clears an obstacle passed by "jump", "slide" or "side". */
    passes(how) {
      if (how === 'jump') return s.y > 0.55;
      if (how === 'slide') return s.sliding > 0;
      return false;
    },
    /** Hits an obstacle. Returns false (no effect) during the short safety window. */
    bump() {
      if (s.safe > 0) return false;
      s.bumps++;
      s.safe = 1;
      s.gap = Math.max(0, s.gap - bumpDamage);
      return true;
    },
    boost() {
      s.turbo = 4;
      s.gap = Math.min(100, s.gap + 25);
    },
    breathe() {
      s.gap = Math.min(100, s.gap + 40);
    },
    score() {
      return s.coins * 5 + Math.floor(s.distance);
    },
    /** 1 star for reaching the beach, 2 with 60% of the coins, 3 with 85% and at most 2 bumps. */
    stars() {
      const ratio = s.coinsTotal ? s.coins / s.coinsTotal : 0;
      if (ratio >= 0.85 && s.bumps <= 2) return 3;
      if (ratio >= 0.6) return 2;
      return 1;
    },
  };
  return s;
}
