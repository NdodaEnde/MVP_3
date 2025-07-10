import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    },
    allowedHosts: [
      'localhost',
      '.pythagora.ai'
    ],
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: ['**/node_modules/**', '**/dist/**', '**/public/**', '**/log/**']
    }
  },
})
