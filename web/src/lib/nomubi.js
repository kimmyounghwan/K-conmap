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
 *   { co, site, ym, P: [{ id, n(이름), j(직종), b(생년월일 — 적은 그대로 · G109), w(일당), nx(늘 빼기 'P'·'H'·'E'·'T'), r(명단에 드는 달 · G162) }],
 *     A: { 'YYYY-MM': { id: { d: { '01': 1, '02': 0.5 … }, ap, ex, o: { it: 0 … }, w(그 달 일당 · G162), nx(그 달 늘 빼기 · G162) } } } }
 *
 * ■ 🗓 G162 (2026-10-06) 맵톡 이용자 건의 「매달 근로자가 바뀌는데 기존 명단에 추가하니 명단은 많아지고 … 필요없는 명단을 지웠더니
 *   그 전달 지급명세서까지 지워져요」 → 소장님 「보완하고 아이디어 더해서, 그리고 추가로 문제가 될 소지가 있는 것 까지 수정하자」
 *   · 명단은 «달마다» — p.r = [[처음달, 끝달(안 듦)], …] (null = 끝없음 · r 없음 = 모든 달 · 옛 자료 그대로). 그 달에 일한 날이 있으면 늘 보임.
 *     «빼기» = 이 달(이 달에 일한 날이 있으면 다음 달)부터 명단에서 빠짐 — 지난달 명세서 · 신고 · 퇴직공제는 그대로(사람 자체는 남음).
 *   · 일당 · 늘 빼기를 고치면 «이 달(과 아직 안 적은 달)» 만 바뀜 — 일한 날이 있는 다른 달은 그 달 값(A[달][id].w · nx)으로 묶어 둠.
 *     (전에는 명단 일당을 고치면 지난달 명세서 금액까지 바뀌었음) 신고 정리 · 보험료 · 퇴직공제도 같은 값을 읽음(lib/신고정리.js 일당 · 늘빼기).
 *   · 이미 지운 사람: 출역(A)은 남아 있으므로 «남은기록» 으로 찾아 되살림(이름 · 일당만 다시 적음).
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

/* ── 🏗 G178 현장별로 나눠 쓰기 (2026-10-07) ─────────────────────────
   맵톡 이용자 건의 「현장별로 나눠서 저장이 가능해야 되는데 그 기능은 없는 것 같아요」 → 소장님 「현장별로 나눠서 쓸 수 있게 해줘」
   · 현장 목록: localStorage 'kcm_nomubi_sites' = {cur 지금 현장, L: [{id, n 이름, at 만든 때, del? 지운 때}]}
   · 현장 자료: 첫 현장(h1)은 예전 자리 'kcm_nomubi1' 그대로(옮기지 않음 · 지금 쓰던 자료가 곧 첫 현장) · 그 밖은 'kcm_nomubi1@{id}'
   · 🔗 이어 쓰기 연결도 현장마다: 첫 현장 'kcm-bk-nm' 그대로 · 그 밖 'kcm-bk-nm@{id}'(서버 자리는 같은 ns 'nm' — 코드가 다름)
   · 읽기() · 쓰기() 는 «지금 현장» — 신고 정리 · 퇴직공제 · 보험료 · 작업일보도 고른 현장을 읽습니다.
     계산기 화면은 현장을 정해 두고(읽기현장 · 쓰기현장) 씁니다 — 현장을 바꾸는 사이 늦게 끝난 저장이 다른 현장에 들어가지 않게. */
export const 현장목록열쇠 = 'kcm_nomubi_sites'
export const 첫현장 = 'h1'
export const 현장자료열쇠 = (id) => (!id || id === 첫현장 ? 열쇠 : `${열쇠}@${id}`)
export const 현장연결자리 = (id) => (!id || id === 첫현장 ? 'nm' : `nm@${id}`)
export const 현장백업열쇠 = (id) => (!id || id === 첫현장 ? 'kcm_nomubi1_전' : `kcm_nomubi1_전@${id}`)

export function 현장목록() {
  try {
    const m = JSON.parse(localStorage.getItem(현장목록열쇠) || 'null')
    if (m && Array.isArray(m.L) && m.L.some((x) => x && x.id === 첫현장)) {
      const L = m.L.filter((x) => x && typeof x.id === 'string' && /^h[0-9a-z]{1,16}$/.test(x.id))
      const 산 = L.filter((x) => !x.del)
      const cur = 산.some((x) => x.id === m.cur) ? m.cur : (산[0] || L[0]).id
      return { cur, L }
    }
  } catch (e) { /* 막힘 · 깨짐 — 첫 현장 하나로 */ }
  return { cur: 첫현장, L: [{ id: 첫현장, n: '', at: 0 }] }
}
export function 현장목록쓰기(m) {
  try { localStorage.setItem(현장목록열쇠, JSON.stringify(m)); return true } catch (e) { return false }
}
export const 지금현장 = () => 현장목록().cur

export function 읽기현장(id) {
  try {
    const s = JSON.parse(localStorage.getItem(현장자료열쇠(id)) || 'null')
    if (s && Array.isArray(s.P) && s.A && typeof s.A === 'object') return { ...빈것(), ...s }
  } catch (e) { /* 막힌 브라우저 · 깨진 값 — 빈 것으로 */ }
  return 빈것()
}
export function 쓰기현장(id, s) {
  try { localStorage.setItem(현장자료열쇠(id), JSON.stringify(s)); return true } catch (e) { return false }
}
export function 읽기() { return 읽기현장(지금현장()) }
export function 쓰기(s) { return 쓰기현장(지금현장(), s) }

/** 목록에 보일 이름 — 그 현장 자료의 현장명 → 만들 때 적은 이름 → «현장 N» */
export function 현장이름(x, i) {
  let s = ''
  try { s = String((JSON.parse(localStorage.getItem(현장자료열쇠(x.id)) || 'null') || {}).site || '').trim() } catch (e) { /* 없음 */ }
  return s || String(x.n || '').trim() || `현장 ${i + 1}`
}
export const 새현장번호 = () => 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)

/** 지금 보는 달 명단(이름 · 직종 · 생년월일 · 그 달 일당 · 늘 빼기)만 새 현장으로 — 출역 · 기록은 안 가져감 */
export function 명단만(st, ym) {
  return (st.P || []).filter((p) => 보임(st, p, ym)).map((p) => ({
    id: 새번호(), n: p.n || '', j: p.j || '', b: p.b || '', w: 그달일당(st, ym, p), nx: 그달빼기(st, ym, p),
  }))
}
/** 새 현장 만들기 → 새 목록(지금 현장으로) · 자료도 써 둠 */
export function 현장더하기(m, 이름, 앞st, 가져옴) {
  const id = 새현장번호()
  const ym = (앞st && 앞st.ym) || 이번달()
  const st = { ...빈것(), ym, site: String(이름 || '').trim().slice(0, 60), co: (앞st && 앞st.co) || '', P: 앞st && 가져옴 ? 명단만(앞st, ym) : [] }
  쓰기현장(id, st)
  return { m: { cur: id, L: [...m.L, { id, n: st.site, at: Date.now() }] }, id, st }
}
/** 지우기 — 목록에서만 빼고 자료는 둠(되살리기) · 하나 남은 현장은 못 지움 */
export function 현장지우기(m, id) {
  const 산 = m.L.filter((x) => !x.del)
  if (산.length <= 1 || !산.some((x) => x.id === id)) return m
  const L = m.L.map((x) => (x.id === id ? { ...x, del: Date.now() } : x))
  const 남 = L.filter((x) => !x.del)
  return { cur: m.cur === id ? 남[0].id : m.cur, L }
}
export function 현장되살리기(m, id) {
  return { cur: id, L: m.L.map((x) => { if (x.id !== id) return x; const y = { ...x }; delete y.del; return y }) }
}

export const 새번호 = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

/* ── 🗓 G162 달마다 명단 ─────────────────────────────────────────── */
/** 그 달에 일한 날(공수 > 0)이 있나 */
export function 일한날있음(st, ym, id) {
  const d = (((st.A || {})[ym] || {})[id] || {}).d || {}
  return Object.values(d).some((g) => Number(g) > 0)
}
/** 그 사람이 일한 달들(오래된 것부터) */
export function 일한달(st, id) {
  return Object.keys(st.A || {}).filter((m) => /^\d{4}-\d{2}$/.test(m) && 일한날있음(st, m, id)).sort()
}
const 안 = (r, ym) => !r || r.some(([a, b]) => (a == null || a <= ym) && (b == null || ym < b))
/** 범위 정리 — 겹치거나 맞닿으면 합침 · 모든 달이면 undefined */
export function 범위정리(r) {
  if (!r) return undefined
  const L = r.filter((x) => Array.isArray(x) && (x[0] == null || x[1] == null || x[0] < x[1]))
    .map(([a, b]) => [a ?? null, b ?? null]).sort((x, y) => (x[0] == null ? -1 : y[0] == null ? 1 : x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0))
  const 합 = []
  for (const x of L) {
    const 끝 = 합[합.length - 1]
    if (끝 && (끝[1] == null || (x[0] != null && x[0] <= 끝[1]) || x[0] == null)) { if (끝[1] != null && (x[1] == null || x[1] > 끝[1])) 끝[1] = x[1] }
    else 합.push([...x])
  }
  if (합.length === 1 && 합[0][0] == null && 합[0][1] == null) return undefined
  return 합
}
/** 그 달부터 끝까지 뺌 */
export function 범위빼기(r, 부터) {
  const L = r || [[null, null]]
  return L.filter(([a]) => a == null || a < 부터).map(([a, b]) => [a, b == null || b > 부터 ? 부터 : b])
}
/** 그 달부터 끝까지 넣음 */
export const 범위넣기 = (r, 부터) => 범위정리([...(r || [[null, null]]), [부터, null]])
/** 그 달 명단에 보이나 — 범위 안이거나 그 달에 일한 날이 있으면 */
export const 보임 = (st, p, ym) => 안(p.r, ym) || 일한날있음(st, ym, p.id)
/** 명단에서 빼기 — 이 달에 일한 날이 있으면 다음 달부터. { st, 부터 } */
export function 명단빼기(st, ym, id) {
  const 부터 = 일한날있음(st, ym, id) ? 달더하기(ym, 1) : ym
  return { st: { ...st, P: st.P.map((p) => (p.id === id ? { ...p, r: 범위빼기(p.r, 부터) } : p)) }, 부터 }
}
export const 명단넣기 = (st, ym, id) => ({ ...st, P: st.P.map((p) => (p.id === id ? { ...p, r: 범위넣기(p.r, ym) } : p)) })
/** 완전히 지우기 — 사람과 모든 달 출역 */
export function 완전히지우기(st, id) {
  const A = {}
  for (const [m, 사람들] of Object.entries(st.A || {})) { const x = { ...(사람들 || {}) }; delete x[id]; A[m] = x }
  return { ...st, P: st.P.filter((p) => p.id !== id), A }
}
/** 지운 사람의 남은 출역 — 명단(P)에 없는 번호 중 일한 날이 있는 것 [{ id, 달들, 일수, 공수 }] */
export function 남은기록(st) {
  const 있음 = new Set((st.P || []).map((p) => p.id))
  const m = new Map()
  for (const [ym, 사람들] of Object.entries(st.A || {})) {
    if (!/^\d{4}-\d{2}$/.test(ym)) continue
    for (const [id, a] of Object.entries(사람들 || {})) {
      if (있음.has(id) || !a || !a.d) continue
      const g = Object.values(a.d).map(Number).filter((x) => x > 0)
      if (!g.length) continue
      const x = m.get(id) || { id, 달들: [], 일수: 0, 공수: 0, w: 0 }
      x.달들.push(ym); x.일수 += g.length; x.공수 += g.reduce((s, v) => s + v, 0)
      if (a.w) x.w = Number(a.w) || x.w
      m.set(id, x)
    }
  }
  return [...m.values()].map((x) => ({ ...x, 달들: x.달들.sort(), 공수: Math.round(x.공수 * 100) / 100 })).sort((a, b) => (a.달들[a.달들.length - 1] < b.달들[b.달들.length - 1] ? 1 : -1))
}
/** 되살리기 — 이름 · 일당은 비워 두고(다시 적음) 일한 달에만 명단에 듦 */
export function 되살리기(st, x) {
  const 끝 = x.달들[x.달들.length - 1]
  return { ...st, P: [...st.P, { id: x.id, n: '', j: '', b: '', w: x.w || 0, nx: '', r: [[x.달들[0], 달더하기(끝, 1)]] }] }
}
/** 버리기 — 지운 사람의 남은 출역을 정말 지움 */
export function 남은기록버리기(st, id) { return 완전히지우기(st, id) }

/* ── 💰 G162 달마다 일당 · 늘 빼기 ── */
/** 그 달 값 — 그 달에 묶어 둔 값(A[달][id].w · nx)이 있으면 그것, 없으면 명단 값 */
export const 달마다 = (p, a, k) => (a && a[k] != null && !(k === 'w' && a[k] === '') ? a[k] : p[k])   /* nx 의 '' 는 «그 달은 안 뺌» 으로 묶은 값 */
export const 그달일당 = (st, ym, p) => Math.max(0, Number(달마다(p, (((st.A || {})[ym] || {})[p.id]), 'w')) || 0)
export const 그달빼기 = (st, ym, p) => String(달마다(p, (((st.A || {})[ym] || {})[p.id]), 'nx') || '')
/**
 * 일당(w) · 늘 빼기(nx) 고치기 — 이 달(과 아직 안 적은 달)만 바뀜.
 * 일한 날이 있는 다른 달은 지금 값을 그 달에 묶어 둡니다(지난달 명세서가 안 바뀌게).
 */
export function 달값고침(st, ym, id, k, v) {
  const p = (st.P || []).find((x) => x.id === id)
  if (!p) return st
  const A = { ...(st.A || {}) }
  for (const m of Object.keys(A)) {
    if (m === ym || !/^\d{4}-\d{2}$/.test(m)) continue
    const a = (A[m] || {})[id]
    if (!a || !일한날있음(st, m, id) || (a[k] != null && !(k === 'w' && a[k] === ''))) continue
    A[m] = { ...A[m], [id]: { ...a, [k]: p[k] ?? (k === 'w' ? 0 : '') } }
  }
  const 이달 = (A[ym] || {})[id]
  if (이달 && 이달[k] != null) { const x = { ...이달 }; delete x[k]; A[ym] = { ...A[ym], [id]: x } }
  return { ...st, A, P: st.P.map((x) => (x.id === id ? { ...x, [k]: v } : x)) }
}
/** 다른 달 값(일한 날이 있는 달만) — 이 달과 다른 것 [{ ym, v }] */
export function 다른달값(st, ym, p, k) {
  const 지금 = String(k === 'w' ? 그달일당(st, ym, p) : 그달빼기(st, ym, p))
  return 일한달(st, p.id).filter((m) => m !== ym).map((m) => ({ ym: m, v: k === 'w' ? 그달일당(st, m, p) : 그달빼기(st, m, p) }))
    .filter((x) => String(x.v) !== 지금)
}

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
    const w = Math.max(0, Number(달마다(p, a, 'w')) || 0)   /* 💰 G162 그 달 일당 */
    const 공수 = 공수들(st, ym, p.id)
    const 날돈 = 공수.filter((g) => g > 0).map((g) => Math.round(g * w))
    if (!날돈.length) continue
    const 모음 = 출역모으기(st.A, p.id, (m, x) => 달마다(p, x, 'w'))   /* 🐞 G162 — 전엔 모든 달을 이 달 일당으로 셈(220만 기준이 어긋날 수 있음) */
    const 판 = 판단(모음, { 생일: p.b || '' })   /* 🎂 G109 생년월일 → 만 60세 연금 · 만 65세 고용(실업급여) 저절로 */
    const 자동 = 공제셈(ym, 날돈, String(달마다(p, a, 'nx') || ''), { ap: a.ap, ex: a.ex }, 달규칙(판, ym))
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
