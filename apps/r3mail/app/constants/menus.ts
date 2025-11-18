import type { NavMenu, NavMenuItems } from '~/types/nav'

export const navMenu: NavMenu[] = [
  {
    heading: '',
    items: [
      {
        title: 'Compose',
        icon: 'i-lucide-pen-square',
        link: '/compose',
      },
    ],
  },
  {
    heading: 'Messages',
    items: [
      {
        title: 'Inbox',
        icon: 'i-lucide-inbox',
        link: '/inbox',
      },
      {
        title: 'Outbox',
        icon: 'i-lucide-send',
        link: '/outbox',
      },
    ],
  },
]

export const navMenuBottom: NavMenuItems = []
