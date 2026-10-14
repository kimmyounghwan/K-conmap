/**
 * 📷 사진 → 캐드 · ② 잉크 — 펴진 판에서 «펜 · 인쇄 선» 만 뽑고 1픽셀 뼈대로 (2026-10-14 G287)
 *
 *   잉크뽑기(판, o)      — 그림자 · 얼룩에 흔들리지 않게 «둘레 종이 밝기» 를 먼저 재고, 그보다 얼마나 어두운가(대비)로 가름.
 *                          대비 기준은 오츠(자동) × 세기. 이어진 흐린 부분은 따라감(두 문턱).
 *   덩이(mask)          — 이어진 잉크 덩이(8이웃) 번호 · 크기 · 둘레 네모
 *   거리(mask)          — 잉크 안에서 가장 가까운 바탕까지 거리(선 굵기 재기)
 *   뼈대(mask)          — Zhang-Suen 가늘게 + 계단 지우기 → 8이웃 1픽셀
 *   길따기(뼈, w, h)     — 끝점 · 갈림점 사이 길(점 차례) · 닫힌 고리 · 짧은 가지 자르기
 */

import { 오츠 } from './사진캐드_펴기.js'

/** 그림자 · 얼룩을 뺀 «잉크 대비» (0~255) */
export function 대비판(판) {
  const { w, h, d } = 판
  const B = Math.max(8, Math.round(Math.max(w, h) / 180))
  const W = Math.ceil(w / B), H = Math.ceil(h / B)
  // 칸마다 가장 밝은 값 — 먼저 3×3 평균으로 흐려서 반짝이는 점 하나에 끌리지 않게
  const t1 = new Float32Array(w * h), t2 = new Float32Array(w * h)
  for (let y = 0; y < h; y++) { const r = y * w; for (let x = 0; x < w; x++) t1[r + x] = (d[r + (x > 0 ? x - 1 : x)] + d[r + x] + d[r + (x < w - 1 ? x + 1 : x)]) / 3 }
  for (let y = 0; y < h; y++) { const r = y * w, u = y > 0 ? r - w : r, dn = y < h - 1 ? r + w : r; for (let x = 0; x < w; x++) t2[r + x] = (t1[u + x] + t1[r + x] + t1[dn + x]) / 3 }
  const g = new Float32Array(W * H)
  for (let y = 0; y < h; y++) {
    const by = (y / B) | 0, r = y * w
    for (let x = 0; x < w; x++) { const k = by * W + ((x / B) | 0); if (t2[r + x] > g[k]) g[k] = t2[r + x] }
  }
  // 늘이기(3칸) — 칸 하나보다 넓게 칠한 곳도 잉크로 남게
  const g2 = new Float32Array(W * H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let m = 0
    for (let yy = Math.max(0, y - 1); yy <= Math.min(H - 1, y + 1); yy++) for (let xx = Math.max(0, x - 1); xx <= Math.min(W - 1, x + 1); xx++) m = Math.max(m, g[yy * W + xx])
    g2[y * W + x] = m
  }
  // 부드럽게(3×3 평균 두 번)
  let s = g2
  for (let k = 0; k < 2; k++) {
    const t = new Float32Array(W * H)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let a = 0, n = 0
      for (let yy = Math.max(0, y - 1); yy <= Math.min(H - 1, y + 1); yy++) for (let xx = Math.max(0, x - 1); xx <= Math.min(W - 1, x + 1); xx++) { a += s[yy * W + xx]; n++ }
      t[y * W + x] = a / n
    }
    s = t
  }
  const c = new Uint8ClampedArray(w * h)
  for (let y = 0; y < h; y++) {
    const gy = Math.min(H - 1.001, Math.max(0, (y + 0.5) / B - 0.5)), y0 = gy | 0, fy = gy - y0
    for (let x = 0; x < w; x++) {
      const gx = Math.min(W - 1.001, Math.max(0, (x + 0.5) / B - 0.5)), x0 = gx | 0, fx = gx - x0
      const i = y0 * W + x0
      const bg = (s[i] * (1 - fx) + s[i + 1 < W * H ? i + 1 : i] * fx) * (1 - fy) + (s[i + W < W * H ? i + W : i] * (1 - fx) + s[i + W + 1 < W * H ? i + W + 1 : i] * fx) * fy
      const v = d[y * w + x]
      c[y * w + x] = Math.max(0, Math.min(255, ((bg - v) / Math.max(bg, 48)) * 255))
    }
  }
  return { w, h, d: c }
}

/**
 * 잉크 가르기 — { mask(1=잉크), T(쓴 문턱), 대비 }
 * o.세기: 1 = 자동 · 작게(0.6) 하면 흐린 선도 · 크게(1.5) 하면 진한 선만
 */
export function 잉크뽑기(판, o = {}) {
  const 대 = 대비판(판)
  const { w, h, d } = 대
  const 값 = []
  for (let i = 0; i < d.length; i += 3) if (d[i] > 14) 값.push(d[i])
  let T = 값.length > 50 ? 오츠(값) : 60
  T = Math.max(28, Math.min(150, T)) * (o.세기 || 1)
  const 약 = T * 0.55
  const mask = new Uint8Array(w * h)
  const 줄 = new Int32Array(w * h)
  let qt = 0
  for (let i = 0; i < d.length; i++) if (d[i] >= T) { mask[i] = 1; 줄[qt++] = i }
  let qh = 0
  while (qh < qt) {
    const p = 줄[qh++], x = p % w, y = (p / w) | 0
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue
      const q = yy * w + xx
      if (!mask[q] && d[q] >= 약) { mask[q] = 1; 줄[qt++] = q }
    }
  }
  // 바늘구멍 메우기: 잉크 8이웃 중 7개 이상이면 잉크
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const p = y * w + x
    if (mask[p]) continue
    const n = mask[p - 1] + mask[p + 1] + mask[p - w] + mask[p + w] + mask[p - w - 1] + mask[p - w + 1] + mask[p + w - 1] + mask[p + w + 1]
    if (n >= 7) mask[p] = 1
  }
  // 흐린 가는 선(사진으로 찍은 치수선 · 보조선) — 굵고 진한 벽 때문에 문턱이 높아져 빠진 가는 선을 낮은 문턱으로 다시 봄.
  //   남기는 것: 길쭉하거나 듬성한 선 그물이고 · 종이 끝에서 끝까지 걸친 줄(모눈 · 줄 공책)이 아니고 ·
  //   글 읽기가 찾은 «치수 숫자» 가 바로 곁에 있는 것(숫자 없는 연필 밑그림 · 얼룩은 그대로 버림).
  //   글 읽기를 못 쓰면 인쇄 도면에서만(손그림은 밑그림 선이 많아서 안 함)
  const 흐린 = o.흐린선 !== false && !o.손그림 && (o.글자리 ? o.글자리.length > 0 : true)   // 손그림은 안 함(연필 밑그림 · 종이 결이 많음)
  if (흐린) {
    const T2 = Math.max(22, Math.min(T * 0.38, 60)), 약2 = T2 * 0.6
    // 진한 잉크 둘레 2 픽셀(진한 선의 흐린 테두리) — 덩이 점이 «모두» 이 안이면 테두리일 뿐이라 버림(선이 굵어지고 한쪽으로 쏠리지 않게)
    const 곁진 = new Uint8Array(w * h)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue
      for (let yy = Math.max(0, y - 2); yy <= Math.min(h - 1, y + 2); yy++) for (let xx = Math.max(0, x - 2); xx <= Math.min(w - 1, x + 2); xx++) 곁진[yy * w + xx] = 1
    }
    const m2 = new Uint8Array(w * h)
    qt = 0
    for (let i = 0; i < d.length; i++) if (!mask[i] && d[i] >= T2) { m2[i] = 1; 줄[qt++] = i }
    qh = 0
    while (qh < qt) {
      const p = 줄[qh++], x = p % w, y = (p / w) | 0
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue
        const q = yy * w + xx
        if (!mask[q] && !m2[q] && d[q] >= 약2) { m2[q] = 1; 줄[qt++] = q }
      }
    }
    const { lab: lb2, 덩이들: 덩2 } = 덩이(m2, w, h)
    const 먼 = new Int32Array(덩2.length)   // 진한 잉크에서 2 픽셀 넘게 떨어진 점 수
    for (let i = 0; i < m2.length; i++) if (m2[i] && !곁진[i]) 먼[lb2[i]]++
    // 곧은 정도: 가로 · 세로로 12 픽셀 넘게 이어진 줄에 든 점의 몫(치수선 · 보조선은 곧음 · 종이 결 · 그늘 무늬는 짧고 구불구불)
    const 곧 = new Int32Array(덩2.length)
    const 곧표 = new Uint8Array(w * h)
    for (let y = 0; y < h; y++) { let x = 0; while (x < w) { const i = y * w + x; if (!m2[i]) { x++; continue } let e = x; while (e < w && m2[y * w + e]) e++; if (e - x >= 12) for (let k = x; k < e; k++) 곧표[y * w + k] = 1; x = e } }
    for (let x = 0; x < w; x++) { let y = 0; while (y < h) { if (!m2[y * w + x]) { y++; continue } let e = y; while (e < h && m2[e * w + x]) e++; if (e - y >= 12) for (let k = y; k < e; k++) 곧표[k * w + x] = 1; y = e } }
    for (let i = 0; i < m2.length; i++) if (곧표[i]) 곧[lb2[i]]++
    const 긴최소 = Math.max(20, 0.015 * Math.max(w, h))
    const 후 = 덩2.map((b, k) => {
      if (먼[k] < 0.5 * b.n) return false                            // 거의 다 진한 선 곁 = 테두리
      if (곧[k] < 0.5 * b.n) return false                            // 곧은 줄이 반도 안 됨 = 종이 결 · 얼룩 무늬
      const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1
      if (Math.max(bw, bh) < 긴최소) return false
      if (Math.min(bw, bh) > 12 && b.n > 0.3 * bw * bh) return false   // 덩어리(그늘 · 얼룩) — 선 그물(치수선 + 보조선)은 듬성듬성
      if (bw >= 0.88 * w || bh >= 0.88 * h) return false            // 끝에서 끝까지 = 모눈 · 줄 공책 · 종이 접힌 자국
      return true
    })
    if (o.글자리 && 후.some(Boolean)) {
      // 숫자 상자 둘레(글 높이 2.5 배)에 이 덩이 점이 있는가
      const 곁 = new Uint8Array(덩2.length)
      const 칸 = new Map()
      for (let i = 0; i < m2.length; i++) { if (!m2[i] || !후[lb2[i]]) continue; const x = i % w, y = (i / w) | 0; const k = ((y >> 3) << 16) | (x >> 3); if (!칸.has(k)) 칸.set(k, []); 칸.get(k).push(i) }
      for (const b of o.글자리) {
        const r = 2.5 * b.W + 0.5 * b.L
        const x0 = Math.max(0, (b.c[0] - r) >> 3), x1 = Math.min(w - 1, b.c[0] + r) >> 3, y0 = Math.max(0, (b.c[1] - r) >> 3), y1 = Math.min(h - 1, b.c[1] + r) >> 3
        for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) {
          const L = 칸.get((gy << 16) | gx); if (!L) continue
          for (const i of L) {
            const x = i % w, y = (i / w) | 0, dx = x - b.c[0], dy = y - b.c[1]
            const 앞 = Math.abs(dx * b.u[0] + dy * b.u[1]), 옆 = Math.abs(-dx * b.u[1] + dy * b.u[0])
            if (앞 <= b.L / 2 + 1.5 * b.W && 옆 <= 2.5 * b.W) { 곁[lb2[i]] = 1; break }
          }
        }
      }
      for (let k = 0; k < 후.length; k++) if (후[k] && !곁[k]) 후[k] = false
    }
    let 더 = 0
    for (let i = 0; i < m2.length; i++) if (m2[i] && 후[lb2[i]]) { mask[i] = 1; 더++ }
    if (더) o.흐린선수 = 후.filter(Boolean).length
  }
  // 티끌 지우기
  const { lab, 덩이들 } = 덩이(mask, w, h)
  const 최소 = o.티끌 ?? Math.max(6, Math.round((w * h) / 2.5e5))
  for (let i = 0; i < mask.length; i++) if (mask[i] && 덩이들[lab[i]].n < 최소) mask[i] = 0
  return { mask, w, h, T, 대비: 대, 흐린선: o.흐린선수 || 0 }
}

/** 이어진 덩이 (8이웃) → { lab: Int32Array(-1=바탕), 덩이들: [{n,x0,y0,x1,y1}] } */
export function 덩이(mask, w, h) {
  const lab = new Int32Array(w * h).fill(-1)
  const 덩이들 = []
  const 줄 = new Int32Array(w * h)
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || lab[s] >= 0) continue
    const id = 덩이들.length
    let qh = 0, qt = 0; 줄[qt++] = s; lab[s] = id
    let n = 0, x0 = w, y0 = h, x1 = 0, y1 = 0
    while (qh < qt) {
      const p = 줄[qh++], x = p % w, y = (p / w) | 0
      n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy; if (yy < 0 || yy >= h) continue
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx; if (xx < 0 || xx >= w) continue
          const q = yy * w + xx
          if (mask[q] && lab[q] < 0) { lab[q] = id; 줄[qt++] = q }
        }
      }
    }
    덩이들.push({ n, x0, y0, x1, y1 })
  }
  return { lab, 덩이들 }
}

/** 잉크 안 거리(체스판 3-4 근사 → 픽셀) */
export function 거리(mask, w, h) {
  const BIG = 1e9
  const d = new Float32Array(w * h)
  for (let i = 0; i < d.length; i++) d[i] = mask[i] ? BIG : 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = y * w + x; if (!d[p]) continue
    let v = d[p]
    if (x > 0) v = Math.min(v, d[p - 1] + 3); else v = Math.min(v, 3)
    if (y > 0) { v = Math.min(v, d[p - w] + 3); if (x > 0) v = Math.min(v, d[p - w - 1] + 4); if (x < w - 1) v = Math.min(v, d[p - w + 1] + 4) } else v = Math.min(v, 3)
    d[p] = v
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const p = y * w + x; if (!d[p]) continue
    let v = d[p]
    if (x < w - 1) v = Math.min(v, d[p + 1] + 3); else v = Math.min(v, 3)
    if (y < h - 1) { v = Math.min(v, d[p + w] + 3); if (x < w - 1) v = Math.min(v, d[p + w + 1] + 4); if (x > 0) v = Math.min(v, d[p + w - 1] + 4) } else v = Math.min(v, 3)
    d[p] = v
  }
  for (let i = 0; i < d.length; i++) d[i] /= 3
  return d
}

/** Zhang-Suen 가늘게 + 계단 지우기 → 1픽셀 뼈대 (Uint8Array) */
export function 뼈대(mask, w, h) {
  const m = new Uint8Array(mask)
  // 테두리는 비움(이웃 셈을 쉽게)
  for (let x = 0; x < w; x++) { m[x] = 0; m[(h - 1) * w + x] = 0 }
  for (let y = 0; y < h; y++) { m[y * w] = 0; m[y * w + w - 1] = 0 }
  let 후보 = []
  for (let i = 0; i < m.length; i++) if (m[i]) 후보.push(i)
  const 지울 = []
  let 바뀜 = true
  while (바뀜) {
    바뀜 = false
    for (let 차 = 0; 차 < 2; 차++) {
      지울.length = 0
      for (const p of 후보) {
        if (!m[p]) continue
        const P2 = m[p - w], P3 = m[p - w + 1], P4 = m[p + 1], P5 = m[p + w + 1], P6 = m[p + w], P7 = m[p + w - 1], P8 = m[p - 1], P9 = m[p - w - 1]
        const B = P2 + P3 + P4 + P5 + P6 + P7 + P8 + P9
        if (B < 2 || B > 6) continue
        const A = (!P2 && P3) + (!P3 && P4) + (!P4 && P5) + (!P5 && P6) + (!P6 && P7) + (!P7 && P8) + (!P8 && P9) + (!P9 && P2)
        if (A !== 1) continue
        if (차 === 0) { if (P2 * P4 * P6 || P4 * P6 * P8) continue }
        else { if (P2 * P4 * P8 || P2 * P6 * P8) continue }
        지울.push(p)
      }
      if (지울.length) { 바뀜 = true; for (const p of 지울) m[p] = 0 }
    }
    후보 = 후보.filter((p) => m[p])
  }
  // 계단 지우기: 지워도 이웃끼리 한 덩이(8이웃)로 이어져 있고, 끝점이 아니면 지움
  const 둘레 = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]]
  for (const p of 후보) {
    if (!m[p]) continue
    const x = p % w, y = (p / w) | 0
    const 켜 = []
    for (let k = 0; k < 8; k++) if (m[(y + 둘레[k][1]) * w + x + 둘레[k][0]]) 켜.push(k)
    if (켜.length < 2 || 켜.length > 3) continue
    // 이웃끼리 이어짐: 두 자리의 좌표 차가 1 이하
    const 이 = (a, b) => Math.abs(둘레[a][0] - 둘레[b][0]) <= 1 && Math.abs(둘레[a][1] - 둘레[b][1]) <= 1
    const 본 = new Set([켜[0]]); let 늘 = true
    while (늘) { 늘 = false; for (const k of 켜) if (!본.has(k) && [...본].some((j) => 이(j, k))) { 본.add(k); 늘 = true } }
    if (본.size !== 켜.length) continue
    // 곧은 선의 한가운데(마주 보는 두 이웃)는 남김 — 위 셈에서 이미 걸러짐(이어지지 않음)
    // 가로 · 세로 이웃이 둘(ㄱ자)일 때만 지움 — 대각선 하나 + 곧은 하나는 남김(선이 짧아지지 않게)
    const 곧 = 켜.filter((k) => k % 2 === 1).length
    if (곧 >= 2) m[p] = 0
  }
  return m
}

const 둘레8 = (w) => [-w - 1, -w, -w + 1, 1, w + 1, w, w - 1, -1]

/**
 * 뼈대 → 길들. 길 = { p:[[x,y],…], a:'E'|'J'|'L', b:'E'|'J'|'L' }  (E 끝 · J 갈림 · L 고리)
 * 짧은 가지(끝 ~ 갈림, 길이 < 가지) 는 잘라냄(두 번).
 */
export function 길따기(뼈, w, h, o = {}) {
  const m = new Uint8Array(뼈)
  const 가지 = o.가지 ?? 6
  const 이웃 = 둘레8(w)
  const 차수 = (p) => { let n = 0; for (const d of 이웃) if (m[p + d]) n++; return n }
  for (let 회 = 0; 회 < 2; 회++) {
    const 길들 = 따기(m, w, h, 이웃, 차수)
    let 자름 = 0
    for (const g of 길들) {
      if (g.a === 'L' || g.b === 'L') continue
      const 끝하나 = (g.a === 'E') !== (g.b === 'E')
      if (끝하나 && g.p.length < 가지) {
        // 갈림점 쪽 마지막 점은 남김
        const 지울 = g.a === 'E' ? g.p.slice(0, -1) : g.p.slice(1)
        for (const [x, y] of 지울) m[y * w + x] = 0
        자름++
      }
      if (g.a === 'E' && g.b === 'E' && g.p.length < Math.max(3, 가지 / 2)) { for (const [x, y] of g.p) m[y * w + x] = 0; 자름++ }
    }
    if (!자름) break
  }
  return 따기(m, w, h, 이웃, 차수)
}

function 따기(m, w, h, 이웃, 차수) {
  const N = w * h
  const 마디 = new Int32Array(N).fill(-1)   // 갈림 덩이 번호
  const 끝 = new Uint8Array(N)
  const 갈림들 = []
  for (let p = 0; p < N; p++) {
    if (!m[p]) continue
    const k = 차수(p)
    if (k === 1 || k === 0) 끝[p] = 1
    else if (k >= 3 && 마디[p] < 0) {
      // 붙은 갈림점끼리 한 덩이
      const id = 갈림들.length, 묶 = [p]; 마디[p] = id
      for (let i = 0; i < 묶.length; i++) for (const d of 이웃) { const q = 묶[i] + d; if (m[q] && 마디[q] < 0 && 차수(q) >= 3) { 마디[q] = id; 묶.push(q) } }
      let sx = 0, sy = 0; for (const q of 묶) { sx += q % w; sy += (q / w) | 0 }
      갈림들.push({ 점들: 묶, c: [sx / 묶.length, sy / 묶.length] })
    }
  }
  const 간 = new Uint8Array(N)
  const 길들 = []
  const 걷기 = (시작, 첫, 시작꼴) => {
    const p = [[시작 % w, (시작 / w) | 0]]
    let 앞 = 시작, 지금 = 첫
    for (;;) {
      p.push([지금 % w, (지금 / w) | 0])
      if (마디[지금] >= 0) return { p, a: 시작꼴, b: 'J', bj: 마디[지금] }
      if (끝[지금]) { 간[지금] = 1; return { p, a: 시작꼴, b: 'E' } }
      간[지금] = 1
      // 다음: ① 아직 안 간 보통 점(곧은 이웃 먼저) ② 없으면 갈림점(떠나온 갈림점은 세 걸음 뒤부터)
      let 다음 = -1
      const 차례 = [이웃[1], 이웃[3], 이웃[5], 이웃[7], 이웃[0], 이웃[2], 이웃[4], 이웃[6]]
      for (const d of 차례) {
        const q = 지금 + d
        if (m[q] && q !== 앞 && !간[q] && 마디[q] < 0) { 다음 = q; break }
      }
      if (다음 < 0) for (const d of 차례) {
        const q = 지금 + d
        if (!m[q] || q === 앞 || 마디[q] < 0) continue
        if (마디[시작] >= 0 && 마디[q] === 마디[시작] && p.length < 4) continue
        다음 = q; break
      }
      if (다음 < 0) return { p, a: 시작꼴, b: 'E' }
      앞 = 지금; 지금 = 다음
    }
  }
  // 끝점에서
  for (let s = 0; s < N; s++) {
    if (!m[s] || !끝[s] || 간[s]) continue
    간[s] = 1
    let 첫 = -1
    for (const d of 이웃) if (m[s + d]) { 첫 = s + d; break }
    if (첫 < 0) continue   // 외톨이 점
    if (끝[첫] && 간[첫]) continue
    const g = 걷기(s, 첫, 'E')
    길들.push(g)
  }
  // 갈림점에서
  갈림들.forEach((J, id) => {
    for (const s of J.점들) for (const d of 이웃) {
      const q = s + d
      if (!m[q] || 마디[q] >= 0 || 간[q]) continue
      if (끝[q]) continue
      const g = 걷기(s, q, 'J'); g.aj = id
      길들.push(g)
    }
  })
  // 남은 것 = 닫힌 고리
  for (let s = 0; s < N; s++) {
    if (!m[s] || 간[s] || 마디[s] >= 0) continue
    간[s] = 1
    let 첫 = -1
    for (const d of 이웃) if (m[s + d] && !간[s + d]) { 첫 = s + d; break }
    if (첫 < 0) continue
    const g = 걷기(s, 첫, 'L'); g.b = 'L'
    길들.push(g)
  }
  for (const g of 길들) {
    if (g.a === 'J' && g.aj != null) g.ac = 갈림들[g.aj].c
    if (g.b === 'J' && g.bj != null) g.bc = 갈림들[g.bj].c
  }
  return 길들
}
