/* ==========================================================
   🧰 도구 — 계산기 본체

   ⚠️ 설명·근거 글은 여기에 적지 않습니다. web/src/data/tools.json 한 곳에만 있고,
      화면·prerender.py·sitemap.py 가 그 파일을 같이 읽습니다.
      여기에는 «계산» 만 둡니다 (CLAUDE.md — 같은 것을 두 번 적지 않는다).

   ⚠️ 단가는 넣지 않습니다. 표준품셈·물가정보·노임단가는 유료 간행물이라
      표를 그대로 실을 수 없습니다. 수량만 내고 단가는 사용자가 곱합니다.
   ========================================================== */
import { useState } from 'react'

const won = (n) => (n > 0 ? Math.round(n).toLocaleString('ko-KR') + '원' : '—')
const num = (v) => { const n = Number(String(v).replace(/[^0-9.]/g, '')); return isFinite(n) ? n : 0 }

function Row({ label, hint, children }) {
  return (
    <label className="tl-row">
      <span className="tl-lab">{label}{hint ? <i>{hint}</i> : null}</span>
      {children}
    </label>
  )
}
function Out({ items }) {
  return (
    <div className="tl-out">
      {items.map((x, i) => (
        <div key={i} className={'tl-o' + (x.big ? ' big' : '')}>
          <span>{x.k}</span><b>{x.v}</b>
        </div>
      ))}
    </div>
  )
}

/* ── A값(법정경비) — 기초금액에 요율을 곱해 항목별로 냅니다 ──────────────
   요율은 «참고용 기본값» 입니다. 공고서 값이 있으면 그것이 우선입니다. */
const A_PARTS = [
  { k: 'safe', n: '산업안전보건관리비', r: 1.97 },
  { k: 'heal', n: '국민건강보험료', r: 1.99 },
  { k: 'pens', n: '국민연금보험료', r: 2.49 },
  { k: 'care', n: '노인장기요양보험료', r: 0.26 },
  { k: 'reti', n: '퇴직공제부금비', r: 2.30 },
  { k: 'qual', n: '품질관리비', r: 0.70 },
]
export function AValue() {
  const [base, setBase] = useState('')
  const [rate, setRate] = useState(() => Object.fromEntries(A_PARTS.map((p) => [p.k, String(p.r)])))
  const b = num(base)
  const parts = A_PARTS.map((p) => ({ ...p, amt: b * num(rate[p.k]) / 100 }))
  const total = parts.reduce((s, p) => s + p.amt, 0)
  return (
    <div className="tool">
      <Row label="기초금액" hint="원">
        <input inputMode="numeric" value={base} onChange={(e) => setBase(e.target.value)}
          placeholder="예: 630,000,000" />
      </Row>
      <div className="tl-grid">
        {A_PARTS.map((p) => (
          <Row key={p.k} label={p.n} hint="%">
            <input inputMode="decimal" value={rate[p.k]}
              onChange={(e) => setRate({ ...rate, [p.k]: e.target.value })} />
          </Row>
        ))}
      </div>
      <Out items={[
        ...parts.map((p) => ({ k: p.n, v: won(p.amt) })),
        { k: 'A값 합계', v: won(total), big: true },
        { k: '기초금액 대비', v: b > 0 ? (total / b * 100).toFixed(2) + '%' : '—' },
      ]} />
      <div className="hint">요율은 참고용 기본값입니다. <b>공고서(산출내역서)의 값을 확인</b>하세요.</div>
    </div>
  )
}

/* ── 실효 낙찰하한 투찰률 ─────────────────────────────────────────
   낙찰하한금액 = (예정가격 − A) × 하한율 + A
   실효 투찰률  = 낙찰하한금액 ÷ 예정가격
   예정가격은 개찰 때 추첨이라, 여기서는 기초금액 × 사정률로 추정합니다. */
export function EffectiveFloor() {
  const [base, setBase] = useState('')
  const [aval, setAval] = useState('')
  const [llr, setLlr] = useState('89.745')
  const [sj, setSj] = useState('99.896')
  const b = num(base), a = num(aval), r = num(llr) / 100, s = num(sj) / 100
  const plan = b * s                      // 추정 예정가격
  const floor = plan > 0 ? (plan - a) * r + a : 0
  const eff = plan > 0 ? floor / plan * 100 : 0
  const gap = plan > 0 ? eff - num(llr) : 0
  return (
    <div className="tool">
      <div className="tl-grid">
        <Row label="기초금액" hint="원">
          <input inputMode="numeric" value={base} onChange={(e) => setBase(e.target.value)} placeholder="630,000,000" />
        </Row>
        <Row label="A값" hint="원">
          <input inputMode="numeric" value={aval} onChange={(e) => setAval(e.target.value)} placeholder="37,800,000" />
        </Row>
        <Row label="낙찰하한율" hint="%">
          <input inputMode="decimal" value={llr} onChange={(e) => setLlr(e.target.value)} />
        </Row>
        <Row label="사정률" hint="% · 전국 중앙 99.896">
          <input inputMode="decimal" value={sj} onChange={(e) => setSj(e.target.value)} />
        </Row>
      </div>
      <Out items={[
        { k: '추정 예정가격', v: won(plan) },
        { k: '낙찰하한금액', v: won(floor) },
        { k: '실효 하한 투찰률', v: eff > 0 ? eff.toFixed(3) + '%' : '—', big: true },
        { k: '명목 하한율과 차이', v: plan > 0 ? '+' + gap.toFixed(3) + '%p' : '—' },
      ]} />
      <div className="hint">예정가격은 개찰 때 추첨으로 정해집니다. 이 값은 <b>기준선이지 확정이 아닙니다</b>.</div>
    </div>
  )
}

/* ── 철근 중량 ────────────────────────────────────────────────
   단위중량은 KS D 3504 공칭값입니다. */
const REBAR = [
  ['D10', 0.560], ['D13', 0.995], ['D16', 1.560], ['D19', 2.250], ['D22', 3.040],
  ['D25', 3.980], ['D29', 5.040], ['D32', 6.230], ['D35', 7.510], ['D38', 8.950], ['D41', 10.230],
]
export function RebarWeight() {
  const [d, setD] = useState('D16')
  const [len, setLen] = useState('')
  const [cnt, setCnt] = useState('')
  const [add, setAdd] = useState('3')
  const u = (REBAR.find((x) => x[0] === d) || [, 0])[1]
  const kg = u * num(len) * num(cnt)
  const kgAdd = kg * (1 + num(add) / 100)
  return (
    <div className="tool">
      <div className="tl-grid">
        <Row label="규격">
          <select value={d} onChange={(e) => setD(e.target.value)}>
            {REBAR.map(([k, v]) => <option key={k} value={k}>{k} ({v} kg/m)</option>)}
          </select>
        </Row>
        <Row label="한 개 길이" hint="m">
          <input inputMode="decimal" value={len} onChange={(e) => setLen(e.target.value)} placeholder="8" />
        </Row>
        <Row label="개수" hint="본">
          <input inputMode="numeric" value={cnt} onChange={(e) => setCnt(e.target.value)} placeholder="120" />
        </Row>
        <Row label="할증" hint="% · 이음·로스">
          <input inputMode="decimal" value={add} onChange={(e) => setAdd(e.target.value)} />
        </Row>
      </div>
      <Out items={[
        { k: '단위중량', v: u + ' kg/m' },
        { k: '산출 중량', v: kg > 0 ? kg.toLocaleString('ko-KR', { maximumFractionDigits: 1 }) + ' kg' : '—' },
        { k: '할증 포함', v: kgAdd > 0 ? kgAdd.toLocaleString('ko-KR', { maximumFractionDigits: 1 }) + ' kg' : '—', big: true },
        { k: '톤 환산', v: kgAdd > 0 ? (kgAdd / 1000).toFixed(3) + ' t' : '—' },
      ]} />
      <div className="hint">단가는 싣지 않습니다 — 물가정보 단가는 유료 자료입니다. <b>수량만 내고 단가는 직접 곱하십시오.</b></div>
    </div>
  )
}

/* slug → 계산기. tools.json 의 slug 와 짝이 맞아야 합니다 (selfcheck 가 대조합니다). */
export const CALCS = {
  'a-value': AValue,
  'effective-floor': EffectiveFloor,
  'rebar-weight': RebarWeight,
}
