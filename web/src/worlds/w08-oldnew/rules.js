// World 8 rules, no rendering: the swipe quiz. A card is answered 'old' or
// 'new' before its own shrinking timer runs out; right answers build a streak
// and a multiplier, 3 mistakes end the run, the clock ends it after 60 s.
// Unit-tested in test/w08-oldnew.test.js.

export const DURATION = 60; // seconds of quiz
export const MAX_MISTAKES = 3;
export const LOCK = 0.28; // seconds between two cards (card flies out, next flies in)

/**
 * Tuning per difficulty. cardTime: seconds for the first card, shrinking by
 * `shrink` per answered card down to minCardTime. heal: a streak of that
 * length forgives one mistake (0 = never). stars: right answers for 2 and 3 stars.
 */
export const MODES = {
  easy: { cardTime: 6, minCardTime: 3, shrink: 0.06, heal: 6, stars: [12, 20] },
  normal: { cardTime: 4.5, minCardTime: 2.2, shrink: 0.07, heal: 10, stars: [16, 26] },
  hard: { cardTime: 3.4, minCardTime: 1.5, shrink: 0.06, heal: 0, stars: [20, 30] },
};

const tuning = (mode) => MODES[mode] || MODES.normal;

/** Maps a swipe or arrow direction to an answer: left = Old Cous, right = New Cous. */
export function choiceFrom(direction) {
  if (direction === 'left') return 'old';
  if (direction === 'right') return 'new';
  return null;
}

/** True when the choice matches the card's answer. */
export function isCorrect(choice, answer) {
  return choice === answer && (choice === 'old' || choice === 'new');
}

/** Score multiplier for a streak: x1, then +1 every 4 right answers in a row, max x5. */
export function multiplierFor(streak) {
  return Math.min(5, 1 + Math.floor(Math.max(0, streak) / 4));
}

/** Seconds allowed for the next card after `answered` cards. */
export function cardTimeFor(answered, mode = 'normal') {
  const m = tuning(mode);
  return Math.max(m.minCardTime, m.cardTime - answered * m.shrink);
}

/** Points for a right answer: 10 x multiplier, + up to 10 for speed, doubled on Panda bonus cards. */
export function pointsFor({ multiplier = 1, timeLeft = 0, cardTime = 1, bonus = false } = {}) {
  const speed = Math.ceil(10 * Math.max(0, Math.min(1, timeLeft / cardTime)));
  return (10 * multiplier + speed) * (bonus ? 2 : 1);
}

/** Stars once the clock runs out: 1 for surviving, 2 and 3 on right answers. */
export function starsFor(correct, mode = 'normal') {
  const [two, three] = tuning(mode).stars;
  if (correct >= three) return 3;
  if (correct >= two) return 2;
  return 1;
}

/** A shuffled list of 0..n-1 (Fisher-Yates with the given random). */
export function shuffled(n, random = Math.random) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Creates the quiz. cards: [{ answer: 'old'|'new', panda }]. Cards are dealt in
 * a shuffled order and reshuffled when the deck runs out (never the same card twice in a row).
 */
export function createQuiz({ cards, mode = 'normal', random = Math.random, duration = DURATION } = {}) {
  let deck = shuffled(cards.length, random);
  let pos = 0;
  const q = {
    mode,
    duration,
    time: 0,
    card: deck[0],
    cardTime: cardTimeFor(0, mode),
    cardLeft: cardTimeFor(0, mode),
    lock: 0,
    answered: 0,
    correct: 0,
    mistakes: 0,
    streak: 0,
    bestStreak: 0,
    score: 0,
    over: false,
    won: false,

    current() {
      return cards[q.card];
    },
    multiplier() {
      return multiplierFor(q.streak);
    },
    timeLeft() {
      return Math.max(0, q.duration - q.time);
    },
    stars() {
      return starsFor(q.correct, mode);
    },

    /** Answers the current card. Returns { ignored } during the lock or after the end. */
    answer(choice) {
      if (q.over || q.lock > 0 || (choice !== 'old' && choice !== 'new')) return { ignored: true };
      const card = q.current();
      const ok = isCorrect(choice, card.answer);
      const res = { ignored: false, correct: ok, answer: card.answer, panda: !!card.panda, points: 0, healed: false, gameOver: false };
      if (ok) {
        q.correct++;
        q.streak++;
        q.bestStreak = Math.max(q.bestStreak, q.streak);
        res.points = pointsFor({ multiplier: q.multiplier(), timeLeft: q.cardLeft, cardTime: q.cardTime, bonus: card.panda });
        q.score += res.points;
        const heal = tuning(mode).heal;
        if (heal && q.mistakes > 0 && q.streak % heal === 0) {
          q.mistakes--;
          res.healed = true;
        }
      } else {
        miss();
        res.gameOver = q.over;
      }
      res.streak = q.streak;
      res.multiplier = q.multiplier();
      next();
      return res;
    },

    /** Advances time. Returns { timeout, gameOver, timeUp } for this frame. */
    step(dt) {
      const ev = { timeout: false, gameOver: false, timeUp: false };
      if (q.over) return ev;
      q.time += dt;
      if (q.lock > 0) {
        q.lock = Math.max(0, q.lock - dt);
      } else {
        q.cardLeft -= dt;
        if (q.cardLeft <= 0) {
          ev.timeout = true;
          ev.answer = q.current().answer;
          miss();
          ev.gameOver = q.over;
          next();
        }
      }
      if (!q.over && q.time >= q.duration) {
        q.over = true;
        q.won = true;
        ev.timeUp = true;
      }
      return ev;
    },
  };

  function miss() {
    q.mistakes++;
    q.streak = 0;
    if (q.mistakes >= MAX_MISTAKES) q.over = true;
  }

  function next() {
    q.answered++;
    const last = q.card;
    pos++;
    if (pos >= deck.length) {
      deck = shuffled(cards.length, random);
      if (deck.length > 1 && deck[0] === last) [deck[0], deck[1]] = [deck[1], deck[0]];
      pos = 0;
    }
    q.card = deck[pos];
    q.cardTime = cardTimeFor(q.answered, mode);
    q.cardLeft = q.cardTime;
    q.lock = LOCK;
  }

  return q;
}
