import { Web3Modal } from '@web3modal/html'
import { EthereumClient, w3mProvider } from '@web3modal/ethereum'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { mainnet, bsc } from 'wagmi/chains'

// Your WalletConnect Project ID
const projectId = 'bf40c7dcdb05f06f2769573103007576'

// Configure supported chains
const chains = [mainnet, bsc]
const { publicClient } = configureChains(chains, [w3mProvider({ projectId })])

// Wagmi config
const wagmiConfig = createConfig({
  autoConnect: true,
  publicClient
})

// EthereumClient instance
const ethereumClient = new EthereumClient(wagmiConfig, chains)

// Create the modal
const modal = new Web3Modal({
  projectId,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#00ccff',
    '--w3m-color-mix-strength': 40
  }
}, ethereumClient)

// Open wallet modal when a button is clicked
document.getElementById('connectWalletBtn')?.addEventListener('click', () => {
  modal.openModal()
})

// Optional: Show connected address
wagmiConfig.connectors[0].connect().then(conn => {
  if (conn.accounts?.[0]) {
    document.getElementById('walletAddress').textContent = conn.accounts[0]
  }
})
