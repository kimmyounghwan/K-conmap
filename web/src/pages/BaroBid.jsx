import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getJSON, getOverview, getAgency } from '../lib/data.js'
import { won, wonShort, pct, num, dateTime, dday } from '../lib/fmt.js'

/* ============================================================
   바로투찰 — 숫자를 손으로 옮겨 적지 않게 하는 화면

   입찰에서 제일 많이 나는 사고가 «자릿수 실수» 입니다.
   그래서 이 화면은 사람이 옮겨 적을 일을 최대한 없앱니다.

     · 공고를 고르면      → 기초금액·추정가격·예가범위·마감이 저절로 채워짐
     · 기초금액만 넣으면  → 나머지가 저절로 계산됨
     · 개찰 화면에서 오면 → 주소에 실려 온 값이 그대로 채워짐

   계산식 (업계 공통)
     예정가격 = 기초금액 × 사정률
     투찰금액 = (예정가격 − A값) × 투찰률 + A값      ← 원 단위 절상

   사정률은 개찰 때 추첨으로 정해져 미리 알 수 없습니다.
   그래서 «실제로 나온 사정률» 을 3년치에서 역산해 함께 보여줍니다.
   ============================================================ */

const getIndex = () => getJSON('/data/bidindex.json')

/** 일반공사 적격심사 낙찰하한율 (조달청 기준, 참고용) */
function lowerLimit(estimate) {
  if (!estimate) return null
  const eok = estimate / 1e8
  if (eok >= 100) return { rate: null, note: '100억 이상 — 종합심사(별도 기준)' }
  if (eok >= 50) return { rate: 87.495, note: '추정가격 50억~100억' }
  if (eok >= 10) return { rate: 88.745, note: '추정가격 10억~50억' }
  return { rate: 89.745, note: '추정가격 10억 미만' }
}

/** 투찰금액 = (기초금액 × 사정률 − A값) × 투찰률 + A값, 원 단위 절상 */
function bidAmount(base, sajeong, rate, aVal) {
  if (!base || !rate) return 0
  const yeje = base * (sajeong / 100)
  return Math.ceil((yeje - aVal) * (rate / 100) + aVal)
}

const digits = (s) => String(s || '').replace(/[^0-9]/g, '')
const toNum = (s) => Number(digits(s)) || 0

export default function BaroBid() {
  const [sp] = useSearchParams()
  const [idx, setIdx] = useState(undefined)   // undefined=받는 중, null=없음
  const [ov, setOv] = useState(null)
  const [ag, setAg] = useState(undefined)

  const [q, setQ] = useState('')
  const [picked, setPicked] = useState(null)  // 고른 공고 (없으면 직접 입력)
  const [inst, setInst] = useState('')

  const [base, setBase] = useState(0)         // 기초금액 — 이 화면의 출발점
  const [budgetIn, setBudgetIn] = useState('')// 추정가격 (비우면 자동)
  const [rateIn, setRateIn] = useState('')    // 목표 투찰률 (비우면 낙찰하한율)
  const [aIn, setAIn] = useState('')          // A값
  const [copied, setCopied] = useState(false)
  const seeded = useRef(false)

  useEffect(() => { getOverview().then(setOv); getIndex().then((v) => setIdx(v || null)) }, [])

  /* 주소로 넘어온 값을 한 번만 채워 넣는다 (개찰 상세의 «바로투찰» 버튼) */
  useEffect(() => {
    if (seeded.current) return
    seeded.current = true
    const b = toNum(sp.get('base'))
    const i = sp.get('inst') || ''
    const n = sp.get('name') || ''
    if (b) setBase(b)
    if (i) setInst(i)
    if (n) setQ(n)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* 고른 기관(또는 주소로 온 기관)의 3년 자료 */
  useEffect(() => {
    if (!inst) { setAg(undefined); return }
    let ok = true
    setAg(undefined)
    getAgency(inst).then((v) => { if (ok) setAg(v) })
    return () => { ok = false }
  }, [inst])

  /* 색인은 자리를 아끼려고 배열로 저장돼 있습니다 */
  const rows = useMemo(() => {
    if (!idx || !Array.isArray(idx.r)) return []
    return idx.r.map((a) => ({
      no: a[0], name: a[1], inst: a[2], base: a[3],
      budget: a[4], close: a[5], lo: a[6], hi: a[7],
    }))
  }, [idx])

  /* 검색창에 숫자만 넣으면 그 자리에서 기초금액으로 받아들입니다 */
  const qDigits = digits(q)
  const qIsAmount = q.trim().length > 0 && qDigits.length >= 7
    && q.trim().replace(/[,\s원]/g, '') === qDigits

  useEffect(() => {
    if (qIsAmount) { setPicked(null); setBase(Number(qDigits)) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIsAmount, qDigits])

  const hits = useMemo(() => {
    const s = q.trim()
    if (qIsAmount || s.length < 2 || !rows.length) return []
    const up = s.toUpperCase()
    const out = []
    for (const r of rows) {
      if ((r.name || '').includes(s) || (r.inst || '').includes(s)
        || (r.no || '').toUpperCase().includes(up)) {
        out.push(r)
        if (out.length >= 40) break
      }
    }
    return out
  }, [rows, q, qIsAmount])

  const pick = (r) => {
    setPicked(r); setQ(r.name); setInst(r.inst)
    setBase(r.base || 0); setBudgetIn(''); setRateIn(''); setCopied(false)
  }

  const clear = () => {
    setPicked(null); setQ(''); setInst(''); setBase(0)
    setBudgetIn(''); setRateIn(''); setAIn('')
  }

  /* ── 여기서부터는 base 하나만 있으면 전부 자동으로 채워집니다 ── */
  const estimate = toNum(budgetIn) || picked?.budget || (base ? Math.round(base / 1.1) : 0)
  const ll = lowerLimit(estimate)
  const myRate = Number(rateIn) || ll?.rate || 0
  const a = toNum(aIn)

  const lo = picked?.lo ?? -3
  const hi = picked?.hi ?? 3

  // 사정률: 그 기관 실측 → 없으면 전체 실측 → 없으면 100%
  const sjMid = ag?.sj?.med ?? ov?.sjq?.p50 ?? 100
  const sjSrc = ag?.sj ? `${inst} 실제 ${num(ag.sjn)}건`
    : ov?.sjn ? `전체 실제 ${num(ov.sjn)}건` : '기본값 100%'

  const main = bidAmount(base, sjMid, myRate, a)

  // 0.5% 간격으로 훑되, «가정한 사정률» 자체도 한 줄 넣습니다.
  // 그 줄이 없으면 가정한 값에서 몇 %가 되는지를 표에서 못 봅니다.
  const steps = []
  for (let s = 100 + lo; s <= 100 + hi + 0.001; s += 0.5) steps.push(Math.round(s * 100) / 100)
  const sjRow = Math.round(sjMid * 100) / 100
  if (!steps.includes(sjRow)) { steps.push(sjRow); steps.sort((x, y) => x - y) }

  const copy = () => {
    navigator.clipboard?.writeText(String(main))
    setCopied(true); setTimeout(() => setCopied(false), 1600)
  }

  const dd = picked ? dday(picked.close) : null

  return (
    <>
      {/* ── 1. 찾기 ─────────────────────────────── */}
      <div className="card">
        <div className="field">
          <label>
            공고 찾기
            <span className="hint">— 공고명 · 발주기관 · 공고번호. 기초금액을 바로 넣어도 됩니다</span>
          </label>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPicked(null); setCopied(false) }}
            placeholder={idx === undefined ? '공고를 불러오는 중…' : '예: 도로포장 / 안동시 / 285000000'} />
        </div>

        {!picked && !qIsAmount && hits.length > 0 && (
          <div className="picklist">
            {hits.map((r) => {
              const d = dday(r.close)
              return (
                <button key={r.no} className="pickrow" onClick={() => pick(r)}>
                  <div className="grow">
                    <div className="t">{r.name}</div>
                    <div className="d">
                      {r.inst} · 마감 {dateTime(r.close)}
                      {r.base > 0
                        ? <> · <b style={{ color: 'var(--accent)' }}>기초 {wonShort(r.base)}</b></>
                        : <> · <span className="muted">기초금액 미공개</span></>}
                    </div>
                  </div>
                  {d && <span className={'badge ' + d.tone}>{d.text}</span>}
                </button>
              )
            })}
          </div>
        )}

        {!picked && !qIsAmount && q.trim().length >= 2 && hits.length === 0 && idx !== undefined && (
          <div className="hintbox">
            마감 전 공사 공고 중에는 없습니다. 이미 개찰됐거나 용역일 수 있습니다.<br />
            <b>공고서의 기초금액을 그대로 넣으면</b> 아래에서 바로 계산됩니다.
          </div>
        )}

        {picked && (
          <div className="pickedbar">
            <div className="grow">
              <div className="t">{picked.name}</div>
              <div className="d">{picked.inst} · 마감 {dateTime(picked.close)}</div>
            </div>
            {dd && <span className={'badge ' + dd.tone}>{dd.text}</span>}
            <button className="btn ghost sm" onClick={clear}>지우기</button>
          </div>
        )}
      </div>

      {/* ── 2. 값 (자동으로 채워지고, 손으로 고칠 수도 있습니다) ── */}
      <div className="card">
        <div className="detail-h">
          투찰 조건
          {picked ? <span className="count">· 공고에서 자동으로 가져왔습니다</span>
            : <span className="count">· 기초금액만 넣으면 나머지는 자동입니다</span>}
        </div>

        <div className="field">
          <label>기초금액 (원) <span className="hint">— 공고서에 적힌 금액</span></label>
          <input inputMode="numeric" className="big"
            value={base ? base.toLocaleString('ko-KR') : ''}
            onChange={(e) => { setBase(toNum(e.target.value)); setCopied(false) }}
            placeholder="예: 285,000,000" />
        </div>

        <div className="two">
          <div className="field">
            <label>추정가격 (원) <span className="hint">— 비우면 기초금액 ÷ 1.1</span></label>
            <input inputMode="numeric"
              value={budgetIn ? Number(budgetIn).toLocaleString('ko-KR') : ''}
              onChange={(e) => setBudgetIn(digits(e.target.value))}
              placeholder={estimate ? estimate.toLocaleString('ko-KR') : '자동'} />
          </div>
          <div className="field">
            <label>목표 투찰률 (%) <span className="hint">— 비우면 낙찰하한율</span></label>
            <input inputMode="decimal" value={rateIn}
              onChange={(e) => { setRateIn(e.target.value.replace(/[^0-9.]/g, '')); setCopied(false) }}
              placeholder={ll?.rate ? String(ll.rate) : '89.745'} />
            {ll?.rate && (
              <div className="quick">
                <button onClick={() => setRateIn(String(ll.rate))}>하한 {ll.rate}</button>
                <button onClick={() => setRateIn((ll.rate + 0.1).toFixed(3))}>+0.1 여유</button>
                <button onClick={() => setRateIn((ll.rate + 0.3).toFixed(3))}>+0.3 여유</button>
              </div>
            )}
          </div>
        </div>

        <div className="field">
          <label>A값 (원) <span className="hint">— 사회보험료 등. 공고서에 없으면 비워두세요</span></label>
          <input inputMode="numeric"
            value={aIn ? Number(aIn).toLocaleString('ko-KR') : ''}
            onChange={(e) => { setAIn(digits(e.target.value)); setCopied(false) }}
            placeholder="0" />
        </div>
      </div>

      {base <= 0 ? (
        <div className="hintbox">
          위에서 공고를 고르거나, 기초금액을 넣으면 <b>투찰금액이 바로 나옵니다.</b>
        </div>
      ) : (
        <>
          {/* ── 3. 결과 ─────────────────────────── */}
          <div className="result">
            <div className="k">투찰금액 · 투찰률 {pct(myRate, 3)}</div>
            <div className="v">{won(main)}</div>
            <div className="sub">
              예정가격 {wonShort(base * (sjMid / 100))} (사정률 {pct(sjMid, 3)} 가정) · {sjSrc}
            </div>
          </div>

          <button className="btn" style={{ width: '100%', marginBottom: 12 }} onClick={copy}>
            {copied ? '복사했습니다' : `이 금액 복사하기 (${num(main)}원)`}
          </button>

          {ll && (
            <div className="hintbox">
              <b>낙찰하한율 {ll.rate ? pct(ll.rate, 3) : '별도 기준'}</b> · {ll.note}<br />
              일반공사 적격심사 기준입니다. 공고서의 적격심사 기준을 꼭 다시 확인하세요.
              {ll.rate && myRate <= ll.rate + 0.0001 && (
                <><br /><b style={{ color: 'var(--warn)' }}>
                  지금은 하한에 딱 붙인 금액입니다. 사정률이 가정보다 조금만 높게 나와도 미달이 됩니다 —
                  아래 표에서 «미달» 줄을 보시고 여유를 둘지 정하세요.
                </b></>
              )}
            </div>
          )}

          {/* ── 4. 사정률이 다르게 나오면 ────────── */}
          <div className="card">
            <div className="detail-h">
              사정률이 이렇게 나오면 <span className="count">· 개찰 때 추첨으로 정해집니다</span>
            </div>
            {ov?.sjn ? (
              <div className="hintbox">
                실제 개찰 {num(ov.sjn)}건에서 사정률은 <b>{pct(ov.sjq?.p10, 2)} ~ {pct(ov.sjq?.p90, 2)}</b> 사이에
                열에 여덟이 들어왔습니다. 가운데값은 {pct(ov.sjq?.p50, 3)} 입니다.
              </div>
            ) : (
              <div className="hintbox">
                사정률 통계는 다음 갱신 때 채워집니다. 지금은 100% 로 계산했습니다.
              </div>
            )}
            <table className="mini">
              <thead><tr><th>사정률</th><th>예정가격</th><th>내 투찰률</th></tr></thead>
              <tbody>
                {steps.map((s) => {
                  const yeje = base * (s / 100)
                  const r2 = yeje > a ? ((main - a) / (yeje - a)) * 100 : 0
                  const pass = ll?.rate ? r2 >= ll.rate : true
                  const near = Math.abs(s - sjMid) < 0.26
                  return (
                    <tr key={s} className={near ? 'on' : ''}>
                      <td>{s.toFixed(1)}%</td>
                      <td>{wonShort(yeje)}</td>
                      <td className={pass ? 'ok' : 'no'}>
                        {r2.toFixed(3)}% {ll?.rate ? (pass ? '통과' : '미달') : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="note" style={{ marginTop: 8 }}>
              «미달» 은 그 사정률이 나왔을 때 낙찰하한율에 못 미친다는 뜻입니다.
              하한에 딱 붙이면 사정률이 조금만 높게 나와도 떨어집니다.
            </div>
          </div>

          {/* ── 5. 그 발주기관의 3년 버릇 ────────── */}
          {ag && (
            <div className="card">
              <div className="detail-h">{inst} <span className="count">· 최근 3년</span></div>
              <div className="kv">
                <div><span>표본</span><b>{num(ag.n)}건</b></div>
                <div><span>평균 투찰률</span><b>{pct(ag.s?.avg, 3)}</b></div>
                <div><span>최다 구간</span>
                  <b className="hi">{(ag.h01 || ag.h1 || [])[0] ? pct((ag.h01 || ag.h1)[0][0], 2) : '-'}</b></div>
                <div><span>사정률 가운데값</span>
                  <b>{ag.sj ? pct(ag.sj.med, 3) : '자료 부족'}</b></div>
              </div>
              {(ag.h01 || ag.h1 || [])[0] && (
                <button className="btn ghost sm" style={{ width: '100%' }}
                  onClick={() => setRateIn(String((ag.h01 || ag.h1)[0][0]))}>
                  이 기관 최다 구간 {pct((ag.h01 || ag.h1)[0][0], 2)} 로 계산하기
                </button>
              )}
            </div>
          )}

          <div className="note">
            투찰금액은 계산 결과일 뿐 낙찰을 보장하지 않습니다.
            나라장터에 넣기 전에 공고서의 기초금액 · A값 · 적격심사 기준을 반드시 다시 확인하세요.
          </div>
        </>
      )}
    </>
  )
}
