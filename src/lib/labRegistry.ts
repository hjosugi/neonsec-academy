import type { FlagChallengeAssetKind, Lab, LabKind } from '../data/labs'
import { canonicalFlag, isExpectedFlagValid } from './flagChallenge'
import { isAnalysisType } from './analysisChallenges'
import { isWebConcept } from './webConcept'
import { scanSensitiveText, type SafetyHitKind } from './contentSafety'

export const LAB_KINDS: LabKind[] = ['local', 'dataset', 'simulated', 'writeup']
export const FLAG_ASSET_KINDS: FlagChallengeAssetKind[] = [
  'log',
  'config',
  'request-response',
  'capture',
  'headers',
  'architecture',
]

export interface LabRegistryError {
  labId: string
  field: string
  kind: 'schema' | 'public-ip' | 'real-email' | 'live-domain' | 'credential'
  message: string
  value?: string
}

function textFields(lab: Lab): Array<[string, string]> {
  const fields: Array<[string, string]> = [
    ['title', lab.title],
    ['category', lab.category],
    ['brief', lab.brief],
    ['scope.allowed', lab.scope.allowed.join('\n')],
    ['scope.forbidden', lab.scope.forbidden.join('\n')],
    ['evidenceTitle', lab.evidenceTitle],
    ['evidence', lab.evidence],
    ['objectives', lab.objectives.join('\n')],
    ['guiding', lab.guiding.map((item) => `${item.q}\n${item.a}`).join('\n')],
    ['modelFindings', lab.modelFindings.map((finding) => `${finding.title}\n${finding.impact}\n${finding.remediation}`).join('\n')],
  ]
  if (lab.flagChallenge) {
    const challenge = lab.flagChallenge
    fields.push(
      ['flagChallenge.prompt', typeof challenge.prompt === 'string' ? challenge.prompt : ''],
      [
        'flagChallenge.assets',
        Array.isArray(challenge.assets)
          ? challenge.assets.map((asset) => `${asset?.label ?? ''}\n${asset?.description ?? ''}`).join('\n')
          : '',
      ],
      ['flagChallenge.expectedFlag', typeof challenge.expectedFlag === 'string' ? challenge.expectedFlag : ''],
      ['flagChallenge.hints', Array.isArray(challenge.hints) ? challenge.hints.join('\n') : ''],
      ['flagChallenge.explanation', typeof challenge.explanation === 'string' ? challenge.explanation : ''],
      ['flagChallenge.remediation', typeof challenge.remediation === 'string' ? challenge.remediation : ''],
      ['flagChallenge.reportPrompt', typeof challenge.reportPrompt === 'string' ? challenge.reportPrompt : ''],
    )
  }
  if (lab.webConcept) {
    fields.push([
      'webConcept.unsafeTargetWarning',
      typeof lab.webConcept.unsafeTargetWarning === 'string' ? lab.webConcept.unsafeTargetWarning : '',
    ])
  }
  if (lab.analysis) {
    fields.push(
      ['analysis.detection', typeof lab.analysis.detection === 'string' ? lab.analysis.detection : ''],
      ['analysis.prevention', typeof lab.analysis.prevention === 'string' ? lab.analysis.prevention : ''],
    )
  }
  return fields
}

const HIT_KIND: Record<SafetyHitKind, LabRegistryError['kind']> = {
  'public-ip': 'public-ip',
  'real-email': 'real-email',
  'live-domain': 'live-domain',
  'live-url': 'live-domain',
  credential: 'credential',
  'private-key': 'credential',
  'access-token': 'credential',
}

const HIT_MESSAGE: Record<LabRegistryError['kind'], string> = {
  schema: 'Schema error.',
  'public-ip': 'Public IP is not allowed in lab metadata.',
  'real-email': 'Email must use a safe training domain.',
  'live-domain': 'Domain must be a safe training domain.',
  credential: 'Credential-like assignment must be a placeholder.',
}

function scanUnsafeText(lab: Lab, errors: LabRegistryError[]) {
  for (const [field, value] of textFields(lab)) {
    for (const hit of scanSensitiveText(value, { domains: 'strict' })) {
      const kind = HIT_KIND[hit.kind]
      errors.push({ labId: lab.id, field, kind, message: HIT_MESSAGE[kind], value: hit.value })
    }
  }
}

export function validateLabRegistry(labs: Lab[]): LabRegistryError[] {
  const errors: LabRegistryError[] = []
  const ids = new Set<string>()
  const expectedFlags = new Set<string>()

  for (const lab of labs) {
    if (!lab.id.trim()) errors.push({ labId: lab.id || '<missing>', field: 'id', kind: 'schema', message: 'Lab id is required.' })
    if (ids.has(lab.id)) errors.push({ labId: lab.id, field: 'id', kind: 'schema', message: 'Lab id must be unique.' })
    ids.add(lab.id)

    if (!LAB_KINDS.includes(lab.kind)) {
      errors.push({ labId: lab.id, field: 'kind', kind: 'schema', message: `Lab kind must be one of ${LAB_KINDS.join(', ')}.` })
    }
    if (lab.scope.allowed.length === 0) {
      errors.push({ labId: lab.id, field: 'scope.allowed', kind: 'schema', message: 'Allowed scope must not be empty.' })
    }
    if (lab.scope.forbidden.length === 0) {
      errors.push({ labId: lab.id, field: 'scope.forbidden', kind: 'schema', message: 'Forbidden scope must not be empty.' })
    }
    if (!lab.evidenceTitle.trim() || !lab.evidence.trim()) {
      errors.push({ labId: lab.id, field: 'evidence', kind: 'schema', message: 'Evidence title and evidence are required.' })
    }
    if (!lab.flagChallenge) {
      errors.push({ labId: lab.id, field: 'flagChallenge', kind: 'schema', message: 'Flag challenge metadata is required.' })
    } else {
      const challenge = lab.flagChallenge
      const requiredText = [challenge.prompt, challenge.explanation, challenge.remediation, challenge.reportPrompt]
      if (requiredText.some((value) => typeof value !== 'string' || !value.trim())) {
        errors.push({
          labId: lab.id,
          field: 'flagChallenge',
          kind: 'schema',
          message: 'Prompt, explanation, remediation, and report prompt are required.',
        })
      }
      if (!Array.isArray(challenge.assets) || challenge.assets.length === 0) {
        errors.push({ labId: lab.id, field: 'flagChallenge.assets', kind: 'schema', message: 'At least one local asset is required.' })
      } else {
        const assetIds = new Set<string>()
        for (const asset of challenge.assets) {
          if (
            !asset
            || typeof asset.id !== 'string'
            || typeof asset.label !== 'string'
            || typeof asset.description !== 'string'
            || !asset.id.trim()
            || !asset.label.trim()
            || !asset.description.trim()
          ) {
            errors.push({ labId: lab.id, field: 'flagChallenge.assets', kind: 'schema', message: 'Every asset needs an id, label, and description.' })
            continue
          }
          if (assetIds.has(asset.id)) {
            errors.push({ labId: lab.id, field: 'flagChallenge.assets', kind: 'schema', message: 'Asset ids must be unique within a challenge.' })
          }
          assetIds.add(asset.id)
          if (!FLAG_ASSET_KINDS.includes(asset.kind)) {
            errors.push({ labId: lab.id, field: 'flagChallenge.assets.kind', kind: 'schema', message: 'Asset kind is invalid.' })
          }
        }
      }
      if (
        !Array.isArray(challenge.hints)
        || challenge.hints.length === 0
        || challenge.hints.some((hint) => typeof hint !== 'string' || !hint.trim())
      ) {
        errors.push({ labId: lab.id, field: 'flagChallenge.hints', kind: 'schema', message: 'At least one non-empty hint is required.' })
      }
      if (!isExpectedFlagValid(challenge.expectedFlag)) {
        errors.push({
          labId: lab.id,
          field: 'flagChallenge.expectedFlag',
          kind: 'schema',
          message: 'Expected flag must use FLAG{UPPER_SNAKE_CASE} format.',
        })
      } else {
        const expectedFlag = canonicalFlag(challenge.expectedFlag)!
        if (expectedFlags.has(expectedFlag)) {
          errors.push({ labId: lab.id, field: 'flagChallenge.expectedFlag', kind: 'schema', message: 'Expected flags must be unique.' })
        }
        expectedFlags.add(expectedFlag)
      }
    }
    if (lab.analysis !== undefined) {
      const analysis = lab.analysis
      if (!analysis || !isAnalysisType(analysis.type)) {
        errors.push({ labId: lab.id, field: 'analysis.type', kind: 'schema', message: 'Analysis challenge type is invalid.' })
      }
      if (
        !analysis
        || typeof analysis.detection !== 'string'
        || typeof analysis.prevention !== 'string'
        || !analysis.detection.trim()
        || !analysis.prevention.trim()
      ) {
        errors.push({
          labId: lab.id,
          field: 'analysis',
          kind: 'schema',
          message: 'Analysis challenges must explain both detection and prevention.',
        })
      }
    }
    if (lab.webConcept !== undefined) {
      const concept = lab.webConcept
      if (!concept || !isWebConcept(concept.concept)) {
        errors.push({ labId: lab.id, field: 'webConcept.concept', kind: 'schema', message: 'Web concept is invalid.' })
      }
      if (!concept || typeof concept.unsafeTargetWarning !== 'string' || !concept.unsafeTargetWarning.trim()) {
        errors.push({
          labId: lab.id,
          field: 'webConcept.unsafeTargetWarning',
          kind: 'schema',
          message: 'Web concept labs must show an unsafe target warning.',
        })
      }
      if (lab.kind !== 'simulated' && lab.kind !== 'local') {
        errors.push({ labId: lab.id, field: 'kind', kind: 'schema', message: 'Web concept labs must be simulated or local toy apps.' })
      }
      const staticAssets = Array.isArray(lab.flagChallenge?.assets)
        ? lab.flagChallenge.assets.filter((asset) => asset?.kind === 'request-response' || asset?.kind === 'headers')
        : []
      if (staticAssets.length === 0) {
        errors.push({
          labId: lab.id,
          field: 'flagChallenge.assets',
          kind: 'schema',
          message: 'Web concept labs must use a static request/response or headers asset.',
        })
      }
    }
    scanUnsafeText(lab, errors)
  }

  return errors
}
