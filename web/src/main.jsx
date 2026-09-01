import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import FirstBoard from './pages/FirstBoard.jsx'
import LiveBoard from './pages/LiveBoard.jsx'
import BaroBid from './pages/BaroBid.jsx'
import Analysis from './pages/Analysis.jsx'
import AgencyPage from './pages/AgencyPage.jsx'
import NotFound from './pages/NotFound.jsx'
import './styles.css'

/* 구인구직만 Firebase 를 씁니다. 이 탭을 열기 전에는 firebase 덩어리(약 73KB)를
   아예 내려받지 않도록 따로 떼어둡니다 — 전송량이 곧 요금이라서. */
const Jobs = lazy(() => import('./pages/Jobs.jsx'))

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
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
