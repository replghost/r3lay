# @r3mail/chain

Blockchain integration for R3MAIL encrypted messaging.

## Features

- 📡 **Contract Interaction** - Send message notifications on-chain
- 👀 **Event Subscription** - Real-time inbox monitoring
- 📜 **Historical Messages** - Fetch past messages
- 🔗 **Wallet Integration** - MetaMask, Talisman, etc.
- ⛓️ **Paseo Asset Hub** - EVM on Polkadot testnet

## Installation

```bash
bun add @r3mail/chain
```

## Usage

### Create Client

```typescript
import { createR3mailChainClient } from '@r3mail/chain'

const client = createR3mailChainClient()

// Connect wallet
await client.connectWallet()
```

### Send Message Notification

```typescript
// After encrypting and uploading message to IPFS
const txHash = await client.notifyMessage(
  msgId,           // Message ID (keccak256)
  recipientAddress, // Recipient's address
  envelopeCid      // IPFS CID of envelope
)

console.log('Transaction:', client.getTransactionUrl(txHash))
```

### Watch for New Messages

```typescript
// Watch inbox for new messages
const unwatch = client.watchInbox({
  address: myAddress,
  onMessage: async (event) => {
    console.log('New message!')
    console.log('From:', event.from)
    console.log('Envelope CID:', event.envelopeCid)
    
    // Fetch and decrypt message
    const envelope = await ipfs.cat(event.envelopeCid)
    // ... decrypt and display
  },
  onError: (error) => {
    console.error('Error:', error)
  },
})

// Stop watching
// unwatch()
```

### Get Historical Messages

```typescript
// Fetch all past messages
const messages = await client.getMessages(myAddress)

for (const msg of messages) {
  console.log('Message from:', msg.from)
  console.log('Envelope CID:', msg.envelopeCid)
  console.log('Timestamp:', new Date(Number(msg.timestamp) * 1000))
}
```

### Check Inbox Count

```typescript
const count = await client.getInboxCount(myAddress)
console.log(`You have ${count} messages`)
```

## API Reference

### `R3mailChainClient`

#### Constructor

```typescript
new R3mailChainClient(rpcUrl?: string)
```

#### Methods

**`connectWallet()`**
Connect user's wallet (MetaMask, Talisman, etc.)

**`getWalletAddress()`**
Get connected wallet address

**`notifyMessage(msgId, to, envelopeCid)`**
Notify chain that a message was sent
- Returns: Transaction hash

**`getInboxCount(address)`**
Get number of messages received
- Returns: Message count

**`hasMessage(msgId)`**
Check if message ID exists
- Returns: Boolean

**`getMessages(address, fromBlock?, toBlock?)`**
Get historical messages
- Returns: Array of `MessageNotifiedEvent`

**`watchInbox(options)`**
Watch for new messages
- Returns: Unwatch function

**`getTransactionUrl(hash)`**
Get block explorer URL for transaction

**`getAddressUrl(address)`**
Get block explorer URL for address

### Types

#### `MessageNotifiedEvent`

```typescript
interface MessageNotifiedEvent {
  msgId: Hash
  from: Address
  to: Address
  envelopeCid: string
  timestamp: bigint
  blockNumber: bigint
  transactionHash: Hash
}
```

#### `WatchInboxOptions`

```typescript
interface WatchInboxOptions {
  address: Address
  onMessage: (event: MessageNotifiedEvent) => void | Promise<void>
  onError?: (error: Error) => void
  pollInterval?: number  // milliseconds (default: 4000)
}
```

## Configuration

### Contract Address

```typescript
import { R3MAIL_CONTRACT_ADDRESS } from '@r3mail/chain'

console.log(R3MAIL_CONTRACT_ADDRESS)
// 0xABE4bEea70cA1F2A4B9a5eACcB9972E096B5d769
```

### Network Config

```typescript
import { NETWORK_CONFIG } from '@r3mail/chain'

// Chain ID: 420429638
// RPC: https://testnet-passet-hub-eth-rpc.polkadot.io
// Explorer: https://blockscout-passet-hub.parity-testnet.parity.io
```

## Example: Full Send Flow

```typescript
import { createR3mailChainClient } from '@r3mail/chain'
import { createEncryptedMessage, getUserKeys } from '@r3mail/core'
import { createIpfsClient } from '@r3mail/ipfs'

// 1. Create clients
const chain = createR3mailChainClient()
const ipfs = createIpfsClient()

// 2. Connect wallet
await chain.connectWallet()
const from = await chain.getWalletAddress()

// 3. Get keys
const keys = await getUserKeys(from)

// 4. Create encrypted message
const { envelope, encryptedBody } = await createEncryptedMessage({
  from,
  to: recipientAddress,
  subject: 'Hello!',
  body: 'This is a test message',
  senderPrivateKey: keys.privateKey,
})

// 5. Upload to IPFS
const bodyCid = await ipfs.add(encryptedBody)
envelope.bodyCid = bodyCid

// Sign envelope
envelope.signature = await signEnvelope(envelope, wallet.signMessage)

const envelopeCid = await ipfs.add(JSON.stringify(envelope))

// 6. Notify on-chain
const txHash = await chain.notifyMessage(
  envelope.msgId,
  recipientAddress,
  envelopeCid
)

console.log('Message sent!', chain.getTransactionUrl(txHash))
```

## Example: Full Receive Flow

```typescript
import { createR3mailChainClient } from '@r3mail/chain'
import { decryptMessage, getUserKeys } from '@r3mail/core'
import { createIpfsClient } from '@r3mail/ipfs'

// 1. Create clients
const chain = createR3mailChainClient()
const ipfs = createIpfsClient()

// 2. Get keys
const keys = await getUserKeys(myAddress)

// 3. Watch for messages
chain.watchInbox({
  address: myAddress,
  onMessage: async (event) => {
    // 4. Fetch envelope
    const envelopeJson = await ipfs.cat(event.envelopeCid)
    const envelope = JSON.parse(envelopeJson)
    
    // 5. Fetch encrypted body
    const encryptedBody = await ipfs.cat(envelope.bodyCid)
    
    // 6. Decrypt
    const message = await decryptMessage({
      envelope,
      encryptedBody,
      recipientPrivateKey: keys.privateKey,
    })
    
    // 7. Display
    console.log('New message from:', message.from)
    console.log('Subject:', message.subject)
    console.log('Body:', message.body)
  },
})
```

## License

MIT
