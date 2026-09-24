import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ReactElement } from 'react'
import { LabDetail } from './LabDetail'
import { Reports } from './Reports'
import { Triage } from './Triage'
import { PracticalSim } from './PracticalSim'
import { LabSafetyAudit } from './LabSafetyAudit'
import { LabPacks } from './LabPacks'
import { EngagementWorkflow } from './EngagementWorkflow'
import { TrackChallengeDetail, TrackChallengeList } from './TrackWorkspace'
import { IncidentResponse } from './IncidentResponse'
import { ThreatModelDetail, ThreatModelList } from './ThreatModeling'
import { Portfolio } from './Portfolio'
import { InterviewTracker } from './InterviewTracker'
import { Landing } from './Landing'
import { Beyond } from './Beyond'

// Server-render smoke test: every practical route renders without throwing on an empty store.
function render(path: string, pattern: string, element: ReactElement): string {
  return renderToString(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={pattern} element={element} />
      </Routes>
    </MemoryRouter>,
  )
}

const cases: Array<[string, string, ReactElement, string]> = [
  ['/labs/web-log-forced-browsing', '/labs/:id', <LabDetail />, 'Web Log Analysis'],
  ['/labs/web-session-rotation', '/labs/:id', <LabDetail />, 'Session Not Rotated'],
  ['/reports', '/reports', <Reports />, 'Reports'],
  ['/triage', '/triage', <Triage />, 'Triage Board'],
  ['/practical', '/practical', <PracticalSim />, 'Practical Sim'],
  ['/labs/audit', '/labs/audit', <LabSafetyAudit />, 'Lab Safety Audit'],
  ['/labs/packs', '/labs/packs', <LabPacks />, 'Lab Pack Import'],
  ['/tracks/pentest', '/tracks/pentest', <EngagementWorkflow />, 'Neon Harbor'],
  ['/tracks/soc', '/tracks/:track', <TrackChallengeList />, 'SOC Challenges'],
  ['/tracks/appsec/APPSEC-01', '/tracks/:track/:id', <TrackChallengeDetail />, 'Invoice Lookup'],
  ['/tracks/ir', '/tracks/ir', <IncidentResponse />, 'RecordVault'],
  ['/tracks/threat-model', '/tracks/threat-model', <ThreatModelList />, 'Threat Modeling Scenarios'],
  ['/tracks/threat-model/TM-01', '/tracks/threat-model/:id', <ThreatModelDetail />, 'Kitsune Notes'],
  ['/portfolio', '/portfolio', <Portfolio />, 'Portfolio Exporter'],
  ['/interview', '/interview', <InterviewTracker />, 'Interview Tracker'],
  ['/welcome', '/welcome', <Landing />, 'Manage every question'],
  ['/beyond', '/beyond', <Beyond />, 'Beyond District'],
]

describe('route smoke render', () => {
  it.each(cases)('%s renders', (path, pattern, element, text) => {
    expect(render(path, pattern, element)).toContain(text)
  })
})
