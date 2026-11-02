/*
 * Pandadventures offline (same approach as Guinea Run in sfdx-hardis-training):
 * a service worker that keeps a copy of the whole game, so it plays without a
 * network once it has been opened online, and from the home screen.
 *
 * On install it saves every file of FILES, all or nothing (a file that fails
 * drops the install, tried again next visit). A new version never takes over a
 * page already open: it waits, and the page offers "Mise à jour" (message
 * "skip"), or it takes over once every game page is closed. Then it deletes
 * the older copies.
 *
 * VERSION and FILES are written by the Vite build (vite.config.js,
 * offlineCopy): a hash of the files and their paths. A copy that was never
 * built ("dev") saves nothing and serves nothing.
 *
 * Google Fonts are kept in their own copy (served from it, refreshed online).
 * Everything else that is not the game's own (GitHub, the Hall of Fame board)
 * stays on the network.
 */

const VERSION = 'dev';
const FILES = [];

const PREFIX = 'pandadventures-';
const CACHE = PREFIX + VERSION;
const FONTS = PREFIX + 'fonts';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(saveGame());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(dropOlderCopies());
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (VERSION === 'dev' || request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin) event.respondWith(fromCopy(request));
  else if (FONT_HOSTS.includes(url.hostname)) event.respondWith(font(request));
});

async function saveGame() {
  if (VERSION === 'dev') return;
  const cache = await caches.open(CACHE);
  // "reload": straight from the server, never a file the browser kept from an older version.
  await cache.addAll(FILES.map((file) => new Request(new URL(file, self.location).href, { cache: 'reload' })));
}

async function dropOlderCopies() {
  const names = await caches.keys();
  await Promise.all(names.filter((name) => name.startsWith(PREFIX) && name !== CACHE && name !== FONTS).map((name) => caches.delete(name)));
}

/** The game's own files: from the copy first (query strings ignored), the network as a fallback. */
async function fromCopy(request) {
  const cache = await caches.open(CACHE);
  // ignoreVary: module scripts send an Origin header the saved copies were not fetched with.
  const hit = await cache.match(request, { ignoreSearch: true, ignoreVary: true });
  if (hit) return hit;
  if (request.mode === 'navigate') {
    const page = (await cache.match(new URL('./', self.location).href, { ignoreVary: true })) || (await cache.match(new URL('index.html', self.location).href, { ignoreVary: true }));
    if (page) return page;
  }
  return fetch(request);
}

/** Fonts: the saved copy at once, refreshed in the background when online. */
async function font(request) {
  const cache = await caches.open(FONTS);
  const hit = await cache.match(request);
  const fresh = fetch(request)
    .then((response) => {
      if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
      return response;
    })
    .catch(() => hit);
  return hit || fresh;
}
