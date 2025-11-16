<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle class="text-2xl">Sending Message</DialogTitle>
        <DialogDescription>
          Two signatures are required to send an encrypted message
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-4">
        <!-- Step 1: Sign Envelope -->
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0">
            <div 
              class="w-10 h-10 rounded-full flex items-center justify-center"
              :class="step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'"
            >
              <Icon 
                v-if="step > 1" 
                name="lucide:check" 
                class="h-5 w-5" 
              />
              <Icon 
                v-else-if="step === 1" 
                name="lucide:loader-2" 
                class="h-5 w-5 animate-spin" 
              />
              <span v-else class="font-semibold">1</span>
            </div>
          </div>
          <div class="flex-1">
            <h3 class="font-semibold mb-1">Sign Message Envelope</h3>
            <p class="text-sm text-muted-foreground">
              Sign the message metadata (sender, recipient, subject) to prove authenticity. This is a free off-chain signature.
            </p>
            <div v-if="step === 1" class="mt-2">
              <Badge variant="secondary" class="text-xs">
                <Icon name="lucide:loader-2" class="mr-1 h-3 w-3 animate-spin" />
                Waiting for signature...
              </Badge>
            </div>
            <div v-if="step > 1" class="mt-2">
              <Badge variant="default" class="text-xs">
                <Icon name="lucide:check" class="mr-1 h-3 w-3" />
                Signed
              </Badge>
            </div>
          </div>
        </div>

        <!-- Connector Line -->
        <div class="ml-5 h-8 w-0.5 bg-border"></div>

        <!-- Step 2: Send Transaction -->
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0">
            <div 
              class="w-10 h-10 rounded-full flex items-center justify-center"
              :class="step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'"
            >
              <Icon 
                v-if="step > 2" 
                name="lucide:check" 
                class="h-5 w-5" 
              />
              <Icon 
                v-else-if="step === 2" 
                name="lucide:loader-2" 
                class="h-5 w-5 animate-spin" 
              />
              <span v-else class="font-semibold">2</span>
            </div>
          </div>
          <div class="flex-1">
            <h3 class="font-semibold mb-1">Send On-Chain Transaction</h3>
            <p class="text-sm text-muted-foreground">
              Record the message notification on the blockchain. This requires gas and notifies the recipient.
            </p>
            <div v-if="step === 2" class="mt-2">
              <Badge variant="secondary" class="text-xs">
                <Icon name="lucide:loader-2" class="mr-1 h-3 w-3 animate-spin" />
                Waiting for transaction...
              </Badge>
            </div>
            <div v-if="step > 2" class="mt-2">
              <Badge variant="default" class="text-xs">
                <Icon name="lucide:check" class="mr-1 h-3 w-3" />
                Sent
              </Badge>
            </div>
          </div>
        </div>

        <!-- Success Message -->
        <div v-if="step === 3" class="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <div class="flex items-center gap-2 text-green-600 dark:text-green-400">
            <Icon name="lucide:check-circle" class="h-5 w-5" />
            <span class="font-semibold">Message sent successfully!</span>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <div class="flex items-start gap-2">
            <Icon name="lucide:alert-circle" class="h-5 w-5 text-destructive mt-0.5" />
            <div class="flex-1">
              <p class="font-semibold text-destructive">Error</p>
              <p class="text-sm text-muted-foreground mt-1">{{ error }}</p>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button 
          v-if="step === 3 || error" 
          @click="$emit('update:open', false)"
          class="w-full"
        >
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean
  step: number // 0 = not started, 1 = signing, 2 = sending, 3 = complete
  error?: string
}>()

defineEmits<{
  'update:open': [value: boolean]
}>()
</script>
