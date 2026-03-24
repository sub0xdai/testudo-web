import { useState, useEffect, useRef } from 'react'
import type { ExchangeAccount, TestConnectionResult, ExchangeBalanceResponse } from '../types'

interface ExchangeCardProps {
  account: ExchangeAccount
  testResult?: TestConnectionResult
  balance?: ExchangeBalanceResponse
  isTesting: boolean
  isDeleting: boolean
  isRevoking: boolean
  onTest: () => void
  onDelete: () => void
  onRevoke: () => void
  onMigrate: () => void
}

function KebabMenu({
  onTest,
  onDelete,
  onRevoke,
  showRevoke,
  isTesting,
}: {
  onTest: () => void
  onDelete: () => void
  onRevoke: () => void
  showRevoke: boolean
  isTesting: boolean
}) {
  const [open, setOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'delete' | 'revoke' | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirmAction(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setOpen(!open)
          if (open) setConfirmAction(null)
        }}
        className="text-text-tertiary hover:text-text-primary px-2 py-1 text-lg leading-none"
      >
        &#x22EE;
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-container-bg border border-container-border z-10 flex flex-col">
          <button
            onClick={() => {
              onTest()
              setOpen(false)
            }}
            className="text-left px-4 py-2.5 text-xs font-mono text-text-secondary hover:bg-main-bg transition-colors"
          >
            {isTesting ? 'TESTING...' : 'TEST CONNECTION'}
          </button>
          {showRevoke && (
            confirmAction === 'revoke' ? (
              <div className="flex border-t border-container-border">
                <button
                  onClick={() => {
                    onRevoke()
                    setOpen(false)
                    setConfirmAction(null)
                  }}
                  className="flex-1 px-4 py-2.5 text-xs font-mono text-signal-red hover:bg-signal-red/10 transition-colors"
                >
                  CONFIRM
                </button>
                <button
                  onClick={() => setConfirmAction(null)}
                  className="px-4 py-2.5 text-xs font-mono text-text-tertiary hover:bg-main-bg border-l border-container-border transition-colors"
                >
                  NO
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmAction('revoke')}
                className="text-left px-4 py-2.5 text-xs font-mono text-signal-red hover:bg-signal-red/10 border-t border-container-border transition-colors"
              >
                REVOKE AGENT
              </button>
            )
          )}
          {confirmAction === 'delete' ? (
            <div className="flex border-t border-container-border">
              <button
                onClick={() => {
                  onDelete()
                  setOpen(false)
                  setConfirmAction(null)
                }}
                className="flex-1 px-4 py-2.5 text-xs font-mono text-signal-red hover:bg-signal-red/10 transition-colors"
              >
                CONFIRM
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2.5 text-xs font-mono text-text-tertiary hover:bg-main-bg border-l border-container-border transition-colors"
              >
                NO
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmAction('delete')}
              className="text-left px-4 py-2.5 text-xs font-mono text-signal-red hover:bg-signal-red/10 border-t border-container-border transition-colors"
            >
              DELETE
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function formatBalance(balance?: ExchangeBalanceResponse): string | null {
  if (!balance || balance.balances.length === 0) return null
  // Show the primary asset total (usually USDT or USDC)
  const primary = balance.balances.find((b) => b.asset === 'USDT' || b.asset === 'USDC')
    || balance.balances[0]
  const total = parseFloat(primary.total)
  if (isNaN(total)) return null
  return `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function ExchangeCard({
  account,
  testResult,
  balance,
  isTesting,
  onTest,
  onDelete,
  onRevoke,
  onMigrate,
}: ExchangeCardProps) {
  const isAgentWallet = account.auth_mode === 'agent_wallet'

  return (
    <div className="border border-container-border bg-container-bg p-5 flex flex-col gap-4">
      {/* Header: heartbeat + name + badge + kebab */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              account.is_active
                ? 'bg-signal-green animate-pulse'
                : 'bg-signal-red'
            }`}
          />
          <h3 className="font-mono text-sm font-bold text-text-primary tracking-wider uppercase">
            {account.exchange_name}
          </h3>
          <span className="text-[10px] text-text-tertiary font-mono bg-main-bg px-2 py-0.5 border border-container-border">
            {isAgentWallet ? 'DEX' : 'CEX'}
          </span>
        </div>
        <KebabMenu
          onTest={onTest}
          onDelete={onDelete}
          onRevoke={onRevoke}
          showRevoke={isAgentWallet}
          isTesting={isTesting}
        />
      </div>

      {/* Identifier */}
      <span className="text-xs text-text-tertiary font-mono truncate">
        {account.wallet_address
          ? `${account.wallet_address.slice(0, 6)}...${account.wallet_address.slice(-4)}`
          : account.account_name}
      </span>

      {/* Migration prompt for direct-key Hyperliquid */}
      {account.exchange_name === 'hyperliquid' && !isAgentWallet && (
        <button
          onClick={onMigrate}
          className="text-[10px] font-mono text-signal-amber hover:underline text-left"
        >
          Migrate to agent wallet &rarr;
        </button>
      )}

      {/* Balance / test result */}
      <div className="mt-auto">
        <div className="font-mono text-xl text-text-primary">
          {formatBalance(balance) || '---'}
        </div>
        {testResult && (
          <div className="font-mono text-xs mt-1">
            {testResult.status === 'success' ? (
              <span className="text-signal-green">{testResult.latency_ms}ms</span>
            ) : (
              <span className="text-signal-red">{testResult.message}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
