<script setup lang="ts">
import { useR3mailMessages } from '~/composables/useR3mailMessages'

const isDesktop = useMediaQuery('(min-width: 768px)')

const isOpen = ref(false)
const showOnboarding = ref(false)

const direction = useTextDirection()

// Message store for debug settings
const messageStore = useR3mailMessages()

// Clear all messages from IndexedDB
async function clearAllMessages() {
  if (!confirm('Are you sure you want to delete all messages from IndexedDB? This cannot be undone.')) {
    return
  }
  
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('r3mail', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    
    const transaction = db.transaction(['messages'], 'readwrite')
    const store = transaction.objectStore('messages')
    await store.clear()
    
    messageStore.messages.value = []
    console.log('✅ All messages cleared from IndexedDB')
  } catch (err) {
    console.error('Failed to clear messages:', err)
  }
}

// Error tracking
const errors = ref<Array<{ timestamp: number; message: string; details?: string }>>([])

// Listen for global errors
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error
  console.error = (...args: any[]) => {
    originalConsoleError(...args)
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')
    
    // Filter out Vite-related errors and CORS noise
    const isViteError = message.includes('[vite]') || 
                        message.includes('HMR') || 
                        message.includes('Failed to fetch dynamically imported module') ||
                        message.includes('@vite') ||
                        message.includes('plugin:vite')
    
    const isCorsError = message.includes('CORS') || 
                        message.includes('Cross-Origin Request Blocked') ||
                        message.includes('Access-Control-Allow-Origin') ||
                        message.includes('XHR') ||
                        message.includes('OPTIONS')
    
    if (!isViteError && !isCorsError) {
      errors.value.unshift({
        timestamp: Date.now(),
        message: message.slice(0, 200),
        details: message
      })
      
      // Keep only last 20 errors
      if (errors.value.length > 20) {
        errors.value = errors.value.slice(0, 20)
      }
      
      // Auto-open debug sidebar on error
      isOpen.value = true
    }
  }
}

function clearErrors() {
  errors.value = []
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>

<template>
  <Sheet v-if="isDesktop" v-model:open="isOpen">
    <SheetTrigger as-child>
      <Button class="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 shadow-lg" size="icon">
        <Icon name="i-lucide-bug" size="18" />
      </Button>
    </SheetTrigger>
    <SheetContent :side="direction === 'rtl' ? 'left' : 'right'">
      <SheetHeader class="p-6 pb-0">
        <SheetTitle>Debug Tools</SheetTitle>
        <SheetDescription>Developer utilities and testing</SheetDescription>
      </SheetHeader>
      <div class="flex flex-col h-[calc(100vh-100px)]">
        <div class="px-6 py-4 border-b">
          <div class="flex items-center justify-between">
            <Badge variant="destructive">Errors ({{ errors.length }})</Badge>
            <Button v-if="errors.length > 0" @click="clearErrors" variant="ghost" size="sm">
              <Icon name="i-lucide-trash-2" class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea class="flex-1">
          <div class="px-6 py-4 space-y-4">
            <div v-if="errors.length === 0" class="text-sm text-muted-foreground text-center py-8">
              No errors logged
            </div>
            
            <div v-else class="space-y-2">
              <div 
                v-for="(error, index) in errors" 
                :key="index"
                class="p-3 rounded-lg bg-destructive/10 border border-destructive/20 space-y-1"
              >
                <div class="flex items-start justify-between gap-2">
                  <span class="text-xs font-mono text-muted-foreground">
                    {{ formatTime(error.timestamp) }}
                  </span>
                </div>
                <p class="text-xs font-mono break-all">{{ error.message }}</p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div class="px-6 py-4 border-t space-y-3">
          <div class="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="showAllMessages"
              v-model="messageStore.showAllMessages.value"
              class="w-4 h-4 rounded border-gray-300"
            />
            <label for="showAllMessages" class="text-sm text-muted-foreground cursor-pointer">
              Show all messages (including deleted)
            </label>
          </div>
          <Button @click="clearAllMessages" variant="destructive" size="sm" class="w-full">
            <Icon name="i-lucide-trash-2" class="mr-2 h-4 w-4" />
            Clear All Messages
          </Button>
          <button 
            @click="showOnboarding = true" 
            class="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Show onboarding tutorial
          </button>
        </div>
      </div>
    </SheetContent>
  </Sheet>

  <Drawer v-else v-model:open="isOpen">
    <DrawerTrigger as-child>
      <Button class="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 shadow-lg" size="icon">
        <Icon name="i-lucide-bug" size="18" />
      </Button>
    </DrawerTrigger>
    <DrawerContent class="max-h-[97%]">
      <DrawerHeader class="text-center sm:text-center">
        <DrawerTitle>Debug Tools</DrawerTitle>
        <DrawerDescription>Developer utilities and testing</DrawerDescription>
      </DrawerHeader>
      <div class="flex flex-col h-full">
        <div class="px-4 py-3 border-b">
          <div class="flex items-center justify-between">
            <Badge variant="destructive">Errors ({{ errors.length }})</Badge>
            <Button v-if="errors.length > 0" @click="clearErrors" variant="ghost" size="sm">
              <Icon name="i-lucide-trash-2" class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-4 py-4">
          <div v-if="errors.length === 0" class="text-sm text-muted-foreground text-center py-8">
            No errors logged
          </div>
          
          <div v-else class="space-y-2">
            <div 
              v-for="(error, index) in errors" 
              :key="index"
              class="p-3 rounded-lg bg-destructive/10 border border-destructive/20 space-y-1"
            >
              <div class="flex items-start justify-between gap-2">
                <span class="text-xs font-mono text-muted-foreground">
                  {{ formatTime(error.timestamp) }}
                </span>
              </div>
              <p class="text-xs font-mono break-all">{{ error.message }}</p>
            </div>
          </div>
        </div>

        <div class="px-4 py-3 border-t space-y-3">
          <div class="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="showAllMessagesMobile"
              v-model="messageStore.showAllMessages.value"
              class="w-4 h-4 rounded border-gray-300"
            />
            <label for="showAllMessagesMobile" class="text-sm text-muted-foreground cursor-pointer">
              Show all messages (including deleted)
            </label>
          </div>
          <Button @click="clearAllMessages" variant="destructive" size="sm" class="w-full">
            <Icon name="i-lucide-trash-2" class="mr-2 h-4 w-4" />
            Clear All Messages
          </Button>
          <button 
            @click="showOnboarding = true" 
            class="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Show onboarding tutorial
          </button>
        </div>
      </div>
    </DrawerContent>
  </Drawer>

  <!-- Onboarding Modal -->
  <OnboardingModal v-model:open="showOnboarding" />
</template>

<style scoped>

</style>
