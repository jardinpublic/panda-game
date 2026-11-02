// After a deploy, a page cached for a few minutes can ask for code files that
// no longer exist: reload once to get the new ones.
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault();
  let done = false;
  try {
    done = sessionStorage.getItem('pandadventures.reloaded') === '1';
    sessionStorage.setItem('pandadventures.reloaded', '1');
  } catch {
    // No storage: reload anyway, once per page view.
  }
  if (!done) location.reload();
});

// Entry point: the micro-game marathon. The older 3D world-by-world
// version is still reachable with ?classic while it is being retired.
if (new URLSearchParams(location.search).has('classic')) import('./main.js').catch(() => window.dispatchEvent(new Event('vite:preloadError')));
else import('./marathon/app.js').catch(() => window.dispatchEvent(new Event('vite:preloadError')));
