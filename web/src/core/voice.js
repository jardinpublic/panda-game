/*
 * The gang's own voices, recorded by them (web/public/voices/<who>/), played
 * when one of their catchphrases shows on screen: Panda's "Hoho"
 * (voices/panda/hoho-*.wav) for any line with "Hoho" in it, and "Hoho bah la
 * merguez est bien cuite là" (voices/panda/merguez-cuite.wav, Romain doing
 * Panda) for any line about the merguez being well cooked, in every game.
 *
 *   heard(text)        // call wherever a line is drawn or shown, even every frame:
 *                      // it plays once when the line appears, not while it stays
 *   setVoiceMuted(bool) // follows the game's sound button
 *
 * Its own small AudioContext, woken by the first tap or key (browsers need a gesture).
 */

/** Recorded clips by catchphrase; one is picked at random each time. */
export const CLIPS = {
  hoho: ['voices/panda/hoho-1.wav'],
  cuite: ['voices/panda/merguez-cuite.wav'],
};

/** Does this line say the merguez is well cooked ("bien cuite" / "well done")? */
export function hasCuite(text) {
  return /merguez (est|is) (bien cuite|well done)/i.test(String(text || ''));
}

/** Which recorded clip a line calls for: the longer catchphrase first, then "Hoho". */
export function clipFor(text) {
  if (hasCuite(text)) return 'cuite';
  if (hasHoho(text)) return 'hoho';
  return null;
}

/** Does this line say "Hoho" (Hoho, HOHO, Hohoho…)? */
export function hasHoho(text) {
  return /(^|[^\p{L}])ho(ho)+(?![\p{L}])/iu.test(String(text || ''));
}

/**
 * The logic without the audio (testable): `play(name)` is called when a
 * catchphrase line appears, at most once every `gap` seconds.
 */
export function createVoice({ play, now = () => performance.now() / 1000, gap = 1.1, forget = 0.6 }) {
  let muted = false;
  let last = -99;
  const seen = new Map();
  let sweep = 0;
  return {
    setMuted(v) {
      muted = !!v;
    },
    get muted() {
      return muted;
    },
    heard(text) {
      const clip = clipFor(text);
      if (!clip) return false;
      const t = now();
      const key = String(text);
      const before = seen.get(key);
      seen.set(key, t);
      if (t - sweep > 5) {
        sweep = t;
        for (const [k, at] of seen) if (t - at > forget * 4) seen.delete(k);
      }
      // Still on screen since last time: not a new line
      if (before !== undefined && t - before < forget) return false;
      if (muted || t - last < gap) return false;
      last = t;
      play(clip);
      return true;
    },
  };
}

/* ---------------- The audio ---------------- */

let ctx = null;
const buffers = new Map();
const loading = new Map();

function base() {
  return (import.meta.env && import.meta.env.BASE_URL) || './';
}

function context() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function load(url) {
  if (buffers.has(url)) return Promise.resolve(buffers.get(url));
  if (!loading.has(url)) {
    const ac = context();
    if (!ac) return Promise.resolve(null);
    loading.set(
      url,
      fetch(base() + url)
        .then((r) => r.arrayBuffer())
        .then((data) => new Promise((ok, ko) => ac.decodeAudioData(data, ok, ko)))
        .then((buf) => {
          buffers.set(url, buf);
          return buf;
        })
        .catch(() => null)
    );
  }
  return loading.get(url);
}

function playClip(name) {
  const list = CLIPS[name];
  const ac = context();
  if (!list || !list.length || !ac) return;
  const url = list[Math.floor(Math.random() * list.length)];
  const asked = ac.currentTime;
  load(url).then((buf) => {
    // Too late (still loading after half a second): skip rather than talk over the next line
    if (!buf || ac.currentTime - asked > 0.5) return;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const g = ac.createGain();
    g.gain.value = 0.95;
    src.connect(g);
    g.connect(ac.destination);
    src.start();
  });
}

const voice = createVoice({ play: playClip });

export const heard = (text) => voice.heard(text);
export const setVoiceMuted = (v) => voice.setMuted(v);

// Wake the audio on the first gesture and load the clips, so the first Hoho is on time
if (typeof window !== 'undefined') {
  const wake = () => {
    if (voice.muted) return;
    if (context()) for (const list of Object.values(CLIPS)) for (const url of list) load(url);
  };
  window.addEventListener('pointerdown', wake, { capture: true, passive: true });
  window.addEventListener('keydown', wake, { capture: true, passive: true });
}
