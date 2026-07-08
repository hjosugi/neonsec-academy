// ============================================================
// Mock exam engine — domain-weighted selection + grading.
// Uses the CEH blueprint weighting from taxonomy DOMAINS.
// ============================================================
import type {
  DomainId,
  DomainScore,
  ExamResult,
  ExamSession,
  Question,
} from '../types'
import type { ExamPreset } from '../data/taxonomy'
import { DOMAINS } from '../data/taxonomy'
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

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Build a domain-weighted list of question ids for a mock exam. */
export function buildExamQuestionIds(
  preset: ExamPreset,
  pool: Question[],
  domainWeights?: Partial<Record<DomainId, number>>,
): string[] {
  const gradable = pool.filter((q) => q.module >= 1 && q.module <= 20 && isGradable(q))
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
    const avail = shuffle(byDomain.get(id) ?? [])
    const take = Math.min(counts[i], avail.length)
    for (let k = 0; k < take; k++) picked.push(avail[k].id)
    for (let k = take; k < avail.length; k++) leftovers.push(avail[k])
    shortfall += counts[i] - take
  })
  if (shortfall > 0) {
    const extra = shuffle(leftovers).slice(0, shortfall)
    for (const q of extra) picked.push(q.id)
  }

  return shuffle(picked).slice(0, target)
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
  const answers: Record<string, string | string[] | null> = {}

  for (const qid of session.questionIds) {
    const q = qById.get(qid)
    if (!q) continue
    const chosen = session.answers[qid]?.chosen ?? null
    answers[qid] = chosen
    const hasAnswer =
      chosen != null && !(Array.isArray(chosen) && chosen.length === 0)
    if (hasAnswer) answered++
    const ok = isCorrect(q, chosen)
    if (ok) correct++
    const d = perDomain.get(q.domain) ?? { total: 0, correct: 0 }
    d.total++
    if (ok) d.correct++
    perDomain.set(q.domain, d)
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
    timeUsedSec,
    durationSec: session.durationSec,
    questionIds: session.questionIds,
    answers,
  }
}
