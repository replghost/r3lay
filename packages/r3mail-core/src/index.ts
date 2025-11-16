/**
 * R3MAIL Core
 * 
 * Core messaging library for R3MAIL encrypted messaging protocol
 */

// Export types
export type {
  MessageEnvelope,
  EncryptedMessageBundle,
  DecryptedMessage,
  KeyPair,
  CreateMessageOptions,
  DecryptMessageOptions,
} from './types'

export {
  R3mailError,
  EncryptionError,
  DecryptionError,
  SignatureError,
  ValidationError,
} from './types'

// Export envelope functions
export {
  canonicalEnvelopeJSON,
  signEnvelope,
  verifyEnvelopeSignature,
  validateEnvelope,
  parseEnvelope,
  serializeEnvelope,
} from './envelope'

// Export message functions
export {
  createEncryptedMessage,
  decryptMessage,
  derivePublicKeyFromAddress,
  getUserKeys,
} from './message'
