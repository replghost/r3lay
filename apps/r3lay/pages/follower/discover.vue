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

      <!-- Loading -->
      <Card v-if="loading">
        <CardContent class="py-12">
          <div class="text-center">
            <Icon name="lucide:loader-2" class="h-12 w-12 mx-auto animate-spin text-muted-foreground mb-4" />
            <p class="text-muted-foreground">Loading channels...</p>
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

      <!-- Info Card -->
      <Card v-else class="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Icon name="lucide:info" class="h-5 w-5 text-blue-600" />
            Channel Discovery
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <p class="text-sm text-muted-foreground">
            Channel discovery requires indexing blockchain events. For now, get the channel ID directly from creators.
          </p>
          
          <div class="space-y-2">
            <p class="text-sm font-medium">Your channel (for testing):</p>
            <div class="p-3 bg-muted rounded-lg">
              <p class="text-xs font-mono break-all">
                0x000000000000000000000000a2f70cc9798171d3ef8ff7dae91a76e8a1964438
              </p>
            </div>
            <Button 
              @click="copyChannelId" 
              variant="outline" 
              size="sm"
              class="w-full"
            >
              <Icon name="lucide:copy" class="mr-2 h-4 w-4" />
              Copy Channel ID
            </Button>
          </div>

          <div class="pt-4 border-t">
            <NuxtLink to="/follower">
              <Button variant="default" class="w-full">
                <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
                Subscribe to Channel
              </Button>
            </NuxtLink>
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
// State
const loading = ref(false)
const error = ref('')
const channels = ref<any[]>([])

// Copy channel ID
const copyChannelId = async () => {
  try {
    await navigator.clipboard.writeText('0x000000000000000000000000a2f70cc9798171d3ef8ff7dae91a76e8a1964438')
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

definePageMeta({
  layout: 'default',
})
</script>
