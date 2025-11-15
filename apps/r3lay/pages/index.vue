<template>
  <div class="container mx-auto p-8 space-y-8">
    <div class="space-y-2">
      <h1 class="text-4xl font-bold">shadcn-vue Test Page</h1>
      <p class="text-muted-foreground">Testing shadcn-nuxt components</p>
    </div>

    <div class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Card Component</CardTitle>
          <CardDescription>This is a test card using shadcn-vue</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content goes here. This demonstrates the Card component from shadcn-vue.</p>
        </CardContent>
        <CardFooter>
          <Button>Action Button</Button>
        </CardFooter>
      </Card>

      <div class="flex gap-4">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Input & Form Elements</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" />
          </div>
          <div class="space-y-2">
            <Label for="message">Message</Label>
            <Textarea id="message" placeholder="Type your message here" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
