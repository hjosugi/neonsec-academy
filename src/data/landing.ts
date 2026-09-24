// ============================================================
// Landing page copy (P6-010). Emphasises problem management, the review
// system, and practical evidence. Kept free of attack-tool framing; a unit
// test runs this copy through the lab safety audit rules.
// ============================================================

export interface LandingValue {
  id: 'problems' | 'review' | 'evidence'
  title: string
  body: string
  proof: string
}

export interface LandingScreen {
  id: 'dashboard' | 'review' | 'exam-report' | 'lab-report' | 'city-map'
  title: string
  body: string
}

export const LANDING_COPY = {
  eyebrow: 'CEH study + safe practical evidence',
  headline: 'Manage every question you miss until it sticks — then prove what you can do.',
  subhead:
    'NeonSec Academy is a local-first study manager for the CEH exam and the practical work after it: a question bank with spaced review, timed mock exams with readiness gates, and synthetic labs that turn into reports and portfolio evidence.',
  safety:
    'Everything runs in your browser on synthetic, fictional material. No scanning, no live targets, no credentials, no traffic — you practise analysis, triage, and reporting.',
  demoCta: 'Explore the demo',
  startCta: 'Start with my own progress',
  demoNote: 'Demo mode loads a synthetic learner. Your own progress is parked locally and restored when you exit.',
} as const

export const LANDING_VALUES: LandingValue[] = [
  {
    id: 'problems',
    title: 'Problem management, not a quiz toy',
    body: 'Every miss becomes a tracked item: why you were wrong, the trap, a memory phrase, and the next action. Weak modules surface on the dashboard and city map.',
    proof: '405 CEH-mapped questions · mistake notebook · weak-module drills',
  },
  {
    id: 'review',
    title: 'A review system that schedules itself',
    body: 'Spaced repetition decides what is due today. Mock exams follow the blueprint, and the Final Gate tells you when you are ready to book.',
    proof: 'SM-2 review queue · 125-question mock exams · readiness gate',
  },
  {
    id: 'evidence',
    title: 'Practical evidence you can show',
    body: 'Safe labs, CEH+ tracks, triage, and the report builder produce findings with evidence and remediation — exported as public-safe Markdown for your portfolio.',
    proof: 'Synthetic labs · report builder · portfolio exporter',
  },
]

export const LANDING_SCREENS: LandingScreen[] = [
  { id: 'dashboard', title: 'Dashboard', body: 'Readiness, due reviews, streak, and weak modules at a glance.' },
  { id: 'review', title: 'Review Queue', body: 'Today’s due questions, graded again / hard / good / easy.' },
  { id: 'exam-report', title: 'Mock Exam Report', body: 'Score, domain breakdown, flagged items, and a repair plan.' },
  { id: 'lab-report', title: 'Lab Report', body: 'A synthetic SOC finding with cited evidence and remediation.' },
  { id: 'city-map', title: 'City Map', body: 'The 20 CEH modules as Neon Tokyo-7 districts, coloured by mastery.' },
]
