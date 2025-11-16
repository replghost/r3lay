<template>
  <Card 
    class="message-list-item cursor-pointer hover:bg-accent transition-colors"
    :class="{ 'border-l-4 border-l-primary': message.unread }"
    @click="$emit('click')"
  >
    <CardContent class="p-4">
      <div class="flex items-start gap-4">
        <!-- Avatar -->
        <div class="flex-shrink-0">
          <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon name="lucide:user" class="h-5 w-5 text-primary" />
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2 mb-1">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-sm truncate">
                {{ truncateAddress(message.from) }}
              </span>
              <Badge v-if="message.unread" variant="default" class="text-xs">
                New
              </Badge>
            </div>
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

        <!-- Actions -->
        <div class="flex-shrink-0 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            @click.stop="toggleArchive"
          >
            <Icon 
              :name="message.archived ? 'lucide:archive-restore' : 'lucide:archive'" 
              class="h-4 w-4"
            />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

interface Message {
  msgId: string
  from: string
  to: string
  subject: string
  body: string
  timestamp: number
  unread: boolean
  archived: boolean
}

const props = defineProps<{
  message: Message
}>()

const emit = defineEmits<{
  click: []
  archive: [msgId: string]
}>()

function truncateAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now'
  }
  
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}m ago`
  }
  
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}h ago`
  }
  
  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000)
    return `${days}d ago`
  }
  
  // Format as date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function getPreview(body: string): string {
  if (!body) return 'No content'
  
  // Remove markdown formatting for preview
  const plain = body
    .replace(/#{1,6}\s/g, '') // Headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
    .replace(/\*(.+?)\*/g, '$1') // Italic
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
    .replace(/`(.+?)`/g, '$1') // Code
    .replace(/\n/g, ' ') // Newlines
    .trim()
  
  return plain.length > 120 ? plain.slice(0, 120) + '...' : plain
}

function toggleArchive() {
  emit('archive', props.message.msgId)
}
</script>

<style scoped>
.message-list-item {
  transition: all 0.2s ease;
}

.message-list-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
