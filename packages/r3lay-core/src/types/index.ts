/**
 * R3LAY Core Types
 * 
 * Type definitions for the R3LAY protocol
 */

// ============================================================================
// Basic Types
// ============================================================================

/** Content Identifier (IPFS CID) */
export type Cid = string

/** Channel identifier (bytes32 on-chain) */
export type ChannelId = string

/** Substrate AccountId32 (32 bytes, SS58-encoded for display) */
export type SubstrateAccount = string

/** X25519 public key (base64 encoded) */
export type PublicKey = string

/** Epoch number for AEK rotation */
export type Epoch = number

/** Unix timestamp in milliseconds */
export type Timestamp = number

// ============================================================================
// Channel Types
// ============================================================================

/** On-chain channel data */
export interface Channel {
  channelId: ChannelId
  creator: string // EVM address
  currentIndexCid: Cid
  meta: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** Channel metadata (stored in meta field or off-chain) */
export interface ChannelMetadata {
  name: string
  description?: string
  avatar?: Cid
  creatorPubkey: PublicKey
}

// ============================================================================
// Post Types
// ============================================================================

/** Post metadata (inside encrypted bundle) */
export interface PostMetadata {
  version: 1
  author: PublicKey
  timestamp: Timestamp
  title: string
  summary?: string
  encrypted_keys: Record<PublicKey, string> // follower_pubkey -> encrypted K_msg
  payloadCid?: Cid
  attachments?: AttachmentMetadata[]
}

/** Attachment metadata */
export interface AttachmentMetadata {
  filename: string
  mimeType: string
  size: number
  cid?: Cid
}

/** Post bundle structure (before encryption) */
export interface PostBundle {
  metadata: PostMetadata
  content: string // Markdown content
  attachments?: Map<string, Uint8Array>
}

/** Encrypted post bundle */
export interface EncryptedPostBundle {
  metadata: PostMetadata // Not encrypted, contains encrypted_keys
  encryptedContent: Uint8Array
  encryptedAttachments?: Map<string, Uint8Array>
}

// ============================================================================
// Feed Types
// ============================================================================

/** Feed index structure */
export interface FeedIndex {
  version: 1
  creator: PublicKey
  channelId: ChannelId
  posts: Cid[] // Ordered list of post CIDs (newest first)
  updatedAt: Timestamp
}

// ============================================================================
// Cryptography Types
// ============================================================================

/** X25519 keypair */
export interface X25519KeyPair {
  publicKey: Uint8Array
  privateKey: Uint8Array
}

/** Ed25519 keypair (for signing) */
export interface Ed25519KeyPair {
  publicKey: Uint8Array
  privateKey: Uint8Array
}

/** Creator identity (both signing and encryption keys) */
export interface CreatorIdentity {
  encryptionKeyPair: X25519KeyPair
  signingKeyPair?: Ed25519KeyPair
  substrateAccount?: SubstrateAccount
}

/** Follower identity */
export interface FollowerIdentity {
  encryptionKeyPair: X25519KeyPair
  substrateAccount?: SubstrateAccount
}

/** Encrypted symmetric key for a follower */
export interface EncryptedKey {
  followerPubkey: PublicKey
  encryptedKey: string // base64
  nonce?: string // base64, if needed
}

// ============================================================================
// Storage Types
// ============================================================================

/** Local storage schema for creator */
export interface CreatorProfile {
  identity: CreatorIdentity
  channels: ChannelId[]
  followers: FollowerRecord[]
  createdAt: Timestamp
}

/** Follower record (creator's local storage) */
export interface FollowerRecord {
  publicKey: PublicKey
  label?: string
  addedAt: Timestamp
  removedAt?: Timestamp
}

/** Local storage schema for follower */
export interface FollowerProfile {
  identity: FollowerIdentity
  followedChannels: FollowedChannel[]
  createdAt: Timestamp
}

/** Followed channel record */
export interface FollowedChannel {
  channelId: ChannelId
  creatorPubkey: PublicKey
  label?: string
  followedAt: Timestamp
  lastSyncedCid?: Cid
  lastSyncedAt?: Timestamp
}

/** Cached decrypted post */
export interface CachedPost {
  cid: Cid
  channelId: ChannelId
  metadata: PostMetadata
  content: string
  attachments?: Map<string, Uint8Array>
  decryptedAt: Timestamp
}

// ============================================================================
// Event Types (from smart contract)
// ============================================================================

/** ChannelCreated event */
export interface ChannelCreatedEvent {
  channelId: ChannelId
  creator: string
  indexCid: Cid
  meta: string
  blockNumber: number
  transactionHash: string
}

/** ChannelUpdated event */
export interface ChannelUpdatedEvent {
  channelId: ChannelId
  newIndexCid: Cid
  blockNumber: number
  transactionHash: string
}

/** PostPublished event (optional) */
export interface PostPublishedEvent {
  channelId: ChannelId
  postCid: Cid
  blockNumber: number
  transactionHash: string
}

// ============================================================================
// Error Types
// ============================================================================

export class R3layError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'R3layError'
  }
}

export class CryptoError extends R3layError {
  constructor(message: string, details?: unknown) {
    super(message, 'CRYPTO_ERROR', details)
    this.name = 'CryptoError'
  }
}

export class StorageError extends R3layError {
  constructor(message: string, details?: unknown) {
    super(message, 'STORAGE_ERROR', details)
    this.name = 'StorageError'
  }
}

export class ChainError extends R3layError {
  constructor(message: string, details?: unknown) {
    super(message, 'CHAIN_ERROR', details)
    this.name = 'ChainError'
  }
}

export class DecryptionError extends CryptoError {
  constructor(message: string, details?: unknown) {
    super(message, details)
    this.name = 'DecryptionError'
  }
}
