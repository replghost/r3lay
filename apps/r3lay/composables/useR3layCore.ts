/**
 * Core R3LAY composable
 * 
 * Provides access to core R3LAY functionality
 */

import type { CreatorIdentity, FollowerIdentity } from '../../../packages/r3lay-core/src/types'
import {
  loadCreatorKeys,
  hasCreatorKeys,
  storeCreatorKeys,
  loadFollowerKeys,
  hasFollowerKeys,
  storeFollowerKeys,
} from '../../../packages/r3lay-core/src/crypto/storage'
import {
  generateCreatorIdentity,
  generateFollowerIdentity,
  encodePublicKey,
} from '../../../packages/r3lay-core/src/crypto'

export const useR3layCore = () => {
  // Creator identity state
  const creatorIdentity = useState<CreatorIdentity | null>('creator-identity', () => null)
  const hasCreatorIdentity = computed(() => creatorIdentity.value !== null)
  
  // Follower identity state
  const followerIdentity = useState<FollowerIdentity | null>('follower-identity', () => null)
  const hasFollowerIdentity = computed(() => followerIdentity.value !== null)
  
  // Initialize creator identity
  const initializeCreator = async () => {
    // Check if already exists
    if (await hasCreatorKeys()) {
      creatorIdentity.value = await loadCreatorKeys()
      return creatorIdentity.value
    }
    
    // Generate new identity
    const identity = await generateCreatorIdentity(true) // with signing key
    await storeCreatorKeys(identity)
    creatorIdentity.value = identity
    
    return identity
  }
  
  // Initialize follower identity
  const initializeFollower = async () => {
    if (await hasFollowerKeys()) {
      followerIdentity.value = await loadFollowerKeys()
      return followerIdentity.value
    }
    
    // Generate new identity
    const identity = await generateFollowerIdentity()
    await storeFollowerKeys(identity)
    followerIdentity.value = identity
    
    return identity
  }
  
  // Load existing identities on mount
  const loadIdentities = async () => {
    if (await hasCreatorKeys()) {
      creatorIdentity.value = await loadCreatorKeys()
    }
    
    if (await hasFollowerKeys()) {
      followerIdentity.value = await loadFollowerKeys()
    }
  }
  
  // Get creator public key
  const getCreatorPublicKey = async () => {
    if (!creatorIdentity.value) return null
    return encodePublicKey(creatorIdentity.value.encryptionKeyPair.publicKey)
  }
  
  // Get follower public key
  const getFollowerPublicKey = async () => {
    if (!followerIdentity.value) return null
    return encodePublicKey(followerIdentity.value.encryptionKeyPair.publicKey)
  }
  
  // Initialize creator from wallet (MetaMask/Talisman)
  const initializeCreatorFromWallet = async (walletAddress: string) => {
    try {
      // Import wallet derivation
      const { deriveCreatorIdentityFromWallet } = await import('../../../packages/r3lay-core/src/crypto/wallet-derivation.ts')
      
      // Derive keys from wallet signature
      const identity = await deriveCreatorIdentityFromWallet(walletAddress)
      
      // Store in state
      creatorIdentity.value = identity
      
      // Optionally cache in session storage (not persistent)
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('r3lay-creator-wallet-derived', 'true')
      }
      
      return identity
    } catch (error: any) {
      console.error('Failed to derive creator identity from wallet:', error)
      throw error
    }
  }
  
  // Initialize follower from wallet (MetaMask/Talisman)
  const initializeFollowerFromWallet = async (walletAddress: string) => {
    try {
      // Import wallet derivation
      const { deriveFollowerIdentityFromWallet } = await import('../../../packages/r3lay-core/src/crypto/wallet-derivation.ts')
      
      // Derive keys from wallet signature
      const identity = await deriveFollowerIdentityFromWallet(walletAddress)
      
      // Store in state
      followerIdentity.value = identity
      
      // Optionally cache in session storage (not persistent)
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('r3lay-follower-wallet-derived', 'true')
      }
      
      return identity
    } catch (error: any) {
      console.error('Failed to derive follower identity from wallet:', error)
      throw error
    }
  }
  
  // Check if wallet derivation is available
  const isWalletDerivationAvailable = () => {
    if (typeof window === 'undefined') return false
    return !!(window as any).ethereum
  }
  
  // Detect connected wallet
  const detectWallet = () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      return null
    }
    
    const ethereum = (window as any).ethereum
    
    if (ethereum.isTalisman) return 'talisman'
    if (ethereum.isMetaMask) return 'metamask'
    return 'unknown'
  }
  
  // Decrypt post bundle (for creator viewing their own posts)
  const decryptPostAsCreator = async (bundle: any) => {
    if (!creatorIdentity.value) {
      throw new Error('Creator identity not found')
    }
    
    const creatorPubkey = await getCreatorPublicKey()
    if (!creatorPubkey) {
      throw new Error('Creator public key not found')
    }
    
    // Import bundler functions
    const { decryptPostBundle } = await import('../../../packages/r3lay-core/src/bundler/index.ts')
    
    // Creator can decrypt using their own keys
    return await decryptPostBundle(
      bundle,
      creatorIdentity.value.encryptionKeyPair.privateKey,
      creatorPubkey,
      bundle.metadata.author
    )
  }
  
  // Decrypt post bundle (for follower reading posts)
  const decryptPostAsFollower = async (bundle: any) => {
    if (!followerIdentity.value) {
      throw new Error('Follower identity not found')
    }
    
    const followerPubkey = await getFollowerPublicKey()
    if (!followerPubkey) {
      throw new Error('Follower public key not found')
    }
    
    // Import bundler functions
    const { decryptPostBundle } = await import('../../../packages/r3lay-core/src/bundler/index.ts')
    
    // Decrypt using follower keys
    return await decryptPostBundle(
      bundle,
      followerIdentity.value.encryptionKeyPair.privateKey,
      followerPubkey,
      bundle.metadata.author
    )
  }
  
  return {
    // State
    creatorIdentity: readonly(creatorIdentity),
    followerIdentity: readonly(followerIdentity),
    hasCreatorIdentity,
    hasFollowerIdentity,
    
    // Actions
    initializeCreator,
    initializeFollower,
    initializeCreatorFromWallet,
    initializeFollowerFromWallet,
    loadIdentities,
    getCreatorPublicKey,
    getFollowerPublicKey,
    decryptPostAsCreator,
    decryptPostAsFollower,
    isWalletDerivationAvailable,
    detectWallet,
  }
}
