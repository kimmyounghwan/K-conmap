import { lazy, Suspense, useEffect, useState } from 'react'

/* 💬 댓글 «토글» — 가벼운 껍데기. Firebase 덩어리(약 73KB)는 누를 때만 받습니다.
   1순위·공고 카드는 첫 화면이라, 여기서 firebase 를 정적으로 끌어오면 모든 방문자가 73KB 를 더 받습니다.
   (main.jsx 의 원칙: «Firebase 는 그 화면을 열기 전엔 안 받는다»)
   💬 G735 (2026-11-17) 건설뉴스 그날 호 댓글에도 씀 — place(쓰는 칸 안내) · 열기(바깥 단추로 펼침 — 수가 바뀌면) · 셈(접힌 단추 옆 «N개») · 바뀜(올리기 · 지우기 뒤 부름) */
const Panel = lazy(() => import('./CommentsPanel.jsx'))

export default function Comments({ no, title, place, 열기 = 0, 셈 = null, 바뀜 = null }) {
  const [open, setOpen] = useState(false)
  useEffect(() => { if (열기) setOpen(true) }, [열기])
  if (!no) return null
  return (
    <div className="cmts" onClick={(e) => e.stopPropagation()}>
      <button className={'cm-toggle' + (open ? ' on' : '')} onClick={() => setOpen(!open)}>
        💬 댓글 {open ? '접기' : '보기 · 쓰기'}{!open && 셈 ? <span className="muted">{셈.toLocaleString('ko-KR')}개</span> : null}
      </button>
      {open && (
        <Suspense fallback={<div className="hint" style={{ padding: '8px 2px' }}>댓글을 여는 중…</div>}>
          <Panel no={no} title={title} place={place} 바뀜={바뀜} />
        </Suspense>
      )}
    </div>
  )
}
