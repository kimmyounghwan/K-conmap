/* 🖋 G780 (2026-11-19) 도장 만들기 — 셈 · 그리기 (화면 pages/Dojang.jsx · 시험 tools/시험_도장.mjs)
 *   소장님 「도장만들기 도구 이것도 만들어 줘...사이트 찾아보고 최대한 간단하면서 실용적이게」 → 기획(이름 도장 · 회사 직인 · 도장 사진 → 투명) → 「서식까지 연결하게 해줘」
 *   (다른 곳 셋 살펴봄: 이름만 넣고 모양 · 서체 고르면 512 투명 PNG · 법인 직인 꼴 · 실물 도장 사진 → 배경 지우기)
 *   ■ 이름 도장: 글 1~4자(+«인») · 원 · 타원 · 네모 · 명조 · 고딕 · 인주 빨강 · 검정 · 번짐(찍은 맛)
 *     글자 배치는 옛 도장 차례 — 셋까지는 위에서 아래로 한 줄 · 넷은 오른쪽 줄 위→아래 다음 왼쪽 줄(2 × 2) · 다섯부터는 칸을 늘림
 *   ■ 회사 직인: 원형 = 바깥 둘레에 회사 이름 · 안쪽 원에 가운데 글(대표이사인) / 네모 = 회사 이름 + 가운데 글을 칸에 나눠(오른쪽 줄부터)
 *   ■ 도장 사진 → 투명: 종이에 찍은 도장 사진에서 흰 바탕을 지우고 도장만(빨간 도장은 붉은 정도 · 검은 도장은 바탕보다 어두운 정도) · 테두리 밖은 잘라 정사각형
 *   ■ 모두 이 기기 안에서 그림을 만듭니다(서버로 안 감) · 그리기는 캔버스 2D 만 씀 — node 시험(@napi-rs/canvas)에서도 같은 함수
 */

export const 인주 = { 빨강: '#cf1f25', 검정: '#1f1f22' }
export const 모양들 = [['원', '⭕ 원'], ['타원', '🥚 타원'], ['네모', '⬜ 네모']]
export const 글꼴들 = {
  명조: '"Batang","바탕","AppleMyungjo","Noto Serif KR","Noto Serif CJK KR","Nanum Myeongjo",serif',
  고딕: '"Malgun Gothic","맑은 고딕","Apple SD Gothic Neo","Noto Sans KR","Noto Sans CJK KR",sans-serif',
}
export const 이름최대 = 4
export const 둘레최대 = 16
export const 가운데최대 = 6

/** 글 정리 — 띄어쓰기 · 보이지 않는 글자 빼고 · 한 글자씩(한자 · 한글 · 영문 · 숫자 · ㈜ ) · n 자까지 */
export function 글정리(s, n = 이름최대) {
  const t = String(s == null ? '' : s).normalize('NFC').replace(/[\s\u200b-\u200f\u2028\u2029\ufeff]/g, '')
  return [...t].filter((c) => /[\p{L}\p{N}㈜()·]/u.test(c)).slice(0, n)
}

/** 글자 칸 나누기 — 글자 n 개를 [0,1]×[0,1] 상자에 옛 도장 차례로(오른쪽 줄부터 · 위에서 아래로) → [{x, y, w, h}] */
export function 칸나누기(n) {
  if (!(n > 0)) return []
  if (n <= 3) return Array.from({ length: n }, (_, i) => ({ x: 0, y: i / n, w: 1, h: 1 / n }))
  /* 세로줄 수 — 넷 2 · 다섯 · 여섯 2(3 + 2 · 3 + 3) · 일곱 ~ 열둘 3 · 그 위 4 / 줄마다 글자 수는 고르게(오른쪽 줄이 하나 더) */
  const 줄 = n <= 6 ? 2 : n <= 12 ? 3 : 4
  const 밑 = Math.floor(n / 줄), 남 = n % 줄
  const 칸 = []
  for (let k = 0; k < 줄; k++) {
    const 이줄 = 밑 + (k < 남 ? 1 : 0)                          /* 이 줄 글자는 줄 높이를 나눠 가짐 */
    const x = (줄 - 1 - k) / 줄
    for (let i = 0; i < 이줄; i++) 칸.push({ x, y: i / 이줄, w: 1 / 줄, h: 1 / 이줄 })
  }
  return 칸
}

/** 이름 도장 글 상자(크기 S 에 대한 비율) — 테두리 안쪽에 맞춤 */
export function 이름상자(모양, n) {
  const 넷 = n >= 4
  if (모양 === '타원') return 넷 ? { w: 0.4, h: 0.6 } : { w: 0.38, h: 0.6 }
  if (모양 === '네모') return { w: 0.74, h: 0.74 }
  return 넷 ? { w: 0.56, h: 0.56 } : { w: 0.46, h: 0.66 }          /* 원 */
}

/* 씨앗 있는 난수(번짐이 그릴 때마다 바뀌지 않게) */
export function 씨앗난수(글) {
  let h = 2166136261 >>> 0
  for (const c of String(글 || '')) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0 }
  let a = h || 1
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/** 한 글자를 칸에 꽉 차게(글자 잉크 상자 기준 · 가로세로 따로 늘리되 1.9배 넘게 찌그러뜨리지 않음) */
export function 글자넣기(ctx, ch, 칸, 글꼴, 굵기 = 0) {
  const 기준 = 200
  ctx.font = `bold ${기준}px ${글꼴}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  const m = ctx.measureText(ch)
  const L = Number(m.actualBoundingBoxLeft) || 0, R = Number(m.actualBoundingBoxRight) || m.width || 0
  const A = Number(m.actualBoundingBoxAscent) || 기준 * 0.8, Dd = Number(m.actualBoundingBoxDescent) || 0
  const 잉크w = L + R, 잉크h = A + Dd
  if (!(잉크w > 1 && 잉크h > 1)) return false
  let sx = (칸.w * 0.9) / 잉크w, sy = (칸.h * 0.88) / 잉크h
  if (sx / sy > 1.9) sx = sy * 1.9
  if (sy / sx > 1.9) sy = sx * 1.9
  ctx.save()
  ctx.translate(칸.x + 칸.w / 2, 칸.y + 칸.h / 2)
  ctx.scale(sx, sy)
  const ox = -(R - L) / 2, oy = (A - Dd) / 2
  ctx.fillText(ch, ox, oy)
  if (굵기 > 0) { ctx.lineJoin = 'round'; ctx.lineWidth = 굵기 / ((sx + sy) / 2); ctx.strokeText(ch, ox, oy) }
  ctx.restore()
  return true
}

function 테두리(ctx, S, 모양, 굵기) {
  ctx.lineWidth = 굵기
  ctx.beginPath()
  if (모양 === '타원') ctx.ellipse(S / 2, S / 2, S * 0.33, S * 0.46, 0, 0, Math.PI * 2)
  else if (모양 === '네모') {
    const a = S * 0.06, b = S * 0.94, r = S * 0.05
    ctx.moveTo(a + r, a); ctx.lineTo(b - r, a); ctx.arcTo(b, a, b, a + r, r); ctx.lineTo(b, b - r); ctx.arcTo(b, b, b - r, b, r)
    ctx.lineTo(a + r, b); ctx.arcTo(a, b, a, b - r, r); ctx.lineTo(a, a + r); ctx.arcTo(a, a, a + r, a, r); ctx.closePath()
  } else ctx.arc(S / 2, S / 2, S * 0.46, 0, Math.PI * 2)
  ctx.stroke()
}

/* 글자들을 상자(가운데 맞춤 · S 비율)에 칸 나눠 넣기 */
function 칸에쓰기(ctx, S, 글자, 상자, 글꼴, 굵기) {
  const W = 상자.w * S, H = 상자.h * S, x0 = S / 2 - W / 2 + (상자.dx || 0) * S, y0 = S / 2 - H / 2 + (상자.dy || 0) * S
  const 칸 = 칸나누기(글자.length)
  let 그린 = 0
  글자.forEach((ch, i) => { const c = 칸[i]; if (글자넣기(ctx, ch, { x: x0 + c.x * W, y: y0 + c.y * H, w: c.w * W, h: c.h * H }, 글꼴, 굵기)) 그린++ })
  return 그린
}

/** 번짐 — 찍은 도장처럼 군데군데 잉크가 덜 묻은 자리(씨앗 난수라 같은 글이면 늘 같은 모양) */
export function 번지기(ctx, S, 씨앗글) {
  const 난 = 씨앗난수(씨앗글)
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  const n = Math.round(S * 0.7)
  for (let i = 0; i < n; i++) {
    const x = 난() * S, y = 난() * S, r = S * (0.0015 + 난() * 0.0055)
    ctx.globalAlpha = 0.18 + 난() * 0.42
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
}

/**
 * 도장 그리기 — ctx(크기 S×S)에 투명 바탕으로
 * @param o { 종류: '이름'|'직인', 글, 인붙임, 모양: '원'|'타원'|'네모', 글꼴: '명조'|'고딕', 색: '빨강'|'검정', 번짐, 둘레글, 가운데글 }
 * @returns { 그린: 글자 수, 글자: [...] } — 그린 글자가 0 이면 빈 그림
 */
export function 도장그리기(ctx, S, o = {}) {
  const 색 = 인주[o.색] || 인주.빨강
  const 글꼴 = 글꼴들[o.글꼴] || 글꼴들.명조
  const 모양 = ['원', '타원', '네모'].includes(o.모양) ? o.모양 : '원'
  ctx.clearRect(0, 0, S, S)
  ctx.save()
  ctx.fillStyle = 색; ctx.strokeStyle = 색
  const 굵기 = S * (o.글꼴 === '고딕' ? 0.004 : 0.007)
  let 그린 = 0, 글자 = []
  if (o.종류 === '직인') {
    const 둘레 = 글정리(o.둘레글, 둘레최대)
    const 가운데 = 글정리(o.가운데글 == null ? '대표이사인' : o.가운데글, 가운데최대)
    if (모양 === '네모') {
      테두리(ctx, S, '네모', S * 0.05)
      글자 = [...둘레, ...가운데]
      그린 = 칸에쓰기(ctx, S, 글자, { w: 0.74, h: 0.74 }, 글꼴, 굵기)
    } else {
      ctx.lineWidth = S * 0.04; ctx.beginPath(); ctx.arc(S / 2, S / 2, S * 0.47, 0, Math.PI * 2); ctx.stroke()
      ctx.lineWidth = S * 0.015; ctx.beginPath(); ctx.arc(S / 2, S / 2, S * 0.3, 0, Math.PI * 2); ctx.stroke()
      /* 둘레 — 위 가운데부터 양쪽으로 · 글자 위가 바깥을 봄 · 330° 안 */
      const rr = S * 0.379, 칸w = S * 0.112, 칸h = S * 0.112
      const 한각 = Math.min(칸w / rr * 1.08, (Math.PI * 2 * 330 / 360) / Math.max(1, 둘레.length))
      const 처음 = -Math.PI / 2 - (한각 * (둘레.length - 1)) / 2
      둘레.forEach((ch, i) => {
        const a = 처음 + 한각 * i
        ctx.save(); ctx.translate(S / 2 + rr * Math.cos(a), S / 2 + rr * Math.sin(a)); ctx.rotate(a + Math.PI / 2)
        const w = Math.min(칸w, rr * 한각 * 0.96)
        if (글자넣기(ctx, ch, { x: -w / 2, y: -칸h / 2, w, h: 칸h }, 글꼴, 굵기 * 0.8)) 그린++
        ctx.restore()
      })
      const n = 가운데.length
      const 상자 = n <= 3 ? { w: 0.26, h: 0.42 } : n === 4 ? { w: 0.38, h: 0.38 } : { w: 0.3, h: 0.4 }
      그린 += 칸에쓰기(ctx, S, 가운데, 상자, 글꼴, 굵기)
      글자 = [...둘레, ...가운데]
    }
  } else {
    글자 = 글정리(o.글, 이름최대)
    if (o.인붙임 && 글자.length > 0 && 글자.length < 이름최대) 글자 = [...글자, /[一-鿿]/.test(글자.join('')) ? '印' : '인']
    테두리(ctx, S, 모양, S * 0.045)
    그린 = 칸에쓰기(ctx, S, 글자, 이름상자(모양, 글자.length), 글꼴, 굵기)
  }
  ctx.restore()
  if (o.번짐) 번지기(ctx, S, [o.종류, ...글자, 모양].join('|'))
  return { 그린, 글자 }
}

/* ── 📷 도장 사진 → 투명 ──────────────────────────────────────────────────────────────────── */
const 휘도 = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b

/** 사진이 빨간 도장인가 검은 도장인가 — 붉은 점(r − max(g, b) > 55)이 0.3% 넘으면 빨강 */
export function 잉크짐작(data) {
  let 붉음 = 0, 모두 = 0
  for (let i = 0; i < data.length; i += 16) { 모두++; if (data[i] - Math.max(data[i + 1], data[i + 2]) > 55) 붉음++ }
  return 모두 && 붉음 / 모두 > 0.003 ? '빨강' : '검정'
}

/**
 * 도장만 남기기 — { data(RGBA), width, height } → { data, width, height, 상자: {x, y, w, h} | null, 잉크 }
 * @param o { 잉크: '자동'|'빨강'|'검정', 진하기: 0~100(50 보통 · 높을수록 옅은 잉크까지 남김), 색: '빨강'|'검정'|'그대로' }
 */
export function 도장뽑기(img, o = {}) {
  const { width: W, height: H } = img
  const src = img.data
  const 잉크 = o.잉크 === '빨강' || o.잉크 === '검정' ? o.잉크 : 잉크짐작(src)
  const 진 = Math.max(0, Math.min(100, Number.isFinite(+o.진하기) ? +o.진하기 : 50))
  const out = new Uint8ClampedArray(W * H * 4)
  /* 바탕 밝기 — 검은 도장일 때 기준(밝은 쪽 90%) */
  let 바탕 = 235
  if (잉크 === '검정') {
    const 칸 = new Uint32Array(256)
    for (let i = 0; i < src.length; i += 4) 칸[Math.round(휘도(src[i], src[i + 1], src[i + 2]))]++
    let 누 = 0; const 목표 = (W * H) * 0.9
    for (let v = 0; v < 256; v++) { 누 += 칸[v]; if (누 >= 목표) { 바탕 = v; break } }
  }
  const t0 = 잉크 === '빨강' ? 46 - (진 - 50) * 0.5 : 55 - (진 - 50) * 0.6
  const t1 = t0 + (잉크 === '빨강' ? 55 : 70)
  const 색 = o.색 === '그대로' ? null : (인주[o.색] || 인주[잉크]).match(/\w\w/g).map((h) => parseInt(h, 16))
  const 열 = new Float64Array(W), 행 = new Float64Array(H)
  for (let y = 0, i = 0; y < H; y++) {
    for (let x = 0; x < W; x++, i += 4) {
      const r = src[i], g = src[i + 1], b = src[i + 2]
      const 점 = 잉크 === '빨강' ? r - Math.max(g, b) : 바탕 - 휘도(r, g, b)
      let a = (점 - t0) / (t1 - t0)
      a = a <= 0.08 ? 0 : a >= 1 ? 1 : a
      if (!a) continue
      if (색) { out[i] = 색[0]; out[i + 1] = 색[1]; out[i + 2] = 색[2] } else { out[i] = r; out[i + 1] = g; out[i + 2] = b }
      out[i + 3] = Math.round(a * 255)
      열[x] += a; 행[y] += a
    }
  }
  const 상자 = 잉크상자(열, 행)
  return { data: out, width: W, height: H, 상자, 잉크 }
}

/** 잉크 상자 — 줄 · 칸마다 잉크 합이 가장 큰 것의 6% 넘는 곳(먼지 · 그림자 점은 빼고) */
export function 잉크상자(열, 행) {
  const 끝 = (v) => {
    let m = 0
    for (const x of v) if (x > m) m = x
    if (!(m > 0)) return null
    const 문 = m * 0.06
    let a = 0, b = v.length - 1
    while (a < v.length && v[a] < 문) a++
    while (b > a && v[b] < 문) b--
    return [a, b]
  }
  const X = 끝(열), Y = 끝(행)
  if (!X || !Y) return null
  return { x: X[0], y: Y[0], w: X[1] - X[0] + 1, h: Y[1] - Y[0] + 1 }
}

/** 잘라 정사각형으로 — 상자 둘레에 여백(긴 변의 6%) · 결과 크기 S */
export function 정사각자리(상자, W, H, 여백 = 0.06) {
  if (!상자) return null
  const 변 = Math.max(상자.w, 상자.h) * (1 + 여백 * 2)
  const cx = 상자.x + 상자.w / 2, cy = 상자.y + 상자.h / 2
  return { x: cx - 변 / 2, y: cy - 변 / 2, 변, W, H }
}
