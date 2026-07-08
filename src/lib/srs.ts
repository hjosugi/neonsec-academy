// ============================================================
// Spaced repetition — SM-2 variant with a 4-button grade UI.
// See docs/REVIEW_SYSTEM.md
// ============================================================
import type { Grade, ReviewItem } from '../types'
import { DAY, startOfDay } from './format'

const MIN_EASE = 1.3
const MAX_INTERVAL = 365

export function gradeToQuality(g: Grade): number {
  switch (g) {
    case 'again':
      return 2
    case 'hard':
      return 3
    case 'good':
      return 4
    case 'easy':
      return 5
  }
}

export function newReviewItem(questionId: string, now: number): ReviewItem {
  return {
    questionId,
    ease: 2.5,
    intervalDays: 0,
    reps: 0,
    lapses: 0,
    dueAt: startOfDay(now),
    lastResult: null,
    lastReviewed: null,
    suspended: false,
  }
}

/** Apply a grade and return the next scheduling state. */
export function scheduleNext(item: ReviewItem, grade: Grade, now: number): ReviewItem {
  const q = gradeToQuality(grade)
  let ease = item.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  ease = Math.max(MIN_EASE, ease)

  let reps = item.reps
  let intervalDays: number
  let lapses = item.lapses

  if (q < 3) {
    // lapse — relearn tomorrow
    reps = 0
    intervalDays = 1
    lapses += 1
  } else {
    if (reps === 0) intervalDays = 1
    else if (reps === 1) intervalDays = 6
    else intervalDays = Math.round(item.intervalDays * ease)
    if (grade === 'hard') intervalDays = Math.max(1, Math.round(intervalDays * 0.8))
    reps += 1
  }

  intervalDays = Math.min(intervalDays, MAX_INTERVAL)

  return {
    ...item,
    ease,
    reps,
    intervalDays,
    lapses,
    dueAt: startOfDay(now) + intervalDays * DAY,
    lastReviewed: now,
    lastResult: q < 3 ? 'incorrect' : 'correct',
    suspended: false,
  }
}

/** Auto-grade mapping used when a question is answered outside review mode. */
export function autoGrade(correct: boolean): Grade {
  return correct ? 'good' : 'again'
}

export function isDue(item: ReviewItem, now: number): boolean {
  if (item.suspended) return false
  return startOfDay(now) >= startOfDay(item.dueAt)
}

/** Human label for a grade button. */
export const GRADE_META: Record<Grade, { label: string; hint: string; cls: string }> = {
  again: { label: 'Again', hint: 'Missed it — relearn tomorrow', cls: 'btn--danger' },
  hard: { label: 'Hard', hint: 'Correct, but a struggle', cls: 'btn--magenta' },
  good: { label: 'Good', hint: 'Recalled with effort', cls: 'btn--primary' },
  easy: { label: 'Easy', hint: 'Instant recall', cls: 'btn--green' },
}
