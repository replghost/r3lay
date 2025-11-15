<template>
  <div class="container mx-auto p-8 max-w-4xl">
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <NuxtLink to="/creator" class="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center">
          <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
          Back to Dashboard
        </NuxtLink>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-4xl font-bold">Your Posts</h1>
            <p class="text-muted-foreground mt-2">
              View and manage your published encrypted posts
            </p>
          </div>
          <NuxtLink to="/creator/post/new">
            <Button>
              <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
              New Post
            </Button>
          </NuxtLink>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ posts.length }}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-sm font-medium text-muted-foreground">Followers</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ followerCount }}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-sm font-medium text-muted-foreground">Last Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ lastPublished }}</div>
          </CardContent>
        </Card>
      </div>

      <!-- Posts List -->
      <Card>
        <CardHeader>
          <CardTitle>Published Posts</CardTitle>
          <CardDescription>
            All your encrypted posts stored on IPFS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="text-center py-8">
            <Icon name="lucide:loader-2" class="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
            <p class="text-sm text-muted-foreground mt-4">Loading posts...</p>
          </div>

          <div v-else-if="posts.length === 0" class="text-center py-12">
            <Icon name="lucide:file-text" class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 class="text-lg font-semibold mb-2">No posts yet</h3>
            <p class="text-sm text-muted-foreground mb-6">
              Create your first encrypted post to get started
            </p>
            <NuxtLink to="/creator/post/new">
              <Button>
                <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
                Create First Post
              </Button>
            </NuxtLink>
          </div>

          <div v-else class="space-y-4">
            <div 
              v-for="post in posts" 
              :key="post.cid"
              class="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 space-y-2">
                  <div class="flex items-center gap-2">
                    <Icon name="lucide:file-text" class="h-4 w-4 text-muted-foreground" />
                    <h3 class="font-semibold">{{ post.title }}</h3>
                  </div>
                  
                  <div class="flex items-center gap-4 text-xs text-muted-foreground">
                    <div class="flex items-center gap-1">
                      <Icon name="lucide:calendar" class="h-3 w-3" />
                      {{ formatDate(post.timestamp) }}
                    </div>
                    <div class="flex items-center gap-1">
                      <Icon name="lucide:hash" class="h-3 w-3" />
                      <span class="font-mono">{{ post.cid.slice(0, 12) }}...</span>
                    </div>
                  </div>

                  <div v-if="selectedPost === post.cid && postContent" class="mt-4 p-4 bg-muted rounded-lg">
                    <div class="prose prose-sm dark:prose-invert max-w-none">
                      <div v-html="renderMarkdown(postContent.content)"></div>
                    </div>
                    
                    <div v-if="postContent.attachments && postContent.attachments.length > 0" class="mt-4 space-y-2">
                      <p class="text-sm font-medium">Attachments:</p>
                      <div class="space-y-2">
                        <div 
                          v-for="(attachment, index) in postContent.attachments" 
                          :key="index"
                          class="flex items-center gap-2 text-sm"
                        >
                          <Icon name="lucide:paperclip" class="h-4 w-4" />
                          <span>{{ attachment.name }}</span>
                          <span class="text-xs text-muted-foreground">({{ attachment.mimeType }})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    @click="togglePost(post.cid)"
                    :disabled="loadingPost === post.cid"
                  >
                    <Icon 
                      v-if="loadingPost === post.cid" 
                      name="lucide:loader-2" 
                      class="h-4 w-4 animate-spin" 
                    />
                    <Icon 
                      v-else-if="selectedPost === post.cid" 
                      name="lucide:eye-off" 
                      class="h-4 w-4" 
                    />
                    <Icon 
                      v-else 
                      name="lucide:eye" 
                      class="h-4 w-4" 
                    />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    @click="copyToClipboard(post.cid)"
                  >
                    <Icon name="lucide:copy" class="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div v-if="error && selectedPost === post.cid" class="mt-4 p-3 bg-destructive/10 border border-destructive rounded-lg">
                <p class="text-sm text-destructive">{{ error }}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Info Card -->
      <Card class="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Icon name="lucide:info" class="h-5 w-5 text-blue-600" />
            About Your Posts
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-2 text-sm text-muted-foreground">
          <p>
            • Posts are encrypted for your followers and stored on IPFS
          </p>
          <p>
            • Each post is referenced on-chain via your channel's feed index
          </p>
          <p>
            • You can decrypt and view your own posts at any time
          </p>
          <p>
            • Posts are immutable once published (stored permanently on IPFS)
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
const { creatorIdentity, getCreatorPublicKey } = useR3layCore()
const { downloadEncryptedPost, downloadFeedIndex } = useR3layIPFS()
const { getChannel, getFollowerCount, isConnected, walletAddress } = useR3layChain()

interface Post {
  cid: string
  title: string
  timestamp: number
}

interface PostContent {
  title: string
  content: string
  timestamp: number
  attachments?: Array<{
    name: string
    mimeType: string
    data: Uint8Array
  }>
}

// Derive channel ID from wallet address (pad to 32 bytes)
const deriveChannelIdFromAddress = (address: string): string => {
  const cleanAddress = address.toLowerCase().replace(/^0x/, '')
  const padded = cleanAddress.padStart(64, '0')
  return `0x${padded}`
}

// State
const posts = ref<Post[]>([])
const loading = ref(false)
const loadingPost = ref<string | null>(null)
const selectedPost = ref<string | null>(null)
const postContent = ref<PostContent | null>(null)
const error = ref('')
const followerCount = ref(0)
const channelId = ref<string | null>(null)

// Load posts from blockchain + IPFS
const loadPosts = async () => {
  if (!isConnected.value || !walletAddress.value) {
    console.log('Wallet not connected')
    return
  }

  loading.value = true
  error.value = ''
  
  try {
    // Derive channel ID
    const derivedChannelId = deriveChannelIdFromAddress(walletAddress.value)
    channelId.value = derivedChannelId
    
    // Get channel from blockchain
    const channel = await getChannel(derivedChannelId)
    
    if (!channel.currentIndexCid) {
      console.log('No feed index yet')
      posts.value = []
      loading.value = false
      return
    }
    
    // Download feed index from IPFS
    const feedIndex = await downloadFeedIndex(channel.currentIndexCid)
    
    // Convert feed index to posts array (CIDs only, no metadata yet)
    // Posts are already newest first in the feed index
    posts.value = feedIndex.posts.map((cid: string) => ({
      cid,
      title: 'Loading...', // Will be loaded when post is opened
      timestamp: Date.now(), // Placeholder
      preview: ''
    }))
    
    // Load follower count
    const count = await getFollowerCount(derivedChannelId)
    followerCount.value = count
    
    console.log(`Loaded ${posts.value.length} posts from blockchain`)
  } catch (e: any) {
    console.error('Failed to load posts:', e)
    error.value = e.message || 'Failed to load posts'
    posts.value = []
  } finally {
    loading.value = false
  }
}

// Computed
const lastPublished = computed(() => {
  if (posts.value.length === 0) return 'Never'
  const latest = posts.value[0]
  return latest ? formatDate(latest.timestamp) : 'Never'
})

// Toggle post view
const togglePost = async (cid: string) => {
  if (selectedPost.value === cid) {
    selectedPost.value = null
    postContent.value = null
    return
  }
  
  loadingPost.value = cid
  error.value = ''
  
  try {
    // Download and decrypt post
    const bundle = await downloadEncryptedPost(cid)
    
    // Decrypt bundle (creator can read their own posts)
    if (!creatorIdentity.value) {
      throw new Error('Creator identity not found')
    }
    
    const creatorPubkey = await getCreatorPublicKey()
    if (!creatorPubkey) {
      throw new Error('Creator public key not found')
    }
    
    // Use the bundler from r3lay-core package
    const { decryptPostBundle } = await import('@r3lay/core')
    const decrypted = await decryptPostBundle(
      bundle,
      creatorIdentity.value.encryptionKeyPair.privateKey,
      creatorPubkey
    )
    
    postContent.value = decrypted
    selectedPost.value = cid
  } catch (e: any) {
    console.error('Failed to load post:', e)
    error.value = e.message || 'Failed to decrypt post'
  } finally {
    loadingPost.value = null
  }
}

// Format date
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return date.toLocaleDateString()
}

// Simple markdown renderer
const renderMarkdown = (text: string) => {
  return text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\n/gim, '<br>')
}

// Copy to clipboard
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

// Watch for wallet connection
watch([isConnected, walletAddress], () => {
  if (isConnected.value && walletAddress.value) {
    loadPosts()
  }
}, { immediate: true })

// Load on mount
onMounted(() => {
  loadPosts()
})

definePageMeta({
  layout: 'default',
})
</script>
