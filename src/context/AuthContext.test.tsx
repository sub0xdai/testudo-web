import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider, useAuth, ProtectedRoute } from './AuthContext'

// --- Mocks ---

const mockDisconnect = vi.fn()
const mockSignMessageAsync = vi.fn()
let mockIsConnected = false
let mockAddress: string | undefined

vi.mock('wagmi', () => ({
  useAccount: () => ({ address: mockAddress, isConnected: mockIsConnected }),
  useSignMessage: () => ({ signMessageAsync: mockSignMessageAsync }),
  useDisconnect: () => ({ disconnect: mockDisconnect }),
}))

const mockMe = vi.fn()
const mockLogout = vi.fn()

vi.mock('../api/client', () => ({
  authApi: {
    me: (...args: unknown[]) => mockMe(...args),
    logout: (...args: unknown[]) => mockLogout(...args),
    nonce: vi.fn(),
    verifySiwe: vi.fn(),
    pairExtension: vi.fn(),
  },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  }
})

// --- Helpers ---

function AuthConsumer() {
  const { user, isAuthenticated, loading, logout } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user">{user ? user.wallet_address : 'null'}</span>
      <button data-testid="logout-btn" onClick={logout}>Logout</button>
    </div>
  )
}

function renderWithAuth(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  )
}

// --- Setup / Teardown ---

beforeEach(() => {
  vi.clearAllMocks()
  mockIsConnected = false
  mockAddress = undefined
})

afterEach(() => {
  cleanup()
})

// --- Tests ---

describe('AuthContext (FR-2)', () => {
  it('initially loading=true, then resolves after authApi.me()', async () => {
    mockMe.mockResolvedValueOnce({ user: { id: '1', wallet_address: '0xABC' } })

    renderWithAuth(<AuthConsumer />)

    // Loading starts true
    expect(screen.getByTestId('loading').textContent).toBe('true')

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })
  })

  it('when user exists, isAuthenticated=true', async () => {
    mockMe.mockResolvedValueOnce({ user: { id: '1', wallet_address: '0xABC' } })

    renderWithAuth(<AuthConsumer />)

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true')
    })
    expect(screen.getByTestId('user').textContent).toBe('0xABC')
  })

  it('logout() calls authApi.logout(), sets user null, calls disconnect()', async () => {
    mockMe.mockResolvedValueOnce({ user: { id: '1', wallet_address: '0xABC' } })
    mockLogout.mockResolvedValueOnce(undefined)

    renderWithAuth(<AuthConsumer />)

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true')
    })

    await act(async () => {
      screen.getByTestId('logout-btn').click()
    })

    expect(mockLogout).toHaveBeenCalledOnce()
    expect(mockDisconnect).toHaveBeenCalledOnce()

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false')
      expect(screen.getByTestId('user').textContent).toBe('null')
    })
  })
})

describe('ProtectedRoute (FR-3)', () => {
  it('when !isAuthenticated && !isConnected, renders Navigate to "/"', async () => {
    mockMe.mockRejectedValueOnce(new Error('not logged in'))
    mockIsConnected = false

    renderWithAuth(
      <ProtectedRoute>
        <div data-testid="protected-child">SECRET</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(screen.getByTestId('navigate')).toBeInTheDocument()
    })
    expect(screen.getByTestId('navigate').getAttribute('data-to')).toBe('/')
    expect(screen.queryByTestId('protected-child')).not.toBeInTheDocument()
  })

  it('when isAuthenticated, renders children', async () => {
    mockMe.mockResolvedValueOnce({ user: { id: '1', wallet_address: '0xABC' } })

    renderWithAuth(
      <ProtectedRoute>
        <div data-testid="protected-child">SECRET</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(screen.getByTestId('protected-child')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
  })

  it('when !isAuthenticated && isConnected, renders children (relaxed guard)', async () => {
    mockMe.mockRejectedValueOnce(new Error('not logged in'))
    mockIsConnected = true

    renderWithAuth(
      <ProtectedRoute>
        <div data-testid="protected-child">SECRET</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(screen.getByTestId('protected-child')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
  })
})
