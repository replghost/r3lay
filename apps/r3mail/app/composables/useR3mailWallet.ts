/**
 * R3MAIL Wallet Composable
 * Handles wallet connection and key derivation
 */

import { ref, computed } from 'vue'
import { createR3mailChainClient } from '@r3mail/chain'

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
   * Detect which wallet is available
   */
  function detectWallet(): 'talisman' | 'metamask' | 'unknown' | null {
    if (typeof window === 'undefined' || !window.ethereum) {
      return null
    }
    
    // Check for Talisman first (it also sets isMetaMask)
    if (window.ethereum.isTalisman) {
      return 'talisman'
    }
    
    if (window.ethereum.isMetaMask) {
      return 'metamask'
    }
    
    return 'unknown'
  }

  /**
   * Connect wallet and derive keys
   */
  async function connect() {
    try {
      error.value = ''
      
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No Ethereum wallet found. Please install MetaMask or Talisman.')
      }

      // Detect wallet type
      const walletType = detectWallet()
      console.log('Detected wallet:', walletType)

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found')
      }

      address.value = accounts[0]
      isConnected.value = true
      
      console.log('Connected to wallet:', address.value)
      
      // Initialize chain client
      initClient()
      
      // Derive keys from wallet signature
      await deriveKeys()
      
    } catch (err: any) {
      error.value = err.message || 'Failed to connect wallet'
      console.error('Wallet connection error:', err)
      throw err
    }
  }

  /**
   * Load keys from localStorage
   */
  function loadKeysFromStorage(): { publicKey: Uint8Array; privateKey: Uint8Array } | null {
    try {
      const stored = localStorage.getItem(`r3mail_keys_${address.value}`)
      if (!stored) return null

      const parsed = JSON.parse(stored)
      return {
        publicKey: new Uint8Array(parsed.publicKey),
        privateKey: new Uint8Array(parsed.privateKey)
      }
    } catch (err) {
      console.error('Failed to load keys from storage:', err)
      return null
    }
  }

  /**
   * Save keys to localStorage
   */
  function saveKeysToStorage(keyPair: { publicKey: Uint8Array; privateKey: Uint8Array }) {
    try {
      const serialized = {
        publicKey: Array.from(keyPair.publicKey),
        privateKey: Array.from(keyPair.privateKey)
      }
      localStorage.setItem(`r3mail_keys_${address.value}`, JSON.stringify(serialized))
      console.log('Keys saved to localStorage')
    } catch (err) {
      console.error('Failed to save keys to storage:', err)
    }
  }

  /**
   * Derive encryption keys from wallet signature
   */
  async function deriveKeys() {
    if (!address.value) {
      throw new Error('No address connected')
    }

    // If keys already exist in memory, don't re-derive
    if (keys.value) {
      console.log('Keys already in memory, skipping...')
      return keys.value
    }

    // Try to load from localStorage first
    const storedKeys = loadKeysFromStorage()
    if (storedKeys) {
      console.log('Keys loaded from localStorage')
      keys.value = storedKeys
      return keys.value
    }

    try {
      // Request signature from wallet for key derivation
      const message = `R3MAIL Key Derivation v1

This signature will be used to derive your encryption keys.
It will NOT give R3MAIL access to your wallet or funds.

Address: ${address.value.toLowerCase()}
Version: 1
Purpose: Encryption Key Generation`

      console.log('Requesting signature for key derivation...')
      
      const signature = await window.ethereum!.request({
        method: 'personal_sign',
        params: [message, address.value]
      })

      console.log('Signature received, deriving keys...')

      // Derive keys from signature
      // For now, we'll use a simple hash-based derivation
      // In production, this should use proper key derivation (HKDF, etc.)
      const encoder = new TextEncoder()
      const sigBytes = new Uint8Array(
        signature.slice(2).match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16))
      )
      
      // Hash for public key
      const pubKeyHash = await crypto.subtle.digest('SHA-256', sigBytes)
      const publicKey = new Uint8Array(pubKeyHash)
      
      // Hash for private key (different domain)
      const combined = new Uint8Array(sigBytes.length + encoder.encode('private').length)
      combined.set(sigBytes, 0)
      combined.set(encoder.encode('private'), sigBytes.length)
      const privKeyHash = await crypto.subtle.digest('SHA-256', combined)
      const privateKey = new Uint8Array(privKeyHash)

      keys.value = {
        publicKey,
        privateKey
      }

      // Save to localStorage for future sessions
      saveKeysToStorage(keys.value)

      console.log('Keys derived successfully')
      return keys.value
    } catch (err: any) {
      error.value = err.message || 'Failed to derive keys'
      console.error('Key derivation error:', err)
      throw err
    }
  }

  /**
   * Disconnect wallet
   */
  function disconnect() {
    // Clear localStorage
    if (address.value) {
      localStorage.removeItem(`r3mail_keys_${address.value}`)
    }
    
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
