// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  ssr: false,

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/test-utils',
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt'
  ],

  css: ['~/assets/css/tailwind.css'],

  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './components/ui'
  },

  alias: {
    '@r3lay/core': '../../packages/r3lay-core/src/index.ts',
    '@r3lay/ipfs': '../../packages/r3lay-ipfs/src/index.ts',
    '@r3lay/chain': '../../packages/r3lay-chain/src/index.ts',
  },

  vite: {
    optimizeDeps: {
      exclude: ['@r3lay/core', '@r3lay/ipfs', '@r3lay/chain']
    }
  },

  runtimeConfig: {
    public: {
      rpcUrl: process.env.RPC_URL || 'https://paseo-asset-hub-rpc.polkadot.io',
      chainId: process.env.CHAIN_ID || '1000',
      contractAddress: process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
      // Use a local IPFS node or public endpoint
      // For production, you'll need to set up your own IPFS node or use a service with API keys
      ipfsApiUrl: process.env.IPFS_API_URL || 'http://localhost:5001',
      ipfsGatewayUrl: process.env.IPFS_GATEWAY_URL || 'https://ipfs.io',
    }
  }
})
