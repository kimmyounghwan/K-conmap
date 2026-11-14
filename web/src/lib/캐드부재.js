/**
 * 🧱 G686 캐드에서 고른 것 → 골조 모델 부재(스케치업 꼴)
 *   소장님 11-14 「예전에 했던 스케치업 프로그램처럼 되는 거지??」 · 「왜 다음에 해? … 이게 최종판이 되어야 한다고」 ·
 *   「이제까지 못 찾았던 물량도 완벽히 찾아야 해. 캐드로 하는 거니까」
 * ■ 길: 캐드 탭 줄(캐드 좌표 · 도면 단위 → mm) → 도면 넣기와 같은 꼴의 «도면 부재»(판 = 평면 모양 mm) → lib/도면모델.js 도면에서모델(지금 모델 통심을 이어 씀)
 *        → 평면가져오기(같은 자리 · 같은 종류는 안 더함) — 통심 · 받침 맞춤 · 보 끝 · 슬라브 칸 · 셈 규칙이 도면 넣기와 똑같음(새 셈 없음)
 * ■ 모양마다(모두 캐드에서 «잰» 값 — 짐작 없음)
 *   기둥: 닫힌 사각형(가로 · 세로) · 원(지름 → 원형) · 그 밖 닫힌 모양(부정형 — 단면적 · 둘레 + 둘러싼 네모 가로 · 세로(자리 · 보 안목)) · 블록(일람 크기가 있어야 자리)
 *   보 · 벽: 선 · 꺾은선(토막마다) · 같은 무리의 «평행한 두 선»은 짝지어 가운데 줄 + 간격(두께 · 폭을 잼) · 가늘고 긴 닫힌 네모(바깥선 — 두께 · 폭 잼)
 *            · 비스듬한 것은 🟨 제안(도면 넣기와 같음) · 호 · 둥근 꺾은선은 1 m 안 토막으로 꺾어 🟨 제안(길이 = 토막 합 — 호보다 조금 짧음 · 알림)
 *   슬라브: 변이 가로 · 세로뿐인 닫힌 모양(네모 · ㄱ · ㄷ · ㅁ — 네모로 나눠 칸마다) · 비스듬한 · 둥근 변은 못 세움(캐드 탭 «면적 × 두께» 로 셈은 그대로)
 *   기초: 닫힌 사각형 60 ㎡ 안(독립 · 가로 · 세로) · 그 밖 모양 · 큰 것 · 부호 MAT/MF → 판 기초(두께 = 이 표 «두께» → 일람 두께 · 없으면 ❓ 못 세움)
 * ■ 일람에 없는 부호 → 일람 줄을 만듦: 캐드에서 잰 크기만(📐) · 춤 · 두께 · 철근처럼 평면에 없는 값은 빈칸(❓ — 「만든 값」 칸에 적음 → 골조 셈 비고 «❓ 도면에 없는 값은 안 셈»)
 *   일람에 있으면 일람 그대로 쓰고, 잰 크기가 다르면 알림만(고치지 않음)
 * ■ 🧲 따로 보낸 묶음도 한 번에 세운 것과 같게 — 보 · 벽 끝 · 슬라브 변을 «지금 모델에 있는» 기둥 · 보 · 벽에도 맞춤(도면 넣기와 같은 거리 · 맥락 · 끝맞춤 · 변맞춤)
 * ■ 세운 부재의 근거 = {평면: '<도면> · 캐드', 키: '0|캐드', 원: '<줄 id>[+<짝 줄 id>]#n'} → 캐드 탭이 «세운 줄» 을 알아 그 표 합에서 뺌(두 번 안 셈) · 부재를 지우면 다시 셈
 * ■ 🟥 빨간 곳(도면 넣기가 못 옮긴 자리 — M.빠짐)과 같은 층 · 같은 종류이고 그 가운데가 새로 세운 모양 안이면 빨간 곳을 지움(캐드로 채움)
 * ■ 시험: node tools/시험_캐드부재.mjs
 */
import { 객체기하, 단위표, 부재종류 } from './캐드고름.js'
import { 도면에서모델, 평면가져오기, 캐드키, 세운줄 } from './도면모델.js'

export { 캐드키, 세운줄 }
const 글 = (x) => String(x ?? '').trim()
const 수 = (x) => { const t = String(x ?? '').replace(/,/g, '').trim(); if (!t) return null; const v = Number(t); return Number.isFinite(v) ? v : null }
const 둥 = Math.round
const 넓이 = (P) => { let s = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; s += p[0] * q[1] - q[0] * p[1] } return Math.abs(s) / 2 }
const 둘레 = (P) => { let l = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; l += Math.hypot(q[0] - p[0], q[1] - p[1]) } return l }
const 상자 = (P) => { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const p of P) { a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]) } return [a, b, c, d] }
const 안 = (P, x, y) => { let r = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) r = !r } return r }
/** 닫힌 모양 깨끗이 — 겹친 점 · 곧게 이어진 점(한 줄 위 가운데 점) 뺌 */
function 깨끗(P0) {
  const P = []
  for (const p of P0) { const q = P[P.length - 1]; if (!q || Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.5) P.push([p[0], p[1]]) }
  while (P.length > 1 && Math.hypot(P[0][0] - P[P.length - 1][0], P[0][1] - P[P.length - 1][1]) <= 0.5) P.pop()
  for (let 바뀜 = true; 바뀜 && P.length > 3;) {
    바뀜 = false
    for (let i = 0; i < P.length; i++) {
      const a = P[(i + P.length - 1) % P.length], b = P[i], c = P[(i + 1) % P.length]
      const cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])
      if (Math.abs(cr) <= 1e-6 * Math.hypot(b[0] - a[0], b[1] - a[1]) * Math.hypot(c[0] - b[0], c[1] - b[1]) + 1e-9) { P.splice(i, 1); 바뀜 = true; break }
    }
  }
  return P
}
/** 변이 모두 가로 · 세로(1 mm 또는 0.5° 안) */
const 곧은 = (P) => P.every((p, i) => { const q = P[(i + 1) % P.length]; const dx = Math.abs(q[0] - p[0]), dy = Math.abs(q[1] - p[1]); return dx <= 1 || dy <= 1 || dx <= dy * 0.0087 || dy <= dx * 0.0087 })
/** 축에 맞춘 네모인가(네 점 · 곧은 변) */
const 네모 = (P) => P.length === 4 && 곧은(P)
/** 기울어진 네모(네 점 · 맞은편 변 길이가 같고 직각) — 띠(보 · 벽 바깥선) 꼴 */
function 기운네모(P) {
  if (P.length !== 4) return false
  const v = (i) => [P[(i + 1) % 4][0] - P[i][0], P[(i + 1) % 4][1] - P[i][1]]
  const L = (w) => Math.hypot(w[0], w[1])
  for (let i = 0; i < 4; i++) { const a = v(i), b = v((i + 1) % 4); if (Math.abs(a[0] * b[0] + a[1] * b[1]) > 0.01 * L(a) * L(b)) return false }
  return Math.abs(L(v(0)) - L(v(2))) <= Math.max(2, 0.01 * L(v(0))) && Math.abs(L(v(1)) - L(v(3))) <= Math.max(2, 0.01 * L(v(1)))
}
/** 가늘고 긴 네모(바깥선으로 그린 보 · 벽) — 짧은 변 1.5 m 안 · 긴 변이 짧은 변의 2배 넘음 */
function 띠꼴(P) {
  if (!기운네모(P)) return null
  const a = Math.hypot(P[1][0] - P[0][0], P[1][1] - P[0][1]), b = Math.hypot(P[2][0] - P[1][0], P[2][1] - P[1][1])
  const 짧 = Math.min(a, b), 긴 = Math.max(a, b)
  return 짧 > 0 && 짧 <= 1500 && 긴 >= 2 * 짧 ? { 폭: 짧, 길이: 긴 } : null
}
/** 선분 p → q 둘레의 띠(폭 w — 가운데 줄 기준 양쪽 w/2) */
function 띠(p, q, w) {
  const L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1
  const nx = -(q[1] - p[1]) / L * (w / 2), ny = (q[0] - p[0]) / L * (w / 2)
  return [[p[0] + nx, p[1] + ny], [q[0] + nx, q[1] + ny], [q[0] - nx, q[1] - ny], [p[0] - nx, p[1] - ny]]
}
/** 변이 가로 · 세로뿐인 닫힌 모양 → 네모들(ㄱ · ㄷ · ㅁ — 꼭짓점 x · y 로 칸을 나눠 안에 든 칸을 가로로 잇고 · 같은 폭이면 세로로 이음) */
export function 네모나누기(P0) {
  const P = 깨끗(P0)
  if (P.length < 4 || !곧은(P)) return null
  const xs = [...new Set(P.map((p) => 둥(p[0])))].sort((a, b) => a - b), ys = [...new Set(P.map((p) => 둥(p[1])))].sort((a, b) => a - b)
  const 줄 = []
  for (let j = 0; j + 1 < ys.length; j++) {
    const cy = (ys[j] + ys[j + 1]) / 2
    let 시작 = null
    const 조각 = []
    for (let i = 0; i + 1 < xs.length; i++) {
      const 들 = 안(P, (xs[i] + xs[i + 1]) / 2, cy)
      if (들 && 시작 === null) 시작 = i
      if ((!들 || i + 2 === xs.length) && 시작 !== null) { const 끝 = 들 ? i + 1 : i; 조각.push([xs[시작], xs[끝]]); 시작 = null }
    }
    줄.push(조각.map(([x0, x1]) => [x0, ys[j], x1, ys[j + 1]]))
  }
  /* 세로로 이음 — 바로 위 줄에 같은 가로 폭 조각이 있으면 붙임 */
  const 다 = []
  const 열림 = new Map()
  for (const 조각들 of 줄) {
    const 새열림 = new Map()
    for (const r of 조각들) {
      const k = r[0] + '|' + r[2], 앞 = 열림.get(k)
      if (앞 && 앞[3] === r[1]) { 앞[3] = r[3]; 새열림.set(k, 앞) } else { const n = [...r]; 다.push(n); 새열림.set(k, n) }
    }
    열림.clear(); for (const [k, v] of 새열림) 열림.set(k, v)
  }
  const 합 = 다.reduce((s, r) => s + (r[2] - r[0]) * (r[3] - r[1]), 0)
  if (Math.abs(합 - 넓이(P)) > Math.max(1, 넓이(P) * 1e-6)) return null       // 나누기가 모양과 다르면(꼬인 선 등) 안 씀
  return 다
}
/** 둥근 것(호 · 둥근 꺾은선)인가 */
const 둥근 = (r) => r.종류 === 'ARC' || r.종류 === 'ELLIPSE' || ((r.종류 === 'LWPOLYLINE' || r.종류 === 'POLYLINE') && ((r.원 && r.원.점) || []).some((p) => Math.abs(+p[2] || 0) > 1e-9))
/** 꺾은선 점들 → 1 m 안 토막(호를 줄로 — G461 곡선 벽과 같은 꼴) */
function 토막(점, 최대 = 1000) {
  const 마디 = [점[0]]
  let 앞 = 0
  for (let i = 1; i < 점.length; i++) { if (Math.hypot(점[i][0] - 점[앞][0], 점[i][1] - 점[앞][1]) > 최대 && i - 1 > 앞) { 마디.push(점[i - 1]); 앞 = i - 1 } }
  const 끝 = 점[점.length - 1]
  if (마디[마디.length - 1] !== 끝) 마디.push(끝)
  return 마디
}

/* ── 🧲 지금 모델 부재에 끝 · 변 맞춤 — 도면 넣기(도면모델.js 끝줄 · 변줄)와 같은 거리 규칙을 «지금 모델에 이미 있는 부재» 에도
 *   (도면모델.js 는 한 번에 넣는 부재끼리만 맞춤 — 캐드 묶음을 따로 세우면 앞서 세운 기둥 · 보에 안 붙어 보 끝 · 슬라브 칸이 어긋났음: 시험_캐드부재 ⑦ 이 잡음)
 *   보 · 벽 끝 → 받침 기둥(너비 반 + 150 안 · 보는 받침층 — FT 지중보는 맨 아래층 기둥) · 가로지르는 보 · 벽(폭 반 + 150 안 · 벽 끝은 벽 · 기둥에만) 가운데로
 *   슬라브 변 → 따라가는 같은 층 보 · 벽(450 안 · 겹친 길이 ≥ min(500, 변의 1/3)) 가운데로 · 비스듬한 것은 그대로 */
function 맥락(M) {
  const X = new Map(((M && M.통심 && M.통심.x) || []).map((g) => [g.id, +g.자리])), Y = new Map(((M && M.통심 && M.통심.y) || []).map((g) => [g.id, +g.자리]))
  const 일 = (종, 부) => ((M && M.배근 && M.배근[종]) || []).find((x) => 글(x.기호).toUpperCase() === 글(부).toUpperCase())
  const 기둥 = [], 선 = []
  for (const o of (M && M.부재) || []) {
    if (o.종류 === '기둥' && o.점 && X.has(o.점[0]) && Y.has(o.점[1])) {
      const r = 일('기둥', o.부호) || {}
      const D = 수(r.지름) || 0
      let a = D || 수(r.가로) || 0, b = D || 수(r.세로) || a
      if (o.돌림) [a, b] = [b, a]
      if (a > 0 && b > 0) 기둥.push({ 층: 글(o.층), x: X.get(o.점[0]), y: Y.get(o.점[1]), a, b })
    } else if ((o.종류 === '보' || o.종류 === '벽') && o.점 && o.끝 && [o.점[0], o.끝[0]].every((k) => X.has(k)) && [o.점[1], o.끝[1]].every((k) => Y.has(k))) {
      const x0 = X.get(o.점[0]), y0 = Y.get(o.점[1]), x1 = X.get(o.끝[0]), y1 = Y.get(o.끝[1])
      const r = 일(o.종류, o.부호) || {}
      const 폭 = 수(o.종류 === '보' ? r.폭 : r.두께) || 0
      if (x0 === x1 && y0 !== y1) 선.push({ 층: 글(o.층), 종류: o.종류, 가로: false, 줄: x0, s0: Math.min(y0, y1), s1: Math.max(y0, y1), 폭 })
      else if (y0 === y1 && x0 !== x1) 선.push({ 층: 글(o.층), 종류: o.종류, 가로: true, 줄: y0, s0: Math.min(x0, x1), s1: Math.max(x0, x1), 폭 })
    }
  }
  const 맨아래 = 글((((M && M.층) || []).find((f) => 글(f.이름).toUpperCase() !== 'FT') || {}).이름)
  return { 기둥, 선, 받침층: (f) => (글(f).toUpperCase() === 'FT' ? 맨아래 : 글(f)), 맞춤: 0 }
}
/** 보 · 벽 가운데 줄 p → q(가로 · 세로인 것만) — 두 끝을 지금 모델 받침 가운데로(끝 하나만 맞을 수도) */
function 끝맞춤(ctx, 종, 층, p, q, w, 끝들 = [true, true]) {
  const dx = q[0] - p[0], dy = q[1] - p[1]
  const 가로 = Math.abs(dy) <= Math.abs(dx) * 0.0087, 세로 = Math.abs(dx) <= Math.abs(dy) * 0.0087
  if ((!가로 && !세로) || (!ctx.기둥.length && !ctx.선.length)) return [p, q]
  const 축 = 가로 ? (p[1] + q[1]) / 2 : (p[0] + q[0]) / 2
  const 받층 = 종 === '보' ? ctx.받침층(층) : 글(층)
  const 맞 = (v) => {
    let best = null, bd = Infinity
    for (const c of ctx.기둥) {
      if (c.층 !== 받층) continue
      const 옆 = 가로 ? c.y : c.x, 축쪽 = 가로 ? c.x : c.y, 축너비 = 가로 ? c.a : c.b, 옆너비 = 가로 ? c.b : c.a
      if (Math.abs(옆 - 축) > Math.max(100, 옆너비 / 2 - w / 2 + 10)) continue
      const d = Math.abs(축쪽 - v)
      if (d <= 축너비 / 2 + 150 && d < bd) { bd = d; best = 축쪽 }
    }
    for (const s of ctx.선) {
      if (s.층 !== 글(층) || s.가로 === 가로 || (종 === '벽' && s.종류 === '보')) continue
      if (축 < s.s0 - 200 || 축 > s.s1 + 200) continue
      const d = Math.abs(s.줄 - v)
      if (d <= s.폭 / 2 + 150 && d < bd) { bd = d; best = s.줄 }
    }
    return best
  }
  const n0 = 끝들[0] ? 맞(가로 ? p[0] : p[1]) : null, n1 = 끝들[1] ? 맞(가로 ? q[0] : q[1]) : null
  if (n0 === null && n1 === null) return [p, q]
  const 새p = 가로 ? [n0 ?? p[0], p[1]] : [p[0], n0 ?? p[1]], 새q = 가로 ? [n1 ?? q[0], q[1]] : [q[0], n1 ?? q[1]]
  if (Math.hypot(새q[0] - 새p[0], 새q[1] - 새p[1]) < 50) return [p, q]          // 한 받침 안으로 줄면 그대로
  if (Math.abs(새p[0] - p[0]) + Math.abs(새p[1] - p[1]) + Math.abs(새q[0] - q[0]) + Math.abs(새q[1] - q[1]) > 0.5) ctx.맞춤++
  return [새p, 새q]
}
/** 슬라브 칸 [x0, y0, x1, y1] — 변마다 따라가는 같은 층 보 · 벽(450 안) 가운데로 */
function 변맞춤(ctx, 층, 칸) {
  if (!ctx.선.length) return 칸
  const [x0, y0, x1, y1] = 칸
  const 맞 = (세로변, v, 범0, 범1) => {
    let best = null, bd = Infinity
    for (const s of ctx.선) {
      if (s.층 !== 글(층) || s.가로 === 세로변) continue                         // 세로변(x 자리)은 세로 부재를 따라감
      if (Math.min(s.s1, 범1) - Math.max(s.s0, 범0) < Math.min(500, (범1 - 범0) / 3)) continue
      const d = Math.abs(s.줄 - v)
      if (d <= 450 && d < bd) { bd = d; best = s.줄 }
    }
    return best ?? v
  }
  const a = 맞(true, x0, y0, y1), c = 맞(true, x1, y0, y1), b = 맞(false, y0, x0, x1), d = 맞(false, y1, x0, x1)
  if (!(c - a > 50 && d - b > 50)) return 칸
  if (a !== x0 || b !== y0 || c !== x1 || d !== y1) ctx.맞춤++
  return [a, b, c, d]
}
/** 가늘고 긴 네모(띠) → 가운데 줄 두 끝(짧은 변 가운데) */
function 띠가운데(P) {
  const L = (i) => Math.hypot(P[(i + 1) % 4][0] - P[i][0], P[(i + 1) % 4][1] - P[i][1])
  const i = L(0) <= L(1) ? 0 : 1                      // 짧은 변 i · i+2
  const 가 = (k) => [(P[k][0] + P[(k + 1) % 4][0]) / 2, (P[k][1] + P[(k + 1) % 4][1]) / 2]
  return [가(i), 가(i + 2)]
}

const 크기글 = (v) => (Number.isFinite(v) ? String(둥(v)) : '')
/** 일람 줄 만들기(잰 크기만 · 나머지 빈칸) */
function 일람줄(종, 부호, 잰, 덧글) {
  const 빈 = []
  const r = { 기호: 부호 }
  if (종 === '기둥') {
    if (잰.꼴 === '원') { r.형태 = '원형'; r.지름 = 크기글(잰.지름) }
    else if (잰.꼴 === '사각') { r.형태 = '사각'; r.가로 = 크기글(잰.가로); r.세로 = 크기글(잰.세로) }
    else if (잰.꼴 === '부정형') { r.형태 = '부정형'; r.면적 = String(+(잰.면적 / 1e6).toFixed(4)); r.둘레 = String(+(잰.둘레 / 1000).toFixed(4)); r.가로 = 크기글(잰.가로); r.세로 = 크기글(잰.세로) }       // 가로 · 세로 = 둘러싼 네모(자리 · 보 안목 — 셈은 단면적 · 둘레)
    else 빈.push('가로 · 세로')
    빈.push('철근')
  } else if (종 === '보') { r.폭 = 크기글(잰.폭); if (!r.폭) 빈.push('폭'); 빈.push('춤', '철근'); r.종류 = '전단보' }
  else if (종 === '벽') { r.두께 = 크기글(잰.두께); if (!r.두께) 빈.push('두께'); 빈.push('철근') }
  else if (종 === '슬라브') { r.두께 = 크기글(잰.두께); if (!r.두께) 빈.push('두께'); 빈.push('철근') }
  else if (종 === '기초') {
    r.종류 = 잰.판 ? '부정형' : '독립'
    if (잰.가로) { r.가로 = 크기글(잰.가로); r.세로 = 크기글(잰.세로) }
    if (잰.판) { r.면적 = String(+(잰.면적 / 1e6).toFixed(4)); r.둘레 = String(+(잰.둘레 / 1000).toFixed(4)) }
    r.두께 = 크기글(잰.두께); if (!r.두께) 빈.push('두께')
    빈.push('철근')
  }
  const 잰글 = Object.entries({ 가로: r.가로, 세로: r.세로, 지름: r.지름, 폭: r.폭, 두께: 잰.두께사람 ? '' : r.두께, 면적: r.면적 && r.면적 + '㎡', 둘레: r.둘레 && r.둘레 + 'm' }).filter(([, v]) => v).map(([k, v]) => k + ' ' + v).join(' · ') + (종 === '기둥' && 잰.꼴 === '부정형' ? ' — 가로 · 세로는 둘러싼 네모(자리 · 보 안목) · 셈은 단면적 × 높이 · 둘레 × 높이' : '')
  r.만든 = '📐 캐드에서 잰 크기' + (잰글 ? '(' + 잰글 + ')' : '') + (잰.두께사람 ? ' · 두께 ' + r.두께 + '(캐드 탭에 사람이 넣음)' : '') + (덧글 ? ' · ' + 덧글 : '') + (빈.length ? ' · ❓ ' + 빈.join(' · ') + ' — 도면에 없는 값은 안 셈(부호 일람에 적어 주십시오)' : '')
  return r
}

/**
 * 캐드 탭 줄 → 골조 모델 부재
 * @param 캐드 {묶음, 줄} · @param M 지금 골조 모델 · @param 옵 { 줄들?: Set(줄 id) — 이것만 }
 * @returns { M(새 모델 — 바뀐 것 없으면 그대로), 세움, 겹침(같은 자리에 이미 있음), 못: [{id, 까닭}], 일람더함: [], 다른크기: [], 제안, 보조, 채움, 종류별: {}, 틀림? }
 */
export function 부재로세우기(캐드, M, 옵 = {}) {
  const 묶음표 = new Map(((캐드 && 캐드.묶음) || []).map((b) => [b.id, b]))
  const 세운 = 세운줄(M)
  const 고른 = 옵.줄들 instanceof Set ? 옵.줄들 : null
  const 대상 = ((캐드 && 캐드.줄) || []).filter((r) => 부재종류.includes(r.부재) && !세운.has(r.id) && (!고른 || 고른.has(r.id)))
  const 못 = []
  const 배근 = {}
  for (const k of Object.keys((M && M.배근) || {})) 배근[k] = (M.배근[k] || []).map((x) => ({ ...x }))
  for (const k of 부재종류) if (!Array.isArray(배근[k])) 배근[k] = []
  const 일람 = (종, 부호) => (배근[종] || []).find((x) => 글(x.기호).toUpperCase() === 부호)
  const 일람더함 = [], 다른크기 = [], 크기고침 = []
  const 층들 = new Set(((M && M.층) || []).map((f) => 글(f.이름)))
  const 도면부재 = []
  const 원판 = new Map()            // 도면 부재 id → {종류, 층, 판(mm)} — 빨간 곳 지우기
  let 번 = 0
  const 넣기 = (ids, b, 종류, 층, 부호, 판, 덧 = {}) => {
    const id = ids.join('+') + '#' + (번++)
    도면부재.push({ id, 종류, 층, 기호: 부호, 판: 판.map((p) => [둥(p[0]), 둥(p[1])]), z0: 0, z1: 0, 평면: '0||캐드', 근거: { n: 글(b && (b.도면 || b.이름)).split(/[\\/]/).pop() }, ...덧 })
    원판.set(id, { 종류, 층, 판 })
  }
  /* 일람 — 없으면 잰 크기로 만듦 · 있으면 견줌(다르면 알림만) */
  const 일람챙김 = (종, 부호, 잰, 덧글 = '') => {
    const 있 = 일람(종, 부호)
    if (!있) { const r = 일람줄(종, 부호, 잰, 덧글); 배근[종].push(r); 일람더함.push(종 + ' ' + 부호); return r }
    const 견 = (이름, 잰값, 일값) => {
      const a = 수(일값)
      if (!(Number.isFinite(잰값) && a !== null && Math.abs(a - 잰값) > Math.max(5, a * 0.01))) return
      다른크기.push(종 + ' ' + 부호 + ' ' + 이름 + ' 일람 ' + a + ' · 캐드 ' + 둥(잰값))
      크기고침.push({ 종, 부호, 칸: 이름, 일람: a, 캐드: 둥(잰값) })
    }
    if (종 === '기둥' && 잰.꼴 === '사각') { 견('가로', 잰.가로, 있.가로); 견('세로', 잰.세로, 있.세로) }
    if (종 === '기둥' && 잰.꼴 === '원') 견('지름', 잰.지름, 있.지름)
    if (종 === '보' && 잰.폭) 견('폭', 잰.폭, 있.폭)
    if ((종 === '벽' || 종 === '슬라브' || 종 === '기초') && 잰.두께 && !잰.두께사람) 견('두께', 잰.두께, 있.두께)
    return 있
  }

  const 맥 = 맥락(M)                // 🧲 지금 모델 부재(앞서 세운 캐드 부재 · 도면 · 손) — 끝 · 변 맞춤
  /* 줄마다 기하(mm) · 기본 검사 */
  const 준비 = []
  for (const r of 대상) {
    const b = 묶음표.get(r.묶음)
    const k = b ? 단위표[b.단위] || null : null
    const 부호 = 글(r.부호).toUpperCase()
    const 층 = 글(r.층)
    if (!k) { 못.push({ id: r.id, 까닭: '도면 단위 ❓ — 위 묶음에서 단위를 골라 주십시오' }); continue }
    if (!층 || !층들.has(층)) { 못.push({ id: r.id, 까닭: '층 ❓ — 층을 골라 주십시오' }); continue }
    if (!부호) { 못.push({ id: r.id, 까닭: '부호 ❓ — C1 · B1 · W1 · S1 · F1 처럼 적어 주십시오' }); continue }
    const g = 객체기하({ 종류: r.종류, ...r.원 }, k)
    if (!g || !g.그림 || !g.그림.length) { 못.push({ id: r.id, 까닭: '셈 못 하는 객체' }); continue }
    준비.push({ r, b, k, 부호, 층, g })
  }

  /* 보 · 벽 — 같은 묶음 · 층 · 부재 · 부호의 «평행한 두 선»(선 · 두 점 꺾은선) 짝: 간격 30 ~ 1,500 mm · 겹친 길이 ≥ 짧은 선의 60 % → 가운데 줄 + 간격(잰 두께 · 폭) */
  const 짝됨 = new Set()
  const 두점 = (x) => !둥근(x.r) && !x.g.닫힘 && x.g.그림.length === 2 && (x.r.부재 === '보' || x.r.부재 === '벽')
  const 후보 = 준비.filter(두점)
  const 쌍 = []
  for (let i = 0; i < 후보.length; i++) for (let j = i + 1; j < 후보.length; j++) {
    const A = 후보[i], B = 후보[j]
    if (A.r.묶음 !== B.r.묶음 || A.층 !== B.층 || A.r.부재 !== B.r.부재 || A.부호 !== B.부호) continue
    const [p, q] = A.g.그림, [s, t] = B.g.그림
    const La = Math.hypot(q[0] - p[0], q[1] - p[1]), Lb = Math.hypot(t[0] - s[0], t[1] - s[1])
    if (La < 1 || Lb < 1) continue
    const ux = (q[0] - p[0]) / La, uy = (q[1] - p[1]) / La
    const vx = (t[0] - s[0]) / Lb, vy = (t[1] - s[1]) / Lb
    if (Math.abs(ux * vy - uy * vx) > 0.0087) continue                 // 0.5° 넘게 기욺 — 평행 아님
    const d = Math.abs((s[0] - p[0]) * -uy + (s[1] - p[1]) * ux)       // 두 선 사이 거리
    if (d < 30 || d > 1500) continue
    const 투 = (z) => (z[0] - p[0]) * ux + (z[1] - p[1]) * uy
    const a0 = 0, a1 = La, b0 = Math.min(투(s), 투(t)), b1 = Math.max(투(s), 투(t))
    const 겹 = Math.min(a1, b1) - Math.max(a0, b0)
    if (겹 < 0.6 * Math.min(La, Lb)) continue
    쌍.push({ A, B, d, 겹0: Math.max(a0, b0), 겹1: Math.min(a1, b1), p, ux, uy, s })
  }
  쌍.sort((x, y) => x.d - y.d)
  for (const w of 쌍) {
    if (짝됨.has(w.A.r.id) || 짝됨.has(w.B.r.id)) continue
    짝됨.add(w.A.r.id); 짝됨.add(w.B.r.id)
    /* 가운데 줄: A 위 겹친 구간을 B 쪽으로 d/2 옮김 */
    const 쪽 = Math.sign((w.s[0] - w.p[0]) * -w.uy + (w.s[1] - w.p[1]) * w.ux) || 1
    const nx = -w.uy * 쪽 * w.d / 2, ny = w.ux * 쪽 * w.d / 2
    const c0 = [w.p[0] + w.ux * w.겹0 + nx, w.p[1] + w.uy * w.겹0 + ny], c1 = [w.p[0] + w.ux * w.겹1 + nx, w.p[1] + w.uy * w.겹1 + ny]
    const 종 = w.A.r.부재
    일람챙김(종, w.A.부호, 종 === '보' ? { 폭: w.d } : { 두께: w.d }, '평행한 두 선 사이 ' + 둥(w.d) + ' mm')
    const [m0, m1] = 끝맞춤(맥, 종, w.A.층, c0, c1, w.d)
    넣기([w.A.r.id, w.B.r.id], w.A.b, 종, w.A.층, w.A.부호, 띠(m0, m1, w.d))
  }

  for (const x of 준비) {
    const { r, b, 부호, 층, g } = x
    const 종 = r.부재
    if (짝됨.has(r.id)) continue
    if (종 === '기둥' || 종 === '기초') {
      if (r.종류 === 'INSERT') {
        if ((r.원 && r.원.개수 > 1) || g.개수 > 1) { 못.push({ id: r.id, 까닭: '배열 블록(열 × 행) — 하나씩 고르거나 세우기 탭에서' }); continue }
        const 일 = 일람(종, 부호)
        const a = 수(일 && (일.가로 || 일.지름)), c = 수(일 && (일.세로 || 일.지름 || 일.가로))
        if (!(a > 0 && c > 0)) { 못.push({ id: r.id, 까닭: '블록 ' + 종 + ' — 부호 일람에 ' + 부호 + ' 가로 · 세로(원형은 지름)가 있어야 자리를 잡습니다' }); continue }
        const [px, py] = g.그림[0]
        넣기([r.id], b, 종, 층, 부호, [[px - a / 2, py - c / 2], [px + a / 2, py - c / 2], [px + a / 2, py + c / 2], [px - a / 2, py + c / 2]])
        continue
      }
      if (!g.닫힘 || g.그림.length < 3) { 못.push({ id: r.id, 까닭: 종 + ' — 닫힌 선 · 원 · 블록을 골라 주십시오(테두리)' }); continue }
      const P = r.종류 === 'CIRCLE' || r.종류 === 'ELLIPSE' ? g.그림 : 깨끗(g.그림)
      const [a0, b0, a1, b1] = 상자(P)
      const 원 = r.종류 === 'CIRCLE'
      const 사각 = !원 && 네모(P)
      if (종 === '기둥') {
        const 잰 = 원 ? { 꼴: '원', 지름: a1 - a0 } : 사각 ? { 꼴: '사각', 가로: a1 - a0, 세로: b1 - b0 } : { 꼴: '부정형', 면적: 넓이(P), 둘레: 둘레(P), 가로: a1 - a0, 세로: b1 - b0 }
        const 일 = 일람챙김(종, 부호, 잰)
        if (!원 && !사각 && 글(일.형태) !== '부정형' && 글(일.형태) !== '다각') 다른크기.push('기둥 ' + 부호 + ' 은 일람이 «' + (글(일.형태) || '사각') + '» 인데 캐드 모양은 부정형(단면적 ' + (+(넓이(P) / 1e6).toFixed(3)) + '㎡) — 일람을 확인하십시오')
        넣기([r.id], b, 종, 층, 부호, 원 ? [[a0, b0], [a1, b0], [a1, b1], [a0, b1]] : P)
        continue
      }
      /* 기초 */
      const 사람두께 = 수(r.두께)
      const 일0 = 일람(종, 부호)
      const 두께 = 사람두께 > 0 ? 사람두께 * 1000 : 수(일0 && 일0.두께)
      const 판기초 = /^M(AT|F)/i.test(부호) || !사각 || (a1 - a0) * (b1 - b0) > 60e6 || (일0 && /MAT|부정형/.test(글(일0.종류)))
      if (판기초) {
        if (!(두께 > 0)) { 못.push({ id: r.id, 까닭: '판 기초(MAT · 부정형) ' + 부호 + ' 두께 ❓ — 캐드 탭 «두께»(m)나 부호 일람 두께를 적어 주십시오' }); continue }
        일람챙김(종, 부호, { 판: true, 면적: 넓이(P), 둘레: 둘레(P), 두께, 두께사람: 사람두께 > 0 })
        넣기([r.id], b, 종, 층, 부호, P, { z0: -두께, z1: 0, 부정형: true })     // 윗면 0 · 아래로 두께(도면 넣기는 z1 이 가장 높은 판 기초에 맞춰 윗면을 내림 — 캐드 판은 모두 윗면 0)
        continue
      }
      일람챙김(종, 부호, { 가로: a1 - a0, 세로: b1 - b0, 두께: 두께 > 0 ? 두께 : null, 두께사람: 사람두께 > 0 })
      넣기([r.id], b, 종, 층, 부호, P)
      continue
    }
    if (종 === '슬라브') {
      if (!g.닫힘 || g.그림.length < 3) { 못.push({ id: r.id, 까닭: '슬라브 — 닫힌 선을 골라 주십시오' }); continue }
      if (둥근(r)) { 못.push({ id: r.id, 까닭: '둥근 변이 있는 슬라브 — 골조 모델 칸은 네모뿐(캐드 탭 «면적 × 두께» 로 셈하십시오)' }); continue }
      const 칸들 = 네모나누기(g.그림)
      if (!칸들 || !칸들.length) { 못.push({ id: r.id, 까닭: '비스듬한 변이 있는 슬라브 — 골조 모델 칸은 가로 · 세로 변뿐(캐드 탭 «면적 × 두께» 로 셈하십시오)' }); continue }
      const 사람두께 = 수(r.두께)
      일람챙김(종, 부호, { 두께: 사람두께 > 0 ? 사람두께 * 1000 : null, 두께사람: 사람두께 > 0 })
      for (const 칸0 of 칸들) { const [x0, y0, x1, y1] = 변맞춤(맥, 층, 칸0); 넣기([r.id], b, 종, 층, 부호, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]) }
      continue
    }
    /* 보 · 벽 */
    const 일 = 일람(종, 부호)
    const 일폭 = 수(일 && (종 === '보' ? 일.폭 : 일.두께))
    const 자리폭 = 일폭 > 0 ? 일폭 : 10                     // 일람 폭이 없으면 자리 잡는 데만 10 mm(물량은 일람 값으로 — 빈칸이면 ❓)
    if (g.닫힘 && g.그림.length >= 3 && !둥근(r)) {
      const P = 깨끗(g.그림)
      const 띠 = 띠꼴(P)
      if (띠) {
        일람챙김(종, 부호, 종 === '보' ? { 폭: 띠.폭 } : { 두께: 띠.폭 }, '바깥선 네모의 짧은 변')
        const [c0, c1] = 띠가운데(P)
        const [m0, m1] = 끝맞춤(맥, 종, 층, c0, c1, 띠.폭)
        넣기([r.id], b, 종, 층, 부호, m0 === c0 && m1 === c1 ? P : 띠(m0, m1, 띠.폭))
        continue
      }
      /* 닫힌 고리(방 둘레를 가운데 줄로 그림) — 변마다(꼭짓점이 서로 이어져 있어 끝을 옮기지 않음) */
      일람챙김(종, 부호, {})
      for (let i = 0; i < P.length; i++) 넣기([r.id], b, 종, 층, 부호, 띠(P[i], P[(i + 1) % P.length], 자리폭))
      continue
    }
    const 점들 = 둥근(r) ? 토막(g.그림) : g.그림
    if (점들.length < 2) { 못.push({ id: r.id, 까닭: '너무 짧은 선' }); continue }
    일람챙김(종, 부호, {})
    for (let i = 0; i + 1 < 점들.length; i++) {
      let p = 점들[i], q = 점들[i + 1]
      if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 50) continue
      if (!둥근(r)) [p, q] = 끝맞춤(맥, 종, 층, p, q, 자리폭, [i === 0, i + 2 === 점들.length])      // 꺾은선 안쪽 꼭짓점은 그대로(이어짐) · 두 끝만
      넣기([r.id], b, 종, 층, 부호, 띠(p, q, 자리폭), 둥근(r) ? { 곡선토막: true } : {})
    }
  }

  /* 📐 일람 ↔ 캐드 크기 다름 — 같은 부호 · 같은 칸에 캐드 값이 하나뿐인 것만 «일람을 캐드 크기로» 고칠 수 있음(값이 여럿이면 도면부터 확인) */
  const 고침표 = new Map()
  for (const x of 크기고침) { const k = x.종 + '|' + x.부호 + '|' + x.칸; const a = 고침표.get(k); if (!a) 고침표.set(k, { ...x, 값들: new Set([x.캐드]) }); else a.값들.add(x.캐드) }
  const 크기다름 = [...고침표.values()].map((x) => ({ 종: x.종, 부호: x.부호, 칸: x.칸, 일람: x.일람, 캐드: x.캐드, 여럿: x.값들.size > 1 ? [...x.값들].sort((p, q) => p - q) : null }))
  const 빈결과 = { M, 세움: 0, 겹침: 0, 못, 일람더함, 다른크기, 크기다름, 제안: 0, 보조: 0, 채움: 0, 종류별: {}, 대상: 대상.length }
  if (!도면부재.length) return 빈결과
  const R = { 공사: { 층: M.층, 배근, ...(M.기준 ? { 기준: M.기준 } : {}) } }
  const 전 = 도면에서모델({ 부재: 도면부재, 통심: [] }, R, { 기존: M, 이름: M.이름 })
  for (const x of 전.못옮김) {
    const id = x.id !== undefined ? String(x.id).split('#')[0].split('+')[0] : null
    못.push({ id, 까닭: x.까닭 + (x.기호 ? ' «' + x.기호 + '»' : '') })
  }
  const 결 = 평면가져오기(M, { ...전.M, 빠짐: [] }, new Set([캐드키]))
  if (결.틀림) return { ...빈결과, 틀림: 결.틀림 }
  /* 층 표 · «도면에서» 표시는 지금 모델 그대로 — 평면가져오기는 안 쓴 층(층고 빈칸)을 뒤로 보낼 수 있고 · 손으로 만든 모델을 «도면에서 세운 모델» 로 바꿈 */
  let N = { ...결.M, 층: M.층 }
  if (M.도면에서) N.도면에서 = M.도면에서; else delete N.도면에서
  const 앞id = new Set((M.부재 || []).map((o) => o.id))
  const 새것 = N.부재.filter((o) => !앞id.has(o.id) && o.근거 && o.근거.키 === 캐드키)
  /* 줄에 높이(m)를 적었으면 그 줄에서 세운 기둥 · 벽에 높이(mm — 그 층 바닥에서 윗면까지 · 비면 층고) */
  const 줄표 = new Map(((캐드 && 캐드.줄) || []).map((r) => [r.id, r]))
  let 높이씀 = 0
  N = { ...N, 부재: N.부재.map((o) => {
    if (!새것.includes(o) || (o.종류 !== '기둥' && o.종류 !== '벽')) return o
    const r = 줄표.get(String(o.근거.원).split('#')[0].split('+')[0])
    const h = r ? 수(r.높이) : null
    if (h > 0) { 높이씀++; return { ...o, 높이: 둥(h * 1000) } }
    return o
  }) }
  /* 🟥 빨간 곳(빠짐) — 같은 층 · 같은 종류 · 그 가운데가 새로 세운 모양 안이면 지움 */
  let 채움 = 0
  if (Array.isArray(N.빠짐) && N.빠짐.length && 새것.length) {
    const 새판 = 새것.map((o) => 원판.get(String(o.근거.원))).filter(Boolean)
    const 남 = N.빠짐.filter((v) => {
      if (!Array.isArray(v.판) || v.판.length < 3) return true
      const [a, bb, c, d] = 상자(v.판), cx = (a + c) / 2, cy = (bb + d) / 2
      const 채 = 새판.some((s) => s.층 === v.층 && s.종류 === v.종류 && (안(s.판, cx, cy) || 상자안(s.판, cx, cy)))
      if (채) 채움++
      return !채
    })
    N = { ...N, 빠짐: 남 }
  }
  const 종류별 = {}
  for (const o of 새것) 종류별[o.종류] = (종류별[o.종류] || 0) + 1
  const 보조 = (N.통심.x.length + N.통심.y.length) - (((M.통심 && M.통심.x) || []).length + ((M.통심 && M.통심.y) || []).length)
  return { M: N, 세움: 새것.length, 겹침: Math.max(0, 전.옮김 - 결.더함), 못, 일람더함, 다른크기, 크기다름, 제안: 새것.filter((o) => o.제안).length, 보조, 채움, 높이씀, 종류별, 대상: 대상.length, 맞춤: 맥.맞춤 }
}

/** 📐 일람을 캐드에서 잰 크기로(사람이 누를 때만 — 크기다름 가운데 캐드 값이 하나인 것) · 「만든」 칸에 무엇을 바꿨는지 남김 */
export function 일람캐드로(M, 크기다름) {
  const 고 = (크기다름 || []).filter((x) => !x.여럿 && Number.isFinite(x.캐드))
  if (!고.length) return { M, 고침: 0 }
  const 배근 = { ...M.배근 }
  let 고침 = 0
  for (const x of 고) {
    const 줄들 = (배근[x.종] || []).map((r) => ({ ...r }))
    const r = 줄들.find((y) => 글(y.기호).toUpperCase() === x.부호)
    if (!r || !(x.칸 in { 가로: 1, 세로: 1, 지름: 1, 폭: 1, 두께: 1 })) continue
    const 전 = r[x.칸]
    r[x.칸] = String(x.캐드)
    r.만든 = (글(r.만든) ? 글(r.만든) + ' · ' : '') + '📐 ' + x.칸 + ' ' + 전 + ' → ' + x.캐드 + '(캐드에서 잰 크기로 — 사람이 고름)'
    배근[x.종] = 줄들
    고침++
  }
  return { M: 고침 ? { ...M, 배근 } : M, 고침 }
}
const 상자안 = (P, x, y) => { const [a, b, c, d] = 상자(P); return x >= a - 1 && x <= c + 1 && y >= b - 1 && y <= d + 1 && P.length === 4 }

/** 결과를 한 줄 글로(화면 알림) */
export function 세움글(결) {
  if (결.틀림) return '🧱 ' + 결.틀림
  const 종 = Object.entries(결.종류별 || {}).map(([k, v]) => k + ' ' + v).join(' · ')
  const 말 = []
  if (결.세움) 말.push('🧱 골조 모델에 ' + 결.세움 + '개를 세웠습니다(' + 종 + ') — 세우기 탭 3D · 물량 탭에서 확인(↶ 되돌리기)')
  else 말.push('🧱 새로 세운 부재가 없습니다')
  if (결.겹침) 말.push('같은 자리에 이미 있어 안 더한 것 ' + 결.겹침)
  if (결.맞춤) 말.push('지금 모델 기둥 · 보 · 벽에 끝 · 변 ' + 결.맞춤 + '곳 맞춤(받침 가운데로)')
  if (결.보조) 말.push('통심 ' + 결.보조 + '줄 더함(캐드 자리)')
  if (결.제안)말.push('🟨 비스듬한 · 곡선 토막 ' + 결.제안 + '개는 노랗게(확인 뒤 ✓)')
  if (결.채움) 말.push('🟥 빨간 곳 ' + 결.채움 + '곳을 캐드로 채움')
  if (결.높이씀) 말.push('적은 높이를 기둥 · 벽 ' + 결.높이씀 + '개에 씀')
  if (결.일람더함 && 결.일람더함.length) 말.push('부호 일람에 새 부호 ' + 결.일람더함.length + '(' + 결.일람더함.slice(0, 6).join(' · ') + (결.일람더함.length > 6 ? ' …' : '') + ') — 캐드에서 잰 크기만 · 춤 · 두께 · 철근 ❓ 는 일람에서 적어 주십시오')
  if (결.다른크기 && 결.다른크기.length) 말.push('⚠ 일람과 캐드 크기가 다름: ' + 결.다른크기.slice(0, 4).join(' · ') + (결.다른크기.length > 4 ? ' …' : ''))
  if (결.못 && 결.못.length) {
    const 까 = new Map()
    for (const x of 결.못) 까.set(x.까닭, (까.get(x.까닭) || 0) + 1)
    말.push('못 세운 줄 ' + 결.못.length + ' — ' + [...까].slice(0, 4).map(([k, v]) => k + (v > 1 ? ' (' + v + ')' : '')).join(' / ') + ' — 그 줄은 이 표 수량으로 그대로 셈')
  }
  return 말.join(' · ')
}
