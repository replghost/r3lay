# @r3lay/chain

Chain interaction layer for the R3LAY protocol on Paseo Asset Hub EVM.

## Overview

This package provides:

- **Contract Wrapper** - Type-safe interface to R3LAYChannelRegistry
- **Wallet Integration** - MetaMask, Talisman, and other EIP-1193 wallets
- **Read/Write Operations** - All contract functions
- **Transaction Management** - Gas estimation, receipt tracking
- **Built on viem** - Modern, lightweight Ethereum library

## Installation

```bash
bun add @r3lay/chain
```

## Usage

### Initialize Client

```typescript
import { R3LAYChainClient, getChainClient } from '@r3lay/chain'

// Create client
const chainClient = new R3LAYChainClient({
  rpcUrl: 'https://paseo-asset-hub-rpc.polkadot.io',
  chainId: 1000, // Paseo Asset Hub chain ID
  contractAddress: '0x...', // Deployed contract address
})

// Or use singleton
const client = getChainClient({
  rpcUrl: process.env.RPC_URL!,
  chainId: Number(process.env.CHAIN_ID),
  contractAddress: process.env.CONTRACT_ADDRESS as Address,
})
```

### Connect Wallet

```typescript
// Connect wallet (MetaMask, etc.)
const address = await client.connectWallet()
console.log('Connected:', address)

// Get current address
const currentAddress = await client.getAddress()
```

### Read Operations

```typescript
// Get channel data
const channel = await client.getChannel('0x123...')
console.log('Channel:', channel)

// Check if channel exists
const exists = await client.channelExists('0x123...')

// Get current index CID
const indexCid = await client.getCurrentIndexCid('0x123...')

// Get channel creator
const creator = await client.getCreator('0x123...')
```

### Write Operations

```typescript
// Create a new channel
const result = await client.createChannel(
  '0x123...', // channelId
  'QmXxx...', // indexCid
  JSON.stringify({ name: 'My Channel', description: '...' }) // meta
)

console.log('Transaction hash:', result.hash)
console.log('Block number:', result.blockNumber)

// Update channel feed index
await client.updateChannel('0x123...', 'QmNewIndex...')

// Update channel metadata
await client.setMeta('0x123...', JSON.stringify({ name: 'Updated Name' }))

// Publish a post (emits event)
await client.publishPost('0x123...', 'QmPost...')
```

### Gas Estimation

```typescript
// Estimate gas before creating channel
const gasEstimate = await client.estimateCreateChannelGas(
  '0x123...',
  'QmXxx...',
  '{}'
)

console.log('Estimated gas:', gasEstimate)
```

### Transaction Tracking

```typescript
// Get transaction receipt
const receipt = await client.getTransactionReceipt(txHash)

// Get current block number
const blockNumber = await client.getBlockNumber()
```

## Complete Example: Creator Flow

```typescript
import { R3LAYChainClient } from '@r3lay/chain'
import { deriveChannelIdFromAddress } from '@r3lay/core'
import { uploadFeedIndex } from '@r3lay/ipfs'

// 1. Initialize
const client = new R3LAYChainClient({
  rpcUrl: process.env.RPC_URL!,
  chainId: 1000,
  contractAddress: process.env.CONTRACT_ADDRESS as Address,
})

// 2. Connect wallet
const address = await client.connectWallet()

// 3. Derive channel ID from address
const channelId = deriveChannelIdFromAddress(address)

// 4. Create empty feed index
const feedIndex = {
  version: 1,
  creator: creatorPubkey,
  channelId,
  posts: [],
  updatedAt: Date.now(),
}

// 5. Upload to IPFS
const indexCid = await uploadFeedIndex(feedIndex)

// 6. Create channel on-chain
const result = await client.createChannel(
  channelId,
  indexCid,
  JSON.stringify({
    name: 'My Channel',
    description: 'Encrypted newsletter',
  })
)

console.log('Channel created!', result.hash)
```

## Complete Example: Follower Flow

```typescript
import { R3LAYChainClient } from '@r3lay/chain'
import { downloadFeedIndex } from '@r3lay/ipfs'

// 1. Initialize
const client = new R3LAYChainClient({
  rpcUrl: process.env.RPC_URL!,
  chainId: 1000,
  contractAddress: process.env.CONTRACT_ADDRESS as Address,
})

// 2. Get channel data
const channelId = '0x123...' // From creator
const channel = await client.getChannel(channelId)

// 3. Download feed index
const feedIndex = await downloadFeedIndex(channel.currentIndexCid)

// 4. Process posts
for (const postCid of feedIndex.posts) {
  // Download and decrypt post
  // (see @r3lay/ipfs and @r3lay/core crypto docs)
}
```

## Event Watching (Future)

Event watching will be added in a future update:

```typescript
// Subscribe to channel updates
client.watchChannelUpdated(channelId, (event) => {
  console.log('New index CID:', event.newIndexCid)
  // Fetch and process new posts
})

// Subscribe to post published events
client.watchPostPublished(channelId, (event) => {
  console.log('New post:', event.postCid)
})
```

## Configuration

### Chain Config

```typescript
interface ChainConfig {
  rpcUrl: string           // RPC endpoint
  chainId: number          // Chain ID
  contractAddress: Address // Contract address
  chain?: any             // Optional viem chain config
}
```

### Environment Variables

```bash
# .env
RPC_URL=https://paseo-asset-hub-rpc.polkadot.io
CHAIN_ID=1000
CONTRACT_ADDRESS=0x...
```

## API Reference

### R3LAYChainClient

**Connection:**
- `connectWallet()` - Connect EIP-1193 wallet
- `getAddress()` - Get connected address

**Read Operations:**
- `getChannel(channelId)` - Get channel data
- `channelExists(channelId)` - Check if exists
- `getCurrentIndexCid(channelId)` - Get index CID
- `getCreator(channelId)` - Get creator address

**Write Operations:**
- `createChannel(channelId, indexCid, meta)` - Create channel
- `updateChannel(channelId, newIndexCid)` - Update index
- `setMeta(channelId, newMeta)` - Update metadata
- `publishPost(channelId, postCid)` - Emit post event

**Utilities:**
- `getBlockNumber()` - Current block
- `getTransactionReceipt(hash)` - Get receipt
- `estimateCreateChannelGas(...)` - Estimate gas

## Error Handling

All functions throw `ChainError` from `@r3lay/core`:

```typescript
import { ChainError } from '@r3lay/core'

try {
  await client.createChannel(...)
} catch (error) {
  if (error instanceof ChainError) {
    console.error('Chain error:', error.message)
    console.error('Details:', error.details)
  }
}
```

## Wallet Support

Supports any EIP-1193 compatible wallet:
- MetaMask
- Talisman (EVM accounts)
- Coinbase Wallet
- WalletConnect
- Rainbow
- And more...

## Testing

```bash
bun test
```

## License

MIT
