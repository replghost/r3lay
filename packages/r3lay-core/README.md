# @r3lay/core

Core types, utilities, and constants for the R3LAY protocol.

## Overview

This package provides the foundational building blocks for R3LAY:

- **Types**: TypeScript interfaces for channels, posts, feeds, identities, and events
- **Utilities**: Helper functions for CID validation, encoding, timestamps, etc.
- **Constants**: Protocol constants, size limits, error codes

## Installation

```bash
bun add @r3lay/core
```

## Usage

### Types

```typescript
import type { 
  Channel, 
  PostMetadata, 
  FeedIndex,
  CreatorIdentity,
  FollowerIdentity 
} from '@r3lay/core'
```

### Utilities

```typescript
import { 
  validateCid, 
  deriveChannelIdFromAddress,
  encodeBase64,
  decodeBase64,
  formatBytes 
} from '@r3lay/core'

// Validate a CID
if (validateCid('QmXxx...')) {
  console.log('Valid CID')
}

// Derive channel ID from address
const channelId = deriveChannelIdFromAddress('0x1234...')

// Encode/decode base64
const encoded = encodeBase64(new Uint8Array([1, 2, 3]))
const decoded = decodeBase64(encoded)
```

### Constants

```typescript
import { 
  MAX_POST_SIZE, 
  MAX_ATTACHMENT_SIZE,
  PROTOCOL_VERSION,
  ERROR_CODES 
} from '@r3lay/core'

console.log(`Protocol version: ${PROTOCOL_VERSION}`)
console.log(`Max post size: ${MAX_POST_SIZE} bytes`)
```

## Development

```bash
# Run tests
bun test

# Type check
bun run tsc --noEmit
```

## License

MIT
