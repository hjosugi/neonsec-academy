import { describe, expect, it } from 'vitest'
import type { RawQuestion } from '../types'
import { buildQuestionPack, parseQuestionPack, preparePackImport, previewQuestionPack } from './questionPacks'

const baseQuestion: RawQuestion = {
  id: 'Q-USER-1',
  type: 'mcq',
  module: 1,
  track: null,
  difficulty: 'medium',
  tags: ['custom', 'scope'],
  body: 'Which statement best describes authorized testing scope?',
  choices: ['Only approved targets', 'Any internet host', 'Random public IPs'],
  answer: 'Only approved targets',
  explanation: {
    answer: 'Only approved targets',
    why: 'Authorization defines the permitted boundary.',
    trap: 'Public reachability is not authorization.',
    memory_phrase: 'Scope before scan.',
  },
  source: 'user',
  status: 'active',
}

describe('question packs', () => {
  it('round-trips a valid user question pack', () => {
    const pack = buildQuestionPack([baseQuestion], 'Custom deck')
    const parsed = parseQuestionPack(JSON.stringify(pack))

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.pack.title).toBe('Custom deck')
    expect(parsed.pack.questions).toEqual([baseQuestion])
  })

  it('rejects invalid packs with a clear schema error', () => {
    const bad = {
      ...buildQuestionPack([baseQuestion]),
      questions: [{ ...baseQuestion, answer: 'Not a choice' }],
    }
    const parsed = parseQuestionPack(JSON.stringify(bad))

    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.error).toContain('mcq answer must match a choice')
  })

  it('previews pack contents and remaps colliding ids on import', () => {
    const pack = buildQuestionPack([baseQuestion, { ...baseQuestion, id: 'Q-USER-2', module: 0, track: 'soc' }])
    const existing = new Set(['Q-USER-1'])
    const preview = previewQuestionPack(pack, existing)
    const prepared = preparePackImport(pack, existing)

    expect(preview.total).toBe(2)
    expect(preview.byModule.M1).toBe(1)
    expect(preview.byModule['CEH+']).toBe(1)
    expect(preview.collisions).toEqual(['Q-USER-1'])
    expect(prepared.remapped).toEqual({ 'Q-USER-1': 'Q-USER-1-import-1' })
    expect(prepared.questions.map((q) => q.id)).toEqual(['Q-USER-1-import-1', 'Q-USER-2'])
  })
})
