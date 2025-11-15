/**
 * R3LAY Chain Client
 * 
 * Wrapper for interacting with the R3LAYChannelRegistry contract
 */

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type PublicClient,
  type WalletClient,
  type Address,
  type Hash,
  type Hex,
} from 'viem'
import type { Channel, ChannelId, Cid } from '@r3lay/core'
import { ChainError } from '@r3lay/core'
import { R3LAYChannelRegistryABI } from './abi'

// ============================================================================
// Types
// ============================================================================

export interface ChainConfig {
  /** RPC URL for the chain */
  rpcUrl: string
  
  /** Chain ID */
  chainId: number
  
  /** Contract address */
  contractAddress: Address
  
  /** Optional: Custom chain configuration */
  chain?: any
}

export interface TransactionResult {
  hash: Hash
  blockNumber?: bigint
}

// ============================================================================
// R3LAY Chain Client
// ============================================================================

export class R3LAYChainClient {
  private config: ChainConfig
  private publicClient: PublicClient
  private walletClient: WalletClient | null = null
  
  constructor(config: ChainConfig) {
    this.config = config
    
    // Create public client for read operations
    this.publicClient = createPublicClient({
      transport: http(config.rpcUrl),
      chain: config.chain,
    })
  }
  
  /**
   * Connects a wallet for write operations
   */
  async connectWallet(): Promise<Address> {
    try {
      // Check if window.ethereum exists (MetaMask, etc.)
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new ChainError('No wallet provider found')
      }
      
      // Create wallet client
      this.walletClient = createWalletClient({
        transport: custom(window.ethereum),
        chain: this.config.chain,
      })
      
      // Request accounts
      const [address] = await this.walletClient.requestAddresses()
      
      if (!address) {
        throw new ChainError('No account selected')
      }
      
      return address
    } catch (error) {
      throw new ChainError('Failed to connect wallet', error)
    }
  }
  
  /**
   * Gets the connected wallet address
   */
  async getAddress(): Promise<Address | null> {
    if (!this.walletClient) return null
    
    try {
      const [address] = await this.walletClient.getAddresses()
      return address || null
    } catch {
      return null
    }
  }
  
  // ============================================================================
  // Read Operations
  // ============================================================================
  
  /**
   * Gets channel data
   */
  async getChannel(channelId: ChannelId): Promise<Channel> {
    try {
      const result = await this.publicClient.readContract({
        address: this.config.contractAddress,
        abi: R3LAYChannelRegistryABI,
        functionName: 'getChannel',
        args: [channelId as Hex],
      })
      
      return {
        channelId,
        creator: result[0],
        currentIndexCid: result[1],
        meta: result[2],
        createdAt: Number(result[3]),
        updatedAt: Number(result[4]),
      }
    } catch (error) {
      throw new ChainError(`Failed to get channel: ${channelId}`, error)
    }
  }
  
  /**
   * Checks if a channel exists
   */
  async channelExists(channelId: ChannelId): Promise<boolean> {
    try {
      return await this.publicClient.readContract({
        address: this.config.contractAddress,
        abi: R3LAYChannelRegistryABI,
        functionName: 'exists',
        args: [channelId as Hex],
      })
    } catch (error) {
      throw new ChainError(`Failed to check channel existence: ${channelId}`, error)
    }
  }
  
  /**
   * Gets the current index CID for a channel
   */
  async getCurrentIndexCid(channelId: ChannelId): Promise<Cid> {
    try {
      return await this.publicClient.readContract({
        address: this.config.contractAddress,
        abi: R3LAYChannelRegistryABI,
        functionName: 'getCurrentIndexCid',
        args: [channelId as Hex],
      })
    } catch (error) {
      throw new ChainError(`Failed to get index CID: ${channelId}`, error)
    }
  }
  
  /**
   * Gets the creator of a channel
   */
  async getCreator(channelId: ChannelId): Promise<Address> {
    try {
      return await this.publicClient.readContract({
        address: this.config.contractAddress,
        abi: R3LAYChannelRegistryABI,
        functionName: 'getCreator',
        args: [channelId as Hex],
      })
    } catch (error) {
      throw new ChainError(`Failed to get creator: ${channelId}`, error)
    }
  }
  
  // ============================================================================
  // Write Operations
  // ============================================================================
  
  private ensureWallet(): WalletClient {
    if (!this.walletClient) {
      throw new ChainError('Wallet not connected. Call connectWallet() first.')
    }
    return this.walletClient
  }
  
  /**
   * Creates a new channel
   */
  async createChannel(
    channelId: ChannelId,
    indexCid: Cid,
    meta: string
  ): Promise<TransactionResult> {
    const wallet = this.ensureWallet()
    
    try {
      const [account] = await wallet.getAddresses()
      
      const hash = await wallet.writeContract({
        address: this.config.contractAddress,
        abi: R3LAYChannelRegistryABI,
        functionName: 'createChannel',
        args: [channelId as Hex, indexCid, meta],
        account,
      })
      
      // Wait for transaction receipt
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      
      return {
        hash,
        blockNumber: receipt.blockNumber,
      }
    } catch (error) {
      throw new ChainError('Failed to create channel', error)
    }
  }
  
  /**
   * Updates a channel's feed index
   */
  async updateChannel(
    channelId: ChannelId,
    newIndexCid: Cid
  ): Promise<TransactionResult> {
    const wallet = this.ensureWallet()
    
    try {
      const [account] = await wallet.getAddresses()
      
      const hash = await wallet.writeContract({
        address: this.config.contractAddress,
        abi: R3LAYChannelRegistryABI,
        functionName: 'updateChannel',
        args: [channelId as Hex, newIndexCid],
        account,
      })
      
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      
      return {
        hash,
        blockNumber: receipt.blockNumber,
      }
    } catch (error) {
      throw new ChainError('Failed to update channel', error)
    }
  }
  
  /**
   * Updates a channel's metadata
   */
  async setMeta(
    channelId: ChannelId,
    newMeta: string
  ): Promise<TransactionResult> {
    const wallet = this.ensureWallet()
    
    try {
      const [account] = await wallet.getAddresses()
      
      const hash = await wallet.writeContract({
        address: this.config.contractAddress,
        abi: R3LAYChannelRegistryABI,
        functionName: 'setMeta',
        args: [channelId as Hex, newMeta],
        account,
      })
      
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      
      return {
        hash,
        blockNumber: receipt.blockNumber,
      }
    } catch (error) {
      throw new ChainError('Failed to set metadata', error)
    }
  }
  
  /**
   * Publishes a post (emits event)
   */
  async publishPost(
    channelId: ChannelId,
    postCid: Cid
  ): Promise<TransactionResult> {
    const wallet = this.ensureWallet()
    
    try {
      const [account] = await wallet.getAddresses()
      
      const hash = await wallet.writeContract({
        address: this.config.contractAddress,
        abi: R3LAYChannelRegistryABI,
        functionName: 'publishPost',
        args: [channelId as Hex, postCid],
        account,
      })
      
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      
      return {
        hash,
        blockNumber: receipt.blockNumber,
      }
    } catch (error) {
      throw new ChainError('Failed to publish post', error)
    }
  }
  
  // ============================================================================
  // Utility Methods
  // ============================================================================
  
  /**
   * Gets the current block number
   */
  async getBlockNumber(): Promise<bigint> {
    try {
      return await this.publicClient.getBlockNumber()
    } catch (error) {
      throw new ChainError('Failed to get block number', error)
    }
  }
  
  /**
   * Gets transaction receipt
   */
  async getTransactionReceipt(hash: Hash) {
    try {
      return await this.publicClient.getTransactionReceipt({ hash })
    } catch (error) {
      throw new ChainError(`Failed to get transaction receipt: ${hash}`, error)
    }
  }
  
  /**
   * Estimates gas for creating a channel
   */
  async estimateCreateChannelGas(
    channelId: ChannelId,
    indexCid: Cid,
    meta: string
  ): Promise<bigint> {
    const wallet = this.ensureWallet()
    
    try {
      const [account] = await wallet.getAddresses()
      
      return await this.publicClient.estimateContractGas({
        address: this.config.contractAddress,
        abi: R3LAYChannelRegistryABI,
        functionName: 'createChannel',
        args: [channelId as Hex, indexCid, meta],
        account,
      })
    } catch (error) {
      throw new ChainError('Failed to estimate gas', error)
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let defaultClient: R3LAYChainClient | null = null

/**
 * Gets or creates the default chain client
 */
export function getChainClient(config?: ChainConfig): R3LAYChainClient {
  if (!defaultClient || config) {
    if (!config) {
      throw new ChainError('Chain config required for first initialization')
    }
    defaultClient = new R3LAYChainClient(config)
  }
  return defaultClient
}

/**
 * Resets the default client (useful for testing)
 */
export function resetChainClient(): void {
  defaultClient = null
}
