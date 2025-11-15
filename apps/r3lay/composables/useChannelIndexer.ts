/**
 * Channel Indexer Composable
 * 
 * Scans blockchain for channel events and maintains local index
 */

import { createPublicClient, http, parseAbiItem } from 'viem'
import { defineChain } from 'viem'

export const useChannelIndexer = () => {
  const config = useRuntimeConfig()
  const isIndexing = useState('indexer-running', () => false)
  const indexProgress = useState('indexer-progress', () => 0)
  const lastBlock = useState('indexer-last-block', () => 0n)
  const channels = useState<any[]>('indexed-channels', () => [])
  const cancelRequested = useState('indexer-cancel', () => false)
  
  // Paseo Asset Hub chain definition
  const paseoAssetHub = defineChain({
    id: Number(config.public.chainId),
    name: 'Paseo Asset Hub',
    network: 'paseo-asset-hub',
    nativeCurrency: {
      decimals: 10,
      name: 'PAS',
      symbol: 'PAS',
    },
    rpcUrls: {
      default: {
        http: [config.public.rpcUrl],
      },
      public: {
        http: [config.public.rpcUrl],
      },
    },
    blockExplorers: {
      default: {
        name: 'BlockScout',
        url: 'https://blockscout-passet-hub.parity-testnet.parity.io',
      },
    },
  })
  
  // Create public client
  const publicClient = createPublicClient({
    chain: paseoAssetHub,
    transport: http(),
  })
  
  // Load indexed channels from IndexedDB
  const loadIndexedChannels = async () => {
    try {
      // For now use localStorage, will migrate to IndexedDB
      const stored = localStorage.getItem('r3lay-indexed-channels')
      if (stored) {
        channels.value = JSON.parse(stored)
      }
      
      const storedBlock = localStorage.getItem('r3lay-last-indexed-block')
      if (storedBlock) {
        lastBlock.value = BigInt(storedBlock)
      }
    } catch (error) {
      console.error('Failed to load indexed channels:', error)
    }
  }
  
  // Save indexed channels
  const saveIndexedChannels = () => {
    try {
      // Convert BigInt to string for JSON serialization
      const serializable = channels.value.map(c => ({
        ...c,
        blockNumber: c.blockNumber.toString(),
      }))
      localStorage.setItem('r3lay-indexed-channels', JSON.stringify(serializable))
      localStorage.setItem('r3lay-last-indexed-block', lastBlock.value.toString())
    } catch (error) {
      console.error('Failed to save indexed channels:', error)
    }
  }
  
  // Scan for channel events
  const scanChannelEvents = async (fromBlock?: bigint, toBlock?: bigint) => {
    isIndexing.value = true
    cancelRequested.value = false
    
    try {
      console.log('🔍 Scanning for channel events...')
      
      // Get current block if not specified
      if (!toBlock) {
        toBlock = await publicClient.getBlockNumber()
      }
      
      // Start from last indexed block or deployment block
      if (!fromBlock) {
        fromBlock = lastBlock.value || 0n
      }
      
      // Scan BACKWARDS in chunks for better UX (newest first!)
      const chunkSize = 10000n
      let currentTo = toBlock
      const totalBlocks = toBlock - fromBlock
      
      while (currentTo > fromBlock && !cancelRequested.value) {
        const currentFrom = currentTo - chunkSize < fromBlock ? fromBlock : currentTo - chunkSize
        
        console.log(`Scanning blocks ${currentFrom} to ${currentTo} (backwards)`)
        
        // Get ChannelCreated events
        const logs = await publicClient.getLogs({
          address: config.public.contractAddress as `0x${string}`,
          event: parseAbiItem('event ChannelCreated(bytes32 indexed channelId, address indexed creator, string indexCid, string meta)'),
          fromBlock: currentFrom,
          toBlock: currentTo,
        })
        
        // Process events (newest first)
        for (const log of logs.reverse()) {
          const { channelId, creator, indexCid, meta } = log.args as any
          
          // Check if already indexed
          if (!channels.value.some(c => c.channelId === channelId)) {
            // Add to front of array (newest first)
            channels.value.unshift({
              channelId,
              creator,
              meta,
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
            })
            
            console.log(`✅ Indexed channel: ${channelId}`)
            
            // Save immediately so UI updates in real-time
            saveIndexedChannels()
          }
        }
        
        // Update progress based on blocks scanned so far
        const blocksScanned = toBlock - currentFrom
        indexProgress.value = Number((blocksScanned * 100n) / totalBlocks)
        lastBlock.value = currentFrom
        
        currentTo = currentFrom - 1n
      }
      
      // Save to storage
      saveIndexedChannels()
      
      if (cancelRequested.value) {
        console.log(`⏸️  Indexing cancelled at block ${lastBlock.value}. Found ${channels.value.length} channels so far.`)
      } else {
        console.log(`✅ Indexing complete! Found ${channels.value.length} channels`)
      }
      
    } catch (error) {
      console.error('Failed to scan events:', error)
      throw error
    } finally {
      isIndexing.value = false
      indexProgress.value = 0
      cancelRequested.value = false
    }
  }
  
  // Cancel indexing
  const cancelScan = () => {
    console.log('🛑 Cancel requested...')
    cancelRequested.value = true
  }
  
  // Start background indexing
  const startBackgroundSync = async () => {
    // Initial scan
    await loadIndexedChannels()
    await scanChannelEvents()
    
    // Poll for new events every 30 seconds
    setInterval(async () => {
      try {
        await scanChannelEvents()
      } catch (error) {
        console.error('Background sync error:', error)
      }
    }, 30000)
  }
  
  return {
    isIndexing: readonly(isIndexing),
    indexProgress: readonly(indexProgress),
    channels: readonly(channels),
    loadIndexedChannels,
    scanChannelEvents,
    cancelScan,
    startBackgroundSync,
  }
}
