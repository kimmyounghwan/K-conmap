/**
 * 🔗 산재 휴업급여 계산기 «결과 링크» (G508 · 2026-11-02) — 실업급여 판단기(lib/silupLink.js)와 같은 꼴
 * ■ 일당 · 평균임금 · 날짜만 주소(?c=)에 담습니다 — 생년월일은 안 담음(개인정보 · 받는 분이 넣음).
 *     { v:1, w:일당, j:1(평균임금 직접), p:평균임금, s:쉰 첫날, e:쉰 끝날, h:다친 날 }
 */
import { 날맞나 } from './hyueop.js'

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
const 수 = (v, 위) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 && n <= 위 ? n : null }

export function 링크만들기(st) {
  const o = { v: 1, s: st.처음, e: st.끝 }
  const w = 수(st.일당, 5_000_000); if (w) o.w = w
  if (st.직접) { o.j = 1; const p = 수(st.평균, 5_000_000); if (p) o.p = p }
  if (날맞나(st.다친날)) o.h = st.다친날
  return b64url(JSON.stringify(o))
}

export function 링크읽기(c) {
  try {
    if (typeof c !== 'string' || c.length > 400 || !/^[A-Za-z0-9_-]+$/.test(c)) return null
    const o = JSON.parse(unb64url(c))
    if (!o || o.v !== 1 || !날맞나(o.s) || !날맞나(o.e)) return null
    const 빈 = (v) => (v === null || v === undefined ? '' : v)
    return { 일당: 빈(수(o.w, 5_000_000)), 직접: o.j === 1, 평균: 빈(수(o.p, 5_000_000)), 처음: o.s, 끝: o.e, 다친날: 날맞나(o.h) ? o.h : '' }
  } catch (e) { return null }
}
