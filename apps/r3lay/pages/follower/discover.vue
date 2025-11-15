<template>
  <div>
    <FollowerNav />
    <div class="container mx-auto p-8 max-w-4xl">
      <div class="space-y-8">
        <!-- Header -->
        <div>
          <h1 class="text-4xl font-bold">Discover Channels</h1>
          <p class="text-muted-foreground mt-2">
            Find and subscribe to encrypted newsletters
          </p>
        </div>

      <!-- Indexing Progress (shown while scanning) -->
      <Card v-if="isIndexing" class="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardContent class="py-6">
          <div class="flex items-center gap-4">
            <Icon name="lucide:loader-2" class="h-6 w-6 animate-spin text-blue-600 flex-shrink-0" />
            <div class="flex-1">
              <p class="font-medium text-sm">Scanning blockchain...</p>
              <div class="mt-2 space-y-2">
                <div class="w-full bg-muted rounded-full h-2">
                  <div class="bg-blue-600 h-2 rounded-full transition-all" :style="{ width: `${indexProgress}%` }"></div>
                </div>
                <div class="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{{ Math.round(indexProgress) }}% complete</span>
                  <Button 
                    @click="handleCancel" 
                    variant="ghost" 
                    size="sm"
                    class="h-6 px-2"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Error -->
      <Card v-if="error" class="border-destructive">
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

      <!-- Channels List -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Discovered Channels ({{ channels.length }})</CardTitle>
              <CardDescription>
                {{ isIndexing ? 'Channels found so far...' : 'All indexed channels' }}
              </CardDescription>
            </div>
            <Button @click="refresh" variant="outline" size="sm" :disabled="isIndexing">
              <Icon name="lucide:refresh-cw" class="mr-2 h-4 w-4" :class="{ 'animate-spin': isIndexing }" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="channels.length === 0" class="text-center py-12">
            <Icon name="lucide:inbox" class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p class="text-muted-foreground">No channels found</p>
            <p class="text-sm text-muted-foreground mt-2">
              Be the first to create a channel!
            </p>
          </div>

          <div v-else class="space-y-4">
            <div 
              v-for="channel in channels" 
              :key="channel.channelId"
              class="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div class="flex-1 space-y-2">
                <div class="flex items-center gap-2">
                  <Icon name="lucide:radio" class="h-4 w-4 text-muted-foreground" />
                  <h3 class="font-semibold">{{ channel.meta || 'Unnamed Channel' }}</h3>
                </div>
                
                <div class="text-xs text-muted-foreground space-y-1">
                  <p class="font-mono">Creator: {{ channel.creator.slice(0, 10) }}...{{ channel.creator.slice(-8) }}</p>
                  <p class="font-mono">Channel ID: {{ channel.channelId.slice(0, 20) }}...</p>
                </div>
              </div>

              <div class="flex gap-2">
                <Button 
                  v-if="!isSubscribed(channel.channelId)"
                  variant="default" 
                  size="sm"
                  @click="subscribeToChannel(channel.channelId)"
                >
                  <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
                  Subscribe
                </Button>
                <Button 
                  v-else
                  variant="outline" 
                  size="sm"
                  disabled
                >
                  <Icon name="lucide:check" class="mr-2 h-4 w-4" />
                  Subscribed
                </Button>
                <NuxtLink :to="`/follower/channel/${channel.channelId}`">
                  <Button variant="outline" size="sm">
                    <Icon name="lucide:eye" class="h-4 w-4" />
                  </Button>
                </NuxtLink>
                <Button 
                  variant="outline" 
                  size="sm"
                  @click="copyChannelIdToClipboard(channel.channelId)"
                >
                  <Icon name="lucide:copy" class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Future: Channels List -->
      <Card v-if="false">
        <CardHeader>
          <CardTitle>All Channels ({{ channels.length }})</CardTitle>
          <CardDescription>
            Subscribe to channels to read their encrypted posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="channels.length === 0" class="text-center py-12">
            <Icon name="lucide:inbox" class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p class="text-muted-foreground">No channels found</p>
            <p class="text-sm text-muted-foreground mt-2">
              Be the first to create a channel!
            </p>
          </div>

          <div v-else class="space-y-4">
            <div 
              v-for="channel in channels" 
              :key="channel.channelId"
              class="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div class="flex-1 space-y-2">
                <div class="flex items-center gap-2">
                  <Icon name="lucide:radio" class="h-4 w-4 text-muted-foreground" />
                  <h3 class="font-semibold">{{ channel.meta || 'Unnamed Channel' }}</h3>
                </div>
                
                <div class="text-xs text-muted-foreground space-y-1">
                  <p class="font-mono">Creator: {{ channel.creator.slice(0, 10) }}...{{ channel.creator.slice(-8) }}</p>
                  <p class="font-mono">Channel ID: {{ channel.channelId.slice(0, 20) }}...</p>
                  <p>Created: {{ formatDate(Number(channel.createdAt) * 1000) }}</p>
                </div>

                <div v-if="isSubscribed(channel.channelId)" class="flex items-center gap-2 text-sm text-green-600">
                  <Icon name="lucide:check-circle" class="h-4 w-4" />
                  <span>Subscribed</span>
                </div>
              </div>

              <div class="flex gap-2">
                <Button 
                  v-if="!isSubscribed(channel.channelId)"
                  variant="default" 
                  size="sm"
                  @click="subscribeToChannel(channel)"
                  :disabled="subscribing === channel.channelId"
                >
                  <Icon v-if="subscribing === channel.channelId" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
                  <Icon v-else name="lucide:plus" class="mr-2 h-4 w-4" />
                  Subscribe
                </Button>
                <NuxtLink v-else :to="`/follower/channel/${channel.channelId}`">
                  <Button variant="outline" size="sm">
                    <Icon name="lucide:eye" class="mr-2 h-4 w-4" />
                    View
                  </Button>
                </NuxtLink>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isIndexing, indexProgress, channels: indexedChannels, scanChannelEvents, loadIndexedChannels, cancelScan } = useChannelIndexer()

// State
const loading = ref(true)
const error = ref('')
const channels = computed(() => indexedChannels.value)
const subscribedChannels = ref<string[]>([])

// Load subscribed channels
const loadSubscribedChannels = () => {
  try {
    const stored = localStorage.getItem('r3lay-subscribed-channels')
    if (stored) {
      const channels = JSON.parse(stored)
      subscribedChannels.value = channels.map((c: any) => c.channelId || c)
    }
  } catch (e) {
    console.error('Failed to load subscribed channels:', e)
  }
}

// Check if subscribed
const isSubscribed = (channelId: string) => {
  return subscribedChannels.value.includes(channelId)
}

// Subscribe to channel
const subscribeToChannel = async (channelId: string) => {
  if (subscribedChannels.value.includes(channelId)) {
    return
  }
  
  try {
    // Load existing channels
    const stored = localStorage.getItem('r3lay-subscribed-channels')
    const channels = stored ? JSON.parse(stored) : []
    
    // Get channel metadata
    const channelData = indexedChannels.value.find(c => c.channelId === channelId)
    
    // Add new channel
    channels.push({
      channelId,
      name: channelData?.meta || 'Unnamed Channel',
    })
    
    // Save
    localStorage.setItem('r3lay-subscribed-channels', JSON.stringify(channels))
    subscribedChannels.value.push(channelId)
    
    console.log('✅ Subscribed to channel:', channelId)
  } catch (e) {
    console.error('Failed to subscribe:', e)
  }
}

// Cancel handler
const handleCancel = () => {
  cancelScan()
}

// Copy channel ID to clipboard
const copyChannelIdToClipboard = async (channelId: string) => {
  try {
    await navigator.clipboard.writeText(channelId)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

// Refresh channels
const refresh = async () => {
  try {
    await scanChannelEvents()
  } catch (e: any) {
    error.value = e.message || 'Failed to refresh channels'
  }
}

// Load channels on mount
onMounted(async () => {
  try {
    loadSubscribedChannels()
    await loadIndexedChannels()
    
    // If no channels indexed yet, scan blockchain
    if (channels.value.length === 0) {
      await scanChannelEvents()
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load channels'
  } finally {
    loading.value = false
  }
})

definePageMeta({
  layout: 'default',
})
</script>
