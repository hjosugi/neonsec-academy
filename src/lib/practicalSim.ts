import type {
  PracticalAnswer,
  PracticalKind,
  PracticalResult,
  PracticalSession,
  Question,
} from '../types'
import { isCorrect, isFreeform } from './grade'
import { moduleMeta } from '../data/taxonomy'
import { uid } from './id'

// ============================================================
// CEH Practical-style 20 challenge simulator (P4-009).
// Challenges are seed questions tagged `practical` with a kind tag
// (`practical:<kind>`) and skill tags (`skill:<name>`). Everything is
// answered from synthetic artifacts inside the question body.
// ============================================================

export const PRACTICAL_KINDS: PracticalKind[] = ['dataset-analysis', 'config-review', 'concept-lab', 'report-prompt']

export const PRACTICAL_KIND_LABELS: Record<PracticalKind, string> = {
  'dataset-analysis': 'Dataset analysis',
  'config-review': 'Config review',
  'concept-lab': 'Concept lab',
  'report-prompt': 'Report prompt',
}

/** Default mix for one 20-challenge session. */
export const PRACTICAL_COMPOSITION: Record<PracticalKind, number> = {
  'dataset-analysis': 8,
  'config-review': 5,
  'concept-lab': 4,
  'report-prompt': 3,
}

export const PRACTICAL_SESSION_SIZE = 20
export const PRACTICAL_PASS_PCT = 70

export interface PracticalPreset {
  id: 'full' | 'sprint'
  label: string
  durationMin: number
  description: string
}

export const PRACTICAL_PRESETS: PracticalPreset[] = [
  { id: 'full', label: 'Full practical', durationMin: 360, description: '20 challenges in 6 hours, like the CEH Practical format.' },
  { id: 'sprint', label: 'Sprint', durationMin: 120, description: '20 challenges in 2 hours for timed pressure practice.' },
]

export function practicalKind(question: Pick<Question, 'tags'>): PracticalKind | null {
  for (const tag of question.tags) {
    if (tag.startsWith('practical:')) {
      const kind = tag.slice('practical:'.length) as PracticalKind
      if (PRACTICAL_KINDS.includes(kind)) return kind
    }
  }
  return null
}

export function practicalSkills(question: Pick<Question, 'tags'>): string[] {
  const skills = question.tags.filter((tag) => tag.startsWith('skill:')).map((tag) => tag.slice('skill:'.length))
  return skills.length > 0 ? skills : ['general']
}

export function practicalPool(questions: Question[]): Question[] {
  return questions.filter((question) => question.tags.includes('practical') && practicalKind(question) !== null)
}

export function practicalPoolStats(questions: Question[]): Record<PracticalKind, number> {
  const stats = Object.fromEntries(PRACTICAL_KINDS.map((kind) => [kind, 0])) as Record<PracticalKind, number>
  for (const question of practicalPool(questions)) stats[practicalKind(question)!]++
  return stats
}

/** Mulberry32: small deterministic PRNG so a seed reproduces the same session. */
function rng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Picks 20 challenges following the kind composition, spreading CEH modules first. Shortfalls in one
 * kind are filled from the remaining pool so a session is always 20 when the pool allows it.
 */
export function selectPracticalChallenges(questions: Question[], seed: number): Question[] {
  const random = rng(seed)
  const pool = shuffle(practicalPool(questions), random)
  const picked: Question[] = []
  const usedModules = new Set<number>()
  const take = (candidates: Question[], count: number) => {
    const fresh = candidates.filter((question) => !usedModules.has(question.module))
    const ordered = [...fresh, ...candidates.filter((question) => usedModules.has(question.module))]
    for (const question of ordered.slice(0, count)) {
      picked.push(question)
      usedModules.add(question.module)
    }
  }
  for (const kind of PRACTICAL_KINDS) {
    take(pool.filter((question) => practicalKind(question) === kind), PRACTICAL_COMPOSITION[kind])
  }
  if (picked.length < PRACTICAL_SESSION_SIZE) {
    const chosen = new Set(picked.map((question) => question.id))
    take(pool.filter((question) => !chosen.has(question.id)), PRACTICAL_SESSION_SIZE - picked.length)
  }
  return picked.slice(0, PRACTICAL_SESSION_SIZE)
}

export function createPracticalSession(
  questions: Question[],
  options: { seed?: number; durationMin: number; presetLabel: string; now?: number },
): PracticalSession | null {
  const seed = options.seed ?? Math.floor(Math.random() * 2 ** 31)
  const picked = selectPracticalChallenges(questions, seed)
  if (picked.length < PRACTICAL_SESSION_SIZE) return null
  const now = options.now ?? Date.now()
  return {
    id: uid('ps-'),
    seed,
    presetLabel: options.presetLabel,
    questionIds: picked.map((question) => question.id),
    answers: {},
    durationSec: Math.round(options.durationMin * 60),
    startedAt: now,
    currentIndex: 0,
  }
}

export function isPracticalAnswered(question: Question, answer: PracticalAnswer | undefined): boolean {
  if (!answer || answer.chosen == null || answer.chosen === '') return false
  return isFreeform(question) ? answer.selfCorrect !== undefined && answer.selfCorrect !== null : true
}

function answerCorrect(question: Question, answer: PracticalAnswer | undefined): boolean {
  if (!answer || answer.chosen == null) return false
  return isFreeform(question) ? answer.selfCorrect === true : isCorrect(question, answer.chosen)
}

interface Bucket {
  total: number
  correct: number
}

function pct(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0
}

export function gradePracticalSession(session: PracticalSession, questions: Question[], now = Date.now()): PracticalResult {
  const byId = new Map(questions.map((question) => [question.id, question]))
  const modules = new Map<number, Bucket>()
  const skills = new Map<string, Bucket>()
  const kinds = new Map<PracticalKind, Bucket>()
  const wrongIds: string[] = []
  const weakIds: string[] = []
  let correct = 0
  let answered = 0

  const add = <K>(map: Map<K, Bucket>, key: K, ok: boolean) => {
    const bucket = map.get(key) ?? { total: 0, correct: 0 }
    bucket.total++
    if (ok) bucket.correct++
    map.set(key, bucket)
  }

  for (const id of session.questionIds) {
    const question = byId.get(id)
    if (!question) continue
    const answer = session.answers[id]
    const ok = answerCorrect(question, answer)
    if (isPracticalAnswered(question, answer)) answered++
    if (ok) correct++
    else wrongIds.push(id)
    if (ok && answer?.unsure) weakIds.push(id)
    add(modules, question.module, ok)
    for (const skill of practicalSkills(question)) add(skills, skill, ok)
    add(kinds, practicalKind(question) ?? 'concept-lab', ok)
  }

  const total = session.questionIds.length
  const scorePct = pct(correct, total)
  const perModule = [...modules.entries()]
    .map(([module, bucket]) => ({
      module,
      moduleName: moduleMeta(module)?.name ?? `Module ${module}`,
      ...bucket,
      pct: pct(bucket.correct, bucket.total),
    }))
    .sort((a, b) => a.pct - b.pct || a.module - b.module)
  const perSkill = [...skills.entries()]
    .map(([skill, bucket]) => ({ skill, ...bucket, pct: pct(bucket.correct, bucket.total) }))
    .sort((a, b) => a.pct - b.pct || a.skill.localeCompare(b.skill))
  const perKind = PRACTICAL_KINDS.filter((kind) => kinds.has(kind)).map((kind) => {
    const bucket = kinds.get(kind)!
    return { kind, ...bucket, pct: pct(bucket.correct, bucket.total) }
  })

  const weakSkills = perSkill.filter((row) => row.pct < PRACTICAL_PASS_PCT).map((row) => row.skill)
  const nextActions: string[] = []
  if (wrongIds.length > 0) nextActions.push(`Review the ${wrongIds.length} missed challenge${wrongIds.length === 1 ? '' : 's'} now queued in Review.`)
  if (weakIds.length > 0) nextActions.push(`Revisit ${weakIds.length} challenge${weakIds.length === 1 ? '' : 's'} you marked unsure; they are scheduled for early review.`)
  if (weakSkills.length > 0) nextActions.push(`Drill weak skills: ${weakSkills.slice(0, 4).join(', ')}.`)
  const weakModule = perModule.find((row) => row.pct < PRACTICAL_PASS_PCT)
  if (weakModule) nextActions.push(`Practice module ${weakModule.module} (${weakModule.moduleName}) with a focused drill.`)
  if (scorePct >= PRACTICAL_PASS_PCT && nextActions.length === 0) nextActions.push('Keep the streak: run another seeded session in a week.')

  return {
    id: uid('pr-'),
    sessionId: session.id,
    presetLabel: session.presetLabel,
    seed: session.seed,
    completedAt: now,
    total,
    answered,
    correct,
    scorePct,
    passPct: PRACTICAL_PASS_PCT,
    passed: scorePct >= PRACTICAL_PASS_PCT,
    timeUsedSec: Math.max(0, Math.min(session.durationSec, Math.round((now - session.startedAt) / 1000))),
    durationSec: session.durationSec,
    questionIds: [...session.questionIds],
    wrongIds,
    weakIds,
    perModule,
    perSkill,
    perKind,
    nextActions,
  }
}

export function practicalResultToMarkdown(result: PracticalResult): string {
  const lines = [
    '# Practical Readiness Report',
    '',
    `- Session: ${result.presetLabel} (seed ${result.seed})`,
    `- Score: ${result.correct}/${result.total} (${result.scorePct}%) — ${result.passed ? 'PASS' : 'NOT YET'} at ${result.passPct}%`,
    `- Answered: ${result.answered}/${result.total}`,
    `- Time used: ${Math.round(result.timeUsedSec / 60)} of ${Math.round(result.durationSec / 60)} minutes`,
    '',
    '## By challenge type',
    '',
    '| Type | Correct | % |',
    '|---|---|---|',
    ...result.perKind.map((row) => `| ${PRACTICAL_KIND_LABELS[row.kind]} | ${row.correct}/${row.total} | ${row.pct}% |`),
    '',
    '## By CEH module',
    '',
    '| Module | Correct | % |',
    '|---|---|---|',
    ...result.perModule.map((row) => `| M${row.module} ${row.moduleName} | ${row.correct}/${row.total} | ${row.pct}% |`),
    '',
    '## By skill',
    '',
    '| Skill | Correct | % |',
    '|---|---|---|',
    ...result.perSkill.map((row) => `| ${row.skill} | ${row.correct}/${row.total} | ${row.pct}% |`),
    '',
    '## Next actions',
    '',
    ...result.nextActions.map((action) => `- ${action}`),
    '',
    '---',
    '_Generated by NeonSec Academy — synthetic CEH Practical-style simulation; no live systems involved._',
  ]
  return lines.join('\n')
}
