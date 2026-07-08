// Derivable badge logic. Event-based badges (flawless run, report submitted,
// cleared queue) are added to profile.badges by the store at the moment they happen.
import type { DomainStat, ExamResult, ModuleStat } from '../types'

export interface BadgeInput {
  mods: ModuleStat[]
  domains: DomainStat[]
  attemptsCount: number
  results: ExamResult[]
  streakDays: number
}

export function computeDerivedBadges(inp: BadgeInput): string[] {
  const earned = new Set<string>()
  const mod = (n: number) => inp.mods.find((m) => m.module === n)
  const dom = (id: string) => inp.domains.find((d) => d.domainId === id)

  if (inp.attemptsCount >= 1) earned.add('first-contact')
  if (inp.attemptsCount >= 100) earned.add('centurion')

  const m1 = mod(1)
  if (m1 && m1.total > 0 && m1.seen >= m1.total) earned.add('scope-keeper')

  const recon = dom('recon')
  if (recon && recon.attempts >= 8 && recon.mastery >= 0.8) earned.add('osint-scout')

  const m8 = mod(8)
  if (m8 && m8.attempts >= 5 && m8.accuracy >= 0.8) earned.add('packet-reader')

  const web = dom('web')
  if (web && web.attempts >= 8 && web.mastery >= 0.8) earned.add('web-guardian')

  const m20 = mod(20)
  if (m20 && m20.attempts >= 5 && m20.mastery >= 0.8) earned.add('crypto-adept')

  const m19 = mod(19)
  if (m19 && m19.attempts >= 5 && m19.mastery >= 0.8) earned.add('cloud-sentinel')

  if (inp.streakDays >= 7) earned.add('streak-7')

  if (inp.results.some((r) => r.preset === 'full' && r.passed)) earned.add('mock-slayer')

  return [...earned]
}
