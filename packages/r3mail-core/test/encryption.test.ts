import { describe, it, expect } from 'vitest'
import { createEncryptedMessage, decryptMessage } from '../src/message'
import sodium from 'libsodium-wrappers'

describe('Message Encryption/Decryption', () => {
  it('should encrypt and decrypt a message successfully', async () => {
    // Initialize libsodium
    await sodium.ready
    
    // 1. Generate test keys (simulating two users)
    const senderKeyPair = sodium.crypto_box_keypair()
    const senderKeys = {
      publicKey: senderKeyPair.publicKey,
      privateKey: senderKeyPair.privateKey,
    }
    
    const recipientKeyPair = sodium.crypto_box_keypair()
    const recipientKeys = {
      publicKey: recipientKeyPair.publicKey,
      privateKey: recipientKeyPair.privateKey,
    }
    
    // 2. Create encrypted message
    const originalMessage = {
      from: '0x1111111111111111111111111111111111111111',
      to: '0x2222222222222222222222222222222222222222',
      subject: 'Test Subject',
      body: 'This is a test message body',
      senderPrivateKey: senderKeys.privateKey,
      recipientPublicKey: recipientKeys.publicKey,
    }
    
    console.log('Creating encrypted message...')
    console.log('Sender keys:', {
      publicKey: Array.from(senderKeys.publicKey.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''),
      privateKey: Array.from(senderKeys.privateKey.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''),
    })
    console.log('Recipient keys:', {
      publicKey: Array.from(recipientKeys.publicKey.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''),
      privateKey: Array.from(recipientKeys.privateKey.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''),
    })
    
    const { envelope, encryptedBody } = await createEncryptedMessage(originalMessage)
    
    console.log('Envelope:', {
      msgId: envelope.msgId,
      from: envelope.from,
      to: envelope.to,
      subject: envelope.subject,
      nonce: envelope.nonce.slice(0, 20) + '...',
      cek: envelope.cek.slice(0, 20) + '...',
    })
    
    // 3. Decrypt message
    console.log('Decrypting message...')
    console.log('Using sender public key:', Array.from(senderKeys.publicKey.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''))
    console.log('Using recipient private key:', Array.from(recipientKeys.privateKey.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''))
    
    const decrypted = await decryptMessage({
      envelope,
      encryptedBody,
      recipientPrivateKey: recipientKeys.privateKey,
      senderPublicKey: senderKeys.publicKey,
    })
    
    console.log('Decrypted:', {
      msgId: decrypted.msgId,
      from: decrypted.from,
      to: decrypted.to,
      subject: decrypted.subject,
      body: decrypted.body,
    })
    
    // 4. Verify
    expect(decrypted.from).toBe(originalMessage.from)
    expect(decrypted.to).toBe(originalMessage.to)
    expect(decrypted.subject).toBe(originalMessage.subject)
    expect(decrypted.body).toBe(originalMessage.body)
  })
  
  it('should fail to decrypt with wrong recipient key', async () => {
    await sodium.ready
    
    const senderKeyPair = sodium.crypto_box_keypair()
    const senderKeys = {
      publicKey: senderKeyPair.publicKey,
      privateKey: senderKeyPair.privateKey,
    }
    
    const recipientKeyPair = sodium.crypto_box_keypair()
    const recipientKeys = {
      publicKey: recipientKeyPair.publicKey,
      privateKey: recipientKeyPair.privateKey,
    }
    
    const wrongKeyPair = sodium.crypto_box_keypair()
    const wrongKeys = {
      publicKey: wrongKeyPair.publicKey,
      privateKey: wrongKeyPair.privateKey,
    }
    
    const { envelope, encryptedBody } = await createEncryptedMessage({
      from: '0x1111111111111111111111111111111111111111',
      to: '0x2222222222222222222222222222222222222222',
      subject: 'Test',
      body: 'Test body',
      senderPrivateKey: senderKeys.privateKey,
      recipientPublicKey: recipientKeys.publicKey,
    })
    
    // Try to decrypt with wrong key
    await expect(
      decryptMessage({
        envelope,
        encryptedBody,
        recipientPrivateKey: wrongKeys.privateKey, // Wrong key!
        senderPublicKey: senderKeys.publicKey,
      })
    ).rejects.toThrow()
  })
})
