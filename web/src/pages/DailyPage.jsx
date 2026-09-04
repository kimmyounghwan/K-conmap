import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getBidIndex, indexRows, getOverview } from '../lib/data.js'
import { ShareBtn } from './CorpPage.jsx'
import { Empty } from '../components.jsx'
import { won, wonShort, pct, num } from '../lib/fmt.js'
import { quickBid, pickOdds, P50_FALLBACK } from '../lib/bidmath.js'

/**
 * /daily/{YYYY-MM-DD} — 「그날의 개찰 성적표」 (2026-09-04)
 *
 * 왜 만들었나
 *   사이트가 «찾아와야 보는 곳» 이라 단톡방에 던질 것이 없었습니다.
 *   날짜마다 한 장이면 매일 퍼갈 거리가 생기고, 검색엔진에는
 *   «매일 새 글이 나오는 곳» 으로 보입니다. 덤으로 이 한 장이
 *   그날 개찰 수십 건으로 «가는 길» 이 되어 크롤러가 안쪽까지 들어옵니다.
 *
 * ⚠️ 자료는 미리 구운 HTML 안의 <script id="ddata"> 하나뿐입니다 — 파일을 더 받지 않습니다.
 *    그래서 이 화면으로 오는 링크는 <Link> 가 아니라 <a href> 여야 합니다.
 *
 * ⚠️ 지나가면 안 변하는 것(그날 개찰)만 구워 둡니다.
 *    「지금 해볼 만한 자리」는 이틀이면 썩으므로 화면이 살아서 그립니다
 *    (bidindex + 이미 있는 pickOdds·quickBid — 규칙을 다시 적지 않습니다).
 */
function embedded() {
  try {
    const el = document.getElementById('ddata')
    const v = el ? JSON.parse(el.textContent || 'null') : null
    return v && typeof v === 'object' ? v : null
  } catch { return null }
}

/* daily.py 의 _row() 와 «같은 순서» 입니다. 한쪽만 고치면 엉뚱한 칸이 그려집니다.
   → selfcheck 의 check_daily() 가 두 벌을 대조합니다. */
const F = ['no', 'name', 'inst', 'np', 'rate', 'win', 'amt']

function Table({ title, note, rows, right }) {
  if (!rows || !rows.length) return null
  return (
    <div className="card">
      <div className="sec-title" style={{ margin: '0 0 6px' }}>{title}</div>
      {note && <div className="note sm" style={{ margin: '0 0 8px' }}>{note}</div>}
      {rows.map((a, i) => {
        const o = {}; F.forEach((k, j) => { o[k] = a[j] })
        return (
          <div className="row" key={o.no + '-' + i}>
            <div className="grow">
              <a className="t" href={`/notice/${encodeURIComponent(String(o.no))}`}>{o.name}</a>
              <div className="d">{o.inst}</div>
            </div>
            <span className="r">{right(o)}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function DailyPage() {
  const { date } = useParams()
  const dd = useMemo(embedded, [])
  const d = dd?.d || date || ''

  if (!dd) {
    return (
      <Empty icon="📅">
        «{date}» 성적표를 지금 화면에서 찾지 못했습니다.<br />
        날짜별 성적표는 각자 자기 주소로만 열립니다.<br />
        <a href="/daily" style={{ color: 'var(--accent)', fontWeight: 700 }}>날짜 목록에서 고르기 →</a>
      </Empty>
    )
  }

  const r = dd.r || {}, np = dd.np || {}
  return (
    <>
      <div className="btn-row" style={{ paddingTop: 14, marginBottom: 10 }}>
        <a className="btn ghost sm" href="/daily">← 다른 날짜</a>
        <ShareBtn />
      </div>
      <div className="card">
        <div style={{ fontSize: 18, fontWeight: 800 }}>{d.replace(/-/g, '.')} 개찰 성적표</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
          공사 {num(dd.n)}건
          {r.med != null && <> · 낙찰률 중앙 {pct(r.med, 3)}</>}
          {np.med != null && <> · 참가 중앙 {num(np.med)}곳</>}
        </div>
      </div>

      <div className="kv">
        <div><span>개찰 건수</span><b className="hi">{num(dd.n)}건</b></div>
        {r.med != null && <div><span>낙찰률 중앙</span><b>{pct(r.med, 3)}</b></div>}
        {r.min != null && <div><span>가장 낮게 / 높게</span><b>{pct(r.min, 3)} / {pct(r.max, 3)}</b></div>}
        {np.med != null && <div><span>참가업체수 중앙 / 최다</span><b>{num(np.med)}곳 / {num(np.max)}곳</b></div>}
        {dd.hot > 0 && <div><span>100곳 넘게 붙은 공고</span><b>{num(dd.hot)}건</b></div>}
        {dd.solo > 0 && <div><span>참가 1곳 공고</span><b>{num(dd.solo)}건</b></div>}
        {dd.sum > 0 && <div><span>낙찰금액 합계</span><b>{wonShort(dd.sum)}</b></div>}
      </div>

      <Table title="🔥 가장 치열했던 공고"
        note="참가업체수가 많을수록 1순위는 낙찰하한에 바짝 붙습니다 — 누가 계산해도 같은 자리가 됩니다."
        rows={dd.byNp}
        right={(o) => <>{o.np ? `${num(o.np)}곳` : ''}{o.rate != null ? ` · ${pct(o.rate, 3)}` : ''}</>} />

      <Table title="💰 금액이 큰 공고" rows={dd.byAmt}
        right={(o) => <>{wonShort(o.amt)}{o.rate != null ? ` · ${pct(o.rate, 3)}` : ''}</>} />

      <Table title="🌲 참가 1곳 — 아무도 안 붙은 자리"
        note="참가 자격(면허·지역)이 좁게 묶인 공고가 대부분입니다. 경쟁이 없으면 하한까지 내릴 이유가 없어 투찰률이 높게 나옵니다."
        rows={dd.solos} right={(o) => <>{o.rate != null ? pct(o.rate, 3) : ''}</>} />

      {(dd.multi || []).length > 0 && (
        <div className="card">
          <div className="sec-title" style={{ margin: '0 0 6px' }}>🥇 그날 두 건 이상 가져간 곳</div>
          {/* ⚠️ 세 번째 칸(u)은 «미리 구운 업체 페이지 주소» 입니다. prerender 가 판정해 넣습니다 —
              구운 것이 아니면 링크를 걸지 않습니다(크롤러가 빈 페이지를 보지 않게). */}
          {dd.multi.map(([w, c, u]) => (
            <div className="row" key={w}>
              <div className="grow">
                {u ? <a className="t" href={u}>{w}</a> : <div className="t">{w}</div>}
              </div>
              <span className="r">{c}건</span>
            </div>
          ))}
        </div>
      )}

      <OpenPicks />

      <div className="note" style={{ marginTop: 10 }}>
        공공데이터포털 나라장터 입찰정보를 가공해 보여드립니다. 분석 결과는 참고용이며 낙찰을 보장하지 않습니다.
      </div>
    </>
  )
}

/* 「지금 해볼 만한 자리」 — 마감 전 공고라 굽지 않고 화면에서 그립니다.
   금액·확률은 공고 카드·바로투찰과 «같은 함수»(quickBid · pickOdds)를 씁니다. */
function OpenPicks() {
  const [rows, setRows] = useState(null)
  const [pick, setPick] = useState(null)
  const [ov, setOv] = useState(null)
  useEffect(() => {
    let alive = true
    getOverview().then((v) => alive && setOv(v)).catch(() => {})
    getBidIndex().then((idx) => {
      if (!alive || !idx) return setRows([])
      setPick(idx.pick || null)
      setRows(indexRows(idx))
    }).catch(() => alive && setRows([]))
    return () => { alive = false }
  }, [])
  if (rows === null) return null

  const p50 = ov?.sjq?.p50 ?? P50_FALLBACK
  const today = new Date().toISOString().slice(0, 10)
  const list = rows
    .filter((r) => !r.close || String(r.close).slice(0, 10) >= today)
    .map((r) => {
      const qb = quickBid(r, p50)
      if (!qb) return null
      const od = pickOdds(r, pick, qb.amt)
      return { r, qb, od }
    })
    .filter((x) => x && x.r.enp != null && x.r.enp < 10)
    .sort((a, b) => (b.od?.p ?? 0) - (a.od?.p ?? 0))
    .slice(0, 10)
  if (!list.length) return null

  return (
    <div className="card">
      <div className="sec-title" style={{ margin: '0 0 6px' }}>🎯 지금 해볼 만한 자리</div>
      <div className="note sm" style={{ margin: '0 0 8px' }}>
        마감 전 공고 중 <b>예상 참가가 10곳 미만</b>인 것만 골랐습니다.
        실측 8,406건에서 1순위가 되는 자리는 금액이 아니라 <b>참가업체수</b>가 갈랐습니다
        (2~9곳 18.2% vs 100곳+ 1.6%).
      </div>
      {list.map(({ r, qb, od }) => (
        <div className="row" key={r.no}>
          <div className="grow">
            <a className="t" href={`/notice/${encodeURIComponent(String(r.no))}`}>{r.name}</a>
            <div className="d">
              {r.inst}
              {r.enp != null && ` · 예상 참가 ${num(r.enp)}곳`}
              {od?.p != null && ` · 이런 자리 1순위 ${od.p.toFixed(1)}%`}
            </div>
          </div>
          <span className="r">{won(qb.amt)}</span>
        </div>
      ))}
      <div className="note sm" style={{ marginTop: 8 }}>
        금액은 공고 카드·바로투찰과 같은 계산입니다. 더 보려면{' '}
        <Link to="/live" style={{ color: 'var(--accent)', fontWeight: 700 }}>공고 탭의 「🎯 자리 찾기」 →</Link>
      </div>
    </div>
  )
}

/* /daily — 날짜 목록. 미리 구운 HTML 안의 <script id="dlist"> 를 씁니다. */
export function DailyIndex() {
  const days = useMemo(() => {
    try {
      const el = document.getElementById('dlist')
      const v = el ? JSON.parse(el.textContent || 'null') : null
      return Array.isArray(v) ? v : null
    } catch { return null }
  }, [])
  if (!days || !days.length) {
    return (
      <Empty icon="📅">
        날짜 목록을 지금 화면에서 찾지 못했습니다.<br />
        <a href="/daily" style={{ color: 'var(--accent)', fontWeight: 700 }}>새로 열기 →</a>
      </Empty>
    )
  }
  return (
    <>
      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>날짜별 개찰 성적표</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
          하루 한 장 · 개찰이 올라오는 대로 갱신됩니다
        </div>
      </div>
      <div className="card">
        {/* ⚠️ 줄 «전체»를 링크로 둡니다. 전에는 날짜 글자(70px)만 눌렸습니다 —
            줄 너비가 1,123px 였으니 6%만 누를 수 있었습니다 (2026-09-04 실측).
            <a href> 여야 합니다(<Link> 아님) — 정적 HTML 을 받아야 그 안의 ddata 로 그려집니다. */}
        {days.map(([d, n]) => (
          <a className="row rowlink" href={`/daily/${d}`} key={d}>
            <div className="grow"><div className="t">{d.replace(/-/g, '.')} 개찰 성적표</div></div>
            <span className="r">{num(n)}건</span>
            <span className="go">→</span>
          </a>
        ))}
      </div>
    </>
  )
}
