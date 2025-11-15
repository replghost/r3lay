<template>
  <div class="container mx-auto p-8 max-w-4xl">
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <NuxtLink to="/" class="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center">
          <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
          Back to Home
        </NuxtLink>
        <h1 class="text-4xl font-bold mt-4">Follower Dashboard</h1>
        <p class="text-muted-foreground mt-2">
          Read encrypted posts from creators you follow
        </p>
      </div>

      <!-- Identity Status -->
      <Card>
        <CardHeader>
          <CardTitle>Your Follower Identity</CardTitle>
          <CardDescription>
            Your encryption keys for reading encrypted posts
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div v-if="!hasIdentity" class="space-y-4">
            <p class="text-sm text-muted-foreground">
              Generate your follower identity to start reading encrypted posts from creators.
            </p>
            <Button @click="initFollower" :disabled="loading">
              <Icon v-if="loading" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
              <Icon v-else name="lucide:key" class="mr-2 h-4 w-4" />
              Generate Identity
            </Button>
          </div>

          <div v-else class="space-y-4">
            <div class="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <Icon name="lucide:check-circle" class="h-5 w-5 text-green-600 mt-0.5" />
              <div class="flex-1">
                <p class="font-medium text-green-900 dark:text-green-100">Identity Active</p>
                <p class="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your encryption keys are ready
                </p>
              </div>
            </div>

            <div class="space-y-2">
              <Label>Your Public Key</Label>
              <div class="flex gap-2">
                <Input 
                  :value="publicKey" 
                  readonly 
                  class="font-mono text-xs"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  @click="copyPublicKey"
                >
                  <Icon name="lucide:copy" class="h-4 w-4" />
                </Button>
              </div>
              <p class="text-xs text-muted-foreground">
                Share this public key with creators so they can encrypt posts for you
              </p>
            </div>
          </div>

          <div v-if="error" class="p-3 bg-destructive/10 border border-destructive rounded-lg">
            <p class="text-sm text-destructive">{{ error }}</p>
          </div>
        </CardContent>
      </Card>

      <!-- Info Card -->
      <Card class="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Icon name="lucide:info" class="h-5 w-5 text-blue-600" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-2 text-sm text-muted-foreground">
          <p>
            • Generate your follower identity to get encryption keys
          </p>
          <p>
            • Share your public key with creators you want to follow
          </p>
          <p>
            • Creators will encrypt posts for you using your public key
          </p>
          <p>
            • You can decrypt and read posts from creators who added you
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
const { hasFollowerIdentity, initializeFollower, getFollowerPublicKey } = useR3layCore()

// State
const hasIdentity = ref(false)
const publicKey = ref<string | null>(null)
const loading = ref(false)
const error = ref('')

// Initialize follower
const initFollower = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await initializeFollower()
    hasIdentity.value = true
    publicKey.value = await getFollowerPublicKey()
  } catch (e: any) {
    error.value = e.message || 'Failed to initialize follower'
  } finally {
    loading.value = false
  }
}

// Copy public key
const copyPublicKey = async () => {
  if (!publicKey.value) return
  
  try {
    await navigator.clipboard.writeText(publicKey.value)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

// Load on mount
onMounted(async () => {
  hasIdentity.value = hasFollowerIdentity()
  if (hasIdentity.value) {
    publicKey.value = await getFollowerPublicKey()
  }
})

definePageMeta({
  layout: 'default',
})
</script>
