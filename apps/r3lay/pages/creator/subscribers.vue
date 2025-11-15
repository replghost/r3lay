<template>
  <div>
    <CreatorNav />
    <div class="container mx-auto p-8 max-w-4xl">
      <div class="space-y-8">
        <!-- Header -->
        <div>
          <h1 class="text-4xl font-bold">Manage Subscribers</h1>
          <p class="text-muted-foreground mt-2">
            Approve or reject subscription requests
          </p>
        </div>

        <!-- Loading -->
        <Card v-if="loading">
          <CardContent class="py-12">
            <div class="text-center">
              <Icon name="lucide:loader-2" class="h-12 w-12 mx-auto animate-spin text-muted-foreground mb-4" />
              <p class="text-muted-foreground">Loading subscribers...</p>
            </div>
          </CardContent>
        </Card>

        <!-- Error -->
        <Card v-else-if="error" class="border-destructive">
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-destructive">
              <Icon name="lucide:alert-circle" class="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">{{ error }}</p>
          </CardContent>
        </Card>

        <!-- No Channel -->
        <Card v-else-if="!channelId">
          <CardContent class="py-12">
            <div class="text-center space-y-4">
              <Icon name="lucide:inbox" class="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <p class="text-lg font-medium">No Channel Found</p>
                <p class="text-sm text-muted-foreground mt-2">
                  Create a channel first to manage subscribers
                </p>
              </div>
              <NuxtLink to="/creator/channel/create">
                <Button>
                  <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
                  Create Channel
                </Button>
              </NuxtLink>
            </div>
          </CardContent>
        </Card>

        <template v-else>
          <!-- Pending Requests -->
          <Card>
            <CardHeader>
              <div class="flex items-center justify-between">
                <div>
                  <CardTitle>Pending Requests ({{ pendingRequests.length }})</CardTitle>
                  <CardDescription>
                    Review and approve subscription requests
                  </CardDescription>
                </div>
                <Button @click="loadData" variant="outline" size="sm" :disabled="loading">
                  <Icon name="lucide:refresh-cw" class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div v-if="pendingRequests.length === 0" class="text-center py-12">
                <Icon name="lucide:check-circle" class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p class="text-muted-foreground">No pending requests</p>
                <p class="text-sm text-muted-foreground mt-2">
                  All subscription requests have been processed
                </p>
              </div>

              <div v-else class="space-y-4">
                <div 
                  v-for="request in pendingRequests" 
                  :key="request.follower"
                  class="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div class="flex-1">
                    <p class="font-mono text-sm">{{ request.follower }}</p>
                    <p class="text-xs text-muted-foreground mt-1">
                      Requested {{ formatTimestamp(request.requestedAt) }}
                    </p>
                  </div>
                  <div class="flex gap-2">
                    <Button 
                      @click="approveRequest(request.follower)"
                      variant="default"
                      size="sm"
                      :disabled="processing === request.follower"
                    >
                      <Icon 
                        :name="processing === request.follower ? 'lucide:loader-2' : 'lucide:check'" 
                        class="mr-2 h-4 w-4"
                        :class="{ 'animate-spin': processing === request.follower }"
                      />
                      Approve
                    </Button>
                    <Button 
                      @click="rejectRequest(request.follower)"
                      variant="destructive"
                      size="sm"
                      :disabled="processing === request.follower"
                    >
                      <Icon name="lucide:x" class="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Approved Subscribers -->
          <Card>
            <CardHeader>
              <CardTitle>Approved Subscribers ({{ approvedFollowers.length }})</CardTitle>
              <CardDescription>
                Followers who can read your encrypted posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div v-if="approvedFollowers.length === 0" class="text-center py-12">
                <Icon name="lucide:users" class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p class="text-muted-foreground">No approved subscribers yet</p>
                <p class="text-sm text-muted-foreground mt-2">
                  Approve subscription requests to add subscribers
                </p>
              </div>

              <div v-else class="space-y-4">
                <div 
                  v-for="follower in approvedFollowers" 
                  :key="follower"
                  class="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div class="flex-1">
                    <p class="font-mono text-sm">{{ follower }}</p>
                    <p class="text-xs text-muted-foreground mt-1">
                      <Icon name="lucide:check-circle" class="inline h-3 w-3 mr-1" />
                      Approved
                    </p>
                  </div>
                  <Button 
                    @click="revokeAccess(follower)"
                    variant="outline"
                    size="sm"
                    :disabled="revoking === follower"
                  >
                    <Icon 
                      :name="revoking === follower ? 'lucide:loader-2' : 'lucide:user-x'" 
                      class="mr-2 h-4 w-4"
                      :class="{ 'animate-spin': revoking === follower }"
                    />
                    Revoke
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getChannel, getPendingRequests, getApprovedFollowers, processSubscription, revokeSubscription, isConnected, walletAddress } = useR3layChain()

// Derive channel ID from wallet address (pad to 32 bytes)
const deriveChannelIdFromAddress = (address: string): string => {
  const cleanAddress = address.toLowerCase().replace(/^0x/, '')
  const padded = cleanAddress.padStart(64, '0')
  return `0x${padded}`
}

// State
const loading = ref(true)
const error = ref('')
const channelId = ref<string | null>(null)
const pendingRequests = ref<any[]>([])
const approvedFollowers = ref<string[]>([])
const processing = ref<string | null>(null)
const revoking = ref<string | null>(null)

// Format timestamp
const formatTimestamp = (timestamp: bigint | number) => {
  const date = new Date(Number(timestamp) * 1000)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

// Load channel and subscriber data
const loadData = async () => {
  if (!isConnected.value || !walletAddress.value) {
    error.value = 'Please connect your wallet'
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''

  try {
    // Derive channel ID from wallet address
    const derivedChannelId = deriveChannelIdFromAddress(walletAddress.value)
    channelId.value = derivedChannelId

    // Check if channel exists
    try {
      await getChannel(derivedChannelId)
    } catch (e) {
      channelId.value = null
      loading.value = false
      return
    }

    // Load pending requests
    const pending = await getPendingRequests(derivedChannelId)
    pendingRequests.value = pending

    // Load approved followers
    const approved = await getApprovedFollowers(derivedChannelId)
    approvedFollowers.value = approved.followers

  } catch (e: any) {
    console.error('Failed to load data:', e)
    error.value = e.message || 'Failed to load subscriber data'
  } finally {
    loading.value = false
  }
}

// Approve a subscription request
const approveRequest = async (follower: string) => {
  if (!channelId.value) return

  processing.value = follower

  try {
    await processSubscription(channelId.value, follower as `0x${string}`, true)
    
    // Reload data
    await loadData()
    
    alert('Subscription approved!')
  } catch (e: any) {
    console.error('Failed to approve:', e)
    alert(`Failed to approve: ${e.message}`)
  } finally {
    processing.value = null
  }
}

// Reject a subscription request
const rejectRequest = async (follower: string) => {
  if (!channelId.value) return

  processing.value = follower

  try {
    await processSubscription(channelId.value, follower as `0x${string}`, false)
    
    // Reload data
    await loadData()
    
    alert('Subscription rejected')
  } catch (e: any) {
    console.error('Failed to reject:', e)
    alert(`Failed to reject: ${e.message}`)
  } finally {
    processing.value = null
  }
}

// Revoke access for an approved follower
const revokeAccess = async (follower: string) => {
  if (!channelId.value) return
  
  if (!confirm(`Revoke access for ${follower}?`)) {
    return
  }

  revoking.value = follower

  try {
    await revokeSubscription(channelId.value, follower as `0x${string}`)
    
    // Reload data
    await loadData()
    
    alert('Access revoked')
  } catch (e: any) {
    console.error('Failed to revoke:', e)
    alert(`Failed to revoke: ${e.message}`)
  } finally {
    revoking.value = null
  }
}

// Load data on mount
onMounted(async () => {
  await loadData()
})
</script>
