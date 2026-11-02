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

// ---- Home screen app and offline play (same approach as Guinea Run) ----------------

// The browser offers "Install" once, early: keep the offer for the home page button.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__installPrompt = e;
  window.dispatchEvent(new Event('pandadventures:installable'));
});
window.addEventListener('appinstalled', () => {
  window.__installPrompt = null;
  try {
    localStorage.setItem('pandadventures.installed', '1');
  } catch {
    // No storage.
  }
  window.dispatchEvent(new Event('pandadventures:installable'));
});

/**
 * The service worker (sw.js) keeps a copy of the game, so it plays offline once
 * opened online. Off on a local dev server unless ?offline=1; ?offline=0
 * removes it and its copies. A new version waits: a banner offers to switch.
 */
function keepOffline() {
  try {
    if (!('serviceWorker' in navigator)) return;
    const setting = new URLSearchParams(location.search).get('offline');
    if (setting === '0') {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .then(() => caches.keys())
        .then((names) => Promise.all(names.filter((n) => n.startsWith('pandadventures-')).map((n) => caches.delete(n))))
        .catch(() => {});
      return;
    }
    const local = ['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname) || /^192\.168\./.test(location.hostname);
    if (local && setting !== '1') return;
    const register = () =>
      navigator.serviceWorker
        .register('./sw.js', { scope: './' })
        .then((reg) => {
          const offer = (worker) => {
            if (!worker || !navigator.serviceWorker.controller) return;
            showUpdate(worker);
          };
          if (reg.waiting) offer(reg.waiting);
          reg.addEventListener('updatefound', () => {
            const worker = reg.installing;
            worker?.addEventListener('statechange', () => {
              if (worker.state === 'installed') offer(worker);
            });
          });
        })
        .catch(() => {});
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (window.__updating && !reloaded) {
        reloaded = true;
        location.reload();
      }
    });
    if ('requestIdleCallback' in window) requestIdleCallback(register, { timeout: 5000 });
    else setTimeout(register, 2000);
  } catch {
    // A browser that refuses service workers: the game plays online, as before.
  }
}

/** A small banner: a new version of the game is ready. */
function showUpdate(worker) {
  if (document.querySelector('.m-update')) return;
  const fr = (navigator.language || '').toLowerCase().startsWith('fr');
  const bar = document.createElement('button');
  bar.className = 'm-update';
  bar.textContent = fr ? 'Nouvelle version prête : touche pour mettre à jour' : 'New version ready: tap to update';
  bar.style.cssText =
    'position:fixed;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:50;' +
    'font:600 15px Fredoka,system-ui,sans-serif;color:#fff;background:#ef2d6b;border:0;border-radius:999px;padding:10px 18px;' +
    'box-shadow:0 8px 24px rgba(20,10,40,.35);max-width:92vw';
  bar.onclick = () => {
    window.__updating = true;
    worker.postMessage('skip');
    bar.remove();
  };
  document.body.appendChild(bar);
}

keepOffline();
