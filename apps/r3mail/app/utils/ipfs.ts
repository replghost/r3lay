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
    // Get JWT from runtime config (Nuxt 3)
    // Set NUXT_PUBLIC_PINATA_JWT in .env
    const config = useRuntimeConfig()
    const jwt = config.public.pinataJwt || ''
    
    console.log('🔑 Pinata JWT configured:', jwt ? 'YES ✅' : 'NO ❌')
    
    if (jwt) {
      pinata = new PinataSDK({
        pinataJwt: jwt,
      })
      console.log('✅ Pinata client initialized')
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
    // Fallback: Use localStorage for demo (no real IPFS)
    console.warn('⚠️ No Pinata JWT configured! Using localStorage fallback.')
    console.warn('Set NUXT_PUBLIC_PINATA_JWT in .env for real IPFS uploads')
    
    // Generate a proper-length mock CID (46 chars like real CIDs)
    const randomPart = Array.from({ length: 44 }, () => 
      Math.random().toString(36)[2] || '0'
    ).join('')
    const mockCid = `Qm${randomPart}`
    
    // Store in localStorage as fallback
    localStorage.setItem(`ipfs_${mockCid}`, JSON.stringify(data))
    console.log('📦 Stored in localStorage with mock CID:', mockCid)
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
    console.warn('⚠️ No Pinata JWT configured! Using localStorage fallback.')
    
    // Generate a proper-length mock CID (46 chars like real CIDs)
    const randomPart = Array.from({ length: 44 }, () => 
      Math.random().toString(36)[2] || '0'
    ).join('')
    const mockCid = `Qm${randomPart}`
    
    // Store in localStorage as fallback
    const reader = new FileReader()
    const content = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(data) // Use dataURL to preserve binary
    })
    localStorage.setItem(`ipfs_${mockCid}`, content)
    console.log('📦 Stored file in localStorage with mock CID:', mockCid)
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
  // Check localStorage first (for mock CIDs)
  const localData = localStorage.getItem(`ipfs_${cid}`)
  if (localData) {
    console.log('📦 Retrieved from localStorage:', cid)
    try {
      // Try to parse as JSON first
      return JSON.parse(localData)
    } catch {
      // If not JSON, check if it's a data URL
      if (localData.startsWith('data:')) {
        // Convert data URL back to Uint8Array
        const parts = localData.split(',')
        if (parts[1]) {
          const binary = atob(parts[1])
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i)
          }
          return bytes
        }
      }
      return localData
    }
  }
  
  // Use dedicated Pinata gateway (no rate limits with your account)
  // Or use public gateways as fallback
  const gateways = [
    `https://ipfs.io/ipfs/${cid}`,
    `https://dweb.link/ipfs/${cid}`,
    `https://gateway.pinata.cloud/ipfs/${cid}`,
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
