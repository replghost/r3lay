/**
 * R3LAY Cryptography Module
 * 
 * Provides X25519 key exchange, symmetric encryption, and key management
 * Uses libsodium for cryptographic operations
 */

import type {
  X25519KeyPair,
  Ed25519KeyPair,
  PublicKey,
  CreatorIdentity,
  FollowerIdentity,
} from '../types'
import { CryptoError, DecryptionError } from '../types'
import { encodeBase64, decodeBase64 } from '../utils'

// ============================================================================
// Lazy Load Sodium
// ============================================================================

let sodium: any = null

async function getSodium() {
  if (sodium) return sodium
  
  try {
    // Dynamic import for browser/node compatibility
    const sodiumModule = await import('libsodium-wrappers')
    await sodiumModule.ready
    // Use default export if available, otherwise use the module itself
    sodium = sodiumModule.default || sodiumModule
    return sodium
  } catch (error) {
    throw new CryptoError('Failed to load libsodium', error)
  }
}

// ============================================================================
// Key Generation
// ============================================================================

// ============================================================================
// Key Generation
// ============================================================================

/**
 * Generates a new X25519 encryption keypair
 */
export async function generateX25519KeyPair(): Promise<X25519KeyPair> {
  try {
    console.log('Getting sodium...')
    const sodium = await getSodium()
    console.log('Sodium loaded:', !!sodium, typeof sodium)
    console.log('crypto_box_keypair available:', typeof sodium.crypto_box_keypair)
    
    const keyPair = sodium.crypto_box_keypair()
    console.log('KeyPair generated:', !!keyPair)
    
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    }
  } catch (error) {
    console.error('X25519 generation error:', error)
    throw new CryptoError('Failed to generate X25519 keypair', error)
  }
}

/**
 * Generates a new Ed25519 signing keypair
 */
export async function generateEd25519KeyPair(): Promise<Ed25519KeyPair> {
  const sodium = await getSodium()
  
  try {
    const keyPair = sodium.crypto_sign_keypair()
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    }
  } catch (error) {
    throw new CryptoError('Failed to generate Ed25519 keypair', error)
  }
}

/**
 * Generates a complete creator identity (encryption + optional signing keys)
 */
export async function generateCreatorIdentity(
  includeSigningKey = false
): Promise<CreatorIdentity> {
  const encryptionKeyPair = await generateX25519KeyPair()
  const signingKeyPair = includeSigningKey ? await generateEd25519KeyPair() : undefined
  
  return {
    encryptionKeyPair,
    signingKeyPair,
  }
}

/**
 * Generates a follower identity (encryption key only)
 */
export async function generateFollowerIdentity(): Promise<FollowerIdentity> {
  const encryptionKeyPair = await generateX25519KeyPair()
  
  return {
    encryptionKeyPair,
  }
}

/**
 * Generates a random symmetric key for message encryption
 */
export async function generateSymmetricKey(): Promise<Uint8Array> {
  const sodium = await getSodium()
  
  try {
    return sodium.crypto_secretbox_keygen()
  } catch (error) {
    throw new CryptoError('Failed to generate symmetric key', error)
  }
}

// ============================================================================
// Symmetric Encryption (XSalsa20-Poly1305)
// ============================================================================

/**
 * Encrypts data with a symmetric key
 * Returns { ciphertext, nonce }
 */
export async function encryptSymmetric(
  plaintext: Uint8Array,
  key: Uint8Array
): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }> {
  const sodium = await getSodium()
  
  try {
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
    const ciphertext = sodium.crypto_secretbox_easy(plaintext, nonce, key)
    
    return { ciphertext, nonce }
  } catch (error) {
    throw new CryptoError('Symmetric encryption failed', error)
  }
}

/**
 * Decrypts data with a symmetric key
 */
export async function decryptSymmetric(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  key: Uint8Array
): Promise<Uint8Array> {
  const sodium = await getSodium()
  
  try {
    const plaintext = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key)
    if (!plaintext) {
      throw new DecryptionError('Decryption failed - invalid key or corrupted data')
    }
    return plaintext
  } catch (error) {
    throw new DecryptionError('Symmetric decryption failed', error)
  }
}

// ============================================================================
// ECDH-Based Encryption (X25519)
// ============================================================================

/**
 * Derives a shared secret between two X25519 keypairs
 * Used for encrypting the symmetric message key for a specific follower
 */
export async function deriveSharedSecret(
  myPrivateKey: Uint8Array,
  theirPublicKey: Uint8Array
): Promise<Uint8Array> {
  const sodium = await getSodium()
  
  try {
    // Use crypto_box_beforenm for key derivation
    return sodium.crypto_box_beforenm(theirPublicKey, myPrivateKey)
  } catch (error) {
    throw new CryptoError('Failed to derive shared secret', error)
  }
}

/**
 * Encrypts a message key for a specific follower using ECDH
 * Creator uses this to encrypt K_msg for each follower
 */
export async function encryptMessageKeyForFollower(
  messageKey: Uint8Array,
  creatorPrivateKey: Uint8Array,
  followerPublicKey: Uint8Array
): Promise<{ encryptedKey: string; nonce: string }> {
  const sodium = await getSodium()
  
  try {
    const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES)
    const ciphertext = sodium.crypto_box_easy(
      messageKey,
      nonce,
      followerPublicKey,
      creatorPrivateKey
    )
    
    return {
      encryptedKey: encodeBase64(ciphertext),
      nonce: encodeBase64(nonce),
    }
  } catch (error) {
    throw new CryptoError('Failed to encrypt message key for follower', error)
  }
}

/**
 * Decrypts a message key from a creator
 * Follower uses this to decrypt K_msg
 */
export async function decryptMessageKeyFromCreator(
  encryptedKey: string,
  nonce: string,
  followerPrivateKey: Uint8Array,
  creatorPublicKey: Uint8Array
): Promise<Uint8Array> {
  const sodium = await getSodium()
  
  try {
    const ciphertext = decodeBase64(encryptedKey)
    const nonceBytes = decodeBase64(nonce)
    
    const messageKey = sodium.crypto_box_open_easy(
      ciphertext,
      nonceBytes,
      creatorPublicKey,
      followerPrivateKey
    )
    
    if (!messageKey) {
      throw new DecryptionError('Failed to decrypt message key - invalid keys')
    }
    
    return messageKey
  } catch (error) {
    throw new DecryptionError('Failed to decrypt message key from creator', error)
  }
}

/**
 * Encrypts a message key for multiple followers
 * Returns a map of follower public key -> encrypted key
 */
export async function encryptMessageKeyForFollowers(
  messageKey: Uint8Array,
  creatorPrivateKey: Uint8Array,
  followerPublicKeys: PublicKey[]
): Promise<Record<PublicKey, string>> {
  const encryptedKeys: Record<PublicKey, string> = {}
  
  for (const followerPubkey of followerPublicKeys) {
    try {
      const followerPubkeyBytes = decodeBase64(followerPubkey)
      const { encryptedKey, nonce } = await encryptMessageKeyForFollower(
        messageKey,
        creatorPrivateKey,
        followerPubkeyBytes
      )
      
      // Store as "encryptedKey:nonce" format
      encryptedKeys[followerPubkey] = `${encryptedKey}:${nonce}`
    } catch (error) {
      console.error(`Failed to encrypt for follower ${followerPubkey}:`, error)
      // Continue with other followers
    }
  }
  
  return encryptedKeys
}

// ============================================================================
// Signing (Ed25519) - Optional
// ============================================================================

/**
 * Signs data with Ed25519 private key
 */
export async function sign(
  data: Uint8Array,
  privateKey: Uint8Array
): Promise<Uint8Array> {
  const sodium = await getSodium()
  
  try {
    return sodium.crypto_sign_detached(data, privateKey)
  } catch (error) {
    throw new CryptoError('Signing failed', error)
  }
}

/**
 * Verifies an Ed25519 signature
 */
export async function verify(
  signature: Uint8Array,
  data: Uint8Array,
  publicKey: Uint8Array
): Promise<boolean> {
  const sodium = await getSodium()
  
  try {
    return sodium.crypto_sign_verify_detached(signature, data, publicKey)
  } catch (error) {
    return false
  }
}

// ============================================================================
// Public Key Encoding/Decoding
// ============================================================================

/**
 * Encodes a public key to base64 string
 */
export function encodePublicKey(publicKey: Uint8Array): PublicKey {
  return encodeBase64(publicKey)
}

/**
 * Decodes a base64 public key string to Uint8Array
 */
export function decodePublicKey(publicKey: PublicKey): Uint8Array {
  return decodeBase64(publicKey)
}

// ============================================================================
// Key Validation
// ============================================================================

/**
 * Validates an X25519 public key
 */
export function validateX25519PublicKey(publicKey: Uint8Array): boolean {
  return publicKey.length === 32
}

/**
 * Validates an Ed25519 public key
 */
export function validateEd25519PublicKey(publicKey: Uint8Array): boolean {
  return publicKey.length === 32
}

/**
 * Validates a base64-encoded public key string
 */
export function validatePublicKeyString(publicKey: string): boolean {
  try {
    const decoded = decodeBase64(publicKey)
    return decoded.length === 32
  } catch {
    return false
  }
}
