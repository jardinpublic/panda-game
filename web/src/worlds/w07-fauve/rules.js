// World 7 rules, no rendering: Cous's 40th, "Soirée fauve". Guests shout
// costume orders, Panda picks items from a 6-card wardrobe before the order
// timer runs out. Wrong item = time loss and the combo breaks; timeouts cost
// a heart. Unit-tested in test/w07-fauve.test.js.

export const SLOTS = ['hat', 'top', 'bottom', 'face', 'accessory'];

/** Panda's real party costumes (and Cous's guinea-pig shirt). */
export const ITEMS = {
  horns: { slot: 'hat', emoji: '🐂' },
  cowboy: { slot: 'hat', emoji: '🤠' },
  partyhat: { slot: 'hat', emoji: '🥳' },
  fishnet: { slot: 'top', emoji: '🕸️' },
  hawaii: { slot: 'top', emoji: '🐹' },
  leopard: { slot: 'bottom', emoji: '🐆' },
  trunk: { slot: 'bottom', emoji: '🐘' },
  tutu: { slot: 'bottom', emoji: '🩰' },
  luchador: { slot: 'face', emoji: '🤼' },
  glitter: { slot: 'face', emoji: '✨' },
  sunglasses: { slot: 'face', emoji: '🕶️' },
  feathers: { slot: 'accessory', emoji: '🪶' },
  lei: { slot: 'accessory', emoji: '🌺' },
  guitar: { slot: 'accessory', emoji: '🎸' },
};
export const ITEM_IDS = Object.keys(ITEMS);

/** Named costumes a guest may shout (one item per slot). */
export const THEMES = {
  fauve: ['leopard', 'horns'],
  cous: ['hawaii', 'sunglasses'],
  lucha: ['luchador', 'fishnet', 'leopard'],
  carnival: ['feathers', 'glitter', 'tutu'],
  oldcous: ['cowboy', 'sunglasses', 'guitar'],
  disco: ['partyhat', 'fishnet', 'glitter', 'guitar'],
  jungle: ['horns', 'trunk', 'lei', 'luchador'],
  total: ['horns', 'fishnet', 'leopard', 'luchador', 'feathers'],
};

export const GUESTS = ['cous', 'romain', 'mamar', 'victor', 'babar', 'greg', 'aline', 'eugenie', 'violaine'];
export const WARDROBE_SIZE = 6;
export const BETWEEN = 1.0;

export const MODES = {
  easy: { duration: 70, hearts: 5, minItems: 2, maxItems: 4, base: 4, perItem: 2.2, wrongPenalty: 1, reshuffle: false, babarEvery: 22, stars: [8, 13] },
  normal: { duration: 75, hearts: 3, minItems: 2, maxItems: 5, base: 2.5, perItem: 1.5, wrongPenalty: 1.5, reshuffle: false, babarEvery: 16, stars: [10, 15] },
  hard: { duration: 85, hearts: 3, minItems: 3, maxItems: 5, base: 2, perItem: 1.15, wrongPenalty: 2, reshuffle: true, babarEvery: 11, stars: [11, 16] },
};

/** Items per order at a given progress (0..1). */
export function itemsFor(cfg, progress) {
  const span = cfg.maxItems - cfg.minItems + 1;
  return Math.min(cfg.maxItems, cfg.minItems + Math.floor(Math.min(0.999, progress) * span));
}

/** Seconds allowed for an order of n items: shrinks by 25% over the run. */
export function orderTime(cfg, n, progress) {
  return (cfg.base + cfg.perItem * n) * (1 - 0.25 * Math.min(1, progress));
}

/** Points for a finished order: items, time left, combo multiplier (+25% per combo step, max x3). */
export function orderPoints(n, timeLeft, combo) {
  const mult = 1 + 0.25 * Math.min(8, Math.max(0, combo - 1));
  return Math.round((100 * n + Math.max(0, timeLeft) * 10) * mult);
}

/** Stars on outfits completed. */
export function starsFor(cfg, completed) {
  if (completed >= cfg.stars[1]) return 3;
  if (completed >= cfg.stars[0]) return 2;
  return 1;
}

/**
 * Creates the party state. random: seeded 0..1 generator (ctx.random).
 * step(dt) every frame returns the shared events object; pick(i) when the
 * player chooses wardrobe card i (0..5) returns {type, item, points}.
 */
export function createFauveGame({ mode = 'normal', random = Math.random } = {}) {
  const cfg = MODES[mode] || MODES.normal;
  const ev = {};
  function resetEvents() {
    ev.order = null; ev.timeout = false; ev.babar = false; ev.won = false; ev.lost = false;
  }
  resetEvents();
  const pickOne = (list) => list[Math.floor(random() * list.length)];
  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  const s = {
    cfg, mode, time: 0, duration: cfg.duration,
    hearts: cfg.hearts, score: 0, completed: 0, wrongs: 0, misses: 0, combo: 0, bestCombo: 0,
    phase: 'between', betweenLeft: 1.2,
    order: null, outfit: {}, wardrobe: [], lastGuest: '', lastTheme: '',
    babarTimer: cfg.babarEvery * 0.6,
    over: false, won: false,
    events: ev,

    progress() { return Math.min(1, s.time / s.duration); },
    stars() { return starsFor(cfg, s.completed); },
    /** True when the item is worn in its slot. */
    wearing(id) { return s.outfit[ITEMS[id].slot] === id; },
    remaining() { return s.order ? s.order.items.filter((id) => !s.wearing(id)).length : 0; },

    buildWardrobe(required) {
      const cards = required.slice();
      // Same-slot look-alikes first (that is where the confusion is), then anything.
      const sameSlot = shuffle(ITEM_IDS.filter((id) => !cards.includes(id) && required.some((r) => ITEMS[r].slot === ITEMS[id].slot)));
      for (const id of sameSlot) if (cards.length < WARDROBE_SIZE) cards.push(id);
      const others = shuffle(ITEM_IDS.filter((id) => !cards.includes(id)));
      for (const id of others) if (cards.length < WARDROBE_SIZE) cards.push(id);
      return shuffle(cards);
    },

    newOrder() {
      const p = s.progress();
      const n = itemsFor(cfg, p);
      let items;
      let theme = null;
      const themed = Object.keys(THEMES).filter((k) => THEMES[k].length === n && k !== s.lastTheme);
      if (themed.length && random() < 0.45) {
        theme = pickOne(themed);
        items = THEMES[theme].slice();
      } else {
        const slots = shuffle(SLOTS.slice()).slice(0, n);
        items = slots.map((slot) => pickOne(ITEM_IDS.filter((id) => ITEMS[id].slot === slot)));
      }
      s.lastTheme = theme || '';
      const guest = pickOne(GUESTS.filter((g) => g !== s.lastGuest));
      s.lastGuest = guest;
      const timeMax = orderTime(cfg, n, p);
      s.order = { guest, theme, items, timeMax, timeLeft: timeMax, clean: true };
      s.outfit = {};
      s.wardrobe = s.buildWardrobe(items);
      s.phase = 'order';
      ev.order = s.order;
    },

    /** Babar's lighter tap: Panda jumps and the wardrobe gets mixed up. */
    shuffleWardrobe() {
      shuffle(s.wardrobe);
    },

    pick(index) {
      if (s.over || s.phase !== 'order') return { type: 'idle', item: null, points: 0 };
      const item = s.wardrobe[index];
      if (!item) return { type: 'idle', item: null, points: 0 };
      const o = s.order;
      if (o.items.includes(item)) {
        if (s.wearing(item)) return { type: 'already', item, points: 0 };
        s.outfit[ITEMS[item].slot] = item;
        if (s.remaining() === 0) return { type: 'complete', item, points: s.completeOrder() };
        if (cfg.reshuffle) s.shuffleWardrobe();
        return { type: 'correct', item, points: 0 };
      }
      // Wrong item: Panda puts it on anyway (and may lose a right one in that slot).
      s.outfit[ITEMS[item].slot] = item;
      o.timeLeft -= cfg.wrongPenalty;
      o.clean = false;
      s.combo = 0;
      s.wrongs++;
      return { type: 'wrong', item, points: 0 };
    },

    completeOrder() {
      const o = s.order;
      s.completed++;
      s.combo++;
      s.bestCombo = Math.max(s.bestCombo, s.combo);
      const points = orderPoints(o.items.length, o.timeLeft, s.combo);
      s.score += points;
      o.cake = false;
      if (s.completed % 5 === 0 && s.hearts < cfg.hearts) { s.hearts++; o.cake = true; }
      s.phase = 'between';
      s.betweenLeft = BETWEEN;
      return points;
    },

    step(dt) {
      resetEvents();
      if (s.over) return ev;
      s.time += dt;
      if (s.time >= s.duration) {
        s.over = true;
        s.won = true;
        s.phase = 'over';
        ev.won = true;
        return ev;
      }
      if (s.phase === 'between') {
        s.betweenLeft -= dt;
        if (s.betweenLeft <= 0) s.newOrder();
        return ev;
      }
      const o = s.order;
      o.timeLeft -= dt;
      if (o.timeLeft <= 0) {
        o.timeLeft = 0;
        s.hearts--;
        s.misses++;
        s.combo = 0;
        ev.timeout = true;
        if (s.hearts <= 0) { s.over = true; s.won = false; s.phase = 'over'; ev.lost = true; return ev; }
        s.phase = 'between';
        s.betweenLeft = BETWEEN;
        return ev;
      }
      s.babarTimer -= dt;
      if (s.babarTimer <= 0) {
        s.babarTimer = cfg.babarEvery;
        s.shuffleWardrobe();
        ev.babar = true;
      }
      return ev;
    },
  };
  return s;
}
