/**
 * R3MAIL Core Types
 * 
 * Type definitions for R3MAIL encrypted messaging
 */

/**
 * Message envelope containing metadata and encrypted key
 */
export interface MessageEnvelope {
  /** Protocol version */
  v: 1
  
  /** Unique message identifier (keccak256 hash) */
  msgId: string
  
  /** Sender's EVM address (0x...) */
  from: string
  
  /** Recipient's EVM address (0x...) */
  to: string
  
  /** Unix timestamp (milliseconds) */
  timestamp: number
  
  /** Optional subject line (plaintext) */
  subject?: string
  
  /** Content Encryption Key (CEK) encrypted with ECDH shared secret (base64) */
  cek: string
  
  /** XChaCha20 nonce (base64) */
  nonce: string
  
  /** IPFS CID of encrypted body */
  bodyCid: string
  
  /** SHA-256 hash of plaintext body (0x...) */
  bodyHash: string
  
  /** Body format */
  format: 'markdown'
  
  /** EIP-191 signature of canonical envelope JSON (0x...) */
  signature: string
}

/**
 * Encrypted message bundle ready for upload
 */
export interface EncryptedMessageBundle {
  /** Message envelope (to be uploaded to IPFS) */
  envelope: MessageEnvelope
  
  /** Encrypted body bytes (to be uploaded to IPFS) */
  encryptedBody: Uint8Array
}

/**
 * Decrypted message
 */
export interface DecryptedMessage {
  /** Message ID */
  msgId: string
  
  /** Sender address */
  from: string
  
  /** Recipient address */
  to: string
  
  /** Timestamp */
  timestamp: number
  
  /** Subject */
  subject: string
  
  /** Decrypted markdown body */
  body: string
  
  /** Envelope CID */
  envelopeCid?: string
}

/**
 * Key pair for encryption
 */
export interface KeyPair {
  publicKey: Uint8Array
  privateKey: Uint8Array
}

/**
 * Message creation options
 */
export interface CreateMessageOptions {
  /** Recipient's EVM address */
  to: string
  
  /** Subject line */
  subject: string
  
  /** Message body (markdown) */
  body: string
  
  /** Sender's EVM address */
  from: string
  
  /** Sender's private key */
  senderPrivateKey: Uint8Array
  
  /** Recipient's public key (optional - if not provided, will try to derive from address) */
  recipientPublicKey?: Uint8Array
}

/**
 * Message decryption options
 */
export interface DecryptMessageOptions {
  /** Message envelope */
  envelope: MessageEnvelope
  
  /** Encrypted body bytes */
  encryptedBody: Uint8Array
  
  /** Recipient's private key */
  recipientPrivateKey: Uint8Array
}

/**
 * Errors
 */
export class R3mailError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'R3mailError'
  }
}

export class EncryptionError extends R3mailError {
  constructor(message: string) {
    super(message)
    this.name = 'EncryptionError'
  }
}

export class DecryptionError extends R3mailError {
  constructor(message: string) {
    super(message)
    this.name = 'DecryptionError'
  }
}

export class SignatureError extends R3mailError {
  constructor(message: string) {
    super(message)
    this.name = 'SignatureError'
  }
}

export class ValidationError extends R3mailError {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
