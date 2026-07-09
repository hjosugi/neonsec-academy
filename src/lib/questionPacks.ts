import type { Difficulty, QType, RawQuestion, TrackKey } from '../types'

export const QUESTION_PACK_FORMAT = 'neonsec-question-pack'
export const QUESTION_PACK_VERSION = 1

const TYPES = new Set<QType>(['mcq', 'multi', 'true_false', 'scenario'])
const DIFFICULTIES = new Set<Difficulty>(['easy', 'medium', 'hard'])
const TRACKS = new Set<TrackKey>(['pentest', 'appsec', 'cloud', 'soc', 'ir', 'threat-model'])

export interface QuestionPack {
  format: typeof QUESTION_PACK_FORMAT
  version: typeof QUESTION_PACK_VERSION
  title: string
  exportedAt: number
  questions: RawQuestion[]
}

export interface QuestionPackPreview {
  total: number
  byModule: Record<string, number>
  byDifficulty: Record<Difficulty, number>
  byType: Record<QType, number>
  collisions: string[]
}

export type ParsedQuestionPack = {
  ok: true
  pack: QuestionPack
} | {
  ok: false
  error: string
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function compactStrings(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const strings = value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
  return strings.length === value.length ? strings : null
}

export function validateRawQuestion(input: unknown, at = 'question'): { ok: true; question: RawQuestion } | { ok: false; errors: string[] } {
  const errors: string[] = []
  if (!isObject(input)) return { ok: false, errors: [`${at}: must be an object`] }

  const id = input.id
  const type = input.type
  const module = input.module
  const difficulty = input.difficulty
  const tags = compactStrings(input.tags)
  const body = input.body
  const explanation = input.explanation

  if (!hasText(id)) errors.push(`${at}: missing id`)
  if (!TYPES.has(type as QType)) errors.push(`${at}: bad type`)
  if (!Number.isInteger(module) || (module as number) < 0 || (module as number) > 20) errors.push(`${at}: module must be 0-20`)
  if (!DIFFICULTIES.has(difficulty as Difficulty)) errors.push(`${at}: bad difficulty`)
  if (!tags || tags.length === 0) errors.push(`${at}: tags[] required`)
  if (!hasText(body)) errors.push(`${at}: body required`)
  if (!isObject(explanation)) {
    errors.push(`${at}: explanation required`)
  } else {
    for (const key of ['answer', 'why', 'trap', 'memory_phrase']) {
      if (!hasText(explanation[key])) errors.push(`${at}: explanation.${key} required`)
    }
  }

  if (module === 0 && !TRACKS.has(input.track as TrackKey)) errors.push(`${at}: CEH+ item needs a valid track`)

  const choices = compactStrings(input.choices)
  const answer = input.answer
  if (type === 'mcq') {
    if (!choices || choices.length < 2) errors.push(`${at}: mcq needs >=2 choices`)
    if (!hasText(answer) || !choices?.includes(answer)) errors.push(`${at}: mcq answer must match a choice`)
  } else if (type === 'multi') {
    const answers = compactStrings(answer)
    if (!choices || choices.length < 3) errors.push(`${at}: multi needs >=3 choices`)
    if (!answers || answers.length < 2) errors.push(`${at}: multi answer must be an array of >=2`)
    for (const item of answers ?? []) {
      if (!choices?.includes(item)) errors.push(`${at}: multi answer "${item}" not in choices`)
    }
  } else if (type === 'true_false') {
    if (JSON.stringify(choices) !== '["True","False"]') errors.push(`${at}: true_false choices must be ["True","False"]`)
    if (answer !== 'True' && answer !== 'False') errors.push(`${at}: true_false answer must be True/False`)
  } else if (type === 'scenario') {
    if (!hasText(answer)) errors.push(`${at}: scenario needs a model answer string`)
  }

  if (input.status !== undefined && input.status !== 'active' && input.status !== 'archived') errors.push(`${at}: bad status`)

  if (errors.length) return { ok: false, errors }

  const raw: RawQuestion = {
    id: id as string,
    type: type as QType,
    module: module as number,
    track: module === 0 ? (input.track as TrackKey) : null,
    difficulty: difficulty as Difficulty,
    tags: tags!,
    body: String(body).trim(),
    choices: type === 'scenario' ? undefined : choices!,
    answer: Array.isArray(answer) ? answer.map(String) : String(answer),
    explanation: {
      answer: String((explanation as Record<string, unknown>).answer).trim(),
      why: String((explanation as Record<string, unknown>).why).trim(),
      trap: String((explanation as Record<string, unknown>).trap).trim(),
      memory_phrase: String((explanation as Record<string, unknown>).memory_phrase).trim(),
    },
    status: input.status === 'archived' ? 'archived' : 'active',
    source: 'user',
  }
  return { ok: true, question: raw }
}

export function buildQuestionPack(questions: RawQuestion[], title = 'NeonSec question pack'): QuestionPack {
  return {
    format: QUESTION_PACK_FORMAT,
    version: QUESTION_PACK_VERSION,
    title,
    exportedAt: Date.now(),
    questions: questions.map((q) => ({ ...q, source: 'user' })),
  }
}

export function parseQuestionPack(json: string): ParsedQuestionPack {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    return { ok: false, error: 'Pack is not valid JSON.' }
  }
  if (!isObject(data)) return { ok: false, error: 'Pack must be a JSON object.' }
  if (data.format !== QUESTION_PACK_FORMAT || data.version !== QUESTION_PACK_VERSION) {
    return { ok: false, error: 'Unsupported question pack format or version.' }
  }
  if (!Array.isArray(data.questions)) return { ok: false, error: 'Pack is missing questions[].' }

  const questions: RawQuestion[] = []
  const seen = new Set<string>()
  const errors: string[] = []
  data.questions.forEach((item, i) => {
    const validated = validateRawQuestion(item, `questions[${i}]`)
    if (!validated.ok) {
      errors.push(...validated.errors)
      return
    }
    if (seen.has(validated.question.id)) errors.push(`questions[${i}]: duplicate id "${validated.question.id}"`)
    seen.add(validated.question.id)
    questions.push(validated.question)
  })
  if (errors.length) return { ok: false, error: errors.slice(0, 5).join(' · ') }

  return {
    ok: true,
    pack: {
      format: QUESTION_PACK_FORMAT,
      version: QUESTION_PACK_VERSION,
      title: hasText(data.title) ? String(data.title).trim() : 'Imported question pack',
      exportedAt: typeof data.exportedAt === 'number' ? data.exportedAt : Date.now(),
      questions,
    },
  }
}

export function previewQuestionPack(pack: QuestionPack, existingIds: Set<string>): QuestionPackPreview {
  const preview: QuestionPackPreview = {
    total: pack.questions.length,
    byModule: {},
    byDifficulty: { easy: 0, medium: 0, hard: 0 },
    byType: { mcq: 0, multi: 0, true_false: 0, scenario: 0 },
    collisions: [],
  }
  for (const q of pack.questions) {
    const moduleKey = q.module === 0 ? 'CEH+' : `M${q.module}`
    preview.byModule[moduleKey] = (preview.byModule[moduleKey] ?? 0) + 1
    preview.byDifficulty[q.difficulty] += 1
    preview.byType[q.type] += 1
    if (existingIds.has(q.id)) preview.collisions.push(q.id)
  }
  return preview
}

export function preparePackImport(pack: QuestionPack, existingIds: Set<string>): { questions: RawQuestion[]; remapped: Record<string, string> } {
  const used = new Set(existingIds)
  const remapped: Record<string, string> = {}
  const questions = pack.questions.map((q) => {
    let id = q.id
    if (used.has(id)) {
      let n = 1
      do {
        id = `${q.id}-import-${n}`
        n++
      } while (used.has(id))
      remapped[q.id] = id
    }
    used.add(id)
    return { ...q, id, source: 'user' as const, status: 'active' as const }
  })
  return { questions, remapped }
}
