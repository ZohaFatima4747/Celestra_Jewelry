import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:1000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:1000',
        changeOrigin: true,
      },
      '/product-images': {
        target: 'http://localhost:1000',
        changeOrigin: true,
      },
    },
  },
})
