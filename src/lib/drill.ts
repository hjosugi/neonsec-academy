import type {
  Attempt,
  Difficulty,
  DrillDifficulty,
  DrillQuestionType,
  DrillSource,
  QType,
  Question,
  TrackKey,
} from '../types'

export const DRILL_LENGTHS = [10, 20, 30] as const

export interface DrillBuildOptions {
  source: DrillSource
  module: number
  track: TrackKey
  tag: string
  type: DrillQuestionType
  difficulty: DrillDifficulty
  count: number
  bookmarks?: string[]
  weakModules?: number[]
  recentQuestionIds?: string[]
  seed?: number
}

export interface DrillBuildResult {
  questionIds: string[]
  available: number
  freshAvailable: number
  fallbackUsed: boolean
}

export function recentQuestionIds(attempts: Attempt[], limit = 30): string[] {
  return [...attempts]
    .sort((a, b) => b.at - a.at)
    .map((a) => a.questionId)
    .filter((id, index, arr) => arr.indexOf(id) === index)
    .slice(0, limit)
}

function rng(seed: number) {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 0x100000000
  }
}

function shuffle<T>(items: T[], seed: number): T[] {
  const arr = items.slice()
  const random = rng(seed)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function matchesDifficulty(q: Question, difficulty: DrillDifficulty): boolean {
  return difficulty === 'any' || q.difficulty === (difficulty as Difficulty)
}

function matchesType(q: Question, type: DrillQuestionType): boolean {
  return type === 'any' || q.type === (type as QType)
}

export function buildDrillQueue(questions: Question[], options: DrillBuildOptions): DrillBuildResult {
  const bookmarks = new Set(options.bookmarks ?? [])
  const weakModules = new Set(options.weakModules ?? [])
  const tag = options.tag.trim()
  let pool = questions

  if (options.source === 'module') pool = pool.filter((q) => q.module === options.module)
  else if (options.source === 'track') pool = pool.filter((q) => q.module === 0 && q.track === options.track)
  else if (options.source === 'bookmarked') pool = pool.filter((q) => bookmarks.has(q.id))
  else if (options.source === 'weak') pool = pool.filter((q) => weakModules.has(q.module))

  if (tag && tag !== 'any') pool = pool.filter((q) => q.tags.includes(tag))
  pool = pool.filter((q) => matchesType(q, options.type) && matchesDifficulty(q, options.difficulty))

  const recent = new Set(options.recentQuestionIds ?? [])
  const fresh = pool.filter((q) => !recent.has(q.id))
  const stale = pool.filter((q) => recent.has(q.id))
  const seed = options.seed ?? Date.now()
  const ordered = [...shuffle(fresh, seed), ...shuffle(stale, seed + 1)]
  const questionIds = ordered.slice(0, Math.max(0, options.count)).map((q) => q.id)

  return {
    questionIds,
    available: pool.length,
    freshAvailable: fresh.length,
    fallbackUsed: questionIds.some((id) => recent.has(id)),
  }
}
