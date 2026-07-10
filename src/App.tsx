import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './store/useStore'
import { Shell } from './components/layout/Shell'
import { Dashboard } from './routes/Dashboard'
import { QuestionBank } from './routes/QuestionBank'
import { QuestionDetail } from './routes/QuestionDetail'
import { QuestionEditor } from './routes/QuestionEditor'
import { ConceptCards } from './routes/ConceptCards'
import { Practice } from './routes/Practice'
import { Review } from './routes/Review'
import { Exam } from './routes/Exam'
import { ExamRunner } from './routes/ExamRunner'
import { ExamResult } from './routes/ExamResult'
import { FinalGate } from './routes/FinalGate'
import { Analytics } from './routes/Analytics'
import { Mistakes } from './routes/Mistakes'
import { Labs } from './routes/Labs'
import { LabDetail } from './routes/LabDetail'
import { Beyond } from './routes/Beyond'
import { Reports } from './routes/Reports'
import { CityMap } from './routes/CityMap'
import { Settings } from './routes/Settings'
import { NotFound } from './routes/NotFound'
import { Onboarding } from './routes/Onboarding'

function useThemeSync() {
  const settings = useStore((s) => s.settings)
  useEffect(() => {
    const el = document.documentElement
    el.classList.toggle('reduce-motion', settings.reduceMotion)
    el.classList.toggle('low-glow', settings.lowGlow)
    el.classList.toggle('high-contrast', settings.highContrast)
    el.classList.toggle('no-scanlines', !settings.scanlines)
  }, [settings])
}

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.querySelector('.main')?.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

export default function App() {
  useThemeSync()
  const onboarded = useStore((s) => s.profile.onboarded)

  return (
    <>
      <ScrollTop />
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bank" element={<QuestionBank />} />
          <Route path="/bank/new" element={<QuestionEditor />} />
          <Route path="/bank/:id" element={<QuestionDetail />} />
          <Route path="/bank/:id/edit" element={<QuestionEditor />} />
          <Route path="/cards" element={<ConceptCards />} />
          <Route path="/cards/:id" element={<ConceptCards />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/review" element={<Review />} />
          <Route path="/exam" element={<Exam />} />
          <Route path="/exam/run" element={<ExamRunner />} />
          <Route path="/exam/result/:id" element={<ExamResult />} />
          <Route path="/final-gate" element={<FinalGate />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/mistakes" element={<Mistakes />} />
          <Route path="/labs" element={<Labs />} />
          <Route path="/labs/:id" element={<LabDetail />} />
          <Route path="/beyond" element={<Beyond />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/map" element={<CityMap />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      {!onboarded && <Onboarding />}
    </>
  )
}
