import axios from 'axios'
import type {
  LoginResponse,
  TokenResponse,
  ExchangeInfo,
  ExchangeAccount,
  AddExchangeAccountPayload,
  TestConnectionResult,
  InitAgentWalletResponse,
  ApproveDataResponse,
  ApproveAgentResponse,
  MigrateToAgentWalletResponse,
  RevokeAgentResponse,
} from '../types'
import { env } from '../config/env'

const api = axios.create({
  baseURL: env.VITE_API_URL,
})

// Attach bearer token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 401 refresh-and-retry interceptor
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error)
    } else {
      p.resolve(token!)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          },
          reject,
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post<TokenResponse>(
        `${api.defaults.baseURL}/auth/refresh`,
        { refresh_token: refreshToken },
      )
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      processQueue(null, data.access_token)
      originalRequest.headers.Authorization = `Bearer ${data.access_token}`
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),

  register: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/register', { email, password }).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<TokenResponse>('/auth/refresh', { refresh_token: refreshToken }).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refresh_token: refreshToken }).then(() => {}),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then(() => {}),
}

export const exchangeApi = {
  listExchanges: () =>
    api.get<{ exchanges: ExchangeInfo[] }>('/exchanges').then((r) => r.data.exchanges),

  listAccounts: () =>
    api.get<ExchangeAccount[]>('/exchanges/accounts').then((r) => r.data),

  addAccount: (payload: AddExchangeAccountPayload) =>
    api.post<ExchangeAccount>('/exchanges/accounts', payload).then((r) => r.data),

  deleteAccount: (id: string) =>
    api.delete(`/exchanges/accounts/${id}`).then(() => {}),

  testConnection: (id: string) =>
    api.post<TestConnectionResult>(`/exchanges/accounts/${id}/test`).then((r) => r.data),

  initAgentWallet: (walletAddress: string) =>
    api.post<InitAgentWalletResponse>('/exchanges/agent-wallet/init', {
      wallet_address: walletAddress,
    }).then((r) => r.data),

  getApproveData: (accountId: string) =>
    api.post<ApproveDataResponse>('/exchanges/agent-wallet/approve-data', {
      account_id: accountId,
    }).then((r) => r.data),

  approveAgent: (accountId: string, signature: string, nonce: number) =>
    api.post<ApproveAgentResponse>('/exchanges/agent-wallet/approve', {
      account_id: accountId,
      signature,
      nonce,
    }).then((r) => r.data),

  migrateToAgentWallet: (accountId: string, walletAddress: string) =>
    api.post<MigrateToAgentWalletResponse>('/exchanges/agent-wallet/migrate', {
      account_id: accountId,
      wallet_address: walletAddress,
    }).then((r) => r.data),

  revokeAgent: (id: string) =>
    api.delete<RevokeAgentResponse>(`/exchanges/agent-wallet/${id}/revoke`).then((r) => r.data),
}

export default api
