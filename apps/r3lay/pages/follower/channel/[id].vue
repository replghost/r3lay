<template>
  <div class="container mx-auto p-8 max-w-4xl">
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <NuxtLink to="/follower" class="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center">
          <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
          Back to Dashboard
        </NuxtLink>
        <h1 class="text-4xl font-bold mt-4">Channel Feed</h1>
        <p class="text-muted-foreground mt-2">
          Encrypted posts from this creator
        </p>
      </div>

      <!-- Loading State -->
      <Card v-if="loading">
        <CardContent class="py-12">
          <div class="text-center">
            <Icon name="lucide:loader-2" class="h-12 w-12 mx-auto animate-spin text-muted-foreground mb-4" />
            <p class="text-muted-foreground">{{ loadingStatus }}</p>
          </div>
        </CardContent>
      </Card>

      <!-- Error State -->
      <Card v-else-if="error" class="border-destructive">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-destructive">
            <Icon name="lucide:alert-circle" class="h-5 w-5" />
            Error Loading Channel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">{{ error }}</p>
        </CardContent>
      </Card>

      <!-- Channel Info -->
      <Card v-else-if="channelInfo">
        <CardHeader>
          <CardTitle>{{ channelInfo.name || 'Unnamed Channel' }}</CardTitle>
          <CardDescription>
            {{ posts.length }} encrypted posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="text-xs text-muted-foreground font-mono">
            Channel ID: {{ channelId }}
          </div>
        </CardContent>
      </Card>

      <!-- Posts List -->
      <Card v-if="!loading && !error">
        <CardHeader>
          <CardTitle>Posts</CardTitle>
          <CardDescription>
            Click to decrypt and read
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="posts.length === 0" class="text-center py-12">
            <Icon name="lucide:inbox" class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p class="text-muted-foreground">No posts yet</p>
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
                    <Icon name="lucide:lock" class="h-4 w-4 text-muted-foreground" />
                    <h3 class="font-semibold">{{ post.title || 'Untitled Post' }}</h3>
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

                  <!-- Decrypted Content -->
                  <div v-if="selectedPost === post.cid && decryptedContent" class="mt-4 p-4 bg-muted rounded-lg">
                    <div class="prose prose-sm dark:prose-invert max-w-none">
                      <div v-html="renderMarkdown(decryptedContent.content)"></div>
                    </div>
                    
                    <div v-if="decryptedContent.attachments && decryptedContent.attachments.length > 0" class="mt-4 space-y-2">
                      <p class="text-sm font-medium">Attachments:</p>
                      <div class="space-y-2">
                        <div 
                          v-for="(attachment, index) in decryptedContent.attachments" 
                          :key="index"
                          class="flex items-center gap-2 text-sm"
                        >
                          <Icon name="lucide:paperclip" class="h-4 w-4" />
                          <span>{{ attachment.filename }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="decryptError && selectedPost === post.cid" class="mt-4 p-3 bg-destructive/10 border border-destructive rounded-lg">
                    <p class="text-sm text-destructive">{{ decryptError }}</p>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm"
                  @click="togglePost(post.cid)"
                  :disabled="decrypting === post.cid"
                >
                  <Icon 
                    v-if="decrypting === post.cid" 
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
                    name="lucide:unlock" 
                    class="h-4 w-4" 
                  />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { followerIdentity } = useR3layCore()
const { getChannel } = useR3layChain()
const { downloadFeedIndex, downloadEncryptedPost } = useR3layIPFS()

const channelId = route.params.id as string

interface Post {
  cid: string
  title?: string
  timestamp?: number
}

interface DecryptedContent {
  content: string
  attachments?: Array<{
    filename: string
    mimeType: string
  }>
}

// State
const loading = ref(true)
const loadingStatus = ref('Loading channel...')
const error = ref('')
const channelInfo = ref<any>(null)
const posts = ref<Post[]>([])
const selectedPost = ref<string | null>(null)
const decryptedContent = ref<DecryptedContent | null>(null)
const decrypting = ref<string | null>(null)
const decryptError = ref('')

// Load channel
const loadChannel = async () => {
  loading.value = true
  loadingStatus.value = 'Loading channel info...'
  
  try {
    // Get channel from blockchain
    const channel = await getChannel(channelId)
    channelInfo.value = channel
    
    // Download feed index from IPFS
    loadingStatus.value = 'Downloading feed index...'
    const feedIndex = await downloadFeedIndex(channel.currentIndexCid)
    
    // Build posts list
    posts.value = feedIndex.posts.map((cid: string) => ({
      cid,
      title: 'Encrypted Post',
      timestamp: Date.now(),
    }))
    
  } catch (e: any) {
    console.error('Failed to load channel:', e)
    error.value = e.message || 'Failed to load channel'
  } finally {
    loading.value = false
  }
}

// Toggle post decrypt
const togglePost = async (cid: string) => {
  if (selectedPost.value === cid) {
    selectedPost.value = null
    decryptedContent.value = null
    return
  }
  
  if (!followerIdentity.value) {
    decryptError.value = 'Follower identity not found'
    return
  }
  
  decrypting.value = cid
  decryptError.value = ''
  
  try {
    // Download encrypted post
    const bundle = await downloadEncryptedPost(cid)
    
    // Decrypt post
    const { decryptPostBundle } = await import('../../../packages/r3lay-core/src/bundler/index.ts')
    const { encodePublicKey } = await import('../../../packages/r3lay-core/src/crypto/index.ts')
    
    const followerPubkey = encodePublicKey(followerIdentity.value.encryptionKeyPair.publicKey)
    
    const decrypted = await decryptPostBundle(
      bundle,
      followerIdentity.value.encryptionKeyPair.privateKey,
      followerPubkey
    )
    
    decryptedContent.value = {
      content: decrypted,
      attachments: bundle.metadata?.attachments,
    }
    selectedPost.value = cid
    
  } catch (e: any) {
    console.error('Failed to decrypt post:', e)
    decryptError.value = e.message || 'Failed to decrypt post. You may not have access to this post.'
  } finally {
    decrypting.value = null
  }
}

// Format date
const formatDate = (timestamp?: number) => {
  if (!timestamp) return 'Unknown date'
  
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

// Load on mount
onMounted(() => {
  loadChannel()
})

definePageMeta({
  layout: 'default',
})
</script>
