// ============================================================
// Analytics: turn raw attempts + reviews into module/domain mastery.
// ============================================================
import type {
  Attempt,
  DomainId,
  DomainStat,
  ModuleStat,
  Question,
  ReviewItem,
} from '../types'
import { DOMAINS, MODULES } from '../data/taxonomy'
import { isDue } from './srs'

export interface Overview {
  totalQuestions: number
  attemptedUnique: number
  coverage: number
  overallAccuracy: number
  dueToday: number
  reviewBacklog: number
  weakModuleCount: number
}

function blendMastery(coverage: number, accuracy: number, attempts: number): number {
  if (attempts === 0) return 0
  return 0.35 * coverage + 0.65 * accuracy
}

export function moduleStats(
  questions: Question[],
  attempts: Attempt[],
  reviews: Record<string, ReviewItem>,
  now: number,
): ModuleStat[] {
  const qById = new Map(questions.map((q) => [q.id, q]))

  // group attempts by module
  const perModule = new Map<
    number,
    { attempts: number; correct: number; seen: Set<string> }
  >()
  for (const a of attempts) {
    const q = qById.get(a.questionId)
    if (!q) continue
    let rec = perModule.get(q.module)
    if (!rec) {
      rec = { attempts: 0, correct: 0, seen: new Set() }
      perModule.set(q.module, rec)
    }
    rec.attempts++
    if (a.correct) rec.correct++
    rec.seen.add(a.questionId)
  }

  // due counts by module
  const dueByModule = new Map<number, number>()
  for (const r of Object.values(reviews)) {
    const q = qById.get(r.questionId)
    if (!q) continue
    if (isDue(r, now)) dueByModule.set(q.module, (dueByModule.get(q.module) ?? 0) + 1)
  }

  const totalByModule = new Map<number, number>()
  for (const q of questions) totalByModule.set(q.module, (totalByModule.get(q.module) ?? 0) + 1)

  return MODULES.map((m) => {
    const rec = perModule.get(m.module)
    const total = totalByModule.get(m.module) ?? 0
    const attemptsN = rec?.attempts ?? 0
    const correct = rec?.correct ?? 0
    const seen = rec?.seen.size ?? 0
    const coverage = total > 0 ? seen / total : 0
    const accuracy = attemptsN > 0 ? correct / attemptsN : -1
    const mastery = blendMastery(coverage, attemptsN > 0 ? correct / attemptsN : 0, attemptsN)
    return {
      module: m.module,
      moduleName: m.name,
      domain: m.domain,
      district: m.district,
      total,
      seen,
      correct,
      attempts: attemptsN,
      accuracy,
      dueCount: dueByModule.get(m.module) ?? 0,
      mastery,
    }
  })
}

export function domainStats(mods: ModuleStat[]): DomainStat[] {
  const ids: DomainId[] = [
    'overview',
    'recon',
    'system',
    'network',
    'web',
    'wireless',
    'mobile-iot',
    'cloud',
    'crypto',
  ]
  return ids.map((id) => {
    const inDomain = mods.filter((m) => m.domain === id)
    const total = inDomain.reduce((s, m) => s + m.total, 0)
    const attempts = inDomain.reduce((s, m) => s + m.attempts, 0)
    const correct = inDomain.reduce((s, m) => s + m.correct, 0)
    const accuracy = attempts > 0 ? correct / attempts : -1
    const coverage =
      total > 0 ? inDomain.reduce((s, m) => s + m.seen, 0) / total : 0
    const mastery = attempts > 0 ? 0.35 * coverage + 0.65 * (correct / attempts) : 0
    return {
      domainId: id,
      domainName: DOMAINS[id].short,
      weightPct: DOMAINS[id].weightPct,
      total,
      attempts,
      correct,
      accuracy,
      mastery,
    }
  })
}

/** Weakest started modules first, then unstarted with content. */
export function weakestModules(mods: ModuleStat[], n = 5): ModuleStat[] {
  const started = mods.filter((m) => m.attempts > 0 && m.total > 0)
  const unstarted = mods.filter((m) => m.attempts === 0 && m.total > 0)
  started.sort((a, b) => a.mastery - b.mastery)
  return [...started, ...unstarted].slice(0, n)
}

export function overview(
  questions: Question[],
  attempts: Attempt[],
  reviews: Record<string, ReviewItem>,
  now: number,
): Overview {
  const mods = moduleStats(questions, attempts, reviews, now)
  const attemptedUnique = new Set(attempts.map((a) => a.questionId)).size
  const totalAttempts = attempts.length
  const correct = attempts.filter((a) => a.correct).length
  const dueToday = Object.values(reviews).filter((r) => isDue(r, now)).length
  const weakModuleCount = mods.filter(
    (m) => m.total > 0 && (m.attempts === 0 || m.mastery < 0.6),
  ).length
  return {
    totalQuestions: questions.length,
    attemptedUnique,
    coverage: questions.length > 0 ? attemptedUnique / questions.length : 0,
    overallAccuracy: totalAttempts > 0 ? correct / totalAttempts : -1,
    dueToday,
    reviewBacklog: Object.keys(reviews).length,
    weakModuleCount,
  }
}
