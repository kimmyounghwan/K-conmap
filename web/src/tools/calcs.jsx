/* ==========================================================
   🧰 도구 — 계산기 본체

   ⚠️ 설명·근거 글은 여기에 적지 않습니다. web/src/data/tools.json 한 곳에만 있고,
      화면·prerender.py·sitemap.py 가 그 파일을 같이 읽습니다.
      여기에는 «계산» 만 둡니다 (CLAUDE.md — 같은 것을 두 번 적지 않는다).

   ⚠️ 단가는 넣지 않습니다. 표준품셈·물가정보·노임단가는 유료 간행물이라
      표를 그대로 실을 수 없습니다. 수량만 내고 단가는 사용자가 곱합니다.
   ========================================================== */
import { useState } from 'react'
/* ⚠️ 낙찰하한율 규칙은 lib/engines.js 한 곳에만 있습니다. 여기서 다시 적지 않습니다. */
import { lowerLimit } from '../lib/bidmath.js'

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
export function AValue({ ex = {} }) {
  const [base, setBase] = useState(ex.base ?? '')
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
export function EffectiveFloor({ ex = {} }) {
  const [base, setBase] = useState(ex.base ?? '')
  const [aval, setAval] = useState(ex.aval ?? '')
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
export function RebarWeight({ ex = {} }) {
  const [d, setD] = useState(ex.d ?? 'D16')
  const [len, setLen] = useState(ex.len ?? '')
  const [cnt, setCnt] = useState(ex.cnt ?? '')
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

/* ── 낙찰하한율 찾기 ─────────────────────────────────────────── */
export function FloorRate({ ex = {} }) {
  const [est, setEst] = useState(ex.est ?? '')
  const e = num(est)
  const r = e > 0 ? lowerLimit(e) : null
  return (
    <div className="tool">
      <Row label="추정가격" hint="원 · 부가세 제외">
        <input inputMode="numeric" value={est} onChange={(ev) => setEst(ev.target.value)} placeholder="630,000,000" />
      </Row>
      <Out items={[
        { k: '구간', v: r ? r.note : '—' },
        { k: '낙찰하한율', v: r && r.rate ? r.rate + '%' : (r ? '해당 없음' : '—'), big: true },
      ]} />
      <div className="hint"><b>공고서에 하한율이 적혀 있으면 그 값이 우선입니다.</b> 실측 6,212건 중 128건(2.1%)이 규모 기준과 달랐고, 최대 3.7%까지 차이 났습니다.</div>
    </div>
  )
}

/* ── 적격심사 점수 합산기 — 배점표는 내장하지 않습니다 ───────────── */
const QITEMS = ['경영상태', '시공경험', '기술능력', '신인도', '자재·장비', '기타']
export function QualifyScore({ ex = {} }) {
  const [v, setV] = useState(() => Object.fromEntries(QITEMS.map((k) => [k, (ex.v && ex.v[k]) ?? ''])))
  const [pass, setPass] = useState('95')
  const sum = QITEMS.reduce((a, k) => a + num(v[k]), 0)
  const need = num(pass) - sum
  return (
    <div className="tool">
      <div className="tl-grid">
        {QITEMS.map((k) => (
          <Row key={k} label={k} hint="점">
            <input inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
          </Row>
        ))}
        <Row label="통과 점수" hint="점 · 공고서 기준">
          <input inputMode="decimal" value={pass} onChange={(e) => setPass(e.target.value)} />
        </Row>
      </div>
      <Out items={[
        { k: '합계', v: sum > 0 ? sum.toFixed(2) + '점' : '—', big: true },
        { k: '통과선까지', v: sum > 0 ? (need <= 0 ? '통과 (+' + (-need).toFixed(2) + '점)' : need.toFixed(2) + '점 부족') : '—' },
      ]} />
      <div className="hint">배점은 <b>발주기관·연도·규모마다 다릅니다.</b> 공고서 배점표를 보고 넣으세요 — 이 도구는 더하기만 합니다.</div>
    </div>
  )
}

/* ── 물가변동 조정금액 ────────────────────────────────────────── */
export function PriceAdjust({ ex = {} }) {
  const [amt, setAmt] = useState(ex.amt ?? '')
  const [rate, setRate] = useState(ex.rate ?? '')
  const [days, setDays] = useState(ex.days ?? '')
  const a = num(amt), r = num(rate), d = num(days)
  const ok90 = d >= 90, ok3 = Math.abs(r) >= 3
  const adj = (ok90 && ok3) ? a * r / 100 : 0
  return (
    <div className="tool">
      <div className="tl-grid">
        <Row label="조정대상금액" hint="원 · 아직 이행 안 한 부분">
          <input inputMode="numeric" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="500,000,000" />
        </Row>
        <Row label="등락률" hint="% · 지수 또는 품목">
          <input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="4.2" />
        </Row>
        <Row label="경과일수" hint="일 · 계약·직전조정일부터">
          <input inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} placeholder="120" />
        </Row>
      </div>
      <Out items={[
        { k: '90일 요건', v: d > 0 ? (ok90 ? '충족' : '미달 (' + (90 - d) + '일 남음)') : '—' },
        { k: '3% 요건', v: r !== 0 ? (ok3 ? '충족' : '미달') : '—' },
        { k: '조정금액', v: adj ? won(adj) : (a > 0 ? '조정 불가' : '—'), big: true },
      ]} />
      <div className="hint">이미 기성검사를 받은 부분은 <b>조정대상에서 빠집니다.</b> 늦게 신청할수록 받을 금액이 줄어듭니다.</div>
    </div>
  )
}

/* ── 토량환산계수 L·C ─────────────────────────────────────────── */
export function SoilVolume({ ex = {} }) {
  const [from, setFrom] = useState(ex.from ?? 'nat')
  const [vol, setVol] = useState(ex.vol ?? '')
  const [L, setL] = useState('1.25')
  const [C, setC] = useState('0.90')
  const v = num(vol), l = num(L) || 1, c = num(C) || 1
  const nat = from === 'nat' ? v : from === 'loose' ? v / l : v / c
  return (
    <div className="tool">
      <div className="tl-grid">
        <Row label="넣는 값의 상태">
          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            <option value="nat">자연상태 (지반 그대로)</option>
            <option value="loose">흐트러진 상태 (파낸 흙)</option>
            <option value="comp">다짐상태 (성토 완료)</option>
          </select>
        </Row>
        <Row label="토량" hint="㎥">
          <input inputMode="decimal" value={vol} onChange={(e) => setVol(e.target.value)} placeholder="1000" />
        </Row>
        <Row label="L" hint="흐트러진÷자연">
          <input inputMode="decimal" value={L} onChange={(e) => setL(e.target.value)} />
        </Row>
        <Row label="C" hint="다짐÷자연">
          <input inputMode="decimal" value={C} onChange={(e) => setC(e.target.value)} />
        </Row>
      </div>
      <Out items={[
        { k: '자연상태', v: nat > 0 ? nat.toFixed(1) + ' ㎥' : '—' },
        { k: '흐트러진 상태 (운반)', v: nat > 0 ? (nat * l).toFixed(1) + ' ㎥' : '—', big: true },
        { k: '다짐상태 (성토)', v: nat > 0 ? (nat * c).toFixed(1) + ' ㎥' : '—' },
      ]} />
      <div className="hint">L·C 는 흙 종류마다 다릅니다. <b>설계도서나 토질조사 값이 있으면 그것을 넣으세요.</b></div>
    </div>
  )
}

/* ── 콘크리트 물량 ────────────────────────────────────────────── */
export function ConcreteVolume({ ex = {} }) {
  const [w, setW] = useState(ex.w ?? ''); const [h, setH] = useState(ex.h ?? '')
  const [l, setL] = useState(ex.l ?? ''); const [n, setN] = useState(ex.n ?? '1')
  const [loss, setLoss] = useState('2')
  const v = num(w) * num(h) * num(l) * num(n)
  const vl = v * (1 + num(loss) / 100)
  return (
    <div className="tool">
      <div className="tl-grid">
        <Row label="가로(폭)" hint="m"><input inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} placeholder="0.4" /></Row>
        <Row label="세로(높이)" hint="m"><input inputMode="decimal" value={h} onChange={(e) => setH(e.target.value)} placeholder="0.6" /></Row>
        <Row label="길이" hint="m"><input inputMode="decimal" value={l} onChange={(e) => setL(e.target.value)} placeholder="12" /></Row>
        <Row label="개수" hint="개"><input inputMode="numeric" value={n} onChange={(e) => setN(e.target.value)} /></Row>
        <Row label="손실" hint="% · 흘림·변형"><input inputMode="decimal" value={loss} onChange={(e) => setLoss(e.target.value)} /></Row>
      </div>
      <Out items={[
        { k: '산출 체적', v: v > 0 ? v.toFixed(3) + ' ㎥' : '—' },
        { k: '손실 포함', v: vl > 0 ? vl.toFixed(3) + ' ㎥' : '—', big: true },
      ]} />
      <div className="hint">개구부·다른 부재와 겹치는 부분은 <b>빼서 넣으셔야</b> 합니다.</div>
    </div>
  )
}

/* ── 거푸집 면적 ──────────────────────────────────────────────── */
export function FormworkArea({ ex = {} }) {
  const [kind, setKind] = useState(ex.kind ?? 'col')
  const [a, setA] = useState(ex.a ?? ''); const [b, setB] = useState(ex.b ?? '')
  const [h, setH] = useState(ex.h ?? ''); const [n, setN] = useState(ex.n ?? '1')
  const A = num(a), B = num(b), H = num(h), N = num(n)
  let area = 0, how = ''
  if (kind === 'col') { area = 2 * (A + B) * H * N; how = '둘레 × 높이 (네 옆면)' }
  else if (kind === 'wall') { area = A * H * 2 * N; how = '길이 × 높이 × 양면' }
  else if (kind === 'beam') { area = (2 * H + B) * A * N; how = '(양 옆면 + 밑면) × 길이' }
  else { area = A * B * N; how = '슬래브 밑면' }
  return (
    <div className="tool">
      <div className="tl-grid">
        <Row label="부재">
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="col">기둥</option><option value="wall">벽</option>
            <option value="beam">보</option><option value="slab">슬래브</option>
          </select>
        </Row>
        <Row label={kind === 'slab' ? '가로' : kind === 'col' ? '단면 가로' : '길이'} hint="m">
          <input inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} />
        </Row>
        <Row label={kind === 'slab' ? '세로' : kind === 'col' ? '단면 세로' : '폭'} hint="m">
          <input inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} />
        </Row>
        {kind !== 'slab' && (
          <Row label="높이(춤)" hint="m"><input inputMode="decimal" value={h} onChange={(e) => setH(e.target.value)} /></Row>
        )}
        <Row label="개수" hint="개"><input inputMode="numeric" value={n} onChange={(e) => setN(e.target.value)} /></Row>
      </div>
      <Out items={[
        { k: '계산 방식', v: how },
        { k: '거푸집 면적', v: area > 0 ? area.toFixed(2) + ' ㎡' : '—', big: true },
      ]} />
      <div className="hint">바닥이나 다른 콘크리트에 닿는 면은 거푸집이 필요 없습니다. <b>개구부·접합부는 도면을 보고 조정</b>하세요.</div>
    </div>
  )
}

/* ── 레미콘 대수 ──────────────────────────────────────────────── */
export function RemiconTruck({ ex = {} }) {
  const [vol, setVol] = useState(ex.vol ?? ''); const [cap, setCap] = useState('6'); const [loss, setLoss] = useState('2')
  const v = num(vol) * (1 + num(loss) / 100)
  const c = num(cap) || 6
  const cars = v > 0 ? Math.ceil(v / c) : 0
  const left = cars > 0 ? cars * c - v : 0
  return (
    <div className="tool">
      <div className="tl-grid">
        <Row label="콘크리트 물량" hint="㎥"><input inputMode="decimal" value={vol} onChange={(e) => setVol(e.target.value)} placeholder="45" /></Row>
        <Row label="차량 용량" hint="㎥"><input inputMode="decimal" value={cap} onChange={(e) => setCap(e.target.value)} /></Row>
        <Row label="손실" hint="%"><input inputMode="decimal" value={loss} onChange={(e) => setLoss(e.target.value)} /></Row>
      </div>
      <Out items={[
        { k: '손실 포함 물량', v: v > 0 ? v.toFixed(2) + ' ㎥' : '—' },
        { k: '필요 대수', v: cars > 0 ? cars + ' 대' : '—', big: true },
        { k: '마지막 차 남는 양', v: cars > 0 ? left.toFixed(2) + ' ㎥' : '—' },
      ]} />
      <div className="hint">남는 양이 많으면 <b>소형 차량을 섞어 주문</b>하는 것이 낫습니다. 배차 간격도 함께 잡으세요(콜드조인트).</div>
    </div>
  )
}

/* ── 아스팔트 톤수 ────────────────────────────────────────────── */
export function AsphaltTonnage({ ex = {} }) {
  const [area, setArea] = useState(ex.area ?? ''); const [t, setT] = useState('5')
  const [den, setDen] = useState('2.35'); const [loss, setLoss] = useState('3')
  const v = num(area) * (num(t) / 100)
  const ton = v * num(den) * (1 + num(loss) / 100)
  return (
    <div className="tool">
      <div className="tl-grid">
        <Row label="포장 면적" hint="㎡"><input inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value)} placeholder="1200" /></Row>
        <Row label="두께" hint="cm"><input inputMode="decimal" value={t} onChange={(e) => setT(e.target.value)} /></Row>
        <Row label="밀도" hint="t/㎥"><input inputMode="decimal" value={den} onChange={(e) => setDen(e.target.value)} /></Row>
        <Row label="손실" hint="%"><input inputMode="decimal" value={loss} onChange={(e) => setLoss(e.target.value)} /></Row>
      </div>
      <Out items={[
        { k: '체적', v: v > 0 ? v.toFixed(2) + ' ㎥' : '—' },
        { k: '아스콘 소요량', v: ton > 0 ? ton.toFixed(2) + ' 톤' : '—', big: true },
      ]} />
      <div className="hint">밀도는 혼합물 종류·다짐도에 따라 다릅니다. <b>시방서나 배합설계 값이 있으면 그것을 넣으세요.</b></div>
    </div>
  )
}

/* ── 벽돌·블록 수량 ───────────────────────────────────────────── */
const BRICK = [
  ['0.5B 쌓기', 75], ['1.0B 쌓기', 149], ['1.5B 쌓기', 224], ['2.0B 쌓기', 298],
  ['콘크리트블록', 12.5],
]
export function BrickCount({ ex = {} }) {
  const [area, setArea] = useState(ex.area ?? ''); const [kind, setKind] = useState('1.0B 쌓기')
  const [per, setPer] = useState('149'); const [loss, setLoss] = useState('4')
  const cnt = num(area) * num(per) * (1 + num(loss) / 100)
  const pick = (k) => { setKind(k); const f = BRICK.find((x) => x[0] === k); if (f) setPer(String(f[1])) }
  return (
    <div className="tool">
      <div className="tl-grid">
        <Row label="벽 면적" hint="㎡"><input inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value)} placeholder="85" /></Row>
        <Row label="쌓기 방식">
          <select value={kind} onChange={(e) => pick(e.target.value)}>
            {BRICK.map(([k]) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Row>
        <Row label="㎡당 장수" hint="매"><input inputMode="decimal" value={per} onChange={(e) => setPer(e.target.value)} /></Row>
        <Row label="할증" hint="% · 파손·절단"><input inputMode="decimal" value={loss} onChange={(e) => setLoss(e.target.value)} /></Row>
      </div>
      <Out items={[
        { k: '산출 수량', v: num(area) > 0 ? Math.round(num(area) * num(per)).toLocaleString('ko-KR') + ' 매' : '—' },
        { k: '할증 포함', v: cnt > 0 ? Math.ceil(cnt).toLocaleString('ko-KR') + ' 매' : '—', big: true },
      ]} />
      <div className="hint">표준형 시멘트벽돌(190×90×57, 줄눈 10mm) 기준입니다. <b>규격이나 줄눈이 다르면 ㎡당 장수를 고쳐 넣으세요.</b></div>
    </div>
  )
}

/* 🧪 2026-09-26 — 소장님: 「각각의 도구별로 예시가 하나씩 있어야 하지 않아. 그래야 사람들이 보고 해보지」
   «예시로 해 보기» 를 누르면 아래 값이 칸에 들어가고 결과가 바로 나옵니다 (Tools.jsx ToolPage).
   ⚠️ 가상의 공사 숫자입니다 — 남의 공사명·금액을 옮기지 않습니다. */
export const EXAMPLES = {
  'a-value': { 글: '기초금액 6억 3천만 원 공사 — 요율은 참고 기본값', ex: { base: '630,000,000' } },
  'effective-floor': { 글: '기초금액 6억 3천만 원 · A값 3,780만 원 · 하한율 89.745%', ex: { base: '630,000,000', aval: '37,800,000' } },
  'rebar-weight': { 글: 'D16 철근 8m 짜리 120개 · 할증 3%', ex: { d: 'D16', len: '8', cnt: '120' } },
  'floor-rate': { 글: '추정가격 6억 3천만 원 공사', ex: { est: '630,000,000' } },
  'qualify-score': { 글: '배점표에서 읽은 항목 점수를 넣은 모습 (예시 점수 — 실제 배점은 공고서)', ex: { v: { '경영상태': '15', '시공경험': '13.5', '기술능력': '0', '신인도': '1.2', '자재·장비': '0', '기타': '68' } } },
  'price-adjust': { 글: '남은 공사 5억 원 · 등락률 4.2% · 계약 뒤 120일', ex: { amt: '500,000,000', rate: '4.2', days: '120' } },
  'soil-volume': { 글: '자연상태 흙 1,000㎥ 를 흐트러진·다짐 상태로', ex: { from: 'nat', vol: '1000' } },
  'concrete-volume': { 글: '보 0.4×0.6m, 길이 12m 짜리 8개', ex: { w: '0.4', h: '0.6', l: '12', n: '8' } },
  'formwork-area': { 글: '기둥 0.5×0.5m, 높이 3.6m 짜리 12개', ex: { kind: 'col', a: '0.5', b: '0.5', h: '3.6', n: '12' } },
  'remicon-truck': { 글: '콘크리트 45㎥ 를 6㎥ 차로', ex: { vol: '45' } },
  'asphalt-tonnage': { 글: '포장 1,200㎡ · 두께 5cm', ex: { area: '1200' } },
  'brick-count': { 글: '벽 85㎡ 를 1.0B 로 쌓을 때', ex: { area: '85' } },
}

/* slug → 계산기. tools.json 의 slug 와 짝이 맞아야 합니다 (selfcheck 가 대조합니다). */
export const CALCS = {
  'a-value': AValue,
  'effective-floor': EffectiveFloor,
  'rebar-weight': RebarWeight,
  'floor-rate': FloorRate,
  'qualify-score': QualifyScore,
  'price-adjust': PriceAdjust,
  'soil-volume': SoilVolume,
  'concrete-volume': ConcreteVolume,
  'formwork-area': FormworkArea,
  'remicon-truck': RemiconTruck,
  'asphalt-tonnage': AsphaltTonnage,
  'brick-count': BrickCount,
}
