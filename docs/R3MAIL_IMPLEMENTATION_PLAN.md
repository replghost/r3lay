# R3MAIL MVP — Engineering Implementation Plan

**Version:** 2.0 (Updated with wallet-based keys + EVM)  
**Timeline:** 4 weeks  
**Code Reuse:** 70% from R3LAY

---

## 1. Overview

R3MAIL is an encrypted, wallet-based, one-to-one messaging protocol built on Paseo Asset Hub EVM. This plan leverages existing R3LAY infrastructure for rapid development.

### Key Decisions

✅ **Wallet-based key derivation** - Same as R3LAY, no on-chain registry  
✅ **EVM addresses** - 0x format, not SS58  
✅ **70% code reuse** - Leverage @r3lay packages  
✅ **4-week timeline** - MVP launch ready  

---

## 2. Architecture Diagram

```
┌─────────────┐                    ┌──────────────┐
│   Sender    │                    │  Recipient   │
│   Wallet    │                    │   Wallet     │
└──────┬──────┘                    └──────┬───────┘
       │                                  │
       │ Derive keys                      │ Derive keys
       │ (wallet signature)               │ (wallet signature)
       ▼                                  ▼
┌─────────────────────────────────────────────────┐
│           R3MAIL Client (Nuxt 3)                │
│                                                 │
│  Compose UI  ←→  Crypto  ←→  Inbox UI          │
│                    ↓                            │
│                  IPFS                           │
└─────────────────────────────────────────────────┘
       │                                  ▲
       │ notifyMessage()                  │ Watch events
       ▼                                  │
┌─────────────────────────────────────────────────┐
│      Paseo Asset Hub EVM (Chain ID: 420429638) │
│                                                 │
│  R3mailMailbox.sol                              │
│  - notifyMessage(msgId, to, envelopeCid)        │
│  - emit MessageNotified event                   │
└─────────────────────────────────────────────────┘
```

---

## 3. Component Breakdown

### 3.1 Smart Contract (R3mailMailbox.sol)

**Location:** `/contracts/r3mail-mailbox/src/R3mailMailbox.sol`

**Functions:**
```solidity
function notifyMessage(bytes32 msgId, address to, string calldata envelopeCid)
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

**Gas Cost:** ~50,000 gas per message

### 3.2 Crypto Module

**Reuse from R3LAY:**
- ✅ `@r3lay/core/crypto/wallet-derivation.ts` - Key derivation
- ✅ `@r3lay/core/crypto/encryption.ts` - libsodium wrappers

**New in @r3mail/core:**
- 🆕 `envelope.ts` - Envelope creation/parsing
- 🆕 `message.ts` - One-to-one encryption (ECDH)

**Algorithms:**
- X25519 (key exchange)
- XChaCha20-Poly1305 (authenticated encryption)
- SHA-256 (content hashing)
- EIP-191 (signature)

### 3.3 Storage Module

**Reuse from R3LAY:**
- ✅ `@r3lay/ipfs` - Upload/download/pinning

**Format:**
- `envelope.json` - Metadata + wrapped key
- `body.bin` - Encrypted markdown

### 3.4 Chain Integration

**Reuse from R3LAY:**
- ✅ `@r3lay/chain` - Wallet connection, network switching
- ✅ `useWalletConnect` composable

**New:**
- 🆕 R3mailMailbox ABI
- 🆕 Event subscription for MessageNotified

### 3.5 Client App

**Location:** `/apps/r3mail`

**UI Components:**
- Inbox view (message list)
- Message view (markdown rendering)
- Compose view (markdown editor)
- Wallet connection

**State Management:**
- IndexedDB for local messages
- Reactive inbox updates
- Event-driven architecture

### 3.6 Local Database (IndexedDB)

**Store:** `r3mail_messages`

**Schema:**
```typescript
interface StoredMessage {
  msgId: string          // Primary key
  from: string           // Sender EVM address
  to: string             // Recipient EVM address
  subject: string        // Subject line
  body: string           // Decrypted markdown
  timestamp: number      // Unix timestamp
  blockNumber: number    // Block number
  unread: boolean        // Read status
  archived: boolean      // Archive status
  envelopeCid: string    // IPFS CID
}
```

**Indexes:**
- `from` - Filter by sender
- `to` - Filter by recipient
- `timestamp` - Sort by date
- `unread` - Filter unread

---

## 4. Detailed Phase Plan

### **Week 1: Foundations** 🏗️

#### Day 1-2: Smart Contract
- [x] Write R3mailMailbox.sol *(Done!)*
- [ ] Write Foundry tests
- [ ] Deploy to Paseo Asset Hub
- [ ] Verify on block explorer
- [ ] Generate ABI
- [ ] Save contract address

**Deliverable:** Deployed contract + ABI

#### Day 3-4: Core Package
- [ ] Create `packages/r3mail-core` directory
- [ ] Set up package.json
- [ ] Implement `envelope.ts`
  - createEnvelope()
  - signEnvelope()
  - verifyEnvelope()
- [ ] Implement `message.ts`
  - encryptMessage() (ECDH + XChaCha20)
  - decryptMessage()
  - derivePublicKeyFromAddress()
- [ ] Write unit tests
- [ ] Test with R3LAY crypto module

**Deliverable:** @r3mail/core package

#### Day 5: Integration
- [ ] Create `packages/r3mail-chain` wrapper
- [ ] Implement notifyMessage() call
- [ ] Implement event subscription
- [ ] Test end-to-end encryption
- [ ] Test key derivation

**Deliverable:** Working E2E encryption

---

### **Week 2: Client MVP** 🎨

#### Day 1-2: Inbox UI
- [ ] Create inbox page (`/apps/r3mail/pages/inbox.vue`)
- [ ] Message list component
- [ ] Message preview component
- [ ] Unread badge
- [ ] Loading states
- [ ] Empty state
- [ ] IndexedDB integration
- [ ] Event listener setup

**Deliverable:** Working inbox view

#### Day 3-4: Compose UI
- [ ] Create compose page (`/apps/r3mail/pages/compose.vue`)
- [ ] Recipient address input
- [ ] Subject input
- [ ] Markdown editor integration
- [ ] Preview mode
- [ ] Send button + loading state
- [ ] Error handling
- [ ] Success feedback

**Deliverable:** Working compose view

#### Day 5: Message View & Polish
- [ ] Create message view page (`/apps/r3mail/pages/message/[id].vue`)
- [ ] Markdown rendering
- [ ] Sender info display
- [ ] Timestamp formatting
- [ ] Mark as read
- [ ] Archive button
- [ ] Reply button (future)
- [ ] Responsive design
- [ ] Dark mode support

**Deliverable:** Complete UI flow

---

### **Week 3: Testing & Polish** 🧪

#### Day 1-2: E2E Testing
- [ ] Set up test accounts
- [ ] Test send message flow
  - Connect wallet
  - Derive keys
  - Compose message
  - Send + notify
- [ ] Test receive message flow
  - Watch events
  - Fetch envelope
  - Decrypt message
  - Display in inbox
- [ ] Test multi-device
  - Same keys on different browsers
  - Message sync
- [ ] Test edge cases
  - Invalid addresses
  - Malformed envelopes
  - Network errors

**Deliverable:** Test report

#### Day 3-4: Security Review
- [ ] Crypto audit
  - Key derivation verification
  - Encryption algorithm review
  - Signature verification
- [ ] Code review
  - Input validation
  - Error handling
  - XSS prevention
- [ ] IPFS pinning strategy
  - Ensure message availability
  - Test pinning services
- [ ] Gas optimization
  - Minimize contract calls
  - Batch operations

**Deliverable:** Security report

#### Day 5: Bug Fixes & Optimization
- [ ] Fix critical bugs
- [ ] Performance optimization
  - Lazy loading
  - Caching
  - Bundle size
- [ ] UX improvements
  - Loading indicators
  - Error messages
  - Success feedback
- [ ] Accessibility
  - Keyboard navigation
  - Screen reader support

**Deliverable:** Production-ready app

---

### **Week 4: Documentation & Release** 📚

#### Day 1-2: Documentation
- [ ] User guide
  - Getting started
  - Sending messages
  - Reading messages
  - Troubleshooting
- [ ] Developer docs
  - Architecture overview
  - API reference
  - Integration guide
- [ ] Video tutorial
  - Screen recording
  - Voiceover
  - Upload to YouTube

**Deliverable:** Complete documentation

#### Day 3-4: Deployment
- [ ] Deploy contract to production (if not already)
- [ ] Deploy client to Vercel/Netlify
- [ ] Set up monitoring
  - Error tracking (Sentry)
  - Analytics (Plausible)
- [ ] Create landing page
- [ ] Set up domain

**Deliverable:** Live production app

#### Day 5: Launch 🚀
- [ ] Announcement tweet
- [ ] Post on Reddit (r/polkadot, r/web3)
- [ ] Share in Discord communities
- [ ] Create demo video
- [ ] Gather feedback
- [ ] Plan next iteration

**Deliverable:** Public launch!

---

## 5. Code Reuse Map

### From R3LAY (70% reuse)

| R3LAY Package | R3MAIL Usage | Changes Needed |
|---------------|--------------|----------------|
| `@r3lay/core/crypto/wallet-derivation.ts` | ✅ Direct reuse | None |
| `@r3lay/core/crypto/encryption.ts` | ✅ Direct reuse | None |
| `@r3lay/ipfs` | ✅ Direct reuse | None |
| `@r3lay/chain` | ✅ Direct reuse | Add R3mail ABI |
| `useWalletConnect` | ✅ Direct reuse | None |
| Nuxt UI components | ✅ Adapt | New layouts |

### New for R3MAIL (30% new)

| Component | Purpose | Estimated LOC |
|-----------|---------|---------------|
| `@r3mail/core` | Message encryption | ~500 |
| R3mailMailbox.sol | Smart contract | ~100 |
| Inbox UI | Message list | ~300 |
| Compose UI | Message editor | ~200 |
| Message view | Display message | ~150 |
| Event subscription | Watch chain | ~100 |

**Total new code:** ~1,350 LOC  
**Total reused code:** ~3,000 LOC  
**Reuse ratio:** 70%

---

## 6. Dependencies

### Smart Contract
- Solidity 0.8.28
- Foundry (forge, cast)
- Paseo Asset Hub EVM

### Packages
- @r3lay/core (existing)
- @r3lay/ipfs (existing)
- @r3lay/chain (existing)
- libsodium-wrappers
- viem
- nuxt 3

### Client
- Nuxt 3
- Shadcn Vue
- TailwindCSS 4
- markdown-it (markdown rendering)
- IndexedDB (local storage)

---

## 7. Deliverables Checklist

### Smart Contract
- [x] R3mailMailbox.sol written
- [ ] Tests written
- [ ] Deployed to testnet
- [ ] ABI generated
- [ ] Contract verified

### Packages
- [ ] @r3mail/core package
- [ ] @r3mail/chain wrapper
- [ ] Unit tests
- [ ] Integration tests

### Client
- [ ] Inbox view
- [ ] Compose view
- [ ] Message view
- [ ] Wallet integration
- [ ] Event subscription
- [ ] IndexedDB storage

### Documentation
- [ ] User guide
- [ ] Developer docs
- [ ] API reference
- [ ] Video tutorial

### Deployment
- [ ] Contract deployed
- [ ] Client deployed
- [ ] Monitoring set up
- [ ] Landing page

---

## 8. Success Metrics

### MVP Launch Goals
- [ ] 100 messages sent in first week
- [ ] 50 unique users
- [ ] <2 second message delivery
- [ ] 99% decryption success rate
- [ ] 0 critical bugs

### Technical Metrics
- [ ] <50,000 gas per message
- [ ] <500 KB average message size
- [ ] <1 second encryption time
- [ ] <1 second decryption time
- [ ] 100% signature verification

---

## 9. Risk Mitigation

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| IPFS availability | High | Use multiple pinning services |
| Key derivation fails | High | Extensive testing, fallback UI |
| Gas costs too high | Medium | Optimize contract, batch operations |
| Event subscription fails | Medium | Polling fallback |

### Timeline Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep | High | Strict MVP scope, defer features |
| Testing delays | Medium | Start testing early, parallel work |
| Deployment issues | Medium | Test deployment early |

---

## 10. Future Enhancements (Post-MVP)

### Phase 2 (Month 2)
- Message threading
- Attachments
- Search & filters
- Archive management

### Phase 3 (Month 3)
- Group messaging (leverage R3LAY)
- Push notifications
- Backup & sync
- Spam protection

### Phase 4 (Month 4+)
- Mobile app
- Browser extension
- ENS integration
- Cross-chain messaging

---

## 11. Next Steps

**Immediate actions:**

1. ✅ Review this plan
2. ✅ Approve architecture decisions
3. ⏭️ Start Week 1, Day 1: Test smart contract
4. ⏭️ Deploy to Paseo Asset Hub
5. ⏭️ Generate ABI

**Ready to build!** 🚀
