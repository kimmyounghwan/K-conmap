/* 📰 G696 (2026-11-16) 오늘의 건설 뉴스 — 자료 읽기 · 날짜 글 · 띠에 올릴 줄 고르기
 *   소장님 「뉴스레터 형식으로 건설맵에 띄우고 싶어. 메일 전송은 나중에 하더라도 이용자가 볼 수 있게..」 「이야기 거리가 되잖아」
 *          → 「뉴스 요약본으로」 → 갈래 셋 «사건 사고 위주로» · «정책변경하고» · «정보 뉴스» → 「매일로 해야지」 → 자리 넷 → 「화면 배열시 이상하지 않게 해줘」
 *   ■ 자료: public/newsd/latest.json(가장 최근 하루) · public/newsd/{YYYY-MM-DD}.json(그날) · public/newsd/list.json(날짜 목록)
 *     (firebase.json «/newsd/**» — 5분 캐시 · noindex. /data/** 는 하루 캐시라 따로 둠)
 *   ■ 한 꼭지 = { c: '사고' | '정책' | '정보', t: 제목, s: 요약(2~3줄 — 우리 말로 다시 씀 · 기사 글 옮기지 않음), k: 현장에선?(한두 줄),
 *               kk: 짧은 현장 말(띠 · 맵톡 줄 끝 — 없어도 됨), m: 매체, md: 기사 날짜, u: 원문 주소(https) }
 *   ■ 사고는 업체 · 사람 이름을 안 씀 · 숫자 · 날짜는 원문(보도자료)과 맞춰 봄 · 사진 안 씀(쓰는 쪽 규칙 — CLAUDE.md G696)
 */

export const 갈래들 = ['사고', '정책', '정보']
export const 갈래이름 = { 사고: '사건 · 사고', 정책: '정책 변경', 정보: '정보' }
export const 갈래그림 = { 사고: '⚠️', 정책: '📜', 정보: '💡' }
/** 갈래 → 화면 칸 이름 꼬리(영문 — styles.css .kn-a · .nw-a …) */
export const 갈래표 = { 사고: 'a', 정책: 'p', 정보: 'i' }
const 날꼴 = /^\d{4}-\d{2}-\d{2}$/
const 요일 = ['일', '월', '화', '수', '목', '금', '토']

/** 'YYYY-MM-DD' 가 진짜 날짜인가(2026-02-30 같은 것은 아님) */
export function 날인가(d) {
  if (!날꼴.test(String(d || ''))) return false
  const [y, m, dd] = d.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, dd))
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === dd
}

/** '2026-11-16' → '11. 16.(월)' · 긴꼴이면 '2026. 11. 16.(월)' */
export function 날글(d, 긴꼴 = false) {
  if (!날인가(d)) return ''
  const [y, m, dd] = d.split('-').map(Number)
  const w = 요일[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()]
  return `${긴꼴 ? y + '. ' : ''}${m}. ${dd}.(${w})`
}

/** 한국 날짜 오늘(YYYY-MM-DD) — 기기 시간대와 상관없이 */
export const 한국오늘 = (지금 = Date.now()) => new Date(지금 + 9 * 3600000).toISOString().slice(0, 10)

/** 두 날짜 사이 날 수(b - a) */
export function 날차(a, b) {
  if (!날인가(a) || !날인가(b)) return NaN
  const f = (s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d) }
  return Math.round((f(b) - f(a)) / 86400000)
}

/** 띠에 올려도 될 만큼 새것인가 — 오늘 · 어제 것만(자동 갱신이 멈춰도 옛 뉴스를 «오늘의 뉴스» 로 걸지 않게) */
export const 싱싱한가 = (d, 오늘 = 한국오늘()) => { const n = 날차(d, 오늘); return n >= 0 && n <= 1 }

const 글 = (x, 길이) => (typeof x === 'string' ? x.replace(/\s+/g, ' ').trim().slice(0, 길이) : '')
const 주소인가 = (u) => /^https?:\/\/[^\s"'<>]+$/i.test(String(u || ''))

/** 한 날 자료 풀기 — 꼴이 틀린 꼭지는 뺌 · 다 틀리면 null */
export function 뉴스풀기(j) {
  if (!j || typeof j !== 'object' || !날인가(j.d) || !Array.isArray(j.items)) return null
  const items = []
  for (const x of j.items) {
    if (!x || typeof x !== 'object' || !갈래들.includes(x.c)) continue
    const t = 글(x.t, 90)
    if (!t) continue
    items.push({
      c: x.c, t, s: 글(x.s, 320), k: 글(x.k, 220), kk: 글(x.kk, 40), m: 글(x.m, 30),
      md: 날인가(x.md) ? x.md : '', u: 주소인가(x.u) ? x.u : '',
    })
  }
  if (!items.length) return null
  /* 갈래 차례(사고 → 정책 → 정보) · 같은 갈래 안은 적힌 차례 그대로 */
  items.sort((a, b) => 갈래들.indexOf(a.c) - 갈래들.indexOf(b.c))
  return { d: j.d, items }
}

/** 날짜 목록 풀기 — [[날, 꼭지 수], …] 새것부터 */
export function 목록풀기(j) {
  const a = j && Array.isArray(j.days) ? j.days : []
  return a.filter((x) => Array.isArray(x) && 날인가(x[0])).map((x) => [x[0], Number(x[1]) || 0])
    .sort((p, q) => (p[0] < q[0] ? 1 : p[0] > q[0] ? -1 : 0))
}

/** 띠 두 줄에 올릴 꼭지 — 갈래마다 맨 앞 하나씩(사고 · 정책 · 정보) · 빈 갈래는 남은 꼭지로 채움 · 최대 셋 */
export function 띠줄(items) {
  const a = Array.isArray(items) ? items : []
  const 고름 = []
  for (const c of 갈래들) { const x = a.find((y) => y.c === c); if (x) 고름.push(x) }
  for (const x of a) { if (고름.length >= 3) break; if (!고름.includes(x)) 고름.push(x) }
  return 고름.slice(0, 3)
}

/** 갈래마다 묶기 — [[갈래, [꼭지…]], …] (꼭지 있는 갈래만) */
export const 갈래묶기 = (items) => 갈래들.map((c) => [c, (items || []).filter((x) => x.c === c)]).filter(([, a]) => a.length)

/* 받기 — 앱이 뜰 때 한 번(최근 하루) · 못 받으면 false · 화면(뉴스 쪽)은 날마다 따로 받음 */
let 최근 = null, 받는중 = null
export const 뉴스자료 = () => 최근
export function 뉴스받기() {
  if (최근 !== null) return Promise.resolve(최근)
  if (!받는중) {
    받는중 = Promise.race([
      fetch('/newsd/latest.json').then((r) => (r.ok ? r.json() : null)),
      new Promise((res) => setTimeout(() => res(undefined), 8000)),   // 8초 안에 안 오면 이번엔 안 그림(빈 틀을 오래 두지 않게)
    ])
      .then((j) => { 최근 = j === undefined ? false : (뉴스풀기(j) || false); return 최근 })
      .catch(() => { 최근 = false; return 최근 })
  }
  return 받는중
}

/** 그날(또는 최근) 자료 · 날짜 목록 — 뉴스 쪽에서 */
export async function 날뉴스받기(d) {
  try {
    const r = await fetch(d ? `/newsd/${d}.json` : '/newsd/latest.json')
    if (!r.ok) return false
    return 뉴스풀기(await r.json()) || false
  } catch (e) { return false }
}
export async function 목록받기() {
  try {
    const r = await fetch('/newsd/list.json')
    if (!r.ok) return []
    return 목록풀기(await r.json())
  } catch (e) { return [] }
}
