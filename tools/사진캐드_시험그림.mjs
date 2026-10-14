/**
 * 📷 사진캐드 시험용 그림 만들기 (G287 · 2026-10-14)
 *   «정답을 아는» 도면을 그려 → 종이에 인쇄한 것처럼 → 비스듬히 찍은 사진처럼(원근 · 그림자 · 흐림 · 잡티) 만듭니다.
 *   손그림은 같은 도면을 떨리는 선 · 모서리 넘침 · 비율 틀림 · MNIST 손글씨 숫자(학습에 안 쓴 뒤쪽 15 %)로.
 *   건물 사진은 가상 건물 정면(창 · 문 · 층 띠)을 3D 로 비스듬히 본 그림 + 하늘 · 땅 · 무늬.
 * 모두 지어낸 것 — 남의 도면 · 사진을 쓰지 않습니다.
 */
import fs from 'fs'
import { createCanvas, GlobalFonts } from '../web/node_modules/@napi-rs/canvas/index.js'
import { 호모, 거꾸로, 옮기, 집기 } from '../web/src/lib/사진캐드_펴기.js'

try { GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', 'NotoKR') } catch (e) { /* 없어도 됨 */ }

export function 난수(seed) {
  let a = seed >>> 0
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/** 가상 평면도 (mm · 도면 좌표 y 위로). 벽 두께 200 · 문 900 · 기둥 · 원 · 45° 선 · 치수(바깥 두 줄) · 방 이름 */
export function 시험평면(o = {}) {
  const X = o.X || [0, 4200, 7800, 12000], Y = o.Y || [0, 3600, 8400]
  const W = X[X.length - 1], H = Y[Y.length - 1], t = 100
  const 선 = [], 호 = [], 원 = [], 치수 = [], 글 = []
  const L = (x1, y1, x2, y2, 층 = '벽') => 선.push({ a: [x1, y1], b: [x2, y2], 층 })
  // 바깥 벽 (바깥 면 · 안 면)
  L(-t, -t, W + t, -t); L(W + t, -t, W + t, H + t); L(W + t, H + t, -t, H + t); L(-t, H + t, -t, -t)
  // 안쪽 면: 칸마다 둘레 (안 벽이 만나는 자리에서 끊김)
  const xi = X[1], yj = Y[1]
  // 왼 방(0~xi, 0~H): 안 면
  L(t, t, xi - t, t); L(xi - t, t, xi - t, 5000); L(xi - t, 5900, xi - t, H - t); L(xi - t, H - t, t, H - t); L(t, H - t, t, t)
  // 오른 아래 방(xi~W, 0~yj)
  L(xi + t, t, W - t, t); L(W - t, t, W - t, yj - t); L(W - t, yj - t, 9000, yj - t); L(8100, yj - t, xi + t, yj - t); L(xi + t, yj - t, xi + t, t)
  // 오른 위 방(xi~W, yj~H)
  L(xi + t, yj + t, 8100, yj + t); L(9000, yj + t, W - t, yj + t); L(W - t, yj + t, W - t, H - t); L(W - t, H - t, xi + t, H - t); L(xi + t, H - t, xi + t, 5900); L(xi + t, 5000, xi + t, yj + t)
  // 문 틈 마감(문설주)
  L(xi - t, 5000, xi + t, 5000); L(xi - t, 5900, xi + t, 5900)
  L(8100, yj - t, 8100, yj + t); L(9000, yj - t, 9000, yj + t)
  // 문 짝 + 열림 호
  L(xi + t, 5000, xi + t + 900, 5000, '문'); 호.push({ c: [xi + t, 5000], r: 900, a0: 0, a1: 90, 층: '문' })
  // 기둥(네모) · 둥근 탁자 · 45° 선(계단 표시)
  L(10600, 6000, 11000, 6000, '기둥'); L(11000, 6000, 11000, 6400, '기둥'); L(11000, 6400, 10600, 6400, '기둥'); L(10600, 6400, 10600, 6000, '기둥')
  원.push({ c: [2000, 6200], r: 500, 층: '가구' })
  L(5200, 1000, 6800, 2600, '선')
  // 치수: 위쪽(바깥) 두 줄 · 왼쪽 두 줄
  const 위1 = H + 1300, 위2 = H + 2100
  for (let i = 0; i + 1 < X.length; i++) 치수.push({ a: [X[i], 위1], b: [X[i + 1], 위1], 값: X[i + 1] - X[i], 꼴: 'H' })
  치수.push({ a: [X[0], 위2], b: [W, 위2], 값: W, 꼴: 'H' })
  const 왼1 = -1300, 왼2 = -2100
  for (let j = 0; j + 1 < Y.length; j++) 치수.push({ a: [왼1, Y[j]], b: [왼1, Y[j + 1]], 값: Y[j + 1] - Y[j], 꼴: 'V' })
  치수.push({ a: [왼2, Y[0]], b: [왼2, H], 값: H, 꼴: 'V' })
  글.push({ x: 2000, y: 3500, 글: '거실', 높이: 350 }, { x: 9900, y: 1700, 글: '주방', 높이: 350 }, { x: 9500, y: 7200, 글: '침실', 높이: 350 })
  return { 선, 호, 원, 치수, 글, 범위: [-2800, -800, W + 800, H + 2800], X, Y }
}

/** 치수선 · 보조선 · 빗금을 선으로 풀어서(그림용) */
export function 치수그림선(d, o = {}) {
  const 선 = []
  const 띄움 = o.띄움 || 200, 넘침 = o.넘침 || 200, 빗 = o.빗 || 150
  if (d.꼴 === 'H') {
    const y = d.a[1]
    선.push({ a: [d.a[0] - 넘침, y], b: [d.b[0] + 넘침, y], 층: '치수' })
    for (const x of [d.a[0], d.b[0]]) {
      선.push({ a: [x, (o.바닥 ?? 0) + 띄움], b: [x, y + 넘침], 층: '치수보조' })
      선.push({ a: [x - 빗, y - 빗], b: [x + 빗, y + 빗], 층: '빗금' })
    }
  } else {
    const x = d.a[0]
    선.push({ a: [x, d.a[1] - 넘침], b: [x, d.b[1] + 넘침], 층: '치수' })
    for (const y of [d.a[1], d.b[1]]) {
      선.push({ a: [x - 넘침, y], b: [(o.바닥 ?? 0) - 띄움, y], 층: '치수보조' })
      선.push({ a: [x - 빗, y - 빗], b: [x + 빗, y + 빗], 층: '빗금' })
    }
  }
  return 선
}

/**
 * 도면 → 종이 그림 (밝기 판). 축척 1/s · 종이(mm) · 해상도(px/mm)
 * 손그림이면 떨림 · 넘침 · 비율 틀림 · 손글씨 숫자
 */
export function 종이그리기(도면, o = {}) {
  const 축척 = o.축척 || 50, 종이 = o.종이 || [420, 297], ppm = o.ppm || 7
  const 손 = !!o.손그림, R = 난수(o.seed || 7)
  const Wp = Math.round(종이[0] * ppm), Hp = Math.round(종이[1] * ppm)
  const cv = createCanvas(Wp, Hp), g = cv.getContext('2d')
  g.fillStyle = '#fff'; g.fillRect(0, 0, Wp, Hp)
  const [x0, y0, x1, y1] = 도면.범위
  const 가운x = (x0 + x1) / 2, 가운y = (y0 + y1) / 2
  // 손그림 비율 틀림(가로 · 세로 따로)
  const 틀x = 손 ? 1 + (R() - 0.5) * 0.16 : 1, 틀y = 손 ? 1 + (R() - 0.5) * 0.16 : 1
  const 틀칸 = 손 ? (v, 축, 기준들) => v : (v) => v
  const 종이점 = (p) => [Wp / 2 + ((p[0] - 가운x) * 틀x / 축척) * ppm, Hp / 2 - ((p[1] - 가운y) * 틀y / 축척) * ppm]
  const 굵기 = { 벽: 0.5, 문: 0.3, 기둥: 0.4, 가구: 0.25, 선: 0.3, 치수: 0.18, 치수보조: 0.18, 빗금: 0.3 }
  g.lineCap = 'round'; g.strokeStyle = '#111'
  const 떨선 = (A, B, 굵) => {
    if (!손) { g.lineWidth = 굵; g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke(); return }
    // 손: 끝 넘침/모자람 · 살짝 기울기 · 낮은 떨림
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]); if (L < 1) return
    const ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L, nx = -uy, ny = ux
    const e1 = (R() - 0.3) * Math.min(18, L * 0.04), e2 = (R() - 0.3) * Math.min(18, L * 0.04)
    const 기 = (R() - 0.5) * 0.03
    const P = [A[0] - ux * e1, A[1] - uy * e1], Q = [B[0] + ux * e2, B[1] + uy * e2]
    const n = Math.max(4, Math.round(L / 25)), φ1 = R() * 6, φ2 = R() * 6, 진 = 1.2 + R() * 1.8
    g.lineWidth = 굵 * (0.8 + R() * 0.5); g.beginPath()
    for (let i = 0; i <= n; i++) {
      const s = i / n
      const 휨 = 진 * Math.sin(φ1 + s * 3.1) + 0.6 * 진 * Math.sin(φ2 + s * 9) + 기 * L * (s - 0.5)
      const x = P[0] + (Q[0] - P[0]) * s + nx * 휨, y = P[1] + (Q[1] - P[1]) * s + ny * 휨
      if (i) g.lineTo(x, y); else g.moveTo(x, y)
    }
    g.stroke()
  }
  const 모든선 = [...도면.선]
  for (const d of 도면.치수) 모든선.push(...치수그림선(d, { 바닥: d.꼴 === 'H' ? 도면.Y[도면.Y.length - 1] + 100 : -100 }))
  for (const s of 모든선) {
    if (손 && (s.층 === '빗금')) continue
    떨선(종이점(s.a), 종이점(s.b), (굵기[s.층] || 0.3) * ppm * (손 ? 1.4 : 1))
  }
  for (const a of 도면.호) {
    g.lineWidth = (굵기[a.층] || 0.3) * ppm; g.beginPath()
    const c = 종이점(a.c), r = (a.r / 축척) * ppm
    g.arc(c[0], c[1], r * (손 ? 틀x : 1), -a.a1 * Math.PI / 180, -a.a0 * Math.PI / 180); g.stroke()
  }
  for (const c0 of 도면.원) {
    g.lineWidth = (굵기[c0.층] || 0.3) * ppm; g.beginPath()
    const c = 종이점(c0.c); g.arc(c[0], c[1], (c0.r / 축척) * ppm, 0, Math.PI * 2); g.stroke()
  }
  // 치수 글자
  const 글높 = (o.글높 || 3) * ppm
  const 숫자들 = o.손글씨 || null
  for (const d of 도면.치수) {
    const m = 종이점([(d.a[0] + d.b[0]) / 2, (d.a[1] + d.b[1]) / 2])
    const 글 = (d.값).toLocaleString('en-US')
    if (손 && 숫자들) {
      손글씨넣기(g, 글.replace(/,/g, ''), m, d.꼴, 글높 * 1.6, 숫자들, R)
    } else {
      g.save(); g.translate(m[0], m[1])
      if (d.꼴 === 'V') g.rotate(-Math.PI / 2)
      g.font = `${글높}px "DejaVu Sans"`; g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'bottom'
      g.fillText(글, 0, -0.35 * 글높)
      g.restore()
    }
  }
  for (const t of 도면.글) {
    const m = 종이점([t.x, t.y])
    g.font = `${(t.높이 / 축척) * ppm}px NotoKR`; g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText(t.글, m[0], m[1])
  }
  const img = g.getImageData(0, 0, Wp, Hp)
  const d = new Float32Array(Wp * Hp)
  for (let i = 0; i < d.length; i++) d[i] = 0.299 * img.data[i * 4] + 0.587 * img.data[i * 4 + 1] + 0.114 * img.data[i * 4 + 2]
  return { 판: { w: Wp, h: Hp, d }, ppm, 축척, 종이, 종이점, 틀: [틀x, 틀y], cv }
}

/** MNIST 숫자(뒤 15 %)를 이어 붙여 손글씨 숫자 */
export function MNIST읽기(뿌리 = '/tmp/g10/ds/package/src/digits') {
  const 숫 = []
  for (let k = 0; k < 10; k++) {
    const raw = JSON.parse(fs.readFileSync(`${뿌리}/${k}.json`, 'utf8')).data
    const n = (raw.length / 784) | 0
    const 시작 = Math.floor(n * 0.85)
    const 들 = []
    for (let i = 시작; i < n; i++) 들.push(raw.slice(i * 784, (i + 1) * 784))
    숫.push(들)
  }
  return 숫
}
function 손글씨넣기(g, 글, m, 꼴, 높, 숫자들, R) {
  // 숫자마다 실제 잉크 폭 + 사이(높이의 −4 % ~ 22 % — 가끔 닿음)로 이어 씀 (사람 글씨처럼)
  const 고른 = [...글].map((ch) => { const 들 = 숫자들[+ch]; return 들[Math.floor(R() * 들.length)] })
  const 폭들 = 고른.map((s) => { let x0 = 28, x1 = -1; for (let p = 0; p < 784; p++) if (s[p] > 0.3) { const x = p % 28; if (x < x0) x0 = x; if (x > x1) x1 = x } return x1 >= x0 ? [x0, x1] : [10, 17] })
  const k = 높 / 28
  const 사이 = 폭들.map(() => 높 * (-0.04 + R() * 0.26))
  let 전 = 0; 폭들.forEach(([a, b], i) => { 전 += (b - a + 1) * k + (i ? 사이[i] : 0) })
  g.save(); g.translate(m[0], m[1])
  if (꼴 === 'V') g.rotate(-Math.PI / 2)
  const cv = createCanvas(28, 28), cg = cv.getContext('2d')
  let x = -전 / 2
  for (let i = 0; i < 고른.length; i++) {
    const s = 고른[i], [a, b] = 폭들[i]
    if (i) x += 사이[i]
    const im = cg.createImageData(28, 28)
    for (let p = 0; p < 784; p++) { const v = 255 - Math.round(s[p] * 255); im.data[p * 4] = v; im.data[p * 4 + 1] = v; im.data[p * 4 + 2] = v; im.data[p * 4 + 3] = 255 }
    cg.putImageData(im, 0, 0)
    g.save()
    g.globalCompositeOperation = 'multiply'
    const y = -높 * 1.2 + (R() - 0.5) * 높 * 0.1
    g.translate(x - a * k + 높 / 2, y + 높 / 2); g.rotate((R() - 0.5) * 0.12); g.drawImage(cv, -높 / 2, -높 / 2, 높, 높)
    g.restore()
    x += (b - a + 1) * k
  }
  g.restore()
}

/**
 * 종이 그림 → 비스듬히 찍은 사진. 네 모서리 자리(사진 안)를 정해 원근 · 바탕 · 그림자 · 흐림 · 잡티.
 * @returns { 판, 모서리(정답 · 왼위부터) }
 */
export function 사진찍기(종이, o = {}) {
  const R = 난수(o.seed || 11)
  const W = o.W || 3000, H = o.H || 2250
  const { w, h } = 종이.판
  // 진짜 사진기(바늘구멍): 종이 평면을 기울기 α(앞뒤) · β(좌우) · γ(돌림)로 보고, 초점 f · 주점 = 사진 가운데
  const α = ((o.기울 ?? 22) + (R() - 0.5) * 6) * Math.PI / 180
  const β = ((o.옆기울 ?? 8) + (R() - 0.5) * 6) * Math.PI / 180
  const γ = ((o.돌림 ?? 6) + (R() - 0.5) * 4) * Math.PI / 180
  const f = (o.초점 ?? 0.82) * W
  const cos = Math.cos, sin = Math.sin
  const Rx = [1, 0, 0, 0, cos(α), -sin(α), 0, sin(α), cos(α)]
  const Ry = [cos(β), 0, sin(β), 0, 1, 0, -sin(β), 0, cos(β)]
  const Rz = [cos(γ), -sin(γ), 0, sin(γ), cos(γ), 0, 0, 0, 1]
  const 곱3 = (A, B) => { const C = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) C.push(A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]); return C }
  const Rm = 곱3(Rz, 곱3(Rx, Ry))
  const 종mm = [w / 종이.ppm, h / 종이.ppm]
  // 종이가 사진의 (크기) 만큼 차지하도록 거리 D
  const D = (f * Math.max(종mm[0] / W, 종mm[1] / H)) / (o.크기 ?? 0.78)
  const 이동 = [(R() - 0.5) * 0.06 * 종mm[0], (R() - 0.5) * 0.06 * 종mm[1], D]
  const 찍기 = (u, v) => {   // 종이 픽셀 → 사진 픽셀
    const X = (u - w / 2) / 종이.ppm, Y = (v - h / 2) / 종이.ppm
    const x = Rm[0] * X + Rm[1] * Y + 이동[0], y = Rm[3] * X + Rm[4] * Y + 이동[1], z = Rm[6] * X + Rm[7] * Y + 이동[2]
    return [W / 2 + (f * x) / z, H / 2 + (f * y) / z]
  }
  // 사진 픽셀 (x, y) 의 가운데 = (x + 0.5, y + 0.5) 로 찍음 → 정답 모서리는 «픽셀 번호» 좌표(가운데 = 정수)로 0.5 뺌
  const q = [찍기(0, 0), 찍기(w, 0), 찍기(w, h), 찍기(0, h)]
  const Hm = 호모(q, [[0, 0], [w, 0], [w, h], [0, h]])   // 사진 → 종이
  const d = new Float32Array(W * H)
  const 바탕 = o.바탕 ?? 95
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const [u, v] = 옮기(Hm, x + 0.5, y + 0.5)
    let val
    if (u >= 0 && v >= 0 && u <= w && v <= h) val = 집기(종이.판, u - 0.5, v - 0.5) * 0.93
    else val = 바탕 + 25 * Math.sin(x * 0.013 + y * 0.004) + 10 * Math.sin(y * 0.05)
    // 빛: 한쪽이 어두운 그림자(부드럽게)
    const 빛 = 1 - (o.그림자 ?? 0.35) * Math.max(0, Math.min(1, (x / W) * 0.8 + (y / H) * 0.5 - 0.25))
    d[y * W + x] = val * 빛
  }
  // 흐림(3탭) + 잡티
  const t = new Float32Array(W * H)
  const 흐 = o.흐림 ?? 1
  for (let k = 0; k < 흐; k++) {
    t.set(d)
    for (let y = 0; y < H; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; t[i] = 0.25 * d[i - 1] + 0.5 * d[i] + 0.25 * d[i + 1] }
    for (let y = 1; y < H - 1; y++) for (let x = 0; x < W; x++) { const i = y * W + x; d[i] = 0.25 * t[i - W] + 0.5 * t[i] + 0.25 * t[i + W] }
  }
  const 잡 = o.잡티 ?? 4
  for (let i = 0; i < d.length; i++) d[i] = Math.max(0, Math.min(255, d[i] + (R() + R() + R() - 1.5) * 잡 * 1.4))
  return { 판: { w: W, h: H, d }, 모서리: q.map(([x, y]) => [x - 0.5, y - 0.5]), 사진에서종이: Hm, 초점: f }
}

/** 밝기 판 → PNG 파일 (눈으로 보기) */
export function 판저장(판, 길) {
  const cv = createCanvas(판.w, 판.h), g = cv.getContext('2d')
  const im = g.createImageData(판.w, 판.h)
  for (let i = 0; i < 판.d.length; i++) { const v = Math.max(0, Math.min(255, Math.round(판.d[i]))); im.data[i * 4] = v; im.data[i * 4 + 1] = v; im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255 }
  g.putImageData(im, 0, 0)
  fs.writeFileSync(길, cv.toBuffer(/\.jpe?g$/i.test(길) ? 'image/jpeg' : 'image/png'))
}

/**
 * 가상 건물 정면을 비스듬히 찍은 사진 — 정면 넓이 W × 높이 H(mm) · 층 띠 · 창(유리 어둡게 · 창틀) · 문 · 벽 무늬 · 하늘 · 땅
 * @returns { 판, 정답: { 선:[{a,b}] (mm · 정면 좌표 · y 위로), W, H }, 초점 }
 */
export function 건물사진(o = {}) {
  const R = 난수(o.seed || 21)
  const W = o.W || 18000, H = o.H || 12000, 층 = o.층 || 4, 창수 = o.창수 || 5
  const IW = o.IW || 3000, IH = o.IH || 2250
  // 정답 선
  const 선 = []
  const L = (x1, y1, x2, y2) => 선.push({ a: [x1, y1], b: [x2, y2] })
  L(0, 0, W, 0); L(W, 0, W, H); L(W, H, 0, H); L(0, H, 0, 0)
  const 층높 = H / 층
  for (let k = 1; k < 층; k++) L(0, k * 층높, W, k * 층높)
  const 창w = 1500, 창h = 1500, 간 = W / 창수
  const 창들 = []
  for (let k = 0; k < 층; k++) for (let i = 0; i < 창수; i++) {
    if (k === 0 && i === Math.floor(창수 / 2)) continue
    const x0 = i * 간 + (간 - 창w) / 2, y0 = k * 층높 + 900
    창들.push([x0, y0, x0 + 창w, y0 + 창h])
    L(x0, y0, x0 + 창w, y0); L(x0 + 창w, y0, x0 + 창w, y0 + 창h); L(x0 + 창w, y0 + 창h, x0, y0 + 창h); L(x0, y0 + 창h, x0, y0)
  }
  const 문x = Math.floor(창수 / 2) * 간 + (간 - 1800) / 2
  const 문 = [문x, 0, 문x + 1800, 2400]
  L(문[0], 0, 문[0], 문[3]); L(문[0], 문[3], 문[2], 문[3]); L(문[2], 문[3], 문[2], 0)
  // 사진기: 정면 가운데를 보며 좌우로 돌림(yaw) · 위아래(pitch)
  const yaw = ((o.yaw ?? 24) + (R() - 0.5) * 6) * Math.PI / 180, pitch = ((o.pitch ?? 7) + (R() - 0.5) * 4) * Math.PI / 180, roll = ((R() - 0.5) * 3) * Math.PI / 180
  const f = (o.초점 ?? 0.8) * IW
  const D = (o.거리 ?? 1.25) * Math.max(W, H * IW / IH) * f / IW * 1.0
  const c = Math.cos, s = Math.sin
  // 정면 좌표(X 오른쪽, Y 위, Z 앞쪽=사진기 쪽) → 사진기 좌표
  const Ry = [c(yaw), 0, s(yaw), 0, 1, 0, -s(yaw), 0, c(yaw)]
  const Rx = [1, 0, 0, 0, c(pitch), -s(pitch), 0, s(pitch), c(pitch)]
  const Rz = [c(roll), -s(roll), 0, s(roll), c(roll), 0, 0, 0, 1]
  const 곱3 = (A, B) => { const C = []; for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) C.push(A[r * 3] * B[k] + A[r * 3 + 1] * B[3 + k] + A[r * 3 + 2] * B[6 + k]); return C }
  const Rm = 곱3(Rz, 곱3(Rx, Ry))
  // 사진 좌표 y 아래 · 정면 Y 위 → 정면 점 (X, Y) 를 (X - W/2, -(Y - H/2), 0)
  const 정면점 = (X, Y) => {
    const x = X - W / 2, y = -(Y - H / 2), z = 0
    const cx = Rm[0] * x + Rm[1] * y + Rm[2] * z, cy = Rm[3] * x + Rm[4] * y + Rm[5] * z, cz = Rm[6] * x + Rm[7] * y + Rm[8] * z + D
    return [IW / 2 + (f * cx) / cz, IH / 2 + (f * cy) / cz]
  }
  // 사진 → 정면 (호모)
  const 모 = [정면점(0, 0), 정면점(W, 0), 정면점(W, H), 정면점(0, H)]
  const Hm = 호모(모, [[0, 0], [W, 0], [W, H], [0, H]])
  const d = new Float32Array(IW * IH)
  const 벽색 = 170 + R() * 30
  for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) {
    const [X, Y] = 옮기(Hm, x + 0.5, y + 0.5)
    let v
    if (X >= 0 && X <= W && Y >= 0 && Y <= H) {
      v = 벽색 + 18 * Math.sin(X * 0.02) * Math.sin(Y * 0.017) + (((Math.floor(X / 230) + Math.floor(Y / 75)) % 2) ? 6 : -6)
      for (const [x0, y0, x1, y1] of 창들) {
        if (X >= x0 && X <= x1 && Y >= y0 && Y <= y1) { const 틀 = X - x0 < 70 || x1 - X < 70 || Y - y0 < 70 || y1 - Y < 70 || Math.abs(X - (x0 + x1) / 2) < 35; v = 틀 ? 235 : 60 + 25 * ((X + Y) % 900) / 900; break }
      }
      if (X >= 문[0] && X <= 문[2] && Y <= 문[3]) v = 85
      for (let k = 1; k < 층; k++) if (Math.abs(Y - k * 층높) < 60) v = 215
    } else {
      const 하늘 = y < IH * 0.55
      v = 하늘 ? 225 - 35 * (y / IH) : 120 + 25 * Math.sin(x * 0.05) * Math.sin(y * 0.07)
    }
    d[y * IW + x] = v
  }
  // 흐림 + 잡티
  const t = new Float32Array(d.length)
  t.set(d)
  for (let y = 0; y < IH; y++) for (let x = 1; x < IW - 1; x++) { const i = y * IW + x; t[i] = 0.25 * d[i - 1] + 0.5 * d[i] + 0.25 * d[i + 1] }
  for (let y = 1; y < IH - 1; y++) for (let x = 0; x < IW; x++) { const i = y * IW + x; d[i] = 0.25 * t[i - IW] + 0.5 * t[i] + 0.25 * t[i + IW] }
  for (let i = 0; i < d.length; i++) d[i] = Math.max(0, Math.min(255, d[i] + (R() + R() - 1) * 6))
  return { 판: { w: IW, h: IH, d }, 정답: { 선, W, H }, 초점: f, 모서리: 모 }
}
