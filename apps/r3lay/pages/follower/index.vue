<template>
  <div>
    <FollowerNav />
    <div class="container mx-auto p-8 max-w-4xl">
      <div class="space-y-8">
        <!-- Header -->
        <div>
          <h1 class="text-4xl font-bold">Follower Dashboard</h1>
          <p class="text-muted-foreground mt-2">
            Read encrypted posts from your subscribed channels
          </p>
        </div>

        <!-- Identity Status -->
        <Card>
          <CardHeader>
            <CardTitle>Your Follower Identity</CardTitle>
            <CardDescription>
              Your encryption keys for reading encrypted posts
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div v-if="!hasIdentity" class="space-y-4">
              <p class="text-sm text-muted-foreground">
                Generate your follower identity to start reading encrypted posts from creators.
              </p>
              <p class="text-xs text-muted-foreground mb-3">Choose initialization method:</p>
              <div class="flex flex-col gap-2">
                <Button 
                  @click="initFollowerFromWalletClick" 
                  :disabled="loading || !isConnected"
                  class="w-full justify-start"
                >
                  <Icon v-if="loading" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
                  <Icon v-else :name="walletIcon" class="mr-2 h-4 w-4" />
                  {{ walletButtonText }}
                </Button>
                <Button 
                  @click="initFollower" 
                  :disabled="loading"
                  variant="outline"
                  class="w-full justify-start"
                >
                  <Icon v-if="loading" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
                  <Icon v-else name="lucide:key" class="mr-2 h-4 w-4" />
                  Generate New Keys
                </Button>
              </div>
              <p v-if="!isConnected" class="text-xs text-muted-foreground mt-2">
                Connect wallet to use wallet-based keys
              </p>
            </div>

          <div v-else class="space-y-4">
            <div class="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <Icon name="lucide:check-circle" class="h-5 w-5 text-green-600 mt-0.5" />
              <div class="flex-1">
                <p class="font-medium text-green-900 dark:text-green-100">Identity Active</p>
                <p class="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your encryption keys are ready
                </p>
              </div>
            </div>

            <div class="space-y-2">
              <Label>Your Public Key</Label>
              <div class="flex gap-2">
                <Input 
                  :value="publicKey" 
                  readonly 
                  class="font-mono text-xs"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  @click="copyPublicKey"
                >
                  <Icon name="lucide:copy" class="h-4 w-4" />
                </Button>
              </div>
              <p class="text-xs text-muted-foreground">
                Share this public key with creators so they can encrypt posts for you
              </p>
            </div>

            <div class="pt-4 border-t">
              <Button 
                @click="clearIdentity" 
                variant="destructive"
                size="sm"
                class="w-full"
              >
                <Icon name="lucide:trash-2" class="mr-2 h-4 w-4" />
                Clear Identity & Use Wallet Keys
              </Button>
              <p class="text-xs text-muted-foreground mt-2 text-center">
                This will delete your current keys. You can then use wallet-based keys instead.
              </p>
            </div>
          </div>

          <div v-if="error" class="p-3 bg-destructive/10 border border-destructive rounded-lg">
            <p class="text-sm text-destructive">{{ error }}</p>
          </div>
        </CardContent>
      </Card>

      <!-- Subscribed Channels -->
      <Card v-if="hasIdentity">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Subscribed Channels</CardTitle>
              <CardDescription>
                Channels you're following
              </CardDescription>
            </div>
            <div class="flex gap-2">
              <NuxtLink to="/follower/discover">
                <Button variant="outline" size="sm">
                  <Icon name="lucide:compass" class="mr-2 h-4 w-4" />
                  Discover
                </Button>
              </NuxtLink>
              <Button 
                @click="showAddChannel = true" 
                size="sm"
              >
                <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
                Subscribe
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="channels.length === 0" class="text-center py-8">
            <Icon name="lucide:rss" class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p class="text-muted-foreground">No channels yet</p>
            <p class="text-sm text-muted-foreground mt-2">
              Subscribe to a creator's channel to read their posts
            </p>
          </div>

          <div v-else class="space-y-4">
            <NuxtLink 
              v-for="channel in channels" 
              :key="channel.channelId || channel"
              :to="`/follower/channel/${channel.channelId || channel}`"
              class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors block"
            >
              <div class="flex-1">
                <p class="font-medium">{{ channel.name || 'Unnamed Channel' }}</p>
                <p v-if="channel.channelId" class="text-xs text-muted-foreground font-mono">{{ channel.channelId.slice(0, 20) }}...</p>
                <p v-else class="text-xs text-muted-foreground font-mono">{{ channel.slice(0, 20) }}...</p>
              </div>
              <Icon name="lucide:chevron-right" class="h-5 w-5 text-muted-foreground" />
            </NuxtLink>
          </div>
        </CardContent>
      </Card>

      <!-- Add Channel Modal -->
      <div v-if="showAddChannel" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showAddChannel = false">
        <Card class="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle>Subscribe to Channel</CardTitle>
            <CardDescription>
              Enter the channel ID from the creator
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label for="channel-name">Channel Name (optional)</Label>
              <Input 
                id="channel-name" 
                v-model="newChannelName" 
                placeholder="My Favorite Creator"
              />
            </div>

            <div class="space-y-2">
              <Label for="channel-id">Channel ID *</Label>
              <Input 
                id="channel-id" 
                v-model="newChannelId" 
                placeholder="0x..."
                class="font-mono text-sm"
              />
            </div>

            <div v-if="addError" class="p-3 bg-destructive/10 border border-destructive rounded-lg">
              <p class="text-sm text-destructive">{{ addError }}</p>
            </div>
          </CardContent>
          <CardFooter class="flex gap-2">
            <Button 
              variant="outline" 
              @click="showAddChannel = false"
              class="flex-1"
            >
              Cancel
            </Button>
            <Button 
              @click="addChannel" 
              :disabled="!newChannelId.trim() || addingChannel"
              class="flex-1"
            >
              <Icon v-if="addingChannel" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
              Subscribe
            </Button>
          </CardFooter>
        </Card>
      </div>

      <!-- Info Card -->
      <Card class="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Icon name="lucide:info" class="h-5 w-5 text-blue-600" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-2 text-sm text-muted-foreground">
          <p>
            • Generate your follower identity to get encryption keys
          </p>
          <p>
            • Share your public key with creators you want to follow
          </p>
          <p>
            • Subscribe to channels using the channel ID
          </p>
          <p>
            • Read encrypted posts that creators publish for you
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { 
  hasFollowerIdentity, 
  initializeFollower, 
  initializeFollowerFromWallet,
  getFollowerPublicKey,
  detectWallet 
} = useR3layCore()
const { getChannel, isConnected, walletAddress } = useR3layChain()

interface Channel {
  channelId: string
  name?: string
}

// State
const hasIdentity = ref(false)
const publicKey = ref<string | null>(null)
const loading = ref(false)
const error = ref('')
const channels = ref<Channel[]>([])
const showAddChannel = ref(false)
const newChannelName = ref('')
const newChannelId = ref('')
const addError = ref('')
const addingChannel = ref(false)

// Wallet detection
const walletType = computed(() => detectWallet())
const walletIcon = computed(() => {
  switch (walletType.value) {
    case 'metamask': return 'lucide:wallet'
    case 'talisman': return 'lucide:wallet'
    default: return 'lucide:wallet'
  }
})
const walletButtonText = computed(() => {
  const wallet = walletType.value === 'talisman' ? 'Talisman' : walletType.value === 'metamask' ? 'MetaMask' : 'Wallet'
  return `Use ${wallet} Keys`
})

// Initialize follower (generate new keys)
const initFollower = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await initializeFollower()
    hasIdentity.value = true
    publicKey.value = await getFollowerPublicKey()
  } catch (e: any) {
    error.value = e.message || 'Failed to initialize follower'
  } finally {
    loading.value = false
  }
}

// Initialize follower from wallet
const initFollowerFromWalletClick = async () => {
  if (!walletAddress.value) {
    error.value = 'Please connect your wallet first'
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    await initializeFollowerFromWallet(walletAddress.value)
    hasIdentity.value = true
    publicKey.value = await getFollowerPublicKey()
  } catch (e: any) {
    if (e.message.includes('rejected')) {
      error.value = 'Signature request rejected. Please approve the signature to derive your keys.'
    } else {
      error.value = e.message || 'Failed to derive keys from wallet'
    }
  } finally {
    loading.value = false
  }
}

// Clear identity
const clearIdentity = async () => {
  if (!confirm('Are you sure you want to delete your current identity? This cannot be undone.')) {
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    // Clear from IndexedDB
    const db = await openDB()
    const transaction = db.transaction(['follower_keys'], 'readwrite')
    const store = transaction.objectStore('follower_keys')
    await new Promise<void>((resolve, reject) => {
      const request = store.delete('identity')
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
    
    // Reset state
    hasIdentity.value = false
    publicKey.value = ''
    
    // Show success message briefly
    error.value = ''
    console.log('Identity cleared successfully')
  } catch (e: any) {
    error.value = e.message || 'Failed to clear identity'
  } finally {
    loading.value = false
  }
}

// Helper to open IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('r3lay_keystore', 1)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Copy public key
const copyPublicKey = async () => {
  if (!publicKey.value) return
  
  try {
    await navigator.clipboard.writeText(publicKey.value)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

// Load channels
const loadChannels = () => {
  try {
    const stored = localStorage.getItem('r3lay-subscribed-channels')
    if (stored) {
      channels.value = JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load channels:', e)
  }
}

// Save channels
const saveChannels = () => {
  try {
    localStorage.setItem('r3lay-subscribed-channels', JSON.stringify(channels.value))
  } catch (e) {
    console.error('Failed to save channels:', e)
  }
}

// Add channel
const addChannel = async () => {
  addError.value = ''
  const channelId = newChannelId.value.trim()
  
  if (!channelId) {
    addError.value = 'Channel ID is required'
    return
  }
  
  // Check if already subscribed
  if (channels.value.some(c => c.channelId === channelId)) {
    addError.value = 'Already subscribed to this channel'
    return
  }
  
  addingChannel.value = true
  
  try {
    // Verify channel exists on-chain
    await getChannel(channelId)
    
    const newChannel: Channel = {
      channelId,
      name: newChannelName.value.trim() || undefined,
    }
    
    channels.value.push(newChannel)
    saveChannels()
    
    // Reset form
    newChannelName.value = ''
    newChannelId.value = ''
    showAddChannel.value = false
  } catch (e: any) {
    addError.value = e.message || 'Failed to add channel. Make sure the channel ID is valid.'
  } finally {
    addingChannel.value = false
  }
}

// Load on mount
onMounted(async () => {
  const { loadIdentities } = useR3layCore()
  await loadIdentities()
  
  hasIdentity.value = hasFollowerIdentity.value
  if (hasIdentity.value) {
    publicKey.value = await getFollowerPublicKey()
  }
  
  loadChannels()
})

definePageMeta({
  layout: 'default',
})
</script>
