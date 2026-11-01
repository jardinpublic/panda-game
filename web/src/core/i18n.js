// English / French text. The game starts in the browser language and can be
// switched live; every visible string goes through t().

import { STRINGS } from './strings.js';

const LISTENERS = new Set();
let current = pickInitial(typeof navigator !== 'undefined' ? navigator.language : 'en');

/** Maps a browser language to a supported locale ("fr" for any fr-*, else "en"). */
export function pickInitial(language) {
  return String(language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export function locale() {
  return current;
}

export function setLocale(next) {
  current = next === 'fr' ? 'fr' : 'en';
  LISTENERS.forEach((fn) => fn(current));
}

export function toggleLocale() {
  setLocale(current === 'fr' ? 'en' : 'fr');
}

/** Calls fn(locale) whenever the language changes. Returns an unsubscribe function. */
export function onLocaleChange(fn) {
  LISTENERS.add(fn);
  return () => LISTENERS.delete(fn);
}

/**
 * Translated text for key, with {name} placeholders filled from vars.
 * Falls back to English, then to the key itself so missing text is visible.
 */
export function t(key, vars = {}) {
  const entry = STRINGS[key];
  let text = entry ? (entry[current] ?? entry.en) : key;
  if (Array.isArray(text)) text = text[Math.floor(Math.random() * text.length)];
  return String(text).replace(/\{(\w+)\}/g, (_, name) => (name in vars ? vars[name] : `{${name}}`));
}
