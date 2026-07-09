import { describe, expect, it } from 'vitest'
import type { ModuleStat, Question } from '../types'
import { MODULES } from '../data/taxonomy'
import { buildExamQuestionPlan } from './exam'
import {
  asExamPreset,
  buildBalancedExamPreset,
  buildFinalReadyExamPreset,
  buildWeakFocusedExamPreset,
} from './examPresets'
import { mkQ } from './testfixtures'

function sumCounts(counts: Record<string, number>): number {
  return Object.values(counts).reduce((sum, count) => sum + count, 0)
}

function fullPool(perModule = 10): Question[] {
  const pool: Question[] = []
  for (const module of MODULES) {
    for (let i = 0; i < perModule; i++) pool.push(mkQ(`m${module.module}-${i}`, module.module))
  }
  return pool
}

function mod(module: number, mastery: number, attempts = 10): ModuleStat {
  const meta = MODULES.find((m) => m.module === module)!
  return {
    module,
    moduleName: meta.name,
    domain: meta.domain,
    district: meta.district,
    total: 10,
    seen: attempts,
    correct: Math.round(mastery * attempts),
    attempts,
    accuracy: mastery,
    dueCount: 0,
    mastery,
    avgConfidence: 3,
    recentTrend: 'flat',
  }
}

describe('exam presets', () => {
  it('generates a balanced 125-question module plan', () => {
    const preset = buildBalancedExamPreset()
    const plan = buildExamQuestionPlan(asExamPreset(preset), fullPool(), undefined, preset.moduleCounts)

    expect(sumCounts(preset.moduleCounts)).toBe(125)
    expect(plan.ids).toHaveLength(125)
    expect(plan.warnings).toHaveLength(0)
  })

  it('ships the expected editable preset families', () => {
    const ids = [
      buildBalancedExamPreset().id,
      buildWeakFocusedExamPreset([mod(7, 0.2), mod(8, 0.9)]).id,
      buildFinalReadyExamPreset().id,
    ]

    expect(ids).toEqual(['balanced-125', 'weak-focused-125', 'final-ready-125'])
  })

  it('weights weak-focused presets toward low-mastery modules', () => {
    const balanced = buildBalancedExamPreset()
    const weak = buildWeakFocusedExamPreset([mod(7, 0.15), mod(8, 0.9), mod(9, 0.95)])

    expect(weak.moduleCounts['7']).toBeGreaterThan(balanced.moduleCounts['7'])
    expect(sumCounts(weak.moduleCounts)).toBe(125)
  })
})
