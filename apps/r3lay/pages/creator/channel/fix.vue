<template>
  <div class="container mx-auto p-8 max-w-2xl">
    <Card>
      <CardHeader>
        <CardTitle>Fix Channel Feed Index</CardTitle>
        <CardDescription>
          Update your channel with a proper feed index
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div v-if="!walletAddress">
          <p class="text-sm text-muted-foreground mb-4">
            Connect your wallet to fix your channel.
          </p>
          
          <Button @click="connectWallet" :disabled="loading" class="w-full">
            <Icon v-if="loading" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
            Connect Wallet
          </Button>
          
          <div v-if="error" class="mt-4 p-3 bg-destructive/10 border border-destructive rounded-lg">
            <p class="text-sm text-destructive">{{ error }}</p>
          </div>
        </div>
        
        <div v-else-if="!fixed">
          <p class="text-sm text-muted-foreground mb-4">
            Your channel needs a feed index to work properly. This will create and upload one.
          </p>
          
          <Button @click="fixChannel" :disabled="loading" class="w-full">
            <Icon v-if="loading" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
            Fix Channel
          </Button>
          
          <div v-if="error" class="mt-4 p-3 bg-destructive/10 border border-destructive rounded-lg">
            <p class="text-sm text-destructive">{{ error }}</p>
          </div>
        </div>
        
        <div v-else class="text-center py-8">
          <Icon name="lucide:check-circle" class="h-16 w-16 mx-auto text-green-600 mb-4" />
          <p class="font-medium">Channel Fixed!</p>
          <p class="text-sm text-muted-foreground mt-2">Your channel now has a proper feed index.</p>
          
          <NuxtLink to="/creator" class="mt-4 inline-block">
            <Button>Back to Dashboard</Button>
          </NuxtLink>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
const { walletAddress, connectWallet: connectWalletFn, updateChannel } = useR3layChain()
const { uploadFeedIndex } = useR3layIPFS()
const { getCreatorPublicKey } = useR3layCore()

const loading = ref(false)
const error = ref('')
const fixed = ref(false)

const connectWallet = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // Skip network add - just connect wallet
    // MetaMask should already have Paseo if you used it before
    await connectWalletFn()
  } catch (e: any) {
    error.value = e.message || 'Failed to connect wallet'
  } finally {
    loading.value = false
  }
}

const fixChannel = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // Get channel ID
    const { deriveChannelIdFromAddress } = await import('../../../packages/r3lay-core/src/utils/index.ts')
    const channelId = deriveChannelIdFromAddress(walletAddress.value!)
    
    // Get existing posts from localStorage
    const existingPosts = JSON.parse(localStorage.getItem('r3lay-posts') || '[]')
    
    // Create feed index
    const publicKey = await getCreatorPublicKey()
    const feedIndex = {
      version: 1 as const,
      creator: publicKey || '',
      channelId,
      posts: existingPosts.map((p: any) => p.cid),
      updatedAt: Date.now(),
    }
    
    // Upload to IPFS
    const indexCid = await uploadFeedIndex(feedIndex)
    
    // Update channel on-chain
    await updateChannel(channelId, indexCid)
    
    fixed.value = true
  } catch (e: any) {
    error.value = e.message || 'Failed to fix channel'
    console.error('Fix error:', e)
  } finally {
    loading.value = false
  }
}

definePageMeta({
  layout: 'default',
})
</script>
