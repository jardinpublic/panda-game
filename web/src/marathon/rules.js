// The marathon: endless chain of micro-games, faster and faster, 3 lives.
// Pure logic (no three.js, no DOM), unit-tested in test/marathon.test.js.
//
//   const run = createMarathon({ pool: ['spit', 'mute'], random });
//   const id = run.next();          // micro-game to play now
//   run.duration();                 // seconds allowed for it
//   run.report(true);               // won it -> score, coins, streak
//   run.isOver();

export const LIVES = 3;
export const BOSS_EVERY = 10;
export const MAX_SPEED = 2.2;

export function createMarathon({ pool, random = Math.random, lives = LIVES }) {
  const s = {
    level: 0, // micro-games played
    wins: 0,
    lives,
    streak: 0,
    bestStreak: 0,
    score: 0,
    coins: 0,
    last: [],
    stats: {}, // id -> {won, lost}
    current: null,

    /** Speed multiplier: 1 at the start, +3.5% per micro-game, capped at MAX_SPEED. */
    speed() {
      return Math.min(MAX_SPEED, 1 + s.level * 0.035);
    },
    /** Seconds allowed for the current micro-game (base seconds / speed, never under 1.6 s). */
    duration(base = 5) {
      return Math.max(1.6, base / s.speed());
    },
    isBoss() {
      return s.level > 0 && (s.level + 1) % BOSS_EVERY === 0;
    },
    /** Picks the next micro-game, never one of the last three played. */
    next() {
      const fresh = pool.filter((id) => !s.last.includes(id));
      const choices = fresh.length ? fresh : pool;
      s.current = choices[Math.floor(random() * choices.length)];
      s.last.push(s.current);
      if (s.last.length > Math.min(3, pool.length - 1)) s.last.shift();
      return s.current;
    },
    /** Records the outcome of the current micro-game. Returns {gained, lostLife}. */
    report(won) {
      const id = s.current;
      s.stats[id] = s.stats[id] || { won: 0, lost: 0 };
      s.level++;
      if (won) {
        s.wins++;
        s.streak++;
        s.bestStreak = Math.max(s.bestStreak, s.streak);
        const gained = 1 + Math.floor(s.streak / 5); // streaks pay
        s.score += 10 * s.multiplier();
        s.coins += gained;
        s.stats[id].won++;
        return { gained, lostLife: false };
      }
      s.streak = 0;
      s.lives = Math.max(0, s.lives - 1);
      s.stats[id].lost++;
      return { gained: 0, lostLife: true };
    },
    /** Score multiplier from the current streak: x1, x2 at 5, x3 at 10, x4 at 20. */
    multiplier() {
      if (s.streak >= 20) return 4;
      if (s.streak >= 10) return 3;
      if (s.streak >= 5) return 2;
      return 1;
    },
    /** Gives a life back (boss beaten), up to the starting count. */
    heal() {
      s.lives = Math.min(lives, s.lives + 1);
    },
    isOver() {
      return s.lives <= 0;
    },
  };
  return s;
}
