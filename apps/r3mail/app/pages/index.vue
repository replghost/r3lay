<script setup lang="ts">
// Redirect to inbox
definePageMeta({
  middleware: defineNuxtRouteMiddleware(() => {
    return navigateTo('/inbox')
  }),
})
</script>

<template>
  <div />
</template>
