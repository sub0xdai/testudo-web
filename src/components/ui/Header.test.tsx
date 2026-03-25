import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'

// --- Mocks ---

const mockLogout = vi.fn()
const mockDisconnect = vi.fn()
const mockNavigate = vi.fn()
let mockIsConnected = false
let mockAddress: string | undefined
let mockIsAuthenticated = false
let mockUser: { id: string; wallet_address: string } | null = null

vi.mock('wagmi', () => ({
  useAccount: () => ({ address: mockAddress, isConnected: mockIsConnected }),
  useDisconnect: () => ({ disconnect: mockDisconnect }),
}))

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: ({ label }: { label?: string }) => (
    <button data-testid="connect-button">{label ?? 'Connect Wallet'}</button>
  ),
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: mockIsAuthenticated,
    loading: false,
    siweError: null,
    logout: mockLogout,
  }),
}))

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'amoled' as const,
    isLight: false,
    cycleTheme: vi.fn(),
  }),
  THEME_LABELS: { amoled: 'DARK', light: 'LIGHT' },
}))

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
}))

// Import after mocks
import { Header } from './Header'

// --- Setup / Teardown ---

beforeEach(() => {
  vi.clearAllMocks()
  mockIsConnected = false
  mockAddress = undefined
  mockIsAuthenticated = false
  mockUser = null
})

afterEach(() => {
  cleanup()
})

// --- Tests ---

describe('Header (FR-5)', () => {
  it('when disconnected (!isAuthenticated, !isConnected), renders ConnectButton', async () => {
    mockIsAuthenticated = false
    mockIsConnected = false

    render(<Header />)

    // Lazy-loaded ConnectButton may render asynchronously via Suspense
    await waitFor(() => {
      expect(screen.getByTestId('connect-button')).toBeInTheDocument()
    })
    expect(screen.getByTestId('connect-button').textContent).toBe('CONNECT')
  })

  it('when connected (isConnected=true), renders AccountChip with truncated address', () => {
    mockIsConnected = true
    mockAddress = '0x1234567890abcdef1234567890abcdef12345678'
    mockIsAuthenticated = true
    mockUser = { id: '1', wallet_address: '0x1234567890abcdef1234567890abcdef12345678' }

    render(<Header />)

    // Truncated format: 0x1234...5678
    expect(screen.getByText('0x1234...5678')).toBeInTheDocument()
    expect(screen.queryByTestId('connect-button')).not.toBeInTheDocument()
  })

  it('AccountChip dropdown opens on click, shows ACCOUNT and DISCONNECT', () => {
    mockIsConnected = true
    mockAddress = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12'
    mockIsAuthenticated = true
    mockUser = { id: '1', wallet_address: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12' }

    render(<Header />)

    // Dropdown items should not be visible initially
    expect(screen.queryByText('ACCOUNT')).not.toBeInTheDocument()
    expect(screen.queryByText('DISCONNECT')).not.toBeInTheDocument()

    // Click the chip to open dropdown
    const chip = screen.getByText('0xABCD...EF12')
    fireEvent.click(chip)

    // Now dropdown items should be visible
    expect(screen.getByText('ACCOUNT')).toBeInTheDocument()
    expect(screen.getByText('DISCONNECT')).toBeInTheDocument()
  })

  it('DISCONNECT button calls both logout() and disconnect()', () => {
    mockIsConnected = true
    mockAddress = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12'
    mockIsAuthenticated = true
    mockUser = { id: '1', wallet_address: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12' }

    render(<Header />)

    // Open dropdown
    fireEvent.click(screen.getByText('0xABCD...EF12'))

    // Click DISCONNECT
    fireEvent.click(screen.getByText('DISCONNECT'))

    expect(mockLogout).toHaveBeenCalledOnce()
    expect(mockDisconnect).toHaveBeenCalledOnce()
  })
})
