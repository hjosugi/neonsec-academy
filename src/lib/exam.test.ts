import { describe, it, expect } from 'vitest'
import type { DomainId, ExamSession, Question } from '../types'
import { buildExamQuestionIds, gradeExam } from './exam'
import { DOMAINS, EXAM } from '../data/taxonomy'
import { mkQ } from './testfixtures'

// pool spanning several modules/domains, plus a CEH+ (module 0) item that must be excluded
function bigPool(): Question[] {
  const pool: Question[] = []
  const mods = [1, 2, 3, 6, 8, 13, 15, 16, 19, 20]
  for (const m of mods) for (let i = 0; i < 12; i++) pool.push(mkQ(`Q-${m}-${i}`, m))
  pool.push({ ...mkQ('Q-CEHX-1', 1), id: 'Q-CEHX-1', module: 0, domain: 'beyond' })
  pool.push({ ...mkQ('Q-SCEN', 1), id: 'Q-SCEN', type: 'scenario', choices: undefined, answer: 'x' })
  return pool
}

const domainModule: Record<Exclude<DomainId, 'beyond'>, number> = {
  overview: 1,
  recon: 2,
  system: 6,
  network: 8,
  web: 13,
  wireless: 16,
  'mobile-iot': 17,
  cloud: 19,
  crypto: 20,
}

function countByDomain(ids: string[], pool: Question[]): Partial<Record<DomainId, number>> {
  const byId = new Map(pool.map((q) => [q.id, q]))
  return ids.reduce<Partial<Record<DomainId, number>>>((counts, id) => {
    const domain = byId.get(id)!.domain
    counts[domain] = (counts[domain] ?? 0) + 1
    return counts
  }, {})
}

describe('exam / buildExamQuestionIds', () => {
  it('caps at the requested count and returns unique gradable ids', () => {
    const pool = bigPool()
    const preset = EXAM.presets.find((p) => p.id === 'quick')!
    const ids = buildExamQuestionIds(preset, pool)
    expect(ids.length).toBe(preset.count)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('never includes CEH+ (module 0) or scenario questions', () => {
    const pool = bigPool()
    const byId = new Map(pool.map((q) => [q.id, q]))
    const ids = buildExamQuestionIds(EXAM.presets[0], pool)
    for (const id of ids) {
      const q = byId.get(id)!
      expect(q.module).toBeGreaterThanOrEqual(1)
      expect(q.module).toBeLessThanOrEqual(20)
      expect(q.type).not.toBe('scenario')
    }
  })

  it('cannot request more than the gradable pool holds', () => {
    const small = [mkQ('a', 1), mkQ('b', 2), mkQ('c', 3)]
    const ids = buildExamQuestionIds(EXAM.presets[0], small)
    expect(ids.length).toBe(3)
  })

  it('matches the official CEH domain blueprint when enough questions exist', () => {
    const pool: Question[] = []
    for (const [domain, module] of Object.entries(domainModule)) {
      for (let i = 0; i < 30; i++) pool.push(mkQ(`${domain}-${i}`, module))
    }

    const ids = buildExamQuestionIds(
      { id: 'quick', label: 'Blueprint', count: 100, minutes: 1, desc: '' },
      pool,
    )
    const counts = countByDomain(ids, pool)

    expect(ids).toHaveLength(100)
    for (const domain of Object.keys(domainModule) as Exclude<DomainId, 'beyond'>[]) {
      expect(counts[domain]).toBe(DOMAINS[domain].weightPct)
    }
  })

  it('redistributes domain shortfall to available leftover questions', () => {
    const pool = [
      mkQ('overview-0', 1),
      ...Array.from({ length: 20 }, (_, i) => mkQ(`recon-${i}`, 2)),
    ]
    const ids = buildExamQuestionIds(
      { id: 'quick', label: 'Shortfall', count: 10, minutes: 1, desc: '' },
      pool,
      { overview: 50, recon: 50 },
    )
    const counts = countByDomain(ids, pool)

    expect(ids).toHaveLength(10)
    expect(new Set(ids).size).toBe(10)
    expect(counts.overview).toBe(1)
    expect(counts.recon).toBe(9)
  })
})

describe('exam / gradeExam', () => {
  it('scores correct answers and computes pass/fail against the mark', () => {
    const q1 = mkQ('q1', 1, { answer: 'A' })
    const q2 = mkQ('q2', 2, { answer: 'B' })
    const q3 = mkQ('q3', 3, { answer: 'C' })
    const q4 = mkQ('q4', 6, { answer: 'D' })
    const questions = [q1, q2, q3, q4]

    const session: ExamSession = {
      id: 's', createdAt: 0, preset: 'quick', presetLabel: 'Quick',
      questionIds: ['q1', 'q2', 'q3', 'q4'],
      answers: {
        q1: { chosen: 'A', flagged: false }, // correct
        q2: { chosen: 'A', flagged: false }, // wrong
        q3: { chosen: 'C', flagged: false }, // correct
        q4: { chosen: null, flagged: false }, // unanswered → wrong
      },
      durationSec: 100, startedAt: 0, endedAt: 50000, currentIndex: 0, status: 'submitted',
    }

    const result = gradeExam(session, questions, 50)
    expect(result.total).toBe(4)
    expect(result.correct).toBe(2)
    expect(result.answered).toBe(3)
    expect(result.scorePct).toBe(50)
    expect(result.passed).toBe(true) // 50 >= 50
    expect(gradeExam(session, questions, 75).passed).toBe(false)
    expect(result.timeUsedSec).toBe(50)
    expect(result.perDomain.map((d) => [d.domainId, d.total, d.correct])).toEqual([
      ['overview', 1, 1],
      ['recon', 2, 1],
      ['system', 1, 0],
    ])
  })
})
