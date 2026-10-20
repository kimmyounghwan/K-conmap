/**
 * 📝 넣은 금액 — 내가 이 공고에 넣은(넣을) 금액을 이 기기에 적어 두고, 개찰 뒤 «몇 위였나» 를 셉니다. (G338 · 2026-10-20)
 *
 * 소장님 「바로입찰 업그레이드 방안 줘」 → 고르심 «①·④ 같이» — ④ 넣은 공고 개찰 확인 · 누적 성적표.
 * ■ 회원가입도 서버도 없습니다 — ⭐ 담은 공고(lib/basket.js)처럼 이 브라우저에만 적습니다. 공고번호 · 금액 · 적은 때 · 공고명뿐.
 * ■ 셈(내성적) — 개찰 자료(1순위 금액 · 투찰률 · A값 · 하한율 · 낮게 쓴 30곳 · 순위 사다리)로:
 *     예정가격 = 1순위 금액 ÷ 1순위 투찰률 · 낙찰하한 = (예정가격 − A값) × 하한율 + A값(원 올림 — 금액대성적.js 와 같은 식)
 *     내 금액 < 하한 → 실격 · 하한 ≤ 내 금액 < 1순위 → 1순위였을 금액 · 같으면 같은 금액(추첨)
 *     그 위면 낮게 쓴 30곳 안에서 몇 위 · 30곳보다 높으면 순위 사다리로 «몇 위 ~ 몇 위»(bidmath.rankBracket)
 * ■ 하한율이 공고에 안 실려 왔으면 규모로 추정(engines.lowerLimit)하고 «추정» 이라고 밝힙니다 · A값을 모르면 0 으로 셈하고 밝힙니다.
 * ■ 셈한 결과는 그 줄에 같이 적어 둡니다(o) — 1순위 화면 «내가 적어 둔 금액» 모아 보기가 다시 받지 않고 셉니다.
 *   시험: node tools/시험_넣은금액.mjs
 */
import { rankBracket, breakEvenSj } from './bidmath.js'
import { lowerLimit } from './engines.js'

const LS = 'kcm_mybid'
const MAX = 200
export const 넣은금액이름 = 'kcm-mybid'      // 바뀌면 이 이름으로 window 이벤트(같은 화면의 다른 칸이 다시 읽게)

export function 넣은들() {
  try {
    const v = JSON.parse(localStorage.getItem(LS) || '{}')
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
  } catch { return {} }
}
function 남기기(m) {
  try {
    const 줄 = Object.entries(m).sort((a, b) => String(a[1]?.t || '').localeCompare(String(b[1]?.t || '')))
    const 남김 = Object.fromEntries(줄.slice(-MAX))
    localStorage.setItem(LS, JSON.stringify(남김))
    window.dispatchEvent(new CustomEvent(넣은금액이름))
    return 남김
  } catch { return m }
}
export function 넣은of(no) {
  const k = String(no || '')
  return k ? 넣은들()[k] || null : null
}
const 지금때 = () => {
  const d = new Date(Date.now() + 9 * 3600 * 1000)     // 한국 시각
  return d.toISOString().slice(0, 16).replace('T', ' ')
}
/** 적기 — 금액(원) · 공고명(보여 줄 때만 씀) */
export function 넣은적기(no, 금액, 이름 = '') {
  const k = String(no || ''), a = Math.round(Number(String(금액).replace(/[^0-9]/g, '')) || 0)
  if (!k || !(a > 0)) return 넣은들()
  const m = 넣은들()
  m[k] = { a, t: 지금때(), n: String(이름 || m[k]?.n || '').slice(0, 60) }
  return 남기기(m)
}
export function 넣은지우기(no) {
  const m = 넣은들()
  delete m[String(no || '')]
  return 남기기(m)
}
/** 셈한 결과를 그 줄에 붙여 둠(같으면 안 씀) */
export function 넣은결과남기기(no, 성) {
  const k = String(no || '')
  const m = 넣은들()
  if (!m[k] || !성 || 성.상태 === '모름') return
  const o = { s: 성.상태, k: 성.순위 ? 성.순위[0] : null, k2: 성.순위 ? 성.순위[1] : null, d: 성.차이 }
  if (JSON.stringify(m[k].o) === JSON.stringify(o)) return
  m[k] = { ...m[k], o }
  남기기(m)
}

/**
 * 내성적 — 개찰 한 줄(r)과 내 금액으로.
 * r: { amt, rate, base, est?, aval, ayn, llr, rq?, nrank?, np? } · 낮게 쓴 곳: corps([[이름, 금액, …]]) 또는 amts([금액])
 * 돌려줌: { 상태: '일순'|'같음'|'통과'|'실격'|'모름', 왜?, 예정, 하한, 하한추정, A모름, 사정률, 내버팀, 차이, 차이율, 순위: [아래, 위|null] | null, 순위말 }
 */
export function 내성적(r, 금액, 낮은곳) {
  const 내 = Math.round(Number(금액) || 0)
  const amt = Number(r && r.amt) || 0, rate = Number(r && r.rate) || 0, base = Number(r && r.base) || 0
  if (!(내 > 0)) return { 상태: '모름', 왜: '내 금액이 없습니다' }
  if (!(amt > 0) || !(rate > 50 && rate < 110)) return { 상태: '모름', 왜: '1순위 금액 · 투찰률이 안 실려 왔습니다' }
  const 예정 = amt / (rate / 100)
  const A모름 = !(Number(r.aval) > 0) && r.ayn !== 'N'
  const A = r.ayn === 'N' ? 0 : (Number(r.aval) || 0)
  let llr = Number(r.llr) || 0, 하한추정 = false
  if (!(llr > 0)) {
    const est = Number(r.est) || (base > 0 ? Math.round(base / 1.1) : 0)
    const ll = est > 0 ? lowerLimit(est) : null
    llr = ll && ll.rate ? ll.rate : 0
    하한추정 = true
  }
  if (!(llr > 0)) return { 상태: '모름', 왜: '낙찰하한율을 알 수 없습니다(100억 이상 · 종합심사 등)' }
  let 하한 = Math.ceil((예정 - A) * (llr / 100) + A)
  if (하한 > amt) 하한 = amt          /* 1순위는 하한 위였음 — 추정 하한율이 높게 잡혔으면 1순위 금액을 하한으로 봄 */
  const 사정률 = base > 0 ? (예정 / base) * 100 : null
  const 내버팀 = base > 0 ? breakEvenSj(base, llr, A, 내) : null
  const 차이 = 내 - amt
  const 차이율 = (차이 / 예정) * 100       // 투찰률로 몇 %p
  const 공통 = { 예정: Math.round(예정), 하한, 하한추정, A모름, llr, 사정률, 내버팀, 차이, 차이율 }
  if (내 < 하한) return { ...공통, 상태: '실격', 모자람: 하한 - 내, 순위: null, 순위말: '낙찰하한 아래' }
  if (내 < amt) return { ...공통, 상태: '일순', 순위: [1, 1], 순위말: '1순위' }
  if (내 === amt) return { ...공통, 상태: '같음', 순위: [1, 1], 순위말: '1순위와 같은 금액(추첨)' }
  /* 그 위 — 낮게 쓴 곳 안이면 바로 셈 */
  const 금액들 = (Array.isArray(낮은곳) && 낮은곳.length ? 낮은곳 : (Array.isArray(r.amts) ? r.amts : []))
    .map((c) => Number(Array.isArray(c) ? c[1] : c) || 0).filter((x) => x > 0).sort((x, y) => x - y)
  const 모두 = Math.max(Number(r.nrank) || 0, Number(r.np) || 0, 금액들.length)
  const 아래수 = 금액들.filter((x) => x < 내 && x >= 하한).length
  if (금액들.length && (내 <= 금액들[금액들.length - 1] || 금액들.length >= 모두)) {
    const k = 아래수 + 1
    return { ...공통, 상태: '통과', 순위: [k, k], 순위말: `${k}위쯤${모두 ? ` (참가 ${모두.toLocaleString('ko-KR')}곳)` : ''}` }
  }
  const 사다리 = rankBracket(r.rq, 내, 하한)
  if (사다리) {
    const [lo, hi] = 사다리
    return { ...공통, 상태: '통과', 순위: [lo, hi], 순위말: hi && hi !== lo ? `${lo}~${hi}위` : `${lo}위 넘게` }
  }
  return { ...공통, 상태: '통과', 순위: 금액들.length ? [금액들.length + 1, null] : null, 순위말: 금액들.length ? `${금액들.length + 1}위 넘게(낮게 쓴 ${금액들.length}곳보다 높음)` : '하한 통과(순위 자료 없음)' }
}

/** 모아 보기 — 적어 둔 줄들의 결과 o 로 셈 */
export function 넣은모음() {
  const m = 넣은들()
  const 줄 = Object.entries(m).map(([no, v]) => ({ no, ...v }))
  const 셈 = { 적음: 줄.length, 봄: 0, 일순: 0, 통과: 0, 실격: 0 }
  for (const x of 줄) {
    const s = x.o && x.o.s
    if (!s) continue
    셈.봄++
    if (s === '일순' || s === '같음') 셈.일순++
    else if (s === '통과') 셈.통과++
    else if (s === '실격') 셈.실격++
  }
  줄.sort((a, b) => String(b.t || '').localeCompare(String(a.t || '')))
  return { 셈, 줄 }
}
