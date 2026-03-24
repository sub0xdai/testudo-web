import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { WalletConnect } from '../components/WalletConnect'
import { ExtensionPairingBanner } from '../components/ExtensionPairingBanner'
import { ExchangeCard } from '../components/ExchangeCard'
import { AddExchangeCard } from '../components/AddExchangeCard'
import { useAuth } from '../context/AuthContext'
import { exchangeApi } from '../api/client'
import type {
  ExchangeInfo,
  ExchangeAccount,
  AddExchangeAccountPayload,
  TestConnectionResult,
  ExchangeBalanceResponse,
} from '../types'
import { ExchangeAccountFormSchema } from '../validation/forms'
import { SpotlightBackground } from '../components/ui/SpotlightBackground'

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

  // Balance state — async per-card fetching
  const [balances, setBalances] = useState<Record<string, ExchangeBalanceResponse>>({})

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
      // Fetch balances for all accounts in parallel (fire-and-forget per card)
      for (const acc of accData) {
        exchangeApi.fetchBalance(acc.id)
          .then((bal) => setBalances((prev) => ({ ...prev, [acc.id]: bal })))
          .catch(() => {}) // Silently ignore balance fetch failures
      }
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
    setDeletingId(accountId)
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
    setRevokingId(accountId)
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

  function handleMigrate(accountId: string) {
    void accountId
    setFormExchange('hyperliquid')
    setShowForm(true)
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

  // Normal account management — card grid layout
  return (
    <div className="min-h-screen px-6 py-24">
      <SpotlightBackground imageSrc="/Roman-testudo-Trajan-column-966204074.jpg" spotlightRadius={300} />
      <div className="relative z-10 max-w-5xl mx-auto">
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

        {error && !showForm && (
          <div className="mt-6 px-4 py-3 border border-signal-red bg-signal-red/10 font-mono text-sm text-signal-red">
            {error}
          </div>
        )}

        {/* Card Grid */}
        {loading ? (
          <p className="font-mono text-text-secondary mt-8">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {accounts.map((account) => (
              <ExchangeCard
                key={account.id}
                account={account}
                testResult={testResults[account.id]}
                balance={balances[account.id]}
                isTesting={testingId === account.id}
                isDeleting={deletingId === account.id}
                isRevoking={revokingId === account.id}
                onTest={() => handleTest(account.id)}
                onDelete={() => handleDelete(account.id)}
                onRevoke={() => handleRevoke(account.id)}
                onMigrate={() => handleMigrate(account.id)}
              />
            ))}
            <AddExchangeCard onClick={() => setShowForm(true)} />
          </div>
        )}

        {/* Add form — inline below grid */}
        {showForm && (
          <div className="mt-6 p-6 border border-container-border bg-container-bg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-text-primary">
                ADD EXCHANGE
              </h3>
              <button
                onClick={() => { setShowForm(false); clearForm() }}
                className="px-4 py-2 font-mono text-xs text-text-tertiary border border-container-border hover:text-text-primary hover:border-text-primary transition-colors"
              >
                CANCEL
              </button>
            </div>
            {exchangeForm}
          </div>
        )}

        {/* Extension Pairing — compact banner below grid */}
        <ExtensionPairingBanner />
      </div>
    </div>
  )
}
