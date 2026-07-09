import { useMemo, useRef, useState } from 'react'
import type { Settings as SettingsType } from '../types'
import { useStore } from '../store/useStore'
import { LABS } from '../data/labs'
import { SEED_QUESTIONS } from '../data/questions'
import {
  buildQuestionPack,
  parseQuestionPack,
  preparePackImport,
  previewQuestionPack,
  type QuestionPack,
  type QuestionPackPreview,
} from '../lib/questionPacks'
import {
  buildPublicAnalyticsExport,
  publicAnalyticsToMarkdown,
  type LabProgressSummary,
} from '../lib/privacyExport'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="row row--between" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--hairline)' }}>
      <div>
        <div className="t-sm">{label}</div>
        {hint && <div className="term t-xs dim">{hint}</div>}
      </div>
      <label className="toggle">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="toggle__track" />
      </label>
    </div>
  )
}

function downloadJson(filename: string, json: string) {
  downloadBlob(filename, json, 'application/json')
}

function downloadText(filename: string, text: string) {
  downloadBlob(filename, text, 'text/markdown;charset=utf-8')
}

function downloadBlob(filename: string, body: string, type: string) {
  const blob = new Blob([body], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function countSummary(counts: Record<string, number>): string {
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => `${key}:${count}`)
    .join('  ')
}

const LAB_PROGRESS_PREFIX = 'neonsec-academy:lab-progress:'

function readLabProgressSummaries(): LabProgressSummary[] {
  if (typeof window === 'undefined') return []

  return LABS.map((lab) => {
    try {
      const raw = window.localStorage.getItem(`${LAB_PROGRESS_PREFIX}${lab.id}`)
      if (!raw) {
        return {
          id: lab.id,
          title: lab.title,
          category: lab.category,
          scopeAcknowledged: false,
          objectivesDone: 0,
          objectivesTotal: lab.objectives.length,
          hintsRevealed: 0,
        }
      }

      const parsed = JSON.parse(raw) as Partial<{ ack: boolean; done: boolean[]; revealedHints: number[] }>
      return {
        id: lab.id,
        title: lab.title,
        category: lab.category,
        scopeAcknowledged: parsed.ack === true,
        objectivesDone: lab.objectives.filter((_, i) => Boolean(parsed.done?.[i])).length,
        objectivesTotal: lab.objectives.length,
        hintsRevealed: (parsed.revealedHints ?? []).filter((i) => Number.isInteger(i) && i >= 0 && i < lab.guiding.length).length,
      }
    } catch {
      return {
        id: lab.id,
        title: lab.title,
        category: lab.category,
        scopeAcknowledged: false,
        objectivesDone: 0,
        objectivesTotal: lab.objectives.length,
        hintsRevealed: 0,
      }
    }
  })
}

const PRIVACY_CHECKS = [
  {
    id: 'publicOnly',
    label: 'Public export excludes raw answers, custom questions, mistake notes, and report evidence.',
  },
  {
    id: 'maskedTitles',
    label: 'I reviewed report titles; common emails, IPs, and secrets will be masked.',
  },
  {
    id: 'syntheticOnly',
    label: 'I will share only synthetic learning progress and no real target details.',
  },
  {
    id: 'privateBackup',
    label: 'I understand the full JSON backup may contain private notes and report data.',
  },
] as const

type PrivacyCheckId = (typeof PRIVACY_CHECKS)[number]['id']

const THEME_PRESETS: Array<{ label: string; hint: string; patch: Partial<SettingsType> }> = [
  {
    label: 'Neon Night',
    hint: 'Full cyber ambience',
    patch: { reduceMotion: false, lowGlow: false, highContrast: false, scanlines: true, sound: false },
  },
  {
    label: 'Low Glow',
    hint: 'Less bloom for long sessions',
    patch: { reduceMotion: false, lowGlow: true, highContrast: false, scanlines: true, sound: false },
  },
  {
    label: 'High Contrast',
    hint: 'Brighter copy and borders',
    patch: { reduceMotion: false, lowGlow: true, highContrast: true, scanlines: false, sound: false },
  },
  {
    label: 'Focus Mode',
    hint: 'All effects reduced',
    patch: { reduceMotion: true, lowGlow: true, highContrast: true, scanlines: false, sound: false },
  },
]

export function Settings() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const profile = useStore((s) => s.profile)
  const updateProfile = useStore((s) => s.updateProfile)
  const attempts = useStore((s) => s.attempts)
  const reviews = useStore((s) => s.reviews)
  const examResults = useStore((s) => s.examResults)
  const reports = useStore((s) => s.reports)
  const userQuestions = useStore((s) => s.userQuestions)
  const upsertUserQuestion = useStore((s) => s.upsertUserQuestion)
  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)
  const resetProgress = useStore((s) => s.resetProgress)
  const progressFileRef = useRef<HTMLInputElement>(null)
  const packFileRef = useRef<HTMLInputElement>(null)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(() => new Set(userQuestions.map((q) => q.id)))
  const [packImport, setPackImport] = useState<{ pack: QuestionPack; preview: QuestionPackPreview } | null>(null)
  const [privacyChecks, setPrivacyChecks] = useState<Record<PrivacyCheckId, boolean>>({
    publicOnly: false,
    maskedTitles: false,
    syntheticOnly: false,
    privateBackup: false,
  })
  const [msg, setMsg] = useState('')

  const set = (patch: Partial<SettingsType>) => updateSettings(patch)

  const existingQuestionIds = useMemo(
    () => new Set([...SEED_QUESTIONS.map((q) => q.id), ...userQuestions.map((q) => q.id)]),
    [userQuestions],
  )
  const selectedQuestions = useMemo(
    () => userQuestions.filter((q) => selectedQuestionIds.has(q.id)),
    [userQuestions, selectedQuestionIds],
  )
  const labProgress = useMemo(readLabProgressSummaries, [])
  const publicExport = useMemo(
    () =>
      buildPublicAnalyticsExport({
        attempts,
        reviews,
        examResults,
        reports,
        labProgress,
      }),
    [attempts, reviews, examResults, labProgress, reports],
  )
  const privacyReady = PRIVACY_CHECKS.every((check) => privacyChecks[check.id])

  const doExport = () => {
    downloadJson('neonsec-backup.json', exportData())
  }

  const doPublicExport = () => {
    if (!privacyReady) {
      setMsg('✕ Complete the privacy checklist before exporting a public summary.')
      return
    }
    const data = buildPublicAnalyticsExport({
      attempts,
      reviews,
      examResults,
      reports,
      labProgress: readLabProgressSummaries(),
    })
    downloadText('neonsec-public-progress.md', publicAnalyticsToMarkdown(data))
    setMsg('✓ Public-safe Markdown exported.')
  }

  const exportQuestionPack = (mode: 'selected' | 'all') => {
    const questions = mode === 'all' ? userQuestions : selectedQuestions
    if (questions.length === 0) {
      setMsg('✕ No user-authored questions to export.')
      return
    }
    const pack = buildQuestionPack(questions, `NeonSec custom questions (${questions.length})`)
    downloadJson('neonsec-question-pack.json', JSON.stringify(pack, null, 2))
    setMsg(`✓ Exported ${questions.length} question pack.`)
  }

  const onFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const ok = importData(String(reader.result))
      setMsg(ok ? '✓ Progress imported.' : '✕ Import failed — invalid file.')
    }
    reader.readAsText(file)
  }

  const onPackFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseQuestionPack(String(reader.result))
      if (!parsed.ok) {
        setPackImport(null)
        setMsg(`✕ Pack import failed — ${parsed.error}`)
        return
      }
      const preview = previewQuestionPack(parsed.pack, existingQuestionIds)
      setPackImport({ pack: parsed.pack, preview })
      setMsg(`✓ Pack ready: ${preview.total} questions.`)
    }
    reader.readAsText(file)
  }

  const confirmPackImport = () => {
    if (!packImport) return
    const prepared = preparePackImport(packImport.pack, existingQuestionIds)
    for (const q of prepared.questions) upsertUserQuestion(q)
    setSelectedQuestionIds((prev) => new Set([...prev, ...prepared.questions.map((q) => q.id)]))
    setMsg(
      `✓ Imported ${prepared.questions.length} questions` +
        (Object.keys(prepared.remapped).length ? `; remapped ${Object.keys(prepared.remapped).length} colliding IDs.` : '.'),
    )
    setPackImport(null)
  }

  const wipe = () => {
    if (confirm('Erase EVERYTHING (progress, settings, custom questions) and reload? This cannot be undone.')) {
      localStorage.removeItem('neonsec-academy:v1')
      location.reload()
    }
  }

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <PageHeader eyebrow="System // Settings" title="Settings" sub="Tune the interface, study cadence, and manage your local data." />

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <Panel title="Appearance & Motion">
            <Toggle label="Reduce motion" hint="Disable animations and glitch effects" checked={settings.reduceMotion} onChange={(v) => set({ reduceMotion: v })} />
            <Toggle label="Low glow" hint="Remove neon bloom (easier on the eyes / OLED)" checked={settings.lowGlow} onChange={(v) => set({ lowGlow: v })} />
            <Toggle label="High contrast" hint="Brighten text and borders" checked={settings.highContrast} onChange={(v) => set({ highContrast: v })} />
            <Toggle label="Scanlines" hint="Retro CRT scanline overlay" checked={settings.scanlines} onChange={(v) => set({ scanlines: v })} />
            <Toggle label="Sound cues" hint="Default off; reserved for local UI sounds only" checked={settings.sound} onChange={(v) => set({ sound: v })} />
          </Panel>

          <Panel title="Theme Presets">
            <div className="grid-2" style={{ gap: '0.6rem' }}>
              {THEME_PRESETS.map((preset) => (
                <button key={preset.label} className="btn btn--ghost btn--block" onClick={() => set(preset.patch)}>
                  <span>{preset.label}</span>
                  <span className="term t-xs dim" style={{ display: 'block' }}>{preset.hint}</span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Study">
            <div className="field">
              <label className="label">Daily review goal · {settings.dailyGoal} questions</label>
              <input type="range" min={5} max={60} step={5} value={settings.dailyGoal} onChange={(e) => set({ dailyGoal: Number(e.target.value) })} style={{ width: '100%' }} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label className="label">Mock exam target · {profile.examTargetPct}%</label>
              <input type="range" min={65} max={95} step={5} value={profile.examTargetPct} onChange={(e) => updateProfile({ examTargetPct: Number(e.target.value) })} style={{ width: '100%' }} />
            </div>
          </Panel>

          <Panel title="Safe Lab Scoring">
            <div className="field">
              <label className="label">Passing score · {settings.labPassingScore ?? 80}%</label>
              <input
                type="range"
                min={50}
                max={100}
                step={5}
                value={settings.labPassingScore ?? 80}
                onChange={(e) => set({ labPassingScore: Number(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
            <div className="field">
              <label className="label">Hint penalty · {settings.labHintPenalty ?? 2} points</label>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={settings.labHintPenalty ?? 2}
                onChange={(e) => set({ labHintPenalty: Number(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label className="label">Scope warning penalty · {settings.labScopeWarningPenalty ?? 5} points</label>
              <input
                type="range"
                min={0}
                max={25}
                step={1}
                value={settings.labScopeWarningPenalty ?? 5}
                onChange={(e) => set({ labScopeWarningPenalty: Number(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
          </Panel>
        </div>

        <div className="stack">
          <Panel
            title="Privacy Export"
            right={<span className="term t-xs dim">public-safe</span>}
          >
            <p className="term t-xs dim mb-2">
              Share aggregate progress without raw answers, authored questions, mistake notes, or report evidence.
            </p>
            <div className="grid-2 mb-2" style={{ gap: '0.55rem' }}>
              <div style={{ border: '1px solid var(--hairline)', borderRadius: 'var(--r-sm)', padding: '0.55rem' }}>
                <div className="term t-xs dim upper">Attempts</div>
                <strong>{publicExport.summary.attempts}</strong>
                <div className="term t-xs muted">{publicExport.summary.accuracyPct}% accuracy</div>
              </div>
              <div style={{ border: '1px solid var(--hairline)', borderRadius: 'var(--r-sm)', padding: '0.55rem' }}>
                <div className="term t-xs dim upper">Reviews</div>
                <strong>{publicExport.summary.reviewItems}</strong>
                <div className="term t-xs muted">{publicExport.summary.dueReviews} due now</div>
              </div>
              <div style={{ border: '1px solid var(--hairline)', borderRadius: 'var(--r-sm)', padding: '0.55rem' }}>
                <div className="term t-xs dim upper">Mocks</div>
                <strong>{publicExport.summary.mockExams}</strong>
                <div className="term t-xs muted">{publicExport.mockSummaries[0]?.scorePct ?? 0}% latest</div>
              </div>
              <div style={{ border: '1px solid var(--hairline)', borderRadius: 'var(--r-sm)', padding: '0.55rem' }}>
                <div className="term t-xs dim upper">Labs / Reports</div>
                <strong>
                  {publicExport.summary.labsStarted} / {publicExport.summary.reports}
                </strong>
                <div className="term t-xs muted">started / saved</div>
              </div>
            </div>

            <div className="stack stack--sm">
              {PRIVACY_CHECKS.map((check) => (
                <label key={check.id} className="row" style={{ gap: '0.55rem', alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    checked={privacyChecks[check.id]}
                    onChange={(e) => setPrivacyChecks((prev) => ({ ...prev, [check.id]: e.target.checked }))}
                  />
                  <span className="term t-xs muted">{check.label}</span>
                </label>
              ))}
              <button className="btn btn--primary btn--block" disabled={!privacyReady} onClick={doPublicExport}>
                Export public-safe Markdown
              </button>
            </div>
          </Panel>

          <Panel title="Data">
            <p className="term t-xs dim mb-2">
              Everything is stored locally in your browser. The full backup is private and may include notes, custom
              questions, answers, and report details.
            </p>
            <div className="stack stack--sm">
              <button className="btn btn--ghost btn--block" onClick={doExport}>
                Export full backup JSON
              </button>
              <button className="btn btn--ghost btn--block" onClick={() => progressFileRef.current?.click()}>
                Import full backup JSON
              </button>
              <input
                ref={progressFileRef}
                type="file"
                accept="application/json,.json"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
              {msg && <div className={`t-sm ${msg.startsWith('✓') ? 'neon-green' : 'neon-red'}`}>{msg}</div>}
            </div>
          </Panel>

          <Panel
            title="Question Packs"
            right={<span className="term t-xs dim">{selectedQuestions.length}/{userQuestions.length} selected</span>}
          >
            <p className="term t-xs dim mb-2">
              Export your authored questions as a portable deck, or preview a deck before importing it.
            </p>
            <div className="stack stack--sm">
              {userQuestions.length > 0 ? (
                <div style={{ maxHeight: 180, overflow: 'auto', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)' }}>
                  {userQuestions.map((q) => (
                    <label key={q.id} className="row" style={{ gap: '0.55rem', padding: '0.45rem 0.6rem', borderBottom: '1px solid var(--hairline)' }}>
                      <input
                        type="checkbox"
                        checked={selectedQuestionIds.has(q.id)}
                        onChange={(e) =>
                          setSelectedQuestionIds((prev) => {
                            const next = new Set(prev)
                            if (e.target.checked) next.add(q.id)
                            else next.delete(q.id)
                            return next
                          })
                        }
                      />
                      <span className="grow t-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {q.body}
                      </span>
                      <span className="badge">{q.module === 0 ? 'CEH+' : `M${q.module}`}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="term t-xs muted">No authored questions yet. Create or clone a question from Question Bank first.</p>
              )}

              <div className="row wrap" style={{ gap: '0.5rem' }}>
                <button className="btn btn--ghost btn--sm" disabled={userQuestions.length === 0} onClick={() => setSelectedQuestionIds(new Set(userQuestions.map((q) => q.id)))}>
                  Select all
                </button>
                <button className="btn btn--ghost btn--sm" disabled={userQuestions.length === 0} onClick={() => setSelectedQuestionIds(new Set())}>
                  Clear
                </button>
              </div>

              <button className="btn btn--ghost btn--block" disabled={selectedQuestions.length === 0} onClick={() => exportQuestionPack('selected')}>
                ⤓ Export selected pack
              </button>
              <button className="btn btn--ghost btn--block" disabled={userQuestions.length === 0} onClick={() => exportQuestionPack('all')}>
                ⤓ Export all authored questions
              </button>
              <button className="btn btn--ghost btn--block" onClick={() => packFileRef.current?.click()}>
                ⤒ Import question pack
              </button>
              <input
                ref={packFileRef}
                type="file"
                accept="application/json,.json"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && onPackFile(e.target.files[0])}
              />

              {packImport && (
                <div style={{ border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '0.7rem' }}>
                  <div className="row row--between wrap" style={{ gap: '0.5rem' }}>
                    <strong className="t-sm">{packImport.pack.title}</strong>
                    <span className="badge badge--cyan">{packImport.preview.total} Q</span>
                  </div>
                  <p className="term t-xs dim mt-1">
                    Modules: {countSummary(packImport.preview.byModule) || 'none'}
                  </p>
                  <p className="term t-xs dim">
                    Difficulty: {countSummary(packImport.preview.byDifficulty)}
                  </p>
                  {packImport.preview.collisions.length > 0 && (
                    <p className="term t-xs" style={{ color: 'var(--warning-amber)' }}>
                      {packImport.preview.collisions.length} ID collisions will be renamed on import.
                    </p>
                  )}
                  <div className="row wrap mt-2" style={{ gap: '0.5rem' }}>
                    <button className="btn btn--primary btn--sm" onClick={confirmPackImport}>
                      Import pack
                    </button>
                    <button className="btn btn--ghost btn--sm" onClick={() => setPackImport(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Danger Zone" style={{ borderColor: 'rgba(255,51,102,0.4)' }}>
            <div className="stack stack--sm">
              <button
                className="btn btn--ghost btn--block"
                onClick={() => {
                  if (confirm('Reset stats, reviews, exams and mistakes? Custom questions and settings are kept.')) {
                    resetProgress()
                    setMsg('✓ Progress reset.')
                  }
                }}
              >
                ↺ Reset progress
              </button>
              <button className="btn btn--danger btn--block" onClick={wipe}>
                ⚠ Erase everything
              </button>
            </div>
          </Panel>

          <Panel title="About">
            <p className="term t-xs muted">
              <span className="neon-cyan">NeonSec Academy</span> v1.0 — a cyberpunk CEH trainer. For authorized,
              defensive security learning only. All labs use synthetic data; nothing here touches real systems.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  )
}
