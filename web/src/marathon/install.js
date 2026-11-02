// Can the game be put on the home screen here, and how? Pure, so it is tested
// (web/test/install.test.js); app.js reads the browser and calls it.
//
// Only what the browser says now counts: an old "installed" note in storage
// stays behind when the app is uninstalled, so it is not trusted.

/**
 * 'prompt'  the browser's own install prompt is ready (Android and desktop Chrome)
 * 'ios'     iPhone / iPad: Safari's Share → Add to Home Screen steps
 * 'android' Android without the prompt (Chrome holds it back, other browsers): the menu steps
 * null      already running as the installed app, already on this phone, or no way to install
 */
export function installMode({ standalone = false, hasPrompt = false, appOnPhone = false, ua = '', platform = '', touchPoints = 0 } = {}) {
  if (standalone || appOnPhone) return null;
  if (hasPrompt) return 'prompt';
  if (/iPhone|iPad|iPod/.test(ua) || (platform === 'MacIntel' && touchPoints > 1)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return null;
}
