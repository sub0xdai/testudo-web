import axios from 'axios'
import type {
  ExchangeInfo,
  ExchangeAccount,
  AddExchangeAccountPayload,
  TestConnectionResult,
  InitAgentWalletResponse,
  ApproveDataResponse,
  ApproveAgentResponse,
  MigrateToAgentWalletResponse,
  RevokeAgentResponse,
  User,
} from '../types'
import { env } from '../config/env'

const api = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
})

// 401 refresh-and-retry interceptor (cookie-based)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    originalRequest._retry = true
    try {
      await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true })
      return api(originalRequest)
    } catch {
      window.location.href = '/login'
      return Promise.reject(error)
    }
  },
)

export const authApi = {
  me: () =>
    api.get<{ user: User }>('/auth/me').then((r) => r.data),

  nonce: () =>
    api.get<{ nonce: string }>('/auth/nonce').then((r) => r.data),

  verifySiwe: (message: string, signature: string) =>
    api.post<{ user: User }>('/auth/verify-siwe', { message, signature }).then((r) => r.data),

  logout: () =>
    api.post('/auth/logout').then(() => {}),

  pairExtension: () =>
    api.post<{ code: string }>('/auth/pair-extension').then((r) => r.data),
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
