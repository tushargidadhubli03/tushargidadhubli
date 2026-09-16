// A one-file build, only for previewing before publication. Every chunk, style, font and
// texture is inlined so the page runs from a bare file:// with no server. The real build
// (vite.config.js) is untouched and is what ships.
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist-preview',
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    rollupOptions: {output: {inlineDynamicImports: true}},
  },
});
