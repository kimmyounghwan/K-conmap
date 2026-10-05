/**
 * 🗺 지금 K-건설맵을 쓰는 곳 — 바로투찰 맨 위 지도 (2026-10-02 · G114 · G144 2026-10-05 사랑방 → 바로투찰)
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
 * ■ G144 (2026-10-05) 소장님: 「실시간 지도를 바로입찰 상단에 … 조회수가 가장 많으니까 · 지역별 누적도」 「사랑방에 있는 지도는 제거하고」
 *   「사랑방 크기와 같게 지도는 줄이지 말고」 「개설일 8월 30일, 누적은 9월 15일 부터」 「애널리틱스 처럼 누적으로 서울 몇명, 부산 몇명, 실시간으로 올라가게」
 *   「오늘도 카운트 할까?」 → 제목 아래 «2026. 8. 30. 문을 열었습니다 · 오늘 N일째» · 지금(30분 안) 전국 N명 ·
 *   시·도별 «누적 N명 · 오늘 +N» (fresh/reg — 10분마다) · 숫자가 바뀌면 올라가는 모습(카운트업) · 지도 크기는 그대로(PC 760px).
 *   누르면(점 · 시도 줄) 누적 카운트 «|지도|누름» 한 번(화면엔 안 보임).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { 지도주소, 지도이름표, 지도점들, 지도점크기, 지역주소, 지역줄들, 날째, 날글, 개설일, 누적시작 } from '../lib/이용자지도.js'
import { 세기 } from '../lib/받은수.jsx'

const 쉼 = (n) => Math.round(n || 0).toLocaleString('ko-KR')
let 셌다 = false
const 누름세기 = () => { if (!셌다) { 셌다 = true; 세기('|지도|누름') } }

/** 숫자가 바뀌면 옛 값에서 새 값까지 올라가는 모습(0.9초) — 움직임 줄이기 설정이면 바로 */
function useCountUp(값) {
  const [보임, set보임] = useState(값)
  const 옛 = useRef(값)
  useEffect(() => {
    const from = 옛.current, to = 값
    옛.current = 값
    if (from === to || typeof window === 'undefined') { set보임(to); return undefined }
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { set보임(to); return undefined }
    const t0 = performance.now()
    let id = 0
    const 걸음 = (t) => {
      const k = Math.min(1, (t - t0) / 900)
      set보임(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))))
      if (k < 1) id = requestAnimationFrame(걸음)
    }
    id = requestAnimationFrame(걸음)
    return () => cancelAnimationFrame(id)
  }, [값])
  return 보임
}

function 수({ v }) { return <>{쉼(useCountUp(v))}</> }

export default function 이용자지도() {
  const [바탕, set바탕] = useState(null)
  const [자료, set자료] = useState(null)
  const [지역, set지역] = useState(null)
  const [고른, set고른] = useState(null)
  const [다봄, set다봄] = useState(false)       /* 시·도 6곳만 · 누르면 모두 · 다시 누르면 접기(G145 — PC · 폰 같음) */
  const [때, set때] = useState(Date.now())
  const [화면, set화면] = useState(null)          // {w, h} — 그려진 지도 크기(px)
  const 그림 = useRef(null)

  useEffect(() => {
    let 살 = true
    const 받기 = async () => {
      try {
        const [r, g] = await Promise.all([fetch(지도주소, { cache: 'no-store' }), fetch(지역주소, { cache: 'no-store' }).catch(() => null)])
        const j = r.ok ? await r.json() : null
        const k = g && g.ok ? await g.json().catch(() => null) : null
        if (살) { set자료(j); set지역(k); set때(Date.now()) }
        if (j && 살) import('../data/한국지도.json').then((m) => { if (살) set바탕(m.default || m) }).catch(() => {})
      } catch (e) { /* 인터넷 · 막힘 — 지도 없이 */ }
    }
    받기()
    const 틈 = setInterval(() => { if (document.visibilityState === 'visible') 받기() }, 3 * 60000)    /* G144 3분마다(자료는 10분마다 바뀜) */
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
  const 줄들 = useMemo(() => 지역줄들(지역, 때), [지역, 때])
  if (!자료 || !바탕) return null
  const 지금수 = 점.filter((x) => x.지금).length
  const 새것 = typeof 자료.at === 'number' && 때 - 자료.at < 45 * 60000
  const 지금사람 = 새것 && typeof 자료.n === 'number' ? 자료.n : null
  const [w, h] = 바탕.vb
  const 크기 = 지도점크기(w, h, 화면)
  const 큰 = 줄들 && 줄들.줄.length ? Math.max(...줄들.줄.map((x) => x.a)) || 1 : 1

  return (
    <div className="card umap">
      <div className="umap-head">
        <div className="umap-title">
          <b>🗺 지금 K-건설맵을 쓰는 곳</b>
          <span className="umap-open">{날글(개설일)} 문을 열었습니다 · 오늘 <b>{날째(때)}일째</b></span>
        </div>
        <span className="umap-key"><i className="umap-dot now" /> 지금(30분 안) <i className="umap-dot day" /> 오늘 다녀간 곳</span>
      </div>
      <div className={'umap-body' + (줄들 && 줄들.줄.length ? ' two' : '')}>
        <div className="umap-mapcol">
          <svg ref={그림} className="umap-svg" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`한국 지도 — 지금 K-건설맵을 쓰는 곳 ${지금수 ? '표시' : '없음'}, 오늘 다녀간 곳 표시`}
               onClick={(e) => { if (e.target.tagName !== 'circle') set고른(null) }}>
            {Object.entries(바탕.판).map(([k, d]) => <path key={k} d={d} className="umap-land" />)}
            {점.map(({ p, 지금 }) => (
              <g key={p.k} className={(지금 ? 'umap-now' : 'umap-day') + (고른 && 고른.p.k === p.k ? ' on' : '')} onClick={() => { set고른({ p, 지금 }); 누름세기() }}>
                {지금 > 0 && <circle cx={p.x} cy={p.y} r={크기.지금(지금) + 크기.고리} className="umap-ring" />}
                <circle cx={p.x} cy={p.y} r={지금 ? 크기.지금(지금) : 크기.오늘}>
                  <title>{p.n}{지금 ? ' — 지금' : ' — 오늘'}</title>
                </circle>
              </g>
            ))}
          </svg>
        </div>
        {줄들 && 줄들.줄.length > 0 && (
          <div className="umap-reg">
            <div className="umap-now-n">
              <i className="umap-dot now" /> 지금(30분 안) <b>{지금사람 != null ? <><수 v={지금사람} />명</> : '—'}</b>
            </div>
            <div className="umap-tot">
              <span>전국 누적 <b><수 v={줄들.전국.a} />명</b></span>
              <span className="umap-today">오늘 <b>+<수 v={줄들.전국.t} /></b></span>
            </div>
            <div className="umap-reg-h"><span>시·도</span><span>{날글(누적시작)}부터 누적 · 오늘</span></div>
            <ol className={'umap-rows' + (다봄 ? ' all' : '')}>
              {줄들.줄.map((x) => (
                <li key={x.n} onClick={누름세기}>
                  <span className="umap-rn">{x.n}</span>
                  <span className="umap-bar"><i style={{ width: `${Math.max(2, (x.a / 큰) * 100)}%` }} /></span>
                  <span className="umap-ra"><수 v={x.a} />명</span>
                  <span className={'umap-rt' + (x.t > 0 ? ' up' : '')}>{x.t > 0 ? <>+<수 v={x.t} /></> : '·'}</span>
                </li>
              ))}
            </ol>
            {줄들.줄.length > 6 && (     /* G145 소장님 「전국 누적 아래 접기 버튼 없어」 → PC · 폰 모두 6곳 + 펴기 ↔ 접기 */
              <button type="button" className="umap-more" aria-expanded={다봄} onClick={() => { set다봄((v) => !v); if (!다봄) 누름세기() }}>
                {다봄 ? '▲ 접기' : `▼ 시·도 모두 보기 (${줄들.줄.length})`}
              </button>
            )}
          </div>
        )}
      </div>
      <div className="umap-foot">
        {고른
          ? <span>📍 <b>{고른.p.n}</b> ({고른.p.d}) — {고른.지금 ? '지금 쓰는 중' : '오늘 다녀감'}</span>
          : <span className="muted">{지금수 ? '점을 누르면 어느 도시인지 나옵니다.' : '지금은 조용합니다 — 옅은 점은 오늘 다녀간 곳입니다.'}</span>}
        <span className="muted umap-src">10분마다 새로 · 구글 애널리틱스(사용자 수 · 누적·오늘은 애널리틱스에 잡히는 대로 조금 늦게 올라갑니다)</span>
      </div>
    </div>
  )
}
