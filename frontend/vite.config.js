import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createDevProxyOptions, devServerLogger } from "./vite-plugins/devProxyLogger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendTarget = process.env.VITE_DEV_API_TARGET || "http://127.0.0.1:5157";

// https://vite.dev/config/
export default defineConfig({
  envDir: __dirname,
  plugins: [react(), tailwindcss(), devServerLogger(backendTarget)],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    proxy: {
      "/api": createDevProxyOptions(backendTarget),
      "/hubs": createDevProxyOptions(backendTarget, { webSocket: true }),
    },
  },
});
