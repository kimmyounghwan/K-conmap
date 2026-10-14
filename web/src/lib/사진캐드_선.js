/**
 * 📷 사진 → 캐드 · ③ 선 — 길(뼈대)을 곧은 선 · 호 · 원으로, 그리고 «반듯하게» (2026-10-14 G287)
 *
 *   길맞추기(길들, o)   — 길마다 곧은 선으로 맞춰 보고, 안 맞으면 원호로, 그래도 안 맞으면 가장 먼 점에서 둘로 나눠 다시(거듭).
 *                         선은 점 전체 최소제곱(0.1픽셀 안팎) · 원은 대수 맞춤 뒤 기하 다듬기(가우스-뉴턴).
 *   반듯하게(도형, o)   — ① 주된 방향(돌아간 각) 찾기 → 그 각만큼 돌려 가로 · 세로를 딱 0° · 90° 로
 *                         ② 거의 가로 · 세로 · 45° 인 선은 딱 맞춤 ③ 한 줄 위의 끊긴 선 잇기 ④ 거의 같은 높이의 선은 같은 높이로
 *                         ⑤ 모서리 · T 자리: 끝점을 이웃 선과 만나는 점으로(늘이거나 줄여서) ⑥ 짧은 찌꺼기 · 치수 끝 빗금 빼기
 *   선분찾기(판, o)     — 건물 사진처럼 «잉크» 가 아닌 사진에서 밝기 경계로 선분(LSD 꼴: 경사 방향이 같은 점 키우기 → 네모 맞춤 → 검사)
 *
 * 도형 꼴: { t:'L', a:[x,y], b:[x,y], c:[x,y](무게중심), n(받친 점 수), 끝:['E'|'J','E'|'J'] }
 *          { t:'A', c:[x,y], r, a0, a1 (라디안 · 사진 좌표 · a0→a1 이 점 차례 방향), 쪽: 1|-1 }   { t:'C', c, r }
 */

import { 선맞춤, 만남 } from './사진캐드_펴기.js'

const D = 180 / Math.PI

/* ───────────── 원 맞추기 ───────────── */
export function 원맞춤(pts) {
  const n = pts.length
  if (n < 3) return null
  let mx = 0, my = 0
  for (const p of pts) { mx += p[0]; my += p[1] }
  mx /= n; my /= n
  // 대수(Kasa): u²+v² + D u + E v + F = 0  (가운데로 옮겨 수치 안정)
  let suu = 0, svv = 0, suv = 0, su = 0, sv = 0, suuu = 0, svvv = 0, suvv = 0, svuu = 0
  for (const p of pts) {
    const u = p[0] - mx, v = p[1] - my
    suu += u * u; svv += v * v; suv += u * v; su += u; sv += v
    suuu += u * u * u; svvv += v * v * v; suvv += u * v * v; svuu += v * u * u
  }
  const det = suu * svv - suv * suv
  if (Math.abs(det) < 1e-9) return null
  const bu = 0.5 * (suuu + suvv), bv = 0.5 * (svvv + svuu)
  let uc = (bu * svv - bv * suv) / det, vc = (svv * 0 + suu * bv - suv * bu) / det
  let cx = uc + mx, cy = vc + my
  let r = 0
  for (const p of pts) r += Math.hypot(p[0] - cx, p[1] - cy)
  r /= n
  // 기하 다듬기 (가우스-뉴턴 10번)
  for (let it = 0; it < 10; it++) {
    let JTJ00 = 0, JTJ01 = 0, JTJ02 = 0, JTJ11 = 0, JTJ12 = 0, JTJ22 = 0, g0 = 0, g1 = 0, g2 = 0
    for (const p of pts) {
      const dx = p[0] - cx, dy = p[1] - cy, di = Math.hypot(dx, dy) || 1e-9
      const res = di - r
      const j0 = -dx / di, j1 = -dy / di, j2 = -1
      JTJ00 += j0 * j0; JTJ01 += j0 * j1; JTJ02 += j0 * j2; JTJ11 += j1 * j1; JTJ12 += j1 * j2; JTJ22 += j2 * j2
      g0 += j0 * res; g1 += j1 * res; g2 += j2 * res
    }
    const A = [[JTJ00, JTJ01, JTJ02], [JTJ01, JTJ11, JTJ12], [JTJ02, JTJ12, JTJ22]]
    const s = 풀3(A, [-g0, -g1, -g2])
    if (!s) break
    cx += s[0]; cy += s[1]; r += s[2]
    if (Math.abs(s[0]) + Math.abs(s[1]) + Math.abs(s[2]) < 1e-4) break
  }
  let 최 = 0, 합 = 0
  for (const p of pts) { const e = Math.abs(Math.hypot(p[0] - cx, p[1] - cy) - r); 합 += e * e; if (e > 최) 최 = e }
  return { c: [cx, cy], r, 최, 흩: Math.sqrt(합 / n) }
}

function 풀3(A, b) {
  const M = A.map((r, i) => [...r, b[i]])
  for (let c = 0; c < 3; c++) {
    let p = c
    for (let r = c + 1; r < 3; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r
    if (Math.abs(M[p][c]) < 1e-12) return null
    ;[M[p], M[c]] = [M[c], M[p]]
    for (let r = 0; r < 3; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k < 4; k++) M[r][k] -= f * M[c][k] }
  }
  return [M[0][3] / M[0][0], M[1][3] / M[1][1], M[2][3] / M[2][2]]
}

/* ───────────── 길 → 선 · 호 ───────────── */

function 선으로(pts, i0, i1) {
  const 부분 = pts.slice(i0, i1 + 1)
  const L = 선맞춤(부분)
  if (!L) return null
  const [cx, cy] = L.c, [dx, dy] = L.d
  let 최 = 0
  for (const p of 부분) { const e = Math.abs(-(p[0] - cx) * dy + (p[1] - cy) * dx); if (e > 최) 최 = e }
  const 투 = (p) => { const t = (p[0] - cx) * dx + (p[1] - cy) * dy; return [cx + dx * t, cy + dy * t] }
  return { L, 최, a: 투(pts[i0]), b: 투(pts[i1]), n: 부분.length }
}

/**
 * @param 길들 길따기 결과
 * @param o { 굵, 손그림 }
 */
export function 길맞추기(길들, o = {}) {
  const 굵 = o.굵 || 3
  const 손 = !!o.손그림
  const 선기본 = 손 ? Math.max(2.0, 0.6 * 굵) : Math.max(0.9, 0.3 * 굵)
  const 선비 = 손 ? 0.012 : 0.0018
  const 원허용 = (r) => (손 ? Math.max(1.6, 0.6 * 굵) + 0.03 * r : Math.max(0.9, 0.3 * 굵) + 0.004 * r)
  const 최소호각 = 손 ? 40 : 18
  const 최소점 = Math.max(4, Math.round(1.2 * 굵))
  const 깎기 = Math.max(1, Math.round(0.8 * 굵))
  const out = []
  const 거듭 = (pts, i0, i1, 끝a, 끝b, 깊이) => {
    const n = i1 - i0 + 1
    if (n < 최소점) {
      if (n >= 2) { const f = 선으로(pts, i0, i1); if (f) out.push({ t: 'L', a: f.a, b: f.b, c: f.L.c, n, 끝: [끝a, 끝b], 짧음: true }) }
      return
    }
    const f = 선으로(pts, i0, i1)
    const len = Math.hypot(f.b[0] - f.a[0], f.b[1] - f.a[1])
    if (f && f.최 <= 선기본 + 선비 * len) { out.push({ t: 'L', a: f.a, b: f.b, c: f.L.c, n, 끝: [끝a, 끝b] }); return }
    if (n >= 12) {
      const C = 원맞춤(pts.slice(i0, i1 + 1))
      if (C && C.r > 2 * 굵 && C.r < 4000 && C.최 <= 원허용(C.r)) {
        // 쓸어 간 각
        let 앞 = Math.atan2(pts[i0][1] - C.c[1], pts[i0][0] - C.c[0]), 합 = 0
        const 시작 = 앞
        for (let i = i0 + 1; i <= i1; i++) {
          const a = Math.atan2(pts[i][1] - C.c[1], pts[i][0] - C.c[0])
          let d = a - 앞; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI
          합 += d; 앞 = a
        }
        // 호처럼 휜 정도(현에서 가장 먼 점)가 선 허용보다 뚜렷해야 호로 봄
        const 휨 = C.r * (1 - Math.cos(Math.min(Math.PI, Math.abs(합) / 2)))
        if (Math.abs(합) * D >= 최소호각 && 휨 > 2.5 * (선기본 + 선비 * len)) {
          out.push({ t: 'A', c: C.c, r: C.r, a0: 시작, a1: 시작 + 합, n, 끝: [끝a, 끝b] })
          return
        }
      }
    }
    if (깊이 > 40) { out.push({ t: 'L', a: f.a, b: f.b, c: f.L.c, n, 끝: [끝a, 끝b] }); return }
    // 나누기: 현(첫 점 ~ 끝 점)에서 가장 먼 점
    const A = pts[i0], B = pts[i1]
    let 최 = -1, k = -1
    const cl = Math.hypot(B[0] - A[0], B[1] - A[1])
    for (let i = i0 + 1; i < i1; i++) {
      const p = pts[i]
      const e = cl > 1e-6 ? Math.abs((B[0] - A[0]) * (A[1] - p[1]) - (A[0] - p[0]) * (B[1] - A[1])) / cl : Math.hypot(p[0] - A[0], p[1] - A[1])
      if (e > 최) { 최 = e; k = i }
    }
    if (k <= i0 || k >= i1) { out.push({ t: 'L', a: f.a, b: f.b, c: f.L.c, n, 끝: [끝a, 끝b] }); return }
    거듭(pts, i0, k, 끝a, 'J', 깊이 + 1)
    거듭(pts, k, i1, 'J', 끝b, 깊이 + 1)
  }
  for (const g of 길들) {
    let pts = g.p
    if (g.a === 'L') {
      // 닫힌 고리: 원이면 원, 아니면 가장 먼 두 점으로 둘로 나눠 맞춤
      if (pts.length >= 12) {
        const C = 원맞춤(pts)
        if (C && C.최 <= 원허용(C.r) && C.r > 1.5 * 굵) { out.push({ t: 'C', c: C.c, r: C.r, n: pts.length }); continue }
      }
      let k = 0, 최 = -1
      for (let i = 0; i < pts.length; i++) { const e = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]); if (e > 최) { 최 = e; k = i } }
      const 고리 = pts.concat([pts[0]])
      거듭(고리, 0, k, 'J', 'J', 0)
      거듭(고리, k, 고리.length - 1, 'J', 'J', 0)
      continue
    }
    // 갈림점 쪽 끝은 몇 점 깎음(갈림 자리에서 뼈대가 휘어 들어감)
    let i0 = 0, i1 = pts.length - 1
    if (g.a === 'J') i0 = Math.min(깎기, Math.max(0, pts.length - 3))
    if (g.b === 'J') i1 = Math.max(i0 + 1, pts.length - 1 - 깎기)
    if (i1 - i0 < 1) continue
    거듭(pts, i0, i1, g.a, g.b, 0)
  }
  return out
}

/* ───────────── 반듯하게 ───────────── */

const 각 = (s) => Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0])
const 길이 = (s) => Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1])

/** 선들의 주된 방향(0~90°, 길이 무게) — 0.1° 칸 */
export function 주된각(선들) {
  const 칸 = new Float64Array(900)
  for (const s of 선들) {
    if (s.t !== 'L') continue
    const L = 길이(s); if (L < 1) continue
    let a = 각(s) * D; a = ((a % 90) + 90) % 90
    const k = Math.round(a * 10) % 900
    for (let d = -15; d <= 15; d++) 칸[(k + d + 900) % 900] += L * Math.exp(-(d * d) / 50)
  }
  let 최 = -1, k = 0
  for (let i = 0; i < 900; i++) if (칸[i] > 최) { 최 = 칸[i]; k = i }
  // 칸 안에서 무게중심으로 다듬기
  let s = 0, sw = 0
  for (const t of 선들) {
    if (t.t !== 'L') continue
    const L = 길이(t); let a = 각(t) * D; a = ((a % 90) + 90) % 90
    let d = a - k / 10; if (d > 45) d -= 90; if (d < -45) d += 90
    if (Math.abs(d) < 1.2) { s += d * L; sw += L }
  }
  let r = k / 10 + (sw ? s / sw : 0)
  if (r > 45) r -= 90
  return r   // -45 ~ 45
}

function 돌리기(p, c, cos, sin) { const x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * cos - y * sin, c[1] + x * sin + y * cos] }

/**
 * @param 도형 길맞추기 결과
 * @param o { 굵, 손그림, w, h, 각맞춤:true }
 * @returns { 도형, 돌림각(도), 가운데, 빗금:[{x,y,꼴}] }
 */
export function 반듯하게(도형, o = {}) {
  const 굵 = o.굵 || 3
  const 손 = !!o.손그림
  const c = [o.w / 2 || 0, o.h / 2 || 0]
  const θ = o.각맞춤 === false ? 0 : 주된각(도형)
  const cos = Math.cos(-θ / D), sin = Math.sin(-θ / D)
  let G = 도형.map((s) => {
    if (s.t === 'L') return { ...s, a: 돌리기(s.a, c, cos, sin), b: 돌리기(s.b, c, cos, sin), c: 돌리기(s.c || [(s.a[0] + s.b[0]) / 2, (s.a[1] + s.b[1]) / 2], c, cos, sin) }
    return { ...s, c: 돌리기(s.c, c, cos, sin), a0: s.a0 != null ? s.a0 - θ / D : s.a0, a1: s.a1 != null ? s.a1 - θ / D : s.a1 }
  })
  const 각허용 = 손 ? 7 : 2.5
  const 사오허용 = 손 ? 5 : 1.5
  // ② 딱 맞춤
  for (const s of G) {
    if (s.t !== 'L') continue
    const L = 길이(s)
    let a = 각(s) * D
    let a180 = ((a % 180) + 180) % 180
    const 허 = Math.min(각허용, L > 0 ? Math.max(각허용 * 0.4, (Math.atan2(손 ? 3 * 굵 : 1.2 * 굵, L) * D)) : 각허용) // 짧은 선은 각이 흔들려서 더 너그럽게, 긴 선은 엄하게
    const 허2 = Math.max(허, 손 ? 각허용 : 0.8)
    if (Math.min(a180, 180 - a180) < 허2) s.꼴 = 'H'
    else if (Math.abs(a180 - 90) < 허2) s.꼴 = 'V'
    else if (Math.abs(a180 - 45) < 사오허용 || Math.abs(a180 - 135) < 사오허용) s.꼴 = a180 < 90 ? 'D1' : 'D2'
    else s.꼴 = 'O'
    if (s.꼴 === 'H') { const y = s.c[1]; const xs = [s.a[0], s.b[0]].sort((p, q) => p - q); s.a = [xs[0], y]; s.b = [xs[1], y] }
    else if (s.꼴 === 'V') { const x = s.c[0]; const ys = [s.a[1], s.b[1]].sort((p, q) => p - q); s.a = [x, ys[0]]; s.b = [x, ys[1]] }
    else if (s.꼴 === 'D1' || s.꼴 === 'D2') {
      const 방 = s.꼴 === 'D1' ? [Math.SQRT1_2, Math.SQRT1_2] : [-Math.SQRT1_2, Math.SQRT1_2]
      const t1 = (s.a[0] - s.c[0]) * 방[0] + (s.a[1] - s.c[1]) * 방[1], t2 = (s.b[0] - s.c[0]) * 방[0] + (s.b[1] - s.c[1]) * 방[1]
      s.a = [s.c[0] + 방[0] * t1, s.c[1] + 방[1] * t1]; s.b = [s.c[0] + 방[0] * t2, s.c[1] + 방[1] * t2]
    }
  }
  // ⑥-1 치수 끝 빗금(짧은 45° 선이 가로 · 세로 선 위에 걸침) → 빼고 자리만 남김
  const 빗금 = []
  const HV = G.filter((s) => s.t === 'L' && (s.꼴 === 'H' || s.꼴 === 'V'))
  G = G.filter((s) => {
    if (s.t !== 'L' || !(s.꼴 === 'D1' || s.꼴 === 'D2' || s.꼴 === 'O')) return true
    const L = 길이(s)
    if (L > 9 * 굵 + 6) return true
    // 이 짧은 빗선이 가로 · 세로 선에 «닿거나 걸치면» 치수 끝 빗금(갈림점에서 반으로 잘린 것도)
    const 여 = 1.5 * 굵 + 2
    for (const t of HV) {
      if (t.꼴 === 'H') {
        const y = t.a[1], dy = s.b[1] - s.a[1]
        if (Math.abs(dy) < 1e-6) continue
        const u = (y - s.a[1]) / dy, x = s.a[0] + u * (s.b[0] - s.a[0])
        if (u * L > -여 && u * L < L + 여 && x > t.a[0] - 2 * 굵 && x < t.b[0] + 2 * 굵) { 빗금.push({ x, y, 꼴: 'H' }); return false }
      } else {
        const x = t.a[0], dx = s.b[0] - s.a[0]
        if (Math.abs(dx) < 1e-6) continue
        const u = (x - s.a[0]) / dx, y = s.a[1] + u * (s.b[1] - s.a[1])
        if (u * L > -여 && u * L < L + 여 && y > t.a[1] - 2 * 굵 && y < t.b[1] + 2 * 굵) { 빗금.push({ x, y, 꼴: 'V' }); return false }
      }
    }
    return true
  })
  // ③ 한 줄 위의 끊긴 선 잇기 (가로 · 세로)
  const 잇는틈 = 손 ? 3 * 굵 + 4 : 1.6 * 굵 + 2
  const 같은줄 = 손 ? Math.max(2.5, 1.0 * 굵) : Math.max(1.0, 0.45 * 굵)
  G = 잇기(G, 'H', 같은줄, 잇는틈)
  G = 잇기(G, 'V', 같은줄, 잇는틈)
  // ④ 거의 같은 높이 · 같은 자리 → 하나로
  const 맞춤 = 손 ? Math.max(2, 0.8 * 굵) : Math.max(0.8, 0.35 * 굵)
  줄맞추기(G, 'H', 맞춤)
  줄맞추기(G, 'V', 맞춤)
  // ⑤ 모서리 · T 자리
  const 붙임 = 손 ? Math.max(6, 4 * 굵) : Math.max(3, 2 * 굵)
  for (let 회 = 0; 회 < 2; 회++) 끝붙이기(G, 붙임, 손)
  // 다시 한 번 잇기(끝을 붙이다 맞닿게 된 것)
  G = 잇기(G, 'H', 같은줄, 1)
  G = 잇기(G, 'V', 같은줄, 1)
  // ⑥-2 짧은 찌꺼기
  const 최소HV = 손 ? Math.max(6, 2.5 * 굵) : Math.max(3, 1.6 * 굵)
  const 최소기타 = 손 ? Math.max(10, 4 * 굵) : Math.max(5, 3 * 굵)
  G = G.filter((s) => s.t !== 'L' || 길이(s) >= ((s.꼴 === 'H' || s.꼴 === 'V') ? 최소HV : 최소기타) || s.이음 >= 2)
  return { 도형: G, 돌림각: θ, 가운데: c, 빗금 }
}

function 잇기(G, 꼴, 같은줄, 틈) {
  const 그 = G.filter((s) => s.t === 'L' && s.꼴 === 꼴)
  const 남 = G.filter((s) => !(s.t === 'L' && s.꼴 === 꼴))
  const k = 꼴 === 'H' ? 1 : 0, j = 1 - k
  그.sort((p, q) => p.a[k] - q.a[k])
  const 무리 = []
  for (const s of 그) {
    const 끝 = 무리[무리.length - 1]
    if (끝 && s.a[k] - 끝.마지막 <= 같은줄) { 끝.들.push(s); 끝.마지막 = s.a[k] } else 무리.push({ 들: [s], 마지막: s.a[k] })
  }
  const 새 = []
  for (const m of 무리) {
    // 같은 줄 안에서도 서로 멀면(같은줄 이상) 다른 줄 — 무리 안 무게 평균으로 비교
    const 들 = m.들.slice().sort((p, q) => p.a[j] - q.a[j])
    let 지금 = null
    for (const s of 들) {
      if (지금 && s.a[j] - 지금.b[j] <= 틈 && Math.abs(s.a[k] - 지금.a[k]) <= 같은줄) {
        const w1 = 지금.n || 1, w2 = s.n || 1
        const off = (지금.a[k] * w1 + s.a[k] * w2) / (w1 + w2)
        const 끝j = Math.max(지금.b[j], s.b[j])
        지금.a[k] = off; 지금.b[k] = off
        if (s.b[j] >= 지금.b[j]) 지금.끝[1] = s.끝[1]
        지금.b[j] = 끝j
        지금.n = w1 + w2
        지금.c = [(지금.a[0] + 지금.b[0]) / 2, (지금.a[1] + 지금.b[1]) / 2]
      } else {
        if (지금) 새.push(지금)
        지금 = { ...s, a: s.a.slice(), b: s.b.slice(), 끝: (s.끝 || ['E', 'E']).slice() }
      }
    }
    if (지금) 새.push(지금)
  }
  return 남.concat(새)
}

function 줄맞추기(G, 꼴, 맞춤) {
  const k = 꼴 === 'H' ? 1 : 0
  const 그 = G.filter((s) => s.t === 'L' && s.꼴 === 꼴).sort((p, q) => p.a[k] - q.a[k])
  let i = 0
  while (i < 그.length) {
    let j = i + 1
    while (j < 그.length && 그[j].a[k] - 그[j - 1].a[k] <= 맞춤 && 그[j].a[k] - 그[i].a[k] <= 2.2 * 맞춤) j++
    if (j - i > 1) {
      let s = 0, sw = 0
      for (let q = i; q < j; q++) { const w = 길이(그[q]) + 1; s += 그[q].a[k] * w; sw += w }
      const v = s / sw
      for (let q = i; q < j; q++) { 그[q].a[k] = v; 그[q].b[k] = v; 그[q].c[k] = v }
    }
    i = j
  }
}

/** 두 선(무한) 만나는 점 */
function 선만남(s, t) {
  return 만남({ c: s.a, d: 단위(s) }, { c: t.a, d: 단위(t) })
}
function 단위(s) { const L = 길이(s) || 1; return [(s.b[0] - s.a[0]) / L, (s.b[1] - s.a[1]) / L] }

function 끝붙이기(G, 붙임, 손) {
  const 선 = G.filter((s) => s.t === 'L')
  for (const s of 선) {
    for (let e = 0; e < 2; e++) {
      const P = e ? s.b : s.a
      const 방s = 단위(s)
      let 최 = Infinity, 고 = null, X = null
      for (const t of 선) {
        if (t === s) continue
        const 방t = 단위(t)
        const 사이 = Math.abs(방s[0] * 방t[1] - 방s[1] * 방t[0])   // sin
        if (사이 < 0.2) continue   // 거의 나란하면 안 붙임(잇기가 맡음)
        const X1 = 선만남(s, t); if (!X1) continue
        const dP = Math.hypot(X1[0] - P[0], X1[1] - P[1])
        if (dP > 붙임 * (사이 < 0.5 ? 1.5 : 1)) continue
        // X 가 t 의 범위 안(조금 넘쳐도) 이어야
        const Lt = 길이(t)
        const tt = (X1[0] - t.a[0]) * 방t[0] + (X1[1] - t.a[1]) * 방t[1]
        if (tt < -붙임 || tt > Lt + 붙임) continue
        // X 가 s 의 바깥쪽 끝으로 너무 들어가면(선 가운데로) 안 됨: s 위에서 P 가까이
        const Ls = 길이(s)
        const ts = (X1[0] - s.a[0]) * 방s[0] + (X1[1] - s.a[1]) * 방s[1]
        if (e === 0 ? ts > Ls * 0.5 : ts < Ls * 0.5) continue
        if (dP < 최) { 최 = dP; 고 = t; X = X1 }
      }
      if (!고) continue
      if (e) s.b = X; else s.a = X
      s.이음 = (s.이음 || 0) + 1
      // t 가 X 에 못 미치면 늘림 (모서리 완성)
      const 방t = 단위(고), Lt = 길이(고)
      const tt = (X[0] - 고.a[0]) * 방t[0] + (X[1] - 고.a[1]) * 방t[1]
      if (tt < 0) { 고.a = X.slice(); 고.이음 = (고.이음 || 0) + 1 }
      else if (tt > Lt) { 고.b = X.slice(); 고.이음 = (고.이음 || 0) + 1 }
    }
  }
  // 가로 · 세로 선은 늘이거나 줄여도 꼴 그대로(높이 유지)
  for (const s of 선) {
    if (s.꼴 === 'H') { const y = s.c[1]; s.a[1] = y; s.b[1] = y; if (s.a[0] > s.b[0]) { const t = s.a; s.a = s.b; s.b = t } }
    if (s.꼴 === 'V') { const x = s.c[0]; s.a[0] = x; s.b[0] = x; if (s.a[1] > s.b[1]) { const t = s.a; s.a = s.b; s.b = t } }
  }
}

/* ───────────── 사진에서 선분 (LSD 꼴) ───────────── */

/**
 * 밝기 경계로 선분 찾기 — 건물 사진용.
 * Grompone von Gioi 들의 LSD(2010) 와 ELSED(2022) 를 본떠: 경사 크기 · 방향 → 같은 방향 점 키우기 → 네모 맞춤 → 정렬 점 비율 검사 → 경사 무게 최소제곱.
 * @returns [[x1,y1,x2,y2,굵기, 경사평균], …]
 */
export function 선분찾기(판, o = {}) {
  const { w, h, d } = 판
  // 흐리기 (가우스 σ≈0.8, 3탭 두 번)
  const b = new Float32Array(w * h), t = new Float32Array(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; t[i] = 0.25 * d[x > 0 ? i - 1 : i] + 0.5 * d[i] + 0.25 * d[x < w - 1 ? i + 1 : i] }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; b[i] = 0.25 * t[y > 0 ? i - w : i] + 0.5 * t[i] + 0.25 * t[y < h - 1 ? i + w : i] }
  const 크 = new Float32Array(w * h), 방 = new Float32Array(w * h)
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x
    const gx = (b[i - w + 1] + 2 * b[i + 1] + b[i + w + 1]) - (b[i - w - 1] + 2 * b[i - 1] + b[i + w - 1])
    const gy = (b[i + w - 1] + 2 * b[i + w] + b[i + w + 1]) - (b[i - w - 1] + 2 * b[i - w] + b[i - w + 1])
    크[i] = Math.hypot(gx, gy) / 8
    방[i] = Math.atan2(gx, -gy)   // 경계(수준선) 방향 = 경사에 수직
  }
  const 문턱 = o.문턱 ?? 5.2   // LSD 의 ρ (밝기 2 단계 양자화 오차에서 나온 값 ≈ 5.2)
  const τ = (o.각 ?? 22.5) / D
  // 경사 큰 차례(칸으로 대충 정렬)
  const 칸수 = 1024
  let 최대 = 0
  for (let i = 0; i < 크.length; i++) if (크[i] > 최대) 최대 = 크[i]
  const 칸 = Array.from({ length: 칸수 }, () => [])
  for (let i = 0; i < 크.length; i++) if (크[i] > 문턱) 칸[Math.min(칸수 - 1, Math.floor((크[i] / 최대) * 칸수))].push(i)
  const 씀 = new Uint8Array(w * h)
  const 결과 = []
  const 최소길이 = o.최소길이 ?? Math.max(12, 0.012 * Math.max(w, h))
  const 지역 = []
  for (let k = 칸수 - 1; k >= 0; k--) for (const s of 칸[k]) {
    if (씀[s]) continue
    // 같은 방향 점 키우기
    지역.length = 0; 지역.push(s); 씀[s] = 1
    let sc = Math.cos(방[s]), ss = Math.sin(방[s]), 지각 = 방[s]
    for (let q = 0; q < 지역.length; q++) {
      const p = 지역[q], x = p % w, y = (p / w) | 0
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy
        if (xx < 1 || yy < 1 || xx >= w - 1 || yy >= h - 1) continue
        const r = yy * w + xx
        if (씀[r] || 크[r] <= 문턱) continue
        let df = 방[r] - 지각; while (df > Math.PI) df -= 2 * Math.PI; while (df < -Math.PI) df += 2 * Math.PI
        if (Math.abs(df) > τ) continue
        씀[r] = 1; 지역.push(r)
        sc += Math.cos(방[r]); ss += Math.sin(방[r]); 지각 = Math.atan2(ss, sc)
      }
    }
    if (지역.length < 10) continue
    // 네모(경사 무게) 맞춤
    let sw = 0, sx = 0, sy = 0
    for (const p of 지역) { const m = 크[p]; sw += m; sx += m * (p % w); sy += m * ((p / w) | 0) }
    const cx = sx / sw, cy = sy / sw
    let xx = 0, xy = 0, yy2 = 0
    for (const p of 지역) { const m = 크[p], ux = (p % w) - cx, uy = ((p / w) | 0) - cy; xx += m * ux * ux; xy += m * ux * uy; yy2 += m * uy * uy }
    const th = 0.5 * Math.atan2(2 * xy, xx - yy2)
    const ux = Math.cos(th), uy = Math.sin(th)
    let t0 = Infinity, t1 = -Infinity, n0 = Infinity, n1 = -Infinity
    for (const p of 지역) {
      const px = (p % w) - cx, py = ((p / w) | 0) - cy
      const tt = px * ux + py * uy, nn = -px * uy + py * ux
      if (tt < t0) t0 = tt; if (tt > t1) t1 = tt; if (nn < n0) n0 = nn; if (nn > n1) n1 = nn
    }
    const L = t1 - t0, 폭 = n1 - n0 + 1
    if (L < 최소길이) continue
    // 정렬 점 비율 검사: 네모 안 점들 중 방향이 맞는 비율
    const 넓 = Math.max(1, Math.round(폭))
    let 안 = 0, 맞 = 0
    const 걸음 = Math.max(1, L / 400)
    for (let tt = t0; tt <= t1; tt += 걸음) for (let nn = n0; nn <= n1; nn += 1) {
      const px = Math.round(cx + ux * tt - uy * nn), py = Math.round(cy + uy * tt + ux * nn)
      if (px < 1 || py < 1 || px >= w - 1 || py >= h - 1) continue
      안++
      const r = py * w + px
      let df = 방[r] - 지각; while (df > Math.PI) df -= 2 * Math.PI; while (df < -Math.PI) df += 2 * Math.PI
      if (크[r] > 문턱 * 0.6 && Math.abs(df) < τ) 맞++
    }
    if (!안 || 맞 / 안 < (o.비율 ?? 0.55) || 폭 > Math.max(6, 0.25 * L)) continue
    // 경계 자리 다듬기: 길이 방향을 따라 칸마다, 경사가 가장 센 곳(포물선 맞춤)으로 0.1픽셀
    const 점들 = [], 무 = []
    const 칸걸 = Math.max(1, L / 160)
    for (let tt = t0; tt <= t1; tt += 칸걸) {
      let 최 = -1, 자 = 0
      const 범 = Math.max(2, 넓 / 2 + 1.5)
      const 값 = []
      for (let nn = -범; nn <= 범; nn += 0.5) {
        const px = cx + ux * tt - uy * nn, py = cy + uy * tt + ux * nn
        const xi = Math.round(px), yi = Math.round(py)
        if (xi < 1 || yi < 1 || xi >= w - 1 || yi >= h - 1) { 값.push(0); continue }
        const v = 크[yi * w + xi]
        값.push(v)
        if (v > 최) { 최 = v; 자 = 값.length - 1 }
      }
      if (최 <= 문턱) continue
      let off = 자
      if (자 > 0 && 자 < 값.length - 1) { const a = 값[자 - 1], bb = 값[자], c2 = 값[자 + 1]; const 분 = a - 2 * bb + c2; if (분 < 0) off = 자 + 0.5 * (a - c2) / 분 }
      const nn = -범 + off * 0.5
      점들.push([cx + ux * tt - uy * nn, cy + uy * tt + ux * nn]); 무.push(최)
    }
    let 선 = 점들.length >= 4 ? 선맞춤(점들, 무) : { c: [cx, cy], d: [ux, uy] }
    const [qx, qy] = 선.c, [dx2, dy2] = 선.d
    const ta = (cx + ux * t0 - qx) * dx2 + (cy + uy * t0 - qy) * dy2, tb = (cx + ux * t1 - qx) * dx2 + (cy + uy * t1 - qy) * dy2
    let 평 = 0; for (const m of 무) 평 += m; 평 = 무.length ? 평 / 무.length : 0
    결과.push([qx + dx2 * ta, qy + dy2 * ta, qx + dx2 * tb, qy + dy2 * tb, 폭, 평])
  }
  return 결과
}
