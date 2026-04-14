import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    compression({ algorithm: 'gzip',          ext: '.gz' }),
    compression({ algorithm: 'brotliCompress', ext: '.br' }),
  ],

  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:1000',
        changeOrigin: true,
        // Required for ngrok free tier — bypasses the browser warning interstitial
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      },
    },
  },

  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    // Don't report compressed sizes — speeds up build
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React — always needed, cache forever
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // Router — needed on every page
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }
          // SEO / helmet — only needed on page render, not interaction
          if (id.includes('react-helmet-async')) {
            return 'seo';
          }
          // Axios — only needed for authenticated API calls
          if (id.includes('node_modules/axios')) {
            return 'http';
          }
        },
      },
    },
  },
})
