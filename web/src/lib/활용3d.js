/**
 * 🧰 도면 3D 활용 — 셈만 (화면 · 파일 · 그물 없음) · G224 (2026-10-10)
 *
 * 소장님: 「오늘 3D작업 했잖아 그 방법을 이용해서 할 수 있는게 먹가 있지??」 → 「1번 부터 8번까지 설계해서 내일 아침에 알려줘.」
 *         → 「1번부터 8번까지 사이트에 있는 것 처럼 프로그램으로 만들어 놔. 바로 올릴 수 있게.」 (설계 docs/3D응용_설계_261010.md)
 *
 * 재료 = 도면 3D 일꾼(lib/dxf3d.worker.js)이 주는 r.활용
 *   { 실좌표, 바꿈, 땅: {점: Float64Array[x,y,z…], 삼: Int32Array[a,b,c…]}, 노선: [{이름, 간격, 범위, 줄: Float64Array[s,x,y,tx,ty…]}],
 *     종단: [{노선, 줄: [{m, 지반고, 계획고}]}], 횡단: [{노선, 파일, 단면: [{측, 이름, 지반고, 계획고, 면적, 바닥, 지반, 구조폭, 구조높, 터폭, 깊이}]}],
 *     구조: [{이름, 층, 넓이, 둘레, 아래, 위}], 성과점: [{이름, N, E, Z}] }
 *   좌표 mm(가운데 빼기 전) · 높이 mm · 측점 m. 화면 좌표 = 값 − r.center.
 *
 * 1 토공 검산(두 땅 면) · 2 도면 검사 · 3 측설표 · 4 구조물 물량 · 5 물길 · 6 기성 · 7 사진 위치 · 8 안전 그림
 * 시험: node tools/시험_3d활용.mjs
 */
import { 삼각망, 높이찾개, 평균단면 } from './토공3d.js'

/* ── 공통 ─────────────────────────────── */
const 가운데 = (a) => { if (!a.length) return NaN; const s = a.slice().sort((p, q) => p - q); return s[s.length >> 1] }
export const 반올림 = (v, d = 2) => (Number.isFinite(v) ? Math.round(v * 10 ** d) / 10 ** d : NaN)

/** 도면 좌표(mm) → 측량 좌표(m) · 한국 측량 꼴 X = 북 · Y = 동 */
export function 측량좌표(x, y, 바꿈 = false) {
  return 바꿈 ? { X: x / 1000, Y: y / 1000 } : { X: y / 1000, Y: x / 1000 }
}
/** 측량 좌표(m) → 도면 좌표(mm) */
export function 도면좌표(X, Y, 바꿈 = false) {
  return 바꿈 ? { x: X * 1000, y: Y * 1000 } : { x: Y * 1000, y: X * 1000 }
}

/* ── 노선 ─────────────────────────────── */
/** 측점 s(m) → {x, y, tx, ty} (줄 표본 사이를 잇기) */
export function 노선자리(L, s) {
  const a = L.줄, n = a.length / 5
  if (!n) return null
  if (s <= a[0]) return { x: a[1] + a[3] * (s - a[0]) * 1000, y: a[2] + a[4] * (s - a[0]) * 1000, tx: a[3], ty: a[4] }
  const k = (n - 1) * 5
  if (s >= a[k]) return { x: a[k + 1] + a[k + 3] * (s - a[k]) * 1000, y: a[k + 2] + a[k + 4] * (s - a[k]) * 1000, tx: a[k + 3], ty: a[k + 4] }
  let lo = 0, hi = n - 1
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (a[m * 5] <= s) lo = m; else hi = m }
  const i = lo * 5, j = hi * 5, t = (s - a[i]) / Math.max(1e-9, a[j] - a[i])
  const tx = a[i + 3] + (a[j + 3] - a[i + 3]) * t, ty = a[i + 4] + (a[j + 4] - a[i + 4]) * t, l = Math.hypot(tx, ty) || 1
  return { x: a[i + 1] + (a[j + 1] - a[i + 1]) * t, y: a[i + 2] + (a[j + 2] - a[i + 2]) * t, tx: tx / l, ty: ty / l }
}
/** (x, y) mm → 가장 가까운 측점 {s(m), 옆(m · 진행 방향 오른쪽 +), d(m)} */
export function 측점찾기(L, x, y) {
  const a = L.줄, n = a.length / 5
  let best = null
  for (let k = 0; k + 1 < n; k++) {
    const i = k * 5, j = i + 5
    const ax = a[i + 1], ay = a[i + 2], bx = a[j + 1], by = a[j + 2]
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy
    let u = l2 ? ((x - ax) * dx + (y - ay) * dy) / l2 : 0
    u = Math.max(0, Math.min(1, u))
    const px = ax + u * dx, py = ay + u * dy, d = Math.hypot(x - px, y - py) / 1000
    if (!best || d < best.d) {
      const l = Math.sqrt(l2) || 1
      const 옆 = ((x - ax) * (dy / l) - (y - ay) * (dx / l))      // 진행 방향 오른쪽 + (tx, ty) 를 시계 방향으로 90°
      best = { s: a[i] + (a[j] - a[i]) * u, 옆: 옆 / 1000, d }
    }
  }
  return best
}
/** 측점 글자 «NO.3+15.00»(간격 G) */
export function 측점글(s, G = 20) {
  if (!Number.isFinite(s)) return ''
  const n = Math.floor((s + 1e-6) / G), d = s - n * G
  return `NO.${n}${d > 0.005 ? '+' + d.toFixed(2) : ''}`
}
/** 종단 표 사이 높이(선형) — 줄 [{m, 값…}] · k = '지반고' | '계획고' */
export function 종단높이(줄, m, k = '계획고') {
  const a = (줄 || []).filter((r) => Number.isFinite(r[k]))
  if (!a.length) return NaN
  if (m <= a[0].m) return a.length > 1 ? a[0][k] + (a[1][k] - a[0][k]) * (m - a[0].m) / Math.max(1e-9, a[1].m - a[0].m) : a[0][k]
  for (let i = 1; i < a.length; i++) if (m <= a[i].m) return a[i - 1][k] + (a[i][k] - a[i - 1][k]) * (m - a[i - 1].m) / Math.max(1e-9, a[i].m - a[i - 1].m)
  const p = a[a.length - 2], q = a[a.length - 1]
  return p ? q[k] + (q[k] - p[k]) * (m - q.m) / Math.max(1e-9, q.m - p.m) : q[k]
}
/** 노선 길이(m) — 평면 중심선 표본으로 잰 실제 길이 */
export function 노선길이(L) {
  const a = L.줄; let t = 0
  for (let i = 5; i < a.length; i += 5) t += Math.hypot(a[i + 1] - a[i - 4], a[i + 2] - a[i - 3])
  return t / 1000
}

/* ── (공통 A) 땅 면 격자 ─────────────────────────────── */
/**
 * 점(mm) · 삼각형 → 격자 높이(m) · 칸 = 칸m(m)
 * @returns { x0, y0, nx, ny, 칸 (mm), z: Float32Array(m · 없으면 NaN) }
 */
export function 격자만들기(점, 삼, 칸m = 1, 한도 = 4e6, 틀 = null) {
  const P = [], T = []
  for (let i = 0; i < 점.length; i += 3) P.push([점[i], 점[i + 1], 점[i + 2]])
  for (let i = 0; i < 삼.length; i += 3) T.push([삼[i], 삼[i + 1], 삼[i + 2]])
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const p of P) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]) }
  let 칸 = 칸m * 1000
  while (((x1 - x0) / 칸 + 1) * ((y1 - y0) / 칸 + 1) > 한도) 칸 *= 1.5
  let nx = Math.max(1, Math.ceil((x1 - x0) / 칸) + 1), ny = Math.max(1, Math.ceil((y1 - y0) / 칸) + 1)
  /* 틀 = 다른 격자 {x0, y0, nx, ny, 칸} — 같은 칸 자리에서 높이를 잼(두 땅 면 비교 · 칸이 반 칸씩 어긋나지 않게) */
  if (틀) { x0 = 틀.x0; y0 = 틀.y0; nx = 틀.nx; ny = 틀.ny; 칸 = 틀.칸 }
  const z = new Float32Array(nx * ny).fill(NaN)
  const 찾 = 높이찾개(P, T)
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const v = 찾(x0 + (i + 0.5) * 칸, y0 + (j + 0.5) * 칸)
    if (Number.isFinite(v)) z[j * nx + i] = v / 1000
  }
  return { x0, y0, nx, ny, 칸, z }
}
/** 점 [[x,y,z]](mm) → 삼각망 → 격자 (측량성과표 · 측량 도면 점) */
export function 점에서격자(점들, 칸m = 1) {
  if (!점들 || 점들.length < 3) return null
  const 거 = []
  for (let i = 0; i < 점들.length; i += Math.max(1, Math.floor(점들.length / 400))) {
    let d = Infinity
    for (let j = 0; j < 점들.length; j++) if (j !== i) d = Math.min(d, Math.hypot(점들[j][0] - 점들[i][0], 점들[j][1] - 점들[i][1]))
    if (Number.isFinite(d)) 거.push(d)
  }
  const 최대변 = Math.min(80000, Math.max(25000, 6 * (가운데(거) || 10000)))
  const T = 삼각망(점들, 최대변)
  if (T.length < 1) return null
  return 격자만들기(Float64Array.from(점들.flat()), Int32Array.from(T.flat()), 칸m)
}

/** 점 [[x,y,z]](mm) → 땅 면 {점: Float64Array, 삼: Int32Array, 최대변(mm)} — 점이 없는 빈 곳(이웃 거리 6배 · 25 ~ 80 m 넘는 변)은 안 이음 */
export function 땅만들기(점들) {
  if (!점들 || 점들.length < 3) return null
  /* 같은 자리 점(1 cm 안 · 선의 끝 = 다음 선의 처음 · 성과표 겹친 줄)은 하나만 — 겹친 점이 있으면 삼각형이 뒤틀려 등고선 사이에 가짜 웅덩이가 생김(G224 언덕 예시 267곳) */
  { const 본 = new Set(), 남 = []; for (const p of 점들) { const k = Math.round(p[0] / 10) + ',' + Math.round(p[1] / 10); if (!본.has(k)) { 본.add(k); 남.push(p) } } 점들 = 남 }
  if (점들.length < 3) return null
  const 칸 = new Map(), K = 20000
  점들.forEach((p, i) => { const k = Math.floor(p[0] / K) + ',' + Math.floor(p[1] / K); let v = 칸.get(k); if (!v) { v = []; 칸.set(k, v) } v.push(i) })
  const 거 = []
  for (let i = 0; i < 점들.length; i += Math.max(1, Math.floor(점들.length / 600))) {
    const [x, y] = 점들[i], a = Math.floor(x / K), b = Math.floor(y / K)
    let d = Infinity
    for (let p = a - 1; p <= a + 1; p++) for (let q = b - 1; q <= b + 1; q++) for (const j of 칸.get(p + ',' + q) || []) if (j !== i) d = Math.min(d, Math.hypot(점들[j][0] - x, 점들[j][1] - y))
    if (Number.isFinite(d)) 거.push(d)
  }
  const 최대변 = Math.min(80000, Math.max(25000, 6 * (가운데(거) || 10000)))
  const T = 삼각망(점들, 최대변)
  if (T.length < 1) return null
  return { 점: Float64Array.from(점들.flat()), 삼: Int32Array.from(T.flat()), 최대변 }
}
/** 점 줄이기 — 같은 칸(칸 mm) 안의 점은 하나만 · 한도 넘으면 칸을 키움 */
export function 점솎기(점들, 한도 = 120000, 칸 = 300) {
  if (점들.length <= 한도) return 점들
  let 남 = 점들
  for (let k = 칸; ; k *= 1.6) {
    const 본 = new Set(), out = []
    for (const p of 점들) { const key = Math.round(p[0] / k) + ',' + Math.round(p[1] / k); if (본.has(key)) continue; 본.add(key); out.push(p) }
    남 = out
    if (out.length <= 한도) return 남
  }
}
/** 두 측량 범위가 겹치나 — 아니면 B 의 x · y 를 바꿔(측량 X = 북 ↔ 캐드 x = 동) 겹치나 → 'ok' | '바꿈' | '안겹침' */
export function 겹침보기(A점, B점) {
  const 상자 = (P, 바) => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const p of P) { const x = 바 ? p[1] : p[0], y = 바 ? p[0] : p[1]; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y) } return [x0, y0, x1, y1] }
  const 겹 = (a, b) => { const w = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), h = Math.min(a[3], b[3]) - Math.max(a[1], b[1]); return w > 0 && h > 0 ? (w * h) / Math.max(1, Math.min((a[2] - a[0]) * (a[3] - a[1]), (b[2] - b[0]) * (b[3] - b[1]))) : 0 }
  const a = 상자(A점), 그대로 = 겹(a, 상자(B점)), 바꿔 = 겹(a, 상자(B점, true))
  if (그대로 >= 0.05) return 'ok'
  if (바꿔 > 그대로 && 바꿔 >= 0.05) return '바꿈'
  return 그대로 > 0 ? 'ok' : '안겹침'
}
/** 블록(블록m) 마다 절토 · 성토 — 비교 결과(두면비교) + 전 격자 A → [{i, j, X, Y, 절토, 성토, 넓이}] (X 북 · Y 동 m) */
export function 블록합(비교, A, 블록m = 20, 바꿈 = false) {
  const 칸넓이 = (A.칸 / 1000) ** 2, k = Math.max(1, Math.round(블록m * 1000 / A.칸))
  const m = new Map()
  for (let j = 0; j < A.ny; j++) for (let i = 0; i < A.nx; i++) {
    const d = 비교.차[j * A.nx + i]
    if (!Number.isFinite(d)) continue
    const bi = Math.floor(i / k), bj = Math.floor(j / k), key = bi + ',' + bj
    let b = m.get(key); if (!b) { b = { i: bi, j: bj, 절토: 0, 성토: 0, 넓이: 0 }; m.set(key, b) }
    if (d < 0) b.절토 += -d * 칸넓이; else b.성토 += d * 칸넓이
    b.넓이 += 칸넓이
  }
  return [...m.values()].sort((p, q) => q.j - p.j || p.i - q.i).map((b) => {
    const c = 측량좌표(A.x0 + (b.i + 0.5) * k * A.칸, A.y0 + (b.j + 0.5) * k * A.칸, 바꿈)
    return { ...b, X: c.X, Y: c.Y }
  })
}
/** 🧪 예시 — 가상 측량 두 번(제가 지어낸 언덕 · 남의 현장 아님): 전 = 언덕 · 후 = 가운데를 EL 55.0 m 로 깎고 메운 터
 *  점은 10 m 안팎 간격으로 흩어 찍음(두 측량의 점 자리가 서로 다름) · 좌표는 측량 꼴(동 20만 · 북 55만 m 근처) */
export const 예시터 = { x0: 90, x1: 210, y0: 60, y1: 140, EL: 55 }
export function 예시높이(x, y, 후 = false) {
  const z = 50 + 6 * Math.exp(-((x - 150) ** 2 + (y - 100) ** 2) / (2 * 60 * 60)) + 0.01 * x
  if (!후) return z
  const T = 예시터
  return x >= T.x0 && x <= T.x1 && y >= T.y0 && y <= T.y1 ? T.EL : z
}
export function 가상측량(후 = false) {
  let s = 후 ? 7 : 3
  const 난 = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 }
  const E0 = 201000, N0 = 551000, out = []
  for (let y = 0; y <= 200; y += 10) for (let x = 0; x <= 300; x += 10) {
    const px = Math.min(300, Math.max(0, x + (난() - 0.5) * 7)), py = Math.min(200, Math.max(0, y + (난() - 0.5) * 7))
    out.push([(E0 + px) * 1000, (N0 + py) * 1000, Math.round(예시높이(px, py, 후) * 1000)])
  }
  if (후) {
    /* 깎은 터 가장자리(비탈 위 · 아래)는 측량에서 꼭 찍는 점 — 모서리를 따라 2 m 마다 */
    const T = 예시터
    for (let t = 0; t <= 1; t += 1 / 60) for (const [x, y] of [[T.x0 + t * (T.x1 - T.x0), T.y0], [T.x0 + t * (T.x1 - T.x0), T.y1], [T.x0, T.y0 + t * (T.y1 - T.y0)], [T.x1, T.y0 + t * (T.y1 - T.y0)]]) {
      out.push([(E0 + x) * 1000, (N0 + y) * 1000, T.EL * 1000])
      const ox = x === T.x0 ? -0.05 : x === T.x1 ? 0.05 : 0, oy = y === T.y0 ? -0.05 : y === T.y1 ? 0.05 : 0
      out.push([(E0 + x + ox) * 1000, (N0 + y + oy) * 1000, Math.round(예시높이(x + ox, y + oy) * 1000)])
    }
  }
  return out
}

/* ── 1 📐 토공 검산 — 두 땅 면 비교 ─────────────────────────────── */
/**
 * @param A 전 격자 · B 후 격자(같은 좌표계 · 칸이 달라도 됨 — A 칸에서 B 높이를 찾음)
 * @param 범위 null | [[x,y]…] 공사 범위(mm · 닫힌 꼴)
 * @returns { 절토, 성토, 넓이, 칸수, 차: Float32Array(B − A, m), 겹친칸 } — 부피 ㎥ · 넓이 ㎡
 */
export function 두면비교(A, B, 범위 = null) {
  const 안 = 범위 && 범위.length >= 3 ? (x, y) => {
    let c = false
    for (let i = 0, j = 범위.length - 1; i < 범위.length; j = i++) {
      const [xi, yi] = 범위[i], [xj, yj] = 범위[j]
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c
    }
    return c
  } : () => true
  const 차 = new Float32Array(A.nx * A.ny).fill(NaN)
  const 칸넓이 = (A.칸 / 1000) ** 2
  let 절토 = 0, 성토 = 0, n = 0
  for (let j = 0; j < A.ny; j++) for (let i = 0; i < A.nx; i++) {
    const za = A.z[j * A.nx + i]
    if (!Number.isFinite(za)) continue
    const x = A.x0 + (i + 0.5) * A.칸, y = A.y0 + (j + 0.5) * A.칸
    if (!안(x, y)) continue
    const bi = Math.floor((x - B.x0) / B.칸), bj = Math.floor((y - B.y0) / B.칸)
    if (bi < 0 || bj < 0 || bi >= B.nx || bj >= B.ny) continue
    const zb = B.z[bj * B.nx + bi]
    if (!Number.isFinite(zb)) continue
    const d = zb - za
    차[j * A.nx + i] = d
    n++
    if (d < 0) 절토 += -d * 칸넓이; else 성토 += d * 칸넓이
  }
  return { 절토, 성토, 넓이: n * 칸넓이, 칸수: n, 차, 칸m: A.칸 / 1000 }
}
/** 토량 환산 — 본바닥(자연) 부피 → 흐트러진(L) · 다짐(C) · 덤프 대수(한 대 m³) */
export function 토량환산(본, L = 1.25, C = 0.9, 덤프 = 10.5) {
  return { 흐트러진: 본 * L, 다짐: 본 * C, 대수: 덤프 > 0 ? Math.ceil(본 * L / 덤프) : 0 }
}

/* ── 2 🔍 도면 검사 — 도면끼리 안 맞는 곳 ─────────────────────────────── */
/**
 * @param 활 r.활용 · 허 = { 높이: 0.05(m), 길이: 0.001(비율), 튐: 3(배) }
 * @param 땅높이 null | (x, y) → z(m) — 측량 땅 면
 * @returns { 곳: [{노선, 측, 무엇, A, B, 차, 등급}], 본것: {…}, 못본것: [글] }
 * 보는 것: ① 종단 표 ↔ 횡단 지반고 ② 계획고 ③ 평면 중심선 길이 ↔ 측점 거리 ④ 종단엔 있고 횡단엔 없는 측점 ⑤ 측량 땅 면 ↔ 횡단 지반고 ⑥ 이웃보다 터파기 면적이 크게 튐
 */
export function 도면검사(활, 허 = {}, 땅높이 = null) {
  const H = { 높이: 0.05, 길이: 0.001, 튐: 3, ...허 }
  const 곳 = [], 못본것 = [], 본것 = { 지반: 0, 계획: 0, 길이: 0, 빠짐: 0, 땅: 0, 튐: 0 }
  const 노선들 = 활.노선 || []
  for (const t of 활.횡단 || []) {
    const 이름 = t.노선 || t.파일
    const 종 = (활.종단 || []).find((z) => z.노선 === t.노선)
    const L = 노선들.find((x) => x.이름 === t.노선)
    const 단 = [...t.단면].sort((a, b) => a.측 - b.측)
    if (!종) 못본것.push(`«${이름}» 종단 표가 없어 지반고 · 계획고를 맞대지 못함`)
    for (const s of 단) {
      if (종) {
        const r = 종.줄.find((q) => Math.abs(q.m - s.측) < 0.05)
        if (r) {
          if (Number.isFinite(r.지반고) && Number.isFinite(s.지반고)) {
            본것.지반++
            const d = s.지반고 - r.지반고
            if (Math.abs(d) > H.높이) 곳.push({ 노선: 이름, 측: s.측, 글: s.글, 무엇: '지반고 — 종단 표 ↔ 횡단', A: r.지반고, B: s.지반고, 차: d, 등급: Math.abs(d) > 0.3 ? '큼' : '작음' })
          }
          if (Number.isFinite(r.계획고) && Number.isFinite(s.계획고)) {
            본것.계획++
            const d = s.계획고 - r.계획고
            if (Math.abs(d) > H.높이) 곳.push({ 노선: 이름, 측: s.측, 글: s.글, 무엇: '계획고 — 종단 표 ↔ 횡단', A: r.계획고, B: s.계획고, 차: d, 등급: Math.abs(d) > 0.3 ? '큼' : '작음' })
          }
        }
      }
      /* ⑤ 측량 땅 면 ↔ 도면 지반고 (노선 위 측점 자리) */
      if (땅높이 && L && Number.isFinite(s.지반고)) {
        const p = 노선자리(L, s.측)
        const z = p ? 땅높이(p.x, p.y) : NaN
        if (Number.isFinite(z)) {
          본것.땅++
          const d = s.지반고 - z
          if (Math.abs(d) > Math.max(H.높이, 0.1)) 곳.push({ 노선: 이름, 측: s.측, 글: s.글, 무엇: '지반고 — 측량 땅 면 ↔ 횡단(현황과 설계가 다름)', A: z, B: s.지반고, 차: d, 등급: Math.abs(d) > 0.3 ? '큼' : '작음' })
        }
      }
    }
    /* ④ 빠진 단면 · 들쭉날쭉한 간격 */
    if (종 && 종.줄.length >= 2) {
      const 횡측 = new Set(단.map((s) => s.측.toFixed(1)))
      const lo = 단.length ? 단[0].측 : 0, hi = 단.length ? 단[단.length - 1].측 : 0
      for (const r of 종.줄) {
        if (r.m < lo - 0.05 || r.m > hi + 0.05) continue
        본것.빠짐++
        if (!횡측.has(r.m.toFixed(1))) 곳.push({ 노선: 이름, 측: r.m, 글: r.글, 무엇: '횡단면도가 없음(종단 표에는 있는 측점)', A: NaN, B: NaN, 차: NaN, 등급: '작음' })
      }
    }
    /* ⑥ 이웃(앞뒤 둘씩)의 가운데 값보다 터파기 면적이 3배 넘게 튐 — 튄 단면 옆 단면까지 잡히지 않게 가운데 값으로 */
    const 면 = 단.filter((s) => s.면적 && s.면적.터파기 > 0)
    for (let i = 0; i < 면.length; i++) {
      const 곁 = 면.slice(Math.max(0, i - 2), i).concat(면.slice(i + 1, i + 3)).map((x) => x.면적.터파기)
      if (곁.length < 3) continue                 /* 끝 단면(이웃 둘뿐)은 안 봄 */
      const b = 면[i].면적.터파기
      본것.튐++
      const 곁차 = 곁.slice().sort((p, q) => p - q), 이웃 = 곁차.length % 2 ? 곁차[곁차.length >> 1] : (곁차[곁차.length / 2 - 1] + 곁차[곁차.length / 2]) / 2
      if (이웃 > 0.05 && (b > H.튐 * 이웃 || b < 이웃 / H.튐)) 곳.push({ 노선: 이름, 측: 면[i].측, 글: 면[i].글, 무엇: `터파기 면적이 이웃(${이웃.toFixed(2)} ㎡)과 크게 다름 — 오기 · 다른 단면 의심`, A: 이웃, B: b, 차: b - 이웃, 등급: '작음' })
    }
  }
  /* ③ 평면 중심선 길이 ↔ 측점(종단 누가거리) */
  for (const L of 노선들) {
    const 잰 = 노선길이(L), 적힌 = L.범위[1] - L.범위[0]
    if (!(적힌 > 1)) continue
    본것.길이++
    const d = 잰 - 적힌
    if (Math.abs(d) > Math.max(0.5, H.길이 * 적힌)) 곳.push({ 노선: L.이름, 측: L.범위[1], 글: '', 무엇: '평면 중심선 길이 ↔ 측점 거리', A: 적힌, B: 잰, 차: d, 등급: Math.abs(d) > 0.01 * 적힌 ? '큼' : '작음' })
  }
  if (!(활.횡단 || []).length) 못본것.push('횡단면도가 없어 측점별 맞대기를 못 함')
  if (!땅높이) 못본것.push('측량 땅 면이 없어 현황 ↔ 설계 지반고는 못 봄(측량성과표 · 측량도면을 넣으면 봄)')
  곳.sort((a, b) => (a.등급 === b.등급 ? 0 : a.등급 === '큼' ? -1 : 1) || String(a.노선).localeCompare(String(b.노선)) || a.측 - b.측)
  return { 곳, 본것, 못본것 }
}

/* ── 3 📍 측설표 ─────────────────────────────── */
/**
 * @param 활 r.활용 · 설정 = { 간격: 20(m), 폭: true, 구조: true }
 * @param 구조점 [{이름, 점: [[x,y]](mm)}] — 화면이 콘크리트 층에서 뽑은 바깥 모서리(가운데 되돌린 값)
 * @returns { 줄: [{번, 코드, 노선, 측, 측글, 옆, X, Y, Z, 무엇}], 실좌표 }
 */
export function 측설표(활, 설정 = {}, 구조점 = []) {
  const S = { 간격: 20, 폭: true, 구조: true, ...설정 }
  const 줄 = []
  let 번C = 0, 번L = 0, 번S = 0
  for (const L of 활.노선 || []) {
    const 종 = (활.종단 || []).find((z) => z.노선 === L.이름)
    const t = (활.횡단 || []).find((x) => x.노선 === L.이름)
    const [s0, s1] = L.범위
    const 측들 = []
    for (let s = Math.ceil(s0 / S.간격) * S.간격; s <= s1 + 1e-6; s += S.간격) 측들.push(s)
    if (!측들.length || Math.abs(측들[0] - s0) > 1e-6) 측들.unshift(s0)
    if (Math.abs(측들[측들.length - 1] - s1) > 1e-6) 측들.push(s1)
    /* 꺾이는 곳(방향이 10° 넘게 바뀌는 측점)도 넣음 */
    const a = L.줄
    for (let i = 10; i + 10 < a.length; i += 5) {
      const ang = Math.acos(Math.max(-1, Math.min(1, a[i - 7] * a[i + 3] + a[i - 6] * a[i + 4])))
      if (ang > 0.1745 && !측들.some((s) => Math.abs(s - a[i]) < S.간격 * 0.25)) 측들.push(a[i])
    }
    측들.sort((p, q) => p - q)
    for (const s of 측들) {
      const p = 노선자리(L, s)
      if (!p) continue
      /* 계획고는 종단 표 «안» 에서만(표 밖은 늘려 짐작하지 않음 — 측설에 짐작 높이가 들어가면 안 됨) */
      const 계 = 종 ? 종.줄.filter((r) => Number.isFinite(r.계획고)) : []
      const 안 = 계.length && s >= 계[0].m - 0.01 && s <= 계[계.length - 1].m + 0.01
      const z = 안 ? 종단높이(종.줄, s, '계획고') : NaN
      const c = 측량좌표(p.x, p.y, 활.바꿈)
      줄.push({ 번: `C-${String(++번C).padStart(3, '0')}`, 코드: 'CL', 노선: L.이름, 측: s, 측글: 측점글(s, L.간격 || 20), 옆: 0, X: c.X, Y: c.Y, Z: z, 무엇: 안 || !계.length ? '중심선' : '중심선(종단 표 밖 — 계획고 없음)' })
      if (S.폭 && t) {
        /* 가장 가까운 횡단의 터파기 끝(좌 · 우)과 구조물 바깥(좌 · 우) */
        const 단 = t.단면.reduce((b, x) => (!b || Math.abs(x.측 - s) < Math.abs(b.측 - s) ? x : b), null)
        if (단 && Math.abs(단.측 - s) <= S.간격 * 0.5 + 1e-6) {
          const 옆점 = (o, 무엇, 코드, zz) => {
            /* 진행 방향 오른쪽 = (ty, −tx) */
            const x = p.x + p.ty * o * 1000, y = p.y - p.tx * o * 1000
            const cc = 측량좌표(x, y, 활.바꿈)
            줄.push({ 번: `L-${String(++번L).padStart(3, '0')}`, 코드, 노선: L.이름, 측: s, 측글: 측점글(s, L.간격 || 20), 옆: o, X: cc.X, Y: cc.Y, Z: zz, 무엇 })
          }
          const 지반z = (o) => { if (!단.지반 || !단.지반.length) return NaN; let b = 단.지반[0]; for (const q of 단.지반) if (Math.abs(q[0] - o) < Math.abs(b[0] - o)) b = q; return b[1] }
          if (단.터폭) { 옆점(단.터폭[0], '터파기 끝(왼쪽)', 'EX', 지반z(단.터폭[0])); 옆점(단.터폭[1], '터파기 끝(오른쪽)', 'EX', 지반z(단.터폭[1])) }
          if (단.구조폭) { 옆점(단.구조폭[0], '구조물 바깥(왼쪽)', 'ST', 단.구조높 ? 단.구조높[0] : NaN); 옆점(단.구조폭[1], '구조물 바깥(오른쪽)', 'ST', 단.구조높 ? 단.구조높[0] : NaN) }
        }
      }
    }
  }
  if (S.구조) for (const q of 구조점 || []) for (const [x, y] of q.점 || []) {
    const c = 측량좌표(x, y, 활.바꿈)
    줄.push({ 번: `S-${String(++번S).padStart(3, '0')}`, 코드: 'STR', 노선: q.이름, 측: NaN, 측글: '', 옆: NaN, X: c.X, Y: c.Y, Z: Number.isFinite(q.z) ? q.z : NaN, 무엇: '구조물 바깥 모서리' })
  }
  return { 줄, 실좌표: !!활.실좌표 }
}
/** 측설표 → CSV(점번호, X(북), Y(동), Z, 코드) — 토탈스테이션 · GNSS 장비에 넣는 꼴 */
export function 측설CSV(줄) {
  const z = (v) => (Number.isFinite(v) ? v.toFixed(3) : '')
  return ['PT,X(N),Y(E),Z,CODE', ...줄.map((r) => [r.번, r.X.toFixed(3), r.Y.toFixed(3), z(r.Z), r.코드].join(','))].join('\r\n') + '\r\n'
}
/** 바깥 모서리 — 점들(mm)의 볼록 껍질 → 가장 작은 돌린 네모의 네 모서리 */
export function 네모서리(점들) {
  const P = [...new Map(점들.map((p) => [Math.round(p[0]) + ',' + Math.round(p[1]), p])).values()].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (P.length < 3) return null
  const 가 = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const 아 = [], 위 = []
  for (const p of P) { while (아.length >= 2 && 가(아[아.length - 2], 아[아.length - 1], p) <= 0) 아.pop(); 아.push(p) }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (위.length >= 2 && 가(위[위.length - 2], 위[위.length - 1], p) <= 0) 위.pop(); 위.push(p) }
  const H = 아.slice(0, -1).concat(위.slice(0, -1))
  let best = null
  for (let i = 0; i < H.length; i++) {
    const a = H[i], b = H[(i + 1) % H.length]
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 1e-9) continue
    const ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity
    for (const p of H) { const u = p[0] * ux + p[1] * uy, v = -p[0] * uy + p[1] * ux; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v) }
    const 넓 = (u1 - u0) * (v1 - v0)
    if (!best || 넓 < best.넓) best = { 넓, ux, uy, u0, u1, v0, v1 }
  }
  if (!best) return null
  const { ux, uy, u0, u1, v0, v1 } = best
  const 점 = (u, v) => [u * ux - v * uy, u * uy + v * ux]
  return { 점: [점(u0, v0), 점(u1, v0), 점(u1, v1), 점(u0, v1)], 가로: (u1 - u0) / 1000, 세로: (v1 - v0) / 1000 }
}

/* ── 4 🧱 구조물 물량 ─────────────────────────────── */
/**
 * 줄로 긴 구조물(배수로 · 측구 · 옹벽) — 횡단 콘크리트(㎡) · 거푸집(m)을 평균단면법으로
 * 홀로 선 구조물 — 바닥 넓이 · 바깥 벽 길이 · 높이 × 넣은 두께(개략)
 * @param 두께 { 벽: 0.3, 바닥: 0.3, 덮개: 0 } (m)
 */
export function 구조물량(활, 두께 = {}) {
  const T = { 벽: 0.3, 바닥: 0.3, 덮개: 0, ...두께 }
  const 줄로 = (활.횡단 || []).map((t) => {
    const 단 = t.단면.filter((s) => s.면적).map((s) => ({ 측: s.측, 이름: s.이름, 면적: { 콘크리트: s.면적.콘크리트 || 0, 거푸집: s.면적.거푸집 || 0, 터파기: s.면적.터파기, 되메우기: s.면적.되메우기, 구조물: s.면적.구조물, 성토: s.면적.성토 } }))
    const p = 평균단면(단)
    return { 노선: t.노선 || t.파일, 단면수: 단.length, 길이: p.길이, 콘크리트: p.합.콘크리트 || 0, 거푸집: p.합.거푸집 || 0, 줄: p.줄 }
  }).filter((x) => x.단면수 >= 2 && x.콘크리트 > 0)
  const 홀로 = (활.구조 || []).map((q) => {
    const 높이 = Math.max(0, q.위 - q.아래)
    const 벽 = q.둘레 * 높이 * T.벽, 바닥 = q.넓이 * T.바닥, 덮개 = q.넓이 * T.덮개
    return { 이름: q.이름, 넓이: q.넓이, 둘레: q.둘레, 높이, 콘크리트: 벽 + 바닥 + 덮개, 거푸집: q.둘레 * 높이 * 2 + (T.덮개 > 0 ? q.넓이 : 0), 나눔: { 벽, 바닥, 덮개 } }
  })
  return { 줄로, 홀로, 두께: T }
}
/** 내역서 엑셀(읽은 책 {시트: 칸[][]}) → 품목 줄 [{이름, 규격, 단위, 수량, 시트}] — 머리(품명 · 명칭 · 공종 / 규격 / 단위 / 수량)를 찾아서 */
export function 내역품목(책) {
  const 붙 = (v) => String(v ?? '').replace(/\s+/g, '')
  const 수 = (v) => { const n = Number(String(v ?? '').replace(/[,\s]/g, '')); return Number.isFinite(n) ? n : NaN }
  const out = []
  for (const [시트, 칸] of Object.entries(책 || {})) {
    if (!Array.isArray(칸)) continue
    let hi = -1, iN = -1, iS = -1, iU = -1, iQ = -1
    for (let r = 0; r < Math.min(칸.length, 30) && hi < 0; r++) {
      const c = (칸[r] || []).map(붙)
      const n = c.findIndex((x) => /^(품명|명칭|공종|공종명|품목|공사명)$/.test(x)), u = c.findIndex((x) => /^단위$/.test(x)), q = c.findIndex((x) => /^수량$/.test(x))
      if (n >= 0 && u >= 0 && q >= 0) { hi = r; iN = n; iU = u; iQ = q; iS = c.findIndex((x) => /^(규격|규 격)$/.test(x)) }
    }
    if (hi < 0) continue
    for (let r = hi + 1; r < 칸.length; r++) {
      const row = 칸[r] || []
      const 이름 = String(row[iN] ?? '').trim(), q = 수(row[iQ])
      if (!이름 || !Number.isFinite(q)) continue
      out.push({ 이름, 규격: iS >= 0 ? String(row[iS] ?? '').trim() : '', 단위: String(row[iU] ?? '').trim(), 수량: q, 시트 })
    }
  }
  return out
}
/** 내역서 줄에서 콘크리트(㎥) · 거푸집(㎡) 수량 찾기 — [{이름, 규격, 단위, 수량}] */
export function 내역맞대기(내역줄, 도면) {
  /* 내역서엔 같은 콘크리트가 «레미콘(재료)» 과 «타설(품)» 두 줄로 들어 있어 다 더하면 두 배 — 레미콘 → 타설 → 그 밖의 콘크리트 차례로 한 무리만 */
  const 세제곱 = (r) => /m3|㎥|M3|루베/i.test(r.단위), 네모 = (r) => /m2|㎡|M2|헤베/i.test(r.단위)
  const 글 = (r) => String(r.이름) + ' ' + String(r.규격)
  const 줄들 = (내역줄 || []).filter(세제곱)
  const 무리 = [['레미콘', (r) => /레미콘|레디믹스/.test(글(r))], ['타설', (r) => /타설/.test(글(r))], ['콘크리트', (r) => /콘크리트/.test(글(r)) && !/양생|면처리|깨기|철거|운반/.test(글(r))]]
  let 콘 = [], 근거 = ''
  for (const [k, f] of 무리) { const a = 줄들.filter(f); if (a.length) { 콘 = a; 근거 = k; break } }
  const 거 = (내역줄 || []).filter((r) => /거푸집/.test(글(r)) && 네모(r) && !/해체|운반/.test(글(r)))
  const 합 = (a) => a.reduce((s, r) => s + (Number(r.수량) || 0), 0)
  return [
    { 무엇: '콘크리트(㎥)', 내역: 합(콘), 도면: 도면.콘크리트, 차: 도면.콘크리트 - 합(콘), 줄: 콘.length, 근거: 근거 ? `«${근거}» 줄` : '' },
    { 무엇: '거푸집(㎡)', 내역: 합(거), 도면: 도면.거푸집, 차: 도면.거푸집 - 합(거), 줄: 거.length, 근거: 거.length ? '«거푸집» 줄' : '' },
  ]
}

/* ── 5 💧 물길 ─────────────────────────────── */
const D8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]
/**
 * 격자(공통 A) → 고인 곳(10 ㎡ 또는 30 cm 넘는 것) · 흐름 방향 · 모이는 양 · 물길
 * @returns { 고임: [{x, y, 넓이(㎡), 깊이(m), 칸수}], 물길: [[x1,y1,z1,x2,y2,z2]…](mm · 화면 높이 m→mm), 모임: Float32Array(칸수), 방향: Int8Array, 메운: Float32Array }
 */
export function 물길찾기(G, 문턱칸 = null) {
  const { nx, ny, z } = G, N = nx * ny
  /* 고인 곳 메우기(우선순위 범람 — 바깥 테두리 · 빈 칸 옆부터) */
  const 메운 = Float32Array.from(z)
  const 본 = new Uint8Array(N)
  const 힙 = []
  const 넣 = (k, v) => { 힙.push([v, k]); let i = 힙.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (힙[p][0] <= 힙[i][0]) break; [힙[p], 힙[i]] = [힙[i], 힙[p]]; i = p } }
  const 빼 = () => { const t = 힙[0], e = 힙.pop(); if (힙.length) { 힙[0] = e; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < 힙.length && 힙[l][0] < 힙[m][0]) m = l; if (r < 힙.length && 힙[r][0] < 힙[m][0]) m = r; if (m === i) break; [힙[m], 힙[i]] = [힙[i], 힙[m]]; i = m } } return t }
  const 있 = (i, j) => i >= 0 && j >= 0 && i < nx && j < ny && Number.isFinite(z[j * nx + i])
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i
    if (!Number.isFinite(z[k])) continue
    let 가장자리 = false
    for (const [di, dj] of D8) if (!있(i + di, j + dj)) { 가장자리 = true; break }
    if (가장자리) { 본[k] = 1; 넣(k, z[k]) }
  }
  while (힙.length) {
    const [v, k] = 빼()
    const i = k % nx, j = (k / nx) | 0
    for (const [di, dj] of D8) {
      const ii = i + di, jj = j + dj
      if (!있(ii, jj)) continue
      const kk = jj * nx + ii
      if (본[kk]) continue
      본[kk] = 1
      if (메운[kk] < v) 메운[kk] = v + 1e-5      // 아주 조금 기울여 흐름이 끊기지 않게
      넣(kk, 메운[kk])
    }
  }
  /* 흐름 방향(메운 면에서 가장 가파른 아래) */
  const 방향 = new Int8Array(N).fill(-1)
  const 칸 = G.칸 / 1000
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i
    if (!Number.isFinite(메운[k])) continue
    let best = -1, 기 = 0
    for (let d = 0; d < 8; d++) {
      const ii = i + D8[d][0], jj = j + D8[d][1]
      if (!있(ii, jj)) continue
      const g = (메운[k] - 메운[jj * nx + ii]) / (칸 * (d % 2 ? Math.SQRT2 : 1))
      if (g > 기) { 기 = g; best = d }
    }
    방향[k] = best
  }
  /* 모이는 양(칸 수) — 높은 칸부터 */
  const 차례 = []
  for (let k = 0; k < N; k++) if (Number.isFinite(메운[k])) 차례.push(k)
  차례.sort((a, b) => 메운[b] - 메운[a])
  const 모임 = new Float32Array(N)
  for (const k of 차례) 모임[k] += 1
  for (const k of 차례) {
    const d = 방향[k]
    if (d < 0) continue
    const i = k % nx + D8[d][0], j = ((k / nx) | 0) + D8[d][1]
    모임[j * nx + i] += 모임[k]
  }
  /* 물길 선 — 모이는 넓이가 문턱 넘는 칸 */
  const 문턱 = 문턱칸 || Math.max(30, Math.round(차례.length * 0.01))
  const 물길 = []
  for (const k of 차례) {
    if (모임[k] < 문턱 || 방향[k] < 0) continue
    const i = k % nx, j = (k / nx) | 0, ii = i + D8[방향[k]][0], jj = j + D8[방향[k]][1]
    const x1 = G.x0 + (i + 0.5) * G.칸, y1 = G.y0 + (j + 0.5) * G.칸, x2 = G.x0 + (ii + 0.5) * G.칸, y2 = G.y0 + (jj + 0.5) * G.칸
    물길.push([x1, y1, z[k] * 1000, x2, y2, z[jj * nx + ii] * 1000, 모임[k]])
  }
  /* 고인 곳 — 메운 − 원래 > 2 cm 인 칸 덩어리 */
  const 고 = new Uint8Array(N)
  for (let k = 0; k < N; k++) if (Number.isFinite(z[k]) && 메운[k] - z[k] > 0.02) 고[k] = 1
  const 표 = new Int32Array(N), 고임 = []
  for (let k0 = 0; k0 < N; k0++) {
    if (!고[k0] || 표[k0]) continue
    const q = [k0]; 표[k0] = 1
    let 깊 = 0, sx = 0, sy = 0
    for (let h = 0; h < q.length; h++) {
      const k = q[h], i = k % nx, j = (k / nx) | 0
      깊 = Math.max(깊, 메운[k] - z[k]); sx += i; sy += j
      for (const [di, dj] of D8.filter((_, d) => d % 2 === 0)) {
        const ii = i + di, jj = j + dj
        if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue
        const kk = jj * nx + ii
        if (고[kk] && !표[kk]) { 표[kk] = 1; q.push(kk) }
      }
    }
    /* 작은 것(10 ㎡ 안 · 30 cm 안)은 뺌 — 등고선 삼각형의 납작한 조각(같은 등고선 세 점)이 만드는 얕은 «가짜 웅덩이» 와 쓸모없는 물웅덩이 */
    if (q.length < 2 || (q.length * 칸 * 칸 < 10 && 깊 < 0.3)) continue
    고임.push({ x: G.x0 + (sx / q.length + 0.5) * G.칸, y: G.y0 + (sy / q.length + 0.5) * G.칸, 넓이: q.length * 칸 * 칸, 깊이: 깊, 칸수: q.length })
  }
  고임.sort((a, b) => b.넓이 * b.깊이 - a.넓이 * a.깊이)
  return { 고임, 물길, 모임, 방향, 메운, 문턱 }
}
/** 노선(배수로)으로 모이는 넓이(㎡) — 흐름을 따라가다 노선 칸(가운데선 ± 반폭)에 닿는 칸 */
export function 유역넓이(G, 물, L, 반폭m = 2) {
  const { nx, ny } = G, N = nx * ny, 칸 = G.칸
  const 노선칸 = new Uint8Array(N)
  const a = L.줄
  for (let i = 0; i < a.length; i += 5) {
    const ci = Math.floor((a[i + 1] - G.x0) / 칸), cj = Math.floor((a[i + 2] - G.y0) / 칸)
    const r = Math.max(0, Math.round(반폭m * 1000 / 칸))
    for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      const ii = ci + di, jj = cj + dj
      if (ii >= 0 && jj >= 0 && ii < nx && jj < ny) 노선칸[jj * nx + ii] = 1
    }
  }
  const 닿 = new Int8Array(N)          // 0 모름 · 1 닿음 · −1 안 닿음
  let n = 0
  for (let k0 = 0; k0 < N; k0++) {
    if (!Number.isFinite(G.z[k0]) || 닿[k0]) continue
    const 길 = []
    let k = k0, 끝 = -1
    for (let 걸음 = 0; 걸음 < N; 걸음++) {
      if (노선칸[k]) { 끝 = 1; break }
      if (닿[k]) { 끝 = 닿[k]; break }
      길.push(k)
      const d = 물.방향[k]
      if (d < 0) { 끝 = -1; break }
      const i = k % nx + D8[d][0], j = ((k / nx) | 0) + D8[d][1]
      if (i < 0 || j < 0 || i >= nx || j >= ny) { 끝 = -1; break }
      k = j * nx + i
    }
    for (const x of 길) 닿[x] = 끝
  }
  for (let k = 0; k < N; k++) if (닿[k] === 1 || (노선칸[k] && Number.isFinite(G.z[k]))) n++
  return n * (칸 / 1000) ** 2
}
/**
 * 배수로 구간 여유(참고) — 합리식 Q = C·I·A/360(㎥/s · A ha · I mm/h) ↔ 매닝 통수능 Q = (1/n)·A·R^(2/3)·S^(1/2)
 * @param 단면 { 물넓이(㎡), 젖은둘레(m) } · 경사(m/m) · 유역(㎡)
 */
export function 배수여유({ 물넓이, 젖은둘레 }, 경사, 유역, C = 0.6, I = 80, n = 0.015) {
  const R = 물넓이 / Math.max(1e-9, 젖은둘레)
  const 통수 = 물넓이 > 0 && 경사 > 0 ? (1 / n) * 물넓이 * R ** (2 / 3) * Math.sqrt(경사) : NaN
  const 홍수 = C * I * (유역 / 10000) / 360
  return { 통수, 홍수, 여유: 통수 / Math.max(1e-9, 홍수) }
}

/* ── 6 🎨 기성 ─────────────────────────────── */
export const 공종들 = [
  { k: '터파기', 색: [214, 134, 52] }, { k: '기초', 색: [150, 110, 200] }, { k: '구조물', 색: [120, 120, 120] },
  { k: '되메우기', 색: [110, 170, 90] }, { k: '포장', 색: [60, 60, 60] }, { k: '기타', 색: [230, 200, 60] },
]
/** 기록 [{노선, 시작, 끝, 공종, 날, 메모}] → 공종별 한 길이 · 몫 · 부피(평균단면 줄로) */
export function 기성셈(기록, 활, 날 = null) {
  const 쓸 = (기록 || []).filter((r) => !날 || String(r.날) <= String(날))
  const 결과 = []
  for (const L of 활.노선 || []) {
    const 전체 = L.범위[1] - L.범위[0]
    const t = (활.횡단 || []).find((x) => x.노선 === L.이름)
    const 줄 = t ? 평균단면(t.단면.filter((s) => s.면적).map((s) => ({ 측: s.측, 이름: s.이름, 면적: s.면적 }))).줄 : []
    for (const g of 공종들) {
      const 구간 = 쓸.filter((r) => r.노선 === L.이름 && r.공종 === g.k).map((r) => [Math.min(r.시작, r.끝), Math.max(r.시작, r.끝)]).sort((a, b) => a[0] - b[0])
      if (!구간.length) continue
      const 합침 = []
      for (const [a, b] of 구간) { const p = 합침[합침.length - 1]; if (p && a <= p[1]) p[1] = Math.max(p[1], b); else 합침.push([a, b]) }
      const 한 = 합침.reduce((s, [a, b]) => s + Math.max(0, Math.min(b, L.범위[1]) - Math.max(a, L.범위[0])), 0)
      /* 부피 — 평균단면 줄의 구간(앞 측 ~ 이 측) 가운데 한 곳에 든 몫 */
      const 키 = g.k === '터파기' ? '터파기' : g.k === '되메우기' ? '되메우기' : g.k === '구조물' ? '콘크리트' : null
      let 부피 = NaN, 부피전체 = NaN
      if (키 && 줄.length >= 2) {
        부피 = 0; 부피전체 = 0
        for (let i = 1; i < 줄.length; i++) {
          const a = 줄[i - 1].측, b = 줄[i].측, v = 줄[i].부피[키] || 0
          부피전체 += v
          const 겹 = 합침.reduce((s, [p, q]) => s + Math.max(0, Math.min(b, q) - Math.max(a, p)), 0)
          부피 += v * 겹 / Math.max(1e-9, b - a)
        }
      }
      결과.push({ 노선: L.이름, 공종: g.k, 한, 전체, 몫: 전체 > 0 ? 한 / 전체 : 0, 부피, 부피전체, 구간: 합침, 부피범위: 줄.length >= 2 ? [줄[0].측, 줄[줄.length - 1].측] : null })
    }
  }
  return 결과
}

/* ── 7 📷 사진 위치 ─────────────────────────────── */
/** JPEG 바이트 → { 위도, 경도, 날 } (GPS 가 없으면 위도 NaN) */
export function 사진GPS(바이트들) {
  const 없음 = { 위도: NaN, 경도: NaN, 날: '' }
  try {
    const v = new DataView(바이트들.buffer, 바이트들.byteOffset, 바이트들.byteLength)
    if (v.getUint16(0) !== 0xffd8) return 없음
    let p = 2
    while (p + 4 < v.byteLength) {
      if (v.getUint8(p) !== 0xff) break
      const 표 = v.getUint8(p + 1), 길이 = v.getUint16(p + 2)
      if (표 === 0xe1 && v.getUint32(p + 4) === 0x45786966) {
        const tiff = p + 10
        const 작 = v.getUint16(tiff) === 0x4949
        const u16 = (o) => v.getUint16(o, 작), u32 = (o) => v.getUint32(o, 작)
        const 유리 = (o) => u32(o) / Math.max(1, u32(o + 4))
        const ifd0 = tiff + u32(tiff + 4)
        let gps = 0, exif = 0, 날 = ''
        const 읽글 = (o, n) => { let s = ''; for (let k = 0; k < n && o + k < v.byteLength; k++) { const c = v.getUint8(o + k); if (!c) break; s += String.fromCharCode(c) } return s }
        const 훑 = (ifd) => {
          const n = u16(ifd)
          const m = {}
          for (let i = 0; i < n; i++) { const e = ifd + 2 + i * 12; m[u16(e)] = e }
          return m
        }
        const a = 훑(ifd0)
        if (a[0x8825]) gps = tiff + u32(a[0x8825] + 8)
        if (a[0x8769]) exif = tiff + u32(a[0x8769] + 8)
        if (exif) { const b = 훑(exif); const e = b[0x9003] || b[0x9004]; if (e) 날 = 읽글(tiff + u32(e + 8), 19) }
        if (!날 && a[0x0132]) 날 = 읽글(tiff + u32(a[0x0132] + 8), 19)
        if (!gps) return { ...없음, 날 }
        const g = 훑(gps)
        const 도 = (e) => { const o = tiff + u32(e + 8); return 유리(o) + 유리(o + 8) / 60 + 유리(o + 16) / 3600 }
        if (!g[2] || !g[4]) return { ...없음, 날 }
        let 위도 = 도(g[2]), 경도 = 도(g[4])
        if (g[1] && String.fromCharCode(v.getUint8(g[1] + 8)) === 'S') 위도 = -위도
        if (g[3] && String.fromCharCode(v.getUint8(g[3] + 8)) === 'W') 경도 = -경도
        return { 위도, 경도, 날 }
      }
      p += 2 + 길이
    }
  } catch (e) { /* 깨진 사진 */ }
  return 없음
}
/** 원점들(GRS80 · 2002 이후 측량) — 경도 원점 · 가산(동 · 북) */
export const TM원점 = [
  { 이름: '서부(EPSG 5185)', lon0: 125, FE: 200000, FN: 600000 },
  { 이름: '중부(EPSG 5186)', lon0: 127, FE: 200000, FN: 600000 },
  { 이름: '동부(EPSG 5187)', lon0: 129, FE: 200000, FN: 600000 },
  { 이름: '동해(EPSG 5188)', lon0: 131, FE: 200000, FN: 600000 },
  { 이름: '중부 옛 가산(북 500 km)', lon0: 127, FE: 200000, FN: 500000 },
]
/** 위도 · 경도(GRS80) → TM {X(북), Y(동)} m — 원점 위도 38° · 축척 1 */
export function 경위도TM(위도, 경도, 원 = TM원점[1]) {
  const a = 6378137, f = 1 / 298.257222101, e2 = 2 * f - f * f, ep2 = e2 / (1 - e2), k0 = 1
  const r = Math.PI / 180, φ = 위도 * r, λ = 경도 * r, φ0 = 38 * r, λ0 = 원.lon0 * r
  const M = (p) => a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256) * p - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * p)
    + (15 * e2 * e2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * p) - (35 * e2 ** 3 / 3072) * Math.sin(6 * p))
  const N = a / Math.sqrt(1 - e2 * Math.sin(φ) ** 2), T = Math.tan(φ) ** 2, C = ep2 * Math.cos(φ) ** 2, A = (λ - λ0) * Math.cos(φ)
  const X = 원.FN + k0 * (M(φ) - M(φ0) + N * Math.tan(φ) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A ** 4 / 24 + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6 / 720))
  const Y = 원.FE + k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5 / 120)
  return { X, Y }
}
/** 현장 범위(측량 좌표 m)에 드는 원점 고르기 — 없으면 null */
export function 원점고르기(위도, 경도, 범위) {
  const [X0, Y0, X1, Y1] = 범위
  const 여 = Math.max(2000, 0.5 * Math.max(X1 - X0, Y1 - Y0))
  let best = null
  for (const 원 of TM원점) {
    const p = 경위도TM(위도, 경도, 원)
    const d = Math.max(0, X0 - p.X, p.X - X1) + Math.max(0, Y0 - p.Y, p.Y - Y1)
    if (d <= 여 && (!best || d < best.d)) best = { 원, p, d }
  }
  return best
}

/* ── 8 🦺 안전 그림 ─────────────────────────────── */
/** 산업안전보건기준에 관한 규칙 별표 11 «굴착면의 기울기 기준» (수직 1 : 수평 n) */
export const 굴착기울기 = [
  { 흙: '모래', n: 1.8 }, { 흙: '그 밖의 흙', n: 1.2 }, { 흙: '연암 및 풍화암', n: 1.0 }, { 흙: '경암', n: 0.5 },
]
export const 흙막이깊이 = 1.5     /* 건축법 시행규칙 제26조 — 1.5 m 이상 굴착하면 기울기를 지키거나 흙막이(참고) */
/**
 * 횡단마다 굴착 깊이 → 필요한 기울기로 판 윗폭 · 흙막이 살필 곳
 * @returns [{노선, 측, 이름, 깊이, 바닥폭, 윗폭, 도면윗폭, 모자람, 흙막이}]
 */
export function 굴착검토(활, n = 1.2) {
  const 줄 = []
  for (const t of 활.횡단 || []) for (const s of t.단면) {
    if (!s.깊이 || !s.바닥 || s.바닥.length < 2) continue
    /* 바닥폭 = 바닥 모양에서 가장 낮은 곳 ± 5 cm 안에 든 폭 */
    const 낮 = Math.min(...s.바닥.map((q) => q[1]))
    const 바닥점 = s.바닥.filter((q) => q[1] <= 낮 + 0.05)
    const 바닥폭 = 바닥점.length ? Math.max(...바닥점.map((q) => q[0])) - Math.min(...바닥점.map((q) => q[0])) : 0
    const 윗폭 = 바닥폭 + 2 * s.깊이 * n
    const 도면윗폭 = s.터폭 ? s.터폭[1] - s.터폭[0] : NaN
    줄.push({ 노선: t.노선 || t.파일, 측: s.측, 이름: s.이름, 깊이: s.깊이, 바닥폭, 윗폭, 도면윗폭, 모자람: Number.isFinite(도면윗폭) ? 윗폭 - 도면윗폭 : NaN, 흙막이: s.깊이 >= 흙막이깊이 })
  }
  return 줄.sort((a, b) => b.깊이 - a.깊이)
}
/** 원(작업 반경) 선 — 가운데(mm) · 반지름(m) → [x1,y1,z,x2,y2,z…] */
export function 원선(cx, cy, z, 반지름m, 조각 = 96) {
  const out = []
  const r = 반지름m * 1000
  for (let i = 0; i < 조각; i++) {
    const a = (i / 조각) * Math.PI * 2, b = ((i + 1) / 조각) * Math.PI * 2
    out.push(cx + r * Math.cos(a), cy + r * Math.sin(a), z, cx + r * Math.cos(b), cy + r * Math.sin(b), z)
  }
  return out
}
