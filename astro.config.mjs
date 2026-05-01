import { defineConfig } from 'astro/config'
import solidJs from '@astrojs/solid-js'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://testudo.vip',
  output: 'static',
  trailingSlash: 'always',

  integrations: [
    solidJs(),
    tailwind(),
    sitemap({
      filter: (page) => !page.includes('/CLAUDE'),
    }),
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

  adapter: cloudflare(),
})