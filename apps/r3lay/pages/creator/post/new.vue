<template>
  <div class="container mx-auto p-8 max-w-4xl">
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <NuxtLink to="/creator" class="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center">
          <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
          Back to Dashboard
        </NuxtLink>
        <h1 class="text-4xl font-bold mt-4">Create Post</h1>
        <p class="text-muted-foreground mt-2">
          Compose and publish an encrypted post to your followers
        </p>
      </div>

      <!-- Check Prerequisites -->
      <Card v-if="!hasChannel" class="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Icon name="lucide:alert-triangle" class="h-5 w-5 text-yellow-600" />
            Channel Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground mb-4">
            You need to create a channel before publishing posts.
          </p>
          <NuxtLink to="/creator/channel/create">
            <Button>
              <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
              Create Channel
            </Button>
          </NuxtLink>
        </CardContent>
      </Card>

      <Card v-else-if="followers.length === 0" class="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Icon name="lucide:alert-triangle" class="h-5 w-5 text-yellow-600" />
            No Followers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground mb-4">
            You need at least one follower to publish posts. Posts are encrypted for your followers.
          </p>
          <NuxtLink to="/creator/followers">
            <Button>
              <Icon name="lucide:user-plus" class="mr-2 h-4 w-4" />
              Add Followers
            </Button>
          </NuxtLink>
        </CardContent>
      </Card>

      <!-- Post Composer -->
      <template v-else>
        <Card>
          <CardHeader>
            <CardTitle>Post Content</CardTitle>
            <CardDescription>
              Write your post in Markdown format
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label for="post-title">Title *</Label>
              <Input 
                id="post-title" 
                v-model="postTitle" 
                placeholder="My awesome post"
                :disabled="publishing"
              />
            </div>

            <div class="space-y-2">
              <Label for="post-content">Content (Markdown) *</Label>
              <Textarea 
                id="post-content" 
                v-model="postContent" 
                placeholder="# Hello World&#10;&#10;This is my first encrypted post!"
                rows="12"
                :disabled="publishing"
                class="font-mono text-sm"
              />
              <p class="text-xs text-muted-foreground">
                Supports Markdown formatting: **bold**, *italic*, # headers, etc.
              </p>
            </div>

            <div class="space-y-2">
              <Label for="post-attachments">Attachments (optional)</Label>
              <Input 
                id="post-attachments" 
                type="file" 
                multiple
                @change="handleFileUpload"
                :disabled="publishing"
              />
              <p class="text-xs text-muted-foreground">
                Upload images or files to include with your post
              </p>
            </div>

            <div v-if="attachments.length > 0" class="space-y-2">
              <Label>Selected Files</Label>
              <div class="space-y-2">
                <div 
                  v-for="(file, index) in attachments" 
                  :key="index"
                  class="flex items-center justify-between p-2 border rounded"
                >
                  <div class="flex items-center gap-2">
                    <Icon name="lucide:file" class="h-4 w-4 text-muted-foreground" />
                    <span class="text-sm">{{ file.name }}</span>
                    <span class="text-xs text-muted-foreground">({{ formatFileSize(file.size) }})</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    @click="removeAttachment(index)"
                    :disabled="publishing"
                  >
                    <Icon name="lucide:x" class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Publishing Options -->
        <Card>
          <CardHeader>
            <CardTitle>Publishing Options</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p class="font-medium">Followers</p>
                <p class="text-sm text-muted-foreground">
                  Post will be encrypted for {{ followers.length }} follower{{ followers.length !== 1 ? 's' : '' }}
                </p>
              </div>
              <NuxtLink to="/creator/followers">
                <Button variant="outline" size="sm">
                  <Icon name="lucide:users" class="mr-2 h-4 w-4" />
                  Manage
                </Button>
              </NuxtLink>
            </div>

            <div v-if="error" class="p-3 bg-destructive/10 border border-destructive rounded-lg">
              <p class="text-sm text-destructive">{{ error }}</p>
            </div>
          </CardContent>
        </Card>

        <!-- Publish Button -->
        <Card>
          <CardContent class="pt-6">
            <div class="flex items-center justify-between">
              <div class="text-sm text-muted-foreground">
                <p v-if="!publishing">Ready to publish</p>
                <p v-else>{{ publishingStatus }}</p>
              </div>
              <Button 
                @click="publishPost" 
                :disabled="!canPublish || publishing"
                size="lg"
              >
                <Icon v-if="publishing" name="lucide:loader-2" class="mr-2 h-5 w-5 animate-spin" />
                <Icon v-else name="lucide:send" class="mr-2 h-5 w-5" />
                {{ publishing ? 'Publishing...' : 'Publish Post' }}
              </Button>
            </div>
          </CardContent>
        </Card>

        <!-- Success Modal -->
        <div v-if="publishSuccess" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card class="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Icon name="lucide:check-circle" class="h-6 w-6 text-green-600" />
                Post Published!
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <p class="text-sm text-muted-foreground">
                Your post has been encrypted and published successfully.
              </p>
              <div class="space-y-2 text-sm">
                <div>
                  <span class="font-medium">Post CID:</span>
                  <p class="font-mono text-xs break-all text-muted-foreground">{{ postCid }}</p>
                </div>
                <div>
                  <span class="font-medium">Transaction:</span>
                  <p class="font-mono text-xs break-all text-muted-foreground">{{ txHash }}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter class="flex gap-2">
              <NuxtLink to="/creator/posts" class="flex-1">
                <Button variant="outline" class="w-full">
                  View Posts
                </Button>
              </NuxtLink>
              <NuxtLink to="/creator/post/new" class="flex-1">
                <Button class="w-full" @click="resetForm">
                  New Post
                </Button>
              </NuxtLink>
            </CardFooter>
          </Card>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const { hasCreatorIdentity, getCreatorPublicKey } = useR3layCore()
const { walletAddress } = useR3layChain()
const { uploadEncryptedPost, uploadFeedIndex } = useR3layIPFS()

interface Follower {
  publicKey: string
  name?: string
  addedAt: number
}

// State
const postTitle = ref('')
const postContent = ref('')
const attachments = ref<File[]>([])
const followers = ref<Follower[]>([])
const publishing = ref(false)
const publishingStatus = ref('')
const error = ref('')
const publishSuccess = ref(false)
const postCid = ref('')
const txHash = ref('')

// Computed
const hasChannel = computed(() => !!walletAddress.value)
const canPublish = computed(() => {
  return postTitle.value.trim() && postContent.value.trim() && followers.value.length > 0
})

// Load followers
const loadFollowers = () => {
  try {
    const stored = localStorage.getItem('r3lay-followers')
    if (stored) {
      followers.value = JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load followers:', e)
  }
}

// Handle file upload
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    attachments.value = Array.from(target.files)
  }
}

// Remove attachment
const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1)
}

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Publish post
const publishPost = async () => {
  if (!canPublish.value) return
  
  publishing.value = true
  error.value = ''
  publishingStatus.value = 'Preparing post...'
  
  try {
    // 1. Get creator identity
    publishingStatus.value = 'Loading identity...'
    const creatorPubkey = await getCreatorPublicKey()
    
    // 2. Build post bundle
    publishingStatus.value = 'Building post bundle...'
    const { createPostBundle } = await import('../../../packages/r3lay-core/src/bundler/index.ts')
    
    const post = {
      title: postTitle.value.trim(),
      content: postContent.value.trim(),
      timestamp: Date.now(),
    }
    
    // Process attachments
    const attachmentData: Array<{ name: string; data: Uint8Array; mimeType: string }> = []
    for (const file of attachments.value) {
      const arrayBuffer = await file.arrayBuffer()
      attachmentData.push({
        name: file.name,
        data: new Uint8Array(arrayBuffer),
        mimeType: file.type || 'application/octet-stream',
      })
    }
    
    // 3. Encrypt for all followers
    publishingStatus.value = `Encrypting for ${followers.value.length} followers...`
    const followerPubkeys = followers.value.map(f => f.publicKey)
    
    const bundle = await createPostBundle(post, followerPubkeys, attachmentData)
    
    // 4. Upload to IPFS
    publishingStatus.value = 'Uploading to IPFS...'
    const cid = await uploadEncryptedPost(bundle)
    postCid.value = cid
    
    // 5. Update feed index
    publishingStatus.value = 'Updating feed index...'
    const { deriveChannelIdFromAddress } = await import('../../../packages/r3lay-core/src/utils/index.ts')
    const channelId = deriveChannelIdFromAddress(walletAddress.value!)
    
    // Load existing posts
    const existingPosts = JSON.parse(localStorage.getItem('r3lay-posts') || '[]')
    const newPost = {
      cid,
      title: post.title,
      timestamp: post.timestamp,
    }
    existingPosts.unshift(newPost)
    localStorage.setItem('r3lay-posts', JSON.stringify(existingPosts))
    
    // Create updated feed index
    const feedIndex = {
      version: 1 as const,
      creator: creatorPubkey,
      channelId,
      posts: existingPosts.map((p: any) => p.cid),
      updatedAt: Date.now(),
    }
    
    const indexCid = await uploadFeedIndex(feedIndex)
    
    // 6. Update channel on-chain
    publishingStatus.value = 'Publishing to blockchain...'
    const { updateChannel } = useR3layChain()
    const result = await updateChannel(channelId, indexCid)
    txHash.value = result.hash
    
    // Success!
    publishSuccess.value = true
    
  } catch (e: any) {
    console.error('Failed to publish post:', e)
    error.value = e.message || 'Failed to publish post'
  } finally {
    publishing.value = false
    publishingStatus.value = ''
  }
}

// Reset form
const resetForm = () => {
  postTitle.value = ''
  postContent.value = ''
  attachments.value = []
  publishSuccess.value = false
  postCid.value = ''
  txHash.value = ''
  error.value = ''
}

// Load on mount
onMounted(() => {
  loadFollowers()
})

definePageMeta({
  layout: 'default',
})
</script>
