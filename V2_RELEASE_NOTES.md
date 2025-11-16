# R3LAY V2 Release Notes

## 🎉 Major Features

### **1. On-Chain Subscription Management**
The biggest change in V2 is moving from local storage to blockchain-based subscriptions.

**What Changed:**
- ❌ **V1**: Subscriptions stored in localStorage
- ✅ **V2**: Subscriptions managed on-chain via smart contract

**Benefits:**
- Creators can approve/reject followers
- Follower public keys stored on-chain
- Follower count tracking
- Revocable access
- Channel activation/deactivation

**Contract Address:**
```
0x2E99f68A01f0f5F149400eB15A634C22A047A978
Network: Passet Hub Testnet (420420422)
Explorer: https://blockscout-passet-hub.parity-testnet.parity.io
```

---

### **2. Wallet-Based Key Derivation**
No more storing private keys in the browser!

**What Changed:**
- ❌ **V1**: Keys generated and stored in IndexedDB
- ✅ **V2**: Keys derived from wallet signatures

**How It Works:**
1. Connect MetaMask or Talisman
2. Sign a message (no gas, no transaction)
3. Keys derived from signature
4. Same keys every time with same wallet

**Benefits:**
- 🔐 Hardware wallet security (Ledger/Trezor)
- 🔄 Multi-device sync
- 💾 No backup needed (wallet is backup)
- 🚫 No key storage in browser
- ✅ Works with MetaMask & Talisman

---

### **3. Improved Subscription Flow**

**For Followers:**
```
1. Discover channels → Scan blockchain
2. Request access → Send transaction
3. Wait for approval → Status: "Pending"
4. Get approved → Status: "Subscribed"
5. Read posts → Decrypt with your keys
```

**For Creators:**
```
1. Receive requests → View in dashboard
2. Review followers → See addresses
3. Approve/reject → One-click action
4. Manage subscribers → Revoke if needed
5. Track metrics → Follower count
```

---

### **4. Post Decryption Working**
Fixed the complex hybrid encryption decryption.

**What Changed:**
- ❌ **V1**: Decryption broken/incomplete
- ✅ **V2**: Full decryption working

**How It Works:**
1. Post encrypted with random key (K_msg)
2. K_msg encrypted for each approved follower
3. Follower decrypts K_msg with their private key
4. Follower decrypts content with K_msg
5. Post displays!

---

## 🔧 Technical Improvements

### **Smart Contract V2**
```solidity
// New functions
requestSubscription(channelId, followerPublicKey)
processSubscription(channelId, follower, approved)
revokeSubscription(channelId, follower)
batchProcessSubscriptions(channelId, followers[], approvals[])
deactivateChannel(channelId)
reactivateChannel(channelId)

// New state
mapping(channelId => followerCount)
mapping(channelId => channelActive)
mapping(channelId => approvedFollowers)
```

### **New Composables**
```typescript
// Wallet derivation
initializeCreatorFromWallet(walletAddress)
initializeFollowerFromWallet(walletAddress)
detectWallet() // 'metamask' | 'talisman' | 'unknown'

// Post decryption
decryptPostAsCreator(bundle)
decryptPostAsFollower(bundle)

// Subscription management
requestSubscription(channelId, publicKey)
processSubscription(channelId, follower, approved)
getApprovedFollowers(channelId)
getPendingRequests(channelId)
```

### **UI Updates**
- ✅ Creator dashboard: Shows subscriber count
- ✅ Subscribers page: Approve/reject interface
- ✅ Discover page: Request subscription button
- ✅ Posts page: Loads from blockchain + IPFS
- ✅ Channel page: Proper post decryption

---

## 🚀 Getting Started

### **For Creators**

1. **Connect Wallet**
   ```
   Click "Connect Wallet" → Select MetaMask/Talisman
   ```

2. **Initialize Identity**
   ```
   Dashboard → "Use [Wallet] Keys" → Sign message
   ```

3. **Create Channel**
   ```
   Dashboard → "Create Channel" → Fill details → Approve tx
   ```

4. **Publish Post**
   ```
   New Post → Write content → Publish → Approve tx
   ```

5. **Manage Subscribers**
   ```
   Subscribers → View requests → Approve/Reject
   ```

### **For Followers**

1. **Connect Wallet**
   ```
   Click "Connect Wallet" → Select MetaMask/Talisman
   ```

2. **Initialize Identity**
   ```
   Dashboard → "Use [Wallet] Keys" → Sign message
   ```

3. **Discover Channels**
   ```
   Discover → "Scan Blockchain" → Find channels
   ```

4. **Request Subscription**
   ```
   Find channel → "Request Access" → Approve tx
   ```

5. **Read Posts**
   ```
   Wait for approval → View channel → Read posts
   ```

---

## 🔄 Migration from V1

### **If You Used V1:**

**Your Old Keys:**
- Still in IndexedDB
- Can export if needed
- Not automatically migrated

**Recommended:**
1. Use wallet-based keys (more secure)
2. Re-subscribe to channels
3. Creators: Re-approve followers

**Data Loss:**
- Old localStorage subscriptions not migrated
- Old posts still in IPFS (accessible with keys)
- Channel data on old contract (if any)

---

## 📊 Contract Comparison

| Feature | V1 | V2 |
|---------|----|----|
| **Subscription Storage** | localStorage | On-chain |
| **Approval Flow** | ❌ None | ✅ Yes |
| **Public Key Storage** | ❌ Off-chain | ✅ On-chain |
| **Follower Count** | ❌ No | ✅ Yes |
| **Revocation** | ❌ No | ✅ Yes |
| **Batch Operations** | ❌ No | ✅ Yes |
| **Channel Deactivation** | ❌ No | ✅ Yes |

---

## 🐛 Known Issues

### **TypeScript Warnings**
- `window.ethereum` type errors → Safe to ignore
- `.ts` extension warnings → Safe to ignore
- These are build-time only, runtime works fine

### **Performance**
- IPFS uploads can be slow (use local node)
- First blockchain scan takes time
- Transaction confirmations ~12 seconds

### **Limitations**
- One channel per wallet (V3 will support multiple)
- No channel transfer yet (V3 feature)
- No paid subscriptions yet (V3 feature)

---

## 🔮 Roadmap (V3)

See `/docs/CONTRACT_ROADMAP_V3.md` for details:

- 💰 Paid subscriptions
- 🔄 Channel transfer/ownership
- 📊 Subscription tiers
- ⏰ Time-based subscriptions
- 🎁 Referral system
- 🏷️ Channel categories
- 👥 Multi-creator channels
- 🛡️ Content moderation

---

## 📚 Documentation

- **Testing Guide**: `/TESTING_GUIDE.md`
- **Contract Roadmap**: `/docs/CONTRACT_ROADMAP_V3.md`
- **Channel Architecture**: `/docs/CHANNEL_ARCHITECTURE.md`
- **Implementation Status**: `/IMPLEMENTATION_STATUS.md`

---

## 🙏 Credits

Built with:
- **Solidity** - Smart contracts
- **Nuxt 3** - Frontend framework
- **Viem** - Ethereum library
- **libsodium** - Encryption
- **IPFS** - Decentralized storage
- **Passet Hub** - Polkadot Asset Hub testnet

---

## 📝 Changelog

### V2.0.0 (2024-11-15)

**Added:**
- On-chain subscription management
- Wallet-based key derivation
- MetaMask & Talisman support
- Approval/rejection flow
- Subscriber management dashboard
- Post decryption working
- Follower count tracking
- Channel activation/deactivation
- Batch operations

**Changed:**
- Contract deployed to new address
- Subscriptions now on-chain
- Keys derived from wallet (optional)
- Posts page loads from blockchain

**Fixed:**
- Post decryption now works
- Dashboard shows real data
- Network switching improved
- Error handling better

**Removed:**
- localStorage subscription storage (deprecated)

---

**Version**: 2.0.0  
**Released**: November 15, 2024  
**Contract**: 0x2E99f68A01f0f5F149400eB15A634C22A047A978  
**Network**: Passet Hub Testnet (420420422)

🎉 **Ready to test!** Follow the [Testing Guide](./TESTING_GUIDE.md)
