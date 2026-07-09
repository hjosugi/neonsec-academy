#!/usr/bin/env node
// Validates the seed question bank against the app's question schema.
// Usage: node scripts/validate_questions.mjs
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIR = join(__dirname, '..', 'src', 'data', 'questions')

const TYPES = new Set(['mcq', 'multi', 'true_false', 'short_answer', 'scenario', 'report_prompt'])
const DIFF = new Set(['easy', 'medium', 'hard'])
const TRACKS = new Set(['pentest', 'appsec', 'cloud', 'soc', 'ir', 'threat-model'])

const errors = []
const ids = new Set()
const perModule = new Map()
let total = 0

function isFreeformType(type) {
  return type === 'short_answer' || type === 'scenario' || type === 'report_prompt'
}

const files = readdirSync(DIR)
  .filter((f) => f.endsWith('.json'))
  .sort()

for (const file of files) {
  let data
  try {
    data = JSON.parse(readFileSync(join(DIR, file), 'utf8'))
  } catch (e) {
    errors.push(`${file}: invalid JSON — ${e.message}`)
    continue
  }
  if (!Array.isArray(data)) {
    errors.push(`${file}: top-level value is not an array`)
    continue
  }
  data.forEach((q, i) => {
    const at = `${file}[${i}] ${q?.id ?? '?'}`
    total++
    if (!q || typeof q.id !== 'string') return errors.push(`${at}: missing id`)
    if (ids.has(q.id)) errors.push(`${at}: duplicate id`)
    ids.add(q.id)
    if (!TYPES.has(q.type)) errors.push(`${at}: bad type "${q.type}"`)
    if (!Number.isInteger(q.module) || q.module < 0 || q.module > 20)
      errors.push(`${at}: module must be an integer from 0 through 20`)
    if (!DIFF.has(q.difficulty)) errors.push(`${at}: bad difficulty "${q.difficulty}"`)
    if (!Array.isArray(q.tags) || q.tags.length === 0) errors.push(`${at}: tags[] required`)
    if (typeof q.body !== 'string' || !q.body.trim()) errors.push(`${at}: body required`)
    const ex = q.explanation
    if (!ex || !ex.answer || !ex.why || !ex.trap || !ex.memory_phrase)
      errors.push(`${at}: explanation needs answer/why/trap/memory_phrase`)

    if (q.module === 0 && !TRACKS.has(q.track)) errors.push(`${at}: CEH+ item needs a valid track`)
    if (q.module > 0 && q.track != null) errors.push(`${at}: CEH module items must not set track`)

    perModule.set(q.module, (perModule.get(q.module) ?? 0) + 1)

    if (q.type === 'mcq') {
      if (!Array.isArray(q.choices) || q.choices.length < 2)
        return errors.push(`${at}: mcq needs >=2 choices`)
      if (typeof q.answer !== 'string' || !q.choices.includes(q.answer))
        errors.push(`${at}: mcq answer must match a choice`)
    } else if (q.type === 'multi') {
      if (!Array.isArray(q.choices) || q.choices.length < 3)
        return errors.push(`${at}: multi needs >=3 choices`)
      if (!Array.isArray(q.answer) || q.answer.length < 2)
        return errors.push(`${at}: multi answer must be an array of >=2`)
      for (const a of q.answer)
        if (!q.choices.includes(a)) errors.push(`${at}: multi answer "${a}" not in choices`)
    } else if (q.type === 'true_false') {
      const c = JSON.stringify(q.choices)
      if (c !== '["True","False"]') errors.push(`${at}: true_false choices must be ["True","False"]`)
      if (q.answer !== 'True' && q.answer !== 'False')
        errors.push(`${at}: true_false answer must be True/False`)
    } else if (isFreeformType(q.type)) {
      if (typeof q.answer !== 'string' || !q.answer.trim())
        errors.push(`${at}: ${q.type} needs a model answer string`)
    }
  })
}

console.log(`\n  Seed bank: ${total} questions across ${files.length} files\n`)
const mods = [...perModule.entries()].sort((a, b) => a[0] - b[0])
console.log('  Per module: ' + mods.map(([m, n]) => `M${m}:${n}`).join('  '))

if (errors.length) {
  console.error(`\n  ✘ ${errors.length} error(s):`)
  for (const e of errors.slice(0, 60)) console.error('   - ' + e)
  process.exit(1)
}
console.log('\n  ✔ All questions valid.\n')
