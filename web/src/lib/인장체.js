/* 🖋 G780b (2026-11-19) 인장체 — 한글 한 글자를 «선» 으로 그림(글꼴 없이 · 어느 기기에서나 같은 모양)
 *   소장님 「캡쳐 준 것처럼 만들어」 「○○이랑 비슷하게 만들어야지...잘 만들어 줘」 — 전자도장처럼 획 굵기가 고르고 글자가 칸을 꽉 채우는 도장 글씨
 *   ■ 한글 음절 = 첫소리(19) + 가운뎃소리(21) + 끝소리(27) — 유니코드 셈으로 풀고, 자리(왼쪽 · 위 · 아래)를 나눠 자모마다 곧은 선 · 동그라미로
 *   ■ 칸(x, y, w, h)을 꽉 채움 · 획 굵기는 칸 크기와 상관없이 «획» px 하나(가로로 넓은 칸이어도 가로획 · 세로획 굵기가 같음)
 *   ■ 한글 음절이 아니면(한자 · 영문 · 숫자 · ㈜ …) false — 부르는 쪽이 글꼴로 그림
 *   그리기는 캔버스 2D 만(moveTo · lineTo · ellipse · stroke) — node 시험(@napi-rs/canvas)에서도 같은 함수 · 시험 tools/시험_도장.mjs
 */
const 첫 = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
const 가운데 = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'
const 끝 = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
const 겹 = { 'ㄲ': 'ㄱㄱ', 'ㄸ': 'ㄷㄷ', 'ㅃ': 'ㅂㅂ', 'ㅆ': 'ㅅㅅ', 'ㅉ': 'ㅈㅈ', 'ㄳ': 'ㄱㅅ', 'ㄵ': 'ㄴㅈ', 'ㄶ': 'ㄴㅎ', 'ㄺ': 'ㄹㄱ', 'ㄻ': 'ㄹㅁ', 'ㄼ': 'ㄹㅂ', 'ㄽ': 'ㄹㅅ', 'ㄾ': 'ㄹㅌ', 'ㄿ': 'ㄹㅍ', 'ㅀ': 'ㄹㅎ', 'ㅄ': 'ㅂㅅ' }
const 세로 = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅣ', 가로 = 'ㅗㅛㅜㅠㅡ'

/** 한글 음절 풀기 — '홍' → { 초: 'ㅎ', 중: 'ㅗ', 종: 'ㅇ' } · 음절이 아니면 null */
export function 한글풀기(ch) {
  const k = String(ch || '').normalize('NFC').codePointAt(0) - 0xac00
  if (!(k >= 0 && k < 11172)) return null
  return { 초: 첫[Math.floor(k / 588)], 중: 가운데[Math.floor((k % 588) / 28)], 종: 끝[k % 28] }
}

/* 펜 — 단위 상자 [0,1]² 의 선 · 동그라미를 모아 둠 */
function 펜() {
  const 것 = []
  return {
    것,
    선: (...점) => { 것.push({ k: '선', 점 }) },
    닫힌선: (...점) => { 것.push({ k: '선', 점, 닫힘: true }) },
    원: (cx, cy, rx, ry) => { 것.push({ k: '원', cx, cy, rx, ry }) },
  }
}

/* 동그라미(ㅇ) — 자리 안 · 너무 길쭉하지 않게(세로 ≤ 가로 1.35 · 가로 ≤ 세로 2.4) */
function 동그라미(p, r) {
  let rx = (r.b - r.a) / 2, ry = (r.d - r.c) / 2
  if (ry > rx * 1.35) ry = rx * 1.35
  if (rx > ry * 2.4) rx = ry * 2.4
  p.원((r.a + r.b) / 2, (r.c + r.d) / 2, rx, ry)
}

/** 닿소리 하나를 자리 r = {a, b(가로), c, d(세로)} 에 — s = {tx, ty}(획 굵기의 단위 길이) */
function 닿소리(p, j, r, s) {
  const { a, b, c, d } = r
  const w = b - a, h = d - c, xm = (a + b) / 2
  if (겹[j]) {
    const g = Math.max(s.tx * 1.7, w * 0.1)
    닿소리(p, 겹[j][0], { a, b: xm - g / 2, c, d }, s)
    닿소리(p, 겹[j][1], { a: xm + g / 2, b, c, d }, s)
    return
  }
  switch (j) {
    case 'ㄱ': p.선([a, c], [b, c], [b, d]); break
    case 'ㄴ': p.선([a, c], [a, d], [b, d]); break
    case 'ㄷ': p.선([b, c], [a, c], [a, d], [b, d]); break
    case 'ㄹ': { const y = c + h / 2; p.선([a, c], [b, c], [b, y], [a, y], [a, d], [b, d]); break }
    case 'ㅁ': p.닫힌선([a, c], [b, c], [b, d], [a, d]); break
    case 'ㅂ': { const y = c + h * 0.48; p.선([a, c], [a, d], [b, d], [b, c]); p.선([a, y], [b, y]); break }
    case 'ㅅ': p.선([a, d], [xm, c], [b, d]); break
    case 'ㅇ': 동그라미(p, r); break
    case 'ㅈ': p.선([a, c], [b, c]); p.선([a, d], [xm, c], [b, d]); break
    case 'ㅊ': { const y = c + Math.max(h * 0.3, s.ty * 1.2); p.선([xm, c], [xm, y]); p.선([a, y], [b, y]); p.선([a, d], [xm, y], [b, d]); break }
    case 'ㅋ': { const y = c + h * 0.48; p.선([a, c], [b, c], [b, d]); p.선([a, y], [b, y]); break }
    case 'ㅌ': { const y = c + h / 2; p.선([b, c], [a, c], [a, d], [b, d]); p.선([a, y], [b - w * 0.08, y]); break }
    case 'ㅍ': { const x1 = a + w * 0.27, x2 = b - w * 0.27; p.선([a, c], [b, c]); p.선([a, d], [b, d]); p.선([x1, c], [x1, d]); p.선([x2, c], [x2, d]); break }
    case 'ㅎ': {
      /* 윗점 · 가로획 · 동그라미 — 필요 단위 7(획 넷 + 빈칸 셋) 꼴로 나눔: 가로획 2/6 · 동그라미 위 4/6 */
      const y1 = c + h * (2 / 6), y2 = c + h * (4 / 6)
      p.선([a + w * 0.3, c], [b - w * 0.3, c]); p.선([a, y1], [b, y1])
      동그라미(p, { a: a + w * 0.12, b: b - w * 0.12, c: y2, d })
      break
    }
    default: break
  }
}

/** 세로 홀소리(ㅏ ㅓ ㅣ …) — 줄기는 c ~ d · x 자리는 단위 상자 기준(오른쪽 칸) */
function 세로홀소리(p, v, c, d, s) {
  const h = d - c, ym = c + h * 0.5, y1 = c + h * 0.36, y2 = c + h * 0.64
  const 줄기 = (x) => p.선([x, c], [x, d])
  switch (v) {
    case 'ㅣ': 줄기(0.84); break
    case 'ㅏ': 줄기(0.74); p.선([0.74, ym], [1, ym]); break
    case 'ㅑ': 줄기(0.74); p.선([0.74, y1], [1, y1]); p.선([0.74, y2], [1, y2]); break
    case 'ㅓ': 줄기(0.96); p.선([0.68, ym], [0.96, ym]); break
    case 'ㅕ': 줄기(0.96); p.선([0.68, y1], [0.96, y1]); p.선([0.68, y2], [0.96, y2]); break
    case 'ㅐ': 줄기(0.68); 줄기(0.96); p.선([0.68, ym], [0.84, ym]); break
    case 'ㅒ': 줄기(0.68); 줄기(0.96); p.선([0.68, y1], [0.84, y1]); p.선([0.68, y2], [0.84, y2]); break
    case 'ㅔ': 줄기(0.78); 줄기(0.98); p.선([0.62, ym], [0.78, ym]); break
    case 'ㅖ': 줄기(0.78); 줄기(0.98); p.선([0.62, y1], [0.78, y1]); p.선([0.62, y2], [0.78, y2]); break
    default: break
  }
}
/* 세로 홀소리 앞 닿소리 자리(오른쪽 끝) */
const 앞폭 = { 'ㅣ': 0.66, 'ㅏ': 0.62, 'ㅑ': 0.62, 'ㅓ': 0.56, 'ㅕ': 0.56, 'ㅐ': 0.54, 'ㅒ': 0.54, 'ㅔ': 0.5, 'ㅖ': 0.5 }

/** 가로 홀소리(ㅗ ㅜ ㅡ …) — 자리 a ~ b · 위 c ~ 아래 d 안에서 */
function 가로홀소리(p, v, a, b, c, d) {
  const w = b - a, xm = a + w / 2, x1 = a + w * 0.32, x2 = a + w * 0.68
  switch (v) {
    case 'ㅗ': p.선([a, d], [b, d]); p.선([xm, c], [xm, d]); break
    case 'ㅛ': p.선([a, d], [b, d]); p.선([x1, c], [x1, d]); p.선([x2, c], [x2, d]); break
    case 'ㅜ': p.선([a, c], [b, c]); p.선([xm, c], [xm, d]); break
    case 'ㅠ': p.선([a, c], [b, c]); p.선([x1, c], [x1, d]); p.선([x2, c], [x2, d]); break
    case 'ㅡ': { const y = (c + d) / 2; p.선([a, y], [b, y]); break }
    default: break
  }
}
const 겹홀 = { 'ㅘ': 'ㅗㅏ', 'ㅙ': 'ㅗㅐ', 'ㅚ': 'ㅗㅣ', 'ㅝ': 'ㅜㅓ', 'ㅞ': 'ㅜㅔ', 'ㅟ': 'ㅜㅣ', 'ㅢ': 'ㅡㅣ' }

/* ── 세로 자리 나누기(획 단위) ─────────────────────────────────────────────
   «단위» = 획 굵기 하나. 자모마다 «필요 단위»(가로획 수 + 그 사이 빈칸 — 빈칸은 획 하나 굵기 이상) ·
   자모 사이는 획 중심끼리 2 단위(보이는 빈칸 = 획 하나) · 남는 높이는 «자람» 비율로 나눠 줌(칸을 꽉 채움) */
const 높이수 = (j) => (겹[j] ? Math.max(높이수(겹[j][0]), 높이수(겹[j][1]))
  : ({ 'ㄱ': 2, 'ㄴ': 2, 'ㅅ': 2.4, 'ㅇ': 3, 'ㄷ': 3, 'ㅁ': 3, 'ㅂ': 3, 'ㅈ': 3, 'ㅋ': 3, 'ㅍ': 3, 'ㅊ': 4.4, 'ㄹ': 5, 'ㅌ': 5, 'ㅎ': 7 }[j] || 3))
const 홀높이수 = (v) => (v === 'ㅡ' ? 1 : 2)

/** 위에서 아래로 쌓기 — 조각 [{수: 필요 단위, 자람}] → [{c, d}](획 중심 · 단위 상자) · u = 획 한 단위(세로) */
function 쌓기(조각, u) {
  const 뼈 = 조각.map((x) => Math.max(0, x.수 - 1))              /* 첫 획 중심 → 끝 획 중심 */
  const 틈 = 2 * (조각.length - 1)
  const 모두 = 1 / u
  const 남 = 모두 - (뼈.reduce((a, b) => a + b, 0) + 틈)
  const 자람합 = 조각.reduce((a, x) => a + x.자람, 0) || 1
  const k = 남 >= 0 ? 1 : 모두 / (뼈.reduce((a, b) => a + b, 0) + 틈)   /* 모자라면 모두 줄임(빈칸이 획보다 좁아짐) */
  let y = 0
  return 조각.map((x, i) => {
    const 길이 = (뼈[i] + (남 > 0 ? 남 * x.자람 / 자람합 : 0)) * k
    const c = y * u, d = (y + 길이) * u
    y += 길이 + 2 * k
    return { c, d }
  })
}

/** 한 음절에 필요한 세로 단위 — 부르는 쪽이 획 굵기를 정할 때(가장 복잡한 글자도 빈칸이 획 하나 이상 되게) */
export function 필요단위(ch) {
  const 풀 = 한글풀기(ch)
  if (!풀) return 0
  const { 초, 중, 종 } = 풀
  const 끝수 = 종 ? 1 + 높이수(종) : 0
  if (세로.includes(중)) return 높이수(초) + 끝수
  const h1 = 가로.includes(중) ? 중 : 겹홀[중][0]
  return 높이수(초) + 1 + 홀높이수(h1) + 끝수
}

/** 한 음절을 단위 상자에 — 자리 나누기 */
function 음절짜기(p, 풀, s) {
  const { 초, 중, 종 } = 풀
  const u = s.ty, gx = Math.max(0.06, s.tx * 2)
  const 받침 = !!종
  if (세로.includes(중)) {
    const [위, 아래] = 받침 ? 쌓기([{ 수: 높이수(초), 자람: 1 }, { 수: 높이수(종), 자람: 0.62 }], u) : [{ c: 0, d: 1 }]
    닿소리(p, 초, { a: 0, b: 앞폭[중] - gx, c: 위.c, d: 위.d }, s)
    세로홀소리(p, 중, 위.c, 위.d, s)
    if (받침) 닿소리(p, 종, { a: 0.02, b: 0.98, c: 아래.c, d: 아래.d }, s)
    return
  }
  const 겹 = !가로.includes(중)
  const h1 = 겹 ? 겹홀[중][0] : 중, v1 = 겹 ? 겹홀[중][1] : null
  const 조각 = [{ 수: 높이수(초), 자람: 1 }, { 수: 홀높이수(h1), 자람: h1 === 'ㅡ' ? 0 : 0.35 }]
  if (받침) 조각.push({ 수: 높이수(종), 자람: 0.62 })
  const [첫, 홀, 끝] = 쌓기(조각, u)
  if (!겹) {
    닿소리(p, 초, { a: 0, b: 1, c: 첫.c, d: 첫.d }, s)
    가로홀소리(p, 중, 0, 1, 홀.c, 홀.d)
  } else {
    const 오른 = { 'ㅏ': 0.64, 'ㅐ': 0.58, 'ㅣ': 0.76, 'ㅓ': 0.62, 'ㅔ': 0.56 }[v1]
    const 끝x = 오른 - gx
    닿소리(p, 초, { a: 0, b: Math.min(끝x, 0.62), c: 첫.c, d: 첫.d }, s)
    가로홀소리(p, h1, 0, 끝x, 홀.c, 홀.d)
    세로홀소리(p, v1, 첫.c, 홀.d, s)
  }
  if (받침) 닿소리(p, 종, { a: 0.02, b: 0.98, c: 끝.c, d: 끝.d }, s)
}

/**
 * 인장체 한 글자 그리기 — ctx 의 지금 붓(strokeStyle · globalCompositeOperation)으로 선을 그음
 * @param 칸 {x, y, w, h} px · @param 획 획 굵기 px
 * @returns 한글 음절이면 true(그렸음) · 아니면 false(글꼴로 그려야 함)
 */
export function 인장글자(ctx, ch, 칸, 획) {
  const 풀 = 한글풀기(ch)
  if (!풀) return false
  const 반 = 획 / 2
  const W = Math.max(1, 칸.w - 획), H = Math.max(1, 칸.h - 획)
  const s = { tx: 획 / W, ty: 획 / H }
  const p = 펜()
  음절짜기(p, 풀, s)
  const X = (u) => 칸.x + 반 + u * W, Y = (v) => 칸.y + 반 + v * H
  ctx.save()
  ctx.lineWidth = 획; ctx.lineCap = 'butt'; ctx.lineJoin = 'miter'; ctx.miterLimit = 1.5   /* 직각은 모서리 그대로 · 뾰족한 꼭지(ㅅ ㅈ)는 깎음 — ㅈ 꼭지가 가로획 위로 솟아 ㅊ 처럼 보이지 않게 */
  ctx.beginPath()
  for (const t of p.것) {
    if (t.k === '원') { ctx.moveTo(X(t.cx + t.rx), Y(t.cy)); ctx.ellipse(X(t.cx), Y(t.cy), Math.max(0.5, t.rx * W), Math.max(0.5, t.ry * H), 0, 0, Math.PI * 2) }
    else {
      ctx.moveTo(X(t.점[0][0]), Y(t.점[0][1]))
      for (let i = 1; i < t.점.length; i++) ctx.lineTo(X(t.점[i][0]), Y(t.점[i][1]))
      if (t.닫힘) ctx.closePath()
    }
  }
  ctx.stroke()
  ctx.restore()
  return true
}
