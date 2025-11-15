/**
 * R3LAY Core Utilities
 */

import type { ChannelId, Cid } from '../types'

// ============================================================================
// CID Validation
// ============================================================================

/**
 * Validates an IPFS CID
 */
export function validateCid(cid: string): boolean {
  if (!cid || typeof cid !== 'string') {
    return false
  }
  
  // Basic CID validation (CIDv0 or CIDv1)
  // CIDv0: Qm... (46 chars, base58)
  // CIDv1: b... or z... (variable length, multibase)
  
  if (cid.startsWith('Qm') && cid.length === 46) {
    return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid)
  }
  
  if (cid.startsWith('b') || cid.startsWith('z')) {
    return cid.length > 10 // Basic length check for CIDv1
  }
  
  return false
}

/**
 * Checks if a CID is valid, throws if not
 */
export function assertValidCid(cid: string): asserts cid is Cid {
  if (!validateCid(cid)) {
    throw new Error(`Invalid CID: ${cid}`)
  }
}

// ============================================================================
// Channel ID Utilities
// ============================================================================

/**
 * Derives a channel ID from an EVM address
 * For now, just returns the address as bytes32
 */
export function deriveChannelIdFromAddress(address: string): ChannelId {
  // Remove 0x prefix if present
  const cleanAddress = address.toLowerCase().replace(/^0x/, '')
  
  // Pad to 32 bytes (64 hex chars)
  const padded = cleanAddress.padStart(64, '0')
  
  return `0x${padded}`
}

/**
 * Validates a channel ID (bytes32 hex string)
 */
export function validateChannelId(channelId: string): boolean {
  if (!channelId || typeof channelId !== 'string') {
    return false
  }
  
  // Must be 0x followed by 64 hex chars
  return /^0x[0-9a-fA-F]{64}$/.test(channelId)
}

/**
 * Checks if a channel ID is valid, throws if not
 */
export function assertValidChannelId(channelId: string): asserts channelId is ChannelId {
  if (!validateChannelId(channelId)) {
    throw new Error(`Invalid channel ID: ${channelId}`)
  }
}

// ============================================================================
// Timestamp Utilities
// ============================================================================

/**
 * Gets current timestamp in milliseconds
 */
export function now(): number {
  return Date.now()
}

/**
 * Converts a timestamp to ISO string
 */
export function timestampToISO(timestamp: number): string {
  return new Date(timestamp).toISOString()
}

/**
 * Converts ISO string to timestamp
 */
export function isoToTimestamp(iso: string): number {
  return new Date(iso).getTime()
}

// ============================================================================
// Encoding Utilities
// ============================================================================

/**
 * Encodes Uint8Array to base64
 */
export function encodeBase64(data: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    // Node.js
    return Buffer.from(data).toString('base64')
  } else {
    // Browser
    const binary = String.fromCharCode(...data)
    return btoa(binary)
  }
}

/**
 * Decodes base64 to Uint8Array
 */
export function decodeBase64(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    // Node.js
    return new Uint8Array(Buffer.from(base64, 'base64'))
  } else {
    // Browser
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }
}

/**
 * Encodes Uint8Array to hex string
 */
export function encodeHex(data: Uint8Array): string {
  return Array.from(data)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Decodes hex string to Uint8Array
 */
export function decodeHex(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, '')
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16)
  }
  return bytes
}

// ============================================================================
// Public Key Utilities
// ============================================================================

/**
 * Formats a public key for display (first 8 + last 8 chars)
 */
export function formatPublicKey(pubkey: string): string {
  if (pubkey.length <= 16) {
    return pubkey
  }
  return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`
}

/**
 * Compares two public keys for equality
 */
export function publicKeysEqual(a: string, b: string): boolean {
  return a === b
}

// ============================================================================
// Data Size Utilities
// ============================================================================

/**
 * Formats bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * Checks if data size is within limit
 */
export function checkSizeLimit(data: Uint8Array, limitBytes: number): boolean {
  return data.length <= limitBytes
}

// ============================================================================
// JSON Utilities
// ============================================================================

/**
 * Safely parses JSON, returns null on error
 */
export function safeJsonParse<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

/**
 * Safely stringifies JSON
 */
export function safeJsonStringify(obj: unknown): string | null {
  try {
    return JSON.stringify(obj)
  } catch {
    return null
  }
}
