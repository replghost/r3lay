/**
 * @r3lay/chain
 * 
 * Chain interaction layer for R3LAY protocol
 */

// Export client
export * from './client'

// Export ABI
export { R3LAYChannelRegistryABI } from './abi'

// Re-export viem types for convenience
export type { Address, Hash, Hex } from 'viem'
