# @r3lay/ipfs

IPFS client and helpers for R3LAY content storage.

## Overview

This package provides:

- **IPFS HTTP Client** - Abstraction over ipfs-http-client
- **R3LAY Helpers** - High-level functions for feed indexes and posts
- **Pinning Providers** - Integration with Pinata and Web3.Storage
- **Batch Operations** - Efficient multi-content downloads

## Installation

```bash
bun add @r3lay/ipfs
```

## Usage

### Basic IPFS Operations

```typescript
import { IPFSClient, getIPFSClient } from '@r3lay/ipfs'

// Use default client
const ipfs = getIPFSClient()

// Or create custom client
const customIpfs = new IPFSClient({
  apiUrl: 'https://ipfs.infura.io:5001',
  gatewayUrl: 'https://ipfs.io',
  timeout: 30000,
})

// Upload data
const result = await ipfs.add(new Uint8Array([1, 2, 3]))
console.log('CID:', result.cid)

// Download data
const data = await ipfs.get('QmXxx...')

// Upload/download JSON
await ipfs.addJSON({ foo: 'bar' })
const obj = await ipfs.getJSON('QmXxx...')
```

### Feed Index Operations

```typescript
import { uploadFeedIndex, downloadFeedIndex } from '@r3lay/ipfs'
import type { FeedIndex } from '@r3lay/core'

// Upload feed index
const feedIndex: FeedIndex = {
  version: 1,
  creator: 'base64pubkey',
  channelId: '0x123...',
  posts: ['QmPost1...', 'QmPost2...'],
  updatedAt: Date.now(),
}

const cid = await uploadFeedIndex(feedIndex)

// Download feed index
const downloaded = await downloadFeedIndex(cid)
```

### Post Operations

```typescript
import { 
  uploadEncryptedPost, 
  downloadEncryptedPost,
  downloadPostMetadata 
} from '@r3lay/ipfs'

// Upload encrypted post
const postCid = await uploadEncryptedPost({
  metadata: {
    version: 1,
    author: 'base64pubkey',
    timestamp: Date.now(),
    title: 'My Post',
    encrypted_keys: {
      'follower1': 'encryptedKey1:nonce1',
      'follower2': 'encryptedKey2:nonce2',
    },
  },
  encryptedContent: new Uint8Array([...]),
  encryptedAttachments: new Map([
    ['image.jpg', new Uint8Array([...])],
  ]),
})

// Download encrypted post
const post = await downloadEncryptedPost(postCid)

// Download only metadata (faster)
const metadata = await downloadPostMetadata(postCid)
```

### Batch Operations

```typescript
import { 
  downloadMultiplePosts,
  downloadMultipleMetadata 
} from '@r3lay/ipfs'

// Download multiple posts in parallel
const posts = await downloadMultiplePosts(
  ['QmPost1...', 'QmPost2...', 'QmPost3...'],
  undefined, // use default client
  5 // concurrency
)

// Download only metadata (much faster)
const metadataMap = await downloadMultipleMetadata(
  ['QmPost1...', 'QmPost2...'],
  undefined,
  10 // higher concurrency for metadata
)
```

### Pinning with Pinata

```typescript
import { PinataClient } from '@r3lay/ipfs'

const pinata = new PinataClient({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  // or use JWT
  jwt: 'your-jwt-token',
})

// Pin existing content
await pinata.pinByCID('QmXxx...', 'My Content')

// Upload and pin
const cid = await pinata.upload(data, 'filename.txt')

// List pins
const pins = await pinata.listPins()

// Unpin
await pinata.unpin('QmXxx...')
```

### Pinning with Web3.Storage

```typescript
import { Web3StorageClient } from '@r3lay/ipfs'

const w3s = new Web3StorageClient({
  token: 'your-api-token',
})

// Upload (automatically pinned)
const cid = await w3s.upload(data, 'filename.txt')

// List uploads
const uploads = await w3s.listUploads()
```

### Generic Pinning Provider

```typescript
import { createPinningProvider } from '@r3lay/ipfs'

// Create provider
const provider = createPinningProvider('pinata', {
  apiKey: 'key',
  apiSecret: 'secret',
})

// Use generic interface
await provider.upload(data, 'file.txt')
await provider.pin('QmXxx...', 'My Content')
await provider.unpin('QmXxx...')
```

## Configuration

### IPFS Client Config

```typescript
interface IPFSConfig {
  apiUrl?: string        // Default: 'https://ipfs.infura.io:5001'
  gatewayUrl?: string    // Default: 'https://ipfs.io'
  timeout?: number       // Default: 30000 (30 seconds)
  headers?: Record<string, string>
}
```

### Environment Variables

```bash
# .env
IPFS_API_URL=https://ipfs.infura.io:5001
IPFS_GATEWAY_URL=https://ipfs.io
PINATA_API_KEY=your-key
PINATA_API_SECRET=your-secret
WEB3_STORAGE_TOKEN=your-token
```

## API Reference

### IPFSClient

- `add(data)` - Upload data to IPFS
- `get(cid)` - Download data from IPFS
- `addJSON(obj)` - Upload JSON
- `getJSON<T>(cid)` - Download and parse JSON
- `pin(cid)` - Pin content
- `unpin(cid)` - Unpin content
- `isPinned(cid)` - Check if pinned
- `stat(cid)` - Get content size/type
- `getGatewayUrl(cid)` - Get gateway URL

### Helpers

- `uploadFeedIndex(feedIndex)` - Upload feed index
- `downloadFeedIndex(cid)` - Download feed index
- `uploadEncryptedPost(bundle)` - Upload encrypted post
- `downloadEncryptedPost(cid)` - Download encrypted post
- `downloadPostMetadata(cid)` - Download metadata only
- `downloadMultiplePosts(cids, client, concurrency)` - Batch download
- `downloadMultipleMetadata(cids, client, concurrency)` - Batch metadata
- `contentExists(cid)` - Check if content exists
- `getContentSize(cid)` - Get content size

### Pinning Providers

- `PinataClient` - Pinata integration
- `Web3StorageClient` - Web3.Storage integration
- `createPinningProvider(type, config)` - Generic provider factory

## Size Limits

From `@r3lay/core` constants:

- **MAX_POST_SIZE**: 100 KB
- **MAX_FEED_INDEX_SIZE**: 100 KB
- **MAX_ATTACHMENT_SIZE**: 100 KB

## Error Handling

All functions throw `StorageError` from `@r3lay/core` on failure:

```typescript
import { StorageError } from '@r3lay/core'

try {
  await ipfs.get('invalid-cid')
} catch (error) {
  if (error instanceof StorageError) {
    console.error('Storage error:', error.message)
    console.error('Details:', error.details)
  }
}
```

## Performance Tips

1. **Use batch operations** for multiple downloads
2. **Download metadata first** to check authorization before downloading full content
3. **Use pinning services** for production to ensure content persistence
4. **Configure gateway URL** to use a fast, reliable gateway
5. **Adjust concurrency** based on network conditions

## Testing

```bash
bun test
```

## License

MIT
