import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { LABS } from '../data/labs'
import { useStore } from '../store/useStore'
import { formatDateTime } from '../lib/format'
import { EVIDENCE_TYPE_LABELS, evidenceForChallenge } from '../lib/evidence'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { EmptyState } from '../components/ui/EmptyState'

export function EvidenceVault() {
  const evidenceItems = useStore((state) => state.evidenceItems)
  const groups = useMemo(() => {
    const labById = new Map(LABS.map((lab) => [lab.id, lab]))
    return [...new Set(evidenceItems.map((item) => item.challengeId))]
      .map((challengeId) => ({
        challengeId,
        lab: labById.get(challengeId),
        items: evidenceForChallenge(evidenceItems, challengeId),
      }))
      .sort((a, b) => (a.lab?.title ?? a.challengeId).localeCompare(b.lab?.title ?? b.challengeId))
  }, [evidenceItems])

  return (
    <div className="page">
      <PageHeader
        eyebrow="Practical // Evidence"
        title="Evidence Vault"
        sub="Review locally stored observations by challenge, then cite them from report findings."
        actions={
          <>
            <Link className="btn btn--ghost btn--sm" to="/reports">Open reports</Link>
            <Link className="btn btn--primary btn--sm" to="/labs">＋ Open a lab</Link>
          </>
        }
      />

      <Panel className="mb-3" style={{ borderColor: 'rgba(255,204,0,0.4)' }}>
        <div className="panel__title" style={{ color: 'var(--warning-amber)' }}>
          Private local material
        </div>
        <p className="t-sm muted" style={{ marginBottom: 0 }}>
          Vault entries are included in private full backups and excluded from public-safe progress exports. Keep every
          entry synthetic: no real credentials, personal data, customer data, production logs, or system secrets.
        </p>
      </Panel>

      {groups.length === 0 ? (
        <Panel>
          <EmptyState
            glyph="◇"
            title="No evidence yet"
            hint="Open a Safe Lab, acknowledge its scope contract, and add your first synthetic observation."
          >
            <Link className="btn btn--primary" to="/labs">Open Safe Labs</Link>
          </EmptyState>
        </Panel>
      ) : (
        <div className="stack">
          {groups.map(({ challengeId, lab, items }) => (
            <Panel
              key={challengeId}
              title={lab?.title ?? challengeId}
              right={
                <div className="row wrap" style={{ gap: '0.4rem' }}>
                  <span className="badge badge--cyan">{items.length} items</span>
                  {lab && <Link className="btn btn--ghost btn--sm" to={`/labs/${encodeURIComponent(lab.id)}`}>Open / edit</Link>}
                </div>
              }
            >
              <div className="stack stack--sm">
                {items.map((item) => (
                  <article key={item.id} style={{ borderTop: '1px dashed var(--hairline)', paddingTop: '0.75rem' }}>
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
                  </article>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  )
}
