<template>
  <div class="inbox-page h-full flex flex-col">
    <!-- Header -->
    <div class="inbox-header border-b px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Archived</h1>
          <p class="text-sm text-muted-foreground mt-0.5">
            {{ archivedCount }} archived
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
              Connect your wallet to view archived messages
            </p>
          </div>
        </div>

        <!-- Messages List -->
        <div v-else class="flex-1 overflow-y-auto">
          <!-- Loading State -->
          <div v-if="messageStore.loading.value && archivedMessages.length === 0" class="flex items-center justify-center h-full">
            <div class="text-center">
              <Icon name="lucide:loader-2" class="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
              <p class="text-sm text-muted-foreground">Loading messages...</p>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="archivedMessages.length === 0" class="flex items-center justify-center h-full">
            <div class="text-center p-6">
              <Icon name="lucide:archive" class="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 class="text-lg font-semibold mb-2">No Archived Messages</h3>
              <p class="text-sm text-muted-foreground mb-4">
                Archive messages from your inbox to keep them out of the way.
              </p>
              <NuxtLink to="/inbox">
                <Button size="sm">
                  <Icon name="lucide:inbox" class="mr-2 h-4 w-4" />
                  Go to Inbox
                </Button>
              </NuxtLink>
            </div>
          </div>

          <!-- Message List -->
          <div v-else class="divide-y">
            <div
              v-for="message in sortedArchivedMessages"
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
                      <!-- Show counterparty: if I sent it, show to; otherwise show from -->
                      {{ isSentByMe(message) ? truncateAddress(message.to) : truncateAddress(message.from) }}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Message Preview -->
      <div class="flex-1 flex flex-col overflow-hidden bg-muted/10">
        <!-- Not Connected State -->
        <div v-if="!wallet.isConnected.value" class="flex-1 flex items-center justify-center p-8">
          <div class="text-center max-w-md">
            <Icon name="lucide:wallet" class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 class="text-lg font-semibold mb-2">Connect your wallet</h3>
            <p class="text-sm text-muted-foreground mb-4">
              Connect your wallet to view and send encrypted messages
            </p>
            <Button @click="wallet.connect" size="lg">
              <Icon name="lucide:wallet" class="mr-2 h-5 w-5" />
              Connect Wallet
            </Button>
          </div>
        </div>

        <!-- No Message Selected -->
        <div v-else-if="!selectedMessage" class="flex-1 flex items-center justify-center">
          <div class="text-center text-muted-foreground">
            <Icon name="lucide:mail-open" class="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Select an archived message to view</p>
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
                <Button variant="ghost" size="sm" @click="toggleArchive(selectedMessage.msgId)">
                  <Icon name="lucide:archive-restore" class="h-4 w-4" />
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
                <span class="font-mono text-xs">
                  {{ isSentByMe(selectedMessage) ? truncateAddress(selectedMessage.to) : truncateAddress(selectedMessage.from) }}
                </span>
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useR3mailWallet } from '~/composables/useR3mailWallet'
import { useR3mailMessages, type StoredMessage } from '~/composables/useR3mailMessages'

const wallet = useR3mailWallet()
const messageStore = useR3mailMessages()

const selectedMessage = ref<StoredMessage | null>(null)

const myAddress = computed(() => wallet.address.value?.toLowerCase() || '')

const archivedMessages = computed(() => {
  return messageStore.messages.value.filter(m => m.archived)
})

const sortedArchivedMessages = computed(() => {
  return [...archivedMessages.value].sort((a, b) => b.timestamp - a.timestamp)
})

const archivedCount = computed(() => archivedMessages.value.length)

const renderedBody = computed(() => {
  if (!selectedMessage.value?.body) return ''

  try {
    let html = selectedMessage.value.body
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')

    return `<p>${html}</p>`
  } catch (err) {
    console.error('Error rendering message:', err)
    return `<p>${selectedMessage.value.body}</p>`
  }
})

onMounted(async () => {
  if (wallet.address.value) {
    await messageStore.loadMessages()
  }
})

async function refreshMessages() {
  try {
    await messageStore.loadMessages()
  } catch (err) {
    console.error('Failed to refresh messages:', err)
  }
}

function selectMessage(message: StoredMessage) {
  selectedMessage.value = message
}

function isSentByMe(message: StoredMessage | null): boolean {
  if (!message) return false
  return message.from.toLowerCase() === myAddress.value
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

async function toggleArchive(msgId: string) {
  try {
    await messageStore.archiveMessage(msgId)
    if (selectedMessage.value?.msgId === msgId) {
      selectedMessage.value = null
    }
  } catch (err) {
    console.error('Failed to unarchive message:', err)
  }
}

async function handleDelete(msgId: string) {
  try {
    await messageStore.deleteMessage(msgId)
    if (selectedMessage.value?.msgId === msgId) {
      selectedMessage.value = null
    }
  } catch (err) {
    console.error('Failed to delete message:', err)
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

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
