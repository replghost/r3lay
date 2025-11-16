/**
 * R3MAIL Wallet Composable
 * Handles wallet connection and key derivation
 */

import { ref, computed } from 'vue'
import { createR3mailChainClient, type R3mailChainClient } from '@r3mail/chain'
import { hkdf } from '@noble/hashes/hkdf.js'
import { sha256 } from '@noble/hashes/sha2.js'

const isConnected = ref(false)
const address = ref<string>('')
const chainClient = ref<ReturnType<typeof createR3mailChainClient> | null>(null)
const keys = ref<{ publicKey: Uint8Array; privateKey: Uint8Array } | null>(null)
const error = ref('')

export function useR3mailWallet() {
  /**
   * Switch to Paseo Asset Hub network
   */
  async function switchNetwork() {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No wallet found')
    }

    const chainId = '0x190f1b46' // 420420422 - actual chain ID from RPC

    try {
      // Try to switch to Paseo Asset Hub
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      })
      return true
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId,
                chainName: 'Passet Hub',
                nativeCurrency: {
                  name: 'PAS',
                  symbol: 'PAS',
                  decimals: 18,
                },
                rpcUrls: ['https://testnet-passet-hub-eth-rpc.polkadot.io'],
                blockExplorerUrls: ['https://blockscout-passet-hub.parity-testnet.parity.io'],
              },
            ],
          })
          return true
        } catch (addError: any) {
          // Check if network already exists (common error)
          if (addError.code === -32603 || addError.message?.includes('already exists') || addError.message?.includes('Duplicate')) {
            console.log('Network already exists, attempting to switch again...')
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId }],
              })
              return true
            } catch (retryError: any) {
              console.error('Failed to switch after detecting existing network:', retryError)
              if (retryError.message?.includes('Unknown network')) {
                throw new Error(`You have a network with the wrong Chain ID saved in your wallet. Please manually switch to Passet Hub (Chain ID: 420420422) or delete the incorrect network from your wallet settings.`)
              }
            }
          }
          
          // Only throw for real errors, not duplicate network or user rejection
          if (addError.code !== 4001) { // 4001 is user rejection
            console.error('Failed to add network:', addError)
            throw new Error(`Please add Passet Hub network manually in MetaMask. Chain ID: 420420422`)
          }
          return false
        }
      } else {
        // User rejected or other error
        console.error('Failed to switch network:', switchError)
        throw new Error('Please switch to Paseo Asset Hub network in MetaMask')
      }
    }
  }

  /**
   * Initialize chain client
   */
  async function initClient() {
    if (!chainClient.value) {
      chainClient.value = createR3mailChainClient()
      // Connect wallet client for write operations
      await chainClient.value.connectWallet()
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
      
      // Switch to Paseo Asset Hub network
      console.log('Switching to Paseo Asset Hub...')
      await switchNetwork()
      
      // Initialize chain client and connect wallet
      await initClient()
      
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
      const message = `R3MAIL Key Derivation v2

This signature will be used to derive your encryption keys using HKDF.
It will NOT give R3MAIL access to your wallet or funds.

Address: ${address.value.toLowerCase()}
Version: 2
Purpose: Encryption Key Generation (HKDF-SHA256)`

      console.log('Requesting signature for key derivation...')
      
      const signature = await window.ethereum!.request({
        method: 'personal_sign',
        params: [message, address.value]
      })

      console.log('Signature received, deriving keys...')

      // Derive keys from signature using HKDF
      // HKDF provides cryptographically secure key derivation with proper domain separation
      const sigBytes = new Uint8Array(
        signature.slice(2).match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16))
      )
      
      // Use HKDF to derive a seed, then generate proper Curve25519 keypair
      // This ensures the keys are valid for libsodium's crypto_box functions
      const encoder = new TextEncoder()
      const seed = hkdf(sha256, sigBytes, undefined, encoder.encode('r3mail-seed-v1'), 32)
      
      // Generate proper Curve25519 keypair from seed using libsodium
      // Import from @r3mail/core which has libsodium as a dependency
      const { ensureSodium } = await import('@r3mail/core')
      const sodium = await ensureSodium()
      
      const keyPair = sodium.crypto_box_seed_keypair(seed)
      
      console.log('Generated keypair:')
      console.log('  Public key length:', keyPair.publicKey.length)
      console.log('  Private key length:', keyPair.privateKey.length)
      console.log('  Public key (first 16):', Array.from(keyPair.publicKey.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
      console.log('  Private key (first 16):', Array.from(keyPair.privateKey.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
      
      // Test that the keypair works with crypto_box_beforenm
      try {
        const testSharedSecret = sodium.crypto_box_beforenm(keyPair.publicKey, keyPair.privateKey)
        console.log('✅ Keypair is valid for crypto_box_beforenm')
        console.log('  Shared secret (first 16):', Array.from(testSharedSecret.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
      } catch (err) {
        console.error('❌ Keypair test failed:', err)
      }
      
      keys.value = {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey
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
    // Don't clear keys from localStorage - they should persist
    // Users can manually clear them if needed via browser storage
    
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
        
        // Switch to Paseo Asset Hub network
        await switchNetwork()
        
        // Initialize client and connect wallet
        await initClient()
        
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

  /**
   * Register public key on-chain
   */
  async function registerPublicKey() {
    if (!keys.value || !chainClient.value) {
      throw new Error('Keys not derived or client not initialized')
    }

    try {
      console.log('Registering public key on-chain...')
      const txHash = await chainClient.value.registerPublicKey(keys.value.publicKey)
      console.log('Public key registered! Transaction:', txHash)
      return txHash
    } catch (err: any) {
      error.value = err.message || 'Failed to register public key'
      throw err
    }
  }

  /**
   * Check if current user has registered their public key AND it matches current keys
   */
  async function hasPublicKey(): Promise<boolean> {
    if (!address.value || !chainClient.value || !keys.value) {
      return false
    }

    try {
      // Get registered public key from chain
      const registeredKey = await chainClient.value.getPublicKey(address.value as `0x${string}`)
      
      if (!registeredKey) {
        console.log('❌ No public key registered on-chain')
        return false
      }
      
      // Check if registered key matches current key
      const currentKey = keys.value.publicKey
      const keysMatch = registeredKey.length === currentKey.length &&
        registeredKey.every((byte, i) => byte === currentKey[i])
      
      if (!keysMatch) {
        console.log('⚠️ Registered key does not match current key!')
        console.log('Registered (first 16 bytes):', Array.from(registeredKey.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
        console.log('Current (first 16 bytes):', Array.from(currentKey.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
        return false
      }
      
      console.log('✅ Public key registered and matches current key')
      return true
    } catch (err) {
      console.error('Error checking public key:', err)
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
    switchNetwork,
    registerPublicKey,
    hasPublicKey,
  }
}
