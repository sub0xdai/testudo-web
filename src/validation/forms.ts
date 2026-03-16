import { z } from 'zod'

export const LoginFormSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const RegisterFormSchema = LoginFormSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const ExchangeAccountFormSchema = z.object({
  exchange_name: z.string().min(1, 'Exchange is required'),
  api_key: z.string().optional(),
  secret: z.string().optional(),
  passphrase: z.string().optional(),
}).superRefine((data, ctx) => {
  // Hyperliquid uses wallet connection — no API key/secret needed
  if (data.exchange_name === 'hyperliquid') return

  if (!data.api_key?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['api_key'],
      message: 'API key is required',
    })
  }
  if (!data.secret?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['secret'],
      message: 'Secret is required',
    })
  }
  if ((data.exchange_name === 'okx' || data.exchange_name === 'kucoin') && !data.passphrase?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['passphrase'],
      message: 'Passphrase is required for this exchange',
    })
  }
})
