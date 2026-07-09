import type { ExamResult, ModuleScore, Question } from '../types'
import { moduleMeta } from '../data/taxonomy'
import { formatDate, formatDuration } from './format'
import { isCorrect } from './grade'

export interface FlaggedSummary {
  total: number
  correct: number
  pct: number
}

export interface ExamStudyPlanItem {
  day: number
  title: string
  detail: string
}

function pct(value: number): string {
  return `${Math.round(value)}%`
}

function marginLabel(scorePct: number, passMark: number): string {
  const margin = Math.round(scorePct - passMark)
  if (margin === 0) return '0 pts'
  return `${margin > 0 ? '+' : ''}${margin} pts`
}

function questionMap(questions: Question[]): Map<string, Question> {
  return new Map(questions.map((q) => [q.id, q]))
}

export function getExamModuleScores(result: ExamResult, questions: Question[]): ModuleScore[] {
  if (result.perModule?.length) return result.perModule.slice().sort((a, b) => a.module - b.module)
  const byQuestion = questionMap(questions)
  const scores = new Map<number, { total: number; correct: number }>()
  for (const qid of result.questionIds) {
    const q = byQuestion.get(qid)
    if (!q) continue
    const row = scores.get(q.module) ?? { total: 0, correct: 0 }
    row.total++
    if (isCorrect(q, result.answers[qid] ?? null)) row.correct++
    scores.set(q.module, row)
  }
  return Array.from(scores.entries())
    .sort(([a], [b]) => a - b)
    .map(([module, row]) => ({
      module,
      moduleName: moduleMeta(module)?.name ?? `Module ${module}`,
      total: row.total,
      correct: row.correct,
      pct: row.total > 0 ? (row.correct / row.total) * 100 : 0,
    }))
}

export function getFlaggedSummary(result: ExamResult, questions: Question[]): FlaggedSummary {
  if (typeof result.flaggedTotal === 'number') {
    const total = result.flaggedTotal
    const correct = result.flaggedCorrect ?? 0
    return { total, correct, pct: total > 0 ? (correct / total) * 100 : -1 }
  }
  const flags = result.flagged ?? {}
  const byQuestion = questionMap(questions)
  let total = 0
  let correct = 0
  for (const [qid, flagged] of Object.entries(flags)) {
    if (!flagged) continue
    const q = byQuestion.get(qid)
    if (!q) continue
    total++
    if (isCorrect(q, result.answers[qid] ?? null)) correct++
  }
  return { total, correct, pct: total > 0 ? (correct / total) * 100 : -1 }
}

export function buildExamStudyPlan(result: ExamResult, questions: Question[]): ExamStudyPlanItem[] {
  const modules = getExamModuleScores(result, questions)
    .filter((m) => m.total > 0)
    .sort((a, b) => a.pct - b.pct || b.total - a.total || a.module - b.module)
  const weak = modules.filter((m) => m.pct < result.passMark)
  const primary = weak[0] ?? modules[0]
  const secondary = weak[1] ?? modules[1] ?? primary
  const tertiary = weak[2] ?? modules[2] ?? secondary
  const wrong = Math.max(0, result.total - result.correct)
  const flagged = getFlaggedSummary(result, questions)

  return [
    {
      day: 1,
      title: 'Incorrect answer repair',
      detail: `Re-answer ${wrong} incorrect items, write the missed rule, and enqueue anything still unclear.`,
    },
    {
      day: 2,
      title: primary ? `Module focus: M${String(primary.module).padStart(2, '0')}` : 'Module focus',
      detail: primary
        ? `Drill ${primary.moduleName}; target at least ${result.passMark}% after scoring ${pct(primary.pct)} on this mock.`
        : 'Run a mixed drill and identify the first weak module.',
    },
    {
      day: 3,
      title: 'Flagged question audit',
      detail:
        flagged.total > 0
          ? `Review ${flagged.total} flagged items; flagged accuracy was ${pct(flagged.pct)}.`
          : 'Mark uncertain items during the next timed run so accuracy under doubt is visible.',
    },
    {
      day: 4,
      title: secondary ? `Second weak module: M${String(secondary.module).padStart(2, '0')}` : 'Second weak module',
      detail: secondary
        ? `Complete a 20-question timed drill for ${secondary.moduleName}.`
        : 'Complete a 20-question timed drill from the full CEH pool.',
    },
    {
      day: 5,
      title: 'Explanation compare pass',
      detail: 'For every repeated miss, compare your reasoning with the model explanation and update the mistake note.',
    },
    {
      day: 6,
      title: tertiary ? `Mixed weak review: M${String(tertiary.module).padStart(2, '0')}` : 'Mixed weak review',
      detail: tertiary
        ? `Mix ${tertiary.moduleName} with older review items to test retention, not recognition.`
        : 'Mix old review items with fresh questions to test retention, not recognition.',
    },
    {
      day: 7,
      title: 'Quick mock calibration',
      detail: `Run a Quick Sim or weighted mock and compare the safety margin against ${result.passMark}%.`,
    },
  ]
}

export function examResultToMarkdown(result: ExamResult, questions: Question[], generatedAt = Date.now()): string {
  const modules = getExamModuleScores(result, questions)
  const flagged = getFlaggedSummary(result, questions)
  const plan = buildExamStudyPlan(result, questions)
  const status = result.passed ? 'PASS' : 'FAIL'
  const lines = [
    '# Mock Exam Result Report',
    '',
    `Generated: ${new Date(generatedAt).toISOString()}`,
    `Exam: ${result.presetLabel}`,
    `Submitted: ${new Date(result.submittedAt).toISOString()}`,
    `Overall: **${status}**`,
    '',
    '## Score',
    '',
    `- Score: ${pct(result.scorePct)} (${result.correct}/${result.total})`,
    `- Typical target: ${result.passMark}%`,
    `- Safety margin: ${marginLabel(result.scorePct, result.passMark)}`,
    `- Answered: ${result.answered}/${result.total}`,
    `- Time spent: ${formatDuration(result.timeUsedSec)} / ${formatDuration(result.durationSec)}`,
    `- Flagged accuracy: ${flagged.total > 0 ? `${pct(flagged.pct)} (${flagged.correct}/${flagged.total})` : 'n/a'}`,
    '',
    '## Module Breakdown',
    '',
    '| Module | Score | Status |',
    '|---|---:|---|',
  ]

  if (modules.length === 0) {
    lines.push('| n/a | n/a | No module data |')
  } else {
    modules.forEach((m) => {
      lines.push(
        `| M${String(m.module).padStart(2, '0')} ${m.moduleName} | ${pct(m.pct)} (${m.correct}/${m.total}) | ${
          m.pct >= result.passMark ? 'ready' : 'review'
        } |`,
      )
    })
  }

  lines.push('', '## Next 7 Days', '')
  plan.forEach((item) => {
    lines.push(`- Day ${item.day}: **${item.title}** - ${item.detail}`)
  })

  lines.push('', '---', `_Generated by NeonSec Academy on ${formatDate(generatedAt)}._`)
  return lines.join('\n')
}
