/**
 * R3MAIL Chain
 * 
 * Blockchain integration for R3MAIL messaging
 */

// Export config
export {
  R3MAIL_CONTRACT_ADDRESS,
  PASEO_ASSET_HUB_CHAIN_ID,
  PASEO_ASSET_HUB_RPC,
  BLOCK_EXPLORER_URL,
  NETWORK_CONFIG,
} from './config'

// Export client
export {
  R3mailChainClient,
  createR3mailChainClient,
  type MessageNotifiedEvent,
  type WatchInboxOptions,
} from './client'

// Export ABI
export { default as mailboxAbi } from './abi.json'
