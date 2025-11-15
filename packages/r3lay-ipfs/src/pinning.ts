/**
 * Pinning Provider Support
 * 
 * Integration with third-party pinning services (Pinata, Web3.Storage, etc.)
 */

import type { Cid } from '../../r3lay-core/src/types'
import { StorageError } from '../../r3lay-core/src/types'

// ============================================================================
// Pinata Integration
// ============================================================================

export interface PinataConfig {
  apiKey: string
  apiSecret: string
  jwt?: string
}

export class PinataClient {
  private config: PinataConfig
  private baseUrl = 'https://api.pinata.cloud'
  
  constructor(config: PinataConfig) {
    this.config = config
  }
  
  private getHeaders(): Record<string, string> {
    if (this.config.jwt) {
      return {
        'Authorization': `Bearer ${this.config.jwt}`,
        'Content-Type': 'application/json',
      }
    }
    
    return {
      'pinata_api_key': this.config.apiKey,
      'pinata_secret_api_key': this.config.apiSecret,
      'Content-Type': 'application/json',
    }
  }
  
  /**
   * Pins content by CID
   */
  async pinByCID(cid: Cid, name?: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/pinning/pinByHash`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          hashToPin: cid,
          pinataMetadata: name ? { name } : undefined,
        }),
      })
      
      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Pinata API error: ${error}`)
      }
    } catch (error) {
      throw new StorageError(`Failed to pin to Pinata: ${cid}`, error)
    }
  }
  
  /**
   * Unpins content
   */
  async unpin(cid: Cid): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/pinning/unpin/${cid}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      })
      
      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Pinata API error: ${error}`)
      }
    } catch (error) {
      throw new StorageError(`Failed to unpin from Pinata: ${cid}`, error)
    }
  }
  
  /**
   * Lists pinned content
   */
  async listPins(): Promise<Array<{ cid: Cid; name?: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/data/pinList?status=pinned`, {
        headers: this.getHeaders(),
      })
      
      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Pinata API error: ${error}`)
      }
      
      const data = await response.json()
      
      return data.rows.map((row: any) => ({
        cid: row.ipfs_pin_hash,
        name: row.metadata?.name,
      }))
    } catch (error) {
      throw new StorageError('Failed to list pins from Pinata', error)
    }
  }
  
  /**
   * Uploads data directly to Pinata
   */
  async upload(data: Uint8Array | Blob, name?: string): Promise<Cid> {
    try {
      const formData = new FormData()
      const blob = data instanceof Blob ? data : new Blob([data])
      formData.append('file', blob, name || 'file')
      
      if (name) {
        formData.append('pinataMetadata', JSON.stringify({ name }))
      }
      
      const headers = this.getHeaders()
      delete headers['Content-Type'] // Let browser set it for FormData
      
      const response = await fetch(`${this.baseUrl}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers,
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Pinata API error: ${error}`)
      }
      
      const result = await response.json()
      return result.IpfsHash
    } catch (error) {
      throw new StorageError('Failed to upload to Pinata', error)
    }
  }
}

// ============================================================================
// Web3.Storage Integration
// ============================================================================

export interface Web3StorageConfig {
  token: string
}

export class Web3StorageClient {
  private config: Web3StorageConfig
  private baseUrl = 'https://api.web3.storage'
  
  constructor(config: Web3StorageConfig) {
    this.config = config
  }
  
  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.token}`,
    }
  }
  
  /**
   * Uploads data to Web3.Storage
   */
  async upload(data: Uint8Array | Blob, name?: string): Promise<Cid> {
    try {
      const blob = data instanceof Blob ? data : new Blob([data])
      const file = new File([blob], name || 'file')
      
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Web3.Storage API error: ${error}`)
      }
      
      const result = await response.json()
      return result.cid
    } catch (error) {
      throw new StorageError('Failed to upload to Web3.Storage', error)
    }
  }
  
  /**
   * Lists uploads
   */
  async listUploads(): Promise<Array<{ cid: Cid; name?: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/user/uploads`, {
        headers: this.getHeaders(),
      })
      
      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Web3.Storage API error: ${error}`)
      }
      
      const data = await response.json()
      
      return data.map((item: any) => ({
        cid: item.cid,
        name: item.name,
      }))
    } catch (error) {
      throw new StorageError('Failed to list uploads from Web3.Storage', error)
    }
  }
}

// ============================================================================
// Generic Pinning Interface
// ============================================================================

export interface PinningProvider {
  pin(cid: Cid, name?: string): Promise<void>
  unpin(cid: Cid): Promise<void>
  upload(data: Uint8Array | Blob, name?: string): Promise<Cid>
}

/**
 * Creates a pinning provider based on configuration
 */
export function createPinningProvider(
  type: 'pinata' | 'web3storage',
  config: PinataConfig | Web3StorageConfig
): PinningProvider {
  if (type === 'pinata') {
    const client = new PinataClient(config as PinataConfig)
    return {
      pin: (cid, name) => client.pinByCID(cid, name),
      unpin: (cid) => client.unpin(cid),
      upload: (data, name) => client.upload(data, name),
    }
  } else {
    const client = new Web3StorageClient(config as Web3StorageConfig)
    return {
      pin: async () => {
        throw new Error('Web3.Storage does not support pinning by CID')
      },
      unpin: async () => {
        throw new Error('Web3.Storage does not support unpinning')
      },
      upload: (data, name) => client.upload(data, name),
    }
  }
}
