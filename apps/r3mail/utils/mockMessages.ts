/**
 * Mock messages for testing the UI
 */

import type { StoredMessage } from '~/composables/useR3mailMessages'

export async function addMockMessages(userAddress: string) {
  const dbName = 'r3mail'
  const storeName = 'messages'
  
  // Open IndexedDB
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'msgId' })
      }
    }
  })

  // Mock messages
  const mockMessages: StoredMessage[] = [
    {
      msgId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
      to: userAddress,
      subject: 'Welcome to R3MAIL! 🎉',
      body: `# Welcome to R3MAIL!

This is your first encrypted message on the blockchain.

## Features:
- **End-to-end encryption** with X25519 + XChaCha20-Poly1305
- **On-chain notifications** via smart contract events
- **IPFS storage** for encrypted message bodies
- **Markdown support** for rich text formatting

Try composing your first message!`,
      timestamp: Date.now() - 3600000, // 1 hour ago
      blockNumber: 2178215,
      unread: true,
      archived: false,
      envelopeCid: 'QmTest1234567890abcdef'
    },
    {
      msgId: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      from: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
      to: userAddress,
      subject: 'Test Message with Code',
      body: `# Testing Code Blocks

Here's a sample smart contract:

\`\`\`solidity
contract R3mailMailbox {
    event MessageNotified(
        bytes32 indexed msgId,
        address indexed from,
        address indexed to,
        string envelopeCid,
        uint256 timestamp
    );
}
\`\`\`

Pretty cool, right? 🚀`,
      timestamp: Date.now() - 7200000, // 2 hours ago
      blockNumber: 2178200,
      unread: true,
      archived: false,
      envelopeCid: 'QmTest2345678901bcdef'
    },
    {
      msgId: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
      from: '0x1234567890123456789012345678901234567890',
      to: userAddress,
      subject: 'Meeting Notes',
      body: `# Team Meeting - Nov 15, 2024

## Attendees
- Alice
- Bob
- Charlie

## Topics Discussed
1. Q4 roadmap
2. New feature proposals
3. Bug fixes

## Action Items
- [ ] Review PRs by EOD
- [ ] Update documentation
- [ ] Schedule follow-up

See you next week!`,
      timestamp: Date.now() - 86400000, // 1 day ago
      blockNumber: 2177000,
      unread: false,
      archived: false,
      envelopeCid: 'QmTest3456789012cdef'
    },
    {
      msgId: '0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
      from: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      to: userAddress,
      subject: 'Quick Question',
      body: `Hey! Quick question about the deployment.

Did you update the contract address in the config?

Let me know when you get a chance.

Thanks!`,
      timestamp: Date.now() - 172800000, // 2 days ago
      blockNumber: 2176500,
      unread: false,
      archived: false,
      envelopeCid: 'QmTest4567890123def'
    }
  ]

  // Add messages to IndexedDB
  const transaction = db.transaction([storeName], 'readwrite')
  const store = transaction.objectStore(storeName)

  for (const message of mockMessages) {
    await new Promise<void>((resolve, reject) => {
      const request = store.put(message)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  console.log(`✅ Added ${mockMessages.length} mock messages to IndexedDB`)
  db.close()
  
  return mockMessages.length
}

export async function clearAllMessages() {
  const dbName = 'r3mail'
  const storeName = 'messages'
  
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })

  const transaction = db.transaction([storeName], 'readwrite')
  const store = transaction.objectStore(storeName)
  
  await new Promise<void>((resolve, reject) => {
    const request = store.clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })

  console.log('✅ Cleared all messages from IndexedDB')
  db.close()
}
