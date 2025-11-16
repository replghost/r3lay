/**
 * R3MAIL Chain Configuration
 * 
 * Network and contract configuration for R3MAIL
 */

/**
 * R3MAIL Mailbox contract address on Paseo Asset Hub
 */
export const R3MAIL_CONTRACT_ADDRESS = '0xABE4bEea70cA1F2A4B9a5eACcB9972E096B5d769' as const

/**
 * Paseo Asset Hub chain ID
 */
export const PASEO_ASSET_HUB_CHAIN_ID = 420429638 as const

/**
 * Paseo Asset Hub RPC URL
 */
export const PASEO_ASSET_HUB_RPC = 'https://testnet-passet-hub-eth-rpc.polkadot.io' as const

/**
 * Block explorer URL
 */
export const BLOCK_EXPLORER_URL = 'https://blockscout-passet-hub.parity-testnet.parity.io' as const

/**
 * Network configuration
 */
export const NETWORK_CONFIG = {
  id: PASEO_ASSET_HUB_CHAIN_ID,
  name: 'Paseo Asset Hub',
  nativeCurrency: {
    name: 'PAS',
    symbol: 'PAS',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [PASEO_ASSET_HUB_RPC] },
    public: { http: [PASEO_ASSET_HUB_RPC] },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: BLOCK_EXPLORER_URL,
    },
  },
  testnet: true,
} as const
