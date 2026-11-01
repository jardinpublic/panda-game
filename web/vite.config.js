import { defineConfig } from 'vite';

// base './' so the build works from any folder or static host.
export default defineConfig({
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
  test: { environment: 'node' },
});
