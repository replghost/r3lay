/**
 * Wallet-Based Key Derivation
 * 
 * Derives R3LAY encryption keys from wallet signatures
 * Supports MetaMask, Talisman (EVM mode), and other EIP-1193 wallets
 */

import type { CreatorIdentity, FollowerIdentity } from '../types'
import { CryptoError } from '../types'

// Ensure libsodium is loaded
let sodium: any = null

async function ensureSodium() {
  if (!sodium) {
    sodium = await import('libsodium-wrappers')
    await sodium.ready
  }
  return sodium
}

/**
 * Detects which wallet is connected
 */
export function detectWallet(): 'metamask' | 'talisman' | 'unknown' | null {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null
  }
  
  if (window.ethereum.isTalisman) {
    return 'talisman'
  }
  
  if (window.ethereum.isMetaMask) {
    return 'metamask'
  }
  
  return 'unknown'
}

/**
 * Gets the derivation message for a wallet address
 */
function getDerivationMessage(address: string, version = 1): string {
  return `R3LAY Key Derivation v${version}

This signature will be used to derive your encryption keys.
It will NOT give R3LAY access to your wallet or funds.

Address: ${address.toLowerCase()}
Version: ${version}
Purpose: Encryption Key Generation`
}

/**
 * Requests a signature from the connected wallet
 */
async function requestWalletSignature(address: string): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new CryptoError('No Ethereum wallet found. Please install MetaMask or Talisman.')
  }
  
  const message = getDerivationMessage(address)
  
  try {
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, address]
    })
    
    return signature
  } catch (error: any) {
    if (error.code === 4001) {
      throw new CryptoError('User rejected signature request')
    }
    throw new CryptoError(`Failed to get wallet signature: ${error.message}`)
  }
}

/**
 * Derives a seed from a wallet signature
 */
async function deriveSeedFromSignature(signature: string, purpose: string): Promise<Uint8Array> {
  // Remove 0x prefix if present
  const cleanSignature = signature.startsWith('0x') ? signature.slice(2) : signature
  
  // Convert hex signature to bytes
  const signatureBytes = new Uint8Array(
    cleanSignature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  )
  
  // Hash signature with purpose to create seed
  const encoder = new TextEncoder()
  const purposeBytes = encoder.encode(purpose)
  
  // Combine signature and purpose
  const combined = new Uint8Array(signatureBytes.length + purposeBytes.length)
  combined.set(signatureBytes, 0)
  combined.set(purposeBytes, signatureBytes.length)
  
  // Hash to create seed
  const seedBuffer = await crypto.subtle.digest('SHA-256', combined)
  return new Uint8Array(seedBuffer)
}

/**
 * Derives creator identity from wallet signature
 */
export async function deriveCreatorIdentityFromWallet(
  walletAddress: string
): Promise<CreatorIdentity> {
  const sodium = await ensureSodium()
  
  // Request signature from wallet
  const signature = await requestWalletSignature(walletAddress)
  
  // Derive encryption keypair
  const encryptionSeed = await deriveSeedFromSignature(signature, 'r3lay-creator-encryption-v1')
  const encryptionKeypair = sodium.crypto_box_seed_keypair(encryptionSeed)
  
  // Derive signing keypair
  const signingSeed = await deriveSeedFromSignature(signature, 'r3lay-creator-signing-v1')
  const signingKeypair = sodium.crypto_sign_seed_keypair(signingSeed)
  
  return {
    encryptionKeyPair: {
      publicKey: encryptionKeypair.publicKey,
      privateKey: encryptionKeypair.privateKey,
    },
    signingKeyPair: {
      publicKey: signingKeypair.publicKey,
      privateKey: signingKeypair.privateKey,
    },
    substrateAccount: walletAddress, // Store wallet address for reference
  }
}

/**
 * Derives follower identity from wallet signature
 */
export async function deriveFollowerIdentityFromWallet(
  walletAddress: string
): Promise<FollowerIdentity> {
  const sodium = await ensureSodium()
  
  // Request signature from wallet
  const signature = await requestWalletSignature(walletAddress)
  
  // Derive encryption keypair
  const encryptionSeed = await deriveSeedFromSignature(signature, 'r3lay-follower-encryption-v1')
  const encryptionKeypair = sodium.crypto_box_seed_keypair(encryptionSeed)
  
  return {
    encryptionKeyPair: {
      publicKey: encryptionKeypair.publicKey,
      privateKey: encryptionKeypair.privateKey,
    },
  }
}

/**
 * Checks if wallet-based derivation is available
 */
export function isWalletDerivationAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum
}

/**
 * Gets wallet info for display
 */
export function getWalletInfo(): { name: string; icon: string } | null {
  const walletType = detectWallet()
  
  if (!walletType) return null
  
  switch (walletType) {
    case 'metamask':
      return { name: 'MetaMask', icon: 'metamask' }
    case 'talisman':
      return { name: 'Talisman', icon: 'talisman' }
    case 'unknown':
      return { name: 'Ethereum Wallet', icon: 'wallet' }
  }
}
