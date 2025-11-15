/**
 * IPFS composable
 * 
 * Manages IPFS operations for content storage
 */

import type { FeedIndex, Cid } from '../../../packages/r3lay-core/src/types'
import { IPFSClient } from '../../../packages/r3lay-ipfs/src/client'
import {
  uploadFeedIndex as uploadFeedIndexHelper,
  downloadFeedIndex as downloadFeedIndexHelper,
  uploadEncryptedPost as uploadEncryptedPostHelper,
  downloadEncryptedPost as downloadEncryptedPostHelper,
} from '../../../packages/r3lay-ipfs/src/helpers'

export const useR3layIPFS = () => {
  const config = useRuntimeConfig()
  
  // State
  const ipfsClient = useState('ipfs-client', () => null as any)
  
  // Initialize IPFS client
  const initializeClient = async () => {
    if (ipfsClient.value) return ipfsClient.value
    
    ipfsClient.value = new IPFSClient({
      apiUrl: config.public.ipfsApiUrl || 'https://ipfs.infura.io:5001',
      gatewayUrl: config.public.ipfsGatewayUrl || 'https://ipfs.io',
      timeout: 30000,
    })
    
    return ipfsClient.value
  }
  
  // Upload feed index
  const uploadFeedIndex = async (feedIndex: FeedIndex): Promise<Cid> => {
    const client = await initializeClient()
    return await uploadFeedIndexHelper(feedIndex, client)
  }
  
  // Download feed index
  const downloadFeedIndex = async (cid: Cid): Promise<FeedIndex> => {
    const client = await initializeClient()
    return await downloadFeedIndexHelper(cid, client)
  }
  
  // Upload encrypted post
  const uploadEncryptedPost = async (bundle: any): Promise<Cid> => {
    const client = await initializeClient()
    return await uploadEncryptedPostHelper(bundle, client)
  }
  
  // Download encrypted post
  const downloadEncryptedPost = async (cid: Cid) => {
    const client = await initializeClient()
    return await downloadEncryptedPostHelper(cid, client)
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
