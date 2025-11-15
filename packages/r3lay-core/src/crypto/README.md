# R3LAY Crypto Module

End-to-end encryption implementation for R3LAY using libsodium.

## Overview

The crypto module provides:

- **X25519 key generation** - ECDH key exchange for follower encryption
- **Ed25519 signing** - Optional message signing
- **Symmetric encryption** - XSalsa20-Poly1305 for content encryption
- **Key storage** - Secure IndexedDB storage with WebCrypto
- **Multi-follower encryption** - Encrypt message keys for multiple recipients

## Architecture

### Encryption Flow (Creator → Followers)

1. Creator generates a random symmetric key `K_msg`
2. Creator encrypts post content with `K_msg`
3. For each follower:
   - Derive shared secret using ECDH (creator private + follower public)
   - Encrypt `K_msg` with shared secret
   - Store encrypted key in post metadata
4. Upload encrypted post + metadata to IPFS

### Decryption Flow (Follower)

1. Follower downloads encrypted post from IPFS
2. Find their encrypted key in post metadata
3. Decrypt `K_msg` using ECDH (follower private + creator public)
4. Decrypt post content with `K_msg`

## Usage

### Key Generation

```typescript
import { 
  generateCreatorIdentity,
  generateFollowerIdentity,
  storeCreatorKeys,
  storeFollowerKeys 
} from '@r3lay/core'

// Creator setup
const creatorIdentity = await generateCreatorIdentity(true) // with signing key
await storeCreatorKeys(creatorIdentity)

// Follower setup
const followerIdentity = await generateFollowerIdentity()
await storeFollowerKeys(followerIdentity)
```

### Encrypting a Post (Creator)

```typescript
import {
  generateSymmetricKey,
  encryptSymmetric,
  encryptMessageKeyForFollowers,
  encodeBase64
} from '@r3lay/core'

// 1. Generate message key
const messageKey = await generateSymmetricKey()

// 2. Encrypt post content
const postContent = new TextEncoder().encode('Hello, followers!')
const { ciphertext, nonce } = await encryptSymmetric(postContent, messageKey)

// 3. Encrypt message key for each follower
const followerPubkeys = ['base64pubkey1', 'base64pubkey2']
const encryptedKeys = await encryptMessageKeyForFollowers(
  messageKey,
  creatorIdentity.encryptionKeyPair.privateKey,
  followerPubkeys
)

// 4. Build post metadata
const metadata = {
  version: 1,
  author: encodeBase64(creatorIdentity.encryptionKeyPair.publicKey),
  timestamp: Date.now(),
  title: 'My Post',
  encrypted_keys: encryptedKeys
}

// 5. Upload ciphertext + metadata to IPFS
```

### Decrypting a Post (Follower)

```typescript
import {
  decryptMessageKeyFromCreator,
  decryptSymmetric,
  decodeBase64,
  encodeBase64
} from '@r3lay/core'

// 1. Download post from IPFS
const { metadata, ciphertext, nonce } = await downloadPost(postCid)

// 2. Find encrypted key for this follower
const myPubkey = encodeBase64(followerIdentity.encryptionKeyPair.publicKey)
const encryptedKeyData = metadata.encrypted_keys[myPubkey]

if (!encryptedKeyData) {
  throw new Error('Not authorized to read this post')
}

// 3. Parse encrypted key (format: "encryptedKey:nonce")
const [encryptedKey, keyNonce] = encryptedKeyData.split(':')

// 4. Decrypt message key
const messageKey = await decryptMessageKeyFromCreator(
  encryptedKey,
  keyNonce,
  followerIdentity.encryptionKeyPair.privateKey,
  decodeBase64(metadata.author)
)

// 5. Decrypt content
const plaintext = await decryptSymmetric(ciphertext, nonce, messageKey)
const content = new TextDecoder().decode(plaintext)
```

### Key Storage

```typescript
import {
  storeCreatorKeys,
  loadCreatorKeys,
  hasCreatorKeys,
  exportCreatorIdentity
} from '@r3lay/core'

// Store keys
await storeCreatorKeys(identity, 'my-channel')

// Load keys
const identity = await loadCreatorKeys('my-channel')

// Check if keys exist
const exists = await hasCreatorKeys('my-channel')

// Export for backup (WARNING: exposes private keys!)
const backup = await exportCreatorIdentity('my-channel')
```

## Security Considerations

### Key Storage
- Keys are stored in IndexedDB (browser local storage)
- Private keys never leave the device
- Export functions expose private keys - use with extreme caution

### Forward Secrecy
- Each post uses a new random symmetric key
- Compromising one post key doesn't compromise others

### Revocation
- Removing a follower: stop including their pubkey in new posts
- Forward-only revocation: old posts remain accessible
- For true revocation, implement proxy re-encryption (future)

### Threats Out of Scope
- Compromised device/browser
- Malicious browser extensions
- Side-channel attacks
- Quantum computers (use post-quantum crypto in future)

## API Reference

### Key Generation
- `generateX25519KeyPair()` - Generate encryption keypair
- `generateEd25519KeyPair()` - Generate signing keypair
- `generateCreatorIdentity(includeSigning)` - Generate complete creator identity
- `generateFollowerIdentity()` - Generate follower identity
- `generateSymmetricKey()` - Generate random message key

### Symmetric Encryption
- `encryptSymmetric(plaintext, key)` - Encrypt with XSalsa20-Poly1305
- `decryptSymmetric(ciphertext, nonce, key)` - Decrypt

### ECDH Encryption
- `deriveSharedSecret(myPrivate, theirPublic)` - ECDH key derivation
- `encryptMessageKeyForFollower(messageKey, creatorPrivate, followerPublic)` - Encrypt for one follower
- `decryptMessageKeyFromCreator(encrypted, nonce, followerPrivate, creatorPublic)` - Decrypt message key
- `encryptMessageKeyForFollowers(messageKey, creatorPrivate, followerPubkeys[])` - Encrypt for multiple

### Signing (Optional)
- `sign(data, privateKey)` - Sign with Ed25519
- `verify(signature, data, publicKey)` - Verify signature

### Key Storage
- `storeCreatorKeys(identity, keyId)` - Store creator keys
- `loadCreatorKeys(keyId)` - Load creator keys
- `deleteCreatorKeys(keyId)` - Delete creator keys
- `hasCreatorKeys(keyId)` - Check if keys exist
- `storeFollowerKeys(identity, keyId)` - Store follower keys
- `loadFollowerKeys(keyId)` - Load follower keys
- `exportCreatorIdentity(keyId)` - Export for backup
- `importCreatorIdentity(json, keyId)` - Import from backup

## Dependencies

- **libsodium-wrappers** - Cryptographic primitives
- **IndexedDB** - Browser key storage

## License

MIT
