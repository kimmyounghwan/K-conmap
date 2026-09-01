import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getJSON, getOverview, getAgency, similarZone } from '../lib/data.js'
import { won, wonShort, pct, num, dateTime, dday } from '../lib/fmt.js'

/* ============================================================
   바로투찰 — 공고를 고르면 투찰금액이 바로 나오는 화면

   [숫자의 근거]  개찰 106,534건을 시간 순서를 지켜 되돌려 본 결과입니다.

   · 권장 투찰률 = 전국 최근 30일 최빈 낙찰률 − 0.20%p
       최빈값에 딱 맞추면 안 됩니다. 최빈값은 낙찰하한율보다 중앙값
       0.30%p 위에 있어서, 맞추면 낙찰자보다 높아 집니다.
       0.20%p 낮추면 역검증 승률이 50.7% → 67.0% 로 올라갔습니다.
   · 발주기관별 최다구간은 쓰지 않습니다.
       표본 80건이 쌓인 기관에서도 전국값이 4.6%p 이겼습니다.
   · 창은 30일. 90일은 제도가 바뀔 때 실격 추천이 43%까지 뜁니다.

   [금액 계산]
       예정가격 = 기초금액 × 사정률
       투찰금액 = (예정가격 − A값) × 투찰률 + A값        ← 원 단위 절상
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

function bidAmount(base, sajeong, rate, aVal) {
  if (!base || !rate) return 0
  return Math.ceil((base * (sajeong / 100) - aVal) * (rate / 100) + aVal)
}

const digits = (s) => String(s || '').replace(/[^0-9]/g, '')
const toNum = (s) => Number(digits(s)) || 0
const r3 = (n) => Math.round(n * 1000) / 1000

export default function BaroBid() {
  const [sp] = useSearchParams()
  const [idx, setIdx] = useState(undefined)
  const [ov, setOv] = useState(null)
  const [ag, setAg] = useState(null)
  const [sim, setSim] = useState(null)

  const [q, setQ] = useState('')
  const [picked, setPicked] = useState(null)
  const [inst, setInst] = useState('')

  const [base, setBase] = useState(0)
  const [budgetIn, setBudgetIn] = useState('')
  const [aIn, setAIn] = useState('')
  const [pickRate, setPickRate] = useState('rec')   // rec | limit | safe | own
  const [ownRate, setOwnRate] = useState('')
  const [copied, setCopied] = useState(false)
  const seeded = useRef(false)

  useEffect(() => { getOverview().then(setOv); getIndex().then((v) => setIdx(v || null)) }, [])

  /* 개찰 상세의 «바로투찰 열기» 로 넘어온 값 */
  useEffect(() => {
    if (seeded.current) return
    seeded.current = true
    const b = toNum(sp.get('base'))
    if (b) setBase(b)
    if (sp.get('inst')) setInst(sp.get('inst'))
    if (sp.get('name')) setQ(sp.get('name'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!inst) { setAg(null); return }
    let ok = true
    getAgency(inst).then((v) => { if (ok) setAg(v) })
    return () => { ok = false }
  }, [inst])

  /* 이 공고와 비슷한 과거 공고들이 실제로 몇 %에서 낙찰됐는지 */
  useEffect(() => {
    const nm = picked?.name || (sp.get('name') || '')
    if (!nm || nm.length < 3) { setSim(null); return }
    let ok = true
    similarZone(nm).then((v) => { if (ok) setSim(v) })
    return () => { ok = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked])

  const rows = useMemo(() => {
    if (!idx || !Array.isArray(idx.r)) return []
    return idx.r.map((a) => ({
      no: a[0], name: a[1], inst: a[2], base: a[3],
      budget: a[4], close: a[5], lo: a[6], hi: a[7],
      llr: a[8] || null, est: a[9] || 0, lic: a[10] || [],
    }))
  }, [idx])

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
    setBase(r.base || 0); setBudgetIn(''); setPickRate('rec'); setCopied(false)
  }
  const clear = () => {
    setPicked(null); setQ(''); setInst(''); setBase(0)
    setBudgetIn(''); setAIn(''); setPickRate('rec'); setOwnRate('')
  }

  /* ── 계산 ─────────────────────────────── */
  /* ⚠️ 공고의 «예산» 칸(budget)을 추정가격으로 쓰면 안 됩니다.
     조달청이 주는 값은 배정예산·총사업비라서 기초금액보다 큽니다.
     (예: 기초 397,111,000 인데 예산 485,852,000)
     낙찰하한율은 추정가격으로 갈리므로 여기서 틀리면 하한율 구간이 어긋납니다.
     추정가격은 기초금액에서 부가세를 뺀 값(÷1.1)이 맞습니다. */
  const estimate = toNum(budgetIn) || picked?.est || (base ? Math.round(base / 1.1) : 0)

  /* 낙찰하한율은 «추정» 보다 «공고가 알려준 값» 이 언제나 정확합니다.
     공고에 실려 있으면 그걸 쓰고, 없을 때만 규모로 추정합니다. */
  const givenLL = Number(picked?.llr || sp.get('llr')) || 0
  const ll = givenLL > 0
    ? { rate: givenLL, note: '공고서에 적힌 낙찰하한율', given: true }
    : lowerLimit(estimate)
  const a = toNum(aIn)
  const lo = picked?.lo ?? -3
  const hi = picked?.hi ?? 3

  const hot = ov?.hot || null
  const rec = hot?.rec ?? null
  const regime = ov?.regime || null

  const sjMid = ov?.sjq?.p50 ?? 100
  const sjLo = ov?.sjq?.p10 ?? sjMid
  const sjHi = ov?.sjq?.p90 ?? sjMid

  const choices = []
  if (rec != null) choices.push({ k: 'rec', label: '권장', rate: rec, why: `전국 최근 ${hot.win}일` })
  if (ll?.rate) {
    choices.push({ k: 'limit', label: '하한', rate: ll.rate, why: '낙찰하한율' })
    choices.push({ k: 'safe', label: '하한+0.3', rate: r3(ll.rate + 0.3), why: '여유' })
  }
  const chosen = choices.find((c) => c.k === pickRate)
  const myRate = pickRate === 'own' ? (Number(ownRate) || 0) : (chosen?.rate ?? rec ?? 0)

  const main = bidAmount(base, sjMid, myRate, a)
  const bandLo = bidAmount(base, sjLo, myRate, a)
  const bandHi = bidAmount(base, sjHi, myRate, a)

  const pass = ll?.rate ? myRate >= ll.rate : null
  const margin = ll?.rate ? r3(myRate - ll.rate) : null

  const steps = []
  for (let s = 100 + lo; s <= 100 + hi + 0.001; s += 0.5) steps.push(Math.round(s * 100) / 100)
  const sjRow = Math.round(sjMid * 100) / 100
  if (!steps.includes(sjRow)) { steps.push(sjRow); steps.sort((x, y) => x - y) }

  const copy = () => {
    navigator.clipboard?.writeText(String(main))
    setCopied(true); setTimeout(() => setCopied(false), 1600)
  }
  const dd = picked ? dday(picked.close) : null
  const topMax = hot?.top?.length ? Math.max(...hot.top.map((t) => t[1])) : 1

  return (
    <>
      {/* ── 오늘의 기준 ── */}
      {hot?.mode != null && (
        <div className="todaybar">
          <div>
            <div className="k">오늘의 기준 · 전국 최근 {hot.win}일</div>
            <div className="v">최빈 낙찰률 {pct(hot.mode, 1)}</div>
          </div>
          <div className="r">
            <div className="k">권장 투찰률</div>
            <div className="v big">{pct(rec, 2)}</div>
          </div>
        </div>
      )}

      {regime?.confirmed && (
        <div className="alertbar">
          ⚠️ <b>낙찰하한율 제도가 바뀐 것으로 보입니다.</b> 최근 30일 최빈이 직전보다
          {' '}{pct(regime.shift30, 1)} 움직였습니다. 좁은 창({ov?.hot14?.win}일)으로 계산 중이며,
          당분간 평소보다 정확도가 떨어질 수 있습니다.
        </div>
      )}

      {/* ── 1. 공고 찾기 ── */}
      <div className="card">
        <div className="field">
          <label>
            공고 찾기
            <span className="hint">— 공고명 · 발주기관 · 공고번호. 기초금액을 바로 넣어도 됩니다</span>
          </label>
          <div className="searchwrap">
            <span className="ico">🔍</span>
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPicked(null); setCopied(false) }}
              placeholder={idx === undefined ? '공고를 불러오는 중…' : '예: 도로포장 / 안동시 / 285000000'} />
            {q && <button className="x" onClick={clear} aria-label="지우기">×</button>}
          </div>
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
                        ? <> · <b className="money">기초 {wonShort(r.base)}</b></>
                        : <> · <span className="muted">기초금액 미공개</span></>}
                    </div>
                    {(r.lic || []).length > 0 && (
                      <div className="lics">
                        {r.lic.slice(0, 3).map((L) => <span key={L} className="lic">{L}</span>)}
                        {r.lic.length > 3 && <span className="lic more">+{r.lic.length - 3}</span>}
                      </div>
                    )}
                  </div>
                  {d && <span className={'badge ' + d.tone}>{d.text}</span>}
                </button>
              )
            })}
          </div>
        )}

        {!picked && !qIsAmount && q.trim().length >= 2 && hits.length === 0 && idx !== undefined && (
          <div className="hintbox">
            마감 전 공사 공고 중에는 없습니다. <b>공고서의 기초금액을 그대로 넣으면</b> 바로 계산됩니다.
          </div>
        )}

        {picked && (
          <div className="pickedbar">
            <div className="grow">
              <div className="t">{picked.name}</div>
              <div className="d">{picked.inst} · 마감 {dateTime(picked.close)}</div>
              {(picked.lic || []).length > 0 && (
                <div className="lics">
                  {picked.lic.map((L) => <span key={L} className="lic on">{L}</span>)}
                </div>
              )}
            </div>
            {dd && <span className={'badge ' + dd.tone}>{dd.text}</span>}
          </div>
        )}
      </div>

      {/* ── 2. 숫자 ── */}
      <div className="card">
        <div className="detail-h">
          투찰 조건
          {picked ? <span className="count">· 공고에서 자동으로 가져왔습니다</span>
            : <span className="count">· 기초금액만 넣으면 나머지는 자동입니다</span>}
        </div>

        <div className="field">
          <label>기초금액 (원)</label>
          <input inputMode="numeric" className="big"
            value={base ? base.toLocaleString('ko-KR') : ''}
            onChange={(e) => { setBase(toNum(e.target.value)); setCopied(false) }}
            placeholder="예: 285,000,000" />
        </div>

        <div className="two">
          <div className="field">
            <label>추정가격 (원) <span className="hint">— 비우면 자동</span></label>
            <input inputMode="numeric"
              value={budgetIn ? Number(budgetIn).toLocaleString('ko-KR') : ''}
              onChange={(e) => setBudgetIn(digits(e.target.value))}
              placeholder={estimate ? estimate.toLocaleString('ko-KR') : '자동'} />
          </div>
          <div className="field">
            <label>예가범위 <span className="hint">— 공고 기준</span></label>
            <input value={base ? `${lo}% ~ ${hi}%` : ''} readOnly placeholder="자동" />
          </div>
        </div>

        <div className="field">
          <label>A값 (원) <span className="hint">— 사회보험료 등 법정경비</span></label>
          <input inputMode="numeric"
            value={aIn ? Number(aIn).toLocaleString('ko-KR') : ''}
            onChange={(e) => { setAIn(digits(e.target.value)); setCopied(false) }}
            placeholder="0" />
          <div className="note sm">
            A값은 투찰률을 곱하지 않고 그대로 더하는 금액입니다.
            <b> 공고서 산출내역서에 A값이 있는데 비워두면 금액이 틀어집니다.</b>
            {' '}조달청 API로는 안 나와서 자동으로 채우지 못합니다.
          </div>
        </div>
      </div>

      {base <= 0 ? (
        <div className="hintbox">
          {picked ? (
            <>
              <b>이 공고는 아직 기초금액이 공개되지 않았습니다.</b><br />
              발주기관이 공개하면 자동으로 채워집니다. 공고서에 이미 나와 있다면
              위 «기초금액» 칸에 넣어주세요 — 그 즉시 투찰금액이 나옵니다.
            </>
          ) : (
            <>위에서 공고를 고르거나 기초금액을 넣으면 <b>투찰금액이 바로 나옵니다.</b></>
          )}
        </div>
      ) : (
        <>
          {/* ── 3. 결과 ── */}
          <div className={'hero ' + (pass === false ? 'bad' : '')}>
            <div className="tag">{chosen?.label === '권장' ? '권장 투찰금액' : '투찰금액'}</div>
            <div className="amt">{won(main)}</div>
            <div className="sub">
              투찰률 {pct(myRate, 3)} · 예정가격 {wonShort(base * (sjMid / 100))}
              {' '}(사정률 {pct(sjMid, 3)} 가정)
            </div>
            <div className="range">사정률에 따라 {wonShort(bandLo)} ~ {wonShort(bandHi)}</div>
            <button className="cbtn" onClick={copy}>
              {copied ? '✓ 복사했습니다' : '이 금액 복사하기'}
            </button>
          </div>

          {/* 투찰률 고르기 */}
          <div className="chips">
            {choices.map((c) => (
              <button key={c.k}
                className={'chip' + (pickRate === c.k ? ' on' : '')
                  + (ll?.rate && c.rate < ll.rate ? ' warn' : '')}
                onClick={() => { setPickRate(c.k); setCopied(false) }}>
                <b>{c.label}</b><span>{c.rate.toFixed(3)}%</span>
              </button>
            ))}
            <button className={'chip' + (pickRate === 'own' ? ' on' : '')}
              onClick={() => setPickRate('own')}>
              <b>직접</b><span>입력</span>
            </button>
          </div>
          {pickRate === 'own' && (
            <div className="card" style={{ marginTop: 0 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>내 투찰률 (%)</label>
                <input inputMode="decimal" value={ownRate} autoFocus
                  onChange={(e) => { setOwnRate(e.target.value.replace(/[^0-9.]/g, '')); setCopied(false) }}
                  placeholder={rec ? String(rec) : '90.1'} />
              </div>
            </div>
          )}

          {/* 판정 */}
          {ll && (
            <div className={'verdict ' + (pass === false ? 'no' : pass ? 'ok' : '')}>
              {ll.rate == null ? (
                <>ℹ️ <b>100억 이상 종합심사</b> — 별도 기준이라 낙찰하한율을 적용하지 않습니다.</>
              ) : pass ? (
                <>✅ <b>낙찰하한 {pct(ll.rate, 3)} 통과</b> · 여유 {margin.toFixed(3)}%p
                  {margin < 0.1 && <><br />여유가 거의 없습니다. 사정률이 조금만 높게 나와도 미달이 됩니다.</>}</>
              ) : (
                <>⛔ <b>낙찰하한 {pct(ll.rate, 3)} 미달 — 이대로 넣으면 실격입니다.</b><br />
                  {Math.abs(margin).toFixed(3)}%p 부족합니다.</>
              )}
              <div className="sub">
                {ll.note}
                {ll.given ? ' · 이 공고에 실제로 적힌 값입니다.'
                  : ' · 일반공사 적격심사 기준으로 추정한 값입니다. 공고서를 꼭 확인하세요.'}
              </div>
            </div>
          )}

          {picked && (
            <div className="card">
              <div className="detail-h">이 공고에 넣으려면</div>
              {(picked.lic || []).length > 0 ? (
                <>
                  <div className="lics big">
                    {picked.lic.map((L) => <span key={L} className="lic on">{L}</span>)}
                  </div>
                  <div className="note sm">
                    위 면허·업종을 갖춰야 투찰할 수 있습니다.
                    공동수급으로 채우는 경우도 있으니 공고서를 확인하세요.
                  </div>
                </>
              ) : (
                <div className="note sm">
                  이 공고의 면허·업종 제한이 아직 수집되지 않았습니다.
                  나라장터 원문에서 «참가자격»을 꼭 확인하세요.
                </div>
              )}
            </div>
          )}

          {/* ── 4. 사정률 시나리오 ── */}
          <div className="card">
            <div className="detail-h">
              사정률이 이렇게 나오면 <span className="count">· 개찰 때 추첨으로 정해집니다</span>
            </div>
            {ov?.sjn ? (
              <div className="hintbox">
                실제 개찰 {num(ov.sjn)}건에서 사정률은 <b>{pct(sjLo, 2)} ~ {pct(sjHi, 2)}</b> 사이에
                열에 여덟이 들어왔습니다. 가운데값 {pct(sjMid, 3)}.
              </div>
            ) : null}
            <table className="mini">
              <thead><tr><th>사정률</th><th>예정가격</th><th>내 투찰률</th></tr></thead>
              <tbody>
                {steps.map((s) => {
                  const yeje = base * (s / 100)
                  const r2 = yeje > a ? ((main - a) / (yeje - a)) * 100 : 0
                  const ok = ll?.rate ? r2 >= ll.rate : true
                  const near = Math.abs(s - sjMid) < 0.26
                  return (
                    <tr key={s} className={near ? 'on' : ''}>
                      <td>{s.toFixed(1)}%</td>
                      <td>{wonShort(yeje)}</td>
                      <td className={ok ? 'ok' : 'no'}>
                        {r2.toFixed(3)}% {ll?.rate ? (ok ? '통과' : '미달') : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── 5. 지금 시장 ── */}
          {hot?.top?.length > 0 && (
            <div className="card">
              <div className="detail-h">
                지금 시장 <span className="count">· 전국 최근 {hot.win}일 낙찰률 {num(hot.n)}건</span>
              </div>
              <div className="hbars">
                {hot.top.map(([r, c]) => (
                  <div key={r} className={'hbar' + (Math.abs(r - myRate) < 0.05 ? ' me' : '')}>
                    <span className="l">{r.toFixed(1)}%</span>
                    <span className="t"><i style={{ width: `${(c / topMax) * 100}%` }} /></span>
                    <span className="c">{num(c)}</span>
                  </div>
                ))}
              </div>
              <div className="note sm">
                권장 투찰률은 이 최빈값에서 {ov?.hotOffset ?? 0.2}%p 낮춘 값입니다.
                최빈값은 낙찰하한율보다 대개 조금 위에 있어서, 그대로 맞추면 낙찰자보다 높아집니다.
              </div>
            </div>
          )}

          {/* ── 6. 비슷한 공고 ── */}
          {sim && (
            <div className="card">
              <div className="detail-h">
                비슷한 공고 <span className="count">· 최근 {ov?.kwDays ?? 90}일</span>
              </div>
              <div className="kv">
                <div><span>키워드</span><b>{sim.word}</b></div>
                <div><span>표본</span><b>{num(sim.n)}건</b></div>
                <div><span>최다 낙찰률</span><b className="hi">{pct(sim.zone, 1)}</b></div>
                <div><span>평균</span><b>{pct(sim.avg, 2)}</b></div>
              </div>
            </div>
          )}

          {/* ── 7. 발주기관 (참고) ── */}
          {ag && (
            <div className="card">
              <div className="detail-h">
                {inst} <span className="count">· 최근 3년 · 참고용</span>
              </div>
              <div className="kv">
                <div><span>표본</span><b>{num(ag.n)}건</b></div>
                <div><span>평균 투찰률</span><b>{pct(ag.s?.avg, 3)}</b></div>
                <div><span>최다 구간</span><b>{(ag.h1 || [])[0] ? pct([...ag.h1].sort((x, y) => y[1] - x[1])[0][0], 1) : '-'}</b></div>
                <div><span>독식률</span><b>{pct(ag.mono, 0)}</b></div>
              </div>
              <div className="note sm">
                <b>이 숫자는 권장 투찰률에 쓰지 않습니다.</b> 개찰 106,534건을 되돌려 확인해 보니,
                표본이 80건 쌓인 기관에서도 전국 최근값이 기관별 값보다 4.6%p 더 잘 맞았습니다.
              </div>
            </div>
          )}

          <div className="note">
            금액은 <b>(기초금액 × 사정률 − A값) × 투찰률 + A값</b> 으로 계산하고 원 단위에서 올립니다.
            내림하면 하한에 딱 맞출 때 아래로 떨어져 실격되기 때문입니다.<br />
            권장 투찰률은 과거 개찰 106,534건을 되돌려 정한 값이며 낙찰을 보장하지 않습니다.
            경쟁업체 투찰 자료가 없어 실제 승률은 검증값보다 낮을 수 있습니다.
            나라장터에 넣기 전에 공고서의 기초금액 · A값 · 적격심사 기준을 반드시 확인하세요.
          </div>
        </>
      )}
    </>
  )
}
