#!/usr/bin/env node
// Lab Safety Audit publish gate (P4-010).
// Loads the TypeScript lab registry and audit rules through Vite's module runner, audits every
// shipped lab, and self-tests the gate with the safe and unsafe sample labs.
// Usage: node scripts/lab_safety_audit.mjs [--report]
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runnerImport } from 'vite'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const config = { root: ROOT, configFile: false, logLevel: 'silent' }

const { module: audit } = await runnerImport(resolve(ROOT, 'src/lib/labSafetyAudit.ts'), config)
const { module: labs } = await runnerImport(resolve(ROOT, 'src/data/labs.ts'), config)
const { module: samples } = await runnerImport(resolve(ROOT, 'src/data/labAuditSamples.ts'), config)

const decisions = labs.LABS.map(audit.publishDecision)
const safeSample = audit.publishDecision(samples.SAFE_SAMPLE_LAB)
const unsafeSample = audit.publishDecision(samples.UNSAFE_SAMPLE_LAB)

console.log(`Lab safety audit (ruleset v${audit.AUDIT_RULESET_VERSION})`)
for (const decision of decisions) {
  const label = decision.publishable ? decision.status.toUpperCase() : 'REJECTED'
  console.log(`  ${label.padEnd(8)} ${decision.targetId} — ${decision.report.blockers} blockers, ${decision.report.warnings} warnings`)
  for (const reason of decision.reasons) console.log(`      gate: ${reason}`)
  for (const finding of decision.report.findings) {
    console.log(`      [${finding.severity}] ${finding.rule} in ${finding.field}: ${finding.value}`)
    console.log(`        suggestion: ${finding.safeAlternative}`)
  }
}

console.log('')
console.log('Publish gate self-test')
console.log(`  safe sample:   ${safeSample.publishable ? 'publishable' : 'REJECTED'} (${safeSample.report.blockers} blockers)`)
console.log(`  unsafe sample: ${unsafeSample.publishable ? 'PUBLISHABLE' : 'rejected'} (${unsafeSample.report.blockers} blockers: ${[...new Set(unsafeSample.report.findings.map((f) => f.rule))].join(', ')})`)

if (process.argv.includes('--report')) {
  console.log('')
  console.log(audit.auditReportToMarkdown(decisions))
}

const rejected = decisions.filter((decision) => !decision.publishable)
const selfTestFailed = !safeSample.publishable || unsafeSample.publishable
if (rejected.length > 0 || selfTestFailed) {
  console.log('')
  if (rejected.length > 0) console.log(`FAIL: ${rejected.length} lab(s) rejected by the publish gate.`)
  if (selfTestFailed) console.log('FAIL: publish gate self-test did not accept the safe sample and reject the unsafe sample.')
  process.exit(1)
}
console.log('')
console.log(`PASS: ${decisions.length} labs publishable; unsafe sample rejected.`)
