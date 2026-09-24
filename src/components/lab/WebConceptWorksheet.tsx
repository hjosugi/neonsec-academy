import { useState } from 'react'
import type { Lab } from '../../data/labs'
import type { Severity } from '../../types'
import { useStore } from '../../store/useStore'
import {
  WEB_CONCEPTS,
  WORKSHEET_FIELDS,
  WORKSHEET_LABELS,
  WORKSHEET_MIN_LENGTH,
  worksheetStatus,
  type WorksheetField,
} from '../../lib/webConcept'
import { formatDateTime } from '../../lib/format'
import { Panel } from '../ui/Panel'

const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'info']

const PLACEHOLDERS: Record<WorksheetField, string> = {
  finding: 'Name the flaw and cite the exact request/response evidence.',
  impact: 'Who is affected and what could happen in this fictional app?',
  remediation: 'The server-side or configuration fix, plus how you would verify it.',
}

interface WebConceptWorksheetProps {
  lab: Lab
  onOpenReport: () => void
}

/** Finding / impact / remediation worksheet required by every web concept lab (P4-005). */
export function WebConceptWorksheet({ lab, onOpenReport }: WebConceptWorksheetProps) {
  const saved = useStore((state) => state.labWorksheets.find((item) => item.labId === lab.id))
  const saveLabWorksheet = useStore((state) => state.saveLabWorksheet)
  const addWorksheetToReport = useStore((state) => state.addWorksheetToReport)
  const [draft, setDraft] = useState<Record<WorksheetField, string>>(() => ({
    finding: saved?.finding ?? '',
    impact: saved?.impact ?? '',
    remediation: saved?.remediation ?? '',
  }))
  const [severity, setSeverity] = useState<Severity>(lab.modelFindings[0]?.severity ?? 'medium')
  const [message, setMessage] = useState<{ text: string; report: boolean } | null>(null)
  const status = worksheetStatus(draft)
  const dirty = WORKSHEET_FIELDS.some((field) => draft[field].trim() !== (saved?.[field] ?? ''))
  const concept = lab.webConcept ? WEB_CONCEPTS[lab.webConcept.concept] : null

  const save = () => {
    saveLabWorksheet({ labId: lab.id, ...draft })
    setMessage({ text: 'Worksheet saved locally.', report: false })
  }

  const addToReport = () => {
    saveLabWorksheet({ labId: lab.id, ...draft })
    const reportId = addWorksheetToReport(lab.id, severity)
    setMessage(reportId
      ? { text: 'Worksheet added to the lab report as a finding.', report: true }
      : { text: `Complete every field (at least ${WORKSHEET_MIN_LENGTH} characters) first.`, report: false })
  }

  return (
    <Panel
      title="Finding Worksheet"
      right={
        <span className={`badge ${status.complete ? 'badge--green' : 'badge--amber'}`}>
          {status.complete ? 'complete' : `${WORKSHEET_FIELDS.length - status.missing.length}/${WORKSHEET_FIELDS.length}`}
        </span>
      }
    >
      {concept && (
        <p className="term t-xs dim mb-2">
          Concept: {concept.label} · {concept.focus}
        </p>
      )}
      {WORKSHEET_FIELDS.map((field) => (
        <div className="field" key={field}>
          <label className="label" htmlFor={`worksheet-${lab.id}-${field}`}>
            {WORKSHEET_LABELS[field]}
            {status.missing.includes(field) ? ' (required)' : ' ✓'}
          </label>
          <textarea
            id={`worksheet-${lab.id}-${field}`}
            className="textarea"
            style={{ minHeight: 58 }}
            value={draft[field]}
            placeholder={PLACEHOLDERS[field]}
            maxLength={4000}
            onChange={(event) => {
              setDraft((current) => ({ ...current, [field]: event.target.value }))
              setMessage(null)
            }}
          />
        </div>
      ))}
      <div className="row wrap" style={{ gap: '0.5rem', alignItems: 'flex-end' }}>
        <button className="btn btn--ghost btn--sm" type="button" onClick={save} disabled={!dirty}>
          Save worksheet
        </button>
        <div className="field" style={{ margin: 0, width: 130 }}>
          <label className="label" htmlFor={`worksheet-${lab.id}-severity`}>Severity</label>
          <select
            id={`worksheet-${lab.id}-severity`}
            className="select"
            value={severity}
            onChange={(event) => setSeverity(event.target.value as Severity)}
          >
            {SEVERITIES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <button className="btn btn--primary btn--sm" type="button" onClick={addToReport} disabled={!status.complete}>
          Add to report
        </button>
      </div>
      {saved && (
        <p className="term t-xs dim mt-2" style={{ marginBottom: 0 }}>Last saved {formatDateTime(saved.updatedAt)}</p>
      )}
      {message && (
        <div className="row wrap mt-2" style={{ gap: '0.5rem' }} role="status">
          <span className={`term t-xs ${message.report || message.text.startsWith('Worksheet saved') ? 'neon-green' : 'neon-amber'}`}>
            {message.text}
          </span>
          {message.report && (
            <button className="btn btn--ghost btn--sm" type="button" onClick={onOpenReport}>Open report →</button>
          )}
        </div>
      )}
    </Panel>
  )
}
