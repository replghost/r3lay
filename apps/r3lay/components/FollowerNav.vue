<template>
  <nav class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container mx-auto px-4">
      <div class="flex h-16 items-center justify-between">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2 font-bold text-xl">
          <Icon name="lucide:radio" class="h-6 w-6 text-primary" />
          <span>R3LAY</span>
          <span class="text-xs font-normal text-muted-foreground">Follower</span>
        </NuxtLink>

        <!-- Navigation -->
        <div class="flex items-center gap-1">
          <NuxtLink to="/follower">
            <Button variant="ghost" size="sm">
              <Icon name="lucide:layout-dashboard" class="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </NuxtLink>
          
          <NuxtLink to="/follower/discover">
            <Button variant="ghost" size="sm">
              <Icon name="lucide:compass" class="mr-2 h-4 w-4" />
              Discover
            </Button>
          </NuxtLink>

          <div class="h-6 w-px bg-border mx-2"></div>

          <NuxtLink to="/creator">
            <Button variant="outline" size="sm">
              <Icon name="lucide:arrow-left-right" class="mr-2 h-4 w-4" />
              Switch to Creator
            </Button>
          </NuxtLink>

          <div class="h-6 w-px bg-border mx-2"></div>

          <WalletButton />
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
</script>
