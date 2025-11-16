<template>
  <div class="inbox-page">
    <!-- Header -->
    <div class="inbox-header">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold">Inbox</h1>
          <p class="text-muted-foreground mt-1">
            {{ unreadCount }} unread messages
          </p>
        </div>
        <div class="flex gap-2">
          <Button @click="loadMockData" variant="outline" size="sm" v-if="wallet.isConnected.value">
            <Icon name="lucide:database" class="mr-2 h-4 w-4" />
            Load Mock Messages
          </Button>
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

    <!-- Wallet Connection Required -->
    <Card v-if="!wallet.isConnected.value" class="mb-6">
      <CardContent class="pt-6">
        <div class="text-center py-8">
          <Icon name="lucide:wallet" class="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 class="text-lg font-semibold mb-2">Connect Your Wallet</h3>
          <p class="text-muted-foreground mb-4">
            Connect your wallet to access your encrypted messages
          </p>
          <Button @click="connectWallet">
            <Icon name="lucide:wallet" class="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Messages List -->
    <div v-else>
      <!-- Loading State -->
      <Card v-if="messageStore.loading.value && messageStore.messages.value.length === 0">
        <CardContent class="pt-6">
          <div class="text-center py-8">
            <Icon name="lucide:loader-2" class="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p class="text-muted-foreground">Loading messages...</p>
          </div>
        </CardContent>
      </Card>

      <!-- Empty State -->
      <Card v-else-if="messageStore.messages.value.length === 0">
        <CardContent class="pt-6">
          <div class="text-center py-8">
            <Icon name="lucide:inbox" class="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 class="text-lg font-semibold mb-2">No Messages Yet</h3>
            <p class="text-muted-foreground mb-4">
              Your inbox is empty. Send yourself a test message to get started!
            </p>
            <NuxtLink to="/compose">
              <Button>
                <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
                Compose Message
              </Button>
            </NuxtLink>
          </div>
        </CardContent>
      </Card>

      <!-- Message List -->
      <div v-else class="space-y-2">
        <MessageListItem
          v-for="message in sortedMessages"
          :key="message.msgId"
          :message="message"
          @click="openMessage(message)"
        />
      </div>
    </div>

    <!-- Error State -->
    <Card v-if="messageStore.error.value || wallet.error.value" class="mt-4 border-destructive">
      <CardContent class="pt-6">
        <div class="flex items-start gap-3">
          <Icon name="lucide:alert-circle" class="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <h4 class="font-semibold text-destructive">Error</h4>
            <p class="text-sm text-muted-foreground mt-1">{{ messageStore.error.value || wallet.error.value }}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useR3mailWallet } from '~/composables/useR3mailWallet'
import { useR3mailMessages, type StoredMessage } from '~/composables/useR3mailMessages'
import { addMockMessages } from '~/utils/mockMessages'

// Composables
const router = useRouter()
const wallet = useR3mailWallet()
const messageStore = useR3mailMessages()

// Computed
const sortedMessages = computed(() => {
  return [...messageStore.messages.value].sort((a, b) => b.timestamp - a.timestamp)
})

const unreadCount = computed(() => {
  return messageStore.messages.value.filter(m => m.unread).length
})

// Event watching
let unwatchInbox: (() => void) | null = null

// Lifecycle
onMounted(async () => {
  // Check if wallet is already connected
  const connected = await wallet.checkConnection()
  
  if (connected) {
    await loadMessages()
    // TODO: Fix event watching - RPC doesn't support indexed address params
    // startWatchingInbox()
  }
})

onUnmounted(() => {
  // stopWatchingInbox()
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
  await loadMessages()
  // TODO: Fetch new messages from chain
}

async function loadMockData() {
  if (!wallet.address.value) {
    console.error('No wallet connected')
    return
  }
  
  try {
    await addMockMessages(wallet.address.value)
    await loadMessages()
    console.log('✅ Mock messages loaded!')
  } catch (err) {
    console.error('Failed to load mock messages:', err)
  }
}

function openMessage(message: StoredMessage) {
  // Mark as read
  messageStore.markAsRead(message.msgId)
  
  // Navigate to message view
  router.push(`/message/${message.msgId}`)
}

function startWatchingInbox() {
  try {
    unwatchInbox = messageStore.watchInbox((message) => {
      console.log('New message received:', message)
      // Message is automatically added to store
    })
  } catch (err) {
    console.error('Failed to start watching inbox:', err)
  }
}

function stopWatchingInbox() {
  if (unwatchInbox) {
    unwatchInbox()
    unwatchInbox = null
  }
}
</script>

<style scoped>
.inbox-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.inbox-header {
  margin-bottom: 1.5rem;
}
</style>
