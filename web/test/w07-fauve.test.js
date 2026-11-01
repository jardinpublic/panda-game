import { describe, it, expect } from 'vitest';
import {
  createFauveGame, MODES, ITEMS, ITEM_IDS, THEMES, SLOTS, GUESTS, WARDROBE_SIZE, BETWEEN,
  itemsFor, orderTime, orderPoints, starsFor,
} from '../src/worlds/w07-fauve/rules.js';
import { TEXTS } from '../src/worlds/w07-fauve/index.js';

function seeded(seed = 4242) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}
const DT = 1 / 60;
const make = (mode = 'normal') => createFauveGame({ mode, random: seeded() });
/** Steps until an order is on. */
function toOrder(g) {
  for (let i = 0; i < 600 && g.phase !== 'order' && !g.over; i++) g.step(DT);
  return g.order;
}
const indexOf = (g, id) => g.wardrobe.indexOf(id);
const wrongIndex = (g) => g.wardrobe.findIndex((id) => !g.order.items.includes(id));

describe('w07 catalogue and texts', () => {
  it('every item has a slot and every slot at least two items', () => {
    for (const id of ITEM_IDS) expect(SLOTS).toContain(ITEMS[id].slot);
    for (const slot of SLOTS) expect(ITEM_IDS.filter((id) => ITEMS[id].slot === slot).length).toBeGreaterThanOrEqual(2);
  });

  it('themes use one item per slot', () => {
    for (const items of Object.values(THEMES)) {
      const slots = items.map((id) => ITEMS[id].slot);
      expect(new Set(slots).size).toBe(items.length);
    }
  });

  it('has every friend except Panda as a guest', () => {
    expect(GUESTS.length).toBe(9);
    expect(GUESTS).not.toContain('panda');
  });

  it('has English and French for the same keys, items and themes included', () => {
    expect(Object.keys(TEXTS.fr).sort()).toEqual(Object.keys(TEXTS.en).sort());
    for (const id of ITEM_IDS) expect(TEXTS.fr[`item_${id}`]).toBeTruthy();
    for (const k of Object.keys(THEMES)) expect(TEXTS.en[`theme_${k}`]).toBeTruthy();
    expect(TEXTS.fr.slip).toBe('Mais qu\'est-ce que c\'est que ce slip, Panda ?!');
  });
});

describe('w07 orders', () => {
  it('starts with an order whose items are all in the 6-card wardrobe', () => {
    const g = make();
    const o = toOrder(g);
    expect(o.items.length).toBe(2);
    expect(g.wardrobe.length).toBe(WARDROBE_SIZE);
    expect(new Set(g.wardrobe).size).toBe(WARDROBE_SIZE);
    for (const id of o.items) expect(g.wardrobe).toContain(id);
  });

  it('orders grow and get faster as the party goes on', () => {
    expect(itemsFor(MODES.normal, 0)).toBe(2);
    expect(itemsFor(MODES.normal, 0.99)).toBe(5);
    expect(itemsFor(MODES.easy, 0.99)).toBe(4);
    expect(itemsFor(MODES.hard, 0)).toBe(3);
    expect(orderTime(MODES.normal, 3, 1)).toBeLessThan(orderTime(MODES.normal, 3, 0));
    expect(orderTime(MODES.hard, 3, 0)).toBeLessThan(orderTime(MODES.easy, 3, 0));
  });

  it('completes an outfit with the right picks and scores it', () => {
    const g = make();
    const o = toOrder(g);
    const first = g.pick(indexOf(g, o.items[0]));
    expect(first.type).toBe('correct');
    expect(g.wearing(o.items[0])).toBe(true);
    expect(g.pick(indexOf(g, o.items[0])).type).toBe('already');
    const last = g.pick(indexOf(g, o.items[1]));
    expect(last.type).toBe('complete');
    expect(last.points).toBeGreaterThanOrEqual(200);
    expect(g.completed).toBe(1);
    expect(g.combo).toBe(1);
    expect(g.phase).toBe('between');
    expect(g.pick(0).type).toBe('idle');
  });

  it('a wrong item costs time, breaks the combo and is worn anyway', () => {
    const g = make();
    const o = toOrder(g);
    g.combo = 4;
    const before = o.timeLeft;
    const i = wrongIndex(g);
    const res = g.pick(i);
    expect(res.type).toBe('wrong');
    expect(o.timeLeft).toBeCloseTo(before - MODES.normal.wrongPenalty);
    expect(g.combo).toBe(0);
    expect(g.wrongs).toBe(1);
    expect(g.wearing(res.item)).toBe(true);
  });

  it('a wrong item in a slot takes off the right one there', () => {
    const g = make();
    const o = toOrder(g);
    const right = o.items[0];
    g.pick(indexOf(g, right));
    const sameSlot = g.wardrobe.find((id) => id !== right && ITEMS[id].slot === ITEMS[right].slot);
    expect(sameSlot).toBeTruthy(); // the wardrobe always holds look-alikes
    g.pick(indexOf(g, sameSlot));
    expect(g.wearing(right)).toBe(false);
    expect(g.remaining()).toBe(o.items.length);
  });

  it('a timeout costs a heart; no hearts left = the party is over', () => {
    const g = make();
    for (let n = 1; n <= MODES.normal.hearts; n++) {
      toOrder(g);
      let ev;
      for (let i = 0; i < 3000 && g.phase === 'order'; i++) ev = g.step(DT);
      expect(ev.timeout).toBe(true);
      expect(g.hearts).toBe(MODES.normal.hearts - n);
    }
    expect(g.over).toBe(true);
    expect(g.won).toBe(false);
  });

  it('Babar\'s lighter shuffles the wardrobe but keeps the same cards', () => {
    const g = make();
    toOrder(g);
    const before = g.wardrobe.slice().sort();
    g.babarTimer = DT / 2;
    const ev = g.step(DT);
    expect(ev.babar).toBe(true);
    expect(g.wardrobe.slice().sort()).toEqual(before);
  });

  it('Greg\'s cake gives a heart back every 5 outfits', () => {
    const g = make();
    g.hearts = 1;
    for (let n = 0; n < 5; n++) {
      const o = toOrder(g);
      for (const id of o.items) g.pick(indexOf(g, id));
    }
    expect(g.completed).toBe(5);
    expect(g.hearts).toBe(2);
    expect(g.order.cake).toBe(true);
  });
});

describe('w07 end, score and stars', () => {
  it('a perfect player finishes the party with 3 stars on every mode', () => {
    for (const mode of ['easy', 'normal', 'hard']) {
      const g = make(mode);
      let guard = 0;
      while (!g.over && guard++ < 20000) {
        if (g.phase === 'order') {
          // Takes ~0.5 s per item, like a quick human.
          for (let i = 0; i < 30; i++) g.step(DT);
          const next = g.order.items.find((id) => !g.wearing(id));
          if (next && g.phase === 'order') g.pick(indexOf(g, next));
        } else g.step(DT);
      }
      expect(g.won).toBe(true);
      expect(g.stars()).toBe(3);
      expect(g.duration).toBeGreaterThanOrEqual(45);
      expect(g.duration).toBeLessThanOrEqual(120);
    }
  });

  it('a do-nothing player loses before the end on normal and hard', () => {
    for (const mode of ['normal', 'hard']) {
      const g = make(mode);
      while (!g.over) g.step(DT);
      expect(g.won).toBe(false);
      expect(g.time).toBeLessThan(g.duration);
    }
  });

  it('combos multiply the points', () => {
    expect(orderPoints(2, 3, 1)).toBe(230);
    expect(orderPoints(2, 3, 3)).toBe(345);
    expect(orderPoints(2, 3, 50)).toBe(690);
    expect(orderPoints(3, -1, 1)).toBe(300);
  });

  it('stars follow the outfits completed', () => {
    expect(starsFor(MODES.normal, 0)).toBe(1);
    expect(starsFor(MODES.normal, MODES.normal.stars[0])).toBe(2);
    expect(starsFor(MODES.normal, MODES.normal.stars[1])).toBe(3);
    expect(MODES.hard.stars[1]).toBeGreaterThan(MODES.easy.stars[1]);
  });

  it('pauses between orders', () => {
    const g = make();
    const o = toOrder(g);
    for (const id of o.items) g.pick(indexOf(g, id));
    for (let t = 0; t < BETWEEN - 0.1; t += DT) g.step(DT);
    expect(g.phase).toBe('between');
    toOrder(g);
    expect(g.order).not.toBe(o);
  });
});
