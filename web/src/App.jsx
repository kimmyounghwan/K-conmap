import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

const TABS = [
  { to: '/', ic: '🏆', label: '1순위' },
  { to: '/live', ic: '📋', label: '공고' },
  { to: '/calc', ic: '🧮', label: '계산' },
  { to: '/analysis', ic: '🔍', label: '분석' },
  { to: '/jobs', ic: '🤝', label: '구인구직' },
]

export default function App() {
  const { pathname } = useLocation()

  // 탭을 옮기면 항상 맨 위에서 시작 (모바일에서 스크롤이 남아 있으면 혼란스러움)
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <NavLink to="/" className="brand">
            <span>🏗️</span><span>K-<b>건설맵</b></span>
          </NavLink>
          <span className="brand-sub">조달청 공공입찰</span>
          <span className="spacer" />
        </div>
      </header>

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
    </>
  )
}
