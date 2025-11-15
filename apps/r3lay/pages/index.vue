<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
    <div class="container mx-auto p-8 max-w-4xl">
      <div class="text-center space-y-8">
        <!-- Hero -->
        <div class="space-y-4">
          <h1 class="text-6xl font-bold tracking-tight">
            R3LAY
          </h1>
          <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
            Encrypted, Unstoppable, Decentralized Publishing
          </p>
          <p class="text-sm text-muted-foreground max-w-xl mx-auto">
            End-to-end encrypted newsletters powered by Polkadot, IPFS, and cryptography
          </p>
        </div>

        <!-- Mode Selection -->
        <div class="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto pt-8">
          <NuxtLink to="/creator">
            <Card class="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div class="flex justify-center mb-4">
                  <div class="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name="lucide:pen-line" class="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle class="text-center">Creator</CardTitle>
                <CardDescription class="text-center">
                  Publish encrypted content to your followers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul class="space-y-2 text-sm text-muted-foreground">
                  <li class="flex items-center gap-2">
                    <Icon name="lucide:check" class="h-4 w-4 text-green-500" />
                    <span>Create encrypted channels</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <Icon name="lucide:check" class="h-4 w-4 text-green-500" />
                    <span>Manage followers privately</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <Icon name="lucide:check" class="h-4 w-4 text-green-500" />
                    <span>Publish to IPFS</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button class="w-full">
                  Get Started
                  <Icon name="lucide:arrow-right" class="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </NuxtLink>

          <NuxtLink to="/follower">
            <Card class="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div class="flex justify-center mb-4">
                  <div class="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name="lucide:rss" class="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle class="text-center">Follower</CardTitle>
                <CardDescription class="text-center">
                  Follow and read encrypted newsletters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul class="space-y-2 text-sm text-muted-foreground">
                  <li class="flex items-center gap-2">
                    <Icon name="lucide:check" class="h-4 w-4 text-green-500" />
                    <span>Follow channels</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <Icon name="lucide:check" class="h-4 w-4 text-green-500" />
                    <span>Decrypt & read posts</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <Icon name="lucide:check" class="h-4 w-4 text-green-500" />
                    <span>Sync from IPFS</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button class="w-full" variant="outline">
                  Browse Channels
                  <Icon name="lucide:arrow-right" class="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </NuxtLink>
        </div>

        <!-- Features -->
        <div class="pt-12 grid gap-4 md:grid-cols-3 max-w-3xl mx-auto">
          <div class="space-y-2">
            <div class="flex justify-center">
              <Icon name="lucide:lock" class="h-6 w-6 text-primary" />
            </div>
            <h3 class="font-semibold text-sm">End-to-End Encrypted</h3>
            <p class="text-xs text-muted-foreground">
              Only authorized followers can decrypt your content
            </p>
          </div>
          <div class="space-y-2">
            <div class="flex justify-center">
              <Icon name="lucide:shield-check" class="h-6 w-6 text-primary" />
            </div>
            <h3 class="font-semibold text-sm">Unstoppable</h3>
            <p class="text-xs text-muted-foreground">
              No servers, no censorship, fully decentralized
            </p>
          </div>
          <div class="space-y-2">
            <div class="flex justify-center">
              <Icon name="lucide:eye-off" class="h-6 w-6 text-primary" />
            </div>
            <h3 class="font-semibold text-sm">Private</h3>
            <p class="text-xs text-muted-foreground">
              Follower lists never stored on-chain
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})
</script>
