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

      // 3. Sign envelope
      // TODO: Implement envelope signing with wallet
      envelope.signature = '0x' + '0'.repeat(130) // Placeholder

      // 4. Upload envelope to IPFS
      console.log('Uploading envelope to IPFS...')
      const envelopeCid = await uploadJSON(envelope, `${envelope.msgId}-envelope`)
      console.log('Envelope uploaded:', envelopeCid)

      // 5. Notify on-chain
      const txHash = await wallet.chainClient.value.notifyMessage(
        envelope.msgId as `0x${string}`,
        to as `0x${string}`,
        envelopeCid
      )

      console.log('Message sent! Transaction:', txHash)

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
      const index = store.index('to')
      
      return new Promise<StoredMessage[]>((resolve, reject) => {
        const request = index.getAll(wallet.address.value)
        
        request.onsuccess = () => {
          messages.value = request.result || []
          resolve(messages.value)
        }
        
        request.onerror = () => {
          error.value = 'Failed to load messages'
          reject(request.error)
        }
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
      
      // 2. Fetch encrypted body from IPFS
      console.log('Fetching body from:', envelope.bodyCid)
      const encryptedBodyData = await fetchFromIPFS(envelope.bodyCid)
      
      // Convert to Uint8Array if needed
      let encryptedBody: Uint8Array
      if (typeof encryptedBodyData === 'string') {
        // If it's a string, convert from base64 or hex
        const bytes = new TextEncoder().encode(encryptedBodyData)
        encryptedBody = bytes
      } else if (encryptedBodyData instanceof Uint8Array) {
        encryptedBody = encryptedBodyData
      } else {
        throw new Error('Invalid encrypted body format')
      }
      
      // 3. Decrypt message
      console.log('Decrypting message...')
      const decrypted = await decryptMessage({
        envelope,
        encryptedBody,
        recipientPrivateKey: wallet.keys.value.privateKey
      })
      
      // 4. Store in IndexedDB
      const message: StoredMessage = {
        msgId: event.msgId,
        from: event.from,
        to: event.to,
        subject: decrypted.subject,
        body: decrypted.body,
        timestamp: Number(event.timestamp) * 1000,
        blockNumber: Number(event.blockNumber),
        unread: true,
        archived: false,
        envelopeCid: event.envelopeCid,
      }
      
      await storeMessage(message)
      console.log('Message processed and stored!')
      
      return message
    } catch (err) {
      console.error('Failed to process message event:', err)
      throw err
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
    
    // Methods
    sendMessage,
    loadMessages,
    storeMessage,
    getMessage,
    markAsRead,
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
