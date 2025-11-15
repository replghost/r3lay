# R3LAY

**Encrypted, Unstoppable, Decentralized Publishing**

R3LAY is an end-to-end encrypted publishing protocol that combines:
- **Polkadot (Paseo Asset Hub EVM)** for channel registry & event indexing
- **IPFS** for encrypted content storage
- **X25519 E2EE** for cryptographic access control
- **Nuxt/Vue 3** for the client application

## Overview

R3LAY enables creators to publish encrypted content to private audiences without relying on centralized servers. All access control is cryptographic, follower lists are private, and content is stored encrypted on IPFS.

### Key Features

- ✅ **End-to-end encryption** - Only authorized followers can decrypt posts
- ✅ **No servers** - Fully client-side, decentralized architecture
- ✅ **Private follower graph** - No public follower lists
- ✅ **Chain-anchored** - Verifiable, tamper-evident feed index
- ✅ **Unstoppable** - No single point of failure
- ✅ **Forward secrecy** - Each post uses a new symmetric key

## Architecture

```
Creator → Encrypt Post → IPFS (encrypted content)
                ↓
         Update Pointer
                ↓
    Polkadot Asset Hub (channel registry)
                ↓
         Event / Polling
                ↓
Follower → Query Chain → Download IPFS → Decrypt
```

## Project Structure

```
r3lay/
├── apps/
│   └── r3lay/              # Nuxt client app
├── packages/
│   ├── r3lay-core/         # Core types, utils, constants
│   ├── r3lay-chain/        # Chain interaction layer
│   └── r3lay-ipfs/         # IPFS client abstraction
├── contracts/
│   └── r3lay-channel-registry/  # Smart contract
└── docs/                   # Documentation
```

## Documentation

- [Design Document](./docs/DESIGN.md) - Architecture and technical design
- [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md) - Step-by-step build plan
- [Product Requirements](./docs/R3LAY-PRD.md) - Product specification
- [Protocol Spec](./docs/R3LAY-001.md) - Protocol specification

## Development Status

### ✅ Completed
- [x] Phase 0: Monorepo structure setup
- [x] Phase 2: Core types library (`@r3lay/core`)
- [x] Phase 1: Smart contract implementation

### 🚧 In Progress
- [ ] Phase 3: Crypto module (X25519, encryption)
- [ ] Phase 4: IPFS client
- [ ] Phase 5: Chain interaction layer

### 📋 Planned
- [ ] Phase 6: Post bundling system
- [ ] Phase 7: Creator UI
- [ ] Phase 8: Follower UI
- [ ] Phase 9: Persistence & settings
- [ ] Phase 10: E2E testing
- [ ] Phase 11: Documentation & hardening

## Quick Start

### Prerequisites

- Bun or Node.js 20+
- Foundry (for smart contracts)

### Install Dependencies

```bash
bun install
```

### Run Client App

```bash
cd apps/r3lay
bun run dev
```

### Build Core Library

```bash
cd packages/r3lay-core
bun install
bun test
```

### Deploy Contract

```bash
cd contracts/r3lay-channel-registry
forge build
forge test
# Deploy to Paseo Asset Hub
forge create --rpc-url $PASEO_RPC_URL \
  --private-key $PRIVATE_KEY \
  R3LAYChannelRegistry
```

## Packages

### [@r3lay/core](./packages/r3lay-core)
Core types, utilities, and constants for the R3LAY protocol.

```typescript
import type { Channel, PostMetadata, FeedIndex } from '@r3lay/core'
import { validateCid, encodeBase64 } from '@r3lay/core'
```

### [@r3lay/chain](./packages/r3lay-chain) (Coming Soon)
Chain interaction layer for Paseo Asset Hub EVM.

### [@r3lay/ipfs](./packages/r3lay-ipfs) (Coming Soon)
IPFS client abstraction for content storage.

## Smart Contract

The `R3LAYChannelRegistry` contract is deployed on Paseo Asset Hub EVM.

**Key Functions:**
- `createChannel(channelId, indexCid, meta)` - Register a new channel
- `updateChannel(channelId, newIndexCid)` - Update feed pointer
- `getChannel(channelId)` - Query channel data

See [contract documentation](./contracts/r3lay-channel-registry/README.md) for details.

## Contributing

R3LAY is in active development. Contributions welcome!

1. Check the [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md)
2. Pick a phase or task
3. Submit a PR

## Security

R3LAY uses:
- **X25519** for key exchange (ECDH)
- **XSalsa20-Poly1305** for symmetric encryption
- **Ed25519** for signatures (optional)
- **IndexedDB + WebCrypto** for key storage

See [Security Model](./docs/DESIGN.md#9-security-model) for details.

## License

MIT

## Links

- [Protocol Specification](./docs/R3LAY-001.md)
- [Design Document](./docs/DESIGN.md)
- [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md)

---

**Status:** MVP Development  
**Version:** 0.1.0-alpha  
**Last Updated:** 2025-11-15
