// When and how the game offers to be installed.
import { describe, it, expect } from 'vitest';
import { installMode } from '../src/marathon/install.js';

const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';

describe('install offer', () => {
  it('uses the browser prompt when there is one', () => {
    expect(installMode({ hasPrompt: true, ua: ANDROID })).toBe('prompt');
    expect(installMode({ hasPrompt: true, ua: DESKTOP })).toBe('prompt');
  });

  it('still offers on Android when Chrome holds its prompt back (after an uninstall, say)', () => {
    expect(installMode({ ua: ANDROID })).toBe('android');
  });

  it('gives the Safari steps on iPhone and iPad', () => {
    expect(installMode({ ua: IPHONE })).toBe('ios');
    expect(installMode({ ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel', touchPoints: 5 })).toBe('ios');
  });

  it('says nothing inside the installed app, when the app is already on the phone, or where it cannot install', () => {
    expect(installMode({ standalone: true, hasPrompt: true, ua: ANDROID })).toBe(null);
    expect(installMode({ appOnPhone: true, ua: ANDROID })).toBe(null);
    expect(installMode({ ua: DESKTOP })).toBe(null);
  });
});
