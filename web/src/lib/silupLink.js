/**
 * 🔗 실업급여 판단기 «결과 링크» (G507 · 2026-11-02) — 4대보험 판단기(lib/ilyong4link.js)와 같은 꼴
 * ■ 넣은 날짜 · 날 수 · 고른 것 · 일당만 주소(?c=)에 담습니다 — 이름 · 생년월일 같은 것은 처음부터 받지 않음.
 * ■ 꼴: JSON(짧은 열쇠) → UTF-8 → base64url(A-Z a-z 0-9 - _ 뿐 — 카톡 · 카페에서 안 끊김)
 *     { v:1, e:끝날, a:앞 달 출역, b:끝 달 출역, n:18개월 합(빈칸이면 없음), g:0(건설 아님), r:까닭, j:1(정당한 사유),
 *       d:1(다른 곳 스스로 그만둔 적), y:일용 일한 날, o:나이, h:1(장애), k:가입, w:일당, m:한 달 출역, t:1일 소정근로시간 }
 * ■ 읽을 때는 남이 만든 주소일 수 있으니 하나하나 따져서(날짜 꼴 · 범위) 맞는 것만 받습니다.
 */
import { 날맞나, 까닭들, 나이들 } from './silup.js'

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

/** 화면 상태 → ?c= 글자 */
export function 링크만들기(st) {
  const o = { v: 1, e: st.끝날 }
  const 넣 = (k, v) => { if (v !== '' && v !== null && v !== undefined && v !== false) o[k] = v }
  넣('a', 수(st.A, 31)); 넣('b', 수(st.B, 31)); 넣('n', st.합 === '' ? null : 수(st.합, 600))
  if (st.건설 === false) o.g = 0
  if (st.까닭 && st.까닭 !== 'end') o.r = st.까닭
  if (st.정당) o.j = 1
  if (st.딴) { o.d = 1; 넣('y', 수(st.일용, 600)) }
  if (st.나이 && st.나이 !== 'u50') o.o = st.나이
  if (st.장애) o.h = 1
  if (st.가입 !== '' && st.가입 !== undefined) o.k = String(st.가입)
  넣('w', 수(st.일당, 5_000_000)); 넣('m', 수(st.월일, 31))
  if (st.시간 && Number(st.시간) !== 8) 넣('t', 수(st.시간, 8))
  return b64url(JSON.stringify(o))
}

/** ?c= 글자 → 화면 상태 조각(못 읽으면 null) */
export function 링크읽기(c) {
  try {
    if (typeof c !== 'string' || c.length > 600 || !/^[A-Za-z0-9_-]+$/.test(c)) return null
    const o = JSON.parse(unb64url(c))
    if (!o || o.v !== 1 || !날맞나(o.e)) return null
    const 빈 = (v) => (v === null || v === undefined ? '' : v)
    return {
      끝날: o.e,
      A: 빈(수(o.a, 31)), B: 빈(수(o.b, 31)), 합: 빈(수(o.n, 600)),
      건설: o.g !== 0,
      까닭: 까닭들.some((x) => x.k === o.r) ? o.r : 'end',
      정당: o.j === 1,
      딴: o.d === 1, 일용: 빈(수(o.y, 600)),
      나이: 나이들.some((x) => x.k === o.o) ? o.o : 'u50',
      장애: o.h === 1,
      가입: ['0', '1', '3', '5', '10'].includes(String(o.k)) ? String(o.k) : '',
      일당: 빈(수(o.w, 5_000_000)), 월일: 빈(수(o.m, 31)),
      시간: 수(o.t, 8) || 8,
    }
  } catch (e) { return null }
}
