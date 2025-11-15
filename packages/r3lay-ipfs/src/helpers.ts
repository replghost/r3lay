/**
 * R3LAY-specific IPFS Helpers
 * 
 * High-level functions for uploading and downloading R3LAY content
 */

import type { Cid, FeedIndex, PostMetadata, EncryptedPostBundle } from '../../r3lay-core/src/types'
import { StorageError } from '../../r3lay-core/src/types'
import { MAX_POST_SIZE, MAX_FEED_INDEX_SIZE } from '../../r3lay-core/src/constants'
import { getIPFSClient, type IPFSClient } from './client'

// ============================================================================
// Feed Index Operations
// ============================================================================

/**
 * Uploads a feed index to IPFS
 */
export async function uploadFeedIndex(
  feedIndex: FeedIndex,
  client?: IPFSClient
): Promise<Cid> {
  const ipfs = client || getIPFSClient()
  
  try {
    // Validate size
    const json = JSON.stringify(feedIndex)
    const size = new TextEncoder().encode(json).length
    
    if (size > MAX_FEED_INDEX_SIZE) {
      throw new StorageError(
        `Feed index too large: ${size} bytes (max: ${MAX_FEED_INDEX_SIZE})`
      )
    }
    
    const result = await ipfs.addJSON(feedIndex)
    return result.cid
  } catch (error) {
    throw new StorageError('Failed to upload feed index', error)
  }
}

/**
 * Downloads a feed index from IPFS
 */
export async function downloadFeedIndex(
  cid: Cid,
  client?: IPFSClient
): Promise<FeedIndex> {
  const ipfs = client || getIPFSClient()
  
  try {
    return await ipfs.getJSON<FeedIndex>(cid)
  } catch (error) {
    throw new StorageError(`Failed to download feed index: ${cid}`, error)
  }
}

// ============================================================================
// Post Operations
// ============================================================================

/**
 * Uploads an encrypted post bundle to IPFS
 * Returns the CID of the uploaded bundle
 */
export async function uploadEncryptedPost(
  bundle: {
    metadata: PostMetadata
    encryptedContent: Uint8Array
    encryptedAttachments?: Map<string, Uint8Array>
  },
  client?: IPFSClient
): Promise<Cid> {
  const ipfs = client || getIPFSClient()
  
  try {
    // Create a directory structure for the post
    const files: Array<{ path: string; content: Uint8Array | string }> = []
    
    // Add metadata as JSON
    files.push({
      path: 'metadata.json',
      content: JSON.stringify(bundle.metadata),
    })
    
    // Add encrypted content
    files.push({
      path: 'content.bin',
      content: bundle.encryptedContent,
    })
    
    // Add encrypted attachments if present
    if (bundle.encryptedAttachments) {
      for (const [filename, data] of bundle.encryptedAttachments.entries()) {
        files.push({
          path: `attachments/${filename}`,
          content: data,
        })
      }
    }
    
    // Calculate total size
    const totalSize = files.reduce((sum, file) => {
      const size = typeof file.content === 'string'
        ? new TextEncoder().encode(file.content).length
        : file.content.length
      return sum + size
    }, 0)
    
    if (totalSize > MAX_POST_SIZE) {
      throw new StorageError(
        `Post bundle too large: ${totalSize} bytes (max: ${MAX_POST_SIZE})`
      )
    }
    
    // Upload as a directory (returns root CID)
    // For now, we'll upload metadata separately and return its CID
    // In a full implementation, use ipfs.addAll() for directory upload
    const result = await ipfs.addJSON({
      metadata: bundle.metadata,
      content: Array.from(bundle.encryptedContent),
      attachments: bundle.encryptedAttachments
        ? Object.fromEntries(
            Array.from(bundle.encryptedAttachments.entries()).map(([k, v]) => [
              k,
              Array.from(v),
            ])
          )
        : undefined,
    })
    
    return result.cid
  } catch (error) {
    throw new StorageError('Failed to upload encrypted post', error)
  }
}

/**
 * Downloads an encrypted post bundle from IPFS
 */
export async function downloadEncryptedPost(
  cid: Cid,
  client?: IPFSClient
): Promise<{
  metadata: PostMetadata
  encryptedContent: Uint8Array
  encryptedAttachments?: Map<string, Uint8Array>
}> {
  const ipfs = client || getIPFSClient()
  
  try {
    const data = await ipfs.getJSON<{
      metadata: PostMetadata
      content: number[]
      attachments?: Record<string, number[]>
    }>(cid)
    
    const bundle = {
      metadata: data.metadata,
      encryptedContent: new Uint8Array(data.content),
      encryptedAttachments: data.attachments
        ? new Map(
            Object.entries(data.attachments).map(([k, v]) => [k, new Uint8Array(v)])
          )
        : undefined,
    }
    
    return bundle
  } catch (error) {
    throw new StorageError(`Failed to download encrypted post: ${cid}`, error)
  }
}

/**
 * Downloads only post metadata (without content)
 */
export async function downloadPostMetadata(
  cid: Cid,
  client?: IPFSClient
): Promise<PostMetadata> {
  const ipfs = client || getIPFSClient()
  
  try {
    const data = await ipfs.getJSON<{ metadata: PostMetadata }>(cid)
    return data.metadata
  } catch (error) {
    throw new StorageError(`Failed to download post metadata: ${cid}`, error)
  }
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Downloads multiple posts in parallel
 */
export async function downloadMultiplePosts(
  cids: Cid[],
  client?: IPFSClient,
  concurrency = 5
): Promise<Map<Cid, {
  metadata: PostMetadata
  encryptedContent: Uint8Array
  encryptedAttachments?: Map<string, Uint8Array>
}>> {
  const results = new Map()
  
  // Process in batches to avoid overwhelming the gateway
  for (let i = 0; i < cids.length; i += concurrency) {
    const batch = cids.slice(i, i + concurrency)
    const promises = batch.map(async (cid) => {
      try {
        const post = await downloadEncryptedPost(cid, client)
        return { cid, post }
      } catch (error) {
        console.error(`Failed to download post ${cid}:`, error)
        return { cid, post: null }
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

/**
 * Downloads only metadata for multiple posts (faster than full download)
 */
export async function downloadMultipleMetadata(
  cids: Cid[],
  client?: IPFSClient,
  concurrency = 10
): Promise<Map<Cid, PostMetadata>> {
  const results = new Map()
  
  for (let i = 0; i < cids.length; i += concurrency) {
    const batch = cids.slice(i, i + concurrency)
    const promises = batch.map(async (cid) => {
      try {
        const metadata = await downloadPostMetadata(cid, client)
        return { cid, metadata }
      } catch (error) {
        console.error(`Failed to download metadata ${cid}:`, error)
        return { cid, metadata: null }
      }
    })
    
    const batchResults = await Promise.all(promises)
    
    for (const { cid, metadata } of batchResults) {
      if (metadata) {
        results.set(cid, metadata)
      }
    }
  }
  
  return results
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Checks if content exists on IPFS (by attempting to fetch metadata)
 */
export async function contentExists(
  cid: Cid,
  client?: IPFSClient
): Promise<boolean> {
  const ipfs = client || getIPFSClient()
  
  try {
    await ipfs.stat(cid)
    return true
  } catch {
    return false
  }
}

/**
 * Gets the size of content without downloading it
 */
export async function getContentSize(
  cid: Cid,
  client?: IPFSClient
): Promise<number> {
  const ipfs = client || getIPFSClient()
  
  try {
    const stat = await ipfs.stat(cid)
    return stat.size
  } catch (error) {
    throw new StorageError(`Failed to get content size: ${cid}`, error)
  }
}
