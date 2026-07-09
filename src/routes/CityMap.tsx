import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModuleStats } from '../store/selectors'
import { DISTRICTS, MODULES, TRACKS } from '../data/taxonomy'
import { PageHeader } from '../components/ui/PageHeader'
import { Meter } from '../components/ui/Meter'

export function CityMap() {
  const navigate = useNavigate()
  const mods = useModuleStats()

  return (
    <div className="page">
      <PageHeader
        eyebrow="World // Neon Tokyo-7"
        title="City Map"
        sub="Each district maps to a slice of the CEH syllabus. Light them up by mastering their modules."
      />

      <div className="citymap">
        {DISTRICTS.map((district) => {
          const style = { '--district-c': district.color } as CSSProperties
          const isBeyond = district.id === 'beyond-district'
          const dmods = district.modules.map((n) => mods.find((m) => m.module === n)).filter(Boolean) as typeof mods
          const attempted = dmods.filter((m) => m.attempts > 0)
          const mastery = attempted.length ? attempted.reduce((s, m) => s + m.mastery, 0) / attempted.length : 0

          return (
            <div key={district.id} className="district" style={style}>
              <div className="row row--between">
                <span style={{ fontSize: '1.8rem', color: district.color }}>{district.glyph}</span>
                {!isBeyond && (
                  <span className="term t-xs dim">
                    {attempted.length}/{district.modules.length} started
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
                          style={started ? { borderColor: district.color, color: district.color } : undefined}
                          onClick={() => navigate(`/practice?module=${n}`)}
                          title={m.name}
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
    </div>
  )
}
