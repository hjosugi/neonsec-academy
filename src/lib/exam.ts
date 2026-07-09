// ============================================================
// Mock exam engine — domain-weighted selection + grading.
// Uses the CEH blueprint weighting from taxonomy DOMAINS.
// ============================================================
import type {
  DomainId,
  DomainScore,
  ExamResult,
  ExamSession,
  ModuleScore,
  Question,
} from '../types'
import type { ExamPreset } from '../data/taxonomy'
import { DOMAINS, moduleMeta } from '../data/taxonomy'
import { isCorrect, isGradable } from './grade'

const OFFICIAL_DOMAINS: DomainId[] = [
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

export interface ExamBuildWarning {
  label: string
  requested: number
  available: number
  message: string
}

export interface ExamBuildPlan {
  ids: string[]
  warnings: ExamBuildWarning[]
}

export interface ExamBuildOptions {
  seed?: number
  recentQuestionIds?: Iterable<string>
}

function seededRng(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let x = t
    x = Math.imul(x ^ (x >>> 15), x | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function orderedQuestions(questions: Question[], recent: Set<string>, rng: () => number): Question[] {
  const fresh = questions.filter((q) => !recent.has(q.id))
  const repeated = questions.filter((q) => recent.has(q.id))
  return [...shuffle(fresh, rng), ...shuffle(repeated, rng)]
}

function positiveCount(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0))
}

function buildModuleCountPlan(
  preset: { count: number },
  gradable: Question[],
  moduleCounts: Record<string, number>,
  options: ExamBuildOptions = {},
): ExamBuildPlan {
  const rng = typeof options.seed === 'number' ? seededRng(options.seed) : Math.random
  const recent = new Set(options.recentQuestionIds ?? [])
  const target = Math.min(preset.count, gradable.length)
  const byModule = new Map<number, Question[]>()
  for (const q of gradable) {
    const list = byModule.get(q.module) ?? []
    list.push(q)
    byModule.set(q.module, list)
  }

  const picked: string[] = []
  const openFallbacks: Question[] = []
  const cappedFallbacks: Question[] = []
  const warnings: ExamBuildWarning[] = []
  const requestedModules = new Set<number>()
  let requestedTotal = 0

  for (const [moduleKey, rawCount] of Object.entries(moduleCounts)) {
    const module = Number(moduleKey)
    const requested = positiveCount(rawCount)
    if (!Number.isInteger(module) || module < 1 || module > 20 || requested === 0) continue
    requestedModules.add(module)
    requestedTotal += requested
    const available = orderedQuestions(byModule.get(module) ?? [], recent, rng)
    const take = Math.min(requested, available.length)
    for (let i = 0; i < take; i++) picked.push(available[i].id)
    for (let i = take; i < available.length; i++) cappedFallbacks.push(available[i])
    if (take < requested) {
      warnings.push({
        label: `M${String(module).padStart(2, '0')}`,
        requested,
        available: available.length,
        message: `Requested ${requested}, but only ${available.length} gradable questions are available. Fallback fills from other modules.`,
      })
    }
  }

  for (const [module, questions] of byModule) {
    if (!requestedModules.has(module)) openFallbacks.push(...questions)
  }

  if (requestedTotal < target) {
    warnings.push({
      label: 'Fallback',
      requested: target,
      available: requestedTotal,
      message: `Preset requested ${target} total questions, but module counts sum to ${requestedTotal}. Remaining slots are filled from available modules.`,
    })
  } else if (requestedTotal > target) {
    warnings.push({
      label: 'Module counts',
      requested: requestedTotal,
      available: target,
      message: `Module counts sum to ${requestedTotal}, so the generated exam is capped at ${target} questions.`,
    })
  }
  if (preset.count > gradable.length) {
    warnings.push({
      label: 'Question pool',
      requested: preset.count,
      available: gradable.length,
      message: `Requested ${preset.count}, but only ${gradable.length} gradable CEH questions exist.`,
    })
  }

  let extraNeeded = Math.max(0, target - picked.length)
  const openExtras = orderedQuestions(openFallbacks, recent, rng).slice(0, extraNeeded)
  for (const q of openExtras) picked.push(q.id)
  extraNeeded -= openExtras.length
  if (extraNeeded > 0) {
    for (const q of orderedQuestions(cappedFallbacks, recent, rng).slice(0, extraNeeded)) picked.push(q.id)
  }
  return { ids: shuffle(picked, rng).slice(0, target), warnings }
}

/** Build a weighted list of question ids for a mock exam, with fallback warnings. */
export function buildExamQuestionPlan(
  preset: ExamPreset,
  pool: Question[],
  domainWeights?: Partial<Record<DomainId, number>>,
  moduleCounts?: Record<string, number>,
  options: ExamBuildOptions = {},
): ExamBuildPlan {
  const rng = typeof options.seed === 'number' ? seededRng(options.seed) : Math.random
  const recent = new Set(options.recentQuestionIds ?? [])
  const gradable = pool.filter((q) => q.module >= 1 && q.module <= 20 && isGradable(q))
  if (moduleCounts && Object.values(moduleCounts).some((count) => positiveCount(count) > 0)) {
    return buildModuleCountPlan(preset, gradable, moduleCounts, options)
  }
  const byDomain = new Map<DomainId, Question[]>()
  for (const q of gradable) {
    const list = byDomain.get(q.domain) ?? []
    list.push(q)
    byDomain.set(q.domain, list)
  }

  const weights = OFFICIAL_DOMAINS.map(
    (id) => domainWeights?.[id] ?? DOMAINS[id].weightPct,
  )
  const totalW = weights.reduce((s, w) => s + w, 0) || 1
  const target = Math.min(preset.count, gradable.length)
  const warnings: ExamBuildWarning[] = []
  if (preset.count > gradable.length) {
    warnings.push({
      label: 'Question pool',
      requested: preset.count,
      available: gradable.length,
      message: `Requested ${preset.count}, but only ${gradable.length} gradable CEH questions exist.`,
    })
  }

  // largest-remainder apportionment
  const raw = weights.map((w) => (w / totalW) * target)
  const counts = raw.map((r) => Math.floor(r))
  let remainder = target - counts.reduce((s, c) => s + c, 0)
  const fracs = raw
    .map((r, i) => ({ i, f: r - Math.floor(r) }))
    .sort((a, b) => b.f - a.f)
  for (let k = 0; k < remainder && fracs.length; k++) counts[fracs[k % fracs.length].i]++

  const picked: string[] = []
  const leftovers: Question[] = []
  let shortfall = 0
  OFFICIAL_DOMAINS.forEach((id, i) => {
    const avail = orderedQuestions(byDomain.get(id) ?? [], recent, rng)
    const take = Math.min(counts[i], avail.length)
    for (let k = 0; k < take; k++) picked.push(avail[k].id)
    for (let k = take; k < avail.length; k++) leftovers.push(avail[k])
    const missing = counts[i] - take
    shortfall += missing
    if (missing > 0) {
      warnings.push({
        label: DOMAINS[id].short,
        requested: counts[i],
        available: avail.length,
        message: `Requested ${counts[i]} ${DOMAINS[id].short} questions, but only ${avail.length} are available. Fallback fills from other domains.`,
      })
    }
  })
  if (shortfall > 0) {
    const extra = orderedQuestions(leftovers, recent, rng).slice(0, shortfall)
    for (const q of extra) picked.push(q.id)
  }

  return { ids: shuffle(picked, rng).slice(0, target), warnings }
}

/** Build a domain-weighted list of question ids for a mock exam. */
export function buildExamQuestionIds(
  preset: ExamPreset,
  pool: Question[],
  domainWeights?: Partial<Record<DomainId, number>>,
  moduleCounts?: Record<string, number>,
  options: ExamBuildOptions = {},
): string[] {
  return buildExamQuestionPlan(preset, pool, domainWeights, moduleCounts, options).ids
}

export function createExamSeed(now: number = Date.now()): number {
  return (Math.floor(Math.random() * 0xffffffff) ^ now) >>> 0
}

export function buildExamChoiceOrder(
  questionIds: string[],
  questions: Question[],
  seed: number,
): Record<string, string[]> {
  const qById = new Map(questions.map((q) => [q.id, q]))
  const out: Record<string, string[]> = {}
  for (const qid of questionIds) {
    const choices = qById.get(qid)?.choices
    if (!choices || choices.length <= 1) continue
    out[qid] = shuffle(choices, seededRng(hashSeed(`${seed}:${qid}`)))
  }
  return out
}

export function gradeExam(
  session: ExamSession,
  questions: Question[],
  passMark: number,
): ExamResult {
  const qById = new Map(questions.map((q) => [q.id, q]))
  let correct = 0
  let answered = 0
  const perDomain = new Map<DomainId, { total: number; correct: number }>()
  const perModule = new Map<number, { total: number; correct: number }>()
  const answers: Record<string, string | string[] | null> = {}
  const flagged: Record<string, boolean> = {}
  let flaggedTotal = 0
  let flaggedCorrect = 0

  for (const qid of session.questionIds) {
    const q = qById.get(qid)
    if (!q) continue
    const entry = session.answers[qid]
    const chosen = entry?.chosen ?? null
    const isFlagged = entry?.flagged ?? false
    answers[qid] = chosen
    if (isFlagged) flagged[qid] = true
    const hasAnswer =
      chosen != null && !(Array.isArray(chosen) && chosen.length === 0)
    if (hasAnswer) answered++
    const ok = isCorrect(q, chosen)
    if (ok) correct++
    if (isFlagged) {
      flaggedTotal++
      if (ok) flaggedCorrect++
    }
    const d = perDomain.get(q.domain) ?? { total: 0, correct: 0 }
    d.total++
    if (ok) d.correct++
    perDomain.set(q.domain, d)
    const m = perModule.get(q.module) ?? { total: 0, correct: 0 }
    m.total++
    if (ok) m.correct++
    perModule.set(q.module, m)
  }

  const total = session.questionIds.length
  const scorePct = total > 0 ? (correct / total) * 100 : 0
  const perDomainScores: DomainScore[] = OFFICIAL_DOMAINS.filter((id) =>
    perDomain.has(id),
  ).map((id) => {
    const d = perDomain.get(id)!
    return {
      domainId: id,
      domainName: DOMAINS[id].short,
      total: d.total,
      correct: d.correct,
      pct: d.total > 0 ? (d.correct / d.total) * 100 : 0,
    }
  })
  const perModuleScores: ModuleScore[] = Array.from(perModule.entries())
    .sort(([a], [b]) => a - b)
    .map(([module, d]) => ({
      module,
      moduleName: moduleMeta(module)?.name ?? `Module ${module}`,
      total: d.total,
      correct: d.correct,
      pct: d.total > 0 ? (d.correct / d.total) * 100 : 0,
    }))

  const timeUsedSec = session.endedAt
    ? Math.round((session.endedAt - session.startedAt) / 1000)
    : session.durationSec

  return {
    sessionId: session.id,
    preset: session.preset,
    presetLabel: session.presetLabel,
    submittedAt: session.endedAt ?? Date.now(),
    total,
    answered,
    correct,
    scorePct,
    passMark,
    passed: scorePct >= passMark,
    perDomain: perDomainScores,
    perModule: perModuleScores,
    seed: session.seed,
    choiceOrder: session.choiceOrder,
    flagged,
    flaggedTotal,
    flaggedCorrect,
    timeUsedSec,
    durationSec: session.durationSec,
    questionIds: session.questionIds,
    answers,
  }
}
