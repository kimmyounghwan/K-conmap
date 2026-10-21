/**
 * 📷 사진 → 캐드 · ① 펴기 — 비스듬한 사진을 반듯하게 (2026-10-14 G287)
 *
 * 소장님: 「사진을 주면 캐드로 주는 도구, 그림을 그려서 줘도 캐드로」 · 「손그림, 사진 모두 정확도가 높아야 해」
 *        「무료로 도구를 만들어야 해」 · 「최대한 정교하게」 · 「건물사진도 캐드로」
 *
 * ■ 이 파일은 화면(DOM) 없이 숫자만 다룹니다 — 일꾼(사진캐드.worker.js)과 노드 시험(tools/시험_사진캐드.mjs)이 같이 씀.
 * ■ 그림은 { w, h, d: Float32Array(밝기 0~255) } 꼴 «판» 으로 주고받습니다.
 *
 *   종이찾기(판)            — 종이(도면) 네 모서리 자동: 밝은 덩이 → 볼록 껍질 → 가장 넓은 네모 → 변마다 선 맞춤 → 밝기 경사로 0.1픽셀까지
 *   비율재기(네모, w, h)     — 찍힌 네모의 «진짜 가로 : 세로» (Zhang 2006, 사진기 초점을 네모에서 거꾸로 셈)
 *   호모(src4, dst4) · 옮기(H, x, y) · 거꾸로(H)
 *   펴기(판, H, 너비, 높이)   — 나올 판의 (u, v) → 사진의 (x, y) 로 H 를 써서 두 줄 보간
 *   소실점펴기(선들, w, h)    — 건물 사진: 세로선 · 가로선이 모이는 두 점(소실점)을 찾아 정면으로 펴는 H
 */

/* ───────────── 작은 셈 ───────────── */

/** n×n 연립방정식 (부분 피벗 가우스 소거) — A 는 2차 배열, 망가뜨림 */
import { 선분찾기 } from './사진캐드_선.js'   // 종이찾기 — 흰 바탕 위 종이는 곧은 선 넷으로(서로 부르지만 함수만이라 괜찮음)
export function 풀기(A, b) {
  const n = b.length
  for (let c = 0; c < n; c++) {
    let p = c
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r
    if (Math.abs(A[p][c]) < 1e-14) return null
    if (p !== c) { const t = A[p]; A[p] = A[c]; A[c] = t; const tb = b[p]; b[p] = b[c]; b[c] = tb }
    for (let r = c + 1; r < n; r++) {
      const f = A[r][c] / A[c][c]
      if (!f) continue
      for (let k = c; k < n; k++) A[r][k] -= f * A[c][k]
      b[r] -= f * b[c]
    }
  }
  const x = new Array(n).fill(0)
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r]
    for (let k = r + 1; k < n; k++) s -= A[r][k] * x[k]
    x[r] = s / A[r][r]
  }
  return x
}

const 교 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const 점곱 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

/** 네 점 → 네 점 으로 보내는 3×3 (줄 차례 9칸, H[8]=1) */
export function 호모(src, dst) {
  const A = [], b = []
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = dst[i]
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u)
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v)
  }
  const h = 풀기(A, b)
  if (!h) return null
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1]
}

export function 옮기(H, x, y) {
  const w = H[6] * x + H[7] * y + H[8]
  return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w]
}

export function 곱(A, B) {
  const C = new Array(9)
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) C[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]
  return C
}

export function 거꾸로(H) {
  const [a, b, c, d, e, f, g, h, i] = H
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g
  const det = a * A + b * B + c * C
  if (Math.abs(det) < 1e-18) return null
  const m = [A, -(b * i - c * h), b * f - c * e, B, a * i - c * g, -(a * f - c * d), C, -(a * h - b * g), a * e - b * d]
  const s = m[8] !== 0 ? m[8] : det
  return m.map((v) => v / s)
}

/* ───────────── 판(밝기 그림) ───────────── */

/** RGBA(Uint8ClampedArray) → 밝기 판 */
export function 밝기판(rgba, w, h) {
  const d = new Float32Array(w * h)
  for (let i = 0, j = 0; i < d.length; i++, j += 4) d[i] = 0.299 * rgba[j] + 0.587 * rgba[j + 1] + 0.114 * rgba[j + 2]
  return { w, h, d }
}

/** 두 줄 보간으로 한 점 */
export function 집기(판, x, y) {
  const { w, h, d } = 판
  if (x < 0) x = 0; else if (x > w - 1.001) x = w - 1.001
  if (y < 0) y = 0; else if (y > h - 1.001) y = h - 1.001
  const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = y0 * w + x0
  return (d[i] * (1 - fx) + d[i + 1] * fx) * (1 - fy) + (d[i + w] * (1 - fx) + d[i + w + 1] * fx) * fy
}

/** 넓이 평균으로 줄이기 (k 배) */
export function 줄이기(판, k) {
  const { w, h, d } = 판
  const W = Math.max(1, Math.floor(w / k)), Hh = Math.max(1, Math.floor(h / k))
  const o = new Float32Array(W * Hh)
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    let s = 0, n = 0
    const ys = Math.floor(y * k), ye = Math.min(h, Math.floor((y + 1) * k)), xs = Math.floor(x * k), xe = Math.min(w, Math.floor((x + 1) * k))
    for (let yy = ys; yy < ye; yy++) for (let xx = xs; xx < xe; xx++) { s += d[yy * w + xx]; n++ }
    o[y * W + x] = n ? s / n : 255
  }
  return { w: W, h: Hh, d: o }
}

/** H: 나올 판 (u,v) → 사진 (x,y) · 두 줄 보간 · 밖은 255(흰 종이) */
export function 펴기(판, H, W, Hh, 밖 = 255) {
  const o = new Float32Array(W * Hh)
  const { w, h } = 판
  for (let v = 0; v < Hh; v++) {
    for (let u = 0; u < W; u++) {
      const q = H[6] * u + H[7] * v + H[8]
      const x = (H[0] * u + H[1] * v + H[2]) / q, y = (H[3] * u + H[4] * v + H[5]) / q
      o[v * W + u] = (x < -0.5 || y < -0.5 || x > w - 0.5 || y > h - 0.5) ? 밖 : 집기(판, x, y)
    }
  }
  return { w: W, h: Hh, d: o }
}

/* ───────────── 종이 네 모서리 ───────────── */

function 오츠(값들, 크기 = 256) {
  const hist = new Float64Array(크기)
  for (const v of 값들) hist[Math.max(0, Math.min(크기 - 1, v | 0))]++
  let 전 = 0, 합 = 0
  for (let i = 0; i < 크기; i++) { 전 += hist[i]; 합 += i * hist[i] }
  let wB = 0, sB = 0, 최 = -1, T = 128
  for (let t = 0; t < 크기; t++) {
    wB += hist[t]; if (!wB) continue
    const wF = 전 - wB; if (!wF) break
    sB += t * hist[t]
    const mB = sB / wB, mF = (합 - sB) / wF, s = wB * wF * (mB - mF) * (mB - mF)
    if (s > 최) { 최 = s; T = t }
  }
  return T
}
export { 오츠 }

function 볼록껍질(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (p.length < 3) return p
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lo = [], up = []
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q) }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q) }
  up.pop(); lo.pop()
  return lo.concat(up)
}

const 넓이 = (q) => { let s = 0; for (let i = 0; i < q.length; i++) { const a = q[i], b = q[(i + 1) % q.length]; s += a[0] * b[1] - b[0] * a[1] } return Math.abs(s) / 2 }

/** 점들에 맞춘 곧은 선 (전체 최소제곱) → { c:[x,y], d:[dx,dy] 단위, 흩:수직 흩어짐 } */
export function 선맞춤(pts, 무게) {
  let sw = 0, sx = 0, sy = 0
  for (let i = 0; i < pts.length; i++) { const w = 무게 ? 무게[i] : 1; sw += w; sx += w * pts[i][0]; sy += w * pts[i][1] }
  if (!sw) return null
  const cx = sx / sw, cy = sy / sw
  let xx = 0, xy = 0, yy = 0
  for (let i = 0; i < pts.length; i++) { const w = 무게 ? 무게[i] : 1, dx = pts[i][0] - cx, dy = pts[i][1] - cy; xx += w * dx * dx; xy += w * dx * dy; yy += w * dy * dy }
  const th = 0.5 * Math.atan2(2 * xy, xx - yy)
  const dx = Math.cos(th), dy = Math.sin(th)
  let e = 0
  for (let i = 0; i < pts.length; i++) { const w = 무게 ? 무게[i] : 1, v = -(pts[i][0] - cx) * dy + (pts[i][1] - cy) * dx; e += w * v * v }
  return { c: [cx, cy], d: [dx, dy], 흩: Math.sqrt(e / sw) }
}

function 만남(L1, L2) {
  const [x1, y1] = L1.c, [a1, b1] = L1.d, [x2, y2] = L2.c, [a2, b2] = L2.d
  const det = a1 * (-b2) - b1 * (-a2)
  if (Math.abs(det) < 1e-9) return null
  const t = ((x2 - x1) * (-b2) - (y2 - y1) * (-a2)) / det
  return [x1 + a1 * t, y1 + b1 * t]
}
export { 만남 }

/** 모서리 넷을 왼위 · 오른위 · 오른아래 · 왼아래 차례로 */
export function 네모차례(q) {
  const cx = q.reduce((s, p) => s + p[0], 0) / 4, cy = q.reduce((s, p) => s + p[1], 0) / 4
  const r = q.slice().sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx))
  // atan2 차례: 왼위(-135°) → 오른위(-45°) → 오른아래(45°) → 왼아래(135°) — 가장 왼위(x+y 가 작은) 것부터
  let k = 0, m = Infinity
  for (let i = 0; i < 4; i++) { const s = r[i][0] + r[i][1]; if (s < m) { m = s; k = i } }
  return [r[k], r[(k + 1) % 4], r[(k + 2) % 4], r[(k + 3) % 4]]
}

/**
 * 종이 네 모서리 찾기 — 큰 사진은 줄여서 찾고, 원래 크기에서 변마다 밝기 경사로 다듬습니다.
 * @returns { 네모: [[x,y]×4] (왼위부터 시계), 믿음: 0~1, 까닭 }
 */
export function 종이찾기(판) {
  const { w, h } = 판
  const k = Math.max(1, Math.max(w, h) / 480)
  const 작 = 줄이기(판, k)
  const W = 작.w, H = 작.h, d = 작.d
  // 3×3 흐리기
  const b = new Float32Array(W * H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let s = 0, n = 0
    for (let yy = Math.max(0, y - 1); yy <= Math.min(H - 1, y + 1); yy++) for (let xx = Math.max(0, x - 1); xx <= Math.min(W - 1, x + 1); xx++) { s += d[yy * W + xx]; n++ }
    b[y * W + x] = s / n
  }
  const T = 오츠(b)
  const 밝 = new Uint8Array(W * H)
  for (let i = 0; i < b.length; i++) 밝[i] = b[i] > T ? 1 : 0
  // 글자 · 선 구멍을 메우려고 밝은 칸을 닫기(늘였다 줄이기 2칸)
  const 닫 = 닫기(밝, W, H, 2)
  // 가장 큰 밝은 덩이 (4이웃)
  const lab = new Int32Array(W * H).fill(-1)
  let 최대 = 0, 최대번 = -1, 번 = 0
  const 줄 = new Int32Array(W * H)
  for (let s = 0; s < W * H; s++) {
    if (!닫[s] || lab[s] >= 0) continue
    let qh = 0, qt = 0; 줄[qt++] = s; lab[s] = 번; let n = 0
    while (qh < qt) {
      const p = 줄[qh++]; n++
      const x = p % W, y = (p / W) | 0
      if (x > 0 && 닫[p - 1] && lab[p - 1] < 0) { lab[p - 1] = 번; 줄[qt++] = p - 1 }
      if (x < W - 1 && 닫[p + 1] && lab[p + 1] < 0) { lab[p + 1] = 번; 줄[qt++] = p + 1 }
      if (y > 0 && 닫[p - W] && lab[p - W] < 0) { lab[p - W] = 번; 줄[qt++] = p - W }
      if (y < H - 1 && 닫[p + W] && lab[p + W] < 0) { lab[p + W] = 번; 줄[qt++] = p + W }
    }
    if (n > 최대) { 최대 = n; 최대번 = 번 }
    번++
  }
  const 온 = [[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]]
  if (최대번 < 0 || 최대 < 0.12 * W * H) return { 네모: 온, 믿음: 0, 까닭: '종이를 못 찾음' }
  // 덩이 가장자리 점
  const 가 = []
  let 닿음 = 0
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = y * W + x
    if (lab[p] !== 최대번) continue
    const 가장자리 = x === 0 || y === 0 || x === W - 1 || y === H - 1 || lab[p - 1] !== 최대번 || lab[p + 1] !== 최대번 || lab[p - W] !== 최대번 || lab[p + W] !== 최대번
    if (가장자리) { 가.push([x + 0.5, y + 0.5]); if (x === 0 || y === 0 || x === W - 1 || y === H - 1) 닿음++ }
  }
  const 껍 = 볼록껍질(가)
  // 껍질 꼭짓점이 많으면 고르게 줄임
  let 후 = 껍
  if (후.length > 48) { const s = 후.length / 48; 후 = Array.from({ length: 48 }, (_, i) => 껍[Math.floor(i * s)]) }
  // 가장 넓은 네모 (꼭짓점 넷 고르기)
  let 최넓 = 0, 고름 = null
  const n = 후.length
  for (let a = 0; a < n; a++) for (let bb = a + 1; bb < n; bb++) for (let c = bb + 1; c < n; c++) for (let e = c + 1; e < n; e++) {
    const s = 넓이([후[a], 후[bb], 후[c], 후[e]])
    if (s > 최넓) { 최넓 = s; 고름 = [a, bb, c, e] }
  }
  if (!고름) return { 네모: 온, 믿음: 0, 까닭: '네모가 안 됨' }
  // 변마다: 그 사이 껍질 가장자리 점(덩이 가장자리)으로 선 맞춤 → 이웃 변과 만나는 점
  const 꼭 = 고름.map((i) => 후[i])
  const 변선 = []
  for (let i = 0; i < 4; i++) {
    const A = 꼭[i], B = 꼭[(i + 1) % 4]
    const L = Math.hypot(B[0] - A[0], B[1] - A[1])
    const ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L
    const 고른 = []
    for (const p of 가) {
      const t = (p[0] - A[0]) * ux + (p[1] - A[1]) * uy
      const dd = -(p[0] - A[0]) * uy + (p[1] - A[1]) * ux
      if (t > 0.12 * L && t < 0.88 * L && Math.abs(dd) < Math.max(3, 0.02 * L)) 고른.push(p)
    }
    변선.push(고른.length >= 8 ? 선맞춤(고른) : { c: [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], d: [ux, uy] })
  }
  let 네모 = []
  for (let i = 0; i < 4; i++) { const p = 만남(변선[(i + 3) % 4], 변선[i]); 네모.push(p || 꼭[i]) }
  네모 = 네모.map((p) => [p[0] * k, p[1] * k])
  // 원래 크기에서 다듬기: 변을 따라 수직으로 밝기 경사가 가장 센 곳
  네모 = 변다듬기(판, 네모)
  네모 = 네모차례(네모)
  const 비 = 넓이(네모) / (w * h)
  const 볼록 = 볼록껍질(네모).length === 4
  let 믿음 = 볼록 ? Math.min(1, 비 / 0.25) : 0
  if (닿음 > 0.5 * 가.length) 믿음 *= 0.3   // 종이가 화면을 꽉 채워 가장자리가 사진 끝이면 못 믿음
  // 밝은 덩이가 사진 끝에 닿음(흰 벽 · 흰 책상 위의 종이 · 안내판) → 곧은 선 넷으로 된 네모를 따로 찾아 봄
  const 끝닿음 = 네모.filter(([x, y]) => x < 0.012 * w || y < 0.012 * h || x > 0.988 * w || y > 0.988 * h).length
  // 종이가 사진을 거의 꽉 채움(스캔 · 바짝 찍음) → 사진 전체가 종이(안의 그림 테두리를 종이로 잘못 잡지 않게)
  const 덩이비 = 최대 / (W * H)
  if (덩이비 > 0.86 && (끝닿음 >= 2 || 닿음 > 0.3 * 가.length)) return { 네모: 온, 믿음: 0.6, 까닭: '', 방법: '꽉참' }
  if (끝닿음 >= 1 || 닿음 > 0.08 * 가.length) {
    const 선 = 선네모(작)
    if (선 && 선.점 > 0.45) {
      let q = 선.네모.map((p) => [p[0] * k, p[1] * k])
      q = 네모차례(종이로넓히기(판, 네모차례(변다듬기(판, q)), T))
      return { 네모: q, 믿음: Math.max(0.55, Math.min(0.95, 선.점)), 까닭: '', 방법: '선' }
    }
    if (끝닿음 >= 1) 믿음 = Math.min(믿음, 0.45)
  }
  if (믿음 < 0.5) return { 네모: 온, 믿음, 까닭: '종이 가장자리가 흐림' }   // 못 믿으면 사진 끝으로(화면 안내 «사진 끝으로 두었습니다» 와 같게)
  return { 네모, 믿음, 까닭: 믿음 > 0.5 ? '' : '종이 가장자리가 흐림' }
}

/**
 * ⏹ G358 (2026-10-21) «선» 으로 찾은 네모가 종이 «안쪽» 에 걸렸을 때 — 종이 끝까지 넓힘
 *   소장님 원룸 평면 사진: 곧은 선 넷이 «도면의 바깥 벽 · 16,000 치수선» 이라 자른 틀이 치수 숫자 한가운데 · 왼쪽 벽 바로 위를 지나
 *   → 치수를 못 읽어 «크기를 모릅니다» · 왼쪽 바깥 벽이 사진 끝에 붙어 지워짐.
 *   변마다 바깥으로 조금씩 나가며 «아직 밝은 종이(문턱 T 넘는 점이 75 % 넘게)» 인 동안 넓힘(최대 짧은 변의 8 %).
 *   변이 걸린 선(벽 · 치수선) 자체는 건너뜀(짧은 변의 2 % 안). 진짜 종이 끝(바깥이 책상 · 다른 사진)이면 그대로 ·
 *   끝까지 밝기만 하면(넓은 흰 종이 · 흰 벽 — 잉크 없는 곳) 짧은 변의 3 % 만 넓힘.
 */
export function 종이로넓히기(판, 네모, T) {
  const { w, h } = 판
  const cx = 네모.reduce((a, p) => a + p[0], 0) / 4, cy = 네모.reduce((a, p) => a + p[1], 0) / 4
  const 최대 = 0.08 * Math.min(w, h), 걸음 = Math.max(2, 0.004 * Math.max(w, h))
  const 변선 = []
  for (let i = 0; i < 4; i++) {
    const A = 네모[i], B = 네모[(i + 1) % 4]
    const L = Math.hypot(B[0] - A[0], B[1] - A[1])
    if (L < 20) return 네모
    const ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L
    let nx = -uy, ny = ux
    if (((A[0] + B[0]) / 2 - cx) * nx + ((A[1] + B[1]) / 2 - cy) * ny < 0) { nx = -nx; ny = -ny }
    // 변이 걸린 선(벽 · 치수선) 자체는 건너뜀(짧은 변의 2 % 안) → 밝은 종이가 나오면 그 종이가 끝날 때까지
    const 선폭 = 0.02 * Math.min(w, h)
    let 둠 = 0, 끝찾음 = false, 종이봄 = false
    for (let o = 걸음; o <= 최대; o += 걸음) {
      let 밝 = 0, 셈 = 0
      for (let s = 0; s < 40; s++) {
        const t = (0.15 + (0.7 * s) / 39) * L, x = A[0] + ux * t + nx * o, y = A[1] + uy * t + ny * o
        if (x < 0 || y < 0 || x > w - 1 || y > h - 1) continue
        셈++; if (집기(판, x, y) > T) 밝++
      }
      const 종이 = 셈 >= 30 && 밝 >= 0.75 * 셈
      if (!종이봄) { if (종이) { 종이봄 = true; 둠 = o; continue } if (셈 < 30 || o > 선폭) break; continue }
      if (!종이) { 끝찾음 = true; break }   // 종이 끝(다른 그림 · 책상) 또는 사진 끝
      둠 = o
    }
    if (!종이봄) 둠 = 0                                   // 바깥이 처음부터 종이가 아님(진짜 종이 끝) → 그대로
    else if (!끝찾음) 둠 = Math.min(둠, 0.03 * Math.min(w, h))   // 끝없이 밝음(넓은 흰 종이 · 흰 벽) — 잉크가 없는 곳이라 조금(3 %)만
    변선.push({ c: [(A[0] + B[0]) / 2 + nx * 둠, (A[1] + B[1]) / 2 + ny * 둠], d: [ux, uy] })
  }
  const o = []
  for (let i = 0; i < 4; i++) o.push(만남(변선[(i + 3) % 4], 변선[i]) || 네모[i])   // 모서리는 사진 밖이어도 그대로(펴기가 밖을 흰색으로 채움 · 전과 같음)
  return o
}

/** 곧은 선 넷으로 된 큰 네모(종이 · 안내판 · 액자) — 가로쪽 둘 × 세로쪽 둘 을 엮어 «넓이 × 변이 선으로 채워진 정도» 가 가장 큰 것 */
function 선네모(작) {
  const { w: W, h: H } = 작
  const 선 = 선분찾기(작, { 최소길이: Math.max(16, 0.08 * Math.max(W, H)) })
  if (!선 || 선.length < 4) return null
  const 가로 = [], 세로 = []
  for (const [x1, y1, x2, y2] of 선) {
    const L = Math.hypot(x2 - x1, y2 - y1), a = Math.abs(Math.atan2(y2 - y1, x2 - x1)) * 180 / Math.PI
    const 꼴 = { a: [x1, y1], b: [x2, y2], L, c: [(x1 + x2) / 2, (y1 + y2) / 2], d: [(x2 - x1) / L, (y2 - y1) / L] }
    if (a < 40 || a > 140) 가로.push(꼴); else if (a > 50 && a < 130) 세로.push(꼴)
  }
  const 위 = (L) => L.sort((p, q) => q.L - p.L).slice(0, 14)
  const G = 위(가로), V = 위(세로)
  const 채움 = (A, B) => {   // 변 A→B 위에 놓인 선분 길이 / 변 길이
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]); if (L < 1) return 0
    const ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L
    const 칸 = new Uint8Array(Math.ceil(L))
    for (const s of 선) {
      for (const [p, q] of [[[s[0], s[1]], [s[2], s[3]]]]) {
        const d1 = -(p[0] - A[0]) * uy + (p[1] - A[1]) * ux, d2 = -(q[0] - A[0]) * uy + (q[1] - A[1]) * ux
        if (Math.abs(d1) > 3 || Math.abs(d2) > 3) continue
        let t1 = (p[0] - A[0]) * ux + (p[1] - A[1]) * uy, t2 = (q[0] - A[0]) * ux + (q[1] - A[1]) * uy
        if (t1 > t2) [t1, t2] = [t2, t1]
        for (let t = Math.max(0, Math.floor(t1)); t < Math.min(칸.length, Math.ceil(t2)); t++) 칸[t] = 1
      }
    }
    let n = 0; for (const v of 칸) n += v
    return n / 칸.length
  }
  let 최 = null
  for (let i = 0; i < G.length; i++) for (let j = 0; j < G.length; j++) {
    if (G[i].c[1] >= G[j].c[1] - 0.15 * H) continue
    for (let a = 0; a < V.length; a++) for (let b = 0; b < V.length; b++) {
      if (V[a].c[0] >= V[b].c[0] - 0.15 * W) continue
      const 꼭 = [만남(G[i], V[a]), 만남(G[i], V[b]), 만남(G[j], V[b]), 만남(G[j], V[a])]
      if (꼭.some((p) => !p || p[0] < -0.02 * W || p[1] < -0.02 * H || p[0] > 1.02 * W || p[1] > 1.02 * H)) continue
      if (볼록껍질(꼭).length !== 4) continue
      const 비 = 넓이(꼭) / (W * H)
      if (비 < 0.12) continue
      // 종이 · 안내판 꼴: 가로:세로 2.2 배 안(그림 속 계단 · 복도 같은 가늘고 긴 네모를 종이로 잡지 않게)
      const 가로길 = (Math.hypot(꼭[1][0] - 꼭[0][0], 꼭[1][1] - 꼭[0][1]) + Math.hypot(꼭[2][0] - 꼭[3][0], 꼭[2][1] - 꼭[3][1])) / 2
      const 세로길 = (Math.hypot(꼭[3][0] - 꼭[0][0], 꼭[3][1] - 꼭[0][1]) + Math.hypot(꼭[2][0] - 꼭[1][0], 꼭[2][1] - 꼭[1][1])) / 2
      if (Math.max(가로길, 세로길) > 2.2 * Math.min(가로길, 세로길)) continue
      const 채 = [0, 1, 2, 3].map((k) => 채움(꼭[k], 꼭[(k + 1) % 4]))
      const 점 = Math.min(...채) * 0.6 + (채.reduce((p, q) => p + q, 0) / 4) * 0.4
      const 총 = 점 * Math.sqrt(비)
      if (!최 || 총 > 최.총) 최 = { 네모: 꼭, 점, 총 }
    }
  }
  return 최
}

function 닫기(m, W, H, r) {
  const 늘 = (src, 켬) => {
    const o = new Uint8Array(W * H)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let v = 켬 ? 0 : 1
      for (let yy = Math.max(0, y - r); yy <= Math.min(H - 1, y + r) && v !== (켬 ? 1 : 0); yy++)
        for (let xx = Math.max(0, x - r); xx <= Math.min(W - 1, x + r); xx++) {
          if (켬 && src[yy * W + xx]) { v = 1; break }
          if (!켬 && !src[yy * W + xx]) { v = 0; break }
        }
      o[y * W + x] = v
    }
    return o
  }
  return 늘(늘(m, true), false)
}

/** 네 변을 원래 사진에서 밝기 경사로 다시 맞춤 (0.1 픽셀 안팎) */
export function 변다듬기(판, 네모) {
  const 변선 = []
  for (let i = 0; i < 4; i++) {
    const A = 네모[i], B = 네모[(i + 1) % 4]
    const L = Math.hypot(B[0] - A[0], B[1] - A[1])
    if (L < 20) return 네모
    const ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L, nx = -uy, ny = ux
    const 범 = Math.max(4, Math.min(14, L * 0.012))
    const pts = [], 무 = []
    const N = Math.min(240, Math.floor(L / 3))
    for (let s = 0; s < N; s++) {
      const t = 0.1 * L + (0.8 * L * s) / Math.max(1, N - 1)
      const px = A[0] + ux * t, py = A[1] + uy * t
      // 0.5 픽셀 걸음으로 밝기를 읽고, 이웃 차(경사)가 가장 큰 곳을 포물선으로 다듬음
      const 값 = [], 경 = []
      for (let o = -범 - 0.5; o <= 범 + 0.5; o += 0.5) 값.push(집기(판, px + nx * o, py + ny * o))
      for (let i = 1; i < 값.length - 1; i++) 경.push(Math.abs(값[i + 1] - 값[i - 1]))
      let 최 = 0, k = 0
      for (let i = 0; i < 경.length; i++) if (경[i] > 최) { 최 = 경[i]; k = i }
      let off = k
      if (k > 0 && k < 경.length - 1) { const a = 경[k - 1], b = 경[k], c = 경[k + 1], 분 = a - 2 * b + c; if (분 < 0) off = k + 0.5 * (a - c) / 분 }
      const 자 = -범 + off * 0.5
      if (최 > 12) { pts.push([px + nx * 자, py + ny * 자]); 무.push(최) }
    }
    if (pts.length < 10) { 변선.push({ c: [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], d: [ux, uy] }); continue }
    // 한 번 맞추고 멀리 벗어난 점을 빼고 다시
    let L1 = 선맞춤(pts, 무)
    const 남 = [], 남무 = []
    for (let i = 0; i < pts.length; i++) {
      const dd = Math.abs(-(pts[i][0] - L1.c[0]) * L1.d[1] + (pts[i][1] - L1.c[1]) * L1.d[0])
      if (dd < Math.max(1.5, 2.5 * L1.흩)) { 남.push(pts[i]); 남무.push(무[i]) }
    }
    if (남.length >= 8) L1 = 선맞춤(남, 남무)
    변선.push(L1)
  }
  const o = []
  for (let i = 0; i < 4; i++) { const p = 만남(변선[(i + 3) % 4], 변선[i]); o.push(p || 네모[i]) }
  return o
}

/* ───────────── 진짜 가로:세로 (Zhang) ───────────── */

/**
 * 찍힌 네모(왼위·오른위·오른아래·왼아래)의 실제 가로/세로 비율.
 * Zhang, «Whiteboard scanning and image enhancement» (2006): 사진 가운데를 주점으로 보고 초점 f 를 네모에서 셈.
 * f 가 엉뚱하면(정면에 가까워 셈이 흔들림) 보통 폰 초점(긴 변 × 0.85)으로 셈.
 */
export function 비율재기(네모, w, h) {
  const u0 = w / 2, v0 = h / 2
  const [TL, TR, BR, BL] = 네모
  const m1 = [TL[0], TL[1], 1], m2 = [TR[0], TR[1], 1], m3 = [BL[0], BL[1], 1], m4 = [BR[0], BR[1], 1]
  const k2 = 점곱(교(m1, m4), m3) / 점곱(교(m2, m4), m3)
  const k3 = 점곱(교(m1, m4), m2) / 점곱(교(m3, m4), m2)
  const n2 = [k2 * m2[0] - m1[0], k2 * m2[1] - m1[1], k2 * m2[2] - m1[2]]
  const n3 = [k3 * m3[0] - m1[0], k3 * m3[1] - m1[1], k3 * m3[2] - m1[2]]
  const 긴 = Math.max(w, h)
  let f = null
  if (Math.abs(n2[2]) > 1e-9 && Math.abs(n3[2]) > 1e-9) {
    const f2 = -((n2[0] * n3[0] - (n2[0] * n3[2] + n2[2] * n3[0]) * u0 + n2[2] * n3[2] * u0 * u0) +
                 (n2[1] * n3[1] - (n2[1] * n3[2] + n2[2] * n3[1]) * v0 + n2[2] * n3[2] * v0 * v0)) / (n2[2] * n3[2])
    if (f2 > 0) f = Math.sqrt(f2)
  }
  const f쓴 = f && f > 0.35 * 긴 && f < 3.5 * 긴 ? f : 0.85 * 긴
  const q = (n) => {
    const x = (n[0] - u0 * n[2]) / f쓴, y = (n[1] - v0 * n[2]) / f쓴
    return x * x + y * y + n[2] * n[2]
  }
  const r = Math.sqrt(q(n2) / q(n3))
  return { 비율: isFinite(r) && r > 0 ? r : 1, 초점: f쓴, 초점셈됨: f쓴 === f }
}

/** 종이 크기 이름 → 가로 × 세로 mm (세로로 둔 것) */
export const 종이크기 = {
  A4: [210, 297], A3: [297, 420], A2: [420, 594], A1: [594, 841], A0: [841, 1189], B4: [257, 364], B5: [182, 257],
}

/**
 * 네모 → 펴는 H 와 나올 크기. 종이 크기를 알면 그 비율, 모르면 비율재기.
 * @returns { H(나올→사진), 너비, 높이, 비율 }
 */
export function 펴는틀(네모, w, h, o = {}) {
  const [TL, TR, BR, BL] = 네모
  const 위 = Math.hypot(TR[0] - TL[0], TR[1] - TL[1]), 아래 = Math.hypot(BR[0] - BL[0], BR[1] - BL[1])
  const 왼 = Math.hypot(BL[0] - TL[0], BL[1] - TL[1]), 오른 = Math.hypot(BR[0] - TR[0], BR[1] - TR[1])
  let 비율
  if (o.종이 && 종이크기[o.종이]) {
    const [a, b] = 종이크기[o.종이]
    비율 = (위 + 아래) / (왼 + 오른) >= 1 ? b / a : a / b
  } else if (o.비율) 비율 = o.비율
  else 비율 = 비율재기(네모, w, h).비율
  // 사진 속 픽셀이 줄지 않게(가장 긴 변 기준) · 너무 크지 않게
  const 최대 = o.최대 || 3200
  let 너비 = Math.max(위, 아래), 높이 = 너비 / 비율
  if (높이 < Math.max(왼, 오른)) { 높이 = Math.max(왼, 오른); 너비 = 높이 * 비율 }
  const s = Math.min(1, 최대 / Math.max(너비, 높이))
  너비 = Math.max(16, Math.round(너비 * s)); 높이 = Math.max(16, Math.round(높이 * s))
  const H = 호모([[0, 0], [너비, 0], [너비, 높이], [0, 높이]], [TL, TR, BR, BL])
  return { H, 너비, 높이, 비율 }
}

/* ───────────── 건물 사진: 소실점으로 정면 펴기 ───────────── */

/** 선분 [x1,y1,x2,y2] → 동차 직선 (정규화) */
function 직선(s) {
  const l = 교([s[0], s[1], 1], [s[2], s[3], 1])
  const n = Math.hypot(l[0], l[1]) || 1
  return [l[0] / n, l[1] / n, l[2] / n]
}

/** 선분이 소실점 v(동차) 쪽을 가리키는 정도 — 선분 가운데에서 v 로 가는 방향과 선분 방향의 각(라디안) */
function 어긋각(s, v) {
  const mx = (s[0] + s[2]) / 2, my = (s[1] + s[3]) / 2
  let dx, dy
  if (Math.abs(v[2]) < 1e-12) { dx = v[0]; dy = v[1] } else { dx = v[0] / v[2] - mx; dy = v[1] / v[2] - my }
  const sx = s[2] - s[0], sy = s[3] - s[1]
  const c = Math.abs(dx * sx + dy * sy) / (Math.hypot(dx, dy) * Math.hypot(sx, sy) || 1)
  return Math.acos(Math.min(1, c))
}

/** 여러 선이 모이는 점(동차) — Σ w (l·v)² 가장 작게 (3×3 가장 작은 고윳값의 벡터) */
function 모이는점(선들, 무게) {
  const M = [0, 0, 0, 0, 0, 0, 0, 0, 0]
  선들.forEach((l, i) => { const w = 무게[i]; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) M[r * 3 + c] += w * l[r] * l[c] })
  // 거듭제곱법으로 (M 의 역)의 가장 큰 고유벡터 = M 의 가장 작은 고유벡터
  const I = 거꾸로(M.map((v, i) => v + (i % 4 === 0 ? 1e-12 : 0)))
  if (!I) return null
  let v = [0.3, 0.5, 0.8]
  for (let it = 0; it < 60; it++) {
    const n = [I[0] * v[0] + I[1] * v[1] + I[2] * v[2], I[3] * v[0] + I[4] * v[1] + I[5] * v[2], I[6] * v[0] + I[7] * v[1] + I[8] * v[2]]
    const s = Math.hypot(n[0], n[1], n[2]) || 1
    v = [n[0] / s, n[1] / s, n[2] / s]
  }
  return v
}

/**
 * 건물 사진: 선분들에서 세로 · 가로 소실점을 찾아 «정면으로 편» H 를 만듭니다.
 * @param 선들 [[x1,y1,x2,y2], …] (사진 픽셀)
 * @returns { H(나올→사진), 너비, 높이, 세로점, 가로점, 세로선:[번호], 가로선:[번호], 초점 } 또는 null
 */
export function 소실점펴기(선들, w, h, o = {}) {
  const 긴 = Math.max(w, h)
  const 쓸 = 선들.map((s, i) => ({ s, i, L: Math.hypot(s[2] - s[0], s[3] - s[1]), l: 직선(s), a: Math.atan2(s[3] - s[1], s[2] - s[0]) }))
    .filter((x) => x.L > 0.02 * 긴)
  if (쓸.length < 6) return null
  const 세로꼴 = 쓸.filter((x) => Math.abs(Math.abs(Math.sin(x.a)) - 1) < 0.25)   // 화면에서 거의 세로(±40°)
  const 가로꼴 = 쓸.filter((x) => Math.abs(Math.sin(x.a)) < 0.6)                  // 거의 가로(±37°)
  const 찾기 = (무리) => {
    if (무리.length < 2) return null
    let 최 = -1, 고름 = null
    // 긴 선끼리 짝 지어 시험 (결정적으로: 긴 차례 위 40개)
    const 위 = 무리.slice().sort((a, b) => b.L - a.L).slice(0, 40)
    for (let i = 0; i < 위.length; i++) for (let j = i + 1; j < 위.length; j++) {
      const v = 교(위[i].l, 위[j].l)
      const n = Math.hypot(v[0], v[1], v[2]); if (!n) continue
      const vv = [v[0] / n, v[1] / n, v[2] / n]
      let s = 0
      for (const x of 무리) if (어긋각(x.s, vv) < 0.035) s += x.L
      if (s > 최) { 최 = s; 고름 = vv }
    }
    if (!고름) return null
    // 다듬기 두 번
    let v = 고름
    for (let it = 0; it < 3; it++) {
      const 안 = 무리.filter((x) => 어긋각(x.s, v) < (it ? 0.02 : 0.035))
      if (안.length < 2) break
      const vv = 모이는점(안.map((x) => x.l), 안.map((x) => x.L))
      if (vv) v = vv
    }
    const 안 = 무리.filter((x) => 어긋각(x.s, v) < 0.025)
    return { v, 안 }
  }
  const V = 찾기(세로꼴), Hh = 찾기(가로꼴)
  if (!V || !Hh || V.안.length < 2 || Hh.안.length < 2) return null
  const u0 = w / 2, v0 = h / 2
  // 두 소실점이 직교한다는 데서 초점: (vV - c)·(vH - c) = -f²  (둘 다 유한할 때)
  let f = null
  const vv = V.v, vh = Hh.v
  if (Math.abs(vv[2]) > 1e-9 && Math.abs(vh[2]) > 1e-9) {
    const a = [vv[0] / vv[2] - u0, vv[1] / vv[2] - v0], b = [vh[0] / vh[2] - u0, vh[1] / vh[2] - v0]
    const f2 = -(a[0] * b[0] + a[1] * b[1])
    if (f2 > 0) f = Math.sqrt(f2)
  }
  const f쓴 = o.초점 || (f && f > 0.4 * 긴 && f < 3 * 긴 ? f : 0.85 * 긴)
  const Kinv = (p) => [(p[0] - u0 * p[2]) / f쓴, (p[1] - v0 * p[2]) / f쓴, p[2]]
  // 정면 판의 X(가로) · Y(세로, 아래로) 방향 = 사진 속 소실점 방향. 크기를 K⁻¹ 로 맞춰야 가로:세로가 맞음
  const oP = [u0, v0, 1]
  /* 방향(부호): 원점(사진 가운데)에서 그 방향으로 조금 가면 사진에서 오른쪽(가로) · 아래(세로) 로 가게 */
  const 방향 = (v, 기준) => {
    const d = Kinv(v); const n = Math.hypot(d[0], d[1], d[2]) || 1
    let h = [v[0] / n, v[1] / n, v[2] / n]
    const e = 1e-3
    const p = [oP[0] + e * h[0] * f쓴, oP[1] + e * h[1] * f쓴, oP[2] + e * h[2] * f쓴]
    const 감 = 기준 === 'x' ? p[0] / p[2] - u0 : p[1] / p[2] - v0
    if (감 < 0) h = [-h[0], -h[1], -h[2]]
    return h
  }
  const hx = 방향(vh, 'x'), hy = 방향(vv, 'y')
  // 원점 = 사진 가운데. 열벡터 [hx hy o] 가 정면(X,Y,1) → 사진
  // 정면 좌표에서 1 = 사진 가운데 깊이에서 픽셀 1/f 배 … 원점 열의 크기를 맞춰 정면 1 단위 ≈ 사진 1 픽셀
  const Kd = Kinv(oP), nd = Math.hypot(Kd[0], Kd[1], Kd[2])
  const sc = 1 / (f쓴 * nd)
  const G = [hx[0] * sc, hy[0] * sc, oP[0], hx[1] * sc, hy[1] * sc, oP[1], hx[2] * sc, hy[2] * sc, oP[2]]
  // G: 정면 (X,Y) → 사진. 쓴 선들(세로 · 가로 무리)이 펼쳐진 범위로 판을 자름
  const Gi = 거꾸로(G)
  if (!Gi) return null
  const 안선 = [...V.안, ...Hh.안]
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const x of 안선) for (const [px, py] of [[x.s[0], x.s[1]], [x.s[2], x.s[3]]]) {
    const q = 옮기(Gi, px, py)
    if (!isFinite(q[0]) || !isFinite(q[1])) continue
    x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1])
  }
  if (!isFinite(x0) || x1 - x0 < 10 || y1 - y0 < 10) return null
  const 여 = 0.06 * Math.max(x1 - x0, y1 - y0)
  x0 -= 여; y0 -= 여; x1 += 여; y1 += 여
  const 최대 = o.최대 || 2400
  const s = Math.min(4, 최대 / Math.max(x1 - x0, y1 - y0))
  const 너비 = Math.round((x1 - x0) * s), 높이 = Math.round((y1 - y0) * s)
  // 나올 (u,v) → 정면 (x0 + u/s, y0 + v/s) → 사진
  const T = [1 / s, 0, x0, 0, 1 / s, y0, 0, 0, 1]
  const H = 곱(G, T)
  return { H, 너비, 높이, 세로점: vv, 가로점: vh, 세로선: V.안.map((x) => x.i), 가로선: Hh.안.map((x) => x.i), 초점: f쓴, 초점셈됨: f쓴 === f }
}

/** 사용자가 찍은 정면의 네모(창 · 벽 네 모서리)와 그 실제 가로 · 세로(mm)로 펴기 */
export function 네모로펴기(네모, 가로mm, 세로mm, w, h, o = {}) {
  const 비율 = 가로mm && 세로mm ? 가로mm / 세로mm : 비율재기(네모, w, h).비율
  return 펴는틀(네모, w, h, { ...o, 비율 })
}
