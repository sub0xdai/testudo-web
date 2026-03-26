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
})
