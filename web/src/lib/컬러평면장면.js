/**
 * 🎨 컬러 평면도 · 🚪 피난 안내도 — 종이 한 장(장면) 만들기 (2026-10-17)
 *
 * 장면 = { 폭, 높이(mm), 그림들: [도형], 변환: { s, ox, oy, mx0, my1 }(모델 → 종이), 축척 }
 * 도형(종이 mm · y 아래로):
 *   { t: '면', 고리들: [[[x,y]…]…], 채움, 선?, 굵기? }       짝홀 채움(구멍 있는 방)
 *   { t: '선', 점들: [[x,y]…], 색, 굵기(mm), 점선?: [a,b], 닫힘? , 끝?: '둥' }
 *   { t: '원', x, y, r, 채움?, 색?, 굵기? }
 *   { t: '네모', x, y, w, h, 채움?, 색?, 굵기?, 둥?: r }
 *   { t: '글', x, y, 글, 크기(pt), 색, 굵게?, 정렬: '가'|'왼'|'오', 기준: '가'|'위'|'아래' }
 * 화면(SVG) · PNG(캔버스) · PDF 가 lib/장면그림.js 로 같은 모양을 그립니다. DXF 는 lib/컬러평면dxf.js.
 */
import { 글폭, 나누기 } from './쪽문서.js'
import { 색판들, 용도무늬, 무늬들, 용도이름, 용도들, 색섞기, 장비이름, 장비영어 } from './컬러평면.js'

export const 종이들 = {
  A3: { 이름: 'A3', 폭: 420, 높이: 297 },
  B4: { 이름: 'B4', 폭: 364, 높이: 257 },
  A4: { 이름: 'A4', 폭: 297, 높이: 210 },
  A2: { 이름: 'A2', 폭: 594, 높이: 420 },
}
export function 종이크기(이름 = 'A3', 방향 = '가로') {
  const p = 종이들[이름] || 종이들.A3
  return 방향 === '세로' ? { 폭: p.높이, 높이: p.폭, 이름: p.이름 } : { 폭: p.폭, 높이: p.높이, 이름: p.이름 }
}
const 축척들 = [20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 125, 150, 200, 250, 300, 400, 500, 600, 750, 800, 1000, 1200, 1500, 2000, 2500, 3000, 5000]
const PT = 0.3528
const 쉼 = (v, d = 2) => Number(v || 0).toLocaleString('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d })
export const 평 = (m2) => m2 / 3.305785

/* ───────────────────────────── 모델 → 종이 */

/** 평면을 영역(종이 mm)에 맞춤 — 표준 축척 고르기 */
export function 맞춤(D, 영역, 고정축척 = 0) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  const 넓 = (x, y) => { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  for (const r of D.외곽) for (const [x, y] of r) 넓(x, y)
  for (const R of D.방들) for (const r of R.고리들) for (const [x, y] of r) 넓(x, y)
  if (!isFinite(x0)) { [x0, y0, x1, y1] = D.상자 }
  const k = D.k
  const w = (x1 - x0) * k, h = (y1 - y0) * k                     /* mm */
  const 맞는 = Math.max(w / 영역.w, h / 영역.h)                    /* 1 : 맞는 */
  const N = 고정축척 > 0 ? 고정축척 : (축척들.find((n) => n >= 맞는 * 1.02) || Math.ceil(맞는 * 1.02))
  const s = k / N                                                 /* 모델 단위 → 종이 mm */
  const ox = 영역.x + (영역.w - w / N) / 2, oy = 영역.y + (영역.h - h / N) / 2
  return { s, ox, oy, mx0: x0, my1: y1, N, 꽉: N < 맞는 }
}
export const 종이점 = (V, x, y) => [V.ox + (x - V.mx0) * V.s, V.oy + (V.my1 - y) * V.s]
export const 모델점 = (V, px, py) => [V.mx0 + (px - V.ox) / V.s, V.my1 - (py - V.oy) / V.s]
const 고리종이 = (V, r) => r.map(([x, y]) => 종이점(V, x, y))

/* ───────────────────────────── 바닥 무늬 */

/** 고리들(구멍 포함) 안에 각도 θ · 간격 g 의 나란한 선 — [[x0,y0,x1,y1]…] (같은 좌표계) · 시작 = 기준점 */
export function 빗금(고리들, θ, g, 기준 = [0, 0]) {
  const cs = Math.cos(-θ), sn = Math.sin(-θ)
  const 돌 = (x, y) => [(x - 기준[0]) * cs - (y - 기준[1]) * sn, (x - 기준[0]) * sn + (y - 기준[1]) * cs]
  const 되 = (x, y) => { const c2 = Math.cos(θ), s2 = Math.sin(θ); return [x * c2 - y * s2 + 기준[0], x * s2 + y * c2 + 기준[1]] }
  const 변들 = []
  let ymin = Infinity, ymax = -Infinity
  for (const r of 고리들) {
    const q = r.map(([x, y]) => 돌(x, y))
    for (let i = 0; i < q.length; i++) {
      const a = q[i], b = q[(i + 1) % q.length]
      변들.push([a[0], a[1], b[0], b[1]])
      if (a[1] < ymin) ymin = a[1]; if (a[1] > ymax) ymax = a[1]
    }
  }
  const out = []
  if (!(g > 0) || !isFinite(ymin)) return out
  for (let y = Math.ceil(ymin / g) * g; y <= ymax; y += g) {
    const xs = []
    for (const [ax, ay, bx, by] of 변들) {
      if ((ay > y) === (by > y)) continue
      xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay))
    }
    xs.sort((a, b) => a - b)
    for (let i = 0; i + 1 < xs.length; i += 2) {
      if (xs[i + 1] - xs[i] < g * 0.05) continue
      const p = 되(xs[i], y), q = 되(xs[i + 1], y)
      out.push([p[0], p[1], q[0], q[1]])
    }
  }
  return out
}

/** 방 바닥 무늬 선(모델 좌표) — 마루(널 + 엇갈린 이음) · 타일(격자) */
export function 무늬선(R, 키, k) {
  const m = 무늬들[키]
  if (!m || !키) return []
  const b = R.상자
  const 긴가로 = (b[2] - b[0]) >= (b[3] - b[1])
  const 기준 = [b[0], b[1]]
  if (m.격자) {
    const g = m.격자 / k
    return [...빗금(R.고리들, 0, g, 기준), ...빗금(R.고리들, Math.PI / 2, g, 기준)]
  }
  if (m.간격) {
    const g = m.간격 / k
    const θ = 긴가로 ? 0 : Math.PI / 2
    const 널 = 빗금(R.고리들, θ, g, 기준)
    /* 이음 — 널 줄마다 900 간격 · 줄마다 300 씩 밀림 */
    const 이 = m.이음 / k
    const out = [...널]
    const ux = Math.cos(θ), uy = Math.sin(θ), nx = -uy, ny = ux
    for (const [x0, y0, x1, y1] of 널) {
      const L = Math.hypot(x1 - x0, y1 - y0)
      const 줄 = Math.round(((x0 - 기준[0]) * nx + (y0 - 기준[1]) * ny) / g)
      const 밀 = (((줄 % 3) + 3) % 3) * (이 / 3)
      const 시작 = ((x0 - 기준[0]) * ux + (y0 - 기준[1]) * uy)
      let t = Math.ceil((시작 - 밀) / 이) * 이 + 밀 - 시작
      for (; t < L - g * 0.3; t += 이) {
        if (t < g * 0.3) continue
        const px = x0 + ux * t, py = y0 + uy * t
        /* 널 사이(위쪽 g) 짧은 선 — 무늬 줄은 아래 널 선에서 위로 */
        out.push([px, py, px + nx * g, py + ny * g])
      }
    }
    return out
  }
  return []
}

/* ───────────────────────────── 글 · 아이콘 */

const 글 = (x, y, s, 크기, o = {}) => ({ t: '글', x, y, 글: String(s), 크기, 색: o.색 || '#111111', 굵게: !!o.굵게, 정렬: o.정렬 || '가', 기준: o.기준 || '가' })
const 선 = (점들, 색, 굵기, o = {}) => ({ t: '선', 점들, 색, 굵기, ...o })
const 네모 = (x, y, w, h, o = {}) => ({ t: '네모', x, y, w, h, ...o })
const 원 = (x, y, r, o = {}) => ({ t: '원', x, y, r, ...o })

export const 초록 = '#0B8A44', 빨강 = '#D7262B', 주황 = '#F08A00'

/** 아이콘(가운데 x, y · 크기 mm) → 도형들 — 직접 그린 단순 그림(남의 그림 아님) */
export function 아이콘(종류, x, y, z) {
  const P = (u, v) => [x + u * z, y + v * z]
  const 줄 = (pts, 색, w, o = {}) => 선(pts.map(([u, v]) => P(u, v)), 색, w * z, o)
  const 흰 = '#ffffff'
  if (종류 === '현위치') {
    return [원(x, y, 0.5 * z, { 채움: 빨강 }), 원(x, y, 0.32 * z, { 채움: 흰 }), 원(x, y, 0.18 * z, { 채움: 빨강 })]
  }
  if (종류 === '비상구' || 종류 === '계단' || 종류 === '출입구') {
    return [
      네모(x - 0.5 * z, y - 0.5 * z, z, z, { 채움: 초록, 둥: 0.08 * z }),
      줄([[-0.4, 0.38], [-0.4, -0.36], [-0.14, -0.36], [-0.14, 0.38]], 흰, 0.06),
      원(...P(0.2, -0.27), 0.075 * z, { 채움: 흰 }),
      줄([[0.15, -0.16], [0.04, 0.06]], 흰, 0.1, { 끝: '둥' }),
      줄([[0.12, -0.12], [0.27, -0.02], [0.32, 0.06]], 흰, 0.07, { 끝: '둥' }),
      줄([[0.12, -0.13], [-0.02, -0.06], [-0.09, 0.02]], 흰, 0.07, { 끝: '둥' }),
      줄([[0.04, 0.06], [0.19, 0.2], [0.3, 0.17]], 흰, 0.08, { 끝: '둥' }),
      줄([[0.04, 0.06], [-0.06, 0.2], [-0.12, 0.36]], 흰, 0.08, { 끝: '둥' }),
    ]
  }
  if (종류 === '소화기') {
    return [
      네모(x - 0.5 * z, y - 0.5 * z, z, z, { 채움: 빨강, 둥: 0.08 * z }),
      네모(x - 0.13 * z, y - 0.12 * z, 0.28 * z, 0.48 * z, { 채움: 흰, 둥: 0.08 * z }),
      네모(x - 0.07 * z, y - 0.24 * z, 0.16 * z, 0.13 * z, { 채움: 흰 }),
      줄([[0.02, -0.22], [0.24, -0.32]], 흰, 0.06, { 끝: '둥' }),
      줄([[-0.07, -0.19], [-0.27, -0.06], [-0.27, 0.22]], 흰, 0.06, { 끝: '둥' }),
    ]
  }
  if (종류 === '소화전') {
    return [
      네모(x - 0.5 * z, y - 0.5 * z, z, z, { 채움: 빨강, 둥: 0.08 * z }),
      네모(x - 0.34 * z, y - 0.32 * z, 0.68 * z, 0.64 * z, { 색: 흰, 굵기: 0.06 * z }),
      원(x - 0.02 * z, y, 0.17 * z, { 색: 흰, 굵기: 0.06 * z }),
      원(x - 0.02 * z, y, 0.05 * z, { 채움: 흰 }),
      줄([[0.15, 0.0], [0.26, -0.2]], 흰, 0.06, { 끝: '둥' }),
    ]
  }
  if (종류 === '발신기') {
    return [
      원(x, y, 0.5 * z, { 채움: 빨강 }),
      { t: '면', 고리들: [[[-0.22, 0.14], [0.22, 0.14], [0.16, 0.05], [0.15, -0.1], [0.08, -0.2], [0, -0.23], [-0.08, -0.2], [-0.15, -0.1], [-0.16, 0.05]].map(([u, v]) => P(u, v))], 채움: 흰 },
      원(...P(0, 0.21), 0.055 * z, { 채움: 흰 }),
    ]
  }
  if (종류 === '완강기') {
    return [
      네모(x - 0.5 * z, y - 0.5 * z, z, z, { 채움: 초록, 둥: 0.08 * z }),
      줄([[-0.32, -0.36], [0.32, -0.36]], 흰, 0.08),
      줄([[0, -0.36], [0, 0.0]], 흰, 0.04),
      원(...P(0, 0.07), 0.07 * z, { 채움: 흰 }),
      줄([[0, 0.14], [0, 0.3]], 흰, 0.09, { 끝: '둥' }),
      줄([[-0.12, 0.2], [0.12, 0.2]], 흰, 0.06, { 끝: '둥' }),
      줄([[0, 0.3], [-0.08, 0.42]], 흰, 0.06, { 끝: '둥' }),
      줄([[0, 0.3], [0.08, 0.42]], 흰, 0.06, { 끝: '둥' }),
    ]
  }
  return [원(x, y, 0.4 * z, { 색: '#333', 굵기: 0.05 * z })]
}

/** 화살 머리(채운 세모) — 끝점 p · 방향(앞쪽) u · 크기 z */
function 화살머리(p, u, z, 색) {
  const [ux, uy] = u, nx = -uy, ny = ux
  return { t: '면', 고리들: [[[p[0] + ux * z * 0.35, p[1] + uy * z * 0.35], [p[0] - ux * z * 0.65 + nx * z * 0.5, p[1] - uy * z * 0.65 + ny * z * 0.5], [p[0] - ux * z * 0.65 - nx * z * 0.5, p[1] - uy * z * 0.65 - ny * z * 0.5]]], 채움: 색 }
}
/** 꺾은선 앞을 d(mm) 만큼 잘라냄 — 길이 방 이름 글을 덮지 않게 */
function 앞자르기(점들, d) {
  let 남 = d
  for (let i = 1; i < 점들.length; i++) {
    const a = 점들[i - 1], b = 점들[i]
    const L = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (L > 남) { const t = 남 / L; return [[a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], ...점들.slice(i)] }
    남 -= L
  }
  return 점들.slice(-1)
}
/** 꺾은선 위 일정 간격 화살(꺾쇠) */
function 꺾쇠들(점들, 간격, z, 색, 굵기) {
  const out = []
  let 남 = 간격 * 0.6
  for (let i = 1; i < 점들.length; i++) {
    const a = 점들[i - 1], b = 점들[i]
    const L = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (L < 1e-6) continue
    const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, nx = -uy, ny = ux
    let t = 남
    for (; t < L - 0.5; t += 간격) {
      const p = [a[0] + ux * t, a[1] + uy * t]
      out.push(선([[p[0] - ux * z + nx * z * 0.8, p[1] - uy * z + ny * z * 0.8], p, [p[0] - ux * z - nx * z * 0.8, p[1] - uy * z - ny * z * 0.8]], '#ffffff', 굵기 * 0.55, { 끝: '둥' }))
    }
    남 = t - L
  }
  return out
}

/* ───────────────────────────── 바탕(평면) 그리기 — 두 장면이 같이 씀 */

function 평면그림(D, V, o) {
  const out = []
  const 판 = 색판들[o.색판] || 색판들.부드럽게
  if (o.벽채움 !== false && D.외곽.length) out.push({ t: '면', 고리들: D.외곽.map((r) => 고리종이(V, r)), 채움: o.벽색 || 판.벽 })
  for (const R of D.방들) {
    const 바 = (o.방바꿈 && o.방바꿈[R.번호]) || {}
    if (바.숨김) continue
    const 용 = 바.용도 || R.용도
    const 색 = o.방색 ? o.방색(R, 용) : 바.색 || (R.이름없음 ? 판.빈곳 : 판.색[용] || 판.색.기타)
    out.push({ t: '면', 고리들: R.고리들.map((r) => 고리종이(V, r)), 채움: 색, 방: R.번호 })
    if (o.무늬 && !R.이름없음) {
      const 키 = 바.무늬 !== undefined ? 바.무늬 : 용도무늬[용] || ''
      const 줄들 = 무늬선(R, 키, D.k)
      if (줄들.length) {
        const 무색 = 색섞기(색, '#000000', 0.13)
        for (const [ax, ay, bx, by] of 줄들) out.push(선([종이점(V, ax, ay), 종이점(V, bx, by)], 무색, 0.07))
      }
    }
  }
  /* 바탕 선 */
  const 꼴 = {
    벽: [판.선, 0.22], 창: [o.창색 || '#3d7fb8', 0.16], 문: [판.선, 0.13], 계단: [판.선, 0.12],
    위생: ['#5b7183', 0.1], 가구: ['#8a8a8a', 0.09], 기타: ['#9a9a9a', 0.08],
  }
  for (const s of D.선들) {
    if (s.종 === '가구' && o.가구 === false) continue
    if (s.종 === '위생' && o.가구 === false) continue
    if (s.종 === '기타' && o.기타선 === false) continue
    const [색, w] = 꼴[s.종] || 꼴.기타
    const 점들 = []
    for (let i = 0; i < s.점.length; i += 2) 점들.push(종이점(V, s.점[i], s.점[i + 1]))
    out.push(선(점들, 색, w, s.닫힘 ? { 닫힘: true } : {}))
  }
  return out
}

/** 방 이름 · 면적 글 */
function 방글들(D, V, o) {
  const out = []
  const 판 = 색판들[o.색판] || 색판들.부드럽게
  for (const R of D.방들) {
    const 바 = (o.방바꿈 && o.방바꿈[R.번호]) || {}
    if (바.숨김 || R.이름없음) continue
    const 이름 = (바.이름 ?? R.이름 ?? '').replace(/\(추정\)$/, '')
    if (!이름 && !o.면적) continue
    const [px, py] = 종이점(V, R.라벨[0], R.라벨[1])
    const 폭 = Math.max(6, (R.여유폭 / V.N) * 0.92)
    const A = o.면적기준 === '도면' && R.도면면적 ? R.도면면적 : (o.면적기준 === '면적선' && R.면적선 ? R.면적선 : R.면적)
    const 면글 = o.면적 === '㎡평' ? `${쉼(A)}㎡ (${쉼(평(A), 1)}평)` : o.면적 === '㎡' ? `${쉼(A)}㎡` : o.면적 === '평' ? `${쉼(평(A), 1)}평` : ''
    let 크 = o.이름크기 || 9, 작 = 크 * 0.78
    const 맞 = () => Math.max(이름 && o.이름 !== false ? 글폭(이름, 크, true) : 0, 면글 ? 글폭(면글, 작) : 0)
    while (크 > 4.5 && 맞() > 폭) { 크 -= 0.5; 작 = 크 * 0.78 }
    const 줄수 = (이름 && o.이름 !== false ? 1 : 0) + (면글 ? 1 : 0)
    let y = py - ((줄수 - 1) * 크 * PT * 1.25) / 2
    if (이름 && o.이름 !== false) { out.push(글(px, y, 이름, 크, { 굵게: true, 색: o.글색 || 판.글 })); y += 크 * PT * 1.3 }
    if (면글) out.push(글(px, y, 면글, 작, { 색: o.면적색 || '#4b5563' }))
  }
  return out
}

/** 방위표(북) · 축척 막대 */
function 방위표(x, y, z, 각, 색 = '#222') {
  const a = ((각 || 0) * Math.PI) / 180
  const R = (u, v) => [x + (u * Math.cos(a) - v * Math.sin(a)) * z, y + (u * Math.sin(a) + v * Math.cos(a)) * z]
  return [
    원(x, y, 0.42 * z, { 색, 굵기: 0.2 }),
    { t: '면', 고리들: [[R(0, -0.55), R(0.17, 0.25), R(0, 0.12)]], 채움: 색 },
    { t: '면', 고리들: [[R(0, -0.55), R(-0.17, 0.25), R(0, 0.12)]], 채움: '#ffffff', 선: 색, 굵기: 0.15 },
    글(...R(0, -0.78), 'N', 8, { 굵게: true, 색 }),
  ]
}
function 축척막대(x, y, V, 최대폭 = 60) {
  const mm당m = V.N / 1000
  const 후보 = [0.2, 0.5, 1, 2, 5, 10, 20, 50, 100]
  const 칸m = [...후보].reverse().find((m) => (m / mm당m) * 5 <= 최대폭) || 후보[0]
  const 칸 = 칸m / mm당m
  const out = []
  for (let i = 0; i < 5; i++) out.push(네모(x + i * 칸, y, 칸, 1.6, { 채움: i % 2 ? '#ffffff' : '#222222', 색: '#222222', 굵기: 0.15 }))
  for (const i of [0, 1, 5]) out.push(글(x + i * 칸, y + 4.2, `${+(칸m * i).toFixed(1)}${i === 5 ? ' m' : ''}`, 6.5, { 색: '#333' }))
  return { 도형들: out, 폭: 칸 * 5 }
}

/* ───────────────────────────── ① 컬러 평면도 */

/**
 * @param o { 종이:'A3', 방향:'가로', 색판, 무늬, 면적('㎡평'|'㎡'|'평'|''), 이름, 가구, 기타선, 벽채움, 제목, 부제, 방위(각 · null=안 그림), 축척(0=맞춤),
 *            방바꿈: {번호: {이름, 용도, 색, 무늬, 숨김}}, 면적기준('안목'|'도면'|'면적선'), 표(true), 범례(true), 날짜 }
 */
export function 컬러장면(D, o = {}) {
  const 종 = 종이크기(o.종이, o.방향)
  const W = 종.폭, H = 종.높이
  const 판 = 색판들[o.색판] || 색판들.부드럽게
  const 여 = W >= 500 ? 14 : 10
  const 가로 = W >= H
  const 패널 = 가로 ? Math.min(98, W * 0.25) : 0
  const 아래패널 = 가로 ? 0 : Math.min(92, H * 0.3)
  const 영역 = { x: 여 + 6, y: 여 + 6, w: W - 여 * 2 - 패널 - 12, h: H - 여 * 2 - 아래패널 - 12 }
  const V = 맞춤(D, 영역, o.축척 || 0)
  const 그림들 = []
  그림들.push(네모(0, 0, W, H, { 채움: '#ffffff' }))
  그림들.push(...평면그림(D, V, o))
  그림들.push(...방글들(D, V, o))
  /* 테두리 · 패널 */
  그림들.push(네모(여, 여, W - 여 * 2, H - 여 * 2, { 색: '#333333', 굵기: 0.35 }))
  const px = 가로 ? W - 여 - 패널 : 여, py = 가로 ? 여 : H - 여 - 아래패널, pw = 가로 ? 패널 : W - 여 * 2, ph = 가로 ? H - 여 * 2 : 아래패널
  if (가로) 그림들.push(선([[px, 여], [px, H - 여]], '#333333', 0.25))
  else 그림들.push(선([[여, py], [W - 여, py]], '#333333', 0.25))
  const 안x = px + 6, 안w = (가로 ? pw : pw / 2) - 12
  let y = py + 9
  const 제목 = o.제목 || ((D.제목 || '평면도').replace(/평면도/, '') + ' 컬러 평면도').trim()
  for (const 줄 of 나누기(제목, 안w, 15, true).slice(0, 2)) { 그림들.push(글(안x, y, 줄, 15, { 굵게: true, 정렬: '왼', 색: '#111' })); y += 7.2 }
  if (o.부제) for (const 줄 of 나누기(o.부제, 안w, 8.5).slice(0, 3)) { 그림들.push(글(안x, y, 줄, 8.5, { 정렬: '왼', 색: '#444' })); y += 4.4 }
  y += 3
  /* 면적표 */
  const 보일방 = D.방들.filter((R) => !R.이름없음 && !((o.방바꿈 || {})[R.번호] || {}).숨김)
  const 면 = (R) => (o.면적기준 === '도면' && R.도면면적 ? R.도면면적 : o.면적기준 === '면적선' && R.면적선 ? R.면적선 : R.면적)
  const 서비스 = (R) => (((o.방바꿈 || {})[R.번호] || {}).용도 || R.용도) === '발코니'
  const 줄들 = 보일방.map((R) => [String(((o.방바꿈 || {})[R.번호] || {}).이름 ?? R.이름).replace(/\(추정\)$/, ''), 면(R), 서비스(R)])
  if (o.표 !== false && 줄들.length) {
    const 칸y0 = y
    const 행 = Math.min(4.6, Math.max(3.3, ((가로 ? ph - (y - py) - 80 : ph - 22) / (줄들.length + 3))))
    const 크 = Math.min(8, 행 / PT / 1.45)
    const c1 = 안x, c2 = 안x + 안w * 0.62, c3 = 안x + 안w
    그림들.push(네모(안x, y, 안w, 행, { 채움: '#f1f3f5' }))
    그림들.push(글(c1 + 1.5, y + 행 / 2, '실', 크, { 굵게: true, 정렬: '왼' }), 글(c2, y + 행 / 2, '㎡', 크, { 굵게: true, 정렬: '오' }), 글(c3 - 1, y + 행 / 2, '평', 크, { 굵게: true, 정렬: '오' }))
    y += 행
    const 순 = [...줄들].sort((a, b) => (a[2] - b[2]) || 0)
    for (const [이름, A, 서] of 순) {
      그림들.push(글(c1 + 1.5, y + 행 / 2, 이름 + (서 ? ' *' : ''), 크, { 정렬: '왼', 색: '#222' }))
      그림들.push(글(c2, y + 행 / 2, 쉼(A), 크, { 정렬: '오', 색: '#222' }), 글(c3 - 1, y + 행 / 2, 쉼(평(A), 1), 크, { 정렬: '오', 색: '#555' }))
      그림들.push(선([[안x, y + 행], [안x + 안w, y + 행]], '#d5d9de', 0.1))
      y += 행
    }
    const 안합 = 줄들.filter((r) => !r[2]).reduce((s, r) => s + r[1], 0)
    const 서합 = 줄들.filter((r) => r[2]).reduce((s, r) => s + r[1], 0)
    그림들.push(네모(안x, y, 안w, 행, { 채움: '#f8f1e3' }))
    그림들.push(글(c1 + 1.5, y + 행 / 2, '실내 합계', 크, { 굵게: true, 정렬: '왼' }), 글(c2, y + 행 / 2, 쉼(안합), 크, { 굵게: true, 정렬: '오' }), 글(c3 - 1, y + 행 / 2, 쉼(평(안합), 1), 크, { 굵게: true, 정렬: '오' }))
    y += 행
    if (서합 > 0) {
      그림들.push(글(c1 + 1.5, y + 행 / 2, '* 발코니 · 다용도', 크, { 정렬: '왼', 색: '#555' }), 글(c2, y + 행 / 2, 쉼(서합), 크, { 정렬: '오', 색: '#555' }), 글(c3 - 1, y + 행 / 2, 쉼(평(서합), 1), 크, { 정렬: '오', 색: '#777' }))
      y += 행
    }
    그림들.push(네모(안x, 칸y0, 안w, y - 칸y0, { 색: '#9aa1a9', 굵기: 0.15 }))
    y += 2.5
    const 기준글 = o.면적기준 === '도면' ? '면적: 도면에 적힌 값(없으면 잰 안목)' : o.면적기준 === '면적선' ? '면적: 면적선(벽 가운데)' : '면적: 벽 안쪽(안목)으로 잰 값'
    for (const 줄 of 나누기(기준글 + ' — 계약 · 등기 면적과 다를 수 있습니다.', 안w, 6.2)) { 그림들.push(글(안x, y, 줄, 6.2, { 정렬: '왼', 색: '#6b7280' })); y += 3 }
    y += 3
  }
  /* 범례 */
  if (o.범례 !== false) {
    let bx = 가로 ? 안x : px + pw / 2 + 6
    let by = 가로 ? y : py + 9
    const 쓴용 = []
    for (const R of 보일방) { const u = ((o.방바꿈 || {})[R.번호] || {}).용도 || R.용도; if (!쓴용.includes(u)) 쓴용.push(u) }
    쓴용.sort((a, b) => 용도들.findIndex((u) => u.키 === a) - 용도들.findIndex((u) => u.키 === b))
    const 칸w = 안w / 2
    쓴용.forEach((u, n) => {
      const cx = bx + (n % 2) * 칸w, cy = by + Math.floor(n / 2) * 5.2
      그림들.push(네모(cx, cy - 1.8, 5, 3.6, { 채움: 판.색[u] || 판.색.기타, 색: '#777', 굵기: 0.12 }))
      그림들.push(글(cx + 6.5, cy, 용도이름[u] || u, 7, { 정렬: '왼', 색: '#333' }))
    })
    y = by + Math.ceil(쓴용.length / 2) * 5.2 + 3
  }
  /* 방위 · 축척 — 패널 아래 */
  const 아래y = 가로 ? H - 여 - 14 : py + ph - 12
  const 막대 = 축척막대(안x, 아래y, V, Math.min(55, 안w - 22))
  그림들.push(...막대.도형들)
  그림들.push(글(안x, 아래y - 4.5, `축척 1/${V.N} (${종.이름}${가로 ? '' : ' 세로'})`, 7.5, { 정렬: '왼', 색: '#333' }))
  if (o.방위 !== null && o.방위 !== undefined && o.방위 !== false) 그림들.push(...방위표(안x + 안w - 8, 아래y - 16, 13, o.방위))
  if (o.날짜) 그림들.push(글(안x + 안w, py + ph - 4, o.날짜, 6.5, { 정렬: '오', 색: '#888' }))
  return { 폭: W, 높이: H, 그림들, 변환: V, 축척: V.N, 종이: 종.이름 }
}

/* ───────────────────────────── ② 피난 안내도 */

export const 대처들 = [
  ['"불이야!" 크게 외치고 발신기(비상벨)를 누릅니다.', 'Shout "Fire!" and press the fire alarm button.'],
  ['젖은 수건으로 코와 입을 막고, 낮은 자세로 유도등을 따라 대피합니다.', 'Cover your nose and mouth with a wet cloth, stay low and follow the exit signs.'],
  ['승강기(엘리베이터)는 타지 말고 계단으로 대피합니다. 아래로 갈 수 없으면 옥상으로 갑니다.', 'Do not use elevators. Use the stairs; if you cannot go down, go up to the roof.'],
  ['문손잡이가 뜨거우면 열지 말고 다른 길로 갑니다.', 'If a door handle is hot, do not open it. Take another way.'],
  ['밖으로 나온 뒤 119에 신고합니다.', 'Once outside, call 119.'],
]
export const 소화기법 = [
  ['소화기를 불 가까이 옮기고 안전핀을 뽑습니다.', 'Bring it near the fire and pull the safety pin.'],
  ['바람을 등지고 서서 노즐(호스)을 불 쪽으로 향합니다.', 'Stand with the wind at your back and aim the nozzle at the fire.'],
  ['손잡이를 힘껏 움켜쥡니다.', 'Squeeze the handle firmly.'],
  ['빗자루로 쓸듯이 골고루 뿌립니다.', 'Sweep from side to side.'],
]
export const 소화전법 = [
  ['소화전함 문을 엽니다. (발신기를 눌러 알립니다)', 'Open the hydrant cabinet and press the alarm button.'],
  ['관창(노즐)을 잡고 호스를 불 가까이 펼칩니다.', 'Take the nozzle and stretch the hose toward the fire.'],
  ['밸브를 왼쪽(시계 반대 방향)으로 돌려 물을 엽니다.', 'Turn the valve counterclockwise to open the water.'],
  ['두 손으로 관창을 꽉 잡고 불을 향해 쏩니다. (두 사람이 함께)', 'Hold the nozzle firmly with both hands and spray at the fire.'],
]
export const 출구영어 = { 계단: 'Stairs', 출입구: 'Exit', 비상구: 'Emergency exit', 손: 'Exit' }

/** 길 합치기 — 이미 그린 길에 닿으면 거기서 끊음(겹친 화살이 두껍게 쌓이지 않게) */
function 길합치기(길들, 칸 = 1.6) {
  const 찬 = new Set()
  const 키 = (x, y) => Math.round(x / 칸) + ',' + Math.round(y / 칸)
  const out = []
  for (const 점들 of 길들) {
    const 표본 = []
    for (let i = 1; i < 점들.length; i++) {
      const a = 점들[i - 1], b = 점들[i]
      const L = Math.hypot(b[0] - a[0], b[1] - a[1])
      const n = Math.max(1, Math.ceil(L / 0.6))
      for (let s = i === 1 ? 0 : 1; s <= n; s++) 표본.push([a[0] + ((b[0] - a[0]) * s) / n, a[1] + ((b[1] - a[1]) * s) / n, i])
    }
    let 끝 = 표본.length - 1
    for (let q = 6; q < 표본.length; q++) { if (찬.has(키(표본[q][0], 표본[q][1]))) { 끝 = q; break } }
    const 남 = []
    for (let i = 0; i < 점들.length && (i === 0 || i < 표본[끝][2]); i++) 남.push(점들[i])
    남.push([표본[끝][0], 표본[끝][1]])
    for (let q = 0; q <= 끝; q++) { const [x, y] = 표본[q]; for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) 찬.add(키(x + dx * 칸, y + dy * 칸)) }
    out.push({ 점들: 남, 닿음: 끝 < 표본.length - 1 })
  }
  return out
}

/**
 * @param 길 피난길들() 결과 · @param 쪽 { 현위치방: 번호 | null, 현위치점: [x,y] | null, 이름 }
 * @param o { 종이: '자동'|'B4'|'A3', 업소, 층, 연락처, 작성일, 장비들, 출구들, 모든길(true), 다른길(true), 색판('흑백' 아님 · 방은 연하게), 방바꿈 }
 */
export function 피난장면(D, 길, 쪽, o = {}) {
  const 큰 = (D.발넓이 || 0) >= 400
  const 종이이름 = o.종이 === 'B4' ? 'B4' : o.종이 === 'A3' ? 'A3' : 큰 ? 'A3' : 'B4'
  const 종 = 종이크기(종이이름, '가로')
  const W = 종.폭, H = 종.높이
  const 여 = 7, 머리h = 19
  const 패널 = 종이이름 === 'A3' ? 112 : 100
  const 영역 = { x: 여 + 5, y: 여 + 머리h + 6, w: W - 여 * 2 - 패널 - 10, h: H - 여 * 2 - 머리h - 12 }
  const V = 맞춤(D, 영역, 0)
  const 그림들 = [네모(0, 0, W, H, { 채움: '#ffffff' })]
  /* 평면 — 연한 바탕 · 현위치 실은 붉게 */
  const 현방 = 쪽.현위치방 ?? -1
  그림들.push(...평면그림(D, V, {
    ...o, 무늬: false, 가구: o.가구 === true, 기타선: false, 벽채움: true, 벽색: '#4d4d4d', 창색: '#5b8fbd', 색판: '부드럽게',
    방색: (R, 용) => (R.번호 === 현방 ? '#FFE3DF' : 용 === '코어' && /계단|STAIR/i.test(R.이름 || '') ? '#DDF1E4' : R.이름없음 ? '#f5f5f5' : '#ffffff'),
  }))
  그림들.push(...방글들(D, V, { ...o, 면적: '', 이름크기: 7.5, 글색: '#555555', 색판: '부드럽게' }))
  /* 길 */
  const 길들 = 길 ? 길.길들 : new Map()
  const 종이길 = (w) => w.점들.map(([x, y]) => 종이점(V, x, y))
  if (o.모든길 !== false && 길) {
    const 나무 = 길.나무 ? 길.나무(현방, 쪽.내길 && 쪽.내길.첫 ? 쪽.내길.첫.칸들 : null).map((g) => ({ 점들: g.점들.map(([x, y]) => 종이점(V, x, y)), 닿음: g.닿음 }))
      : 길합치기([...길들.entries()].filter(([b, w]) => b !== 현방 && w.첫).sort((a, b) => b[1].첫.길이 - a[1].첫.길이).map(([, w]) => 종이길(w.첫)))
    for (const g0 of 나무) {
      const g = { ...g0, 점들: 앞자르기(g0.점들, 4.5) }
      if (g.점들.length < 2) continue
      그림들.push(선(g.점들, '#36a76a', 1.0, { 끝: '둥' }))
      그림들.push(...꺾쇠들(g.점들, 9, 0.9, '#ffffff', 0.9))
      if (!g.닿음) { const n = g.점들.length; const a = g.점들[n - 2], b = g.점들[n - 1]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; 그림들.push(화살머리(b, [(b[0] - a[0]) / L, (b[1] - a[1]) / L], 3, '#36a76a')) }
    }
  }
  const 내길 = 쪽.내길 || (현방 >= 0 ? 길들.get(현방) : null)
  if (내길 && 내길.둘 && o.다른길 !== false) {
    const p = 앞자르기(종이길(내길.둘), 5)
    그림들.push(선(p, 주황, 1.1, { 점선: [2.4, 1.6], 끝: '둥' }))
    const n = p.length, a = p[n - 2], b = p[n - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    그림들.push(화살머리(b, [(b[0] - a[0]) / L, (b[1] - a[1]) / L], 3.4, 주황))
  }
  if (내길 && 내길.첫) {
    const p = 앞자르기(종이길(내길.첫), 5)
    그림들.push(선(p, 초록, 1.9, { 끝: '둥' }))
    그림들.push(...꺾쇠들(p, 7, 1.1, '#ffffff', 1.9))
    const n = p.length, a = p[n - 2], b = p[n - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    그림들.push(화살머리(b, [(b[0] - a[0]) / L, (b[1] - a[1]) / L], 5, 초록))
  }
  /* 설비 · 출구 · 현위치 */
  const 아z = 종이이름 === 'A3' ? 6 : 5.2
  const 장비들 = o.장비들 || D.장비들
  for (const e of 장비들) { const [x, y] = 종이점(V, e.x, e.y); 그림들.push(...아이콘(e.종류, x, y, 아z)) }
  const 출구들 = (o.출구들 || D.출구들).filter((x) => x.켬 !== false)
  for (const x of 출구들) {
    const [ex, ey] = 종이점(V, x.x, x.y)
    그림들.push(...아이콘('비상구', ex, ey, 아z * 1.45))
    const 말 = x.종류 === '계단' ? '계단' : x.종류 === '출입구' ? '출입구' : '비상구'
    /* 글은 바깥(출입구) · 계단실 안(계단) 쪽으로 — 방 이름과 안 겹치게 */
    let [tx, ty] = x.밖x !== undefined ? 종이점(V, x.밖x, x.밖y) : x.방 !== undefined && x.방 >= 0 && D.방들[x.방] ? 종이점(V, D.방들[x.방].라벨[0], D.방들[x.방].라벨[1]) : [ex, ey + 10]
    let dx = tx - ex, dy = ty - ey
    const L = Math.hypot(dx, dy) || 1
    dx /= L; dy /= L
    const 글말 = `${말} ${출구영어[x.종류] || 'Exit'}`
    const gw = 글폭(글말, 6.2, true)
    const d = 아z * 0.75 + 2 + Math.abs(dx) * gw / 2
    그림들.push(네모(ex + dx * d - gw / 2 - 0.8, ey + dy * d - 2, gw + 1.6, 4, { 채움: '#ffffff', 둥: 0.6 }))
    그림들.push(글(ex + dx * d, ey + dy * d, 글말, 6.2, { 굵게: true, 색: 초록 }))
  }
  if (현방 >= 0 || 쪽.현위치점) {
    const R = 현방 >= 0 ? D.방들[현방] : null
    const [hx, hy] = 쪽.현위치점 ? 종이점(V, 쪽.현위치점[0], 쪽.현위치점[1]) : 종이점(V, R.라벨[0], R.라벨[1])
    /* 방 이름 글(가운데) 위 · 아래로 비켜 놓음 */
    const 비 = 쪽.현위치점 ? 0 : 4.2
    const 표y = hy + 비 + 5.2
    그림들.push(...아이콘('현위치', hx, hy - 비 - 3.2, 아z * 1.25))
    const 말 = '현위치 YOU ARE HERE'
    const w = 글폭(말, 7.5, true) + 4
    그림들.push(네모(hx - w / 2, 표y - 2.6, w, 5.2, { 채움: 빨강, 둥: 1 }))
    그림들.push(글(hx, 표y, 말, 7.5, { 굵게: true, 색: '#ffffff' }))
  }
  /* 머리 띠 */
  그림들.push(네모(여, 여, W - 여 * 2, 머리h, { 채움: 초록 }))
  그림들.push(글(여 + 7, 여 + 머리h / 2 - 1.2, '피난안내도', 24, { 굵게: true, 정렬: '왼', 색: '#ffffff' }))
  const 제폭 = 글폭('피난안내도', 24, true)
  그림들.push(글(여 + 9 + 제폭, 여 + 머리h / 2 + 2.2, 'EVACUATION MAP', 11, { 굵게: true, 정렬: '왼', 색: '#d9f2e3' }))
  const 오른 = [o.업소, o.층].filter(Boolean).join(' · ')
  if (오른) 그림들.push(글(W - 여 - 7, 여 + 6.5, 오른, 12, { 굵게: true, 정렬: '오', 색: '#ffffff' }))
  const 쪽말 = 현방 >= 0 ? `현위치: ${(D.방들[현방].이름 || '').replace(/\(추정\)$/, '')}` : 쪽.이름 || '전체 피난 경로'
  그림들.push(글(W - 여 - 7, 여 + 13.8, 쪽말, 9.5, { 정렬: '오', 색: '#ffffff' }))
  /* 바깥 테두리 */
  그림들.push(네모(여, 여, W - 여 * 2, H - 여 * 2, { 색: 초록, 굵기: 0.8 }))
  /* 오른쪽 판 */
  const px = W - 여 - 패널, py = 여 + 머리h
  그림들.push(선([[px, py], [px, H - 여]], '#9ca3af', 0.25))
  const 안x = px + 5, 안w = 패널 - 10
  const 판도형 = 피난판(안x, py + 4, 안w, H - 여 - (py + 4) - 3, { ...o, 장비들, 출구들, 소화전: 장비들.some((e) => e.종류 === '소화전') || o.소화전 === true })
  그림들.push(...판도형)
  /* 축척 · 방위 (평면 왼쪽 아래) */
  const 막대 = 축척막대(영역.x, H - 여 - 6.5, V, 60)
  그림들.push(...막대.도형들)
  if (o.방위 !== null && o.방위 !== undefined && o.방위 !== false) 그림들.push(...방위표(영역.x + 막대.폭 + 12, H - 여 - 9, 10, o.방위))
  return { 폭: W, 높이: H, 그림들, 변환: V, 축척: V.N, 종이: 종이이름 }
}

/** 오른쪽 판 — 범례 · 행동요령 · 소화기 · 옥내소화전 · 119 (넘치면 글을 줄임) */
function 피난판(x, y0, w, h, o) {
  for (let 배 = 1; 배 >= 0.62; 배 -= 0.04) {
    const r = 판짓기(x, y0, w, o, 배)
    if (r.높이 <= h) return r.도형들
  }
  return 판짓기(x, y0, w, o, 0.6).도형들
}
function 판짓기(x, y0, w, o, 배) {
  const 도 = []
  let y = y0
  const 영 = o.영어 !== false
  const 머리 = (ko, en, 색) => {
    const hh = 6.2 * 배 + 1
    도.push(네모(x, y, w, hh, { 채움: 색, 둥: 0.8 }))
    도.push(글(x + 2.5, y + hh / 2, ko, 9.5 * 배, { 굵게: true, 정렬: '왼', 색: '#ffffff' }))
    if (영) 도.push(글(x + w - 2.5, y + hh / 2, en, 6.6 * 배, { 굵게: true, 정렬: '오', 색: '#ffffff' }))
    y += hh + 2.2 * 배
  }
  const 문단 = (번호, ko, en, 색 = '#111') => {
    const 들 = 번호 ? 5.2 * 배 : 0
    const 크 = 7.6 * 배, 영크 = 6.1 * 배
    const 줄 = 나누기(ko, w - 들, 크)
    const 영줄 = 영 && en ? 나누기(en, w - 들, 영크) : []
    if (번호) { 도.push(원(x + 2.1 * 배, y + 크 * PT * 0.55, 2.0 * 배, { 채움: 색 })); 도.push(글(x + 2.1 * 배, y + 크 * PT * 0.55, 번호, 6.4 * 배, { 굵게: true, 색: '#fff' })) }
    for (const s of 줄) { 도.push(글(x + 들, y + 크 * PT * 0.55, s, 크, { 정렬: '왼', 색: '#111' })); y += 크 * PT * 1.32 }
    for (const s of 영줄) { 도.push(글(x + 들, y + 영크 * PT * 0.55, s, 영크, { 정렬: '왼', 색: '#555' })); y += 영크 * PT * 1.3 }
    y += 1.3 * 배
  }
  /* 범례 */
  머리('범례', 'LEGEND', '#374151')
  const 항 = [['현위치', '현위치', 'You are here'], ['비상구', '비상구 · 계단', 'Emergency exit · Stairs'], ['길', '피난 경로', 'Evacuation route'], ['다른길', '다른 대피 경로', 'Alternative route']]
  for (const k of ['소화기', '소화전', '발신기', '완강기']) if ((o.장비들 || []).some((e) => e.종류 === k)) 항.push([k, 장비이름[k], 장비영어[k]])
  const 칸w = w / 2
  항.forEach(([k, ko, en], n) => {
    const cx = x + (n % 2) * 칸w, cy = y + Math.floor(n / 2) * 8.2 * 배 + 3 * 배
    const z = 5 * 배
    if (k === '길') { 도.push(선([[cx + 0.3, cy], [cx + z + 0.6, cy]], '#36a76a', 1.4 * 배)); 도.push(화살머리([cx + z + 1.2, cy], [1, 0], 2.4 * 배, '#36a76a')) }
    else if (k === '다른길') { 도.push(선([[cx + 0.3, cy], [cx + z + 0.6, cy]], 주황, 1.1 * 배, { 점선: [1.6, 1] })); 도.push(화살머리([cx + z + 1.2, cy], [1, 0], 2.4 * 배, 주황)) }
    else 도.push(...아이콘(k, cx + z / 2 + 0.3, cy, z))
    도.push(글(cx + z + 3, cy - (영 ? 1.25 * 배 : 0), ko, 7 * 배, { 정렬: '왼', 굵게: true, 색: '#111' }))
    if (영) 도.push(글(cx + z + 3, cy + 2.2 * 배, en, 5.4 * 배, { 정렬: '왼', 색: '#555' }))
  })
  y += Math.ceil(항.length / 2) * 8.2 * 배 + 1.5 * 배
  머리('화재가 나면', 'IN CASE OF FIRE', 빨강)
  대처들.forEach(([ko, en], i) => 문단(String(i + 1), ko, en, 빨강))
  머리('소화기 사용법', 'FIRE EXTINGUISHER', '#b91c1c')
  소화기법.forEach(([ko, en], i) => 문단(String(i + 1), ko, en, '#b91c1c'))
  if (o.소화전) {
    머리('옥내소화전 사용법', 'INDOOR FIRE HYDRANT', '#9a3412')
    소화전법.forEach(([ko, en], i) => 문단(String(i + 1), ko, en, '#9a3412'))
  }
  /* 119 · 연락처 */
  y += 1
  const hh = 11 * 배
  도.push(네모(x, y, w, hh, { 채움: '#fff1f1', 색: 빨강, 굵기: 0.4, 둥: 1.2 }))
  도.push(글(x + 3, y + hh / 2 - (영 ? 1.4 * 배 : 0), '화재 · 구조 · 구급', 8 * 배, { 굵게: true, 정렬: '왼', 색: 빨강 }))
  if (영) 도.push(글(x + 3, y + hh / 2 + 2.6 * 배, 'Fire · Rescue · Ambulance', 5.6 * 배, { 정렬: '왼', 색: '#7f1d1d' }))
  도.push(글(x + w - 3, y + hh / 2, '119', 20 * 배, { 굵게: true, 정렬: '오', 색: 빨강 }))
  y += hh + 2
  const 끝줄 = [o.연락처 ? `관리자 연락처 ☎ ${o.연락처}` : '', o.작성일 ? `작성일 ${o.작성일}` : ''].filter(Boolean)
  for (const s of 끝줄) { 도.push(글(x, y + 2, s, 7 * 배, { 정렬: '왼', 색: '#333' })); y += 4.2 * 배 }
  return { 도형들: 도, 높이: y - y0 }
}

/** 별표 2의2 맞춤 점검(화면용) */
export function 기준점검(D, 길, o = {}) {
  const 출 = (o.출구들 || D.출구들).filter((x) => x.켬 !== false)
  const 장 = o.장비들 || D.장비들
  const 큰 = (D.발넓이 || 0) >= 400
  const 종이 = o.종이 === 'B4' ? 'B4' : o.종이 === 'A3' ? 'A3' : 큰 ? 'A3' : 'B4'
  const 실들 = D.방들.filter((R) => !R.이름없음)
  const 길난 = 길 ? 실들.filter((R) => 길.길들.get(R.번호)?.첫).length : 0
  const 길없음 = 길 ? 실들.filter((R) => !길.길들.get(R.번호)?.첫 && !출.some((x) => x.방 === R.번호)).map((R) => R.이름) : []
  return [
    { 됨: 출.length > 0, 글: `비상구 · 출입구 위치 — ${출.length}곳`, 근거: '제5호 가목' },
    { 됨: 길난 > 0 && 길없음.length === 0, 글: `구획된 실에서 비상구 · 출입구까지 피난 동선 — ${길난}실${길없음.length ? ` (길 못 찾음: ${길없음.slice(0, 4).join(', ')}${길없음.length > 4 ? ' …' : ''})` : ''}`, 근거: '제5호 나목' },
    { 됨: 장.some((e) => e.종류 === '소화기' || e.종류 === '소화전'), 글: `소화기 · 옥내소화전 위치(${장.filter((e) => e.종류 === '소화기').length} · ${장.filter((e) => e.종류 === '소화전').length}) 와 사용방법`, 근거: '제5호 다목' },
    { 됨: true, 글: '피난 및 대처방법', 근거: '제5호 라목' },
    { 됨: true, 글: '광고 등 혼선을 줄 내용 없음', 근거: '제5호 단서' },
    { 됨: !(큰 && 종이 === 'B4'), 글: `크기 ${종이} — B4 이상${큰 ? ' · 바닥면적 400㎡ 이상이라 A3 이상' : ''} (재 바닥 ${Math.round(D.발넓이 || 0)}㎡)`, 근거: '제6호' },
    { 됨: o.영어 !== false, 글: '한글 + 외국어(영어) 1개 이상', 근거: '제7호' },
    { 됨: null, 글: '재질: 코팅한 종이 · 아크릴 · 강판 등 쉽게 훼손 · 변형되지 않는 것으로 출력', 근거: '제6호' },
    { 됨: null, 글: '비치: 영업장 주 출입구 곁 + 구획된 실마다(벽 · 탁자 등 손님이 쉽게 보는 곳)', 근거: '제3호' },
  ]
}
