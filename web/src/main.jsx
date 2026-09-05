import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import FirstBoard from './pages/FirstBoard.jsx'
import LiveBoard from './pages/LiveBoard.jsx'
import BaroBid from './pages/BaroBid.jsx'
import CorpPage from './pages/CorpPage.jsx'
import NoticePage from './pages/NoticePage.jsx'
import DailyPage, { DailyIndex } from './pages/DailyPage.jsx'
import Analysis from './pages/Analysis.jsx'
import AgencyPage from './pages/AgencyPage.jsx'
import NotFound from './pages/NotFound.jsx'
import './styles.css'

/* 구인구직만 Firebase 를 씁니다. 이 탭을 열기 전에는 firebase 덩어리(약 73KB)를
   아예 내려받지 않도록 따로 떼어둡니다 — 전송량이 곧 요금이라서. */
const Jobs = lazy(() => import('./pages/Jobs.jsx'))

/* 서식은 목록 자료(약 24KB)를 안고 있습니다. 서식 탭을 열기 전에는
   내려받지 않도록 따로 뗍니다 — 첫 화면 전송량에 얹지 않기 위해서입니다. */
const Forms = lazy(() => import('./pages/Forms.jsx'))

/* 설계변경 자료도 목록을 안고 있어 따로 뗍니다 (2026-09-05) */
const Change = lazy(() => import('./pages/Change.jsx'))
const ChangeTopic = lazy(() => import('./pages/Change.jsx').then((m) => ({ default: m.ChangeTopic })))
const ChangeCalc = lazy(() => import('./pages/Change.jsx').then((m) => ({ default: m.ChangeCalc })))
const ChangeBook = lazy(() => import('./pages/Change.jsx').then((m) => ({ default: m.ChangeBook })))
const FormPage = lazy(() => import('./pages/Forms.jsx').then((m) => ({ default: m.FormPage })))

const Loading = () => (
  <div style={{ padding: '40px 0' }}>
    <div className="skel" /><div className="skel" /><div className="skel" />
  </div>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          {/* 바로투찰이 이 사이트의 첫 화면입니다 */}
          <Route path="/" element={<BaroBid />} />
          <Route path="/calc" element={<BaroBid />} />
          <Route path="/first" element={<FirstBoard />} />
          <Route path="/live" element={<LiveBoard />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/jobs" element={<Suspense fallback={<Loading />}><Jobs /></Suspense>} />
          <Route path="/agency/:name" element={<AgencyPage />} />
          {/* ★ 업체 성적표 — 분석 탭 안에 갇혀 있던 화면에 주소를 준 것 (2026-09-04) */}
          <Route path="/corp/:name" element={<CorpPage />} />
          {/* ★ 공고·개찰 한 건 — 검색 수요가 가장 큰 자리 (2026-09-04) */}
          <Route path="/notice/:no" element={<NoticePage />} />
          {/* ★ 「어제의 개찰 성적표」 — 자료는 미리 구운 HTML 안의 ddata 하나뿐이라
              이 화면으로 오는 링크는 <Link> 가 아니라 <a href> 여야 합니다. */}
          {/* ★ 건설 서식 — 변하지 않는 자료라 한 번 구워 두면 계속 일합니다 (2026-09-05) */}
          <Route path="/forms" element={<Suspense fallback={<Loading />}><Forms /></Suspense>} />
          {/* ★ 설계변경 — 절차·단가기준·계산기 (2026-09-05) */}
          <Route path="/change" element={<Suspense fallback={<Loading />}><Change /></Suspense>} />
          <Route path="/change/calc" element={<Suspense fallback={<Loading />}><ChangeCalc /></Suspense>} />
          <Route path="/change/excel" element={<Suspense fallback={<Loading />}><ChangeBook /></Suspense>} />
          <Route path="/change/:slug" element={<Suspense fallback={<Loading />}><ChangeTopic /></Suspense>} />
          <Route path="/forms/:slug" element={<Suspense fallback={<Loading />}><FormPage /></Suspense>} />
          <Route path="/daily" element={<DailyIndex />} />
          <Route path="/daily/:date" element={<DailyPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
