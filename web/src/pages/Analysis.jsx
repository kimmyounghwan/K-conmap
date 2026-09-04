import { SpotBlock, OpenNotices, corpMatch } from '../Spot.jsx'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { searchCorp } from '../lib/data.js'
import { AgencyPicker, Bars, Months, Tile, Empty } from '../components.jsx'
import { wonShort, pct, num, dateFull, normCorp } from '../lib/fmt.js'

export default function Analysis() {
  const [sp, setSp] = useSearchParams()
  const mode = sp.get('m') === 'corp' ? 'corp' : 'agency'
  const setMode = (m) => setSp(m === 'corp' ? { m: 'corp' } : {}, { replace: true })

  return (
    <>
      <div className="sec-title" style={{ marginTop: 14 }}>
        🔍 분석 <span className="count">· 3년치 낙찰 데이터</span>
      </div>
      <div className="seg">
        <button className={mode === 'agency' ? 'on' : ''} onClick={() => setMode('agency')}>발주기관 분석</button>
        <button className={mode === 'corp' ? 'on' : ''} onClick={() => setMode('corp')}>업체 자가진단</button>
      </div>
      {mode === 'agency' ? <AgencyTab /> : <CorpTab />}
    </>
  )
}

/* ── 발주기관 ─────────────────────────── */
/* ★ 2026-09-04 — 고르면 «전용 주소»로 갑니다 (/agency/{기관}).
   전에는 이 탭 안에서 화면만 바뀌고 주소는 /analysis 그대로였습니다.
   그래서 그 화면을 카톡으로 보낼 수가 없었습니다 — 받은 사람은 빈 검색창만 봤습니다.
   이제 주소가 바뀌므로 복사·공유·즐겨찾기·뒤로가기가 전부 제대로 됩니다.
   화면을 두 벌로 그리지 않습니다 — 결과는 전용 페이지 한 곳에서만 그립니다. */
function AgencyTab() {
  const [name, setName] = useState('')
  const navigate = useNavigate()

  return (
    <>
      <div className="card">
        <AgencyPicker value={name} autoFocus
          onPick={({ name: n }) => { setName(n); navigate('/agency/' + encodeURIComponent(n)) }} />
      </div>
      <Empty icon="🏛️">
        발주기관을 검색해보세요.<br />
        투찰률 히트맵 · 독식 업체 · 발주 시기 · 금액대를 한 번에 봅니다.
      </Empty>
    </>
  )
}

/* ── 업체 자가진단 ────────────────────── */
function CorpTab() {
  const [q, setQ] = useState('')
  const [list, setList] = useState([])
  const [open, setOpen] = useState(false)
  const [deep, setDeep] = useState(false)     // 이름 가운데도 찾기
  const timer = useRef(null)
  const navigate = useNavigate()

  /* ⚠️ 기본은 «이름 앞»으로만 찾습니다 — 업체 이름 목록이 gzip 348KB 라 늘 받을 수 없습니다.
     실측: 「대영」은 앞으로 찾아도 119곳 전부 나옵니다. 그런데 「종합건설」은 9곳(실제 2,867곳),
     「개발」은 0곳(실제 2,420곳)입니다. 그래서 «가운데로도 찾기» 는 버튼으로 둡니다.
     한 번 누르면 그 브라우저에서는 계속 켜져 있습니다(파일을 기억하므로 두 번 안 받습니다). */
  useEffect(() => {
    clearTimeout(timer.current)
    const s = normCorp(q)
    if (s.length < 1) { setList([]); return }
    timer.current = setTimeout(() => {
      searchCorp(s, deep).then((r) => { setList(r); setOpen(true) })
    }, 250)
    return () => clearTimeout(timer.current)
  }, [q, deep])

  /* ★ 고르면 «전용 주소»로 갑니다 (/corp/{업체}).
     ⚠️ 사업자번호로 갈라 놓은 키(«이름#번호»)는 주소에 넣지 않습니다 —
        남의 사업자번호가 URL 과 검색결과에 남습니다. 그 갈래는 화면 안에서만
        고르도록 라우터 state 로 넘깁니다(주소에는 안 남습니다). */
  const pick = (item) => {
    setOpen(false)
    const base = String(item.key).split('#')[0]
    navigate('/corp/' + encodeURIComponent(base),
             item.key.includes('#') ? { state: { firm: item.key } } : undefined)
  }


  return (
    <>
      <div className="card">
        <div className="field">
          <label>업체명 <span className="hint">— «주식회사» 는 빼고 입력해도 됩니다</span></label>
          <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setOpen(true)}
            placeholder="예: 대한건설, ○○종합건설" autoFocus />
          {/* ⚠️ 전에는 `list.length > 0` 일 때만 이 상자를 그렸습니다. 그래서
              「개발」처럼 **0곳** 인 검색에서는 «이름 가운데로도 찾기» 버튼조차 안 보였습니다 —
              정작 그 버튼이 필요한 자리에서 사라진 것입니다 (2026-09-04에 실제로 그랬습니다).
              → 검색어가 있으면 결과가 0곳이어도 상자를 띄웁니다. */}
          {open && normCorp(q).length > 0 && (list.length > 0 || !deep) && (
            <div className="suggest">
              {list.length === 0 && (
                <div className="nohit">앞에서부터 찾은 결과가 없습니다</div>
              )}
              {list.map((it) => (
                <button key={it.key} onClick={() => pick(it)}>
                  <span className="c">{num(it.n)}건</span>{it.label}
                  {it.biz
                    ? <span className="sub2"> · {it.reg} · {it.ceo || '대표 미상'}
                        {' '}({it.biz.slice(0, 3)}-{it.biz.slice(3, 5)}-•••)</span>
                    : <>
                        {it.reg && <span className="sub2"> · {it.reg}</span>}
                        {it.bzn > 1 && <span className="mix">합계 · 법인 {it.bzn}곳</span>}
                      </>}
                </button>
              ))}
              {!deep && (
                <button className="deepmore" onClick={(e) => { e.preventDefault(); setDeep(true) }}>
                  🔎 찾는 업체가 없나요? <b>이름 가운데로도 찾기</b>
                  <span className="sub2"> · 「종합건설」·「개발」처럼 뒷말로 찾을 때 (한 번만 받습니다)</span>
                </button>
              )}
            </div>
          )}
        </div>
        <div className="note">
          3년치 개찰 결과에서 «1순위(낙찰)» 기록만 찾습니다. 투찰만 하고 떨어진 건은 집계되지 않습니다.
        </div>
      </div>

      <Empty icon="🏢">
        내 회사 이름을 넣어보세요.<br />
        어느 지역 · 어느 기관에서 강한지, 평균 투찰률이 얼마인지 보여드립니다.
      </Empty>
    </>
  )
}



/* ── 업체 성적표 본문 ───────────────────────────────────────────
   ★ 2026-09-04 — 검색 상자와 갈라냈습니다.
   같은 내용을 «분석 탭»(검색해서 보기) 과 «/corp/{업체} 페이지»(주소로 바로 보기)
   두 곳이 씁니다. 두 벌로 적으면 언젠가 어긋납니다 — 여기 하나만 고칩니다. */
export function CorpReport({ c, ov, onPickFirm }) {
  const regions = c ? Object.entries(c.reg || {}) : []
  return (
    <>
          <div className="card">
            <div style={{ fontSize: 16, fontWeight: 800 }}>{c.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>
              {c.biz
                ? <>사업자 {c.biz.slice(0, 3)}-{c.biz.slice(3, 5)}-•••
                    {c.ceo ? ` · 대표 ${c.ceo}` : ''} · 누적 1순위 {num(c.n)}건</>
                : <>누적 1순위 {num(c.n)}건</>}
            </div>
            {c.biz && (
              <div className="onefirm">이 법인 하나만의 기록입니다 — 동명 업체와 섞이지 않았습니다</div>
            )}
            <p style={{ fontSize: 13.5, lineHeight: 1.7, marginTop: 10, marginBottom: 0, wordBreak: 'keep-all' }}>
              평균 투찰률은 <b>{pct(c.s?.avg, 2)}</b>입니다.
              {regions.length > 0 && <> 주력 지역은 <b>{regions[0][0]}</b>({regions[0][1]}건)이고,</>}
              {c.m && <> 낙찰이 가장 많았던 달은 <b>{c.m.indexOf(Math.max(...c.m)) + 1}월</b>입니다.</>}
            </p>
          </div>

          {c.bzn > 1 && (
            <div className="mixbox">
              <div className="h">⚠️ 이 이름으로 등록된 법인이 {num(c.bzn)}곳입니다</div>
              <p>
                아래 숫자는 <b>{num(c.bzn)}개 법인의 실적이 합쳐진 값</b>입니다.
                내 회사만의 기록이 아닙니다. 조달청 자료가 업체를 이름으로만 주는 구간이 있어
                아직 완전히 갈라내지 못했습니다 — 확인된 {num(c.bzk)}건의 내역은 아래와 같습니다.
              </p>
              <div className="firms">
                {(c.bz || []).map(([bz, ceo, cnt]) => (
                  <button key={bz} className="firm"
                    onClick={() => onPickFirm && onPickFirm(`${normCorp(c.name)}#${bz}`)}>
                    <span className="no">{bz.slice(0, 3)}-{bz.slice(3, 5)}-•••</span>
                    <span className="ceo">{ceo || '대표 미상'}</span>
                    <span className="cnt">{num(cnt)}건</span>
                    <span className="go">이 법인만 보기 →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ★ 2026-09-03 — 내가 이기는 자리인가 (창 · 등급 · 경쟁) */}
          <SpotBlock spot={c.spot} who="내가 딴 자리" />

          {/* ★ 최근 순위 기록 — «진 투찰»이 처음으로 보이는 자리. 소장님:
              「30위 안에 있으면 있고, 없으면 없다라고 정확히 밝히면서. 바로투찰이었다면 이랬을 것이다.」 */}
          <RankHistory c={c} ov={ov} />

          <div className="tiles c4" style={{ marginBottom: 10 }}>
            <Tile k="총 낙찰" v={num(c.n)} small />
            <Tile k="평균 투찰률" v={pct(c.s?.avg, 2)} small />
            <Tile k="평균 금액" v={c.amt ? wonShort(c.amt.avg) : '-'} small />
            <Tile k="최대 금액" v={c.amt ? wonShort(c.amt.max) : '-'} small />
          </div>

          {regions.length > 0 && (
            <div className="card">
              <div className="sec-title" style={{ margin: '0 0 10px' }}>📍 지역별 낙찰</div>
              <Bars rows={regions} unit="" />
            </div>
          )}

          {(c.inst || []).length > 0 && (
            <div className="card">
              <div className="sec-title" style={{ margin: '0 0 6px' }}>🏛 자주 낙찰받은 기관</div>
              {c.inst.map(([i, v], k) => (
                <div className="row" key={k}>
                  <span className="badge n">{k + 1}</span>
                  <div className="grow"><div className="t">{i}</div></div>
                  <span className="r">{num(v)}건</span>
                </div>
              ))}
            </div>
          )}

          {c.h?.length > 0 && (
            <div className="card">
              <div className="sec-title" style={{ margin: '0 0 10px' }}>📊 내 투찰률 분포 <span className="count">0.5% 단위</span></div>
              <Bars rows={c.h} />
            </div>
          )}

          {c.m && (
            <div className="card">
              <div className="sec-title" style={{ margin: '0 0 10px' }}>📅 월별 낙찰 흐름</div>
              <Months data={c.m} />
            </div>
          )}

          {(c.cases || []).length > 0 && (
            <div className="card">
              <div className="sec-title" style={{ margin: '0 0 6px' }}>🗂 최근 낙찰</div>
              {c.cases.map((x, i) => (
                <div className="row" key={i}>
                  <div className="grow">
                    <div className="t" style={{ whiteSpace: 'normal' }}>{x[0]}</div>
                    <div className="d">{dateFull(x[1])} · {x[2]}
                      {/* [5] 등급 · [6] 창(하한 위 %p) · [7] 참가업체수 — 기초금액 있는 최근 건만 */}
                      {x[5] && <span className={'gbadge ' + (x[5] === 'A' ? 'good' : x[5] === 'B' ? 'mid' : 'bad')} style={{ marginLeft: 6 }}>{x[5]}</span>}
                      {x[6] != null && <span className="badge n" style={{ marginLeft: 4 }}>창 {x[6] >= 0 ? '+' : ''}{x[6].toFixed(3)}%p</span>}
                      {x[7] > 0 && <span className="badge n" style={{ marginLeft: 4 }}>{num(x[7])}곳</span>}
                    </div>
                  </div>
                  <span className="r">{x[3] != null ? pct(x[3], 3) : '-'}<br />
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{wonShort(x[4])}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
          {/* ★ 내 자리에 맞는 마감 전 공고 — 자주 딴 지역·기관으로 걸러서 원클릭 금액까지 */}
          <OpenNotices title="내 자리에 맞는 마감 전 공고" match={corpMatch(c)}
            hint={`${Object.keys(c.reg || {}).slice(0, 2).join('·') || '전국'} · 자주 딴 기관`} />
    </>
  )
}

/* ── 최근 순위 기록 ────────────────────────────────────────────
   3년치엔 1순위만 있습니다. «진 투찰»은 개찰 순위(낮은 순 30곳)를 받기 시작한 뒤의 것뿐입니다.
   그래서 분모를 항상 밝힙니다 — «우리가 순위를 받은 N개 개찰 중». 30위 밖은 자료에 없으니 «없다»고만 합니다.
   rec = [공고명, 날짜, 기관, 내등수, 총참가, 내투찰률, 내금액, baro]
   baro = [등수 | 0(실격) | -1(30위 밖), 바로투찰금액] 또는 null(기초·A값 없어 계산 안 함) */
function RankHistory({ c, ov }) {
  const pool = ov?.rankPool || 0
  const recs = Array.isArray(c?.rank) ? c.rank : []
  if (!pool && !recs.length) return null
  const ranks = recs.map((r) => r[3]).filter((v) => v > 0)
  const wins = recs.filter((r) => r[3] === 1).length
  const baroKnown = recs.filter((r) => r[7])
  const baroWin = baroKnown.filter((r) => r[7][0] === 1).length
  const baroDq = baroKnown.filter((r) => r[7][0] === 0).length
  const better = baroKnown.filter((r) => r[7][0] > 0 && r[7][0] < r[3]).length
  const worse = baroKnown.filter((r) => (r[7][0] > r[3] && r[7][0] > 0) || r[7][0] === -1 || r[7][0] === 0).length
  const med = ranks.length ? [...ranks].sort((a, b) => a - b)[Math.floor(ranks.length / 2)] : null
  /* ⚠️ 「바로투찰이었다면 0건 1순위」 는 맞는 값인데 **쓸모가 없었습니다** — 바로 위 「1순위 0건」과
     똑같은 0 을 두 번 보여주면서, 정작 중요한 «24위 → 2위» 는 아래 줄에 묻혀 있었습니다
     (소장님: 「0건 1순위라고 나와」). 그래서 **등수 중앙**을 앞세웁니다.
     30위 밖(-1)·실격(0)은 «더 나쁜 쪽»으로 정렬해야 중앙값이 낙관적으로 안 나옵니다. */
  const baroVals = baroKnown
    .map((r) => (r[7][0] === 0 ? 9999 : r[7][0] === -1 ? 999 : r[7][0]))
    .sort((a, b) => a - b)
  const bMedRaw = baroVals.length ? baroVals[Math.floor(baroVals.length / 2)] : null
  const bMed = bMedRaw != null && bMedRaw > 0 && bMedRaw < 999 ? bMedRaw : null

  return (
    <div className="card rankhist">
      <div className="sec-title" style={{ margin: '0 0 6px' }}>
        🥇 최근 순위 기록 <span className="count">· 순위를 받은 개찰 {num(pool)}건 중</span>
      </div>
      {recs.length === 0 ? (
        <div className="note">
          우리가 순위(낮은 순 30곳)를 받은 최근 개찰 <b>{num(pool)}건</b>에 이 업체는 <b>30위 안에 없습니다.</b>
          {' '}참여를 안 했거나, 했더라도 30위 밖이었습니다 — 어느 쪽인지는 자료가 말해주지 않습니다.
          {' '}(순위는 2026-09-02부터 받기 시작했습니다. 며칠 지나면 더 쌓입니다)
        </div>
      ) : (
        <>
          <div className="rh-sum">
            <div className="t"><span className="k">30위 안에 든 개찰</span><b>{num(recs.length)}건</b><span className="s">{num(pool)}건 중</span></div>
            <div className="t"><span className="k">1순위</span><b>{num(wins)}건</b><span className="s">{recs.length ? Math.round(wins / recs.length * 100) : 0}%</span></div>
            {med != null && <div className="t"><span className="k">등수 중앙</span><b>{num(med)}위</b><span className="s">30위 안에서</span></div>}
            {baroKnown.length > 0 && (
              <div className="t"><span className="k">바로투찰이었다면</span>
                <b>{bMed != null ? `등수 중앙 ${num(bMed)}위` : `1순위 ${num(baroWin)}건`}</b>
                <span className="s">
                  {med != null && bMed != null ? `내 ${num(med)}위 · ` : ''}
                  {num(baroKnown.length)}건 계산 · 1순위 {num(baroWin)} · 실격 {num(baroDq)}
                </span></div>
            )}
          </div>
          {baroKnown.length > 0 && (
            <div className="rh-verdict">
              {better > worse
                ? <>바로투찰 금액이 내 금액보다 <b>등수가 좋았던 개찰 {num(better)}건</b>, 나빴던 {num(worse)}건. 내 금액이 권장보다 높게 가는 편입니다 — 등급이 좋은 자리에서 권장을 써볼 만합니다.</>
                : better < worse
                ? <>내 금액이 바로투찰보다 <b>등수가 좋았던 개찰 {num(worse)}건</b>, 나빴던 {num(better)}건. 권장보다 낮게 쓰는 편입니다 — 이기면 크지만 실격도 늘어납니다. 바로투찰 실격 {num(baroDq)}건과 내 실격을 견줘 보세요.</>
                : <>바로투찰과 내 금액의 등수가 비슷합니다({num(better)} : {num(worse)}). 금액보다 «어디에 넣느냐»(등급)가 남은 변수입니다.</>}
            </div>
          )}
          <div className="rh-list">
            {recs.map((r, i) => {
              const b = r[7]
              const bTxt = !b ? '계산 안 함' : b[0] === 0 ? '실격' : b[0] === -1 ? '30위 밖' : `${num(b[0])}위`
              const bTone = !b ? 'n' : b[0] === 0 ? 'r' : b[0] === 1 ? 'g' : b[0] === -1 ? 'n' : 'b'
              return (
                <div className="row" key={i}>
                  <div className="grow">
                    <div className="t" style={{ whiteSpace: 'normal' }}>{r[0]}</div>
                    <div className="d">{dateFull(r[1])} · {r[2]}{r[5] != null ? ` · ${pct(r[5], 3)}` : ''}</div>
                  </div>
                  <span className="r">
                    <span className={'badge ' + (r[3] === 1 ? 'g' : 'b')}>{num(r[4])}곳 중 {num(r[3])}위</span>
                    <br />
                    <span className={'badge ' + bTone} style={{ marginTop: 3 }} title={b ? `바로투찰 ${wonShort(b[1])}` : '기초금액·A값이 없어 계산하지 않았습니다'}>
                      바로투찰 {bTxt}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
          <div className="note" style={{ marginTop: 8 }}>
            조달청 개찰 순위(낮은 금액 순 30곳)에서 이 업체를 찾은 것입니다. «바로투찰 등수»는 그 개찰의 확정 예정가격으로
            하한을 구해, 권장금액이 30곳 중 몇 번째였을지 센 것입니다. 기초금액·A값이 없는 개찰은 계산하지 않습니다.
          </div>
        </>
      )}
    </div>
  )
}
