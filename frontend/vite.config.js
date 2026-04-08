import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['civilian-pamela-securities-price.trycloudflare.com'],
    proxy: {
      '/api': {
        target: 'http://localhost:1000',
        changeOrigin: true,
      }
    }
  }
})
