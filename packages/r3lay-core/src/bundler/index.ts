/**
 * Post Bundler
 * 
 * Handles creating and parsing encrypted post bundles
 * Integrates crypto + IPFS operations
 */

import type {
  PostMetadata,
  PostBundle,
  EncryptedPostBundle,
  PublicKey,
  Cid,
} from '../types'
import {
  generateSymmetricKey,
  encryptSymmetric,
  decryptSymmetric,
  encryptMessageKeyForFollowers,
  decryptMessageKeyFromCreator,
  encodePublicKey,
  decodePublicKey,
} from '../crypto'
import { encodeBase64, decodeBase64, now } from '../utils'
import { CryptoError, DecryptionError } from '../types'

// ============================================================================
// Post Creation (Creator Side)
// ============================================================================

/**
 * Creates an encrypted post bundle for multiple followers
 */
export async function createEncryptedPostBundle(
  content: string,
  metadata: {
    title: string
    summary?: string
    authorPublicKey: Uint8Array
    attachments?: Map<string, Uint8Array>
  },
  creatorPrivateKey: Uint8Array,
  followerPublicKeys: PublicKey[]
): Promise<{
  metadata: PostMetadata
  encryptedContent: Uint8Array
  encryptedAttachments?: Map<string, Uint8Array>
}> {
  try {
    // 1. Generate symmetric key for this post
    const messageKey = await generateSymmetricKey()
    
    // 2. Encrypt content
    const contentBytes = new TextEncoder().encode(content)
    const { ciphertext: encryptedContent, nonce: contentNonce } = 
      await encryptSymmetric(contentBytes, messageKey)
    
    // 3. Encrypt attachments if present
    let encryptedAttachments: Map<string, Uint8Array> | undefined
    const attachmentNonces: Record<string, string> = {}
    
    if (metadata.attachments && metadata.attachments.size > 0) {
      encryptedAttachments = new Map()
      
      for (const [filename, data] of metadata.attachments.entries()) {
        const { ciphertext, nonce } = await encryptSymmetric(data, messageKey)
        encryptedAttachments.set(filename, ciphertext)
        attachmentNonces[filename] = encodeBase64(nonce)
      }
    }
    
    // 4. Encrypt message key for each follower
    const encryptedKeys = await encryptMessageKeyForFollowers(
      messageKey,
      creatorPrivateKey,
      followerPublicKeys
    )
    
    // 5. Build metadata
    const postMetadata: PostMetadata = {
      version: 1,
      author: encodePublicKey(metadata.authorPublicKey),
      timestamp: now(),
      title: metadata.title,
      summary: metadata.summary,
      encrypted_keys: encryptedKeys,
      attachments: metadata.attachments
        ? Array.from(metadata.attachments.keys()).map(filename => ({
            filename,
            mimeType: 'application/octet-stream', // TODO: detect mime type
            size: metadata.attachments!.get(filename)!.length,
          }))
        : undefined,
    }
    
    // Store nonces in metadata (needed for decryption)
    // We encode them as a special field
    const metadataWithNonces = {
      ...postMetadata,
      _nonces: {
        content: encodeBase64(contentNonce),
        attachments: attachmentNonces,
      },
    } as any
    
    return {
      metadata: metadataWithNonces,
      encryptedContent,
      encryptedAttachments,
    }
  } catch (error) {
    throw new CryptoError('Failed to create encrypted post bundle', error)
  }
}

// ============================================================================
// Post Decryption (Follower Side)
// ============================================================================

/**
 * Decrypts a post bundle for a specific follower
 */
export async function decryptPostBundle(
  bundle: {
    metadata: PostMetadata & { _nonces?: any }
    encryptedContent: Uint8Array
    encryptedAttachments?: Map<string, Uint8Array>
  },
  followerPrivateKey: Uint8Array,
  followerPublicKey: PublicKey,
  creatorPublicKey: PublicKey
): Promise<PostBundle> {
  try {
    // 1. Find encrypted key for this follower
    const encryptedKeyData = bundle.metadata.encrypted_keys[followerPublicKey]
    
    if (!encryptedKeyData) {
      throw new DecryptionError(
        'Not authorized to read this post - no encrypted key found for this follower'
      )
    }
    
    // 2. Parse encrypted key (format: "encryptedKey:nonce")
    const [encryptedKey, keyNonce] = encryptedKeyData.split(':')
    
    if (!encryptedKey || !keyNonce) {
      throw new DecryptionError('Invalid encrypted key format')
    }
    
    // 3. Decrypt message key
    const messageKey = await decryptMessageKeyFromCreator(
      encryptedKey,
      keyNonce,
      followerPrivateKey,
      decodePublicKey(creatorPublicKey)
    )
    
    // 4. Get nonces from metadata
    const nonces = (bundle.metadata as any)._nonces
    if (!nonces || !nonces.content) {
      throw new DecryptionError('Missing nonces in metadata')
    }
    
    // 5. Decrypt content
    const contentNonce = decodeBase64(nonces.content)
    const decryptedContentBytes = await decryptSymmetric(
      bundle.encryptedContent,
      contentNonce,
      messageKey
    )
    const content = new TextDecoder().decode(decryptedContentBytes)
    
    // 6. Decrypt attachments if present
    let attachments: Map<string, Uint8Array> | undefined
    
    if (bundle.encryptedAttachments && bundle.encryptedAttachments.size > 0) {
      attachments = new Map()
      
      for (const [filename, encryptedData] of bundle.encryptedAttachments.entries()) {
        const attachmentNonce = nonces.attachments?.[filename]
        
        if (!attachmentNonce) {
          console.warn(`Missing nonce for attachment: ${filename}`)
          continue
        }
        
        const nonceBytes = decodeBase64(attachmentNonce)
        const decryptedData = await decryptSymmetric(
          encryptedData,
          nonceBytes,
          messageKey
        )
        
        attachments.set(filename, decryptedData)
      }
    }
    
    // 7. Return decrypted bundle
    return {
      metadata: bundle.metadata,
      content,
      attachments,
    }
  } catch (error) {
    if (error instanceof DecryptionError) {
      throw error
    }
    throw new DecryptionError('Failed to decrypt post bundle', error)
  }
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Checks if a follower can decrypt a post (without actually decrypting)
 */
export function canDecryptPost(
  metadata: PostMetadata,
  followerPublicKey: PublicKey
): boolean {
  return followerPublicKey in metadata.encrypted_keys
}

/**
 * Filters posts that a follower can decrypt
 */
export function filterDecryptablePosts(
  posts: Array<{ metadata: PostMetadata; cid: Cid }>,
  followerPublicKey: PublicKey
): Array<{ metadata: PostMetadata; cid: Cid }> {
  return posts.filter(post => canDecryptPost(post.metadata, followerPublicKey))
}

/**
 * Decrypts multiple posts in parallel
 */
export async function decryptMultiplePosts(
  bundles: Array<{
    metadata: PostMetadata & { _nonces?: any }
    encryptedContent: Uint8Array
    encryptedAttachments?: Map<string, Uint8Array>
    cid: Cid
  }>,
  followerPrivateKey: Uint8Array,
  followerPublicKey: PublicKey,
  creatorPublicKey: PublicKey,
  concurrency = 5
): Promise<Map<Cid, PostBundle>> {
  const results = new Map<Cid, PostBundle>()
  
  // Process in batches
  for (let i = 0; i < bundles.length; i += concurrency) {
    const batch = bundles.slice(i, i + concurrency)
    
    const promises = batch.map(async (bundle) => {
      try {
        const decrypted = await decryptPostBundle(
          bundle,
          followerPrivateKey,
          followerPublicKey,
          creatorPublicKey
        )
        return { cid: bundle.cid, post: decrypted }
      } catch (error) {
        console.error(`Failed to decrypt post ${bundle.cid}:`, error)
        return { cid: bundle.cid, post: null }
      }
    })
    
    const batchResults = await Promise.all(promises)
    
    for (const { cid, post } of batchResults) {
      if (post) {
        results.set(cid, post)
      }
    }
  }
  
  return results
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validates post metadata
 */
export function validatePostMetadata(metadata: PostMetadata): boolean {
  return (
    metadata.version === 1 &&
    typeof metadata.author === 'string' &&
    typeof metadata.timestamp === 'number' &&
    typeof metadata.title === 'string' &&
    typeof metadata.encrypted_keys === 'object' &&
    Object.keys(metadata.encrypted_keys).length > 0
  )
}

/**
 * Gets the list of authorized followers from metadata
 */
export function getAuthorizedFollowers(metadata: PostMetadata): PublicKey[] {
  return Object.keys(metadata.encrypted_keys)
}

/**
 * Counts the number of authorized followers
 */
export function countAuthorizedFollowers(metadata: PostMetadata): number {
  return Object.keys(metadata.encrypted_keys).length
}
