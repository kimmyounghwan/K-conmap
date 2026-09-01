import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getJSON, getOverview, getAgency, similarZone, getSim } from '../lib/data.js'
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

/* 배포 도장을 붙여 옛 목록을 붙잡고 있지 않게 합니다 */
const getIndex = () => getJSON(
  `/data/bidindex.json?v=${typeof __BUILD__ === 'string' ? __BUILD__ : '0'}`)

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
  const [bt, setBt] = useState(null)      // 가상 시뮬레이션 결과
  const [btOpen, setBtOpen] = useState(false)

  const [q, setQ] = useState('')
  const [picked, setPicked] = useState(null)
  const [inst, setInst] = useState('')

  const [base, setBase] = useState(0)
  const [budgetIn, setBudgetIn] = useState('')
  const [aIn, setAIn] = useState('')
  const [pickRate, setPickRate] = useState('rec')   // rec | limit | safe | own
  const [ownRate, setOwnRate] = useState('')
  const [copied, setCopied] = useState(false)
  const [sjPick, setSjPick] = useState(null)   // 사정률 후보를 직접 고른 경우
  const seeded = useRef(false)

  useEffect(() => {
    getOverview().then(setOv)
    getIndex().then((v) => setIdx(v || null))
    getSim().then(setBt)
  }, [])

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
      aval: a[11] || 0, gmtrl: a[12] || 0,
      ayn: a[13] || '', aparts: a[14] || [],
      ptot: a[15] || 0, pdrw: a[16] || 0,
      url: a[17] || '',
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
    // 공고에 A값이 실려 오면 그대로 채웁니다 (손으로 옮겨 적을 일을 없애는 게 이 화면의 목적)
    setAIn(r.aval ? String(r.aval) : '')
    setSjPick(null)
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

  const sjMid = sjPick ?? ov?.sjq?.p50 ?? 100
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
          {(picked?.aparts || []).length > 0 ? (
            <div className="aparts">
              <div className="h">
                공고에서 자동으로 가져온 A값 내역
                {picked.ayn === 'N' && <span className="no"> · 이 공고는 A값 미적용</span>}
              </div>
              {picked.aparts.map(([nm, v]) => (
                <div className="ap" key={nm}><span>{nm}</span><b>{won(v)}</b></div>
              ))}
              <div className="ap sum"><span>합계</span><b>{won(picked.aval)}</b></div>
            </div>
          ) : (
            <div className="note sm">
              A값은 투찰률을 곱하지 않고 <b>그대로 더하는</b> 금액입니다.
              산업안전보건관리비 · 국민건강보험료 · 국민연금 · 노인장기요양보험료 ·
              퇴직공제부금 같은 법정경비가 여기 들어갑니다.<br />
              <b>공고에 A값이 실려 오면 자동으로 채워집니다.</b>
              아직 안 채워졌다면 기초금액이 공개되기 전이거나 A값이 없는 공고입니다.
            </div>
          )}
        </div>
      </div>

      {/* ── 가상 시뮬레이션 — 지난 개찰에 우리 방식을 대본 결과 ── */}
      {bt && base <= 0 && <SimBlock bt={bt} open={btOpen} setOpen={setBtOpen} />}

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
            <div className="sjline">
              <span className="lab">분석 사정률</span>
              <span className="val">{sjMid.toFixed(4)}%</span>
            </div>
            <div className="tag">{chosen?.label === '권장' ? '권장 투찰금액' : '투찰금액'}</div>
            <div className="amt">
              {String(main).replace(/\B(?=(\d{3})+(?!\d))/g, ',').split('').map((ch, i) => (
                <span key={i} className={ch === ',' ? 'sep' : 'dg'}>{ch}</span>
              ))}
              <span className="won">원</span>
            </div>
            <div className="sub">
              투찰률 {pct(myRate, 3)} · 예정가격 {won(Math.round(base * (sjMid / 100)))}
            </div>
            <div className="range">사정률에 따라 {wonShort(bandLo)} ~ {wonShort(bandHi)}</div>
            <div className="hbtns">
              <button className="cbtn" onClick={copy}>
                {copied ? '✓ 복사했습니다' : '금액 복사'}
              </button>
              {/* ⚠️ 주소를 손으로 만들지 않습니다.
                  차수(000/001/002)를 틀리면 엉뚱한 공고로 갑니다 — 실제로 틀렸었습니다.
                  조달청이 준 주소(bidNtceDtlUrl)를 그대로 씁니다.
                  그리고 이 링크는 «투찰» 화면이 아니라 «공고 상세» 입니다.
                  진짜 투찰은 나라장터 로그인과 보안토큰이 있어야 해서 링크로 못 갑니다. */}
              <a className="cbtn ghost" target="_blank" rel="noreferrer"
                href={picked?.url || 'https://www.g2b.go.kr'}>
                나라장터 공고 →
              </a>
            </div>
          </div>

          {/* ── 분석 정보 ── */}
          {picked && (
            <div className="card">
              <div className="detail-h">분석 정보</div>
              <div className="kv2">
                <div><span>공고명</span><b>{picked.name}</b></div>
                <div><span>발주처</span><b>{picked.inst}</b></div>
                <div><span>기초금액</span><b>{won(base)}</b></div>
                <div><span>추정가격</span><b>{won(estimate)}</b></div>
                <div><span>예가범위</span><b>+{hi}% ~ {lo}%</b></div>
                <div><span>낙찰하한율</span><b>{ll?.rate ? pct(ll.rate, 3) : '별도 기준'}</b></div>
                {ll?.rate > 0 && (
                  <div><span>하한 금액</span><b>{won(bidAmount(base, sjMid, ll.rate, a))}</b></div>
                )}
                <div><span>A값</span>
                  <b>{a > 0 ? won(a) : (picked.aval ? won(picked.aval) : '공고서 확인')}</b></div>
                {picked.gmtrl > 0 && (
                  <div><span>관급자재</span><b>{won(picked.gmtrl)}</b></div>
                )}
                {picked.ptot > 0 && (
                  <div><span>예비가격</span>
                    <b>{picked.ptot}개 중 {picked.pdrw}개 추첨 (복수예가)</b></div>
                )}
                <div><span>입찰마감</span><b>{dateTime(picked.close)}</b></div>
                {ag && <div><span>이 발주처 3년</span><b>{num(ag.n)}건 · 평균 {pct(ag.s?.avg, 3)}</b></div>}
              </div>
            </div>
          )}

          {/* 투찰률 고르기 */}
          <div className="ratepick">
            {choices.map((c) => (
              <button key={c.k}
                className={(pickRate === c.k ? 'on' : '')
                  + (ll?.rate && c.rate < ll.rate ? ' warn' : '')}
                onClick={() => { setPickRate(c.k); setCopied(false) }}>
                <b>{c.label}</b><span>{c.rate.toFixed(3)}%</span>
              </button>
            ))}
            <button className={pickRate === 'own' ? 'on' : ''}
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

          {/* A값을 비워둔 채 하한 가까이 넣으면 실격합니다 — 가장 흔한 사고 */}
          {a === 0 && ll?.rate && margin != null && margin < 0.5 && (
            <div className="warnbox">
              <div className="h">⚠️ A값을 비워두셨습니다</div>
              <p>
                이 공고에 A값이 <b>있다면</b> 지금 금액은 <b>하한 미달로 실격</b>입니다.
                적격심사 하한은 <code>(예정가격 − A) × 하한율 + A</code> 로 판정하는데,
                A값이 커질수록 하한 금액이 올라가기 때문입니다.
              </p>
              <div className="kv">
                <div>
                  <span>A값 0원일 때 하한</span>
                  <b>{won(bidAmount(base, sjMid, ll.rate, 0))}</b>
                </div>
                <div>
                  <span>A값이 기초의 10%라면</span>
                  <b className="hi">{won(bidAmount(base, sjMid, ll.rate, Math.round(base * 0.1)))}</b>
                </div>
              </div>
              <p className="last">
                공고서 산출내역서의 «사회보험료 등» 합계를 위 A값 칸에 넣어주세요.
                A값이 없는 공고라면 지금 이대로가 맞습니다.
              </p>
            </div>
          )}

          {/* ── 사정률 후보 10개 ── */}
          {(ov?.sjc || []).length > 0 && (
            <div className="card">
              <div className="detail-h">
                사정률 후보 <span className="count">· 실제 개찰 {num(ov.sjn)}건에서 나온 자리</span>
              </div>
              <div className="note sm" style={{ marginTop: 0, marginBottom: 9 }}>
                사정률은 개찰 때 추첨으로 정해져 아무도 미리 알 수 없습니다.
                그래서 <b>실제로 이만큼 나왔다</b>는 열 지점을 그대로 드립니다.
                누르면 그 사정률로 다시 계산합니다.
              </div>
              <div className="sjgrid">
                {ov.sjc.map((v) => {
                  const on = Math.abs(v - sjMid) < 0.0005
                  return (
                    <button key={v} className={'sjc' + (on ? ' on' : '')}
                      onClick={() => { setSjPick(v); setCopied(false) }}>
                      <span className="r">{v.toFixed(4)}</span>
                      <span className="a">{wonShort(bidAmount(base, v, myRate, a))}</span>
                    </button>
                  )
                })}
              </div>
              {sjPick != null && (
                <button className="btn ghost sm" style={{ width: '100%', marginTop: 9 }}
                  onClick={() => setSjPick(null)}>가운데값으로 되돌리기</button>
              )}
            </div>
          )}

          {bt && <SimBlock bt={bt} open={btOpen} setOpen={setBtOpen} />}

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

/* ============================================================
   가상 시뮬레이션

   «그때 우리 방식으로 넣었으면 어땠을까» 를 실제 개찰로 대봅니다.
   사정률 후보 10개를 각각 넣어 보고, 그 금액이 실제 1순위보다 낮으면서
   낙찰하한을 넘겼으면 «낙찰» 로 표시합니다.

   한계를 숨기지 않습니다 — 조달청이 1순위만 주기 때문에
   2위 이하와의 경쟁, 적격심사의 비가격 요소는 반영하지 못합니다.
   ============================================================ */
function SimBlock({ bt, open, setOpen }) {
  const cases = open ? bt.cases : bt.cases.slice(0, 3)
  return (
    <div className="card">
      <div className="detail-h">
        가상 시뮬레이션
        <span className="count">· 최근 {bt.days}일 개찰 {num(bt.n)}건에 대봤습니다</span>
      </div>

      <div className="simsum">
        <div>
          <span>한 개라도 맞은 공고</span>
          <b className="hi">{bt.anyRate}%</b>
        </div>
        <div>
          <span>후보 10개 중 평균 적중</span>
          <b>{bt.hitRate}%</b>
        </div>
        <div>
          <span>적용한 투찰률</span>
          <b>{pct(bt.rate, 3)}</b>
        </div>
      </div>

      {cases.map((c, i) => (
        <div className="simcase" key={i}>
          <div className="h">
            <span className="d">{c.dt}</span>
            <span className="t">{c.name}</span>
          </div>
          <div className="m">
            실제 낙찰 <b>{won(c.win)}</b> · 투찰률 {pct(c.rate, 3)} ·
            {' '}실제 사정률 <b>{c.sj.toFixed(4)}</b>
          </div>
          <div className="marks">
            {c.marks.map(([v, amt, ok]) => (
              <div key={v} className={'mk' + (ok ? ' win' : '')} title={won(amt)}>
                {ok && <span className="badge2">낙찰</span>}
                <span className="v">{v.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button className="btn ghost sm" style={{ width: '100%', marginTop: 8 }}
        onClick={() => setOpen(!open)}>
        {open ? '접기' : `나머지 ${bt.cases.length - 3}건 더 보기`}
      </button>

      <div className="note sm">
        <b>이 숫자를 그대로 믿지 마세요.</b> 조달청이 1순위(낙찰자)만 알려주기 때문에,
        «실제 1순위보다 낮았다»까지만 확인한 것입니다.
        2위 이하 업체와의 경쟁, 적격심사의 경영상태·시공경험 같은 비가격 요소는
        반영하지 못했습니다. <b>실제 승률은 위 숫자보다 낮습니다.</b>
      </div>
    </div>
  )
}
