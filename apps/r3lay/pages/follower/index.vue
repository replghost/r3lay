<template>
  <div class="container mx-auto p-8 max-w-4xl">
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <h1 class="text-4xl font-bold">Follower Dashboard</h1>
        <p class="text-muted-foreground mt-2">
          Follow and read encrypted newsletters
        </p>
      </div>

      <!-- Coming Soon -->
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Follower functionality will be available soon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            The follower dashboard is under development. Check back soon!
          </p>
        </CardContent>
        <CardFooter>
          <NuxtLink to="/">
            <Button variant="outline">
              <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </NuxtLink>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})
</script>
