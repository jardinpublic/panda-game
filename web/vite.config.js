import { defineConfig } from 'vite';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Offline copy: after the build, writes the list of every built file and a
 * version (a hash of them) into dist/sw.js, so the service worker saves the
 * whole game and an update never mixes two versions. Same idea as Guinea Run.
 */
function offlineCopy() {
  let outDir = 'dist';
  return {
    name: 'offline-copy',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const files = [];
      const walk = (dir) => {
        for (const name of readdirSync(dir).sort()) {
          const full = join(dir, name);
          if (statSync(full).isDirectory()) walk(full);
          else if (name !== 'sw.js' && !name.endsWith('.map')) files.push(full);
        }
      };
      walk(outDir);
      const hash = createHash('sha256');
      const list = ['./'];
      for (const file of files) {
        const name = relative(outDir, file).split(sep).join('/');
        list.push(name);
        hash.update(name).update(readFileSync(file));
      }
      const swPath = join(outDir, 'sw.js');
      const source = readFileSync(swPath, 'utf8');
      const built = source
        .replace("const VERSION = 'dev';", `const VERSION = ${JSON.stringify(hash.digest('hex').slice(0, 16))};`)
        .replace('const FILES = [];', `const FILES = ${JSON.stringify(list, null, 2)};`);
      if (built === source || built.includes("const VERSION = 'dev'")) throw new Error('offline copy: sw.js placeholders not found');
      writeFileSync(swPath, built, 'utf8');
    },
  };
}

// base './' so the build works from any folder or static host.
export default defineConfig({
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 1200 },
  plugins: [offlineCopy()],
  // Whole-game simulations (flipper bot games) take several seconds on slow CI machines.
  test: { environment: 'node', testTimeout: 60000 },
});
