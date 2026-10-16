/**
 * 🏗 BIM 물량 — 캐드 도면에서 읽은 골조를 «자리 · 높이가 있는 덩어리(부재 모델)» 로 (G225 · 2026-10-10)
 *
 * 소장님: 「난 프로그램 만들고, 거기에 캐드 도면 넣어서 물량 뽑고, 3D세우고 싶어..」 · 「도면 수정을 하지 않게 해줘. 그러면서 물량 나오고, 3D보고…」
 *         「새화면으로 해줘」 · 「최대한 잘 만들어 줘」  (설계 docs/우리레빗_설계_261010.md)
 *
 * ■ 하는 일 — 도면은 «읽기만» 합니다(고치지 않음 · 고쳐 오라 하지 않음)
 *   ① 골조 자동(lib/골조자동.js 골조읽기)이 읽은 주자료 줄마다 «도면의 자리»(_자리)가 있습니다.
 *      보 · 벽 = 두 선 사이 «축»(두 끝 · 폭) · 슬래브 = 받침 가운데까지 네모 · 기둥 · 기초 = 기호 글자 자리
 *   ② 기둥 · 기초는 기호 글자 곁에서 «일람표 크기와 같은 닫힌 선» 을 찾아 그 모양 그대로(없으면 글자 자리 + 짐작 표시)
 *   ③ 층마다 평면 자리가 다르니 같은 자리로 맞춤 — 통심선 기호(X1 · Y1 · A · 1 …) → 없으면 기둥 자리 겹치기(투표) → 없으면 테두리(짐작)
 *   ④ 높이: n층 기둥 · 벽 = n층 바닥 ~ 위층 바닥 · n층 보 · 슬래브 = 위층 바닥에서 춤 · 두께만큼 아래 (골조.js 층 규칙과 같음)
 *   ⑤ 물량: 골조.js 셈의 줄(곳 = 표 · 줄번호)을 그 줄의 부재 개수(QT)로 나눠 부재마다 — 산출서와 «한 자리도» 안 다름
 * ■ 짐작은 늘 이유와 함께(부재.짐작 · 결과.짐작) — 숨기지 않습니다.
 * ■ 좌표는 mm · 원점은 맞춘 기준 평면의 통심 교점(X1 · Y1 처럼 첫 줄끼리), 없으면 기둥 가운데의 왼쪽 아래.
 * ■ 시험: node tools/시험_BIM물량.mjs (가상 3층 · 손으로 적은 답)
 */
import { 도면준비 } from './골조자동.js'
import { 통심기호, 통심옮김 } from './통심.js'
export { 통심옮김 }
import { 층떼기 } from './골조.js'
import { 구역올림 } from './지붕높이.js'

export const 종류들 = ['기초', '기둥', '벽', '보', '슬라브', '계단']
export const 종류색 = { 기초: [0.72, 0.47, 0.32], 기둥: [0.52, 0.33, 0.84], 벽: [0.24, 0.74, 0.72], 보: [0.98, 0.76, 0.22], 슬라브: [0.80, 0.83, 0.88], 계단: [0.93, 0.50, 0.42] }   // 🎨 G232 BIM 프로그램처럼 또렷하게 — 기초 벽돌색 · 기둥 보라 · 벽 청록 · 보 노랑 · 슬래브 옅은 회청
export const 종류표 = { 보: '보', 기둥: '기둥', 슬라브: '슬라브', 옹벽: '벽', 기초: '기초', 계단: '계단' }   // 🧭 G274 계단(평면 계단판 자리 — 참 높이에 판 하나)   // 골조.js 주자료 표 → 부재 종류

const 글 = (x) => String(x ?? '').trim()
const 수 = (v) => { const n = parseFloat(String(v ?? '').replace(/,/g, '')); return Number.isFinite(n) ? n : NaN }
const 반 = (v, d = 1) => { const k = Math.pow(10, d); return Math.round(v * k) / k }

/* ───────────────────────────── 도면 한 장: 통심 기호 · 원 · 선 */

/** 통심 기호 — 골조 도면(골조도면.js 도면읽기)의 원 · 긴 선 · 글자 → lib/통심.js 통심기호 */
export function 통심찾기(D) {
  const { 모델, k } = D
  const { E, Q, P } = 모델
  const 원 = [], 선 = []
  for (let q = 0; q < Q.e.length; q++) {
    const e = Q.e[q], t = E.t[e]
    const s = Q.p0[q], n = Q.pn[q]
    if (t === 5) {          // 원
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
      for (let j = 0; j < n; j++) { const x = P[(s + j) * 2] * k, y = P[(s + j) * 2 + 1] * k; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
      const r = (x1 - x0 + y1 - y0) / 4
      if (r >= 120 && r <= 1500) 원.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, r })
    } else if (t === 1 || t === 2) {
      for (let j = 0; j + 1 < n; j++) {
        const ax = P[(s + j) * 2] * k, ay = P[(s + j) * 2 + 1] * k, bx = P[(s + j + 1) * 2] * k, by = P[(s + j + 1) * 2 + 1] * k
        if (Math.hypot(bx - ax, by - ay) >= 2500) 선.push([ax, ay, bx, by])
      }
    }
  }
  return 통심기호({ 원, 선, 글자: D.글자 })
}

/* ───────────────────────────── 맞춤 */

/** 점 두 무리 — 같은 자리로 놓는 옮김(투표 · 50 mm 칸) · 맞은 수
 *  🧭 G245 기호(몸)를 주면 같은 기호끼리만 셈 — 기둥이 바둑판(8.4 m 간격)이면 한 칸 옮겨도 다 겹쳐 «7/7» 이 여러 곳에서 나와,
 *  도면 원점에 따라 엉뚱한 줄(C1A 를 C1 줄)에 맞춰 같은 기둥을 두 번 셌음(현장 D FOOTING PLAN). 같은 수면 덜 옮기는 쪽(원점과 관계없이 같은 답) */
export function 겹침투표(기준, 옮길, 허용 = 60, 기준몸 = null, 옮길몸 = null) {
  if (!기준.length || !옮길.length) return null
  const 고름 = (n) => { const st = n > 1500 ? Math.ceil(n / 1500) : 1; const a = []; for (let i = 0; i < n; i += st) a.push(i); return a }
  const Ai = 고름(기준.length), Bi = 고름(옮길.length)
  const 몸씀 = !!(기준몸 && 옮길몸 && 기준몸.length === 기준.length && 옮길몸.length === 옮길.length && 옮길몸.some((b) => b && 기준몸.includes(b)))
  const 같 = (i, j) => !몸씀 || 기준몸[i] === 옮길몸[j]
  const 표 = new Map()
  const 칸 = 50
  for (const i of Ai) for (const j of Bi) {
    if (!같(i, j)) continue
    const p = 기준[i], q = 옮길[j]
    const dx = p[0] - q[0], dy = p[1] - q[1]
    const key = Math.round(dx / 칸) + ',' + Math.round(dy / 칸)
    표.set(key, (표.get(key) || 0) + 1)
  }
  const 크 = (k) => { const [i, j] = k.split(',').map(Number); return Math.abs(i) + Math.abs(j) }
  const 후보 = [...표].sort((a, b) => b[1] - a[1] || 크(a[0]) - 크(b[0])).slice(0, 6)
  let best = null
  for (const [key] of 후보) {
    const [i0, j0] = key.split(',').map(Number)
    let tx = i0 * 칸, ty = j0 * 칸
    for (let pass = 0; pass < 2; pass++) {
      let sx = 0, sy = 0, n = 0
      for (const j of Bi) {
        const q = 옮길[j]
        let bd = 허용 * 허용, bp = null
        for (const i of Ai) { if (!같(i, j)) continue; const p = 기준[i]; const d = (p[0] - q[0] - tx) ** 2 + (p[1] - q[1] - ty) ** 2; if (d < bd) { bd = d; bp = p } }
        if (bp) { sx += bp[0] - q[0]; sy += bp[1] - q[1]; n++ }
      }
      if (n) { tx = sx / n; ty = sy / n }
      if (pass === 1 && (!best || n > best.n || (n === best.n && Math.abs(tx) + Math.abs(ty) < Math.abs(best.tx) + Math.abs(best.ty)))) best = { tx, ty, n }
    }
  }
  return best && best.n ? { ...best, 전체: Math.min(Ai.length, Bi.length) } : null
}

/* ───────────────────────────── 기둥 · 기초 모양 찾기 */

function 모양찾기(D, 글상자, 가로, 세로, 지름, 쓴) {
  const cx = (글상자[0] + 글상자[2]) / 2, cy = (글상자[1] + 글상자[3]) / 2
  const 큰 = Math.max(가로 || 0, 세로 || 0, 지름 || 0) || 600
  const 멀리 = Math.max(큰 * 2.5, 1500)
  const 맞나 = (w, h, 너그) => {
    const tol = (v) => Math.max(30, v * 너그)
    if (지름 > 0) return Math.abs(w - 지름) <= tol(지름) && Math.abs(h - 지름) <= tol(지름)
    if (!(가로 > 0)) return false
    const b = 세로 > 0 ? 세로 : 가로
    return (Math.abs(w - 가로) <= tol(가로) && Math.abs(h - b) <= tol(b)) || (Math.abs(w - b) <= tol(b) && Math.abs(h - 가로) <= tol(가로))
  }
  const 거리 = (b) => { const dx = Math.max(b[0] - cx, 0, cx - b[2]), dy = Math.max(b[1] - cy, 0, cy - b[3]); return Math.hypot(dx, dy) }
  if (!D._닫힌칸) {
    const 표 = new Map()
    for (const c of D.닫힌) {
      const b = c.b
      if (b[2] - b[0] > 20000 || b[3] - b[1] > 20000) continue          // 도곽 · 표 테두리 같은 큰 것은 기둥 · 기초가 아님
      if (c.글틀) continue                                               // 🧭 G245 기호 글자를 감싼 네모(글자 틀)도 아님
      const key = Math.floor((b[0] + b[2]) / 2 / 3000) * 100003 + Math.floor((b[1] + b[3]) / 2 / 3000)
      const a = 표.get(key); if (a) a.push(c); else 표.set(key, [c])
    }
    D._닫힌칸 = 표
  }
  const 곁닫힌 = []
  {
    const r = Math.ceil((멀리 + 큰) / 3000)
    const i0 = Math.floor(cx / 3000), j0 = Math.floor(cy / 3000)
    for (let i = i0 - r; i <= i0 + r; i++) for (let j = j0 - r; j <= j0 + r; j++) { const a = D._닫힌칸.get(i * 100003 + j); if (a) 곁닫힌.push(...a) }
  }
  for (const 너그 of [0.05, 0.25]) {
    let best = null
    for (const c of 곁닫힌) {
      if (쓴.has(c)) continue
      const b = c.b
      const w = b[2] - b[0], h = b[3] - b[1]
      if (!맞나(w, h, 너그)) continue
      const d = 거리(b)
      if (d > 멀리) continue
      if (!best || d < best.d) best = { c, d }
    }
    if (best) { 쓴.add(best.c); return { b: best.c.b, 원: best.c.원 || 지름 > 0, 너그 } }
  }
  /* 🧭 G292 ⑥ 맞는 모양이 이미 다른 기호 글자에 쓰였으면 — 한 기둥에 기호를 둘 적은 것(기둥 안 작은 글자 «C2 · 600*600» + 곁의 기호 틀 «C2») · 두 번 세지 않음 */
  for (const c of 곁닫힌) {
    if (!쓴.has(c)) continue
    const b = c.b
    if (맞나(b[2] - b[0], b[3] - b[1], 0.05) && 거리(b) <= 멀리) return { 중복: true, b }
  }
  return null
}

/** 평면 한 무리의 «줄 자리» — 세로 줄(x) · 가로 줄(y): 기둥 가운데 · 가로세로 보 · 벽 축 · 통심선 (10 mm 로 반올림 · 겹친 것 하나로) */
function 축값(m) {
  const x = new Set(), y = new Set()
  const 넣 = (S, v) => S.add(Math.round(v / 10) * 10)
  for (const o of m.부재) {
    const P = o.판
    if (o.종류 === '기둥' && !o.글자자리) { const c = 가운데(P); 넣(x, c[0]); 넣(y, c[1]) }
    else if ((o.종류 === '보' || o.종류 === '벽') && P.length === 4) {
      const a = [(P[0][0] + P[3][0]) / 2, (P[0][1] + P[3][1]) / 2], b = [(P[1][0] + P[2][0]) / 2, (P[1][1] + P[2][1]) / 2]
      const dx = Math.abs(b[0] - a[0]), dy = Math.abs(b[1] - a[1])
      if (dx > dy * 20) 넣(y, (a[1] + b[1]) / 2)
      else if (dy > dx * 20) 넣(x, (a[0] + b[0]) / 2)
    }
  }
  for (const g of m.기호 || []) { if (g.각칸 === 0) 넣(y, g.off); else if (g.각칸 === 90) 넣(x, -g.off) }
  return { x: [...x], y: [...y] }
}
/** 1차원 줄 맞추기 — 기준 줄들(A)에 옮길 줄들(B)을 d 만큼 옮겨 가장 많이 겹치게(40 mm 안) */
export function 줄투표(A, B, 허용 = 40) {
  if (!A.length || !B.length) return null
  const 표 = new Map()
  const a = A.length > 3000 ? A.filter((_, i) => i % Math.ceil(A.length / 3000) === 0) : A
  for (const p of a) for (const q of B) { const key = Math.round((p - q) / 25); 표.set(key, (표.get(key) || 0) + 1) }
  const 후보 = [...표].sort((p, q) => q[1] - p[1] || Math.abs(p[0]) - Math.abs(q[0])).slice(0, 6)     // 🧭 G245 같은 수면 덜 옮기는 쪽(원점과 관계없이)
  const As = [...A].sort((p, q) => p - q)
  const 가까 = (v) => { let lo = 0, hi = As.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (As[mid] < v) lo = mid + 1; else hi = mid } let best = As[lo]; if (lo > 0 && Math.abs(As[lo - 1] - v) < Math.abs(best - v)) best = As[lo - 1]; return best }
  let best = null
  for (const [key] of 후보) {
    let d = key * 25
    for (let pass = 0; pass < 2; pass++) {
      let s = 0, n = 0
      for (const q of B) { const t = 가까(q + d); if (Math.abs(t - q - d) <= 허용) { s += t - q; n++ } }
      if (n) d = s / n
      if (pass === 1 && (!best || n > best.n || (n === best.n && Math.abs(d) < Math.abs(best.d)))) best = { d, n }
    }
  }
  return best && best.n ? { ...best, 전체: Math.min(A.length, B.length) } : null
}

/** 부재 무리 나누기 — 테두리가 틈(6 m)보다 가까우면 같은 무리(한 평면) */
export function 무리나누기(부재들, 틈 = 6000) {
  const n = 부재들.length
  if (n <= 1) return [부재들]
  const 부모 = [...Array(n).keys()]
  const 찾 = (i) => { while (부모[i] !== i) { 부모[i] = 부모[부모[i]]; i = 부모[i] } return i }
  const 합 = (i, j) => { const a = 찾(i), b = 찾(j); if (a !== b) 부모[a] = b }
  /* 🧭 G245 «6 m 넘게 떨어지면 다른 평면» 을 정확히 — 전엔 6 m 칸(격자)을 같이 쓰면 묶어, 도면 원점이 조금만 달라도(새로 읽은 도형으로 도면 가운데가 옮겨짐)
     무리가 달라졌음(현장 D: 같은 기둥을 그린 상세 평면 15개가 큰 평면에 섞여 기둥 8개를 두 번 셈 · 원점에 따라 678.51 / 680.08 / 682.28 ㎥).
     이제 칸은 «후보 찾기» 에만 쓰고, 두 부재 상자 사이 틈이 가로 · 세로 모두 6 m 안일 때만 묶음 — 원점과 관계없이 같은 답 */
  const 칸 = Math.max(틈, 3000), 표 = new Map()
  const 상자 = 부재들.map((o) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const p of o.판) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1] }
    return [x0, y0, x1, y1]
  })
  const 가깝 = (a, b) => Math.max(0, b[0] - a[2], a[0] - b[2]) <= 틈 && Math.max(0, b[1] - a[3], a[1] - b[3]) <= 틈
  부재들.forEach((o, i) => {
    const [x0, y0, x1, y1] = 상자[i]
    const i0 = Math.floor((x0 - 틈 / 2) / 칸), i1 = Math.floor((x1 + 틈 / 2) / 칸), j0 = Math.floor((y0 - 틈 / 2) / 칸), j1 = Math.floor((y1 + 틈 / 2) / 칸)
    if ((i1 - i0 + 1) * (j1 - j0 + 1) > 400) return
    for (let a = i0; a <= i1; a++) for (let b = j0; b <= j1; b++) {
      const key = a * 100003 + b
      const 들 = 표.get(key)
      if (!들) { 표.set(key, [i]); continue }
      for (const j of 들) if (찾(i) !== 찾(j) && 가깝(상자[i], 상자[j])) 합(i, j)
      들.push(i)
    }
  })
  const 무리 = new Map()
  부재들.forEach((o, i) => { const r = 찾(i); const a = 무리.get(r); if (a) a.push(o); else 무리.set(r, [o]) })
  return [...무리.values()].sort((a, b) => b.length - a.length)
}

/* ───────────────────────────── 모양 · 부피 */

export function 넓이(판) {
  let s = 0
  for (let i = 0; i < 판.length; i++) { const a = 판[i], b = 판[(i + 1) % 판.length]; s += a[0] * b[1] - b[0] * a[1] }
  return Math.abs(s) / 2
}
const 네모판 = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
function 원판(cx, cy, r, n = 24) { const out = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]) } return out }
function 띠판(ax, ay, bx, by, w) {
  const L = Math.hypot(bx - ax, by - ay) || 1
  const nx = -(by - ay) / L * w / 2, ny = (bx - ax) / L * w / 2
  return [[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]]
}
const 가운데 = (판) => { let x = 0, y = 0; for (const p of 판) { x += p[0]; y += p[1] } return [x / 판.length, y / 판.length] }

/**
 * 🧭 G281 벽 끝 몫 — 한 평면(같은 도면 · 층 · 평면)의 벽 토막마다 «단부 보강근»(벽 일람 C 칸 «4-HD13» — 벽 끝 수직 보강근)이 들 끝 수(0 ~ 2) → o.벽끝.
 *   기둥에 닿은 끝 0 · 같은 줄로 곧게 이어진 끝 0(이름표 · 문 자리로 나뉜 한 벽) · 홀로 끝(문 · 개구부 옆) 1 ·
 *   꺾이거나 만나는 데(L · T · +)는 그 자리에 한 벌 — 그 자리에서 끝나는 토막 수로 나눔(T 의 줄기 1 · L 은 반씩).
 *   셈(골조.js)은 줄마다 이 몫의 평균(겹친것빼기 → «_단부끝»)을 씀 · 예전엔 토막마다 양 끝 2 로 셈 */
export function 벽끝재기(부재) {
  const 축 = (o) => {
    const P = o.판
    if (!P || P.length !== 4) return null
    const 길 = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]), 중 = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    return 길(P[0], P[1]) >= 길(P[1], P[2]) ? [...중(P[3], P[0]), ...중(P[1], P[2])] : [...중(P[0], P[1]), ...중(P[2], P[3])]
  }
  const 벽들 = 부재.filter((o) => o.종류 === '벽' && !o.겹침).map((o) => ({ o, a: 축(o), w: o.폭 || 200 })).filter((x) => x.a)
  if (!벽들.length) return
  const 기둥틀 = 부재.filter((o) => o.종류 === '기둥' && o.판 && o.판.length).map((o) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const p of o.판) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1] }
    return [x0, y0, x1, y1]
  })
  const 선거리 = (px, py, a) => {
    const dx = a[2] - a[0], dy = a[3] - a[1], L2 = dx * dx + dy * dy
    const t = L2 ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / L2)) : 0
    return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy)
  }
  for (const x of 벽들) {
    const [x0, y0, x1, y1] = x.a, L = Math.hypot(x1 - x0, y1 - y0)
    if (!(L > 0)) continue
    const ux = (x1 - x0) / L, uy = (y1 - y0) / L
    let 몫 = 0
    for (const [px, py] of [[x0, y0], [x1, y1]]) {
      const e = x.w / 2 + 60
      if (기둥틀.some((b) => px >= b[0] - e && px <= b[2] + e && py >= b[1] - e && py <= b[3] + e)) continue
      const 닿 = 벽들.filter((q) => q !== x && 선거리(px, py, q.a) <= (x.w + q.w) / 2 + 60)
      if (!닿.length) { 몫 += 1; continue }
      const 곧 = (q) => { const Lq = Math.hypot(q.a[2] - q.a[0], q.a[3] - q.a[1]); return Lq > 0 && Math.abs(ux * (q.a[3] - q.a[1]) / Lq - uy * (q.a[2] - q.a[0]) / Lq) < 0.05 }
      if (닿.every(곧)) continue
      const 끝수 = 닿.filter((q) => Math.min(Math.hypot(px - q.a[0], py - q.a[1]), Math.hypot(px - q.a[2], py - q.a[3])) <= (x.w + q.w) / 2 + 60).length
      몫 += 1 / (끝수 + 1)
    }
    x.o.벽끝 = Math.round(몫 * 1000) / 1000
  }
}

/* ───────────────────────────── 모델 만들기 */

/**
 * @param {{모델, 이름, k}[]} 도면들 골조읽기에 넣은 것과 같은 차례 · 같은 이름
 * @param {object} R 골조읽기 결과
 * @param {{높이?:Object<string,number>, 기초위?:number}} 옵션 높이: 층 이름 → 바닥 높이(mm, 짐작값을 사람이 고친 것)
 * @returns {{부재, 층, 맞춤, 짐작, 경고, 틀, 원점, 묶음수}}
 */
export function 모델만들기(도면들, R, 옵션 = {}) {
  const 경고 = [], 짐작 = []
  const 부재 = []
  if (!R || !R.공사 || !R.공사.동 || !R.공사.동.length) return { 부재, 층: [], 맞춤: [], 짐작, 경고: ['읽은 골조가 없습니다'], 틀: null, 원점: null }
  const 공사 = R.공사
  const 주 = 공사.동[0].주자료
  const 배 = 공사.배근 || {}
  const 찾배 = (표, 기호) => {
    const a = 배[표] || []
    const t = 글(기호).toUpperCase()
    return a.find((x) => 글(x.기호).toUpperCase() === t) || a.find((x) => 층떼기(x.기호)[1] === 층떼기(t)[1]) || null
  }
  /* 도면 이름 → 번 */
  const 번표 = new Map()
  도면들.forEach((d, i) => { if (!번표.has(d.이름 || '')) 번표.set(d.이름 || '', i) })
  const 준비들 = new Map()
  const 준 = (번) => { if (!준비들.has(번)) { const d = 도면들[번]; 준비들.set(번, 도면준비(d.모델, d.k || 1, 번)) } return 준비들.get(번) }
  const 쓴모양 = new Map()

  /* ① 층 높이 */
  const 층목록 = (공사.층 || []).map((f) => 글(f.이름))
  const 이야기 = 층목록.filter((n) => n && n !== 'FT')
  const 높이 = new Map()
  let 누적 = 0
  for (const f of 공사.층 || []) {
    const n = 글(f.이름)
    if (n === 'FT') continue
    const 읽은 = R.읽음 && R.읽음.높이 ? R.읽음.높이[n] : undefined
    const 고친 = 옵션.높이 ? 옵션.높이[n] : undefined
    const v = Number.isFinite(+고친) && 고친 !== '' && 고친 !== null ? +고친 : (Number.isFinite(+읽은) && 읽은 !== null && 읽은 !== undefined ? +읽은 : 누적)
    높이.set(n, v)
    누적 = v + (수(f.층고) || 0)
  }
  const 짐작층 = new Set((R.읽음 && R.읽음.층고짐작) || [])
  const 다음층 = (n) => { const i = 이야기.indexOf(n); return i >= 0 && i + 1 < 이야기.length ? 이야기[i + 1] : null }
  const 바닥 = (n) => (높이.has(n) ? 높이.get(n) : 0)
  const 위바닥 = (n) => {
    const nx = 다음층(n)
    if (nx && 높이.has(nx)) return 높이.get(nx)
    const f = (공사.층 || []).find((x) => 글(x.이름) === n)
    return 바닥(n) + ((f && 수(f.층고)) || 3300)
  }
  const 첫층 = 이야기[0] || '1'

  /* ② 부재 하나씩 (도면 좌표 mm · 아직 안 맞춤) */
  const 넣기 = (o) => { o.id = 부재.length; 부재.push(o); return o }
  const 묶음 = new Map()          // 번|층 → {번, 층, 부재:[]}
  const 묶 = (번, 층, o) => { const key = 번 + '|' + 층; let m = 묶음.get(key); if (!m) { m = { key, 번, 층, 부재: [] }; 묶음.set(key, m) } m.부재.push(o) }
  for (const [표, 종] of Object.entries(종류표)) {
    ;(주[표] || []).forEach((r, i) => {
      const 자리들 = r._자리 || []
      if (!자리들.length) return
      const 층 = 글(r.층) || 첫층
      const 기호 = 글(r.기호)
      const b = 찾배(표 === '옹벽' ? '벽' : 표, 기호)
      자리들.forEach((z, kk) => {
        const 번 = 번표.has(z.n || '') ? 번표.get(z.n || '') : 0
        const D0 = 도면들[번]
        if (!D0) return
        const kd = D0.k || 1
        const o = { 종류: 종, 표, i, kk, 층, 기호, 몸: 층떼기(기호)[1] || 기호, 근거: { n: z.n, r: z.r }, 짐작: [], 번, 평면: z.p || '' }
        if (z.받침층) o.받침층 = 글(z.받침층)          // 🧭 G266 «N층 기초 평면» 의 기초(MAT) — N층 바닥을 받침
        /* 🧭 G241 일람표 상세 칸의 높이 글자로 읽은 윗면(FL 기준 mm — 현장 C · D 지중보 B1 −250 · 기초 F1 −550) · 기초 평면의 기둥 · 벽(주각) */
        { const w = b && b._윗면 !== undefined && b._윗면 !== '' ? +b._윗면 : NaN; if (Number.isFinite(w)) o.윗면 = w; if (r._기초판) o.기초판 = true }
        if (종 === '보' || 종 === '벽') {
          const w = 수(종 === '보' ? b && b.폭 : b && b.두께)
          const 축 = z.축
          if (축 && 축.length === 5) {
            const ww = w > 0 ? w : 축[4] * kd
            o.판 = 띠판(축[0] * kd, 축[1] * kd, 축[2] * kd, 축[3] * kd, ww)
            o.길이 = Math.hypot(축[2] - 축[0], 축[3] - 축[1]) * kd
            o.폭 = ww
          } else {
            const [x0, y0, x1, y1] = z.r.map((v) => v * kd)
            o.판 = 네모판(x0, y0, x1, y1)
            o.길이 = Math.max(x1 - x0, y1 - y0); o.폭 = Math.min(x1 - x0, y1 - y0)
          }
          if (종 === '보') { o.춤 = 수(b && b.춤); if (!(o.춤 > 0)) { o.춤 = 600; o.짐작.push('보 춤이 일람표에 없어 600 mm 로 그림') } }
        } else if (종 === '계단') {
          const [x0, y0, x1, y1] = z.r.map((v) => v * kd)
          o.판 = 네모판(x0, y0, x1, y1)
          o.두께 = 수(b && b.두께) || 150
        } else if (종 === '슬라브') {
          const [x0, y0, x1, y1] = z.r.map((v) => v * kd)
          o.판 = 네모판(x0, y0, x1, y1)
          o.두께 = 수(b && b.두께)
          if (!(o.두께 > 0)) { o.두께 = 150; o.짐작.push('슬래브 두께가 일람표에 없어 150 mm 로 그림') }
        } else if (종 === '기초' && z.판 && z.판.length >= 3) {
          /* 🧱 G233 MAT(온통) 기초 — 골조자동이 읽은 테두리 · 두꺼운 구역 모양 그대로(내림 = 기본 두께 아래로 더) */
          o.판 = z.판.map((p) => [p[0] * kd, p[1] * kd])
          o.두께 = 수(b && b.두께) || 600
          o.내림 = +z.내림 || 0
          o.매트 = true
          if (+z.몫 > 0) o.몫비 = +z.몫          // 두꺼운 구역이 여럿이면 넓이만큼 물량을 나눔
        } else {
          // 기둥 · 기초 — 기호 글자 곁의 닫힌 선
          const 가로 = 수(b && b.가로), 세로 = 수(b && b.세로), 지름 = 수(b && (b.지름 || (/원/.test(글(b.형태)) ? b.가로 : '')))
          const 글상자 = z.r.map((v) => v * kd)
          const D = 준(번)
          if (!쓴모양.has(번)) 쓴모양.set(번, new Set())
          const f0 = 모양찾기(D, 글상자, 가로, 세로, 지름 > 0 ? 지름 : 0, 쓴모양.get(번))
          const f = f0 && !f0.중복 ? f0 : null
          if (f0 && f0.중복) { o.중복기호 = true; o.짐작.push((종 === '기둥' ? '기둥' : '기초') + ' 하나에 기호 글자가 둘(곁의 기호 틀 · 안쪽 작은 글자) — 한 번만 셈') }
          if (f) {
            const [x0, y0, x1, y1] = f.b
            o.판 = f.원 ? 원판((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0 + y1 - y0) / 4) : 네모판(x0, y0, x1, y1)
            if (f.너그 > 0.05) o.짐작.push('도면의 ' + (종 === '기둥' ? '기둥' : '기초') + ' 크기가 일람표와 조금 달라(±25%) 도면 모양대로 그림 — 물량은 일람표 크기')
          } else {
            const cx = (글상자[0] + 글상자[2]) / 2, cy = (글상자[1] + 글상자[3]) / 2
            const a = 가로 > 0 ? 가로 : (지름 > 0 ? 지름 : 600), bb = 세로 > 0 ? 세로 : a
            o.판 = 지름 > 0 ? 원판(cx, cy, 지름 / 2) : 네모판(cx - a / 2, cy - bb / 2, cx + a / 2, cy + bb / 2)
            if (!o.중복기호) o.짐작.push((종 === '기둥' ? '기둥' : '기초') + ' 모양(닫힌 선)을 기호 곁에서 못 찾아 글자 자리에 일람표 크기로 그림')
            o.글자자리 = true
          }
          if (종 === '기초') { o.두께 = 수(b && b.두께); if (!(o.두께 > 0)) { o.두께 = 600; o.짐작.push('기초 두께가 일람표에 없어 600 mm 로 그림') } }
        }
        넣기(o)
        묶(번, 층, o)
      })
    })
  }
  if (!부재.length) return { 부재, 층: [], 맞춤: [], 짐작, 경고: ['읽은 부재에 도면 자리가 없습니다'], 틀: null, 원점: null }

  /* ③ 맞춤 — 평면(한 도면 · 한 층 · 한 자리 무리)마다 같은 자리로
   *   한 도면에 같은 층 평면이 둘(주심도 + 구조평면도 · 골구도에서 잘못 읽힌 기호)이면 자리로 나눔 — 부재끼리 6 m 넘게 떨어지면 다른 평면 */
  const 묶음들 = []
  /* 🧭 G245 무리는 먼저 «읽은 평면»(제목 · 판 — 골조자동이 자리마다 적은 p)으로 나누고, 평면을 모르는 것(제목 없는 글자 · MAT 테두리)만 거리로 나눔.
     전엔 모두 거리(6 m 칸)로 나눠 기둥만 8.4 m 간격인 평면이 도면 원점에 따라 둘로 갈리고, 갈린 쪽을 격자 한 칸 옮겨 «겹친 것» 으로 빼 기둥 9개가 빠졌음(현장 D) */
  for (const g0 of 묶음.values()) {
    const 평면별 = new Map()
    for (const o of g0.부재) { const k = o.평면 || ''; const a = 평면별.get(k); if (a) a.push(o); else 평면별.set(k, [o]) }
    for (const [k, a] of [...평면별].sort((x, y) => y[1].length - x[1].length)) for (const 무 of (k ? [a] : 무리나누기(a))) 묶음들.push({ key: g0.key + '|' + 묶음들.length, 번: g0.번, 층: g0.층, 부재: 무 })
  }
  for (const m of 묶음들) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const o of m.부재) for (const p of o.판) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1] }
    m.틀 = [x0, y0, x1, y1]
    m.기호 = []
  }
  // 통심 기호 — 도면마다 찾아, 그 통심선이 지나는 평면 중 가장 가까운 것에 줌(20 m 안 — 기호 원과 평면 사이에 치수선이 여러 줄인 도면)
  for (const 번 of new Set(묶음들.map((m) => m.번))) {
    const 기호 = 통심찾기(준(번))
    for (const g of 기호) {
      // 그 통심선이 지나는 평면(무리) 모두에 — 한 평면이 무리 여럿(기둥 · 벽이 6 m 넘게 떨어짐)으로 나뉘어도 같은 기호를 씀
      for (const m of 묶음들) {
        if (m.번 !== 번) continue
        const [x0, y0, x1, y1] = m.틀
        const d = Math.hypot(Math.max(x0 - g.x, 0, g.x - x1), Math.max(y0 - g.y, 0, g.y - y1))
        const [ax, ay, bx, by] = g.끝
        const 지남 = !(Math.max(ax, bx) < x0 - 500 || Math.min(ax, bx) > x1 + 500 || Math.max(ay, by) < y0 - 500 || Math.min(ay, by) > y1 + 500)
        if (d <= 20000 && 지남) m.기호.push(g)
      }
    }
  }
  /* 모양(닫힌 선)을 못 찾은 기둥 · 기초 — 글자 곁 «통심 교점» 이 있으면 그 자리에(2 m 안) */
  for (const m of 묶음들) {
    const 줄 = []
    for (const g of m.기호) if (!줄.some((z) => z.글 === g.글 && Math.abs(z.각칸 - g.각칸) < 1.01)) 줄.push(g)
    const 교점 = []
    for (let i = 0; i < 줄.length; i++) for (let j = i + 1; j < 줄.length; j++) {
      const A = 줄[i], B = 줄[j]
      const det = A.nx * B.ny - A.ny * B.nx
      if (Math.abs(det) < 0.3) continue
      교점.push([(A.off * B.ny - A.ny * B.off) / det, (A.nx * B.off - A.off * B.nx) / det, A.글 + '·' + B.글])
    }
    if (!교점.length) continue
    for (const o of m.부재) {
      if (!o.글자자리) continue
      const c = 가운데(o.판)
      let best = null
      for (const q of 교점) { const d = Math.hypot(q[0] - c[0], q[1] - c[1]); if (d < 2000 && (!best || d < best.d)) best = { q, d } }
      if (!best) continue
      const dx = best.q[0] - c[0], dy = best.q[1] - c[1]
      o.판 = o.판.map((p) => [p[0] + dx, p[1] + dy])
      o.글자자리 = false; o.교점자리 = true
      o.짐작 = o.짐작.map((w) => (/글자 자리/.test(w) ? (o.종류 === '기둥' ? '기둥' : '기초') + ' 모양(닫힌 선)을 못 찾아 가까운 통심 교점(' + best.q[2] + ')에 일람표 크기로 세움' : w))
    }
  }
  /* 🧭 G281 벽 끝 몫(단부 보강근) — 한 평면(같은 도면 · 같은 평면 이름 — 층이 달라도: 기초 평면의 벽은 1층 줄) 안에서 · 아직 도면 자리 그대로 */
  {
    const 평 = new Map()
    for (const m of 묶음들) for (const o of m.부재) { const k = o.번 + '|' + (o.평면 || '#' + m.key); const a = 평.get(k); if (a) a.push(o); else 평.set(k, [o]) }
    for (const a of 평.values()) 벽끝재기(a)
  }
  for (const m of 묶음들) {
    m.기둥점 = m.부재.filter((o) => o.종류 === '기둥' && !o.글자자리).map((o) => 가운데(o.판))
    m.기초점 = m.부재.filter((o) => o.종류 === '기초' && !o.글자자리).map((o) => 가운데(o.판))
    m.기둥몸 = m.부재.filter((o) => o.종류 === '기둥' && !o.글자자리).map((o) => o.몸 || o.기호)      /* 🧭 G245 겹침투표가 같은 기호끼리 맞추게 */
    m.기초몸 = m.부재.filter((o) => o.종류 === '기초' && !o.글자자리).map((o) => o.몸 || o.기호)
  }
  const 층차례 = (n) => { const i = 층목록.indexOf(n); return i < 0 ? 99 : i }
  const 이야기묶음 = 묶음들.filter((m) => m.층 !== 'FT')
  const 기준 = [...(이야기묶음.length ? 이야기묶음 : 묶음들)].sort((a, b) => 층차례(a.층) - 층차례(b.층) || b.기둥점.length - a.기둥점.length || b.부재.length - a.부재.length)[0]
  const 맞춤 = []
  기준.옮김 = [0, 0]; 기준.방법 = '기준'; 기준.힘 = Infinity
  맞춤.push({ 층: 기준.층, 번: 기준.번, 방법: '기준', 글: '기준 평면', 옮김: [0, 0], 수: 기준.부재.length, 기호수: 기준.기호.length, 종류: [...new Set(기준.부재.map((o) => o.종류))].join('·'), 후보: 0 })
  const 맞춘 = [기준]
  const 남 = 묶음들.filter((m) => m !== 기준).sort((a, b) => (a.층 === 'FT') - (b.층 === 'FT') || 층차례(a.층) - 층차례(b.층) || b.부재.length - a.부재.length)
  /* 🧭 G292 ② 한 무리 맞추기를 함수로 — 기준 자리를 고치면(아래 «기준 평면 다시 보기») 기준에 바로 맞췄던 무리만 다시 맞춤.
       짝 = 그 옮김을 준 맞춘 무리(통심 · 기둥 겹침 — 축 · 모양 · 테두리는 짝 없음) */
  const 무리맞추기 = (m, 믿을) => {
    const 후보 = []
    // ㉠ 통심 기호 — 맞춘 평면마다
    if (m.기호.length) {
      for (const a of 믿을) {
        if (!a.기호.length) continue
        const t = 통심옮김(a.기호.map((g) => ({ ...g, off: g.off + g.nx * a.옮김[0] + g.ny * a.옮김[1] })), m.기호)
        if (t && t.최대 < 30) 후보.push({ 짝: a, tx: t.tx, ty: t.ty, 방법: '통심', 글: '통심 기호 ' + t.글들.slice(0, 6).join(' · ') + (t.글들.length > 6 ? ' …' : '') + ' 로 맞춤', 힘: t.줄수 })
      }
    }
    // ㉡ 기둥(기초는 아래층 기둥) 자리 겹치기 — 맞춘 평면마다
    const 내점 = m.층 === 'FT' ? m.기초점 : m.기둥점
    const 허용 = m.층 === 'FT' ? 150 : 60
    if (내점.length) {
      for (const a of 믿을) {
        if (a.층 === 'FT') continue
        const 그점 = a.기둥점.map((p) => [p[0] + a.옮김[0], p[1] + a.옮김[1]])
        const v = 겹침투표(그점, 내점, 허용, a.기둥몸, m.층 === 'FT' ? m.기초몸 : m.기둥몸)
        if (v && v.n >= Math.min(3, v.전체) && v.n >= v.전체 * 0.5) 후보.push({ 짝: a, tx: v.tx, ty: v.ty, 방법: '기둥', 글: (m.층 === 'FT' ? '기초 가운데를 ' : '기둥 자리를 ') + (a.층 === 'FT' ? '기초' : a.층 + '층 기둥') + '에 겹쳐 맞춤 (' + v.n + '/' + v.전체 + ' 겹침)', 힘: v.n })
      }
    }
    // ㉢ 축 투표 — 기호 글자 없이도: 기둥 가운데 · 보 · 벽 축 · 통심선이 지나는 «줄 자리»(가로 줄 y · 세로 줄 x)를 따로따로 맞춤
    //   (주심도에는 기둥만, 구조평면도에는 보만 있는 도면 — 보 축이 기둥 가운데를 지나므로 같은 줄)
    {
      const 내줄 = 축값(m)
      const 그줄 = { x: [], y: [] }
      for (const a of 믿을) { const z = 축값(a); for (const v of z.x) 그줄.x.push(v + a.옮김[0]); for (const v of z.y) 그줄.y.push(v + a.옮김[1]) }
      const vx = 줄투표(그줄.x, 내줄.x), vy = 줄투표(그줄.y, 내줄.y)
      if (vx && vy && vx.n >= 2 && vy.n >= 2 && vx.n + vy.n >= 5 && vx.n >= vx.전체 * 0.4 && vy.n >= vy.전체 * 0.4) 후보.push({ tx: vx.d, ty: vy.d, 방법: '축', 글: '기둥 · 보 · 통심 줄 자리로 맞춤 (세로 줄 ' + vx.n + '/' + vx.전체 + ' · 가로 줄 ' + vy.n + '/' + vy.전체 + ')', 힘: vx.n + vy.n })
    }
    // 고르기 — 내 기둥(기초)이 맞춘 평면들의 기둥과 가장 많이 겹치는 옮김 · 같으면 통심 기호
    const 모든기둥 = 믿을.filter((a) => a.층 !== 'FT').flatMap((a) => a.기둥점.map((p) => [p[0] + a.옮김[0], p[1] + a.옮김[1]]))
    const 몫 = (c) => {
      if (!내점.length || !모든기둥.length) return null
      let n = 0
      for (const p of 내점) { const x = p[0] + c.tx, y = p[1] + c.ty; if (모든기둥.some((q) => Math.abs(q[0] - x) < 허용 && Math.abs(q[1] - y) < 허용)) n++ }
      return n / 내점.length
    }
    for (const c of 후보) c.몫 = 몫(c)
    const 차례 = { 통심: 3, 기둥: 2, 축: 1 }
    후보.sort((p, q) => ((q.몫 ?? 0.5) - (p.몫 ?? 0.5)) || (차례[q.방법] - 차례[p.방법]) || (q.힘 - p.힘))
    /* 🧭 G269 기초 평면은 통심 기호(네 줄 넘게)가 있으면 그것을 먼저 — 기초 가운데가 기둥 가운데와 꼭 같지 않음(MAT · 편심 기초).
         현장 B «1층기초구조평면도»: 통심 X1 ~ X4 · Y2 ~ Y5 가 있는데 기초(MF1 — 기둥이 네모 귀퉁이)를 지하 기둥 3/6 에 겹친 옮김을 골라 1층 MAT 가 8.9 m 비켜 그려졌음 */
    if (m.층 === 'FT') { const 통 = 후보.filter((c) => c.방법 === '통심' && c.힘 >= 4).sort((p, q) => q.힘 - p.힘)[0]; if (통) { 후보.splice(후보.indexOf(통), 1); 후보.unshift(통) } }
    // 기둥이 있는 평면을 «축» 으로만 맞췄는데 기둥이 거의 안 겹치면 믿지 않음(작은 무리의 우연한 맞음)
    let 됨 = 후보.find((c) => !(c.방법 === '축' && c.몫 !== null && c.몫 < 0.5)) || null
    if (됨 && 됨.몫 !== null && 됨.몫 < 0.3 && 됨.방법 === '통심') 됨 = { ...됨, 글: 됨.글 + ' — 기둥이 아래층과 거의 안 겹침(자리 확인)' }
    /* ㉣ 🧭 G260 MAT(기초 평면의 부정형 기초 — 열린 선 테두리)뿐인 무리: 통심 기호 · 기둥이 없으면 MAT 꼭짓점을 맞춘 평면의 벽 모서리에 겹쳐 맞춤
         (현장 B 지하1층 기초 평면 — MAT 테두리 = 지하 바깥벽 바깥 면 · 판에 통심 선이 안 들어와 «자리 못 맞춤» 으로 빠졌음) */
    if (!됨 && m.부재.length && m.부재.every((o) => o.종류 === '기초')) {
      /* 테두리 꺾인 줄(x · y)이 모두 맨 아래 층 벽 면 줄에 맞는 옮김들 → 그중 테두리 변 가운데가 벽 면 위(60 mm 안)에 가장 많이 놓이는 것(60 % 넘게) */
      const 판들 = m.부재.filter((o) => 넓이(o.판) > 2e7).map((o) => o.판)
      const 꺾 = []
      for (const P of 판들) {
        const n = P.length
        for (let i = 0; i < n; i++) { const a = P[(i + n - 1) % n], b = P[i], c = P[(i + 1) % n]; const cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]); if (Math.abs(cr) > 1e3 * (Math.hypot(b[0] - a[0], b[1] - a[1]) + Math.hypot(c[0] - b[0], c[1] - b[1]))) 꺾.push(b) }
      }
      const 줄 = (vs) => [...new Set(vs.map((v) => Math.round(v / 10) * 10))].sort((p, q) => p - q)
      const 내x = 줄(꺾.map((p) => p[0])), 내y = 줄(꺾.map((p) => p[1]))
      const 아래 = 믿을.filter((a) => a.층 !== 'FT').sort((a, b) => 층차례(a.층) - 층차례(b.층))
      const 맨아래 = 아래.length ? 아래[0].층 : null
      const 벽판 = 아래.filter((a) => a.층 === 맨아래).flatMap((a) => a.부재.filter((o) => o.종류 === '벽').map((o) => o.판.map((p) => [p[0] + a.옮김[0], p[1] + a.옮김[1]])))
      const 벽x = 줄(벽판.flat().map((p) => p[0])), 벽y = 줄(벽판.flat().map((p) => p[1]))
      const 가까 = (A, v) => { let lo = 0, hi = A.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (A[mid] < v) lo = mid + 1; else hi = mid } return Math.min(Math.abs(A[lo] - v), lo > 0 ? Math.abs(A[lo - 1] - v) : Infinity) }
      const 옮김들 = (A, B) => { const out = []; if (!A.length || !B.length) return out; for (const a of A) { const d = a - B[0]; if (B.every((b) => 가까(A, b + d) <= 40) && !out.some((x) => Math.abs(x - d) < 30)) out.push(d) } return out }
      if (내x.length >= 2 && 내y.length >= 2 && 벽판.length >= 2) {
        const dxs = 옮김들(벽x, 내x), dys = 옮김들(벽y, 내y)
        const 변 = []
        for (const P of 판들) for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 1000) 변.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]) }
        const 선거 = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy) }
        let best = null
        if (dxs.length * dys.length <= 400 && 변.length) for (const tx of dxs) for (const ty of dys) {
          let n = 0
          for (const c of 변) { const q = [c[0] + tx, c[1] + ty]; if (벽판.some((W) => W.some((p, k) => 선거(q, p, W[(k + 1) % W.length]) <= 60))) n++ }
          if (!best || n > best.n) best = { tx, ty, n }
        }
        if (best && best.n >= 0.6 * 변.length) 됨 = { tx: best.tx, ty: best.ty, 방법: '모양', 글: 'MAT 테두리를 ' + 맨아래 + '층 벽 바깥 면에 맞춤 (테두리 변 ' + best.n + '/' + 변.length + ')' }
      }
    }
    // ㉢ 테두리(짐작) — 3D 에서는 따로(«자리 못 맞춘 부재»)
    if (!됨) {
      const a = 기준
      됨 = { tx: (a.틀[0] + a.옮김[0]) - m.틀[0], ty: (a.틀[1] + a.옮김[1]) - m.틀[1], 방법: '테두리', 글: '통심 기호 · 기둥 겹침을 못 찾아 평면 왼쪽 아래 모서리를 맞춤(짐작 — 3D 에서는 따로 보기)' }
      짐작.push((m.층 === 'FT' ? '기초' : m.층 + '층') + ' 평면(부재 ' + m.부재.length + '개) 자리: ' + 됨.글)
      for (const o of m.부재) { o.자리짐작 = true; o.짐작.push('평면 자리를 못 맞춤(짐작)') }
    }
    return { 됨, 후보수: 후보.length }
  }
  const 놓기 = (m, 됨, 후보수, 자리 = -1) => {
    m.옮김 = [됨.tx, 됨.ty]; m.방법 = 됨.방법; m.짝 = 됨.짝 || null
    m.힘 = 됨.방법 === '축' ? (됨.힘 || 0) / 2 : 됨.방법 === '테두리' ? 0 : (됨.힘 || 0)          /* 🧭 G292 한 평면 = 한 좌표에서 씀 */
    const 줄 = { 층: m.층, 번: m.번, 방법: 됨.방법, 글: 됨.글, 옮김: [반(됨.tx), 반(됨.ty)], 수: m.부재.length, 기호수: m.기호.length, 종류: [...new Set(m.부재.map((o) => o.종류))].join('·'), 후보: 후보수 }
    if (자리 >= 0) 맞춤[자리] = 줄; else 맞춤.push(줄)
    m.맞춤줄 = 줄
  }
  for (const m of 남) { const { 됨, 후보수 } = 무리맞추기(m, 맞춘.filter((a) => a.방법 !== '테두리')); 놓기(m, 됨, 후보수); 맞춘.push(m) }
  /* 🧭 G292 ② 기준 평면 다시 보기 — 기준(맨 아래 층 · 기둥 많은 평면)은 옮김 0 으로 두고 나머지를 차례로 맞추는데, 첫 짝이 규칙적인 기둥 격자에서
       판 한 칸 비켜 맞으면(같은 간격으로 위아래 붙여 그린 평면) 나머지 층끼리는 서로 맞고 기준만 따로 뜸
       (현장 B S-101 «지하1층기초구조평면도» 기둥 21 — 3D 에서 건물 47.5 m 위에 섰음 · MAT 은 «기둥이 아래층과 거의 안 겹침»).
       다 맞춘 뒤 기준 기둥이 다른 평면(같은 평면 무리는 빼고) 기둥과 30 % 도 안 겹치는데 한 옮김으로 반 넘게(4개 넘게 · 처음의 두 배 넘게) 겹치면 기준을 그리로 옮기고, 기준에 바로 맞췄던 무리만 다시 맞춤 */
  const 다시 = 기준다시보기(기준, 맞춘)
  if (다시) {
    const { n0, n1, v, 그점 } = 다시
    /* 기준 무리에 다른 평면 기둥이 섞였으면(제목 없는 주심도 + 그 아래 평면이 한 제목으로 묶임 — 현장 B) 처음 자리에서만 다른 층 기둥과 겹치는 기둥은 떼어 처음 자리에 둠 */
    const 옛 = 기준.옮김.slice()
    const 맞음 = (c, tx, ty) => 그점.some((q) => Math.abs(q[0] - c[0] - tx) < 100 && Math.abs(q[1] - c[1] - ty) < 100)
    const 뗄 = 기준.부재.filter((o) => o.종류 === '기둥' && !o.글자자리 && 맞음(가운데(o.판), 옛[0], 옛[1]) && !맞음(가운데(o.판), v.tx, v.ty))
    if (뗄.length >= 2 && 뗄.length < 기준.부재.length) {
      const 틀재기 = (m) => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const o of m.부재) for (const p of o.판) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1] } m.틀 = [x0, y0, x1, y1] }
      const 점들 = (m) => {
        m.기둥점 = m.부재.filter((o) => o.종류 === '기둥' && !o.글자자리).map((o) => 가운데(o.판)); m.기둥몸 = m.부재.filter((o) => o.종류 === '기둥' && !o.글자자리).map((o) => o.몸 || o.기호)
        m.기초점 = m.부재.filter((o) => o.종류 === '기초' && !o.글자자리).map((o) => 가운데(o.판)); m.기초몸 = m.부재.filter((o) => o.종류 === '기초' && !o.글자자리).map((o) => o.몸 || o.기호)
      }
      const 새 = { key: 기준.key + '|뗌', 번: 기준.번, 층: 기준.층, 부재: 뗄, 기호: 기준.기호.slice(), 옮김: 옛, 방법: '기둥', 힘: 뗄.length, 짝: null }
      기준.부재 = 기준.부재.filter((o) => !뗄.includes(o))
      for (const m of [기준, 새]) { 틀재기(m); 점들(m) }
      묶음들.push(새); 맞춘.push(새)
      const 줄0 = 맞춤.find((z) => z.방법 === '기준'); if (줄0) 줄0.수 = 기준.부재.length
      새.맞춤줄 = { 층: 새.층, 번: 새.번, 방법: '기둥', 글: '기준 평면에 섞인 다른 평면 기둥 ' + 뗄.length + '개 — 처음 자리에서 다른 층 기둥과 겹쳐 그 자리에 둠', 옮김: [반(옛[0]), 반(옛[1])], 수: 뗄.length, 기호수: 새.기호.length, 종류: '기둥', 후보: 1 }
      맞춤.push(새.맞춤줄)
    }
    기준.옮김 = [v.tx, v.ty]
    const 줄 = 맞춤.find((z) => z.방법 === '기준')
    if (줄) { 줄.옮김 = [반(v.tx), 반(v.ty)]; 줄.글 = '기준 평면 — 다른 층 기둥과 ' + n1 + '/' + 기준.기둥점.length + ' 겹치는 자리로 옮김(처음 자리는 ' + n0 + '개만 겹침)' }
    /* 기준에 바로 맞췄던 무리(짝 = 기준)는 다시 — 기준 말고 다른 맞춘 무리 모두에 견줘서(차례대로) */
    for (const m of 남) {
      if (m.짝 !== 기준) continue
      const 자리 = 맞춤.indexOf(m.맞춤줄)
      const 짐작글 = (m.층 === 'FT' ? '기초' : m.층 + '층') + ' 평면(부재 ' + m.부재.length + '개) 자리:'
      if (m.방법 === '테두리') { for (let k = 짐작.length - 1; k >= 0; k--) if (짐작[k].startsWith(짐작글)) { 짐작.splice(k, 1); break } for (const o of m.부재) { o.자리짐작 = false; o.짐작 = o.짐작.filter((w) => w !== '평면 자리를 못 맞춤(짐작)') } }
      const { 됨, 후보수 } = 무리맞추기(m, 맞춘.filter((a) => a !== m && a.방법 !== '테두리'))
      놓기(m, 됨, 후보수, 자리)
    }
  }
  /* 🧭 G242 자리를 못 맞춘 무리라도 같은 도면 · 같은 판(도곽)에 맞춘 무리가 있으면 그 옮김 그대로 — 한 판은 한 좌표
       (현장 C · D FOUNDATION PLAN 의 바닥 슬래브 칸이 6 m 넘게 떨어져 무리가 갈리고 통심 기호가 없어 «겹친 것» 으로 빠졌음) */
  {
    const 판번 = (m) => { const D = 준(m.번); if (!D || !D.도곽 || !D.도곽.length) return -1; const [x0, y0, x1, y1] = m.틀; return D.도곽번((x0 + x1) / 2, (y0 + y1) / 2) }
    for (const m of 묶음들) {
      if (m.방법 !== '테두리') continue
      const p = 판번(m)
      if (p < 0) continue
      /* 한 판에 평면이 여럿(나란히 그린 층 평면)일 수 있어 — 맞춘 무리의 테두리 안(1 m 더)에 든 무리만 */
      const [mx0, my0, mx1, my1] = m.틀
      const 든 = (q) => { const [x0, y0, x1, y1] = q.틀; return mx0 >= x0 - 1000 && mx1 <= x1 + 1000 && my0 >= y0 - 1000 && my1 <= y1 + 1000 }
      const a = 맞춘.find((q) => q !== m && q.번 === m.번 && q.방법 !== '테두리' && 판번(q) === p && 든(q))
      if (!a) continue
      const 옛글 = (m.층 === 'FT' ? '기초' : m.층 + '층') + ' 평면(부재 ' + m.부재.length + '개) 자리:'
      for (let k = 짐작.length - 1; k >= 0; k--) if (짐작[k].startsWith(옛글)) { 짐작.splice(k, 1); break }
      m.옮김 = a.옮김.slice(); m.방법 = '같은판'
      for (const o of m.부재) { o.자리짐작 = false; o.짐작 = o.짐작.filter((w) => w !== '평면 자리를 못 맞춤(짐작)') }
      const 줄 = 맞춤.find((z) => z.번 === m.번 && z.층 === m.층 && z.방법 === '테두리' && z.수 === m.부재.length)
      if (줄) { 줄.방법 = '같은판'; 줄.글 = '같은 판(도곽)의 맞춘 평면과 같은 자리'; 줄.옮김 = [반(m.옮김[0]), 반(m.옮김[1])] }
    }
  }
  /* 🧭 G292 ① 한 평면 = 한 좌표 — 같은 평면에서 층이 갈린 무리는 옮김 하나(자세한 것은 한평면한좌표 머리말) */
  한평면한좌표(묶음들, 기준, 맞춤)
  /* 원점 — 기준 평면 통심의 첫 줄끼리 교점(X1 · Y1) · 없으면 기둥 왼쪽 아래 */
  let 원점 = null
  {
    /* 기준 평면에 가로 · 세로 기호가 다 없으면(주심도엔 X 줄만 등) 맞춘 다른 평면의 기호도 옮겨서 씀 */
    const 방향 = new Map()
    const 넣기호 = (m) => { for (const x of m.기호) { const off = x.off + x.nx * m.옮김[0] + x.ny * m.옮김[1]; const a = 방향.get(x.각칸) || []; if (!a.some((y) => y.글 === x.글)) a.push({ ...x, off }); 방향.set(x.각칸, a) } }
    넣기호(기준)
    if (방향.size < 2) for (const m of 묶음들) if (m !== 기준 && m.방법 !== '테두리' && m.층 === 기준.층) 넣기호(m)
    if (방향.size < 2) for (const m of 묶음들) if (m !== 기준 && m.방법 !== '테두리') 넣기호(m)
    const 큰방향 = [...방향.values()].sort((a, b) => b.length - a.length)
    if (큰방향.length >= 2) {
      const 첫 = (a) => [...a].sort((p, q) => p.글.localeCompare(q.글, 'en', { numeric: true }))[0]
      const A = 첫(큰방향[0]), B = 첫(큰방향[1])
      const det = A.nx * B.ny - A.ny * B.nx
      if (Math.abs(det) > 0.3) {
        const x = (A.off * B.ny - A.ny * B.off) / det, y = (A.nx * B.off - A.off * B.nx) / det
        원점 = { x, y, 글: '통심 ' + [A.글, B.글].sort((p, q) => p.localeCompare(q, 'en', { numeric: true })).join(' · ') + ' 교점' }
      }
    }
    if (!원점) {
      const 점 = 기준.기둥점.length ? 기준.기둥점 : 기준.부재.map((o) => 가운데(o.판))
      원점 = { x: Math.min(...점.map((p) => p[0])), y: Math.min(...점.map((p) => p[1])), 글: '왼쪽 아래 기둥 가운데' }
    }
  }
  /* 🧭 G292 ⑧ 주심도의 기둥 층 범위 글자(«1~RF» · «B1~2F» · «Ø250 1~RF») — 가장 가까운 기둥(2.5 m 안)은 그 층들에만(아래 «범위 밖 기둥» 에서 씀) */
  {
    const 범위꼴 = /(?:^|\s)(B\d|\d{1,2})\s*F?\s*~\s*(B\d\s*F?|\d{1,2}\s*F?|RF|ROOF|PHF?\d?)\s*$/i
    const 글들 = new Map()
    for (const m of 묶음들) {
      const 기둥들 = m.부재.filter((o) => o.종류 === '기둥' && !o.글자자리)
      if (기둥들.length < 3) continue
      if (!글들.has(m.번)) 글들.set(m.번, (준(m.번).글자 || []).map((g) => ({ g, m: 범위꼴.exec(String(g.s || '').trim()) })).filter((x) => x.m))
      const 후보 = 글들.get(m.번)
      if (!후보.length) continue
      /* 범위 글자마다 가장 가까운 기둥(2.5 m 안)에 — 기호 · 크기 글 옆에 적어 기둥에서 1.5 ~ 2 m 떨어지기도 함 */
      const 가 = 기둥들.map((o) => ({ o, c: 가운데(o.판), d: Infinity }))
      for (const x of 후보) {
        let b = null
        for (const y of 가) { const d = Math.hypot(x.g.x - y.c[0], x.g.y - y.c[1]); if (d < 2500 && (!b || d < b.d)) b = { y, d } }
        if (b && b.d < b.y.d) { b.y.d = b.d; b.y.o.범위 = [x.m[1], x.m[2]] }
      }
    }
  }
  for (const m of 묶음들) {
    const dx = m.옮김[0] - 원점.x, dy = m.옮김[1] - 원점.y
    for (const o of m.부재) o.판 = o.판.map((p) => [반(p[0] + dx), 반(p[1] + dy)])
  }
  /* 🧭 G241 모양(닫힌 선)을 못 찾은 기초(기호 글자 · 통심 교점 자리)는 «기둥 밑» 으로 — 맞춘 뒤 가장 가까운 기둥(기초 크기 반 + 2.5 m 안 · 한 기둥에 하나)
       현장 C · D 토목 FOOTING PLAN: 기초 기호(오각형)가 기초 옆 2 ~ 3 m 에 있어 기둥이 기초 밖에 섰음(주각 높이를 못 잼) */
  {
    const 기둥들 = 부재.filter((o) => o.종류 === '기둥' && !o.글자자리 && !o.자리짐작).map((o) => ({ o, c: 가운데(o.판) }))
    const 모양기초 = 부재.filter((o) => o.종류 === '기초' && !o.매트 && !o.글자자리 && !o.교점자리 && !o.자리짐작)
    const 앉은 = new Set(기둥들.filter((q) => 모양기초.some((f) => 안(q.c, f.판))).map((q) => q.o))
    const 쌍 = []
    for (const f of 부재) {
      if (f.종류 !== '기초' || f.매트 || f.자리짐작 || !(f.글자자리 || f.교점자리)) continue
      const c = 가운데(f.판)
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
      for (const p of f.판) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1] }
      const 한계 = Math.max(x1 - x0, y1 - y0) / 2 + 2500
      for (const q of 기둥들) { if (앉은.has(q.o)) continue; const d = Math.hypot(q.c[0] - c[0], q.c[1] - c[1]); if (d <= 한계) 쌍.push({ f, q, d, c }) }
    }
    쌍.sort((a, b) => a.d - b.d)
    const 된기초 = new Set(), 된기둥 = new Set()
    let 옮긴 = 0
    for (const { f, q, c } of 쌍) {
      if (된기초.has(f) || 된기둥.has(q.o)) continue
      된기초.add(f); 된기둥.add(q.o)
      const dx = q.c[0] - c[0], dy = q.c[1] - c[1]
      f.판 = f.판.map((p) => [반(p[0] + dx), 반(p[1] + dy)])
      f.글자자리 = false; f.교점자리 = false; f.기둥밑 = true
      f.짐작 = f.짐작.filter((w) => !/글자 자리|통심 교점/.test(w)).concat(['기초 모양(닫힌 선)을 못 찾아 가장 가까운 기둥 «' + q.o.기호 + '» 밑에 일람표 크기로 놓음'])
      옮긴++
    }
    if (옮긴) 짐작.push('기초 ' + 옮긴 + '개는 도면 모양(닫힌 선)을 못 찾아 가장 가까운 기둥 밑에 일람표 크기로 놓았습니다')
  }
  /* 🧭 G237 통심(X1 · Y1) — 모델 좌표로(맞춘 평면 · 기준 먼저 · 같은 글자 · 방향은 하나) · 건축 평면 건물에 겹칠 때(lib/건물겹치기.js) */
  const 통심 = []
  {
    const 본 = new Set()
    for (const m of 맞춘) {
      if (m.방법 === '테두리') continue
      const dx = m.옮김[0] - 원점.x, dy = m.옮김[1] - 원점.y
      for (const g of m.기호) {
        const key = g.글 + '|' + g.각칸
        if (본.has(key)) continue
        본.add(key)
        통심.push({ 글: g.글, 각칸: g.각칸, 끝: [g.끝[0] + dx, g.끝[1] + dy, g.끝[2] + dx, g.끝[3] + dy] })
      }
    }
  }

  /* ③-2 🏢 G228 겹친 것 빼기 — 소장님 「우리가 원래 겹치기로 하지 않았어? … 좌표가 맞아 떨어지면 선이 겹쳐도 물량변화는 없는 거 아니야?」
     「약간의 차이가 있어도」 「완벽한 건 없어」 (현장 A 도면: 골구도를 넣으면 같은 층이 «자리 짐작» 으로 한 번 더 붙어 부재 623 → 1,026 · 콘크리트 1,161 → 2,073 ㎥)
     ㉠ 자리를 못 맞춘(테두리 짐작) 평면 — 같은 층에 맞춘 평면이 이미 있으면 그 층을 한 번 더 그린 것으로 보고 뺌
     ㉡ 맞춘 평면끼리 — 같은 층 · 같은 종류 · 같은 기호 · 가운데 0.5 m 안 · 길이(넓이) ±30% 면 같은 부재로 보고 먼저 맞춘 평면 것만 셈 */
  const 뺀 = []
  for (const o of 부재) if (o.중복기호) { o.겹침 = '같은 기둥 · 기초에 기호가 둘 — 한 번만'; 뺀.push(o) }          // 🧭 G292 ⑥
  /* 🧭 G292 ⑧ 범위 밖 기둥 — 주심도 «1~RF»(1층 ~ 지붕 바닥 아래 = 1 · 2층) 기둥 자리(1 m 안)의 기둥이 범위 밖 층이면 그 층 평면에 그려 둔 «아래층 기둥» 일 뿐.
       현장 B 옥탑 바닥(PHF-1) · 지붕 천창(PHF-2) 평면의 기둥 15 + 15개 · 1층 기초 확대평면도 기둥 3개가 «1~RF» 자리라 빠짐 */
  {
    const 범위기둥 = 부재.filter((o) => o.범위)
    if (범위기둥.length >= 3) {
      const 층말 = (t) => { t = String(t).toUpperCase().replace(/\s+/g, ''); if (/^(RF|ROOF)$/.test(t)) return 'R'; if (/^PH/.test(t)) return 'PH'; const m = /^(B?\d{1,2})F?$/.exec(t); return m ? String(m[1]).replace(/^0+(\d)/, '$1') : null }
      const 칸 = 범위기둥.map((o) => ({ c: 가운데(o.판), lo: 이야기.indexOf(층말(o.범위[0])), hi: 이야기.indexOf(층말(o.범위[1])), 글: o.범위.join('~') })).filter((x) => x.lo >= 0 && x.hi > x.lo)
      if (칸.length >= 3) for (const o of 부재) {
        if (o.종류 !== '기둥' || o.겹침) continue
        const i = 이야기.indexOf(o.층)
        if (i < 0) continue
        const c = 가운데(o.판)
        const q = 칸.map((x) => ({ x, d: Math.hypot(x.c[0] - c[0], x.c[1] - c[1]) })).filter((y) => y.d <= 1000).sort((p2, q2) => p2.d - q2.d)[0]
        if (!q || (i >= q.x.lo && i < q.x.hi)) continue
        o.겹침 = '주심도 «' + q.x.글 + '» — 이 층에는 없는 기둥(아래층 기둥을 그려 둔 것)'; 뺀.push(o)
      }
    }
  }
  {
    const 층맞춘 = new Set(묶음들.filter((m) => m.방법 !== '테두리').map((m) => m.층))
    for (const m of 묶음들) {
      if (m.방법 !== '테두리' || !층맞춘.has(m.층)) continue
      for (const o of m.부재) { o.겹침 = '자리 못 맞춤'; 뺀.push(o) }
      m.겹침 = true
    }
    /* 🧭 G237 ㉠-2 확대평면도(같은 층을 크게 다시 그린 것 · 현장 B S-201 — 기호도 «2G1» 처럼 층을 붙여 써 ㉡ 로는 못 거름) —
       같은 층의 구조평면도(확대 아님)가 맞춰져 있으면 확대평면도 쪽은 뺌(겹치는 순서 8 «한 번만») */
    /* 🧭 G292 ④ 파일 이름에 «확대» 가 없어도(«S-201.dwg» 처럼 바꿔 저장) 그 평면 제목(«1층 구조 확대평면도 -1»)으로 — 현장 B 를 이름 바꿔 넣으니 S-201 을 본 평면으로 읽어 콘크리트 +53 % */
    const 확대 = (m) => /확대/.test((도면들[m.번] && 도면들[m.번].이름) || '') || /확대/.test(String((m.부재[0] && m.부재[0].평면) || '').split('|')[2] || '')
    const 층본 = new Set(묶음들.filter((m) => m.방법 !== '테두리' && !m.겹침 && !확대(m)).map((m) => m.층))
    확대평면도빼기(묶음들, 확대, 층본, 뺀)
    const 크기 = (o) => (o.종류 === '보' || o.종류 === '벽' ? o.길이 || 0 : 넓이(o.판))
    const 칸 = new Map()          // 층|종류|몸 → [{c, k, m}]
    for (const m of 맞춘) {
      if (m.겹침) continue
      for (const o of m.부재) {
        if (o.겹침) continue          // 🧭 G277 확대평면도에서 이미 뺀 것
        const key = o.층 + '|' + o.종류 + '|' + (o.몸 || o.기호)
        const c = 가운데(o.판), k = 크기(o)
        const 있 = 칸.get(key) || []
        /* 🧭 G245 같은 평면 안에서도 — 같은 기호 부재가 같은 자리에 둘이면 하나(현장 D BEAM PLAN: 판 끝 글자 하나가 줄 전체 보 구간을 이어 받아
           같은 B2 를 150 mm 어긋나게 한 번 더 — 도면 원점에 따라 생겼다 말았다 했음). 실제로 한 자리에 같은 부재 둘은 없음 */
        const 같 = 있.find((x) => Math.hypot(x.c[0] - c[0], x.c[1] - c[1]) <= 500 && (!(x.k > 0) || !(k > 0) || (k / x.k > 0.7 && k / x.k < 1.3)))
        /* 🧭 G292 ⑪ 같은 자리 둘 중 하나가 기초 평면에 그린 자리(기초판 — 주심도 · 기초 평면의 «FTC1»)면 그 층 평면 것(«B1C1»)을 남김.
             현장 B 지하 기둥: 지하1층 평면 B1C1 이 먼저 맞춘 기초 평면 FTC1 에 겹쳐 빠지고, FTC1 은 1층 기둥 자리라 다시 빠져 지하 기둥 3 → 1 */
        if (같 && o.종류 === '기둥' && 같.o && 같.o.기초판 && !o.기초판) { 같.o.겹침 = '같은 자리 같은 부재(기초 평면 자리)'; 뺀.push(같.o); 같.o = o; 같.c = c; 같.k = k; 같.m = m; continue }
        if (같) { o.겹침 = '같은 자리 같은 부재'; 뺀.push(o); continue }
        있.push({ c, k, m, o }); 칸.set(key, 있)
      }
    }
    /* 🧭 G271 번호 옥탑 평면(«PHF-1 · PHF-2» · «옥탑1층» — 지붕 틀 평면)의 벽은 바로 아래층 같은 자리에 벽이 있을 때만(이어 올라가는 벽).
         지붕 틀 평면의 이름 없는 두 선(큰 홀 위 지붕보)을 벽 이름 띠가 끝까지 이어 받아 옥탑 층 벽이 176 m 생겼음(현장 B PHF-2) — 기둥은 그대로 */
    {
      const 번옥탑 = (o) => /^(?:PHF?|옥탑)-?[12](?![0-9])/.test(String((o.평면 || '').split('|')[2] || '').replace(/\s+/g, '').toUpperCase())
      const 축 = (o) => {
        const P = o.판
        if (!P || P.length < 4) return null
        const [a, b, c2] = P
        const e1 = Math.hypot(b[0] - a[0], b[1] - a[1]), e2 = Math.hypot(c2[0] - b[0], c2[1] - b[1])
        const [u0, u1] = e1 >= e2 ? [a, b] : [b, c2]
        const L = Math.max(e1, e2) || 1
        const ux = (u1[0] - u0[0]) / L, uy = (u1[1] - u0[1]) / L
        const m = 가운데(P)
        return { ux, uy, cx: m[0], cy: m[1], L, w: Math.min(e1, e2) }
      }
      const 위벽 = 부재.filter((o) => o.종류 === '벽' && !o.겹침 && 번옥탑(o)).sort((p, q) => 이야기.indexOf(p.층) - 이야기.indexOf(q.층))
      let n뺌 = 0
      for (const o of 위벽) {
        const i = 이야기.indexOf(o.층)
        if (i <= 0) continue
        const 아 = 이야기[i - 1]
        const A = 축(o)
        if (!A) continue
        let 덮 = 0
        for (const q of 부재) {
          if (q.종류 !== '벽' || q.겹침 || q.층 !== 아) continue
          const B = 축(q)
          if (!B || Math.abs(A.ux * B.uy - A.uy * B.ux) > 0.1) continue
          const 떨 = Math.abs((B.cx - A.cx) * -A.uy + (B.cy - A.cy) * A.ux)
          if (떨 > (A.w + B.w) / 2 + 100) continue
          const t = (B.cx - A.cx) * A.ux + (B.cy - A.cy) * A.uy
          const lo = Math.max(-A.L / 2, t - B.L / 2), hi = Math.min(A.L / 2, t + B.L / 2)
          if (hi > lo) 덮 += hi - lo
        }
        if (덮 < A.L * 0.5) { o.겹침 = '옥탑 평면 벽 — 아래층 같은 자리에 벽이 없음(지붕보 선으로 봄)'; 뺀.push(o); n뺌++ }
      }
      if (n뺌) 짐작.push('옥탑 평면(PHF-1 · PHF-2 같은 지붕 틀 평면)의 벽 ' + n뺌 + '개는 바로 아래층 같은 자리에 벽이 없어 뺐습니다 — 지붕보 두 선을 벽으로 읽었을 수 있음(그 층 벽이 맞으면 배근표에서 되살림)')
    }
    if (뺀.length) {
      const 못 = 뺀.filter((o) => o.겹침 === '자리 못 맞춤').length, 확 = 뺀.filter((o) => /^확대평면도/.test(o.겹침)).length, 같 = 뺀.length - 못 - 확
      짐작.push('겹친 것 ' + 뺀.length + '개는 물량에서 뺐습니다' + (못 ? ' — 자리를 못 맞춘 평면 ' + 못 + '개(같은 층을 맞춘 평면이 이미 있음)' : '') + (확 ? (못 ? ' · ' : ' — ') + '확대평면도 ' + 확 + '개(같은 층 구조평면도가 있음)' : '') + (같 ? (못 || 확 ? ' · ' : ' — ') + '같은 층 · 같은 기호 · 거의 같은 자리(0.5 m 안) ' + 같 + '개' : ''))
      for (let k = 짐작.length - 2; k >= 0; k--) {
        // 뺀 평면의 «자리 짐작» 안내는 «겹쳐서 뺌» 으로
        const m = 묶음들.find((q) => q.겹침 && 짐작[k].startsWith((q.층 === 'FT' ? '기초' : q.층 + '층') + ' 평면(부재 ' + q.부재.length + '개) 자리:'))
        if (m) 짐작.splice(k, 1)
      }
    }
  }

  /* ④ 높이 */
  const 기초위값 = Number.isFinite(+옵션.기초위) && 옵션.기초위 !== '' && 옵션.기초위 !== null ? +옵션.기초위 : 기초윗면(도면들, 준)
  const 기초위 = 기초위값 !== null ? 기초위값 : 바닥(첫층)
  if (기초위값 === null && 부재.some((o) => o.종류 === '기초' && !Number.isFinite(o.윗면))) 짐작.push('기초 윗면 높이가 도면에 없어 ' + 첫층 + '층 바닥(' + 높이글(바닥(첫층)) + ')에 맞춰 그렸습니다 — 물량은 산출서 그대로')
  const 기초판들 = 부재.filter((o) => o.종류 === '기초')
  const 첫바닥 = 바닥(첫층)
  const 윗면 = (o) => (Number.isFinite(o.윗면) ? o.윗면 : null)
  /* 🧭 G241 기초 평면의 보(지중보)는 1층 바닥에 맞춤 — 예전엔 «FT 위 층고(없으면 3,300)» 위에 떠 있었음(현장 C · D BEAM PLAN 98개가 3.3 m 위) */
  const 위바닥2 = (n) => (n === 'FT' ? 첫바닥 : 위바닥(n))
  for (const o of 부재) {
    if (o.종류 === '기둥' || o.종류 === '벽') {
      if (o.기초판) continue              // 아래에서(받침 높이를 안 뒤)
      o.z0 = 바닥(o.층); o.z1 = 위바닥(o.층)
      if (o.층 === 첫층 && 기초판들.length && 기초위 < o.z0) {
        const c = 가운데(o.판)
        if (기초판들.some((f) => 안(c, f.판))) o.z0 = 기초위
      }
    } else if (o.종류 === '보') { const w = o.층 === 'FT' ? 윗면(o) : null; o.z1 = w !== null ? 첫바닥 + w : 위바닥2(o.층); o.z0 = o.z1 - o.춤 }
    else if (o.종류 === '슬라브') { const w = o.층 === 'FT' ? 윗면(o) : null; o.z1 = w !== null ? 첫바닥 + w : 위바닥2(o.층); o.z0 = o.z1 - o.두께 }
    /* 🧭 G274 계단 — 그 층 바닥과 위층 바닥 가운데(중간참 높이)에 계단판 자리 하나(경사 · 디딤은 산출서 셈) */
    else if (o.종류 === '계단') { o.z1 = (바닥(o.층) + 위바닥(o.층)) / 2; o.z0 = o.z1 - o.두께 }
    /* 🧭 G266 «1층기초구조평면도» 의 MAT(지하가 없는 쪽) — 윗면 = 그 층(1층) 바닥. 예전엔 모든 기초를 첫 층(지하1층) 바닥에 놓아
         현장 B 1층 MAT 742 ㎡ 가 지하 MAT 와 같은 높이(−4.1 ~ −3.5 m)에 그려지고, 그 위 기둥이 지하 층고(3.5 m)로 셈됐음 */
    else if (o.종류 === '기초') { const w = 윗면(o); const 받 = w === null && o.받침층 && o.받침층 !== 첫층 && 높이.has(o.받침층) && 바닥(o.받침층) > 기초위 ? 바닥(o.받침층) : null; o.z1 = (w !== null ? 첫바닥 + w : 받 !== null ? 받 : 기초위) - (o.내림 || 0); o.z0 = o.z1 - o.두께 }
  }
  /* 🧭 G241 기초 평면의 기둥 · 벽(주각 · 기초 위 벽) — 위 = 1층 바닥(FL) · 아래 = 그 밑 기초 · 지중보 윗면 가운데 가장 높은 것
       (현장 C · D 토목: 기둥 C1 은 기초 F1 윗면 −550 ~ ±0 · 예전엔 1층 층고 3,300 으로 짐작해 세웠음). 밑에 받침이 없으면 예전처럼 1층 높이 */
  /* 받침 = 기초 · 기초 평면 보(지중보) · 기초 평면 바닥 슬래브 — 판 안이거나 판 둘레 300 mm 안(지중보 옆에 붙은 턱 벽) */
  const 받침 = 부재.filter((q) => (q.종류 === '기초' || ((q.종류 === '보' || q.종류 === '슬라브') && q.층 === 'FT')) && !q.겹침 && Number.isFinite(q.z1))
  const 선거리 = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy) }
  const 곁 = (c, 판) => 안(c, 판) || 판.some((p, k) => 선거리(c, p, 판[(k + 1) % 판.length]) <= 300)
  const 못받친 = []
  /* 🧭 G266 받침(MAT) 윗면이 첫 층 바닥보다 높거나 같으면(MAT 윗면 = 어느 층 바닥 N — 현장 B 1층 MAT · 지하 MAT · 현장 A 지하 MAT) 그 기둥 · 벽은 N 층 것:
       ㉠ N 층에 같은 자리(0.5 m 안) · 같은 몸(기둥은 몸 상관없이)의 기둥 · 벽이 이미 있으면 기초 평면에 그린 자리일 뿐 — 뺌(현장 B «1층기초구조평면도» 의 기둥
          FTC1 ~ 3 = 1층 기둥 1C1 ~ 3: 예전엔 받침을 못 찾아 지하 층고 3.5 m 로 세워 11 ㎥ 를 더 셈 · 지하 MAT 위 기둥은 MAT 속 깊은 구역 윗면부터 세워 MAT 와 겹쳤음)
       ㉡ 없으면 그 층 부재 — N 이 첫 층이면 예전 그대로(현장 A: 지하1층 평면의 벽이 곧 지하 벽) · 더 위 층이면 N 층 바닥 ~ 위 바닥 높이로 */
  let 높이없음 = 0
  for (const o of 부재) {
    if (!o.기초판 || (o.종류 !== '기둥' && o.종류 !== '벽')) continue
    const c = 가운데(o.판)
    const 든 = 받침.filter((q) => 곁(c, q.판))
    const 든기초 = 든.filter((q) => q.종류 === '기초')          // 지중보 · 기초 평면 슬래브(윗면 = 첫 바닥)는 여기서 안 봄(독립기초 위 주각 — 현장 C · D)
    const 맨위 = 든기초.length ? Math.max(...든기초.map((q) => q.z1)) : null
    if (맨위 !== null && 맨위 >= 첫바닥 - 1) {
      const N = 이야기.find((n) => Math.abs(바닥(n) - 맨위) <= 50)
      const 같은 = N && 부재.some((q) => q !== o && !q.기초판 && !q.겹침 && q.종류 === o.종류 && q.층 === N && (o.종류 === '기둥' || q.몸 === o.몸) && Math.hypot(가운데(q.판)[0] - c[0], 가운데(q.판)[1] - c[1]) <= 500)
      if (같은) { if (!o.겹침) { o.겹침 = '기초 평면에 그린 자리 — ' + N + '층 같은 자리 부재가 셈함'; 뺀.push(o); 높이없음++ } continue }
      if (N && N !== 첫층) { o.z0 = 바닥(N); o.z1 = 위바닥(N); o.받침높이 = true; continue }
      못받친.push(o); continue
    }
    const 밑 = 든.filter((q) => q.z1 < 첫바닥 - 1).map((q) => q.z1)
    if (밑.length) { o.z1 = 첫바닥; o.z0 = Math.max(...밑); o.받침높이 = true }
    else 못받친.push(o)
  }
  if (높이없음) 짐작.push('기초 평면의 기둥 · 벽 ' + 높이없음 + '개는 기초 윗면이 바로 바닥이고 그 층 평면에 같은 자리 부재가 있어 뺐습니다(두 번 안 셈)')
  /* 밑 받침을 못 찾은 것 — 같은 기호(없으면 같은 종류)의 받친 것들 가운데 높이로(짐작 · 알림). 받친 것이 하나도 없으면 예전처럼 1층 높이 */
  let 받침없음 = 0, 같은높이 = 0
  const 가운데값 = (a) => { const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1] }
  /* 🧭 G258 받친 것이 못 받친 것보다 적으면 빌리지 않음 — 현장 B 지하1층 평면 벽 34 토막 중 1층 MAT 위에 걸친 한 토막(600)의 높이를
       나머지 33 토막(지하 벽 3,500)이 빌려 모두 600 이 됐음. 받친 것이 많을 때만(현장 C · D 기둥 — 대부분 기초 위) 같은 기호 · 같은 종류 높이로 */
  const 받친것 = 부재.filter((q) => q.받침높이)          // 빌려 세우기 전(차례에 안 휘둘리게)
  for (const o of 못받친) {
    const { 같, 무 } = 빌릴무리(받친것, 못받친, o)
    if (무.length) { const h = 가운데값(무.map((q) => q.z1 - q.z0)); o.z1 = 첫바닥; o.z0 = 첫바닥 - h; o.받침높이 = true; o.짐작.push('밑 기초 · 지중보를 못 찾아 ' + (같.length ? '같은 기호' : '같은 종류') + '의 높이(' + Math.round(h) + ' mm)로 세움'); 같은높이++; continue }
    const c = 가운데(o.판)
    o.z0 = 바닥(o.층); o.z1 = 위바닥(o.층)
    if (o.층 === 첫층 && 기초판들.length && 기초위 < o.z0 && 기초판들.some((f) => 안(c, f.판))) o.z0 = 기초위
    받침없음++
  }
  if (같은높이) 짐작.push('기초 평면의 기둥 · 벽 ' + 같은높이 + '개는 밑의 기초 · 지중보를 못 찾아 같은 기호(없으면 같은 종류)의 높이로 세웠습니다')
  /* 🏔 G299 지붕 높이 구역 — 지붕 평면 «FL 레벨» 범례 구역 · 골조입면 경사 지붕 아래 벽 · 기둥을 그 층 위 바닥에서 지붕까지(산출서 줄도 높이마다 — 겹친것빼기) */
  try {
    const 읽 = R.읽음 || {}
    if (읽.지붕구역 && 읽.지붕구역.length) {
      const r2 = 구역올림(부재, 묶음들, 원점, 도면들, 읽.지붕구역, 읽.지붕사슬 || [], { 바닥, 위바닥, 다음층, 일층: 높이.has('1') ? 바닥('1') : 0 })
      for (const w of r2.알림) 짐작.push(w)
    }
  } catch (e) { 경고.push('지붕 높이 구역을 못 읽었습니다 — ' + (e && e.message ? e.message : '')) }
  for (const o of 부재) {
    if (짐작층.has(o.층) && (o.종류 === '기둥' || o.종류 === '벽') && !o.받침높이) o.짐작.push(o.층 + '층 층고는 도면에 없어 짐작한 값')
    o.넓이 = 넓이(o.판)
    o.부피 = o.넓이 * (o.z1 - o.z0) / 1e9      // m³
    const c = 가운데(o.판)
    o.자리 = [반(c[0], 0), 반(c[1], 0)]
  }
  /* 그 층 기둥 · 벽이 모두 받침 높이로 세워졌으면(기초 평면의 주각뿐) 층고 짐작 알림은 뺌 */
  for (const n of 짐작층) { const 쓴 = 부재.filter((o) => o.층 === n && (o.종류 === '기둥' || o.종류 === '벽') && !o.겹침); if (쓴.length && 쓴.every((o) => o.받침높이)) continue; 짐작.push(n + '층 층고: 도면의 FL 글자가 없어 짐작했습니다 — 아래 «층 높이» 칸에서 바꿀 수 있습니다') }
  if (받침없음) 짐작.push('기초 평면의 기둥 · 벽 ' + 받침없음 + '개는 밑의 기초 · 지중보를 못 찾아 1층 높이로 세웠습니다')

  /* ⑤ 틀 · 층 */
  let 틀 = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity]
  for (const o of 부재) for (const p of o.판) { 틀[0] = Math.min(틀[0], p[0]); 틀[1] = Math.min(틀[1], p[1]); 틀[3] = Math.max(틀[3], p[0]); 틀[4] = Math.max(틀[4], p[1]); 틀[2] = Math.min(틀[2], o.z0); 틀[5] = Math.max(틀[5], o.z1) }
  const 층 = 이야기.filter((n) => 부재.some((o) => o.층 === n)).map((n) => ({ 이름: n, 바닥: 바닥(n), 위: 위바닥(n), 짐작: 짐작층.has(n), 부재수: 부재.filter((o) => o.층 === n).length }))
  /* 층 높이 칸(사람이 고칠 수 있는 것) — 지붕(R)까지 바닥 높이 */
  const 바닥들 = 이야기.map((n, i) => ({ 이름: n, 높이: 바닥(n), 짐작: 짐작층.has(n) || (i > 0 && 짐작층.has(이야기[i - 1])), 읽음: !!(R.읽음 && R.읽음.높이 && Number.isFinite(+R.읽음.높이[n])) }))
  if (부재.some((o) => o.층 === 'FT')) 층.unshift({ 이름: 'FT', 바닥: 기초위, 위: 기초위, 짐작: 기초위값 === null, 부재수: 부재.filter((o) => o.층 === 'FT').length })
  for (const o of 부재) for (const w of o.짐작) if (!o.겹침 && !짐작.includes(w) && 짐작.length < 40 && !/글자 자리|통심 교점/.test(w)) 짐작.push(w)
  const 글자자리수 = 부재.filter((o) => o.글자자리).length, 교점수 = 부재.filter((o) => o.교점자리).length
  if (교점수) 짐작.push('기둥 · 기초 ' + 교점수 + '개는 도면 모양(닫힌 선)을 못 찾아 가까운 통심 교점에 일람표 크기로 세웠습니다')
  if (글자자리수) 짐작.push('기둥 · 기초 ' + 글자자리수 + '개는 도면 모양을 못 찾아 기호 글자 자리에 일람표 크기로 세웠습니다')
  for (const m of 맞춤) { const q = 묶음들.find((x) => x.층 === m.층 && x.번 === m.번 && x.방법 === m.방법 && x.부재.length === m.수); if (q && q.겹침) { m.방법 = '겹침'; m.글 = '같은 층을 맞춘 평면이 이미 있어 겹친 것으로 보고 뺌(자리 못 맞춤)' } }
  const 남은 = 부재.filter((o) => !o.겹침)
  return { 부재: 남은, 뺀, 층, 바닥들, 맞춤, 짐작, 경고, 틀, 원점, 기초위, 묶음수: 묶음들.length, 통심 }
}

/**
 * 🏢 G228 겹쳐서 뺀 부재(모델.뺀)만큼 주자료 줄의 개수(QT)를 줄인 공사 — 산출서(셈) · 엑셀이 겹친 것을 두 번 세지 않게
 *   줄의 자리가 n 개 중 k 개 빠지면 QT × (n − k) / n (반올림) · 모두 빠지면 0
 */
/** 🧭 G258 밑 받침을 못 찾은 기둥 · 벽 o 가 높이를 빌릴 무리 — 같은 기호(몸) 받친 것, 없으면 같은 종류 받친 것.
 *  받친 것이 못 받친 것보다 적은 무리에서는 안 빌림(한두 토막의 높이가 나머지를 다 바꾸지 않게) */
export function 빌릴무리(받친것, 못받친, o) {
  const 셈 = (a, f) => a.filter(f).length
  const 같기 = (q) => q.종류 === o.종류 && q.몸 === o.몸, 같종 = (q) => q.종류 === o.종류
  const 같 = 셈(받친것, 같기) >= 셈(못받친, 같기) ? 받친것.filter(같기) : []
  const 무 = 같.length ? 같 : 셈(받친것, 같종) >= 셈(못받친, 같종) ? 받친것.filter(같종) : []
  return { 같, 무 }
}

/**
 * 🧭 G292 ① 한 평면 = 한 좌표 — 같은 도면 · 같은 평면(골조자동이 적은 제목 · 판 p · 끝의 도곽 번호는 빼고)에서 층이 갈린 무리(«그 층 것»: 기둥 · 벽은 N층 ·
 *   보 · 슬래브는 N−1층 · 기초 평면의 기둥과 기초)는 한 판에 같은 좌표로 그린 것 — 옮김도 하나. 따로 맞추다 보니 기둥 없는 보 · 슬래브 무리가
 *   통심 기호 서너 개(위아래로 붙여 그린 옆 평면 것까지)로 판 한 칸만큼 어긋나 3D 에서 따로 떴음
 *   (현장 B S-101: 평면 아홉이 위아래 47.5 m 간격 — «2층 구조평면도» 기둥은 1층 기둥에 33/33 겹쳐 맞았는데 같은 판의 보 · 슬래브는 통심 3개로 46.5 m 비켜 맞춤).
 *   그린 자리가 겹치는 무리 가운데 가장 믿을 것(기준 · 기둥 겹침 수 · 통심 줄 수 · 축 줄 수의 반 — 3 넘게)의 옮김을, 그 반도 안 되는 무리에 줌.
 *   150 mm 안 차이 · 자리 못 맞춘(테두리) 무리는 그대로. 고친 무리 수를 돌려줌
 */
export function 한평면한좌표(묶음들, 기준, 맞춤 = []) {
  const 평면무리 = new Map()
  for (const m of 묶음들) {
    const k = m.부재[0] && m.부재[0].평면
    if (!k || m.방법 === '테두리' || !m.옮김) continue
    const key = m.번 + '|' + k.replace(/\|[^|]*$/, '')          // 끝 칸(글자가 든 도곽 번호)은 빼고 — 그린 자리 겹침으로 가름
    const a = 평면무리.get(key); if (a) a.push(m); else 평면무리.set(key, [m])
  }
  /* 같은 제목이라도 그린 자리(도면 좌표 테두리)가 2 m 안으로 겹치는 무리끼리만 — 제목 없는 평면이 옆 평면 제목으로 묶인 것은 따로 */
  const 겹틀 = (p, q) => p.틀[0] <= q.틀[2] + 2000 && q.틀[0] <= p.틀[2] + 2000 && p.틀[1] <= q.틀[3] + 2000 && q.틀[1] <= p.틀[3] + 2000
  let 고침 = 0
  for (const a of 평면무리.values()) {
    if (a.length < 2) continue
    for (const m of a) {
      if (m === 기준) continue
      const 주 = a.filter((q) => q !== m && 겹틀(q, m)).sort((p, q) => (q.힘 || 0) - (p.힘 || 0) || (q.기둥점 || []).length - (p.기둥점 || []).length || q.부재.length - p.부재.length)[0]
      if (!주 || !((주.힘 || 0) >= 3)) continue
      const 차 = Math.hypot(m.옮김[0] - 주.옮김[0], m.옮김[1] - 주.옮김[1])
      if (차 <= 150 || (m.힘 || 0) * 2 > 주.힘) continue
      const 줄 = m.맞춤줄 || 맞춤.find((z) => z.번 === m.번 && z.층 === m.층 && z.방법 === m.방법 && z.수 === m.부재.length && Math.abs(z.옮김[0] - 반(m.옮김[0])) < 1 && Math.abs(z.옮김[1] - 반(m.옮김[1])) < 1)
      m.옮김 = 주.옮김.slice(); m.방법 = '같은평면'; m.힘 = 주.힘
      if (줄) { 줄.방법 = '같은평면'; 줄.글 = '같은 평면(한 판)의 ' + (주.층 === 'FT' ? '기초' : 주.층 + '층') + ' 무리와 같은 자리 — 따로 맞춘 옮김은 ' + Math.round(차).toLocaleString('en') + ' mm 어긋났음'; 줄.옮김 = [반(m.옮김[0]), 반(m.옮김[1])] }
      고침++
    }
  }
  return 고침
}

/**
 * 🧭 G292 ② 기준 평면 다시 보기 — 다 맞춘 뒤 기준 기둥이 다른 평면(같은 평면 무리는 빼고 · 기초 층 빼고) 기둥과 30 % 도 안 겹치는데
 *   한 옮김으로 반 넘게(4개 넘게 · 처음의 두 배 넘게) 겹치면 그 옮김. 아니면 null.  맞춘 = 옮김을 정한 무리들({번, 층, 방법, 옮김, 기둥점, 기둥몸, 부재})
 */
export function 기준다시보기(기준, 맞춘) {
  if (!기준 || (기준.기둥점 || []).length < 4) return null
  const 기준평면 = 기준.부재[0] && 기준.부재[0].평면
  const 남들 = 맞춘.filter((m) => m !== 기준 && m.방법 !== '테두리' && m.층 !== 'FT' && m.옮김 && !(기준평면 && m.번 === 기준.번 && m.부재[0] && m.부재[0].평면 === 기준평면))
  const 그점 = [], 그몸 = []
  for (const m of 남들) (m.기둥점 || []).forEach((p, i) => { 그점.push([p[0] + m.옮김[0], p[1] + m.옮김[1]]); 그몸.push((m.기둥몸 || [])[i]) })
  if (그점.length < 4) return null
  const 겹수 = (tx, ty) => 기준.기둥점.filter((p) => 그점.some((q) => Math.abs(q[0] - p[0] - tx) < 100 && Math.abs(q[1] - p[1] - ty) < 100)).length
  const n0 = 겹수(기준.옮김[0], 기준.옮김[1])
  const v = 겹침투표(그점, 기준.기둥점, 100, 그몸, 기준.기둥몸)
  const n1 = v ? 겹수(v.tx, v.ty) : 0
  if (!(n0 < 0.3 * 기준.기둥점.length && n1 >= Math.max(4, 0.5 * 기준.기둥점.length, 2 * n0))) return null
  return { tx: v.tx, ty: v.ty, v, n0, n1, 그점 }
}

/**
 * 🧭 G277 확대평면도(같은 층을 크게 다시 그린 것) — 자리를 맞춘 것은 본 평면 부재와 «겹치는 것» 만 뺌(o.겹침 · 뺀), 본 평면에 없는 부재는 남김(o.확대만).
 *   자리를 못 맞춘(테두리) 확대평면도는 다 뺌. 묶음 = {층, 방법, 겹침, 부재:[{종류, 층, 판}]} · 확대(m) · 층본 = 본 평면을 맞춘 층 Set
 */
export function 확대평면도빼기(묶음들, 확대, 층본, 뺀) {
  /* 🧭 G277 자리를 맞춘 확대평면도는 본 평면 부재와 «겹치는 것» 만 뺌 — 본 평면에 이름표 없이 확대평면도에만 적힌 부재는 셈
     (현장 B 1층 바닥 보: 본 평면 9 · 확대평면도 23 — 예전엔 확대평면도 것을 다 빼 보 · 슬래브 · 벽이 모자랐음). 자리를 못 맞춘(테두리) 확대평면도는 예전처럼 다 뺌.
     겹침 = 보 · 벽은 나란한 축(폭 반 + 100 mm 안)이 확대 쪽 길이의 반 넘게 겹침 · 나머지는 상자 겹친 넓이가 작은 쪽의 반 넘게 — 기호는 안 봄(층 붙인 «2G1» 꼴) */
  const 축정보 = (o) => {
    const P = o.판
    if (!P || P.length < 4) return null
    const [a, b, c2] = P
    const e1 = Math.hypot(b[0] - a[0], b[1] - a[1]), e2 = Math.hypot(c2[0] - b[0], c2[1] - b[1])
    const L = Math.max(e1, e2) || 1, w = Math.min(e1, e2)
    const [u0, u1] = e1 >= e2 ? [a, b] : [b, c2]
    const ux = (u1[0] - u0[0]) / L, uy = (u1[1] - u0[1]) / L
    const m0 = 가운데(P)
    return { ux, uy, L, w, cx: m0[0], cy: m0[1] }
  }
  const 상자 = (o) => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const p of o.판 || []) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]) } return [x0, y0, x1, y1] }
  const 겹부재 = (o, q) => {
    if (o.종류 !== q.종류 || o.층 !== q.층) return false
    if (o.종류 === '보' || o.종류 === '벽') {
      const A = 축정보(o), B = 축정보(q)
      if (!A || !B || Math.abs(A.ux * B.uy - A.uy * B.ux) > 0.05) return false
      if (Math.abs((A.cx - B.cx) * -B.uy + (A.cy - B.cy) * B.ux) > Math.max(A.w, B.w) / 2 + 100) return false
      const t0 = (A.cx - B.cx) * B.ux + (A.cy - B.cy) * B.uy
      const 겹 = Math.min(t0 + A.L / 2, B.L / 2) - Math.max(t0 - A.L / 2, -B.L / 2)
      return 겹 >= 0.5 * A.L
    }
    const a = 상자(o), b = 상자(q)
    const w = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), h = Math.min(a[3], b[3]) - Math.max(a[1], b[1])
    if (w <= 0 || h <= 0) return false
    return w * h >= 0.5 * Math.min((a[2] - a[0]) * (a[3] - a[1]), (b[2] - b[0]) * (b[3] - b[1]))
  }
  const 남은것 = new Map()          // 층|종류 → [부재] (본 평면 것 + 남긴 확대평면도 것)
  const 남기 = (o) => { const k = o.층 + '|' + o.종류; const a = 남은것.get(k) || []; a.push(o); 남은것.set(k, a) }
  for (const m of 묶음들) if (!m.겹침 && !확대(m) && m.방법 !== '테두리') for (const o of m.부재) 남기(o)
  /* 🧭 G292 ③ 확대평면도는 같은 건물의 한 쪽을 크게 그린 것 — 본 평면에 없는 부재라도 그 층 본 평면 부재의 테두리(1.5 m 더) 밖이면 자리를 잘못 맞춘 것.
       (현장 B S-201: 부분 평면을 규칙적인 기둥 격자에 한 칸 비켜 맞춰 기둥 · 보 · 슬래브가 건물 옆에 따로 서서 «확대평면도에만 적힌 부재» 로 두 번 셈 — 약 70 ㎥) */
  const 본틀 = new Map()          // 층 → [x0, y0, x1, y1]
  for (const [k, a] of 남은것) {
    const 층 = k.split('|')[0]
    const b0 = 본틀.get(층) || [Infinity, Infinity, -Infinity, -Infinity]
    for (const o of a) for (const p of o.판 || []) { b0[0] = Math.min(b0[0], p[0]); b0[1] = Math.min(b0[1], p[1]); b0[2] = Math.max(b0[2], p[0]); b0[3] = Math.max(b0[3], p[1]) }
    본틀.set(층, b0)
  }
  const 틀안 = (층, P) => { const b0 = 본틀.get(층); if (!b0 || !(b0[2] > b0[0])) return true; const c = 가운데(P); return c[0] >= b0[0] - 1500 && c[0] <= b0[2] + 1500 && c[1] >= b0[1] - 1500 && c[1] <= b0[3] + 1500 }
  for (const m of 묶음들) {
    if (m.겹침 || !확대(m) || !층본.has(m.층)) continue
    if (m.방법 === '테두리') {
      for (const o of m.부재) { if (o.겹침) continue; o.겹침 = '확대평면도 — 같은 층 구조평면도가 있음'; 뺀.push(o) }
      m.겹침 = true
      continue
    }
    /* 확대평면도끼리 · 본 평면과 1 ~ 15 m 어긋나게 맞춰지기도 함(현장 B «2층 구조 확대평면도 -1» 1,020 mm) — 같은 기호 · 같은 크기 짝의 옮김 투표(100 mm 칸)로 먼저 맞춤.
         짝이 셋 안 되거나 부재의 30 % 안이면 어긋남을 모르는 것 — 예전처럼 다 뺌 */
    const 표 = new Map()
    for (const o of m.부재) {
      const g = 가운데(o.판), ko = o.종류 === '보' || o.종류 === '벽' ? o.길이 || 0 : 넓이(o.판)
      for (const q of 남은것.get(o.층 + '|' + o.종류) || []) {
        if ((q.몸 || q.기호) !== (o.몸 || o.기호)) continue
        const kq = q.종류 === '보' || q.종류 === '벽' ? q.길이 || 0 : 넓이(q.판)
        if (ko > 0 && kq > 0 && Math.abs(ko / kq - 1) > 0.1) continue
        const h = 가운데(q.판), dx = h[0] - g[0], dy = h[1] - g[1]
        if (Math.hypot(dx, dy) > 20000) continue
        const k = Math.round(dx / 100) + ',' + Math.round(dy / 100)
        표.set(k, (표.get(k) || 0) + 1)
      }
    }
    const 큰 = [...표].sort((a, b) => b[1] - a[1])[0]
    if (!큰 || 큰[1] < 3 || 큰[1] < 0.3 * m.부재.length) {
      for (const o of m.부재) { if (o.겹침) continue; o.겹침 = '확대평면도 — 같은 층 구조평면도가 있음(자리 맞춤 짝 모자람)'; 뺀.push(o) }
      m.겹침 = true
      continue
    }
    const [ex, ey] = 큰[0].split(',').map((v) => +v * 100)
    for (const o of m.부재) {
      if (o.겹침) continue          // 🧭 G292 ⑥ 이미 뺀 것(한 기둥에 기호 둘)은 또 안 뺌 — 두 번 빼면 산출서 줄 개수가 0 이 됐음
      const 옮 = { ...o, 판: o.판.map((p) => [p[0] + ex, p[1] + ey]) }
      /* 지붕 틀 평면(옥상 R · 옥탑 PH · PR 층)의 벽은 확대평면도에만 있으면 안 남김 — 바닥 틀 평면에 아래층 벽(점선)에 붙인 이름표가 많음(현장 B «PHF-1 구조 확대평면도» W1 · W2 14개 56 m:
           남기면 거푸집이 내역보다 7 % 넘침 · G271 과 같은 까닭) */
      if (o.종류 === '벽' && (o.층 === 'R' || /^P/.test(o.층))) { o.겹침 = '확대평면도 — 지붕 틀 평면의 벽(본 평면에 없음)'; 뺀.push(o); continue }
      if ((남은것.get(o.층 + '|' + o.종류) || []).some((q) => 겹부재(옮, q))) { o.겹침 = '확대평면도 — 같은 층 구조평면도에 같은 자리 부재가 있음'; 뺀.push(o) }
      else if (!틀안(o.층, 옮.판)) { o.겹침 = '확대평면도 — 맞춘 자리가 그 층 구조평면도 테두리 밖(자리 잘못 맞춤)'; 뺀.push(o) }
      else { o.판 = 옮.판; o.확대만 = true; if (ex || ey) o.짐작.push('확대평면도에만 적힌 부재 — 본 평면과 같은 기호 짝으로 자리를 ' + Math.round(Math.hypot(ex, ey)) + ' mm 옮겨 맞춤'); 남기(o) }
    }
  }
}

export function 겹친것빼기(공사, 모델) {
  if (!공사 || !모델 || !공사.동 || !공사.동.length) return 공사
  /* 🧭 G241 기초 평면의 기둥 · 벽(주각)은 3D 에서 잰 높이(밑 기초 · 지중보 윗면 ~ 1층 바닥)로 산출서 줄을 나눔 — 높이마다 한 줄 · 슬래브 공제 없음 */
  const 받침 = new Map()          // 표|i → [{kk, h}]
  for (const o of 모델.부재 || []) { if (!o.받침높이 || o.겹침) continue; const k = o.표 + '|' + o.i; const a = 받침.get(k) || []; a.push({ kk: o.kk, h: Math.round(o.z1 - o.z0) }); 받침.set(k, a) }
  /* 🏔 G299 지붕 높이 구역으로 올린 벽 · 기둥 — 높이(10 mm)마다 줄을 나눔 · 슬래브 공제(S)는 그대로 */
  const 올림 = new Map()          // 표|i → [{kk, h}]
  for (const o of 모델.부재 || []) { if (!o.지붕올림 || o.겹침) continue; const k = o.표 + '|' + o.i; const a = 올림.get(k) || []; a.push({ kk: o.kk, h: Math.round((o.z1 - o.z0) / 10) * 10 }); 올림.set(k, a) }
  /* 🧱 G299 벽 윗면 공제 — 도면에서 읽은 벽 높이 = 층고 − 슬래브 두께(적산 기준 · 내역서와 같은 셈). 전엔 층고 그대로라 벽 위 바닥판과 겹친 곳을 두 번 셈.
       벽 가운데 줄 점 10 개마다 — 곁(300 mm)에 그 높이(±100 · 지붕까지 올린 벽은 지붕 평면)의 바닥판이 있으면 그 두께 · 위에 보만 있으면 그 층 슬래브 두께 · 둘 다 없으면 0(벽 위가 비었음) → 평균(10 mm).
       벽 위 보와 겹친 몫(보 춤 − 슬래브)은 보 쪽에 그대로 둠 — 현장 4 계약내역서와 견줘 보면 내역서도 그렇게 셈(빼면 콘크리트 −4.7 % · 거푸집 −3.1 % · 안 빼면 −2.5 % · +2.6 %) */
  const 상부값 = new Map()        // 표|i → Map(kk → 상부 mm)
  const 층판 = new Map((공사.층 || []).map((f) => [String(f.이름), +f.슬라브 || 0]))
  {
    const 위것 = (모델.부재 || []).filter((q) => !q.겹침 && (q.종류 === '슬라브' || q.종류 === '보') && q.판 && q.판.length >= 3 && Number.isFinite(q.z1))
    const 안2 = (p, 판) => { let c = false; for (let i = 0, j = 판.length - 1; i < 판.length; j = i++) { const a = 판[i], b = 판[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c } return c }
    const 선거리2 = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy) }
    const 곁2 = (p, 판, e) => 안2(p, 판) || (e > 0 && 판.some((q, k) => 선거리2(p, q, 판[(k + 1) % 판.length]) <= e))
    const 상자2 = (판) => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const p of 판) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]) } return [x0, y0, x1, y1] }
    const 위상자 = 위것.map((q) => 상자2(q.판))
    for (const o of 모델.부재 || []) {
      if (o.겹침 || o.종류 !== '벽' || o.표 !== '옹벽' || o.기초판 || o.받침높이 || !o.판 || !Number.isFinite(o.z1)) continue
      const b = 상자2(o.판), 가로 = b[2] - b[0] >= b[3] - b[1]
      const P = []
      for (let k = 0; k < 10; k++) P.push(가로 ? [b[0] + (b[2] - b[0]) * (k + 0.5) / 10, (b[1] + b[3]) / 2] : [(b[0] + b[2]) / 2, b[1] + (b[3] - b[1]) * (k + 0.5) / 10])
      const 맞는높이 = (q) => o.지붕올림 ? (q.지붕높이 && Math.abs(q.z1 - o.z1) <= 1500) : Math.abs(q.z1 - o.z1) <= 100
      let 합 = 0
      for (const p of P) {
        let 보춤 = 0, 판두께 = 0
        for (let j = 0; j < 위것.length; j++) {
          const q = 위것[j], bb = 위상자[j]
          if (p[0] < bb[0] - 300 || p[0] > bb[2] + 300 || p[1] < bb[1] - 300 || p[1] > bb[3] + 300 || !맞는높이(q)) continue
          if (q.종류 === '보') { if (곁2(p, q.판, 30)) 보춤 = Math.max(보춤, +q.춤 || (q.z1 - q.z0)) }
          else if (곁2(p, q.판, 300)) 판두께 = Math.max(판두께, +q.두께 || (q.z1 - q.z0))
        }
        합 += 보춤 > 0 ? Math.max(판두께, 층판.get(String(o.층)) || 0) : 판두께
      }
      const v = Math.round(합 / P.length / 10) * 10
      if (!(v > 0) || v >= o.z1 - o.z0) continue
      const k = o.표 + '|' + o.i
      const m = 상부값.get(k) || new Map(); m.set(o.kk, v); 상부값.set(k, m)
    }
  }
  /* 🧭 G281 벽 줄마다 남은 토막의 벽 끝 몫(벽끝재기) — kk → 몫 · 줄의 «_단부끝» = 평균(셈: 단부 보강근 본수 × 이 몫) */
  const 벽끝 = new Map()          // 표|i → Map(kk → 몫)
  for (const o of 모델.부재 || []) { if (o.겹침 || !Number.isFinite(o.벽끝)) continue; const k = o.표 + '|' + o.i; const a = 벽끝.get(k) || new Map(); a.set(o.kk, o.벽끝); 벽끝.set(k, a) }
  const 끝평균 = (k, kks) => {
    const a = 벽끝.get(k)
    if (!a) return null
    const vs = kks ? kks.map((kk) => a.get(kk)).filter((v) => v !== undefined) : [...a.values()]
    return vs.length ? String(Math.round(vs.reduce((s, v) => s + v, 0) / vs.length * 1000) / 1000) : null
  }
  const 끝붙 = (r, k, kks) => { const v = 끝평균(k, kks); return v === null ? r : { ...r, _단부끝: v } }
  if (!(모델.뺀 && 모델.뺀.length) && !받침.size && !벽끝.size && !올림.size && !상부값.size) return 공사
  const 뺄 = new Map()
  const 뺀본 = new Set()          // 🧭 G292 ⑥ 같은 부재(표 · 줄 · 자리)는 한 번만 셈
  for (const o of 모델.뺀 || []) { const u = o.표 + '|' + o.i + '|' + o.kk; if (뺀본.has(u)) continue; 뺀본.add(u); const k = o.표 + '|' + o.i; 뺄.set(k, (뺄.get(k) || 0) + 1) }
  const d0 = 공사.동[0]
  const 주 = {}
  for (const [표, rows] of Object.entries(d0.주자료 || {})) {
    if (!Array.isArray(rows)) { 주[표] = rows; continue }
    주[표] = rows.flatMap((r, i) => {
      const n = 뺄.get(표 + '|' + i)
      const 전 = (r._자리 || []).length
      const 키 = 표 + '|' + i
      const 잰 = 받침.get(표 + '|' + i)
      if (잰 && 잰.length && 전) {
        /* 높이마다 — 잰 것(받침 위) · 못 잰 것(층고 그대로) · 뺀 것(겹침)은 빼고 */
        const 뺀kk = new Set((모델.뺀 || []).filter((o) => o.표 === 표 && o.i === i).map((o) => o.kk))
        const 무리 = new Map()
        for (const { kk, h } of 잰) { const a = 무리.get(h) || []; a.push(kk); 무리.set(h, a) }
        const 잰kk = new Set(잰.map((x) => x.kk))
        const 남kk = (r._자리 || []).map((_, kk) => kk).filter((kk) => !잰kk.has(kk) && !뺀kk.has(kk))
        const out = [...무리].sort((a, b) => b[1].length - a[1].length).map(([h, kks]) => 끝붙({ ...r, 높이: String(h), S: '0', QT: String(kks.length), _자리: kks.map((kk) => r._자리[kk]), _원줄: i, _원kk: kks }, 키, kks))
        if (남kk.length) out.push(끝붙({ ...r, QT: String(남kk.length), _자리: 남kk.map((kk) => r._자리[kk]), _원줄: i, _원kk: 남kk }, 키, 남kk))
        return out
      }
      /* 🏔 지붕까지 올린 높이 · 🧱 벽 윗면 공제(도면에서 읽은 벽 · 사람이 «상부» 를 안 적은 줄만) — 둘이 같은 자리끼리 한 줄 */
      const 올 = 올림.get(키)
      const 윗 = 표 === '옹벽' && r._양면 && !String(r.상부 ?? '').trim() ? 상부값.get(키) : null
      if (전 && ((올 && 올.length) || (윗 && 윗.size))) {
        const 뺀kk = new Set((모델.뺀 || []).filter((o) => o.표 === 표 && o.i === i).map((o) => o.kk))
        const h올 = new Map((올 || []).map((x) => [x.kk, x.h]))
        const 무리 = new Map()
        for (let kk = 0; kk < 전; kk++) {
          if (뺀kk.has(kk)) continue
          const h = h올.has(kk) ? h올.get(kk) : '', u = 윗 && 윗.has(kk) ? 윗.get(kk) : ''
          const key = h + '|' + u
          const a = 무리.get(key) || []; a.push(kk); 무리.set(key, a)
        }
        return [...무리].sort((a, b) => b[1].length - a[1].length).map(([key, kks]) => {
          const [h, u] = key.split('|')
          return 끝붙({ ...r, ...(h ? { 높이: h, _지붕올림: true } : {}), ...(u ? { 상부: u, _윗공제: true } : {}), QT: String(kks.length), _자리: kks.map((kk) => r._자리[kk]), _원줄: i, _원kk: kks }, 키, kks)
        })
      }
      if (!n) return [끝붙({ ...r, _원줄: i }, 키)]
      const qt = Number.isFinite(수(r.QT)) ? 수(r.QT) : 전
      const 새 = 전 ? Math.max(0, Math.round(qt * (전 - n) / 전)) : qt
      return [끝붙({ ...r, QT: String(새), _원줄: i }, 키)]
    })
  }
  return { ...공사, 동: [{ ...d0, 주자료: 주 }, ...공사.동.slice(1)] }
}

function 안(p, 판) {
  let 안쪽 = false
  for (let i = 0, j = 판.length - 1; i < 판.length; j = i++) {
    const a = 판[i], b = 판[j]
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) 안쪽 = !안쪽
  }
  return 안쪽
}
/**
 * 사람이 고친 바닥 높이(층 이름 → mm)로 공사의 층고를 다시 — 셈(골조.js)이 고친 높이로 물량을 내게.
 * 안 고친 층은 도면에서 읽은 바닥 높이(읽은높이 = 골조읽기 R.읽음.높이) 그대로 — 모델만들기와 같은 셈(한 층만 고치면 그 위아래 층고만 바뀜)
 */
export function 층고바꾸기(공사, 높이, 읽은높이 = {}) {
  if (!높이 || !Object.keys(높이).length) return 공사
  const 층 = (공사.층 || []).map((f) => ({ ...f }))
  const 이야기 = 층.filter((f) => 글(f.이름) !== 'FT')
  const FL = new Map()
  const 값 = (o, n) => (o && o[n] !== '' && o[n] !== null && o[n] !== undefined && Number.isFinite(+o[n]) ? +o[n] : null)
  let 누 = 0
  for (const f of 이야기) { const n = 글(f.이름); const v = 값(높이, n) ?? 값(읽은높이, n) ?? 누; FL.set(n, v); 누 = v + (수(f.층고) || 0) }
  for (let i = 0; i + 1 < 이야기.length; i++) {
    const a = FL.get(글(이야기[i].이름)), b = FL.get(글(이야기[i + 1].이름))
    if (b > a) 이야기[i].층고 = b - a
  }
  return { ...공사, 층 }
}
export const 높이글 = (mm) => (mm > 0 ? '+' : mm < 0 ? '−' : '±') + Math.abs(Math.round(mm)).toLocaleString('en-US')

/** 도면 글자에서 기초 윗면 높이 — 「기초 상단 EL-1,200」「T.O.F -1200」「기초 윗면 FL-1.20」 → mm (없으면 null) */
function 기초윗면(도면들, 준) {
  const 꼴 = /(?:기초\s*(?:상단|윗면|상부|TOP)|T\.?O\.?F\.?|TOP\s*OF\s*FOOTING)\s*[:=]?\s*\(?\s*(?:EL|FL|GL|SL)?\s*\.?\s*([+\-−±]?\s*\d[\d,]*(?:\.\d+)?)/i
  for (let i = 0; i < 도면들.length; i++) {
    for (const g of 준(i).글자) {
      /* 🧭 G237 «설계지하수위 - T.O.F +1.5m»(현장 B 구조일반사항)은 지하수위 — 기초 윗면 높이가 아님 */
      if (/수위|W\.?L\b|WATER|G\.?W\.?L/i.test(g.s)) continue
      const m = 꼴.exec(g.s)
      if (!m) continue
      let v = parseFloat(m[1].replace(/[\s,]/g, '').replace('−', '-').replace('±', ''))
      if (!Number.isFinite(v)) continue
      if (Math.abs(v) < 50 && /\./.test(m[1])) v *= 1000          // m 로 적은 것
      return v
    }
  }
  return null
}

/* ───────────────────────────── 부재마다 물량 */

/**
 * 골조.js 셈 결과의 줄(곳 = {표, i})을 그 줄의 부재 수(자리 수)로 나눠 부재마다.
 * @returns {{부재:Map<id,{콘크리트,거푸집,철근,철근규격:{}}>, 기타:{콘크리트,거푸집,철근}, 합:{…}, 층종:Map}}
 */
export function 부재물량(모델, S, 공사 = null) {
  /* 🧭 G241 겹친것빼기가 줄을 나눴으면(주각 높이마다) 산출서 줄(표|i) ↔ 모델 부재(원래 줄 · kk) 를 _원줄 · _원kk 로 잇기 */
  const 몫키 = new Map()
  const 줄들 = 공사 && 공사.동 && 공사.동[0] ? 공사.동[0].주자료 || {} : null
  if (줄들) for (const [표, rows] of Object.entries(줄들)) if (Array.isArray(rows)) rows.forEach((r, i) => { const 원 = r && r._원줄 != null ? r._원줄 : i; if (r && r._원kk) for (const kk of r._원kk) 몫키.set(표 + '|' + 원 + '|' + kk, 표 + '|' + i); else 몫키.set(표 + '|' + 원 + '|*', 표 + '|' + i) })
  const 키 = (o) => 몫키.get(o.표 + '|' + o.i + '|' + o.kk) || 몫키.get(o.표 + '|' + o.i + '|*') || (o.표 + '|' + o.i)
  const 줄묶음 = new Map()          // 표|i → {콘크리트, 거푸집, 철근, 규격:{}}
  const 빈 = () => ({ 콘크리트: 0, 거푸집: 0, 철근: 0, 규격: {} })
  const 기타 = 빈(), 합 = 빈()
  const 더 = (o, x) => {
    if (x.항목 === '콘크리트') o.콘크리트 += x.수량
    else if (x.항목 === '거푸집') o.거푸집 += x.수량
    else if (x.항목 === '철근') { o.철근 += x.수량; o.규격[x.규격] = (o.규격[x.규격] || 0) + x.수량 }
  }
  for (const x of S.줄 || []) {
    if (!Number.isFinite(x.수량)) continue
    더(합, x)
    const 곳 = x.곳
    if (!곳 || !종류표[곳.표]) { 더(기타, x); continue }
    const key = 곳.표 + '|' + 곳.i
    let o = 줄묶음.get(key); if (!o) { o = 빈(); 줄묶음.set(key, o) }
    더(o, x)
  }
  const 개수 = new Map()
  for (const o of 모델.부재) { const key = 키(o); 개수.set(key, (개수.get(key) || 0) + 1) }
  const 부재 = new Map()
  const 층종 = new Map()           // 층|종류 → 합
  const 나눔 = (a, n) => ({ 콘크리트: a.콘크리트 / n, 거푸집: a.거푸집 / n, 철근: a.철근 / n, 규격: Object.fromEntries(Object.entries(a.규격).map(([k, v]) => [k, v / n])) })
  for (const o of 모델.부재) {
    const key = 키(o)
    const a = 줄묶음.get(key)
    const q = a ? (o.몫비 > 0 ? 나눔(a, 1 / o.몫비) : 나눔(a, 개수.get(key))) : 빈()
    부재.set(o.id, q)
    const k2 = o.층 + '|' + o.종류
    let t = 층종.get(k2); if (!t) { t = { ...빈(), 개수: 0, 부피: 0 }; 층종.set(k2, t) }
    t.콘크리트 += q.콘크리트; t.거푸집 += q.거푸집; t.철근 += q.철근; t.개수++; t.부피 += o.부피
    for (const [g, v] of Object.entries(q.규격)) t.규격[g] = (t.규격[g] || 0) + v
  }
  // 자리가 없는 줄(사람이 더 적은 줄 · 마구리 등)은 기타
  for (const [key, a] of 줄묶음) if (!개수.has(key)) { 기타.콘크리트 += a.콘크리트; 기타.거푸집 += a.거푸집; 기타.철근 += a.철근; for (const [g, v] of Object.entries(a.규격)) 기타.규격[g] = (기타.규격[g] || 0) + v }
  return { 부재, 기타, 합, 층종 }
}

/* ───────────────────────────── 스스로 검사 */

/**
 * ① 층마다 기둥이 아래층 기둥 위에 섰나 ② 보 두 끝이 받침(기둥 · 벽 · 다른 보)에 닿았나 ③ 부피(3D) ↔ 산출서 콘크리트
 */
export function 검사(모델, Q) {
  const 줄 = []
  const 부 = 모델.부재
  const 층들 = 모델.층.filter((f) => f.이름 !== 'FT').map((f) => f.이름)
  for (let i = 1; i < 층들.length; i++) {
    const 위 = 부.filter((o) => o.종류 === '기둥' && o.층 === 층들[i]), 아래 = 부.filter((o) => o.종류 === '기둥' && o.층 === 층들[i - 1])
    if (!위.length || !아래.length) continue
    const 맞 = 위.filter((o) => 아래.some((p) => Math.hypot(o.자리[0] - p.자리[0], o.자리[1] - p.자리[1]) < 150)).length
    줄.push({ 좋음: 맞 === 위.length, 글: 층들[i] + '층 기둥 ' + 위.length + '개 중 ' + 맞 + '개가 ' + 층들[i - 1] + '층 기둥 바로 위' + (맞 === 위.length ? '' : ' — 나머지는 아래에 기둥이 없음(전이보 · 도면 자리 확인)') })
  }
  const 기초 = 부.filter((o) => o.종류 === '기초'), 첫 = 부.filter((o) => o.종류 === '기둥' && o.층 === 층들[0])
  if (기초.length && 첫.length) {
    const 맞 = 첫.filter((o) => 기초.some((f) => 안(o.자리, f.판))).length
    줄.push({ 좋음: 맞 === 첫.length, 글: (층들[0] || '1') + '층 기둥 ' + 첫.length + '개 중 ' + 맞 + '개가 기초 위' + (맞 === 첫.length ? '' : ' — 나머지는 아래에 기초가 없음(기초 도면 · 자리 확인)') })
  }
  let 끝수 = 0, 뜬끝 = 0
  for (const o of 부.filter((x) => x.종류 === '보')) {
    /* 🧭 G242 기초 평면 보(지중보)의 받침 = 기초 평면 기둥 · 벽(주각 — 층 이름은 1층) · 기초도 */
    const 받침 = 부.filter((x) => x !== o && ((x.층 === o.층 && (x.종류 === '기둥' || x.종류 === '벽' || x.종류 === '보')) || (o.층 === 'FT' && (x.기초판 || x.종류 === '기초'))))
    const p = o.판
    const 끝들 = [[(p[0][0] + p[3][0]) / 2, (p[0][1] + p[3][1]) / 2], [(p[1][0] + p[2][0]) / 2, (p[1][1] + p[2][1]) / 2]]
    for (const e of 끝들) {
      끝수++
      const 닿 = 받침.some((x) => 거리판(e, x.판) < 60)
      if (!닿) 뜬끝++
    }
  }
  if (끝수) 줄.push({ 좋음: 뜬끝 === 0, 글: '보 끝 ' + 끝수 + '곳 중 ' + (끝수 - 뜬끝) + '곳이 기둥 · 벽 · 다른 보에 닿음' + (뜬끝 ? ' — ' + 뜬끝 + '곳은 받침이 안 보임(캔틸레버거나 읽은 자리 확인)' : '') })
  // 부피 ↔ 산출서
  if (Q) {
    for (const 종 of 종류들) {
      const 판 = 부.filter((o) => o.종류 === 종)
      if (!판.length) continue
      const v3 = 판.reduce((s, o) => s + o.부피, 0)
      const vq = 판.reduce((s, o) => s + ((Q.부재.get(o.id) || {}).콘크리트 || 0), 0)
      const 비 = v3 > 0 ? vq / v3 : 0
      const 이름 = 종 === '슬라브' ? '슬래브' : 종
      줄.push({ 좋음: true, 정보: true, 종, 글: 이름 + ' — 3D 부피 ' + v3.toFixed(2) + ' ㎥ · 산출서 콘크리트 ' + vq.toFixed(2) + ' ㎥' + (vq > 0 ? (Math.abs(비 - 1) < 0.005 ? ' (같음)' : ' (산출서는 겹치는 곳을 빼서 ' + (비 * 100).toFixed(0) + '%)') : '') })
    }
  }
  return 줄
}
function 거리판(p, 판) {
  if (안(p, 판)) return 0
  let best = Infinity
  for (let i = 0; i < 판.length; i++) {
    const a = 판[i], b = 판[(i + 1) % 판.length]
    const dx = b[0] - a[0], dy = b[1] - a[1]
    const L2 = dx * dx + dy * dy || 1
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2))
    best = Math.min(best, Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy))
  }
  return best
}

/** 부재 크기 글 — 「600×600 · 높이 4,200」「400×700 · 길이 5,400」 */
export function 크기글(o) {
  const 쉼 = (v) => Math.round(v).toLocaleString('en-US')
  const 판 = o.판
  if (o.종류 === '보') return 쉼(o.폭) + '×' + 쉼(o.춤) + ' · 길이 ' + 쉼(o.길이)
  if (o.종류 === '벽') return '두께 ' + 쉼(o.폭) + ' · 길이 ' + 쉼(o.길이) + ' · 높이 ' + 쉼(o.z1 - o.z0)
  const xs = 판.map((p) => p[0]), ys = 판.map((p) => p[1])
  const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys)
  if (o.종류 === '슬라브') return 쉼(w) + '×' + 쉼(h) + ' · 두께 ' + 쉼(o.두께)
  if (o.종류 === '기초') return 쉼(w) + '×' + 쉼(h) + ' · 두께 ' + 쉼(o.두께)
  return (판.length > 8 ? 'Ø' + 쉼(w) : 쉼(w) + '×' + 쉼(h)) + ' · 높이 ' + 쉼(o.z1 - o.z0)
}
