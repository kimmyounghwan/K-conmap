/* 🆕 업그레이드 알리기 셈 (G757 · 2026-11-18) — 화면은 고친띠.jsx · 자료 받기는 lib/고친것.js · 시험 node tools/시험_고친것.mjs
 *   (불러오는 것 없음 — node 시험 · PC 올리기 시험이 그대로 부름)
 *
 *   ■ 자료 꼴 — web/public/fixes.json {v, r: [{p, d, m}]} (G222 때 만든 꼴 그대로 · 새것이 맨 앞)
 *       p = 화면 «칸» 주소(lib/마이쓴곳.js 셀 주소와 같은 칸 — /tools/… · /forms/… · /change/… …)
 *       d = 올린 무렵 «YYYY-MM-DD HH:MM»(한국 시각) · m = 무엇이 좋아졌나(이용자 말 · 40자 안)
 */
export const 날수 = 14
const 하루 = 86400e3

/* 칸 주소 — lib/마이쓴곳.js 셀곳과 같은 칸(속 화면 /tools/tuipbi/v/… 는 그 칸 /tools/tuipbi 로) */
const 칸앞 = /^\/(?:tools\/[^/]+|forms\/[^/]+|guide\/[^/]+|(?:change|naeyeok|jeoksan|cad)(?:\/[^/]+)?|safety|pdf|lic)(?=\/|$)/
export function 칸으로(path) {
  const p = String(path || '').split(/[?#]/)[0].replace(/\/+$/, '')
  const m = p.match(칸앞)
  return m ? m[0] : ''
}

/** «YYYY-MM-DD HH:MM»(한국) → ms · 꼴이 틀리면 NaN */
export function 때(d) {
  const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/)
  if (!m) return NaN
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 9, +m[5])
  const 다시 = new Date(t + 9 * 3600e3)   /* 2026-02-30 · 25:00 같은 없는 날 · 시각은 버림 */
  return 다시.getUTCFullYear() === +m[1] && 다시.getUTCMonth() === +m[2] - 1 && 다시.getUTCDate() === +m[3] && 다시.getUTCHours() === +m[4] && 다시.getUTCMinutes() === +m[5] ? t : NaN
}

/** 요즘(14일 안) 고친 줄 — 새것부터. 미리 적은 시각(올린 뒤 배포 무렵)은 «지금 + 하루» 까지 받음 · 꼴이 틀린 줄은 버림 */
export function 요즘(목록, 지금 = Date.now(), 날 = 날수) {
  const r = 목록 && Array.isArray(목록.r) ? 목록.r : Array.isArray(목록) ? 목록 : []
  return r
    .filter((x) => x && typeof x.p === 'string' && 칸으로(x.p) === x.p && typeof x.m === 'string' && x.m.trim())
    .map((x) => ({ p: x.p, d: String(x.d || ''), m: x.m.trim(), t: 때(x.d) }))
    .filter((x) => Number.isFinite(x.t) && x.t <= 지금 + 하루 && 지금 - x.t < 날 * 하루)
    .sort((a, b) => b.t - a.t)
}
/** 이 화면(칸)에 해당하는 요즘 줄 — 새것부터 */
export const 이곳 = (요, path) => { const c = 칸으로(path); return c ? (요 || []).filter((x) => x.p === c) : [] }
/** «UP» 표를 달 칸 주소들 */
export const 표칸 = (요) => new Set((요 || []).map((x) => x.p))

/* ✕ 닫음 — 이 브라우저에만 {«p|d»: 닫은 때} · 30일 지난 것은 정리 */
export const 닫음열쇠 = 'kcm.upg.닫음'
const 줄열쇠 = (x) => `${x.p}|${x.d}`
const 저장소 = () => { try { return globalThis.localStorage || null } catch (e) { return null } }
const 닫음읽기 = () => { try { const o = JSON.parse(저장소().getItem(닫음열쇠) || '{}'); return o && typeof o === 'object' && !Array.isArray(o) ? o : {} } catch (e) { return {} } }
/** 이 줄들 가운데 «맨 위(새것)» 를 닫았나 — 새로 고친 줄이 생기면 다시 보임 */
export const 닫았나 = (줄들) => !!(줄들 && 줄들[0] && 닫음읽기()[줄열쇠(줄들[0])])
/** 그때 보이던 줄을 모두 닫음(같은 화면 옛 줄이 이어서 뜨지 않게) */
export function 닫기(줄들, 지금 = Date.now()) {
  try {
    const o = 닫음읽기()
    for (const x of 줄들 || []) o[줄열쇠(x)] = 지금
    for (const k of Object.keys(o)) if (!(지금 - Number(o[k]) < 30 * 하루)) delete o[k]
    저장소().setItem(닫음열쇠, JSON.stringify(o))
  } catch (e) { /* 개인 창 · 가득 참 — 이 화면에서만 닫힘 */ }
}
