/**
 * 🔎 빠른 찾기 (G404 · 2026-10-25) — 맨 위 🔎 단추 · «/» · Ctrl+K(맥 ⌘K) 로 어디서나 열림
 *   소장님 「건설맵에 빠른 검색기능 넣을 수 있을까?」 — 찾는 것: 도구 · 계산기 · 서식 · 설계변경 · 입찰 알아보기 · 캐드 명령 · 화면 · 발주기관 · 업체 · 공고 번호
 *   · 창(빠른찾기창.jsx)과 목록 자료(data/*.json)는 처음 열 때만 받음(첫 화면 무게 그대로) · 찾기는 브라우저 안에서 글자 칠 때마다(lib/빠른찾기.js)
 *   · 기관 · 업체는 이미 있는 찾기(lib/data.js searchAgency · searchCorp — 기관 이름 목록 한 번 · 업체는 첫 글자 칸만) · 두 글자부터 · 0.25초 쉼
 *   · 한글 치는 중 아이폰 누름 → 손끝(G215) · ↑ ↓ 엔터 · Esc · 바깥 누르면 닫힘
 *   · 쓴 횟수만 셈(|빠른찾기|열기 · |빠른찾기|고름) — 화면엔 안 보임
 */
import { lazy, Suspense, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { 세기 } from './lib/받은수.jsx'

const 빠른찾기창 = lazy(() => import('./빠른찾기창.jsx'))

const 열기글 = '빠른 찾기 — 도구 · 서식 · 계산기 · 기관 · 업체 · 공고 번호 («/» 또는 Ctrl+K)'

export function 빠른찾기단추({ 탭 }) {
  const [열림, set열림] = useState(false)
  useEffect(() => {
    const 키 = (e) => {
      const 칸 = e.target && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey) && !e.altKey) { e.preventDefault(); set열림(true); return }
      if (e.key === '/' && !칸 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); set열림(true) }
    }
    window.addEventListener('keydown', 키)
    return () => window.removeEventListener('keydown', 키)
  }, [])
  useEffect(() => { if (열림) 세기('|빠른찾기|열기') }, [열림])
  return (
    <>
      <button type="button" className="qsbtn" title={열기글} aria-label="빠른 찾기" onClick={() => set열림(true)}>
        <span className="qsic">🔎</span><span className="qslong">찾기 — 도구 · 서식 · 공고 · 업체</span><kbd className="qskbd">/</kbd>
      </button>
      {/* 머리줄(쌓임 칸) 밖 body 에 — 안에 두면 아래 탭 띠가 창 위로 올라옴(폰) */}
      {열림 && createPortal(<Suspense fallback={null}><빠른찾기창 탭={탭} 닫기={() => set열림(false)} /></Suspense>, document.body)}
    </>
  )
}

