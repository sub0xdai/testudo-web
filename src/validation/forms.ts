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
  api_key: z.string().min(1, 'API key is required'),
  secret: z.string().min(1, 'Secret is required'),
  passphrase: z.string().optional(),
}).superRefine((data, ctx) => {
  if ((data.exchange_name === 'okx' || data.exchange_name === 'kucoin') && !data.passphrase?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['passphrase'],
      message: 'Passphrase is required for this exchange',
    })
  }
})
