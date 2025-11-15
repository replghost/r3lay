<template>
  <div class="container mx-auto p-8 max-w-2xl">
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <NuxtLink to="/creator" class="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center">
          <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
          Back to Dashboard
        </NuxtLink>
        <h1 class="text-4xl font-bold mt-4">Create Channel</h1>
        <p class="text-muted-foreground mt-2">
          Set up your encrypted publishing channel
        </p>
      </div>

      <!-- Progress Steps -->
      <div class="flex items-center justify-between">
        <div v-for="(step, index) in steps" :key="index" class="flex items-center">
          <div 
            class="flex items-center justify-center w-8 h-8 rounded-full border-2"
            :class="currentStep > index ? 'bg-primary border-primary text-primary-foreground' : 
                    currentStep === index ? 'border-primary text-primary' : 
                    'border-muted text-muted-foreground'"
          >
            <Icon v-if="currentStep > index" name="lucide:check" class="h-4 w-4" />
            <span v-else class="text-sm">{{ index + 1 }}</span>
          </div>
          <div v-if="index < steps.length - 1" class="w-16 h-0.5 mx-2" :class="currentStep > index ? 'bg-primary' : 'bg-muted'" />
        </div>
      </div>

      <!-- Step Content -->
      <Card>
        <CardHeader>
          <CardTitle>{{ steps[currentStep] }}</CardTitle>
        </CardHeader>
        <CardContent class="space-y-6">
          <!-- Step 1: Identity -->
          <div v-if="currentStep === 0" class="space-y-4">
            <div v-if="!hasCreatorIdentity">
              <p class="text-sm text-muted-foreground mb-4">
                First, we'll generate your encryption keys. These keys will be stored securely in your browser.
              </p>
              <Button @click="generateKeys" :disabled="loading">
                <Icon v-if="loading" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
                Generate Keys
              </Button>
            </div>
            <div v-else class="space-y-4">
              <div class="flex items-center gap-2 text-green-600">
                <Icon name="lucide:check-circle" class="h-5 w-5" />
                <span class="font-medium">Keys generated successfully</span>
              </div>
              <div class="p-4 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-2">Your Public Key:</p>
                <code class="text-xs break-all">{{ publicKey }}</code>
              </div>
            </div>
          </div>

          <!-- Step 2: Channel Info -->
          <div v-if="currentStep === 1" class="space-y-4">
            <div class="space-y-2">
              <Label for="channel-name">Channel Name</Label>
              <Input 
                id="channel-name" 
                v-model="channelName" 
                placeholder="My Newsletter"
                :disabled="loading"
              />
            </div>
            <div class="space-y-2">
              <Label for="channel-description">Description</Label>
              <Textarea 
                id="channel-description" 
                v-model="channelDescription" 
                placeholder="A brief description of your channel"
                :disabled="loading"
              />
            </div>
          </div>

          <!-- Step 3: Wallet Connection -->
          <div v-if="currentStep === 2" class="space-y-4">
            <div v-if="!isConnected">
              <p class="text-sm text-muted-foreground mb-4">
                Connect your wallet to register the channel on-chain.
              </p>
              <Button @click="connectWallet" :disabled="loading">
                <Icon v-if="loading" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
                <Icon v-else name="lucide:wallet" class="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            </div>
            <div v-else class="space-y-4">
              <div class="flex items-center gap-2 text-green-600">
                <Icon name="lucide:check-circle" class="h-5 w-5" />
                <span class="font-medium">Wallet connected</span>
              </div>
              <div class="p-4 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-2">Address:</p>
                <code class="text-xs">{{ walletAddress }}</code>
              </div>
            </div>
          </div>

          <!-- Step 4: Create Channel -->
          <div v-if="currentStep === 3" class="space-y-4">
            <div v-if="!channelCreated">
              <p class="text-sm text-muted-foreground mb-4">
                Ready to create your channel! This will:
              </p>
              <ul class="text-sm text-muted-foreground space-y-2 mb-4">
                <li class="flex items-start gap-2">
                  <Icon name="lucide:check" class="h-4 w-4 mt-0.5 text-primary" />
                  <span>Upload initial feed index to IPFS</span>
                </li>
                <li class="flex items-start gap-2">
                  <Icon name="lucide:check" class="h-4 w-4 mt-0.5 text-primary" />
                  <span>Register channel on Paseo Asset Hub</span>
                </li>
                <li class="flex items-start gap-2">
                  <Icon name="lucide:check" class="h-4 w-4 mt-0.5 text-primary" />
                  <span>Save channel locally</span>
                </li>
              </ul>
              <Button @click="createChannel" :disabled="loading" size="lg">
                <Icon v-if="loading" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
                Create Channel
              </Button>
            </div>
            <div v-else class="space-y-4">
              <div class="flex items-center gap-2 text-green-600">
                <Icon name="lucide:check-circle" class="h-5 w-5" />
                <span class="font-medium">Channel created successfully!</span>
              </div>
              <div class="p-4 bg-muted rounded-lg space-y-2">
                <div>
                  <p class="text-xs text-muted-foreground">Channel ID:</p>
                  <code class="text-xs break-all">{{ channelId }}</code>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">Transaction:</p>
                  <code class="text-xs break-all">{{ txHash }}</code>
                </div>
              </div>
            </div>
          </div>

          <!-- Error Display -->
          <div v-if="error" class="p-4 bg-destructive/10 border border-destructive rounded-lg">
            <p class="text-sm text-destructive">{{ error }}</p>
          </div>
        </CardContent>
        <CardFooter class="flex justify-between">
          <Button 
            v-if="currentStep > 0 && !channelCreated" 
            variant="outline" 
            @click="currentStep--"
            :disabled="loading"
          >
            <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
            Back
          </Button>
          <div v-else />
          
          <Button 
            v-if="currentStep < 3 && canProceed" 
            @click="currentStep++"
            :disabled="loading"
          >
            Next
            <Icon name="lucide:arrow-right" class="ml-2 h-4 w-4" />
          </Button>
          <NuxtLink v-if="channelCreated" to="/creator">
            <Button>
              Go to Dashboard
              <Icon name="lucide:arrow-right" class="ml-2 h-4 w-4" />
            </Button>
          </NuxtLink>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
const { hasCreatorIdentity, initializeCreator, getCreatorPublicKey } = useR3layCore()
const { isConnected, walletAddress, connectWallet: connectWalletFn, createChannel: createChannelFn } = useR3layChain()
const { uploadFeedIndex } = useR3layIPFS()

// State
const currentStep = ref(0)
const loading = ref(false)
const error = ref('')
const publicKey = ref('')
const channelName = ref('')
const channelDescription = ref('')
const channelCreated = ref(false)
const channelId = ref('')
const txHash = ref('')

const steps = [
  'Generate Keys',
  'Channel Info',
  'Connect Wallet',
  'Create Channel'
]

// Computed
const canProceed = computed(() => {
  if (currentStep.value === 0) return hasCreatorIdentity.value
  if (currentStep.value === 1) return channelName.value.trim().length > 0
  if (currentStep.value === 2) return isConnected.value
  return false
})

// Actions
const generateKeys = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await initializeCreator()
    publicKey.value = await getCreatorPublicKey() || ''
  } catch (e: any) {
    error.value = e.message || 'Failed to generate keys'
  } finally {
    loading.value = false
  }
}

const connectWallet = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // First, try to add/switch to Paseo Asset Hub network
    try {
      const { addPaseoAssetHub } = await import('~/utils/addPaseoNetwork')
      await addPaseoAssetHub()
    } catch (networkError) {
      console.warn('Could not add network, continuing anyway:', networkError)
    }
    
    await connectWalletFn()
  } catch (e: any) {
    error.value = e.message || 'Failed to connect wallet'
  } finally {
    loading.value = false
  }
}

const createChannel = async () => {
  loading.value = true
  error.value = ''
  
  try {
    console.log('Step 1: Deriving channel ID...')
    // 1. Derive channel ID from wallet address
    const { deriveChannelIdFromAddress } = await import('../../../packages/r3lay-core/src/utils/index.ts')
    const derivedChannelId = deriveChannelIdFromAddress(walletAddress.value!)
    channelId.value = derivedChannelId
    console.log('Channel ID:', derivedChannelId)
    
    console.log('Step 2: Creating feed index...')
    // 2. Create empty feed index
    const feedIndex = {
      version: 1 as const,
      creator: publicKey.value,
      channelId: derivedChannelId,
      posts: [],
      updatedAt: Date.now(),
    }
    
    console.log('Step 3: Uploading to IPFS...')
    // 3. Upload to IPFS
    const indexCid = await uploadFeedIndex(feedIndex)
    console.log('Index CID:', indexCid)
    
    console.log('Step 4: Creating metadata...')
    // 4. Create metadata
    const metadata = JSON.stringify({
      name: channelName.value,
      description: channelDescription.value,
    })
    
    console.log('Step 5: Creating channel on-chain...')
    console.log('Wallet:', walletAddress.value)
    console.log('Contract:', useRuntimeConfig().public.contractAddress)
    console.log('RPC:', useRuntimeConfig().public.rpcUrl)
    
    // 5. Create channel on-chain
    const result = await createChannelFn(derivedChannelId, indexCid, metadata)
    txHash.value = result.hash
    console.log('Transaction hash:', txHash.value)
    
    channelCreated.value = true
  } catch (e: any) {
    error.value = e.message || 'Failed to create channel'
    console.error('Channel creation error:', e)
    console.error('Error stack:', e.stack)
  } finally {
    loading.value = false
  }
}

// Load keys on mount
onMounted(async () => {
  const { loadIdentities } = useR3layCore()
  await loadIdentities()
  
  if (hasCreatorIdentity.value) {
    publicKey.value = await getCreatorPublicKey() || ''
  }
})

definePageMeta({
  layout: 'default',
})
</script>
