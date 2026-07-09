import type { CSSProperties } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModuleStats } from '../store/selectors'
import { DISTRICTS, MODULES, TRACKS } from '../data/taxonomy'
import { PageHeader } from '../components/ui/PageHeader'
import { Meter } from '../components/ui/Meter'
import { Panel } from '../components/ui/Panel'

function districtStatus(dueCount: number, started: number, total: number, mastery: number) {
  if (dueCount > 0) return { key: 'due', label: `${dueCount} due`, className: 'badge--amber' }
  if (started === 0) return { key: 'locked', label: 'locked', className: '' }
  if (mastery >= 0.9 && started === total) return { key: 'mastered', label: 'mastered', className: 'badge--green' }
  if (mastery >= 0.72) return { key: 'ready', label: 'ready', className: 'badge--cyan' }
  return { key: 'weak', label: 'weak', className: 'badge--red' }
}

export function CityMap() {
  const navigate = useNavigate()
  const mods = useModuleStats()
  const [hidden, setHidden] = useState(false)

  return (
    <div className="page">
      <PageHeader
        eyebrow="World // Neon Tokyo-7"
        title="City Map"
        sub="Each district maps to a slice of the CEH syllabus. Light them up by mastering their modules."
        actions={
          <button className="btn btn--ghost btn--sm" onClick={() => setHidden((v) => !v)}>
            {hidden ? 'Show map' : 'Hide map'}
          </button>
        }
      />

      {hidden ? (
        <Panel>
          <p className="muted t-sm">
            City Map is hidden. Use the sidebar for primary navigation or show the progress overlay again.
          </p>
          <button className="btn btn--primary btn--sm mt-2" onClick={() => setHidden(false)}>
            Show map
          </button>
        </Panel>
      ) : (
      <div className="citymap">
        {DISTRICTS.map((district) => {
          const style = { '--district-c': district.color } as CSSProperties
          const isBeyond = district.id === 'beyond-district'
          const dmods = district.modules.map((n) => mods.find((m) => m.module === n)).filter(Boolean) as typeof mods
          const attempted = dmods.filter((m) => m.attempts > 0)
          const mastery = attempted.length ? attempted.reduce((s, m) => s + m.mastery, 0) / attempted.length : 0
          const dueCount = dmods.reduce((sum, m) => sum + m.dueCount, 0)
          const status = districtStatus(dueCount, attempted.length, district.modules.length, mastery)

          return (
            <div key={district.id} className={`district district--${status.key}`} style={style}>
              <div className="row row--between">
                <span style={{ fontSize: '1.8rem', color: district.color }}>{district.glyph}</span>
                {!isBeyond && (
                  <span className={`badge ${status.className}`}>
                    {status.label}
                  </span>
                )}
              </div>
              <div className="district__name mt-1" style={{ color: district.color }}>
                {district.name}
              </div>
              <div className="term t-xs dim mb-2">{district.blurb}</div>

              {!isBeyond ? (
                <>
                  <Meter value={mastery * 100} color={district.color} />
                  <div className="row wrap mt-2" style={{ gap: '0.3rem' }}>
                    {district.modules.map((n) => {
                      const m = MODULES.find((x) => x.module === n)!
                      const st = mods.find((x) => x.module === n)
                      const started = (st?.attempts ?? 0) > 0
                      return (
                        <button
                          key={n}
                          className="chip"
                          style={
                            (st?.dueCount ?? 0) > 0
                              ? { borderColor: 'var(--warning-amber)', color: 'var(--warning-amber)' }
                              : started
                                ? { borderColor: district.color, color: district.color }
                                : undefined
                          }
                          onClick={() => navigate((st?.dueCount ?? 0) > 0 ? '/review' : `/practice?module=${n}`)}
                          title={`${m.name} · ${(st?.dueCount ?? 0) > 0 ? 'review due' : 'start drill'}`}
                        >
                          M{String(n).padStart(2, '0')}
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div className="row wrap" style={{ gap: '0.3rem' }}>
                    {Object.values(TRACKS).map((t) => (
                      <span key={t.key} className="chip" title={t.blurb}>
                        {t.short}
                      </span>
                    ))}
                  </div>
                  <button className="btn btn--ghost btn--sm btn--block mt-2" onClick={() => navigate('/beyond')}>
                    Enter Beyond District →
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>
      )}
    </div>
  )
}
