/**
 * R3MAIL Messages Composable
 * Handles message encryption, sending, receiving, and storage
 */

import { ref } from 'vue'
import { createEncryptedMessage, decryptMessage, type MessageEnvelope } from '@r3mail/core'
import { useR3mailWallet } from './useR3mailWallet'
import { uploadJSON, uploadFile, fetchFromIPFS } from '~/utils/ipfs'

export interface StoredMessage {
  msgId: string
  from: string
  to: string
  subject: string
  body: string
  timestamp: number
  blockNumber: number
  unread: boolean
  archived: boolean
  envelopeCid: string
}

const messages = ref<StoredMessage[]>([])
const loading = ref(false)
const error = ref('')
const showAllMessages = ref(false) // Debug mode: show deleted/archived messages

export function useR3mailMessages() {
  const wallet = useR3mailWallet()

  /**
   * Send a message
   */
  async function sendMessage(to: string, subject: string, body: string) {
    if (!wallet.address.value || !wallet.keys.value || !wallet.chainClient.value) {
      throw new Error('Wallet not connected')
    }

    loading.value = true
    error.value = ''

    try {
      // 1. Get recipient's public key from registry
      console.log('Fetching recipient public key from registry...')
      const recipientPublicKey = await wallet.chainClient.value.getPublicKey(to as `0x${string}`)
      
      if (!recipientPublicKey) {
        throw new Error(`Recipient ${to} has not registered their public key yet. They need to register first.`)
      }
      
      console.log('🔐 ENCRYPTION KEYS:')
      console.log('  Sender private key (first 16):', Array.from(wallet.keys.value.privateKey.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
      console.log('  Sender public key (first 16):', Array.from(wallet.keys.value.publicKey.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
      console.log('  Recipient public key (first 16):', Array.from(recipientPublicKey.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
      
      // 2. Encrypt message
      const { envelope, encryptedBody } = await createEncryptedMessage({
        from: wallet.address.value,
        to,
        subject,
        body,
        senderPrivateKey: wallet.keys.value.privateKey,
        recipientPublicKey,
      })

      // 2. Upload encrypted body to IPFS
      console.log('Uploading encrypted body to IPFS...')
      const bodyBlob = new Blob([encryptedBody as any], { type: 'application/octet-stream' })
      const bodyCid = await uploadFile(bodyBlob, `${envelope.msgId}-body`)
      envelope.bodyCid = bodyCid
      console.log('Body uploaded:', bodyCid)

      // 3. Sign envelope with wallet
      console.log('Signing envelope...')
      const envelopeToSign = { ...envelope }
      delete (envelopeToSign as any).signature // Don't include signature in what we sign
      
      // Create canonical JSON string for signing
      const message = JSON.stringify(envelopeToSign, Object.keys(envelopeToSign).sort())
      
      // Sign with MetaMask using personal_sign (EIP-191)
      if (!window.ethereum) {
        throw new Error('MetaMask not available')
      }
      
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, wallet.address.value],
      }) as string
      
      envelope.signature = signature
      console.log('✍️ Envelope signed:', signature.slice(0, 20) + '...')

      // 4. Upload envelope to IPFS
      console.log('Uploading envelope to IPFS...')
      const envelopeCid = await uploadJSON(envelope, `${envelope.msgId}-envelope`)
      console.log('Envelope uploaded:', envelopeCid)

      // 5. Notify on-chain
      console.log('Notifying chain with CID:', envelopeCid, 'length:', envelopeCid.length)
      const txHash = await wallet.chainClient.value.notifyMessage(
        envelope.msgId as `0x${string}`,
        to as `0x${string}`,
        envelopeCid
      )

      console.log('Message sent! Transaction:', txHash)
      console.log('Envelope CID sent to chain:', envelopeCid)

      // Store a local copy in Outbox (sent messages)
      const now = Date.now()
      const fromAddress = wallet.address.value.toLowerCase()
      const toAddress = to.toLowerCase()

      const sentMessage: StoredMessage = {
        msgId: envelope.msgId,
        from: fromAddress,
        to: toAddress,
        subject,
        body,
        timestamp: now,
        blockNumber: 0,
        unread: false,
        archived: false,
        envelopeCid,
      }

      try {
        await storeMessage(sentMessage)
        console.log('💾 Stored sent message locally in Outbox:', sentMessage.msgId)
      } catch (storeErr) {
        console.error('Failed to store sent message locally:', storeErr)
      }

      return {
        msgId: envelope.msgId,
        envelopeCid,
        txHash,
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to send message'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Load messages from IndexedDB
   */
  async function loadMessages() {
    if (!wallet.address.value) {
      return []
    }

    loading.value = true
    error.value = ''

    try {
      const db = await openDB()
      const transaction = db.transaction(['messages'], 'readonly')
      const store = transaction.objectStore('messages')
      const toIndex = store.index('to')
      const fromIndex = store.index('from')
      
      return new Promise<StoredMessage[]>((resolve, reject) => {
        const normalizedAddress = wallet.address.value.toLowerCase()
        const collected: StoredMessage[] = []
        let pending = 2
        let failed = false

        function done() {
          if (--pending > 0 || failed) return

          // Merge and dedupe by msgId
          const byId = new Map<string, StoredMessage>()
          for (const msg of collected) {
            byId.set(msg.msgId, msg)
          }

          messages.value = Array.from(byId.values())
          console.log(`📬 Loaded ${messages.value.length} messages (inbox + outbox) for ${normalizedAddress}`)
          messages.value.forEach((m, i) => {
            console.log(`${i}: ${m.subject || '⚠️ Failed to load'} (from: ${m.from.slice(0, 10)}..., to: ${m.to.slice(0, 10)}...)`)
          })

          resolve(messages.value)
        }

        function handleError(request: IDBRequest) {
          if (failed) return
          failed = true
          error.value = 'Failed to load messages'
          reject(request.error)
        }

        const toRequest = toIndex.getAll(normalizedAddress)
        toRequest.onsuccess = () => {
          if (toRequest.result) collected.push(...toRequest.result)
          done()
        }
        toRequest.onerror = () => handleError(toRequest)

        const fromRequest = fromIndex.getAll(normalizedAddress)
        fromRequest.onsuccess = () => {
          if (fromRequest.result) collected.push(...fromRequest.result)
          done()
        }
        fromRequest.onerror = () => handleError(fromRequest)
      })
    } catch (err: any) {
      error.value = err.message || 'Failed to load messages'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Store message in IndexedDB
   */
  async function storeMessage(message: StoredMessage) {
    try {
      const db = await openDB()
      const transaction = db.transaction(['messages'], 'readwrite')
      const store = transaction.objectStore('messages')
      
      return new Promise<void>((resolve, reject) => {
        const request = store.put(message)
        
        request.onsuccess = () => {
          // Update local array
          const index = messages.value.findIndex(m => m.msgId === message.msgId)
          if (index !== -1) {
            messages.value[index] = message
          } else {
            messages.value.push(message)
          }
          resolve()
        }
        
        request.onerror = () => reject(request.error)
      })
    } catch (err) {
      console.error('Failed to store message:', err)
      throw err
    }
  }

  /**
   * Get message by ID
   */
  async function getMessage(msgId: string): Promise<StoredMessage | null> {
    try {
      const db = await openDB()
      const transaction = db.transaction(['messages'], 'readonly')
      const store = transaction.objectStore('messages')
      
      return new Promise((resolve, reject) => {
        const request = store.get(msgId)
        
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
      })
    } catch (err) {
      console.error('Failed to get message:', err)
      return null
    }
  }

  /**
   * Mark message as read
   */
  async function markAsRead(msgId: string) {
    try {
      const message = await getMessage(msgId)
      if (message && message.unread) {
        message.unread = false
        await storeMessage(message)
      }
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  /**
   * Delete message
   */
  async function deleteMessage(msgId: string) {
    try {
      const db = await openDB()
      const transaction = db.transaction(['messages'], 'readwrite')
      const store = transaction.objectStore('messages')
      
      return new Promise<void>((resolve, reject) => {
        const request = store.delete(msgId)
        
        request.onsuccess = () => {
          // Remove from local array
          const index = messages.value.findIndex(m => m.msgId === msgId)
          if (index !== -1) {
            messages.value.splice(index, 1)
          }
          console.log('🗑️ Deleted message:', msgId)
          resolve()
        }
        
        request.onerror = () => reject(request.error)
      })
    } catch (err) {
      console.error('Failed to delete message:', err)
      throw err
    }
  }

  /**
   * Archive message
   */
  async function archiveMessage(msgId: string) {
    try {
      const message = await getMessage(msgId)
      if (message) {
        message.archived = !message.archived
        await storeMessage(message)
      }
    } catch (err) {
      console.error('Failed to archive message:', err)
    }
  }

  /**
   * Fetch and decrypt message from chain event
   */
  async function processMessageEvent(event: {
    msgId: string
    from: string
    to: string
    envelopeCid: string
    timestamp: bigint
    blockNumber: bigint
  }) {
    if (!wallet.keys.value) {
      throw new Error('Keys not available')
    }

    try {
      // 1. Fetch envelope from IPFS
      console.log('Fetching envelope:', event.envelopeCid)
      const envelope = await fetchFromIPFS(event.envelopeCid) as MessageEnvelope
      
      // 2. Verify envelope signature
      console.log('Verifying envelope signature...')
      const { signature, ...envelopeToVerify } = envelope
      
      // Create canonical JSON string (same as signing)
      const signedMessage = JSON.stringify(envelopeToVerify, Object.keys(envelopeToVerify).sort())
      
      // Verify signature using ethers v6
      const { verifyMessage } = await import('ethers')
      const recoveredAddress = verifyMessage(signedMessage, signature)
      
      if (recoveredAddress.toLowerCase() !== event.from.toLowerCase()) {
        throw new Error(`Invalid signature! Expected ${event.from}, got ${recoveredAddress}. Message may be forged or tampered.`)
      }
      
      console.log('✅ Signature verified - message is authentic')
      
      // 3. Fetch encrypted body from IPFS
      console.log('Fetching body from:', envelope.bodyCid)
      const encryptedBodyData = await fetchFromIPFS(envelope.bodyCid)
      
      console.log('📦 Body data type:', typeof encryptedBodyData)
      console.log('📦 Body data instanceof Uint8Array:', encryptedBodyData instanceof Uint8Array)
      if (typeof encryptedBodyData === 'string') {
        console.log('📦 Body string length:', encryptedBodyData.length)
        console.log('📦 Body string (first 100 chars):', encryptedBodyData.slice(0, 100))
      }
      
      // Convert to Uint8Array if needed
      let encryptedBody: Uint8Array
      if (encryptedBodyData instanceof Uint8Array) {
        encryptedBody = encryptedBodyData
        console.log('📦 Body already Uint8Array, length:', encryptedBody.length)
      } else if (typeof encryptedBodyData === 'string') {
        // IPFS might return base64 or raw binary string - try to detect
        const { ensureSodium } = await import('@r3mail/core')
        const sodium = await ensureSodium()
        try {
          encryptedBody = sodium.from_base64(encryptedBodyData)
          console.log('📦 Decoded body from base64, length:', encryptedBody.length)
        } catch (e) {
          // Not base64, treat as raw binary string
          console.log('📦 Not base64, treating as binary string')
          const bytes = new Uint8Array(encryptedBodyData.length)
          for (let i = 0; i < encryptedBodyData.length; i++) {
            bytes[i] = encryptedBodyData.charCodeAt(i)
          }
          encryptedBody = bytes
          console.log('📦 Converted binary string to Uint8Array, length:', encryptedBody.length)
        }
      } else {
        throw new Error('Invalid encrypted body format')
      }
      
      // 3. Get sender's public key from registry
      console.log('Fetching sender public key from registry...')
      const senderPublicKey = await wallet.chainClient.value!.getPublicKey(event.from as `0x${string}`)
      
      if (!senderPublicKey) {
        throw new Error(`Sender ${event.from} has not registered their public key`)
      }
      
      console.log('🔑 DECRYPTION KEYS:')
      console.log('  Sender public key (first 16):', Array.from(senderPublicKey.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
      console.log('  Recipient private key (first 16):', Array.from(wallet.keys.value.privateKey.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
      console.log('  Recipient public key (first 16):', Array.from(wallet.keys.value.publicKey.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
      
      // 4. Decrypt message
      console.log('Decrypting message...')
      const decrypted = await decryptMessage({
        envelope,
        encryptedBody,
        recipientPrivateKey: wallet.keys.value.privateKey,
        senderPublicKey
      })
      
      // 4. Store in IndexedDB (normalize addresses to lowercase)
      const message: StoredMessage = {
        msgId: event.msgId,
        from: event.from.toLowerCase(),
        to: event.to.toLowerCase(),
        subject: decrypted.subject,
        body: decrypted.body,
        timestamp: Number(event.timestamp) * 1000,
        blockNumber: Number(event.blockNumber),
        unread: true,
        archived: false,
        envelopeCid: event.envelopeCid,
      }
      
      await storeMessage(message)
      console.log(`💾 Stored message: ${message.msgId} to: ${message.to}`)
      
      return message
    } catch (err) {
      console.error('Failed to process message event:', err)
      
      const errorMessage = err instanceof Error ? err.message : String(err)
      
      // Don't cache certain errors - they should be retried
      const shouldNotCache = 
        errorMessage.includes('ethers') ||
        errorMessage.includes('verifyMessage') ||
        errorMessage.includes('Invalid signature') ||
        errorMessage.includes('IPFS') ||
        errorMessage.includes('fetch')
      
      if (shouldNotCache) {
        console.log(`⚠️ Not caching message due to retriable error: ${errorMessage}`)
        throw err
      }
      
      // Store failed message for persistent errors (e.g., missing public key)
      const failedMessage: StoredMessage = {
        msgId: event.msgId,
        from: event.from.toLowerCase(),
        to: event.to.toLowerCase(),
        subject: '(Failed to decrypt)',
        body: `Error: ${errorMessage}`,
        timestamp: Number(event.timestamp) * 1000,
        blockNumber: Number(event.blockNumber),
        unread: true,
        archived: false,
        envelopeCid: event.envelopeCid,
      }
      
      await storeMessage(failedMessage)
      console.log(`⚠️ Stored failed message: ${failedMessage.msgId}`)
      
      return failedMessage
    }
  }

  /**
   * Fetch messages from chain (historical events)
   */
  async function fetchFromChain() {
    if (!wallet.address.value || !wallet.chainClient.value) {
      throw new Error('Wallet not connected')
    }

    loading.value = true
    try {
      console.log('Fetching messages from chain...')
      
      // Get historical MessageNotified events
      const events = await wallet.chainClient.value.getMessages(
        wallet.address.value as `0x${string}`
      )
      
      console.log(`Found ${events.length} events on chain`)
      
      // Log event details for debugging
      events.forEach((event, i) => {
        console.log(`Event ${i}:`, {
          msgId: event.msgId,
          from: event.from,
          to: event.to,
          envelopeCid: event.envelopeCid,
          cidLength: event.envelopeCid.length
        })
      })
      
      // Process each event
      for (const event of events) {
        try {
          // Check if we already have this message
          const existing = await getMessage(event.msgId)
          if (existing) {
            console.log('Message already exists:', event.msgId)
            continue
          }
          
          // Store a placeholder message immediately so it shows up
          const placeholder: StoredMessage = {
            msgId: event.msgId,
            from: event.from,
            to: event.to,
            subject: '⏳ Loading...',
            body: 'Fetching message from IPFS...',
            timestamp: Number(event.timestamp) * 1000,
            blockNumber: Number(event.blockNumber),
            unread: true,
            archived: false,
            envelopeCid: event.envelopeCid,
          }
          
          await storeMessage(placeholder)
          console.log('📬 New message found:', event.msgId)
          
          // Try to process and decrypt in background
          try {
            await processMessageEvent(event)
            console.log('✅ Message decrypted:', event.msgId)
          } catch (err) {
            console.error('❌ Failed to decrypt message:', event.msgId, err)
            // Update with error message
            placeholder.subject = '⚠️ Failed to load'
            placeholder.body = `Could not fetch or decrypt message. CID: ${event.envelopeCid}`
            await storeMessage(placeholder)
          }
        } catch (err) {
          console.error('Failed to process event:', event.msgId, err)
        }
      }
      
      // Reload messages from IndexedDB
      await loadMessages()
      
      console.log('✅ Chain sync complete!')
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch from chain'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Start background sync (polls every 30 seconds)
   */
  function startBackgroundSync() {
    if (!wallet.address.value || !wallet.chainClient.value) {
      throw new Error('Wallet not connected')
    }

    console.log('🔄 Starting background message sync...')
    
    // Initial sync
    fetchFromChain().catch(err => {
      console.error('Initial sync failed:', err)
    })
    
    // Poll every 30 seconds
    const intervalId = setInterval(async () => {
      try {
        await fetchFromChain()
      } catch (err) {
        console.error('Background sync error:', err)
      }
    }, 30000)
    
    // Return cleanup function
    return () => {
      console.log('🛑 Stopping background sync')
      clearInterval(intervalId)
    }
  }

  /**
   * Watch inbox for new messages
   */
  function watchInbox(onMessage: (message: StoredMessage) => void) {
    if (!wallet.address.value || !wallet.chainClient.value) {
      throw new Error('Wallet not connected')
    }

    return wallet.chainClient.value.watchInbox({
      address: wallet.address.value as `0x${string}`,
      onMessage: async (event) => {
        try {
          const message = await processMessageEvent(event)
          onMessage(message)
        } catch (err) {
          console.error('Error processing message:', err)
        }
      },
      onError: (err) => {
        console.error('Inbox watch error:', err)
        error.value = err.message
      },
    })
  }

  return {
    // State
    messages,
    loading,
    error,
    showAllMessages,
    
    // Methods
    sendMessage,
    loadMessages,
    fetchFromChain,
    startBackgroundSync,
    storeMessage,
    getMessage,
    markAsRead,
    deleteMessage,
    archiveMessage,
    processMessageEvent,
    watchInbox,
  }
}

/**
 * Open IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('r3mail_messages', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      if (!db.objectStoreNames.contains('messages')) {
        const store = db.createObjectStore('messages', { keyPath: 'msgId' })
        store.createIndex('from', 'from', { unique: false })
        store.createIndex('to', 'to', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('unread', 'unread', { unique: false })
      }
    }
  })
}
