import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const apiProxyTarget = env.VITE_API_PROXY_TARGET?.trim() || "http://127.0.0.1:5157";
  const cacheMode = mode === "development" ? `${mode}-${process.pid}` : mode;
  const cacheDir = env.VITE_CACHE_DIR?.trim() || path.resolve(__dirname, "../temp/vite-cache", cacheMode);

  return {
    cacheDir,
    envDir: __dirname,
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
