<template>
  <div class="inbox-page h-full flex flex-col">
    <!-- Header -->
    <div class="inbox-header border-b px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Inbox</h1>
          <p class="text-sm text-muted-foreground mt-0.5">
            {{ unreadCount }} unread
          </p>
        </div>
        <div class="flex gap-2">
          <Button @click="refreshMessages" variant="outline" size="sm">
            <Icon name="lucide:refresh-cw" class="mr-2 h-4 w-4" :class="{ 'animate-spin': messageStore.loading.value }" />
            Refresh
          </Button>
          <NuxtLink to="/compose">
            <Button size="sm">
              <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
              New Message
            </Button>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Main Content: 2-Column Layout -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Column: Message List -->
      <div class="w-96 border-r flex flex-col overflow-hidden">
        <!-- Wallet Connection Required -->
        <div v-if="!wallet.isConnected.value" class="flex-1 flex items-center justify-center p-6">
          <div class="text-center">
            <Icon name="lucide:wallet" class="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 class="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p class="text-sm text-muted-foreground mb-4">
              Connect your wallet to access encrypted messages
            </p>
          </div>
        </div>

        <!-- Messages List -->
        <div v-else class="flex-1 overflow-y-auto">
          <!-- Loading State -->
          <div v-if="messageStore.loading.value && messageStore.messages.value.length === 0" class="flex items-center justify-center h-full">
            <div class="text-center">
              <Icon name="lucide:loader-2" class="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
              <p class="text-sm text-muted-foreground">Loading messages...</p>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="messageStore.messages.value.length === 0" class="flex items-center justify-center h-full">
            <div class="text-center p-6">
              <Icon name="lucide:inbox" class="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 class="text-lg font-semibold mb-2">No Messages</h3>
              <p class="text-sm text-muted-foreground mb-4">
                Your inbox is empty
              </p>
              <NuxtLink to="/compose">
                <Button size="sm">
                  <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
                  Compose
                </Button>
              </NuxtLink>
            </div>
          </div>

          <!-- Message List -->
          <div v-else class="divide-y">
            <div
              v-for="message in sortedMessages"
              :key="message.msgId"
              @click="selectMessage(message)"
              :class="[
                'p-4 cursor-pointer transition-colors hover:bg-accent',
                selectedMessage?.msgId === message.msgId ? 'bg-accent' : ''
              ]"
            >
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon name="lucide:user" class="h-5 w-5 text-primary" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <span class="font-semibold text-sm truncate">
                      {{ truncateAddress(message.from) }}
                    </span>
                    <span class="text-xs text-muted-foreground whitespace-nowrap">
                      {{ formatTimestamp(message.timestamp) }}
                    </span>
                  </div>
                  <h3 class="font-medium text-sm mb-1 truncate">
                    {{ message.subject || '(no subject)' }}
                  </h3>
                  <p class="text-sm text-muted-foreground line-clamp-2">
                    {{ getPreview(message.body) }}
                  </p>
                  <div class="flex items-center gap-2 mt-2">
                    <Badge v-if="message.unread" variant="default" class="text-xs">New</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Message Preview -->
      <div class="flex-1 flex flex-col overflow-hidden bg-muted/10">
        <!-- No Message Selected -->
        <div v-if="!selectedMessage" class="flex-1 flex items-center justify-center">
          <div class="text-center text-muted-foreground">
            <Icon name="lucide:mail-open" class="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Select a message to read</p>
          </div>
        </div>

        <!-- Message Preview -->
        <div v-else class="flex-1 flex flex-col overflow-hidden">
          <!-- Message Header -->
          <div class="border-b px-6 py-4">
            <div class="flex items-start justify-between gap-4 mb-3">
              <h2 class="text-xl font-bold flex-1">{{ selectedMessage.subject || '(no subject)' }}</h2>
              <!-- Actions -->
              <div class="flex gap-2">
                <Button variant="default" size="sm" @click="handleReply(selectedMessage)">
                  <Icon name="lucide:reply" class="mr-2 h-4 w-4" />
                  Reply
                </Button>
                <Button variant="ghost" size="sm" @click="handleArchive(selectedMessage.msgId)">
                  <Icon name="lucide:archive" class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" @click="handleDelete(selectedMessage.msgId)">
                  <Icon name="lucide:trash-2" class="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div class="flex items-center gap-3 text-sm text-muted-foreground">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon name="lucide:user" class="h-3 w-3 text-primary" />
                </div>
                <span class="font-mono text-xs">{{ truncateAddress(selectedMessage.from) }}</span>
              </div>
              <span>•</span>
              <span class="text-xs">{{ formatDate(selectedMessage.timestamp) }}</span>
            </div>
          </div>

          <!-- Message Body -->
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <div class="prose prose-sm dark:prose-invert max-w-none">
              <div v-html="renderedBody" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Onboarding Modal -->
    <OnboardingModal 
      v-model:open="showOnboarding" 
      @registered="handleOnboardingComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useR3mailWallet } from '~/composables/useR3mailWallet'
import { useR3mailMessages, type StoredMessage } from '~/composables/useR3mailMessages'

// Composables
const router = useRouter()
const wallet = useR3mailWallet()
const messageStore = useR3mailMessages()

// State
const isKeyRegistered = ref(false)
const registering = ref(false)
const selectedMessage = ref<StoredMessage | null>(null)
const showOnboarding = ref(false)

// Computed
const sortedMessages = computed(() => {
  let filtered = messageStore.messages.value
  
  // Filter out deleted messages unless debug mode is on
  if (!messageStore.showAllMessages.value) {
    filtered = filtered.filter(m => !m.archived)
  }
  
  return [...filtered].sort((a, b) => b.timestamp - a.timestamp)
})

const unreadCount = computed(() => {
  return messageStore.messages.value.filter(m => m.unread).length
})

const renderedBody = computed(() => {
  if (!selectedMessage.value?.body) return ''
  
  try {
    // Simple markdown-like rendering without external library
    let html = selectedMessage.value.body
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
      // Code
      .replace(/`(.+?)`/g, '<code>$1</code>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
    
    return `<p>${html}</p>`
  } catch (err) {
    console.error('Error rendering message:', err)
    return `<p>${selectedMessage.value.body}</p>`
  }
})

// Background sync
let stopBackgroundSync: (() => void) | null = null

// Debug: Watch messages
watch(() => messageStore.messages.value, (newMessages) => {
  console.log('🔄 Messages changed in UI:', newMessages.length, newMessages)
}, { deep: true })

// Watch wallet connection to check key registration
watch(() => wallet.isConnected.value, async (connected) => {
  if (connected && wallet.keys.value) {
    isKeyRegistered.value = await wallet.hasPublicKey()
    // Show onboarding if key not registered
    if (!isKeyRegistered.value) {
      showOnboarding.value = true
    }
  }
})

// Lifecycle
onMounted(async () => {
  console.log('📱 Inbox mounted')
  // Check if wallet is already connected
  const connected = await wallet.checkConnection()
  console.log('🔌 Wallet connected:', connected)
  
  if (connected) {
    await loadMessages()
    console.log('📬 Messages after load:', messageStore.messages.value.length)
    // Check if public key is registered
    isKeyRegistered.value = await wallet.hasPublicKey()
    // Show onboarding if key not registered
    if (!isKeyRegistered.value) {
      showOnboarding.value = true
    }
    // Start background sync (polls every 30 seconds)
    stopBackgroundSync = messageStore.startBackgroundSync()
  }
})

onUnmounted(() => {
  // Stop background sync
  if (stopBackgroundSync) {
    stopBackgroundSync()
  }
})

// Methods
async function connectWallet() {
  try {
    await wallet.connect()
    await loadMessages()
    // TODO: Fix event watching
    // startWatchingInbox()
  } catch (err: any) {
    console.error('Failed to connect wallet:', err)
  }
}

async function loadMessages() {
  try {
    await messageStore.loadMessages()
  } catch (err) {
    console.error('Failed to load messages:', err)
  }
}

async function refreshMessages() {
  try {
    // Fetch new messages from chain
    await messageStore.fetchFromChain()
  } catch (err) {
    console.error('Failed to refresh from chain:', err)
    // Fallback to loading from IndexedDB
    await loadMessages()
  }
}

async function registerKey() {
  if (!wallet.keys.value) {
    console.error('Keys not derived')
    return
  }

  registering.value = true
  try {
    await wallet.registerPublicKey()
    isKeyRegistered.value = true
    console.log('✅ Public key registered successfully!')
  } catch (err) {
    console.error('Failed to register public key:', err)
  } finally {
    registering.value = false
  }
}

function openMessage(message: StoredMessage) {
  // Mark as read
  messageStore.markAsRead(message.msgId)
  
  // Navigate to message view
  router.push(`/message/${message.msgId}`)
}

async function handleArchive(msgId: string) {
  try {
    await messageStore.archiveMessage(msgId)
  } catch (err) {
    console.error('Failed to archive message:', err)
  }
}

async function handleDelete(msgId: string) {
  try {
    await messageStore.deleteMessage(msgId)
    // Clear selection if deleted message was selected
    if (selectedMessage.value?.msgId === msgId) {
      selectedMessage.value = null
    }
  } catch (err) {
    console.error('Failed to delete message:', err)
  }
}

function selectMessage(message: StoredMessage) {
  selectedMessage.value = message
  // Mark as read
  messageStore.markAsRead(message.msgId)
}

function truncateAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) + ' at ' + date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getPreview(body: string): string {
  if (!body) return 'No content'
  
  const plain = body
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\n/g, ' ')
    .trim()
  
  return plain.length > 100 ? plain.slice(0, 100) + '...' : plain
}

function handleReply(message: StoredMessage) {
  // Navigate to compose page with pre-filled recipient and subject
  const subject = message.subject.startsWith('Re: ') 
    ? message.subject 
    : `Re: ${message.subject}`
  
  router.push({
    path: '/compose',
    query: {
      to: message.from,
      subject: subject
    }
  })
}

function handleOnboardingComplete() {
  isKeyRegistered.value = true
  showOnboarding.value = false
}

</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
