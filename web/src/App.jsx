import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { BasePriceProvider } from './BasePrice.jsx'

const TABS = [
  { to: '/', ic: '💰', label: '바로투찰' },
  { to: '/first', ic: '🏆', label: '1순위' },
  { to: '/live', ic: '📋', label: '공고' },
  { to: '/analysis', ic: '🔍', label: '분석' },
  { to: '/forms', ic: '📄', label: '서식' },
  { to: '/jobs', ic: '🤝', label: '구인구직' },
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
          <span className="brand-sub">조달청 공공입찰</span>
        </div>
      </header>

      {/* 넓은 화면에서는 하단 탭 대신 상단 가로 메뉴 */}
      <div className="railwrap">
        <nav className="railnav">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.to === '/'}
              className={({ isActive }) => (isActive ? 'on' : '')}>
              <span className="ic">{t.ic}</span><span>{t.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <main className="shell">
        <Outlet />
        <footer className="footer">
          <div>
            <a href="/about">소개</a><span className="dot">·</span>
            <a href="/privacy">개인정보처리방침</a><span className="dot">·</span>
            <a href="/contact">문의</a>
          </div>
          <div style={{ marginTop: 6 }}>
            공공데이터포털 나라장터 입찰정보를 가공해 제공합니다.<br />
            분석 결과는 참고용이며 낙찰을 보장하지 않습니다.
          </div>
        </footer>
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'}
            className={({ isActive }) => (isActive ? 'on' : '')}>
            <span className="ic">{t.ic}</span>
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </BasePriceProvider>
  )
}
