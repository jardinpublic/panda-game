import { describe, it, expect } from 'vitest';
import {
  createQuiz, choiceFrom, isCorrect, multiplierFor, cardTimeFor, pointsFor, starsFor, shuffled,
  MODES, MAX_MISTAKES, LOCK, DURATION,
} from '../src/worlds/w08-oldnew/rules.js';
import { CARDS, cardSet } from '../src/worlds/w08-oldnew/cards.js';
import { TEXTS } from '../src/worlds/w08-oldnew/index.js';

// Deterministic random (same LCG as the game's ctx.random).
function seeded(seed = 12345) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
const DECK = [{ answer: 'old' }, { answer: 'new' }, { answer: 'old', panda: true }, { answer: 'new' }];
const make = (opts = {}) => createQuiz({ cards: DECK, random: seeded(), ...opts });
const right = (q) => q.answer(q.current().answer);
const wrong = (q) => q.answer(q.current().answer === 'old' ? 'new' : 'old');
const unlock = (q) => q.step(LOCK + 0.001);

describe('w08 cards', () => {
  it('has at least 40 cards per language with the same length and answers in EN and FR', () => {
    const en = cardSet('en');
    const fr = cardSet('fr');
    expect(en.length).toBeGreaterThanOrEqual(40);
    expect(fr.length).toBe(en.length);
    en.forEach((c, i) => {
      expect(fr[i].answer).toBe(c.answer);
      expect(fr[i].panda).toBe(c.panda);
      expect(c.text.length).toBeGreaterThan(3);
      expect(fr[i].text.length).toBeGreaterThan(3);
    });
  });

  it('only uses old/new answers, has both kinds, and Panda bonus cards are always OLD', () => {
    const answers = new Set(CARDS.map((c) => c.a));
    expect([...answers].sort()).toEqual(['new', 'old']);
    expect(CARDS.filter((c) => c.a === 'new').length).toBeGreaterThanOrEqual(15);
    expect(CARDS.filter((c) => c.a === 'old' && !c.panda).length).toBeGreaterThanOrEqual(15);
    const panda = CARDS.filter((c) => c.panda);
    expect(panda.length).toBeGreaterThanOrEqual(3);
    panda.forEach((c) => expect(c.a).toBe('old'));
  });

  it('has no duplicate statement', () => {
    for (const lang of ['en', 'fr']) {
      const texts = cardSet(lang).map((c) => c.text);
      expect(new Set(texts).size).toBe(texts.length);
    }
  });

  it('has the same text keys in EN and FR', () => {
    expect(Object.keys(TEXTS.fr).sort()).toEqual(Object.keys(TEXTS.en).sort());
    expect(TEXTS.en.howto.length).toBeGreaterThanOrEqual(2);
    expect(TEXTS.en.howto.length).toBeLessThanOrEqual(4);
  });
});

describe('w08 answer checking', () => {
  it('maps left to OLD and right to NEW', () => {
    expect(choiceFrom('left')).toBe('old');
    expect(choiceFrom('right')).toBe('new');
    expect(choiceFrom('up')).toBe(null);
  });

  it('checks answers strictly', () => {
    expect(isCorrect('old', 'old')).toBe(true);
    expect(isCorrect('new', 'old')).toBe(false);
    expect(isCorrect(undefined, undefined)).toBe(false);
  });

  it('scores a right answer and counts a wrong one as a mistake', () => {
    const q = make();
    const r = right(q);
    expect(r.correct).toBe(true);
    expect(r.points).toBeGreaterThan(0);
    expect(q.correct).toBe(1);
    unlock(q);
    const w = wrong(q);
    expect(w.correct).toBe(false);
    expect(q.mistakes).toBe(1);
    expect(q.streak).toBe(0);
  });

  it('ignores answers during the lock between cards', () => {
    const q = make();
    right(q);
    expect(q.answer('old').ignored).toBe(true);
    unlock(q);
    expect(q.answer(q.current().answer).ignored).toBe(false);
  });

  it('ends the run after 3 mistakes', () => {
    const q = make();
    for (let i = 0; i < MAX_MISTAKES - 1; i++) { wrong(q); unlock(q); }
    expect(q.over).toBe(false);
    const last = wrong(q);
    expect(last.gameOver).toBe(true);
    expect(q.over).toBe(true);
    expect(q.won).toBe(false);
    expect(q.answer('old').ignored).toBe(true);
  });

  it('doubles points on Panda bonus cards', () => {
    expect(pointsFor({ multiplier: 2, timeLeft: 1, cardTime: 2, bonus: true })).toBe(2 * pointsFor({ multiplier: 2, timeLeft: 1, cardTime: 2 }));
  });
});

describe('w08 timer', () => {
  it('shrinks the card time as cards are answered, down to a floor', () => {
    expect(cardTimeFor(0, 'normal')).toBe(MODES.normal.cardTime);
    expect(cardTimeFor(10, 'normal')).toBeLessThan(cardTimeFor(0, 'normal'));
    expect(cardTimeFor(1000, 'normal')).toBe(MODES.normal.minCardTime);
  });

  it('gives easy more time than hard', () => {
    for (const n of [0, 10, 40]) expect(cardTimeFor(n, 'easy')).toBeGreaterThan(cardTimeFor(n, 'hard'));
  });

  it('counts a timeout as a mistake and deals the next card', () => {
    const q = make({ mode: 'hard' });
    const before = q.answered;
    let ev = { timeout: false };
    for (let i = 0; i < 400 && !ev.timeout; i++) ev = q.step(0.02);
    expect(ev.timeout).toBe(true);
    expect(q.mistakes).toBe(1);
    expect(q.answered).toBe(before + 1);
    expect(q.cardLeft).toBe(q.cardTime);
  });

  it('pays more for faster answers', () => {
    expect(pointsFor({ timeLeft: 3, cardTime: 3 })).toBeGreaterThan(pointsFor({ timeLeft: 0.3, cardTime: 3 }));
  });

  it('ends as a win when the clock runs out', () => {
    const q = make({ mode: 'easy', duration: 5 });
    let ev = {};
    for (let i = 0; i < 300 && !q.over; i++) {
      if (q.lock === 0) right(q);
      ev = q.step(0.05);
    }
    expect(ev.timeUp).toBe(true);
    expect(q.won).toBe(true);
    expect(DURATION).toBeGreaterThanOrEqual(45);
  });
});

describe('w08 streaks and stars', () => {
  it('raises the multiplier every 4 right answers, capped at x5', () => {
    expect(multiplierFor(0)).toBe(1);
    expect(multiplierFor(3)).toBe(1);
    expect(multiplierFor(4)).toBe(2);
    expect(multiplierFor(8)).toBe(3);
    expect(multiplierFor(100)).toBe(5);
  });

  it('builds a streak, and a mistake resets it', () => {
    const q = make();
    for (let i = 0; i < 5; i++) { right(q); unlock(q); }
    expect(q.streak).toBe(5);
    expect(q.multiplier()).toBe(2);
    wrong(q);
    expect(q.streak).toBe(0);
    expect(q.bestStreak).toBe(5);
  });

  it('forgives a mistake after a long streak on easy, never on hard', () => {
    const easy = make({ mode: 'easy' });
    wrong(easy); unlock(easy);
    let healed = false;
    for (let i = 0; i < MODES.easy.heal; i++) { healed = right(easy).healed || healed; unlock(easy); }
    expect(healed).toBe(true);
    expect(easy.mistakes).toBe(0);
    const hard = make({ mode: 'hard' });
    wrong(hard); unlock(hard);
    for (let i = 0; i < 30; i++) { right(hard); unlock(hard); }
    expect(hard.mistakes).toBe(1);
  });

  it('awards 1 to 3 stars on right answers, harder thresholds on hard', () => {
    expect(starsFor(0, 'normal')).toBe(1);
    expect(starsFor(MODES.normal.stars[0], 'normal')).toBe(2);
    expect(starsFor(MODES.normal.stars[1], 'normal')).toBe(3);
    expect(MODES.hard.stars[1]).toBeGreaterThan(MODES.easy.stars[1]);
    expect(starsFor(MODES.easy.stars[1], 'hard')).toBeLessThan(3);
  });

  it('deals every card before reshuffling, never the same card twice in a row', () => {
    const cards = cardSet('en');
    const q = createQuiz({ cards, random: seeded(7) });
    const seen = new Set();
    let prev = -1;
    for (let i = 0; i < cards.length * 3; i++) {
      if (i < cards.length) seen.add(q.card);
      expect(q.card).not.toBe(prev);
      prev = q.card;
      q.answer(q.current().answer);
      unlock(q);
    }
    expect(seen.size).toBe(cards.length);
  });

  it('shuffles deterministically with a seeded random', () => {
    expect(shuffled(10, seeded(3))).toEqual(shuffled(10, seeded(3)));
    expect([...shuffled(10, seeded(3))].sort((a, b) => a - b)).toEqual([...Array(10).keys()]);
  });
});
