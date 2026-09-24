import { describe, expect, it } from 'vitest'
import commentSchema from '../../docs/schemas/peer-review-comment.schema.json'
import packageSchema from '../../docs/schemas/peer-review-package.schema.json'

// Minimal JSON Schema subset validator used to prove the design examples conform to the documented
// schemas (type, required, properties, additionalProperties, enum, const, string/integer bounds,
// pattern, maxItems, allOf if/then). The peer review mode itself is design-only (P5-009).
type Schema = Record<string, unknown>

function typeOk(value: unknown, type: unknown): boolean {
  const types = Array.isArray(type) ? type : [type]
  return types.some((t) =>
    (t === 'object' && typeof value === 'object' && value !== null && !Array.isArray(value))
    || (t === 'array' && Array.isArray(value))
    || (t === 'string' && typeof value === 'string')
    || (t === 'integer' && Number.isInteger(value))
    || (t === 'boolean' && typeof value === 'boolean')
    || (t === 'null' && value === null))
}

function validate(schema: Schema, value: unknown, path = '$'): string[] {
  const errors: string[] = []
  if (schema.type !== undefined && !typeOk(value, schema.type)) return [`${path}: expected ${String(schema.type)}`]
  if (schema.const !== undefined && value !== schema.const) errors.push(`${path}: expected const ${String(schema.const)}`)
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) errors.push(`${path}: not in enum`)
  if (typeof value === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) errors.push(`${path}: too short`)
    if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) errors.push(`${path}: too long`)
    if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern).test(value)) errors.push(`${path}: pattern`)
  }
  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) errors.push(`${path}: below minimum`)
    if (typeof schema.maximum === 'number' && value > schema.maximum) errors.push(`${path}: above maximum`)
  }
  if (Array.isArray(value)) {
    if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) errors.push(`${path}: too many items`)
    if (schema.items) value.forEach((item, index) => errors.push(...validate(schema.items as Schema, item, `${path}[${index}]`)))
  }
  if (typeOk(value, 'object')) {
    const record = value as Record<string, unknown>
    const properties = (schema.properties ?? {}) as Record<string, Schema>
    for (const key of (schema.required ?? []) as string[]) if (!(key in record)) errors.push(`${path}: missing ${key}`)
    for (const [key, child] of Object.entries(record)) {
      if (properties[key]) errors.push(...validate(properties[key], child, `${path}.${key}`))
      else if (schema.additionalProperties === false) errors.push(`${path}: unexpected ${key}`)
    }
    for (const rule of (schema.allOf ?? []) as Array<{ if: Schema; then: Schema }>) {
      if (validate(rule.if, value, path).length === 0) errors.push(...validate(rule.then, value, path))
    }
  }
  return errors
}

describe('peer review design schemas', () => {
  it('ship examples that validate against the comment schema', () => {
    expect(commentSchema.examples.length).toBeGreaterThanOrEqual(2)
    for (const example of commentSchema.examples) expect(validate(commentSchema as Schema, example)).toEqual([])
  })

  it('require kind-specific payloads for suggestions, approvals, and safety flags', () => {
    const base = commentSchema.examples[0]
    const { suggestion: _unused, ...withoutSuggestion } = base
    expect(validate(commentSchema as Schema, withoutSuggestion)).toContain('$: missing suggestion')
    expect(validate(commentSchema as Schema, { ...withoutSuggestion, kind: 'approval' })).toContain('$: missing rubric')
    expect(validate(commentSchema as Schema, { ...withoutSuggestion, kind: 'safety-flag' })).toContain('$: missing safetyFlag')
    expect(validate(commentSchema as Schema, { ...base, kind: 'praise' })).toContain('$.kind: not in enum')
  })

  it('only allow masked, public-safe review packages', () => {
    for (const example of packageSchema.examples) expect(validate(packageSchema as Schema, example)).toEqual([])
    const unsafe = { ...packageSchema.examples[0], masking: { publicSafe: true, redactions: 0, sensitiveHits: 2, checklistConfirmed: true } }
    expect(validate(packageSchema as Schema, unsafe)).toContain('$.masking.sensitiveHits: expected const 0')
    const privateMode = { ...packageSchema.examples[0], masking: { ...packageSchema.examples[0].masking, publicSafe: false } }
    expect(validate(packageSchema as Schema, privateMode)).toContain('$.masking.publicSafe: expected const true')
  })
})
