<template>
  <div>
    <CreatorNav />
    <div class="container mx-auto p-8 max-w-4xl">
      <div class="space-y-8">
        <!-- Header -->
        <div>
          <h1 class="text-4xl font-bold">Creator Dashboard</h1>
          <p class="text-muted-foreground mt-2">
            Manage your encrypted publishing channel
          </p>
        </div>

      <!-- Status Cards -->
      <div class="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Identity</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="hasCreatorIdentity" class="space-y-2">
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full bg-green-500" />
                <span class="text-sm">Active</span>
              </div>
              <p class="text-xs text-muted-foreground font-mono">
                {{ truncatedPubkey }}
              </p>
            </div>
            <div v-else>
              <Button @click="initCreator" size="sm">
                Initialize Identity
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="loading" class="space-y-2">
              <Icon name="lucide:loader-2" class="h-4 w-4 animate-spin text-muted-foreground" />
              <p class="text-xs text-muted-foreground">Loading...</p>
            </div>
            <div v-else-if="hasChannel" class="space-y-2">
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full bg-green-500" />
                <span class="text-sm">Active</span>
              </div>
              <div class="flex items-center justify-between">
                <p class="text-xs text-muted-foreground">
                  {{ subscriberCount }} subscribers
                </p>
                <NuxtLink to="/creator/subscribers">
                  <Button variant="ghost" size="sm" class="h-6 px-2 text-xs">
                    Manage
                  </Button>
                </NuxtLink>
              </div>
            </div>
            <div v-else class="space-y-2">
              <p class="text-xs text-muted-foreground">No channel yet</p>
              <NuxtLink to="/creator/channel/create">
                <Button size="sm">
                  Create Channel
                </Button>
              </NuxtLink>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Quick Actions -->
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid gap-4 md:grid-cols-2">
            <NuxtLink to="/creator/post/new">
              <Button class="w-full" :disabled="!canPublish">
                <Icon name="lucide:plus" class="mr-2" />
                New Post
              </Button>
            </NuxtLink>

            <NuxtLink to="/creator/subscribers">
              <Button variant="outline" class="w-full" :disabled="!hasChannel">
                <Icon name="lucide:user-check" class="mr-2" />
                Manage Subscribers
              </Button>
            </NuxtLink>

            <NuxtLink to="/creator/posts">
              <Button variant="outline" class="w-full" :disabled="!hasChannel">
                <Icon name="lucide:file-text" class="mr-2" />
                View Posts
              </Button>
            </NuxtLink>

            <NuxtLink to="/creator/settings">
              <Button variant="outline" class="w-full">
                <Icon name="lucide:settings" class="mr-2" />
                Settings
              </Button>
            </NuxtLink>
          </div>
        </CardContent>
      </Card>

      <!-- Recent Activity -->
      <Card v-if="hasChannel">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest posts and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="text-sm text-muted-foreground">
            No recent activity
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { hasCreatorIdentity, initializeCreator, getCreatorPublicKey } = useR3layCore()
const { isConnected, walletAddress, connectWallet, getChannel, getFollowerCount } = useR3layChain()
const { deriveChannelIdFromAddress } = await import('../../packages/r3lay-core/src/utils/index.ts')

// Local state
const loading = ref(true)
const hasChannel = ref(false)
const subscriberCount = ref(0)
const channelId = ref<string | null>(null)

// Computed
const canPublish = computed(() => {
  return hasCreatorIdentity.value && isConnected.value && hasChannel.value
})

const truncatedPubkey = ref('')

// Update pubkey when identity changes
watch(hasCreatorIdentity, async () => {
  if (hasCreatorIdentity.value) {
    const pubkey = await getCreatorPublicKey()
    if (pubkey) {
      truncatedPubkey.value = `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`
    }
  } else {
    truncatedPubkey.value = ''
  }
}, { immediate: true })

const truncatedAddress = computed(() => {
  if (!walletAddress.value) return ''
  return `${walletAddress.value.slice(0, 6)}...${walletAddress.value.slice(-4)}`
})

// Actions
const initCreator = async () => {
  try {
    console.log('Starting creator initialization...')
    await initializeCreator()
    console.log('Creator initialized successfully')
  } catch (error: any) {
    console.error('Failed to initialize creator:', error)
    console.error('Error details:', error.message, error.stack)
    alert(`Failed to initialize creator: ${error.message || error}`)
  }
}

const connect = async () => {
  try {
    await connectWallet()
  } catch (error) {
    console.error('Failed to connect wallet:', error)
  }
}

// Load channel data
const loadChannelData = async () => {
  if (!isConnected.value || !walletAddress.value) {
    loading.value = false
    return
  }

  try {
    // Derive channel ID from wallet address
    const derivedChannelId = deriveChannelIdFromAddress(walletAddress.value)
    channelId.value = derivedChannelId

    // Check if channel exists
    try {
      await getChannel(derivedChannelId)
      hasChannel.value = true

      // Load subscriber count
      const count = await getFollowerCount(derivedChannelId)
      subscriberCount.value = count
    } catch (e) {
      // Channel doesn't exist
      hasChannel.value = false
      subscriberCount.value = 0
    }
  } catch (e) {
    console.error('Failed to load channel data:', e)
  } finally {
    loading.value = false
  }
}

// Watch for wallet connection changes
watch([isConnected, walletAddress], () => {
  if (isConnected.value && walletAddress.value) {
    loadChannelData()
  }
}, { immediate: true })

// Load on mount
onMounted(async () => {
  const { loadIdentities } = useR3layCore()
  await loadIdentities()
  await loadChannelData()
})

definePageMeta({
  layout: 'default',
})

</script>
