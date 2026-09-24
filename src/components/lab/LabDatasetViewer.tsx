import { useMemo, useState } from 'react'
import type { Lab } from '../../data/labs'
import { useStore } from '../../store/useStore'
import { ANALYSIS_TYPES } from '../../lib/analysisChallenges'
import { evidenceFromLabLines, formatLineRange, normalizeLineSelection } from '../../lib/labReport'
import { Panel } from '../ui/Panel'

interface LabDatasetViewerProps {
  lab: Lab
  onOpenReport: () => void
}

/**
 * Line-numbered viewer for a lab's synthetic artifact. Learners select the lines that prove a
 * finding and send them to the Evidence Vault, optionally citing them in the lab report.
 */
export function LabDatasetViewer({ lab, onOpenReport }: LabDatasetViewerProps) {
  const upsertEvidence = useStore((state) => state.upsertEvidence)
  const sendEvidenceToLabReport = useStore((state) => state.sendEvidenceToLabReport)
  const lines = useMemo(() => lab.evidence.split('\n'), [lab.evidence])
  const [selected, setSelected] = useState<number[]>([])
  const [status, setStatus] = useState<{ text: string; report: boolean } | null>(null)
  const analysis = lab.analysis ? ANALYSIS_TYPES[lab.analysis.type] : null
  const selection = normalizeLineSelection(selected, lines.length)

  const toggle = (line: number) => {
    setSelected((current) => current.includes(line) ? current.filter((value) => value !== line) : [...current, line])
    setStatus(null)
  }

  const capture = (cite: boolean) => {
    const item = evidenceFromLabLines(lab, selection)
    if (!item) {
      setStatus({ text: 'Select at least one artifact line first.', report: false })
      return
    }
    if (cite) {
      const reportId = sendEvidenceToLabReport(item)
      setStatus(reportId
        ? { text: `${formatLineRange(selection)} saved to the Vault and cited in the lab report.`, report: true }
        : { text: 'The evidence could not be linked. Reload the lab and try again.', report: false })
    } else {
      upsertEvidence(item)
      setStatus({ text: `${formatLineRange(selection)} saved to the Evidence Vault as a log excerpt.`, report: false })
    }
    setSelected([])
  }

  return (
    <Panel
      title={lab.evidenceTitle}
      right={analysis ? <span className="badge badge--cyan">{analysis.label}</span> : undefined}
    >
      {analysis && (
        <p className="term t-xs dim mb-2">
          {analysis.artifact} · focus: {analysis.focus}
        </p>
      )}
      <div
        className="dataset-view"
        role="group"
        aria-label={`${lab.evidenceTitle} lines. Select lines to capture as evidence.`}
      >
        {lines.map((text, index) => {
          const line = index + 1
          const active = selection.includes(line)
          return (
            <button
              key={line}
              type="button"
              className={`dataset-view__line ${active ? 'is-selected' : ''}`}
              aria-pressed={active}
              onClick={() => toggle(line)}
            >
              <span className="dataset-view__no">{line}</span>
              <code className="dataset-view__text">{text || ' '}</code>
            </button>
          )
        })}
      </div>
      <div className="row row--between wrap mt-2" style={{ gap: '0.5rem' }}>
        <span className="term t-xs dim">
          {selection.length > 0 ? `Selected ${formatLineRange(selection)}` : 'Click lines that support your finding.'}
        </span>
        <div className="row wrap" style={{ gap: '0.4rem' }}>
          <button className="btn btn--ghost btn--sm" type="button" disabled={selection.length === 0} onClick={() => capture(false)}>
            Save to Vault
          </button>
          <button className="btn btn--primary btn--sm" type="button" disabled={selection.length === 0} onClick={() => capture(true)}>
            Send to report
          </button>
        </div>
      </div>
      {status && (
        <div className="row wrap mt-2" style={{ gap: '0.5rem' }} role="status">
          <span className="term t-xs neon-green">{status.text}</span>
          {status.report && (
            <button className="btn btn--ghost btn--sm" type="button" onClick={onOpenReport}>
              Open report →
            </button>
          )}
        </div>
      )}
    </Panel>
  )
}
