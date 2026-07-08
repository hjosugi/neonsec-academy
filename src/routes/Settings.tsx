import { useRef, useState } from 'react'
import type { Settings as SettingsType } from '../types'
import { useStore } from '../store/useStore'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="row row--between" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--hairline)' }}>
      <div>
        <div className="t-sm">{label}</div>
        {hint && <div className="term t-xs dim">{hint}</div>}
      </div>
      <label className="toggle">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="toggle__track" />
      </label>
    </div>
  )
}

export function Settings() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const profile = useStore((s) => s.profile)
  const updateProfile = useStore((s) => s.updateProfile)
  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)
  const resetProgress = useStore((s) => s.resetProgress)
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const set = (patch: Partial<SettingsType>) => updateSettings(patch)

  const doExport = () => {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'neonsec-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const onFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const ok = importData(String(reader.result))
      setMsg(ok ? '✓ Progress imported.' : '✕ Import failed — invalid file.')
    }
    reader.readAsText(file)
  }

  const wipe = () => {
    if (confirm('Erase EVERYTHING (progress, settings, custom questions) and reload? This cannot be undone.')) {
      localStorage.removeItem('neonsec-academy:v1')
      location.reload()
    }
  }

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <PageHeader eyebrow="System // Settings" title="Settings" sub="Tune the interface, study cadence, and manage your local data." />

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <Panel title="Appearance & Motion">
            <Toggle label="Reduce motion" hint="Disable animations and glitch effects" checked={settings.reduceMotion} onChange={(v) => set({ reduceMotion: v })} />
            <Toggle label="Low glow" hint="Remove neon bloom (easier on the eyes / OLED)" checked={settings.lowGlow} onChange={(v) => set({ lowGlow: v })} />
            <Toggle label="High contrast" hint="Brighten text and borders" checked={settings.highContrast} onChange={(v) => set({ highContrast: v })} />
            <Toggle label="Scanlines" hint="Retro CRT scanline overlay" checked={settings.scanlines} onChange={(v) => set({ scanlines: v })} />
          </Panel>

          <Panel title="Study">
            <div className="field">
              <label className="label">Daily review goal · {settings.dailyGoal} questions</label>
              <input type="range" min={5} max={60} step={5} value={settings.dailyGoal} onChange={(e) => set({ dailyGoal: Number(e.target.value) })} style={{ width: '100%' }} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label className="label">Mock exam target · {profile.examTargetPct}%</label>
              <input type="range" min={65} max={95} step={5} value={profile.examTargetPct} onChange={(e) => updateProfile({ examTargetPct: Number(e.target.value) })} style={{ width: '100%' }} />
            </div>
          </Panel>
        </div>

        <div className="stack">
          <Panel title="Data">
            <p className="term t-xs dim mb-2">
              Everything is stored locally in your browser. Back it up or move it to another device.
            </p>
            <div className="stack stack--sm">
              <button className="btn btn--ghost btn--block" onClick={doExport}>
                ⤓ Export progress (JSON)
              </button>
              <button className="btn btn--ghost btn--block" onClick={() => fileRef.current?.click()}>
                ⤒ Import progress
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
              {msg && <div className={`t-sm ${msg.startsWith('✓') ? 'neon-green' : 'neon-red'}`}>{msg}</div>}
            </div>
          </Panel>

          <Panel title="Danger Zone" style={{ borderColor: 'rgba(255,51,102,0.4)' }}>
            <div className="stack stack--sm">
              <button
                className="btn btn--ghost btn--block"
                onClick={() => {
                  if (confirm('Reset stats, reviews, exams and mistakes? Custom questions and settings are kept.')) {
                    resetProgress()
                    setMsg('✓ Progress reset.')
                  }
                }}
              >
                ↺ Reset progress
              </button>
              <button className="btn btn--danger btn--block" onClick={wipe}>
                ⚠ Erase everything
              </button>
            </div>
          </Panel>

          <Panel title="About">
            <p className="term t-xs muted">
              <span className="neon-cyan">NeonSec Academy</span> v1.0 — a cyberpunk CEH trainer. For authorized,
              defensive security learning only. All labs use synthetic data; nothing here touches real systems.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  )
}
