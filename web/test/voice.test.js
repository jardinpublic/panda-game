// Panda's recorded "Hoho": which lines trigger it, and only once per appearance.
import { describe, it, expect } from 'vitest';
import { hasHoho, hasCuite, clipFor, createVoice, CLIPS } from '../src/core/voice.js';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function rig() {
  let t = 0;
  const played = [];
  const v = createVoice({ play: (name) => played.push(name), now: () => t });
  return { v, played, at: (s) => (t = s) };
}

describe('Hoho voice', () => {
  it('spots Hoho in a line, whatever the case, but not inside another word', () => {
    expect(hasHoho('Hoho, ma 103 !')).toBe(true);
    expect(hasHoho('HOHO !')).toBe(true);
    expect(hasHoho("Hoho y'est me")).toBe(true);
    expect(hasHoho('Hohoho !')).toBe(true);
    expect(hasHoho('Hoho les merguez !')).toBe(true);
    expect(hasHoho('Allez Panda !')).toBe(false);
    expect(hasHoho('Ohohé')).toBe(false);
    expect(hasHoho('')).toBe(false);
  });

  it('plays once when the line appears, not every frame it stays on screen', () => {
    const { v, played, at } = rig();
    for (let f = 0; f < 120; f++) {
      at(f / 60);
      v.heard('Hoho, une petite 8.6 ?');
    }
    expect(played).toEqual(['hoho']);
    // Gone for a while, then shown again: a new Hoho
    at(5);
    v.heard('Hoho, une petite 8.6 ?');
    expect(played.length).toBe(2);
  });

  it('never stacks two Hohos on top of each other, and stays quiet when muted', () => {
    const { v, played, at } = rig();
    at(1);
    v.heard('Hoho !');
    at(1.3);
    v.heard('Hoho, y’est me !');
    expect(played.length).toBe(1);
    v.setMuted(true);
    at(10);
    v.heard('Hoho !');
    expect(played.length).toBe(1);
    v.setMuted(false);
    at(20);
    v.heard('Hoho !');
    expect(played.length).toBe(2);
  });

  it('plays Romain’s « la merguez est bien cuite » for that line, the plain Hoho otherwise', () => {
    expect(hasCuite('Hoho, bah la merguez est bien cuite là !')).toBe(true);
    expect(hasCuite('Hoho, well, the merguez is well done now!')).toBe(true);
    expect(clipFor('Hoho, bah la merguez est bien cuite là !')).toBe('cuite');
    expect(clipFor('Hoho les merguez !')).toBe('hoho');
    expect(clipFor('Allez Panda !')).toBe(null);
    const { v, played, at } = rig();
    at(1);
    v.heard('Hoho, bah la merguez est bien cuite là !');
    expect(played).toEqual(['cuite']);
  });

  it('has the recorded clips in the game files', () => {
    for (const url of [...CLIPS.hoho, ...CLIPS.cuite]) expect(existsSync(fileURLToPath(new URL('../public/' + url, import.meta.url)))).toBe(true);
  });
});
