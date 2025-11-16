# R3LAY V2 Testing Guide

## 🎯 What's New in V2

### **Smart Contract V2**
- ✅ On-chain subscription management
- ✅ Follower approval system
- ✅ Public key storage
- ✅ Follower count tracking
- ✅ Channel activation/deactivation
- ✅ Batch operations

### **Wallet-Based Key Derivation**
- ✅ MetaMask support
- ✅ Talisman support
- ✅ Deterministic key generation
- ✅ No key storage needed
- ✅ Multi-device sync

### **UI Improvements**
- ✅ Subscription request flow
- ✅ Approval dashboard for creators
- ✅ Post decryption working
- ✅ Dashboard improvements

---

## 🧪 Test Plan

### **Phase 1: Wallet Connection & Key Derivation**

#### Test 1.1: MetaMask Connection
```
1. Open http://localhost:3005
2. Click "Connect Wallet" in header
3. Select MetaMask
4. Approve connection
✅ Verify: Wallet address shown in header
✅ Verify: Network is Passet Hub (420420422)
```

#### Test 1.2: Talisman Connection
```
1. Open http://localhost:3005
2. Click "Connect Wallet" in header
3. Select Talisman (EVM account)
4. Approve connection
✅ Verify: Wallet address shown in header
✅ Verify: Network is Passet Hub (420420422)
```

#### Test 1.3: Creator Key Derivation (MetaMask)
```
1. Navigate to /creator
2. Click "Use MetaMask Keys"
3. Sign the message in MetaMask popup
4. Wait for confirmation
✅ Verify: "Keys derived from wallet!" message
✅ Verify: Identity card shows "Active"
✅ Verify: Public key displayed
✅ Verify: Same keys on page refresh (sign again)
```

#### Test 1.4: Creator Key Derivation (Talisman)
```
1. Navigate to /creator
2. Click "Use Talisman Keys"
3. Sign the message in Talisman popup
4. Wait for confirmation
✅ Verify: "Keys derived from wallet!" message
✅ Verify: Identity card shows "Active"
✅ Verify: Public key displayed
```

#### Test 1.5: Follower Key Derivation
```
1. Navigate to /follower
2. Click "Use [Wallet] Keys"
3. Sign the message in wallet popup
4. Wait for confirmation
✅ Verify: Identity shows "Active"
✅ Verify: Public key displayed
✅ Verify: Can copy public key
```

---

### **Phase 2: Channel Creation**

#### Test 2.1: Create Channel
```
1. Navigate to /creator
2. Verify identity is active
3. Click "Create Channel" (if no channel)
4. Fill in channel details:
   - Name: "Test Newsletter"
   - Description: "Testing R3LAY V2"
5. Click "Create Channel"
6. Approve transaction in wallet
✅ Verify: Transaction succeeds
✅ Verify: Channel card shows "Active"
✅ Verify: Shows "0 subscribers"
```

#### Test 2.2: Channel Already Exists
```
1. Try to create another channel
✅ Verify: Error message about existing channel
✅ Verify: No transaction sent
```

---

### **Phase 3: Subscription Flow**

#### Test 3.1: Discover Channels (Follower)
```
1. Open in DIFFERENT browser/profile (or use incognito)
2. Connect wallet (different address)
3. Initialize follower identity
4. Navigate to /follower/discover
5. Click "Scan Blockchain"
✅ Verify: Finds the test channel
✅ Verify: Shows channel name
✅ Verify: Shows creator address
```

#### Test 3.2: Request Subscription
```
1. On discover page, find test channel
2. Click "Request Access"
3. Approve transaction
✅ Verify: Button changes to "Pending Approval"
✅ Verify: Transaction succeeds
✅ Verify: Status persists on refresh
```

#### Test 3.3: View Pending Requests (Creator)
```
1. Switch back to creator browser
2. Navigate to /creator/subscribers
✅ Verify: Shows 1 pending request
✅ Verify: Shows follower address
✅ Verify: Shows request timestamp
```

#### Test 3.4: Approve Subscription
```
1. On subscribers page
2. Click "Approve" for the request
3. Approve transaction
✅ Verify: Request moves to "Approved Subscribers"
✅ Verify: Subscriber count increases to 1
✅ Verify: Dashboard shows "1 subscribers"
```

#### Test 3.5: Verify Approval (Follower)
```
1. Switch to follower browser
2. Navigate to /follower/discover
3. Find the channel
✅ Verify: Button shows "Subscribed"
✅ Verify: Status is "approved"
```

---

### **Phase 4: Post Publishing & Reading**

#### Test 4.1: Publish Post (Creator)
```
1. Navigate to /creator/post/new
2. Fill in post details:
   - Title: "Test Post V2"
   - Content: "Testing on-chain subscriptions!"
3. Click "Publish"
4. Approve transaction
✅ Verify: Post published successfully
✅ Verify: Redirects to posts page
✅ Verify: Post appears in list
```

#### Test 4.2: View Own Post (Creator)
```
1. On /creator/posts
2. Click on the test post
3. Wait for decryption
✅ Verify: Post content displays
✅ Verify: Title and content match
✅ Verify: No decryption errors
```

#### Test 4.3: Read Post (Follower)
```
1. Switch to follower browser
2. Navigate to /follower/discover
3. Click "View" on subscribed channel
4. Click on the post
5. Wait for decryption
✅ Verify: Post decrypts successfully
✅ Verify: Content displays correctly
✅ Verify: No authorization errors
```

#### Test 4.4: Unauthorized Access
```
1. Open THIRD browser/profile
2. Connect wallet (different address)
3. Initialize follower (don't subscribe)
4. Navigate to channel directly
5. Try to view post
✅ Verify: Decryption fails
✅ Verify: Error message about not being authorized
```

---

### **Phase 5: Subscription Management**

#### Test 5.1: Reject Subscription
```
1. Have another follower request subscription
2. On /creator/subscribers
3. Click "Reject" for the request
4. Approve transaction
✅ Verify: Request is processed
✅ Verify: Not added to approved list
✅ Verify: Follower sees "Rejected" status
```

#### Test 5.2: Revoke Access
```
1. On /creator/subscribers
2. Find approved subscriber
3. Click "Revoke"
4. Confirm in dialog
5. Approve transaction
✅ Verify: Subscriber removed from approved list
✅ Verify: Subscriber count decreases
✅ Verify: Follower can't decrypt new posts
```

#### Test 5.3: Batch Operations
```
1. Have multiple followers request
2. Use batch approve/reject
✅ Verify: Multiple processed in one transaction
✅ Verify: Gas savings vs individual
```

---

### **Phase 6: Multi-Device Sync**

#### Test 6.1: Same Wallet, Different Device
```
1. On Device A: Derive keys from wallet
2. Note the public key
3. On Device B: Connect same wallet
4. Derive keys from wallet
5. Note the public key
✅ Verify: Public keys match exactly
✅ Verify: Can decrypt same posts
✅ Verify: Same channel access
```

#### Test 6.2: Key Persistence
```
1. Derive keys from wallet
2. Close browser
3. Reopen and reconnect wallet
4. Derive keys again
✅ Verify: Same keys generated
✅ Verify: No data loss
```

---

### **Phase 7: Error Handling**

#### Test 7.1: Signature Rejection
```
1. Try to derive keys
2. Reject signature in wallet
✅ Verify: Clear error message
✅ Verify: Can retry
✅ Verify: No broken state
```

#### Test 7.2: Network Issues
```
1. Disconnect internet
2. Try to publish post
✅ Verify: Appropriate error message
✅ Verify: Can retry when reconnected
```

#### Test 7.3: Wrong Network
```
1. Switch wallet to different network
2. Try to create channel
✅ Verify: Prompted to switch network
✅ Verify: Transaction only on correct network
```

---

## 🐛 Known Issues

### TypeScript Warnings
- `window.ethereum` type warnings - **Safe to ignore**, works at runtime
- `.ts` extension warnings - **Safe to ignore**, Vite handles it

### Potential Issues
- **IPFS Gateway**: May be slow, use local node for better performance
- **Gas Estimation**: May fail if channel already exists
- **Session Storage**: Keys cached in session, re-sign after browser restart

---

## 📊 Success Criteria

### Must Pass
- ✅ Wallet connection works (MetaMask & Talisman)
- ✅ Key derivation is deterministic
- ✅ Subscription request flow works
- ✅ Approval/rejection works
- ✅ Post encryption/decryption works
- ✅ Only approved followers can decrypt

### Should Pass
- ✅ Multi-device sync works
- ✅ Error messages are clear
- ✅ UI is responsive
- ✅ No console errors

### Nice to Have
- ✅ Fast IPFS uploads
- ✅ Quick transaction confirmations
- ✅ Smooth animations

---

## 🔧 Debugging Tips

### Check Console Logs
```javascript
// Look for these messages
"Deriving keys from wallet..."
"Keys derived successfully from wallet"
"Subscription request sent!"
"Post published successfully"
```

### Check IndexedDB
```
1. F12 → Application → IndexedDB
2. r3lay_keystore → creator_keys/follower_keys
3. Verify keys are stored (if using generated keys)
```

### Check Contract State
```
1. Visit BlockScout
2. Search for contract: 0x2E99f68A01f0f5F149400eB15A634C22A047A978
3. Read Contract → Check:
   - channelExists(channelId)
   - approvedFollowers(channelId, followerAddress)
   - followerCount(channelId)
```

### Check IPFS
```
1. Note the CID from post
2. Visit: https://ipfs.io/ipfs/[CID]
3. Verify encrypted content is there
```

---

## 🚀 Quick Start Test Script

```bash
# Terminal 1: Start dev server
cd apps/r3lay
bun run dev -p 3005

# Terminal 2: Open browsers
open http://localhost:3005  # Creator
open http://localhost:3005 --args --incognito  # Follower

# Follow Phase 1-4 tests above
```

---

## 📝 Test Results Template

```markdown
## Test Results - [Date]

### Environment
- Browser: [Chrome/Firefox/Safari]
- Wallet: [MetaMask/Talisman]
- Network: Passet Hub Testnet

### Phase 1: Wallet & Keys
- [ ] 1.1 MetaMask Connection
- [ ] 1.2 Talisman Connection  
- [ ] 1.3 Creator Key Derivation (MetaMask)
- [ ] 1.4 Creator Key Derivation (Talisman)
- [ ] 1.5 Follower Key Derivation

### Phase 2: Channel Creation
- [ ] 2.1 Create Channel
- [ ] 2.2 Channel Already Exists

### Phase 3: Subscription Flow
- [ ] 3.1 Discover Channels
- [ ] 3.2 Request Subscription
- [ ] 3.3 View Pending Requests
- [ ] 3.4 Approve Subscription
- [ ] 3.5 Verify Approval

### Phase 4: Posts
- [ ] 4.1 Publish Post
- [ ] 4.2 View Own Post
- [ ] 4.3 Read Post (Follower)
- [ ] 4.4 Unauthorized Access

### Phase 5: Management
- [ ] 5.1 Reject Subscription
- [ ] 5.2 Revoke Access

### Phase 6: Multi-Device
- [ ] 6.1 Same Wallet, Different Device
- [ ] 6.2 Key Persistence

### Phase 7: Errors
- [ ] 7.1 Signature Rejection
- [ ] 7.2 Network Issues
- [ ] 7.3 Wrong Network

### Issues Found
[List any issues here]

### Notes
[Any additional observations]
```

---

**Ready to test! Start with Phase 1 and work through each phase.** 🧪
