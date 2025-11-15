/**
 * Add or switch to Paseo Asset Hub network in MetaMask
 */
export async function addPaseoAssetHub() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not found')
  }

  const chainId = '0x190F3FD6' // 420420422 in hex

  try {
    // Try to switch to the network first
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    })
    return true
  } catch (switchError: any) {
    // If network doesn't exist (error code 4902), add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId,
            chainName: 'Passet Hub',
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
      } catch (addError: any) {
        console.error('Failed to add network:', addError)
        throw new Error(`Please add Passet Hub network manually in MetaMask. Chain ID: 420420422`)
      }
    } else {
      // User rejected or other error
      console.error('Failed to switch network:', switchError)
      throw new Error('Please switch to Paseo Asset Hub network in MetaMask')
    }
  }
}
