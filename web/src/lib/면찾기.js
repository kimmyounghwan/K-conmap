/**
 * 🧩 면찾기 — 선 토막들로 닫힌 면(칸)을 찾음 (🏭 G294 — 2026-10-15)
 *
 * 소장님 「기초 · 바닥판 · 벽 · 기둥을 한꺼번에 읽게 만들기 — 해줘」
 *   플랜트식 토목 기초 도면(FOUNDATION PLAN · FOOTING PLAN · BEAM PLAN)은 바닥판 · 기초 · 지중보가 «실제 크기 윤곽선» 으로 그려져 있음 →
 *   선을 이어 닫힌 면을 찾으면 넓이 · 둘레가 도면 그대로.
 *
 * 셈: ① 토막끼리 만나는 점(교차 · T 자 · 끝점 닿음)에서 토막을 자름 ② 끝점을 tol 안에서 한 점으로 ③ 홀로 끝난 토막(가지)은 버림
 *     ④ 점마다 나가는 변을 각도 순으로 놓고 «들어온 변의 바로 시계 방향 다음 변» 으로 돌면 면 하나(반시계 = 안쪽 면)
 *     ⑤ 다른 무리(떨어진 고리)가 어떤 면 안에 있으면 그 면의 구멍 — 넓이에서 뺌
 * 좌표 단위는 받은 그대로(mm). 결과 면: { 점: [[x,y]…](반시계), 구멍: [[[x,y]…]…], 넓이, 둘레, 상자: [x0,y0,x1,y1] }
 */

/** 다각형 넓이(부호 — 반시계 +) */
export function 부호넓이(r) {
  let A = 0
  for (let i = 0, n = r.length; i < n; i++) { const a = r[i], b = r[(i + 1) % n]; A += a[0] * b[1] - b[0] * a[1] }
  return A / 2
}
export function 둘레(r) { let L = 0; for (let i = 0, n = r.length; i < n; i++) { const a = r[i], b = r[(i + 1) % n]; L += Math.hypot(b[0] - a[0], b[1] - a[1]) } return L }
export function 상자(r) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const p of r) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1] }
  return [x0, y0, x1, y1]
}
/** 점이 고리 안인가(짝홀) */
export function 안인가(p, r) {
  let 안 = false
  const x = p[0], y = p[1]
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-300) + xi) 안 = !안
  }
  return 안
}
/** 면 안(구멍 밖)인가 */
export function 면안(p, f) {
  if (!안인가(p, f.점)) return false
  for (const h of f.구멍 || []) if (안인가(p, h)) return false
  return true
}
/** 고리 안쪽 한 점(가운데가 밖이면 가로줄로 찾음) */
export function 안점(r, 구멍 = []) {
  const b = 상자(r)
  const 좋은 = (p) => 안인가(p, r) && !구멍.some((h) => 안인가(p, h))
  const c = 가운데(r)
  if (좋은(c)) return c
  for (const t of [0.5, 0.3, 0.7, 0.2, 0.8, 0.1, 0.9]) {
    const y = b[1] + (b[3] - b[1]) * t
    const xs = []
    for (let i = 0, n = r.length; i < n; i++) {
      const a = r[i], q = r[(i + 1) % n]
      if ((a[1] > y) !== (q[1] > y)) xs.push(a[0] + (q[0] - a[0]) * (y - a[1]) / (q[1] - a[1]))
    }
    xs.sort((p, q) => p - q)
    for (let i = 0; i + 1 < xs.length; i += 2) { const p = [(xs[i] + xs[i + 1]) / 2, y]; if (좋은(p)) return p }
  }
  return c
}
/** 넓이 가운데(무게 중심) — 첫 점 기준으로 빼고 셈(G445: 배치도 좌표 2.7억 mm 면 곱이 2^53 을 넘어 10 m 넘게 빗나감) */
export function 가운데(r) {
  if (!r.length) return [0, 0]
  const o = r[0]
  let A = 0, cx = 0, cy = 0
  for (let i = 0, n = r.length; i < n; i++) {
    const b = r[(i + 1) % n], ax = r[i][0] - o[0], ay = r[i][1] - o[1], bx = b[0] - o[0], by = b[1] - o[1], w = ax * by - bx * ay
    A += w; cx += (ax + bx) * w; cy += (ay + by) * w
  }
  if (Math.abs(A) < 1e-9) { const b = 상자(r); return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2] }
  return [o[0] + cx / (3 * A), o[1] + cy / (3 * A)]
}
/** 점과 토막 사이 거리 */
export function 토막거리(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy
  let t = L2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}
/** 점과 고리 테두리 사이 거리(안 · 밖 상관없이) */
export function 경계거리(p, r) {
  let d = Infinity
  for (let i = 0, n = r.length; i < n; i++) { const a = r[i], b = r[(i + 1) % n]; d = Math.min(d, 토막거리(p[0], p[1], a[0], a[1], b[0], b[1])) }
  return d
}
/** 점과 고리(둘레) 사이 거리 — 안이면 0 */
export function 고리거리(p, r) {
  if (안인가(p, r)) return 0
  let d = Infinity
  for (let i = 0, n = r.length; i < n; i++) { const a = r[i], b = r[(i + 1) % n]; d = Math.min(d, 토막거리(p[0], p[1], a[0], a[1], b[0], b[1])) }
  return d
}

/**
 * 토막 [[x0,y0,x1,y1]…] → 닫힌 면들
 * @param {number} tol 끝점을 한 점으로 볼 거리(mm) · 기본 2
 * @param {number} 최소넓이 이보다 작은 면은 버림(㎟) · 기본 0
 */
export function 면찾기(토막, 옵 = {}) { return 면과테두리(토막, 옵).면들 }
/** 면 + 무리마다 바깥 테두리(반시계로 뒤집은 것 · 다른 면 안에 든 무리는 구멍으로도 들어감) */
export function 면과테두리(토막, { tol = 2, 최소넓이 = 0 } = {}) {
  const S = []
  for (const s of 토막) {
    const [ax, ay, bx, by] = s
    if (![ax, ay, bx, by].every(Number.isFinite)) continue
    if (Math.hypot(bx - ax, by - ay) <= tol) continue
    S.push([ax, ay, bx, by])
  }
  const n = S.length
  if (!n) return { 면들: [], 바깥들: [] }
  /* ① 자를 자리 — 칸으로 이웃 토막만 봄 */
  let 크기 = 0
  for (const s of S) 크기 += Math.hypot(s[2] - s[0], s[3] - s[1])
  const 칸 = Math.max(500, (크기 / n) * 2)
  const 칸표 = new Map()
  const 열 = (i, j) => i * 1000003 + j
  S.forEach((s, k) => {
    const i0 = Math.floor((Math.min(s[0], s[2]) - tol) / 칸), i1 = Math.floor((Math.max(s[0], s[2]) + tol) / 칸)
    const j0 = Math.floor((Math.min(s[1], s[3]) - tol) / 칸), j1 = Math.floor((Math.max(s[1], s[3]) + tol) / 칸)
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const key = 열(i, j); const a = 칸표.get(key); if (a) a.push(k); else 칸표.set(key, [k]) }
  })
  const 자름 = S.map(() => [0, 1])
  const 본 = new Set()
  for (const a of 칸표.values()) {
    for (let x = 0; x < a.length; x++) for (let y = x + 1; y < a.length; y++) {
      const p = a[x], q = a[y]
      const key = p < q ? p * n + q : q * n + p
      if (본.has(key)) continue
      본.add(key)
      const [ax, ay, bx, by] = S[p], [cx, cy, dx, dy] = S[q]
      const rx = bx - ax, ry = by - ay, sx = dx - cx, sy = dy - cy
      const Lr = Math.hypot(rx, ry), Ls = Math.hypot(sx, sy)
      const den = rx * sy - ry * sx
      /* 끝점이 다른 토막 위(T 자 · 겹침) */
      const 위 = (px, py, k, L) => {
        const [ex, ey, fx, fy] = S[k]
        const ux = fx - ex, uy = fy - ey
        const t = ((px - ex) * ux + (py - ey) * uy) / (L * L)
        if (t <= tol / L || t >= 1 - tol / L) return
        if (토막거리(px, py, ex, ey, fx, fy) <= tol) 자름[k].push(t)
      }
      위(cx, cy, p, Lr); 위(dx, dy, p, Lr); 위(ax, ay, q, Ls); 위(bx, by, q, Ls)
      if (Math.abs(den) < 1e-9 * Lr * Ls) continue          // 나란함 — 끝점 닿음만(위에서)
      const t = ((cx - ax) * sy - (cy - ay) * sx) / den, u = ((cx - ax) * ry - (cy - ay) * rx) / den
      const et = tol / Lr, eu = tol / Ls
      if (t > et && t < 1 - et && u >= -eu && u <= 1 + eu) 자름[p].push(t)
      if (u > eu && u < 1 - eu && t >= -et && t <= 1 + et) 자름[q].push(u)
    }
  }
  /* ② 점 묶기(tol 칸) */
  const 점들 = []
  const 점칸 = new Map()
  const 점번 = (x, y) => {
    const i = Math.round(x / tol), j = Math.round(y / tol)
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      const a = 점칸.get(열(i + di, j + dj))
      if (a) for (const k of a) if (Math.hypot(점들[k][0] - x, 점들[k][1] - y) <= tol) return k
    }
    const k = 점들.length
    점들.push([x, y])
    const key = 열(i, j); const a = 점칸.get(key); if (a) a.push(k); else 점칸.set(key, [k])
    return k
  }
  const 변 = new Map()            // "u|v" (u<v)
  S.forEach((s, k) => {
    const ts = [...new Set(자름[k].map((t) => Math.round(t * 1e9) / 1e9))].sort((a, b) => a - b)
    let prev = null
    for (const t of ts) {
      const v = 점번(s[0] + (s[2] - s[0]) * t, s[1] + (s[3] - s[1]) * t)
      if (prev !== null && prev !== v) { const key = prev < v ? prev + '|' + v : v + '|' + prev; 변.set(key, [Math.min(prev, v), Math.max(prev, v)]) }
      prev = v
    }
  })
  /* ③ 가지 버림 */
  const 이웃 = 점들.map(() => new Set())
  for (const [u, v] of 변.values()) { 이웃[u].add(v); 이웃[v].add(u) }
  const 쌓 = []
  for (let k = 0; k < 이웃.length; k++) if (이웃[k].size === 1) 쌓.push(k)
  while (쌓.length) {
    const k = 쌓.pop()
    if (이웃[k].size !== 1) continue
    const [m] = 이웃[k]
    이웃[k].delete(m); 이웃[m].delete(k)
    if (이웃[m].size === 1) 쌓.push(m)
  }
  /* ④ 면 돌기 — 점마다 나가는 변을 각도 순으로 */
  const 차례 = 이웃.map((s, k) => [...s].sort((a, b) => Math.atan2(점들[a][1] - 점들[k][1], 점들[a][0] - 점들[k][0]) - Math.atan2(점들[b][1] - 점들[k][1], 점들[b][0] - 점들[k][0])))
  const 자리 = 차례.map((a) => new Map(a.map((v, i) => [v, i])))
  const 돈 = new Set()
  const 고리들 = []
  for (let u = 0; u < 차례.length; u++) for (const v0 of 차례[u]) {
    if (돈.has(u + '>' + v0)) continue
    const 고리 = []
    let a = u, b = v0, 안전 = 0
    while (!돈.has(a + '>' + b) && 안전++ < 200000) {
      돈.add(a + '>' + b)
      고리.push(a)
      /* b 에서: a 로 가는 변(되돌아감)의 «바로 시계 방향 다음» = 각도 순 앞 칸 */
      const 줄 = 차례[b], i = 자리[b].get(a)
      const c = 줄[(i - 1 + 줄.length) % 줄.length]
      a = b; b = c
    }
    if (고리.length >= 3) 고리들.push(고리.map((k) => 점들[k]))
  }
  /* 반시계(+) = 안쪽 면 · 시계(−) = 무리의 바깥 테두리 */
  const 면들 = [], 바깥들 = []
  for (const r of 고리들) {
    const A = 부호넓이(r)
    if (A > 1e-6) 면들.push({ 점: r, 구멍: [], 넓이: A, 둘레: 둘레(r), 상자: 상자(r) })
    else if (A < -1e-6) 바깥들.push(r.slice().reverse())
  }
  /* ⑤ 구멍 — 바깥 테두리가 어떤 면 안에 들면(그 면이 그 무리 것이 아니면) 그 면의 구멍. 가장 작은 면에 */
  for (const h of 바깥들) {
    const p = h[0], hA = 부호넓이(h)
    let best = null
    for (const f of 면들) {
      if (f.넓이 <= hA + 1e-6) continue
      if (p[0] < f.상자[0] || p[0] > f.상자[2] || p[1] < f.상자[1] || p[1] > f.상자[3]) continue
      /* 같은 무리의 면이면(테두리를 함께 씀) 건너뜀 — 그 고리의 점 하나라도 면 테두리 위가 아니고 면 안이어야 */
      const 안속 = h.every((q) => 안인가(q, f.점) || 경계거리(q, f.점) <= tol * 2) && h.some((q) => 안인가(q, f.점) && 경계거리(q, f.점) > tol * 2)
      if (!안속) continue
      if (!best || f.넓이 < best.넓이) best = f
    }
    if (best) best.구멍.push(h)
  }
  for (const f of 면들) {
    if (f.구멍.length) {
      /* 구멍 안의 구멍(그 구멍 무리의 더 안쪽)은 뺄 몫이 아님 — 바로 안쪽 구멍만 */
      const 바로 = f.구멍.filter((h) => !f.구멍.some((g) => g !== h && 부호넓이(g) > 부호넓이(h) && 안인가(h[0], g)))
      f.구멍 = 바로
      f.넓이 -= 바로.reduce((t, h) => t + 부호넓이(h), 0)
    }
  }
  return { 면들: 면들.filter((f) => f.넓이 > 최소넓이), 바깥들: 바깥들.map((r) => ({ 점: r, 넓이: 부호넓이(r), 둘레: 둘레(r), 상자: 상자(r) })) }
}

/**
 * 맞닿은 면들을 무리로(한 기초 윤곽 안에 금이 그어져 여러 칸이 된 것 → 하나) — 테두리 점을 함께 쓰면 이웃
 * @returns [{면: [면…], 넓이, 상자}]
 */
export function 면무리(면들, tol = 5) {
  const n = 면들.length
  const 부모 = 면들.map((_, i) => i)
  const 뿌리 = (i) => { while (부모[i] !== i) { 부모[i] = 부모[부모[i]]; i = 부모[i] } return i }
  const 키 = (p) => Math.round(p[0] / tol) + ',' + Math.round(p[1] / tol)
  const 점면 = new Map()
  면들.forEach((f, i) => { for (const p of f.점) { const k = 키(p); const a = 점면.get(k); if (a) a.push(i); else 점면.set(k, [i]) } })
  for (const a of 점면.values()) for (let k = 1; k < a.length; k++) { const x = 뿌리(a[0]), y = 뿌리(a[k]); if (x !== y) 부모[x] = y }
  const 묶 = new Map()
  for (let i = 0; i < n; i++) { const r = 뿌리(i); const a = 묶.get(r); if (a) a.push(면들[i]); else 묶.set(r, [면들[i]]) }
  return [...묶.values()].map((fs) => {
    const b = [Infinity, Infinity, -Infinity, -Infinity]
    for (const f of fs) { b[0] = Math.min(b[0], f.상자[0]); b[1] = Math.min(b[1], f.상자[1]); b[2] = Math.max(b[2], f.상자[2]); b[3] = Math.max(b[3], f.상자[3]) }
    return { 면: fs, 넓이: fs.reduce((t, f) => t + f.넓이, 0), 상자: b }
  })
}
