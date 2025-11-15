<template>
  <div class="container mx-auto p-8 max-w-4xl">
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <NuxtLink to="/follower" class="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center">
          <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
          Back to Dashboard
        </NuxtLink>
        <h1 class="text-4xl font-bold mt-4">Discover Channels</h1>
        <p class="text-muted-foreground mt-2">
          Browse all channels on the R3LAY network
        </p>
      </div>

      <!-- Loading/Indexing State -->
      <Card v-if="isIndexing || loading">
        <CardContent class="py-12">
          <div class="text-center space-y-4">
            <Icon name="lucide:loader-2" class="h-12 w-12 mx-auto animate-spin text-muted-foreground mb-4" />
            <div>
              <p class="text-muted-foreground font-medium">{{ isIndexing ? 'Indexing blockchain...' : 'Loading channels...' }}</p>
              <p class="text-sm text-muted-foreground mt-2">{{ isIndexing ? 'Scanning for channel events' : 'Please wait' }}</p>
            </div>
            <div v-if="indexProgress > 0" class="max-w-xs mx-auto">
              <div class="w-full bg-muted rounded-full h-2">
                <div class="bg-primary h-2 rounded-full transition-all" :style="{ width: `${indexProgress}%` }"></div>
              </div>
              <p class="text-xs text-muted-foreground mt-2">{{ Math.round(indexProgress) }}%</p>
            </div>
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

      <!-- Channels List -->
      <Card v-else>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Discovered Channels ({{ channels.length }})</CardTitle>
              <CardDescription>
                Channels indexed from the blockchain
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
                <NuxtLink :to="`/follower/channel/${channel.channelId}`">
                  <Button variant="default" size="sm">
                    <Icon name="lucide:eye" class="mr-2 h-4 w-4" />
                    View
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
</template>

<script setup lang="ts">
const { isIndexing, indexProgress, channels: indexedChannels, scanChannelEvents, loadIndexedChannels } = useChannelIndexer()

// State
const loading = ref(true)
const error = ref('')
const channels = computed(() => indexedChannels.value)

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
