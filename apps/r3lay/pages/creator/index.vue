<template>
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
      <div class="grid gap-4 md:grid-cols-3">
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
            <CardTitle>Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="isConnected" class="space-y-2">
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full bg-green-500" />
                <span class="text-sm">Connected</span>
              </div>
              <p class="text-xs text-muted-foreground font-mono">
                {{ truncatedAddress }}
              </p>
            </div>
            <div v-else>
              <Button @click="connect" size="sm">
                Connect Wallet
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="hasChannel" class="space-y-2">
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full bg-green-500" />
                <span class="text-sm">Active</span>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ followerCount }} followers
              </p>
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

            <NuxtLink to="/creator/followers">
              <Button variant="outline" class="w-full" :disabled="!hasChannel">
                <Icon name="lucide:users" class="mr-2" />
                Manage Followers
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
</template>

<script setup lang="ts">
const { hasCreatorIdentity, initializeCreator, getCreatorPublicKey } = useR3layCore()
const { isConnected, walletAddress, connectWallet } = useR3layChain()

// Local state
const hasChannel = ref(false)
const followerCount = ref(0)

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

// Load on mount
onMounted(async () => {
  const { loadIdentities } = useR3layCore()
  await loadIdentities()
  
  // TODO: Check if channel exists
  // TODO: Load follower count
})

definePageMeta({
  layout: 'default',
})
</script>
