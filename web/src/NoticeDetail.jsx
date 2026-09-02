import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCorp, getAgency } from './lib/data.js'
import { won, wonShort, pct, num, dateFull, dateTime, normCorp } from './lib/fmt.js'

/* ============================================================
   개찰 카드를 펼쳤을 때 나오는 상세 화면

   다른 입찰 사이트들이 개찰 결과에서 보여주는 것을 참고했습니다.
   («비드프로», «모두입찰» 등 — 기초금액·예정가격·낙찰하한율·참여업체 순위)

   우리는 거기에 3년치 자료로만 할 수 있는 걸 더했습니다.
     · 그 업체가 3년간 어떻게 투찰해 왔는지
     · 그 발주기관이 3년간 어느 구간에서 낙찰시켰는지
   ============================================================ */

/** 기초금액에는 부가세가 들어 있습니다. 추정가격은 대략 ÷1.1 입니다. */
const estPrice = (base) => (base > 0 ? Math.round(base / 1.1) : 0)

/* ══════════════════════════════════════════════════════════════
   «채점» 버튼은 채점이 되는 개찰에만 답니다.

   채점에 쓰는 개찰결과 색인(bidresult.json)은 **최근 7일치**만 담습니다.
   그런데 1순위 목록은 7주치를 보여줍니다.
   그래서 아무 카드에나 버튼을 달면 6주치는 눌러도 채점이 안 됩니다 —
   버튼을 눌렀는데 아무 일도 안 일어나는 게 가장 나쁩니다.
   기간이 지난 개찰은 버튼 대신 «왜 안 되는지»를 적습니다.
   ⚠️ 아래 숫자는 collect.py 의 export_bidresult 기간과 **같아야** 합니다.
   ══════════════════════════════════════════════════════════════ */
/* 채점에 필요한 값을 «주소에 실어» 보냅니다.
   채점용 색인(bidresult.json)은 최근 7일치만 담는데 이 목록은 7주치를 보여줍니다.
   값을 실어 보내면 자료를 더 받지 않고도 7주 전체가 채점됩니다. */
function scoreLink(r) {
  const amt = Number(r?.amt) || 0
  const rate = Number(r?.rate) || 0
  if (!(amt > 0 && rate > 0)) return null      // 되짚을 수 없으면 버튼을 달지 않습니다
  const q = new URLSearchParams()
  q.set('no', String(r.no || ''))
  q.set('sc', '1')
  q.set('amt', String(amt))
  q.set('rate', String(rate))
  if (r.base > 0) q.set('base', String(r.base))
  if (r.aval) q.set('aval', String(r.aval))
  if (r.ayn) q.set('ayn', String(r.ayn))
  if (r.lo != null) q.set('lo', String(r.lo))
  if (r.hi != null) q.set('hi', String(r.hi))
  if (r.np) q.set('np', String(r.np))
  if (r.win) q.set('win', String(r.win).slice(0, 40))
  if (r.name) q.set('nm', String(r.name).slice(0, 60))
  if (r.inst) q.set('it', String(r.inst).slice(0, 30))
  if (r.dt) q.set('dt', String(r.dt))
  return `/?${q.toString()}`
}

/**
 * 일반공사 적격심사 낙찰하한율 (조달청 기준, 참고용)
 *   50억~100억 87.495 / 10억~50억 88.745 / 10억 미만 89.745
 *   100억 이상은 종합심사라 별도 기준입니다.
 */
function lowerLimit(base) {
  const p = estPrice(base)
  if (!p) return null
  const eok = p / 1e8
  if (eok >= 100) return { rate: null, note: '100억 이상 — 종합심사(별도 기준)' }
  if (eok >= 50) return { rate: 87.495, note: '추정가격 50억~100억' }
  if (eok >= 10) return { rate: 88.745, note: '추정가격 10억~50억' }
  return { rate: 89.745, note: '추정가격 10억 미만' }
}

/** 기초금액 대비 몇 %인지 */
const rateOf = (amt, base) =>
  base > 0 && amt > 0 ? Math.round((amt / base) * 100000) / 1000 : null

/** 나라장터 원문 주소 */
const g2bUrl = (no, ord) =>
  `https://www.g2b.go.kr/link/PNPE027_01/single/?bidPbancNo=${encodeURIComponent(no)}&bidPbancOrd=${ord || '000'}`

const TABS = [
  ['bid', '개찰 결과'],
  ['corp', '1순위 업체'],
  ['inst', '발주기관'],
  ['doc', '공고문 · 내역서'],
]

export default function NoticeDetail({ r }) {
  const [tab, setTab] = useState('bid')
  return (
    <div className="detail" onClick={(e) => e.stopPropagation()}>
      <div className="dtabs">
        {TABS.map(([k, label]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'bid' && <BidTab r={r} />}
      {tab === 'corp' && <CorpTab name={r.win} />}
      {tab === 'inst' && <InstTab name={r.inst} />}
      {tab === 'doc' && <DocTab r={r} />}
    </div>
  )
}

/* ── ① 개찰 결과 ───────────────────────── */
function BidTab({ r }) {
  const winAmt = r.sAmt || r.amt
  const ll = lowerLimit(r.base)
  const est = estPrice(r.base)
  return (
    <>
      <div className="kv">
        <div><span>기초금액</span><b>{r.base > 0 ? won(r.base) : '공개 안 됨'}</b></div>
        <div><span>추정가격 (추산)</span><b>{est ? won(est) : '-'}</b></div>
        <div><span>낙찰가 (1순위)</span><b className="hi">{won(winAmt)}</b></div>
        <div><span>투찰률</span><b>{r.rate != null ? pct(r.rate, 3) : pct(rateOf(winAmt, r.base), 3)}</b></div>
        <div><span>예가범위</span><b>{r.lo != null && r.hi != null ? `${r.lo}% ~ ${r.hi}%` : '-'}</b></div>
        <div>
          <span>낙찰하한율 (참고)</span>
          <b>{ll ? (ll.rate ? pct(ll.rate, 3) : '별도') : '-'}</b>
        </div>
        {r.np > 0 && (
          <div><span>참가업체</span><b className="hi">{num(r.np)}곳</b></div>
        )}
      </div>

      {ll && (
        <div className="hintbox">
          {ll.note} · 일반공사 적격심사 기준입니다. 업종·발주기관에 따라 다를 수 있으니
          공고서의 적격심사 기준을 반드시 확인하세요.
        </div>
      )}

      {/* 낙찰 업체 상세 — 조달청 낙찰자 목록에서 옵니다 (나라장터에 공개되는 정보) */}
      {(r.adr || r.tel || r.ceo || r.bno) && (
        <div className="winbox">
          <div className="h">🏆 낙찰 업체</div>
          <div className="nm">{r.win}</div>
          <div className="kv2">
            {r.ceo && <div><span>대표자</span><b>{r.ceo}</b></div>}
            {r.bno && (
              <div><span>사업자</span>
                <b>{r.bno.slice(0, 3)}-{r.bno.slice(3, 5)}-{r.bno.slice(5)}</b></div>
            )}
            {r.adr && (
              <div><span>주소</span>
                <b>{r.adr}{r.tsrc ? <i className="tsrc">다른 공고에서 확인</i> : null}</b></div>
            )}
            {r.tel && (
              <div><span>전화</span>
                <b><a href={`tel:${r.tel.replace(/[^0-9+]/g, '')}`}>{r.tel}</a>
                  {r.tsrc ? <i className="tsrc">다른 공고에서 확인</i> : null}</b></div>
            )}
          </div>
          {/* 조달청은 낙찰자 상세를 «주는 공고»에만 실어 줍니다.
              없는 걸 «-» 로 채우지 않고, 왜 없는지 밝힙니다. */}
          {!r.adr && !r.tel && (
            <div className="wno solo" style={{ marginTop: 8, borderTop: 0 }}>
              이 공고는 조달청이 주소·전화를 함께 주지 않았고, 이 업체의 다른 공고에서도
              아직 확인되지 않았습니다.
            </div>
          )}
        </div>
      )}

      {/* 개찰이 끝난 공고는 «채점»이 됩니다 —
          우리 권장 투찰률로 넣었으면 이 자리를 가져갔을지 바로 봅니다.
          (투찰이 아니라 되돌아보기라서, 끝난 공고에도 붙일 이유가 있습니다) */}
      {scoreLink(r) ? (
        <Link className="btn ghost sm" style={{ width: '100%', marginTop: 10 }} to={scoreLink(r)}>
          📊 바로투찰에서 채점하기 — 우리 권장으로 넣었으면?
        </Link>
      ) : (
        <div className="nocalc">
          이 개찰은 <b>채점에 필요한 값이 모자랍니다</b> — 낙찰금액·투찰률이 있어야
          그날의 예정가격을 되짚을 수 있습니다.
        </div>
      )}

      <div className="detail-h">
        투찰 순위 <span className="count">· {(r.corps || []).length}곳</span>
      </div>
      {(r.corps || []).length === 0 && <div className="hintbox">참여업체 정보가 없습니다.</div>}
      {(r.corps || []).map((c, j) => {
        const cr = c[2] != null ? c[2] : rateOf(c[1], r.base)
        return (
          <div className="row" key={j}>
            <span className={'badge ' + (j === 0 ? 'g' : 'n')}>{j + 1}위</span>
            <div className="grow">
              <div className="t">{c[0]}</div>
              <div className="d">{won(c[1])}</div>
            </div>
            <span className="r">{cr != null ? pct(cr, 3) : '-'}</span>
          </div>
        )
      })}
      {(r.corps || []).length === 1 && (
        <div className="hintbox">
          조달청 개찰결과 자료가 <b>1순위(낙찰자)만</b> 알려줍니다.
          2위 이하 투찰 내역은 제공되지 않아 표시하지 못합니다.
          나라장터 원문에서는 전체 투찰 순위를 볼 수 있습니다.
        </div>
      )}

      {/* 여기는 이미 개찰이 끝난 공고입니다. 투찰금액을 계산할 이유가 없어
          «바로투찰» 버튼은 두지 않습니다. 그 버튼은 마감 전 «공고» 화면에 있습니다. */}
    </>
  )
}

/* ── ② 1순위 업체 (3년치) ──────────────── */
function CorpTab({ name }) {
  const [d, setD] = useState(undefined)
  useEffect(() => {
    let ok = true
    getCorp(normCorp(name)).then((v) => { if (ok) setD(v) })
    return () => { ok = false }
  }, [name])

  if (d === undefined) return <div className="skel" style={{ height: 90 }} />
  if (!d) {
    return (
      <div className="hintbox">
        <b>{name}</b><br />
        최근 3년 낙찰 기록에서 찾지 못했습니다. 이번이 첫 낙찰이거나
        상호가 조금 다르게 등록돼 있을 수 있습니다.
      </div>
    )
  }
  const top = (d.h || [])[0]
  return (
    <>
      <div className="detail-h">{d.name} <span className="count">· 최근 3년</span></div>
      <div className="kv">
        <div><span>낙찰</span><b>{num(d.n)}건</b></div>
        <div><span>평균 투찰률</span><b>{pct(d.s?.avg, 3)}</b></div>
        <div><span>편차</span><b>{d.s?.std != null ? d.s.std.toFixed(3) : '-'}</b></div>
        <div><span>최다 구간</span><b>{top ? pct(top[0], 2) : '-'}</b></div>
      </div>

      {(d.inst || []).length > 0 && (
        <>
          <div className="detail-h">주로 낙찰받은 기관</div>
          {(d.inst || []).slice(0, 5).map(([nm, c], i) => (
            <div className="row" key={i}>
              <div className="grow"><div className="t">{nm}</div></div>
              <span className="r">{num(c)}건</span>
            </div>
          ))}
        </>
      )}

      {(d.cases || []).length > 0 && (
        <>
          <div className="detail-h">최근 낙찰 사례</div>
          {(d.cases || []).slice(0, 3).map((c, i) => (
            <div className="row" key={i}>
              <div className="grow">
                <div className="t">{c[0]}</div>
                <div className="d">{dateFull(c[1])} · {c[2]}</div>
              </div>
              <span className="r">{c[3] != null ? pct(c[3], 3) : won(c[4])}</span>
            </div>
          ))}
        </>
      )}

      <Link className="btn ghost sm" style={{ width: '100%', marginTop: 10 }}
        to={`/analysis?m=corp&q=${encodeURIComponent(d.name)}`}>
        이 업체 전체 분석 보기
      </Link>
    </>
  )
}

/* ── ③ 발주기관 (3년치) ────────────────── */
function InstTab({ name }) {
  const [d, setD] = useState(undefined)
  useEffect(() => {
    let ok = true
    getAgency(name).then((v) => { if (ok) setD(v) })
    return () => { ok = false }
  }, [name])

  if (d === undefined) return <div className="skel" style={{ height: 90 }} />
  if (!d) return <div className="hintbox"><b>{name}</b><br />최근 3년 자료가 부족한 기관입니다.</div>

  const top = (d.h01 || d.h1 || [])[0]
  return (
    <>
      <div className="detail-h">{name} <span className="count">· 최근 3년</span></div>
      <div className="kv">
        <div><span>표본</span><b>{num(d.n)}건</b></div>
        <div><span>평균 투찰률</span><b>{pct(d.s?.avg, 3)}</b></div>
        <div><span>편차</span><b>{d.s?.std != null ? d.s.std.toFixed(3) : '-'}</b></div>
        <div><span>최다 구간</span><b className="hi">{top ? pct(top[0], 2) : '-'}</b></div>
      </div>

      {(d.corps || []).length > 0 && (
        <>
          <div className="detail-h">이 기관에서 자주 낙찰받는 업체</div>
          {(d.corps || []).slice(0, 5).map(([nm, c], i) => (
            <div className="row" key={i}>
              <span className="badge n">{i + 1}</span>
              <div className="grow"><div className="t">{nm}</div></div>
              <span className="r">{num(c)}건</span>
            </div>
          ))}
        </>
      )}

      <Link className="btn ghost sm" style={{ width: '100%', marginTop: 10 }}
        to={`/agency/${encodeURIComponent(name)}`}>
        이 기관 전체 분석 보기
      </Link>
    </>
  )
}

/* ── ④ 공고문 · 내역서 ─────────────────── */
function DocTab({ r }) {
  return (
    <>
      <div className="kv">
        <div><span>공고번호</span><b>{r.no || '-'}</b></div>
        <div><span>차수</span><b>{r.ord || '-'}</b></div>
        <div><span>개찰일시</span><b>{dateTime(r.dt)}</b></div>
        <div><span>발주기관</span><b>{r.inst}</b></div>
      </div>

      <div className="hintbox">
        <b>내역서 · 설계서 · 공고서</b>는 나라장터에서만 내려받을 수 있습니다.
        아래 버튼으로 이 공고의 원문을 열면 첨부파일 목록에서 받으실 수 있습니다.
      </div>

      <a className="btn" style={{ width: '100%', marginTop: 10 }}
        href={g2bUrl(r.no, r.ord)} target="_blank" rel="noreferrer">
        나라장터 공고 원문 열기 →
      </a>
      <a className="btn ghost sm" style={{ width: '100%', marginTop: 8 }}
        href={`https://www.g2b.go.kr/`} target="_blank" rel="noreferrer">
        나라장터 첫 화면에서 공고번호로 찾기
      </a>
      <div className="note" style={{ marginTop: 8 }}>
        원문이 안 열리면 차수가 달라서일 수 있습니다. 그때는 나라장터에서
        공고번호 <b>{r.no}</b> 로 검색하세요.
      </div>
    </>
  )
}
