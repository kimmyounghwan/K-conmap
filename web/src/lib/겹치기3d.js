/**
 * 🧲 도면 3D — 기준(측량) 도면에 «모양» 으로 겹치기 (G209 · 2026-10-09)
 *
 * ■ 왜: 같은 글자(지번 · 측점 · 기준점)는 평면도끼리만 맞출 수 있습니다. 건축 평면도 · 펌프장 같은 구조물 일반도 ·
 *   파일배치도는 그런 글자가 없어서, 전에는 기준 도면 «오른쪽에 나란히» 놓였습니다(실제 자리와 무관).
 *   그런데 측량도면 · 계획평면도에는 그 건물 · 구조물이 «같은 모양» 으로 그려져 있는 경우가 많습니다.
 *   → 그 모양을 찾아 그 자리 · 그 방향으로 겹칩니다(돌림 + 옮김 · 축척은 안 바꿈).
 *
 * ■ 어떻게 (빠르고 엉뚱한 자리에 덜 붙게)
 *   ① 투표: 옮길 도면의 긴 선마다, 기준 도면에서 «길이가 같은 선» 을 찾아 (돌림 · 옮김) 한 표씩.
 *      같은 길이 선이 많을수록 한 표의 무게를 줄입니다(흔한 길이 3 m · 5 m 에 끌리지 않게).
 *   ② 많이 받은 자리 몇 곳을 «선 위에 얼마나 겹치나» 로 확인 — 옮길 도면의 선 위 점들이 기준 선에서 몇 cm 안에 드는 몫.
 *   ③ 가장 잘 겹친 자리를 가까운 선에 맞춰 조금씩 다듬음(ICP 3번).
 * ■ 받는 조건: 겹친 몫(맞음비)이 문턱(건물 · 구조 35% · 평면 45%)을 넘고, 두 번째로 잘 맞은 다른 자리보다 뚜렷이 나을 때.
 *   못 넘으면 자리를 짐작하지 않고 «옆» 그대로 둡니다(📍 두 점 찍기 안내).
 */

/* 콘크리트 = 일꾼이 만든 면 층(G212 — 겹치기 전에 만들므로 틀에서 뺌) */
const 빼는층 = /^[_#!★\-\s]*(text|글|문자|dim|치수|hatch|해치|defpoints|도곽|sheet|border|form|title|table|테이블|tick|sym|지시|lead|cen|중심|center|콘크리트$)/i

/** 묶음(out)에서 «바닥에 누운» 선만 [x1,y1,x2,y2] 로. 골라(키, 층) → 참/거짓 · z 가 고른 높이(±창) 안인 것만 */
export function 누운선(out, { 골라 = null, z = null, 창 = 300, 최소 = 30 } = {}) {
  const s = []
  for (const [name, b] of out) {
    const c = name.indexOf('\u0001')
    const 키 = c >= 0 ? name.slice(0, c) : '', ly = c >= 0 ? name.slice(c + 1) : name
    if (빼는층.test(ly)) continue
    if (골라 && !골라(키, ly)) continue
    const a = b.pos.a
    for (let i = 0; i < b.pos.n; i += 6) {
      const z1 = a[i + 2], z2 = a[i + 5]
      if (Math.abs(z1 - z2) > 50) continue
      if (z != null && Math.abs(z1 - z) > 창) continue
      const L = Math.hypot(a[i + 3] - a[i], a[i + 4] - a[i + 1])
      if (L < 최소) continue
      s.push(a[i], a[i + 1], a[i + 3], a[i + 4])
    }
  }
  return s
}

/** 가장 많이 나오는 «누운 선 높이» (구조물 평면 · 건물 1층 바닥 고르기) */
export function 바닥높이(out, 골라 = null) {
  const m = new Map()
  for (const [name, b] of out) {
    const c = name.indexOf('\u0001')
    if (골라 && !골라(c >= 0 ? name.slice(0, c) : '', name.slice(c + 1))) continue
    const a = b.pos.a
    for (let i = 0; i < b.pos.n; i += 6) {
      if (Math.abs(a[i + 2] - a[i + 5]) > 50) continue
      const k = Math.round(a[i + 2] / 100)
      m.set(k, (m.get(k) || 0) + 1)
    }
  }
  let best = null, bn = -1
  for (const [k, n] of m) if (n > bn) { bn = n; best = k }
  return best == null ? null : best * 100
}

/** 기준 도면 선 → 찾기 쉬운 꼴(긴 선은 길이 차례 · 모든 선은 1 m 칸) */
export function 바탕만들기(s, 칸 = 1000) {
  const n = s.length / 4
  /* 긴 선(≥ 0.8 m) — 길이 차례 */
  const 긴 = []
  for (let i = 0; i < n; i++) {
    const L = Math.hypot(s[i * 4 + 2] - s[i * 4], s[i * 4 + 3] - s[i * 4 + 1])
    if (L >= 800) 긴.push(i)
  }
  const 길이 = new Float64Array(긴.length)
  긴.sort((p, q) => Math.hypot(s[p * 4 + 2] - s[p * 4], s[p * 4 + 3] - s[p * 4 + 1]) - Math.hypot(s[q * 4 + 2] - s[q * 4], s[q * 4 + 3] - s[q * 4 + 1]))
  for (let k = 0; k < 긴.length; k++) { const i = 긴[k]; 길이[k] = Math.hypot(s[i * 4 + 2] - s[i * 4], s[i * 4 + 3] - s[i * 4 + 1]) }
  /* 칸 — (열쇠, 선번호) 를 열쇠 차례로 */
  const 열 = [], 번 = []
  for (let i = 0; i < n; i++) {
    const x1 = s[i * 4], y1 = s[i * 4 + 1], x2 = s[i * 4 + 2], y2 = s[i * 4 + 3]
    const L = Math.hypot(x2 - x1, y2 - y1)
    const 걸음 = Math.max(1, Math.ceil(L / (칸 / 2)))
    let 앞 = null
    for (let k = 0; k <= 걸음; k++) {
      const x = x1 + (x2 - x1) * k / 걸음, y = y1 + (y2 - y1) * k / 걸음
      const key = Math.floor(x / 칸) * 4194304 + Math.floor(y / 칸)
      if (key === 앞) continue
      앞 = key; 열.push(key); 번.push(i)
    }
  }
  const 차 = new Int32Array(열.length)
  for (let i = 0; i < 차.length; i++) 차[i] = i
  차.sort((p, q) => 열[p] - 열[q])
  const 칸열 = new Float64Array(차.length), 칸선 = new Int32Array(차.length)
  for (let i = 0; i < 차.length; i++) { 칸열[i] = 열[차[i]]; 칸선[i] = 번[차[i]] }
  return { s, 긴: Int32Array.from(긴), 길이, 칸, 칸열, 칸선 }
}

function 첫자리(arr, v) { let lo = 0, hi = arr.length; while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] < v) lo = m + 1; else hi = m } return lo }

/** 점 (x,y) 에서 기준 선까지 가장 가까운 거리(한도 안) · 그 선 위 가장 가까운 점 */
function 가까운(B, x, y, 한도) {
  const { s, 칸, 칸열, 칸선 } = B
  const cx = Math.floor(x / 칸), cy = Math.floor(y / 칸)
  const r = Math.max(1, Math.ceil(한도 / 칸))
  let best = 한도, bx = 0, by = 0, 찾음 = false
  for (let dx = -r; dx <= r; dx++) {
    const k0 = (cx + dx) * 4194304 + (cy - r), k1 = (cx + dx) * 4194304 + (cy + r)
    for (let j = 첫자리(칸열, k0); j < 칸열.length && 칸열[j] <= k1; j++) {
      const i = 칸선[j]
      const x1 = s[i * 4], y1 = s[i * 4 + 1], x2 = s[i * 4 + 2], y2 = s[i * 4 + 3]
      const ux = x2 - x1, uy = y2 - y1, LL = ux * ux + uy * uy
      let t = LL > 0 ? ((x - x1) * ux + (y - y1) * uy) / LL : 0
      t = t < 0 ? 0 : t > 1 ? 1 : t
      const px = x1 + ux * t, py = y1 + uy * t
      const d = Math.hypot(x - px, y - py)
      if (d < best) { best = d; bx = px; by = py; 찾음 = true }
    }
  }
  return 찾음 ? { d: best, x: bx, y: by } : null
}

/** 옮길 도면 선 위 점들 — 많아야 n 개, 고르게 */
function 점뽑기(s, n = 2500) {
  let 합 = 0
  for (let i = 0; i < s.length; i += 4) 합 += Math.hypot(s[i + 2] - s[i], s[i + 3] - s[i + 1])
  const 간격 = Math.max(100, 합 / n)
  const P = []
  let 남 = 0
  for (let i = 0; i < s.length; i += 4) {
    const x1 = s[i], y1 = s[i + 1], x2 = s[i + 2], y2 = s[i + 3]
    const L = Math.hypot(x2 - x1, y2 - y1)
    let t = 남
    while (t <= L) { P.push(x1 + (x2 - x1) * t / L, y1 + (y2 - y1) * t / L); t += 간격 }
    남 = t - L
  }
  return P
}

const 돌려 = (T, x, y) => [T.a * x - T.b * y + T.tx, T.b * x + T.a * y + T.ty]

/** 겹친 몫 — 점들 중 한도 안에 기준 선이 있는 몫 */
function 겹침몫(B, P, T, 한도) {
  let n = 0
  for (let i = 0; i < P.length; i += 2) { const [x, y] = 돌려(T, P[i], P[i + 1]); if (가까운(B, x, y, 한도)) n++ }
  return n / Math.max(1, P.length / 2)
}

/** 가까운 선에 맞춰 다듬기(돌림 + 옮김, 최소제곱) */
function 다듬기(B, P, T, 한도) {
  const A = [], Q = []
  for (let i = 0; i < P.length; i += 2) {
    const [x, y] = 돌려(T, P[i], P[i + 1])
    const c = 가까운(B, x, y, 한도)
    if (c) { A.push(P[i], P[i + 1]); Q.push(c.x, c.y) }
  }
  const n = A.length / 2
  if (n < 20) return T
  let ax = 0, ay = 0, qx = 0, qy = 0
  for (let i = 0; i < A.length; i += 2) { ax += A[i]; ay += A[i + 1]; qx += Q[i]; qy += Q[i + 1] }
  ax /= n; ay /= n; qx /= n; qy /= n
  let sxx = 0, sxy = 0
  for (let i = 0; i < A.length; i += 2) {
    const px = A[i] - ax, py = A[i + 1] - ay, rx = Q[i] - qx, ry = Q[i + 1] - qy
    sxx += px * rx + py * ry; sxy += px * ry - py * rx
  }
  const th = Math.atan2(sxy, sxx)
  const a = Math.cos(th), b = Math.sin(th)
  return { a, b, tx: qx - (a * ax - b * ay), ty: qy - (b * ax + a * ay) }
}

/* ── 칸 그림 · 거리 지도(2-pass chamfer 3-4) ─────────────────────────── */
function 거리지도(s, 고른, x0, y0, 칸, W, H, 상한) {
  const d = new Float32Array(W * H).fill(상한)
  const 찍 = (i) => {
    const ax = (s[i * 4] - x0) / 칸, ay = (s[i * 4 + 1] - y0) / 칸, bx = (s[i * 4 + 2] - x0) / 칸, by = (s[i * 4 + 3] - y0) / 칸
    const st = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) * 1.5))
    for (let k = 0; k <= st; k++) {
      const x = Math.floor(ax + (bx - ax) * k / st), y = Math.floor(ay + (by - ay) * k / st)
      if (x >= 0 && y >= 0 && x < W && y < H) d[y * W + x] = 0
    }
  }
  if (고른) for (const i of 고른) 찍(i)
  else for (let i = 0; i < s.length / 4; i++) 찍(i)
  const a = 칸, b = 칸 * 1.4142
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const o = y * W + x; let v = d[o]
    if (x > 0 && d[o - 1] + a < v) v = d[o - 1] + a
    if (y > 0) {
      if (d[o - W] + a < v) v = d[o - W] + a
      if (x > 0 && d[o - W - 1] + b < v) v = d[o - W - 1] + b
      if (x < W - 1 && d[o - W + 1] + b < v) v = d[o - W + 1] + b
    }
    d[o] = v
  }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
    const o = y * W + x; let v = d[o]
    if (x < W - 1 && d[o + 1] + a < v) v = d[o + 1] + a
    if (y < H - 1) {
      if (d[o + W] + a < v) v = d[o + W] + a
      if (x < W - 1 && d[o + W + 1] + b < v) v = d[o + W + 1] + b
      if (x > 0 && d[o + W - 1] + b < v) v = d[o + W - 1] + b
    }
    d[o] = v
  }
  return d
}

/** 창 안 기준 선 번호들(1 m 칸 찾기) */
function 창선(B, x0, y0, x1, y1) {
  const { 칸, 칸열, 칸선 } = B
  const 본 = new Set()
  const cx0 = Math.floor(x0 / 칸), cx1 = Math.floor(x1 / 칸), cy0 = Math.floor(y0 / 칸), cy1 = Math.floor(y1 / 칸)
  for (let cx = cx0; cx <= cx1; cx++) {
    const k0 = cx * 4194304 + cy0, k1 = cx * 4194304 + cy1
    for (let j = 첫자리(칸열, k0); j < 칸열.length && 칸열[j] <= k1; j++) 본.add(칸선[j])
  }
  return 본
}

/** 방향 짜임(0~179°, 1° 칸, 길이 무게) — 가장 센 방향들 */
function 방향들(s, 고른, 몇 = 3) {
  const h = new Float64Array(180)
  const 더 = (i) => {
    const dx = s[i * 4 + 2] - s[i * 4], dy = s[i * 4 + 3] - s[i * 4 + 1], L = Math.hypot(dx, dy)
    if (L < 500) return
    let d = Math.atan2(dy, dx) * 180 / Math.PI; d = ((d % 180) + 180) % 180
    h[Math.floor(d) % 180] += L
  }
  if (고른) for (const i of 고른) 더(i); else for (let i = 0; i < s.length / 4; i++) 더(i)
  const g = new Float64Array(180)
  for (let i = 0; i < 180; i++) for (let k = -2; k <= 2; k++) g[i] += h[(i + k + 180) % 180] * (3 - Math.abs(k))
  let mx = 0; for (const v of g) mx = Math.max(mx, v)
  const 봉 = []
  for (let i = 0; i < 180; i++) {
    if (g[i] < 0.15 * mx) continue
    if (g[i] < g[(i + 179) % 180] || g[i] < g[(i + 1) % 180]) continue
    봉.push([g[i], i + 0.5])
  }
  봉.sort((p, q) => q[0] - p[0])
  const 고름 = []
  for (const [, d] of 봉) { if (고름.every((e) => Math.min(Math.abs(e - d), 180 - Math.abs(e - d)) >= 8)) 고름.push(d); if (고름.length >= 몇) break }
  return 고름
}

/** 기준 도면 전체 — 2 m 칸 거리 지도 · 100 m 판마다 센 방향 (처음 한 번만) */
function 넓게준비(B) {
  if (B.넓) return B.넓
  const s = B.s
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (let i = 0; i < s.length; i += 2) { x0 = Math.min(x0, s[i]); x1 = Math.max(x1, s[i]); y0 = Math.min(y0, s[i + 1]); y1 = Math.max(y1, s[i + 1]) }
  let 칸 = 2000
  while (((x1 - x0) / 칸) * ((y1 - y0) / 칸) > 4e6) 칸 *= 2
  x0 -= 20 * 칸; y0 -= 20 * 칸; x1 += 20 * 칸; y1 += 20 * 칸
  const W = Math.ceil((x1 - x0) / 칸), H = Math.ceil((y1 - y0) / 칸)
  const d = 거리지도(s, null, x0, y0, 칸, W, H, 1e9)
  /* 판(100 m) 마다 방향 */
  const 판칸 = 100000, 판 = new Map()
  for (let i = 0; i < s.length / 4; i++) {
    const L = Math.hypot(s[i * 4 + 2] - s[i * 4], s[i * 4 + 3] - s[i * 4 + 1])
    if (L < 1000) continue
    const k = Math.floor((s[i * 4] + s[i * 4 + 2]) / 2 / 판칸) * 4194304 + Math.floor((s[i * 4 + 1] + s[i * 4 + 3]) / 2 / 판칸)
    let a = 판.get(k); if (!a) { a = { 선: [], 길: 0 }; 판.set(k, a) } a.선.push(i); a.길 += L
  }
  const 판들 = []
  for (const [k, v] of 판) {
    if (v.길 < 150000) continue
    const kx = Math.floor(k / 4194304), ky = k - kx * 4194304
    판들.push({ x0: kx * 판칸, y0: ky * 판칸, 방: 방향들(s, v.선, 3) })
  }
  B.넓 = { x0, y0, 칸, W, H, d, 판들, 판칸 }
  return B.넓
}

/** 넓게 찾기 — 판마다 센 방향에 틀의 센 방향을 맞춰(90° 네 가지) 2 m 걸음으로 «선까지 거리 합» 이 작은 자리 */
function 넓게찾기(B, P, 틀방향, 몇 = 80, 영역 = null, 마감 = Infinity) {
  const N = 넓게준비(B)
  const n = P.length / 2
  const 상한 = 4000
  const 위 = []           // [점수, θ, cx, cy]
  let 문 = Infinity
  const 넣기 = (sc, th, x, y) => {
    for (const c of 위) if (Math.abs(c[2] - x) < 6000 && Math.abs(c[3] - y) < 6000 && Math.abs(Math.atan2(Math.sin(c[1] - th), Math.cos(c[1] - th))) < 0.06) { if (sc < c[0]) { c[0] = sc; c[1] = th; c[2] = x; c[3] = y } return }
    위.push([sc, th, x, y])
    if (위.length > 몇) { 위.sort((p, q) => p[0] - q[0]); 위.length = 몇; 문 = 위[위.length - 1][0] }
  }
  const Q = new Float64Array(P.length)
  const 걸음 = Math.max(2000, N.칸)
  for (const 판 of N.판들) {
    if (Date.now() > 마감) break
    if (영역 && !영역.some((r) => 판.x0 < r[2] && 판.x0 + N.판칸 > r[0] && 판.y0 < r[3] && 판.y0 + N.판칸 > r[1])) continue
    const θs = []
    for (const db of 판.방) for (const dt of 틀방향) for (let k = 0; k < 4; k++) {
      const th = ((db - dt + k * 90) * Math.PI) / 180
      if (θs.every((e) => Math.abs(Math.atan2(Math.sin(e - th), Math.cos(e - th))) > 0.02)) θs.push(th)
    }
    for (const th of θs) {
      const a = Math.cos(th), b = Math.sin(th)
      for (let i = 0; i < n; i++) { Q[i * 2] = a * P[i * 2] - b * P[i * 2 + 1]; Q[i * 2 + 1] = b * P[i * 2] + a * P[i * 2 + 1] }
      for (let cx = 판.x0 - 20000; cx <= 판.x0 + N.판칸 + 20000; cx += 걸음) {
        for (let cy = 판.y0 - 20000; cy <= 판.y0 + N.판칸 + 20000; cy += 걸음) {
          if (영역 && !영역.some((r) => cx >= r[0] && cx <= r[2] && cy >= r[1] && cy <= r[3])) continue
          let 합 = 0, 끊 = false
          const 한 = 문 * n
          for (let i = 0; i < n; i++) {
            const gx = Math.floor((Q[i * 2] + cx - N.x0) / N.칸), gy = Math.floor((Q[i * 2 + 1] + cy - N.y0) / N.칸)
            const v = gx >= 0 && gy >= 0 && gx < N.W && gy < N.H ? N.d[gy * N.W + gx] : 상한
            합 += v < 상한 ? v : 상한
            if (합 > 한) { 끊 = true; break }
          }
          if (!끊) 넣기(합 / n, th, cx, cy)
        }
      }
    }
  }
  위.sort((p, q) => p[0] - q[0])
  return 위
}

/** 가까이 다듬기 — 후보 둘레만 25 cm 칸 거리 지도로 그리고, 돌림 ±1.5° · 옮김 ±3 m 를 찾음 */
function 가까이찾기(B, P, th0, cx0, cy0, 반경) {
  /* 🩹 G212 — 틀이 넓으면(수백 m) 25 cm 칸 지도가 수천만 칸이 되어 한 번에 몇 초씩 걸렸습니다(현장 D 화장실 도면 108초) → 칸을 넓혀 1600 칸 안으로 */
  const 여 = 반경 + 6000, 칸 = Math.max(250, (2 * 여) / 1600)
  const x0 = cx0 - 여, y0 = cy0 - 여, W = Math.ceil(2 * 여 / 칸), H = W
  const 고른 = 창선(B, x0, y0, x0 + 2 * 여, y0 + 2 * 여)
  if (!고른.size) return null
  const d = 거리지도(B.s, 고른, x0, y0, 칸, W, H, 1e9)
  const n = P.length / 2
  const 몫 = (th, cx, cy, 한) => {
    const a = Math.cos(th), b = Math.sin(th)
    let m = 0
    for (let i = 0; i < n; i++) {
      const x = a * P[i * 2] - b * P[i * 2 + 1] + cx, y = b * P[i * 2] + a * P[i * 2 + 1] + cy
      const gx = Math.floor((x - x0) / 칸), gy = Math.floor((y - y0) / 칸)
      if (gx >= 0 && gy >= 0 && gx < W && gy < H && d[gy * W + gx] <= 한) m++
    }
    return m / n
  }
  let best = [몫(th0, cx0, cy0, 400), th0, cx0, cy0]
  for (const [dθ, dθ걸음, dx, dx걸음] of [[0.026, 0.0087, 3000, 500], [0.009, 0.0022, 600, 125]]) {
    const [, tb, xb, yb] = best
    for (let th = tb - dθ; th <= tb + dθ + 1e-9; th += dθ걸음) for (let cx = xb - dx; cx <= xb + dx; cx += dx걸음) for (let cy = yb - dx; cy <= yb + dx; cy += dx걸음) {
      const m = 몫(th, cx, cy, dx걸음 > 200 ? 400 : 250)
      if (m > best[0]) best = [m, th, cx, cy]
    }
  }
  return best
}

/** 거꾸로 몫 — 옮긴 틀 둘레(선에서 2 m 안)에 있는 기준 선 점 중, 틀 선 15 cm 안에 드는 몫.
 *  선이 빽빽한 곳(건물 안 · 해치)에 엉뚱하게 얹으면 «틀 → 기준» 은 높게 나와도 이 값이 낮습니다. */
function 거꾸로몫(B, 틀B, T, 가운데, 반경, 한도 = 150) {
  const [cx, cy] = 가운데
  const 고른 = 창선(B, cx - 반경, cy - 반경, cx + 반경, cy + 반경)
  const s = B.s
  /* T 거꾸로 */
  const a = T.a, b = T.b, 거 = (x, y) => { const dx = x - T.tx, dy = y - T.ty; return [a * dx + b * dy, -b * dx + a * dy] }
  let 합 = 0
  for (const i of 고른) 합 += Math.hypot(s[i * 4 + 2] - s[i * 4], s[i * 4 + 3] - s[i * 4 + 1])
  const 간격 = Math.max(150, 합 / 5000)
  let 셈 = 0, 맞 = 0
  for (const i of 고른) {
    const x1 = s[i * 4], y1 = s[i * 4 + 1], x2 = s[i * 4 + 2], y2 = s[i * 4 + 3]
    const L = Math.hypot(x2 - x1, y2 - y1), k = Math.max(1, Math.floor(L / 간격))
    for (let j = 0; j <= k; j++) {
      const [x, y] = 거(x1 + (x2 - x1) * j / k, y1 + (y2 - y1) * j / k)
      const c = 가까운(틀B, x, y, 2000)
      if (!c) continue
      셈++
      if (c.d <= 한도) 맞++
    }
  }
  return 셈 >= 50 ? 맞 / 셈 : 0
}

/**
 * 옮길 선(틀) 을 기준(B) 에 겹치기.
 *   ㉠ 같은 길이 선 투표(기준 도면에 그대로 붙여 넣은 그림이면 금방 · 정확)
 *   ㉡ 넓게 찾기(판마다 센 방향 × 2 m 걸음 거리 합) → 가까이 다듬기 — 선이 다르게 끊겼거나 판이 조금 다른 그림도
 *   ㉢ 가장 잘 맞은 자리를 가까운 선에 맞춰 다듬고(ICP) «15 cm 안에 든 몫» 으로 판정
 * @returns {null | { T, 맞음비, 회전, 둘째, 됨, 까닭?, 방법 }}
 */
export function 모양맞추기(틀, B, { 문턱 = 0.5, 근처 = null, 근처문턱 = 0.5, 영역 = null, 마감 = Infinity, 둘째틈 = 0.08 } = {}) {
  const n = 틀.length / 4
  if (n < 8 || !B.긴.length) return null
  const 디 = globalThis.__겹치기디버그 ? console.log : () => {}
  const P = 점뽑기(틀, 1200)
  let mx = 0, my = 0
  for (let i = 0; i < P.length; i += 2) { mx += P[i]; my += P[i + 1] }
  mx /= P.length / 2; my /= P.length / 2
  let 반경 = 0
  for (let i = 0; i < P.length; i += 2) 반경 = Math.max(반경, Math.hypot(P[i] - mx, P[i + 1] - my))
  const P0 = new Float64Array(P.length)
  for (let i = 0; i < P.length; i += 2) { P0[i] = P[i] - mx; P0[i + 1] = P[i + 1] - my }
  const T로 = (th, cx, cy) => { const a = Math.cos(th), b = Math.sin(th); return { a, b, tx: cx - (a * mx - b * my), ty: cy - (b * mx + a * my) } }
  const 가운데 = (T) => 돌려(T, mx, my)
  const 후보 = []        // { T, 몫, 방법 }
  const 시 = Date.now(), 때 = (m) => 디('   ⏱', m, Date.now() - 시, 'ms')

  /* ㉠ 같은 길이 선 투표 */
  {
    const 후 = []
    for (let i = 0; i < n; i++) {
      const L = Math.hypot(틀[i * 4 + 2] - 틀[i * 4], 틀[i * 4 + 3] - 틀[i * 4 + 1])
      if (L >= 800) 후.push([L, i])
    }
    후.sort((p, q) => q[0] - p[0])
    const 쓴길이 = [], 고른 = []
    for (const [L, i] of 후) {
      if (쓴길이.some((v) => Math.abs(v - L) < Math.max(3, L * 0.001))) continue
      쓴길이.push(L); 고른.push(i)
      if (고른.length >= 120) break
    }
    const 표 = new Map()
    const 각칸 = Math.PI / 360, 거칸 = 500
    for (const i of 고른) {
      const x1 = 틀[i * 4], y1 = 틀[i * 4 + 1], x2 = 틀[i * 4 + 2], y2 = 틀[i * 4 + 3]
      const L = Math.hypot(x2 - x1, y2 - y1), at = Math.atan2(y2 - y1, x2 - x1)
      const qx = (x1 + x2) / 2, qy = (y1 + y2) / 2
      const 틈 = Math.max(3, L * 0.002)
      const j0 = 첫자리(B.길이, L - 틈), j1 = 첫자리(B.길이, L + 틈)
      const 수 = j1 - j0
      if (!수 || 수 > 3000) continue
      const w = Math.min(L, 20000) / 1000 / Math.sqrt(수)
      for (let j = j0; j < j1; j++) {
        const k = B.긴[j], s = B.s
        const bx1 = s[k * 4], by1 = s[k * 4 + 1], bx2 = s[k * 4 + 2], by2 = s[k * 4 + 3]
        const ab = Math.atan2(by2 - by1, bx2 - bx1)
        const bmx = (bx1 + bx2) / 2, bmy = (by1 + by2) / 2
        for (const 뒤 of [0, Math.PI]) {
          let th = ab - at + 뒤
          th = Math.atan2(Math.sin(th), Math.cos(th))
          const a = Math.cos(th), b = Math.sin(th)
          const tx = bmx - (a * qx - b * qy), ty = bmy - (b * qx + a * qy)
          const key = `${Math.round(th / 각칸)}|${Math.round(tx / 거칸)}|${Math.round(ty / 거칸)}`
          let v = 표.get(key)
          if (!v) { v = { w: 0, n: 0, th: 0, tx: 0, ty: 0 }; 표.set(key, v) }
          v.w += w; v.n++; v.th += th * w; v.tx += tx * w; v.ty += ty * w
        }
      }
    }
    const 위 = [...표.values()].filter((v) => v.n >= 3).sort((p, q) => q.w - p.w).slice(0, 30)
    for (const v of 위) {
      const th = v.th / v.w
      const T = { a: Math.cos(th), b: Math.sin(th), tx: v.tx / v.w, ty: v.ty / v.w }
      후보.push({ T, 몫: 겹침몫(B, P, T, 250), 방법: '같은 선' })
    }
  }

  때('㉠')
  const P2 = 점뽑기(틀, 1500)
  const 틀B = 바탕만들기(틀, 500)
  const 다듬어보기 = (c) => {
    let T = c.T
    for (const h of [400, 200, 100]) T = 다듬기(B, P2, T, h)
    const 앞 = 겹침몫(B, P2, T, 150), 뒤 = 거꾸로몫(B, 틀B, T, 가운데(T), 반경)
    return { T, 앞, 뒤, 몫: Math.sqrt(앞 * 뒤), 방법: c.방법 }
  }
  /* 기준 도면에 그대로 붙여 넣은 그림이면(같은 선 투표 1등이 아주 잘 맞으면) 넓게 찾기는 건너뜀 */
  let 빠른 = null
  if (후보.length) {
    후보.sort((p, q) => q.몫 - p.몫)
    const r = 다듬어보기(후보[0])
    if (r.몫 >= 0.8) 빠른 = r
  }
  /* ㉡ 넓게 찾기 → 가까이 다듬기 */
  {
    const 틀선번 = null
    void 틀선번
    const 틀방향 = 빠른 ? [] : 방향들(틀, null, 2)
    if (틀방향.length) {
      const 성긴 = 점뽑기(틀, 160)
      const C = new Float64Array(성긴.length)
      for (let i = 0; i < 성긴.length; i += 2) { C[i] = 성긴[i] - mx; C[i + 1] = 성긴[i + 1] - my }
      const 넓 = 넓게찾기(B, C, 틀방향, 영역 ? 20 : 36, 영역, 마감)
      때('넓게 ' + 넓.length)
      const 가 = 점뽑기(틀, 400)
      const G = new Float64Array(가.length)
      for (let i = 0; i < 가.length; i += 2) { G[i] = 가[i] - mx; G[i + 1] = 가[i + 1] - my }
      const 다듬은 = []
      for (const [, th, cx, cy] of 넓) {
        if (Date.now() > 마감) break
        const r = 가까이찾기(B, G, th, cx, cy, 반경)
        if (r) 다듬은.push(r)
      }
      다듬은.sort((p, q) => q[0] - p[0])
      for (const r of 다듬은.slice(0, 12)) { const T = T로(r[1], r[2], r[3]); 후보.push({ T, 몫: 겹침몫(B, P, T, 250), 방법: '모양' }) }
    }
  }
  때('㉡')
  /* 넓게 찾기를 끝까지 못 했으면(시간) 판정하지 않습니다 — 덜 찾은 채로 1등을 고르면 «비슷한 다른 자리» 를 못 보고 엉뚱한 곳에 붙을 수 있음 */
  if (!빠른 && Date.now() > 마감) return { 됨: false, 까닭: '시간이 오래 걸려 모양 찾기를 그만둠', 몫: 0, 맞음비: 0, 거꾸로: 0, 회전: 0, 둘째: 0, T: null }
  if (!후보.length) return null
  후보.sort((p, q) => q.몫 - p.몫)
  for (const c of 후보.slice(0, 8)) { const [x, y] = 가운데(c.T); 디('  후보', c.방법, c.몫.toFixed(3), '돌림', (Math.atan2(c.T.b, c.T.a) * 180 / Math.PI).toFixed(2), '가운데', Math.round(x), Math.round(y)) }

  /* ㉢ 위 몇 개를 다듬어 판정 */
  const 다 = 빠른 ? [빠른] : []
  if (빠른) {
    /* 붙여 넣은 그림이 다른 자리에도 있으면(같은 선 투표에서 다른 자리도 잘 맞으면) 그것도 다듬어 견줌 */
    const [bx, by] = 가운데(빠른.T)
    let n = 0
    for (const c of 후보) { if (n >= 3) break; const [x, y] = 가운데(c.T); if (Math.hypot(x - bx, y - by) > 10000 && c.몫 >= 0.6) { 다.push(다듬어보기(c)); n++ } }
  } else for (const c of 후보.slice(0, 8)) 다.push(다듬어보기(c))
  다.sort((p, q) => q.몫 - p.몫)
  때('㉢')
  for (const c of 다.slice(0, 6)) { const [x, y] = 가운데(c.T); 디('  다듬음', c.방법, '앞', c.앞.toFixed(3), '뒤', c.뒤.toFixed(3), '몫', c.몫.toFixed(3), '돌림', (Math.atan2(c.T.b, c.T.a) * 180 / Math.PI).toFixed(2), '가운데', Math.round(x), Math.round(y)) }
  const 첫 = 다[0]
  const [fx, fy] = 가운데(첫.T)
  /* 둘째 — 다른 자리(가운데가 10 m 넘게 떨어진 것) 중 가장 잘 맞은 것. 같은 자리에서 뒤집힌 것은 셈하지 않음 */
  /* 근처(이미 놓인 구조물 · 건물 둘레)가 주어지고 1등이 그 안이면, 견줄 둘째도 그 안의 자리만 — 기계 평면도처럼 구조물에 딸린 그림 */
  const 안 = (x, y) => !근처 || 근처.some((r) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3])
  const 첫안 = 근처 && 안(fx, fy)
  let 둘째 = 0
  for (const c of 다.slice(1)) { const [x, y] = 가운데(c.T); if (Math.hypot(x - fx, y - fy) > 10000 && (!첫안 || 안(x, y))) 둘째 = Math.max(둘째, c.몫) }
  const 회전 = Math.atan2(첫.T.b, 첫.T.a) * 180 / Math.PI
  const 바탕 = { T: 첫.T, 맞음비: 첫.앞, 거꾸로: 첫.뒤, 몫: 첫.몫, 회전, 둘째, 방법: 첫.방법, 근처: !!첫안 }
  if (첫.몫 < (첫안 ? 근처문턱 : 문턱)) return { ...바탕, 됨: false, 까닭: `기준 도면에서 같은 모양을 못 찾음(가장 잘 겹친 곳 ${Math.round(첫.몫 * 100)}%)` }
  if (둘째 >= 첫.몫 - 둘째틈) return { ...바탕, 됨: false, 까닭: `비슷한 모양이 두 곳 넘게 있어 자리를 정하지 못함(${Math.round(첫.몫 * 100)}% · ${Math.round(둘째 * 100)}%)` }
  /* 같은 자리에서 반 바퀴 돌린 것(앞뒤가 같은 꼴)이 거의 똑같이 맞으면 방향을 모름 */
  for (const c of 다.slice(1)) {
    const [x, y] = 가운데(c.T)
    const d = Math.abs(Math.atan2(Math.sin(Math.atan2(c.T.b, c.T.a) - Math.atan2(첫.T.b, 첫.T.a)), Math.cos(Math.atan2(c.T.b, c.T.a) - Math.atan2(첫.T.b, 첫.T.a))))
    if (Math.hypot(x - fx, y - fy) <= 10000 && d > 2.8 && c.몫 >= 첫.몫 - 0.04) return { ...바탕, 됨: false, 까닭: `앞뒤가 같은 꼴이라 방향을 정하지 못함(${Math.round(첫.몫 * 100)}% · 반 바퀴 ${Math.round(c.몫 * 100)}%)` }
  }
  return { ...바탕, 됨: true }
}

/**
 * 🧱 구조물 콘크리트 — 평면 선으로 바닥(발자국)을 채워, 바닥판(아래 EL) · 바깥 벽(아래 → 위 EL) 면을 만듭니다.
 *   평면 선을 20 cm 칸에 그리고 30 cm 두껍게 한 뒤 바깥에서 물을 부어 «닿지 않은 칸» = 구조물 안.
 *   1 m 보다 가는 띠(관 · 선 하나)는 깎아 냄. 칸 줄마다 이어진 칸을 네모 하나로(세모 둘).
 * @returns {null | { tri:number[], 선:number[], 넓이:number }} 세모 꼭짓점(x,y,z …) · 테두리 선(x1,y1,z1,x2,y2,z2 …) · 바닥 넓이(㎡)
 */
export function 콘크리트면(s, 아래, 위, 칸 = 200) {
  if (s.length < 16 || !(위 > 아래)) return null
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (let i = 0; i < s.length; i += 2) { x0 = Math.min(x0, s[i]); x1 = Math.max(x1, s[i]); y0 = Math.min(y0, s[i + 1]); y1 = Math.max(y1, s[i + 1]) }
  x0 -= 2 * 칸; y0 -= 2 * 칸; x1 += 2 * 칸; y1 += 2 * 칸
  const W = Math.ceil((x1 - x0) / 칸), H = Math.ceil((y1 - y0) / 칸)
  if (W * H > 6e6 || W < 5 || H < 5) return null
  const g = new Uint8Array(W * H)
  for (let i = 0; i < s.length; i += 4) {
    const ax = (s[i] - x0) / 칸, ay = (s[i + 1] - y0) / 칸, bx = (s[i + 2] - x0) / 칸, by = (s[i + 3] - y0) / 칸
    const st = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) * 2))
    for (let k = 0; k <= st; k++) {
      const x = Math.floor(ax + (bx - ax) * k / st), y = Math.floor(ay + (by - ay) * k / st)
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy
        if (xx >= 0 && yy >= 0 && xx < W && yy < H) g[yy * W + xx] = 1
      }
    }
  }
  /* 바깥에서 물 붓기 */
  const 밖 = new Uint8Array(W * H)
  const q = new Int32Array(W * H)
  let qh = 0, qt = 0
  const 넣 = (i) => { if (!밖[i] && !g[i]) { 밖[i] = 1; q[qt++] = i } }
  for (let x = 0; x < W; x++) { 넣(x); 넣((H - 1) * W + x) }
  for (let y = 0; y < H; y++) { 넣(y * W); 넣(y * W + W - 1) }
  while (qh < qt) {
    const i = q[qh++], x = i % W, y = (i - x) / W
    if (x > 0) 넣(i - 1)
    if (x < W - 1) 넣(i + 1)
    if (y > 0) 넣(i - W)
    if (y < H - 1) 넣(i + W)
  }
  let 안 = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) 안[i] = 밖[i] ? 0 : 1
  /* 가는 띠 깎기 — 2칸(40 cm)씩 깎았다 다시 붙임 → 80 cm 보다 가는 것은 사라짐 */
  const 깎 = (a, r, 넣기) => {
    const b = new Uint8Array(W * H)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let v = 넣기 ? 0 : 1
      for (let dy = -r; dy <= r && (넣기 ? !v : v); dy++) for (let dx = -r; dx <= r; dx++) {
        const xx = x + dx, yy = y + dy
        const c = xx >= 0 && yy >= 0 && xx < W && yy < H ? a[yy * W + xx] : 0
        if (넣기 && c) { v = 1; break }
        if (!넣기 && !c) { v = 0; break }
      }
      b[y * W + x] = v
    }
    return b
  }
  안 = 깎(깎(깎(안, 2, false), 2, true), 1, false)     // 끝의 한 칸 깎기 = 선을 굵게 그린 만큼(바깥 20 cm) 되돌림
  let 칸수 = 0
  for (let i = 0; i < W * H; i++) 칸수 += 안[i]
  if (칸수 < 25) return null
  const tri = [], 선 = []
  const 네모 = (ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz) => { tri.push(ax, ay, az, bx, by, bz, cx, cy, cz, ax, ay, az, cx, cy, cz, dx, dy, dz) }
  const 벽 = (ax, ay, bx, by) => { 네모(ax, ay, 아래, bx, by, 아래, bx, by, 위, ax, ay, 위); 선.push(ax, ay, 아래, bx, by, 아래, ax, ay, 위, bx, by, 위) }
  /* 바닥판 — 줄마다 이어진 칸 */
  for (let y = 0; y < H; y++) {
    let x = 0
    while (x < W) {
      if (!안[y * W + x]) { x++; continue }
      let e = x
      while (e < W && 안[y * W + e]) e++
      const X0 = x0 + x * 칸, X1 = x0 + e * 칸, Y0 = y0 + y * 칸, Y1 = Y0 + 칸
      네모(X0, Y0, 아래, X1, Y0, 아래, X1, Y1, 아래, X0, Y1, 아래)
      x = e
    }
  }
  /* 바깥 벽 — 안 칸과 밖 칸 사이 변(같은 방향으로 이어진 것은 하나로) */
  for (let y = 0; y <= H; y++) {        // 가로 변: (x, y) 아래쪽 칸 y-1 과 위쪽 칸 y
    let x = 0
    while (x < W) {
      const a = y > 0 ? 안[(y - 1) * W + x] : 0, b = y < H ? 안[y * W + x] : 0
      if (a === b) { x++; continue }
      let e = x
      while (e < W) { const a2 = y > 0 ? 안[(y - 1) * W + e] : 0, b2 = y < H ? 안[y * W + e] : 0; if (a2 === b2 || a2 !== a) break; e++ }
      const Y = y0 + y * 칸
      벽(x0 + x * 칸, Y, x0 + e * 칸, Y)
      x = e
    }
  }
  for (let x = 0; x <= W; x++) {        // 세로 변
    let y = 0
    while (y < H) {
      const a = x > 0 ? 안[y * W + x - 1] : 0, b = x < W ? 안[y * W + x] : 0
      if (a === b) { y++; continue }
      let e = y
      while (e < H) { const a2 = x > 0 ? 안[e * W + x - 1] : 0, b2 = x < W ? 안[e * W + x] : 0; if (a2 === b2 || a2 !== a) break; e++ }
      const X = x0 + x * 칸
      벽(X, y0 + y * 칸, X, y0 + e * 칸)
      y = e
    }
  }
  return { tri, 선, 넓이: 칸수 * 칸 * 칸 / 1e6 }
}
