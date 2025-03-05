/// <reference types="vitest" />

import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: "./",
    plugins: [
      react(),
      nodePolyfills({
        include: ["assert", "buffer", "events", "http", "https", "stream", "util", "zlib"]
      })
    ],
    optimizeDeps: {
      include: [
        "@secured-finance/stablecoin-lib-ethers",
        "@secured-finance/stablecoin-lib-base",
        "@secured-finance/stablecoin-lib-react"
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
    },
    define: {
      "process.env.LIQUIDATION_RESERVE": env.LIQUIDATION_RESERVE || 20,
      "process.env.MINIMUM_NET_DEBT": env.MINIMUM_NET_DEBT || 200
    }
  };
});
