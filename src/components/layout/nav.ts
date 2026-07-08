export interface NavItem {
  to: string
  label: string
  icon: string
  badge?: 'due'
}

export interface NavSection {
  section: string
  items: NavItem[]
}

export const NAV: NavSection[] = [
  {
    section: 'Train',
    items: [
      { to: '/', label: 'Dashboard', icon: '◈' },
      { to: '/bank', label: 'Question Bank', icon: '▤' },
      { to: '/practice', label: 'Practice', icon: '✦' },
      { to: '/review', label: 'Review Queue', icon: '↻', badge: 'due' },
      { to: '/exam', label: 'Mock Exam', icon: '⏱' },
    ],
  },
  {
    section: 'Master',
    items: [
      { to: '/analytics', label: 'Analytics', icon: '▚' },
      { to: '/mistakes', label: 'Mistakes', icon: '⚑' },
      { to: '/labs', label: 'Safe Labs', icon: '⬢' },
      { to: '/reports', label: 'Reports', icon: '▣' },
    ],
  },
  {
    section: 'World',
    items: [
      { to: '/map', label: 'City Map', icon: '⬡' },
      { to: '/settings', label: 'Settings', icon: '⚙' },
    ],
  },
]
