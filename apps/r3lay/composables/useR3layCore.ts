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
  
  return {
    // State
    creatorIdentity: readonly(creatorIdentity),
    followerIdentity: readonly(followerIdentity),
    hasCreatorIdentity,
    hasFollowerIdentity,
    
    // Actions
    initializeCreator,
    initializeFollower,
    loadIdentities,
    getCreatorPublicKey,
    getFollowerPublicKey,
  }
}
