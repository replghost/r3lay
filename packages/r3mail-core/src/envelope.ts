/**
 * R3MAIL Envelope Module
 * 
 * Handles creation, signing, and verification of message envelopes
 */

import type { MessageEnvelope } from './types'
import { SignatureError, ValidationError } from './types'

/**
 * Create a canonical JSON string for signing
 * Ensures consistent ordering of fields
 */
export function canonicalEnvelopeJSON(envelope: Omit<MessageEnvelope, 'signature'>): string {
  const canonical = {
    v: envelope.v,
    msgId: envelope.msgId,
    from: envelope.from,
    to: envelope.to,
    timestamp: envelope.timestamp,
    ...(envelope.subject && { subject: envelope.subject }),
    cek: envelope.cek,
    nonce: envelope.nonce,
    bodyCid: envelope.bodyCid,
    bodyHash: envelope.bodyHash,
    format: envelope.format,
  }
  
  return JSON.stringify(canonical)
}

/**
 * Sign an envelope using EIP-191 personal_sign
 * 
 * @param envelope - Envelope to sign (without signature field)
 * @param signer - Function that signs a message (e.g., wallet.signMessage)
 * @returns Signature (0x...)
 */
export async function signEnvelope(
  envelope: Omit<MessageEnvelope, 'signature'>,
  signer: (message: string) => Promise<string>
): Promise<string> {
  try {
    const canonical = canonicalEnvelopeJSON(envelope)
    const signature = await signer(canonical)
    
    if (!signature.startsWith('0x')) {
      throw new SignatureError('Invalid signature format')
    }
    
    return signature
  } catch (error) {
    throw new SignatureError(`Failed to sign envelope: ${error}`)
  }
}

/**
 * Verify an envelope signature
 * 
 * @param envelope - Complete envelope with signature
 * @param verifier - Function that verifies a signature
 * @returns True if signature is valid
 */
export async function verifyEnvelopeSignature(
  envelope: MessageEnvelope,
  verifier: (message: string, signature: string, address: string) => Promise<boolean>
): Promise<boolean> {
  try {
    const { signature, ...envelopeWithoutSig } = envelope
    const canonical = canonicalEnvelopeJSON(envelopeWithoutSig)
    
    return await verifier(canonical, signature, envelope.from)
  } catch (error) {
    throw new SignatureError(`Failed to verify signature: ${error}`)
  }
}

/**
 * Validate envelope structure
 * 
 * @param envelope - Envelope to validate
 * @throws ValidationError if invalid
 */
export function validateEnvelope(envelope: MessageEnvelope): void {
  // Version
  if (envelope.v !== 1) {
    throw new ValidationError(`Unsupported envelope version: ${envelope.v}`)
  }
  
  // Message ID
  if (!envelope.msgId || !envelope.msgId.startsWith('0x')) {
    throw new ValidationError('Invalid message ID')
  }
  
  // Addresses
  if (!isValidAddress(envelope.from)) {
    throw new ValidationError('Invalid sender address')
  }
  if (!isValidAddress(envelope.to)) {
    throw new ValidationError('Invalid recipient address')
  }
  
  // Timestamp
  if (!envelope.timestamp || envelope.timestamp <= 0) {
    throw new ValidationError('Invalid timestamp')
  }
  
  // Encrypted key and nonce
  if (!envelope.cek || envelope.cek.length === 0) {
    throw new ValidationError('Missing encrypted key')
  }
  if (!envelope.nonce || envelope.nonce.length === 0) {
    throw new ValidationError('Missing nonce')
  }
  
  // Body CID and hash
  if (!envelope.bodyCid || envelope.bodyCid.length === 0) {
    throw new ValidationError('Missing body CID')
  }
  if (!envelope.bodyHash || !envelope.bodyHash.startsWith('0x')) {
    throw new ValidationError('Invalid body hash')
  }
  
  // Format
  if (envelope.format !== 'markdown') {
    throw new ValidationError(`Unsupported format: ${envelope.format}`)
  }
  
  // Signature
  if (!envelope.signature || !envelope.signature.startsWith('0x')) {
    throw new ValidationError('Invalid signature')
  }
}

/**
 * Check if a string is a valid EVM address
 */
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Parse an envelope from JSON
 * 
 * @param json - JSON string
 * @returns Parsed envelope
 */
export function parseEnvelope(json: string): MessageEnvelope {
  try {
    const envelope = JSON.parse(json) as MessageEnvelope
    validateEnvelope(envelope)
    return envelope
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new ValidationError(`Failed to parse envelope: ${error}`)
  }
}

/**
 * Serialize an envelope to JSON
 * 
 * @param envelope - Envelope to serialize
 * @returns JSON string
 */
export function serializeEnvelope(envelope: MessageEnvelope): string {
  validateEnvelope(envelope)
  return JSON.stringify(envelope, null, 2)
}
