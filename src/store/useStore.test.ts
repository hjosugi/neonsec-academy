import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EvidenceItem, Report } from '../types'
import { LABS } from '../data/labs'
import { mergePersistedStoreState, useStore } from './useStore'
import { evidenceFromLabLines } from '../lib/labReport'

const evidence: EvidenceItem = {
  id: 'ev-persisted',
  challengeId: 'soc-bruteforce',
  title: 'Persisted synthetic observation',
  type: 'observation',
  note: 'A prepared event is visible in the supplied artifact.',
  source: 'synthetic artifact',
  reference: 'screenshots/observation-01.png',
  timestamp: 1_783_630_800_000,
  createdAt: 1_783_630_800_000,
  updatedAt: 1_783_630_800_000,
}

beforeAll(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})

beforeEach(() => {
  useStore.setState({ flagAttempts: [], flagHintUses: [], evidenceItems: [], reports: [] })
})

afterAll(() => {
  vi.restoreAllMocks()
})

describe('evidence store persistence', () => {
  it('includes evidence in private backup export and import', () => {
    useStore.getState().upsertEvidence(evidence)
    const saved = useStore.getState().evidenceItems[0]
    const backup = useStore.getState().exportData()
    useStore.setState({ evidenceItems: [] })

    expect(useStore.getState().importData(backup)).toBe(true)
    expect(useStore.getState().evidenceItems).toEqual([saved])
  })

  it('removes deleted evidence links from report findings', () => {
    const report: Report = {
      id: 'r-1',
      challengeId: evidence.challengeId,
      title: 'Synthetic report',
      scope: 'Prepared material only.',
      summary: 'Synthetic summary.',
      findings: [
        {
          id: 'f-1',
          title: 'Finding',
          severity: 'low',
          impact: 'Synthetic impact.',
          remediation: 'Synthetic remediation.',
          evidence: '',
          evidenceIds: [evidence.id],
        },
      ],
      createdAt: evidence.createdAt,
      updatedAt: evidence.updatedAt,
    }
    useStore.getState().upsertEvidence(evidence)
    useStore.getState().upsertReport(report)

    useStore.getState().deleteEvidence(evidence.id)

    expect(useStore.getState().evidenceItems).toEqual([])
    expect(useStore.getState().reports[0].findings[0].evidenceIds).toEqual([])
  })

  it('keeps an existing evidence item in its original challenge', () => {
    useStore.getState().upsertEvidence(evidence)
    const saved = useStore.getState().evidenceItems[0]

    useStore.getState().upsertEvidence({ ...saved, challengeId: 'cloud-iam', title: 'Edited title' })

    expect(useStore.getState().evidenceItems[0]).toMatchObject({
      challengeId: evidence.challengeId,
      title: 'Edited title',
    })
  })

  it('normalizes imported rows and prunes invalid report links', () => {
    const otherChallenge = { ...evidence, id: 'ev-other', challengeId: 'cloud-iam' }
    const report: Report = {
      id: 'r-imported',
      challengeId: evidence.challengeId,
      title: 'Imported synthetic report',
      scope: 'Prepared material only.',
      summary: 'Synthetic summary.',
      findings: [
        {
          id: 'f-imported',
          title: 'Finding',
          severity: 'low',
          impact: 'Synthetic impact.',
          remediation: 'Synthetic remediation.',
          evidence: '',
          evidenceIds: [evidence.id, evidence.id, otherChallenge.id, 'missing'],
        },
      ],
      createdAt: evidence.createdAt,
      updatedAt: evidence.updatedAt,
    }
    const backup = JSON.stringify({
      evidenceItems: [evidence, otherChallenge, { ...evidence, id: 'invalid', note: '' }],
      reports: [report],
    })

    expect(useStore.getState().importData(backup)).toBe(true)
    expect(useStore.getState().evidenceItems).toHaveLength(2)
    expect(useStore.getState().reports[0].findings[0].evidenceIds).toEqual([evidence.id])
  })

  it('normalizes Evidence Vault data during persisted-state hydration', () => {
    const report: Report = {
      id: 'r-hydrated',
      challengeId: evidence.challengeId,
      title: 'Hydrated synthetic report',
      scope: 'Prepared material only.',
      summary: 'Synthetic summary.',
      findings: [
        {
          id: 'f-hydrated',
          title: 'Finding',
          severity: 'info',
          impact: 'Synthetic impact.',
          remediation: 'Synthetic remediation.',
          evidence: '',
          evidenceIds: [evidence.id, 'missing'],
        },
      ],
      createdAt: evidence.createdAt,
      updatedAt: evidence.updatedAt,
    }
    const hydrated = mergePersistedStoreState(
      {
        evidenceItems: [evidence, { ...evidence, id: 'invalid', timestamp: Number.MAX_VALUE }],
        reports: [report],
      },
      useStore.getState(),
    )

    expect(hydrated.evidenceItems).toEqual([evidence])
    expect(hydrated.reports[0].findings[0].evidenceIds).toEqual([evidence.id])
  })
})

describe('flag challenge persistence', () => {
  const challenge = LABS.find((lab) => lab.id === 'soc-bruteforce')!

  it('records wrong and correct attempts, then locks a solved challenge', () => {
    expect(useStore.getState().submitLabFlag(challenge.id, '')).toBeNull()
    expect(useStore.getState().submitLabFlag('missing-lab', 'FLAG{UNKNOWN}')).toBeNull()
    const wrong = useStore.getState().submitLabFlag(challenge.id, 'FLAG{BRUTE_FORCE}')
    const correct = useStore.getState().submitLabFlag(challenge.id, ' flag{password_spray} ')
    const afterSolve = useStore.getState().submitLabFlag(challenge.id, challenge.flagChallenge.expectedFlag)

    expect(wrong).toMatchObject({ challengeId: challenge.id, correct: false, hintCount: 0 })
    expect(correct).toMatchObject({ challengeId: challenge.id, correct: true, hintCount: 0 })
    expect(afterSolve).toBeNull()
    expect(useStore.getState().revealLabFlagHint(challenge.id, 0)).toBe(false)
    expect(useStore.getState().flagAttempts).toHaveLength(2)
  })

  it('records each valid hint only once and snapshots hint count on attempts', () => {
    expect(useStore.getState().revealLabFlagHint(challenge.id, 0)).toBe(true)
    expect(useStore.getState().revealLabFlagHint(challenge.id, 0)).toBe(false)
    expect(useStore.getState().revealLabFlagHint(challenge.id, 99)).toBe(false)

    const attempt = useStore.getState().submitLabFlag(challenge.id, 'FLAG{NOT_YET}')

    expect(useStore.getState().flagHintUses).toHaveLength(1)
    expect(attempt?.hintCount).toBe(1)
  })

  it('round-trips flag history in private backups and recalculates correctness on import', () => {
    useStore.getState().revealLabFlagHint(challenge.id, 0)
    useStore.getState().submitLabFlag(challenge.id, challenge.flagChallenge.expectedFlag)
    const backup = JSON.parse(useStore.getState().exportData())
    backup.flagAttempts[0].correct = false
    useStore.setState({ flagAttempts: [], flagHintUses: [] })

    expect(useStore.getState().importData(JSON.stringify(backup))).toBe(true)
    expect(useStore.getState().flagAttempts[0].correct).toBe(true)
    expect(useStore.getState().flagHintUses).toHaveLength(1)
  })

  it('normalizes flag state during browser hydration', () => {
    const hydrated = mergePersistedStoreState(
      {
        flagAttempts: [
          {
            id: 'fa-imported',
            challengeId: challenge.id,
            submitted: challenge.flagChallenge.expectedFlag,
            correct: false,
            hintCount: 0,
            at: 100,
          },
          { id: 'invalid', challengeId: 'missing', submitted: 'FLAG{UNKNOWN}', at: 200 },
        ],
        flagHintUses: [
          { challengeId: challenge.id, hintIndex: 0, usedAt: 50 },
          { challengeId: challenge.id, hintIndex: 99, usedAt: 60 },
        ],
      },
      useStore.getState(),
    )

    expect(hydrated.flagAttempts).toHaveLength(1)
    expect(hydrated.flagAttempts[0].correct).toBe(true)
    expect(hydrated.flagHintUses).toEqual([{ challengeId: challenge.id, hintIndex: 0, usedAt: 50 }])
  })
})

describe('lab dataset evidence hand-off', () => {
  it('saves selected lines and cites them in a new or existing lab report', () => {
    const lab = LABS.find((item) => item.id === 'fw-rule-shadowing')!
    const first = evidenceFromLabLines(lab, [4, 5])!
    const reportId = useStore.getState().sendEvidenceToLabReport(first)

    expect(reportId).toBeTruthy()
    let state = useStore.getState()
    expect(state.evidenceItems.map((item) => item.id)).toContain(first.id)
    expect(state.reports).toHaveLength(1)
    expect(state.reports[0]).toMatchObject({ id: reportId, challengeId: lab.id })
    expect(state.reports[0].findings[0].evidenceIds).toEqual([first.id])

    const second = evidenceFromLabLines(lab, [8])!
    expect(useStore.getState().sendEvidenceToLabReport(second, state.reports[0].findings[1].id)).toBe(reportId)
    state = useStore.getState()
    expect(state.reports).toHaveLength(1)
    expect(state.reports[0].findings[1].evidenceIds).toEqual([second.id])

    const backup = state.exportData()
    useStore.setState({ evidenceItems: [], reports: [] })
    expect(useStore.getState().importData(backup)).toBe(true)
    expect(useStore.getState().reports[0].findings[0].evidenceIds).toEqual([first.id])
  })

  it('rejects evidence for unknown labs', () => {
    const lab = LABS[0]
    const item = { ...evidenceFromLabLines(lab, [1])!, challengeId: 'unknown-lab' }
    expect(useStore.getState().sendEvidenceToLabReport(item)).toBeNull()
    expect(useStore.getState().reports).toEqual([])
  })
})

describe('web concept worksheets', () => {
  beforeEach(() => {
    useStore.setState({ labWorksheets: [], reports: [] })
  })

  it('saves a worksheet, adds it to the lab report, and round-trips through backups', () => {
    const store = useStore.getState()
    store.saveLabWorksheet({ labId: 'web-security-headers', finding: 'short', impact: '', remediation: '' })
    expect(useStore.getState().addWorksheetToReport('web-security-headers', 'medium')).toBeNull()

    store.saveLabWorksheet({
      labId: 'web-security-headers',
      finding: 'Login page lacks frame-ancestors and X-Frame-Options.',
      impact: 'Any site can frame and disguise the login form.',
      remediation: 'Send CSP frame-ancestors none and X-Frame-Options DENY.',
    })
    expect(useStore.getState().labWorksheets).toHaveLength(1)

    const reportId = useStore.getState().addWorksheetToReport('web-security-headers', 'medium')
    expect(reportId).toBeTruthy()
    const report = useStore.getState().reports[0]
    expect(report).toMatchObject({ id: reportId, challengeId: 'web-security-headers' })
    expect(report.findings.map((finding) => finding.title)).toEqual(['Login page lacks frame-ancestors and X-Frame-Options.'])

    const backup = useStore.getState().exportData()
    useStore.setState({ labWorksheets: [] })
    expect(useStore.getState().importData(backup)).toBe(true)
    expect(useStore.getState().labWorksheets[0].labId).toBe('web-security-headers')
  })
})

describe('vulnerability triage store', () => {
  beforeEach(() => {
    useStore.setState({ triageFindings: [], reports: [] })
  })

  it('imports lab findings, changes status and severity, adds to a report, and survives backups', () => {
    const store = useStore.getState()
    expect(store.importLabFindingsToTriage('cloud-iam')).toBe(2)
    expect(useStore.getState().importLabFindingsToTriage('cloud-iam')).toBe(0)

    const [first] = useStore.getState().triageFindings
    expect(first).toMatchObject({ status: 'open', sourceLabId: 'cloud-iam' })
    expect(useStore.getState().upsertTriageFinding({ ...first, severityMode: 'manual', severity: 'low' })).toBe(true)
    expect(useStore.getState().setTriageStatus(first.id, 'fixed', 'verified')).toBe(false)
    expect(useStore.getState().setTriageStatus(first.id, 'confirmed', '')).toBe(true)

    const reportId = useStore.getState().addTriageToReport(first.id, null)
    expect(reportId).toBeTruthy()
    const report = useStore.getState().reports.find((item) => item.id === reportId)!
    expect(report.findings[0]).toMatchObject({ triageId: first.id, status: 'confirmed', severity: 'low' })
    expect(useStore.getState().addTriageToReport(first.id, reportId)).toBe(reportId)
    expect(useStore.getState().reports.find((item) => item.id === reportId)!.findings).toHaveLength(1)

    const backup = useStore.getState().exportData()
    useStore.setState({ triageFindings: [] })
    expect(useStore.getState().importData(backup)).toBe(true)
    expect(useStore.getState().triageFindings.find((item) => item.id === first.id)).toMatchObject({
      status: 'confirmed',
      severityMode: 'manual',
      severity: 'low',
    })
  })

  it('rejects invalid findings', () => {
    const invalid = { ...useStore.getState().triageFindings[0], id: 'tf-x', title: 'Missing asset', asset: '', evidence: '', impact: '', remediation: '', status: 'open' as const, history: [], impactRating: 'moderate' as const, likelihood: 'possible' as const, severity: 'medium' as const, severityMode: 'rubric' as const, createdAt: 1, updatedAt: 1 }
    expect(useStore.getState().upsertTriageFinding(invalid)).toBe(false)
    expect(useStore.getState().triageFindings).toEqual([])
  })
})

describe('practical simulator store', () => {
  it('records practical attempts and queues wrong or unsure challenges for review', async () => {
    const { createPracticalSession } = await import('../lib/practicalSim')
    const { SEED_QUESTIONS } = await import('../data/questions')
    useStore.setState({ attempts: [], reviews: {}, activePractical: null, practicalResults: [] })
    const session = createPracticalSession(SEED_QUESTIONS, { seed: 3, durationMin: 120, presetLabel: 'Sprint' })!
    useStore.getState().startPractical(session)
    const [wrongId, unsureId] = session.questionIds
    useStore.getState().practicalAnswer(wrongId, { chosen: 'definitely not the answer', selfCorrect: false })
    const unsureQuestion = SEED_QUESTIONS.find((q) => q.id === unsureId)!
    useStore.getState().practicalAnswer(unsureId, unsureQuestion.type === 'report_prompt'
      ? { chosen: 'draft', selfCorrect: true, unsure: true }
      : { chosen: String(unsureQuestion.answer), unsure: true })
    useStore.getState().practicalGoto(99)
    expect(useStore.getState().activePractical?.currentIndex).toBe(19)

    const result = useStore.getState().submitPractical()!
    const state = useStore.getState()
    expect(state.activePractical).toBeNull()
    expect(state.practicalResults[0].id).toBe(result.id)
    expect(state.attempts.filter((attempt) => attempt.mode === 'practical')).toHaveLength(20)
    expect(result.wrongIds).toContain(wrongId)
    expect(result.weakIds).toEqual([unsureId])
    expect(state.reviews[wrongId].lastResult).toBe('incorrect')
    expect(state.reviews[unsureId]).toBeDefined()
  })
})

describe('engagement workflow store', () => {
  it('saves progress, generates and refreshes one report, and marks completion', async () => {
    const { ENGAGEMENTS } = await import('../data/tracks/engagement')
    const { blankEngagementProgress } = await import('../lib/engagement')
    const scenario = ENGAGEMENTS[0]
    useStore.setState({ engagementProgress: {}, reports: [] })
    const progress = blankEngagementProgress(scenario)
    for (const step of scenario.steps) progress.checklist[step.key] = step.checklist.map(() => true)
    for (const item of scenario.scopeQuiz) progress.quizAnswers[item.id] = item.answer
    for (const asset of scenario.assets) progress.inventory[asset.id] = asset.inScope
    for (const finding of scenario.findings) progress.triage[finding.id] = { status: finding.expectedStatus, severity: finding.expectedSeverity }
    progress.roeAcknowledged = true
    useStore.getState().saveEngagementProgress(progress)
    expect(useStore.getState().engagementProgress[scenario.id].completedAt).toBeUndefined()

    const reportId = useStore.getState().generateEngagementReport(scenario.id)
    expect(reportId).toBeTruthy()
    expect(useStore.getState().engagementProgress[scenario.id]).toMatchObject({ reportId })
    expect(useStore.getState().engagementProgress[scenario.id].completedAt).toBeGreaterThan(0)
    expect(useStore.getState().generateEngagementReport(scenario.id)).toBe(reportId)
    expect(useStore.getState().reports.filter((report) => report.id === reportId)).toHaveLength(1)

    const backup = useStore.getState().exportData()
    useStore.getState().resetEngagement(scenario.id)
    expect(useStore.getState().engagementProgress[scenario.id]).toBeUndefined()
    expect(useStore.getState().importData(backup)).toBe(true)
    expect(useStore.getState().engagementProgress[scenario.id].reportId).toBe(reportId)
  })
})
