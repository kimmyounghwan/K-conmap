import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCorp, getAgency, getBoardRank } from './lib/data.js'
import { won, wonShort, pct, num, dateFull, dateTime, normCorp } from './lib/fmt.js'
import { winGrade } from './lib/winodds.js'

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
function scoreMissing(r) {
  const m = []
  if (!(Number(r?.amt) > 0 && Number(r?.rate) > 0)) m.push('낙찰금액·투찰률')
  if (!(Number(r?.base) > 0)) m.push('기초금액')
  if (!(Number(r?.aval) > 0 || r?.ayn === 'N')) m.push('A값')
  if (r?.lo == null || r?.hi == null) m.push('예가범위')
  return m
}

/* ══════════════════════════════════════════════════════════════
   채점은 «바로투찰이 다루는 자리»에서만 성립합니다 — 2026-09-03

   소장님: 「낙찰가와 바로투찰 차이가 너무 커. 신뢰도만 떨어진다.」
   맞는 지적인데, 원인이 «계산이 나쁘다» 가 아니었습니다.

   실측 958건: 1순위가 낙찰하한 위에 뜬 폭(창)이 승률을 45배 가릅니다.
   C·D 등급 156건에서는 **누가 계산해도 한 건도 못 땄습니다.**
   그런 자리에 우리 금액을 대보고 «1,387만원 비쌌다» 고 적는 건
   우리 성적이 아니라 그 공고의 성질을 우리 탓으로 적는 것입니다. 틀린 채점입니다.

   그래서 **A·B 등급만 채점합니다.** C·D 는 채점 대신 «왜 안 하는지» 를 적습니다.
   가리는 게 아니라, 성립하지 않는 채점을 하지 않는 것입니다.
   ══════════════════════════════════════════════════════════════ */
function scoreGrade(r) {
  return winGrade({ base: r?.base, est: 0, lo: r?.lo, hi: r?.hi,
                    inst: r?.inst, name: r?.name })
}
/** 채점이 되는 자리인가 — «규칙을 한 곳에만» 둡니다.
 *
 *  ⚠️ 2026-09-03 — 소장님: 「1순위에서도 채점 가능·불가능을 표시하기로 했잖아.」
 *     맞습니다. 그동안은 카드를 «펼쳐야만» 알 수 있었습니다.
 *     목록에도 붙이려면 두 곳에서 같은 판단을 해야 하는데,
 *     오늘만 «같은 규칙을 두 번 적어» 어긋난 걸 세 번 잡았습니다(등급·bidindex·검색색인).
 *     그래서 판단은 여기 하나만 두고, 목록도 상세도 이 함수를 부릅니다.
 *
 *  ⚠️ 값이 반쯤 있는 개찰에 버튼을 달면 «채점»을 눌렀는데
 *     «기초금액이 안 실려 와 사정률은 알 수 없습니다» 가 뜹니다. 그건 채점이 아닙니다.
 *     공고 쪽 «완비» 기준과 똑같이, 네 값이 다 있을 때만 답니다.
 *     실측(2026-09-02): 개찰 11,257건 중 7,873건(69.9%)이 완비.
 */
export function scoreState(r) {
  const g = scoreGrade(r)
  if (g && (g.key === 'C' || g.key === 'D')) {
    return { ok: false, why: 'grade', grade: g }
  }
  const miss = scoreMissing(r)
  if (miss.length) return { ok: false, why: 'missing', miss, grade: g }
  return { ok: true, grade: g }
}

function scoreLink(r) {
  if (!scoreState(r).ok) return null
  const amt = Number(r.amt) || 0
  const rate = Number(r.rate) || 0
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

/* ★ 이 공고만 있는 페이지로 가는 길 (2026-09-04).
   ⚠️ 일부러 <Link> 가 아니라 <a href> 입니다 — 미리 구운 정적 HTML 을 통째로 받아야
      그 안에 같이 넣어 둔 «공고 한 줄»(<script id="ndata">)로 화면이 그려집니다.
      7주 지난 개찰은 브라우저가 받을 수 있는 파일에 없으므로 이 길이 본체입니다.
   여기 있으면 1순위 목록·공고 목록 두 곳이 같이 얻습니다(두 벌로 안 적습니다). */
export function NoticeLink({ no, compact }) {
  if (!no) return null
  return (
    <a className={'noticelink' + (compact ? ' compact' : '')}
       href={`/notice/${encodeURIComponent(String(no))}`}
       title="이 공고만 있는 주소로 갑니다 — 카톡으로 보낼 수 있습니다"
       onClick={(e) => e.stopPropagation()}>
      {compact ? '🔗 공유' : '🔗 이 공고만 보기 · 주소로 공유하기 →'}
    </a>
  )
}

/* ── ① 개찰 결과 ───────────────────────── */
/* ══════════════════════════════════════════════════════════════
   투찰 순위 30곳은 목록 묶음에서 빼놨습니다 — 2026-09-06

   실측: 1순위 첫 묶음이 gzip 376KB 인데 그 중 303KB(80%)가 순위였습니다.
   목록을 «보기만» 하는 사람은 순위를 한 줄도 안 봅니다. 그래서 카드를 펼친
   **이 줄 것만** 50건짜리 작은 파일(약 5KB)로 받아옵니다. 묶음은 73KB 가 됐습니다.

   세 가지 길이 다 여기로 들어옵니다:
     · 목록에서 펼친 카드      → r._b · r._rk 가 있습니다 (useBoard 가 붙임)
     · 미리 구운 /notice/{번호} → r.corps 가 이미 들어 있습니다 (ndata)
     · 채점 화면(bidresult)     → r.corps 가 이미 들어 있습니다
   ⚠️ 못 받았을 때 «없는 채로» 그리면 안 됩니다 — 참가 60곳인 개찰이 조용히
      «정보 없음» 으로 보입니다. 그래서 받는 중에는 «불러오는 중» 을 보여줍니다.
   ══════════════════════════════════════════════════════════════ */
function useRanks(r) {
  const [got, setGot] = useState(null)
  const have = Array.isArray(r && r.corps) ? r.corps : null
  const key = have || !r || !r._b || !r._rk ? '' : r._b + '|' + r._rk[0] + '|' + r._rk[1]
  useEffect(() => {
    if (!key) return
    let live = true
    const [b, f, o] = key.split('|')
    const [name, kind] = b.split('/')
    getBoardRank(name, kind, Number(f))
      .then((a) => {
        if (!live) return
        const v = Array.isArray(a) ? a[Number(o)] : null
        setGot(Array.isArray(v) ? v : [])
      })
      .catch(() => { if (live) setGot([]) })
    return () => { live = false }
  }, [key])
  return { corps: have || got || [], waiting: !have && !!key && got === null }
}

function BidTab({ r }) {
  const { corps, waiting: rankWait } = useRanks(r)
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
      ) : (() => {
        const st = scoreState(r)
        const g = st.grade
        const cd = st.why === 'grade'
        return (
          <div className="nocalc">
            {cd ? (
              <>이 공고는 <b>{g.key}등급 ({g.label})</b>이라 채점하지 않습니다.
                {' '}실제 개찰 958건에서 이 등급은 <b>한 건도 못 땄습니다.</b>
                {' '}1순위가 낙찰하한 바로 위(0.005% 안)에 붙는 자리라,
                {' '}누가 어떻게 계산해도 결과가 같습니다.
                {' '}여기에 금액을 대보는 건 계산 실력이 아니라 공고의 성질을 재는 일이라
                {' '}하지 않습니다.</>
            ) : (
              <>이 개찰은 <b>채점에 필요한 값이 모자랍니다</b> — 조달청 자료에
                {' '}«{(st.miss || []).join(' · ')}» 이 안 실려 왔습니다.
                {' '}반쯤 아는 값으로 채점하면 «가져갔을 자리»가 남발됩니다. 그래서 하지 않습니다.</>
            )}
          </div>
        )
      })()}

      <div className="detail-h">
        투찰 순위 <span className="count">
          {(() => {
            const shown = corps.length
            const all = Math.max(Number(r.nrank) || 0, Number(r.np) || 0, shown)
            /* 낮게 쓴 30곳만 싣습니다 — 전부 실으면 목록 파일이 80MB 가 됩니다.
               승부는 낙찰하한 근처에서 갈리므로 «가장 낮게 쓴 쪽»만 있으면 됩니다. */
            return all > shown
              ? `· 참가 ${num(all)}곳 중 낮게 쓴 ${shown}곳`
              : `· ${shown}곳`
          })()}
        </span>
      </div>
      {rankWait && <div className="hintbox">투찰 순위를 불러오는 중입니다…</div>}
      {!rankWait && corps.length === 0 && <div className="hintbox">참여업체 정보가 없습니다.</div>}
      {corps.map((c, j) => {
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
      {corps.length === 1 && (
        <div className="hintbox">
          {/* 2026-09-02: 조달청은 순위를 «줍니다». 다만 공고번호로 물어야 옵니다
              (getOpengResultListInfoOpengCompt). 날짜로 부르면 안 옵니다.
              한 회차에 40건씩 채우므로, 갓 개찰된 공고는 조금 뒤에 채워집니다. */}
          {r.nrank === 1
            ? (() => {
                /* ★ 2026-09-03 — 「투찰 업체가 1곳이라는 게 말이 돼?」 라는 물음에서 나왔습니다.
                   자료는 맞았습니다(조달청 prtcptCnum = 1, 순위조회도 1곳). 그런데
                   화면이 «한 곳이었습니다» 라고만 하고 **왜인지를 말하지 않아** 의심을 샀습니다.
                   대부분은 면허·업종 제한 때문입니다 — 자격이 되는 곳이 애초에 몇 없습니다.
                   실측: 참가 1곳 개찰 799건 중 123건이 면허 제한이 걸린 공고였습니다.
                   조달청이 lcnsLmtNm 으로 주는 값이니 그대로 보여주면 됩니다. */
                const lic = (r.lic || []).map((x) => String(x).split('/')[0]).filter(Boolean)
                return (
                  <>이 공고는 <b>투찰업체가 한 곳</b>이었습니다.
                    {lic.length > 0
                      ? <> 참가 자격이 <b>{lic.join(' · ')}</b>로 묶여 있어,
                          자격이 되는 업체가 많지 않았던 것으로 보입니다.</>
                      : <> 드물지만 있는 일입니다 — 최근 개찰에서도 <b>799건</b>이
                          한 곳뿐이었습니다.</>}
                    {r.rate > 0 && <> 경쟁이 없으면 낙찰하한까지 내릴 이유가 없어
                      투찰률이 높게(이 공고 {r.rate}%) 나옵니다.</>}
                  </>
                )
              })()
            : <>순위를 아직 못 받아왔습니다 — 30분마다 조금씩 채웁니다.
                {r.np > 1 && <> 이 공고에는 <b>{r.np}곳</b>이 들어왔습니다.</>}
                {' '}잠시 뒤 다시 열어보시면 1위부터 나옵니다.</>}
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
