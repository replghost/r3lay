# R3LAY — MVP Design Document

**Author:** William Chen  
**Last Updated:** {{today}}  
**Status:** Design v1  
**Scope:** R3LAY MVP — Encrypted 1→Many Publishing System  
**Tech:** Polkadot (Paseo Asset Hub EVM), IPFS, Nuxt (TS), X25519 E2EE

---

# 1. Design Goals

R3LAY is a fully client-side, unstoppable, end-to-end encrypted publishing protocol where:

- A **creator** posts encrypted content to a private audience (followers)
- Followers **discover new posts** using a decentralized on-chain pointer
- All content is stored **encrypted on IPFS**
- All access control is done via **cryptographic keys**, not smart contracts
- The blockchain is used **only** for:
  - Channel registration
  - Feed index pointer updates
  - Optional event-driven updates

There are **no servers**, no centralized accounts, and no public follower list.

---

# 2. High-Level Architecture

       ┌───────────────┐
       │   Creator      │
       │(Nuxt Client)   │
       └──────┬────────┘
              │
              │ 1. Encrypt post for followers
              ▼
    ┌─────────────────────┐
    │      IPFS           │
    │ encrypted posts     │
    │ encrypted index     │
    └─────────┬───────────┘
              │ 2. Upload index CID
              ▼
    ┌─────────────────────┐
    │  Polkadot Asset Hub │
    │  (EVM Contract)     │
    │   - channelId       │
    │   - indexCid        │
    └─────────┬───────────┘
              │ 3. Pointer update
              ▼
       ┌───────────────┐
       │  Followers     │
       │ (Nuxt Client)  │
       │ - Query chain  │
       │ - Download     │
       │ - Decrypt      │
       └───────────────┘

**Chain = discoverability + pointer**  
**IPFS = encrypted content**  
**Client = crypto + UX**  

---

# 3. Core Components

## 3.1 Smart Contract: R3LAYChannelRegistry

A minimal EVM contract deployed on **Paseo Asset Hub**.

### Stores:
- `channelId → { creator, currentIndexCid, meta, timestamps }`

### Responsibilities:
- Register a new channel  
- Update the feed index pointer  
- Emit events for client sync  

### Does *not* store:
- Followers  
- Encryption keys  
- Posts  

This keeps the chain footprint tiny and privacy-preserving.

---

## 3.2 Off-Chain Storage (IPFS)

R3LAY uses IPFS to store:

1. **Encrypted post bundles**
2. **Encrypted feed_index.json**
3. **Optional attachments**

### Post Bundle (before encryption)
post/
metadata.json
post.md
attachments/*

### feed_index.json
{
"version": 1,
"creator": "<pubkey>",
"posts": ["<postCid1>", "<postCid2>", ...]
}

---

## 3.3 Cryptography Layer (X25519 E2EE)

Each participant (creator + followers) has:

- **X25519 keypair** for encryption (ECDH shared secrets)
- Optional **Ed25519 keypair** for signing posts (creator only)

Creator:
- Encrypts each post’s symmetric key (`K_msg`) separately for each follower.

Follower:
- Uses their X25519 private key to decrypt `K_msg`.
- Uses `K_msg` to decrypt the post bundle.

### Key Storage
- Web: IndexedDB + WebCrypto (non-extractable)
- Desktop/Mobile: OS secure keystore

Keys never leave the device.

---

# 4. Detailed Workflow

## 4.1 Channel Creation (Creator)

1. Creator installs/opens R3LAY client  
2. Client generates:
   - X25519 creator keypair  
   - Ed25519 signing keypair (optional)  
3. Create empty feed index → upload to IPFS → `indexCid`  
4. Wallet signs:
createChannel(channelId, indexCid, meta)

5. Channel is now discoverable via chain.

---

## 4.2 Adding/Removing Followers

Followers supply their **public encryption key** off-band (DM, QR, email, etc.).

Creator stores follower public keys **locally only**.

To remove a follower: remove their key locally — new posts will not include encrypted keys for them.

No on-chain writes. No public signals.

---

## 4.3 Publishing a Post (Creator)

1. Creator writes Markdown  
2. App:
- Builds bundle with metadata + attachments  
- Generates symmetric key `K_msg`  
- Encrypts bundle with `K_msg`  
- Encrypts `K_msg` for each follower via X25519  
3. Upload encrypted bundle to IPFS → `postCid`  
4. Update feed index → upload → `newIndexCid`  
5. Wallet signs:

updateChannel(channelId, newIndexCid)

6. Followers detect new posts via:
- Event subscription  
- Or periodic polling  

---

## 4.4 Syncing & Reading Posts (Follower)

1. User enters `channelId`  
2. Client queries contract → retrieves `currentIndexCid`  
3. Downloads `feed_index.json` from IPFS  
4. For each `postCid`:
- Download encrypted bundle  
- Read metadata → find `encrypted_keys[follower_pubkey]`  
- Decrypt `K_msg`  
- Decrypt bundle  
- Render Markdown  

If follower’s pubkey is missing:
→ “Not authorized to read this post.”

---

# 5. Data Models

### 5.1 metadata.json (inside post bundle)

{
"version": 1,
"author": "<creator_public_key>",
"timestamp": <unix_ms>,
"title": "Post Title",
"summary": "Optional preview text",
"encrypted_keys": {
"<follower_pubkey>": "<encrypted_K_msg_base64>"
},
"payloadCid": "<cid_of_encrypted_payload>"
}

### 5.2 feed_index.json

{
"version": 1,
"creator": "<creator_public_key>",
"posts": ["cid1", "cid2", ...]
}

---

# 6. Chain Design

### Smart Contract Minimalism
The contract stores only:
- channelId
- creator address
- index CID
- meta string
- timestamps

No arrays. No lists. No dynamic memory.

### Why minimal?
- Cheap gas  
- Fast lookup  
- Simple verification  
- Fully private follower graph  
- Unstoppable (no heavy storage or logic)

---

# 7. Client Architecture

/apps/r3lay-client
/components
/pages
/composables
/stores
/utils
/crypto (thin wrappers)
/chain (eth/viem calls)
/ipfs (ipfs-http-client)


### Composables (Vue 3)
- `useCreator()`  
- `useFollowers()`  
- `useChannel()`  
- `usePosts()`  
- `useEncryption()`  
- `useIPFS()`  
- `useChain()`  

### State Stored in IndexedDB (Dexie)
- Creator keys  
- Follower keys  
- Follower list (creator side)  
- Channel list (follower side)  
- Decrypted posts (cache)  

---

# 8. Event System for Sync

### Channel events:
- `ChannelUpdated(channelId, newIndexCid)`
- `PostPublished(channelId, postCid)` (optional)

Follower client:
- Listens over EVM RPC websockets  
- Fetches new index immediately  
- Compares CIDs  
- Downloads & decrypts new posts  

Fallback:
- Poll every 30–60 seconds

---

# 9. Security Model

### Guarantees
- End-to-end encryption: only creator → authorized follower  
- Forward secrecy: new posts use new symmetric keys  
- Private follower graph  
- No centralized servers  
- No plaintext content or metadata on-chain  
- Creator cannot decrypt subscriber keys  
- Subscribers cannot impersonate creator  

### Threats Out of Scope (MVP)
- Compromised browser extension  
- Compromised device  
- Colluding followers  
- On-chain timing analysis  

---

# 10. Future Extensions

- Proxy re-encryption for real revocation  
- Public channels  
- Paid subscriptions using Asset Hub  
- Multi-device follower keys  
- Social recovery for creator keys  
- zk-based access control proofs  
- ENS/IPNS channel names  
- Rich media uploads  
- App-level federation (relay nodes)

---

# 11. Non-Functional Requirements

- Works offline after initial channel sync  
- App loads within 1 second  
- Post decryption <100ms for small posts  
- Index files <100KB  
- Posts <100KB  
- No backend required  
- Fully client-side  
- Zero trusted third parties  

---

# 12. Acceptance Criteria

A working MVP must support:

### Creator:
- Create channel on-chain  
- Add followers (via pubkey) locally  
- Publish encrypted posts  
- Update feed index  
- Notify followers via chain events  
- Remove follower (forward-only)

### Follower:
- Follow channel via channelId  
- Sync to latest pointer  
- Download & decrypt posts  
- Handle removal gracefully  
- React to chain events or polling  

### System:
- No servers required  
- Works with default IPFS public gateway  
- Works with MetaMask/Talisman EVM signing  

---

# 13. Summary

R3LAY marries:
- Polkadot → pointer & event sync  
- IPFS → encrypted content  
- X25519 → access control  
- Nuxt → UX  
- IndexedDB → key storage  

This produces an **unstoppable, encrypted, decentralized Substack-like feed** where creators control their audience cryptographically, not through centralized platforms.

---

# End of Document
