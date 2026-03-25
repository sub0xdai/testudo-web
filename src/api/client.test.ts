import { describe, it, expect, vi, beforeEach } from 'vitest'

// Capture the interceptor handlers when axios.create is called
let onFulfilled: ((response: unknown) => unknown) | undefined
let onRejected: ((error: unknown) => unknown) | undefined

const mockAxiosInstance = {
  interceptors: {
    response: {
      use: (fulfill: (r: unknown) => unknown, reject: (e: unknown) => unknown) => {
        onFulfilled = fulfill
        onRejected = reject
      },
    },
    request: { use: vi.fn() },
  },
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  defaults: { baseURL: 'http://localhost:8080/api/v1' },
}

// Make the mock instance callable (for retrying the original request)
const callableMockInstance = Object.assign(
  vi.fn(),
  mockAxiosInstance,
)

const mockAxiosPost = vi.fn()

vi.mock('axios', () => ({
  default: {
    create: () => callableMockInstance,
    post: (...args: unknown[]) => mockAxiosPost(...args),
  },
}))

// Force the module to evaluate, which registers the interceptor
beforeEach(async () => {
  vi.clearAllMocks()
  onFulfilled = undefined
  onRejected = undefined
  // Re-import the module to re-register interceptors
  vi.resetModules()

  // Re-setup the interceptor capture
  mockAxiosInstance.interceptors.response.use = (
    fulfill: (r: unknown) => unknown,
    reject: (e: unknown) => unknown,
  ) => {
    onFulfilled = fulfill
    onRejected = reject
  }

  await import('./client')
})

describe('API client interceptor (FR-4)', () => {
  it('non-401 errors pass through (rejected)', async () => {
    const error = {
      response: { status: 500 },
      config: { url: '/exchanges', _retry: false },
    }

    await expect(onRejected!(error)).rejects.toBe(error)
  })

  it('fulfillment handler passes response through', () => {
    const response = { data: { ok: true }, status: 200 }
    expect(onFulfilled!(response)).toBe(response)
  })

  it('401 on /exchanges triggers POST /auth/refresh then retries original request', async () => {
    const originalRequest = { url: '/exchanges', _retry: false }
    const error = {
      response: { status: 401 },
      config: originalRequest,
    }

    // Refresh succeeds
    mockAxiosPost.mockResolvedValueOnce({ data: {} })
    // Retry succeeds
    const retryResponse = { data: { exchanges: [] } }
    callableMockInstance.mockResolvedValueOnce(retryResponse)

    const result = await onRejected!(error)

    // Refresh was called
    expect(mockAxiosPost).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/auth/refresh',
      {},
      { withCredentials: true },
    )
    // Original request was retried
    expect(callableMockInstance).toHaveBeenCalledWith(originalRequest)
    expect(originalRequest._retry).toBe(true)
    expect(result).toBe(retryResponse)
  })

  it('401 on /auth/me skips refresh (auth probe endpoint)', async () => {
    const error = {
      response: { status: 401 },
      config: { url: '/auth/me', _retry: false },
    }

    await expect(onRejected!(error)).rejects.toBe(error)
    expect(mockAxiosPost).not.toHaveBeenCalled()
  })

  it('401 on /auth/refresh skips refresh (auth probe endpoint)', async () => {
    const error = {
      response: { status: 401 },
      config: { url: '/auth/refresh', _retry: false },
    }

    await expect(onRejected!(error)).rejects.toBe(error)
    expect(mockAxiosPost).not.toHaveBeenCalled()
  })

  it('401 + refresh fails rejects with original error', async () => {
    const originalRequest = { url: '/exchanges/accounts', _retry: false }
    const error = {
      response: { status: 401 },
      config: originalRequest,
    }

    // Refresh fails
    mockAxiosPost.mockRejectedValueOnce(new Error('refresh failed'))

    await expect(onRejected!(error)).rejects.toBe(error)
    expect(originalRequest._retry).toBe(true)
  })
})
