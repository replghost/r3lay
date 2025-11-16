<script setup lang="ts">
import { useR3mailWallet } from '~/composables/useR3mailWallet'

const wallet = useR3mailWallet()

// Format address for display
const formattedAddress = computed(() => {
  if (!wallet.address.value) return ''
  const addr = wallet.address.value
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
})

// Copy address to clipboard
const copied = ref(false)
async function copyAddress() {
  if (!wallet.address.value) return
  
  try {
    await navigator.clipboard.writeText(wallet.address.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy address:', error)
  }
}

// Wallet connection
const connecting = ref(false)

async function handleConnect() {
  connecting.value = true
  try {
    await wallet.connect()
  } catch (error) {
    console.error('Failed to connect wallet:', error)
  } finally {
    connecting.value = false
  }
}

function handleDisconnect() {
  wallet.disconnect()
}
</script>

<template>
  <SidebarMenu>
    <!-- Not Connected -->
    <SidebarMenuItem v-if="!wallet.isConnected.value">
      <SidebarMenuButton 
        size="lg" 
        @click="handleConnect"
        :disabled="connecting"
      >
        <Icon name="i-lucide-wallet" class="h-5 w-5" />
        <span class="flex-1 text-left">
          {{ connecting ? 'Connecting...' : 'Connect Wallet' }}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>

    <!-- Connected -->
    <template v-else>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" class="cursor-default hover:bg-transparent">
          <Icon name="i-lucide-check-circle" class="h-5 w-5 text-green-500" />
          <div class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-semibold">{{ formattedAddress }}</span>
            <span class="truncate text-xs text-muted-foreground">Connected</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <!-- Actions -->
      <SidebarMenuItem>
        <div class="flex gap-1 px-2">
          <Button 
            variant="ghost" 
            size="sm"
            class="flex-1"
            @click="copyAddress"
            :title="copied ? 'Copied!' : 'Copy address'"
          >
            <Icon :name="copied ? 'i-lucide-check' : 'i-lucide-copy'" class="h-4 w-4 mr-2" />
            {{ copied ? 'Copied!' : 'Copy' }}
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            class="flex-1"
            @click="handleDisconnect"
            title="Disconnect wallet"
          >
            <Icon name="i-lucide-log-out" class="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        </div>
      </SidebarMenuItem>
    </template>
  </SidebarMenu>
</template>

<style scoped>

</style>
