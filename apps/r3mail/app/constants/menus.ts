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
      {
        title: 'Archived',
        icon: 'i-lucide-archive',
        link: '/archived',
      },
    ],
  },
]

export const navMenuBottom: NavMenuItems = []
