# R3LAY MVP — Full Step-by-Step Implementation Plan

**Author:** William Chen  
**Last Updated:** {{today}}  
**Status:** Implementation Plan v1

This document provides a complete, actionable implementation plan for building the R3LAY MVP:  
- **Polkadot (Paseo Asset Hub EVM)** for channel creation + feed pointer updates  
- **IPFS** for encrypted content & feed index  
- **Local cryptography (X25519)** for access control  
- **Nuxt (Vue 3, TypeScript)** for the client app  
- **No servers** — fully decentralized, unstoppable

---

# Phase 0 — Decisions & Repo Setup

**Goal:** Establish stack and structure.

### 0.1 Tech Stack Choices
- Framework: **Nuxt 3/4** (Vue 3, TypeScript)  
- CSS: **TailwindCSS**  
- State: **Pinia** or composables  
- Build: **Vite**  
- Package manager: **pnpm**  
- IPFS: **ipfs-http-client** with optional Pinata

### 0.2 Monorepo Structure (recommended)

/apps/r3lay-client # Nuxt app
/contracts/r3lay-channel-registry
/packages/r3lay-core # Types, crypto, helpers
/packages/r3lay-chain # Chain interaction
/packages/r3lay-ipfs # IPFS client abstractions


### 0.3 Tooling
- ESLint + Prettier  
- GitHub CI: lint + build  
- `.env` for:
  - IPFS gateway  
  - RPC URL for Paseo Asset Hub  
  - Contract address  

---

# Phase 1 — Smart Contract (R3LAYChannelRegistry)

**Goal:** Deploy registry on Paseo pAsset Hub.

### 1.1 Contract Interface

#### Functions
- `createChannel(bytes32 channelId, string indexCid, string meta)`
- `updateChannel(bytes32 channelId, string newIndexCid)`
- `setMeta(bytes32 channelId, string newMeta)`

#### Events
- `ChannelCreated(bytes32, address, string, string)`
- `ChannelUpdated(bytes32, string)`
- `PostPublished(bytes32, string)` (optional)

### 1.2 Implement Contract
- Verify creator ownership  
- Validate non-empty CIDs  
- O(log n) storage, minimal gas footprint  

### 1.3 Tests
- Creating a channel  
- Duplicate ID rejection  
- Pointer updates  
- Ownership enforcement  

### 1.4 Deploy Contract
- Write deploy script  
- Deploy to **Paseo Asset Hub EVM**  
- Save:
  - Address  
  - ABI  
  - Network config  
  in `/contracts/deployments/paseo-asset-hub.json`

### 1.5 Document
Create `CONTRACTS.md` describing usage.

---

# Phase 2 — Core Library (`@r3lay/core`)

**Goal:** Shared types, interfaces, helpers.

### 2.1 Define Types
- `ChannelId = string`  
- `Cid = string`  
- `PostMetadata`  
- `FeedIndex`  
- `R3layPostBundle`  

### 2.2 Define JSON Schemas
- `metadata.json`  
- `feed_index.json`  
- Bundle layout  

### 2.3 Utilities
- `deriveChannelIdFromAddress()`  
- `validateCid()`  
- Timestamp helpers  

### 2.4 Unit Tests
Pure logic tests.

---

# Phase 3 — Crypto Module (`@r3lay/core/crypto`)

**Goal:** Key generation, encryption, secure storage.

### 3.1 Libraries
Use:
- `libsodium-wrappers` (recommended)  
or  
- `tweetnacl`  

### 3.2 Key Generation
- X25519 encryption keypair  
- Ed25519 signing keypair (optional)

### 3.3 Symmetric Encryption
- AES or XSalsa20-Poly1305
- `encryptSymmetric(plaintext, key)`  
- `decryptSymmetric(ciphertext, key)`  

### 3.4 ECDH-Based Encryption
- `deriveSharedSecret()`  
- `encryptMessageKeyForFollower(K_msg, followerPub)`  
- `decryptMessageKeyFromCreator(...)`

### 3.5 Secure Key Storage (Web)
- Use **IndexedDB + WebCrypto non-extractable keys**  
- APIs:
  - `storeCreatorKeys()`  
  - `loadCreatorKeys()`  
  - `storeFollowerKeys()`  
  - `loadFollowerKeys()`  

### 3.6 Crypto Tests
- Round-trip: encrypt → decrypt  
- Multi-follower support  

---

# Phase 4 — IPFS Client (`@r3lay/ipfs`)

**Goal:** Abstraction for storing & retrieving blobs from IPFS.

### 4.1 Interface

add(data: Uint8Array | Blob): Promise<Cid>
get(cid: Cid): Promise<Uint8Array>


### 4.2 Implement IPFS HTTP Client
- Configurable via `.env`
- Use `ipfs-http-client` or raw fetch

### 4.3 Helpers
- `uploadPostBundle()`  
- `uploadFeedIndex()`  
- `downloadFeedIndex()`  
- `downloadEncryptedPost()`

### 4.4 Optional: Pinning Providers
- Pinata  
- Web3.Storage

### 4.5 Tests
Basic add/get round trip.

---

# Phase 5 — Chain Interaction Layer (`@r3lay/chain`)

**Goal:** Typed wrapper for interacting with the registry contract.

### 5.1 Set Up Client Library
- Use `ethers` or `viem`  
- Import:
  - Contract address  
  - ABI  
  - RPC URL  

### 5.2 Implement Wrapper Functions
- `getChannel(channelId)`  
- `createChannel(...)`  
- `updateChannel(...)`

### 5.3 Event Subscriptions
- `subscribeChannelUpdated()`  
- `subscribePostPublished()`  

### 5.4 Wallet Integration
- Support:
  - MetaMask (custom RPC)  
  - Talisman (EVM accounts)  

### 5.5 Chain Tests
Simulate full flow.

---

# Phase 6 — Post Bundling & Parsing

**Goal:** Encode and decode full post bundles.

### 6.1 Bundle Format
Zip archive containing:
metadata.json
post.md
attachments/*


### 6.2 Bundler
- `buildPostBundle()`  

### 6.3 Unbundler
- `parsePostBundle()`  

### 6.4 Encryption Integration
- `createEncryptedPostBundle()`  
- `decryptEncryptedPostBundle()`  

### 6.5 Tests
- Multi-follower  
- Attachment handling  
- Unauthorized follower case  

---

# Phase 7 — Creator UI (Nuxt Client)

**Goal:** Full publishing workflow.

### 7.1 Pages
- `/creator`  
- `/creator/channel`  
- `/creator/followers`  
- `/creator/posts`  
- `/creator/new-post`

### 7.2 Channel Creation Flow
1. Generate creator keys  
2. Build empty feed_index.json  
3. Upload to IPFS → `indexCid`  
4. Wallet signs `createChannel()`  
5. Store channel locally  

### 7.3 Follower Management
- Input follower public key  
- Local-only storage  
- Remove follower (future posts exclude them)

### 7.4 Post Publishing Flow
1. Write Markdown  
2. Add attachments  
3. Build + encrypt bundle  
4. Upload to IPFS → `postCid`  
5. Update feed_index.json → upload → `newIndexCid`  
6. Wallet signs `updateChannel()`  

### 7.5 Sent Posts View
Show local decrypted posts.

---

# Phase 8 — Follower UI (Nuxt Client)

**Goal:** Following and reading encrypted feeds.

### 8.1 Pages
- `/follow`  
- `/feed/:channelId`

### 8.2 Key Generation
- Generate X25519 follower keys  
- Store via IndexedDB  

### 8.3 Follow Channel
1. Enter channelId  
2. Query contract → get `currentIndexCid`  
3. Fetch feed_index.json → load CIDs  
4. Decrypt posts  

### 8.4 Sync Logic
On feed load:
- Check new index  
- Fetch missing post bundles  
- Decrypt  

Event-driven updates:
- On `ChannelUpdated`, fetch new index

### 8.5 Decrypting Posts
- Download encrypted post  
- Find follower’s encrypted key in `encrypted_keys`  
- If present → decrypt  
- If missing → unauthorized  

---

# Phase 9 — Persistence, Settings, Error Handling

**Goal:** Production-quality usability.

### 9.1 IndexedDB Schema
Tables:
- `creator_profile`  
- `follower_profile`  
- `followers`  
- `channels`  
- `posts`  
- `settings`  

### 9.2 Settings Page
- RPC endpoint override  
- IPFS gateway override  

### 9.3 Error Handling
Detect & show:
- Chain errors  
- IPFS gateway failures  
- Decryption errors  
- Missing authorization  

### 9.4 Logging
- Development: verbose  
- Production: minimal  

---

# Phase 10 — End-to-End Testing & Alpha Trial

### 10.1 Automated E2E Script
Simulate:
- Create channel  
- Add followers  
- Publish N posts  
- Followers sync + decrypt  
- Validate plaintext  

### 10.2 Manual Testing
Test:
- Real wallet  
- Real IPFS  
- Real events  
- Multiple devices  

### 10.3 Feedback Loop
Fix:
- UX flows  
- Latency issues  
- Gateway reliability  
- Chain transaction speed  

---

# Phase 11 — Hardening & Documentation

### 11.1 Documentation
Add:
- `README.md`  
- `R3LAY-PRD.md`  
- `IMPLEMENTATION_PLAN.md`  
- `CONTRACTS.md`  
- `SECURITY_MODEL.md`  
- `DESIGN.md`  

### 11.2 Security Review (Light)
Check:
- No key leaks  
- No logs containing private data  
- Correct cryptography usage  

### 11.3 MVP Release
Tag:
v0.1.0
or
v1.0.0-mvp


---

# End of Document
