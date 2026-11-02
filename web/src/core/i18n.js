// English / French text. The game starts in French (the gang's language),
// whatever the phone's language; the language button switches it live and the
// choice is remembered. Every visible string goes through t().

import { STRINGS } from './strings.js';

const LANG_KEY = 'pandadventures.lang';
const LISTENERS = new Set();
let current = pickInitial(readChoice());

/** The starting locale: the language chosen earlier with the button, else French. */
export function pickInitial(chosen) {
  return chosen === 'en' ? 'en' : 'fr';
}

function readChoice() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(LANG_KEY) : null;
  } catch {
    return null;
  }
}

export function locale() {
  return current;
}

export function setLocale(next) {
  current = next === 'fr' ? 'fr' : 'en';
  try {
    localStorage.setItem(LANG_KEY, current);
  } catch {
    // No storage (private mode, tests): the choice lasts until the page closes.
  }
  if (typeof document !== 'undefined') document.documentElement.lang = current;
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
