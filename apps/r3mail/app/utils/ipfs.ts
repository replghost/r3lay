/**
 * IPFS utilities using Pinata
 */

import { PinataSDK } from 'pinata-web3'

// Initialize Pinata client
// For now, we'll use a public gateway for reading
// For production, you'd want to use environment variables for the JWT
let pinata: PinataSDK | null = null

function getPinataClient() {
  if (!pinata) {
    // Using public Pinata gateway for demo
    // In production, set NUXT_PUBLIC_PINATA_JWT in .env
    const jwt = import.meta.env.NUXT_PUBLIC_PINATA_JWT || ''
    
    if (jwt) {
      pinata = new PinataSDK({
        pinataJwt: jwt,
      })
    }
  }
  return pinata
}

/**
 * Upload JSON data to IPFS via Pinata
 */
export async function uploadJSON(data: any, name?: string): Promise<string> {
  const client = getPinataClient()
  
  if (!client) {
    // Fallback: Use public IPFS gateway (read-only for demo)
    console.warn('No Pinata JWT configured, using mock CID')
    // Generate a mock CID for demo purposes
    const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    
    // Store in localStorage as fallback
    localStorage.setItem(`ipfs_${mockCid}`, JSON.stringify(data))
    return mockCid
  }

  try {
    const result = await client.upload.json(data, {
      metadata: {
        name: name || 'r3mail-data',
      },
    })
    
    return result.IpfsHash
  } catch (error) {
    console.error('Failed to upload to IPFS:', error)
    throw new Error('Failed to upload to IPFS')
  }
}

/**
 * Upload text/binary data to IPFS via Pinata
 */
export async function uploadFile(data: Blob | File, name?: string): Promise<string> {
  const client = getPinataClient()
  
  if (!client) {
    console.warn('No Pinata JWT configured, using mock CID')
    const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    
    // Store in localStorage as fallback
    const reader = new FileReader()
    const content = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string)
      reader.readAsText(data)
    })
    localStorage.setItem(`ipfs_${mockCid}`, content)
    return mockCid
  }

  try {
    const file = data instanceof File ? data : new File([data], name || 'file')
    const result = await client.upload.file(file)
    
    return result.IpfsHash
  } catch (error) {
    console.error('Failed to upload file to IPFS:', error)
    throw new Error('Failed to upload file to IPFS')
  }
}

/**
 * Fetch data from IPFS by CID
 */
export async function fetchFromIPFS(cid: string): Promise<any> {
  // First check localStorage fallback
  const localData = localStorage.getItem(`ipfs_${cid}`)
  if (localData) {
    try {
      return JSON.parse(localData)
    } catch {
      return localData
    }
  }

  // Try public IPFS gateways
  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
  ]

  for (const gateway of gateways) {
    try {
      const response = await fetch(gateway, {
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          return await response.json()
        }
        return await response.text()
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${gateway}:`, error)
      continue
    }
  }

  throw new Error(`Failed to fetch CID ${cid} from IPFS`)
}

/**
 * Get IPFS gateway URL for a CID
 */
export function getIPFSUrl(cid: string): string {
  return `https://gateway.pinata.cloud/ipfs/${cid}`
}

/**
 * Check if Pinata is configured
 */
export function isPinataConfigured(): boolean {
  return !!import.meta.env.NUXT_PUBLIC_PINATA_JWT
}
