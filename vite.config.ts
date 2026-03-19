import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      // Same-origin proxy: trading desk sub-app served from testudo-journal dev server
      '/desk': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      // API proxy: all backend requests to the Rust server
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
})
