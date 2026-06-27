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
    dedupe: ["react", "react-dom", "react-is"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime"],
  },
  server: {
    host: true,
    allowedHosts: [
      "class.wpcteam.homes",
      "localhost",
      ".wpcteam.homes",
    ],
    proxy: {
      "/api": createDevProxyOptions(backendTarget),
      "/hubs": createDevProxyOptions(backendTarget, { webSocket: true }),
    },
  },
});
