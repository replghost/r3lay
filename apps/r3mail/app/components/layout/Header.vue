<script setup lang="ts">
import { useR3mailWallet } from '~/composables/useR3mailWallet'

const route = useRoute()
const wallet = useR3mailWallet()

function setLinks() {
  if (route.fullPath === '/') {
    return [{ title: 'Home', href: '/' }]
  }

  const segments = route.fullPath.split('/').filter(item => item !== '')

  const breadcrumbs = segments.map((item, index) => {
    const str = item.replace(/-/g, ' ')
    const title = str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

    return {
      title,
      href: `/${segments.slice(0, index + 1).join('/')}`,
    }
  })

  return [{ title: 'Home', href: '/' }, ...breadcrumbs]
}

const links = ref<{
  title: string
  href: string
}[]>(setLinks())

watch(() => route.fullPath, (val) => {
  if (val) {
    links.value = setLinks()
  }
})

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
</script>

<template>
  <header class="sticky top-0 md:peer-data-[variant=inset]:top-2 z-10 h-(--header-height) flex items-center gap-4 border-b bg-background px-4 md:px-6 md:rounded-tl-xl md:rounded-tr-xl">
    <div class="w-full flex items-center gap-4 h-4">
      <SidebarTrigger />
      <Separator orientation="vertical" />
      <BaseBreadcrumbCustom :links="links" />
    </div>
    <div class="ml-auto flex items-center gap-4">
      <!-- Wallet Connection -->
      <div v-if="!wallet.isConnected.value">
        <Button 
          @click="handleConnect" 
          :disabled="connecting"
          size="sm"
        >
          <Icon name="i-lucide-wallet" class="mr-2 h-4 w-4" />
          {{ connecting ? 'Connecting...' : 'Connect Wallet' }}
        </Button>
      </div>
      <div v-else class="flex items-center gap-2">
        <Badge variant="outline" class="gap-2">
          <Icon name="i-lucide-check-circle" class="h-3 w-3 text-green-500" />
          {{ formattedAddress }}
        </Badge>
        <Button 
          @click="copyAddress" 
          variant="ghost" 
          size="sm"
          :title="copied ? 'Copied!' : 'Copy address'"
        >
          <Icon :name="copied ? 'i-lucide-check' : 'i-lucide-copy'" class="h-4 w-4" />
        </Button>
        <Button 
          @click="handleDisconnect" 
          variant="ghost" 
          size="sm"
          title="Disconnect wallet"
        >
          <Icon name="i-lucide-log-out" class="h-4 w-4" />
        </Button>
      </div>
      <slot />
    </div>
  </header>
</template>

<style scoped>

</style>
