/**
 * R3MAIL Chain Configuration
 * 
 * Network and contract configuration for R3MAIL
 */

/**
 * R3MAIL Mailbox contract address on Paseo Asset Hub
 * Updated with public key registry support
 */
export const R3MAIL_CONTRACT_ADDRESS = '0x10c261B9647D93215e82207FaBb4Efb009c91c6F' as const

/**
 * Paseo Asset Hub chain ID
 * Actual chain ID returned by RPC (not the documented one)
 */
export const PASEO_ASSET_HUB_CHAIN_ID = 420420422 as const

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
