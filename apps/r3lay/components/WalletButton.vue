<template>
  <div class="relative">
    <!-- Connected State -->
    <Button
      v-if="isConnected"
      @click="showMenu = !showMenu"
      variant="outline"
      size="sm"
      class="gap-2"
    >
      <div class="h-2 w-2 rounded-full bg-green-500"></div>
      <span class="font-mono text-xs">
        {{ address?.slice(0, 6) }}...{{ address?.slice(-4) }}
      </span>
      <Icon name="lucide:chevron-down" class="h-4 w-4" />
    </Button>

    <!-- Disconnected State -->
    <Button
      v-else
      @click="handleConnect"
      variant="default"
      size="sm"
      :disabled="isConnecting"
    >
      <Icon
        v-if="isConnecting"
        name="lucide:loader-2"
        class="mr-2 h-4 w-4 animate-spin"
      />
      <Icon v-else name="lucide:wallet" class="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>

    <!-- Dropdown Menu -->
    <div
      v-if="showMenu && isConnected"
      class="absolute right-0 mt-2 w-64 bg-background border rounded-lg shadow-lg z-50"
    >
      <div class="p-4 border-b">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">Connected with</span>
          <div class="h-2 w-2 rounded-full bg-green-500"></div>
        </div>
        <p class="font-medium text-sm">{{ walletName }}</p>
        <p class="font-mono text-xs text-muted-foreground mt-1">
          {{ address }}
        </p>
      </div>

      <div class="p-2">
        <button
          @click="copyAddress"
          class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
        >
          <Icon name="lucide:copy" class="h-4 w-4" />
          Copy Address
        </button>

        <button
          @click="handleSwitchNetwork"
          class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
        >
          <Icon name="lucide:network" class="h-4 w-4" />
          Switch to Passet Hub
        </button>

        <button
          @click="handleDisconnect"
          class="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
        >
          <Icon name="lucide:log-out" class="h-4 w-4" />
          Disconnect
        </button>
      </div>
    </div>

    <!-- Wallet Selector Modal -->
    <div
      v-if="showWalletSelector"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showWalletSelector = false"
    >
      <Card class="max-w-md w-full mx-4">
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>
            Choose a wallet to connect to R3LAY
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-2">
          <button
            v-for="wallet in availableWallets"
            :key="wallet.info.uuid"
            @click="selectWallet(wallet)"
            class="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
          >
            <img
              v-if="wallet.info.icon"
              :src="wallet.info.icon"
              :alt="wallet.info.name"
              class="h-8 w-8 rounded"
            />
            <div class="flex-1 text-left">
              <p class="font-medium">{{ wallet.info.name }}</p>
              <p class="text-xs text-muted-foreground">{{ wallet.info.rdns }}</p>
            </div>
            <Icon name="lucide:chevron-right" class="h-5 w-5 text-muted-foreground" />
          </button>

          <button
            v-if="availableWallets.length === 0"
            @click="selectWallet()"
            class="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
          >
            <div class="h-8 w-8 rounded bg-muted flex items-center justify-center">
              <Icon name="lucide:wallet" class="h-5 w-5" />
            </div>
            <div class="flex-1 text-left">
              <p class="font-medium">Browser Wallet</p>
              <p class="text-xs text-muted-foreground">Use default wallet</p>
            </div>
            <Icon name="lucide:chevron-right" class="h-5 w-5 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>
    </div>

    <!-- Click outside to close menu -->
    <div
      v-if="showMenu"
      class="fixed inset-0 z-40"
      @click="showMenu = false"
    ></div>
  </div>
</template>

<script setup lang="ts">
const {
  address,
  chainId,
  isConnected,
  walletName,
  availableWallets,
  isConnecting,
  connect,
  disconnect,
  switchNetwork,
  addNetwork,
} = useWalletConnect()

const showMenu = ref(false)
const showWalletSelector = ref(false)

const handleConnect = () => {
  showWalletSelector.value = true
}

const selectWallet = async (wallet?: any) => {
  showWalletSelector.value = false
  try {
    await connect(wallet)
  } catch (e) {
    console.error('Failed to connect:', e)
  }
}

const handleDisconnect = () => {
  disconnect()
  showMenu.value = false
}

const copyAddress = async () => {
  if (!address.value) return
  try {
    await navigator.clipboard.writeText(address.value)
    showMenu.value = false
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

const handleSwitchNetwork = async () => {
  try {
    // Try to switch first
    await switchNetwork(420429638)
    showMenu.value = false
  } catch (switchError: any) {
    // If network doesn't exist (error code 4902), try to add it
    if (switchError.code === 4902) {
      try {
        await addNetwork({
          chainId: 420429638,
          chainName: 'Passet Hub',
          rpcUrls: ['https://testnet-passet-hub-eth-rpc.polkadot.io'],
          nativeCurrency: {
            name: 'PAS',
            symbol: 'PAS',
            decimals: 18,
          },
          blockExplorerUrls: ['https://blockscout-passet-hub.parity-testnet.parity.io'],
        })
        showMenu.value = false
      } catch (addError: any) {
        // Check if it's just a duplicate network error (already exists)
        if (addError.code === -32603 || addError.message?.includes('already exists')) {
          console.log('Network already exists, trying to switch again')
          try {
            await switchNetwork(420429638)
            showMenu.value = false
            return
          } catch (e) {
            // Ignore, will show manual message below
          }
        }
        console.error('Failed to add network:', addError)
        // Show user-friendly message only for real errors
        if (addError.code !== 4001) {
          alert('Please add Passet Hub network manually:\n\nNetwork Name: Passet Hub\nRPC URL: https://testnet-passet-hub-eth-rpc.polkadot.io\nChain ID: 420429638\nCurrency: PAS')
        }
      }
    } else if (switchError.code === 4001) {
      // User rejected
      console.log('User rejected network switch')
    } else {
      console.error('Network switch error:', switchError)
      // Only alert for non-user-rejection errors
      if (switchError.code !== 4001) {
        alert('Failed to switch network. Please switch manually in MetaMask.')
      }
    }
  }
}
</script>
