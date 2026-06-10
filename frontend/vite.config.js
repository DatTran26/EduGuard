import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  envDir: __dirname,
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://127.0.0.1:7168',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
