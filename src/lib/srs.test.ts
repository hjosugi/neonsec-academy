import { describe, it, expect } from 'vitest'
import { autoGrade, isDue, newReviewItem, scheduleNext } from './srs'
import { DAY, startOfDay } from './format'

const T0 = new Date('2026-07-08T10:00:00Z').getTime()

describe('srs / SM-2', () => {
  it('creates a fresh item due today', () => {
    const item = newReviewItem('q1', T0)
    expect(item.reps).toBe(0)
    expect(item.ease).toBe(2.5)
    expect(item.lapses).toBe(0)
    expect(item.dueAt).toBe(startOfDay(T0))
  })

  it('grows intervals 1 → 6 → 15 on repeated "good"', () => {
    let item = newReviewItem('q1', T0)
    item = scheduleNext(item, 'good', T0)
    expect(item.intervalDays).toBe(1)
    item = scheduleNext(item, 'good', T0)
    expect(item.intervalDays).toBe(6)
    item = scheduleNext(item, 'good', T0)
    expect(item.intervalDays).toBe(15) // round(6 * 2.5)
    expect(item.reps).toBe(3)
  })

  it('"again" is a lapse: resets interval, increments lapses, drops ease', () => {
    let item = newReviewItem('q1', T0)
    item = scheduleNext(item, 'good', T0)
    item = scheduleNext(item, 'good', T0)
    const before = item.ease
    item = scheduleNext(item, 'again', T0)
    expect(item.intervalDays).toBe(1)
    expect(item.reps).toBe(0)
    expect(item.lapses).toBe(1)
    expect(item.lastResult).toBe('incorrect')
    expect(item.ease).toBeLessThan(before)
  })

  it('never lets ease fall below 1.3', () => {
    let item = newReviewItem('q1', T0)
    for (let i = 0; i < 20; i++) item = scheduleNext(item, 'again', T0)
    expect(item.ease).toBeGreaterThanOrEqual(1.3)
  })

  it('"easy" raises ease, "good" leaves it flat', () => {
    const base = newReviewItem('q1', T0)
    expect(scheduleNext(base, 'easy', T0).ease).toBeGreaterThan(2.5)
    expect(scheduleNext(base, 'good', T0).ease).toBeCloseTo(2.5, 5)
  })

  it('"hard" schedules a shorter interval than "good"', () => {
    let g = newReviewItem('q1', T0)
    let h = newReviewItem('q1', T0)
    g = scheduleNext(g, 'good', T0)
    g = scheduleNext(g, 'good', T0)
    g = scheduleNext(g, 'good', T0)
    h = scheduleNext(h, 'good', T0)
    h = scheduleNext(h, 'good', T0)
    h = scheduleNext(h, 'hard', T0)
    expect(h.intervalDays).toBeLessThan(g.intervalDays)
  })

  it('isDue respects the due date and suspension', () => {
    const item = newReviewItem('q1', T0)
    expect(isDue(item, T0)).toBe(true)
    const future = scheduleNext(item, 'good', T0)
    expect(isDue(future, T0)).toBe(false)
    expect(isDue(future, future.dueAt + DAY)).toBe(true)
    expect(isDue({ ...item, suspended: true }, T0)).toBe(false)
  })

  it('autoGrade maps correctness to good/again', () => {
    expect(autoGrade(true)).toBe('good')
    expect(autoGrade(false)).toBe('again')
  })
})
