// ============================================================
// CEH taxonomy: modules → exam domains → cyberpunk districts.
// Domain weights follow the EC-Council CEH exam blueprint.
// See docs/CEH_OFFICIAL_NOTES.md
// ============================================================
import type { DomainId, DistrictId, TrackKey } from '../types'

export interface DomainMeta {
  id: DomainId
  name: string
  short: string
  weightPct: number // share of the 125-question knowledge exam
  color: string
}

export interface ModuleMeta {
  module: number
  name: string
  short: string
  domain: DomainId
  district: DistrictId
}

export interface DistrictMeta {
  id: DistrictId
  name: string
  blurb: string
  color: string
  glyph: string
  modules: number[]
}

export interface TrackMeta {
  key: TrackKey
  name: string
  short: string
  blurb: string
}

// ---- Exam domains (weights sum to 100 for the 9 official domains) ----
export const DOMAINS: Record<DomainId, DomainMeta> = {
  overview: { id: 'overview', name: 'Information Security and Ethical Hacking Overview', short: 'Overview', weightPct: 6, color: '#00f5ff' },
  recon: { id: 'recon', name: 'Reconnaissance Techniques', short: 'Recon', weightPct: 21, color: '#48cae4' },
  system: { id: 'system', name: 'System Hacking Phases and Attack Techniques', short: 'System', weightPct: 17, color: '#ff2bd6' },
  network: { id: 'network', name: 'Network and Perimeter Hacking', short: 'Network', weightPct: 14, color: '#9d4edd' },
  web: { id: 'web', name: 'Web Application Hacking', short: 'Web', weightPct: 16, color: '#39ff14' },
  wireless: { id: 'wireless', name: 'Wireless Network Hacking', short: 'Wireless', weightPct: 6, color: '#ffcc00' },
  'mobile-iot': { id: 'mobile-iot', name: 'Mobile Platform, IoT, and OT Hacking', short: 'Mobile/IoT', weightPct: 8, color: '#ff9e00' },
  cloud: { id: 'cloud', name: 'Cloud Computing', short: 'Cloud', weightPct: 6, color: '#00b4d8' },
  crypto: { id: 'crypto', name: 'Cryptography', short: 'Crypto', weightPct: 6, color: '#ff3366' },
  beyond: { id: 'beyond', name: 'CEH+ Practical Tracks', short: 'CEH+', weightPct: 0, color: '#ff3366' },
}

// ---- 20 CEH modules ----
export const MODULES: ModuleMeta[] = [
  { module: 1, name: 'Introduction to Ethical Hacking', short: 'Intro & Ethics', domain: 'overview', district: 'gate' },
  { module: 2, name: 'Footprinting and Reconnaissance', short: 'Footprinting', domain: 'recon', district: 'ghost-market' },
  { module: 3, name: 'Scanning Networks', short: 'Scanning', domain: 'recon', district: 'ghost-market' },
  { module: 4, name: 'Enumeration', short: 'Enumeration', domain: 'recon', district: 'ghost-market' },
  { module: 5, name: 'Vulnerability Analysis', short: 'Vuln Analysis', domain: 'system', district: 'root-alley' },
  { module: 6, name: 'System Hacking', short: 'System Hacking', domain: 'system', district: 'root-alley' },
  { module: 7, name: 'Malware Threats', short: 'Malware', domain: 'system', district: 'root-alley' },
  { module: 8, name: 'Sniffing', short: 'Sniffing', domain: 'network', district: 'firewall-ring' },
  { module: 9, name: 'Social Engineering', short: 'Social Eng', domain: 'network', district: 'firewall-ring' },
  { module: 10, name: 'Denial-of-Service', short: 'DoS / DDoS', domain: 'network', district: 'firewall-ring' },
  { module: 11, name: 'Session Hijacking', short: 'Session Hijack', domain: 'network', district: 'firewall-ring' },
  { module: 12, name: 'Evading IDS, Firewalls, and Honeypots', short: 'Evasion & IDS', domain: 'network', district: 'firewall-ring' },
  { module: 13, name: 'Hacking Web Servers', short: 'Web Servers', domain: 'web', district: 'web-alley' },
  { module: 14, name: 'Hacking Web Applications', short: 'Web Apps', domain: 'web', district: 'web-alley' },
  { module: 15, name: 'SQL Injection', short: 'SQL Injection', domain: 'web', district: 'web-alley' },
  { module: 16, name: 'Hacking Wireless Networks', short: 'Wireless', domain: 'wireless', district: 'neon-airspace' },
  { module: 17, name: 'Hacking Mobile Platforms', short: 'Mobile', domain: 'mobile-iot', district: 'neon-airspace' },
  { module: 18, name: 'IoT and OT Hacking', short: 'IoT / OT', domain: 'mobile-iot', district: 'neon-airspace' },
  { module: 19, name: 'Cloud Computing', short: 'Cloud', domain: 'cloud', district: 'cloud-spire' },
  { module: 20, name: 'Cryptography', short: 'Cryptography', domain: 'crypto', district: 'cloud-spire' },
]

// ---- Cyberpunk districts (secondary navigation layer) ----
export const DISTRICTS: DistrictMeta[] = [
  { id: 'gate', name: 'Gate District', blurb: 'Ethics, scope & methodology', color: '#00f5ff', glyph: '⚿', modules: [1] },
  { id: 'ghost-market', name: 'Ghost Market', blurb: 'Recon, scanning & OSINT', color: '#48cae4', glyph: '☡', modules: [2, 3, 4] },
  { id: 'root-alley', name: 'Root Alley', blurb: 'System, vulnerabilities & malware', color: '#ff2bd6', glyph: '⌥', modules: [5, 6, 7] },
  { id: 'firewall-ring', name: 'Firewall Ring', blurb: 'Network, perimeter & defense', color: '#9d4edd', glyph: '⊟', modules: [8, 9, 10, 11, 12] },
  { id: 'web-alley', name: 'Web Alley', blurb: 'Web servers, apps & injection', color: '#39ff14', glyph: '⧉', modules: [13, 14, 15] },
  { id: 'neon-airspace', name: 'Neon Airspace', blurb: 'Wireless, mobile, IoT & OT', color: '#ffcc00', glyph: '⏦', modules: [16, 17, 18] },
  { id: 'cloud-spire', name: 'Cloud Spire', blurb: 'Cloud & cryptography', color: '#00b4d8', glyph: '⛁', modules: [19, 20] },
  { id: 'beyond-district', name: 'Beyond District', blurb: 'CEH+ real-world practical tracks', color: '#ff3366', glyph: '❖', modules: [] },
]

// ---- CEH+ tracks (module 0) ----
export const TRACKS: Record<TrackKey, TrackMeta> = {
  pentest: { key: 'pentest', name: 'Pentest Engagement Workflow', short: 'Pentest', blurb: 'Scope, RoE, evidence, finding triage, reporting.' },
  appsec: { key: 'appsec', name: 'AppSec Code Review', short: 'AppSec', blurb: 'Authz, input validation, secrets, dependency risk.' },
  cloud: { key: 'cloud', name: 'Cloud IAM / Config Review', short: 'Cloud Review', blurb: 'Least privilege, exposure, logging, encryption.' },
  soc: { key: 'soc', name: 'SOC Log Investigation', short: 'SOC', blurb: 'Timeline, indicators, scoping, containment.' },
  ir: { key: 'ir', name: 'Incident Response', short: 'IR', blurb: 'Lifecycle, containment, evidence preservation.' },
  'threat-model': { key: 'threat-model', name: 'Threat Modeling & Remediation', short: 'Threat Model', blurb: 'Assets, trust boundaries, STRIDE, mitigations.' },
}

// ---- Rank ladder (XP-driven, light gamification) ----
export interface Rank {
  min: number
  title: string
  glyph: string
}
export const RANKS: Rank[] = [
  { min: 0, title: 'Script Rookie', glyph: '▷' },
  { min: 300, title: 'Packet Runner', glyph: '⇢' },
  { min: 800, title: 'Recon Agent', glyph: '◈' },
  { min: 1600, title: 'Signal Breaker', glyph: '⌁' },
  { min: 2800, title: 'Web Defender', glyph: '⛨' },
  { min: 4400, title: 'Cloud Sentinel', glyph: '☁' },
  { min: 6500, title: 'Cipher Adept', glyph: '❈' },
  { min: 9000, title: 'Certified Neon Hunter', glyph: '◉' },
]

// ---- XP rewards ----
export const XP = {
  answerCorrect: 10,
  answerWrong: 3,
  reviewDone: 8,
  reviewGraded: 4,
  mockComplete: 60,
  mockPass: 120,
  mistakeLogged: 6,
  labReport: 40,
  dailyGoalMet: 25,
} as const

// ---- Badge catalogue (earning logic lives in lib/badges.ts) ----
export interface BadgeMeta {
  id: string
  name: string
  desc: string
  glyph: string
}
export const BADGES: BadgeMeta[] = [
  { id: 'first-contact', name: 'First Contact', desc: 'Answer your first question.', glyph: '◉' },
  { id: 'scope-keeper', name: 'Scope Keeper', desc: 'Complete the Ethics & scope module.', glyph: '⚖' },
  { id: 'osint-scout', name: 'OSINT Scout', desc: 'Reach 80% mastery in Reconnaissance.', glyph: '☡' },
  { id: 'packet-reader', name: 'Packet Reader', desc: '80% accuracy in the Sniffing module.', glyph: '📡' },
  { id: 'web-guardian', name: 'Web Guardian', desc: '80% mastery across the Web domain.', glyph: '⧉' },
  { id: 'crypto-adept', name: 'Crypto Adept', desc: '80% mastery in Cryptography.', glyph: '❈' },
  { id: 'cloud-sentinel', name: 'Cloud Sentinel', desc: '80% mastery in Cloud Computing.', glyph: '⛁' },
  { id: 'centurion', name: 'Centurion', desc: 'Log 100 answered questions.', glyph: 'Ⅽ' },
  { id: 'flawless', name: 'Flawless Run', desc: '100% on a review session of 10+.', glyph: '✦' },
  { id: 'retention-engine', name: 'Retention Engine', desc: 'Clear a full daily review queue.', glyph: '↻' },
  { id: 'streak-7', name: 'Neon Streak', desc: 'Maintain a 7-day study streak.', glyph: '⟡' },
  { id: 'mock-slayer', name: 'Mock Exam Slayer', desc: 'Pass a full 125-question mock exam.', glyph: '☠' },
  { id: 'report-master', name: 'Report Master', desc: 'Submit a lab remediation report.', glyph: '⎙' },
]

// ---- Mock exam presets ----
export interface ExamPreset {
  id: string
  label: string
  count: number
  minutes: number
  desc: string
}
export const EXAM = {
  passMarkDefault: 70, // CEH cut scores vary 65-85% by form; target high
  presets: <ExamPreset[]>[
    { id: 'full', label: 'Full Exam', count: 125, minutes: 240, desc: 'CEH format — 125 questions, 4 hours, domain-weighted.' },
    { id: 'half', label: 'Half Length', count: 63, minutes: 120, desc: 'Half exam, 2 hours — same domain weighting.' },
    { id: 'quick', label: 'Quick Sim', count: 25, minutes: 45, desc: 'Fast confidence check across all domains.' },
    { id: 'weak', label: 'Weakness Focus', count: 40, minutes: 70, desc: 'Draws heavily from your weakest domains.' },
  ],
}

// ---- Lookup helpers ----
const MODULE_BY_ID = new Map(MODULES.map((m) => [m.module, m]))
const DISTRICT_BY_ID = new Map(DISTRICTS.map((d) => [d.id, d]))

export function moduleMeta(module: number): ModuleMeta | undefined {
  return MODULE_BY_ID.get(module)
}
export function districtMeta(id: DistrictId): DistrictMeta | undefined {
  return DISTRICT_BY_ID.get(id)
}
export function rankFor(xp: number): { rank: Rank; next: Rank | null; index: number } {
  let index = 0
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].min) index = i
  }
  return { rank: RANKS[index], next: RANKS[index + 1] ?? null, index }
}
