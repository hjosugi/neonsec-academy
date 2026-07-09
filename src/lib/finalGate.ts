import type { ExamResult, ModuleStat } from '../types'

export interface FinalGateCriteria {
  requiredMockCount: number
  mockScorePct: number
  maxDueBacklog: number
  weakModuleMasteryPct: number
  maxWeakModules: number
}

export interface FinalGateCheck {
  id: 'mock-streak' | 'due-backlog' | 'weak-modules' | 'module-inventory' | 'module-coverage'
  label: string
  passed: boolean
  actual: string
  target: string
  detail: string
  nextAction: string
}

export interface FinalGateModuleWarning {
  module: number
  moduleName: string
  reason: 'missing' | 'unanswered'
}

export interface FinalGateReport {
  passed: boolean
  generatedAt: number
  criteria: FinalGateCriteria
  checks: FinalGateCheck[]
  nextActions: string[]
  recentMocks: ExamResult[]
  weakModules: ModuleStat[]
  warnings: FinalGateModuleWarning[]
}

export const FINAL_GATE_DEFAULTS: FinalGateCriteria = {
  requiredMockCount: 3,
  mockScorePct: 85,
  maxDueBacklog: 0,
  weakModuleMasteryPct: 70,
  maxWeakModules: 0,
}

function boundedInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, Math.round(n)))
}

export function normalizeFinalGateCriteria(input: Partial<FinalGateCriteria> = {}): FinalGateCriteria {
  return {
    requiredMockCount: boundedInt(input.requiredMockCount, FINAL_GATE_DEFAULTS.requiredMockCount, 1, 5),
    mockScorePct: boundedInt(input.mockScorePct, FINAL_GATE_DEFAULTS.mockScorePct, 50, 100),
    maxDueBacklog: boundedInt(input.maxDueBacklog, FINAL_GATE_DEFAULTS.maxDueBacklog, 0, 500),
    weakModuleMasteryPct: boundedInt(input.weakModuleMasteryPct, FINAL_GATE_DEFAULTS.weakModuleMasteryPct, 0, 100),
    maxWeakModules: boundedInt(input.maxWeakModules, FINAL_GATE_DEFAULTS.maxWeakModules, 0, 20),
  }
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

function pct(n: number): string {
  return `${Math.round(n)}%`
}

function moduleList(mods: Pick<ModuleStat, 'module' | 'moduleName'>[], limit = 5): string {
  const shown = mods.slice(0, limit).map((m) => `M${String(m.module).padStart(2, '0')} ${m.moduleName}`)
  const remaining = mods.length - shown.length
  return remaining > 0 ? `${shown.join(', ')}, +${remaining} more` : shown.join(', ')
}

function warningList(warnings: FinalGateModuleWarning[], reason: FinalGateModuleWarning['reason']): string {
  const mods = warnings.filter((w) => w.reason === reason)
  const shown = mods.slice(0, 5).map((m) => `M${String(m.module).padStart(2, '0')} ${m.moduleName}`)
  const remaining = mods.length - shown.length
  return remaining > 0 ? `${shown.join(', ')}, +${remaining} more` : shown.join(', ')
}

export function evaluateFinalGate(input: {
  results: ExamResult[]
  modules: ModuleStat[]
  dueBacklog: number
  criteria?: Partial<FinalGateCriteria>
  now?: number
}): FinalGateReport {
  const criteria = normalizeFinalGateCriteria(input.criteria)
  const recentMocks = input.results
    .slice()
    .sort((a, b) => b.submittedAt - a.submittedAt)
    .slice(0, criteria.requiredMockCount)

  const failingMocks = recentMocks.filter((r) => r.scorePct < criteria.mockScorePct)
  const mockPassed = recentMocks.length >= criteria.requiredMockCount && failingMocks.length === 0
  const mockActual =
    recentMocks.length === 0
      ? '0 recorded'
      : recentMocks.map((r) => pct(r.scorePct)).join(', ')

  const weakModules = input.modules
    .filter((m) => m.total > 0 && m.mastery * 100 < criteria.weakModuleMasteryPct)
    .sort((a, b) => a.mastery - b.mastery || a.module - b.module)
  const missingModules = input.modules.filter((m) => m.total === 0)
  const unansweredModules = input.modules.filter((m) => m.total > 0 && m.attempts === 0)

  const warnings: FinalGateModuleWarning[] = [
    ...missingModules.map((m) => ({ module: m.module, moduleName: m.moduleName, reason: 'missing' as const })),
    ...unansweredModules.map((m) => ({ module: m.module, moduleName: m.moduleName, reason: 'unanswered' as const })),
  ]

  const duePassed = input.dueBacklog <= criteria.maxDueBacklog
  const weakPassed = weakModules.length <= criteria.maxWeakModules
  const inventoryPassed = missingModules.length === 0
  const coveragePassed = unansweredModules.length === 0

  const checks: FinalGateCheck[] = [
    {
      id: 'mock-streak',
      label: 'Consecutive mock scores',
      passed: mockPassed,
      actual: mockActual,
      target: `${criteria.requiredMockCount} latest mocks at or above ${criteria.mockScorePct}%`,
      detail:
        recentMocks.length < criteria.requiredMockCount
          ? `${plural(criteria.requiredMockCount - recentMocks.length, 'more mock')} required for a complete streak.`
          : `${failingMocks.length} of the latest ${criteria.requiredMockCount} mocks are below target.`,
      nextAction:
        recentMocks.length < criteria.requiredMockCount
          ? `Complete ${plural(criteria.requiredMockCount - recentMocks.length, 'more mock exam')} at or above ${criteria.mockScorePct}%.`
          : failingMocks.length > 0
            ? `Review below-target exam reports, then rebuild a ${criteria.requiredMockCount}-mock streak at or above ${criteria.mockScorePct}%.`
            : 'No action required.',
    },
    {
      id: 'due-backlog',
      label: 'Due review backlog',
      passed: duePassed,
      actual: plural(input.dueBacklog, 'due item'),
      target: `${criteria.maxDueBacklog} or fewer due items`,
      detail: duePassed
        ? 'Review backlog is within the configured gate.'
        : `${plural(input.dueBacklog - criteria.maxDueBacklog, 'due item')} must be cleared.`,
      nextAction: duePassed
        ? 'No action required.'
        : `Clear ${plural(input.dueBacklog - criteria.maxDueBacklog, 'due review item')} from the Review Queue.`,
    },
    {
      id: 'weak-modules',
      label: 'Weak module count',
      passed: weakPassed,
      actual: plural(weakModules.length, 'weak module'),
      target: `${criteria.maxWeakModules} or fewer modules below ${criteria.weakModuleMasteryPct}% mastery`,
      detail: weakModules.length > 0 ? moduleList(weakModules) : 'No weak modules under the configured mastery threshold.',
      nextAction: weakPassed
        ? 'No action required.'
        : `Drill ${moduleList(weakModules)} until mastery reaches ${criteria.weakModuleMasteryPct}% or better.`,
    },
    {
      id: 'module-inventory',
      label: 'Module inventory',
      passed: inventoryPassed,
      actual: plural(missingModules.length, 'module without questions'),
      target: 'Every CEH module has at least one local question',
      detail: missingModules.length > 0 ? warningList(warnings, 'missing') : 'Every module has local question coverage.',
      nextAction: inventoryPassed
        ? 'No action required.'
        : `Author or import at least one safe local question for ${warningList(warnings, 'missing')}.`,
    },
    {
      id: 'module-coverage',
      label: 'Module answer coverage',
      passed: coveragePassed,
      actual: plural(unansweredModules.length, 'unanswered module'),
      target: 'Every CEH module has at least one answered item',
      detail: unansweredModules.length > 0 ? warningList(warnings, 'unanswered') : 'Every module has at least one answer logged.',
      nextAction: coveragePassed
        ? 'No action required.'
        : `Answer at least one item in ${warningList(warnings, 'unanswered')}.`,
    },
  ]

  const nextActions = checks.filter((c) => !c.passed).map((c) => c.nextAction)

  return {
    passed: checks.every((c) => c.passed),
    generatedAt: input.now ?? Date.now(),
    criteria,
    checks,
    nextActions,
    recentMocks,
    weakModules,
    warnings,
  }
}

export function finalGateToMarkdown(report: FinalGateReport): string {
  const status = report.passed ? 'PASS' : 'FAIL'
  const lines = [
    '# CEH Final Gate Checklist',
    '',
    `Overall: **${status}**`,
    `Generated: ${new Date(report.generatedAt).toISOString()}`,
    '',
    '## Criteria',
    '',
    `- Mock streak: ${report.criteria.requiredMockCount} latest mocks at or above ${report.criteria.mockScorePct}%`,
    `- Due review backlog: ${report.criteria.maxDueBacklog} or fewer`,
    `- Weak modules: ${report.criteria.maxWeakModules} or fewer below ${report.criteria.weakModuleMasteryPct}% mastery`,
    `- Module inventory: every CEH module has at least one local question`,
    `- Module answer coverage: every CEH module has at least one answered item`,
    '',
    '## Recent Mocks',
    '',
  ]

  if (report.recentMocks.length === 0) {
    lines.push('_No mock results recorded._', '')
  } else {
    report.recentMocks.forEach((r, i) => {
      lines.push(`${i + 1}. ${new Date(r.submittedAt).toISOString()} - ${r.presetLabel} - ${pct(r.scorePct)}`)
    })
    lines.push('')
  }

  lines.push('## Checklist', '')
  report.checks.forEach((check) => {
    lines.push(`- [${check.passed ? 'x' : ' '}] ${check.label}`)
    lines.push(`  - Actual: ${check.actual}`)
    lines.push(`  - Target: ${check.target}`)
    lines.push(`  - Next action: ${check.nextAction}`)
  })

  lines.push('', '## Next Actions', '')
  if (report.nextActions.length === 0) {
    lines.push('_None. The final gate is passing._')
  } else {
    report.nextActions.forEach((action) => lines.push(`- ${action}`))
  }

  lines.push('', '## Module Warnings', '')
  if (report.warnings.length === 0) {
    lines.push('_None._')
  } else {
    report.warnings.forEach((w) => {
      lines.push(`- M${String(w.module).padStart(2, '0')} ${w.moduleName}: ${w.reason}`)
    })
  }

  lines.push('', '---', 'Data boundary: local training questions, mock results, and review data only.')
  return lines.join('\n')
}
