<script setup lang="ts">
import { useR3mailWallet } from '~/composables/useR3mailWallet'

const route = useRoute()
const wallet = useR3mailWallet()

// Copy address to clipboard
async function copyAddress() {
  if (!wallet.address.value) return
  
  try {
    await navigator.clipboard.writeText(wallet.address.value)
    console.log('Address copied to clipboard')
  } catch (err) {
    console.error('Failed to copy address:', err)
  }
}

function setLinks() {
  if (route.fullPath === '/') {
    return [{ title: 'Home', href: '/' }]
  }

  const segments = route.fullPath.split('/').filter(item => item !== '')

  const breadcrumbs = segments.map((item, index) => {
    // Special handling for message IDs (long hex strings)
    if (item.startsWith('0x') && item.length > 20) {
      const shortened = `${item.slice(0, 6)}...${item.slice(-4)}`
      return {
        title: shortened,
        href: `/${segments.slice(0, index + 1).join('/')}`,
      }
    }
    
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
</script>

<template>
  <header class="sticky top-0 md:peer-data-[variant=inset]:top-2 z-10 h-(--header-height) flex items-center gap-4 border-b bg-background px-4 md:px-6 md:rounded-tl-xl md:rounded-tr-xl">
    <div class="w-full flex items-center gap-4 h-4">
      <SidebarTrigger />
      <Separator orientation="vertical" />
      <BaseBreadcrumbCustom :links="links" />
    </div>
    <div class="ml-auto flex items-center gap-2">
      <!-- Wallet Controls -->
      <template v-if="!wallet.isConnected.value">
        <Button @click="wallet.connect" size="sm">
          <Icon name="lucide:wallet" class="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
      </template>
      <template v-else>
        <Badge variant="outline" class="font-mono text-xs">
          {{ wallet.address.value.slice(0, 6) }}...{{ wallet.address.value.slice(-4) }}
        </Badge>
        <Button @click="copyAddress" variant="ghost" size="icon" class="h-8 w-8">
          <Icon name="lucide:copy" class="h-4 w-4" />
        </Button>
        <Button @click="wallet.disconnect" variant="ghost" size="icon" class="h-8 w-8">
          <Icon name="lucide:log-out" class="h-4 w-4" />
        </Button>
      </template>
      
      <slot />
    </div>
  </header>
</template>

<style scoped>

</style>
