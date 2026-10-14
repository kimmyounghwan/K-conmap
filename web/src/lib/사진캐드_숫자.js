/**
 * 📷 사진 → 캐드 · ⑤ 숫자 읽기 — 기기 안에서, 무료로 (2026-10-14 G287)
 *
 * 소장님: 「치수도 자동으로」 · 「무료로 도구를 만들어야 해」
 *
 * ■ 작은 합성곱 신경망(CNN) 하나로 인쇄 숫자 · 손글씨 숫자를 함께 읽습니다. 서버 · 요금 없음 · 무게 파일은 이 도구를 열 때만.
 *   가름: 0~9 · 10 = 다른 글자(한글 · 영문 · 기호) · 11 = 도형(네모 · 원 · 막대 · 빗금)
 * ■ 굵기 맞추기: 인쇄 글꼴(가는 획)과 손글씨(굵은 획)가 같아 보이게, 40 칸으로 키운 뒤 1픽셀 뼈대로 깎고 같은 굵기로 다시 칠합니다.
 *   학습(tools/사진캐드_숫자학습.py)도 «이 파일의 숫자틀()» 로 만든 그림으로 해서 둘이 어긋나지 않습니다.
 * ■ 학습 자료: MNIST 손글씨(npm mnist 1.1.0 · MIT — 원자료 Y. LeCun 들) 앞 85 % + 이 컴퓨터 글꼴로 그린 인쇄 숫자 + 한붓 숫자(캐드 simplex 꼴)
 *   + 한글 · 영문 · 기호 + 도형. 시험은 MNIST 뒤 15 % 와 학습에 안 쓴 글꼴.
 */

/* ───────── 굵기 맞춘 28×28 ───────── */

/**
 * 덩이 하나(이진 그림) → 28×28 (0~1, MNIST 꼴: 20 칸 안에 넣고 무게중심을 가운데로)
 * @param m Uint8Array (1 = 잉크) · w, h
 * @param 돌림 0 | 90 (시계) | -90 (반시계)
 */
export let 틀방식 = 'skel'
export function 틀방식바꾸기(v) { 틀방식 = v }
export function 숫자틀(m, w, h, 돌림 = 0, 방식 = 틀방식) {
  // 돌리기
  let W = w, H = h, src = m
  if (돌림) {
    W = h; H = w
    src = new Uint8Array(W * H)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!m[y * w + x]) continue
      // 시계 90: (x, y) → (h-1-y, x) · 반시계: (y, w-1-x)
      const nx = 돌림 === 90 ? h - 1 - y : y, ny = 돌림 === 90 ? x : w - 1 - x
      src[ny * W + nx] = 1
    }
  }
  // 40 칸(긴 변) 판으로 넓이 평균 크기 바꾸기
  const 큰 = 40
  const s = 큰 / Math.max(W, H)
  const BW = Math.max(1, Math.round(W * s)), BH = Math.max(1, Math.round(H * s))
  const 판 = new Uint8Array((큰 + 4) * (큰 + 4))
  const P = 큰 + 4, off = 2
  const ox = Math.floor((큰 - BW) / 2), oy = Math.floor((큰 - BH) / 2)
  for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
    // 이 칸이 덮는 원래 범위
    const sx0 = x / s, sx1 = (x + 1) / s, sy0 = y / s, sy1 = (y + 1) / s
    let a = 0, n = 0
    for (let yy = Math.floor(sy0); yy < Math.max(Math.floor(sy0) + 1, Math.ceil(sy1)); yy++) for (let xx = Math.floor(sx0); xx < Math.max(Math.floor(sx0) + 1, Math.ceil(sx1)); xx++) {
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue
      a += src[yy * W + xx]; n++
    }
    if (n && a / n >= 0.35) 판[(y + oy + off) * P + x + ox + off] = 1
  }
  if (방식 === 'plain') return 가운데넣기(흐리기(판, P), P)
  // 뼈대(Zhang-Suen)
  const 뼈 = 가늘게(판, P, P)
  // 같은 굵기로 다시 칠하기: 반지름 2.2 원 (40 칸에서 획 ≈ 4.4 → 20 칸에서 ≈ 2.2)
  const 칠 = new Float32Array(P * P)
  const r = 2.2, R = Math.ceil(r)
  for (let y = 0; y < P; y++) for (let x = 0; x < P; x++) {
    if (!뼈[y * P + x]) continue
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const d = Math.hypot(dx, dy); if (d > r + 0.5) continue
      const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= P || yy >= P) continue
      const v = Math.min(1, r + 0.5 - d)
      if (v > 칠[yy * P + xx]) 칠[yy * P + xx] = v
    }
  }
  return 가운데넣기(칠, P)
}

function 흐리기(판, P) {
  const o = new Float32Array(P * P)
  for (let y = 0; y < P; y++) for (let x = 0; x < P; x++) {
    let s = 0, n = 0
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= P || yy >= P) continue; s += 판[yy * P + xx] * (dx || dy ? 1 : 2); n += dx || dy ? 1 : 2 }
    o[y * P + x] = Math.min(1, (s / n) * 1.3)
  }
  return o
}

/** 44×44 → 반으로 줄여 22×22 → 28×28 에 무게중심 맞춰 넣기 */
function 가운데넣기(칠, P) {
  const S = P / 2
  const 작 = new Float32Array(S * S)
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = (2 * y) * P + 2 * x
    작[y * S + x] = (칠[i] + 칠[i + 1] + 칠[i + P] + 칠[i + P + 1]) / 4
  }
  let sw = 0, sx = 0, sy = 0
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const v = 작[y * S + x]; sw += v; sx += v * x; sy += v * y }
  const out = new Float32Array(784)
  if (!sw) return out
  const cx = sx / sw, cy = sy / sw
  const dx = Math.round(13.5 - cx), dy = Math.round(13.5 - cy)
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const X = x + dx, Y = y + dy
    if (X < 0 || Y < 0 || X >= 28 || Y >= 28) continue
    out[Y * 28 + X] = Math.max(out[Y * 28 + X], 작[y * S + x])
  }
  return out
}

function 가늘게(src, w, h) {
  const m = new Uint8Array(src)
  let 바뀜 = true
  const 지울 = []
  while (바뀜) {
    바뀜 = false
    for (let 차 = 0; 차 < 2; 차++) {
      지울.length = 0
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const p = y * w + x
        if (!m[p]) continue
        const P2 = m[p - w], P3 = m[p - w + 1], P4 = m[p + 1], P5 = m[p + w + 1], P6 = m[p + w], P7 = m[p + w - 1], P8 = m[p - 1], P9 = m[p - w - 1]
        const B = P2 + P3 + P4 + P5 + P6 + P7 + P8 + P9
        if (B < 2 || B > 6) continue
        const A = (!P2 && P3) + (!P3 && P4) + (!P4 && P5) + (!P5 && P6) + (!P6 && P7) + (!P7 && P8) + (!P8 && P9) + (!P9 && P2)
        if (A !== 1) continue
        if (차 === 0) { if (P2 * P4 * P6 || P4 * P6 * P8) continue } else { if (P2 * P4 * P8 || P2 * P6 * P8) continue }
        지울.push(p)
      }
      if (지울.length) { 바뀜 = true; for (const p of 지울) m[p] = 0 }
    }
  }
  return m
}

/* ───────── 합성곱 신경망 (앞으로 셈만) ───────── */

let 무게 = null
/** 두 망(뼈대 굵기 맞춤 skel · 그대로 plain)을 함께 — 확률 평균(서로 다른 실수를 해서 둘을 합치면 더 맞음) */
let 무게들 = null
/** 무게 넣기 — { c1:{w,b,n,k}, c2:{w,b,n,k,in}, f1:{w,b,in,out}, f2:{w,b,in,out} } (Float32Array) · 또는 { skel: …, plain: … } */
export function 무게넣기(m) {
  if (m && m.skel && m.plain) { 무게들 = m; 무게 = m.skel } else { 무게들 = null; 무게 = m }
}
export const 무게있음 = () => !!무게
/** 덩이 그림 → 확률 12 (둘 있으면 평균) */
export function 덩이가름(m, w, h, 돌림 = 0) {
  if (!무게들) return 가름(숫자틀(m, w, h, 돌림))
  무게 = 무게들.skel
  const a = 가름(숫자틀(m, w, h, 돌림, 'skel'))
  무게 = 무게들.plain
  const b = 가름(숫자틀(m, w, h, 돌림, 'plain'))
  무게 = 무게들.skel
  const o = new Float32Array(12)
  for (let i = 0; i < 12; i++) o[i] = (a[i] + b[i]) / 2
  return o
}

function 합성곱(x, C, H, W, w, b, N, K) {
  // x: C×H×W, 출력 N×(H-K+1)×(W-K+1), 다음 ReLU
  const OH = H - K + 1, OW = W - K + 1
  const y = new Float32Array(N * OH * OW)
  for (let n = 0; n < N; n++) {
    const bn = b[n]
    for (let oy = 0; oy < OH; oy++) for (let ox = 0; ox < OW; ox++) {
      let s = bn
      for (let c = 0; c < C; c++) {
        const wb = ((n * C + c) * K) * K, xb = c * H * W
        for (let ky = 0; ky < K; ky++) {
          const xr = xb + (oy + ky) * W + ox, wr = wb + ky * K
          for (let kx = 0; kx < K; kx++) s += x[xr + kx] * w[wr + kx]
        }
      }
      y[(n * OH + oy) * OW + ox] = s > 0 ? s : 0
    }
  }
  return { y, H: OH, W: OW }
}
function 줄임(x, C, H, W) {
  const OH = H >> 1, OW = W >> 1
  const y = new Float32Array(C * OH * OW)
  for (let c = 0; c < C; c++) for (let oy = 0; oy < OH; oy++) for (let ox = 0; ox < OW; ox++) {
    const i = c * H * W + 2 * oy * W + 2 * ox
    y[(c * OH + oy) * OW + ox] = Math.max(x[i], x[i + 1], x[i + W], x[i + W + 1])
  }
  return { y, H: OH, W: OW }
}

/** 28×28 → 확률 12개 */
export function 가름(x) {
  if (!무게) throw new Error('숫자 무게 없음')
  const { c1, c2, f1, f2 } = 무게
  let a = 합성곱(x, 1, 28, 28, c1.w, c1.b, c1.n, c1.k)
  a = 줄임(a.y, c1.n, a.H, a.W)
  a = 합성곱(a.y, c1.n, a.H, a.W, c2.w, c2.b, c2.n, c2.k)
  a = 줄임(a.y, c2.n, a.H, a.W)
  const v = a.y
  const h = new Float32Array(f1.out)
  for (let o = 0; o < f1.out; o++) { let s = f1.b[o]; const r = o * f1.in; for (let i = 0; i < f1.in; i++) s += f1.w[r + i] * v[i]; h[o] = s > 0 ? s : 0 }
  const z = new Float32Array(f2.out)
  let 최 = -Infinity
  for (let o = 0; o < f2.out; o++) { let s = f2.b[o]; const r = o * f2.in; for (let i = 0; i < f2.in; i++) s += f2.w[r + i] * h[i]; z[o] = s; if (s > 최) 최 = s }
  let 합 = 0
  for (let o = 0; o < z.length; o++) { z[o] = Math.exp(z[o] - 최); 합 += z[o] }
  for (let o = 0; o < z.length; o++) z[o] /= 합
  return z
}

/** 무게 파일(base64 Float32) 풀기 — 하나 또는 { skel, plain } 둘 */
/* float16(반 크기 무게 · 10/15 사이트 전송량 줄임) → float32 */
function 반풀기(u) {
  const h = new Uint16Array(u.buffer, u.byteOffset, u.length >> 1), f = new Float32Array(h.length)
  for (let i = 0; i < h.length; i++) {
    const x = h[i], s = x & 0x8000 ? -1 : 1, e = (x >> 10) & 0x1f, m = x & 0x3ff
    f[i] = e === 0 ? s * m * 2 ** -24 : e === 31 ? (m ? NaN : s * Infinity) : s * (1 + m / 1024) * 2 ** (e - 15)
  }
  return f
}
export function 무게풀기(j, 반 = false) {
  if (j && j.skel && j.plain) return { skel: 무게풀기(j.skel, !!j.f16), plain: 무게풀기(j.plain, !!j.f16) }
  const f = (s) => { const bin = typeof atob === 'function' ? atob(s) : Buffer.from(s, 'base64').toString('binary'); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return 반 ? 반풀기(u) : new Float32Array(u.buffer) }
  const o = {}
  for (const k of ['c1', 'c2', 'f1', 'f2']) o[k] = { ...j[k], w: f(j[k].w), b: f(j[k].b) }
  return o
}

/* ───────── 낱말 읽기 ───────── */

/** 덩이 한 개의 이진 그림(둘레 네모 안) */
export function 덩이그림(lab, id, b, w) {
  const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1
  const m = new Uint8Array(bw * bh)
  for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) if (lab[y * w + x] === id) m[(y - b.y0) * bw + (x - b.x0)] = 1
  return { m, w: bw, h: bh }
}

/** 붙어 버린 글자 덩이 나누기: 세로 투영이 가장 얇은 곳에서 k 조각 */
function 나눠보기(g, k) {
  const { m, w, h } = g
  const 열 = new Float32Array(w)
  for (let x = 0; x < w; x++) { let s = 0; for (let y = 0; y < h; y++) s += m[y * w + x]; 열[x] = s }
  const 자른 = [0]
  for (let i = 1; i < k; i++) {
    const 목 = (w * i) / k, 범 = Math.max(1, w / (k * 3))
    let 최 = Infinity, 자 = Math.round(목)
    for (let x = Math.max(1, Math.round(목 - 범)); x <= Math.min(w - 2, Math.round(목 + 범)); x++) {
      const v = 열[x] + 0.15 * Math.abs(x - 목)
      if (v < 최) { 최 = v; 자 = x }
    }
    자른.push(자)
  }
  자른.push(w)
  // 자른 자리의 «획 수»: 붙은 두 글자 사이는 보통 한 획(맞닿은 곳) — 글자 몸통(0 · 8 의 가운데)을 자르면 위아래 두 획 이상 → 깎음
  let 획합 = 0, 획수 = 0
  for (let x = 0; x < w; x++) { let 안 = false, 길 = 0; for (let y = 0; y <= h; y++) { const v = y < h && m[y * w + x]; if (v) { 길++; 안 = true } else if (안) { 획합 += 길; 획수++; 길 = 0; 안 = false } } }
  const 획 = 획수 ? 획합 / 획수 : 1
  let 자름점수 = 1
  for (let i = 1; i < k; i++) {
    const x = Math.min(w - 1, 자른[i])
    let 줄 = 0, 안 = false
    for (let y = 0; y < h; y++) { const v = m[y * w + x]; if (v && !안) 줄++; 안 = !!v }
    자름점수 *= Math.pow(0.5, Math.max(0, 줄 - 1)) * Math.exp(-0.5 * Math.max(0, 열[x] / 획 - 1.5))
  }
  const 조각 = []
  for (let i = 0; i < k; i++) {
    const x0 = 자른[i], x1 = 자른[i + 1]
    const cw = x1 - x0; if (cw < 2) return null
    // 위아래 빈 줄 깎기
    let y0 = h, y1 = -1
    for (let y = 0; y < h; y++) for (let x = x0; x < x1; x++) if (m[y * w + x]) { if (y < y0) y0 = y; if (y > y1) y1 = y }
    if (y1 < y0) return null
    const ch = y1 - y0 + 1
    const c = new Uint8Array(cw * ch)
    for (let y = y0; y <= y1; y++) for (let x = x0; x < x1; x++) c[(y - y0) * cw + (x - x0)] = m[y * w + x]
    조각.push({ m: c, w: cw, h: ch })
  }
  조각.자름점수 = 자름점수
  return 조각
}

/**
 * 낱말(글자가르기 결과) 하나를 읽어 숫자면 값.
 * @returns { 값, 글, 믿음, 돌림, 숫자임 } 또는 { 숫자임:false, 믿음 }
 */
export function 낱말읽기(낱말, 덩이들, lab, w, o = {}) {
  // 돌: 글이 종이에 «어떻게 돌아 있나» — -90 = 반시계(아래 → 위로 읽음, 도면 세로 치수의 보통 꼴) · 90 = 시계
  const 돌림들 = 낱말.꼴 === 'V' ? [-90, 90] : 낱말.꼴 === 'H' ? [0] : [0, -90, 90]
  let 최고 = null
  for (const 돌 of 돌림들) {
    const 바로 = -돌   // 바로 세우려면 거꾸로 돌림
    const 들 = 낱말.들.slice().sort((a, b) => {
      const A = 덩이들[a], B = 덩이들[b]
      if (돌 === 0) return A.x0 - B.x0
      if (돌 === -90) return (B.y0 + B.y1) - (A.y0 + A.y1)
      return (A.y0 + A.y1) - (B.y0 + B.y1)
    })
    const 높 = 낱말.높이
    // 이 낱말에서 «글자 하나» 로 보이는 덩이들의 폭(중앙값) — 붙은 글자가 몇 개인지 어림할 때 씀
    const 폭들 = 들.map((i) => { const b = 덩이들[i]; const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1; return 돌 === 0 ? [bw, bh] : [bh, bw] })
      .filter(([a, c]) => a / c >= 0.45 && a / c <= 1.15 && c >= 0.6 * 높).map(([a]) => a).sort((p, q) => p - q)
    const 자폭 = 폭들.length ? 폭들[폭들.length >> 1] : 0
    // ⓐ 점 · 쉼표와 낱자 덩이 가르기
    const 성분 = [], 점앞 = []   // 점앞: 점마다 «그 앞의 낱자 덩이 수»
    for (const i of 들) {
      const b = 덩이들[i]
      const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1
      const 가 = 돌 === 0 ? bw : bh, 세 = 돌 === 0 ? bh : bw
      // 쉼표 · 점: 작고(높이의 60 % 아래) 글줄 «아래쪽» 에 붙은 것 — 가로 글은 아래, 반시계로 돌린 글은 오른쪽, 시계로 돌린 글은 왼쪽
      {
        const [W0, H0, W1, H1] = 낱말.네모
        let 아래쪽
        if (돌 === 0) 아래쪽 = b.y0 > H0 + 0.42 * (H1 - H0)
        else if (돌 === -90) 아래쪽 = b.x0 > W0 + 0.42 * (W1 - W0)
        else 아래쪽 = b.x1 < W1 - 0.42 * (W1 - W0)
        if ((세 < 0.6 * 높 && 아래쪽 && 가 < 0.5 * 높) || Math.max(가, 세) < 0.3 * 높) { 점앞.push(성분.length); continue }
      }
      const s0 = 돌 === 0 ? b.x0 : 돌 === -90 ? -b.y1 : b.y0
      const s1 = 돌 === 0 ? b.x1 : 돌 === -90 ? -b.y0 : b.y1
      성분.push({ i, b, 가, 세, s0, s1 })
    }
    const 기준폭 = 자폭 || 0.78 * 높
    // ⓑ 덩이 하나 읽기 — 붙은 글자는 나눠 봄(숫자 하나의 폭으로 몇 개가 붙었나 어림 · 그 둘레 ±1)
    const 하나읽기 = (c) => {
      const { i, b, 가, 세 } = c
      const g = 덩이그림(lab, i, b, w)
      const 어림 = Math.max(1, Math.min(5, Math.round(가 / (자폭 || 0.78 * Math.max(세, 높 * 0.8)) - 0.1)))
      const 조각들 = [[{ ...g, 이미돌림: false }]]
      조각들[0].벌 = 어림 === 1 ? 1 : Math.pow(0.8, 어림 - 1)
      for (let k = Math.max(2, 어림 - 1); k <= Math.min(5, 어림 + 1); k++) {
        const cc = 나눠보기(돌 === 0 ? g : 돌려(g, 바로), k)
        if (!cc) continue
        const 조 = cc.map((x) => ({ ...x, 이미돌림: 돌 !== 0 }))
        조.벌 = Math.pow(0.8, Math.abs(k - 어림)) * (cc.자름점수 ?? 1)
        조각들.push(조)
      }
      // 조각 수마다 읽어 보고 «숫자 확률» 의 기하평균이 가장 큰 것
      let 고른 = null
      for (const 조 of 조각들) {
        let t = '', 곱 = 1, 최소p = 1, 무게 = 0
        const 확들 = []
        for (const x of 조) {
          const p = 덩이가름(x.m, x.w, x.h, x.이미돌림 ? 0 : 바로)
          let 숫무 = 0, k = 0
          for (let j = 0; j < 10; j++) { 숫무 += p[j]; if (p[j] > p[k]) k = j }
          t += String(k)
          곱 *= p[k]; 최소p = Math.min(최소p, p[k]); 무게 += 숫무
          확들.push(Array.from(p.slice(0, 10), (v) => v / Math.max(1e-9, 숫무)))
        }
        const 평 = Math.pow(곱, 1 / 조.length) * (조.벌 ?? 1)
        if (!고른 || 평 > 고른.평) 고른 = { s: t, 평, 최소p, 무게합: 무게, n: 조.length, 확들, 로그: Math.log(Math.max(1e-12, 곱)) + Math.log(조.벌 ?? 1) }
      }
      return 고른
    }
    // ⓒ 끊어진 글자(손글씨 «0 · 4 · 5» 가 두세 토막으로 끊김) — 나란히 붙은 토막 2 ~ 3 개를 한 글자로 묶어 읽어 봄
    const 묶을만 = (j, k) => {
      const cs = 성분.slice(j, j + k)
      if (cs.length < k) return false
      if (점앞.some((q) => q > j && q < j + k)) return false   // 쉼표를 건너 묶지 않음
      const 넓 = Math.max(...cs.map((c) => c.s1)) - Math.min(...cs.map((c) => c.s0)) + 1
      if (넓 > 1.25 * 기준폭) return false
      for (let q = 1; q < cs.length; q++) if (cs[q].s0 - cs[q - 1].s1 > 0.12 * 높) return false
      return cs.every((c) => c.가 < 0.85 * 기준폭)
    }
    const 묶어읽기 = (j, k) => {
      const cs = 성분.slice(j, j + k)
      const B = { x0: Math.min(...cs.map((c) => c.b.x0)), y0: Math.min(...cs.map((c) => c.b.y0)), x1: Math.max(...cs.map((c) => c.b.x1)), y1: Math.max(...cs.map((c) => c.b.y1)) }
      const bw = B.x1 - B.x0 + 1, bh = B.y1 - B.y0 + 1
      const ids = new Set(cs.map((c) => c.i))
      const m = new Uint8Array(bw * bh)
      for (let y = B.y0; y <= B.y1; y++) for (let x = B.x0; x <= B.x1; x++) if (ids.has(lab[y * w + x])) m[(y - B.y0) * bw + (x - B.x0)] = 1
      const p = 덩이가름(m, bw, bh, 바로)
      let 숫무 = 0, kk = 0
      for (let q = 0; q < 10; q++) { 숫무 += p[q]; if (p[q] > p[kk]) kk = q }
      return { s: String(kk), 최소p: p[kk], 무게합: 숫무, n: 1, 확들: [Array.from(p.slice(0, 10), (v) => v / Math.max(1e-9, 숫무))], 로그: Math.log(Math.max(1e-12, p[kk])) + Math.log(0.7) }
    }
    // ⓓ 앞에서부터 «하나씩 · 묶어서» 가운데 확률 곱이 가장 큰 길(동적 계획)
    const 길 = new Array(성분.length + 1).fill(null)
    길[0] = { 로그: 0, 앞: -1, 읽: null }
    for (let j = 0; j < 성분.length; j++) {
      if (!길[j]) continue
      const 넣 = (to, r) => { const v = 길[j].로그 + r.로그; if (!길[to] || v > 길[to].로그) 길[to] = { 로그: v, 앞: j, 읽: r } }
      넣(j + 1, 하나읽기(성분[j]))
      for (let k = 2; k <= 3; k++) if (묶을만(j, k)) 넣(j + k, 묶어읽기(j, k))
    }
    const 고른길 = []
    for (let j = 성분.length; j > 0 && 길[j]; j = 길[j].앞) 고른길.unshift([길[j].앞, j, 길[j].읽])
    // 끝에 붙은 단위 글자(m · mm · cm 처럼 숫자가 아닌 것 1 ~ 2 개)는 떼고 읽음 → 단위는 치수 풀기에서 m · cm · mm 가운데 맞는 것으로
    let 단위글 = false
    for (let 뗌 = 0; 뗌 < 2 && 고른길.length > 1; 뗌++) {
      const 끝 = 고른길[고른길.length - 1][2]
      if (끝.무게합 / 끝.n >= 0.2) break   // 숫자일 수도 있는 것은 안 뗌
      if (고른길.slice(0, -1).some(([, , r]) => r.무게합 / r.n < 0.2)) break
      고른길.pop(); 단위글 = true
    }
    let 글 = '', 최소 = 1, 조각수 = 0, 숫자무게합 = 0, 아님 = false
    const 자리확률 = [], 덩이까지글 = new Map([[0, 0]])
    for (const [, j, r] of 고른길) {
      if (r.무게합 / r.n < 0.2) 아님 = true
      글 += r.s; 최소 = Math.min(최소, r.최소p); 조각수 += r.n; 숫자무게합 += r.무게합
      자리확률.push(...r.확들)
      덩이까지글.set(j, 글.length)
    }
    const 점자리 = 점앞.map((q) => 덩이까지글.get(q) ?? 0)
    if (!조각수) continue
    const 숫자무게 = 숫자무게합 / 조각수
    let 믿음 = 아님 || 숫자무게 < 0.6 ? 0 : 최소 * Math.min(1, 숫자무게 / 0.9)
    // 거꾸로 돌려 읽으면 «900» 이 «006»(6 ↔ 9 · 차례 거꾸로)이 됨 — 치수는 0 으로 시작하지 않으니 그런 읽기는 크게 깎음.
    // 도면 세로 치수는 거의 반시계(아래 → 위)로 씀 — 같은 믿음이면 반시계를 조금 더 믿음
    if (글.length > 1 && 글[0] === '0' && !(점자리.length && 점자리[0] === 1)) 믿음 *= 0.15
    if (돌 === -90) 믿음 *= 1.08
    // 치수는 많아야 여섯 자리(999,999 mm) — 그보다 긴 것은 글줄 · 무늬를 숫자로 잘못 본 것
    const 소수점있음 = 점자리.some((q) => (글.length - q) % 3 !== 0)
    const 너무김 = 글.length > (소수점있음 ? 9 : 6)
    const 후 = { 돌림: 돌, 글, 믿음: Math.min(1, 믿음), 점자리, 숫자임: !아님 && !너무김 && 숫자무게 >= 0.6, 자리확률, 단위글 }
    if (!최고 || 후.믿음 > 최고.믿음 || (!최고.숫자임 && 후.숫자임)) 최고 = 후
  }
  if (!최고 || !최고.숫자임) return { 숫자임: false, 믿음: 최고 ? 최고.믿음 : 0, 글: 최고 ? 최고.글 : '' }
  // 점 · 쉼표: 끝에서 세 자리마다면 천 단위 쉼표, 아니면 소수점
  const { 글, 점자리 } = 최고
  const 값으로 = (t) => {
    let v = Number(t), 소 = false
    if (점자리.length) {
      const 천단위 = 점자리.every((p) => (t.length - p) % 3 === 0 && p > 0 && p < t.length)
      if (!천단위) { const p = 점자리[점자리.length - 1]; if (p > 0 && p < t.length) { v = Number(t.slice(0, p) + '.' + t.slice(p)); 소 = true } }
    }
    return { v, 소 }
  }
  const { v: 값, 소: 소수 } = 값으로(글)
  // 다른 읽기 후보(자리마다 위 3개 — 묶음 찾기 12) : 치수 풀기에서 «둘레 치수와 맞는» 후보를 고를 수 있게
  let 묶 = [{ t: '', p: 1 }]
  for (const pr of 최고.자리확률 || []) {
    const 위 = pr.map((p, k) => [k, p]).sort((a, b) => b[1] - a[1]).slice(0, 3)
    const 새 = []
    for (const b of 묶) for (const [k, p] of 위) if (p > 0.01) 새.push({ t: b.t + k, p: b.p * p })
    새.sort((a, b) => b.p - a.p)
    묶 = 새.slice(0, 12)
  }
  const 후보 = 묶.map((b) => ({ 값: 값으로(b.t).v, p: b.p })).filter((c) => c.값 > 0)
  return { 숫자임: true, 값, 글: 소수 ? String(값) : 글, 믿음: 최고.믿음, 돌림: 최고.돌림, 소수, 후보, 단위글: !!최고.단위글 }
}

function 돌려(g, 돌) {
  const { m, w, h } = g
  const W = h, H = w, o = new Uint8Array(W * H)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!m[y * w + x]) continue
    const nx = 돌 === 90 ? h - 1 - y : y, ny = 돌 === 90 ? x : w - 1 - x
    o[ny * W + nx] = 1
  }
  return { m: o, w: W, h: H }
}
