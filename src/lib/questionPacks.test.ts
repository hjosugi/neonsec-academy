import { describe, expect, it } from 'vitest'
import type { RawQuestion } from '../types'
import {
  buildQuestionJsonl,
  buildQuestionPack,
  parseQuestionCsv,
  parseQuestionJsonl,
  parseQuestionPack,
  preparePackImport,
  previewQuestionPack,
} from './questionPacks'

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

  it('exports and imports standard JSONL question rows', () => {
    const jsonl = buildQuestionJsonl([baseQuestion])
    const parsed = parseQuestionJsonl(jsonl)

    expect(jsonl.trim().split('\n')).toHaveLength(1)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.pack.questions[0].id).toBe(baseQuestion.id)
    expect(parsed.pack.questions[0].source).toBe('user')
  })

  it('imports basic MCQ questions from CSV', () => {
    const csv = [
      'id,title,module,difficulty,tags,body,choice_a,choice_b,choice_c,answer,explanation_answer,explanation_why,explanation_trap,memory_phrase',
      'Q-CSV-1,CSV scope,1,easy,scope;ethics,Which target is allowed?,Approved host,Any public host,Friend laptop,A,Approved host,Scope controls authorization,Public reachability is not permission,Scope first',
    ].join('\n')
    const parsed = parseQuestionCsv(csv)

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.pack.questions[0]).toMatchObject({
      id: 'Q-CSV-1',
      type: 'mcq',
      answer: 'Approved host',
      tags: ['scope', 'ethics'],
    })
  })

  it('reports invalid JSONL and CSV rows with line numbers', () => {
    const badJsonl = parseQuestionJsonl(`${JSON.stringify(baseQuestion)}\n{"id":`)
    const badCsv = parseQuestionCsv([
      'id,module,difficulty,tags,body,choice_a,choice_b,answer,explanation_answer,explanation_why,explanation_trap,memory_phrase',
      'Q-CSV-2,1,easy,scope,Body,One,Two,Missing choice,One,Why,Trap,Memory',
    ].join('\n'))

    expect(badJsonl.ok).toBe(false)
    if (!badJsonl.ok) expect(badJsonl.error).toContain('line 2')
    expect(badCsv.ok).toBe(false)
    if (!badCsv.ok) expect(badCsv.error).toContain('line 2')
  })
})
