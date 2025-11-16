import type { NavMenu, NavMenuItems } from '~/types/nav'

export const navMenu: NavMenu[] = [
  {
    heading: 'Messages',
    items: [
      {
        title: 'Inbox',
        icon: 'i-lucide-inbox',
        link: '/inbox',
      },
      {
        title: 'Compose',
        icon: 'i-lucide-pen-square',
        link: '/compose',
      },
    ],
  },
]

export const navMenuBottom: NavMenuItems = [
  {
    title: 'Documentation',
    icon: 'i-lucide-book-open',
    link: 'https://github.com/replghost/r3lay',
  },
  {
    title: 'Settings',
    icon: 'i-lucide-settings',
    link: '/settings',
  },
]
