import { describe, expect, it } from 'vitest'
import { SEED_QUESTIONS } from '../data/questions'
import { LANDING_COPY, LANDING_SCREENS, LANDING_VALUES } from '../data/landing'
import { auditFields } from './labSafetyAudit'
import { scanSensitiveText } from './contentSafety'
import { DEMO_EXAM_SESSION_ID, DEMO_REPORT_ID, buildDemoDataset } from './demoData'

const NOW = Date.UTC(2026, 8, 25, 3, 0, 0)

describe('demo dataset', () => {
  it('is deterministic and references only shipped questions and labs', () => {
    const first = buildDemoDataset(SEED_QUESTIONS, NOW)
    expect(JSON.stringify(buildDemoDataset(SEED_QUESTIONS, NOW))).toBe(JSON.stringify(first))
    const ids = new Set(SEED_QUESTIONS.map((question) => question.id))
    const payload = first.payload as Record<string, any>
    expect(payload.attempts.length).toBeGreaterThan(100)
    expect(payload.attempts.every((attempt: { questionId: string }) => ids.has(attempt.questionId))).toBe(true)
    expect(Object.keys(payload.reviews).every((id) => ids.has(id))).toBe(true)
    expect(Object.values(payload.reviews).some((review: any) => review.dueAt <= NOW)).toBe(true)
    expect(payload.examResults.map((result: { sessionId: string }) => result.sessionId)).toContain(DEMO_EXAM_SESSION_ID)
    expect(payload.reports[0].id).toBe(DEMO_REPORT_ID)
    expect(payload.reports[0].findings[0].evidenceIds).toEqual([payload.evidenceItems[0].id])
    expect(payload.profile.onboarded).toBe(true)
  })

  it('contains only synthetic, public-safe content', () => {
    const text = JSON.stringify(buildDemoDataset(SEED_QUESTIONS, NOW).payload)
    expect(scanSensitiveText(text, { domains: 'real-tlds' })).toEqual([])
  })
})

describe('landing copy', () => {
  it('states the three core values and five demo screens', () => {
    expect(LANDING_VALUES.map((value) => value.id)).toEqual(['problems', 'review', 'evidence'])
    expect(LANDING_SCREENS.map((screen) => screen.id)).toEqual(['dashboard', 'review', 'exam-report', 'lab-report', 'city-map'])
    expect(LANDING_COPY.headline.length).toBeLessThan(120)
  })

  it('does not read like attack tooling', () => {
    const copy = [
      ...Object.values(LANDING_COPY),
      ...LANDING_VALUES.flatMap((value) => [value.title, value.body, value.proof]),
      ...LANDING_SCREENS.flatMap((screen) => [screen.title, screen.body]),
    ].join('\n')
    expect(auditFields([{ field: 'landing', text: copy, mode: 'prose', instruction: true }])).toEqual([])
    expect(copy).not.toMatch(/\b(?:hack into|exploit|pwn|crack|payload|attack tool|break into)\b/i)
    expect(copy).toMatch(/synthetic/i)
  })
})
