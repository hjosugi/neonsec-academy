import { useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import samplePack from '../../seed_content/lab-packs/neon-starter-pack.json'
import { LABS } from '../data/labs'
import { UNSAFE_SAMPLE_LAB } from '../data/labAuditSamples'
import { useStore } from '../store/useStore'
import { previewLabPack, type LabPackPreview } from '../lib/labPacks'
import { APP_VERSION } from '../lib/appVersion'
import { AUDIT_RULES } from '../lib/labSafetyAudit'
import { formatDateTime } from '../lib/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'

const SAMPLE_JSON = JSON.stringify(samplePack, null, 2)
const UNSAFE_JSON = JSON.stringify({
  ...samplePack,
  id: 'unsafe-demo-pack',
  name: 'Unsafe demo pack (must be rejected)',
  labs: [UNSAFE_SAMPLE_LAB],
  safetyAudit: { rulesetVersion: 1, auditedAt: '2026-09-25', results: [{ labId: UNSAFE_SAMPLE_LAB.id, status: 'pass', blockers: 0, warnings: 0 }] },
}, null, 2)

export function LabPacks() {
  const packs = useStore((s) => s.labPacks)
  const installLabPack = useStore((s) => s.installLabPack)
  const uninstallLabPack = useStore((s) => s.uninstallLabPack)
  const [text, setText] = useState('')
  const [preview, setPreview] = useState<LabPackPreview | null>(null)
  const [message, setMessage] = useState('')

  const runPreview = (json: string) => {
    setText(json)
    setPreview(previewLabPack(json, APP_VERSION, LABS.map((lab) => lab.id)))
    setMessage('')
  }

  const loadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    runPreview(await file.text())
    event.target.value = ''
  }

  const install = () => {
    const result = installLabPack(text)
    setMessage(result.ok ? 'Pack installed after local validation and safety audit.' : `Import refused: ${result.errors[0] ?? 'unknown error'}`)
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Practical // Safe Labs // Lab Packs"
        title="Lab Pack Import"
        sub={`Preview third-party lab packs before import. Packs are never trusted: the manifest, compatibility (app ${APP_VERSION}), schema, and Lab Safety Audit are re-checked locally.`}
        actions={<Link className="btn btn--ghost btn--sm" to="/labs">← Safe Labs</Link>}
      />

      <Panel title="Load a pack" className="mb-3">
        <div className="row wrap mb-2" style={{ gap: '0.4rem' }}>
          <button className="btn btn--ghost btn--sm" onClick={() => runPreview(SAMPLE_JSON)}>Load sample pack</button>
          <button className="btn btn--ghost btn--sm" onClick={() => runPreview(UNSAFE_JSON)}>Load unsafe demo pack</button>
          <label className="btn btn--ghost btn--sm">
            Open JSON file…
            <input type="file" accept="application/json,.json" onChange={loadFile} style={{ display: 'none' }} />
          </label>
        </div>
        <textarea
          className="textarea"
          aria-label="Lab pack JSON"
          style={{ minHeight: 150, fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
          value={text}
          spellCheck={false}
          onChange={(event) => { setText(event.target.value); setPreview(null) }}
          placeholder='{ "format": "neonsec-lab-pack", "formatVersion": 1, ... }'
        />
        <button className="btn btn--primary btn--sm mt-2" disabled={!text.trim()} onClick={() => runPreview(text)}>Preview pack</button>
      </Panel>

      {preview && (
        <Panel
          title={`Import preview — ${preview.manifest?.name ?? 'unreadable pack'}`}
          className="mb-3"
          right={<span className={`badge ${preview.ok ? 'badge--green' : 'badge--red'}`}>{preview.ok ? 'safe to import' : 'import blocked'}</span>}
        >
          {preview.manifest && (
            <div className="row wrap mb-2" style={{ gap: '0.3rem' }}>
              <span className="badge">{preview.manifest.id}</span>
              <span className="badge">v{preview.manifest.version}</span>
              <span className={`badge ${preview.compatible ? 'badge--green' : 'badge--red'}`}>min app {preview.manifest.minAppVersion}</span>
              <span className="badge">{Array.isArray(preview.manifest.labs) ? preview.manifest.labs.length : 0} labs</span>
              <span className="badge badge--purple">{preview.manifest.author}</span>
            </div>
          )}
          {preview.manifest?.description && <p className="t-sm muted">{preview.manifest.description}</p>}
          {preview.errors.length > 0 && (
            <ul className="term t-xs neon-red" style={{ paddingLeft: '1.1rem' }}>
              {preview.errors.map((error) => <li key={error}>{error}</li>)}
            </ul>
          )}
          {preview.warnings.length > 0 && (
            <ul className="term t-xs neon-amber" style={{ paddingLeft: '1.1rem' }}>
              {preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          )}
          <div className="stack stack--sm">
            {preview.decisions.map((decision) => (
              <div key={decision.targetId} className="panel" style={{ background: 'var(--panel-inset)', padding: '0.6rem 0.75rem' }}>
                <div className="row row--between wrap" style={{ gap: '0.4rem' }}>
                  <strong className="t-sm">{decision.report.title}</strong>
                  <span className={`badge ${decision.publishable ? 'badge--green' : 'badge--red'}`}>{decision.publishable ? 'audit pass' : `${decision.report.blockers} blockers`}</span>
                </div>
                {decision.report.findings.slice(0, 6).map((finding, index) => (
                  <p key={`${finding.rule}-${index}`} className="term t-xs muted" style={{ margin: '0.3rem 0 0' }}>
                    [{finding.severity}] {AUDIT_RULES[finding.rule].label} in {finding.field}: <code>{finding.value}</code> — {finding.safeAlternative}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <button className="btn btn--green btn--sm mt-3" disabled={!preview.ok} onClick={install}>Import pack</button>
          {message && <p className={`term t-xs mt-2 ${message.startsWith('Pack installed') ? 'neon-green' : 'neon-red'}`} role="status">{message}</p>}
        </Panel>
      )}

      <Panel title="Installed packs">
        {packs.length === 0 ? (
          <p className="term t-xs dim" style={{ margin: 0 }}>No packs installed. Installed pack labs are listed here for preview; they are re-audited on every restore.</p>
        ) : (
          <div className="stack stack--sm">
            {packs.map((pack) => (
              <div key={pack.id} className="panel" style={{ background: 'var(--panel-inset)' }}>
                <div className="row row--between wrap" style={{ gap: '0.4rem' }}>
                  <strong className="t-sm">{pack.name} <span className="term t-xs dim">v{pack.version} · {pack.author}</span></strong>
                  <button className="btn btn--danger btn--sm" onClick={() => uninstallLabPack(pack.id)}>Uninstall</button>
                </div>
                <p className="term t-xs dim">Installed {formatDateTime(pack.installedAt)} · audited with ruleset v{pack.auditRuleset}</p>
                <ul className="t-sm muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                  {pack.labs.map((lab) => <li key={lab.id}>{lab.title} — {lab.brief}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
