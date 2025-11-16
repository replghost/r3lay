<template>
  <div class="message-page">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-2">
          <NuxtLink to="/inbox">
            <Button variant="ghost" size="icon">
              <Icon name="lucide:arrow-left" class="h-5 w-5" />
            </Button>
          </NuxtLink>
          <h1 class="text-2xl font-bold truncate">
            {{ message?.subject || '(no subject)' }}
          </h1>
        </div>
      </div>

      <!-- Loading -->
      <Card v-if="loading">
        <CardContent class="pt-6">
          <div class="text-center py-8">
            <Icon name="lucide:loader-2" class="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p class="text-muted-foreground">Loading message...</p>
          </div>
        </CardContent>
      </Card>

      <!-- Error -->
      <Card v-else-if="error" class="border-destructive">
        <CardContent class="pt-6">
          <div class="flex items-start gap-3">
            <Icon name="lucide:alert-circle" class="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <h4 class="font-semibold text-destructive">Error</h4>
              <p class="text-sm text-muted-foreground mt-1">{{ error }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Message Content -->
      <div v-else-if="message" class="space-y-4">
        <!-- Message Header -->
        <Card>
          <CardContent class="pt-6">
            <div class="space-y-4">
              <!-- From -->
              <div class="flex items-start gap-3">
                <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon name="lucide:user" class="h-6 w-6 text-primary" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <div>
                      <p class="text-sm text-muted-foreground">From</p>
                      <p class="font-medium font-mono text-sm">
                        {{ message.from }}
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm text-muted-foreground">
                        {{ formatDate(message.timestamp) }}
                      </p>
                      <p class="text-xs text-muted-foreground">
                        {{ formatTime(message.timestamp) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2 pt-4 border-t">
                <Button variant="outline" size="sm" @click="reply">
                  <Icon name="lucide:reply" class="mr-2 h-4 w-4" />
                  Reply
                </Button>
                <Button variant="outline" size="sm" @click="archive">
                  <Icon name="lucide:archive" class="mr-2 h-4 w-4" />
                  Archive
                </Button>
                <Button variant="outline" size="sm" @click="copyMessageId">
                  <Icon name="lucide:copy" class="mr-2 h-4 w-4" />
                  Copy ID
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Message Body -->
        <Card>
          <CardContent class="pt-6">
            <div class="prose prose-sm dark:prose-invert max-w-none">
              <div v-html="renderedBody" />
            </div>
          </CardContent>
        </Card>

        <!-- Metadata -->
        <Card>
          <CardHeader>
            <CardTitle class="text-sm">Message Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Message ID:</span>
                <span class="font-mono text-xs">{{ truncate(message.msgId) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Block Number:</span>
                <span class="font-mono">{{ message.blockNumber }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Envelope CID:</span>
                <span class="font-mono text-xs">{{ truncate(message.envelopeCid) }}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { useR3mailMessages, type StoredMessage } from '~/composables/useR3mailMessages'

// Composables
const route = useRoute()
const router = useRouter()
const messageStore = useR3mailMessages()

// State
const message = ref<StoredMessage | null>(null)
const loading = ref(true)
const error = ref('')

// Computed
const renderedBody = computed(() => {
  if (!message.value?.body) return ''
  
  try {
    return marked(message.value.body)
  } catch (err) {
    return '<p class="text-destructive">Error rendering message</p>'
  }
})

// Lifecycle
onMounted(async () => {
  await loadMessage()
})

// Methods
async function loadMessage() {
  loading.value = true
  error.value = ''
  
  try {
    const msgId = route.params.id as string
    
    // Load from store
    message.value = await messageStore.getMessage(msgId)
    
    if (!message.value) {
      error.value = 'Message not found'
    } else {
      // Mark as read
      await messageStore.markAsRead(msgId)
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load message'
  } finally {
    loading.value = false
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncate(str: string, length: number = 16): string {
  if (!str) return ''
  if (str.length <= length) return str
  return `${str.slice(0, length / 2)}...${str.slice(-length / 2)}`
}

function reply() {
  if (!message.value) return
  router.push({
    path: '/compose',
    query: {
      to: message.value.from,
      subject: `Re: ${message.value.subject}`,
    },
  })
}

async function archive() {
  if (!message.value) return
  
  try {
    await messageStore.archiveMessage(message.value.msgId)
    
    // Navigate back to inbox
    router.push('/inbox')
  } catch (err) {
    console.error('Failed to archive message:', err)
  }
}

async function copyMessageId() {
  if (!message.value) return
  
  try {
    await navigator.clipboard.writeText(message.value.msgId)
    // TODO: Show toast notification
    console.log('Message ID copied!')
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<style scoped>
.message-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Markdown styles */
.prose {
  color: inherit;
}

.prose h1,
.prose h2,
.prose h3,
.prose h4,
.prose h5,
.prose h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.prose p {
  margin-top: 0.75em;
  margin-bottom: 0.75em;
}

.prose ul,
.prose ol {
  margin-top: 0.75em;
  margin-bottom: 0.75em;
  padding-left: 1.5em;
}

.prose code {
  background-color: hsl(var(--muted));
  padding: 0.2em 0.4em;
  border-radius: 0.25rem;
  font-size: 0.875em;
}

.prose pre {
  background-color: hsl(var(--muted));
  padding: 1em;
  border-radius: 0.5rem;
  overflow-x: auto;
}

.prose a {
  color: hsl(var(--primary));
  text-decoration: underline;
}

.prose blockquote {
  border-left: 4px solid hsl(var(--border));
  padding-left: 1em;
  font-style: italic;
  color: hsl(var(--muted-foreground));
}
</style>
