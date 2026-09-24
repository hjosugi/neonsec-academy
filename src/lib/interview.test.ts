import { describe, expect, it } from 'vitest'
import { LABS } from '../data/labs'
import { TRACK_CHALLENGES } from '../data/tracks'
import { SEED_QUESTIONS } from '../data/questions'
import { domainStats, moduleStats } from './analytics'
import type { Attempt, FlagAttempt, Report } from '../types'
import {
  blankStory,
  honestGapStatement,
  memoLengthStatus,
  normalizeStories,
  skillEvidence,
  speakingSeconds,
  storyComplete,
} from './interview'

function input(attempts: Attempt[], flagAttempts: FlagAttempt[], reports: Report[]) {
  const modules = moduleStats(SEED_QUESTIONS, attempts, {}, Date.now())
  return {
    domains: domainStats(modules),
    modules,
    labs: LABS,
    flagAttempts,
    reports,
    trackChallenges: TRACK_CHALLENGES,
    trackSubmissions: [],
    trackAccuracy: {},
  }
}

describe('interview skill evidence', () => {
  it('lists every CEH domain and CEH+ track and starts as honest gaps', () => {
    const skills = skillEvidence(input([], [], []))
    expect(skills.filter((skill) => skill.kind === 'ceh-domain')).toHaveLength(9)
    expect(skills.filter((skill) => skill.kind === 'ceh-plus')).toHaveLength(6)
    expect(skills.every((skill) => skill.status === 'gap')).toBe(true)
    const web = skills.find((skill) => skill.id === 'web')!
    expect(honestGapStatement(web)).toContain('growth area')
    expect(web.nextPlan.length).toBeGreaterThan(0)
  })

  it('links concept accuracy, solved labs, and lab reports to a skill', () => {
    const webQuestions = SEED_QUESTIONS.filter((q) => q.domain === 'web' && q.type === 'mcq').slice(0, 10)
    const attempts: Attempt[] = webQuestions.map((q, index) => ({ id: `a${index}`, questionId: q.id, at: index + 1, correct: true, chosen: String(q.answer), mode: 'practice' }))
    const flags: FlagAttempt[] = [{ id: 'fa1', challengeId: 'web-idor', submitted: 'FLAG{BROKEN_ACCESS_CONTROL}', correct: true, hintCount: 0, at: 1 }]
    const reports = [{ id: 'r1', challengeId: 'web-idor', title: 'IDOR report', scope: 's', summary: '', findings: [], createdAt: 1, updatedAt: 1 }] as Report[]
    const web = skillEvidence(input(attempts, flags, reports)).find((skill) => skill.id === 'web')!
    expect(web.conceptAccuracyPct).toBe(100)
    expect(web.labs).toEqual(['Web AppSec: Broken Access Control'])
    expect(web.reports).toEqual(['IDOR report'])
    expect(web.status).toBe('strong')

    const story = blankStory(web, 5)
    expect(story).toMatchObject({ skillId: 'web', kind: 'strength', format: 'star', evidence: ['Web AppSec: Broken Access Control', 'IDOR report'] })
  })
})

describe('interview stories', () => {
  it('estimates speaking time for 1-2 minute memos', () => {
    const words = (count: number) => Array.from({ length: count }, () => 'word').join(' ')
    expect(speakingSeconds(words(130))).toBe(60)
    expect(memoLengthStatus(words(40))).toBe('short')
    expect(memoLengthStatus(words(200))).toBe('good')
    expect(memoLengthStatus(words(400))).toBe('long')
  })

  it('checks completeness and normalizes stored stories', () => {
    const star = { id: 's', skillId: 'web', kind: 'strength' as const, format: 'star' as const, title: 'T', situation: 'In a synthetic lab review', task: 'Assess the access control', action: 'Compared the owner id fields', result: 'Reported a high finding', memo: '', evidence: [], createdAt: 1, updatedAt: 1 }
    expect(storyComplete(star)).toBe(true)
    expect(storyComplete({ ...star, result: '' })).toBe(false)
    expect(storyComplete({ ...star, format: 'concise', memo: 'short' })).toBe(false)
    const normalized = normalizeStories([star, { ...star, id: 'x', kind: 'weird', format: 'odd' }, { id: 1 }])
    expect(normalized.map((story) => [story.id, story.kind, story.format])).toEqual([['s', 'strength', 'star'], ['x', 'strength', 'star']])
  })
})
