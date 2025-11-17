# R3LAY

**Encrypted, Unstoppable, Decentralized Communication**

R3LAY is a monorepo containing end-to-end encrypted decentralized applications:

## 📬 R3MAIL - Encrypted Email
End-to-end encrypted messaging on the blockchain. Send private messages using Ethereum addresses with full cryptographic verification.

**Features:**
- ✅ **E2E Encryption** - X25519 key exchange + XSalsa20-Poly1305
- ✅ **Dual Signatures** - Envelope signing (EIP-191) + on-chain transaction
- ✅ **IPFS Storage** - Encrypted message content stored on IPFS
- ✅ **Blockchain Notifications** - Message events recorded on Paseo Asset Hub
- ✅ **Modern UI** - 3-column inbox with message preview
- ✅ **Markdown Support** - Rich text formatting in messages

## 📡 R3LAY - Encrypted Publishing (In Development)
Decentralized publishing protocol for private content distribution.

**Technology Stack:**
- **Polkadot (Paseo Asset Hub EVM)** for registry & event indexing
- **IPFS** for encrypted content storage
- **X25519 E2EE** for cryptographic access control
- **Nuxt/Vue 3** for client applications

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
│   ├── r3mail/             # R3MAIL encrypted messaging app
│   └── r3lay/              # R3LAY publishing app (in development)
├── packages/
│   ├── r3mail-core/        # R3MAIL core encryption & messaging
│   ├── r3lay-core/         # R3LAY core types & utils
│   ├── r3lay-chain/        # Chain interaction layer
│   └── r3lay-ipfs/         # IPFS client abstraction
├── contracts/
│   ├── r3mail-registry/    # R3MAIL public key registry
│   └── r3lay-channel-registry/  # R3LAY channel registry
└── docs/                   # Documentation
```

## Documentation

- [Design Document](./docs/DESIGN.md) - Architecture and technical design
- [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md) - Step-by-step build plan
- [Product Requirements](./docs/R3LAY-PRD.md) - Product specification
- [Protocol Spec](./docs/R3LAY-001.md) - Protocol specification

## Quick Start

### Prerequisites

- Bun or Node.js 20+
- Foundry (for smart contracts)
- MetaMask or compatible Web3 wallet

### Install Dependencies

```bash
bun install
```

### Run R3MAIL App

```bash
cd apps/r3mail
bun run dev
```

Open http://localhost:3000 and connect your wallet to start sending encrypted messages!

### Network & Testnet Tokens

3MAIL runs on **Passet Hub**.

To get testnet PAS tokens:
- Visit https://faucet.polkadot.io/?parachain=1111
- In the dropdown, select **"Passet Hub: Smart Contracts"** and follow the instructions.

### Run R3LAY App (In Development)

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

### [@r3mail/core](./packages/r3mail-core)
Core encryption and messaging functionality for R3MAIL.

```typescript
import { createEncryptedMessage, decryptMessage } from '@r3mail/core'
import { ensureSodium } from '@r3mail/core'
```

**Features:**
- X25519 key exchange
- XSalsa20-Poly1305 encryption
- Message envelope signing
- IPFS integration

### [@r3mail/chain](./packages/r3mail-chain)
Chain interaction layer for R3MAIL on Paseo Asset Hub EVM.

```typescript
import { R3mailChainClient } from '@r3mail/chain'
```

**Features:**
- Public key registry
- Message event indexing
- Transaction management

### [@r3lay/core](./packages/r3lay-core)
Core types and utilities for the R3LAY publishing protocol (in development).

## Smart Contracts

### R3MAIL Public Key Registry
Deployed on Paseo Asset Hub EVM for managing user public keys.

**Key Functions:**
- `registerPublicKey(publicKey)` - Register encryption public key
- `getPublicKey(address)` - Query user's public key
- `updatePublicKey(publicKey)` - Update public key

### R3LAY Channel Registry (In Development)
For managing decentralized publishing channels.

## Contributing

R3LAY is in active development. Contributions welcome!

1. Check the [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md)

## Security

R3LAY uses:
- **X25519** for key exchange (ECDH)
- **XSalsa20-Poly1305** for symmetric encryption
- **Ed25519** for signatures (optional)
- **IndexedDB + WebCrypto** for key storage

See [Security Model](./docs/DESIGN.md#9-security-model) for details.

## License

GPL3

## Links

- [Protocol Specification](./docs/R3LAY-001.md)
- [Design Document](./docs/DESIGN.md)
- [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md)

---

**Status:** MVP Development  
**Version:** 0.1.0-alpha  
**Last Updated:** 2025-11-15


---

Other Info:

Setup: Go to /apps/r3mail and run bun install, then bun run dev
Demo URL: https://mail.r3lay.org
Pitch Video: https://youtu.be/zz799onLrWY
Team Members: replghost
Pitch Deck: https://docs.google.com/presentation/d/1bveEqep6D6TOY0T0HVIJVMo_wOfIlNBxysvahsMi1Ds/edit?usp=sharing
