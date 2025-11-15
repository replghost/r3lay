import { ref, computed, onMounted } from 'vue'
import type { EIP6963ProviderDetail, EIP6963AnnounceProviderEvent } from 'viem'

interface WalletState {
  address: string | null
  chainId: number | null
  isConnected: boolean
  provider: any | null
  walletName: string | null
}

export const useWalletConnect = () => {
  const walletState = useState<WalletState>('wallet-state', () => ({
    address: null,
    chainId: null,
    isConnected: false,
    provider: null,
    walletName: null,
  }))

  const availableWallets = ref<EIP6963ProviderDetail[]>([])
  const isConnecting = ref(false)
  const error = ref('')

  // Computed
  const address = computed(() => walletState.value.address)
  const chainId = computed(() => walletState.value.chainId)
  const isConnected = computed(() => walletState.value.isConnected)
  const walletName = computed(() => walletState.value.walletName)

  // Discover EIP-6963 wallets
  const discoverWallets = () => {
    if (typeof window === 'undefined') return

    // Listen for wallet announcements
    window.addEventListener('eip6963:announceProvider', (event: Event) => {
      const announceEvent = event as EIP6963AnnounceProviderEvent
      const wallet = announceEvent.detail
      
      // Add if not already in list
      if (!availableWallets.value.some(w => w.info.uuid === wallet.info.uuid)) {
        availableWallets.value.push(wallet)
        console.log('Discovered wallet:', wallet.info.name)
      }
    })

    // Request wallet announcements
    window.dispatchEvent(new Event('eip6963:requestProvider'))
  }

  // Connect to a specific wallet
  const connect = async (walletDetail?: EIP6963ProviderDetail) => {
    isConnecting.value = true
    error.value = ''

    try {
      let provider: any

      if (walletDetail) {
        // Use EIP-6963 wallet
        provider = walletDetail.provider
      } else if (window.ethereum) {
        // Fallback to window.ethereum
        provider = window.ethereum
      } else {
        throw new Error('No wallet found. Please install MetaMask or another Web3 wallet.')
      }

      // Request accounts
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found')
      }

      // Get chain ID
      const chainId = await provider.request({
        method: 'eth_chainId',
      })

      // Update state
      walletState.value = {
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        isConnected: true,
        provider,
        walletName: walletDetail?.info.name || 'Unknown Wallet',
      }

      // Save to localStorage for persistence
      localStorage.setItem('r3lay-wallet-connected', 'true')
      if (walletDetail) {
        localStorage.setItem('r3lay-wallet-uuid', walletDetail.info.uuid)
      }

      // Setup event listeners
      setupEventListeners(provider)

      console.log('✅ Wallet connected:', walletState.value.address)
      
    } catch (e: any) {
      console.error('Failed to connect wallet:', e)
      error.value = e.message || 'Failed to connect wallet'
      throw e
    } finally {
      isConnecting.value = false
    }
  }

  // Disconnect wallet
  const disconnect = () => {
    walletState.value = {
      address: null,
      chainId: null,
      isConnected: false,
      provider: null,
      walletName: null,
    }

    localStorage.removeItem('r3lay-wallet-connected')
    localStorage.removeItem('r3lay-wallet-uuid')

    console.log('🔌 Wallet disconnected')
  }

  // Switch network
  const switchNetwork = async (chainId: number) => {
    if (!walletState.value.provider) {
      throw new Error('No wallet connected')
    }

    const chainIdHex = `0x${chainId.toString(16)}`

    try {
      await walletState.value.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      })
    } catch (switchError: any) {
      // If network doesn't exist, this will be handled by addNetwork
      throw switchError
    }
  }

  // Add network
  const addNetwork = async (config: {
    chainId: number
    chainName: string
    rpcUrls: string[]
    nativeCurrency: {
      name: string
      symbol: string
      decimals: number
    }
    blockExplorerUrls?: string[]
  }) => {
    if (!walletState.value.provider) {
      throw new Error('No wallet connected')
    }

    const chainIdHex = `0x${config.chainId.toString(16)}`

    await walletState.value.provider.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: chainIdHex,
        chainName: config.chainName,
        nativeCurrency: config.nativeCurrency,
        rpcUrls: config.rpcUrls,
        blockExplorerUrls: config.blockExplorerUrls,
      }],
    })
  }

  // Setup event listeners
  const setupEventListeners = (provider: any) => {
    // Account changed
    provider.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect()
      } else {
        walletState.value.address = accounts[0]
        console.log('Account changed:', accounts[0])
      }
    })

    // Chain changed
    provider.on('chainChanged', (chainId: string) => {
      walletState.value.chainId = parseInt(chainId, 16)
      console.log('Chain changed:', chainId)
      // Reload to avoid state issues
      window.location.reload()
    })

    // Disconnect
    provider.on('disconnect', () => {
      disconnect()
    })
  }

  // Auto-reconnect on mount
  const autoConnect = async () => {
    const wasConnected = localStorage.getItem('r3lay-wallet-connected')
    const savedUuid = localStorage.getItem('r3lay-wallet-uuid')

    if (!wasConnected) return

    try {
      // Wait a bit for wallets to announce
      await new Promise(resolve => setTimeout(resolve, 100))

      if (savedUuid) {
        // Try to reconnect to the same wallet
        const wallet = availableWallets.value.find(w => w.info.uuid === savedUuid)
        if (wallet) {
          await connect(wallet)
          return
        }
      }

      // Fallback to default wallet
      if (availableWallets.value.length > 0) {
        await connect(availableWallets.value[0])
      } else if (window.ethereum) {
        await connect()
      }
    } catch (e) {
      console.warn('Auto-connect failed:', e)
      // Clear saved state if auto-connect fails
      localStorage.removeItem('r3lay-wallet-connected')
      localStorage.removeItem('r3lay-wallet-uuid')
    }
  }

  // Initialize
  onMounted(() => {
    discoverWallets()
    autoConnect()
  })

  return {
    // State
    address,
    chainId,
    isConnected,
    walletName,
    availableWallets,
    isConnecting,
    error,

    // Methods
    connect,
    disconnect,
    switchNetwork,
    addNetwork,
  }
}
