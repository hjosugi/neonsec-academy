import type { TrackChallenge } from '../data/tracks/types'
import type { RawQuestion } from '../types'

// Compiles CEH+ track challenges into module-0 review questions so wrong answers can be scheduled
// in the Review Queue. Kept free of UI/audit imports because the seed question loader uses it.

export const TRACK_QUESTION_PREFIX = 'TC-'

export function trackQuestionId(challenge: Pick<TrackChallenge, 'id'>): string {
  return `${TRACK_QUESTION_PREFIX}${challenge.id}`
}

export function trackChallengeRawQuestion(challenge: TrackChallenge): RawQuestion {
  const width = String(challenge.artifact.lines.length).length
  const numbered = challenge.artifact.lines.map((line, index) => `${String(index + 1).padStart(width, ' ')} | ${line}`)
  return {
    id: trackQuestionId(challenge),
    title: challenge.title,
    type: 'mcq',
    module: 0,
    track: challenge.track,
    difficulty: challenge.difficulty,
    tags: ['practical-track', challenge.category, ...challenge.skills, ...challenge.cehModules.map((module) => `ceh-m${module}`)],
    body: [
      `**${challenge.title}** — ${challenge.scenario}`,
      '',
      `\`${challenge.artifact.label}\``,
      '',
      '```text',
      ...numbered,
      '```',
      '',
      challenge.classification.prompt,
    ].join('\n'),
    choices: challenge.classification.options,
    answer: challenge.classification.answer,
    explanation: {
      answer: challenge.explanation,
      why: `Key lines: ${challenge.answerLines.map((line) => `L${line}`).join(', ')}. ${challenge.remediation}`,
      trap: `Distractors name other classes; anchor your answer to lines ${challenge.answerLines.join(', ')}.`,
      memory_phrase: `${challenge.category}: find the line, name the class, fix the root cause.`,
    },
  }
}
