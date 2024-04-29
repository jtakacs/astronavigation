import { defineConfig } from 'vite';
import esmodule from 'vite-plugin-esmodule';
import injectHTML from 'vite-plugin-html-inject';
import { resolve } from "path";

export default defineConfig({
  build: {
    sourcemap: false,
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        solstice: resolve(__dirname, "solstice.html"),
        globe: resolve(__dirname, "globe.html"),
        flerf: resolve(__dirname, "flerf.html"),
      }
    },
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
