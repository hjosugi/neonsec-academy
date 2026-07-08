import type { RawQuestion } from '../types'

/** Correct choice strings for a question (normalised to an array). */
export function correctChoices(q: RawQuestion): string[] {
  return Array.isArray(q.answer) ? q.answer : [q.answer]
}

/** Whether a question is auto-gradable (excludes free-form scenario answers). */
export function isGradable(q: RawQuestion): boolean {
  return q.type === 'mcq' || q.type === 'multi' || q.type === 'true_false'
}

/** Grade a submitted answer against the key. Scenario questions are self-graded elsewhere. */
export function isCorrect(q: RawQuestion, chosen: string | string[] | null): boolean {
  if (chosen == null) return false
  const answer = correctChoices(q)

  if (q.type === 'multi') {
    const picked = Array.isArray(chosen) ? chosen : [chosen]
    if (picked.length !== answer.length) return false
    const key = new Set(answer)
    return picked.every((c) => key.has(c))
  }

  const single = Array.isArray(chosen) ? chosen[0] : chosen
  return single === answer[0]
}
