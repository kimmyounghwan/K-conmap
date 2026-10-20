/**
 * 📊 입찰 분석실 — 가운데 «분석» 칸 (G340 · 2026-10-20)
 *
 * 소장님 「입찰 프로그램, 이렇게 만들 수는 없을까」(비드프로 화면) · 「이용자 입장에서 편하게 … 간편하게 … 그러면서 다 되게 … 정말 숙고해서」
 * ■ 차례(위가 먼저 볼 것)
 *   ① 사정률 흐름 — 이 기관(또는 같은 시도) 최근 60건 · 가운데값 · «내 금액 하한선»(이 선 위로 사정률이 나오면 내 금액은 실격)
 *   ② 어디에 많이 나왔나 — 0.5%p 칸 막대 · 가장 많은 두 칸 · 전국(또는 같은 금액대) 비율을 점으로 겹침
 *      그림의 점이나 막대를 누르면 «그 사정률이면 투찰금액 얼마 · 하한을 넘을 확률» → [이 금액으로 고르기] 는 오른쪽 계산(바로투찰)과 같은 길(직접 투찰률)
 *   ③ 고르는 방법 — 지난 개찰에 대 보면 몇 % 맞았나(이 기관 · 전국) — 흔히 쓰는 «최고 · 차순» 도 숫자로
 *   ④ 이 기관 지난 1순위 · 자주 이긴 업체
 * ■ 숫자는 lib/분석판.js(파이썬 build_sjl 과 같은 셈) · 금액은 bidmath(shownBid · limitAmount · passProb) — 바로투찰과 같은 함수
 * ■ 숨은 누적: |분석판|보임 · |분석판|보기시도 · |분석판|점 · |분석판|칸 · |분석판|고르기 · |분석판|비교금액대 · |분석판|1순위펼침
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { 긴흐름받기, 분포받기, 줄풀기, 시도줄풀기, 범위of, 범위코드, 범위말, 칸번호, 칸이름, 가장많은두칸, 가운데,
         적중검사, 앞뒤상관, 상관말, 굵은칸, 칸세기, 뚜렷이높음, 짧은날, 방법들 } from './lib/분석판.js'
import { breakEvenSj, limitAmount, shownBid, passProb } from './lib/bidmath.js'
import { 금액대of, 금액대들 } from './lib/금액대성적.js'
import { 세기 } from './lib/받은수.jsx'
import { won } from './lib/fmt.js'

function 너비재기(ref) {
  const [w, setW] = useState(560)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const 재기 = () => setW(Math.max(280, Math.round(el.getBoundingClientRect().width)))
    재기()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(재기); ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return w
}
const 퍼 = (v, d = 1) => (v == null ? '—' : `${Number(v).toFixed(d)}%`)

/** 그 사정률이면 — 금액 · 투찰률 · 하한을 넘을 확률 · [고르기] */
function 그사정률({ sj, 덧, base, llr, aval, sjMid, sjSd, 직접, 지금금액 }) {
  if (!(sj > 0)) return null
  if (!(base > 0 && llr > 0 && sjMid > 0)) {
    return <div className="bsr-pick"><b>사정률 {sj.toFixed(2)}%</b>{덧 ? <> · {덧}</> : null} — 기초금액 · 하한율이 있어야 금액을 셉니다</div>
  }
  const sb = shownBid(base, sjMid, Math.ceil(limitAmount(base, sj, llr, aval)))
  if (!sb) return null
  const pp = passProb({ base, llRate: llr, aVal: aval, amt: sb.amt, p50: sjMid, sd: sjSd })
  const 같음 = 지금금액 > 0 && sb.amt === 지금금액
  return (
    <div className="bsr-pick">
      <div className="bsr-pick-t">
        <b>사정률 {sj.toFixed(2)}%</b>{덧 ? <span className="muted"> · {덧}</span> : null}
        {' '}→ 그 사정률의 낙찰하한 금액 <b className="money">{won(sb.amt)}</b> <span className="muted">(투찰률 {sb.rate.toFixed(3)}%)</span>
      </div>
      <div className="bsr-pick-d">
        사정률이 {sj.toFixed(2)}%보다 높게 나오면 이 금액은 실격입니다
        {pp ? <> · 이 공고에서 하한을 넘을 확률 <b>{Math.round(pp.p * 100)}%</b></> : null}
      </div>
      <button type="button" className="btn sm" style={{ width: 'auto' }} disabled={같음}
        onClick={() => { 직접 && 직접(sb.rate); 세기('|분석판|고르기') }}>
        {같음 ? '✓ 지금 투찰 금액입니다' : '이 금액으로 고르기'}
      </button>
    </div>
  )
}

/* ① 흐름 그림 */
function 흐름그림({ 줄, 가운데값, 하한선, 고른, 고르기 }) {
  const 자리 = useRef(null)
  const W = 너비재기(자리)
  const H = 190, 왼 = 38, 오른 = 12, 위 = 14, 아래 = 24
  const n = 줄.length
  const 옛것부터 = useMemo(() => [...줄].reverse(), [줄])
  const vals = 옛것부터.map((x) => x.sj)
  const 끝들 = [...vals, 100, 가운데값, 하한선].filter((v) => v != null && isFinite(v) && v > 95 && v < 105)
  const y0 = Math.floor((Math.min(...끝들) - 0.2) * 5) / 5, y1 = Math.ceil((Math.max(...끝들) + 0.2) * 5) / 5
  const x = (i) => (n <= 1 ? (왼 + W - 오른) / 2 : 왼 + (i * (W - 왼 - 오른)) / (n - 1))
  const y = (v) => 위 + ((y1 - v) * (H - 위 - 아래)) / (y1 - y0)
  const 눈금 = []
  const 칸 = (y1 - y0) > 3 ? 1 : 0.5
  for (let v = Math.ceil(y0 / 칸) * 칸; v <= y1 + 1e-9; v += 칸) 눈금.push(Math.round(v * 10) / 10)
  const 날눈금 = n > 1 ? [0, Math.round((n - 1) / 3), Math.round(((n - 1) * 2) / 3), n - 1].filter((v, i, a) => a.indexOf(v) === i) : [0]
  const 가까운 = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    let k = 0
    옛것부터.forEach((_, i) => { if (Math.abs(x(i) - px) < Math.abs(x(k) - px)) k = i })
    return k
  }
  const 선 = 옛것부터.map((p, i) => `${x(i).toFixed(1)},${y(p.sj).toFixed(1)}`).join(' ')
  return (
    <div ref={자리} className="bsr-chart">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={`사정률 흐름 ${n}건`}
        onClick={(e) => { const k = 가까운(e); 고르기({ sj: 옛것부터[k].sj, 줄: 옛것부터[k], from: '점' }) }}>
        {눈금.map((v) => (
          <g key={v}>
            <line x1={왼} x2={W - 오른} y1={y(v)} y2={y(v)} className={v === 100 ? 'b100' : 'grid'} />
            <text x={왼 - 5} y={y(v) + 3.5} className="ax">{v.toFixed(1)}</text>
          </g>
        ))}
        {가운데값 != null && <line x1={왼} x2={W - 오른} y1={y(가운데값)} y2={y(가운데값)} className="med" />}
        {하한선 != null && 하한선 > y0 && 하한선 < y1 && (
          <g>
            <line x1={왼} x2={W - 오른} y1={y(하한선)} y2={y(하한선)} className="mine" />
            <text x={W - 오른} y={y(하한선) - 4} className="mine-t">내 금액 하한선 {하한선.toFixed(2)}</text>
          </g>
        )}
        {n > 1 && <polyline points={선} className="ln" />}
        {옛것부터.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.sj)} r={고른 && 고른.줄 === p ? 5.5 : 3}
            className={(하한선 != null && p.sj > 하한선 ? 'over' : 'in') + (고른 && 고른.줄 === p ? ' on' : '')} />
        ))}
        {날눈금.map((i) => <text key={i} x={x(i)} y={H - 6} className="dt">{짧은날(옛것부터[i]?.d)}</text>)}
      </svg>
    </div>
  )
}

/* ② 분포 막대 */
function 분포그림({ 칸들, 비교, 두칸, 하한선, 고른, 고르기, lo, hi }) {
  const 자리 = useRef(null)
  const W = 너비재기(자리)
  const H = 170, 왼 = 30, 오른 = 8, 위 = 16, 아래 = 30
  const b0 = 칸번호(lo), b1 = 칸번호(hi - 0.0001)
  const 칸수 = Math.max(1, b1 - b0 + 1)
  const 합 = 칸들.reduce((s, c) => s + c.n, 0) || 1
  const 비교합 = 비교.reduce((s, c) => s + c.n, 0) || 1
  const 비율 = new Map(칸들.map((c) => [c.b, c.n / 합 * 100]))
  const 비교율 = new Map(비교.map((c) => [c.b, c.n / 비교합 * 100]))
  const 건 = new Map(칸들.map((c) => [c.b, c.n]))
  const 최대 = Math.max(10, ...[...비율.values()], ...[...비교율.values()])
  const 폭 = (W - 왼 - 오른) / 칸수
  const x = (b) => 왼 + (b - b0) * 폭
  const y = (p) => 위 + (1 - p / 최대) * (H - 위 - 아래)
  const 줄 = []
  for (let b = b0; b <= b1; b++) 줄.push(b)
  const 비교점 = 줄.filter((b) => 비교율.has(b)).map((b) => `${(x(b) + 폭 / 2).toFixed(1)},${y(비교율.get(b)).toFixed(1)}`).join(' ')
  const sjX = (v) => 왼 + ((v - b0 * 0.5) / 0.5) * 폭
  const 매 = 폭 < 34 ? 2 : 1          /* 폰 폭이면 칸 이름을 하나 걸러 — 글자가 겹치지 않게 */
  return (
    <div ref={자리} className="bsr-chart">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="사정률 분포">
        {[0, 최대 / 2, 최대].map((p) => (
          <g key={p}>
            <line x1={왼} x2={W - 오른} y1={y(p)} y2={y(p)} className="grid" />
            <text x={왼 - 4} y={y(p) + 3.5} className="ax">{Math.round(p)}%</text>
          </g>
        ))}
        {줄.map((b) => {
          const p = 비율.get(b) || 0
          const k = 두칸[0] === b ? ' top1' : 두칸[1] === b ? ' top2' : ''
          const on = 고른 && 고른.칸 === b ? ' on' : ''
          return (
            <g key={b} onClick={() => 고르기({ sj: b * 0.5 + 0.25, 칸: b, from: '칸' })} style={{ cursor: 'pointer' }}>
              <rect x={x(b)} y={위} width={폭} height={H - 위 - 아래} className="hit" />
              <rect x={x(b) + 2} y={y(p)} width={Math.max(1, 폭 - 4)} height={Math.max(0, H - 아래 - y(p))} className={'bar' + k + on} />
              {(건.get(b) || 0) > 0 && <text x={x(b) + 폭 / 2} y={y(p) - 3} className="cnt">{건.get(b)}</text>}
              {(b - b0) % 매 === 0 && <text x={x(b) + 폭 / 2} y={H - 16} className="dt">{(b * 0.5).toFixed(1)}</text>}
            </g>
          )
        })}
        {비교점 && <polyline points={비교점} className="cmp" />}
        {줄.filter((b) => 비교율.has(b)).map((b) => <circle key={'c' + b} cx={x(b) + 폭 / 2} cy={y(비교율.get(b))} r={2.6} className="cmpdot" />)}
        {하한선 != null && 하한선 > lo && 하한선 < hi && (
          <line x1={sjX(하한선)} x2={sjX(하한선)} y1={위 - 6} y2={H - 아래} className="mine" />
        )}
        <text x={W - 오른} y={H - 3} className="dt end">사정률 %</text>
      </svg>
    </div>
  )
}

export default function 분석판({ inst, lo, hi, base, llr, aval, sjMid, sjSd, 지금금액, 직접, ag }) {
  const [흐름, set흐름] = useState(undefined)
  const [분포, set분포] = useState(undefined)
  const [보기, set보기] = useState('기관')
  const [비교, set비교] = useState('all')
  const [고른, set고른] = useState(null)
  const [펼침, set펼침] = useState(false)
  const [다시, set다시] = useState(0)
  const 셌음 = useRef('')
  useEffect(() => {
    let 살아 = true
    set흐름(undefined); set고른(null); set보기('기관')
    긴흐름받기(inst).then((v) => { if (살아) set흐름(v) }).catch(() => { if (살아) set흐름(null) })
    return () => { 살아 = false }
  }, [inst, 다시])
  useEffect(() => { let 살아 = true; 분포받기().then((d) => { if (살아) set분포(d) }).catch(() => { if (살아) set분포(null) }); return () => { 살아 = false } }, [다시])
  useEffect(() => {
    if (흐름 !== undefined && 셌음.current !== inst) { 셌음.current = inst; 세기('|분석판|보임') }
  }, [흐름, inst])

  const 범위 = 범위of(lo, hi)
  const 코드 = 범위코드(범위)
  const 아래끝 = 범위 === '2' ? 98 : 97, 위끝 = 범위 === '2' ? 102 : 103
  const 시도 = String(흐름?.s || '').split(',')[0] || ''
  const 기관줄전부 = useMemo(() => (흐름?.c || []).map(줄풀기), [흐름])
  const 기관줄 = useMemo(() => {
    const 같은 = 기관줄전부.filter((x) => x.r === 코드)
    return 같은.length >= 5 ? 같은 : 기관줄전부
  }, [기관줄전부, 코드])
  const 시도줄 = useMemo(() => ((분포?.sr || {})[시도] || []).map(시도줄풀기).filter((x) => x.r === 코드), [분포, 시도, 코드])
  const 지금보기 = 보기 === '시도' && 시도줄.length ? '시도' : (기관줄.length ? '기관' : (시도줄.length ? '시도' : '기관'))
  const 섞임 = 지금보기 === '기관' && 기관줄.some((x) => x.r !== 코드)   /* 같은 예가범위가 5건 못 되면 다 보여 주고 그렇다고 적음 */
  const 줄 = 지금보기 === '시도' ? 시도줄 : 기관줄
  const 옛것부터 = useMemo(() => 줄.map((x) => x.sj).reverse(), [줄])
  const 가운데값 = 가운데(옛것부터)
  const 하한선 = (base > 0 && llr > 0 && 지금금액 > 0) ? breakEvenSj(base, llr, aval, 지금금액) : null
  const 넘은수 = 하한선 != null ? 옛것부터.filter((v) => v > 하한선).length : 0
  const 최근10 = 옛것부터.slice(-10)
  const 최근10평균 = 최근10.length ? 최근10.reduce((s, v) => s + v, 0) / 최근10.length : null
  const 칸들 = useMemo(() => 칸세기(옛것부터, 아래끝, 위끝), [옛것부터, 아래끝, 위끝])
  const 두칸 = useMemo(() => 가장많은두칸(옛것부터.filter((v) => v >= 아래끝 && v < 위끝)), [옛것부터, 아래끝, 위끝])
  const 금액대 = 금액대of(base)
  const 비교칸 = useMemo(() => {
    if (!분포) return []
    const src = 비교 === 'amt' && 금액대 >= 0 ? ((분포.amt || {})[String(금액대)] || {})[범위] : (분포.all || {})[범위]
    return 굵은칸(src, 분포.b, 아래끝, 위끝)
  }, [분포, 비교, 금액대, 범위, 아래끝, 위끝])
  const 전국 = 분포?.hit?.[범위] || null
  const 전국두칸 = 전국 ? (전국.top2 || []).map((v) => 칸번호(v + 0.01)) : []
  const 기관적중 = useMemo(() => (기관줄.length >= 11 ? 적중검사([...기관줄].reverse().map((x) => x.sj), 전국두칸, 전국 ? 전국.m : 99.9) : null),
    [기관줄, 전국두칸.join(','), 전국])   // eslint-disable-line react-hooks/exhaustive-deps
  const 기관상관 = useMemo(() => 앞뒤상관([...기관줄].reverse().map((x) => x.sj)), [기관줄])
  const 전국상관 = 분포?.corr?.[범위] ?? null

  const 고르기 = (v) => { set고른(v); 세기(v.from === '칸' ? '|분석판|칸' : '|분석판|점') }
  const 보기바꿈 = (k) => { set보기(k); set고른(null); if (k === '시도') 세기('|분석판|보기시도') }
  const 비교바꿈 = (k) => { set비교(k); if (k === 'amt') 세기('|분석판|비교금액대') }
  const 상자 = (from) => (고른 && 고른.from === from ? (
    <그사정률 sj={고른.sj} base={base} llr={llr} aval={aval} sjMid={sjMid} sjSd={sjSd} 직접={직접} 지금금액={지금금액}
      덧={고른.from === '칸' ? `${칸이름(고른.칸)}% 칸 가운데` : 고른.줄 ? `${짧은날(고른.줄.d)}${고른.줄.inst ? ' · ' + 고른.줄.inst : ''}${고른.줄.rate ? ` · 1순위 ${고른.줄.rate.toFixed(3)}%` : ''}${고른.줄.np ? ` · 참가 ${고른.줄.np}곳` : ''}` : ''} />
  ) : null)

  if (!inst) return null
  if (흐름 === undefined || 분포 === undefined) {
    return <div className="bsr-box"><div className="bsr-h">📊 {inst} 분석</div><div className="skel" style={{ height: 160 }} /></div>
  }
  if (분포 === null && 흐름 === null) {
    /* 자료를 못 받음 — 사이트를 새로 올리는 중(자료 굽기 전)이거나 신호가 잠깐 끊김. 오른쪽 투찰 금액은 그대로 됩니다 */
    return (
      <div className="bsr-box">
        <div className="bsr-h">📊 {inst} 분석</div>
        <div className="bsr-card bsr-miss">
          <b>분석 자료를 받지 못했습니다.</b> 사이트를 새로 올리는 중이거나 인터넷이 잠깐 끊겼을 수 있습니다. 투찰 금액(오른쪽 · 폰은 아래)은 그대로 쓰실 수 있습니다.
          <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => { set흐름(undefined); set분포(undefined); set다시((n) => n + 1); 세기('|분석판|다시받기') }}>다시 받기</button>
        </div>
      </div>
    )
  }
  const 비었음 = !기관줄.length && !시도줄.length
  const 고른칸율 = 고른 && 고른.from === '칸'
    ? { 여기: 칸들.find((c) => c.b === 고른.칸)?.n || 0, 비교: 비교칸.find((c) => c.b === 고른.칸)?.n || 0, 비교합: 비교칸.reduce((s, c) => s + c.n, 0) || 1 }
    : null
  const 줄이름 = 지금보기 === '시도' ? `같은 시도(${시도}) 최근 ${줄.length}건` : `이 기관 최근 ${줄.length}건`
  const 최고방법 = 기관적중 && 기관적중.n
    ? 방법들.map((m) => ({ ...m, p: 기관적중.율[m.k] })).sort((a, b) => (b.p ?? -1) - (a.p ?? -1))[0] : null
  const 뚜렷함 = !!(기관적중 && 기관적중.n && 최고방법 && 최고방법.k !== 'med' && 뚜렷이높음(최고방법.p, 기관적중.율.med, 기관적중.n))
  const 결론 = !기관적중 || !기관적중.n ? `이 기관은 대 볼 개찰이 적습니다(${기관줄.length}건 — 앞 10건이 쌓인 뒤부터 셉니다).`
    : 뚜렷함
      ? `이 기관에서는 «${최고방법.이름}» 이 늘 같은 자리(전국 가운데값)보다 뚜렷이 많이 맞았습니다(${기관적중.n}번).`
      : `이 기관에서도 어느 방법이 «늘 같은 자리(전국 가운데값)» 보다 뚜렷이 낫지 않습니다 — 차이는 건수로 보면 우연 범위입니다(${기관적중.n}번).`
  const corps = Array.isArray(ag?.corps) ? ag.corps.slice(0, 5) : []

  return (
    <div className="bsr-box">
      <div className="bsr-h">
        📊 <b>{inst}</b> 분석
        <span className="muted"> · 예가범위 {범위말(범위)} · 사정률을 아는 개찰 {기관줄전부.length}건{분포?.f ? ` (${분포.f.slice(0, 7).replace('-', '.')}부터)` : ''}</span>
      </div>

      {비었음 ? (
        <div className="note sm">이 기관은 사정률을 셀 수 있는 개찰이 아직 없고{시도 ? ` 같은 시도(${시도})에도 같은 예가범위 개찰이 없습니다` : ' 시도를 이름으로 가리지 못했습니다'}. 아래 전국 분포로 봅니다.</div>
      ) : (
        <div className="bsr-card">
          <div className="bsr-ch">
            <span className="bsr-t">① 사정률 흐름</span>
            <span className="chips">
              {기관줄.length > 0 && <button type="button" className={'chip' + (지금보기 === '기관' ? ' on' : '')} onClick={() => 보기바꿈('기관')}>이 기관 {기관줄.length}건</button>}
              {시도 && 시도줄.length > 0 && <button type="button" className={'chip' + (지금보기 === '시도' ? ' on' : '')} onClick={() => 보기바꿈('시도')}>같은 시도 · {시도} {시도줄.length}건</button>}
            </span>
          </div>
          <흐름그림 줄={줄} 가운데값={가운데값} 하한선={하한선} 고른={고른} 고르기={고르기} />
          <div className="bsr-sum">
            {줄이름} — 가운데 <b>{퍼(가운데값, 2)}</b> · 최근 10건 평균 {퍼(최근10평균, 2)} · 가장 낮음 {퍼(Math.min(...옛것부터), 2)} · 가장 높음 {퍼(Math.max(...옛것부터), 2)}
            {하한선 != null && <> · <span className="mine-w">내 금액 하한선({하한선.toFixed(2)}%) 위로 나온 것 <b>{넘은수}건</b> — 그때였다면 실격</span></>}
            {섞임 ? <span className="muted"> · 예가범위가 다른 개찰이 섞여 있음</span> : null}
          </div>
          {상자('점') || <div className="bsr-hint muted">점을 누르면 그 사정률로 넣었을 때의 금액이 나옵니다.</div>}
        </div>
      )}

      <div className="bsr-card">
        <div className="bsr-ch">
          <span className="bsr-t">② 어디에 많이 나왔나 <span className="muted">(0.5%p 칸)</span></span>
          <span className="chips">
            <button type="button" className={'chip' + (비교 === 'all' ? ' on' : '')} onClick={() => 비교바꿈('all')}>전국과 견줌</button>
            {금액대 >= 0 && <button type="button" className={'chip' + (비교 === 'amt' ? ' on' : '')} onClick={() => 비교바꿈('amt')}>같은 금액대({금액대들[금액대][2]})</button>}
          </span>
        </div>
        <분포그림 칸들={비었음 ? 비교칸 : 칸들} 비교={비교칸} 두칸={비었음 ? 가장많은두칸(비교칸.flatMap((c) => Array(c.n).fill(c.b * 0.5 + 0.25))) : 두칸}
          하한선={하한선} 고른={고른} 고르기={고르기} lo={아래끝} hi={위끝} />
        <div className="bsr-key">
          <span><i className="k top1" /> 가장 많은 칸</span><span><i className="k top2" /> 두 번째</span>
          <span><i className="k cmp" /> {비교 === 'amt' && 금액대 >= 0 ? `같은 금액대(${금액대들[금액대][2]}) 전국` : '전국'} 같은 예가범위 비율</span>
          {하한선 != null && <span><i className="k mine" /> 내 금액 하한선</span>}
        </div>
        {고른칸율 && (
          <div className="bsr-sum">
            <b>{칸이름(고른.칸)}%</b> 칸 — {비었음 ? '' : <>{지금보기 === '시도' ? '같은 시도' : '이 기관'} {고른칸율.여기}건({Math.round(고른칸율.여기 / (칸들.reduce((s, c) => s + c.n, 0) || 1) * 100)}%) · </>}
            {비교 === 'amt' && 금액대 >= 0 ? `같은 금액대(${금액대들[금액대][2]})` : '전국'} {Math.round(고른칸율.비교 / 고른칸율.비교합 * 100)}%
          </div>
        )}
        {상자('칸') || <div className="bsr-hint muted">막대를 누르면 그 칸 가운데 사정률로 넣었을 때의 금액이 나옵니다.</div>}
      </div>

      <div className="bsr-card">
        <div className="bsr-ch"><span className="bsr-t">③ 고르는 방법 — 지난 개찰에 대 보면</span></div>
        <table className="bsr-tbl">
          <thead>
            <tr><th>다음 사정률을 이렇게 짚으면</th><th>이 기관<br /><small>{기관적중?.n || 0}번</small></th><th>전국 {범위말(범위)}<br /><small>{(전국?.n || 0).toLocaleString('ko-KR')}번</small></th></tr>
          </thead>
          <tbody>
            {방법들.map((m) => (
              <tr key={m.k} className={뚜렷함 && 최고방법.k === m.k ? 'best' : ''}>
                <td>{m.이름}{m.덧 ? <small> — {m.덧}</small> : null}</td>
                <td className="num">{기관적중?.n ? 퍼(기관적중.율[m.k]) : '—'}</td>
                <td className="num">{전국 ? 퍼(전국[m.k]) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bsr-sum">
          {결론}
          {' '}앞 공고와 다음 공고 사정률 상관은 이 기관 {기관상관 == null ? '—' : `${기관상관.toFixed(2)}(${상관말(기관상관)})`} · 전국 {전국상관 == null ? '—' : `${전국상관.toFixed(2)}(${상관말(전국상관)})`} —
          {' '}사정률은 복수예비가격 추첨으로 매번 새로 뽑혀, 앞 공고가 다음 공고를 말해 주지 않습니다.
        </div>
        <div className="note sm">
          모두 «폭 1%p 창» 으로 견줬습니다(0.5%p 두 칸 · ±0.5). 창 안에 들어도 그 안 어디인지는 모릅니다 —
          금액은 오른쪽 «금액 고르기» 의 실격 · 1순위 비율로 고르시는 편이 낫습니다.
        </div>
      </div>

      {기관줄전부.length > 0 && (
        <div className="bsr-card">
          <button type="button" className="bsr-fold" onClick={() => { set펼침(!펼침); if (!펼침) 세기('|분석판|1순위펼침') }}>
            <span className="bsr-t">④ 이 기관 지난 1순위</span>
            <span className="muted">
              {' '}최근 {Math.min(15, 기관줄전부.length)}건{corps.length ? ` · 자주 이긴 업체 ${corps[0][0]} ${corps[0][1]}번` : ''}
            </span>
            <span className="go">{펼침 ? '접기 ▲' : '펼치기 ▼'}</span>
          </button>
          {펼침 && (
            <>
              <div className="bsr-list">
                {기관줄전부.slice(0, 15).map((x, i) => (
                  <div key={i} className="bsr-row">
                    <span className="d">{짧은날(x.d)}</span>
                    <b>{x.rate != null ? `${x.rate.toFixed(3)}%` : '—'}</b>
                    <span className="s">사정률 {x.sj.toFixed(2)}</span>
                    <span className="n">{x.np ? `${x.np}곳` : ''}</span>
                    <span className="w">{x.win}</span>
                    <span className="nm">{x.name}</span>
                  </div>
                ))}
              </div>
              {corps.length > 0 && (
                <div className="bsr-corps">
                  자주 이긴 업체(이 기관 {Number(ag?.n || 0).toLocaleString('ko-KR')}건 중): {corps.map(([c, v]) => (
                    <Link key={c} to={`/corp/${encodeURIComponent(c)}`}>{c} {v}번</Link>
                  ))}
                </div>
              )}
              <div className="note sm">투찰률 = 1순위 금액 ÷ 예정가격 · 사정률 = 예정가격 ÷ 기초금액(1순위 금액과 투찰률로 거꾸로 셈) · 2026년 4월 이후 개찰.</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
