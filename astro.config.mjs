import { defineConfig } from 'astro/config'
import solidJs from '@astrojs/solid-js'
import tailwind from '@astrojs/tailwind'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

export default defineConfig({
  output: 'static',
  integrations: [
    solidJs(),
    tailwind(),
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
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
