/**
 * 🗺 지금 K-건설맵을 쓰는 곳 — 사랑방 맨 위 지도 (2026-10-02 · G114)
 *
 * 소장님: 「건설맵 이용자 지도 만들 수 있어? 실시간으로」 「건설맵 사이트에 띄우는 거지 · 다 볼 수 있게」
 *         「어디에 띄우면 좋을까? 사랑방??」 「숫자는 나중에 하는게 좋을 것 같기도 하고, 지도만 띄우고,,,표시가 나오게..」
 *   → (클로드 의견 · 그대로 하심) 사랑방 맨 위 · 숫자 없이 점만 · 지금(30분 안)은 진한 점(사람이 많으면 조금 크게) · 오늘 다녀간 곳은 옅은 점
 *
 * ■ 자료: fresh/map (tools/이용자지도.py · 깃허브 24시간 10분마다) — 한 번 받고, 화면을 보고 있으면 5분마다 다시(작음 · 1KB 남짓)
 *   바탕 그림: data/한국지도.json (열 때만 받음 · 37KB)
 * ■ 아직 자료가 없으면(애널리틱스 연결 전) 칸을 아예 안 띄웁니다.
 * ■ 점을 누르면(폰) · 올리면(PC) 도시 이름. 사람 수는 보이지 않습니다.
 * ■ (2026-10-02) 소장님 「지도를 조금 더 크게 하고 파란색 점도 더 크게 … 애널리틱스처럼」
 *   → PC 에서 지도 폭 480 → 760px(화면 높이의 78% 안) · 점은 «화면 픽셀» 로 크기를 정함(지도가 작아져도 점이 같이 작아지지 않게)
 *     지금 점 반지름 = 9 · 12 · 15px × 배율(폰 0.75 ~ PC 1.15) · 오늘 점 5px × 배율 · 애널리틱스처럼 반투명 파랑 + 진한 테두리
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { 지도주소, 지도이름표, 지도점들, 지도점크기 } from '../lib/이용자지도.js'

export default function 이용자지도() {
  const [바탕, set바탕] = useState(null)
  const [자료, set자료] = useState(null)
  const [고른, set고른] = useState(null)
  const [때, set때] = useState(Date.now())
  const [화면, set화면] = useState(null)          // {w, h} — 그려진 지도 크기(px)
  const 그림 = useRef(null)

  useEffect(() => {
    let 살 = true
    const 받기 = async () => {
      try {
        const r = await fetch(지도주소, { cache: 'no-store' })
        const j = r.ok ? await r.json() : null
        if (살) { set자료(j); set때(Date.now()) }
        if (j && 살) import('../data/한국지도.json').then((m) => { if (살) set바탕(m.default || m) }).catch(() => {})
      } catch (e) { /* 인터넷 · 막힘 — 지도 없이 */ }
    }
    받기()
    const 틈 = setInterval(() => { if (document.visibilityState === 'visible') 받기() }, 5 * 60000)
    return () => { 살 = false; clearInterval(틈) }
  }, [])

  /* 그려진 크기를 재서 점 크기를 «픽셀» 로 맞춤 — 창 크기가 바뀌면 다시 */
  useEffect(() => {
    const el = 그림.current
    if (!el) return
    const 재기 = () => { const r = el.getBoundingClientRect(); if (r.width > 0) set화면({ w: r.width, h: r.height }) }
    재기()
    if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', 재기); return () => window.removeEventListener('resize', 재기) }
    const ro = new ResizeObserver(재기)
    ro.observe(el)
    return () => ro.disconnect()
  }, [바탕, 자료])

  const 표 = useMemo(() => (바탕 ? 지도이름표(바탕.곳, 바탕.별) : null), [바탕])
  const 점 = useMemo(() => (표 && 자료 ? 지도점들(자료, 표, 때) : []), [표, 자료, 때])
  if (!자료 || !바탕) return null
  const 지금수 = 점.filter((x) => x.지금).length
  const [w, h] = 바탕.vb
  const 크기 = 지도점크기(w, h, 화면)

  return (
    <div className="card umap">
      <div className="umap-head">
        <b>🗺 지금 K-건설맵을 쓰는 곳</b>
        <span className="umap-key"><i className="umap-dot now" /> 지금(30분 안) <i className="umap-dot day" /> 오늘 다녀간 곳</span>
      </div>
      <svg ref={그림} className="umap-svg" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`한국 지도 — 지금 K-건설맵을 쓰는 곳 ${지금수 ? '표시' : '없음'}, 오늘 다녀간 곳 표시`}
           onClick={(e) => { if (e.target.tagName !== 'circle') set고른(null) }}>
        {Object.entries(바탕.판).map(([k, d]) => <path key={k} d={d} className="umap-land" />)}
        {점.map(({ p, 지금 }) => (
          <g key={p.k} className={(지금 ? 'umap-now' : 'umap-day') + (고른 && 고른.p.k === p.k ? ' on' : '')} onClick={() => set고른({ p, 지금 })}>
            {지금 > 0 && <circle cx={p.x} cy={p.y} r={크기.지금(지금) + 크기.고리} className="umap-ring" />}
            <circle cx={p.x} cy={p.y} r={지금 ? 크기.지금(지금) : 크기.오늘}>
              <title>{p.n}{지금 ? ' — 지금' : ' — 오늘'}</title>
            </circle>
          </g>
        ))}
      </svg>
      <div className="umap-foot">
        {고른
          ? <span>📍 <b>{고른.p.n}</b> ({고른.p.d}) — {고른.지금 ? '지금 쓰는 중' : '오늘 다녀감'}</span>
          : <span className="muted">{지금수 ? '점을 누르면 어느 도시인지 나옵니다.' : '지금은 조용합니다 — 옅은 점은 오늘 다녀간 곳입니다.'}</span>}
        <span className="muted umap-src">10분마다 새로 · 도시 단위(구글 애널리틱스)</span>
      </div>
    </div>
  )
}
