import type { ModuleStat } from '../types'
import { DOMAINS, MODULES } from '../data/taxonomy'
import type { ExamPreset } from '../data/taxonomy'

export const WEIGHTED_PRESETS_KEY = 'neonsec:exam-weight-presets:v1'

export interface WeightedExamPreset {
  id: string
  label: string
  count: number
  minutes: number
  moduleCounts: Record<string, number>
  updatedAt: number
}

function apportion(total: number, weights: number[]): number[] {
  const sum = weights.reduce((s, w) => s + Math.max(0, w), 0) || 1
  const raw = weights.map((w) => (Math.max(0, w) / sum) * total)
  const counts = raw.map(Math.floor)
  let remainder = total - counts.reduce((s, n) => s + n, 0)
  const fracs = raw
    .map((value, i) => ({ i, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac)
  for (let i = 0; i < remainder; i++) counts[fracs[i % fracs.length].i]++
  return counts
}

function moduleCountsFromList(counts: number[]): Record<string, number> {
  const out: Record<string, number> = {}
  MODULES.forEach((m, i) => {
    out[String(m.module)] = counts[i] ?? 0
  })
  return out
}

function updatedPreset(preset: Omit<WeightedExamPreset, 'updatedAt'>): WeightedExamPreset {
  return { ...preset, updatedAt: Date.now() }
}

export function buildBalancedExamPreset(): WeightedExamPreset {
  return updatedPreset({
    id: 'balanced-125',
    label: 'Balanced 125',
    count: 125,
    minutes: 240,
    moduleCounts: moduleCountsFromList(apportion(125, MODULES.map(() => 1))),
  })
}

export function buildFinalReadyExamPreset(): WeightedExamPreset {
  const moduleCounts: Record<string, number> = {}
  const officialDomains = Object.values(DOMAINS).filter((d) => d.id !== 'beyond')
  const domainCounts = apportion(125, officialDomains.map((d) => d.weightPct))
  officialDomains.forEach((domain, index) => {
    const modules = MODULES.filter((m) => m.domain === domain.id)
    const counts = apportion(domainCounts[index] ?? 0, modules.map(() => 1))
    modules.forEach((m, i) => {
      moduleCounts[String(m.module)] = counts[i] ?? 0
    })
  })
  return updatedPreset({
    id: 'final-ready-125',
    label: 'Final-ready 125',
    count: 125,
    minutes: 240,
    moduleCounts,
  })
}

export function buildWeakFocusedExamPreset(
  mods: Pick<ModuleStat, 'module' | 'attempts' | 'mastery' | 'total'>[],
): WeightedExamPreset {
  const ranked = mods
    .filter((m) => m.module >= 1 && m.module <= 20 && m.total > 0)
    .slice()
    .sort((a, b) => {
      const aStarted = a.attempts > 0 ? 0 : 1
      const bStarted = b.attempts > 0 ? 0 : 1
      return aStarted - bStarted || a.mastery - b.mastery || a.module - b.module
    })
  const focus = new Set(ranked.slice(0, 5).map((m) => m.module))
  const weights = MODULES.map((m) => (focus.size > 0 && focus.has(m.module) ? 3 : 1))
  return updatedPreset({
    id: 'weak-focused-125',
    label: 'Weak-focused 125',
    count: 125,
    minutes: 240,
    moduleCounts: moduleCountsFromList(apportion(125, weights)),
  })
}

export function asExamPreset(preset: WeightedExamPreset): ExamPreset {
  return {
    id: preset.id,
    label: preset.label,
    count: preset.count,
    minutes: preset.minutes,
    desc: 'User-configured module weighting.',
  }
}

export function readWeightedPresets(): WeightedExamPreset[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(WEIGHTED_PRESETS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((p): p is WeightedExamPreset =>
      typeof p?.id === 'string' &&
      typeof p?.label === 'string' &&
      typeof p?.count === 'number' &&
      typeof p?.minutes === 'number' &&
      p?.moduleCounts &&
      typeof p.moduleCounts === 'object',
    )
  } catch {
    return []
  }
}

export function writeWeightedPresets(presets: WeightedExamPreset[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(WEIGHTED_PRESETS_KEY, JSON.stringify(presets))
}
