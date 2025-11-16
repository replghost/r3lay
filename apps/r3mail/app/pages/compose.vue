<template>
  <div class="compose-page h-full flex flex-col">
    <!-- Header -->
    <div class="border-b px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <NuxtLink to="/inbox">
            <Button variant="ghost" size="icon">
              <Icon name="lucide:arrow-left" class="h-5 w-5" />
            </Button>
          </NuxtLink>
          <div>
            <h1 class="text-2xl font-bold">New Message</h1>
            <p class="text-sm text-muted-foreground mt-0.5">
              Send an encrypted message
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Compose Form -->
    <div class="flex-1 overflow-y-auto">
      <div class="max-w-3xl mx-auto px-6 py-6">
        <div class="space-y-6">
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

          <!-- Error -->
          <Card v-if="error" class="border-destructive">
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
    </div>

    <!-- Send Progress Modal -->
    <SendMessageModal 
      v-model:open="showSendModal"
      :step="sendStep"
      :error="sendError"
    />
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
const showSendModal = ref(false)
const sendStep = ref(0) // 0 = not started, 1 = signing, 2 = sending, 3 = complete
const sendError = ref('')

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
  sendError.value = ''
  sendStep.value = 0
  showSendModal.value = true
  
  try {
    // Step 1: Sign envelope (happens inside sendMessage)
    sendStep.value = 1
    
    await messageStore.sendMessage(
      form.value.to,
      form.value.subject,
      form.value.body
    )
    
    // Step 3: Complete
    sendStep.value = 3
    
    // Wait a moment to show success, then navigate
    setTimeout(() => {
      showSendModal.value = false
      router.push('/inbox')
    }, 1500)
  } catch (err: any) {
    // Make error messages more user-friendly
    let errorMsg = err.message || 'Failed to send message'
    
    if (errorMsg.includes('User rejected') || errorMsg.includes('user rejected') || errorMsg.includes('User denied')) {
      errorMsg = 'You cancelled the signature request. Please try again.'
    } else if (errorMsg.includes('not been authorized')) {
      errorMsg = 'Signature request was rejected. Please try again and approve the request in MetaMask.'
    }
    
    sendError.value = errorMsg
    error.value = errorMsg
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
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
