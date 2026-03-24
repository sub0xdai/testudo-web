import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { WalletConnect } from '../components/WalletConnect'
import { ExtensionPairing } from '../components/ExtensionPairing'
import { useAuth } from '../context/AuthContext'
import { exchangeApi } from '../api/client'
import type {
  ExchangeInfo,
  ExchangeAccount,
  AddExchangeAccountPayload,
  TestConnectionResult,
} from '../types'
import { ExchangeAccountFormSchema } from '../validation/forms'
import { SpotlightBackground } from '../components/ui/SpotlightBackground'

function truncateAddress(addr: string): string {
  if (addr.length < 10) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function AccountPage() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const isFromExtension = new URLSearchParams(location.search).get('source') === 'extension'

  const [exchanges, setExchanges] = useState<ExchangeInfo[]>([])
  const [accounts, setAccounts] = useState<ExchangeAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [setupComplete, setSetupComplete] = useState(false)

  // Form state — auto-select Hyperliquid and show form when opened from extension
  const [showForm, setShowForm] = useState(isFromExtension)
  const [formExchange, setFormExchange] = useState(isFromExtension ? 'hyperliquid' : '')
  const [formApiKey, setFormApiKey] = useState('')
  const [formSecret, setFormSecret] = useState('')
  const [formPassphrase, setFormPassphrase] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Test/delete/revoke state
  const [testResults, setTestResults] = useState<Record<string, TestConnectionResult>>({})
  const [testingId, setTestingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [exData, accData] = await Promise.all([
        exchangeApi.listExchanges(),
        exchangeApi.listAccounts(),
      ])
      setExchanges(exData)
      setAccounts(accData)
    } catch {
      setError('Failed to load exchange data')
    } finally {
      setLoading(false)
    }
  }

  const availableExchanges = exchanges.filter(
    (e) => !accounts.some((a) => a.exchange_name === e.id)
  )

  const needsPassphrase = formExchange === 'okx' || formExchange === 'kucoin'
  const isHyperliquid = formExchange === 'hyperliquid'

  const isOnboarding = !loading && accounts.length === 0 && !setupComplete

  function clearForm() {
    setFormExchange('')
    setFormApiKey('')
    setFormSecret('')
    setFormPassphrase('')
    setError('')
  }

  async function handleAdd() {
    const validation = ExchangeAccountFormSchema.safeParse({
      exchange_name: formExchange,
      api_key: formApiKey.trim() || undefined,
      secret: formSecret.trim() || undefined,
      passphrase: formPassphrase.trim() || undefined,
    })

    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Invalid exchange form fields')
      return
    }

    const wasOnboarding = accounts.length === 0

    setFormSubmitting(true)
    setError('')

    const payload: AddExchangeAccountPayload = {
      exchange_name: validation.data.exchange_name,
      api_key: validation.data.api_key || '',
      secret: validation.data.secret || '',
    }
    if (validation.data.passphrase) payload.passphrase = validation.data.passphrase

    try {
      await exchangeApi.addAccount(payload)
      clearForm()
      setShowForm(false)
      await fetchData()
      if (wasOnboarding) {
        setSetupComplete(true)
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } }
        setError(axiosErr.response?.data?.error || 'Failed to add account')
      } else {
        setError('Connection failed')
      }
    } finally {
      setFormSubmitting(false)
    }
  }

  async function handleTest(accountId: string) {
    setTestingId(accountId)
    try {
      const result = await exchangeApi.testConnection(accountId)
      setTestResults((prev) => ({ ...prev, [accountId]: result }))
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [accountId]: {
          account_id: accountId,
          exchange_name: '',
          status: 'error',
          message: 'Connection test failed',
          tested_at: new Date().toISOString(),
          latency_ms: null,
        },
      }))
    } finally {
      setTestingId(null)
    }
  }

  async function handleDelete(accountId: string) {
    try {
      await exchangeApi.deleteAccount(accountId)
      setDeletingId(null)
      await fetchData()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } }
        setError(axiosErr.response?.data?.error || 'Failed to delete account')
      } else {
        setError('Connection failed')
      }
      setDeletingId(null)
    }
  }

  async function handleRevoke(accountId: string) {
    try {
      await exchangeApi.revokeAgent(accountId)
      setRevokingId(null)
      await fetchData()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } }
        setError(axiosErr.response?.data?.error || 'Failed to revoke agent wallet')
      } else {
        setError('Connection failed')
      }
      setRevokingId(null)
    }
  }

  function handleWalletComplete() {
    const wasOnboarding = accounts.length === 0
    clearForm()
    setShowForm(false)
    fetchData()
    if (wasOnboarding) {
      setSetupComplete(true)
    }
  }

  // API key form for traditional exchanges
  const apiKeyForm = (
    <div className="space-y-4">
      <div>
        <label className="block font-mono text-sm text-text-secondary mb-2">
          API KEY
        </label>
        <input
          type="password"
          value={formApiKey}
          onChange={(e) => setFormApiKey(e.target.value)}
          className="w-full px-4 py-3 bg-container-bg border border-container-border font-mono text-text-primary placeholder-text-tertiary focus:border-text-secondary focus:outline-none"
          placeholder="Enter API key"
          autoComplete="off"
        />
      </div>

      <div>
        <label className="block font-mono text-sm text-text-secondary mb-2">
          SECRET
        </label>
        <input
          type="password"
          value={formSecret}
          onChange={(e) => setFormSecret(e.target.value)}
          className="w-full px-4 py-3 bg-container-bg border border-container-border font-mono text-text-primary placeholder-text-tertiary focus:border-text-secondary focus:outline-none"
          placeholder="Enter API secret"
          autoComplete="off"
        />
      </div>

      {needsPassphrase && (
        <div>
          <label className="block font-mono text-sm text-text-secondary mb-2">
            PASSPHRASE
          </label>
          <input
            type="password"
            value={formPassphrase}
            onChange={(e) => setFormPassphrase(e.target.value)}
            className="w-full px-4 py-3 bg-container-bg border border-container-border font-mono text-text-primary placeholder-text-tertiary focus:border-text-secondary focus:outline-none"
            placeholder="Enter passphrase"
            autoComplete="off"
          />
        </div>
      )}

      {error && (
        <div className="px-4 py-3 border border-signal-red bg-signal-red/10 font-mono text-sm text-signal-red">
          {error}
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={formSubmitting}
        className="w-full px-8 py-4 bg-transparent btn-primary font-mono font-bold text-lg disabled:opacity-50"
      >
        {formSubmitting ? 'VALIDATING...' : 'CONNECT EXCHANGE'}
      </button>
    </div>
  )

  // Exchange selector shared by onboarding and normal add
  const exchangeSelector = (
    <div>
      <label className="block font-mono text-sm text-text-secondary mb-2">
        EXCHANGE
      </label>
      <select
        value={formExchange}
        onChange={(e) => setFormExchange(e.target.value)}
        className="w-full px-4 py-3 bg-container-bg border border-container-border font-mono text-text-primary focus:border-text-secondary focus:outline-none"
      >
        <option value="">Select exchange...</option>
        {(isOnboarding ? exchanges : availableExchanges).map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.name}
          </option>
        ))}
      </select>
    </div>
  )

  // Exchange form — conditionally renders wallet connect or API key form
  const exchangeForm = (
    <div className="space-y-4">
      {exchangeSelector}
      {formExchange && (
        isHyperliquid
          ? <WalletConnect onComplete={handleWalletComplete} />
          : apiKeyForm
      )}
    </div>
  )

  // Setup complete — success screen
  if (setupComplete) {
    return (
      <div className="min-h-screen px-6 py-24">
        <SpotlightBackground imageSrc="/Roman-testudo-Trajan-column-966204074.jpg" spotlightRadius={300} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <Card rounded>
            <div className="text-center py-8 space-y-6">
              <div className="w-16 h-16 mx-auto border-2 border-text-primary flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-primary">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-bold text-text-primary tracking-wider">
                EXCHANGE CONNECTED
              </h2>
              <p className="font-mono text-sm text-text-secondary max-w-md mx-auto">
                Your exchange has been validated and configured. Return to the Testudo extension and log in to start trading.
              </p>
              <button
                onClick={() => setSetupComplete(false)}
                className="px-8 py-3 bg-transparent btn-primary font-mono font-bold text-sm"
              >
                VIEW ACCOUNT
              </button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Onboarding — first-time exchange setup
  if (isOnboarding) {
    return (
      <div className="min-h-screen px-6 py-24">
        <SpotlightBackground imageSrc="/Roman-testudo-Trajan-column-966204074.jpg" spotlightRadius={300} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <Card rounded>
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-text-primary">
                  GET STARTED
                </h2>
                <p className="font-mono text-sm text-text-secondary mt-2">
                  Link your exchange API keys to enable trading through the Testudo extension. Your credentials are encrypted and stored securely.
                </p>
              </div>

              {exchangeForm}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Normal account management
  return (
    <div className="min-h-screen px-6 py-24">
      <SpotlightBackground imageSrc="/Roman-testudo-Trajan-column-966204074.jpg" spotlightRadius={300} />
      <div className="relative z-10 max-w-2xl mx-auto space-y-8">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary">
              ACCOUNT
            </h1>
            <p className="font-mono text-sm text-text-secondary mt-1">
              {user?.wallet_address ? `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}` : ''}
            </p>
          </div>
          <button
            onClick={logout}
            className="px-6 py-2 border border-container-border font-mono font-bold text-sm text-text-secondary hover:text-text-primary hover:border-text-primary transition-colors"
          >
            LOGOUT
          </button>
        </div>

        {/* Exchange accounts */}
        <Card rounded>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold text-text-primary">
              EXCHANGE ACCOUNTS
            </h2>
            <button
              onClick={() => {
                setShowForm(!showForm)
                if (showForm) clearForm()
              }}
              className="px-4 py-2 font-mono text-sm font-bold text-text-primary border border-container-border hover:bg-text-primary hover:text-main-bg transition-colors"
            >
              {showForm ? 'CANCEL' : '+ ADD EXCHANGE'}
            </button>
          </div>

          {error && !showForm && (
            <div className="mb-4 px-4 py-3 border border-signal-red bg-signal-red/10 font-mono text-sm text-signal-red">
              {error}
            </div>
          )}

          {loading ? (
            <p className="font-mono text-text-secondary">Loading...</p>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => {
                const result = testResults[account.id]
                const isAgentWallet = account.auth_mode === 'agent_wallet'
                return (
                  <div
                    key={account.id}
                    className="p-4 border border-container-border bg-main-bg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-text-primary" />
                        <span className="font-mono text-text-primary font-bold">
                          {account.account_name || account.exchange_name}
                        </span>
                        <span className="font-mono text-xs text-text-tertiary uppercase">
                          {account.exchange_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTest(account.id)}
                          disabled={testingId === account.id}
                          className="px-3 py-1 font-mono text-xs text-text-secondary border border-container-border hover:text-text-primary hover:border-text-primary/30 transition-colors disabled:opacity-50"
                        >
                          {testingId === account.id ? '...' : 'TEST'}
                        </button>
                        {isAgentWallet && (
                          revokingId === account.id ? (
                            <>
                              <button
                                onClick={() => handleRevoke(account.id)}
                                className="px-3 py-1 font-mono text-xs text-signal-red border border-signal-red/30 bg-signal-red/10"
                              >
                                CONFIRM REVOKE
                              </button>
                              <button
                                onClick={() => setRevokingId(null)}
                                className="px-3 py-1 font-mono text-xs text-text-tertiary border border-container-border"
                              >
                                NO
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setRevokingId(account.id)}
                              className="px-3 py-1 font-mono text-xs text-text-tertiary border border-container-border hover:text-text-primary hover:border-text-primary/30 transition-colors"
                            >
                              REVOKE
                            </button>
                          )
                        )}
                        {deletingId === account.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(account.id)}
                              className="px-3 py-1 font-mono text-xs text-signal-red border border-signal-red/30 bg-signal-red/10"
                            >
                              CONFIRM
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-3 py-1 font-mono text-xs text-text-tertiary border border-container-border"
                            >
                              NO
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeletingId(account.id)}
                            className="px-3 py-1 font-mono text-xs text-text-tertiary border border-container-border hover:text-text-primary hover:border-text-primary/30 transition-colors"
                          >
                            DEL
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Wallet address for agent-wallet accounts */}
                    {isAgentWallet && account.wallet_address && (
                      <p className="font-mono text-xs text-text-tertiary">
                        Wallet: {truncateAddress(account.wallet_address)}
                      </p>
                    )}
                    {/* Migration prompt for direct-key Hyperliquid accounts */}
                    {!isAgentWallet && account.exchange_name === 'hyperliquid' && (
                      <div className="px-3 py-2 border border-container-border bg-text-primary/5">
                        <p className="font-mono text-xs text-text-secondary">
                          Upgrade to agent wallet mode for improved security.
                          <button
                            onClick={() => {
                              setFormExchange('hyperliquid')
                              setShowForm(true)
                            }}
                            className="ml-2 text-text-primary hover:underline"
                          >
                            MIGRATE
                          </button>
                        </p>
                      </div>
                    )}
                    {result && (
                      <div className="font-mono text-xs">
                        {result.status === 'success' ? (
                          <span className="text-signal-green">{result.latency_ms}ms</span>
                        ) : (
                          <span className="text-signal-red">{result.message}</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {accounts.length === 0 && !showForm && (
                <p className="font-mono text-text-tertiary py-4">
                  No exchange accounts connected.
                </p>
              )}
            </div>
          )}

          {/* Add form */}
          {showForm && (
            <div className="mt-6 p-6 border border-container-border bg-main-bg">
              {exchangeForm}
            </div>
          )}
        </Card>

        {/* Extension pairing */}
        <Card rounded>
          <ExtensionPairing />
        </Card>
      </div>
    </div>
  )
}
