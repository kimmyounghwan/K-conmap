import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getBidIndex, indexRows, getResults, getOverview } from '../lib/data.js'
import NoticeDetail from '../NoticeDetail.jsx'
import { ShareBtn } from './CorpPage.jsx'
import { Skeleton, Empty } from '../components.jsx'
import { pct, won, wonShort, dateFull } from '../lib/fmt.js'
import { quickBid, P50_FALLBACK } from '../lib/bidmath.js'

/**
 * /notice/{공고번호} — 공고 한 건 / 개찰 결과 한 건.
 *
 * 왜 만들었나 (2026-09-04)
 *   업체 페이지보다 검색 수요가 훨씬 큽니다. 업체 페이지는 «경쟁사를 보는 사람» 이라는
 *   좁은 수요지만, 공고 페이지는 **그 공고에 투찰한 60~300개 업체 전원**이
 *   「결과 어떻게 됐지」를 찾습니다. 나라장터에서도 볼 수 있지만 로그인하고 들어가야 합니다.
 *   그리고 개찰이 하루 570건씩 나오므로 페이지가 저절로 늘어납니다.
 *
 * ⚠️ 자료를 어디서 얻나 — 세 갈래를 순서대로 봅니다.
 *   ① 미리 구운 HTML 안에 같이 넣어 둔 한 줄(<script id="ndata">) — 파일을 더 안 받습니다.
 *      옛 개찰은 브라우저가 받을 수 있는 파일(bidindex·bidresult)에 없어서 이 길이 본체입니다.
 *   ② 마감 전 공고면 bidindex.json 에 있습니다.
 *   ③ 최근 7일 개찰이면 bidresult.json 에 있습니다.
 *   셋 다 없으면 «목록에서 보세요» 라고 정직하게 적고 색인에서 뺍니다(soft 404 방지).
 */
function embedded() {
  try {
    const el = document.getElementById('ndata')
    if (!el) return null
    const r = JSON.parse(el.textContent || 'null')
    return r && typeof r === 'object' ? r : null
  } catch { return null }
}

export default function NoticePage() {
  const { no } = useParams()
  const key = decodeURIComponent(no || '')
  const pre = useMemo(embedded, [])
  const [r, setR] = useState(pre && String(pre.no) === key ? pre : undefined)

  useEffect(() => {
    if (r !== undefined) return
    let alive = true
    ;(async () => {
      try {
        const idx = await getBidIndex()
        const hit = idx ? indexRows(idx).find((x) => String(x.no) === key) : null
        if (hit) { if (alive) setR(hit); return }
      } catch { /* 다음 갈래로 */ }
      try {
        const res = await getResults()
        const rows = res ? indexRows(res) : []
        const hit = rows.find((x) => String(x.no) === key)
        if (alive) setR(hit || null)
      } catch { if (alive) setR(null) }
    })()
    return () => { alive = false }
  }, [key])   // eslint-disable-line react-hooks/exhaustive-deps

  /* 메타태그 — 미리 구운 HTML 에 이미 같은 문구가 박혀 있습니다.
     여기서 다시 넣는 건 SPA 안에서 이동해 왔을 때를 위한 것입니다. */
  useEffect(() => {
    if (r === undefined) return
    const nm = r?.name || key
    const t = r?.win
      ? `${nm} 낙찰 결과 — ${r.win}${typeof r.rate === 'number' ? ` ${pct(r.rate, 3)}` : ''} | K-건설맵`
      : `${nm} 입찰 공고${r?.base ? ` — 기초금액 ${wonShort(r.base)}` : ''} | K-건설맵`
    document.title = r ? t : `${key} | K-건설맵`
    setMeta('robots', r ? null : 'noindex')
    return () => setMeta('robots', null)
  }, [r, key])

  if (r === undefined) return <div style={{ paddingTop: 14 }}><Skeleton n={3} /></div>
  if (!r) {
    return (
      <Empty icon="📋">
        공고번호 «{key}» 를 지금 화면에서 찾지 못했습니다.<br />
        7주가 지난 개찰은 목록에서 빠집니다.<br />
        <Link to="/first" style={{ color: 'var(--accent)', fontWeight: 700 }}>1순위 목록에서 찾아보기 →</Link>
      </Empty>
    )
  }

  const sub = [r.inst, dateFull(r.dt || r.close)].filter(Boolean).join(' · ')
  return (
    <>
      <div className="btn-row" style={{ paddingTop: 14, marginBottom: 10 }}>
        <Link to={r.win ? '/first' : '/live'} className="btn ghost sm">
          ← {r.win ? '1순위 목록' : '공고 목록'}
        </Link>
        <ShareBtn />
      </div>
      <div className="card">
        <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.45, wordBreak: 'keep-all' }}>{r.name || key}</div>
        {sub && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
      </div>
      {/* ⚠️ 개찰이 끝난 건에만 «개찰 결과» 화면을 씁니다.
          마감 전 공고에 그걸 그리면 「낙찰가 −, 투찰률 −」 이 떠서
          «개찰했는데 아무도 안 됐다» 로 읽힙니다 (CLAUDE.md — 한 화면이 서로 반대말 하지 않기). */}
      {r.win ? <NoticeDetail r={r} /> : <OpenNotice r={r} />}
      <div className="note" style={{ marginTop: 10 }}>
        공공데이터포털 나라장터 입찰정보를 가공해 보여드립니다. 분석 결과는 참고용이며 낙찰을 보장하지 않습니다.
      </div>
    </>
  )
}

/* 아직 개찰 전인 공고 — 검색으로 들어온 사람이 여기서 바로 얻어야 할 것은
   «내가 얼마를 써야 하나» 입니다. 그래서 권장 투찰금액을 바로 보여줍니다.
   금액은 공고 카드·바로투찰과 **같은 함수**(quickBid)를 씁니다 — 두 벌로 안 적습니다. */
function OpenNotice({ r }) {
  const [ov, setOv] = useState(null)
  useEffect(() => { getOverview().then(setOv).catch(() => {}) }, [])
  const qb = quickBid(r, ov?.sjq?.p50 ?? P50_FALLBACK)
  return (
    <>
      <div className="verdict" style={{ marginTop: 10 }}>
        ⏳ <b>아직 개찰 전입니다</b>
        {r.close && <> · 마감 {dateFull(r.close)}</>}
      </div>
      {qb && (
        <div className="card">
          <div className="sec-title" style={{ margin: '0 0 6px' }}>💰 권장 투찰금액</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{won(qb.amt)}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 3 }}>
            투찰률 {pct(qb.rate, 3)}
            {qb.mode === 'auto' && qb.rule && <> · 이 공고 자리 실측으로 {qb.rule.q}분위</>}
          </div>
        </div>
      )}
      <div className="kv">
        <div><span>기초금액</span><b className="hi">{r.base > 0 ? won(r.base) : '아직 공개 안 됨'}</b></div>
        <div><span>추정가격</span><b>{won(r.est || r.budget)}</b></div>
        {r.aval > 0 && <div><span>A값</span><b>{won(r.aval)}</b></div>}
        {r.llr > 0 && <div><span>낙찰하한율</span><b>{pct(r.llr, 3)}</b></div>}
        {r.lo != null && r.hi != null && <div><span>예가범위</span><b>{r.lo}% ~ {r.hi}%</b></div>}
        <div><span>공고번호</span><b>{r.no}{r.ord ? `-${r.ord}` : ''}</b></div>
      </div>
      {(r.lic || []).length > 0 && (
        <div className="licbox" style={{ marginTop: 10 }}>
          <div className="h">참가 가능 면허 · 업종</div>
          <div className="lics big">{r.lic.map((L) => <span key={L} className="lic on">{L}</span>)}</div>
        </div>
      )}
      <div className="btn-row" style={{ marginTop: 10 }}>
        <Link className="btn" to={`/calc?no=${encodeURIComponent(String(r.no))}`} style={{ flex: 1 }}>
          💰 바로투찰에서 열기 →
        </Link>
        <a className="btn ghost" href={r.url || 'https://www.g2b.go.kr'} target="_blank" rel="noreferrer">
          나라장터 공고 ↗
        </a>
      </div>
    </>
  )
}

function setMeta(nameAttr, content) {
  let el = document.head.querySelector(`meta[name="${nameAttr}"]`)
  if (content === null) { if (el && nameAttr === 'robots') el.remove(); return }
  if (!el) { el = document.createElement('meta'); el.setAttribute('name', nameAttr); document.head.appendChild(el) }
  el.setAttribute('content', content)
}
