import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  globalName: 'Api2Trade', // Used for the browser IIFE build (e.g. window.Api2Trade)
  dts: true, // Generate declaration files
  splitting: false,
  sourcemap: true,
  clean: true,
  target: 'es2020',
  platform: 'node',
  skipNodeModulesBundle: true,
  external: ['ws', 'isomorphic-ws'],
});
