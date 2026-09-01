import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAgency, searchCorp, getCorp } from '../lib/data.js'
import AgencyReport from '../AgencyReport.jsx'
import { AgencyPicker, Bars, Months, Tile, Empty, Skeleton } from '../components.jsx'
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
function AgencyTab() {
  const [name, setName] = useState('')
  const [a, setA] = useState(null)
  const [loading, setLoading] = useState(false)

  const pick = async ({ name: n, chunk }) => {
    setName(n); setLoading(true); setA(null)
    setA(await getAgency(n, chunk)); setLoading(false)
  }

  return (
    <>
      <div className="card"><AgencyPicker value={name} onPick={pick} autoFocus /></div>
      {loading && <Skeleton n={3} />}
      {!loading && !a && (
        <Empty icon="🏛️">
          발주기관을 검색해보세요.<br />
          투찰률 히트맵 · 독식 업체 · 발주 시기 · 금액대를 한 번에 봅니다.
        </Empty>
      )}
      {a && <AgencyReport name={name} a={a} />}
    </>
  )
}

/* ── 업체 자가진단 ────────────────────── */
function CorpTab() {
  const [q, setQ] = useState('')
  const [list, setList] = useState([])
  const [open, setOpen] = useState(false)
  const [c, setC] = useState(null)
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    clearTimeout(timer.current)
    const s = normCorp(q)
    if (s.length < 1) { setList([]); return }
    timer.current = setTimeout(() => {
      searchCorp(s).then((r) => { setList(r); setOpen(true) })
    }, 250)
    return () => clearTimeout(timer.current)
  }, [q])

  const pick = async (item) => {
    setOpen(false); setLoading(true); setC(null)
    const d = await getCorp(item.key, item.chunk)
    setC(d); setLoading(false)
  }

  const regions = c ? Object.entries(c.reg || {}) : []

  return (
    <>
      <div className="card">
        <div className="field">
          <label>업체명 <span className="hint">— «주식회사» 는 빼고 입력해도 됩니다</span></label>
          <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setOpen(true)}
            placeholder="예: 대한건설, ○○종합건설" autoFocus />
          {open && list.length > 0 && (
            <div className="suggest">
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
            </div>
          )}
        </div>
        <div className="note">
          3년치 개찰 결과에서 «1순위(낙찰)» 기록만 찾습니다. 투찰만 하고 떨어진 건은 집계되지 않습니다.
        </div>
      </div>

      {loading && <Skeleton n={3} />}
      {!loading && !c && (
        <Empty icon="🏢">
          내 회사 이름을 넣어보세요.<br />
          어느 지역 · 어느 기관에서 강한지, 평균 투찰률이 얼마인지 보여드립니다.
        </Empty>
      )}

      {c && (
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
                    onClick={() => pick({ key: `${normCorp(c.name)}#${bz}` })}>
                    <span className="no">{bz.slice(0, 3)}-{bz.slice(3, 5)}-•••</span>
                    <span className="ceo">{ceo || '대표 미상'}</span>
                    <span className="cnt">{num(cnt)}건</span>
                    <span className="go">이 법인만 보기 →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

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
                    <div className="d">{dateFull(x[1])} · {x[2]}</div>
                  </div>
                  <span className="r">{x[3] != null ? pct(x[3], 3) : '-'}<br />
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{wonShort(x[4])}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
