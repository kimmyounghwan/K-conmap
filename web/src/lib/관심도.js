/**
 * 👥 경쟁 관심도 — «건설맵에서 이 공고 금액을 본 사람 n명» (마감 전) · «이용자들이 고른 자리 vs 실제 1순위 자리» (마감 뒤) — G499 (2026-11-01)
 *
 * 소장님: 바로투찰 아이디어 ① «경쟁 밀집도(실시간 · 익명)» — 「1부터 4까지 한 번에 만들어서 완벽하게 검증 후에 올리자」
 *   ⚠️ 마감 전에 «다른 사람들이 어느 금액 자리에 몰렸나» 를 보여 주면 이용자가 계산한 금액이 (익명이라도) 경쟁사에게 미리 보이는 셈 → 신뢰 · 공정 문제.
 *      소장님께 말씀드리고(11-01 15:0x) 이렇게 고침:
 *   ■ 마감 전: 몇 명이 봤는지만(bc/p — 공고마다 브라우저 번호 하나 · 처음 본 때 · 마감 시각 · 금액 없음 · 누구나 읽음)
 *   ■ 금액 자리(분위)는 bc/q 에 — 화면(운영자 화면 포함)은 못 읽음(규칙에 .read 없음 · 관리자 열쇠를 쓰는 깃허브 작업만 읽음). 마감이 지나면 깃허브 30분 작업(tools/이용자지도.py 관심정리)이
 *     묶어서(분위별 수) fresh/bcq/{공고번호 앞 8자}/{공고번호} = {n, h: {분위: 수}, p: 본 사람, c: 마감} 로 공개하고 낱개는 지웁니다.
 *   ■ 브라우저 번호 = 방문자 셈과 같은 익명 번호(kcm.vis.id · lib/방문세기.js 내번호) · 소장님 브라우저 · 로봇은 안 남김.
 * ■ 시험: tools/시험_관심도.mjs(순수 셈) · tools/시험_이용자지도.py(마감 뒤 묶기) · 화면 tools/시험_바로투찰G499화면.mjs
 */
import { 내번호, 봇, 운영자인가 } from './방문세기.js'

const DB = 'https://k-conmap-default-rtdb.firebaseio.com'
const 공고모양 = /^[A-Za-z0-9-]{6,30}$/
const 남김열쇠 = 'kcm.bc.p'        // 이 브라우저가 «봤다» 고 남긴 공고들(같은 공고 두 번 안 씀)
const 자리열쇠 = 'kcm.bc.q'        // 이 브라우저가 마지막에 남긴 분위(같으면 안 씀)

/** 마감 → 12자리 숫자(yyyymmddHHMM) · 모르면 null */
export function 마감숫자(close) {
  const d = String(close || '').replace(/[^0-9]/g, '')
  if (d.length < 12) return null
  const n = Number(d.slice(0, 12))
  return n >= 202601010000 && n <= 209912312359 ? n : null
}
/** 한국 시각 지금 → 12자리 숫자 */
export function 지금숫자(지금 = Date.now()) {
  const t = new Date(지금 + 9 * 3600e3).toISOString()
  return Number(t.slice(0, 4) + t.slice(5, 7) + t.slice(8, 10) + t.slice(11, 13) + t.slice(14, 16))
}
/** 공고번호 앞 8자 — 공개 묶음 자리(조회수 fresh/nv 와 같은 나눔) */
export const 묶음자리 = (no) => String(no || '').slice(0, 8)

/** bc/p 한 공고 → {n, 시간, 오늘} — 순수(시험) */
export function 관심셈(값, 지금 = Date.now()) {
  const 들 = Object.values(값 || {}).filter((v) => v && typeof v.t === 'number')
  const 오늘시작 = Date.parse(new Date(지금 + 9 * 3600e3).toISOString().slice(0, 10) + 'T00:00:00+09:00')
  return { n: 들.length, 시간: 들.filter((v) => 지금 - v.t <= 3600e3 && v.t <= 지금 + 60e3).length, 오늘: 들.filter((v) => v.t >= 오늘시작).length }
}

/** 마감 뒤 공개 묶음 {n, h:{분위:수}} 와 이번 개찰 자리 {실격선, 일순끝} → {실격, 일순, 밀림, 막대[20]} — 순수(시험) */
export function 자리나눔(묶, 자리) {
  const h = (묶 && 묶.h) || {}
  const 막대 = Array(20).fill(0)
  let 실격 = 0, 일순 = 0, 밀림 = 0, n = 0
  for (const [k, c] of Object.entries(h)) {
    const q = Number(k), m = Number(c) || 0
    if (!(q >= 0 && q <= 100) || !(m > 0)) continue
    n += m
    막대[Math.min(19, Math.floor(q / 5))] += m
    if (!자리) continue
    /* 분위는 정수로 남겨 있어 경계는 ±0.5 어림 — 실격선 아래 = 실격 · [실격선, 1순위 자리 끝] = 1순위 자리 · 그 위 = 밀림 */
    if (q < 자리.실격선 - 0.5) 실격 += m
    else if (q <= 자리.일순끝 + 0.5) 일순 += m
    else 밀림 += m
  }
  return { n, 실격, 일순, 밀림, 막대 }
}

async function 남겨도되나() {
  if (typeof window === 'undefined' || 봇()) return null
  const id = 내번호()
  if (!id) return null
  if (await 운영자인가()) return null
  return id
}
function 읽기(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {} } catch (e) { return {} } }
function 쓰기(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { /* 개인 창 */ } }

/** 마감 전 — «봤다» 한 번(공고마다 브라우저 하나 · 처음 한 번) · 돌려줌: 남겼으면 true */
export async function 관심남기기(no, close) {
  const k = String(no || ''), c = 마감숫자(close)
  if (!공고모양.test(k) || !c || c <= 지금숫자()) return false
  const 남긴 = 읽기(남김열쇠)
  if (남긴[k]) return false
  const id = await 남겨도되나()
  if (!id) return false
  try {
    const w = await fetch(`${DB}/bc/p/${encodeURIComponent(k)}/${id}.json`, { method: 'PUT', body: JSON.stringify({ t: { '.sv': 'timestamp' }, c }) })
    /* 이미 남긴 것(다른 탭 · 저장소를 비움)은 규칙이 막음(403) — 그래도 «남긴 것» 으로 적어 다시 안 씀 */
    const 줄 = Object.entries({ ...남긴, [k]: c }).sort((a, b) => a[1] - b[1]).slice(-300)
    쓰기(남김열쇠, Object.fromEntries(줄))
    return w.ok
  } catch (e) { return false }
}

/** 마감 전 — 고른 자리(분위 · 정수) 남기기 · 복사 · 나라장터 열기 · 넣은 금액 적기 때 · 같은 분위면 안 씀 */
export async function 자리남기기(no, close, q) {
  const k = String(no || ''), c = 마감숫자(close), 분위 = Math.round(Number(q))
  if (!공고모양.test(k) || !c || c <= 지금숫자() || !(분위 >= 0 && 분위 <= 100)) return false
  const 남긴 = 읽기(자리열쇠)
  if (남긴[k] && 남긴[k].q === 분위) return false
  const id = await 남겨도되나()
  if (!id) return false
  try {
    const w = await fetch(`${DB}/bc/q/${encodeURIComponent(k)}/${id}.json`, { method: 'PUT', body: JSON.stringify({ q: 분위, c, t: { '.sv': 'timestamp' } }) })
    if (w.ok) { const 줄 = Object.entries({ ...남긴, [k]: { q: 분위, c } }).sort((a, b) => a[1].c - b[1].c).slice(-300); 쓰기(자리열쇠, Object.fromEntries(줄)) }
    return w.ok
  } catch (e) { return false }
}

const 읽은 = new Map()
/** 마감 전 — 본 사람 수 {n, 시간, 오늘} · 1분 기억 · 못 받으면 null */
export async function 관심읽기(no, 지금 = Date.now()) {
  const k = String(no || '')
  if (!공고모양.test(k)) return null
  const 옛 = 읽은.get(k)
  if (옛 && 지금 - 옛.at < 60e3) return 옛.v
  try {
    const r = await fetch(`${DB}/bc/p/${encodeURIComponent(k)}.json`, { cache: 'no-store' })
    if (!r.ok) return null
    const v = 관심셈(await r.json(), 지금)
    읽은.set(k, { at: 지금, v })
    return v
  } catch (e) { return null }
}

/** 마감 뒤 — 공개 묶음 {n, h, p, c} · 없으면 null */
export async function 자리묶음읽기(no) {
  const k = String(no || '')
  if (!공고모양.test(k)) return null
  try {
    const r = await fetch(`${DB}/fresh/bcq/${encodeURIComponent(묶음자리(k))}/${encodeURIComponent(k)}.json`, { cache: 'no-store' })
    if (!r.ok) return null
    const v = await r.json()
    return v && typeof v === 'object' && (Number(v.n) > 0 || Number(v.p) > 0) ? v : null
  } catch (e) { return null }
}
