import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { BasePriceProvider, BasePriceField } from './BasePrice.jsx'

const TABS = [
  { to: '/', ic: '🏆', label: '1순위' },
  { to: '/live', ic: '📋', label: '공고' },
  { to: '/calc', ic: '🧮', label: '계산' },
  { to: '/analysis', ic: '🔍', label: '분석' },
  { to: '/jobs', ic: '🤝', label: '구인구직' },
]

export default function App() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <BasePriceProvider>
      <header className="topbar">
        <div className="topbar-in">
          <NavLink to="/" className="brand">
            <span>🏗️</span><span>K-<b>건설맵</b></span>
          </NavLink>
          <span className="brand-sub">조달청 공공입찰</span>
          {/* 기초금액을 한 번 넣어두면 모든 화면의 투찰률이 금액으로 환산됩니다 */}
          <BasePriceField />
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
