# R3MAIL Detailed Technical Specification

**Version:** 1.0  
**Date:** November 15, 2024  
**Status:** Implementation Ready

---

## 1. Architecture Overview

```
┌─────────────┐                    ┌──────────────┐
│   Sender    │                    │  Recipient   │
│   Wallet    │                    │   Wallet     │
└──────┬──────┘                    └──────┬───────┘
       │                                  │
       │ 1. Derive keys                   │ 1. Derive keys
       │    from signature                │    from signature
       │                                  │
       ▼                                  ▼
┌─────────────────────────────────────────────────┐
│           R3MAIL Client (Browser)               │
│  ┌──────────────┐  ┌─────────────────────────┐ │
│  │   Compose    │  │        Inbox            │ │
│  │      UI      │  │   - Event listener      │ │
│  └──────┬───────┘  │   - Message list        │ │
│         │          │   - Decrypt & display   │ │
│         │          └─────────────────────────┘ │
│         ▼                                       │
│  ┌──────────────────────────────────────────┐  │
│  │         Crypto Module                    │  │
│  │  - X25519 key derivation                 │  │
│  │  - ECDH shared secret                    │  │
│  │  - XChaCha20-Poly1305 encryption         │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
       │                                  ▲
       │ 2. Encrypt message               │ 4. Watch events
       │                                  │
       ▼                                  │
┌─────────────────────────────────────────────────┐
│              IPFS Storage                       │
│  ┌──────────────────────────────────────────┐  │
│  │  envelope.json (metadata + wrapped key)  │  │
│  │  body.bin (encrypted markdown)           │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
       │                                  ▲
       │ 3. notifyMessage(msgId, to, CID) │ 5. Fetch & decrypt
       │                                  │
       ▼                                  │
┌─────────────────────────────────────────────────┐
│      Paseo Asset Hub (EVM)                      │
│  ┌──────────────────────────────────────────┐  │
│  │      R3mailMailbox.sol                   │  │
│  │  - notifyMessage()                       │  │
│  │  - emit MessageNotified event            │  │
│  │  - inboxCount mapping                    │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 2. Key Management (Wallet-Based Derivation)

### 2.1 Key Derivation Process

**Same as R3LAY - reuse existing code!**

```typescript
// Derive encryption keys from wallet signature
async function deriveKeysFromWallet(walletAddress: string): Promise<KeyPair> {
  // 1. Request signature from wallet
  const message = `R3MAIL Key Derivation\n\nAddress: ${walletAddress}\nTimestamp: ${Date.now()}`
  const signature = await window.ethereum.request({
    method: 'personal_sign',
    params: [message, walletAddress]
  })
  
  // 2. Hash signature to get seed
  const seed = await crypto.subtle.digest('SHA-256', hexToBytes(signature))
  
  // 3. Generate X25519 keypair from seed
  const keypair = sodium.crypto_box_seed_keypair(new Uint8Array(seed))
  
  return {
    publicKey: keypair.publicKey,
    privateKey: keypair.privateKey
  }
}
```

### 2.2 Key Discovery

**No on-chain registry needed!** Keys are deterministic:

1. **Sender** derives recipient's public key:
   - Knows recipient's wallet address
   - Derives their public key using same algorithm
   - No need to query anything

2. **Recipient** derives their own keys:
   - Signs with their wallet
   - Gets same keys every time
   - Works across devices

### 2.3 Advantages

✅ **No gas costs** - No on-chain key storage  
✅ **Multi-device** - Same keys on any device with wallet  
✅ **Privacy** - Keys never stored or transmitted  
✅ **Simple** - No key management UI needed  

---

## 3. Message Format

### 3.1 Envelope (envelope.json)

Stored on IPFS, contains metadata and wrapped key:

```typescript
interface MessageEnvelope {
  v: 1                          // Version
  msgId: string                 // keccak256 hash (0x...)
  from: string                  // Sender EVM address (0x...)
  to: string                    // Recipient EVM address (0x...)
  timestamp: number             // Unix timestamp
  subject?: string              // Optional subject (plaintext)
  
  // Encryption
  cek: string                   // Content Encryption Key (base64)
                                // Encrypted with ECDH shared secret
  nonce: string                 // XChaCha20 nonce (base64)
  
  // Content
  bodyCid: string               // IPFS CID of body.bin
  bodyHash: string              // SHA-256 of plaintext (0x...)
  format: 'markdown'            // Body format
  
  // Signature
  signature: string             // EIP-191 signature of canonical JSON (0x...)
}
```

### 3.2 Body (body.bin)

Raw encrypted bytes:

```
XChaCha20-Poly1305 ciphertext of markdown content
```

### 3.3 Encryption Flow

```typescript
async function encryptMessage(
  plaintext: string,
  recipientAddress: string,
  senderPrivateKey: Uint8Array
): Promise<{ envelope: MessageEnvelope, body: Uint8Array }> {
  
  // 1. Generate random content encryption key (CEK)
  const cek = sodium.randombytes_buf(32)
  
  // 2. Encrypt body with CEK
  const nonce = sodium.randombytes_buf(24)
  const body = sodium.crypto_secretbox_easy(
    new TextEncoder().encode(plaintext),
    nonce,
    cek
  )
  
  // 3. Derive recipient's public key
  const recipientPublicKey = await derivePublicKeyFromAddress(recipientAddress)
  
  // 4. Encrypt CEK with ECDH shared secret
  const sharedSecret = sodium.crypto_box_beforenm(
    recipientPublicKey,
    senderPrivateKey
  )
  const wrappedCek = sodium.crypto_secretbox_easy(cek, nonce, sharedSecret)
  
  // 5. Upload body to IPFS
  const bodyCid = await ipfs.add(body)
  
  // 6. Create envelope
  const envelope: MessageEnvelope = {
    v: 1,
    msgId: keccak256(bodyCid + timestamp),
    from: senderAddress,
    to: recipientAddress,
    timestamp: Date.now(),
    cek: base64Encode(wrappedCek),
    nonce: base64Encode(nonce),
    bodyCid: bodyCid,
    bodyHash: sha256(plaintext),
    format: 'markdown',
    signature: '' // Sign below
  }
  
  // 7. Sign envelope
  envelope.signature = await signEnvelope(envelope, senderPrivateKey)
  
  return { envelope, body }
}
```

### 3.4 Decryption Flow

```typescript
async function decryptMessage(
  envelope: MessageEnvelope,
  recipientPrivateKey: Uint8Array
): Promise<string> {
  
  // 1. Verify signature
  const isValid = await verifyEnvelopeSignature(envelope)
  if (!isValid) throw new Error('Invalid signature')
  
  // 2. Derive sender's public key
  const senderPublicKey = await derivePublicKeyFromAddress(envelope.from)
  
  // 3. Compute shared secret
  const sharedSecret = sodium.crypto_box_beforenm(
    senderPublicKey,
    recipientPrivateKey
  )
  
  // 4. Unwrap CEK
  const wrappedCek = base64Decode(envelope.cek)
  const nonce = base64Decode(envelope.nonce)
  const cek = sodium.crypto_secretbox_open_easy(wrappedCek, nonce, sharedSecret)
  
  // 5. Fetch body from IPFS
  const body = await ipfs.cat(envelope.bodyCid)
  
  // 6. Decrypt body
  const plaintext = sodium.crypto_secretbox_open_easy(body, nonce, cek)
  
  // 7. Verify hash
  const hash = sha256(plaintext)
  if (hash !== envelope.bodyHash) throw new Error('Hash mismatch')
  
  return new TextDecoder().decode(plaintext)
}
```

---

## 4. Smart Contract Specification

### 4.1 Contract: R3mailMailbox.sol

**Purpose:** Minimal on-chain notification system

**Functions:**

```solidity
function notifyMessage(
    bytes32 msgId,
    address to,
    string calldata envelopeCid
) external
```

**Events:**

```solidity
event MessageNotified(
    bytes32 indexed msgId,
    address indexed from,
    address indexed to,
    string envelopeCid,
    uint256 timestamp
)
```

**State:**

```solidity
mapping(address => uint256) public inboxCount
mapping(bytes32 => bool) public messageExists
```

### 4.2 Gas Costs (Estimated)

- `notifyMessage()`: ~50,000 gas (~$0.01 at 10 gwei)
- Event emission: Included above
- Storage: 2 SSTORE operations

### 4.3 Security

✅ **No private data on-chain** - Only CIDs and addresses  
✅ **Duplicate prevention** - `messageExists` mapping  
✅ **Minimal attack surface** - No complex logic  

---

## 5. Client Architecture

### 5.1 Package Structure

Reuse R3LAY packages:

```
packages/
├── r3lay-core/          # ✅ Reuse crypto primitives
│   ├── crypto/
│   │   ├── wallet-derivation.ts  # ✅ Already exists!
│   │   └── encryption.ts         # ✅ Already exists!
│   └── types/
│
├── r3lay-ipfs/          # ✅ Reuse storage
│   └── client.ts        # ✅ Already exists!
│
├── r3lay-chain/         # ✅ Reuse wallet integration
│   └── client.ts        # ✅ Already exists!
│
└── r3mail-core/         # 🆕 New package
    ├── envelope.ts      # Envelope creation/parsing
    ├── message.ts       # Message encryption/decryption
    └── types.ts         # R3MAIL-specific types
```

### 5.2 New Package: @r3mail/core

```typescript
// packages/r3mail-core/src/message.ts

import { deriveKeysFromWallet } from '@r3lay/core/crypto/wallet-derivation'
import { uploadToIPFS, downloadFromIPFS } from '@r3lay/ipfs'

export async function sendMessage(
  to: string,
  subject: string,
  body: string,
  senderAddress: string
): Promise<{ msgId: string, envelopeCid: string }> {
  
  // 1. Derive sender's keys
  const senderKeys = await deriveKeysFromWallet(senderAddress)
  
  // 2. Encrypt message
  const { envelope, encryptedBody } = await encryptMessage(
    body,
    to,
    senderKeys.privateKey
  )
  envelope.subject = subject
  
  // 3. Upload to IPFS
  const bodyCid = await uploadToIPFS(encryptedBody)
  envelope.bodyCid = bodyCid
  
  const envelopeCid = await uploadToIPFS(JSON.stringify(envelope))
  
  // 4. Notify on-chain
  const msgId = envelope.msgId
  await notifyMessageOnChain(msgId, to, envelopeCid)
  
  return { msgId, envelopeCid }
}

export async function receiveMessage(
  envelopeCid: string,
  recipientAddress: string
): Promise<{ subject: string, body: string, from: string }> {
  
  // 1. Fetch envelope
  const envelopeJson = await downloadFromIPFS(envelopeCid)
  const envelope = JSON.parse(envelopeJson)
  
  // 2. Derive recipient's keys
  const recipientKeys = await deriveKeysFromWallet(recipientAddress)
  
  // 3. Decrypt message
  const body = await decryptMessage(envelope, recipientKeys.privateKey)
  
  return {
    subject: envelope.subject || '(no subject)',
    body,
    from: envelope.from
  }
}
```

### 5.3 Event Subscription

```typescript
// Watch for new messages
import { watchContractEvent } from 'viem'

function watchInbox(recipientAddress: string, onMessage: (msg: any) => void) {
  return watchContractEvent({
    address: MAILBOX_CONTRACT_ADDRESS,
    abi: R3mailMailboxABI,
    eventName: 'MessageNotified',
    args: {
      to: recipientAddress
    },
    onLogs: async (logs) => {
      for (const log of logs) {
        const { msgId, from, envelopeCid, timestamp } = log.args
        
        // Fetch and decrypt
        const message = await receiveMessage(envelopeCid, recipientAddress)
        
        // Store in local DB
        await storeMessage({
          msgId,
          from,
          to: recipientAddress,
          subject: message.subject,
          body: message.body,
          timestamp,
          unread: true
        })
        
        // Notify UI
        onMessage({ msgId, from, subject: message.subject, timestamp })
      }
    }
  })
}
```

### 5.4 Local Database (IndexedDB)

```typescript
// Schema
interface StoredMessage {
  msgId: string          // Primary key
  from: string           // Sender address
  to: string             // Recipient address
  subject: string        // Subject line
  body: string           // Decrypted markdown
  timestamp: number      // Unix timestamp
  blockNumber: number    // Block number
  unread: boolean        // Read status
  archived: boolean      // Archive status
  envelopeCid: string    // IPFS CID
}

// Store name: 'messages'
// Indexes: 'from', 'to', 'timestamp', 'unread'
```

---

## 6. UI Components

### 6.1 Inbox View

```vue
<template>
  <div class="inbox">
    <!-- Header -->
    <div class="inbox-header">
      <h1>Inbox</h1>
      <Button @click="compose">New Message</Button>
    </div>
    
    <!-- Message List -->
    <div class="message-list">
      <MessageListItem
        v-for="msg in messages"
        :key="msg.msgId"
        :message="msg"
        @click="openMessage(msg)"
      />
    </div>
  </div>
</template>
```

### 6.2 Compose View

```vue
<template>
  <div class="compose">
    <Input v-model="to" placeholder="Recipient address (0x...)" />
    <Input v-model="subject" placeholder="Subject" />
    <MarkdownEditor v-model="body" />
    <Button @click="send" :disabled="sending">
      {{ sending ? 'Sending...' : 'Send' }}
    </Button>
  </div>
</template>
```

### 6.3 Message View

```vue
<template>
  <div class="message-view">
    <div class="message-header">
      <div class="from">From: {{ message.from }}</div>
      <div class="subject">{{ message.subject }}</div>
      <div class="timestamp">{{ formatDate(message.timestamp) }}</div>
    </div>
    <div class="message-body">
      <MarkdownRenderer :content="message.body" />
    </div>
  </div>
</template>
```

---

## 7. Code Reuse from R3LAY

### 7.1 Direct Reuse (No Changes)

✅ **Wallet Integration**
- `@r3lay/chain` - Wallet connection, network switching
- `useWalletConnect` composable

✅ **Key Derivation**
- `@r3lay/core/crypto/wallet-derivation.ts`
- `deriveKeysFromWallet()` function

✅ **IPFS Storage**
- `@r3lay/ipfs` - Upload/download
- Pinning strategies

✅ **Crypto Primitives**
- `@r3lay/core/crypto` - libsodium wrappers
- X25519, XChaCha20-Poly1305

### 7.2 Adaptations Needed

🔧 **Encryption Logic**
- R3LAY: One-to-many (per-follower keys)
- R3MAIL: One-to-one (ECDH shared secret)
- **Solution:** New `@r3mail/core` package

🔧 **Event Subscription**
- R3LAY: `PostPublished` events
- R3MAIL: `MessageNotified` events
- **Solution:** New event handler in client

🔧 **UI Components**
- R3LAY: Feed/post view
- R3MAIL: Inbox/message view
- **Solution:** New components in `apps/r3mail`

### 7.3 Estimated Code Reuse

- **70%** - Crypto, storage, wallet integration
- **20%** - Adapted for messaging
- **10%** - New R3MAIL-specific code

---

## 8. Implementation Timeline

### Week 1: Foundations

**Day 1-2: Smart Contract**
- [ ] Write R3mailMailbox.sol
- [ ] Write tests
- [ ] Deploy to Paseo Asset Hub
- [ ] Generate ABI

**Day 3-4: Core Package**
- [ ] Create `@r3mail/core` package
- [ ] Implement envelope.ts
- [ ] Implement message.ts (encryption/decryption)
- [ ] Write unit tests

**Day 5: Integration**
- [ ] Create `@r3mail/chain` wrapper
- [ ] Test end-to-end encryption
- [ ] Test event subscription

### Week 2: Client MVP

**Day 1-2: Inbox UI**
- [ ] Message list component
- [ ] Message view component
- [ ] IndexedDB integration
- [ ] Event listener setup

**Day 3-4: Compose UI**
- [ ] Compose form
- [ ] Markdown editor integration
- [ ] Send message flow
- [ ] Loading states

**Day 5: Polish**
- [ ] Wallet connection flow
- [ ] Error handling
- [ ] Loading states
- [ ] Responsive design

### Week 3: Testing

**Day 1-2: E2E Testing**
- [ ] Send message test
- [ ] Receive message test
- [ ] Multi-device test
- [ ] Edge cases

**Day 3-4: Security Review**
- [ ] Crypto audit
- [ ] Key derivation verification
- [ ] Signature verification
- [ ] IPFS pinning strategy

**Day 5: Bug Fixes**
- [ ] Fix critical bugs
- [ ] Performance optimization
- [ ] UX improvements

### Week 4: Release

**Day 1-2: Documentation**
- [ ] User guide
- [ ] Developer docs
- [ ] API reference
- [ ] Video tutorial

**Day 3-4: Deployment**
- [ ] Deploy to production
- [ ] Set up monitoring
- [ ] Create landing page

**Day 5: Launch**
- [ ] Announcement
- [ ] Community outreach
- [ ] Gather feedback

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
describe('Message Encryption', () => {
  it('should encrypt and decrypt message', async () => {
    const plaintext = 'Hello, World!'
    const { envelope, body } = await encryptMessage(plaintext, recipientAddr, senderKey)
    const decrypted = await decryptMessage(envelope, recipientKey)
    expect(decrypted).toBe(plaintext)
  })
  
  it('should derive same keys from same wallet', async () => {
    const keys1 = await deriveKeysFromWallet(address)
    const keys2 = await deriveKeysFromWallet(address)
    expect(keys1.publicKey).toEqual(keys2.publicKey)
  })
})
```

### 9.2 Integration Tests

```typescript
describe('End-to-End Message Flow', () => {
  it('should send and receive message', async () => {
    // Send
    const { msgId } = await sendMessage(
      recipientAddr,
      'Test Subject',
      'Test Body',
      senderAddr
    )
    
    // Wait for event
    await waitForEvent('MessageNotified', { msgId })
    
    // Receive
    const message = await receiveMessage(envelopeCid, recipientAddr)
    expect(message.subject).toBe('Test Subject')
    expect(message.body).toBe('Test Body')
  })
})
```

### 9.3 Manual Testing Checklist

- [ ] Connect MetaMask wallet
- [ ] Derive keys from signature
- [ ] Send message to another address
- [ ] Receive message in inbox
- [ ] Decrypt and read message
- [ ] Verify markdown rendering
- [ ] Test on different devices
- [ ] Test with different wallets (MetaMask, Talisman)

---

## 10. Security Considerations

### 10.1 Threat Model

**Threats:**
1. **Man-in-the-middle** - Attacker intercepts messages
2. **Impersonation** - Attacker sends fake messages
3. **Key compromise** - Attacker gets private key
4. **Replay attacks** - Attacker resends old messages

**Mitigations:**
1. ✅ E2E encryption (X25519 + XChaCha20-Poly1305)
2. ✅ Signature verification (EIP-191)
3. ✅ Wallet-based keys (no storage)
4. ✅ Message ID tracking (no duplicates)

### 10.2 Best Practices

✅ **Never store private keys** - Derive from wallet  
✅ **Verify all signatures** - Check sender authenticity  
✅ **Use authenticated encryption** - XChaCha20-Poly1305  
✅ **Hash verification** - Check content integrity  
✅ **Secure randomness** - Use crypto.getRandomValues()  

### 10.3 Known Limitations

⚠️ **No forward secrecy** - Same keys for all messages  
⚠️ **No deniability** - Signatures are non-repudiable  
⚠️ **Metadata visible** - Sender/recipient addresses on-chain  
⚠️ **IPFS availability** - Messages depend on pinning  

---

## 11. Future Enhancements (Post-MVP)

### Phase 2 Features

1. **On-Chain Key Registry** (optional)
   - Allow users to publish keys on-chain
   - Fallback for non-deterministic keys

2. **Message Threading**
   - Reply-to references
   - Conversation view

3. **Attachments**
   - File encryption
   - Image previews

4. **Search & Filters**
   - Full-text search
   - Filter by sender
   - Archive management

### Phase 3 Features

5. **Group Messaging**
   - Leverage R3LAY broadcast
   - Hybrid approach

6. **Push Notifications**
   - Optional push server
   - Privacy-preserving

7. **Backup & Sync**
   - Encrypted backup to IPFS
   - Multi-device sync

8. **Spam Protection**
   - Allowlist/blocklist
   - Proof-of-work for strangers

---

## 12. Success Metrics

### MVP Launch Goals

- [ ] **100 messages** sent in first week
- [ ] **50 unique users** (25 sender/recipient pairs)
- [ ] **<2 second** message delivery time
- [ ] **99%** decryption success rate
- [ ] **0 critical bugs** in first month

### Technical Metrics

- [ ] **<50,000 gas** per message notification
- [ ] **<500 KB** average message size
- [ ] **<1 second** encryption time
- [ ] **<1 second** decryption time
- [ ] **100%** signature verification

---

## 13. Deployment Checklist

### Pre-Deployment

- [ ] Smart contract audited
- [ ] All tests passing
- [ ] Documentation complete
- [ ] User guide written
- [ ] Video tutorial recorded

### Deployment

- [ ] Deploy contract to Paseo Asset Hub
- [ ] Verify contract on block explorer
- [ ] Update client config with contract address
- [ ] Deploy client to production
- [ ] Set up monitoring

### Post-Deployment

- [ ] Announce on social media
- [ ] Create demo video
- [ ] Gather user feedback
- [ ] Monitor for issues
- [ ] Plan next iteration

---

## Conclusion

R3MAIL MVP is **implementation-ready** with:

✅ **Clear architecture** - Wallet-based keys + EVM  
✅ **70% code reuse** - Leverage R3LAY packages  
✅ **4-week timeline** - Realistic and achievable  
✅ **Minimal scope** - Focus on core messaging  
✅ **Security-first** - E2E encryption + signatures  

**Next step:** Start Week 1, Day 1 - Deploy smart contract! 🚀
