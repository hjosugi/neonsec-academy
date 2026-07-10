import type { LucideIcon } from 'lucide-react'
import {
  Archive,
  BookOpenCheck,
  BrainCircuit,
  ChartNoAxesColumnIncreasing,
  ClipboardList,
  Crosshair,
  FileText,
  Flag,
  FlaskConical,
  LayoutDashboard,
  MapPinned,
  RefreshCcw,
  Settings2,
  Timer,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
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
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/bank', label: 'Question Bank', icon: BookOpenCheck },
      { to: '/cards', label: 'Concept Cards', icon: ClipboardList },
      { to: '/practice', label: 'Practice', icon: Crosshair },
      { to: '/review', label: 'Review Queue', icon: RefreshCcw, badge: 'due' },
      { to: '/exam', label: 'Mock Exam', icon: Timer },
    ],
  },
  {
    section: 'Master',
    items: [
      { to: '/analytics', label: 'Analytics', icon: ChartNoAxesColumnIncreasing },
      { to: '/mistakes', label: 'Mistakes', icon: Flag },
      { to: '/labs', label: 'Safe Labs', icon: FlaskConical },
      { to: '/evidence', label: 'Evidence Vault', icon: Archive },
      { to: '/beyond', label: 'CEH+ Tracks', icon: BrainCircuit },
      { to: '/reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    section: 'World',
    items: [
      { to: '/map', label: 'City Map', icon: MapPinned },
      { to: '/settings', label: 'Settings', icon: Settings2 },
    ],
  },
]

export const QUICK_ACTION_ICONS = {
  review: RefreshCcw,
  exam: Timer,
  practice: Crosshair,
  createQuestion: ClipboardList,
  question: BookOpenCheck,
  lab: FlaskConical,
  report: FileText,
} satisfies Record<string, LucideIcon>
