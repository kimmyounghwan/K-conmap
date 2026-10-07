/**
 * 🎯 확보 예가 — 보이는 자리 셋 (G181 · 2026-10-07)
 *
 * 소장님: 「원래 이게 어디에 있어야 가장 효과가 크지? 확보예가?」 → (① 바로투찰 ② 1순위 개찰 상세 ③ 업체 페이지) 「고쳐줘」
 *         「이미 잘 돌아가는 것은 손대지 말고, 예가만 추가해」
 *   → 셈은 lib/투찰자리.js 하나(성적표와 같은 식). 이 파일은 «보여 주기» 만 합니다. 기존 계산 · 추천은 건드리지 않습니다.
 *
 * ■ 확보 예가(어림) — 같은 개찰 금액을 낮은 순으로 늘어놓으면 «바로 아래 금액의 사정률 ~ 내 사정률» 로 예정가격이 나와야 1순위.
 *   그 폭에 사정률이 나올 확률(그 공고 σ · 전국 가운데값)이 «몫», 몫 × 예가 조합 수(15개 중 4개 = 1,365가지)가 확보 예가.
 *   평균 = 조합 수 ÷ 참가 수 → «평균의 몇 배» 로 보여 줍니다(1배 = 남들과 같음).
 * ■ 📂 G183 펼친 채(단추 없음) · 그 칸이 화면에 들어올 때 자료를 받음. 📦 G184 자료는 작은 것만(아래 미니자료 · 업체조각자료 — 무료 한도 안).
 * ■ 숨은 누적: |확보예가|바로투찰보임 · |확보예가|업체보임 (화면에 들어와 셀 때 · G183 부터)
 */
import { Component, useEffect, useRef, useState } from 'react'
import { getOverview } from '../lib/data.js'
import { P50_FALLBACK, breakEvenSj } from '../lib/bidmath.js'
import { 비슷한개찰, 미리확보, 분포칸들 } from '../lib/투찰자리.js'   /* 🔎 G189 분포칸들 — 사정률 분포 칸 */
import { 미니풀기, 업체조각 } from '../lib/확보예가자료.js'   /* 📦 G184 무료로 — 작은 자료 */
import { 세기 } from '../lib/받은수.jsx'

/** 전국 사정률 가운데값(성적표 · 바로투찰과 같은 잣대) */
export function useP50() {
  const [p50, setP50] = useState(P50_FALLBACK)
  useEffect(() => {
    let 살 = true
    getOverview().then((ov) => { const v = ov?.sjq?.p50; if (살 && v) setP50(Number(v)) }).catch(() => {})
    return () => { 살 = false }
  }, [])
  return p50
}

/* 📦 G184 (2026-10-07) 소장님 「비용이 왜 이렇게 들어가지? 무료로 할 수 있는 방법 없어?」 → 「1, 2번으로 무료로」
   전에는 개찰 자료 통째(first_full.json · 받는 크기 8.4MB)를 받아 셌습니다 → 호스팅 무료 전송량으로 하루 40번쯤.
   이제 매일 자동 갱신 때 tools/확보예가굽기.mjs 가 만든 작은 자료만 받습니다:
     ① 바로투찰 /data/kb/mini.json (0.4MB 남짓) · ② 업체 페이지 /data/kb/c/{조각}.json (수십 KB)
   /data/** 는 하루 동안 브라우저가 기억합니다(firebase.json) — 같은 사람이 다시 보면 안 받음.
   ⚠️ 작은 자료가 없을 때 큰 파일로 «되돌아가지» 않습니다(그러면 다시 비용이 듭니다) — «자료를 받지 못했습니다» 를 띄움. */
let 미니약속 = null
export function 미니자료() {
  if (!미니약속) {
    미니약속 = fetch('/data/kb/mini.json')
      .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .then((j) => { const rows = 미니풀기(j); if (!rows.length) throw new Error('빈 자료'); return rows })
      .catch((e) => { 미니약속 = null; throw e })
  }
  return 미니약속
}
const 조각약속 = new Map()
export function 업체조각자료(biz) {
  const n = 업체조각(biz)
  if (!조각약속.has(n)) {
    조각약속.set(n, fetch(`/data/kb/c/${n}.json`)
      .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .catch((e) => { 조각약속.delete(n); throw e }))
  }
  return 조각약속.get(n)
}

/* 📂 G183 (2026-10-07) 소장님 「확보예가는 펼쳐져 있게 해줘」 — 단추 없이 펼친 채로 두되, 개찰 자료(2MB 남짓 · 압축)는
   «그 칸이 화면에 들어올 때» 한 번 받습니다(첫 화면을 무겁게 하지 않게 · 아래로 내리지 않는 사람은 안 받음). */
function useBo임(ref, 켜짐 = true) {
  const [보임, set보임] = useState(false)
  /* ⚠️ 켜짐 — 칸이 처음엔 안 그려졌다가(기초금액을 나중에 넣음) 나중에 그려지면 그때 다시 지켜봄 (G185 시험에서 잡음) */
  useEffect(() => {
    const el = ref.current
    if (!켜짐 || !el || 보임) return undefined
    if (typeof IntersectionObserver === 'undefined') { set보임(true); return undefined }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { set보임(true); io.disconnect() } }, { rootMargin: '200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, 보임, 켜짐])
  return 보임
}

const 배글 = (v) => (v == null || !isFinite(v) ? '-' : `${v >= 10 ? Math.round(v) : (Math.round(v * 10) / 10).toFixed(1)}배`)
const 사정 = (v) => (v == null || !isFinite(v) ? '-' : Number(v).toFixed(3))

/* 🛡 여기서 무슨 일이 나도 바로투찰 계산기 · 업체 화면은 그대로 뜨게(바로투찰 «지도지킴» 과 같은 뜻 · G166) */
class 예가지킴 extends Component {
  constructor(p) { super(p); this.state = { 오류: false } }
  static getDerivedStateFromError() { return { 오류: true } }
  componentDidCatch() { try { 세기('|확보예가|멈춤') } catch (e) { /* 없음 */ } }
  render() { return this.state.오류 ? null : this.props.children }
}

/** ① 바로투찰 — 권장 금액 아래 «이 금액의 확보 예가 미리 보기» (펼친 채 · 화면에 들어오면 셈 — G183) */
export function 확보예가미리(props) { return <예가지킴><미리안 {...props} /></예가지킴> }
function 미리안({ base, llr, aval, amt, 공고, p50 }) {
  const 자리 = useRef(null)
  const 내s = base > 0 && llr > 0 && amt > 0 ? breakEvenSj(base, llr, aval, amt) : null
  const 보임 = useBo임(자리, 내s != null)
  const 셌음 = useRef(false)
  const [상태, set상태] = useState('')          // '' | 'ing' | 'err'
  const [결과, set결과] = useState(null)
  const 키 = `${base}|${llr}|${aval}|${amt}|${공고?.inst || ''}`
  useEffect(() => {
    set결과(null)
    if (!보임 || 내s == null) return
    if (!셌음.current) { 셌음.current = true; 세기('|확보예가|바로투찰보임') }
    셈()
  }, [키, 보임])   // eslint-disable-line react-hooks/exhaustive-deps
  async function 셈() {
    if (내s == null) return
    set상태('ing')
    try {
      const rows = await 미니자료()
      const 고 = 비슷한개찰(rows, { inst: 공고?.inst, sido: 공고?.sido, base })
      const 미 = 미리확보(고.rows, 내s, p50)
      set결과(미 ? { ...미, 고른: 고.고른 } : { 없음: true })
      set상태('')
    } catch (e) { set상태('err') }
  }
  if (내s == null) return null
  /* 🩹 G195 (2026-10-07) 소장님 폰 캡처 둘 → 「수정해야 되는 거야. 확보예가..」 — 셈은 그대로, «보여 주기» 만 고침
     ① 잴 수 없을 때(비교 5건 미만 · 잰 개찰 0건) — 큰 칸 대신 «한 줄» 만(자리만 차지하던 것)
     ② «덜 몰린 자리» 인데 «0.6배» 처럼 앞뒤가 안 맞아 보이던 것 — 몫이 작은 «까닭» 을 한 줄로(높은/낮은 자리 · 몰린 자리)
     ③ 그래프가 «가장 큰 칸» 을 파랗게 칠해 «이리 옮기라» 처럼 보이던 것 — «지금» 칸만 칠하고 «참고» 로 작게
     ④ 머리의 «투찰 사정률 100.72» 가 위 파란 칸 «사정률 100.42% 에서도…» 와 숫자가 둘로 보여 헷갈림 — 머리에서 뺌
     ⑤ 소장님 「권장금액 그대로 보라고 하지마. 선택하라고 해야지. 클로드가 책임져 줄 수는 없잖아」 — «그대로 보십시오» → «참고하시고, 직접 골라 주십시오»(「권장금액 참고 하라고 적어. 권장금액 보라고 하지말고」) */
  const 못잼 = 결과 && (결과.없음 || 결과.배가운데 == null)
  if (못잼) {
    return (
      <div className="kb-box" ref={자리}>
        <div className="kb-in muted" style={{ padding: '8px 12px', gap: 2 }}>
          🎯 확보 예가 — {결과.없음 ? '이 공고는 비교할 지난 개찰(같은 기관 · 비슷한 금액)이 적어 셀 수 없습니다.' : '업체가 많은 공사라, 이 금액 근처는 지난 개찰 자료로 셀 수 없습니다.'}
        </div>
      </div>
    )
  }
  const 배 = 결과 && 결과.배가운데
  const 멀리 = Number.isFinite(p50) ? 내s - p50 : 0
  const 까닭 = 배 == null ? '' : 배 >= 1.15
    ? '남들보다 몫이 큰 자리입니다.'
    : 배 >= 0.85
      ? '남들과 비슷한 몫입니다(1배 = 평균).'
    : 결과.근처평균 != null && 결과.근처평균 >= 3
      ? '남들이 몰린 자리라 몫이 작습니다.'
      : 멀리 > 0.4
        ? '남들은 덜 몰렸지만, 예정가격이 이 근처(높은 쪽)로는 잘 안 나와 몫이 작습니다.'
        : 멀리 < -0.4
          ? '남들은 덜 몰렸지만, 예정가격이 이 근처(낮은 쪽)로는 잘 안 나와 몫이 작습니다.'
          : '바로 아래 금액의 업체와 붙어 있어 몫이 작습니다.'
  return (
    <div className="kb-box" ref={자리}>
      <div className="kb-in">
        <div className="kb-h">🎯 확보 예가 <span className="muted">(참고 · 지난 개찰로 본 어림)</span></div>
        {(상태 === 'ing' || (!결과 && 상태 === '')) && <div className="muted">지난 개찰 자료를 받아 셉니다…</div>}
        {상태 === 'err' && <div className="muted">개찰 자료를 받지 못했습니다 — 잠시 뒤 다시 눌러 주십시오. <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={셈}>다시</button></div>}
        {결과 && 배 != null && (
          <>
            <div className="kb-big">
              <span>이 금액 <b className={배 >= 1 ? 'kb-up' : 'kb-dn'}>평균의 {배글(배)}</b></span>
              <span className="muted">· {결과.고른} 개찰 {결과.잰}건</span>
            </div>
            <div className="kb-line">{까닭}{결과.근처평균 != null && <span className="muted"> (근처 ±0.05 에 개찰마다 평균 {결과.근처평균}곳)</span>}</div>
            <div className="kb-grid" role="table" aria-label="사정률 근처의 확보 예가 (참고)">
              {결과.격자.map((g) => (
                <div key={g.d} className={'kb-cell' + (Math.abs(g.d) < 1e-9 ? ' me' : '')} role="row">
                  <span className="s">{Math.abs(g.d) < 1e-9 ? '지금' : (g.d > 0 ? '+' : '') + g.d.toFixed(2)}</span>
                  <span className="bar"><i style={{ height: `${Math.min(100, (g.배 || 0) / Math.max(1.5, ...결과.격자.map((x) => x.배 || 0)) * 100)}%` }} /></span>
                  <span className="v">{g.배 == null ? '-' : 배글(g.배)}</span>
                </div>
              ))}
            </div>
            <div className="kb-note muted">
              참고용입니다 — 지난 개찰 1만여 건으로 재 보니 이 값만 보고 금액을 옮겨도 1순위가 늘지는 않았습니다. <b>권장 금액 · 금액 고르기 · 이 값은 참고하시고, 투찰 금액은 직접 골라 주십시오.</b>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** ③ 업체 페이지 — «최근 개찰 확보 예가» (펼친 채 · 화면에 들어오면 셈 · 법인 하나일 때 — G183) */
export function 업체확보예가(props) { return <예가지킴><업체안 {...props} /></예가지킴> }

/* 🔎 G189 (2026-10-07) 사업자번호로 확보 예가 보기 — 소장님(비드스코어 «확보예가 통계 조회» 캡처) → 「넣어줘」
   바로투찰 맨 아래(금액이 나오든 안 나오든 늘 보임). 업체 페이지와 같은 카드(업체안) · 같은 자료(매일 구운 업체 조각 kb/c — 비용 0).
   ⚠️ 남의 사업자번호를 예시로 내걸지 않습니다(남의 정보). 숨은 누적 |확보예가|번호조회 */
const 번호글 = (d) => (d.length > 5 ? `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}` : d.length > 3 ? `${d.slice(0, 3)}-${d.slice(3)}` : d)
function 번호조회() {
  const [글, set글] = useState('')
  const [biz, setBiz] = useState('')
  const 숫자 = 글.replace(/[^0-9]/g, '').slice(0, 10)
  const 맞음 = 숫자.length === 10
  return (
    <div className="card kb-find">
      <div className="sec-title" style={{ margin: '0 0 4px' }}>🔎 사업자번호로 확보 예가 보기</div>
      <p className="cp muted" style={{ margin: '0 0 8px' }}>우리 업체 · 관심 업체의 사업자번호를 넣으면, 최근 개찰에서 1순위가 될 몫(확보 예가)을 평균의 몇 배 쥐었는지 봅니다.</p>
      <form className="kb-find-row" onSubmit={(e) => { e.preventDefault(); if (맞음 && 숫자 !== biz) { setBiz(숫자); 세기('|확보예가|번호조회') } }}>
        <input className="inp" inputMode="numeric" autoComplete="off" placeholder="사업자번호 10자리 (000-00-00000)" value={번호글(숫자)}
          onChange={(e) => set글(e.target.value)} aria-label="사업자등록번호 10자리" />
        <button type="submit" className="btn sm" style={{ width: 'auto' }} disabled={!맞음}>보기</button>
      </form>
      {숫자.length > 0 && !맞음 && <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{10 - 숫자.length}자리 더 넣어 주세요</div>}
      {biz && <번호리포트 key={biz} biz={biz} />}
    </div>
  )
}

/* 🔎 G189 — 사업자번호 결과(비드스코어 «확보예가 통계 조회» 를 이용자가 쉽게 알게 바꿈 · 소장님 「이렇게 만들어 줘 … 설명은 자세히」)
   ① 한 줄 요약 ② 평균 예가 합 · 확보 예가 합(두 고리) ③ 1순위 · 실격 ④ 개찰마다 예정가격 사정률 · 이 업체 사정률(선) ⑤ 사정률 분포(막대) ⑥ 최근 개찰 표 ⑦ 높이는 법
   자료는 업체 조각(kb/c) 하나 — 업체 페이지와 같은 셈(lib/투찰자리.js). 남의 상호 순위 · 복수예가 15개 낱낱 표는 안 함(자료 없음 · 남의 정보). */
const 배숫 = (a, b) => (b > 0 ? a / b : null)
function 고리({ 값, 큰, 색, 위, 아래 }) {
  const 몫 = 큰 > 0 ? Math.max(0.02, Math.min(1, 값 / 큰)) : 0
  return (
    <div className="kb-ring" style={{ '--p': `${Math.round(몫 * 360)}deg`, '--c': 색 }}>
      <div className="kb-ring-in"><span>{위}</span><b>{아래}</b></div>
    </div>
  )
}
function 선그림({ 줄 }) {
  const L = 줄.filter((x) => x.내s != null && x.예정s != null)
  if (L.length < 2) return <p className="cp muted" style={{ margin: 0 }}>선을 그릴 개찰이 2건이 안 됩니다.</p>
  const W = 640, H = 230, 왼 = 44, 오 = 26, 위 = 14, 아 = 34
  const 값들 = L.flatMap((x) => [x.내s, x.예정s])
  const lo = Math.floor(Math.min(...값들) * 2) / 2 - 0.5, hi = Math.ceil(Math.max(...값들) * 2) / 2 + 0.5
  const X = (i) => 왼 + (L.length === 1 ? 0 : (i * (W - 왼 - 오)) / (L.length - 1))
  const Y = (v) => 위 + ((hi - v) * (H - 위 - 아)) / (hi - lo)
  const 눈금 = []; for (let v = Math.ceil(lo); v <= hi; v += (hi - lo > 4 ? 1 : 0.5)) 눈금.push(v)
  const 길 = (k) => L.map((x, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(x[k]).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="kb-svg" role="img" aria-label="개찰마다 예정가격 사정률과 이 업체 투찰 사정률">
      {눈금.map((v) => <g key={v}><line x1={왼} x2={W - 오} y1={Y(v)} y2={Y(v)} className="kb-grid" /><text x={왼 - 6} y={Y(v) + 4} className="kb-ax" textAnchor="end">{v.toFixed(v % 1 ? 1 : 0)}</text></g>)}
      <path d={길('예정s')} className="kb-l-yj" />
      <path d={길('내s')} className="kb-l-me" />
      {L.map((x, i) => (
        <g key={x.no + i}>
          <circle cx={X(i)} cy={Y(x.예정s)} r="3.5" className="kb-d-yj"><title>{`${x.dt.slice(5).replace('-', '.')} 예정가격 사정률 ${x.예정s.toFixed(3)}`}</title></circle>
          <circle cx={X(i)} cy={Y(x.내s)} r={x.rank === 1 ? 6 : 4} className={x.rank === 1 ? 'kb-d-win' : x.실격 ? 'kb-d-dq' : 'kb-d-me'}>
            <title>{`${x.dt.slice(5).replace('-', '.')} 이 업체 ${x.내s.toFixed(3)} · ${x.rank}등/${x.n}곳${x.실격 ? ' · 하한 미달' : ''}`}</title>
          </circle>
          {(i === 0 || i === L.length - 1 || i % Math.ceil(L.length / 6) === 0) && <text x={X(i)} y={H - 12} className="kb-ax" textAnchor="middle">{x.dt.slice(5).replace('-', '.')}</text>}
        </g>
      ))}
    </svg>
  )
}
function 막대그림({ 내, 일순 }) {
  const W = 640, H = 210, 왼 = 30, 오 = 8, 위 = 10, 아 = 30
  const 큰 = Math.max(1, ...내, ...일순)
  const 칸폭 = (W - 왼 - 오) / 20
  const Y = (v) => 위 + ((큰 - v) * (H - 위 - 아)) / 큰
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="kb-svg" role="img" aria-label="투찰 사정률 분포 — 이 업체 · 같은 개찰의 1순위">
      {[0, Math.ceil(큰 / 2), 큰].filter((v, i, a) => a.indexOf(v) === i).map((v) => <g key={v}><line x1={왼} x2={W - 오} y1={Y(v)} y2={Y(v)} className="kb-grid" /><text x={왼 - 5} y={Y(v) + 4} className="kb-ax" textAnchor="end">{v}</text></g>)}
      {분포칸들.map((lo, i) => {
        const x0 = 왼 + i * 칸폭 + 2, w = (칸폭 - 6) / 2
        return (
          <g key={lo}>
            {내[i] > 0 && <rect x={x0} y={Y(내[i])} width={w} height={H - 아 - Y(내[i])} rx="2" className="kb-b-me"><title>{`${lo.toFixed(1)}~${(lo + 0.2).toFixed(1)} · 이 업체 ${내[i]}건`}</title></rect>}
            {일순[i] > 0 && <rect x={x0 + w + 2} y={Y(일순[i])} width={w} height={H - 아 - Y(일순[i])} rx="2" className="kb-b-win"><title>{`${lo.toFixed(1)}~${(lo + 0.2).toFixed(1)} · 1순위 ${일순[i]}건`}</title></rect>}
            {i % 5 === 0 && <text x={왼 + i * 칸폭} y={H - 10} className="kb-ax" textAnchor="middle">{lo.toFixed(0)}</text>}
          </g>
        )
      })}
      <text x={W - 오} y={H - 10} className="kb-ax" textAnchor="end">102</text>
    </svg>
  )
}
function 번호리포트({ biz }) {
  const [상태, set상태] = useState('ing')
  const [t, setT] = useState(null)
  useEffect(() => {
    let 끝 = false
    set상태('ing'); setT(null)
    업체조각자료(biz).then((j) => { if (끝) return; const r = j && j.업체 ? j.업체[String(biz)] : null; setT(r || { 없음: true }); set상태('') })
      .catch(() => { if (!끝) set상태('err') })
    return () => { 끝 = true }
  }, [biz])
  const 번 = 번호글(biz)
  if (상태 === 'err') return <div className="kb-rep"><p className="cp muted">자료를 받지 못했습니다 — 잠시 뒤 다시 «보기» 를 눌러 주십시오.</p></div>
  if (!t) return <div className="kb-rep"><p className="cp muted">개찰 자료를 받아 셉니다…</p></div>
  if (t.없음) {
    return (
      <div className="kb-rep">
        <p className="cp" style={{ margin: 0 }}><b>{번}</b> — 사이트에 실린 최근 개찰에서 이 사업자번호로 셀 수 있는 개찰이 3건이 안 됩니다.</p>
        <p className="cp muted" style={{ margin: '6px 0 0', fontSize: 12.5 }}>개찰마다 금액이 낮은 30곳까지만 실려 있어, 그 안에 든 개찰만 셉니다. 사업자번호 10자리가 맞는지도 한 번 봐 주십시오.</p>
      </div>
    )
  }
  const 확배 = 배숫(t.확보합, t.평균합)
  const 순배 = t.실제1순위 != null && t.평균1순위 > 0 ? t.실제1순위 / t.평균1순위 : null
  const 줄 = t.최근 || []
  const 큰 = Math.max(t.평균합 || 0, t.확보합 || 0)
  const 처음 = 줄.length ? 줄[0].dt : '', 끝날 = 줄.length ? 줄[줄.length - 1].dt : ''
  return (
    <div className="kb-rep">
      <div className="kb-rep-sum">
        <b>{번}</b> 업체의 확보 예가는{' '}
        {확배 == null ? <b className="kb-dn">셀 수 없음</b> : <b className={확배 >= 1 ? 'kb-up' : 'kb-dn'}>평균의 {배글(확배)}</b>}
        {순배 != null && <>, 1순위는 <b className={순배 >= 1 ? 'kb-up' : 'kb-dn'}>평균의 {배글(순배)}</b></>}입니다.
        <div className="kb-rep-sub">사이트에 실린 최근 개찰 {t.잰개찰}건 기준{처음 ? `(아래 그림은 ${처음.slice(5).replace('-', '.')}~${끝날.slice(5).replace('-', '.')} 최근 ${줄.length}건)` : ''} · 확보 예가는 그중 바로 아래 업체를 아는 {t.몫잰}건으로 셈</div>
      </div>

      <h3 className="kb-rep-h">① 확보 예가 — 남들과 견주면</h3>
      {t.몫잰 > 0 && 큰 > 0
        ? (
          <div className="kb-rings">
            <고리 값={t.평균합} 큰={큰} 색="#94a3b8" 위={`${t.몫잰}건의 평균 예가`} 아래={`${Number(t.평균합).toLocaleString()}개`} />
            <span className="kb-vs" aria-hidden="true">{t.확보합 >= t.평균합 ? '<' : '>'}</span>
            <고리 값={t.확보합} 큰={큰} 색={t.확보합 >= t.평균합 ? '#10b981' : '#f59e0b'} 위={`${t.몫잰}건의 확보 예가`} 아래={`${Number(t.확보합).toLocaleString()}개`} />
          </div>
        )
        : <p className="cp muted" style={{ margin: 0 }}>넣은 개찰이 모두 1순위이거나 하한 아래로 실려, 바로 아래 업체를 몰라 셀 수 없습니다.</p>}
      <div className="kb-exp">
        <p><b>예정가격은 «뽑기» 로 정해집니다.</b> 복수예비가격 15개 중 4개를 뽑아 평균을 내므로 나올 수 있는 예정가격은 <b>1,365가지</b>입니다.</p>
        <p><b>확보 예가</b> = 그 1,365가지 중 «이 업체가 1순위가 되는» 가짓수입니다. 예정가격이 이 업체 금액과 바로 아래 업체 금액 사이(낙찰하한선 기준)에 떨어져야 1순위가 되니, 그 폭이 넓을수록 확보 예가가 많습니다.</p>
        <p><b>평균 예가</b> = 1,365 ÷ 참가 업체 수 — 모두가 똑같이 나눠 가졌을 때 한 업체의 몫입니다. 확보 예가가 평균보다 많으면 남들이 덜 몰린 자리를 잡은 것입니다(1배 = 남들과 같음).</p>
        <p className="muted">K-건설맵은 뽑힌 15개 값을 하나하나 세지 않고, 그 공고의 예가 범위로 «예정가격이 그 폭에 나올 확률» 을 어림해 가짓수로 바꿉니다. 그래서 소수점이 붙을 수 있습니다.</p>
      </div>

      <h3 className="kb-rep-h">② 1순위 · 하한 미달</h3>
      <div className="kb-stats">
        <div><span>넣은 개찰</span><b>{t.잰개찰}건</b></div>
        <div><span>1순위</span><b>{t.실제1순위 ?? '-'}건</b></div>
        <div><span>평균이라면</span><b>{t.평균1순위 != null ? `${t.평균1순위}건` : '-'}</b></div>
        <div><span>하한 미달</span><b>{t.실격 ?? '-'}건</b></div>
      </div>
      <div className="kb-exp">
        <p><b>평균이라면</b> = 개찰마다 «1 ÷ 참가 업체 수» 를 더한 것 — 모두가 같은 확률이라면 이만큼 1순위가 됐을 것이라는 기준입니다. 실제 1순위가 이보다 많으면 평균보다 잘 된 것입니다.</p>
        <p><b>하한 미달</b> = 실제 예정가격으로 본 낙찰하한보다 낮게 넣은 개찰(실격)입니다. 사이트의 «1순위» 는 개찰 1순위이고, 적격심사 뒤 실제 낙찰자와 다를 수 있습니다.</p>
      </div>

      <h3 className="kb-rep-h">③ 개찰마다 — 예정가격 사정률과 이 업체 사정률</h3>
      <div className="kb-leg"><span><i className="kb-k-yj" />예정가격 사정률(실제 나온 값)</span><span><i className="kb-k-me" />이 업체 투찰 사정률</span><span><i className="kb-k-win" />1순위</span><span><i className="kb-k-dq" />하한 미달</span></div>
      <div className="kb-chart"><선그림 줄={줄} /></div>
      <div className="kb-exp">
        <p><b>이 업체 투찰 사정률</b> = 넣은 금액이 «딱 낙찰하한» 이 되는 사정률입니다. 실제 예정가격 사정률(파랑)이 이보다 <b>낮게</b> 나와야 하한을 넘깁니다 — 초록 점이 파랑 점 <b>위</b>에 있으면 유효, <b>아래</b>면 하한 미달입니다.</p>
        <p>초록 점이 파랑 점 바로 위에 붙을수록 1순위에 가까웠던 개찰입니다(더 낮게 넣은 업체가 없으면 1순위).</p>
        <p className="muted">⚠️ 지난 개찰의 예정가격 사정률로 다음 개찰을 맞힐 수는 없습니다 — 개찰마다 따로 뽑습니다. 이 그림은 «이 업체가 어느 자리에 넣어 왔나» 를 보는 것입니다.</p>
      </div>

      {t.분포 && (
        <>
          <h3 className="kb-rep-h">④ 투찰 사정률 분포 — 이 업체 · 같은 개찰의 1순위</h3>
          <div className="kb-leg"><span><i className="kb-k-me" />이 업체가 넣은 자리</span><span><i className="kb-k-win" />같은 개찰들의 1순위 자리</span></div>
          <div className="kb-chart"><막대그림 내={t.분포.내} 일순={t.분포.일순} /></div>
          <div className="kb-exp">
            <p>가로는 투찰 사정률(98~102, 0.2 간격), 세로는 개찰 건수입니다. 이 업체가 주로 넣는 자리(초록)와 같은 개찰들에서 1순위가 나온 자리(주황)를 견줘 보세요.</p>
            <p className="muted">1순위가 많이 나온 자리는 그만큼 남들도 많이 넣는 자리일 수 있습니다 — 확보 예가는 «남이 덜 몰린 자리» 에서 커집니다.</p>
          </div>
        </>
      )}

      <h3 className="kb-rep-h">⑤ 최근 개찰</h3>
      <div className="tp-scroll">
        <table className="kb-tbl">
          <thead><tr><th>개찰일</th><th>공고</th><th className="r">등수</th><th className="r kb-pc">예정 사정률</th><th className="r kb-pc">이 업체</th><th className="r">평균 대비</th></tr></thead>
          <tbody>
            {줄.slice().reverse().map((x) => (
              <tr key={x.no + x.dt}>
                <td>{x.dt.slice(5).replace('-', '.')}</td>
                <td>{x.name}</td>
                <td className="r">{x.rank === 1 ? '🏆 ' : ''}{x.rank}/{x.n}</td>
                <td className="r kb-pc">{x.예정s != null ? x.예정s.toFixed(3) : '-'}</td>
                <td className={'r kb-pc' + (x.실격 ? ' kb-dn' : '')}>{x.내s != null ? x.내s.toFixed(3) : '-'}{x.실격 ? ' ✕' : ''}</td>
                <td className={'r ' + (x.배 != null && x.배 >= 1 ? 'kb-up' : 'kb-dn')}>{x.배 == null ? '-' : 배글(x.배)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="kb-rep-h">⑥ 확보 예가를 높이려면</h3>
      <ol className="kb-how">
        <li>넣기 전에 이 화면 위 <b>«🎯 확보 예가 미리 보기»</b> 로 지금 금액이 평균의 몇 배인지 봅니다 — 비슷한 지난 개찰에서 그 자리의 몫을 셉니다.</li>
        <li><b>«💰 금액 고르기»</b> 표에서 자리마다 1순위 · 하한 미달 비율을 견주고 금액을 고릅니다. 고르는 것은 이용자입니다.</li>
        <li>④ 분포에서 남들이 몰린 구간을 확인합니다. 같은 1순위 확률이라면 덜 몰린 자리에서 확보 예가가 커집니다.</li>
      </ol>
      <p className="kb-note muted">사이트에 실린 최근 개찰(개찰마다 금액이 낮은 30곳까지)로 셉니다 · 매일 자동으로 다시 셈 · 이용료 없음.</p>
    </div>
  )
}
export function 사업자확보예가() { return <예가지킴><번호조회 /></예가지킴> }
function 업체안({ biz, 여럿, 이름 }) {
  const 자리 = useRef(null)
  const 보임 = useBo임(자리)
  const [상태, set상태] = useState('')
  const [t, setT] = useState(null)
  useEffect(() => { setT(null); if (보임 && biz) 보기() }, [보임, biz])   // eslint-disable-line react-hooks/exhaustive-deps
  async function 보기() {
    set상태('ing'); 세기('|확보예가|업체보임')
    try {
      const j = await 업체조각자료(biz)
      const r = j && j.업체 ? j.업체[String(biz)] : null
      setT(r || { 없음: true }); set상태('')
    } catch (e) { set상태('err') }
  }
  return (
    <div className="card" style={{ marginTop: 10 }} ref={자리}>
      <div className="sec-title" style={{ margin: '0 0 6px' }}>🎯 확보 예가 — 최근 개찰</div>
      {!biz ? (
        <p className="cp" style={{ margin: 0 }}>{여럿
          ? '같은 이름의 법인이 여럿입니다 — 위에서 법인 하나를 고르시면 그 법인의 확보 예가를 셉니다.'
          : '이 업체는 개찰 자료에 사업자번호가 실려 있지 않아 확보 예가를 셀 수 없습니다.'}</p>
      ) : !t ? (
        <>
          <p className="cp" style={{ margin: '0 0 8px' }}>
            {이름 || '이 업체'}가 넣은 개찰마다 <b>1순위가 될 몫(확보 예가)</b>을 얼마나 쥐었는지 셉니다 — 남들이 몰린 자리에 같이 넣었는지,
            덜 몰린 자리를 잡았는지가 보입니다(평균 1배 = 남들과 같음).
          </p>
          {상태 !== 'err' ? <div className="muted">개찰 자료를 받아 셉니다…</div> : (
            <span className="muted">개찰 자료를 받지 못했습니다 — <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={보기}>다시</button></span>
          )}
        </>
      ) : t.없음 ? (
        <p className="cp" style={{ margin: 0 }}>셀 수 있는 개찰이 3건이 안 됩니다(사이트에 실린 개찰은 낮은 금액 순 30곳까지라, 그 안에 든 개찰만 셉니다).</p>
      ) : (
        <>
          <div className="kb-big">
            {t.배가운데 == null
              ? <span>확보 예가 <b className="kb-dn">셀 수 없음</b> <span className="muted">— 넣은 개찰 {t.잰개찰}건이 모두 바로 아래 업체를 모르는 자리(1순위 · 하한 아래)입니다</span></span>
              : <span>확보 예가 <b className={t.배가운데 >= 1 ? 'kb-up' : 'kb-dn'}>평균의 {배글(t.배가운데)}</b></span>}
            <span className="muted">· 잴 수 있는 개찰 {t.몫잰}건의 가운데값 · 평균 넘은 개찰 {t.평균넘은}건 · 1순위 {t.잰1순위}건(셈으로 본 기대 {t.기대1순위}건){t.몫잰 < t.잰개찰 ? ` · 넣은 개찰 ${t.잰개찰}건 중 ${t.잰개찰 - t.몫잰}건은 바로 아래 업체를 몰라 뺌` : ''}</span>
          </div>
          {t.몰린구간 && <div className="kb-line">금액이 가장 몰린 투찰 사정률 구간은 <b>{t.몰린구간}</b>(같은 개찰 전체의 {Math.round(t.몰린몫)}%) — 이 업체는 그 구간에 {Math.round(t.귀사몰린몫)}%를 넣었습니다.</div>}
          <div className="tp-scroll">
            <table className="tbl kb-tbl">
              <thead><tr><th>개찰일</th><th className="kb-name">공고</th><th>등수</th><th className="kb-pc">투찰 사정률</th><th className="kb-pc">확보 예가</th><th>평균 대비</th></tr></thead>
              <tbody>
                {t.최근.slice(-12).reverse().map((x) => (
                  <tr key={x.no + x.dt}>
                    <td>{String(x.dt).slice(5, 10).replace('-', '.')}</td>
                    <td className="kb-name" title={String(x.name || '')}>{String(x.name || '').slice(0, 26)}</td>
                    <td className="r">{x.rank}/{x.n}</td>
                    <td className="r kb-pc">{사정(x.내s)}</td>
                    <td className="r kb-pc">{x.확보 == null ? '-' : x.확보 > 0 && x.확보 < 0.5 ? '1가지 미만' : `${Math.round(x.확보).toLocaleString('ko-KR')}가지`}</td>
                    <td className={'r ' + (x.배 != null && x.배 >= 1 ? 'kb-up' : 'kb-dn')}>{x.배 == null ? '-' : 배글(x.배)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="kb-note muted">확보 예가(어림) = 1순위가 될 사정률 폭에 예정가격이 나올 확률 × 예가 조합 수(15개 중 4개 = 1,365가지). 투찰 때의 기대값이지 실제 뽑힌 조합 수가 아닙니다.</div>
        </>
      )}
    </div>
  )
}
