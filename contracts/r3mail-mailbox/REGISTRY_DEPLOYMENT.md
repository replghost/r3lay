# R3MAIL Public Key Registry Deployment

## 🎉 Deployment Complete!

**Contract Address:** `0x10c261B9647D93215e82207FaBb4Efb009c91c6F`  
**Network:** Paseo Asset Hub Testnet  
**Chain ID:** 420429638  
**Transaction:** `0x7569d80410612e93a7f921635866d04bea85b09121532c69fade1c174637b29a`

## 📋 New Features

### Smart Contract
- ✅ `registerPublicKey(bytes32)` - Register your X25519 public key
- ✅ `getPublicKey(address)` - Get a user's registered public key
- ✅ `hasPublicKey(address)` - Check if user has registered
- ✅ `publicKeys(address)` - Direct mapping access
- ✅ `PublicKeyRegistered` event - Emitted on registration

### Frontend Integration
- ✅ "Register Public Key" button in inbox
- ✅ Auto-check registration status on connect
- ✅ Fetch recipient public key from registry when sending
- ✅ Error if recipient hasn't registered

## 🚀 How to Use

### 1. Register Your Public Key (One-Time)
```typescript
// Automatically done via UI button
await wallet.registerPublicKey()
```

### 2. Send Encrypted Messages
```typescript
// System automatically:
// 1. Fetches recipient's public key from registry
// 2. Encrypts message with their key
// 3. Uploads to IPFS
// 4. Notifies on-chain
await messageStore.sendMessage(to, subject, body)
```

### 3. Receive Messages
```typescript
// Decrypt with your private key (derived from wallet)
// Works because sender used your registered public key
```

## 🔗 Links

- **Block Explorer:** https://blockscout-passet-hub.parity-testnet.parity.io/address/0x10c261B9647D93215e82207FaBb4Efb009c91c6F
- **Transaction:** https://blockscout-passet-hub.parity-testnet.parity.io/tx/0x7569d80410612e93a7f921635866d04bea85b09121532c69fade1c174637b29a

## 📝 Configuration Updated

- ✅ `packages/r3mail-chain/src/config.ts` - Contract address updated
- ✅ `packages/r3mail-chain/src/abi.ts` - ABI includes new functions
- ✅ `packages/r3mail-chain/src/client.ts` - Client methods added
- ✅ `apps/r3mail/app/composables/useR3mailWallet.ts` - Registration methods added
- ✅ `apps/r3mail/app/composables/useR3mailMessages.ts` - Uses registry for encryption

## ✨ Benefits

1. **No Separate Key Management** - Keys derived from wallet signature
2. **Decentralized Discovery** - Public keys stored on-chain
3. **One-Time Setup** - Register once, receive messages forever
4. **Trustless** - No central authority needed
5. **Permanent** - Keys stored on blockchain

## 🎯 Next Steps

1. Start the dev server: `bun run dev -p 3006`
2. Connect your wallet
3. Click "Register Public Key" (costs gas)
4. Try sending a message to yourself!

---

**Deployed:** November 16, 2025  
**Version:** v1.1.0 (with Public Key Registry)
