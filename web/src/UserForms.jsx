import { lazy, Suspense, useState } from 'react'

/* 📤 이용자 서식 «토글» — 가벼운 껍데기. Firebase 는 열 때만 받습니다(UserFormsPanel.jsx). */
const Panel = lazy(() => import('./UserFormsPanel.jsx'))

export default function UserForms({ cat, compact }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="uforms">
      <button className={'uf-toggle' + (open ? ' on' : '')} onClick={() => setOpen(!open)}>
        📤 이용자가 올린 서식{cat ? ` — ${cat}` : ''} <span className="muted">{open ? '접기' : '열기 · 올리기'}</span>
      </button>
      {open && (
        <Suspense fallback={<div className="hint" style={{ padding: '8px 2px' }}>여는 중…</div>}>
          <Panel cat={cat} compact={compact} />
        </Suspense>
      )}
    </div>
  )
}
