/**
 * IPFS Client
 * 
 * Abstraction layer for IPFS content storage and retrieval
 */

import { create as createIPFSClient, type IPFSHTTPClient } from 'ipfs-http-client'
import type { Cid } from '../../r3lay-core/src/types'
import { StorageError } from '../../r3lay-core/src/types'
import { validateCid } from '../../r3lay-core/src/utils'

// ============================================================================
// Types
// ============================================================================

export interface IPFSConfig {
  /** IPFS HTTP API endpoint */
  apiUrl?: string
  
  /** IPFS gateway URL for retrieving content */
  gatewayUrl?: string
  
  /** Timeout for operations (ms) */
  timeout?: number
  
  /** Optional headers for API requests */
  headers?: Record<string, string>
}

export interface UploadResult {
  cid: Cid
  size: number
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<IPFSConfig> = {
  apiUrl: 'https://ipfs.infura.io:5001',
  gatewayUrl: 'https://ipfs.io',
  timeout: 30000,
  headers: {},
}

// ============================================================================
// IPFS Client Class
// ============================================================================

export class IPFSClient {
  private client: IPFSHTTPClient | null = null
  private config: Required<IPFSConfig>
  
  constructor(config: IPFSConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }
  
  /**
   * Initializes the IPFS client
   */
  private async getClient(): Promise<IPFSHTTPClient> {
    if (this.client) return this.client
    
    try {
      this.client = createIPFSClient({
        url: this.config.apiUrl,
        timeout: this.config.timeout,
        headers: this.config.headers,
      })
      return this.client
    } catch (error) {
      throw new StorageError('Failed to initialize IPFS client', error)
    }
  }
  
  /**
   * Uploads data to IPFS
   */
  async add(data: Uint8Array | Blob | string): Promise<UploadResult> {
    const client = await this.getClient()
    
    try {
      // Convert input to Uint8Array if needed
      let bytes: Uint8Array
      
      if (typeof data === 'string') {
        bytes = new TextEncoder().encode(data)
      } else if (data instanceof Blob) {
        const arrayBuffer = await data.arrayBuffer()
        bytes = new Uint8Array(arrayBuffer)
      } else {
        bytes = data
      }
      
      // Upload to IPFS
      const result = await client.add(bytes, {
        pin: true, // Pin by default
        timeout: this.config.timeout,
      })
      
      return {
        cid: result.cid.toString(),
        size: result.size,
      }
    } catch (error) {
      throw new StorageError('Failed to upload to IPFS', error)
    }
  }
  
  /**
   * Downloads data from IPFS
   */
  async get(cid: Cid): Promise<Uint8Array> {
    if (!validateCid(cid)) {
      throw new StorageError(`Invalid CID: ${cid}`)
    }
    
    try {
      // Use gateway for retrieval (more reliable than API)
      const url = `${this.config.gatewayUrl}/ipfs/${cid}`
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)
      
      const response = await fetch(url, {
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const arrayBuffer = await response.arrayBuffer()
      return new Uint8Array(arrayBuffer)
    } catch (error) {
      throw new StorageError(`Failed to download from IPFS: ${cid}`, error)
    }
  }
  
  /**
   * Downloads and parses JSON from IPFS
   */
  async getJSON<T>(cid: Cid): Promise<T> {
    const data = await this.get(cid)
    const text = new TextDecoder().decode(data)
    
    try {
      return JSON.parse(text) as T
    } catch (error) {
      throw new StorageError(`Failed to parse JSON from CID: ${cid}`, error)
    }
  }
  
  /**
   * Uploads JSON to IPFS
   */
  async addJSON(obj: unknown): Promise<UploadResult> {
    try {
      const json = JSON.stringify(obj)
      return await this.add(json)
    } catch (error) {
      throw new StorageError('Failed to upload JSON to IPFS', error)
    }
  }
  
  /**
   * Pins content to ensure it persists
   */
  async pin(cid: Cid): Promise<void> {
    if (!validateCid(cid)) {
      throw new StorageError(`Invalid CID: ${cid}`)
    }
    
    const client = await this.getClient()
    
    try {
      await client.pin.add(cid, {
        timeout: this.config.timeout,
      })
    } catch (error) {
      throw new StorageError(`Failed to pin CID: ${cid}`, error)
    }
  }
  
  /**
   * Unpins content
   */
  async unpin(cid: Cid): Promise<void> {
    if (!validateCid(cid)) {
      throw new StorageError(`Invalid CID: ${cid}`)
    }
    
    const client = await this.getClient()
    
    try {
      await client.pin.rm(cid, {
        timeout: this.config.timeout,
      })
    } catch (error) {
      throw new StorageError(`Failed to unpin CID: ${cid}`, error)
    }
  }
  
  /**
   * Checks if content is pinned
   */
  async isPinned(cid: Cid): Promise<boolean> {
    if (!validateCid(cid)) {
      return false
    }
    
    const client = await this.getClient()
    
    try {
      for await (const pin of client.pin.ls({ paths: [cid] })) {
        if (pin.cid.toString() === cid) {
          return true
        }
      }
      return false
    } catch {
      return false
    }
  }
  
  /**
   * Gets the size of content without downloading it
   */
  async stat(cid: Cid): Promise<{ size: number; type: string }> {
    if (!validateCid(cid)) {
      throw new StorageError(`Invalid CID: ${cid}`)
    }
    
    const client = await this.getClient()
    
    try {
      const stat = await client.files.stat(`/ipfs/${cid}`, {
        timeout: this.config.timeout,
      })
      
      return {
        size: stat.size,
        type: stat.type,
      }
    } catch (error) {
      throw new StorageError(`Failed to stat CID: ${cid}`, error)
    }
  }
  
  /**
   * Constructs a gateway URL for a CID
   */
  getGatewayUrl(cid: Cid): string {
    return `${this.config.gatewayUrl}/ipfs/${cid}`
  }
  
  /**
   * Updates the configuration
   */
  updateConfig(config: Partial<IPFSConfig>): void {
    this.config = { ...this.config, ...config }
    // Reset client to force reinitialization with new config
    this.client = null
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let defaultClient: IPFSClient | null = null

/**
 * Gets or creates the default IPFS client instance
 */
export function getIPFSClient(config?: IPFSConfig): IPFSClient {
  if (!defaultClient || config) {
    defaultClient = new IPFSClient(config)
  }
  return defaultClient
}

/**
 * Resets the default client (useful for testing)
 */
export function resetIPFSClient(): void {
  defaultClient = null
}
