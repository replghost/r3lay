import { describe, it, expect } from 'vitest'
import { createEncryptedMessage, decryptMessage } from '../src/message'
import sodium from 'libsodium-wrappers'

describe('End-to-End Message Flow', () => {
  it('should encrypt, serialize, deserialize, and decrypt a message', async () => {
    // Initialize libsodium
    await sodium.ready
    
    // 1. Generate sender and recipient keypairs (simulating wallet-derived keys)
    const senderKeyPair = sodium.crypto_box_keypair()
    const recipientKeyPair = sodium.crypto_box_keypair()
    
    console.log('=== SENDER KEYS ===')
    console.log('Public key:', Array.from(senderKeyPair.publicKey.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
    console.log('Private key:', Array.from(senderKeyPair.privateKey.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
    
    console.log('=== RECIPIENT KEYS ===')
    console.log('Public key:', Array.from(recipientKeyPair.publicKey.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
    console.log('Private key:', Array.from(recipientKeyPair.privateKey.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
    
    // 2. Create encrypted message (ENCRYPTION SIDE)
    const originalMessage = {
      from: '0x1111111111111111111111111111111111111111',
      to: '0x2222222222222222222222222222222222222222',
      subject: 'E2E Test Message',
      body: 'This is an end-to-end test of the complete encryption flow!',
      senderPrivateKey: senderKeyPair.privateKey,
      recipientPublicKey: recipientKeyPair.publicKey,
    }
    
    console.log('\n=== ENCRYPTING MESSAGE ===')
    const { envelope, encryptedBody } = await createEncryptedMessage(originalMessage)
    
    console.log('Envelope created:')
    console.log('  msgId:', envelope.msgId)
    console.log('  nonce:', envelope.nonce.slice(0, 20) + '...')
    console.log('  cek:', envelope.cek.slice(0, 20) + '...')
    console.log('  Encrypted body length:', encryptedBody.length)
    
    // 3. Simulate IPFS storage (convert to base64 and back)
    console.log('\n=== SIMULATING IPFS STORAGE ===')
    const envelopeJSON = JSON.stringify(envelope)
    const bodyBase64 = sodium.to_base64(encryptedBody)
    
    console.log('Envelope JSON length:', envelopeJSON.length)
    console.log('Body base64 length:', bodyBase64.length)
    
    // 4. Simulate IPFS retrieval (parse back)
    const retrievedEnvelope = JSON.parse(envelopeJSON)
    const retrievedBody = sodium.from_base64(bodyBase64)
    
    console.log('\n=== RETRIEVED FROM IPFS ===')
    console.log('Retrieved envelope nonce:', retrievedEnvelope.nonce.slice(0, 20) + '...')
    console.log('Retrieved envelope cek:', retrievedEnvelope.cek.slice(0, 20) + '...')
    console.log('Retrieved body length:', retrievedBody.length)
    
    // 5. Decrypt message (DECRYPTION SIDE)
    console.log('\n=== DECRYPTING MESSAGE ===')
    const decrypted = await decryptMessage({
      envelope: retrievedEnvelope,
      encryptedBody: retrievedBody,
      recipientPrivateKey: recipientKeyPair.privateKey,
      senderPublicKey: senderKeyPair.publicKey,
    })
    
    console.log('Decrypted message:')
    console.log('  from:', decrypted.from)
    console.log('  to:', decrypted.to)
    console.log('  subject:', decrypted.subject)
    console.log('  body:', decrypted.body)
    
    // 6. Verify
    expect(decrypted.from).toBe(originalMessage.from)
    expect(decrypted.to).toBe(originalMessage.to)
    expect(decrypted.subject).toBe(originalMessage.subject)
    expect(decrypted.body).toBe(originalMessage.body)
    
    console.log('\n✅ END-TO-END TEST PASSED!')
  })
  
  it('should work with self-encryption (same sender and recipient)', async () => {
    await sodium.ready
    
    // Same keypair for both sender and recipient (like sending to yourself)
    const keyPair = sodium.crypto_box_keypair()
    
    console.log('\n=== SELF-ENCRYPTION TEST ===')
    console.log('Using same keys for sender and recipient')
    console.log('Public key:', Array.from(keyPair.publicKey.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
    console.log('Private key:', Array.from(keyPair.privateKey.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''))
    
    const { envelope, encryptedBody } = await createEncryptedMessage({
      from: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      subject: 'Self Message',
      body: 'Message to myself!',
      senderPrivateKey: keyPair.privateKey,
      recipientPublicKey: keyPair.publicKey,
    })
    
    const decrypted = await decryptMessage({
      envelope,
      encryptedBody,
      recipientPrivateKey: keyPair.privateKey,
      senderPublicKey: keyPair.publicKey,
    })
    
    expect(decrypted.body).toBe('Message to myself!')
    console.log('✅ SELF-ENCRYPTION TEST PASSED!')
  })
})
