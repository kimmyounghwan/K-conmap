/**
 * 🔗 일용직 퇴직금 판단기 «결과 링크» (G515 · 2026-11-02) — 주휴수당(lib/juhyuLink.js) · 실업급여 · 휴업급여와 같은 꼴
 * ■ 고른 것만 주소(?c=)에 담습니다 — 이름 · 생년월일 · 회사 이름 같은 것은 처음부터 받지 않음.
 *     { v:1, a:첫 출근일, b:마지막 근무일, w:일당, h:하루 시간, m:한 달 일한 날, y:0(띄엄띄엄), e:계약 없이 쉰 날,
 *       q:3개월 일한 날, r:3개월 그 밖의 돈, o:0(4명 이하), g:1(퇴직공제 현장), p:1(일당에 퇴직금 포함) }
 */
import { 날맞나 } from './toejikgeum.js'

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
const 수 = (v, 위) => { const n = Number(v); return Number.isFinite(n) && n > 0 && n <= 위 ? Math.round(n * 100) / 100 : null }

export function 링크만들기(st) {
  const o = { v: 1 }
  if (날맞나(st.처음)) o.a = st.처음
  if (날맞나(st.끝)) o.b = st.끝
  const w = 수(st.일당, 10_000_000); if (w) o.w = w
  const h = 수(st.시간, 24); if (h) o.h = h
  const m = 수(st.월날, 31); if (m) o.m = m
  if (st.이어짐 === false) o.y = 0
  const e = 수(st.빈날, 365 * 60); if (e) o.e = e
  const q = 수(st.석달날, 400); if (q) o.q = q
  const r = 수(st.석달더, 1_000_000_000); if (r) o.r = r
  if (st.오인 === false) o.o = 0
  if (st.공제) o.g = 1
  if (st.포함) o.p = 1
  return b64url(JSON.stringify(o))
}

export function 링크읽기(c) {
  try {
    if (typeof c !== 'string' || c.length > 500 || !/^[A-Za-z0-9_-]+$/.test(c)) return null
    const o = JSON.parse(unb64url(c))
    if (!o || o.v !== 1) return null
    const 빈 = (v) => (v === null || v === undefined ? '' : v)
    const r = {
      처음: 날맞나(o.a) ? o.a : '', 끝: 날맞나(o.b) ? o.b : '',
      일당: 빈(수(o.w, 10_000_000)), 시간: 빈(수(o.h, 24)), 월날: 빈(수(o.m, 31)),
      이어짐: o.y !== 0, 빈날: 빈(수(o.e, 365 * 60)), 석달날: 빈(수(o.q, 400)), 석달더: 빈(수(o.r, 1_000_000_000)),
      오인: o.o !== 0, 공제: o.g === 1, 포함: o.p === 1,
    }
    if (!r.처음 || !r.끝 || !r.일당) return null
    return r
  } catch (e) { return null }
}
