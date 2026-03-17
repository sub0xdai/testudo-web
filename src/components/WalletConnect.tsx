import { useState, useCallback } from 'react'
import { useAccount, useConnect, useDisconnect, useSignTypedData } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { exchangeApi } from '../api/client'

type WalletFlowState =
  | { step: 'idle' }
  | { step: 'connecting' }
  | { step: 'init-agent'; address: string }
  | { step: 'signing'; accountId: string; agentAddress: string; typedData: Record<string, unknown>; nonce: number }
  | { step: 'approving'; accountId: string; signature: string; nonce: number }
  | { step: 'success'; accountId: string; agentAddress: string }
  | { step: 'error'; message: string; retryStep: WalletFlowState['step'] }

interface WalletConnectProps {
  onComplete: () => void
}

export function WalletConnect({ onComplete }: WalletConnectProps) {
  const [state, setState] = useState<WalletFlowState>({ step: 'idle' })
  const { address, isConnected } = useAccount()
  const { connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { signTypedDataAsync } = useSignTypedData()

  const startFlow = useCallback(async () => {
    if (!address) return

    setState({ step: 'init-agent', address })

    try {
      // Step 1: Initialize agent wallet
      const initResult = await exchangeApi.initAgentWallet(address)
      const { account_id, agent_address } = initResult

      // Step 2: Get EIP-712 typed data for signing
      const approveData = await exchangeApi.getApproveData(account_id)
      const { typed_data, nonce } = approveData

      setState({
        step: 'signing',
        accountId: account_id,
        agentAddress: agent_address,
        typedData: typed_data,
        nonce,
      })

      // Step 3: Request wallet signature
      const typedDataObj = typed_data as {
        domain: Record<string, unknown>
        types: Record<string, Array<{ name: string; type: string }>>
        primaryType: string
        message: Record<string, unknown>
      }

      // Remove EIP712Domain from types since wagmi adds it automatically
      const { EIP712Domain: _, ...signingTypes } = typedDataObj.types

      const signature = await signTypedDataAsync({
        domain: typedDataObj.domain as {
          name?: string
          version?: string
          chainId?: number
          verifyingContract?: `0x${string}`
        },
        types: signingTypes,
        primaryType: typedDataObj.primaryType,
        message: typedDataObj.message,
      })

      setState({ step: 'approving', accountId: account_id, signature, nonce })

      // Step 4: Submit approval
      const result = await exchangeApi.approveAgent(account_id, signature, nonce)

      if (result.success) {
        setState({ step: 'success', accountId: account_id, agentAddress: result.agent_address })
        // EXT-33 FR-2: Notify extension content script of successful wallet connection
        window.postMessage(
          {
            type: "TESTUDO_ACCOUNT_LINKED",
            account: { id: account_id, exchange_name: "hyperliquid" },
          },
          window.location.origin,
        )
      } else {
        setState({ step: 'error', message: result.message, retryStep: 'idle' })
      }
    } catch (err: unknown) {
      let message = 'An error occurred'
      if (err && typeof err === 'object') {
        if ('shortMessage' in err) {
          message = String((err as { shortMessage: string }).shortMessage)
        } else if ('response' in err) {
          const axiosErr = err as { response?: { data?: { error?: string; message?: string } } }
          message = axiosErr.response?.data?.error || axiosErr.response?.data?.message || message
        } else if ('message' in err) {
          message = String((err as { message: string }).message)
        }
      }
      setState({ step: 'error', message, retryStep: 'idle' })
    }
  }, [address, signTypedDataAsync])

  const handleRetry = useCallback(() => {
    setState({ step: 'idle' })
  }, [])

  // Step indicator
  const stepLabels = ['Connect', 'Initialize', 'Sign', 'Approve']
  const stepIndex =
    state.step === 'idle' || state.step === 'connecting' ? 0
    : state.step === 'init-agent' ? 1
    : state.step === 'signing' ? 2
    : state.step === 'approving' ? 3
    : state.step === 'success' ? 4
    : -1

  // Success state
  if (state.step === 'success') {
    return (
      <div className="space-y-6">
        <div className="text-center py-4">
          <div className="w-12 h-12 mx-auto border-2 border-signal-green rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-signal-green">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="font-display text-lg font-bold text-text-primary mb-2">
            WALLET CONNECTED
          </h3>
          <p className="font-mono text-sm text-text-secondary">
            Agent wallet approved and active
          </p>
          <p className="font-mono text-xs text-text-tertiary mt-2">
            Agent: {state.agentAddress.slice(0, 6)}...{state.agentAddress.slice(-4)}
          </p>
        </div>
        <button
          onClick={onComplete}
          className="w-full px-8 py-4 bg-signal-green text-main-bg font-mono font-bold text-lg rounded-md hover:bg-white transition-colors"
        >
          VIEW ACCOUNT
        </button>
      </div>
    )
  }

  // Error state
  if (state.step === 'error') {
    return (
      <div className="space-y-4">
        <div className="px-4 py-3 border border-signal-red rounded-md bg-signal-red/10">
          <p className="font-mono text-sm text-signal-red">{state.message}</p>
        </div>
        <button
          onClick={handleRetry}
          className="w-full px-8 py-4 bg-signal-green text-main-bg font-mono font-bold text-lg rounded-md hover:bg-white transition-colors"
        >
          TRY AGAIN
        </button>
        <button
          onClick={() => { disconnect(); setState({ step: 'idle' }) }}
          className="w-full px-4 py-2 font-mono text-sm text-text-tertiary hover:text-text-secondary transition-colors"
        >
          Disconnect Wallet
        </button>
      </div>
    )
  }

  // Processing states (init-agent, signing, approving)
  const isProcessing = state.step === 'init-agent' || state.step === 'signing' || state.step === 'approving'

  return (
    <div className="space-y-6">
      {/* Step progress */}
      <div className="flex items-center justify-between">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
              i < stepIndex
                ? 'bg-signal-green text-main-bg'
                : i === stepIndex
                  ? 'border-2 border-signal-green text-signal-green'
                  : 'border border-container-border text-text-tertiary'
            }`}>
              {i < stepIndex ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className={`ml-1.5 font-mono text-xs ${
              i <= stepIndex ? 'text-text-secondary' : 'text-text-tertiary'
            }`}>
              {label}
            </span>
            {i < stepLabels.length - 1 && (
              <div className={`w-8 h-px mx-2 ${
                i < stepIndex ? 'bg-signal-green' : 'bg-container-border'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Wallet connection */}
      {!isConnected ? (
        <div className="space-y-4">
          <p className="font-mono text-sm text-text-secondary">
            Connect your Ethereum wallet to authorize an agent keypair for Hyperliquid trading.
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 py-3 border border-container-border rounded-md bg-main-bg">
            <div>
              <p className="font-mono text-xs text-text-tertiary">Connected Wallet</p>
              <p className="font-mono text-sm text-text-primary">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
            <button
              onClick={() => { disconnect(); setState({ step: 'idle' }) }}
              className="px-3 py-1 font-mono text-xs text-text-tertiary border border-container-border rounded-md hover:text-signal-red hover:border-signal-red/30 transition-colors"
            >
              Disconnect
            </button>
          </div>

          {isProcessing ? (
            <div className="text-center py-4">
              <div className="inline-block w-6 h-6 border-2 border-signal-green border-t-transparent rounded-full animate-spin mb-3" />
              <p className="font-mono text-sm text-text-secondary">
                {state.step === 'init-agent' && 'Generating agent keypair...'}
                {state.step === 'signing' && 'Waiting for wallet signature...'}
                {state.step === 'approving' && 'Submitting approval to Hyperliquid...'}
              </p>
              {state.step === 'signing' && (
                <p className="font-mono text-xs text-text-tertiary mt-2">
                  Check your wallet for the signing prompt
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={startFlow}
              disabled={!isConnected || !address || !connectors.length}
              className="w-full px-8 py-4 bg-signal-green text-main-bg font-mono font-bold text-lg rounded-md hover:bg-white transition-colors disabled:opacity-50"
            >
              AUTHORIZE AGENT WALLET
            </button>
          )}
        </div>
      )}
    </div>
  )
}
