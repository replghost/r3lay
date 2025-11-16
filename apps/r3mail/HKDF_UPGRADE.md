# HKDF Key Derivation Upgrade

## 🔒 Security Improvement

Upgraded from simple SHA-256 hashing to **HKDF (HMAC-based Key Derivation Function)** for cryptographically secure key derivation.

---

## 📊 Comparison

### **Before (v1):**
```typescript
// Simple SHA-256 hashing
const publicKey = SHA-256(signature)
const privateKey = SHA-256(signature + "private")
```

**Issues:**
- ❌ No proper domain separation
- ❌ Not cryptographically proven
- ❌ Vulnerable to related-key attacks

---

### **After (v2):**
```typescript
// HKDF with proper domain separation
const publicKey = HKDF-SHA256(signature, info: "r3mail-public-key-v1", length: 32)
const privateKey = HKDF-SHA256(signature, info: "r3mail-private-key-v1", length: 32)
```

**Benefits:**
- ✅ Industry standard (RFC 5869)
- ✅ Proper domain separation via info strings
- ✅ Cryptographically proven secure
- ✅ Used in TLS 1.3, Signal Protocol, WireGuard
- ✅ Prevents related-key attacks
- ✅ Extract-then-Expand paradigm

---

## 🔑 How HKDF Works

### **Two-Step Process:**

#### **1. Extract (HMAC-based)**
```
PRK = HMAC-SHA256(salt, input_key_material)
```
- Extracts a pseudorandom key from the signature
- Salt is optional (we use `undefined` for simplicity)

#### **2. Expand (HMAC-based)**
```
OKM = HMAC-SHA256(PRK, info || 0x01)
```
- Expands the PRK into the desired output length
- `info` provides domain separation
- Different `info` strings produce completely different keys

---

## 📝 Implementation Details

### **Library Used:**
```json
{
  "@noble/hashes": "^2.0.1"
}
```

**Why @noble/hashes?**
- ✅ Audited by multiple security firms
- ✅ Zero dependencies
- ✅ TypeScript native
- ✅ Tree-shakeable
- ✅ Used by major projects (MetaMask, Ledger, etc.)

### **Key Derivation:**
```typescript
import { hkdf } from '@noble/hashes/hkdf'
import { sha256 } from '@noble/hashes/sha256'

// Derive public key
const publicKey = hkdf(
  sha256,                        // Hash function
  sigBytes,                      // Input key material (signature)
  undefined,                     // Salt (optional)
  'r3mail-public-key-v1',       // Info string (domain separation)
  32                             // Output length (32 bytes = 256 bits)
)

// Derive private key
const privateKey = hkdf(
  sha256,
  sigBytes,
  undefined,
  'r3mail-private-key-v1',      // Different info = different key
  32
)
```

---

## 🔐 Security Properties

### **1. Domain Separation**
- Public and private keys use different `info` strings
- Impossible to derive one from the other
- Each key is cryptographically independent

### **2. Deterministic**
- Same signature → same keys
- Recoverable by signing again
- No randomness needed

### **3. One-Way**
- Can't reverse engineer signature from keys
- Can't derive keys without signature
- Forward secrecy maintained

### **4. Collision Resistant**
- Probability of collision: 2^-256
- Astronomically unlikely

---

## ⚠️ Migration Notes

### **Version Change:**
- **v1:** Simple SHA-256
- **v2:** HKDF-SHA256

### **Breaking Change:**
Users who derived keys with v1 will need to:
1. Clear their localStorage
2. Sign again to derive new v2 keys
3. Re-register their public key on-chain

**Why?** Different derivation = different keys

### **Migration Path:**
```typescript
// Clear old keys
localStorage.removeItem(`r3mail_keys_${address}`)

// Disconnect and reconnect wallet
// This will trigger new signature request with v2 message
```

---

## 🎯 Best Practices Followed

1. **RFC 5869 Compliance** - Standard HKDF implementation
2. **Domain Separation** - Unique info strings per key type
3. **Version Tagging** - Info strings include version (`-v1`)
4. **Proper Length** - 256-bit keys (32 bytes)
5. **No Salt** - Not needed for our use case (signature already high-entropy)

---

## 📚 References

- **RFC 5869:** HKDF specification
- **@noble/hashes:** https://github.com/paulmillr/noble-hashes
- **Signal Protocol:** Uses HKDF for key derivation
- **TLS 1.3:** Uses HKDF for key schedule
- **WireGuard:** Uses HKDF for key derivation

---

## ✅ Testing

To test the upgrade:

```bash
# 1. Clear localStorage
localStorage.clear()

# 2. Restart dev server
bun run dev -p 3006

# 3. Connect wallet
# 4. Sign new v2 message
# 5. Verify keys are derived correctly
# 6. Register public key on-chain
```

---

**Upgraded:** November 16, 2025  
**Version:** v2 (HKDF-SHA256)  
**Security Level:** Industry Standard 🔒
