import { defineConfig } from 'vite';
import esmodule from 'vite-plugin-esmodule';
import injectHTML from 'vite-plugin-html-inject';

export default defineConfig({
  build: {
    sourcemap: false,
  },
  plugins: [
    injectHTML(),
    esmodule([
      'node-fetch',
    ]),
  ],
  server: {
    port: 3000,
  }
});
