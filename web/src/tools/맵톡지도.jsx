/**
 * 🗺 맵톡 첫 화면 — 오로라 바탕 위 큰 지도(글 = 핀) + 지도 위에 떠 있는 글쓰기 칸 (G147 · 2026-10-05)
 *
 * 소장님: 「지도 크게 하고, 글쓰기도 커야 하지 않을까??」 → (클로드) 쌓지 말고 겹치기 → 「이대로 시안」 → 「해줘…만들어서 올려줘」
 * ■ 핀 = 자리(g · 시·군)가 있는 글. 새로 쓴 글은 위에서 떨어지고 물결이 퍼짐(새글번호) · 누르면 그 글(열기)
 * ■ 옅은 점 = 오늘 K-건설맵에 다녀간 곳(fresh/map — 바로투찰 이용자 지도와 같은 자료). 옛 글은 자리가 없어 지도가 비지 않게
 * ■ 위 알림 = 맨 최근 글 여섯을 5초마다 돌아가며(«○○시 · 5분 전 새 글») — 지어낸 알림 없음
 * ■ 글쓰기 칸은 children 으로 받습니다(Qna.jsx 맵톡글쓰기 — 글 올리기 · 4자리 · 사진은 거기서)
 * ■ 움직임 줄이기 설정(prefers-reduced-motion)이면 바탕 · 핀 움직임을 멈춥니다(styles.css)
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { 지도주소, 지도이름표, 지도점들 } from '../lib/이용자지도.js'
import { 주제들, 짧은이름, 곳찾기 } from '../lib/맵톡.js'

const 퍼 = (v, 끝) => (v / 끝 * 100).toFixed(2) + '%'
const 언제 = (ms) => {
  const 분 = Math.max(0, Math.round((Date.now() - (ms || 0)) / 60000))
  if (분 < 2) return '방금'
  if (분 < 60) return `${분}분 전`
  const 시간 = Math.round(분 / 60)
  return 시간 < 24 ? `${시간}시간 전` : `${Math.round(시간 / 24)}일 전`
}

/* 📊 G148 지금까지 — 숫자가 0 에서 올라갑니다(처음 한 번 · 움직임 줄이기면 바로) */
/* ⚠️ G150 — 실제 사이트 확인에서 «글 0 · 답글 0» 으로 멈춰 보였습니다(크롬 뒤쪽 탭은 requestAnimationFrame 이 안 돎).
   → 숨은 탭이면 바로 끝 숫자 · 어떤 경우에도 시간이 지나면 끝 숫자(setTimeout) · 중간에 숫자가 바뀌면 «보이던 숫자» 에서 이어 감 */
function 올림수({ n }) {
  const [v, setV] = useState(0)
  const 보임 = useRef(0)
  useEffect(() => {
    const 끝 = Number(n) || 0
    const 시작 = 보임.current
    const 놓기 = (x) => { 보임.current = x; setV(x) }
    let 줄임 = false
    try { 줄임 = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden } catch (e) { 줄임 = true }
    if (줄임 || 시작 === 끝 || typeof requestAnimationFrame !== 'function') { 놓기(끝); return undefined }
    let raf = 0
    const t0 = performance.now()
    const 걸림 = 시작 === 0 ? 1100 : 500
    const 돌 = (t) => {
      const k = Math.min(1, Math.max(0, (t - t0) / 걸림))
      놓기(Math.round(시작 + (끝 - 시작) * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(돌)
    }
    raf = requestAnimationFrame(돌)
    const 끝내기 = setTimeout(() => { cancelAnimationFrame(raf); 놓기(끝) }, 걸림 + 150)
    return () => { cancelAnimationFrame(raf); clearTimeout(끝내기) }
  }, [n])
  return <b>{v.toLocaleString('ko-KR')}</b>
}

export default function 맵톡지도({ 글들, 새글번호, 열기, 새방, 누적, children }) {
  const [바탕, set바탕] = useState(null)
  const [오늘점, set오늘점] = useState([])
  const [돌기, set돌기] = useState(0)
  useEffect(() => {
    let 살 = true
    import('../data/한국지도.json').then((m) => { if (살) set바탕(m.default || m) }).catch(() => {})
    fetch(지도주소, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then((j) => { if (살 && j) set오늘점(j) }).catch(() => {})
    const iv = setInterval(() => set돌기((n) => n + 1), 5200)
    return () => { 살 = false; clearInterval(iv) }
  }, [])

  const [w, h] = 바탕 ? 바탕.vb : [603, 570]
  /* 옅은 점 — 오늘 다녀간 곳 */
  const 점 = useMemo(() => {
    if (!바탕 || !오늘점) return []
    try { return 지도점들(오늘점, 지도이름표(바탕.곳, 바탕.별)) } catch (e) { return [] }
  }, [바탕, 오늘점])
  /* 핀 — 자리가 있는 글. 같은 시·군에 여럿이면 조금씩 비켜 놓습니다 */
  const 핀 = useMemo(() => {
    if (!바탕) return []
    const 겹 = {}
    const out = []
    for (const r of 글들 || []) {
      const p = r.g ? 곳찾기(바탕, r.g) : null
      if (!p) continue
      const n = (겹[p.k] = (겹[p.k] || 0) + 1) - 1
      const 각 = n * 2.4, 반 = n ? 4 + n * 0.8 : 0
      out.push({ r, p, x: p.x + Math.cos(각) * 반, y: p.y + Math.sin(각) * 반, 새: r.id === 새글번호 })
      if (out.length >= 160) break
    }
    return out.reverse()      // 최근 글이 위에 그려지게
  }, [바탕, 글들, 새글번호])
  /* 알림 — 최근 글 여섯 */
  const 알림글 = useMemo(() => (글들 || []).slice(0, 6), [글들])
  const 지금알림 = 알림글.length ? 알림글[돌기 % 알림글.length] : null
  const 알림곳 = 지금알림 && 바탕 && 지금알림.g ? 곳찾기(바탕, 지금알림.g) : null

  return (
    <section className="mt-hero" aria-label="맵톡 첫 화면">
      <span className="mt-aur a1" /><span className="mt-aur a2" /><span className="mt-aur a3" />
      <div className="mt-hwrap">
        <div className="mt-brand">
          <small>K-건설맵 · 이야기 지도</small>
          <h1>맵톡</h1>
          <p>질문, 현장, 건의 — 어떤 것이든 쓰면 내 시·군에 핀이 꽂힙니다.</p>
          {누적 && 누적.글 > 0 && (
            <div className="mt-stats" aria-label="맵톡 지금까지">
              <small>지금까지</small>
              <span>글 <올림수 n={누적.글} /></span>
              <span>답글 <올림수 n={누적.답글} /></span>
              <span>공감 <올림수 n={누적.공감} /></span>
              <span>사진 <올림수 n={누적.사진} /></span>
            </div>
          )}
        </div>
        <div className="mt-map">
          {바탕 && (
            <svg viewBox={`0 0 ${w} ${h}`} className="mt-land" role="img" aria-label="한국 지도 — 맵톡 글이 올라온 곳">
              {Object.entries(바탕.판).map(([k, d]) => <path key={k} d={d} />)}
              {점.map(({ p }) => <circle key={p.k} cx={p.x} cy={p.y} r={2.6} className="mt-day" />)}
            </svg>
          )}
          {핀.map(({ r, p, x, y, 새 }) => {
            const t = 주제들[r.주제] || 주제들.talk
            return (
              <button key={r.id} type="button" className={'mt-pin' + (새 ? ' new' : '')} style={{ left: 퍼(x, w), top: 퍼(y, h), color: t.색 }}
                onClick={() => 열기(r.id, '핀')} aria-label={`${짧은이름(p.n)} · ${t.이름} 글 열기`} title={`${짧은이름(p.n)} · ${r.t || ''}`}>
                <span className="ring" /><i style={{ background: t.색 }} />
              </button>
            )
          })}
          {바탕 && 핀.length < 3 && <div className="mt-few">새로 쓰는 글부터 핀이 꽂힙니다 · 옅은 점은 오늘 다녀간 곳</div>}
        </div>
        {지금알림 && (
          <div key={돌기} className={'mt-live' + (새방 ? ' off' : '')} role="status">
            <b />{알림곳 ? `${짧은이름(알림곳.n)} · ` : ''}{언제(지금알림.at)} {언제(지금알림.at) === '방금' ? '새 글' : '글'}
            <span className="mt-live-t">«{String(지금알림.t || '').slice(0, 18)}{String(지금알림.t || '').length > 18 ? '…' : ''}»</span>
          </div>
        )}
        {새방 && (
          <div className="mt-made" role="status">
            <i style={{ background: 새방.색 }} />«{새방.이름}» 이야기가 10개 모여 방이 생겼어요
            <s /><s /><s /><s /><s /><s />
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
