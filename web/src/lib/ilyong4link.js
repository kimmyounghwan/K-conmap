/**
 * 🔗 4대보험 판단기 «결과 링크» (G122 · 2026-10-03)
 *   소장님: 「사이트 계산기 최대한 계산하기 편하게 해줘. 이용자 입장에서」 → «결과 링크 보내기» 고름
 *
 * ■ 넣은 날짜 · 일당 · 달마다 받은 돈 · 다른 현장 · 체크만 주소(?c=)에 담습니다 — 이름 · 생년월일은 안 담음(개인정보).
 * ■ 꼴: JSON(짧은 열쇠) → UTF-8 → base64url. 주소에 쓰는 글자는 A-Z a-z 0-9 - _ 뿐이라 카톡 · 카페에서 링크가 끊기지 않습니다.
 *     { v:1, w:일당, s:'YYYY-MM'(보이는 첫 달), n:달수, d:{ 'YYYY-MM': '1-5,8,10-11' }, m:{ ym: 받은 돈 }, o:{ ym: [일, 돈, 가입 0/1] }, x:'cae…', g:규모, i:0(산재 뺌),
 *       h:[[일당, { ym: '1-5' }], …](G125 날짜로 넣은 다른 현장 · 5곳까지 · 현장 이름은 안 담음) }
 * ■ 읽을 때는 남이 만든 주소일 수 있으니 하나하나 따져서(날짜 꼴 · 개수 · 금액 범위) 맞는 것만 받습니다.
 * ■ 셈 없음 — 화면 상태만 오갑니다(셈은 lib/ilyong4.js 그대로).
 */

import { 회사규모들 } from './해마다.js'

const 두자 = (n) => String(n).padStart(2, '0')
const 달꼴 = /^(\d{4})-(0[1-9]|1[0-2])$/
const 날꼴 = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const 돈위 = 10_000_000_000      // 한 달 100억 원 넘게는 안 받음(잘못 들어온 값)
const 일위 = 31
/** 체크 열쇠 ↔ 한 글자 */
const 깃발 = [['계약', 'c'], ['연금취득달', 'a'], ['연금제외', 'p'], ['고용65', 'e'], ['계속65', 'k'], ['사업주', 'b']]
const 규모들 = 회사규모들.map((x) => x.k)   // 해마다.js 와 같은 열쇠(모르는 값은 버림)

function b64url(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function unb64url(s) {
  const t = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(t + '==='.slice((t.length + 3) % 4))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}
const 달날수 = (ym) => new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0).getDate()
const 수 = (v, 위) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 && n <= 위 ? n : null }

/** [1,2,3,5,8,9] → '1-3,5,8-9' */
export function 날묶기(days) {
  const a = [...new Set(days)].sort((x, y) => x - y)
  const out = []
  for (let i = 0; i < a.length; i++) {
    let j = i
    while (j + 1 < a.length && a[j + 1] === a[j] + 1) j++
    out.push(j > i ? `${a[i]}-${a[j]}` : String(a[i]))
    i = j
  }
  return out.join(',')
}
/** '1-3,5' → [1,2,3,5] (그 달에 없는 날 · 이상한 꼴은 null) */
export function 날풀기(글, ym) {
  if (typeof 글 !== 'string' || !/^[\d,-]{1,200}$/.test(글)) return null
  const 끝날 = 달날수(ym)
  const out = []
  for (const 조각 of 글.split(',')) {
    const m = /^(\d{1,2})(?:-(\d{1,2}))?$/.exec(조각)
    if (!m) return null
    const a = Number(m[1]), b = m[2] ? Number(m[2]) : a
    if (a < 1 || b > 끝날 || b < a) return null
    for (let d = a; d <= b; d++) out.push(d)
  }
  return out
}

/** 화면 상태 → 주소 꼬리(?c= 뒤) */
export function 링크만들기(st) {
  const d = {}
  for (const ds of st.날 || []) {
    if (!날꼴.test(ds)) continue
    const ym = ds.slice(0, 7);
    (d[ym] = d[ym] || []).push(Number(ds.slice(8, 10)))
  }
  const o = { v: 1 }
  if (Number(st.일당)) o.w = Number(st.일당)
  if (st.시작 && 달꼴.test(st.시작)) o.s = st.시작
  if (st.달수) o.n = Number(st.달수)
  if (Object.keys(d).length) o.d = Object.fromEntries(Object.entries(d).map(([ym, a]) => [ym, 날묶기(a)]))
  const m = {}
  for (const [ym, v] of Object.entries(st.달돈 || {})) if (v !== '' && v !== undefined && 달꼴.test(ym)) m[ym] = Number(v) || 0
  if (Object.keys(m).length) o.m = m
  const 다 = {}
  for (const [ym, x] of Object.entries(st.다른 || {})) {
    if (!x || !달꼴.test(ym) || !(Number(x.일) || Number(x.돈) || x.가입)) continue
    다[ym] = [Number(x.일) || 0, Number(x.돈) || 0, x.가입 ? 1 : 0]
  }
  if (Object.keys(다).length) o.o = 다
  const h = []
  for (const x of (st.현장들 || []).slice(0, 5)) {
    const hd = {}
    for (const ds of (x && x.날) || []) if (날꼴.test(ds)) (hd[ds.slice(0, 7)] = hd[ds.slice(0, 7)] || []).push(Number(ds.slice(8, 10)))
    if (Object.keys(hd).length) h.push([Number(x.일당) || 0, Object.fromEntries(Object.entries(hd).map(([ym, a]) => [ym, 날묶기(a)]))])
  }
  if (h.length) o.h = h
  const 옵 = st.옵션 || {}
  const x = 깃발.filter(([k]) => 옵[k]).map(([, c]) => c).join('')
  if (x) o.x = x
  if (옵.규모 && 규모들.includes(옵.규모) && 옵.규모 !== 's') o.g = 옵.규모
  if (옵.산재 === false) o.i = 0
  return b64url(JSON.stringify(o))
}

/** 주소 꼬리 → 화면 상태 일부({ 일당, 시작, 달수, 날, 달돈, 다른, 옵션 }) · 못 읽으면 null */
export function 링크읽기(c) {
  if (typeof c !== 'string' || !/^[A-Za-z0-9_-]{4,4000}$/.test(c)) return null
  let o
  try { o = JSON.parse(unb64url(c)) } catch (e) { return null }
  if (!o || typeof o !== 'object' || o.v !== 1) return null
  const 날 = []
  if (o.d && typeof o.d === 'object') {
    for (const [ym, 글] of Object.entries(o.d)) {
      if (!달꼴.test(ym)) return null
      const a = 날풀기(글, ym)
      if (!a) return null
      for (const n of a) 날.push(`${ym}-${두자(n)}`)
    }
  }
  if (날.length > 400) return null
  날.sort()
  const 달돈 = {}
  if (o.m && typeof o.m === 'object') for (const [ym, v] of Object.entries(o.m)) { const n = 수(v, 돈위); if (달꼴.test(ym) && n !== null) 달돈[ym] = n }
  const 다른 = {}
  if (o.o && typeof o.o === 'object') {
    for (const [ym, a] of Object.entries(o.o)) {
      if (!달꼴.test(ym) || !Array.isArray(a)) continue
      const 일 = 수(a[0], 일위), 돈 = 수(a[1], 돈위)
      if (일 === null || 돈 === null) continue
      다른[ym] = { 일: 일 || '', 돈: 돈 || '', 가입: a[2] === 1 }
    }
  }
  const 현장들 = []
  if (Array.isArray(o.h)) {
    for (const a of o.h.slice(0, 5)) {
      if (!Array.isArray(a) || !a[1] || typeof a[1] !== 'object') continue
      const 날들 = []
      for (const [ym, 글] of Object.entries(a[1])) {
        const ds = 달꼴.test(ym) ? 날풀기(글, ym) : null
        if (ds) for (const n of ds) 날들.push(`${ym}-${두자(n)}`)
      }
      if (날들.length && 날들.length <= 400) 현장들.push({ 이름: '', 일당: 수(a[0], 돈위) || '', 날: 날들.sort() })
    }
  }
  const 옵션 = {}
  if (typeof o.x === 'string') for (const [k, ch] of 깃발) if (o.x.includes(ch)) 옵션[k] = true
  if (typeof o.g === 'string' && 규모들.includes(o.g)) 옵션.규모 = o.g
  if (o.i === 0) 옵션.산재 = false
  const 일당 = 수(o.w, 돈위) || ''
  /* 보이는 달: 주소에 있으면 그대로(날이 그 안에 들도록 넓힘) · 없으면 첫 날의 달부터 */
  let 시작 = typeof o.s === 'string' && 달꼴.test(o.s) ? o.s : (날[0] ? 날[0].slice(0, 7) : null)
  let 달수 = 수(o.n, 12) || 3
  const 모든날 = [...날, ...현장들.flatMap((x) => x.날)].sort()
  if (모든날.length) {
    const 첫 = 모든날[0].slice(0, 7), 날끝 = 모든날[모든날.length - 1].slice(0, 7)
    /* 원래 보이던 마지막 달도 그대로 보이게(앞으로 넓힐 때 뒤 달이 잘리지 않게) */
    const 원끝 = 시작 ? (() => { const t = Number(시작.slice(0, 4)) * 12 + Number(시작.slice(5, 7)) - 1 + 달수 - 1; return `${Math.floor(t / 12)}-${두자((t % 12) + 1)}` })() : ''
    const 끝 = 원끝 > 날끝 ? 원끝 : 날끝
    if (!시작 || 첫 < 시작) 시작 = 첫
    const 사이 = (Number(끝.slice(0, 4)) - Number(시작.slice(0, 4))) * 12 + (Number(끝.slice(5, 7)) - Number(시작.slice(5, 7))) + 1
    달수 = Math.min(12, Math.max(달수, 사이))
  }
  if (!시작) return null
  달수 = Math.max(1, 달수)
  return 현장들.length ? { 일당, 시작, 달수, 날, 달돈, 다른, 현장들, 옵션 } : { 일당, 시작, 달수, 날, 달돈, 다른, 옵션 }
}

/** 첫날 ~ 끝날 사이 채울 날(꼴: 'sun' 일요일 빼고 · 'wk' 평일만 · 'all' 매일) */
export function 기간날들(a, b, 꼴 = 'sun') {
  if (!날꼴.test(a) || !날꼴.test(b)) return []
  let [s, e] = a <= b ? [a, b] : [b, a]
  const out = []
  const t = new Date(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)))
  for (let i = 0; i < 400; i++) {
    const ds = `${t.getFullYear()}-${두자(t.getMonth() + 1)}-${두자(t.getDate())}`
    if (ds > e) break
    const w = t.getDay()
    if (꼴 === 'all' || (꼴 === 'sun' && w !== 0) || (꼴 === 'wk' && w !== 0 && w !== 6)) out.push(ds)
    t.setDate(t.getDate() + 1)
  }
  return out
}
