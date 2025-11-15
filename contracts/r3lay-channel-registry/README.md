# R3LAY Channel Registry Contract

Minimal on-chain registry for R3LAY encrypted publishing channels.

## Overview

The `R3LAYChannelRegistry` contract provides:

- **Channel creation** - Register a new encrypted publishing channel
- **Feed index updates** - Update the IPFS CID pointer to the latest feed
- **Metadata management** - Store optional channel metadata
- **Event emission** - Enable client-side sync and discovery

## Architecture

### What's On-Chain
- Channel ID (bytes32)
- Creator address
- Current feed index CID (IPFS)
- Metadata string
- Timestamps

### What's Off-Chain (IPFS)
- Encrypted posts
- Feed index files
- Attachments
- Follower lists (creator's local storage only)

## Contract Interface

### Functions

#### `createChannel(bytes32 channelId, string indexCid, string meta)`
Creates a new channel. Only callable once per channelId.

**Parameters:**
- `channelId` - Unique identifier (bytes32)
- `indexCid` - IPFS CID of initial feed_index.json
- `meta` - Optional metadata (JSON string or text)

**Emits:** `ChannelCreated(channelId, creator, indexCid, meta)`

#### `updateChannel(bytes32 channelId, string newIndexCid)`
Updates the feed index pointer. Only callable by channel creator.

**Parameters:**
- `channelId` - Channel to update
- `newIndexCid` - New IPFS CID of feed_index.json

**Emits:** `ChannelUpdated(channelId, newIndexCid)`

#### `setMeta(bytes32 channelId, string newMeta)`
Updates channel metadata. Only callable by channel creator.

**Parameters:**
- `channelId` - Channel to update
- `newMeta` - New metadata string

**Emits:** `MetadataUpdated(channelId, newMeta)`

#### `publishPost(bytes32 channelId, string postCid)`
Optional: Emits an event for a new post (for fine-grained sync).

**Parameters:**
- `channelId` - Channel publishing the post
- `postCid` - IPFS CID of encrypted post bundle

**Emits:** `PostPublished(channelId, postCid)`

### View Functions

#### `getChannel(bytes32 channelId) → Channel`
Returns full channel data.

#### `exists(bytes32 channelId) → bool`
Checks if a channel exists.

#### `getCurrentIndexCid(bytes32 channelId) → string`
Returns the current feed index CID.

#### `getCreator(bytes32 channelId) → address`
Returns the channel creator's address.

## Events

### `ChannelCreated`
```solidity
event ChannelCreated(
    bytes32 indexed channelId,
    address indexed creator,
    string indexCid,
    string meta
)
```

### `ChannelUpdated`
```solidity
event ChannelUpdated(
    bytes32 indexed channelId,
    string newIndexCid
)
```

### `MetadataUpdated`
```solidity
event MetadataUpdated(
    bytes32 indexed channelId,
    string newMeta
)
```

### `PostPublished`
```solidity
event PostPublished(
    bytes32 indexed channelId,
    string postCid
)
```

## Deployment

### Prerequisites
- Foundry or Hardhat
- Access to Paseo Asset Hub EVM RPC
- Funded deployer account

### Deploy Script (Foundry)

```bash
forge create --rpc-url $PASEO_RPC_URL \
  --private-key $PRIVATE_KEY \
  src/R3LAYChannelRegistry.sol:R3LAYChannelRegistry
```

### Deploy Script (Hardhat)

See `scripts/deploy.ts`

## Gas Estimates

- `createChannel`: ~150k gas
- `updateChannel`: ~50k gas
- `setMeta`: ~50k gas
- `publishPost`: ~30k gas (event only)

## Security Considerations

1. **No access control on channel creation** - Anyone can create a channel
2. **Only creator can update** - Enforced by `onlyCreator` modifier
3. **No content validation** - CIDs are not validated on-chain
4. **No follower data** - Follower lists are never stored on-chain (privacy)
5. **Immutable creator** - Channel creator cannot be changed

## Testing

```bash
forge test
```

See `test/R3LAYChannelRegistry.t.sol` for test cases.

## License

MIT
