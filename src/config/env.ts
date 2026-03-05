import { z } from 'zod'

const EnvSchema = z.object({
  VITE_API_URL: z.string().url(),
})

function defaultApiUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8080/api/v1'
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/v1`
  }
  return 'http://localhost:8080/api/v1'
}

const parsed = EnvSchema.safeParse(import.meta.env)

export const env = parsed.success
  ? parsed.data
  : { VITE_API_URL: defaultApiUrl() }
