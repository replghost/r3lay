/**
 * Chain interaction composable
 * 
 * Manages connection to Paseo Asset Hub and contract interactions
 */

import type { Address } from '@r3lay/chain'
import type { ChannelId, Cid } from '@r3lay/core'
import { R3LAYChainClient } from '@r3lay/chain'

export const useR3layChain = () => {
  const config = useRuntimeConfig()
  
  // State
  const isConnected = useState('chain-connected', () => false)
  const walletAddress = useState<Address | null>('wallet-address', () => null)
  const chainClient = useState('chain-client', () => null as any)
  
  // Initialize chain client
  const initializeClient = async () => {
    if (chainClient.value) return chainClient.value
    
    chainClient.value = new R3LAYChainClient({
      rpcUrl: config.public.rpcUrl || 'https://paseo-asset-hub-rpc.polkadot.io',
      chainId: Number(config.public.chainId || 1000),
      contractAddress: config.public.contractAddress as Address,
    })
    
    return chainClient.value
  }
  
  // Connect wallet
  const connectWallet = async () => {
    try {
      const client = await initializeClient()
      const address = await client.connectWallet()
      
      walletAddress.value = address
      isConnected.value = true
      
      return address
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    }
  }
  
  // Create channel
  const createChannel = async (channelId: ChannelId, indexCid: Cid, meta: string) => {
    const client = await initializeClient()
    return await client.createChannel(channelId, indexCid, meta)
  }
  
  // Update channel
  const updateChannel = async (channelId: ChannelId, newIndexCid: Cid) => {
    const client = await initializeClient()
    return await client.updateChannel(channelId, newIndexCid)
  }
  
  // Get channel
  const getChannel = async (channelId: ChannelId) => {
    const client = await initializeClient()
    return await client.getChannel(channelId)
  }
  
  // Publish post
  const publishPost = async (channelId: ChannelId, postCid: Cid) => {
    const client = await initializeClient()
    return await client.publishPost(channelId, postCid)
  }
  
  return {
    // State
    isConnected: readonly(isConnected),
    walletAddress: readonly(walletAddress),
    
    // Actions
    connectWallet,
    createChannel,
    updateChannel,
    getChannel,
    publishPost,
  }
}
