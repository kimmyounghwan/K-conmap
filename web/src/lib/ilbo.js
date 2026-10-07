/**
 * 📝 작업일보 만들기 — 저장 · 금일/전일/누계 셈 · 노무비 계산기에서 인원 가져오기 (G112 · 2026-10-01)
 *
 * 소장님: 「예스폼에 또 뭐가 있지??? 새로 만들어야 할 서식은?」 → 예스폼 «작업일지»(누적 조회 68만) → 「1부터 4까지 만들어 보자」 (④)
 * ■ 현장 투입비(/tools/tuipbi)의 📝 공사일보 탭은 «현장 등록(코드 + 비밀번호) · 여럿이 같이» 입니다.
 *   여기는 가입 · 등록 없이 «혼자 바로» 쓰는 판 — 같은 종이(tools/일보종이.jsx)로 인쇄합니다.
 * ■ 인원 · 장비 · 자재는 날마다 «금일» 만 적으면 전일까지 · 누계는 저절로(이 브라우저에 적은 날을 모두 더함).
 * ■ 같은 브라우저에서 👷 노무비 계산기(/tools/nomubi)를 쓰면 그날 출역을 직종별 인원으로 가져옵니다(localStorage 'kcm_nomubi1').
 * ■ 저장: 이 브라우저(localStorage)만.
 *
 * ■ (G112 · 소장님 「작업일보는 공정율도 나와야 해. 보할로 해야」) 공정률 = Σ(공종 보할 × 공종 누계 진척)
 *   공종 · 보할은 금액(내역서 공종 금액)으로 정하거나 보할(%)을 바로 적음 — 📈 예정공정표(같은 브라우저)에서 공종 · 금액 · 일정을 가져올 수 있음.
 *   날마다 공종의 «금일 진척(%p)» 또는 «금일 수량»(설계수량을 적은 공종)만 적으면 전일까지 · 누계 · 실시 공정률이 저절로.
 *   계획 공정률 = Σ(보할 × 그날까지 계획 진척) — 공종에 시작 · 기간이 있으면 그 기간에 고르게(예정공정표 계획률과 같은 셈).
 *
 * 저장 모양(v1)
 *   { 현장: { name, co }, 공종: [{ id, n, amt 금액, w 보할(%), q 설계수량, u 단위, b 쓰기 전 누계(% · 수량), s 시작, dur 기간(일) }],
 *     일: { 'YYYY-MM-DD': { w, lo, hi, pp, ap, wk:[{g,v,t,n}], 인:[{j,n}], 장:[{n,u,q}], 자:[{n,s,u,q}], 진:{공종id: 금일 값}, nt, nx } } }
 */
import { 현장자료열쇠, 지금현장 } from './nomubi.js'
import { 현장나눔 } from './현장나눔.js'

export const 열쇠 = 'kcm_ilbo1'
export const 날씨들 = ['맑음', '구름', '흐림', '비', '눈', '안개', '강풍']
export const 장비단위 = ['대', '일', '시간', '회']
const 두자 = (n) => String(n).padStart(2, '0')
export const 날글 = (t) => `${t.getFullYear()}-${두자(t.getMonth() + 1)}-${두자(t.getDate())}`
export const 날 = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1) }
export const 오늘 = () => 날글(new Date())
export const 날더하기 = (s, n) => { const d = 날(s); d.setDate(d.getDate() + n); return 날글(d) }
export const 요일 = (s) => '일월화수목금토'[날(s).getDay()]
export const 수 = (v) => { const x = Number(String(v ?? '').replace(/[^\d.-]/g, '')); return Number.isFinite(x) ? x : 0 }

export const 일빈 = () => ({ w: '', lo: '', hi: '', pp: '', ap: '', wk: [{ g: '', v: '', t: '', n: '' }], 인: [{ j: '', n: '' }], 장: [{ n: '', u: '대', q: '' }], 자: [{ n: '', s: '', u: '', q: '' }], 진: {}, nt: '', nx: '' })
export const 빈것 = () => ({ 현장: { name: '', co: '' }, 공종: [], 일: {} })

/* 🏗 G179 (2026-10-07) 현장별로 나눠 쓰기 — lib/현장나눔.js · 첫 현장은 예전 자리 'kcm_ilbo1' 그대로 · 그 밖 'kcm_ilbo1@{id}'
   읽기() · 쓰기() 는 «지금 현장» · 화면은 읽기현장(id) · 쓰기현장(id) 로 현장을 정해 씁니다. */
export const 일보나눔 = 현장나눔('ib')
export function 읽기현장(id) {
  try {
    const s = JSON.parse(localStorage.getItem(일보나눔.열쇠(열쇠, id)) || 'null')
    if (s && s.일 && typeof s.일 === 'object') return { ...빈것(), ...s, 현장: { ...빈것().현장, ...(s.현장 || {}) }, 공종: Array.isArray(s.공종) ? s.공종 : [] }
  } catch (e) { /* 막힌 브라우저 · 깨진 값 */ }
  return 빈것()
}
export function 쓰기현장(id, s) { try { localStorage.setItem(일보나눔.열쇠(열쇠, id), JSON.stringify(s)); return true } catch (e) { return false } }
export function 읽기() { return 읽기현장(일보나눔.지금()) }
export function 쓰기(s) { return 쓰기현장(일보나눔.지금(), s) }

/** 그날 것 (없으면 빈 것) — 칸이 빠진 옛 것도 채워서 */
export function 그날(st, d) {
  const v = (st.일 || {})[d]
  if (!v) return 일빈()
  const b = 일빈()
  const 배 = (x, 빈) => (Array.isArray(x) && x.length ? x : 빈)
  return { ...b, ...v, wk: 배(v.wk, b.wk), 인: 배(v.인, b.인), 장: 배(v.장, b.장), 자: 배(v.자, b.자), 진: v.진 && typeof v.진 === 'object' ? v.진 : {} }
}
/** 적은 것이 하나라도 있나 */
export function 적음(o) {
  if (!o) return false
  return !!(o.w || String(o.lo ?? '') !== '' || String(o.hi ?? '') !== '' || String(o.pp ?? '') !== '' || String(o.ap ?? '') !== '' || String(o.nt || '').trim() || String(o.nx || '').trim()
    || Object.values(o.진 || {}).some((v) => 수(v)) || (o.wk || []).some((r) => r.g || r.v || r.t || r.n) || (o.인 || []).some((r) => r.j && 수(r.n)) || (o.장 || []).some((r) => r.n && 수(r.q)) || (o.자 || []).some((r) => r.n && 수(r.q)))
}
/** 저장할 모양 — 빈 줄은 뺌 */
export function 싸기(o) {
  return {
    ...o,
    wk: (o.wk || []).filter((r) => r.g || r.v || r.t || r.n),
    인: (o.인 || []).filter((r) => String(r.j || '').trim() && 수(r.n)),
    장: (o.장 || []).filter((r) => String(r.n || '').trim() && 수(r.q)),
    자: (o.자 || []).filter((r) => String(r.n || '').trim() && 수(r.q)),
  }
}

/**
 * 그날까지 — 인원(직종별) · 장비 · 자재의 금일 / 전일까지 / 누계 (tools/일보종이.jsx 의 «셈» 모양)
 * @param 지금 — 아직 저장 안 한 그날 화면 값(있으면 그날 것 대신)
 */
export function 셈(st, d, 지금 = null) {
  const 인 = new Map(), 장 = new Map(), 자 = new Map()
  const 일 = { ...(st.일 || {}) }
  if (지금) 일[d] = 지금
  for (const [ds, o] of Object.entries(일)) {
    if (ds > d || !o) continue
    const 오늘것 = ds === d
    for (const r of o.인 || []) {
      const j = String(r.j || '').trim(), n = 수(r.n)
      if (!j || !n) continue
      let x = 인.get(j); if (!x) { x = { 이름: j, 전: 0, 금: 0, 누: 0 }; 인.set(j, x) }
      x.누 += n; if (오늘것) x.금 += n; else x.전 += n
    }
    for (const r of o.장 || []) {
      const 이름 = String(r.n || '').trim(), q = 수(r.q)
      if (!이름 || !q) continue
      const key = 이름 + '|' + (r.u || '대')
      let x = 장.get(key); if (!x) { x = { 이름, 단위: r.u || '대', 금: 0, 누: 0 }; 장.set(key, x) }
      x.누 += q; if (오늘것) x.금 += q
    }
    for (const r of o.자 || []) {
      const 이름 = String(r.n || '').trim(), q = 수(r.q)
      if (!이름 || !q) continue
      const key = 이름 + '|' + (r.s || '') + '|' + (r.u || '')
      let x = 자.get(key); if (!x) { x = { 이름, 규격: r.s || '', 단위: r.u || '', 금: 0, 누: 0 }; 자.set(key, x) }
      x.누 += q; if (오늘것) x.금 += q
    }
  }
  const 차례 = (a, b) => b.금 - a.금 || String(a.이름).localeCompare(String(b.이름), 'ko')
  const 인원 = [...인.values()].sort(차례)
  const 인원합 = 인원.reduce((s, x) => ({ 전: s.전 + x.전, 금: s.금 + x.금, 누: s.누 + x.누 }), { 전: 0, 금: 0, 누: 0 })
  return { 인원, 인원합, 장비: [...장.values()].sort(차례), 자재: [...자.values()].sort(차례) }
}

/* ── 📊 공정률 — 보할 ─────────────────────────────── */
const 날번 = (t) => { const m = String(t || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000) : null }
export const 새번호 = () => 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

/** 공종마다 보할(%) — 금액이 하나라도 있으면 금액 비율, 없으면 적은 보할을 합 100 으로 맞춤 */
export function 보할들(공종) {
  const 쓸 = (공종 || []).filter((g) => String(g.n || '').trim())
  const 금합 = 쓸.reduce((t, g) => t + Math.max(0, 수(g.amt)), 0)
  const 율합 = 쓸.reduce((t, g) => t + Math.max(0, 수(g.w)), 0)
  const 기준 = 금합 > 0 ? '금액' : 율합 > 0 ? '보할' : ''
  const 줄 = 쓸.map((g) => ({ ...g, 보할: 기준 === '금액' ? Math.max(0, 수(g.amt)) / 금합 * 100 : 기준 === '보할' ? Math.max(0, 수(g.w)) / 율합 * 100 : 0 }))
  return { 줄, 기준, 금합, 율합 }
}

/** 그날 공종별 진척 — 전일까지 · 금일 · 누계(%, 100 넘지 않음) · 기여 · 계획 / 합: 실시 · 금일 · 전일 · 계획(%) */
export function 공정셈(st, d, 지금 = null) {
  const B = 보할들(st.공종)
  if (!B.줄.length || !B.기준) return { 있음: false, 줄: [], 실시: null, 금일: null, 전일: null, 계획: null, 기준: B.기준 }
  const 일 = { ...(st.일 || {}) }
  if (지금) 일[d] = 지금
  const t = 날번(d)
  let 실시 = 0, 금일 = 0, 계획합 = 0, 계획있음 = false
  const 줄 = B.줄.map((g) => {
    const 설계 = 수(g.q)
    let 전값 = 수(g.b), 금값 = 0                         // b = 이 작업일보를 쓰기 전까지 쌓인 진척(% 또는 수량)
    for (const [ds, o] of Object.entries(일)) {
      if (ds > d || !o || !o.진) continue
      const v = 수(o.진[g.id])
      if (!v) continue
      if (ds === d) 금값 += v; else 전값 += v
    }
    const 율 = (v) => (설계 > 0 ? v / 설계 * 100 : v)
    const 전 = Math.min(100, 율(전값)), 누 = Math.min(100, 율(전값 + 금값)), 금 = 누 - 전
    let 계획 = null
    const s = 날번(g.s), dur = Math.round(수(g.dur))
    if (s !== null && dur > 0 && t !== null) { 계획 = Math.max(0, Math.min(1, (t - s + 1) / dur)) * 100; 계획있음 = true; 계획합 += g.보할 * 계획 / 100 }
    실시 += g.보할 * 누 / 100; 금일 += g.보할 * 금 / 100
    return { id: g.id, 이름: g.n, 보할: g.보할, 단위: 설계 > 0 ? (g.u || '') : '%', 설계, 전, 금, 누, 금값, 누값: 전값 + 금값, 기여: g.보할 * 누 / 100, 계획 }
  })
  const 둘 = (x) => Math.round(x * 100) / 100
  return { 있음: true, 줄, 기준: B.기준, 실시: 둘(실시), 금일: 둘(금일), 전일: 둘(실시 - 금일), 계획: 계획있음 ? 둘(계획합) : null }
}

/** 📈 같은 브라우저의 예정공정표(/tools/schedule) → 공종 · 금액 · 시작 · 기간 */
export function 공정표공종(공정셈표) {
  try {
    const P = JSON.parse(localStorage.getItem('kcm.calc.schedule') || 'null')
    if (!P || !Array.isArray(P.공종)) return null
    const R = 공정셈표(P)
    const 줄 = (R.줄 || []).filter((z) => z.이름 || z.금액 > 0).map((z) => ({ id: 새번호(), n: z.이름 || `공종 ${z.i + 1}`, amt: String(Math.round(z.금액 || 0) || ''), w: '', q: '', u: '', s: z.시작글 || '', dur: String(z.기간 || '') }))
    return 줄.length ? 줄 : null
  } catch (e) { return null }
}

/** 👷 같은 브라우저의 노무비 계산기에 적은 그날 출역 → 직종별 인원 [{j, n}] (공수가 0 보다 크면 1명) */
export function 노무비인원(d) {
  try {
    const s = JSON.parse(localStorage.getItem(현장자료열쇠(지금현장())) || 'null')   /* 🏗 G178 노무비 계산기에서 고른 현장 */
    if (!s || !Array.isArray(s.P) || !s.A) return null
    const 달 = (s.A || {})[d.slice(0, 7)] || {}
    const dd = d.slice(8, 10)
    const m = new Map()
    for (const p of s.P) {
      const a = 달[p.id]
      if (!a || !a.d || !(Number(a.d[dd]) > 0)) continue
      const j = String(p.j || '').trim() || '직종 없음'
      m.set(j, (m.get(j) || 0) + 1)
    }
    return { 현장: s.site || '', 회사: s.co || '', 인: [...m.entries()].map(([j, n]) => ({ j, n: String(n) })) }
  } catch (e) { return null }
}

/** 그 달 적은 날 */
export const 달날들 = (st, ym) => Object.keys(st.일 || {}).filter((d) => d.startsWith(ym) && 적음(st.일[d])).sort()

/** 🧪 예시 — 지어낸 현장 사흘 */
export function 예시(끝날 = 오늘()) {
  const 날들 = []
  for (let k = 0, d = 끝날; 날들.length < 3 && k < 10; k++, d = 날더하기(d, -1)) if (날(d).getDay() !== 0) 날들.unshift(d)
  const 일 = {}
  const 틀 = [
    { w: '맑음', lo: '14', hi: '25', wk: [{ g: '토공', v: '예시건설(주)', t: '배수로 2구간 터파기 · 되메우기', n: '5' }, { g: '구조물', v: '가상구조', t: '1구간 L형 측구 거푸집 조립', n: '4' }],
      인: [{ j: '보통인부', n: '4' }, { j: '형틀목공', n: '3' }, { j: '특별인부', n: '1' }, { j: '굴착기 운전원', n: '1' }], 장: [{ n: '굴착기 0.6㎥', u: '대', q: '1' }, { n: '덤프트럭 15t', u: '대', q: '2' }],
      자: [{ n: '합판 거푸집', s: '12T', u: '장', q: '40' }], nt: '08:00 TBM — 굴착부 추락 · 협착 주의. 2구간 지장물(통신관) 확인 후 굴착.', nx: '1구간 측구 콘크리트 타설 준비' },
    { w: '구름', lo: '15', hi: '23', wk: [{ g: '구조물', v: '가상구조', t: '1구간 L형 측구 철근 배근 · 검측', n: '5' }, { g: '토공', v: '예시건설(주)', t: '2구간 되메우기 · 다짐', n: '3' }],
      인: [{ j: '보통인부', n: '3' }, { j: '철근공', n: '3' }, { j: '형틀목공', n: '2' }], 장: [{ n: '굴착기 0.6㎥', u: '대', q: '1' }, { n: '진동롤러 2.5t', u: '대', q: '1' }],
      자: [{ n: '철근', s: 'SD400 D13', u: 'ton', q: '2.4' }], nt: '오후 철근 배근 검측(감독관 입회) — 이상 없음.', nx: '1구간 측구 콘크리트 타설(펌프카 1대)' },
    { w: '맑음', lo: '13', hi: '24', wk: [{ g: '구조물', v: '가상구조', t: '1구간 L형 측구 콘크리트 타설 · 양생', n: '6' }],
      인: [{ j: '보통인부', n: '3' }, { j: '콘크리트공', n: '2' }, { j: '형틀목공', n: '1' }], 장: [{ n: '콘크리트 펌프카 36m', u: '대', q: '1' }],
      자: [{ n: '레미콘', s: '25-24-150', u: '㎥', q: '18' }], nt: '타설 중 슬럼프 · 공기량 시험 2회 — 기준 안. 펌프카 아웃트리거 받침 확인.', nx: '2구간 측구 거푸집 조립' },
  ]
  const 공종 = [
    { id: 'gx1', n: '토공', amt: '182000000', w: '', q: '', u: '', b: '46', s: 날더하기(날들[0], -60), dur: '120' },
    { id: 'gx2', n: '구조물(L형 측구)', amt: '246000000', w: '', q: '1200', u: 'm', b: '380', s: 날더하기(날들[0], -40), dur: '150' },
    { id: 'gx3', n: '포장', amt: '98000000', w: '', q: '', u: '', s: 날더하기(날들[0], 60), dur: '45' },
    { id: 'gx4', n: '부대공', amt: '54000000', w: '', q: '', u: '', s: 날더하기(날들[0], 80), dur: '40' },
  ]
  const 진 = [{ gx1: 2.5, gx2: 0 }, { gx1: 1.5, gx2: 0 }, { gx1: 0, gx2: 36 }]
  날들.forEach((d, i) => { 일[d] = { ...틀[i], 진: 진[i] } })
  return { 현장: { name: '가나지구 배수로 정비공사 (예시)', co: '예시건설(주)' }, 공종, 일 }
}
