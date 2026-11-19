/* 🖋 G780 (2026-11-19) 도장 만들기 — 셈 · 그리기 (화면 pages/Dojang.jsx · 시험 tools/시험_도장.mjs)
 *   소장님 「도장만들기 도구 이것도 만들어 줘...사이트 찾아보고 최대한 간단하면서 실용적이게」 → 기획(이름 도장 · 회사 직인 · 도장 사진 → 투명) → 「서식까지 연결하게 해줘」
 *   🔁 G780b (11-19) 다시 만듦 — 소장님 「반듯하게 안된 것 같은데..도장이...」 → 참고 화면(전자도장 서비스) → 「도장 다시 만들어」 「캡쳐 준 것처럼 만들어」
 *     「○○이랑 비슷하게 만들어야지...잘 만들어 줘」 「도장만들기 종류도 여러개 해줘」
 *   ■ 글씨 = 고딕(기본 · 굵은 글꼴 글자를 칸에 꽉 — 전자도장 꼴 · 소장님 「그것처럼 만들어 줘」 「왜 다 이상하게 만들지」) · 명조(붓 맛) ·
 *     인장체(고를 때만 — lib/인장체.js · 한글을 곧은 선 · 동그라미로 · 어느 기기에서나 같은 모양) · 한자는 명조 글꼴로
 *   ■ 글 차례 = 가로 읽기(왼쪽 → 오른쪽 · 위 → 아래) — 네 자는 2 × 2(홍길 / 동인) · 셋까지는 위에서 아래로 · 덜 찬 줄은 가운데
 *   ■ 꼴(원형만 — 소장님 「원형만 만들어. 사각은 하지말고」): 이름 도장 — 원 · 음각 원(빨간 바탕 흰 글씨) · 두 줄 원 / 회사 도장 — 법인 원형(두 줄 원 · 둘레 회사 이름 · 가운데 글) · 원형 · 음각 원형
 *   ■ 가는 테두리 · 글자는 테두리 안을 꽉(모서리는 테두리에 닿으면 잘림 — 도장 맛) · 색 빨강 · 검정 · 파랑 · 찍은 느낌(번짐)은 고를 때만
 *   ■ 도장 사진 → 투명: 종이에 찍은 도장 사진에서 흰 바탕을 지우고 도장만(빨간 도장은 붉은 정도 · 검은 도장은 바탕보다 어두운 정도) · 테두리 밖은 잘라 정사각형 · 기울기 바로잡기
 *   ■ 모두 이 기기 안에서 그림을 만듭니다(서버로 안 감) · 그리기는 캔버스 2D 만 씀 — node 시험(@napi-rs/canvas)에서도 같은 함수
 */
import { 인장글자, 한글풀기, 필요단위 } from './인장체.js'
import { 웹글꼴 } from './도장글꼴.js'   /* 🔤 G782 고를 수 있는 공개 글꼴(이 사이트에 둠 · 고를 때만 받음) */

export const 인주 = { 빨강: '#d42a2f', 검정: '#222226', 파랑: '#1f4fc0' }
export const 색들 = [['빨강', '🔴 빨강'], ['검정', '⚫ 검정'], ['파랑', '🔵 파랑']]
export const 글씨들 = [['고딕', '고딕'], ['명조', '명조(붓)'], ['인장', '인장체']]
export const 이름꼴들 = [['원', '원'], ['원음각', '음각 원'], ['원두줄', '두 줄 원']]
export const 회사꼴들 = [['법인원', '법인 원형'], ['원', '원형'], ['원음각', '음각 원형']]
export const 글꼴들 = {
  명조: '"Batang","바탕","AppleMyungjo","Noto Serif KR","Noto Serif CJK KR","Nanum Myeongjo",serif',
  고딕: '"Malgun Gothic","맑은 고딕","Apple SD Gothic Neo","Noto Sans KR","Noto Sans CJK KR",sans-serif',
}
export const 이름최대 = 4
export const 둘레최대 = 16
export const 가운데최대 = 6

/** 글 정리 — 띄어쓰기 · 보이지 않는 글자 빼고 · 한 글자씩(한자 · 한글 · 영문 · 숫자 · ㈜ ) · n 자까지 */
export function 글정리(s, n = 이름최대) {
  const r = 글자만(s, n)
  return r.some((c) => /[\p{L}\p{N}]/u.test(c)) ? r : []   /* 🩹 G782 기호만(· ( ) ㈜)이면 빈 글 — 이상한 도장 대신 예시 그대로 */
}
function 글자만(s, n) {
  const t = String(s == null ? '' : s).normalize('NFC').replace(/[\s\u200b-\u200f\u2028\u2029\ufeff]/g, '')
  return [...t.replace(/[(（]주[)）]/g, '㈜')].filter((c) => /[\p{L}\p{N}㈜()·]/u.test(c)).slice(0, n)   /* 🩹 G782 «(주)» → ㈜ 한 칸(괄호 · 주가 세 칸으로 갈리지 않게) */
}

/** 가로 읽기 칸 — 글자 n 개 · 한 줄에 «열» 자 → [{x, y, w, h}]([0,1]² 상자 · 왼쪽 → 오른쪽 · 위 → 아래 · 덜 찬 마지막 줄은 가운데) */
export function 가로칸(n, 열) {
  if (!(n > 0)) return []
  const k = Math.max(1, Math.min(n, 열 | 0 || 1)), 행 = Math.ceil(n / k)
  const 칸 = []
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / k), c = i % k
    const 이줄 = r === 행 - 1 ? n - r * k : k
    칸.push({ x: (k - 이줄) / 2 / k + c / k, y: r / 행, w: 1 / k, h: 1 / 행 })
  }
  return 칸
}
/** 줄 칸 — 줄마다 글자 수(예 [4, 4] · [4, 2]) → [{x, y, w, h}]([0,1]² · 칸 폭은 가장 긴 줄에 맞춤 · 짧은 줄은 가운데) — 🩹 G782 회사 이름 띄어쓰기대로 */
export function 줄칸(줄들) {
  const k = Math.max(1, ...줄들), m = Math.max(1, 줄들.length), 칸 = []
  줄들.forEach((L, r) => { for (let c = 0; c < L; c++) 칸.push({ x: (k - L) / 2 / k + c / k, y: r / m, w: 1 / k, h: 1 / m }) })
  return 칸
}
/** 띄어쓰기대로 줄 — 회사 원형 · 음각 원형: 낱말 2 ~ 3 개 · 낱말마다 5자까지 · 모두 9자까지면 [[낱말 글자] …] · 아니면 null(정사각에 가깝게) */
export function 낱말줄(s) {
  const 낱말 = String(s == null ? '' : s).normalize('NFC').split(/\s+/).map((w) => 글자만(w, 9)).filter((w) => w.length)
  if (낱말.length < 2 || 낱말.length > 3) return null
  if (낱말.some((w) => w.length > 5) || 낱말.reduce((a, w) => a + w.length, 0) > 9) return null
  return 낱말.flat().some((c) => /[\p{L}\p{N}]/u.test(c)) ? 낱말 : null
}
/** 한 줄 글자 수 — 둘까지 한 자씩(위 → 아래) · 셋은 2 + 1(아래 한 자는 가운데) · 넷 2 × 2 · 다섯 · 여섯은 두 자씩(세 줄) · 그 위는 정사각에 가깝게 */
export function 열수(n) {
  if (n <= 2) return 1
  if (n <= 6) return 2
  return Math.ceil(Math.sqrt(n))
}

/* 씨앗 있는 난수(번짐이 그릴 때마다 바뀌지 않게) */
export function 씨앗난수(글) {
  let h = 2166136261 >>> 0
  for (const c of String(글 || '')) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0 }
  let a = h || 1
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/** 기준 글자 상자 — 글꼴로 쓰는 글자(한자 · 영문 · 명조)는 꽉 찬 글자 다섯의 가장 넓은 폭 · 높이로 모두 같은 배율(G780a) */
const 기준글자 = ['홍', '뷁', '國', '圖', '밝']
const 한글기준 = ['홍', '뷁', '밝', '예']   /* 🔤 G782 한자가 없는 공개 글꼴은 한글로만 잼(없는 글자는 다른 글꼴로 재져 어긋남) */
export function 기준상자(ctx, 글꼴, 굵기 = 'bold', 글자들 = 기준글자) {
  ctx.font = `${굵기} 200px ${글꼴}`
  let w = 0, A = 0, D = 0
  for (const c of 글자들) {
    const m = ctx.measureText(c)
    const l = Number(m.actualBoundingBoxLeft) || 0, r = Number(m.actualBoundingBoxRight) || Number(m.width) || 0
    w = Math.max(w, l + r); A = Math.max(A, Number(m.actualBoundingBoxAscent) || 0); D = Math.max(D, Number(m.actualBoundingBoxDescent) || 0)
  }
  if (!(w > 1)) w = 200
  if (!(A + D > 1)) { A = 170; D = 20 }
  return { w, h: A + D, A, D }
}

/** 글꼴로 한 글자 — 크기는 기준 상자로(모든 글자 같은 배율) · 가로는 제 잉크 가운데 · 세로는 기준 가운데 · 가로세로 늘림은 «늘림» 배까지 */
export function 글자넣기(ctx, ch, 칸, 글꼴, 굵기 = 0, 기준 = null, 늘림 = 2.2, 지우기 = false) {
  const 참 = 기준 || 기준상자(ctx, 글꼴)
  ctx.font = `bold 200px ${글꼴}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  const m = ctx.measureText(ch)
  const L = Number(m.actualBoundingBoxLeft) || 0, R = Number(m.actualBoundingBoxRight) || Number(m.width) || 0
  const A = Number(m.actualBoundingBoxAscent) || 0, Dd = Number(m.actualBoundingBoxDescent) || 0
  if (!(L + R > 1 && A + Dd > 1)) return false
  let sx = 칸.w / 참.w, sy = 칸.h / 참.h
  if (sx / sy > 늘림) sx = sy * 늘림
  if (sy / sx > 늘림) sy = sx * 늘림
  ctx.save()
  ctx.translate(칸.x + 칸.w / 2, 칸.y + 칸.h / 2)
  ctx.scale(sx, sy)
  const ox = -(R - L) / 2, oy = (참.A - 참.D) / 2
  ctx.fillText(ch, ox, oy)
  if (굵기 > 0 && !지우기) { ctx.lineJoin = 'round'; ctx.lineWidth = 굵기 / ((sx + sy) / 2); ctx.strokeText(ch, ox, oy) }
  ctx.restore()
  return true
}

/** 글꼴 글자를 칸에 — 🔁 G780b 모양 그대로(늘이지 않음 · 소장님 「이상해」 — 글자마다 칸에 늘려 꽉 채우니 «인» · «길» 이 옆으로 퍼졌음)
 *  크기는 기준 상자(꽉 찬 글자들의 가장 넓은 폭 · 높이)로 모두 같게 · 가로는 제 잉크 가운데 · 세로는 기준 가운데(한 줄 글자 바닥이 맞음)
 *  굵기 — 보통 굵기 글꼴에 테두리 선(덧굵기 · 글자 크기의 비율)을 더해 기기마다 비슷하게(윈도 맑은 고딕 · 폰 노토 · 애플 고딕) */
export function 글자맞추기(ctx, ch, 칸, 글꼴, 참, 덧굵기 = 0.026, 굵기 = 'normal') {
  ctx.font = `${굵기} 200px ${글꼴}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  const m = ctx.measureText(ch)
  const L = Number(m.actualBoundingBoxLeft) || 0, R = Number(m.actualBoundingBoxRight) || Number(m.width) || 0
  const A = Number(m.actualBoundingBoxAscent) || 0, Dd = Number(m.actualBoundingBoxDescent) || 0
  if (!(L + R > 1 && A + Dd > 1)) return false
  const k = Math.min(칸.w / 참.w, 칸.h / 참.h)
  ctx.save()
  ctx.translate(칸.x + 칸.w / 2, 칸.y + 칸.h / 2)
  ctx.scale(k, k)
  const ox = (L - R) / 2, oy = (참.A - 참.D) / 2
  ctx.fillText(ch, ox, oy)
  if (덧굵기 > 0) { ctx.lineJoin = 'round'; ctx.lineWidth = 덧굵기 * 200; ctx.strokeText(ch, ox, oy) }
  ctx.restore()
  return true
}

/* 글자들을 칸에 — 칸 = 상자 안의 가로 읽기 칸(px) · 인장체(한글)는 칸을 꽉 · 글꼴 글자는 같은 배율
   획 = 인장체 획 굵기(px) · 글씨 '명조' 면 모두 글꼴 */
function 칸에쓰기(ctx, 글자, 상자, 열, 글씨, 획, 음각 = false, 줄들 = null) {
  const 칸 = (줄들 ? 줄칸(줄들) : 가로칸(글자.length, 열)).map((c) => ({ x: 상자.x + c.x * 상자.w, y: 상자.y + c.y * 상자.h, w: c.w * 상자.w, h: c.h * 상자.h }))
  /* 고딕(기본 · 전자도장 꼴) · 명조 — 모양 그대로 · 모두 같은 크기(기준 상자) · 칸 사이 칸의 6% · 음각은 덧굵기를 줄여 흰 글씨가 가늘게 */
  if (글씨 !== '인장') {
    let 그린 = 0
    const 틈 = Math.min(칸[0].w, 칸[0].h) * 0.03
    const 고딕참 = 기준상자(ctx, 글꼴들.고딕, 'normal'), 명조참 = 기준상자(ctx, 글꼴들.명조, 'normal')
    const 웹 = 웹글꼴[글씨], 웹참 = 웹 ? 기준상자(ctx, 웹.family, 웹.굵기, 한글기준) : null   /* 🔤 G782 공개 글꼴 */
    글자.forEach((ch, i) => {
      const c = 칸[i], 안 = { x: c.x + 틈, y: c.y + 틈, w: c.w - 틈 * 2, h: c.h - 틈 * 2 }
      const 한자 = /[一-鿿]/.test(ch)
      if (웹 && !한자) { if (글자맞추기(ctx, ch, 안, 웹.family, 웹참, 음각 ? Math.max(0, 웹.덧 - 0.012) : 웹.덧, 웹.굵기)) 그린++; return }
      const 명 = 글씨 === '명조' || 한자
      if (글자맞추기(ctx, ch, 안, 명 ? 글꼴들.명조 : 글꼴들.고딕, 명 ? 명조참 : 고딕참, 음각 ? 0.012 : 명 ? 0.02 : 0.026)) 그린++
    })
    return { 그린, 칸 }
  }
  /* 인장체 — 획 맞춤: 가장 복잡한 글자(홍 · 흙 …)도 빈칸이 획 하나 이상 되게 · 한 도장 안 모든 글자 같은 굵기 */
  if (글씨 === '인장' && 칸.length) {
    const 단위 = Math.max(0, ...글자.map((ch) => 필요단위(ch)))
    if (단위) { const 높 = 칸[0].h; for (let i = 0; i < 2; i++) 획 = Math.min(획, (높 - 획 * 0.95 * 2) / (단위 + 0.3)) }
  }
  획 = Math.max(1, 획)
  const 여백 = 획 * 0.95                                   /* 글자 사이 ≈ 획 두 개 — 이웃 글자와 붙어 보이지 않게 */
  const 글꼴 = 글꼴들.고딕
  const 참 = 기준상자(ctx, 글꼴)
  const 늘림 = 열 > 1 ? 1.3 : 2.2
  let 그린 = 0
  글자.forEach((ch, i) => {
    const c = 칸[i], 안 = { x: c.x + 여백, y: c.y + 여백, w: c.w - 여백 * 2, h: c.h - 여백 * 2 }
    if (인장글자(ctx, ch, 안, 획)) { 그린++; return }
    const 작게 = 한글풀기(ch) ? 1 : 0.9
    const 속 = { x: 안.x + 안.w * (1 - 작게) / 2, y: 안.y + 안.h * (1 - 작게) / 2, w: 안.w * 작게, h: 안.h * 작게 }
    /* 인장체 글씨인데 한글이 아니면(한자 · 영문 · ㈜) — 한자는 명조(붓 맛) · 그 밖은 고딕 */
    const 이글꼴 = /[一-鿿]/.test(ch) ? 글꼴들.명조 : 글꼴
    if (글자넣기(ctx, ch, 속, 이글꼴, 획 * 0.3, 이글꼴 === 글꼴 ? 참 : 기준상자(ctx, 이글꼴), 늘림)) 그린++
  })
  return { 그린, 칸 }
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

/* 음각 글자를 그릴 다른 판 — 브라우저(OffscreenCanvas · canvas) · 없으면 null(node 시험 — 바로 지우개로) */
function 새판(S) {
  try {
    if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(S, S)
    if (typeof document !== 'undefined' && document.createElement) { const c = document.createElement('canvas'); c.width = S; c.height = S; return c }
  } catch (e) { /* 없음 */ }
  return null
}

/** 🩹 G782 잉크 반지름 — 글을 작은 판(256)에 그려 도장 가운데에서 가장 먼 잉크까지(S 에 대한 비율) · 판이 없으면 null
 *  글꼴이 기기마다 달라(윈도 맑은 고딕 · 애플 · 안드로이드) 글자 끝이 테두리에 닿기도 해서 — 실제로 그려 보고 넘으면 줄임(소장님 「극한적으로 시험 해봐」 → 두 줄 원 글자가 안쪽 테두리에 겹침) */
function 잉크반지름(S, 그리기, 판틀) {
  const t = 256, 판 = (판틀 || 새판)(t)
  const g = 판 && 판.getContext ? 판.getContext('2d') : null
  if (!g || typeof g.getImageData !== 'function') return null
  g.clearRect(0, 0, t, t)
  g.save(); g.scale(t / S, t / S); g.fillStyle = '#000'; g.strokeStyle = '#000'
  그리기(g)
  g.restore()
  const d = g.getImageData(0, 0, t, t).data, c = t / 2
  let m = 0
  for (let y = 0; y < t; y++) for (let x = 0; x < t; x++) if (d[(y * t + x) * 4 + 3] > 96) { const r = (x + 0.5 - c) * (x + 0.5 - c) + (y + 0.5 - c) * (y + 0.5 - c); if (r > m) m = r }
  return Math.sqrt(m) / t
}
/* 상자를 도장 가운데로 k 배 */
const 줄임 = (상자, k, S) => ({ x: S / 2 + (상자.x - S / 2) * k, y: S / 2 + (상자.y - S / 2) * k, w: 상자.w * k, h: 상자.h * k })
/** 글을 원 안에 — 그려 본 잉크가 «한계»(S 비율) 넘으면 상자를 줄여 한 번 더(획도 다시) · 넘지 않으면 그대로 */
function 원에맞춤(S, 상자, 획, 쓰기, 한계, 판틀, 획셈) {
  const r0 = 잉크반지름(S, (g) => 쓰기(g, 상자, 획), 판틀)
  if (!(r0 > 한계)) return { 상자, 획 }
  const 새 = 줄임(상자, 한계 / r0, S)
  return { 상자: 새, 획: 획셈(새) }
}
/** 원 안 글 상자 — 반지름 rx · ry(px) · 글자 수 n → {x, y, w, h}(가운데) */
function 둥근상자(S, rx, ry, n) {
  const [kw, kh] = n <= 1 ? [1.28, 1.28] : n === 2 ? [1.1, 1.62] : n <= 4 ? [1.56, 1.56] : n <= 6 ? [1.32, 1.7] : [1.54, 1.54]
  const w = rx * kw, h = ry * kh
  return { x: S / 2 - w / 2, y: S / 2 - h / 2, w, h }
}
/* 인장체 획 굵기 — 칸 짧은 변의 7.4% */
const 획굵기 = (상자, n, 열, 글씨) => {
  const 행 = Math.ceil(n / 열)
  return Math.max(1.2, Math.min(상자.w / 열, 상자.h / 행) * 0.074)
}

/**
 * 도장 그리기 — ctx(크기 S×S)에 투명 바탕으로
 * @param o { 종류: '이름'|'직인', 꼴, 글, 인붙임, 둘레글(회사 이름), 가운데글, 글씨: '고딕'|'명조'|'인장', 색: '빨강'|'검정'|'파랑', 번짐, 새판 }
 *   꼴 — 이름: 원 · 원음각 · 원두줄 / 직인: 법인원 · 원 · 원음각(원형 · 음각 원형은 회사 이름만)
 * @returns { 그린: 글자 수, 글자: [...] } — 그린 글자가 0 이면 빈 그림
 */
export function 도장그리기(ctx, S, o = {}) {
  const 색 = 인주[o.색] || 인주.빨강
  const 글씨 = ['고딕', '인장', '명조'].includes(o.글씨) || 웹글꼴[o.글씨] ? o.글씨 : '고딕'
  const 직인 = o.종류 === '직인'
  const 꼴목록 = (직인 ? 회사꼴들 : 이름꼴들).map((x) => x[0])
  const 꼴 = 꼴목록.includes(o.꼴) ? o.꼴 : 꼴목록[0]
  ctx.clearRect(0, 0, S, S)
  ctx.save()
  ctx.fillStyle = 색; ctx.strokeStyle = 색
  let 글자 = [], 그린 = 0, 줄들 = null
  const 음각 = /음각$/.test(꼴)
  /* 쓸 글 */
  if (직인) {
    const 회사 = 글정리(o.둘레글, 둘레최대)
    const 가운데 = 글정리(o.가운데글 == null ? '대표이사' : o.가운데글, 가운데최대)   /* 소장님 「대표이사만 들어가잖아. 근데 왜 인자를 넣어」 */
    글자 = 꼴 === '법인원' ? [...회사, ...가운데] : 회사.slice(0, 9)                       /* 원형 · 음각 원형 = 회사 이름만 */
    if (꼴 !== '법인원') { const 줄 = 낱말줄(o.둘레글); if (줄) { 글자 = 줄.flat(); 줄들 = 줄.map((w) => w.length) } }   /* 🩹 G782 «가상건설 주식회사» → 가상건설 / 주식회사(전엔 가상건 / 설주식 / 회사) */
    if (꼴 === '법인원') {
      const 바깥 = S * 0.47, 안 = S * 0.3
      ctx.lineWidth = S * 0.022; ctx.beginPath(); ctx.arc(S / 2, S / 2, 바깥, 0, Math.PI * 2); ctx.stroke()
      ctx.lineWidth = S * 0.014; ctx.beginPath(); ctx.arc(S / 2, S / 2, 안, 0, Math.PI * 2); ctx.stroke()
      /* 둘레 — 위 가운데 점에서 시계 방향으로 둘레를 고르게(참고 화면 꼴) · 글자 위가 바깥 */
      const rr = S * 0.383, 칸h = S * 0.112                 /* 둘레 띠(안쪽 원 0.307 ~ 바깥 원 0.459) 가운데 · 글자 높이 0.112 → 0.327 ~ 0.439 */
      /* 🩹 좁은 글자(괄호 · 가운뎃점 · 영문 i …)는 반 칸(«( 주 )» 처럼 벌어지지 않게) — 한글은 늘 한 칸 */
      const 참둘레 = 기준상자(ctx, 글꼴들.고딕)
      const 몫 = 회사.map((ch) => {
        if (한글풀기(ch)) return 1
        ctx.font = `bold 200px ${글꼴들.고딕}`
        const m = ctx.measureText(ch)
        const 폭 = (Number(m.actualBoundingBoxLeft) || 0) + (Number(m.actualBoundingBoxRight) || Number(m.width) || 0)
        return 폭 > 0 && 폭 / 참둘레.w < 0.6 ? 0.55 : 1
      })
      const 몫합 = 몫.reduce((a, b) => a + b, 0)
      /* 310° 안에 고르게(위 가운데 점 자리만 비움) — 🩹 G782 짧은 이름도 둘레 전체에(전엔 한 자 36° 까지라 «가상건설» 이 아래쪽에 거꾸로 몰렸음) */
      const 한각 = 몫합 ? Math.max((칸h * 1.12) / rr, (Math.PI * 310 / 180) / 몫합) : 0
      const w = Math.min(칸h, rr * 한각 * 0.9)
      const 둘레획 = Math.max(1, Math.min(w, 칸h) * 0.085)
      const 참 = 기준상자(ctx, 글씨 === '명조' ? 글꼴들.명조 : 글꼴들.고딕)
      const 둘레고딕참 = 기준상자(ctx, 글꼴들.고딕, 'normal'), 둘레명조참 = 기준상자(ctx, 글꼴들.명조, 'normal')
      let 각 = -Math.PI / 2 + (Math.PI * 2 - 한각 * 몫합) / 2   /* 위 가운데(점) 오른쪽에서 시작해 시계 방향으로 한 바퀴 — 글은 아래 가운데를 중심으로 */
      회사.forEach((ch, i) => {
        const a = 각 + (한각 * 몫[i]) / 2
        각 += 한각 * 몫[i]
        ctx.save(); ctx.translate(S / 2 + rr * Math.cos(a), S / 2 + rr * Math.sin(a)); ctx.rotate(a + Math.PI / 2)
        const 칸 = { x: -w / 2, y: -칸h / 2, w, h: 칸h }
        const 속 = { x: 칸.x + 칸.w * 0.03, y: 칸.y + 칸.h * 0.03, w: 칸.w * 0.94, h: 칸.h * 0.94 }
        const 명 = 글씨 === '명조' || /[一-鿿]/.test(ch)
        const 웹 = 웹글꼴[글씨] && !/[一-鿿]/.test(ch) ? 웹글꼴[글씨] : null
        const 됨 = 글씨 === '인장' ? 인장글자(ctx, ch, 칸, 둘레획) || 글자넣기(ctx, ch, 칸, 글꼴들.고딕, 둘레획 * 0.4, 참, 1.6)
          : 웹 ? 글자맞추기(ctx, ch, 속, 웹.family, 기준상자(ctx, 웹.family, 웹.굵기, 한글기준), 웹.덧, 웹.굵기)
            : 글자맞추기(ctx, ch, 속, 명 ? 글꼴들.명조 : 글꼴들.고딕, 명 ? 둘레명조참 : 둘레고딕참, 0.02)
        if (됨) 그린++
        ctx.restore()
      })
      if (회사.length && 한각 * 몫합 < Math.PI * 1.9) { ctx.beginPath(); ctx.arc(S / 2, S / 2 - rr, S * 0.02, 0, Math.PI * 2); ctx.fill() }   /* 위 가운데 점 */
      /* 가운데 — 안쪽 원 안 */
      const n = 가운데.length
      if (n) {
        const R = 안 - S * 0.02, 열 = 열수(n), 상자0 = 둥근상자(S, R, R, n)
        /* 🩹 G782 안쪽 원(0.293)과 띄움 — 그려 보고 넘으면 줄임 */
        const { 상자, 획 } = 원에맞춤(S, 상자0, 획굵기(상자0, n, 열, 글씨), (g, 상, 획) => 칸에쓰기(g, 가운데, 상, 열, 글씨, 획), 0.272, o.새판, (상) => 획굵기(상, n, 열, 글씨))
        ctx.save(); ctx.beginPath(); ctx.arc(S / 2, S / 2, 안 - S * 0.007, 0, Math.PI * 2); ctx.clip()
        그린 += 칸에쓰기(ctx, 가운데, 상자, 열, 글씨, 획).그린
        ctx.restore()
      }
      ctx.restore()
      if (o.번짐) 번지기(ctx, S, ['직인', 꼴, ...글자].join('|'))
      return { 그린, 글자 }
    }
  } else {
    글자 = 글정리(o.글, 이름최대)
    /* 🩹 G782 한글 · 한자 이름만(영문 · 일본 글자 · 숫자가 섞이면 안 붙임) — 한자가 있으면 印 */
    if (o.인붙임 && 글자.length >= 2 && 글자.length < 이름최대 && 글자.every((c) => /[가-힣一-鿿]/.test(c))) 글자 = [...글자, /[一-鿿]/.test(글자.join('')) ? '印' : '인']
  }
  const n = 글자.length
  /* 테두리 · 글 상자 · 자르는 길 */
  let 상자, 열, 자르기
  {
    let R
    if (꼴 === '원음각') { ctx.beginPath(); ctx.arc(S / 2, S / 2, S * 0.48, 0, Math.PI * 2); ctx.fill(); R = S * 0.445 }
    else if (꼴 === '원두줄') {
      ctx.lineWidth = S * 0.022; ctx.beginPath(); ctx.arc(S / 2, S / 2, S * 0.47, 0, Math.PI * 2); ctx.stroke()
      ctx.lineWidth = S * 0.012; ctx.beginPath(); ctx.arc(S / 2, S / 2, S * 0.42, 0, Math.PI * 2); ctx.stroke()
      R = S * 0.414
    } else { ctx.lineWidth = S * 0.022; ctx.beginPath(); ctx.arc(S / 2, S / 2, S * 0.47, 0, Math.PI * 2); ctx.stroke(); R = S * 0.459 }
    열 = 열수(n); 상자 = 둥근상자(S, R, R, n)
    if (줄들) { const k = Math.max(...줄들), m = 줄들.length, c = (2 * R * 1.06) / Math.hypot(k, m); 열 = k; 상자 = { x: S / 2 - (k * c) / 2, y: S / 2 - (m * c) / 2, w: k * c, h: m * c } }
    자르기 = (g) => { g.beginPath(); g.arc(S / 2, S / 2, R, 0, Math.PI * 2) }
  }
  if (n) {
    const 행 = 줄들 ? 줄들.length : Math.ceil(n / 열)
    const 획셈 = (상) => Math.max(1.2, Math.min(상.w / 열, 상.h / 행) * 0.074)
    /* 🩹 G782 테두리와 띄움 — 그려 보고 넘으면 줄임(원 0.435 · 두 줄 원 안쪽 0.392 · 음각 0.425) */
    const 한계 = 꼴 === '원음각' ? 0.425 : 꼴 === '원두줄' ? 0.392 : 0.435
    const 맞춤 = 원에맞춤(S, 상자, 획셈(상자), (g, 상, 획) => 칸에쓰기(g, 글자, 상, 열, 글씨, 획, false, 줄들), 한계, o.새판, 획셈)
    상자 = 맞춤.상자
    const 획 = 맞춤.획
    /* 음각 — 글자를 다른 판에 그려 바탕에서 지움(글자를 바로 지우개로 쓰면 늘인 글자가 군데군데 빠지는 그리기 판이 있음) */
    const 판 = 음각 ? (o.새판 || 새판)(S) : null
    const g = 판 ? 판.getContext('2d') : ctx
    g.save()
    if (판) { g.fillStyle = '#000'; g.strokeStyle = '#000' }
    else if (음각) { g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.strokeStyle = '#000' }
    자르기(g); g.clip()
    그린 = 칸에쓰기(g, 글자, 상자, 열, 글씨, 획, 음각, 줄들).그린
    g.restore()
    if (판) { ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.drawImage(판, 0, 0); ctx.restore() }
  }
  ctx.restore()
  if (o.번짐) 번지기(ctx, S, [o.종류, 꼴, ...글자].join('|'))
  return { 그린, 글자 }
}

/* ── 📷 도장 사진 → 투명 ──────────────────────────────────────────────────────────────────── */
const 휘도 = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b

/** 사진이 빨간 · 파란 · 검은 도장인가 — 붉은 점(r − max(g, b) > 55) · 파란 점(b − max(r, g) > 55)이 0.3% 넘으면 많은 쪽 · 아니면 검정
 *  🩹 G782 파란 도장 사진이 검은 도장으로 바뀌던 것(소장님 「극한적으로 시험 해봐」) */
export function 잉크짐작(data) {
  let 붉음 = 0, 푸름 = 0, 모두 = 0
  for (let i = 0; i < data.length; i += 16) {
    모두++
    if (data[i] - Math.max(data[i + 1], data[i + 2]) > 55) 붉음++
    else if (data[i + 2] - Math.max(data[i], data[i + 1]) > 55) 푸름++
  }
  if (!모두) return '검정'
  if (붉음 / 모두 > 0.003 && 붉음 >= 푸름) return '빨강'
  if (푸름 / 모두 > 0.003) return '파랑'
  return '검정'
}

/**
 * 도장만 남기기 — { data(RGBA), width, height } → { data, width, height, 상자: {x, y, w, h} | null, 잉크 }
 * @param o { 잉크: '자동'|'빨강'|'검정', 진하기: 0~100(50 보통 · 높을수록 옅은 잉크까지 남김), 색: '빨강'|'검정'|'그대로' }
 */
export function 도장뽑기(img, o = {}) {
  const { width: W, height: H } = img
  const src = img.data
  const 잉크 = o.잉크 === '빨강' || o.잉크 === '검정' || o.잉크 === '파랑' ? o.잉크 : 잉크짐작(src)
  const 색잉크 = 잉크 === '빨강' || 잉크 === '파랑'   /* 색 잉크 = 그 색이 짙은 정도로 · 검정 = 바탕보다 어두운 정도로 */
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
  const t0 = 색잉크 ? 46 - (진 - 50) * 0.5 : 55 - (진 - 50) * 0.6
  const t1 = t0 + (색잉크 ? 55 : 70)
  const 색 = o.색 === '그대로' ? null : (인주[o.색] || 인주[잉크]).match(/\w\w/g).map((h) => parseInt(h, 16))
  const 열 = new Float64Array(W), 행 = new Float64Array(H)
  for (let y = 0, i = 0; y < H; y++) {
    for (let x = 0; x < W; x++, i += 4) {
      const r = src[i], g = src[i + 1], b = src[i + 2]
      const 점 = 잉크 === '빨강' ? r - Math.max(g, b) : 잉크 === '파랑' ? b - Math.max(r, g) : 바탕 - 휘도(r, g, b)
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

/** 📐 기울기 바로잡기(G780a) — 뽑은 도장(투명 바탕 RGBA)을 잉크 상자 가운데를 축으로 «각도»(도 · + 는 시계 방향)만큼 돌림
 *  → { data, width, height, 상자 } (상자 대각선이 다 들어가는 정사각 그림 — 모서리가 잘리지 않게)
 *  두 줄 보간 · 색은 알파를 곱해 섞음(테두리가 검게 번지지 않게) · 상자는 돌린 그림의 잉크로 다시 잼 */
export function 도장돌리기(뽑은, 상자, 각도) {
  const { data: src, width: W, height: H } = 뽑은
  if (!상자 || !(W > 0 && H > 0)) return { ...뽑은, 상자: 상자 || null }
  const cx = 상자.x + 상자.w / 2, cy = 상자.y + 상자.h / 2
  let 변 = Math.ceil(Math.hypot(상자.w, 상자.h) * 1.08) + 4
  if ((변 - 상자.w) % 2) 변++                      /* 가운데가 화소 칸에 맞게(0° 면 그대로 옮김 · 반 칸 번짐 없음) */
  const out = new Uint8ClampedArray(변 * 변 * 4)
  const t = ((Number(각도) || 0) * Math.PI) / 180, co = Math.cos(t), si = Math.sin(t)
  const 열 = new Float64Array(변), 행 = new Float64Array(변)
  const 반 = 변 / 2
  for (let y = 0, o = 0; y < 변; y++) {
    for (let x = 0; x < 변; x++, o += 4) {
      const dx = x + 0.5 - 반, dy = y + 0.5 - 반
      const sx = co * dx + si * dy + cx - 0.5, sy = -si * dx + co * dy + cy - 0.5
      const x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0
      let R = 0, G = 0, B = 0, A = 0
      for (let k = 0; k < 4; k++) {
        const xi = x0 + (k & 1), yi = y0 + (k >> 1)
        if (xi < 0 || yi < 0 || xi >= W || yi >= H) continue
        const 무게 = ((k & 1) ? fx : 1 - fx) * ((k >> 1) ? fy : 1 - fy)
        const i = (yi * W + xi) * 4, a = src[i + 3] * 무게
        if (!a) continue
        R += src[i] * a; G += src[i + 1] * a; B += src[i + 2] * a; A += a
      }
      if (A < 0.5) continue
      out[o] = R / A; out[o + 1] = G / A; out[o + 2] = B / A; out[o + 3] = A
      열[x] += A / 255; 행[y] += A / 255
    }
  }
  return { data: out, width: 변, height: 변, 상자: 잉크상자(열, 행), 잉크: 뽑은.잉크 }
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
