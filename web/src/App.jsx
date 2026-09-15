import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { BasePriceProvider } from './BasePrice.jsx'
import { InstallPill, InstallBar } from './Install.jsx'
import AskStrip from './AskComment'
import FirstBar from './FirstBar.jsx'

const TABS = [
  /* ⚠️ 2026-09-15 — 탭이 11개가 되자 좁은 화면에서 **세 줄**이 됐습니다.
     그런데 styles.css 의 .shell 아래 여백은 «두 줄»(--nav-h * 2) 기준이라
     **글 아래쪽이 탭에 가렸습니다.** 보기 싫은 정도가 아니라 실제로 가립니다.
     → 10개로 줄입니다. 캐드는 「도구」 안으로 넣었습니다(리습도 도구입니다).
       /cad 주소는 그대로 살아 있습니다 — 검색으로 들어오는 길을 끊으면 안 됩니다.

     차례도 바꿨습니다. 「내역서 작성」이 맨 끝이라 눈이 제일 늦게 닿았습니다.
     **둘째 줄 첫 자리**로 올립니다 — 줄이 바뀌는 자리라 시선이 한 번 멈춥니다.
       [입찰 3] 바로투찰·1순위·공고
       [서류 2] 서식·설계변경
       [파는 것] 내역서 작성      ← 둘째 줄 머리
       [게시판 2] 구인구직·묻고답하기
       [보조 2] 분석·도구 */
  { to: '/', ic: '💰', label: '바로투찰' },
  { to: '/first', ic: '🏆', label: '1순위' },
  { to: '/live', ic: '📋', label: '공고' },
  { to: '/forms', ic: '📄', label: '서식' },
  { to: '/change', ic: '🔁', label: '설계변경' },
  { to: '/naeyeok', ic: '📋', label: '내역서 작성', pay: true },
  { to: '/jobs', ic: '💼', label: '구인구직' },
  { to: '/qna', ic: '💬', label: '묻고답하기' },
  { to: '/analysis', ic: '🔍', label: '분석' },
  { to: '/tools', ic: '🧰', label: '도구' },
]

export default function App() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <BasePriceProvider>
      {/* 2026-09-02 — «기초금액 넣기»를 상단에서 뺐는데, 예전에 넣어둔 값이
          브라우저에 남아 1순위 목록마다 «6.3억» 같은 유령 금액을 띄웠습니다.
          입력칸이 없으니 지울 방법도 없었습니다. 한 번 비웁니다. */}
      <header className="topbar">
        <div className="topbar-in">
          <NavLink to="/" className="brand">
            <span>🏗️</span><span>K-<b>건설맵</b></span>
          </NavLink>
          {/* 📖 소장님(2026-09-15): 「건설맵 이용방법은 누구나 볼 수 있게 해줘야지」
              하단 탭은 10개로 꽉 찼고(11개면 세 줄), 바닥글은 끝까지 내려야 보입니다.
              여기 «조달청 공공입찰» 은 장식일 뿐이라 그 자리를 길로 바꿨습니다 —
              모든 화면 왼쪽 위에 늘 보입니다. 좁은 화면에서도 숨기지 않습니다. */}
          <NavLink to="/how" className="brand-sub" title="처음이시면 여기부터 — 어디서 뭘 하는지 한 장으로">
            📖 보는 방법
          </NavLink>
          {/* 🌊 자매 사이트 사라사 — 소장님(09-06): 「클릭하면 사라사 사이트로. 페이지마다」.
              이 막대는 모든 페이지 위에 있으므로 여기 한 번이면 페이지마다 붙습니다. 새 탭으로 엽니다(건설맵을 떠나지 않게). */}
          <div className="topbar-r">
            <a className="sisbtn" href="https://sarasa.kr" target="_blank" rel="noopener"
              title="자매 사이트 사라사 — 나노리치 실시간 신호판 · 경제 기사 · 여행">🌊 사라사</a>
            <InstallPill />
          </div>
        </div>
      </header>

      {/* 넓은 화면에서는 하단 탭 대신 상단 가로 메뉴 */}
      <div className="railwrap">
        <nav className="railnav">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.to === '/'}
              className={({ isActive }) => [isActive ? 'on' : '', t.pay ? 'pay' : ''].join(' ').trim()}>
              <span className="ic">{t.ic}</span><span>{t.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <main className="shell">
        {/* 📲 홈 화면에 추가 띠 — 모든 페이지 맨 위. 닫으면 7일 뒤에 다시 (Install.jsx) */}
        <InstallBar />
        {/* 🧭 처음 온 사람에게 딱 한 번 — «보는 방법» 으로 가는 길 (FirstBar.jsx) */}
        <FirstBar />
        {/* 💬 서식·캐드를 받은 «직후» 에만, 이레에 한 번 (AskComment.jsx) */}
        <AskStrip />
        <Outlet />
        <footer className="footer">
          <div>
            <a href="/about">소개</a><span className="dot">·</span>
            <a href="/privacy">개인정보처리방침</a><span className="dot">·</span>
            <a href="/terms">이용약관</a><span className="dot">·</span>
            <a href="/contact">문의</a>
          </div>
          {/* 📚 실측으로 쓴 글 — 하단 탭을 늘리지 않고 여기서 들어갑니다 (2026-09-06) */}
          <div style={{ marginTop: 6 }}>
            <a href="/how"><b>📖 보는 방법</b></a>
            <span className="dot">·</span>처음이시면 여기부터 — 어디서 뭘 하는지 한 장으로
          </div>
          <div style={{ marginTop: 6 }}>
            <a href="/guide"><b>📚 입찰 알아보기</b></a>
            <span className="dot">·</span>투찰금액 계산 · 사정률 · 참가업체수 — 개찰 1만여 건 실측
          </div>
          <div className="footer-sis">
            🌊 자매 사이트 <a href="https://sarasa.kr" target="_blank" rel="noopener"><b>사라사 sarasa.kr</b></a>
            <span className="dot">·</span>나노리치 실시간 신호판 · 경제 기사 · 여행
          </div>
          <div style={{ marginTop: 6 }}>
            공공데이터포털 나라장터 입찰정보를 가공해 제공합니다.<br />
            분석 결과는 참고용이며 낙찰을 보장하지 않습니다.
          </div>
          {/* 🙋 만든 사람 — 소장님(2026-09-15): 「사이트 제일 아래에 개발자 김명환 이름을 넣어 줘」 */}
          <div className="footer-me">
            만든 사람 · <span className="role">토목 현장소장</span> <b>김명환</b>
            <span className="dot">·</span>
            <a href="/about">왜 만들었는지</a>
          </div>
        </footer>
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'}
            className={({ isActive }) => [isActive ? 'on' : '', t.pay ? 'pay' : ''].join(' ').trim()}>
            <span className="ic">{t.ic}</span>
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </BasePriceProvider>
  )
}
