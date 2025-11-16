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
    const logs = await this.publicClient.getContractEvents({
      address: R3MAIL_CONTRACT_ADDRESS,
      abi: mailboxAbi,
      eventName: 'MessageNotified',
      args: {
        to: address,
      },
      fromBlock,
      toBlock,
    })
    
    return logs.map(log => this.parseMessageEvent(log))
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
