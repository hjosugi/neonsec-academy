// Registry of CEH+ review-style track challenges (select lines, classify, write up).
import type { TrackChallenge } from './types'
import { APPSEC_CHALLENGES } from './appsec'

export const TRACK_CHALLENGES: TrackChallenge[] = [...APPSEC_CHALLENGES]

export function trackChallengeById(id: string): TrackChallenge | undefined {
  return TRACK_CHALLENGES.find((challenge) => challenge.id === id)
}
