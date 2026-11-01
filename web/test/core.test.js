import { describe, it, expect } from 'vitest';
import { pickInitial } from '../src/core/i18n.js';
import { emptySave, recordRun, bestStars, isUnlocked, totalStars } from '../src/core/save.js';
import { createRunState } from '../src/worlds/w01-escape/rules.js';

describe('i18n', () => {
  it('picks French for any fr-* browser language and English otherwise', () => {
    expect(pickInitial('fr-FR')).toBe('fr');
    expect(pickInitial('FR')).toBe('fr');
    expect(pickInitial('en-US')).toBe('en');
    expect(pickInitial('')).toBe('en');
  });
});

describe('save', () => {
  it('keeps the best stars and score per mode', () => {
    let s = recordRun(emptySave(), 'w01', 'normal', 500, 2);
    s = recordRun(s, 'w01', 'normal', 300, 1);
    expect(s.worlds.w01.stars.normal).toBe(2);
    expect(s.worlds.w01.best.normal).toBe(500);
    expect(bestStars(s, 'w01')).toBe(2);
    expect(totalStars(s)).toBe(2);
  });

  it('unlocks a world once the previous one has a star', () => {
    const order = ['w01', 'w02', 'w03'];
    const s = recordRun(emptySave(), 'w01', 'easy', 10, 1);
    expect(isUnlocked(emptySave(), order, 'w01')).toBe(true);
    expect(isUnlocked(emptySave(), order, 'w02')).toBe(false);
    expect(isUnlocked(s, order, 'w02')).toBe(true);
    expect(isUnlocked(s, order, 'w03')).toBe(false);
  });

  it('keeps the hall of fame sorted and capped at 50', () => {
    let s = emptySave();
    for (let i = 0; i < 60; i++) s = recordRun(s, 'w01', 'easy', i, 1);
    expect(s.hall.length).toBe(50);
    expect(s.hall[0].score).toBe(59);
  });
});

describe('world 1 rules', () => {
  const step = (s, input = {}, dt = 1 / 60) => s.step(dt, { left: false, right: false, jump: false, slide: false, ...input });

  it('changes lane within the three lanes', () => {
    const s = createRunState();
    step(s, { left: true });
    step(s, { left: true });
    expect(s.lane).toBe(0);
    step(s, { right: true }); step(s, { right: true }); step(s, { right: true });
    expect(s.lane).toBe(2);
  });

  it('jumps clear low obstacles, then lands', () => {
    const s = createRunState();
    const ev = step(s, { jump: true });
    expect(ev.jumped).toBe(true);
    for (let i = 0; i < 10; i++) step(s);
    expect(s.passes('jump')).toBe(true);
    let landed = false;
    for (let i = 0; i < 90; i++) landed = step(s).landed || landed;
    expect(landed).toBe(true);
    expect(s.y).toBe(0);
  });

  it('slides under high obstacles but never passes tall ones', () => {
    const s = createRunState();
    step(s, { slide: true });
    expect(s.passes('slide')).toBe(true);
    expect(s.passes('side')).toBe(false);
  });

  it('lets Romain catch up on bumps and drops back with turbo', () => {
    const s = createRunState({ bumpDamage: 30 });
    expect(s.bump()).toBe(true);
    expect(s.bump()).toBe(false); // safety window right after a bump
    s.safe = 0;
    s.bump();
    expect(s.gap).toBe(40);
    s.boost();
    expect(s.gap).toBe(65);
    expect(s.turbo).toBeGreaterThan(0);
    s.safe = 0; s.bump(); s.safe = 0; s.bump(); s.safe = 0; s.bump();
    expect(s.gap).toBe(0);
  });

  it('awards stars on coins and bumps', () => {
    const s = createRunState();
    s.coinsTotal = 100;
    s.coins = 50;
    expect(s.stars()).toBe(1);
    s.coins = 70;
    expect(s.stars()).toBe(2);
    s.coins = 90;
    expect(s.stars()).toBe(3);
    s.bumps = 3;
    expect(s.stars()).toBe(2);
  });
});
