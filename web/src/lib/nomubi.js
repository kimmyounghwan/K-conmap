/**
 * 👷 일용 노무비 계산기 · 지급명세서 — 셈 (G104 · 2026-10-01)
 *
 * 소장님: 「인터넷 싹 다 뒤져서 … 서식 검색량 많은 것 사이트에 올리자. 프로그램화 해서」
 *   → 예스폼 조회 «일용노무비·급여(소득세·4대보험)» 103만 (2등) → 고르심 «일용 노무비 계산·지급명세서»
 *
 * ■ 공제는 lib/gongje.js 하나만 씁니다(투입비 도구와 같은 셈 · 같은 요율 · 같은 근거).
 *   여기서는 «이 브라우저에 적은 명단 · 출역» 을 그 셈에 넣는 일만 합니다.
 * ■ 2026-10-01 (G107) 국민연금 · 건강보험 «대상» 은 lib/ilyong4.js 판단(여러 달을 봄)으로 — 소장님 「일용노무비랑 연결할 수 있어?」
 *   건강은 첫 근로일부터 1개월(Ⓐ) · 보험료는 취득한 달의 다음 달부터(1일 취득은 그 달부터) · 연금은 달 단위(2025.7~).
 *   ⚠️ 이 브라우저에 적은 달만 봅니다(앞 달 출역을 안 적었으면 첫 근로일을 늦게 봄).
 * ■ 2026-10-01 (G109) 생년월일(앞 6자리) — 소장님 「나이를 넣게 하고, 4대 보험은 자동으로 계산이 되게 해줘」
 *   만 60세가 된 다음 날부터 국민연금 대상 아님 · 만 65세부터 일한 날은 고용보험 실업급여 몫 없음(65세 이후 새로 고용) — lib/ilyong4.js
 * ■ 저장: 이 브라우저(localStorage) 한 곳 — 서버에 안 보냅니다. 주민번호 뒷자리 · 계좌는 받지 않습니다.
 *
 * 저장 모양(v1)
 *   { co, site, ym, P: [{ id, n(이름), j(직종), b(생년월일 — 적은 그대로 · G109), w(일당), nx(늘 빼기 'P'·'H'·'E'·'T') }],
 *     A: { 'YYYY-MM': { id: { d: { '01': 1, '02': 0.5 … }, ap, ex, o: { it: 0 … } } } } }
 */
import { 공제셈, 공제합치기, 공제칸 } from './gongje.js'
import { 판단, 출역모으기, 달규칙 } from './ilyong4.js'

export const 열쇠 = 'kcm_nomubi1'
export const 공수차례 = [1, 0.5, 1.5, 0]
const 두자 = (n) => String(n).padStart(2, '0')
export const 달날수 = (ym) => new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0).getDate()
export const 요일 = (ym, d) => '일월화수목금토'[new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, d).getDay()]
export const 달더하기 = (ym, n) => {
  const t = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1 + n, 1)
  return `${t.getFullYear()}-${두자(t.getMonth() + 1)}`
}
export const 이번달 = () => { const t = new Date(); return `${t.getFullYear()}-${두자(t.getMonth() + 1)}` }
export const 원 = (n) => Math.round(n || 0).toLocaleString('ko-KR')
export const 공수글 = (g) => (g === 1 ? '1' : String(Math.round(g * 100) / 100))

export function 빈것() {
  return { co: '', site: '', ym: 이번달(), P: [], A: {} }
}

export function 읽기() {
  try {
    const s = JSON.parse(localStorage.getItem(열쇠) || 'null')
    if (s && Array.isArray(s.P) && s.A && typeof s.A === 'object') return { ...빈것(), ...s }
  } catch (e) { /* 막힌 브라우저 · 깨진 값 — 빈 것으로 */ }
  return 빈것()
}

export function 쓰기(s) {
  try { localStorage.setItem(열쇠, JSON.stringify(s)); return true } catch (e) { return false }
}

export const 새번호 = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

/** 그 달 한 사람 공수 배열(1일~말일) */
export function 공수들(st, ym, id) {
  const n = 달날수(ym)
  const d = (((st.A || {})[ym] || {})[id] || {}).d || {}
  return Array.from({ length: n }, (_, i) => Number(d[두자(i + 1)]) || 0)
}

/** 그 달 지급명세 — 줄마다 공수 · 보수 · 자동 공제 · 고친 값 · 최종 */
export function 달셈(st, ym) {
  const 날수 = 달날수(ym)
  const 줄 = []
  for (const p of st.P || []) {
    const a = (((st.A || {})[ym] || {})[p.id]) || {}
    const w = Math.max(0, Number(p.w) || 0)
    const 공수 = 공수들(st, ym, p.id)
    const 날돈 = 공수.filter((g) => g > 0).map((g) => Math.round(g * w))
    if (!날돈.length) continue
    const 모음 = 출역모으기(st.A, p.id, () => w)
    const 판 = 판단(모음, { 생일: p.b || '' })   /* 🎂 G109 생년월일 → 만 60세 연금 · 만 65세 고용(실업급여) 저절로 */
    const 자동 = 공제셈(ym, 날돈, p.nx || '', { ap: a.ap, ex: a.ex }, 달규칙(판, ym))
    const 최종 = 공제합치기(자동, a.o)
    줄.push({ id: p.id, p, w, 공수, 공수합: 공수.reduce((s, g) => s + g, 0), 일수: 자동.일수, 보수: 자동.보수,
      자동, 최종, 고침: a.o || {}, 대상: 자동.대상, ap: a.ap || '', ex: a.ex || '', 모음,
      날들: 공수.map((g, i) => (g > 0 ? i + 1 : 0)).filter(Boolean) })
  }
  const 합계 = { 인원: 줄.length, 공수: 0, 일수: 0, 보수: 0, 합: 0, 차인: 0, ...Object.fromEntries(공제칸.map((c) => [c.k, 0])),
    대상수: { P: 0, H: 0, E: 0 } }
  const 날합 = Array(날수).fill(0)
  for (const r of 줄) {
    합계.공수 += r.공수합; 합계.일수 += r.일수; 합계.보수 += r.보수; 합계.합 += r.최종.합; 합계.차인 += r.최종.차인
    for (const c of 공제칸) 합계[c.k] += r.최종[c.k]
    for (const c of ['P', 'H', 'E']) if (r.대상[c].대상) 합계.대상수[c]++
    r.공수.forEach((g, i) => { if (g > 0) 날합[i] += 1 })
  }
  const R0 = 줄.length ? 줄[0].자동 : 공제셈(ym, [])
  return { ym, 날수, 줄, 합계, 날합, 요율해: R0.요율해, 요율없음: R0.요율없음, 잠정: R0.잠정 || [] }
}

/** 출역 한 칸 바꾸기 (불변) */
export function 칸바꿈(st, ym, id, dd, g) {
  const A = { ...(st.A || {}) }
  const 달 = { ...(A[ym] || {}) }
  const a = { ...(달[id] || {}) }
  const d = { ...(a.d || {}) }
  if (g > 0) d[dd] = g; else delete d[dd]
  a.d = d
  달[id] = a
  A[ym] = 달
  return { ...st, A }
}

/** 한 사람 그 달 출역을 통째로 (일요일 빼고 모두 1 / 모두 지움) */
export function 줄채움(st, ym, id, 채움) {
  const n = 달날수(ym)
  const d = {}
  if (채움) for (let i = 1; i <= n; i++) if (요일(ym, i) !== '일') d[두자(i)] = 1
  const A = { ...(st.A || {}) }
  const 달 = { ...(A[ym] || {}) }
  달[id] = { ...(달[id] || {}), d }
  A[ym] = 달
  return { ...st, A }
}

/** 그 달 한 사람의 ap/ex/o 고치기 */
export function 달값(st, ym, id, 고침) {
  const A = { ...(st.A || {}) }
  const 달 = { ...(A[ym] || {}) }
  달[id] = { ...(달[id] || {}), ...고침 }
  A[ym] = 달
  return { ...st, A }
}

/** 처음 쓰는 분을 위한 예시 — 지어낸 이름 · 일당 */
export function 예시(ym = 이번달()) {
  const P = [
    { id: 'e1', n: '가나다', j: '보통인부', w: 170000, nx: '' },
    { id: 'e2', n: '라마바', j: '형틀목공', w: 260000, nx: '' },
    { id: 'e3', n: '사아자', j: '철근공', w: 250000, nx: '' },
    { id: 'e4', n: '차카타', j: '보통인부', b: '581105', w: 170000, nx: '' },   /* 🎂 만 65세 넘음 → 고용 실업급여 저절로 ✕ (G109) */
    { id: 'e5', n: '파하가', j: '형틀목공', b: '660203', w: 260000, nx: '' },   /* 🎂 만 60세 넘음 → 가나다와 같이 일해도 연금 저절로 ✕ */
  ]
  let st = { co: '예시건설(주)', site: '가나지구 배수로 정비공사', ym, P, A: {} }
  const n = 달날수(ym)
  const 일 = (i) => 요일(ym, i) === '일'
  for (let i = 1; i <= n; i++) {
    if (일(i)) continue
    st = 칸바꿈(st, ym, 'e1', 두자(i), 1)
    st = 칸바꿈(st, ym, 'e5', 두자(i), 1)
    if (i <= 20) st = 칸바꿈(st, ym, 'e2', 두자(i), i % 6 === 0 ? 0.5 : 1)
    if (i >= 10 && i <= 16) st = 칸바꿈(st, ym, 'e3', 두자(i), 1)
    if (i % 9 === 0) st = 칸바꿈(st, ym, 'e4', 두자(i), 1)
  }
  return st
}
