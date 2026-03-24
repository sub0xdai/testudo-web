import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'
import { arbitrum } from 'wagmi/chains'

export const wagmiConfig = getDefaultConfig({
  appName: 'Testudo',
  // WalletConnect Cloud project ID — get one at https://cloud.walletconnect.com
  // 'testudo-local' is a placeholder; WalletConnect relay won't work but
  // injected wallets (MetaMask, Rabby) connect directly without it.
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'testudo-local',
  chains: [arbitrum],
  transports: {
    [arbitrum.id]: http(),
  },
})
