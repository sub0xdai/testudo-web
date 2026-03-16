import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { arbitrum } from 'wagmi/chains'

export const wagmiConfig = getDefaultConfig({
  appName: 'Testudo',
  projectId: 'testudo-local',
  chains: [arbitrum],
})
