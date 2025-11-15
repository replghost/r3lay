<template>
  <div class="container mx-auto p-8 max-w-4xl">
    <div class="space-y-8">
      <div>
        <NuxtLink to="/creator" class="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center">
          <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
          Back to Dashboard
        </NuxtLink>
        <h1 class="text-4xl font-bold mt-4">Manage Followers</h1>
        <p class="text-muted-foreground mt-2">
          Add and manage your channel followers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            Follower management will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})
</script>
