import { useMemo, useState, type FormEvent } from 'react'
import type { EvidenceItem, EvidenceType } from '../../types'
import { useStore } from '../../store/useStore'
import { uid } from '../../lib/id'
import { formatDateTime } from '../../lib/format'
import {
  EVIDENCE_TYPES,
  EVIDENCE_TYPE_LABELS,
  evidenceForChallenge,
} from '../../lib/evidence'
import { Panel } from '../ui/Panel'

interface EvidenceForm {
  title: string
  type: EvidenceType
  note: string
  source: string
  reference: string
  timestamp: string
}

interface ChallengeEvidenceVaultProps {
  challengeId: string
  challengeTitle: string
  defaultSource: string
  onOpenReport: () => void
}

function toLocalDateTime(timestamp: number): string {
  const date = new Date(timestamp)
  if (!Number.isFinite(date.getTime())) return ''
  const local = new Date(timestamp - date.getTimezoneOffset() * 60_000)
  return Number.isFinite(local.getTime()) ? local.toISOString().slice(0, 16) : ''
}

function blankForm(source: string): EvidenceForm {
  return {
    title: '',
    type: 'observation',
    note: '',
    source,
    reference: '',
    timestamp: toLocalDateTime(Date.now()),
  }
}

function formFromItem(item: EvidenceItem): EvidenceForm {
  return {
    title: item.title,
    type: item.type,
    note: item.note,
    source: item.source,
    reference: item.reference,
    timestamp: toLocalDateTime(item.timestamp),
  }
}

export function ChallengeEvidenceVault({
  challengeId,
  challengeTitle,
  defaultSource,
  onOpenReport,
}: ChallengeEvidenceVaultProps) {
  const allItems = useStore((state) => state.evidenceItems)
  const upsertEvidence = useStore((state) => state.upsertEvidence)
  const deleteEvidence = useStore((state) => state.deleteEvidence)
  const items = useMemo(() => evidenceForChallenge(allItems, challengeId), [allItems, challengeId])

  const [form, setForm] = useState<EvidenceForm | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const startNew = () => {
    setEditingId(null)
    setForm(blankForm(defaultSource))
    setError('')
  }

  const startEdit = (item: EvidenceItem) => {
    setEditingId(item.id)
    setForm(formFromItem(item))
    setError('')
  }

  const cancel = () => {
    setEditingId(null)
    setForm(null)
    setError('')
  }

  const save = (event: FormEvent) => {
    event.preventDefault()
    if (!form) return

    const timestamp = new Date(form.timestamp).getTime()
    const validTimestamp = Number.isFinite(timestamp)
      && timestamp > 0
      && Number.isFinite(new Date(timestamp).getTime())
    if (!form.title.trim() || !form.note.trim() || !form.source.trim() || !validTimestamp) {
      setError('Title, note, source, and a valid timestamp are required.')
      return
    }

    const existing = editingId ? items.find((item) => item.id === editingId) : undefined
    const now = Date.now()
    upsertEvidence({
      id: existing?.id ?? uid('ev-'),
      challengeId,
      title: form.title.trim(),
      type: form.type,
      note: form.note.trim(),
      source: form.source.trim(),
      reference: form.reference.trim(),
      timestamp,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    })
    cancel()
  }

  const remove = (item: EvidenceItem) => {
    if (!window.confirm(`Delete evidence “${item.title}”? Report links to it will also be removed.`)) return
    deleteEvidence(item.id)
    if (editingId === item.id) cancel()
  }

  return (
    <Panel
      title="Evidence Vault"
      right={
        <button className="btn btn--primary btn--sm" onClick={startNew}>
          ＋ Add evidence
        </button>
      }
    >
      <div
        className="t-sm mb-3"
        role="note"
        style={{
          color: 'var(--warning-amber)',
          border: '1px solid rgba(255,204,0,0.35)',
          borderRadius: 'var(--r-md)',
          background: 'rgba(255,204,0,0.06)',
          padding: '0.75rem 0.85rem',
        }}
      >
        Sensitive data warning: store only synthetic or intentionally prepared training material. Never save real
        credentials, personal data, customer data, production logs, or system secrets here.
      </div>

      <div className="row row--between wrap mb-2" style={{ gap: '0.5rem' }}>
        <span className="term t-xs dim">
          Challenge: {challengeTitle} · {items.length} item{items.length === 1 ? '' : 's'}
        </span>
        <button className="btn btn--ghost btn--sm" onClick={onOpenReport} disabled={items.length === 0}>
          Link in report →
        </button>
      </div>

      {form && (
        <form onSubmit={save} className="panel mb-3" style={{ background: 'var(--panel-inset)' }}>
          <div className="row wrap" style={{ gap: '0.6rem' }}>
            <div className="field grow" style={{ minWidth: 220 }}>
              <label className="label" htmlFor="evidence-title">Title</label>
              <input
                id="evidence-title"
                className="input"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="What does this item prove?"
                required
              />
            </div>
            <div className="field" style={{ width: 180 }}>
              <label className="label" htmlFor="evidence-type">Type</label>
              <select
                id="evidence-type"
                className="select"
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value as EvidenceType })}
              >
                {EVIDENCE_TYPES.map((type) => (
                  <option key={type} value={type}>{EVIDENCE_TYPE_LABELS[type]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="row wrap" style={{ gap: '0.6rem' }}>
            <div className="field grow" style={{ minWidth: 220 }}>
              <label className="label" htmlFor="evidence-source">Source</label>
              <input
                id="evidence-source"
                className="input"
                value={form.source}
                onChange={(event) => setForm({ ...form, source: event.target.value })}
                placeholder="Synthetic artifact or observation source"
                required
              />
            </div>
            <div className="field" style={{ minWidth: 210 }}>
              <label className="label" htmlFor="evidence-timestamp">Captured at</label>
              <input
                id="evidence-timestamp"
                className="input"
                type="datetime-local"
                value={form.timestamp}
                onChange={(event) => setForm({ ...form, timestamp: event.target.value })}
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="evidence-reference">File path / screenshot reference (optional)</label>
            <input
              id="evidence-reference"
              className="input"
              value={form.reference}
              onChange={(event) => setForm({ ...form, reference: event.target.value })}
              placeholder="artifacts/synthetic-auth-log.txt or screenshot-01.png"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="evidence-note">Evidence note</label>
            <textarea
              id="evidence-note"
              className="textarea"
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
              placeholder="Describe the observation and why it supports a finding."
              required
            />
          </div>

          {error && <p className="term t-xs neon-red mb-2" role="alert">{error}</p>}
          <div className="row wrap" style={{ gap: '0.5rem' }}>
            <button className="btn btn--green btn--sm" type="submit">
              {editingId ? 'Save changes' : 'Save evidence'}
            </button>
            <button className="btn btn--ghost btn--sm" type="button" onClick={cancel}>Cancel</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="term t-xs dim" style={{ marginBottom: 0 }}>
          No evidence recorded for this challenge yet. Add an observation before drafting the finding.
        </p>
      ) : (
        <div className="stack stack--sm">
          {items.map((item) => (
            <article key={item.id} className="panel" style={{ background: 'var(--panel-inset)', padding: '0.8rem 0.9rem' }}>
              <div className="row row--between wrap" style={{ gap: '0.5rem' }}>
                <div className="row wrap" style={{ gap: '0.4rem' }}>
                  <span className="badge badge--cyan">{EVIDENCE_TYPE_LABELS[item.type]}</span>
                  <strong className="t-sm">{item.title}</strong>
                </div>
                <span className="term t-xs dim">{formatDateTime(item.timestamp)}</span>
              </div>
              <p className="term t-xs muted mt-2" style={{ whiteSpace: 'pre-wrap' }}>{item.note}</p>
              <div className="row wrap mt-2" style={{ gap: '0.4rem' }}>
                <span className="badge">source: {item.source}</span>
                {item.reference && <span className="badge badge--purple">ref: {item.reference}</span>}
              </div>
              <div className="row wrap mt-2" style={{ gap: '0.4rem' }}>
                <button className="btn btn--ghost btn--sm" onClick={() => startEdit(item)}>Edit</button>
                <button className="btn btn--danger btn--sm" onClick={() => remove(item)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Panel>
  )
}
