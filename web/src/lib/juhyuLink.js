/**
 * 🔗 주휴수당 판단기 «결과 링크» (G509 · 2026-11-02) — 실업급여(lib/silupLink.js) · 휴업급여(lib/hyueopLink.js)와 같은 꼴
 * ■ 고른 것만 주소(?c=)에 담습니다 — 이름 · 생년월일 같은 것은 처음부터 받지 않음.
 *     { v:1, f:'o'(하루로 끝나는 일용), o:0(4명 이하), m:'h'(시급), w:일당, s:시급, h:하루 시간, d:1주 날, g:0(결근), y:0(휴일 전 그만둠),
 *       n:주 수, x:1(주마다 다름), t:그 주들 정해진 시간 합, k:그 주 수, p:1(일당에 주휴 포함) }
 */
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
  if (st.형태 === 'once') o.f = 'o'
  if (st.오인 === false) o.o = 0
  if (st.돈꼴 === 'hour') o.m = 'h'
  const w = 수(st.일당, 10_000_000); if (w) o.w = w
  const s = 수(st.시급, 1_000_000); if (s) o.s = s
  const h = 수(st.시간, 24); if (h) o.h = h
  const d = 수(st.날, 7); if (d) o.d = d
  if (st.개근 === false) o.g = 0
  if (st.이어짐 === false) o.y = 0
  const n = 수(st.주수, 260); if (n && n !== 1) o.n = n
  if (st.다름) { o.x = 1; const t = 수(st.넷합, 672); if (t) o.t = t; const k = 수(st.넷주, 4); if (k) o.k = k }
  if (st.포함) o.p = 1
  return b64url(JSON.stringify(o))
}

export function 링크읽기(c) {
  try {
    if (typeof c !== 'string' || c.length > 400 || !/^[A-Za-z0-9_-]+$/.test(c)) return null
    const o = JSON.parse(unb64url(c))
    if (!o || o.v !== 1) return null
    const 빈 = (v) => (v === null || v === undefined ? '' : v)
    const r = {
      형태: o.f === 'o' ? 'once' : 'cont', 오인: o.o !== 0, 돈꼴: o.m === 'h' ? 'hour' : 'day',
      일당: 빈(수(o.w, 10_000_000)), 시급: 빈(수(o.s, 1_000_000)), 시간: 빈(수(o.h, 24)), 날: 빈(수(o.d, 7)),
      개근: o.g !== 0, 이어짐: o.y !== 0, 주수: 빈(수(o.n, 260)) || 1,
      다름: o.x === 1, 넷합: 빈(수(o.t, 672)), 넷주: 빈(수(o.k, 4)) || 4, 포함: o.p === 1,
    }
    if (!r.일당 && !r.시급) return null
    return r
  } catch (e) { return null }
}
