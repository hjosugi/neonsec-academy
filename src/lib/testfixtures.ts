// Shared test fixtures (not a test suite itself).
import type { Question } from '../types'
import { DOMAINS, moduleMeta } from '../data/taxonomy'

export function mkQ(id: string, module: number, opts: Partial<Question> = {}): Question {
  const m = moduleMeta(module)!
  return {
    id,
    type: 'mcq',
    module,
    difficulty: 'easy',
    tags: ['t'],
    body: 'q',
    choices: ['A', 'B', 'C', 'D'],
    answer: 'A',
    explanation: { answer: '', why: '', trap: '', memory_phrase: '' },
    moduleName: m.name,
    domain: m.domain,
    domainName: DOMAINS[m.domain].name,
    district: m.district,
    status: 'active',
    source: 'seed',
    ...opts,
  }
}
