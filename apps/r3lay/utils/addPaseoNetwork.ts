/**
 * Add or switch to Paseo Asset Hub network in MetaMask
 */
export async function addPaseoAssetHub() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not found')
  }

  const chainId = '0x190f1b46' // 420429638 - actual chain ID returned by RPC

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
        // Check if network already exists (common error)
        if (addError.code === -32603 || addError.message?.includes('already exists') || addError.message?.includes('Duplicate')) {
          console.log('Network already exists, attempting to switch again...')
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId }],
            })
            return true
          } catch (retryError: any) {
            console.error('Failed to switch after detecting existing network:', retryError)
            // If it's an unknown network error, the user has the wrong network saved
            if (retryError.message?.includes('Unknown network')) {
              throw new Error(`You have a network with the wrong Chain ID saved in your wallet. Please manually switch to Passet Hub (Chain ID: 420429638) or delete the incorrect network from your wallet settings.`)
            }
          }
        }
        
        // Only throw for real errors, not duplicate network
        if (addError.code !== 4001) { // 4001 is user rejection
          console.error('Failed to add network:', addError)
          throw new Error(`Please add Passet Hub network manually in MetaMask. Chain ID: 420429638`)
        }
        return false
      }
    } else {
      // User rejected or other error
      console.error('Failed to switch network:', switchError)
      throw new Error('Please switch to Paseo Asset Hub network in MetaMask')
    }
  }
}
