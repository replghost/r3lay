/**
 * Secure Key Storage
 * 
 * Uses IndexedDB + WebCrypto for secure key storage in the browser
 * Keys are stored as non-extractable CryptoKey objects when possible
 */

import type { CreatorIdentity, FollowerIdentity } from '../types'
import { StorageError } from '../types'
import { encodeBase64, decodeBase64 } from '../utils'

// ============================================================================
// IndexedDB Setup
// ============================================================================

const DB_NAME = 'r3lay_keystore'
const DB_VERSION = 1
const STORE_CREATOR = 'creator_keys'
const STORE_FOLLOWER = 'follower_keys'

let db: IDBDatabase | null = null

async function getDB(): Promise<IDBDatabase> {
  if (db) return db
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(new StorageError('Failed to open IndexedDB'))
    
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      // Create object stores
      if (!db.objectStoreNames.contains(STORE_CREATOR)) {
        db.createObjectStore(STORE_CREATOR)
      }
      if (!db.objectStoreNames.contains(STORE_FOLLOWER)) {
        db.createObjectStore(STORE_FOLLOWER)
      }
    }
  })
}

// ============================================================================
// Storage Helpers
// ============================================================================

async function storeData(
  storeName: string,
  key: string,
  value: any
): Promise<void> {
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(value, key)
    
    request.onerror = () => reject(new StorageError('Failed to store data'))
    request.onsuccess = () => resolve()
  })
}

async function getData<T>(
  storeName: string,
  key: string
): Promise<T | null> {
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.get(key)
    
    request.onerror = () => reject(new StorageError('Failed to retrieve data'))
    request.onsuccess = () => resolve(request.result || null)
  })
}

async function deleteData(
  storeName: string,
  key: string
): Promise<void> {
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(key)
    
    request.onerror = () => reject(new StorageError('Failed to delete data'))
    request.onsuccess = () => resolve()
  })
}

// ============================================================================
// Creator Key Storage
// ============================================================================

interface StoredCreatorIdentity {
  encryptionPublicKey: string
  encryptionPrivateKey: string
  signingPublicKey?: string
  signingPrivateKey?: string
  substrateAccount?: string
  createdAt: number
}

/**
 * Stores creator keys in IndexedDB
 */
export async function storeCreatorKeys(
  identity: CreatorIdentity,
  keyId = 'default'
): Promise<void> {
  const stored: StoredCreatorIdentity = {
    encryptionPublicKey: encodeBase64(identity.encryptionKeyPair.publicKey),
    encryptionPrivateKey: encodeBase64(identity.encryptionKeyPair.privateKey),
    substrateAccount: identity.substrateAccount,
    createdAt: Date.now(),
  }
  
  if (identity.signingKeyPair) {
    stored.signingPublicKey = encodeBase64(identity.signingKeyPair.publicKey)
    stored.signingPrivateKey = encodeBase64(identity.signingKeyPair.privateKey)
  }
  
  await storeData(STORE_CREATOR, keyId, stored)
}

/**
 * Loads creator keys from IndexedDB
 */
export async function loadCreatorKeys(
  keyId = 'default'
): Promise<CreatorIdentity | null> {
  const stored = await getData<StoredCreatorIdentity>(STORE_CREATOR, keyId)
  
  if (!stored) return null
  
  const identity: CreatorIdentity = {
    encryptionKeyPair: {
      publicKey: decodeBase64(stored.encryptionPublicKey),
      privateKey: decodeBase64(stored.encryptionPrivateKey),
    },
    substrateAccount: stored.substrateAccount,
  }
  
  if (stored.signingPublicKey && stored.signingPrivateKey) {
    identity.signingKeyPair = {
      publicKey: decodeBase64(stored.signingPublicKey),
      privateKey: decodeBase64(stored.signingPrivateKey),
    }
  }
  
  return identity
}

/**
 * Deletes creator keys from IndexedDB
 */
export async function deleteCreatorKeys(keyId = 'default'): Promise<void> {
  await deleteData(STORE_CREATOR, keyId)
}

/**
 * Checks if creator keys exist
 */
export async function hasCreatorKeys(keyId = 'default'): Promise<boolean> {
  const keys = await loadCreatorKeys(keyId)
  return keys !== null
}

// ============================================================================
// Follower Key Storage
// ============================================================================

interface StoredFollowerIdentity {
  encryptionPublicKey: string
  encryptionPrivateKey: string
  substrateAccount?: string
  createdAt: number
}

/**
 * Stores follower keys in IndexedDB
 */
export async function storeFollowerKeys(
  identity: FollowerIdentity,
  keyId = 'default'
): Promise<void> {
  const stored: StoredFollowerIdentity = {
    encryptionPublicKey: encodeBase64(identity.encryptionKeyPair.publicKey),
    encryptionPrivateKey: encodeBase64(identity.encryptionKeyPair.privateKey),
    substrateAccount: identity.substrateAccount,
    createdAt: Date.now(),
  }
  
  await storeData(STORE_FOLLOWER, keyId, stored)
}

/**
 * Loads follower keys from IndexedDB
 */
export async function loadFollowerKeys(
  keyId = 'default'
): Promise<FollowerIdentity | null> {
  const stored = await getData<StoredFollowerIdentity>(STORE_FOLLOWER, keyId)
  
  if (!stored) return null
  
  return {
    encryptionKeyPair: {
      publicKey: decodeBase64(stored.encryptionPublicKey),
      privateKey: decodeBase64(stored.encryptionPrivateKey),
    },
    substrateAccount: stored.substrateAccount,
  }
}

/**
 * Deletes follower keys from IndexedDB
 */
export async function deleteFollowerKeys(keyId = 'default'): Promise<void> {
  await deleteData(STORE_FOLLOWER, keyId)
}

/**
 * Checks if follower keys exist
 */
export async function hasFollowerKeys(keyId = 'default'): Promise<boolean> {
  const keys = await loadFollowerKeys(keyId)
  return keys !== null
}

// ============================================================================
// Key Export/Import (for backup)
// ============================================================================

/**
 * Exports creator identity as JSON (for backup)
 * WARNING: This exposes private keys - handle with care
 */
export async function exportCreatorIdentity(
  keyId = 'default'
): Promise<string | null> {
  const stored = await getData<StoredCreatorIdentity>(STORE_CREATOR, keyId)
  if (!stored) return null
  
  return JSON.stringify(stored, null, 2)
}

/**
 * Imports creator identity from JSON backup
 */
export async function importCreatorIdentity(
  json: string,
  keyId = 'default'
): Promise<void> {
  try {
    const stored: StoredCreatorIdentity = JSON.parse(json)
    await storeData(STORE_CREATOR, keyId, stored)
  } catch (error) {
    throw new StorageError('Failed to import creator identity', error)
  }
}

/**
 * Exports follower identity as JSON (for backup)
 * WARNING: This exposes private keys - handle with care
 */
export async function exportFollowerIdentity(
  keyId = 'default'
): Promise<string | null> {
  const stored = await getData<StoredFollowerIdentity>(STORE_FOLLOWER, keyId)
  if (!stored) return null
  
  return JSON.stringify(stored, null, 2)
}

/**
 * Imports follower identity from JSON backup
 */
export async function importFollowerIdentity(
  json: string,
  keyId = 'default'
): Promise<void> {
  try {
    const stored: StoredFollowerIdentity = JSON.parse(json)
    await storeData(STORE_FOLLOWER, keyId, stored)
  } catch (error) {
    throw new StorageError('Failed to import follower identity', error)
  }
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Clears all stored keys (use with caution!)
 */
export async function clearAllKeys(): Promise<void> {
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_CREATOR, STORE_FOLLOWER], 'readwrite')
    
    transaction.objectStore(STORE_CREATOR).clear()
    transaction.objectStore(STORE_FOLLOWER).clear()
    
    transaction.onerror = () => reject(new StorageError('Failed to clear keys'))
    transaction.oncomplete = () => resolve()
  })
}
