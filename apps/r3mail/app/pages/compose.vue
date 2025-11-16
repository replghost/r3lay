<template>
  <div class="compose-page">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-2">
          <NuxtLink to="/inbox">
            <Button variant="ghost" size="icon">
              <Icon name="lucide:arrow-left" class="h-5 w-5" />
            </Button>
          </NuxtLink>
          <h1 class="text-3xl font-bold">New Message</h1>
        </div>
        <p class="text-muted-foreground">
          Send an encrypted message to any Ethereum address
        </p>
      </div>

      <!-- Compose Form -->
      <Card>
        <CardContent class="pt-6">
          <form @submit.prevent="sendMessage" class="space-y-6">
            <!-- To Address -->
            <div class="space-y-2">
              <Label for="to">
                To
                <span class="text-destructive">*</span>
              </Label>
              <Input
                id="to"
                v-model="form.to"
                placeholder="0x..."
                :disabled="sending"
                required
              />
              <p class="text-xs text-muted-foreground">
                Recipient's Ethereum address
              </p>
            </div>

            <!-- Subject -->
            <div class="space-y-2">
              <Label for="subject">Subject</Label>
              <Input
                id="subject"
                v-model="form.subject"
                placeholder="Enter subject"
                :disabled="sending"
              />
            </div>

            <!-- Body -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label for="body">
                  Message
                  <span class="text-destructive">*</span>
                </Label>
                <div class="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    @click="showPreview = !showPreview"
                  >
                    <Icon 
                      :name="showPreview ? 'lucide:edit' : 'lucide:eye'" 
                      class="mr-2 h-4 w-4"
                    />
                    {{ showPreview ? 'Edit' : 'Preview' }}
                  </Button>
                </div>
              </div>

              <!-- Editor -->
              <Textarea
                v-if="!showPreview"
                id="body"
                v-model="form.body"
                placeholder="Write your message in markdown...

# Heading
**Bold text**
*Italic text*
[Link](https://example.com)
- List item"
                :disabled="sending"
                rows="12"
                required
                class="font-mono text-sm"
              />

              <!-- Preview -->
              <Card v-else class="min-h-[300px]">
                <CardContent class="pt-6">
                  <div class="prose prose-sm dark:prose-invert max-w-none">
                    <div v-if="form.body" v-html="markdownPreview" />
                    <p v-else class="text-muted-foreground italic">
                      Nothing to preview yet...
                    </p>
                  </div>
                </CardContent>
              </Card>

              <p class="text-xs text-muted-foreground">
                Supports markdown formatting
              </p>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-between pt-4 border-t">
              <NuxtLink to="/inbox">
                <Button type="button" variant="outline" :disabled="sending">
                  Cancel
                </Button>
              </NuxtLink>

              <Button type="submit" :disabled="sending || !isFormValid">
                <Icon 
                  v-if="sending" 
                  name="lucide:loader-2" 
                  class="mr-2 h-4 w-4 animate-spin"
                />
                <Icon v-else name="lucide:send" class="mr-2 h-4 w-4" />
                {{ sending ? 'Sending...' : 'Send Message' }}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <!-- Error -->
      <Card v-if="error" class="mt-4 border-destructive">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { marked } from 'marked'
import { useR3mailWallet } from '~/composables/useR3mailWallet'
import { useR3mailMessages } from '~/composables/useR3mailMessages'

// Composables
const router = useRouter()
const route = useRoute()
const wallet = useR3mailWallet()
const messageStore = useR3mailMessages()

// State
const form = ref({
  to: '',
  subject: '',
  body: '',
})
const sending = ref(false)
const error = ref('')
const showPreview = ref(false)

// Lifecycle
onMounted(async () => {
  // Check wallet connection
  await wallet.checkConnection()
  
  // Pre-fill from query params (for reply)
  if (route.query.to) {
    form.value.to = route.query.to as string
  }
  if (route.query.subject) {
    form.value.subject = route.query.subject as string
  }
})

// Computed
const isFormValid = computed(() => {
  return (
    wallet.isConnected.value &&
    form.value.to.trim().length > 0 &&
    form.value.to.startsWith('0x') &&
    form.value.body.trim().length > 0
  )
})

const markdownPreview = computed(() => {
  try {
    return marked(form.value.body || '')
  } catch (err) {
    return '<p class="text-destructive">Error rendering markdown</p>'
  }
})

// Methods
async function sendMessage() {
  if (!isFormValid.value) return
  
  sending.value = true
  error.value = ''
  
  try {
    // Send message
    await messageStore.sendMessage(
      form.value.to,
      form.value.subject,
      form.value.body
    )
    
    // Navigate to inbox
    router.push('/inbox')
  } catch (err: any) {
    error.value = err.message || 'Failed to send message'
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.compose-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Markdown preview styles */
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
