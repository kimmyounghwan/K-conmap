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

/* ══════════════════════════════════════════════════════════════
   ⚠️ 2026-09-08 — 「착공현장 탭을 누르면 사이트가 멈춰. 됐다가 안됐다가 그래」
   
   원인을 재현했습니다. 사이트는 하루 열 몇 번 새로 배포되고, 배포될 때마다
   assets 파일 이름(해시)이 바뀝니다. 그런데 아래 화면들은 «누를 때» 그 파일을
   그제야 받아옵니다(lazy). 그래서 **탭을 열어 둔 채로 배포가 지나가면**
   누르는 순간 이미 없어진 파일을 받으러 가서 404 가 납니다.
   
     실측 재현: 1순위를 열어 둠 → 재배포 → 착공현장 클릭
       404  /assets/Jobs-Rl63TvIV.js
       TypeError: Failed to fetch dynamically imported module
       → 화면이 통째로 비고 React 가 죽어 **아무것도 안 눌립니다.**
   
   Suspense 는 «느린 것»만 감싸 줍니다. «없어진 것»은 못 잡습니다.
   → 파일을 못 받으면 **한 번만 자동으로 새로고침**해 새 파일 목록을 받아옵니다.
      한 번 성공하면 표시를 지우므로, 다음 배포 때도 똑같이 한 번 더 구해 줍니다.
   
   ⚠️ 새 화면을 lazy 로 추가할 때는 반드시 lazyPage() 를 쓰세요.
      lazy() 를 그냥 쓰면 그 화면만 이 사고가 다시 납니다.
   ══════════════════════════════════════════════════════════════ */
const RELOAD_MARK = 'kcm_chunk_reload'
const lazyPage = (load) => lazy(() => load()
  .then((m) => {
    try { sessionStorage.removeItem(RELOAD_MARK) } catch { /* 사생활 보호 모드 */ }
    return m
  })
  .catch((e) => {
    let once = false
    try { once = sessionStorage.getItem(RELOAD_MARK) === '1' } catch { /* noop */ }
    if (once) throw e            // 두 번째도 실패하면 진짜 문제 — 무한 새로고침은 막습니다
    try { sessionStorage.setItem(RELOAD_MARK, '1') } catch { /* noop */ }
    location.reload()
    return new Promise(() => {}) // 새로고침되는 동안은 아무것도 그리지 않습니다
  }))

/* 구인구직만 Firebase 를 씁니다. 이 탭을 열기 전에는 firebase 덩어리(약 73KB)를
   아예 내려받지 않도록 따로 떼어둡니다 — 전송량이 곧 요금이라서. */
const Jobs = lazyPage(() => import('./pages/Jobs.jsx'))

/* 서식은 목록 자료(약 24KB)를 안고 있습니다. 서식 탭을 열기 전에는
   내려받지 않도록 따로 뗍니다 — 첫 화면 전송량에 얹지 않기 위해서입니다. */
const Forms = lazyPage(() => import('./pages/Forms.jsx'))

/* 설계변경 자료도 목록을 안고 있어 따로 뗍니다 (2026-09-05) */
const Change = lazyPage(() => import('./pages/Change.jsx'))
const ChangeTopic = lazyPage(() => import('./pages/Change.jsx').then((m) => ({ default: m.ChangeTopic })))
/* 📚 입찰 알아보기 — 실측으로 쓴 원본 글 (2026-09-06). 하단 탭은 안 늘리고 푸터·바로투찰에서 들어갑니다. */
const Guide = lazyPage(() => import('./pages/Guide.jsx'))
const GuideTopic = lazyPage(() => import('./pages/Guide.jsx').then((m) => ({ default: m.GuideTopic })))
const ChangeCalc = lazyPage(() => import('./pages/Change.jsx').then((m) => ({ default: m.ChangeCalc })))
const ChangeBook = lazyPage(() => import('./pages/Change.jsx').then((m) => ({ default: m.ChangeBook })))
const ChangeNaeyeok = lazyPage(() => import('./pages/Change.jsx').then((m) => ({ default: m.ChangeNaeyeok })))
const FormPage = lazyPage(() => import('./pages/Forms.jsx').then((m) => ({ default: m.FormPage })))

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
          <Route path="/change/naeyeok" element={<Suspense fallback={<Loading />}><ChangeNaeyeok /></Suspense>} />
          {/* 갈래별 주소 — prerender.py 가 이 주소로 HTML 을 굽습니다.
              ⚠️ 여기에 길이 없으면, 검색으로 들어온 사람에게 React 가 NotFound 를 씌우고
                 NotFound 는 noindex 를 겁니다 (CLAUDE.md soft 404). 반드시 짝을 맞춥니다. */}
          <Route path="/change/naeyeok/:kind" element={<Suspense fallback={<Loading />}><ChangeNaeyeok /></Suspense>} />
          <Route path="/change/:slug" element={<Suspense fallback={<Loading />}><ChangeTopic /></Suspense>} />
          <Route path="/forms/:slug" element={<Suspense fallback={<Loading />}><FormPage /></Suspense>} />
          <Route path="/guide" element={<Suspense fallback={<Loading />}><Guide /></Suspense>} />
          <Route path="/guide/:slug" element={<Suspense fallback={<Loading />}><GuideTopic /></Suspense>} />
          <Route path="/daily" element={<DailyIndex />} />
          <Route path="/daily/:date" element={<DailyPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)

/* 📲 앱으로 설치 — 서비스 워커는 «설치 조건» 용입니다. 아무것도 캐시하지 않습니다(public/sw.js). */
if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}) })
}
