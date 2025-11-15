<template>
  <div class="container mx-auto p-8 max-w-4xl">
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <NuxtLink to="/creator" class="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center">
          <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
          Back to Dashboard
        </NuxtLink>
        <h1 class="text-4xl font-bold mt-4">Manage Followers</h1>
        <p class="text-muted-foreground mt-2">
          Add followers who can decrypt your encrypted posts
        </p>
      </div>

      <!-- Add Follower Form -->
      <Card>
        <CardHeader>
          <CardTitle>Add Follower</CardTitle>
          <CardDescription>
            Enter the follower's public key to grant them access to your posts
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="follower-name">Follower Name (optional)</Label>
            <Input 
              id="follower-name" 
              v-model="newFollowerName" 
              placeholder="Alice"
              :disabled="loading"
            />
          </div>
          
          <div class="space-y-2">
            <Label for="follower-pubkey">Public Key *</Label>
            <Textarea 
              id="follower-pubkey" 
              v-model="newFollowerPubkey" 
              placeholder="Paste the follower's X25519 public key here..."
              rows="3"
              :disabled="loading"
            />
            <p class="text-xs text-muted-foreground">
              The follower can get their public key from their R3LAY follower dashboard
            </p>
          </div>

          <div v-if="error" class="p-3 bg-destructive/10 border border-destructive rounded-lg">
            <p class="text-sm text-destructive">{{ error }}</p>
          </div>

          <div v-if="success" class="p-3 bg-green-500/10 border border-green-500 rounded-lg">
            <p class="text-sm text-green-600">{{ success }}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button @click="addFollower" :disabled="loading || !newFollowerPubkey.trim()">
            <Icon v-if="loading" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
            <Icon v-else name="lucide:user-plus" class="mr-2 h-4 w-4" />
            Add Follower
          </Button>
        </CardFooter>
      </Card>

      <!-- Followers List -->
      <Card>
        <CardHeader>
          <CardTitle>Current Followers ({{ followers.length }})</CardTitle>
          <CardDescription>
            These followers can decrypt your encrypted posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="followers.length === 0" class="text-center py-8">
            <Icon name="lucide:users" class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p class="text-muted-foreground">No followers yet</p>
            <p class="text-sm text-muted-foreground mt-2">
              Add your first follower above to start sharing encrypted content
            </p>
          </div>

          <div v-else class="space-y-4">
            <div 
              v-for="(follower, index) in followers" 
              :key="follower.publicKey"
              class="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div class="flex-1 space-y-1">
                <div class="flex items-center gap-2">
                  <Icon name="lucide:user" class="h-4 w-4 text-muted-foreground" />
                  <p class="font-medium">{{ follower.name || `Follower ${index + 1}` }}</p>
                </div>
                <p class="text-xs text-muted-foreground font-mono break-all">
                  {{ follower.publicKey }}
                </p>
                <p class="text-xs text-muted-foreground">
                  Added {{ formatDate(follower.addedAt) }}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                @click="removeFollower(follower.publicKey)"
                :disabled="loading"
              >
                <Icon name="lucide:trash-2" class="h-4 w-4 text-destructive" />
              </Button>
            </div>
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
            • Followers are stored locally in your browser
          </p>
          <p>
            • When you publish a post, it's encrypted for all current followers
          </p>
          <p>
            • Removing a follower only affects future posts (they can still read old ones)
          </p>
          <p>
            • Followers need to share their public key with you (they get it from their follower dashboard)
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Follower {
  publicKey: string
  name?: string
  addedAt: number
}

// State
const newFollowerName = ref('')
const newFollowerPubkey = ref('')
const followers = ref<Follower[]>([])
const loading = ref(false)
const error = ref('')
const success = ref('')

// Load followers from localStorage
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

// Save followers to localStorage
const saveFollowers = () => {
  try {
    localStorage.setItem('r3lay-followers', JSON.stringify(followers.value))
  } catch (e) {
    console.error('Failed to save followers:', e)
    error.value = 'Failed to save followers'
  }
}

// Add follower
const addFollower = () => {
  error.value = ''
  success.value = ''
  
  const pubkey = newFollowerPubkey.value.trim()
  
  if (!pubkey) {
    error.value = 'Public key is required'
    return
  }
  
  // Check if already exists
  if (followers.value.some(f => f.publicKey === pubkey)) {
    error.value = 'This follower is already added'
    return
  }
  
  // Validate public key format (base64)
  try {
    atob(pubkey)
  } catch (e) {
    error.value = 'Invalid public key format. Must be base64 encoded.'
    return
  }
  
  loading.value = true
  
  try {
    const newFollower: Follower = {
      publicKey: pubkey,
      name: newFollowerName.value.trim() || undefined,
      addedAt: Date.now(),
    }
    
    followers.value.push(newFollower)
    saveFollowers()
    
    // Reset form
    newFollowerName.value = ''
    newFollowerPubkey.value = ''
    
    success.value = 'Follower added successfully!'
    setTimeout(() => {
      success.value = ''
    }, 3000)
  } catch (e: any) {
    error.value = e.message || 'Failed to add follower'
  } finally {
    loading.value = false
  }
}

// Remove follower
const removeFollower = (publicKey: string) => {
  if (!confirm('Are you sure you want to remove this follower? They will not be able to decrypt future posts.')) {
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    followers.value = followers.value.filter(f => f.publicKey !== publicKey)
    saveFollowers()
    success.value = 'Follower removed'
    setTimeout(() => {
      success.value = ''
    }, 3000)
  } catch (e: any) {
    error.value = e.message || 'Failed to remove follower'
  } finally {
    loading.value = false
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

// Load on mount
onMounted(() => {
  loadFollowers()
})

definePageMeta({
  layout: 'default',
})
</script>
