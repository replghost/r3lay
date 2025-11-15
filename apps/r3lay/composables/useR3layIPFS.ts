/**
 * IPFS composable
 * 
 * Manages IPFS operations for content storage
 */

import type { FeedIndex, Cid } from '@r3lay/core'

export const useR3layIPFS = () => {
  const config = useRuntimeConfig()
  
  // State
  const ipfsClient = useState('ipfs-client', () => null as any)
  
  // Initialize IPFS client
  const initializeClient = async () => {
    if (ipfsClient.value) return ipfsClient.value
    
    const { IPFSClient } = await import('@r3lay/ipfs')
    
    ipfsClient.value = new IPFSClient({
      apiUrl: config.public.ipfsApiUrl || 'https://ipfs.infura.io:5001',
      gatewayUrl: config.public.ipfsGatewayUrl || 'https://ipfs.io',
      timeout: 30000,
    })
    
    return ipfsClient.value
  }
  
  // Upload feed index
  const uploadFeedIndex = async (feedIndex: FeedIndex): Promise<Cid> => {
    const { uploadFeedIndex: upload } = await import('@r3lay/ipfs')
    const client = await initializeClient()
    return await upload(feedIndex, client)
  }
  
  // Download feed index
  const downloadFeedIndex = async (cid: Cid): Promise<FeedIndex> => {
    const { downloadFeedIndex: download } = await import('@r3lay/ipfs')
    const client = await initializeClient()
    return await download(cid, client)
  }
  
  // Upload encrypted post
  const uploadEncryptedPost = async (bundle: any): Promise<Cid> => {
    const { uploadEncryptedPost: upload } = await import('@r3lay/ipfs')
    const client = await initializeClient()
    return await upload(bundle, client)
  }
  
  // Download encrypted post
  const downloadEncryptedPost = async (cid: Cid) => {
    const { downloadEncryptedPost: download } = await import('@r3lay/ipfs')
    const client = await initializeClient()
    return await download(cid, client)
  }
  
  // Get gateway URL
  const getGatewayUrl = (cid: Cid): string => {
    const gatewayUrl = config.public.ipfsGatewayUrl || 'https://ipfs.io'
    return `${gatewayUrl}/ipfs/${cid}`
  }
  
  return {
    // Actions
    uploadFeedIndex,
    downloadFeedIndex,
    uploadEncryptedPost,
    downloadEncryptedPost,
    getGatewayUrl,
  }
}
