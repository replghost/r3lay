<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle class="text-2xl">Welcome to 3MAIL! 🎉</DialogTitle>
        <DialogDescription>
          Let's get you set up with encrypted messaging in just one step.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-4">
        <!-- Content -->
        <div class="space-y-4">
          <div class="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon name="lucide:key" class="h-5 w-5 text-primary" />
            </div>
            <div class="flex-1">
              <h3 class="font-semibold mb-1">Register Your Public Key</h3>
              <p class="text-sm text-muted-foreground">
                To receive encrypted messages, you need to register your public key on-chain. 
                This is a one-time setup that allows others to send you secure messages.
              </p>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-start gap-3">
              <Icon name="lucide:check-circle" class="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p class="text-sm font-medium">Free & Secure</p>
                <p class="text-xs text-muted-foreground">Your private key never leaves your device</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Icon name="lucide:check-circle" class="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p class="text-sm font-medium">One-Time Setup</p>
                <p class="text-xs text-muted-foreground">You only need to do this once</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Icon name="lucide:check-circle" class="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p class="text-sm font-medium">End-to-End Encrypted</p>
                <p class="text-xs text-muted-foreground">Only you can read your messages</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="flex-col sm:flex-row gap-2">
        <Button variant="outline" @click="$emit('update:open', false)" class="w-full sm:w-auto">
          Maybe Later
        </Button>
        <Button @click="handleRegister" :disabled="registering" class="w-full sm:w-auto">
          <Icon v-if="registering" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
          <Icon v-else name="lucide:key" class="mr-2 h-4 w-4" />
          {{ registering ? 'Registering...' : 'Register Public Key' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useR3mailWallet } from '~/composables/useR3mailWallet'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'registered': []
}>()

const wallet = useR3mailWallet()
const registering = ref(false)

async function handleRegister() {
  if (!wallet.keys.value) {
    console.error('Keys not derived')
    return
  }

  registering.value = true
  try {
    await wallet.registerPublicKey()
    console.log('✅ Public key registered successfully!')
    emit('registered')
    emit('update:open', false)
  } catch (err) {
    console.error('Failed to register public key:', err)
  } finally {
    registering.value = false
  }
}
</script>
