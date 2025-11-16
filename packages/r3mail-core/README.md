# @r3mail/core

Core messaging library for R3MAIL encrypted messaging protocol.

## Features

- 🔐 **End-to-End Encryption** - X25519 + XChaCha20-Poly1305
- 🔑 **Wallet-Based Keys** - Deterministic key derivation from wallet signatures
- 📝 **Message Envelopes** - Structured metadata with signatures
- ✅ **Signature Verification** - EIP-191 personal_sign
- 🔒 **ECDH Key Exchange** - Secure shared secret computation

## Installation

```bash
bun add @r3mail/core
```

## Usage

### Create an Encrypted Message

```typescript
import { createEncryptedMessage, getUserKeys } from '@r3mail/core'

// Get sender's keys from wallet
const senderKeys = await getUserKeys(senderAddress)

// Create encrypted message
const { envelope, encryptedBody } = await createEncryptedMessage({
  from: senderAddress,
  to: recipientAddress,
  subject: 'Hello!',
  body: '# Hello World\n\nThis is a **markdown** message.',
  senderPrivateKey: senderKeys.privateKey,
})

// Upload to IPFS
const bodyCid = await ipfs.add(encryptedBody)
envelope.bodyCid = bodyCid

// Sign envelope
envelope.signature = await signEnvelope(envelope, wallet.signMessage)

// Upload envelope to IPFS
const envelopeCid = await ipfs.add(JSON.stringify(envelope))

// Notify on-chain
await contract.notifyMessage(envelope.msgId, recipientAddress, envelopeCid)
```

### Decrypt a Message

```typescript
import { decryptMessage, getUserKeys } from '@r3mail/core'

// Get recipient's keys from wallet
const recipientKeys = await getUserKeys(recipientAddress)

// Fetch envelope from IPFS
const envelopeJson = await ipfs.cat(envelopeCid)
const envelope = JSON.parse(envelopeJson)

// Fetch encrypted body from IPFS
const encryptedBody = await ipfs.cat(envelope.bodyCid)

// Decrypt message
const message = await decryptMessage({
  envelope,
  encryptedBody,
  recipientPrivateKey: recipientKeys.privateKey,
})

console.log(message.subject) // "Hello!"
console.log(message.body)    // "# Hello World\n\nThis is a **markdown** message."
```

### Verify Envelope Signature

```typescript
import { verifyEnvelopeSignature } from '@r3mail/core'
import { verifyMessage } from 'viem'

const isValid = await verifyEnvelopeSignature(
  envelope,
  async (message, signature, address) => {
    const recovered = await verifyMessage({ message, signature })
    return recovered.toLowerCase() === address.toLowerCase()
  }
)
```

## API Reference

### Message Functions

#### `createEncryptedMessage(options)`

Create and encrypt a message.

**Parameters:**
- `options.from` - Sender's EVM address
- `options.to` - Recipient's EVM address
- `options.subject` - Subject line
- `options.body` - Message body (markdown)
- `options.senderPrivateKey` - Sender's private key

**Returns:** `{ envelope, encryptedBody }`

#### `decryptMessage(options)`

Decrypt a message.

**Parameters:**
- `options.envelope` - Message envelope
- `options.encryptedBody` - Encrypted body bytes
- `options.recipientPrivateKey` - Recipient's private key

**Returns:** `DecryptedMessage`

#### `getUserKeys(address)`

Get encryption keys from wallet.

**Parameters:**
- `address` - User's EVM address

**Returns:** `{ publicKey, privateKey }`

### Envelope Functions

#### `signEnvelope(envelope, signer)`

Sign an envelope using EIP-191.

#### `verifyEnvelopeSignature(envelope, verifier)`

Verify an envelope signature.

#### `validateEnvelope(envelope)`

Validate envelope structure.

#### `parseEnvelope(json)`

Parse envelope from JSON.

#### `serializeEnvelope(envelope)`

Serialize envelope to JSON.

## Types

### `MessageEnvelope`

```typescript
interface MessageEnvelope {
  v: 1
  msgId: string
  from: string
  to: string
  timestamp: number
  subject?: string
  cek: string          // Wrapped CEK (base64)
  nonce: string        // XChaCha20 nonce (base64)
  bodyCid: string      // IPFS CID
  bodyHash: string     // SHA-256 hash (0x...)
  format: 'markdown'
  signature: string    // EIP-191 signature (0x...)
}
```

### `DecryptedMessage`

```typescript
interface DecryptedMessage {
  msgId: string
  from: string
  to: string
  timestamp: number
  subject: string
  body: string
}
```

## Security

- **Encryption:** X25519 (ECDH) + XChaCha20-Poly1305 (AEAD)
- **Signatures:** EIP-191 personal_sign
- **Key Derivation:** Deterministic from wallet signatures
- **Hash:** SHA-256 for content integrity

## License

MIT
