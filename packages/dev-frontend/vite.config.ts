/// <reference types="vitest" />

import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    nodePolyfills({
      include: ["assert", "buffer", "events", "http", "https", "stream", "util", "zlib"]
    })
  ],
  optimizeDeps: {
    include: [
      "@secured-finance/providers",
      "@secured-finance/lib-ethers",
      "@secured-finance/lib-base",
      "@secured-finance/lib-react"
    ]
  },
  build: {
    commonjsOptions: {
      include: ["**.cjs", "**.js"]
    }
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: "./src/setupTests.ts",
    testTimeout: 10000
  },
  server: {
    cors: false
  }
});
