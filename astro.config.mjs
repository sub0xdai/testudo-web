import { defineConfig } from 'astro/config'
import solidJs from '@astrojs/solid-js'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  output: 'static',
  integrations: [
    solidJs(),
    tailwind(),
  ],
  server: { port: 3001 },
  devToolbar: { enabled: false },
  vite: {
    server: {
      proxy: {
        '/desk': 'http://localhost:3002',
        '/api': 'http://127.0.0.1:8080',
      },
    },
  },
})
