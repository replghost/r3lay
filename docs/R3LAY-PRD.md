# R3LAY App — MVP Product Requirements Document (PRD)

**Author:** replghost  
**Status:** Draft  
**Last Updated:** 2025-11-15

---

## 1. Overview

The R3LAY App is an encrypted, unstoppable, 1→many publishing system built on:

- **Polkadot (Paseo Asset Hub EVM)** — for channel registration and feed index pointer updates  
- **IPFS** — for storing encrypted content and index files  
- **Client-side cryptography** — for access control  
- **Local indexing** — for follower sync  
- **No backend servers**

Creators publish encrypted Markdown posts (with optional small attachments) to IPFS. Followers discover channels and sync updates by reading an on-chain pointer to the latest feed index CID stored in the `R3LAYChannelRegistry` smart contract.

All access control is cryptographic and off-chain. The blockchain provides only channel identity, discoverability, and pointer updates.

---

## 2. Goals

### Primary Goals
- Enable creators to publish encrypted posts to followers.
- Store all post content in encrypted form on IPFS.
- Store channel metadata and a pointer to the latest index on Polkadot pAsset Hub.
- Followers sync by reading on-chain pointers + downloading from IPFS.
- Access control enforced by client-side cryptography.
- Support adding/removing followers (forward-only revocation).
- Maintain unstoppable operation with no servers.

### Non-Goals
- No large media (>100 KB).
- No group chat, comments, threads.
- No token gating or paid subscription (future versions).
- No on-chain follower lists (privacy).
- No smart contract access control.

---

## 3. Actors

### Creator
- Owns an encrypted publishing channel.
- Publishes posts to IPFS and updates the on-chain pointer.
- Maintains follower public keys locally.
- Holds signing/encryption keys for channel identity.

### Follower
- Holds an X25519 encryption keypair.
- Resolves a channel ID on-chain.
- Fetches feed indexes and encrypted posts from IPFS.
- Decrypts content locally.

---

## 4. High-Level Architecture

R3LAY combines:

- On-chain channel registry (pAsset Hub EVM)
- Event-driven feed updates
- Encrypted posts and index files on IPFS
- Local decryption + rendering

Flow:

1. Creator writes + encrypts a post → IPFS.
2. Creator updates `feed_index.json` → IPFS.
3. Creator calls `updateChannel(channelId, newIndexCid)` on-chain.
4. Follower listens for `ChannelUpdated` events or polls.
5. Follower fetches `feed_index.json` via the index CID.
6. Follower downloads each post and decrypts it.

---

## 5. On-Chain Component: R3LAYChannelRegistry

A minimal smart contract deployed on Paseo Asset Hub via pallet-revive EVM.

### Data Model

`channelId → Channel struct`:

- `creator` (address)
- `currentIndexCid` (string)
- `meta` (string, optional JSON or text)
- `createdAt` (uint)
- `updatedAt` (uint)

### Functions

- `createChannel(channelId, indexCid, meta)`
- `updateChannel(channelId, newIndexCid)`
- `setMeta(channelId, newMeta)`

### Events

- `ChannelCreated(channelId, creator, indexCid, meta)`
- `ChannelUpdated(channelId, newIndexCid)`
- `PostPublished(channelId, postCid)` — optional but recommended

The contract stores only metadata and pointers, not encrypted content.

---

## 6. Off-Chain Storage: IPFS

### What IPFS Stores

- Encrypted post bundles
- `feed_index.json` (list of post CIDs)
- Attachments (within encrypted bundles)
- Optional creator metadata

### Post Directory Format (before encryption)

