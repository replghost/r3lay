/**
 * R3LAY Protocol Constants
 */

// ============================================================================
// Protocol Version
// ============================================================================

export const PROTOCOL_VERSION = 1

// ============================================================================
// Size Limits
// ============================================================================

/** Maximum post content size (100 KB) */
export const MAX_POST_SIZE = 100 * 1024

/** Maximum attachment size (100 KB) */
export const MAX_ATTACHMENT_SIZE = 100 * 1024

/** Maximum feed index size (100 KB) */
export const MAX_FEED_INDEX_SIZE = 100 * 1024

/** Maximum number of posts in a feed index */
export const MAX_POSTS_IN_INDEX = 1000

// ============================================================================
// Cryptography Constants
// ============================================================================

/** X25519 public key length in bytes */
export const X25519_PUBLIC_KEY_LENGTH = 32

/** X25519 private key length in bytes */
export const X25519_PRIVATE_KEY_LENGTH = 32

/** Ed25519 public key length in bytes */
export const ED25519_PUBLIC_KEY_LENGTH = 32

/** Ed25519 private key length in bytes */
export const ED25519_PRIVATE_KEY_LENGTH = 64

/** Symmetric key length in bytes (for AES-256 or XSalsa20) */
export const SYMMETRIC_KEY_LENGTH = 32

/** Nonce length in bytes */
export const NONCE_LENGTH = 24

// ============================================================================
// Chain Constants
// ============================================================================

/** Paseo Asset Hub chain ID */
export const PASEO_ASSET_HUB_CHAIN_ID = 1000 // TBD: Update with actual chain ID

/** Block confirmation count for finality */
export const CONFIRMATION_BLOCKS = 2

/** Polling interval for chain events (ms) */
export const CHAIN_POLL_INTERVAL = 30_000

// ============================================================================
// IPFS Constants
// ============================================================================

/** Default IPFS gateway URL */
export const DEFAULT_IPFS_GATEWAY = 'https://ipfs.io'

/** IPFS API endpoint */
export const DEFAULT_IPFS_API = 'https://ipfs.io/api/v0'

/** Timeout for IPFS operations (ms) */
export const IPFS_TIMEOUT = 30_000

// ============================================================================
// Storage Keys (IndexedDB)
// ============================================================================

export const STORAGE_KEYS = {
  CREATOR_PROFILE: 'creator_profile',
  FOLLOWER_PROFILE: 'follower_profile',
  FOLLOWERS: 'followers',
  CHANNELS: 'channels',
  POSTS: 'posts',
  SETTINGS: 'settings',
} as const

// ============================================================================
// Error Codes
// ============================================================================

export const ERROR_CODES = {
  // Crypto errors
  CRYPTO_KEY_GENERATION_FAILED: 'CRYPTO_KEY_GENERATION_FAILED',
  CRYPTO_ENCRYPTION_FAILED: 'CRYPTO_ENCRYPTION_FAILED',
  CRYPTO_DECRYPTION_FAILED: 'CRYPTO_DECRYPTION_FAILED',
  CRYPTO_INVALID_KEY: 'CRYPTO_INVALID_KEY',
  
  // Storage errors
  STORAGE_NOT_FOUND: 'STORAGE_NOT_FOUND',
  STORAGE_WRITE_FAILED: 'STORAGE_WRITE_FAILED',
  STORAGE_READ_FAILED: 'STORAGE_READ_FAILED',
  
  // Chain errors
  CHAIN_CONNECTION_FAILED: 'CHAIN_CONNECTION_FAILED',
  CHAIN_TRANSACTION_FAILED: 'CHAIN_TRANSACTION_FAILED',
  CHAIN_CONTRACT_ERROR: 'CHAIN_CONTRACT_ERROR',
  
  // IPFS errors
  IPFS_UPLOAD_FAILED: 'IPFS_UPLOAD_FAILED',
  IPFS_DOWNLOAD_FAILED: 'IPFS_DOWNLOAD_FAILED',
  IPFS_INVALID_CID: 'IPFS_INVALID_CID',
  
  // Validation errors
  VALIDATION_INVALID_CHANNEL_ID: 'VALIDATION_INVALID_CHANNEL_ID',
  VALIDATION_INVALID_CID: 'VALIDATION_INVALID_CID',
  VALIDATION_SIZE_EXCEEDED: 'VALIDATION_SIZE_EXCEEDED',
  
  // Authorization errors
  AUTH_NOT_AUTHORIZED: 'AUTH_NOT_AUTHORIZED',
  AUTH_MISSING_KEY: 'AUTH_MISSING_KEY',
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]
