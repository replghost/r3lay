/**
 * R3MAIL Chain Client
 * 
 * Handles contract interaction and event subscription
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
  type Log,
} from 'viem'
import { R3MAIL_CONTRACT_ADDRESS, PASEO_ASSET_HUB_RPC, NETWORK_CONFIG } from './config'
import { mailboxAbi } from './abi'

/**
 * Message notification event from contract
 */
export interface MessageNotifiedEvent {
  msgId: Hash
  from: Address
  to: Address
  envelopeCid: string
  timestamp: bigint
  blockNumber: bigint
  transactionHash: Hash
}

/**
 * Options for watching inbox
 */
export interface WatchInboxOptions {
  /** Recipient address to watch */
  address: Address
  
  /** Callback when new message arrives */
  onMessage: (event: MessageNotifiedEvent) => void | Promise<void>
  
  /** Callback for errors */
  onError?: (error: Error) => void
  
  /** Poll interval in milliseconds (default: 4000) */
  pollInterval?: number
}

/**
 * R3MAIL Chain Client
 * Handles all blockchain interactions
 */
export class R3mailChainClient {
  private publicClient: PublicClient
  private walletClient?: WalletClient
  
  constructor(rpcUrl: string = PASEO_ASSET_HUB_RPC) {
    // Create public client for reading
    this.publicClient = createPublicClient({
      chain: NETWORK_CONFIG,
      transport: http(rpcUrl),
    })
  }
  
  /**
   * Connect wallet client
   * Call this after user connects their wallet
   */
  async connectWallet() {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No wallet found')
    }
    
    this.walletClient = createWalletClient({
      chain: NETWORK_CONFIG,
      transport: custom(window.ethereum),
    })
    
    return this.walletClient
  }
  
  /**
   * Get connected wallet address
   */
  async getWalletAddress(): Promise<Address | undefined> {
    if (!this.walletClient) {
      return undefined
    }
    
    const [address] = await this.walletClient.getAddresses()
    return address
  }
  
  /**
   * Notify the chain that a message has been sent
   * 
   * @param msgId - Message ID (keccak256 hash)
   * @param to - Recipient address
   * @param envelopeCid - IPFS CID of envelope
   * @returns Transaction hash
   */
  async notifyMessage(
    msgId: Hash,
    to: Address,
    envelopeCid: string
  ): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }
    
    const [from] = await this.walletClient.getAddresses()
    
    // Send transaction
    const hash = await this.walletClient.writeContract({
      address: R3MAIL_CONTRACT_ADDRESS,
      abi: mailboxAbi,
      functionName: 'notifyMessage',
      args: [msgId, to, envelopeCid],
      account: from,
    })
    
    // Wait for confirmation
    await this.publicClient.waitForTransactionReceipt({ hash })
    
    return hash
  }
  
  /**
   * Get inbox count for an address
   * 
   * @param address - User address
   * @returns Number of messages received
   */
  async getInboxCount(address: Address): Promise<number> {
    const count = await this.publicClient.readContract({
      address: R3MAIL_CONTRACT_ADDRESS,
      abi: mailboxAbi,
      functionName: 'getInboxCount',
      args: [address],
    })
    
    return Number(count)
  }
  
  /**
   * Check if a message ID exists
   * 
   * @param msgId - Message ID
   * @returns True if message has been notified
   */
  async hasMessage(msgId: Hash): Promise<boolean> {
    return await this.publicClient.readContract({
      address: R3MAIL_CONTRACT_ADDRESS,
      abi: mailboxAbi,
      functionName: 'hasMessage',
      args: [msgId],
    })
  }
  
  /**
   * Register your public key on-chain
   * 
   * @param publicKey - Your X25519 public key (32 bytes)
   * @returns Transaction hash
   */
  async registerPublicKey(publicKey: Uint8Array): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }
    
    if (publicKey.length !== 32) {
      throw new Error('Public key must be 32 bytes')
    }
    
    const [from] = await this.walletClient.getAddresses()
    
    // Convert Uint8Array to bytes32
    const publicKeyHex = `0x${Array.from(publicKey).map(b => b.toString(16).padStart(2, '0')).join('')}` as Hash
    
    // Send transaction
    const hash = await this.walletClient.writeContract({
      address: R3MAIL_CONTRACT_ADDRESS,
      abi: mailboxAbi,
      functionName: 'registerPublicKey',
      args: [publicKeyHex],
      account: from,
    })
    
    // Wait for confirmation
    await this.publicClient.waitForTransactionReceipt({ hash })
    
    return hash
  }
  
  /**
   * Get a user's registered public key
   * 
   * @param address - User address
   * @returns Public key as Uint8Array, or null if not registered
   */
  async getPublicKey(address: Address): Promise<Uint8Array | null> {
    try {
      const publicKeyHex = await this.publicClient.readContract({
        address: R3MAIL_CONTRACT_ADDRESS,
        abi: mailboxAbi,
        functionName: 'getPublicKey',
        args: [address],
      }) as Hash
      
      // Convert bytes32 to Uint8Array
      const hex = publicKeyHex.slice(2) // Remove 0x
      const bytes = new Uint8Array(32)
      for (let i = 0; i < 32; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
      }
      
      return bytes
    } catch (error: any) {
      // If PublicKeyNotRegistered error, return null
      if (error.message?.includes('PublicKeyNotRegistered')) {
        return null
      }
      throw error
    }
  }
  
  /**
   * Check if a user has registered a public key
   * 
   * @param address - User address
   * @returns True if user has registered a key
   */
  async hasPublicKey(address: Address): Promise<boolean> {
    return await this.publicClient.readContract({
      address: R3MAIL_CONTRACT_ADDRESS,
      abi: mailboxAbi,
      functionName: 'hasPublicKey',
      args: [address],
    })
  }
  
  /**
   * Get historical messages for an address
   * 
   * @param address - Recipient address
   * @param fromBlock - Start block (default: 0)
   * @param toBlock - End block (default: 'latest')
   * @returns Array of message events
   */
  async getMessages(
    address: Address,
    fromBlock: bigint = 0n,
    toBlock: bigint | 'latest' = 'latest'
  ): Promise<MessageNotifiedEvent[]> {
    // RPC doesn't support indexed address params, so fetch all events and filter client-side
    const logs = await this.publicClient.getContractEvents({
      address: R3MAIL_CONTRACT_ADDRESS,
      abi: mailboxAbi,
      eventName: 'MessageNotified',
      // Don't filter by 'to' address in the query - RPC doesn't support it
      fromBlock,
      toBlock,
    })
    
    // Filter client-side for the recipient address
    console.log(`🔍 Filtering ${logs.length} events for recipient: ${address.toLowerCase()}`)
    const filtered = logs.filter((log: any) => {
      const match = log.args.to?.toLowerCase() === address.toLowerCase()
      console.log(`  Event to: ${log.args.to?.toLowerCase()} - Match: ${match}`)
      return match
    })
    console.log(`✅ Filtered to ${filtered.length} messages for ${address.toLowerCase()}`)
    
    return filtered.map(log => this.parseMessageEvent(log))
  }
  
  /**
   * Watch for new messages to an address
   * Returns an unwatch function to stop watching
   * 
   * @param options - Watch options
   * @returns Unwatch function
   */
  watchInbox(options: WatchInboxOptions): () => void {
    const { address, onMessage, onError, pollInterval = 4000 } = options
    
    // Use publicClient.watchContractEvent instead of standalone function
    return this.publicClient.watchContractEvent({
      address: R3MAIL_CONTRACT_ADDRESS,
      abi: mailboxAbi,
      eventName: 'MessageNotified',
      args: {
        to: address,
      },
      onLogs: async (logs: any) => {
        for (const log of logs) {
          try {
            const event = this.parseMessageEvent(log)
            await onMessage(event)
          } catch (error) {
            if (onError) {
              onError(error as Error)
            } else {
              console.error('Error processing message event:', error)
            }
          }
        }
      },
      onError: onError,
      poll: true,
      pollingInterval: pollInterval,
    })
  }
  
  /**
   * Parse a MessageNotified log into an event object
   */
  private parseMessageEvent(log: Log): MessageNotifiedEvent {
    const { args, blockNumber, transactionHash } = log as any
    
    return {
      msgId: args.msgId,
      from: args.from,
      to: args.to,
      envelopeCid: args.envelopeCid,
      timestamp: args.timestamp,
      blockNumber: blockNumber!,
      transactionHash: transactionHash!,
    }
  }
  
  /**
   * Get block explorer URL for a transaction
   */
  getTransactionUrl(hash: Hash): string {
    return `${NETWORK_CONFIG.blockExplorers.default.url}/tx/${hash}`
  }
  
  /**
   * Get block explorer URL for an address
   */
  getAddressUrl(address: Address): string {
    return `${NETWORK_CONFIG.blockExplorers.default.url}/address/${address}`
  }
}

/**
 * Create a new R3MAIL chain client
 */
export function createR3mailChainClient(rpcUrl?: string): R3mailChainClient {
  return new R3mailChainClient(rpcUrl)
}
