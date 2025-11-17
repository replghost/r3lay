<script setup lang="ts">
import type { NavGroup, NavLink, NavSectionTitle } from '~/types/nav'
import { navMenu, navMenuBottom } from '~/constants/menus'

function resolveNavItemComponent(item: NavLink | NavGroup | NavSectionTitle): any {
  if ('children' in item)
    return resolveComponent('LayoutSidebarNavGroup')

  return resolveComponent('LayoutSidebarNavLink')
}

const { sidebar } = useAppSettings()
</script>

<template>
  <Sidebar :collapsible="sidebar?.collapsible" :side="sidebar?.side" :variant="sidebar?.variant">
    <SidebarHeader>
      <div class="px-4 py-2">
        <div class="flex items-center gap-2">
          <Icon name="i-lucide-mail" class="h-6 w-6" />
          <div class="flex flex-col gap-0.5">
            <span class="font-bold text-lg leading-tight">3MAIL</span>
            <span class="text-xs text-muted-foreground">Encrypted Unstoppable Mail</span>
          </div>
        </div>
      </div>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup v-for="(nav, indexGroup) in navMenu" :key="indexGroup">
        <SidebarGroupLabel v-if="nav.heading">
          {{ nav.heading }}
        </SidebarGroupLabel>
        <component :is="resolveNavItemComponent(item)" v-for="(item, index) in nav.items" :key="index" :item="item" />
      </SidebarGroup>
      <SidebarGroup class="mt-auto">
        <component :is="resolveNavItemComponent(item)" v-for="(item, index) in navMenuBottom" :key="index" :item="item" size="sm" />
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <div class="w-full px-3 pb-3 text-[10px] text-muted-foreground space-y-1">
        <div>Runs on <span class="font-medium">Passet Hub Testnet</span></div>
        <a
          href="https://faucet.polkadot.io/?parachain=1111"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-[10px] underline-offset-2 hover:underline"
        >
          Get testnet PAS ("Passet Hub: Smart Contracts")
        </a>
      </div>
      <LayoutSidebarNavFooter />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>

<style scoped>

</style>
