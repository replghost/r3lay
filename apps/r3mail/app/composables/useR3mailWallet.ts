/**
 * R3MAIL Wallet Composable
 * Handles wallet connection and key derivation
 */

import { ref, computed } from 'vue'
import { createR3mailChainClient } from '@r3mail/chain'
import { getUserKeys } from '@r3mail/core'

const isConnected = ref(false)
const address = ref<string>('')
const chainClient = ref<ReturnType<typeof createR3mailChainClient> | null>(null)
const keys = ref<{ publicKey: Uint8Array; privateKey: Uint8Array } | null>(null)
const error = ref('')

export function useR3mailWallet() {
  /**
   * Initialize chain client
   */
  function initClient() {
    if (!chainClient.value) {
      chainClient.value = createR3mailChainClient()
    }
    return chainClient.value
  }

  /**
   * Connect wallet
   */
  async function connect() {
    try {
      error.value = ''
      
      // Initialize client
      const client = initClient()
      
      // Connect wallet
      await client.connectWallet()
      
      // Get address
      const addr = await client.getWalletAddress()
      if (!addr) {
        throw new Error('No address found')
      }
      
      address.value = addr
      isConnected.value = true
      
      // Derive keys from wallet
      await deriveKeys()
      
      return addr
    } catch (err: any) {
      error.value = err.message || 'Failed to connect wallet'
      throw err
    }
  }

  /**
   * Derive encryption keys from wallet signature
   */
  async function deriveKeys() {
    if (!address.value) {
      throw new Error('No address connected')
    }

    try {
      keys.value = await getUserKeys(address.value)
      return keys.value
    } catch (err: any) {
      error.value = err.message || 'Failed to derive keys'
      throw err
    }
  }

  /**
   * Disconnect wallet
   */
  function disconnect() {
    isConnected.value = false
    address.value = ''
    keys.value = null
    error.value = ''
  }

  /**
   * Check if wallet is already connected
   */
  async function checkConnection() {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        return false
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts && accounts.length > 0) {
        address.value = accounts[0]
        isConnected.value = true
        
        // Initialize client
        initClient()
        
        // Derive keys
        await deriveKeys()
        
        return true
      }
      
      return false
    } catch (err) {
      console.error('Failed to check connection:', err)
      return false
    }
  }

  return {
    // State
    isConnected: computed(() => isConnected.value),
    address: computed(() => address.value),
    keys: computed(() => keys.value),
    chainClient: computed(() => chainClient.value),
    error: computed(() => error.value),
    
    // Methods
    connect,
    disconnect,
    checkConnection,
    deriveKeys,
    initClient,
  }
}
