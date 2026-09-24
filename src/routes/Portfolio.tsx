import { useMemo, useState } from 'react'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { useStore } from '../store/useStore'
import { TRACK_CHALLENGES } from '../data/tracks'
import { TRACKS } from '../data/taxonomy'
import type { TrackKey } from '../types'
import {
  PORTFOLIO_SECTIONS,
  PRIVACY_CHECKLIST,
  buildPortfolio,
  canExportPortfolio,
  type PortfolioSection,
} from '../lib/portfolio'
import { SAFETY_HIT_LABELS } from '../lib/contentSafety'

function download(name: string, text: string) {
  const blob = new Blob([text], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

const TRACK_NAMES = Object.fromEntries(Object.entries(TRACKS).map(([key, meta]) => [key, meta.name])) as Record<TrackKey, string>

export function Portfolio() {
  const examResults = useStore((s) => s.examResults)
  const practicalResults = useStore((s) => s.practicalResults)
  const reports = useStore((s) => s.reports)
  const triageFindings = useStore((s) => s.triageFindings)
  const trackSubmissions = useStore((s) => s.trackSubmissions)
  const portfolio = useStore((s) => s.portfolio)
  const savePortfolio = useStore((s) => s.savePortfolio)

  const [publicSafe, setPublicSafe] = useState(true)
  const [sections, setSections] = useState<PortfolioSection[]>(PORTFOLIO_SECTIONS.map((section) => section.key))
  const [reportIds, setReportIds] = useState<string[]>(() => reports.map((report) => report.id))
  const [confirmed, setConfirmed] = useState<boolean[]>(() => PRIVACY_CHECKLIST.map(() => false))
  const [copied, setCopied] = useState(false)

  const result = useMemo(
    () => buildPortfolio(
      {
        examResults,
        practicalResults,
        reports,
        triageFindings,
        trackSubmissions,
        trackChallenges: TRACK_CHALLENGES,
        trackNames: TRACK_NAMES,
        reflection: portfolio.reflection,
        displayName: portfolio.displayName,
      },
      { publicSafe, sections, reportIds },
    ),
    [examResults, practicalResults, reports, triageFindings, trackSubmissions, portfolio, publicSafe, sections, reportIds],
  )
  const gate = canExportPortfolio(result, confirmed)

  const toggleSection = (key: PortfolioSection) =>
    setSections((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]))

  return (
    <div className="page">
      <PageHeader
        eyebrow="CEH+ // Portfolio Evidence"
        title="Portfolio Exporter"
        sub="Turn your synthetic practice into a public-safe Markdown portfolio: scores, reports, findings, and reflections — never real targets or secrets."
      />
      <div className="grid-dash">
        <div className="stack">
          <Panel title="Content">
            <div className="field">
              <label className="label" htmlFor="portfolio-name">Display name (optional)</label>
              <input id="portfolio-name" className="input" value={portfolio.displayName} placeholder="e.g. a handle rather than your legal name" onChange={(e) => savePortfolio({ displayName: e.target.value })} />
            </div>
            <label className="toggle mb-2">
              <input
                type="checkbox"
                checked={publicSafe}
                onChange={(e) => {
                  if (!e.target.checked && !window.confirm('Private mode includes evidence notes and asset details. Only use it for your own records. Continue?')) return
                  setPublicSafe(e.target.checked)
                }}
              />
              <span className="toggle__track" />
              <span className="t-sm">Public-safe mode {publicSafe ? '(on — default)' : '(off — private use only)'}</span>
            </label>
            <div className="stack stack--sm">
              {PORTFOLIO_SECTIONS.map((section) => (
                <label key={section.key} className="row clickable" style={{ gap: '0.55rem', alignItems: 'flex-start' }}>
                  <input type="checkbox" checked={sections.includes(section.key)} onChange={() => toggleSection(section.key)} style={{ marginTop: 3 }} />
                  <span>
                    <span className="t-sm">{section.label}</span>
                    <span className="term t-xs dim" style={{ display: 'block' }}>{section.description}</span>
                  </span>
                </label>
              ))}
            </div>
            {sections.includes('reports') && reports.length > 0 && (
              <div className="mt-3">
                <div className="term t-xs dim mb-1">Reports to include</div>
                {reports.map((report) => (
                  <label key={report.id} className="row clickable" style={{ gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={reportIds.includes(report.id)}
                      onChange={() => setReportIds((current) => (current.includes(report.id) ? current.filter((id) => id !== report.id) : [...current, report.id]))}
                    />
                    <span className="t-sm">{report.title || 'Untitled report'}</span>
                  </label>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Reflection notes">
            <textarea
              className="textarea"
              aria-label="Reflection notes"
              style={{ minHeight: 110 }}
              value={portfolio.reflection}
              placeholder="What did you learn, what would you do differently, and what is next?"
              onChange={(e) => savePortfolio({ reflection: e.target.value })}
            />
          </Panel>

          <Panel title="Preview">
            <pre style={{ background: 'var(--bg-abyss)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '0.8rem', fontSize: '0.78rem', whiteSpace: 'pre-wrap', maxHeight: 480, overflowY: 'auto', margin: 0 }}>
              <code>{result.markdown}</code>
            </pre>
          </Panel>
        </div>

        <div className="stack">
          <Panel title="Sensitive placeholder check" right={<span className={`badge ${result.sensitiveHits.length === 0 ? 'badge--green' : 'badge--red'}`}>{result.sensitiveHits.length === 0 ? 'clean' : `${result.sensitiveHits.length} found`}</span>}>
            <p className="term t-xs dim">
              {publicSafe
                ? `${result.redactions} sensitive value${result.redactions === 1 ? '' : 's'} replaced with placeholders; evidence notes and answers are excluded.`
                : 'Private mode: values are not replaced. Public export is blocked while sensitive values remain.'}
            </p>
            {result.sensitiveHits.length > 0 && (
              <ul className="term t-xs neon-red" style={{ paddingLeft: '1.1rem' }}>
                {result.sensitiveHits.slice(0, 8).map((hit, index) => <li key={`${hit.value}-${index}`}>{SAFETY_HIT_LABELS[hit.kind]}: <code>{hit.value}</code></li>)}
              </ul>
            )}
            {result.placeholderWarnings.length > 0 && (
              <ul className="term t-xs neon-amber" style={{ paddingLeft: '1.1rem', marginBottom: 0 }}>
                {result.placeholderWarnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            )}
          </Panel>

          <Panel title="Privacy checklist">
            <div className="stack stack--sm">
              {PRIVACY_CHECKLIST.map((item, index) => (
                <label key={item} className="row clickable" style={{ gap: '0.55rem', alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    checked={confirmed[index]}
                    onChange={() => setConfirmed((current) => current.map((value, i) => (i === index ? !value : value)))}
                    style={{ marginTop: 3 }}
                  />
                  <span className="t-sm">{item}</span>
                </label>
              ))}
            </div>
            {gate.reasons.length > 0 && (
              <ul className="term t-xs neon-amber mt-2" style={{ paddingLeft: '1.1rem', marginBottom: 0 }}>
                {gate.reasons.map((reason) => <li key={reason}>{reason}</li>)}
              </ul>
            )}
            <div className="row wrap mt-3" style={{ gap: '0.4rem' }}>
              <button className="btn btn--green btn--sm" disabled={!gate.ok} onClick={() => download('security-portfolio.md', result.markdown)}>⤓ Export portfolio</button>
              <button
                className="btn btn--ghost btn--sm"
                disabled={!gate.ok}
                onClick={() => {
                  void navigator.clipboard?.writeText(result.markdown)
                  setCopied(true)
                }}
              >
                {copied ? '✓ Copied' : '⧉ Copy Markdown'}
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
