/** @anchor ui:web:content.config
 * @tags ui */

import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const docs = defineCollection({
  loader: glob({ pattern: '**/[0-9]*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
    section: z.enum(['trader', 'technical']),
  }),
})

export const collections = { docs }
