/**
 * Add Paseo Asset Hub network to MetaMask
 */
export async function addPaseoAssetHub() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not found')
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x190F3FD6', // 420420422 in hex
        chainName: 'Paseo Asset Hub',
        nativeCurrency: {
          name: 'PAS',
          symbol: 'PAS',
          decimals: 18,
        },
        rpcUrls: ['https://testnet-passet-hub-eth-rpc.polkadot.io'],
        blockExplorerUrls: ['https://blockscout-passet-hub.parity-testnet.parity.io'],
      }],
    })
    
    return true
  } catch (error: any) {
    console.error('Failed to add network:', error)
    throw error
  }
}
