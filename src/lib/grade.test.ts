import { describe, it, expect } from 'vitest'
import type { RawQuestion } from '../types'
import { correctChoices, isCorrect, isFreeform, isGradable } from './grade'

const mcq: RawQuestion = {
  id: 'q', type: 'mcq', module: 1, difficulty: 'easy', tags: ['t'],
  body: 'b', choices: ['A', 'B', 'C', 'D'], answer: 'B',
  explanation: { answer: '', why: '', trap: '', memory_phrase: '' },
}
const multi: RawQuestion = { ...mcq, type: 'multi', answer: ['A', 'C'] }
const tf: RawQuestion = { ...mcq, type: 'true_false', choices: ['True', 'False'], answer: 'True' }
const scenario: RawQuestion = { ...mcq, type: 'scenario', choices: undefined, answer: 'model answer' }
const shortAnswer: RawQuestion = { ...mcq, type: 'short_answer', choices: undefined, answer: 'short model answer' }
const reportPrompt: RawQuestion = { ...mcq, type: 'report_prompt', choices: undefined, answer: 'report model answer' }

describe('grade', () => {
  it('grades mcq by exact choice match', () => {
    expect(isCorrect(mcq, 'B')).toBe(true)
    expect(isCorrect(mcq, 'A')).toBe(false)
    expect(isCorrect(mcq, null)).toBe(false)
  })

  it('grades multi-select requiring the exact set', () => {
    expect(isCorrect(multi, ['A', 'C'])).toBe(true)
    expect(isCorrect(multi, ['C', 'A'])).toBe(true) // order-independent
    expect(isCorrect(multi, ['A'])).toBe(false) // incomplete
    expect(isCorrect(multi, ['A', 'C', 'B'])).toBe(false) // extra
  })

  it('grades true/false', () => {
    expect(isCorrect(tf, 'True')).toBe(true)
    expect(isCorrect(tf, 'False')).toBe(false)
  })

  it('normalises correct choices to an array', () => {
    expect(correctChoices(mcq)).toEqual(['B'])
    expect(correctChoices(multi)).toEqual(['A', 'C'])
  })

  it('marks free-form questions as non-auto-gradable', () => {
    expect(isGradable(scenario)).toBe(false)
    expect(isGradable(shortAnswer)).toBe(false)
    expect(isGradable(reportPrompt)).toBe(false)
    expect(isGradable(mcq)).toBe(true)
    expect(isGradable(multi)).toBe(true)
    expect(isGradable(tf)).toBe(true)
    expect(isFreeform(scenario)).toBe(true)
    expect(isFreeform(shortAnswer)).toBe(true)
    expect(isFreeform(reportPrompt)).toBe(true)
  })
})
