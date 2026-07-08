// ============================================================
// Seed question loader: merges the authored JSON groups and
// enriches each item with derived module/domain/district fields.
// ============================================================
import type { Question, RawQuestion } from '../types'
import { DOMAINS, moduleMeta } from './taxonomy'

import groupA from './questions/group-a.json'
import groupB from './questions/group-b.json'
import groupC from './questions/group-c.json'
import groupD from './questions/group-d.json'
import groupE from './questions/group-e.json'
import groupF from './questions/group-f.json'
import groupG from './questions/group-g.json'
import groupH from './questions/group-h.json'
import groupI from './questions/group-i.json'

const GROUPS = [groupA, groupB, groupC, groupD, groupE, groupF, groupG, groupH, groupI]

/** Attach display fields; returns null for structurally invalid rows. */
export function enrichQuestion(q: RawQuestion): Question | null {
  if (!q || typeof q.id !== 'string' || !q.type) return null

  if (q.module === 0) {
    return {
      ...q,
      moduleName: 'CEH+ Practical',
      domain: 'beyond',
      domainName: DOMAINS.beyond.name,
      district: 'beyond-district',
      status: q.status ?? 'active',
      source: q.source ?? 'seed',
    }
  }

  const m = moduleMeta(q.module)
  if (!m) return null
  return {
    ...q,
    moduleName: m.name,
    domain: m.domain,
    domainName: DOMAINS[m.domain].name,
    district: m.district,
    status: q.status ?? 'active',
    source: q.source ?? 'seed',
  }
}

function loadSeed(): Question[] {
  const raw = (GROUPS as unknown as RawQuestion[][]).flat()
  const seen = new Set<string>()
  const out: Question[] = []
  for (const r of raw) {
    if (seen.has(r.id)) continue
    const e = enrichQuestion({ ...r, source: 'seed' })
    if (e) {
      seen.add(r.id)
      out.push(e)
    }
  }
  return out
}

export const SEED_QUESTIONS: Question[] = loadSeed()
