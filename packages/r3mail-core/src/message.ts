/**
 * R3MAIL Message Module
 * 
 * Handles message encryption and decryption using ECDH + XChaCha20-Poly1305
 */

import _sodium from 'libsodium-wrappers'
import {
  EncryptionError,
  DecryptionError,
  ValidationError,
  type MessageEnvelope,
  type EncryptedMessageBundle,
  type DecryptedMessage,
  type KeyPair,
  type CreateMessageOptions,
  type DecryptMessageOptions,
} from './types'
import { canonicalEnvelopeJSON } from './envelope'

// Initialize libsodium
let sodiumReady: Promise<typeof _sodium> | null = null

export async function ensureSodium() {
  if (!sodiumReady) {
    sodiumReady = _sodium.ready.then(() => _sodium)
  }
  return sodiumReady
}

/**
 * Derive public key from EVM address using wallet signature
 * Same deterministic derivation as R3LAY
 * 
 * @param address - EVM address (0x...)
 * @returns Public key for encryption
 */
export async function derivePublicKeyFromAddress(address: string): Promise<Uint8Array> {
  // TODO: Implement wallet-based key derivation
  // For now, return a placeholder that will be replaced by the composable
  throw new EncryptionError('derivePublicKeyFromAddress not yet implemented - use composable')
}

/**
 * Generate a random content encryption key (CEK)
 */
async function generateCEK(): Promise<Uint8Array> {
  const lib = await ensureSodium()
  return lib.randombytes_buf(32) // 256-bit key
}

/**
 * Generate a random nonce for XChaCha20
 */
async function generateNonce(): Promise<Uint8Array> {
  const lib = await ensureSodium()
  return lib.randombytes_buf(24) // 192-bit nonce
}

/**
 * Compute SHA-256 hash using Web Crypto API
 */
async function sha256(data: Uint8Array | string): Promise<string> {
  const bytes = typeof data === 'string' 
    ? new TextEncoder().encode(data)
    : data
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes as BufferSource)
  const hashArray = new Uint8Array(hashBuffer)
  return '0x' + Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Compute keccak256 hash (for message ID)
 */
async function keccak256(data: string): Promise<string> {
  // For now, use SHA-256 as fallback
  // In production, use proper keccak256 from ethers or viem
  return await sha256(data)
}

/**
 * Encrypt message body with CEK using XChaCha20-Poly1305
 */
async function encryptBody(plaintext: string, cek: Uint8Array, nonce: Uint8Array): Promise<Uint8Array> {
  const lib = await ensureSodium()
  console.log('📝 encryptBody:')
  console.log('  CEK (first 16):', Array.from(cek.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
  console.log('  Nonce (first 16):', Array.from(nonce.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
  console.log('  Plaintext length:', plaintext.length)
  
  const plaintextBytes = new TextEncoder().encode(plaintext)
  const encrypted = lib.crypto_secretbox_easy(plaintextBytes, nonce, cek)
  
  console.log('  Encrypted body (first 16):', Array.from(encrypted.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
  
  return encrypted
}

/**
 * Decrypt message body with CEK
 */
async function decryptBody(ciphertext: Uint8Array, cek: Uint8Array, nonce: Uint8Array): Promise<string> {
  const lib = await ensureSodium()
  console.log('📖 decryptBody:')
  console.log('  CEK (first 16):', Array.from(cek.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
  console.log('  Nonce (first 16):', Array.from(nonce.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
  console.log('  Ciphertext (first 16):', Array.from(ciphertext.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
  
  const plaintextBytes = lib.crypto_secretbox_open_easy(ciphertext, nonce, cek)
  const decrypted = new TextDecoder().decode(plaintextBytes)
  
  console.log('  Decrypted length:', decrypted.length)
  
  return decrypted
}

/**
 * Wrap CEK with ECDH shared secret
 * 
 * @param cek - Content encryption key to wrap
 * @param recipientPublicKey - Recipient's public key
 * @param senderPrivateKey - Sender's private key
 * @param nonce - Nonce for encryption
 * @returns Wrapped CEK
 */
async function wrapCEK(
  cek: Uint8Array,
  recipientPublicKey: Uint8Array,
  senderPrivateKey: Uint8Array,
  nonce: Uint8Array
): Promise<string> {
  const lib = await ensureSodium()
  // Compute ECDH shared secret using crypto_box_beforenm (same as unwrap)
  const sharedSecret = lib.crypto_box_beforenm(recipientPublicKey, senderPrivateKey)
  
  console.log('🔐 wrapCEK:')
  console.log('  Recipient public key (first 16):', Array.from(recipientPublicKey.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
  console.log('  Sender private key (first 16):', Array.from(senderPrivateKey.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
  console.log('  Shared secret (first 16):', Array.from(sharedSecret.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
  console.log('  CEK (first 16):', Array.from(cek.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
  console.log('  Nonce (first 16):', Array.from(nonce.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
  
  // Encrypt CEK with shared secret
  const wrappedCEK = lib.crypto_secretbox_easy(cek, nonce, sharedSecret)
  
  console.log('  Wrapped CEK (first 16):', Array.from(wrappedCEK.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
  
  return lib.to_base64(wrappedCEK)
}

/**
 * Unwrap CEK with ECDH shared secret
 * 
 * @param wrappedCEK - Wrapped content encryption key
 * @param senderPublicKey - Sender's public key
 * @param recipientPrivateKey - Recipient's private key
 * @param nonce - Nonce used for encryption
 * @returns Unwrapped CEK
 */
async function unwrapCEK(
  wrappedCEK: Uint8Array,
  senderPublicKey: Uint8Array,
  recipientPrivateKey: Uint8Array,
  nonce: Uint8Array
): Promise<Uint8Array> {
  const lib = await ensureSodium()
  // Compute ECDH shared secret
  const sharedSecret = lib.crypto_box_beforenm(senderPublicKey, recipientPrivateKey)
  
  console.log('🔓 unwrapCEK:')
  console.log('  Sender public key (first 16):', Array.from(senderPublicKey.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
  console.log('  Recipient private key (first 16):', Array.from(recipientPrivateKey.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
  console.log('  Shared secret (first 16):', Array.from(sharedSecret.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
  console.log('  Wrapped CEK (first 16):', Array.from(wrappedCEK.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
  console.log('  Nonce (first 16):', Array.from(nonce.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
  
  // Decrypt CEK
  const unwrapped = lib.crypto_secretbox_open_easy(wrappedCEK, nonce, sharedSecret)
  
  console.log('  Unwrapped CEK (first 16):', Array.from(unwrapped.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
  
  return unwrapped
}

/**
 * Base64 encode
 */
async function base64Encode(data: Uint8Array): Promise<string> {
  const lib = await ensureSodium()
  return lib.to_base64(data)
}

/**
 * Base64 decode
 */
async function base64Decode(data: string): Promise<Uint8Array> {
  const lib = await ensureSodium()
  return lib.from_base64(data)
}

/**
 * Create and encrypt a message
 * 
 * @param options - Message creation options
 * @returns Encrypted message bundle ready for upload
 */
export async function createEncryptedMessage(
  options: CreateMessageOptions
): Promise<EncryptedMessageBundle> {
  try {
    // Validate inputs
    if (!options.to || !options.from) {
      throw new ValidationError('Sender and recipient addresses required')
    }
    if (!options.body || options.body.trim().length === 0) {
      throw new ValidationError('Message body cannot be empty')
    }
    
    // 1. Generate random CEK and nonce
    const cek = await generateCEK()
    const nonce = await generateNonce()
    
    // 2. Encrypt body with CEK
    const encryptedBody = await encryptBody(options.body, cek, nonce)
    
    // 3. Get recipient's public key (use provided key or derive from address)
    const recipientPublicKey = options.recipientPublicKey 
      || await derivePublicKeyFromAddress(options.to)
    
    // 4. Wrap CEK with ECDH shared secret
    const wrappedCEK = await wrapCEK(cek, recipientPublicKey, options.senderPrivateKey, nonce)
    
    // 5. Compute body hash
    const bodyHash = await sha256(options.body)
    
    // 6. Generate message ID (will be updated with bodyCid later)
    const timestamp = Date.now()
    const msgId = await keccak256(`${options.from}${options.to}${timestamp}`)
    
    // 7. Create envelope (without signature and bodyCid for now)
    const envelopeWithoutSig: Omit<MessageEnvelope, 'signature' | 'bodyCid'> & { bodyCid: string } = {
      v: 1,
      msgId,
      from: options.from,
      to: options.to,
      timestamp,
      subject: options.subject || '',
      cek: wrappedCEK, // Already base64 encoded from wrapCEK
      nonce: await base64Encode(nonce),
      bodyCid: '', // Will be filled after IPFS upload
      bodyHash,
      format: 'markdown',
    }
    
    // Note: Signature will be added by the caller after getting bodyCid
    const envelope = {
      ...envelopeWithoutSig,
      signature: '', // Placeholder
    } as MessageEnvelope
    
    return {
      envelope,
      encryptedBody,
    }
  } catch (error) {
    if (error instanceof ValidationError || error instanceof EncryptionError) {
      throw error
    }
    throw new EncryptionError(`Failed to create encrypted message: ${error}`)
  }
}

/**
 * Decrypt a message
 * 
 * @param options - Decryption options
 * @returns Decrypted message
 */
export async function decryptMessage(
  options: DecryptMessageOptions
): Promise<DecryptedMessage> {
  try {
    const { envelope, encryptedBody, recipientPrivateKey, senderPublicKey: providedSenderPublicKey } = options
    
    // 1. Decode nonce and wrapped CEK
    const nonce = await base64Decode(envelope.nonce)
    const wrappedCEK = await base64Decode(envelope.cek)
    
    // 2. Get sender's public key (use provided or derive from address)
    const senderPublicKey = providedSenderPublicKey 
      || await derivePublicKeyFromAddress(envelope.from)
    
    // 3. Unwrap CEK
    const cek = await unwrapCEK(wrappedCEK, senderPublicKey, recipientPrivateKey, nonce)
    
    // 4. Decrypt body
    const plaintext = await decryptBody(encryptedBody, cek, nonce)
    
    // 5. Verify body hash
    const computedHash = await sha256(plaintext)
    if (computedHash !== envelope.bodyHash) {
      throw new DecryptionError('Body hash mismatch - message may be corrupted')
    }
    
    // 6. Return decrypted message
    return {
      msgId: envelope.msgId,
      from: envelope.from,
      to: envelope.to,
      timestamp: envelope.timestamp,
      subject: envelope.subject || '(no subject)',
      body: plaintext,
    }
  } catch (error) {
    if (error instanceof DecryptionError) {
      throw error
    }
    throw new DecryptionError(`Failed to decrypt message: ${error}`)
  }
}

/**
 * Helper: Get user's encryption keys from wallet
 * 
 * @param address - User's EVM address
 * @returns Key pair for encryption
 */
export async function getUserKeys(address: string): Promise<KeyPair> {
  // TODO: Implement wallet-based key derivation
  // This will be handled by the composable layer
  throw new EncryptionError('getUserKeys not yet implemented - use composable')
}
