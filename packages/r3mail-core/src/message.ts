/**
 * R3MAIL Message Module
 * 
 * Handles message encryption and decryption using ECDH + XChaCha20-Poly1305
 */

import * as sodium from 'libsodium-wrappers'
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
let sodiumReady: Promise<void> | null = null

async function ensureSodium() {
  if (!sodiumReady) {
    sodiumReady = sodium.ready
  }
  await sodiumReady
  return sodium
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
 * Compute SHA-256 hash
 */
async function sha256(data: Uint8Array | string): Promise<string> {
  const lib = await ensureSodium()
  const bytes = typeof data === 'string' 
    ? new TextEncoder().encode(data)
    : data
  const hash = lib.crypto_hash_sha256(bytes)
  return '0x' + Buffer.from(hash).toString('hex')
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
  const plaintextBytes = new TextEncoder().encode(plaintext)
  return lib.crypto_secretbox_easy(plaintextBytes, nonce, cek)
}

/**
 * Decrypt message body with CEK
 */
async function decryptBody(ciphertext: Uint8Array, cek: Uint8Array, nonce: Uint8Array): Promise<string> {
  const lib = await ensureSodium()
  const plaintextBytes = lib.crypto_secretbox_open_easy(ciphertext, nonce, cek)
  return new TextDecoder().decode(plaintextBytes)
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
  // Compute ECDH shared secret
  const sharedSecret = lib.crypto_scalarmult(senderPrivateKey, recipientPublicKey)
  
  // Encrypt CEK with shared secret
  const wrappedCEK = lib.crypto_secretbox_easy(cek, nonce, sharedSecret)
  
  return Buffer.from(wrappedCEK).toString('base64')
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
  
  // Decrypt CEK
  return lib.crypto_secretbox_open_easy(wrappedCEK, nonce, sharedSecret)
}

/**
 * Base64 encode
 */
function base64Encode(data: Uint8Array): string {
  return Buffer.from(data).toString('base64')
}

/**
 * Base64 decode
 */
function base64Decode(data: string): Uint8Array {
  return new Uint8Array(Buffer.from(data, 'base64'))
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
    
    // 3. Derive recipient's public key
    const recipientPublicKey = await derivePublicKeyFromAddress(options.to)
    
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
      nonce: base64Encode(nonce),
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
    const { envelope, encryptedBody, recipientPrivateKey } = options
    
    // 1. Decode nonce and wrapped CEK
    const nonce = base64Decode(envelope.nonce)
    const wrappedCEK = base64Decode(envelope.cek)
    
    // 2. Derive sender's public key
    const senderPublicKey = await derivePublicKeyFromAddress(envelope.from)
    
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
